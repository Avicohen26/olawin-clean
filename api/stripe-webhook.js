// api/stripe-webhook.js
// Reçoit les notifications Stripe quand un paiement réussit
// Met à jour la commande Firebase et envoie les emails

import Stripe from "stripe";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialisation Firebase Admin (une seule fois)
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

// Désactive le parsing automatique pour pouvoir vérifier la signature
export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET missing");
    return res.status(500).json({ error: "Server config error" });
  }

  const signature = req.headers["stripe-signature"];
  let event;

  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).json({ error: "Invalid signature" });
  }

  // On ne traite que les paiements réussis
  if (event.type !== "checkout.session.completed" && event.type !== "payment_intent.succeeded") {
    return res.status(200).json({ received: true, ignored: event.type });
  }

  try {
    const session = event.data.object;
    const orderNumber = session.client_reference_id || (session.metadata && session.metadata.orderNumber);

    if (!orderNumber) {
      console.error("No client_reference_id in event", event.id);
      return res.status(200).json({ received: true, warning: "no orderNumber" });
    }

    // Chercher la commande "pending" dans Firebase
    const ordersRef = db.collection("orders");
    const snap = await ordersRef.where("orderNumber", "==", orderNumber).limit(1).get();

    if (snap.empty) {
      console.error("Order not found:", orderNumber);
      return res.status(200).json({ received: true, warning: "order not found" });
    }

    const orderDoc = snap.docs[0];
    const orderData = orderDoc.data();

    // Si déjà payée, on ignore (idempotence)
    if (orderData.status === "paid") {
      return res.status(200).json({ received: true, info: "already paid" });
    }

    // Calculer les numéros de tickets
    const drawRef = db.collection("draws").doc(orderData.drawId);
    const drawSnap = await drawRef.get();
    const drawData = drawSnap.exists ? drawSnap.data() : {};
    const startNum = (drawData.soldTickets || 0) + 1;
    const ticketNums = [];
    for (let i = 0; i < orderData.tickets; i++) {
      ticketNums.push(startNum + i);
    }

    // Passer la commande en "paid" + ajouter les numéros de tickets
    await orderDoc.ref.update({
      status: "paid",
      ticketNums: ticketNums,
      paidAt: FieldValue.serverTimestamp(),
      stripeSessionId: session.id || null,
      stripePaymentIntent: session.payment_intent || null,
    });

    // Incrémenter le compteur de tickets vendus du tirage
    await drawRef.update({
      soldTickets: FieldValue.increment(orderData.tickets),
    });

    // Envoyer les emails (via l'endpoint Resend existant)
    try {
      const baseUrl = "https://" + (req.headers.host || "olawin.org");
     const ticketsHtml = ticketNums.map(function(n){ return '<span style="display:inline-block;background:#f0ede6;border:1px solid #ddd;border-radius:8px;padding:8px 14px;margin:4px;font-family:monospace;font-size:15px;font-weight:bold;color:#1a1a1a;">#' + n + '</span>'; }).join("");
      const clientHtml =
        '<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;background:#f5f2ec;border-radius:16px;overflow:hidden;">' +
          '<div style="background:#111;padding:32px;text-align:center;">' +
            '<span style="background:#f5e6a0;color:#111;font-size:26px;font-weight:bold;letter-spacing:6px;padding:6px 16px;">OLAWIN</span>' +
          '</div>' +
          '<div style="background:#fff;padding:40px 32px;text-align:center;">' +
            '<div style="font-size:40px;margin-bottom:16px;">🎟️</div>' +
            '<div style="font-size:11px;letter-spacing:3px;color:#999;margin-bottom:12px;">PAIEMENT CONFIRMÉ</div>' +
            '<div style="font-size:30px;color:#111;margin-bottom:16px;">Bonne chance, ' + (orderData.firstName || "") + ' !</div>' +
            '<div style="font-size:15px;color:#555;margin-bottom:28px;">Vos ' + orderData.tickets + ' ticket(s) pour le tirage <strong>' + (orderData.drawTitle || "") + '</strong> sont enregistrés.</div>' +
            '<div style="background:#faf8f3;border:1px solid #eee;border-radius:12px;padding:24px;margin-bottom:24px;">' +
              '<div style="font-size:11px;letter-spacing:3px;color:#999;margin-bottom:16px;">VOS NUMÉROS DE TICKETS</div>' +
              ticketsHtml +
            '</div>' +
            '<div style="font-size:13px;color:#888;">Commande ' + orderNumber + ' · Conservez cet email, vos numéros sont votre preuve de participation.</div>' +
          '</div>' +
          '<div style="background:#111;padding:20px;text-align:center;font-size:12px;color:#888;">L\'équipe Olawin</div>' +
        '</div>';
      const adminHtml =
        '<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;background:#fff;border:1px solid #eee;border-radius:12px;padding:32px;">' +
          '<div style="background:#111;color:#f5e6a0;font-weight:bold;letter-spacing:4px;padding:8px 14px;display:inline-block;margin-bottom:20px;">OLAWIN</div>' +
          '<h2 style="color:#111;">Nouvelle commande payée</h2>' +
          '<p><strong>Commande :</strong> ' + orderNumber + '</p>' +
          '<p><strong>Client :</strong> ' + (orderData.firstName || "") + ' ' + (orderData.lastName || "") + '</p>' +
          '<p><strong>Email :</strong> ' + orderData.email + '</p>' +
          '<p><strong>Téléphone :</strong> ' + (orderData.phone || "—") + '</p>' +
          '<p><strong>Tirage :</strong> ' + (orderData.drawTitle || "") + '</p>' +
          '<p><strong>Tickets :</strong> ' + orderData.tickets + ' — Numéros : ' + ticketNums.join(", ") + '</p>' +
          '<p><strong>Montant :</strong> ' + orderData.amount + '£</p>' +
        '</div>';
      await Promise.allSettled([
        fetch(baseUrl + "/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: orderData.email,
            subject: "Confirmation de votre commande Olawin — " + orderNumber,
            html: clientHtml,
          }),
        }),
        fetch(baseUrl + "/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: "contact@olawin.org",
            subject: "[Olawin] Nouvelle commande payée — " + orderNumber,
            html: adminHtml,
          }),
        }),
      ]);
    } catch (emailErr) {
      console.error("Email send error (non-blocking):", emailErr);
    }

    return res.status(200).json({ received: true, orderNumber: orderNumber, success: true });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return res.status(500).json({ error: err.message });
  }
}
