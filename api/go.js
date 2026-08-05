// api/go.js
// Lien court "réseaux" : olawin.org/<slug> -> redirige vers le tirage et compte le clic.
// Le compteur est stocké dans draws/<drawId>.linkClicks (lu par l'admin).
// L'Admin SDK contourne les règles Firestore (pas besoin de modifier les règles).

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

const SITE = "https://www.olawin.org";

// slug (dans l'URL) -> ID du tirage
const LINKS = {
  "disneyland": "WsZXNAC9aJw6tSKUqsLa",
  "prestige": "jhzOWz6P9kKtD5MH95JV",
  "ile-maurice": "4EOkMMU00Xrus1qzLhaQ",
};

export default async function handler(req, res) {
  try {
    const slug = ((req.query && req.query.c) || "").toString().toLowerCase().trim();
    const drawId = LINKS[slug];

    if (!drawId) {
      res.writeHead(302, { Location: SITE + "/" });
      return res.end();
    }

    // Compte le clic (on n'échoue jamais la redirection à cause du comptage)
    try {
      await db.collection("draws").doc(drawId).set(
        { linkClicks: FieldValue.increment(1), lastLinkClickAt: new Date().toISOString() },
        { merge: true }
      );
    } catch (e) {
      console.error("go count error:", e);
    }

    res.writeHead(302, { Location: SITE + "/?draw=" + encodeURIComponent(drawId) });
    return res.end();
  } catch (err) {
    console.error("go error:", err);
    res.writeHead(302, { Location: SITE + "/" });
    return res.end();
  }
}
