// api/send-email.js
// Endpoint serveur Vercel pour envoyer des emails via Resend
// Tourne cote serveur, la cle API est protegee

export default async function handler(req, res) {
  // CORS pour permettre les appels depuis le frontend
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY missing in environment variables");
    return res.status(500).json({ error: "Server configuration error" });
  }

  try {
    const { to, from, subject, html } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({ error: "Missing required fields: to, subject, html" });
    }

    const fromAddress = from || "Olawin <noreply@olawin.org>";

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: fromAddress,
        to: to,
        subject: subject,
        html: html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Resend API error:", data);
      return res.status(response.status).json({ error: data.message || "Resend API error", details: data });
    }

    return res.status(200).json({ success: true, id: data.id });
  } catch (error) {
    console.error("Send email error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
