// api/create-checkout-session.js
// Crée une session Stripe Checkout dynamiquement pour chaque achat
// Pas besoin de Payment Links pré-créés

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

// Génère un orderNumber unique (6 caractères alphanumériques)
function genOrderNumber() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return s;
}

export default async function handler(req, res) {
  // CORS pour permettre l'appel depuis le navigateur
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      drawId,
      drawTitle,
      drawLocation,
      drawCountry,
      drawDate,
      tickets,
      unitPrice,
      currency,
      firstName,
      lastName,
      email,
      phoneCode,
      phone,
      address,
      zip,
      city,
      country,
      discount,
      pack,
    } = req.body;

    // Validation basique
    if (!drawId || !tickets || !unitPrice || !email) {
      return res.status(400).json({ error: "Missing required fields" });
    }

   // Calcul du montant total (en centimes pour Stripe)
    // SÉCURITÉ : on lit le vrai prix dans Firebase, on ne fait PAS confiance au navigateur
    const finalQty = Number(tickets);

    const drawSnap = await db.collection("draws").doc(drawId).get();
    if (!drawSnap.exists) {
      return res.status(400).json({ error: "Tirage introuvable" });
    }
    const serverDraw = drawSnap.data();
    const serverUnitPrice = Number(serverDraw.ticketPrice);
    if (!serverUnitPrice || serverUnitPrice <= 0) {
      return res.status(400).json({ error: "Prix du tirage invalide" });
    }

    const finalUnitPrice = serverUnitPrice;

    // SÉCURITÉ : la remise est validée côté serveur selon les paliers officiels.
    // On NE fait PAS confiance au discount envoyé par le navigateur.
    const PACK_DISCOUNTS = { 15: 10, 25: 15, 50: 20 };
    const serverDiscount = PACK_DISCOUNTS[finalQty] || 0;

    const baseAmount = finalUnitPrice * finalQty;
    const discountedAmount = baseAmount - (baseAmount * serverDiscount / 100);
    const totalAmount = Math.round(discountedAmount * 100);

    // Générer un numéro de commande unique
    const orderNumber = genOrderNumber();

    // Créer une commande "pending" dans Firebase AVANT la redirection Stripe
    await db.collection("orders").add({
      orderNumber: orderNumber,
      drawId: drawId,
      drawTitle: drawTitle || "",
      drawLocation: drawLocation || "",
      drawCountry: drawCountry || "",
      drawDate: drawDate || "",
      firstName: firstName || "",
      lastName: lastName || "",
      email: (email || "").toLowerCase().trim(),
      phone: (phoneCode || "") + " " + (phone || ""),
      address: (address || "") + ", " + (zip || "") + " " + (city || "") + ", " + (country || ""),
      tickets: finalQty,
      amount: discountedAmount,
      discount: serverDiscount,
      pack: pack || null,
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
    });

    // Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      allow_promotion_codes: true,
      line_items: [
        {
          price_data: {
            currency: (currency || "gbp").toLowerCase(),
            product_data: {
              name: "Olawin - " + finalQty + " article" + (finalQty > 1 ? "s" : ""),
              description: Thanks 
            },
            unit_amount: totalAmount,
          },
          quantity: 1,
        },
      ],
      client_reference_id: orderNumber,
      customer_email: (email || "").toLowerCase().trim(),
      success_url: "https://www.olawin.org/?paid=success&order=" + orderNumber,
      cancel_url: "https://www.olawin.org/?paid=cancelled",
      metadata: {
        orderNumber: orderNumber,
        drawId: drawId,
        tickets: String(finalQty),
      },
    });

    // Retourner l'URL de paiement
    return res.status(200).json({
      url: session.url,
      orderNumber: orderNumber,
    });
  } catch (err) {
    console.error("Create checkout session error:", err);
    return res.status(500).json({ error: err.message });
  }
}
