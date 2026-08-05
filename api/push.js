// api/push.js — Notifications push (tout-en-un)
// Actions (via ?action=) :
//   key   (GET)          -> renvoie la cle publique VAPID (genere+stocke au 1er appel)
//   save  (POST)         -> enregistre l'abonnement d'un appareil
//   track (POST)         -> compte installations / ouvertures de l'app
//   send  (POST + token) -> envoie une notification a tous les abonnes
// La cle PRIVEE VAPID reste cote serveur (jamais renvoyee au navigateur).

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import webpush from "web-push";
import crypto from "crypto";

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

async function getKeys() {
  const ref = db.collection("settings").doc("push");
  const snap = await ref.get();
  const data = snap.exists ? snap.data() : null;
  if (data && data.publicKey && data.privateKey) return data;
  const keys = webpush.generateVAPIDKeys();
  await ref.set({ publicKey: keys.publicKey, privateKey: keys.privateKey });
  return keys;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-olawin-token");
  if (req.method === "OPTIONS") return res.status(200).end();

  const action = ((req.query && req.query.action) || "").toString();

  try {
    // ---- KEY : cle publique VAPID ----
    if (action === "key") {
      const keys = await getKeys();
      return res.status(200).json({ publicKey: keys.publicKey });
    }

    // ---- SAVE : enregistrer un abonnement ----
    if (action === "save") {
      if (req.method !== "POST") return res.status(405).json({ ok: false });
      const sub = (req.body && req.body.subscription) || null;
      if (!sub || !sub.endpoint) return res.status(400).json({ ok: false });
      const id = crypto.createHash("sha256").update(sub.endpoint).digest("hex");
      await db.collection("pushSubs").doc(id).set({
        endpoint: sub.endpoint,
        keys: sub.keys || null,
        lang: (req.body && req.body.lang) || "",
        createdAt: new Date().toISOString(),
      }, { merge: true });
      return res.status(200).json({ ok: true });
    }

    // ---- TRACK : compteurs installations / ouvertures ----
    if (action === "track") {
      if (req.method !== "POST") return res.status(405).json({ ok: false });
      const type = ((req.body && req.body.type) || "").toString();
      const upd = { updatedAt: new Date().toISOString() };
      if (type === "install") upd.installs = FieldValue.increment(1);
      else if (type === "open") upd.opens = FieldValue.increment(1);
      else return res.status(200).json({ ok: false });
      await db.collection("settings").doc("appstats").set(upd, { merge: true });
      return res.status(200).json({ ok: true });
    }

    // ---- SEND : envoyer une notification a tous ----
    if (action === "send") {
      if (req.method !== "POST") return res.status(405).json({ ok: false });
      const SECRET = process.env.CAMPAIGN_SECRET;
      if (!SECRET || req.headers["x-olawin-token"] !== SECRET) {
        return res.status(401).json({ ok: false, error: "unauthorized" });
      }
      const title = ((req.body && req.body.title) || "").toString().trim();
      const body = ((req.body && req.body.body) || "").toString().trim();
      const url = ((req.body && req.body.url) || "/").toString().trim() || "/";
      if (!title) return res.status(400).json({ ok: false, error: "title required" });

      const keys = await getKeys();
      webpush.setVapidDetails("mailto:contact@olawin.org", keys.publicKey, keys.privateKey);
      const payload = JSON.stringify({ title: title, body: body, url: url });

      const snap = await db.collection("pushSubs").get();
      let sent = 0, removed = 0, failed = 0;
      const tasks = [];
      snap.forEach(function (doc) {
        const d = doc.data();
        if (!d.endpoint) return;
        tasks.push(
          webpush.sendNotification({ endpoint: d.endpoint, keys: d.keys }, payload)
            .then(function () { sent++; })
            .catch(function (err) {
              const code = err && err.statusCode;
              if (code === 404 || code === 410) { removed++; return doc.ref.delete().catch(function () {}); }
              failed++;
            })
        );
      });
      await Promise.all(tasks);
      return res.status(200).json({ ok: true, sent: sent, removed: removed, failed: failed, total: snap.size });
    }

    // ---- STATS : compteurs pour l'admin (installations / ouvertures / abonnes) ----
    if (action === "stats") {
      const snap = await db.collection("settings").doc("appstats").get();
      const d = snap.exists ? snap.data() : {};
      let subscribers = 0;
      try {
        const cnt = await db.collection("pushSubs").count().get();
        subscribers = cnt.data().count;
      } catch (e) {
        const all = await db.collection("pushSubs").get();
        subscribers = all.size;
      }
      return res.status(200).json({ ok: true, installs: d.installs || 0, opens: d.opens || 0, subscribers: subscribers });
    }

    return res.status(400).json({ ok: false, error: "unknown action" });
  } catch (err) {
    console.error("push error (" + action + "):", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
