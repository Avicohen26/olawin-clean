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

const RD_BASE = "https://api.randomdraws.com/";

async function getToken() {
  const res = await fetch(RD_BASE + "tokens", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.RANDOMDRAWS_EMAIL,
      password: process.env.RANDOMDRAWS_PASSWORD,
      testMode: true,
    }),
  });
  const raw = await res.text();
  if (!res.ok) throw new Error("Auth (" + res.status + "): " + raw);
  return JSON.parse(raw).token;
}

async function buildEntries(drawId) {
  const snap = await db.collection("orders")
    .where("drawId", "==", drawId)
    .where("status", "==", "paid")
    .get();
  const rows = ["Numero ticket,Prenom,Nom,Email"];
  snap.forEach(function(doc) {
    const o = doc.data();
    const nums = o.ticketNums || [];
    nums.forEach(function(n) {
      rows.push(n + ',"' + (o.firstName||"") + '","' + (o.lastName||"") + '","' + (o.email||"") + '"');
    });
  });
  return rows.join("\n");
}

async function uploadEntries(token, csvContent) {
  const form = new FormData();
  const blob = new Blob([csvContent], { type: "text/csv" });
  form.append("file", blob, "participants.csv");
  const res = await fetch(RD_BASE + "upload", {
    method: "POST",
    headers: { "Authorization": "Bearer " + token },
    body: form,
  });
  const raw = await res.text();
  if (!res.ok) throw new Error("Upload (" + res.status + "): " + raw);
  return JSON.parse(raw).filename;
}

async function createScheduledDraw(token, filename, drawName, scheduleDate) {
  const res = await fetch(RD_BASE + "draws", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token,
    },
    body: JSON.stringify({
      name: (drawName || "Tirage Olawin").slice(0, 50),
      organisation: "Olawin",
      uploadFilename: filename,
      headerRowsIncluded: true,
      prizes: [{ id: 1, quantity: 1, reserves: 0, description: "Prix Olawin" }],
      isScheduled: true,
      scheduleDate: scheduleDate,
      timezone: "Europe/Paris",
    }),
  });
  const raw = await res.text();
  if (!res.ok) throw new Error("Create draw (" + res.status + "): " + raw);
  return JSON.parse(raw).drawId;
}

async function confirmDraw(token, rdDrawId) {
  const res = await fetch(RD_BASE + "draws/" + rdDrawId, {
    method: "POST",
    headers: { "Authorization": "Bearer " + token },
  });
  const raw = await res.text();
  if (!res.ok) throw new Error("Confirm (" + res.status + "): " + raw);
  return raw;
}

async function getWinnersCsv(token, rdDrawId) {
  const res = await fetch(RD_BASE + "draws/" + rdDrawId + "/api-winners.csv", {
    method: "GET",
    headers: { "Authorization": "Bearer " + token },
  });
  const raw = await res.text();
  if (!res.ok) throw new Error("Winners (" + res.status + "): " + raw);
  return raw;
}

async function saveWinnerToFirebase(drawId, winnersCsv) {
  const lines = winnersCsv.trim().split("\n");
  if (lines.length < 2) throw new Error("Aucun gagnant (tirage pas encore effectue ?)");
  const cells = lines[1].split(",").map(function(c){ return c.replace(/^"|"$/g, "").trim(); });
  const num = cells[3];
  const prenom = cells[4];
  const nom = cells[5];
  const email = cells[6];
  await db.collection("draws").doc(drawId).update({
    winner: {
      name: (prenom + " " + nom).trim(),
      email: email,
      num: num,
      date: new Date().toISOString(),
    },
    status: "drawn",
    drawnAt: new Date().toISOString(),
  });
  return { name: (prenom + " " + nom).trim(), num: num, email: email };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-olawin-token");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  // Protection : seule une requete avec la cle secrete peut programmer un tirage / recuperer un gagnant
  const SECRET = process.env.CAMPAIGN_SECRET;
  if (!SECRET || req.headers["x-olawin-token"] !== SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const body = req.body || {};
    const drawId = body.drawId;
    const action = body.action;
    const confirmed = body.confirmed;

    if (!drawId) return res.status(400).json({ error: "drawId manquant." });
    if (!confirmed) return res.status(400).json({ error: "Confirmation requise." });

    const drawSnap = await db.collection("draws").doc(drawId).get();
    if (!drawSnap.exists) return res.status(404).json({ error: "Tirage introuvable." });
    const draw = drawSnap.data();

    const token = await getToken();

    // ACTION 1 : PROGRAMMER le tirage
    if (action === "schedule") {
      const csv = await buildEntries(drawId);
      const filename = await uploadEntries(token, csv);
      const scheduleDate = new Date(draw.drawDate + "T12:00:00").toISOString();
      const rdDrawId = await createScheduledDraw(token, filename, draw.title, scheduleDate);
      await confirmDraw(token, rdDrawId);
      await db.collection("draws").doc(drawId).update({
        randomdrawsId: rdDrawId,
        randomdrawsScheduledFor: draw.drawDate,
      });
      return res.status(200).json({ ok: true, action: "scheduled", rdDrawId: rdDrawId, scheduledFor: draw.drawDate });
    }

    // ACTION 2 : RECUPERER le gagnant (apres la date)
    if (action === "getWinner") {
      const rdDrawId = draw.randomdrawsId;
      if (!rdDrawId) return res.status(400).json({ error: "Ce tirage n'a pas ete programme via l'API." });
      const winners = await getWinnersCsv(token, rdDrawId);
      const saved = await saveWinnerToFirebase(drawId, winners);
      return res.status(200).json({ ok: true, action: "winner", winner: saved });
    }

    return res.status(400).json({ error: "Action inconnue." });
  } catch (err) {
    console.error("create-random-draw error:", err);
    return res.status(500).json({ error: err.message });
  }
}
