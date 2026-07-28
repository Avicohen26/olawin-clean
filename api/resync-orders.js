// api/resync-orders.js
// Rattrapage : va chercher dans Stripe le montant reellement paye + le code promo
// des commandes deja payees, et les enregistre sur la commande (amountPaid, promoCode, promoDiscount).
// Protege par la cle CAMPAIGN_SECRET (meme cle que l'envoi d'emails).

import Stripe from "stripe";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

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

  const force = !!(req.body && req.body.force);

  try {
    const snap = await db.collection("orders").where("status", "==", "paid").get();
    let updated = 0;
    let skipped = 0;
    let alreadyDone = 0;

    for (const docSnap of snap.docs) {
      const o = docSnap.data();

      // Deja renseigne : on saute (sauf si force)
      if (!force && o.amountPaid != null) { alreadyDone++; continue; }

      const sid = o.stripeSessionId;
      if (!sid) { skipped++; continue; }

      try {
        const full = await stripe.checkout.sessions.retrieve(sid, {
          expand: ["discounts.promotion_code", "total_details.breakdown"],
        });

        let amountPaid = (full.amount_total != null) ? full.amount_total / 100 : null;
        let promoDiscount = (full.total_details && full.total_details.amount_discount != null) ? full.total_details.amount_discount / 100 : 0;
        let promoCode = "";
        let pc = (full.discounts && full.discounts.length) ? full.discounts[0].promotion_code : null;
        if (pc && typeof pc === "object" && pc.code) {
          promoCode = pc.code;
        } else if (pc && typeof pc === "string") {
          try { const pcObj = await stripe.promotionCodes.retrieve(pc); promoCode = pcObj.code || ""; } catch (e) {}
        }

        await docSnap.ref.update({
          amountPaid: amountPaid,
          promoCode: promoCode || null,
          promoDiscount: promoDiscount || 0,
        });
        updated++;
      } catch (e) {
        console.error("Resync order error (" + sid + "):", e.message);
        skipped++;
      }
    }

    return res.status(200).json({ success: true, total: snap.size, updated: updated, skipped: skipped, alreadyDone: alreadyDone });
  } catch (err) {
    console.error("Resync error:", err);
    return res.status(500).json({ error: err.message });
  }
}
