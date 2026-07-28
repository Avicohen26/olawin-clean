// api/search-orders.js
// Recherche "mes tickets" cote serveur : renvoie uniquement les commandes correspondant
// a l'email ET au numero de commande fournis. Evite d'exposer toute la base au navigateur.

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
    const email = ((req.body && req.body.email) || "").toLowerCase().trim();
    let order = ((req.body && req.body.order) || "").trim().toUpperCase();
    order = order.replace(/^OLA-/, "").replace(/\s+/g, "");

    // Il faut IMPERATIVEMENT les deux (email + numero) pour voir une commande
    if (!email || email.indexOf("@") < 0 || !order) {
      return res.status(200).json({ orders: [] });
    }

    const snap = await db.collection("orders").where("email", "==", email).get();
    const orders = [];
    snap.forEach(function (d) {
      const o = d.data();
      const on = ((o.orderNumber || "") + "").trim().toUpperCase();
      if (on !== order) return;
      let createdAt = null;
      try { createdAt = (o.createdAt && o.createdAt.toDate) ? o.createdAt.toDate().toISOString() : null; } catch (e) {}
      orders.push({
        id: d.id,
        orderNumber: o.orderNumber || "",
        drawTitle: o.drawTitle || "",
        drawId: o.drawId || "",
        tickets: o.tickets || 0,
        freeTickets: o.freeTickets || 0,
        ticketNums: o.ticketNums || [],
        amount: o.amount || 0,
        amountPaid: (o.amountPaid != null ? o.amountPaid : null),
        status: o.status || "",
        createdAt: createdAt,
      });
    });

    return res.status(200).json({ orders: orders });
  } catch (err) {
    console.error("search-orders error:", err);
    return res.status(500).json({ error: err.message });
  }
}
