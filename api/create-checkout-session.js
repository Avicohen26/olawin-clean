// api/create-checkout-session.js
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

function genOrderNumber() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

const FREE_CAP = 20; // plafond de tickets gratuits cumules par personne

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const {
      drawId, drawTitle, drawLocation, drawCountry, drawDate,
      tickets, unitPrice, currency,
      firstName, lastName, email, phoneCode, phone, address, zip, city, country,
      discount, pack, ref,
    } = req.body;

    if (!drawId || !tickets || !unitPrice || !email) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const finalQty = Number(tickets);
    const emailNorm = (email || "").toLowerCase().trim();

    // Prix reel lu dans Firebase (securite)
    const drawSnap = await db.collection("draws").doc(drawId).get();
    if (!drawSnap.exists) return res.status(400).json({ error: "Tirage introuvable" });
    const serverDraw = drawSnap.data();
    const serverUnitPrice = Number(serverDraw.ticketPrice);
    if (!serverUnitPrice || serverUnitPrice <= 0) return res.status(400).json({ error: "Prix du tirage invalide" });

    // Remise pack (serveur)
    const PACK_DISCOUNTS = { 15: 10, 25: 15, 50: 20 };
    const serverDiscount = PACK_DISCOUNTS[finalQty] || 0;
    const baseAmount = serverUnitPrice * finalQty;
    const afterPack = baseAmount - (baseAmount * serverDiscount / 100);

    // Historique du client
    const buyerRef = db.collection("customers").doc(emailNorm);
    const buyerSnap = await buyerRef.get();
    const buyerData = buyerSnap.exists ? buyerSnap.data() : {};
    const buyerRefCode = buyerData.refCode || null;

    const myOrdersSnap = await db.collection("orders").where("email", "==", emailNorm).get();
    let paidTicketsTotal = 0;
    let hasPaidBefore = false;
    myOrdersSnap.forEach(function (d) {
      const o = d.data();
      if (o.status === "paid") { hasPaidBefore = true; paidTicketsTotal += Number(o.tickets || 0); }
    });

    // Reduction -10% filleul : 1er achat + code de parrainage valide (d'un autre client)
    let refDiscount = 0;
    const refCodeIn = (ref || "").trim();
    if (refCodeIn && !hasPaidBefore) {
      const rs = await db.collection("customers").where("refCode", "==", refCodeIn).limit(1).get();
      if (!rs.empty && rs.docs[0].id !== emailNorm) refDiscount = 10;
    }
    const afterRef = afterPack - (afterPack * refDiscount / 100);
    const totalAmount = Math.round(afterRef * 100);

    // Tickets gratuits disponibles (fidelite 10 + parrainage 4), retroactif, plafonne, moins deja utilises
    let friends = 0;
    if (buyerRefCode) {
      const rfSnap = await db.collection("orders").where("referredBy", "==", buyerRefCode).get();
      const em = new Set();
      rfSnap.forEach(function (d) { const o = d.data(); if (o.status === "paid" && o.email) em.add(o.email); });
      friends = em.size;
    }
    const earned = Math.min(FREE_CAP, Math.floor(paidTicketsTotal / 10) + Math.floor(friends / 4));
    const redeemed = Number(buyerData.freeRedeemed || 0);
    const freeApplied = Math.max(0, earned - redeemed);

    const orderNumber = genOrderNumber();

    await db.collection("orders").add({
      orderNumber: orderNumber,
      drawId: drawId,
      drawTitle: drawTitle || "",
      drawLocation: drawLocation || "",
      drawCountry: drawCountry || "",
      drawDate: drawDate || "",
      firstName: firstName || "",
      lastName: lastName || "",
      email: emailNorm,
      phone: (phoneCode || "") + " " + (phone || ""),
      address: (address || "") + ", " + (zip || "") + " " + (city || "") + ", " + (country || ""),
      tickets: finalQty,
      freeTickets: freeApplied,
      amount: afterRef,
      discount: serverDiscount,
      refDiscount: refDiscount,
      pack: pack || null,
      referredBy: refCodeIn || null,
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      allow_promotion_codes: true,
      line_items: [{
        price_data: {
          currency: (currency || "gbp").toLowerCase(),
          product_data: { name: "Olawin - " + finalQty + " article" + (finalQty > 1 ? "s" : "") + (freeApplied > 0 ? " (+" + freeApplied + " gratuit" + (freeApplied > 1 ? "s" : "") + ")" : "") },
          unit_amount: totalAmount,
        },
        quantity: 1,
      }],
      client_reference_id: orderNumber,
      customer_email: emailNorm,
      success_url: "https://www.olawin.org/?paid=success&order=" + orderNumber,
      cancel_url: "https://www.olawin.org/?paid=cancelled",
      metadata: { orderNumber: orderNumber, drawId: drawId, tickets: String(finalQty), freeTickets: String(freeApplied) },
    });

    return res.status(200).json({ url: session.url, orderNumber: orderNumber, freeApplied: freeApplied, refDiscount: refDiscount });
  } catch (err) {
    console.error("Create checkout session error:", err);
    return res.status(500).json({ error: err.message });
  }
}
