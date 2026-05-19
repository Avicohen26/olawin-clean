// ════════════════════════════════════════════════════════════
//  emails.js — Système d'emails automatiques Olawin
//  Utilise Resend (resend.com) — gratuit jusqu'à 3000 emails/mois
//
//  ⚠️  INSTALLATION :
//      npm install resend
//
//  ⚠️  CONFIGURATION :
//      1. Crée un compte sur resend.com
//      2. Vérifie ton domaine olawin.org (5 min)
//      3. Crée une clé API
//      4. Remplace RESEND_API_KEY ci-dessous
//      5. Remplace ADMIN_EMAIL par ton email
// ════════════════════════════════════════════════════════════

// ── CONFIG ───────────────────────────────────────────────────
const RESEND_API_KEY = "re_REMPLACE_PAR_TA_CLE_RESEND";
const FROM_EMAIL     = "noreply@olawin.org";        // ← ton domaine vérifié
const ADMIN_EMAIL    = "contact@olawin.org";         // ← TON email personnel
const SITE_URL       = "https://olawin.org";

// ── FONCTION D'ENVOI PRINCIPALE ──────────────────────────────
async function sendEmail({ to, subject, html }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: `Olawin <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error: ${err}`);
  }

  return await res.json();
}

// ════════════════════════════════════════════════════════════
//  EMAIL 1 — CONFIRMATION AU CLIENT après achat
// ════════════════════════════════════════════════════════════
export async function sendTicketConfirmation({
  firstName,
  lastName,
  email,
  drawTitle,
  drawLocation,
  drawCountry,
  drawDate,
  ticketNums,
  qty,
  total,
  discount,
  pack,
}) {
  const ticketList = ticketNums
    .map(n => `<span style="display:inline-block;background:#f0ede7;border:1px solid rgba(0,0,0,0.15);border-radius:6px;padding:6px 14px;font-family:'Courier New',monospace;font-size:16px;font-weight:600;color:#1a1a1a;margin:3px;">#${String(n).padStart(3,"0")}</span>`)
    .join(" ");

  const discountRow = discount > 0 ? `
    <tr>
      <td style="padding:6px 0;color:rgba(0,0,0,0.5);font-size:14px;">Remise ${discount}%</td>
      <td style="padding:6px 0;color:rgba(0,0,0,0.5);font-size:14px;text-align:right;">-${Math.round(total/(1-discount/100)*discount/100)}$</td>
    </tr>` : "";

  const packRow = pack ? `
    <tr>
      <td style="padding:6px 0;color:rgba(0,0,0,0.5);font-size:13px;" colspan="2">Formule : ${pack}</td>
    </tr>` : "";

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Vos tickets Olawin</title>
</head>
<body style="margin:0;padding:0;background:#f5f2ed;font-family:'Helvetica Neue',Arial,sans-serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f2ed;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- LOGO HEADER -->
        <tr>
          <td style="background:#1a1a1a;padding:32px 40px;border-radius:16px 16px 0 0;text-align:center;">
            <div style="display:inline-block;">
              <!-- Logo SVG simplifié -->
              <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;margin-right:10px;">
                <polygon points="20,2 38,20 20,38 2,20" fill="none" stroke="white" stroke-width="1.5"/>
                <circle cx="20" cy="20" r="7" fill="none" stroke="white" stroke-width="1.5"/>
                <circle cx="20" cy="6"  r="1.5" fill="white"/>
                <circle cx="34" cy="20" r="1.5" fill="white"/>
                <circle cx="20" cy="34" r="1.5" fill="white"/>
                <circle cx="6"  cy="20" r="1.5" fill="white"/>
              </svg>
              <span style="font-family:Georgia,serif;font-size:24px;font-weight:300;letter-spacing:6px;color:#ffffff;vertical-align:middle;">OLAWIN</span>
            </div>
          </td>
        </tr>

        <!-- HERO -->
        <tr>
          <td style="background:#ffffff;padding:48px 40px 32px;text-align:center;">
            <div style="font-size:48px;margin-bottom:16px;">🎟️</div>
            <h1 style="margin:0 0 8px;font-size:13px;letter-spacing:4px;color:rgba(0,0,0,0.4);font-weight:400;text-transform:uppercase;">Paiement confirmé</h1>
            <h2 style="margin:0 0 16px;font-size:32px;font-weight:300;color:#1a1a1a;letter-spacing:1px;">Bonne chance, ${firstName} !</h2>
            <p style="margin:0;font-size:15px;color:rgba(0,0,0,0.5);line-height:1.7;font-style:italic;">
              Vos ${qty} ticket${qty > 1 ? "s" : ""} pour le tirage <strong style="color:#1a1a1a;">${drawCountry} ${drawTitle} — ${drawLocation}</strong> sont enregistrés.
            </p>
          </td>
        </tr>

        <!-- TICKETS -->
        <tr>
          <td style="background:#ffffff;padding:0 40px 40px;">
            <div style="background:#f8f6f2;border:1px solid rgba(0,0,0,0.08);border-radius:14px;padding:28px;text-align:center;">
              <p style="margin:0 0 16px;font-size:10px;letter-spacing:3px;color:rgba(0,0,0,0.4);text-transform:uppercase;">Vos numéros de tickets</p>
              <div style="margin-bottom:20px;">${ticketList}</div>
              <p style="margin:0;font-size:12px;color:rgba(0,0,0,0.4);">Conservez cet email — vos numéros sont votre preuve de participation</p>
            </div>
          </td>
        </tr>

        <!-- DÉTAILS COMMANDE -->
        <tr>
          <td style="background:#ffffff;padding:0 40px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(0,0,0,0.08);padding-top:24px;">
              <tr>
                <td colspan="2" style="padding:0 0 14px;font-size:10px;letter-spacing:3px;color:rgba(0,0,0,0.4);text-transform:uppercase;">Récapitulatif</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#1a1a1a;font-size:14px;">Tirage</td>
                <td style="padding:6px 0;color:#1a1a1a;font-size:14px;text-align:right;font-weight:600;">${drawTitle} — ${drawLocation}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:rgba(0,0,0,0.5);font-size:14px;">Tickets achetés</td>
                <td style="padding:6px 0;color:rgba(0,0,0,0.5);font-size:14px;text-align:right;">${qty}x</td>
              </tr>
              ${packRow}
              ${discountRow}
              <tr style="border-top:1px solid rgba(0,0,0,0.08);">
                <td style="padding:14px 0 0;color:#1a1a1a;font-size:16px;font-weight:700;">Total payé</td>
                <td style="padding:14px 0 0;color:#1a1a1a;font-size:22px;font-weight:300;text-align:right;letter-spacing:1px;">${total}$</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- DATE DU TIRAGE -->
        <tr>
          <td style="background:#1a1a1a;padding:32px 40px;margin:0 40px;border-radius:0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <p style="margin:0 0 4px;font-size:10px;letter-spacing:3px;color:rgba(255,255,255,0.4);text-transform:uppercase;">Date du tirage</p>
                  <p style="margin:0;font-size:22px;font-weight:300;color:#ffffff;letter-spacing:1px;">${new Date(drawDate).toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long", year:"numeric" })}</p>
                </td>
                <td style="text-align:right;font-size:40px;">📺</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- INFO TIRAGE EN DIRECT -->
        <tr>
          <td style="background:#ffffff;padding:32px 40px;">
            <p style="margin:0 0 16px;font-size:10px;letter-spacing:3px;color:rgba(0,0,0,0.4);text-transform:uppercase;">Comment suivre le tirage</p>
            <div style="background:#f8f6f2;border-radius:10px;padding:20px;margin-bottom:12px;">
              <p style="margin:0;font-size:14px;color:rgba(0,0,0,0.6);line-height:1.7;">
                📺 Le tirage sera diffusé <strong style="color:#1a1a1a;">en direct</strong> sur nos réseaux sociaux.<br/>
                🎲 Le numéro gagnant sera tiré publiquement via <strong style="color:#1a1a1a;">Random.org</strong>.<br/>
                🏆 Le gagnant sera annoncé en live et contacté par email sous <strong style="color:#1a1a1a;">48h</strong>.
              </p>
            </div>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="background:#ffffff;padding:0 40px 48px;text-align:center;">
            <a href="${SITE_URL}" style="display:inline-block;background:#1a1a1a;color:#f0ede7;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:12px;font-weight:700;letter-spacing:2px;">
              VOIR TOUS LES TIRAGES →
            </a>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#f0ede7;padding:28px 40px;border-radius:0 0 16px 16px;text-align:center;border-top:1px solid rgba(0,0,0,0.08);">
            <p style="margin:0 0 8px;font-size:12px;color:rgba(0,0,0,0.4);">
              Une question ? <a href="mailto:contact@olawin.org" style="color:#1a1a1a;font-weight:600;">contact@olawin.org</a>
            </p>
            <p style="margin:0;font-size:11px;color:rgba(0,0,0,0.3);">
              © 2026 Olawin · Partenaire officiel hotels.privatehonors.com<br/>
              Conformément au RGPD, vos données ne sont jamais revendues.
              <a href="${SITE_URL}/legal" style="color:rgba(0,0,0,0.4);">CGU</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return sendEmail({
    to: email,
    subject: `🎟️ Vos ${qty} ticket${qty > 1 ? "s" : ""} — ${drawTitle} ${drawLocation}`,
    html,
  });
}

// ════════════════════════════════════════════════════════════
//  EMAIL 2 — NOTIFICATION ADMIN à chaque nouvelle vente
// ════════════════════════════════════════════════════════════
export async function sendAdminNotification({
  firstName,
  lastName,
  email,
  phone,
  address,
  drawTitle,
  drawLocation,
  drawCountry,
  ticketNums,
  qty,
  total,
  pack,
  orderId,
}) {
  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f5f2ed;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f2ed;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- HEADER -->
        <tr>
          <td style="background:#1a1a1a;padding:24px 32px;border-radius:14px 14px 0 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="font-family:Georgia,serif;font-size:18px;font-weight:300;letter-spacing:5px;color:#ffffff;">OLAWIN</span>
                  <span style="font-size:11px;letter-spacing:2px;color:rgba(255,255,255,0.4);margin-left:16px;text-transform:uppercase;">Admin</span>
                </td>
                <td style="text-align:right;">
                  <span style="background:rgba(0,200,80,0.2);border:1px solid rgba(0,200,80,0.3);border-radius:20px;padding:4px 12px;font-size:11px;color:rgba(0,200,80,0.9);letter-spacing:1px;">NOUVELLE VENTE</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- MONTANT -->
        <tr>
          <td style="background:#ffffff;padding:36px 32px 24px;text-align:center;">
            <p style="margin:0 0 6px;font-size:11px;letter-spacing:3px;color:rgba(0,0,0,0.4);text-transform:uppercase;">Montant encaissé</p>
            <p style="margin:0;font-size:48px;font-weight:300;color:#1a1a1a;letter-spacing:2px;">${total}$</p>
            <p style="margin:8px 0 0;font-size:14px;color:rgba(0,0,0,0.5);">${qty} ticket${qty > 1 ? "s" : ""} · ${drawCountry} ${drawTitle} — ${drawLocation}${pack ? ` · ${pack}` : ""}</p>
          </td>
        </tr>

        <!-- CLIENT -->
        <tr>
          <td style="background:#ffffff;padding:0 32px 32px;">
            <div style="background:#f8f6f2;border:1px solid rgba(0,0,0,0.08);border-radius:12px;padding:20px;">
              <p style="margin:0 0 14px;font-size:10px;letter-spacing:3px;color:rgba(0,0,0,0.4);text-transform:uppercase;">Informations client</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${[
                  ["Nom", `${firstName} ${lastName}`],
                  ["Email", email],
                  ["Téléphone", phone],
                  ["Adresse", address],
                  ["Tickets", ticketNums.map(n => `#${String(n).padStart(3,"0")}`).join(", ")],
                  ["ID Commande", orderId],
                ].map(([l, v]) => `
                  <tr>
                    <td style="padding:5px 0;font-size:12px;color:rgba(0,0,0,0.4);width:110px;">${l}</td>
                    <td style="padding:5px 0;font-size:13px;color:#1a1a1a;font-weight:500;">${v}</td>
                  </tr>`).join("")}
              </table>
            </div>
          </td>
        </tr>

        <!-- STATS RAPIDES -->
        <tr>
          <td style="background:#ffffff;padding:0 32px 36px;">
            <a href="${SITE_URL}/admin" style="display:block;background:#1a1a1a;color:#f0ede7;text-decoration:none;padding:14px;border-radius:10px;font-size:12px;font-weight:700;letter-spacing:2px;text-align:center;">
              VOIR DANS L'ADMIN →
            </a>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#f0ede7;padding:20px 32px;border-radius:0 0 14px 14px;text-align:center;border-top:1px solid rgba(0,0,0,0.08);">
            <p style="margin:0;font-size:11px;color:rgba(0,0,0,0.35);">Olawin Admin · Email automatique · Ne pas répondre</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `💰 Nouvelle vente ${total}$ — ${firstName} ${lastName} · ${qty} ticket${qty > 1 ? "s" : ""}`,
    html,
  });
}

