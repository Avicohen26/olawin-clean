// api/influencer-stats.js — stats d'un influenceur (code + cle), sans donnees client
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

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const code = ((req.body && req.body.code) || "").trim().toUpperCase();
    const key = ((req.body && req.body.key) || "").trim().toUpperCase();
    if (!code || !key) return res.status(400).json({ error: "Code et cle requis" });

    const affSnap = await db.collection("affiliates").doc(code).get();
    if (!affSnap.exists) return res.status(404).json({ error: "Influenceur introuvable" });
    const aff = affSnap.data();
    if (!aff.accessKey || String(aff.accessKey).toUpperCase() !== key) {
      return res.status(401).json({ error: "Cle d'acces incorrecte" });
    }

    const ordSnap = await db.collection("orders").where("referredBy", "==", code).get();
    let sales = 0, revenue = 0, tickets = 0;
    const list = [];
    ordSnap.forEach(function (d) {
      const o = d.data();
      if (o.status !== "paid") return;
      sales += 1;
      revenue += Number(o.amount || 0);
      tickets += Number(o.tickets || 0);
      let ts = "";
      try { if (o.paidAt && o.paidAt.toDate) ts = o.paidAt.toDate().toISOString().slice(0,10); else if (o.createdAt && o.createdAt.toDate) ts = o.createdAt.toDate().toISOString().slice(0,10); } catch(e){}
      list.push({ date: ts, amount: Math.round(Number(o.amount || 0)), tickets: Number(o.tickets || 0) });
    });
    list.sort(function(a,b){ return (b.date||"").localeCompare(a.date||""); });

    const cval = Number(aff.commissionValue != null ? aff.commissionValue : (aff.commissionPct || 0));
    const commission = aff.commissionType === "perticket" ? Math.round(tickets * cval * 100) / 100 : Math.round(revenue * cval / 100 * 100) / 100;
    const paid = Number(aff.paidCommission || 0);
    const due = Math.round((commission - paid) * 100) / 100;

    const clicks = Number(aff.clicks || 0);
    const visitors = Number(aff.visitors || 0);
    const convBase = visitors > 0 ? visitors : clicks;
    const conversion = convBase > 0 ? Math.round(sales / convBase * 100) : null;

    return res.status(200).json({
      name: aff.name || "",
      commissionLabel: aff.commissionType === "perticket" ? (cval + " £/ticket") : (cval + " % du CA"),
      sales: sales, revenue: Math.round(revenue), tickets: tickets,
      commission: commission, paid: paid, due: due,
      clicks: clicks, visitors: visitors, conversion: conversion,
      list: list.slice(0, 100),
    });
  } catch (err) {
    console.error("influencer-stats error:", err);
    return res.status(500).json({ error: err.message });
  }
}
