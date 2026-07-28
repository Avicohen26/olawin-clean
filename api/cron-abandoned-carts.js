// api/cron-abandoned-carts.js
// Relance automatique des paniers abandonnes (commandes "pending" non payees).
// Declenche par le cron Vercel (1x/jour). Envoie 1 seul rappel par panier, jamais aux clients ayant paye.
// Auth : header Authorization "Bearer <CRON_SECRET>" (cron Vercel) OU x-olawin-token = CAMPAIGN_SECRET (manuel).

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

const ABANDON_AFTER_MS = 2 * 60 * 60 * 1000;   // 2 heures
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;     // ne pas relancer les paniers de plus de 7 jours
const MAX_PER_RUN = 100;

function reminderHtml(firstName, drawTitle) {
  const hi = firstName ? (", " + firstName) : "";
  return '' +
    '<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;background:#E5E1DA;border-radius:16px;overflow:hidden;">' +
      '<div style="background:#1A1A1A;padding:28px;text-align:center;">' +
        '<span style="color:#F5F1EA;font-size:22px;font-weight:bold;letter-spacing:8px;">OLAWIN</span>' +
      '</div>' +
      '<div style="background:#FBFAF8;padding:36px 32px;text-align:center;">' +
        '<div style="font-size:40px;margin-bottom:14px;">🎟️</div>' +
        '<div style="font-size:24px;color:#1A1A1A;margin-bottom:14px;font-weight:bold;">Ta place t\'attend' + hi + ' !</div>' +
        '<div style="font-size:15px;color:#555;line-height:1.6;margin-bottom:26px;">Tu as commencé une réservation' + (drawTitle ? ' pour <strong>' + drawTitle + '</strong>' : '') + ', mais le paiement n\'a pas été finalisé. Ta participation n\'est pas encore validée — il te reste peut-être une chance de tenter ta chance !</div>' +
        '<a href="https://www.olawin.org/" style="display:inline-block;background:#1A1A1A;color:#F5F1EA;text-decoration:none;padding:16px 40px;border-radius:10px;font-size:14px;font-weight:bold;letter-spacing:1px;">JE FINALISE MA PARTICIPATION →</a>' +
        '<div style="font-size:12px;color:#999;margin-top:24px;">Si tu as déjà payé ou changé d\'avis, ignore simplement cet email.</div>' +
      '</div>' +
      '<div style="background:#1A1A1A;padding:18px;text-align:center;font-size:12px;color:#888;">L\'équipe Olawin</div>' +
    '</div>';
}

export default async function handler(req, res) {
  const auth = req.headers.authorization || "";
  const cronOk = process.env.CRON_SECRET && auth === "Bearer " + process.env.CRON_SECRET;
  const manualOk = process.env.CAMPAIGN_SECRET && req.headers["x-olawin-token"] === process.env.CAMPAIGN_SECRET;
  if (!cronOk && !manualOk) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) return res.status(500).json({ error: "RESEND_API_KEY missing" });

  try {
    const now = Date.now();

    // Tirages encore actifs (on ne relance pas pour un tirage clos)
    const drawsSnap = await db.collection("draws").where("status", "==", "active").get();
    const activeDrawIds = new Set();
    drawsSnap.forEach(function (d) { activeDrawIds.add(d.id); });

    // Emails ayant deja paye (par tirage) -> ne pas relancer
    const paidSnap = await db.collection("orders").where("status", "==", "paid").get();
    const paidKeys = new Set();
    paidSnap.forEach(function (d) {
      const o = d.data();
      if (o.email && o.drawId) paidKeys.add((o.email || "").toLowerCase().trim() + "|" + o.drawId);
    });

    // Paniers en attente
    const pendingSnap = await db.collection("orders").where("status", "==", "pending").get();

    let reminded = 0, skipped = 0, tooRecent = 0;
    const doneThisRun = new Set();

    for (const docSnap of pendingSnap.docs) {
      if (reminded >= MAX_PER_RUN) break;
      const o = docSnap.data();

      if (o.reminderSent) { skipped++; continue; }
      const email = (o.email || "").toLowerCase().trim();
      if (!email) { skipped++; continue; }
      if (!o.drawId || !activeDrawIds.has(o.drawId)) { skipped++; continue; }

      // Age du panier
      let createdMs = 0;
      try { createdMs = o.createdAt && o.createdAt.toMillis ? o.createdAt.toMillis() : 0; } catch (e) { createdMs = 0; }
      if (!createdMs) { skipped++; continue; }
      const age = now - createdMs;
      if (age < ABANDON_AFTER_MS) { tooRecent++; continue; }      // moins de 2h : on laisse encore le temps de payer
      if (age > MAX_AGE_MS) { skipped++; continue; }               // trop vieux

      const key = email + "|" + o.drawId;
      if (paidKeys.has(key)) { skipped++; continue; }               // a finalement paye ce tirage
      if (doneThisRun.has(key)) {                                    // deja relance dans ce run (doublon)
        try { await docSnap.ref.update({ reminderSent: true, reminderAt: FieldValue.serverTimestamp() }); } catch (e) {}
        skipped++; continue;
      }

      // Envoi du rappel via Resend
      try {
        const r = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer " + RESEND_API_KEY },
          body: JSON.stringify({
            from: "Olawin <noreply@olawin.org>",
            to: email,
            subject: "🎟️ Ta place t'attend chez Olawin",
            html: reminderHtml(o.firstName || "", o.drawTitle || ""),
          }),
        });
        if (!r.ok) { skipped++; continue; }
        await docSnap.ref.update({ reminderSent: true, reminderAt: FieldValue.serverTimestamp() });
        doneThisRun.add(key);
        reminded++;
      } catch (e) {
        console.error("Reminder send error:", e.message);
        skipped++;
      }
    }

    return res.status(200).json({ success: true, reminded: reminded, skipped: skipped, tooRecent: tooRecent, totalPending: pendingSnap.size });
  } catch (err) {
    console.error("Abandoned carts cron error:", err);
    return res.status(500).json({ error: err.message });
  }
}
