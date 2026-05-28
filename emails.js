// emails.js - Systeme d'emails Olawin
// Appelle l'endpoint serveur /api/send-email qui utilise Resend cote serveur

const FROM_EMAIL = "noreply@olawin.org";
const ADMIN_EMAIL = "contact@olawin.org";
const SITE_URL = "https://olawin.org";

async function sendEmail({ to, subject, html }) {
  const apiUrl = typeof window !== "undefined"
    ? window.location.origin + "/api/send-email"
    : "/api/send-email";

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: to,
      from: "Olawin <" + FROM_EMAIL + ">",
      subject: subject,
      html: html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error("Email send error: " + err);
  }
  return await res.json();
}

export async function sendTicketConfirmation({
  firstName, lastName, email,
  drawTitle, drawLocation, drawCountry, drawDate,
  ticketNums, qty, total, discount, pack, orderNumber,
}) {
  const ticketList = ticketNums
    .map(function(n) {
      return "<span style=\"display:inline-block;background:#f0ede7;border:1px solid rgba(0,0,0,0.15);border-radius:6px;padding:6px 14px;font-family:Courier New,monospace;font-size:16px;font-weight:600;color:#1a1a1a;margin:3px;\">#" + String(n).padStart(3, "0") + "</span>";
    })
    .join(" ");

  const discountRow = discount > 0
    ? "<tr><td style=\"padding:6px 0;color:rgba(0,0,0,0.5);font-size:14px;\">Remise " + discount + "%</td><td style=\"padding:6px 0;color:rgba(0,0,0,0.5);font-size:14px;text-align:right;\">-" + Math.round(total / (1 - discount / 100) * discount / 100) + "£</td></tr>"
    : "";

  const packRow = pack
    ? "<tr><td style=\"padding:6px 0;color:rgba(0,0,0,0.5);font-size:13px;\" colspan=\"2\">Formule : " + pack + "</td></tr>"
    : "";

  const orderRow = orderNumber
    ? "<tr><td style=\"padding:6px 0;color:rgba(0,0,0,0.5);font-size:13px;\">Numero commande</td><td style=\"padding:6px 0;color:#1a1a1a;font-size:13px;text-align:right;font-family:Courier New,monospace;font-weight:600;\">OLA-" + orderNumber + "</td></tr>"
    : "";

  const drawDateStr = drawDate
    ? new Date(drawDate).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "Bientot annonce";

  const html = "<!DOCTYPE html><html lang=\"fr\"><head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1.0\"><title>Vos tickets Olawin</title></head><body style=\"margin:0;padding:0;background:#f5f2ed;font-family:Helvetica Neue,Arial,sans-serif;\">"
    + "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#f5f2ed;padding:40px 20px;\"><tr><td align=\"center\">"
    + "<table width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:600px;width:100%;\">"
    + "<tr><td style=\"background:#1a1a1a;padding:32px 40px;border-radius:16px 16px 0 0;text-align:center;\">"
    + "<span style=\"font-family:Georgia,serif;font-size:24px;font-weight:300;letter-spacing:6px;color:#ffffff;\">OLAWIN</span>"
    + "</td></tr>"
    + "<tr><td style=\"background:#ffffff;padding:48px 40px 32px;text-align:center;\">"
    + "<div style=\"font-size:48px;margin-bottom:16px;\">&#127903;</div>"
    + "<h1 style=\"margin:0 0 8px;font-size:13px;letter-spacing:4px;color:rgba(0,0,0,0.4);font-weight:400;text-transform:uppercase;\">Paiement confirme</h1>"
    + "<h2 style=\"margin:0 0 16px;font-size:32px;font-weight:300;color:#1a1a1a;letter-spacing:1px;\">Bonne chance, " + firstName + " !</h2>"
    + "<p style=\"margin:0;font-size:15px;color:rgba(0,0,0,0.5);line-height:1.7;font-style:italic;\">Vos " + qty + " ticket" + (qty > 1 ? "s" : "") + " pour le tirage <strong style=\"color:#1a1a1a;\">" + (drawCountry || "") + " " + drawTitle + " &mdash; " + (drawLocation || "") + "</strong> sont enregistres.</p>"
    + "</td></tr>"
    + "<tr><td style=\"background:#ffffff;padding:0 40px 40px;\">"
    + "<div style=\"background:#f8f6f2;border:1px solid rgba(0,0,0,0.08);border-radius:14px;padding:28px;text-align:center;\">"
    + "<p style=\"margin:0 0 16px;font-size:10px;letter-spacing:3px;color:rgba(0,0,0,0.4);text-transform:uppercase;\">Vos numeros de tickets</p>"
    + "<div style=\"margin-bottom:20px;\">" + ticketList + "</div>"
    + "<p style=\"margin:0;font-size:12px;color:rgba(0,0,0,0.4);\">Conservez cet email &mdash; vos numeros sont votre preuve de participation</p>"
    + "</div></td></tr>"
    + "<tr><td style=\"background:#ffffff;padding:0 40px 40px;\">"
    + "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"border-top:1px solid rgba(0,0,0,0.08);padding-top:24px;\">"
    + "<tr><td colspan=\"2\" style=\"padding:0 0 14px;font-size:10px;letter-spacing:3px;color:rgba(0,0,0,0.4);text-transform:uppercase;\">Recapitulatif</td></tr>"
    + "<tr><td style=\"padding:6px 0;color:#1a1a1a;font-size:14px;\">Tirage</td><td style=\"padding:6px 0;color:#1a1a1a;font-size:14px;text-align:right;font-weight:600;\">" + drawTitle + " &mdash; " + (drawLocation || "") + "</td></tr>"
    + "<tr><td style=\"padding:6px 0;color:rgba(0,0,0,0.5);font-size:14px;\">Tickets achetes</td><td style=\"padding:6px 0;color:rgba(0,0,0,0.5);font-size:14px;text-align:right;\">" + qty + "x</td></tr>"
    + packRow
    + discountRow
    + orderRow
    + "<tr style=\"border-top:1px solid rgba(0,0,0,0.08);\"><td style=\"padding:14px 0 0;color:#1a1a1a;font-size:16px;font-weight:700;\">Total paye</td><td style=\"padding:14px 0 0;color:#1a1a1a;font-size:22px;font-weight:300;text-align:right;letter-spacing:1px;\">" + total + "$</td></tr>"
    + "</table></td></tr>"
    + "<tr><td style=\"background:#1a1a1a;padding:32px 40px;\">"
    + "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\"><tr><td>"
    + "<p style=\"margin:0 0 4px;font-size:10px;letter-spacing:3px;color:rgba(255,255,255,0.4);text-transform:uppercase;\">Date du tirage</p>"
    + "<p style=\"margin:0;font-size:22px;font-weight:300;color:#ffffff;letter-spacing:1px;\">" + drawDateStr + "</p>"
    + "</td><td style=\"text-align:right;font-size:40px;\">&#128250;</td></tr></table>"
    + "</td></tr>"
    + "<tr><td style=\"background:#ffffff;padding:32px 40px;\">"
    + "<p style=\"margin:0 0 16px;font-size:10px;letter-spacing:3px;color:rgba(0,0,0,0.4);text-transform:uppercase;\">Comment suivre le tirage</p>"
    + "<div style=\"background:#f8f6f2;border-radius:10px;padding:20px;\">"
    + "<p style=\"margin:0;font-size:14px;color:rgba(0,0,0,0.6);line-height:1.7;\">Le tirage sera diffuse <strong style=\"color:#1a1a1a;\">en direct</strong> sur nos reseaux sociaux. Le numero gagnant sera tire publiquement. Le gagnant sera contacte par email sous <strong style=\"color:#1a1a1a;\">48h</strong>.</p>"
    + "</div></td></tr>"
    + "<tr><td style=\"background:#ffffff;padding:0 40px 48px;text-align:center;\">"
    + "<a href=\"" + SITE_URL + "\" style=\"display:inline-block;background:#1a1a1a;color:#f0ede7;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:12px;font-weight:700;letter-spacing:2px;\">VOIR TOUS LES TIRAGES</a>"
    + "</td></tr>"
    + "<tr><td style=\"background:#f0ede7;padding:28px 40px;border-radius:0 0 16px 16px;text-align:center;border-top:1px solid rgba(0,0,0,0.08);\">"
    + "<p style=\"margin:0 0 8px;font-size:12px;color:rgba(0,0,0,0.4);\">Une question ? <a href=\"mailto:contact@olawin.org\" style=\"color:#1a1a1a;font-weight:600;\">contact@olawin.org</a></p>"
    + "<p style=\"margin:0;font-size:11px;color:rgba(0,0,0,0.3);\">2026 Olawin - Partenaire officiel hotels.privatehonors.com</p>"
    + "</td></tr>"
    + "</table></td></tr></table></body></html>";

  return sendEmail({
    to: email,
    subject: "Vos " + qty + " ticket" + (qty > 1 ? "s" : "") + " - " + drawTitle + " " + (drawLocation || ""),
    html: html,
  });
}

