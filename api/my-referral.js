// api/my-referral.js
// Renvoie le lien de parrainage et les stats d'un client (par email)
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

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
    if (!email || email.indexOf("@") < 0) return res.status(400).json({ error: "Email invalide" });
    const ref = db.collection("customers").doc(email);
    const snap = await ref.get();
    const data = snap.exists ? snap.data() : {};
    let refCode = data.refCode;
    if (!refCode) {
      refCode = (Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)).slice(0, 6).toUpperCase();
      await ref.set({ email: email, refCode: refCode, createdVia: "lookup", updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    }
    const friends = Number(data.referredPaidCount || 0);
    const tickets = Number(data.ticketsBought || 0);
    return res.status(200).json({
      refCode: refCode,
      link: "https://www.olawin.org/?ref=" + refCode,
      friends: friends,
      tickets: tickets,
      freeFromFriends: Math.floor(friends / 4),
      friendsToNext: 4 - (friends % 4),
      freeFromTickets: Math.floor(tickets / 10),
      ticketsToNext: 10 - (tickets % 10),
    });
  } catch (err) {
    console.error("my-referral error:", err);
    return res.status(500).json({ error: err.message });
  }
}