// ════════════════════════════════════════════════════════════
//  EMAIL 3 — ANNONCE DU GAGNANT
// ════════════════════════════════════════════════════════════
export async function sendWinnerEmail({
  firstName,
  lastName,
  email,
  drawTitle,
  drawLocation,
  drawCountry,
  prize,
  winningTicket,
  voucherCode,
}) {
  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f5f2ed;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f2ed;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- CONFETTI HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a1a1a 0%,#333 100%);padding:48px 40px;border-radius:16px 16px 0 0;text-align:center;">
            <div style="font-size:64px;margin-bottom:16px;">🏆</div>
            <p style="margin:0 0 8px;font-size:12px;letter-spacing:4px;color:rgba(255,255,255,0.5);text-transform:uppercase;">Félicitations</p>
            <h1 style="margin:0;font-size:36px;font-weight:300;color:#ffffff;letter-spacing:2px;">Vous avez gagné !</h1>
          </td>
        </tr>

        <!-- MESSAGE PRINCIPAL -->
        <tr>
          <td style="background:#ffffff;padding:48px 40px 32px;text-align:center;">
            <p style="margin:0 0 24px;font-size:18px;color:#1a1a1a;line-height:1.7;">
              Bravo <strong>${firstName} ${lastName}</strong> !<br/>
              Votre ticket <strong style="font-family:'Courier New',monospace;font-size:20px;">#${String(winningTicket).padStart(3,"0")}</strong> a été tiré au sort.
            </p>
            <div style="background:#f8f6f2;border:1px solid rgba(0,0,0,0.1);border-radius:14px;padding:28px;margin-bottom:24px;">
              <p style="margin:0 0 10px;font-size:10px;letter-spacing:3px;color:rgba(0,0,0,0.4);text-transform:uppercase;">Votre prix</p>
              <p style="margin:0 0 8px;font-size:28px;font-weight:300;color:#1a1a1a;">${prize}</p>
              <p style="margin:0;font-size:14px;color:rgba(0,0,0,0.5);">${drawCountry} ${drawTitle} — ${drawLocation}</p>
            </div>
          </td>
        </tr>

        <!-- CODE BON -->
        <tr>
          <td style="background:#ffffff;padding:0 40px 40px;text-align:center;">
            <div style="background:#1a1a1a;border-radius:14px;padding:32px;">
              <p style="margin:0 0 12px;font-size:10px;letter-spacing:3px;color:rgba(255,255,255,0.5);text-transform:uppercase;">Votre code bon PrivateHonors</p>
              <p style="margin:0 0 20px;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:4px;font-family:'Courier New',monospace;">${voucherCode || "CODE-À-DÉFINIR"}</p>
              <a href="https://hotels.privatehonors.com" style="display:inline-block;background:#ffffff;color:#1a1a1a;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:12px;font-weight:700;letter-spacing:2px;">
                UTILISER MON BON →
              </a>
            </div>
          </td>
        </tr>

        <!-- INSTRUCTIONS -->
        <tr>
          <td style="background:#ffffff;padding:0 40px 48px;">
            <p style="margin:0 0 14px;font-size:10px;letter-spacing:3px;color:rgba(0,0,0,0.4);text-transform:uppercase;">Comment utiliser votre bon</p>
            ${[
              ["1.", "Rendez-vous sur hotels.privatehonors.com"],
              ["2.", "Créez votre compte ou connectez-vous"],
              ["3.", "Choisissez votre hôtel et vos dates"],
              ["4.", "Entrez le code au moment du paiement"],
              ["5.", "Profitez de votre séjour de luxe !"],
            ].map(([n, t]) => `
              <div style="display:flex;align-items:flex-start;margin-bottom:10px;">
                <span style="background:#1a1a1a;color:#ffffff;width:22px;height:22px;border-radius:50%;font-size:11px;font-weight:700;text-align:center;line-height:22px;margin-right:12px;flex-shrink:0;">${n.replace(".", "")}</span>
                <span style="font-size:14px;color:rgba(0,0,0,0.6);line-height:22px;">${t}</span>
              </div>`).join("")}
            <div style="background:#f8f6f2;border-radius:10px;padding:16px;margin-top:16px;">
              <p style="margin:0;font-size:13px;color:rgba(0,0,0,0.5);">⏰ Votre bon est valable <strong style="color:#1a1a1a;">24 mois</strong> à partir d'aujourd'hui. En cas de question : <a href="mailto:contact@olawin.org" style="color:#1a1a1a;">contact@olawin.org</a></p>
            </div>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#f0ede7;padding:28px 40px;border-radius:0 0 16px 16px;text-align:center;border-top:1px solid rgba(0,0,0,0.08);">
            <p style="margin:0;font-size:11px;color:rgba(0,0,0,0.35);">© 2026 Olawin · Partenaire officiel hotels.privatehonors.com</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return sendEmail({
    to: email,
    subject: `🏆 Vous avez gagné ! Votre bon ${prize} — ${drawTitle}`,
    html,
  });
}