export async function sendAdminNotification({
  firstName, lastName, email, phone, address,
  drawTitle, drawLocation, drawCountry,
  ticketNums, qty, total, pack, orderId,
}) {
  const ticketsStr = ticketNums.map(function(n) { return "#" + String(n).padStart(3, "0"); }).join(", ");

  const html = "<!DOCTYPE html><html lang=\"fr\"><head><meta charset=\"UTF-8\"></head><body style=\"margin:0;padding:0;background:#f5f2ed;font-family:Helvetica Neue,Arial,sans-serif;\">"
    + "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#f5f2ed;padding:40px 20px;\"><tr><td align=\"center\">"
    + "<table width=\"560\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:560px;width:100%;\">"
    + "<tr><td style=\"background:#1a1a1a;padding:24px 32px;border-radius:14px 14px 0 0;\">"
    + "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\"><tr>"
    + "<td><span style=\"font-family:Georgia,serif;font-size:18px;font-weight:300;letter-spacing:5px;color:#ffffff;\">OLAWIN</span><span style=\"font-size:11px;letter-spacing:2px;color:rgba(255,255,255,0.4);margin-left:16px;text-transform:uppercase;\">Admin</span></td>"
    + "<td style=\"text-align:right;\"><span style=\"background:rgba(0,200,80,0.2);border:1px solid rgba(0,200,80,0.3);border-radius:20px;padding:4px 12px;font-size:11px;color:rgba(0,200,80,0.9);letter-spacing:1px;\">NOUVELLE VENTE</span></td>"
    + "</tr></table></td></tr>"
    + "<tr><td style=\"background:#ffffff;padding:36px 32px 24px;text-align:center;\">"
    + "<p style=\"margin:0 0 6px;font-size:11px;letter-spacing:3px;color:rgba(0,0,0,0.4);text-transform:uppercase;\">Montant encaisse</p>"
    + "<p style=\"margin:0;font-size:48px;font-weight:300;color:#1a1a1a;letter-spacing:2px;\">" + total + "$</p>"
    + "<p style=\"margin:8px 0 0;font-size:14px;color:rgba(0,0,0,0.5);\">" + qty + " ticket" + (qty > 1 ? "s" : "") + " - " + (drawCountry || "") + " " + drawTitle + " - " + (drawLocation || "") + (pack ? " - " + pack : "") + "</p>"
    + "</td></tr>"
    + "<tr><td style=\"background:#ffffff;padding:0 32px 32px;\">"
    + "<div style=\"background:#f8f6f2;border:1px solid rgba(0,0,0,0.08);border-radius:12px;padding:20px;\">"
    + "<p style=\"margin:0 0 14px;font-size:10px;letter-spacing:3px;color:rgba(0,0,0,0.4);text-transform:uppercase;\">Informations client</p>"
    + "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\">"
    + "<tr><td style=\"padding:5px 0;font-size:12px;color:rgba(0,0,0,0.4);width:110px;\">Nom</td><td style=\"padding:5px 0;font-size:13px;color:#1a1a1a;font-weight:500;\">" + firstName + " " + lastName + "</td></tr>"
    + "<tr><td style=\"padding:5px 0;font-size:12px;color:rgba(0,0,0,0.4);\">Email</td><td style=\"padding:5px 0;font-size:13px;color:#1a1a1a;font-weight:500;\">" + email + "</td></tr>"
    + "<tr><td style=\"padding:5px 0;font-size:12px;color:rgba(0,0,0,0.4);\">Telephone</td><td style=\"padding:5px 0;font-size:13px;color:#1a1a1a;font-weight:500;\">" + phone + "</td></tr>"
    + "<tr><td style=\"padding:5px 0;font-size:12px;color:rgba(0,0,0,0.4);\">Adresse</td><td style=\"padding:5px 0;font-size:13px;color:#1a1a1a;font-weight:500;\">" + address + "</td></tr>"
    + "<tr><td style=\"padding:5px 0;font-size:12px;color:rgba(0,0,0,0.4);\">Tickets</td><td style=\"padding:5px 0;font-size:13px;color:#1a1a1a;font-weight:500;\">" + ticketsStr + "</td></tr>"
    + "<tr><td style=\"padding:5px 0;font-size:12px;color:rgba(0,0,0,0.4);\">ID Commande</td><td style=\"padding:5px 0;font-size:13px;color:#1a1a1a;font-weight:500;\">OLA-" + (orderId || "") + "</td></tr>"
    + "</table></div></td></tr>"
    + "<tr><td style=\"background:#ffffff;padding:0 32px 36px;\">"
    + "<a href=\"" + SITE_URL + "/admin\" style=\"display:block;background:#1a1a1a;color:#f0ede7;text-decoration:none;padding:14px;border-radius:10px;font-size:12px;font-weight:700;letter-spacing:2px;text-align:center;\">VOIR DANS LADMIN</a>"
    + "</td></tr>"
    + "<tr><td style=\"background:#f0ede7;padding:20px 32px;border-radius:0 0 14px 14px;text-align:center;border-top:1px solid rgba(0,0,0,0.08);\">"
    + "<p style=\"margin:0;font-size:11px;color:rgba(0,0,0,0.35);\">Olawin Admin - Email automatique</p>"
    + "</td></tr>"
    + "</table></td></tr></table></body></html>";

  return sendEmail({
    to: ADMIN_EMAIL,
    subject: "Nouvelle vente " + total + "$ - " + firstName + " " + lastName + " - " + qty + " ticket" + (qty > 1 ? "s" : ""),
    html: html,
  });
}

