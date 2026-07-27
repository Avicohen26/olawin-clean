// api/quote.js — calcule reduction parrainage + tickets gratuits pour un email (avant paiement)
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

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
const FREE_CAP = 20;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const email = ((req.body && req.body.email) || "").toLowerCase().trim();
    const ref = ((req.body && req.body.ref) || "").trim();
    if (!email || email.indexOf("@") < 0) return res.status(200).json({ refDiscount: 0, freeApplied: 0 });

    const buyerSnap = await db.collection("customers").doc(email).get();
    const buyerData = buyerSnap.exists ? buyerSnap.data() : {};
    const buyerRefCode = buyerData.refCode || null;

    const myOrders = await db.collection("orders").where("email", "==", email).get();
    let paidTicketsTotal = 0, hasPaidBefore = false;
    myOrders.forEach(function (d) { const o = d.data(); if (o.status === "paid") { hasPaidBefore = true; paidTicketsTotal += Number(o.tickets || 0); } });

    let refDiscount = 0;
    if (ref && !hasPaidBefore) {
      const rs = await db.collection("customers").where("refCode", "==", ref).limit(1).get();
      if (!rs.empty && rs.docs[0].id !== email) refDiscount = 10;
    }

    let friends = 0;
    if (buyerRefCode) {
      const rf = await db.collection("orders").where("referredBy", "==", buyerRefCode).get();
      const em = new Set();
      rf.forEach(function (d) { const o = d.data(); if (o.status === "paid" && o.email) em.add(o.email); });
      friends = em.size;
    }
    const earned = Math.min(FREE_CAP, Math.floor(paidTicketsTotal / 10) + Math.floor(friends / 4));
    const freeApplied = Math.max(0, earned - Number(buyerData.freeRedeemed || 0));

    return res.status(200).json({ refDiscount: refDiscount, freeApplied: freeApplied });
  } catch (err) {
    console.error("quote error:", err);
    return res.status(200).json({ refDiscount: 0, freeApplied: 0 });
  }
}
