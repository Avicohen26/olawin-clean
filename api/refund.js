// api/refund.js
// Rembourse une commande via Stripe (remboursement TOTAL), met la commande a jour,
// remet le compteur de tickets du tirage a jour, et envoie un email au client.
// Protege par la cle CAMPAIGN_SECRET (meme cle que les campagnes / resync).

import Stripe from "stripe";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    }),
  });
}
const db = getFirestore();

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-olawin-token");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const SECRET = process.env.CAMPAIGN_SECRET;
  if (!SECRET || req.headers["x-olawin-token"] !== SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const orderId = (req.body && req.body.orderId ? String(req.body.orderId) : "").trim();
    if (!orderId) return res.status(400).json({ error: "orderId manquant" });

    const ref = db.collection("orders").doc(orderId);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: "Commande introuvable" });
    const o = snap.data();

    if (o.status === "refunded") return res.status(409).json({ error: "Cette commande est deja remboursee." });
    if (o.status !== "paid") return res.status(409).json({ error: "Cette commande n'est pas payee (rien a rembourser)." });

    // Retrouver le payment_intent Stripe
    let pi = o.stripePaymentIntent || null;
    if (!pi && o.stripeSessionId) {
      try {
        const sess = await stripe.checkout.sessions.retrieve(o.stripeSessionId);
        pi = sess.payment_intent || null;
      } catch (e) {
        console.error("refund: session retrieve error:", e.message);
      }
    }
    if (!pi) {
      return res.status(422).json({ error: "Aucun paiement Stripe lie a cette commande. A rembourser manuellement dans Stripe." });
    }

    // Remboursement TOTAL
    let refund;
    try {
      refund = await stripe.refunds.create({ payment_intent: pi });
    } catch (e) {
      console.error("refund: stripe error:", e.message);
      return res.status(502).json({ error: "Stripe: " + e.message });
    }

    const refundedAmount = (refund && refund.amount != null)
      ? refund.amount / 100
      : (o.amountPaid != null ? o.amountPaid : (o.amount || 0));

    // Mettre la commande a jour
    await ref.update({
      status: "refunded",
      refundedAt: FieldValue.serverTimestamp(),
      refundId: (refund && refund.id) || null,
      refundAmount: refundedAmount,
    });

    // Remettre le compteur de tickets vendus a jour (tickets payes + eventuels gratuits ajoutes)
    const entries = Number(o.tickets || 0) + Number(o.freeTickets || 0);
    if (o.drawId && entries > 0) {
      try {
        await db.collection("draws").doc(o.drawId).update({ soldTickets: FieldValue.increment(-entries) });
      } catch (e) {
        console.error("refund: draw counter error (non-blocking):", e.message);
      }
    }

    // Email au client : le tirage n'a pas atteint 100% -> remboursement
    try {
      const baseUrl = "https://" + (req.headers.host || "www.olawin.org");
      const drawName = (o.drawCountry ? o.drawCountry + " " : "") + (o.drawTitle || "votre tirage") + (o.drawLocation ? " — " + o.drawLocation : "");
      const html =
        '<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;background:#f5f2ec;border-radius:16px;overflow:hidden;">' +
          '<div style="background:#111;padding:32px;text-align:center;">' +
            '<span style="background:#f5e6a0;color:#111;font-size:26px;font-weight:bold;letter-spacing:6px;padding:6px 16px;">OLAWIN</span>' +
          '</div>' +
          '<div style="background:#fff;padding:40px 32px;text-align:center;">' +
            '<div style="font-size:40px;margin-bottom:16px;">↩️</div>' +
            '<div style="font-size:11px;letter-spacing:3px;color:#999;margin-bottom:12px;">REMBOURSEMENT EN COURS</div>' +
            '<div style="font-size:26px;color:#111;margin-bottom:16px;">Bonjour ' + (o.firstName || "") + ',</div>' +
            '<div style="font-size:15px;color:#555;line-height:1.7;margin-bottom:24px;">Le tirage <strong>' + drawName + '</strong> n\'a pas atteint les 100% de tickets vendus. Comme prévu dans nos conditions, votre participation vous est donc <strong>intégralement remboursée</strong>.</div>' +
            '<div style="background:#faf8f3;border:1px solid #eee;border-radius:12px;padding:24px;margin-bottom:24px;">' +
              '<div style="font-size:11px;letter-spacing:3px;color:#999;margin-bottom:8px;">MONTANT REMBOURSÉ</div>' +
              '<div style="font-size:34px;color:#111;font-weight:bold;">' + refundedAmount + '£</div>' +
              (o.orderNumber ? '<div style="font-size:12px;color:#888;margin-top:8px;">Commande ' + o.orderNumber + '</div>' : '') +
            '</div>' +
            '<div style="font-size:14px;color:#555;line-height:1.7;">Le remboursement apparaîtra sur votre moyen de paiement sous <strong>5 à 10 jours ouvrés</strong>, via Stripe. Vous n\'avez rien à faire.</div>' +
          '</div>' +
          '<div style="background:#fff;padding:0 32px 40px;text-align:center;">' +
            '<a href="https://www.olawin.org" style="display:inline-block;background:#111;color:#f0ede7;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:12px;font-weight:bold;letter-spacing:2px;">VOIR LES TIRAGES EN COURS</a>' +
          '</div>' +
          '<div style="background:#f0ede7;padding:24px 32px;text-align:center;border-top:1px solid rgba(0,0,0,0.08);">' +
            '<div style="font-size:12px;color:#888;">Une question ? <a href="mailto:contact@olawin.org" style="color:#111;font-weight:bold;">contact@olawin.org</a></div>' +
          '</div>' +
        '</div>';
      if (o.email) {
        await fetch(baseUrl + "/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-olawin-token": SECRET },
          body: JSON.stringify({
            to: o.email,
            subject: "Remboursement de votre commande Olawin — " + (o.orderNumber || ""),
            html: html,
          }),
        });
      }
    } catch (emailErr) {
      console.error("refund: email error (non-blocking):", emailErr);
    }

    return res.status(200).json({ success: true, refundId: (refund && refund.id) || null, amount: refundedAmount });
  } catch (err) {
    console.error("refund error:", err);
    return res.status(500).json({ error: err.message });
  }
}