export async function sendWinnerEmail({
  firstName, lastName, email,
  drawTitle, drawLocation, drawCountry,
  prize, partner, ticketNum,
}) {
  const html = "<!DOCTYPE html><html lang=\"fr\"><head><meta charset=\"UTF-8\"></head><body style=\"margin:0;padding:0;background:#f5f2ed;font-family:Helvetica Neue,Arial,sans-serif;\">"
    + "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#f5f2ed;padding:40px 20px;\"><tr><td align=\"center\">"
    + "<table width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:600px;width:100%;\">"
    + "<tr><td style=\"background:linear-gradient(135deg,#1a1a1a 0%,#333 100%);padding:48px 40px;border-radius:16px 16px 0 0;text-align:center;\">"
    + "<div style=\"font-size:64px;margin-bottom:16px;\">&#127942;</div>"
    + "<p style=\"margin:0 0 8px;font-size:12px;letter-spacing:4px;color:rgba(255,255,255,0.5);text-transform:uppercase;\">Felicitations</p>"
    + "<h1 style=\"margin:0;font-size:36px;font-weight:300;color:#ffffff;letter-spacing:2px;\">Vous avez gagne !</h1>"
    + "</td></tr>"
    + "<tr><td style=\"background:#ffffff;padding:48px 40px 32px;text-align:center;\">"
    + "<p style=\"margin:0 0 24px;font-size:18px;color:#1a1a1a;line-height:1.7;\">Bravo <strong>" + firstName + " " + lastName + "</strong> !<br>Votre ticket <strong style=\"font-family:Courier New,monospace;font-size:20px;\">#" + String(ticketNum).padStart(3, "0") + "</strong> a ete tire au sort.</p>"
    + "<div style=\"background:#f8f6f2;border:1px solid rgba(0,0,0,0.1);border-radius:14px;padding:28px;margin-bottom:24px;\">"
    + "<p style=\"margin:0 0 10px;font-size:10px;letter-spacing:3px;color:rgba(0,0,0,0.4);text-transform:uppercase;\">Votre prix</p>"
    + "<p style=\"margin:0 0 8px;font-size:28px;font-weight:300;color:#1a1a1a;\">" + (prize || "Un voyage exceptionnel") + "</p>"
    + "<p style=\"margin:0;font-size:14px;color:rgba(0,0,0,0.5);\">" + (drawCountry || "") + " " + drawTitle + " - " + (drawLocation || "") + "</p>"
    + "</div></td></tr>"
    + "<tr><td style=\"background:#ffffff;padding:0 40px 40px;text-align:center;\">"
    + "<div style=\"background:#1a1a1a;border-radius:14px;padding:32px;\">"
    + "<p style=\"margin:0 0 16px;font-size:14px;color:#ffffff;line-height:1.7;\">Notre equipe vous contactera dans les <strong>48h</strong> pour vous remettre votre bon " + (partner || "PrivateHonors") + " et organiser les details de votre prix.</p>"
    + "<a href=\"mailto:contact@olawin.org\" style=\"display:inline-block;background:#ffffff;color:#1a1a1a;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:12px;font-weight:700;letter-spacing:2px;\">CONTACTER L EQUIPE</a>"
    + "</div></td></tr>"
    + "<tr><td style=\"background:#ffffff;padding:0 40px 48px;\">"
    + "<div style=\"background:#f8f6f2;border-radius:10px;padding:16px;\">"
    + "<p style=\"margin:0;font-size:13px;color:rgba(0,0,0,0.5);\">Une question ? <a href=\"mailto:contact@olawin.org\" style=\"color:#1a1a1a;\">contact@olawin.org</a></p>"
    + "</div></td></tr>"
    + "<tr><td style=\"background:#f0ede7;padding:28px 40px;border-radius:0 0 16px 16px;text-align:center;border-top:1px solid rgba(0,0,0,0.08);\">"
    + "<p style=\"margin:0;font-size:11px;color:rgba(0,0,0,0.35);\">2026 Olawin - Partenaire officiel " + (partner || "PrivateHonors") + "</p>"
    + "</td></tr>"
    + "</table></td></tr></table></body></html>";

  return sendEmail({
    to: email,
    subject: "Vous avez gagne ! " + drawTitle + " - " + (drawLocation || ""),
    html: html,
  });
}
