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
const DRAW_ID = "4EOkMMU00Xrus1qzLhaQ";

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
  snap.forEach(doc => {
    const o = doc.data();
    const nums = o.ticketNums || [];
    nums.forEach(n => {
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

async function createDraft(token, filename) {
  const res = await fetch(RD_BASE + "draws", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token,
    },
    body: JSON.stringify({
      name: "Test Olawin",
      organisation: "Olawin",
      uploadFilename: filename,
      headerRowsIncluded: true,
      prizes: [{ id: 1, quantity: 1, reserves: 0, description: "Prix Test" }],
      isScheduled: false,
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
  if (lines.length < 2) throw new Error("Aucun gagnant dans le CSV");
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
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const steps = {};
    const token = await getToken();
    steps.auth = "OK";
    const csv = await buildEntries(DRAW_ID);
    const filename = await uploadEntries(token, csv);
    steps.upload = filename;
    const rdDrawId = await createDraft(token, filename);
    steps.draftCreated = rdDrawId;
    await confirmDraw(token, rdDrawId);
    steps.confirmed = "OK";
    await new Promise(function(r){ setTimeout(r, 3000); });
    try {
      const winners = await getWinnersCsv(token, rdDrawId);
      steps.winners = winners || "(vide)";
      const saved = await saveWinnerToFirebase(DRAW_ID, winners);
      steps.savedToFirebase = saved;
    } catch (e) {
      steps.winners = "Erreur : " + e.message;
    }
    return res.status(200).json({ ok: true, steps: steps });
  } catch (err) {
    console.error("create-random-draw error:", err);
    return res.status(500).json({ error: err.message });
  }
}
