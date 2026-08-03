// api/track-click.js
// Compte les clics sur un lien influenceur (olawin.org/?ref=CODE).
// Appele cote site a chaque ouverture d'un lien avec ?ref=.
// Firestore etant verrouille, on passe par l'Admin SDK (qui contourne les regles).
// On n'incremente QUE si le code influenceur existe deja (pas de creation de docs parasites).

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
  if (req.method !== "POST") return res.status(405).json({ ok: false });

  try {
    // Le code influenceur = ID du document (majuscules alphanumeriques).
    const ref = ((req.body && req.body.ref) || "").toString().trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    const unique = !!(req.body && req.body.unique);
    if (!ref) return res.status(200).json({ ok: false });

    const dref = db.collection("affiliates").doc(ref);
    const snap = await dref.get();
    if (!snap.exists) return res.status(200).json({ ok: false }); // code inconnu -> on ignore

    const upd = { clicks: FieldValue.increment(1), lastClickAt: new Date().toISOString() };
    if (unique) upd.visitors = FieldValue.increment(1);
    await dref.set(upd, { merge: true });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("track-click error:", err);
    // On renvoie 200 pour ne pas polluer la console du visiteur (appel "fire-and-forget").
    return res.status(200).json({ ok: false });
  }
}
