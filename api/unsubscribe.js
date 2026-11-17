// api/unsubscribe.js
// Désinscription en 1 clic pour les campagnes / newsletters.
// L'adresse est ajoutée à settings/unsubscribed.emails (respecté par l'admin Campagnes).
// GET  -> page de confirmation (évite les désinscriptions auto par les anti-spam qui préchargent les liens)
// POST -> désinscrit réellement (bouton de confirmation OU one-click RFC 8058 de Gmail/Outlook)

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

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function page(title, inner) {
  return '<!doctype html><html lang="fr"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(title) + '</title></head>' +
    '<body style="margin:0;background:#0e0e13;font-family:Arial,Helvetica,sans-serif;color:#ffffff;">' +
    '<div style="max-width:480px;margin:0 auto;padding:64px 24px;text-align:center;">' +
    '<div style="font-size:26px;font-weight:bold;letter-spacing:8px;color:#F0E8D6;margin-bottom:30px;">OLAWIN</div>' +
    inner + '</div></body></html>';
}

async function doUnsub(email) {
  const e = String(email || "").toLowerCase().trim();
  if (!e || e.indexOf("@") < 1) return false;
  await db.collection("settings").doc("unsubscribed").set(
    { emails: FieldValue.arrayUnion(e), updatedAt: new Date().toISOString() },
    { merge: true }
  );
  return true;
}

export default async function handler(req, res) {
  const email = ((req.query && req.query.e) || (req.body && req.body.e) || "").toString();

  res.setHeader("Content-Type", "text/html; charset=utf-8");

  // POST = confirmation (bouton) ou one-click Gmail/Outlook -> on désinscrit
  if (req.method === "POST") {
    let ok = false;
    try { ok = await doUnsub(email); } catch (e) { console.error("unsub error:", e); }
    return res.status(200).send(page("Désinscription",
      ok
        ? '<p style="font-size:16px;line-height:1.6;color:rgba(255,255,255,0.85);">C\'est fait &#10003;<br>L\'adresse <b style="color:#D8BC86;">' + esc(email) + '</b> ne recevra plus nos e-mails.</p>' +
          '<p style="margin-top:28px;"><a href="' + SITE + '" style="color:#D8BC86;">Retour sur olawin.org</a></p>'
        : '<p style="font-size:16px;color:rgba(255,255,255,0.85);">Lien invalide ou adresse manquante.</p>'
    ));
  }

  // GET sans adresse
  if (!email) {
    return res.status(200).send(page("Désinscription",
      '<p style="font-size:16px;color:rgba(255,255,255,0.85);">Aucune adresse fournie.</p>'));
  }

  // GET avec adresse -> page de confirmation
  return res.status(200).send(page("Désinscription",
    '<p style="font-size:16px;line-height:1.6;color:rgba(255,255,255,0.85);">Souhaites-tu te désinscrire des e-mails Olawin&nbsp;?<br>' +
    '<span style="color:#D8BC86;">' + esc(email) + '</span></p>' +
    '<form method="POST" action="/api/unsubscribe?e=' + encodeURIComponent(email) + '" style="margin-top:28px;">' +
    '<input type="hidden" name="e" value="' + esc(email) + '">' +
    '<button type="submit" style="background:#CBA86A;color:#14140f;border:0;border-radius:12px;padding:16px 40px;font-size:15px;font-weight:bold;cursor:pointer;">Confirmer la désinscription</button>' +
    '</form>' +
    '<p style="margin-top:20px;"><a href="' + SITE + '" style="color:rgba(255,255,255,0.5);font-size:13px;">Annuler</a></p>'
  ));
}
