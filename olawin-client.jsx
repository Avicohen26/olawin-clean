// olawin-client.jsx
import { useState, useEffect, useRef } from "react";
import { db } from "./firebase";
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, doc, updateDoc, increment, where, getDocs, getDoc } from "firebase/firestore";
import { sendTicketConfirmation, sendAdminNotification } from "./emails";

const T = {
  en: {
    nav: { draws:"Draws", faq:"FAQ", legal:"Legal", buy:"BUY", myTickets:"MY TICKETS" },
    hero: { live:"DRAWING ON", buyTicket:"BUY A TICKET", remaining:"tickets remaining out of", ticketsWord:"tickets" },
    section: { thisWeek:"THIS WEEK", allDraws:"ALL DRAWS", activeDraws:"active draws", howItWorks:"HOW IT WORKS", process:"PROCESS", upcoming:"UPCOMING", past:"PAST DRAWS" },
    countdown: { d:"d", h:"h", m:"m", s:"s", closed:"SALES CLOSED", drawing:"DRAW SOON" },
    stats: { active:"ACTIVE DRAWS", value:"TOTAL VALUE", remaining:"TICKETS LEFT", countries:"ELIGIBLE COUNTRIES" },
    cta: { tryLuck:"TRY YOUR LUCK", viewDraws:"VIEW DRAWS", active:"active draw" },
    empty: { title:"NO DRAW IN PROGRESS", sub:"Come back soon, new draws every week!" },
    loading: "LOADING...",
    partner: "WITH OUR PARTNER",
    partnerMobile: "OUR PARTNER",
    finished: "FINISHED",
    winnerLabel: "WINNER",
    verifyCert: "Verify the certificate",
    steps: [
      { title:"Choose", desc:"Select the draw and your tickets." },
      { title:"Pay", desc:"100% secure payment via Stripe." },
      { title:"Track", desc:"Receive your ticket number by email." },
      { title:"Win", desc:"Live draw streamed on our channels." }
    ],
    shop: { back:"Back", notFound:"Draw not found.", returnHome:"Return", reserve:"RESERVE YOUR TICKETS", perTicket:"/ TICKET", individual:"INDIVIDUAL TICKETS", total:"TOTAL", continueBtn:"CONTINUE", tickets:"tickets", drawDate:"Draw date", salesClose:"Sales close" },
    confirm: { back:"BACK", title:"YOUR INFORMATION", firstName:"FIRST NAME *", lastName:"LAST NAME *", email:"EMAIL *", phone:"PHONE *", street:"STREET *", zip:"ZIP *", city:"CITY *", country:"COUNTRY *", countryPlaceholder:"Select...", pay:"PAY", payVia:"VIA STRIPE", processing:"PROCESSING...", bookingError:"An error occurred during booking." },
    success: { title:"GOOD LUCK!", msg:"Your tickets are registered.", home:"HOME", orderNum:"YOUR ORDER NUMBER", saveIt:"Save this number to retrieve your tickets later." },
    myTickets: { title:"MY TICKETS", subtitle:"Enter your email and order number to view your tickets.", emailLabel:"EMAIL *", orderLabel:"ORDER NUMBER *", orderHint:"6 characters - found in your confirmation email.", search:"SEARCH", searching:"SEARCHING...", notFound:"No order found. Please check your email and order number.", found:"YOUR TICKETS", logout:"NEW SEARCH", ticketsLabel:"Ticket numbers:", orderDate:"Ordered on", totalPaid:"Total paid" },
    faq: {
      title:"FAQ",
      items: [
        { q:"How does the draw work?", a:"At the closing date, a certified random draw is performed live on our channels." },
        { q:"When do I receive my ticket?", a:"Immediately after Stripe payment, a confirmation email is sent automatically." },
        { q:"What happens if not all tickets are sold?", a:"The draw still takes place. Your chances increase." },
        { q:"How do I use the PrivateHonors voucher?", a:"The winner receives a code by email within 48h." },
        { q:"Is payment secure?", a:"100%. Stripe does not store any banking data." }
      ]
    },
    legal: { title:"LEGAL", body:"Terms and conditions of use. Any person of legal age may participate. The draw is conducted publicly. The winner receives a voucher within 48 hours." },
    footer: { copyright:"2026 Olawin.", contact:"Contact" }
  },
  fr: {
    nav: { draws:"Tirages", faq:"FAQ", legal:"Legal", buy:"ACHETER", myTickets:"MES TICKETS" },
hero: { live:"TIRAGE LE", buyTicket:"ACHETER UN TICKET", remaining:"tickets restants sur", ticketsWord:"tickets" },    section: { thisWeek:"CETTE SEMAINE", allDraws:"TOUS LES TIRAGES", activeDraws:"tirage(s) actif(s)", howItWorks:"COMMENT CA MARCHE", process:"PROCESSUS", upcoming:"A VENIR", past:"TIRAGES PASSES" },
    countdown: { d:"j", h:"h", m:"m", s:"s", closed:"VENTES FERMEES", drawing:"TIRAGE IMMINENT" },
    stats: { active:"TIRAGES ACTIFS", value:"VALEUR TOTALE", remaining:"TICKETS RESTANTS", countries:"PAYS ELIGIBLES" },
    cta: { tryLuck:"TENTEZ VOTRE CHANCE", viewDraws:"VOIR LES TIRAGES", active:"tirage(s) actif(s)" },
    empty: { title:"AUCUN TIRAGE EN COURS", sub:"Revenez bientot, de nouveaux tirages chaque semaine!" },
    loading: "CHARGEMENT...",
    partner: "AVEC NOTRE PARTENAIRE",
    partnerMobile: "NOTRE PARTENAIRE",
    finished: "TERMINE",
    winnerLabel: "GAGNANT",
    verifyCert: "Verifier le certificat",
    steps: [
      { title:"Choisissez", desc:"Selectionnez le tirage et vos tickets." },
      { title:"Payez", desc:"Paiement 100% securise via Stripe." },
      { title:"Suivez", desc:"Recevez votre numero de ticket par email." },
      { title:"Gagnez", desc:"Le tirage en direct est diffuse sur nos reseaux." }
    ],
    shop: { back:"Retour", notFound:"Tirage introuvable.", returnHome:"Retour", reserve:"RESERVER VOS TICKETS", perTicket:"/ TICKET", individual:"TICKETS INDIVIDUELS", total:"TOTAL", continueBtn:"CONTINUER", tickets:"tickets", drawDate:"Date du tirage", salesClose:"Cloture des ventes" },
    confirm: { back:"RETOUR", title:"VOS INFORMATIONS", firstName:"PRENOM *", lastName:"NOM *", email:"EMAIL *", phone:"TELEPHONE *", street:"RUE *", zip:"CP *", city:"VILLE *", country:"PAYS *", countryPlaceholder:"Selectionner...", pay:"PAYER", payVia:"VIA STRIPE", processing:"EN COURS...", bookingError:"Erreur lors de la reservation." },
    success: { title:"BONNE CHANCE!", msg:"Vos tickets sont enregistres.", home:"ACCUEIL", orderNum:"VOTRE NUMERO DE COMMANDE", saveIt:"Conservez ce numero pour retrouver vos tickets plus tard." },
    myTickets: { title:"MES TICKETS", subtitle:"Entrez votre email et numero de commande pour voir vos tickets.", emailLabel:"EMAIL *", orderLabel:"NUMERO DE COMMANDE *", orderHint:"6 caracteres - trouve dans votre email de confirmation.", search:"RECHERCHER", searching:"RECHERCHE...", notFound:"Aucune commande trouvee. Verifiez votre email et numero de commande.", found:"VOS TICKETS", logout:"NOUVELLE RECHERCHE", ticketsLabel:"Numeros de tickets:", orderDate:"Commande du", totalPaid:"Total paye" },
    faq: {
      title:"FAQ",
      items: [
        { q:"Comment fonctionne le tirage?", a:"A la date de cloture, un tirage aleatoire certifie est effectue en live sur nos reseaux." },
        { q:"Quand je recois mon ticket?", a:"Immediatement apres paiement Stripe, un email de confirmation vous est envoye automatiquement." },
        { q:"Que se passe-t-il si les tickets ne sont pas tous vendus?", a:"Le tirage se tient quand meme. Vos chances augmentent." },
        { q:"Comment utiliser le bon PrivateHonors?", a:"Le gagnant recoit un code par email dans les 48h." },
        { q:"Le paiement est-il securise?", a:"100%. Stripe ne stocke aucune donnee bancaire." }
      ]
    },
    legal: { title:"LEGAL", body:"Conditions generales d utilisation. Toute personne majeure peut participer. Le tirage est effectue publiquement. Le gagnant recoit un bon dans les 48h." },
    footer: { copyright:"2026 Olawin.", contact:"Contact" }
  },
  es: {
    nav: { draws:"Sorteos", faq:"FAQ", legal:"Legal", buy:"COMPRAR", myTickets:"MIS BOLETOS" },
    hero: { live:"SORTEO EL", buyTicket:"COMPRAR UN BOLETO", remaining:"boletos restantes de", ticketsWord:"boletos" },
    section: { thisWeek:"ESTA SEMANA", allDraws:"TODOS LOS SORTEOS", activeDraws:"sorteo(s) activo(s)", howItWorks:"COMO FUNCIONA", process:"PROCESO", upcoming:"PROXIMOS", past:"SORTEOS PASADOS" },
    countdown: { d:"d", h:"h", m:"m", s:"s", closed:"VENTAS CERRADAS", drawing:"SORTEO INMINENTE" },
    stats: { active:"SORTEOS ACTIVOS", value:"VALOR TOTAL", remaining:"BOLETOS DISPONIBLES", countries:"PAISES ELEGIBLES" },
    cta: { tryLuck:"PRUEBA TU SUERTE", viewDraws:"VER SORTEOS", active:"sorteo(s) activo(s)" },
    empty: { title:"NINGUN SORTEO EN CURSO", sub:"Vuelve pronto, nuevos sorteos cada semana!" },
    loading: "CARGANDO...",
    partner: "CON NUESTRO SOCIO",
    partnerMobile: "NUESTRO SOCIO",
    finished: "TERMINADO",
    winnerLabel: "GANADOR",
    verifyCert: "Verificar el certificado",
    steps: [
      { title:"Elige", desc:"Selecciona el sorteo y tus boletos." },
      { title:"Paga", desc:"Pago 100% seguro via Stripe." },
      { title:"Sigue", desc:"Recibe tu numero de boleto por email." },
      { title:"Gana", desc:"Sorteo en vivo transmitido en nuestras redes." }
    ],
    shop: { back:"Atras", notFound:"Sorteo no encontrado.", returnHome:"Volver", reserve:"RESERVA TUS BOLETOS", perTicket:"/ BOLETO", individual:"BOLETOS INDIVIDUALES", total:"TOTAL", continueBtn:"CONTINUAR", tickets:"boletos", drawDate:"Fecha del sorteo", salesClose:"Cierre de ventas" },
    confirm: { back:"ATRAS", title:"TUS DATOS", firstName:"NOMBRE *", lastName:"APELLIDO *", email:"EMAIL *", phone:"TELEFONO *", street:"CALLE *", zip:"CP *", city:"CIUDAD *", country:"PAIS *", countryPlaceholder:"Seleccionar...", pay:"PAGAR", payVia:"VIA STRIPE", processing:"PROCESANDO...", bookingError:"Error en la reserva." },
    success: { title:"BUENA SUERTE!", msg:"Tus boletos estan registrados.", home:"INICIO", orderNum:"TU NUMERO DE PEDIDO", saveIt:"Guarda este numero para encontrar tus boletos mas tarde." },
    myTickets: { title:"MIS BOLETOS", subtitle:"Ingresa tu email y numero de pedido para ver tus boletos.", emailLabel:"EMAIL *", orderLabel:"NUMERO DE PEDIDO *", orderHint:"6 caracteres - en tu email de confirmacion.", search:"BUSCAR", searching:"BUSCANDO...", notFound:"No se encontro el pedido. Verifica tu email y numero.", found:"TUS BOLETOS", logout:"NUEVA BUSQUEDA", ticketsLabel:"Numeros de boletos:", orderDate:"Pedido del", totalPaid:"Total pagado" },
    faq: {
      title:"FAQ",
      items: [
        { q:"Como funciona el sorteo?", a:"En la fecha de cierre, se realiza un sorteo aleatorio certificado en vivo en nuestras redes." },
        { q:"Cuando recibo mi boleto?", a:"Inmediatamente despues del pago con Stripe, se envia un email de confirmacion automaticamente." },
        { q:"Que pasa si no se venden todos los boletos?", a:"El sorteo se realiza igualmente. Tus posibilidades aumentan." },
        { q:"Como uso el bono PrivateHonors?", a:"El ganador recibe un codigo por email en las 48h." },
        { q:"Es seguro el pago?", a:"100%. Stripe no almacena ningun dato bancario." }
      ]
    },
    legal: { title:"LEGAL", body:"Terminos y condiciones de uso. Cualquier persona mayor de edad puede participar. El sorteo se realiza publicamente. El ganador recibe un bono en un plazo de 48 horas." },
    footer: { copyright:"2026 Olawin.", contact:"Contacto" }
  }
};
function trd(draw, key){ if(!draw) return ""; var L=""; try{ L=localStorage.getItem("olawin_lang")||""; }catch(e){} var sfx = L==="en" ? "En" : L==="es" ? "Es" : ""; return draw[key+sfx] || draw[key] || ""; }
const QUIZ = [{q:{fr:"Dans quel pays se trouve Marrakech ?",en:"In which country is Marrakech located?",es:"En que pais se encuentra Marrakech?"},opts:["Maroc","Tunisie","Egypte","Algerie"],a:0},{q:{fr:"Dans quel pays se trouve Dubai ?",en:"In which country is Dubai located?",es:"En que pais se encuentra Dubai?"},opts:["Emirats Arabes Unis","Qatar","Oman","Koweit"],a:0},{q:{fr:"Dans quel pays se trouve Bali ?",en:"In which country is Bali located?",es:"En que pais se encuentra Bali?"},opts:["Indonesie","Thailande","Malaisie","Philippines"],a:0},{q:{fr:"Dans quel pays se trouve Santorin ?",en:"In which country is Santorini located?",es:"En que pais se encuentra Santorini?"},opts:["Grece","Italie","Espagne","Turquie"],a:0},{q:{fr:"Dans quel pays se trouve Cancun ?",en:"In which country is Cancun located?",es:"En que pais se encuentra Cancun?"},opts:["Mexique","Bresil","Cuba","Perou"],a:0},{q:{fr:"Dans quel pays se trouve Venise ?",en:"In which country is Venice located?",es:"En que pais se encuentra Venecia?"},opts:["Italie","France","Croatie","Grece"],a:0},{q:{fr:"Dans quel pays se trouve Le Cap ?",en:"In which country is Cape Town located?",es:"En que pais se encuentra Ciudad del Cabo?"},opts:["Afrique du Sud","Kenya","Namibie","Maroc"],a:0},{q:{fr:"Dans quel pays se trouve Bangkok ?",en:"In which country is Bangkok located?",es:"En que pais se encuentra Bangkok?"},opts:["Thailande","Vietnam","Cambodge","Laos"],a:0}];
const PACKS = [
{ qty: 15, discount: 10 },
{ qty: 25, discount: 15 },
{ qty: 50, discount: 20 }
];

const TICKET_OPTS = [1,2,3,4,5,6,7,8,9,10];
const C_BG = "#D8D4CE";
const PARTNER_LOGO = "https://raw.githubusercontent.com/Avicohen26/olawin-clean/main/private-honors-logo.png";

const COUNTRY_CODES = [
  { code:"+1", name:"USA / Canada" },{ code:"+33", name:"France" },{ code:"+44", name:"United Kingdom" },{ code:"+34", name:"Espana" },{ code:"+49", name:"Deutschland" },{ code:"+39", name:"Italia" },{ code:"+351", name:"Portugal" },{ code:"+32", name:"Belgique" },{ code:"+41", name:"Suisse" },{ code:"+31", name:"Nederland" },{ code:"+43", name:"Osterreich" },{ code:"+45", name:"Danmark" },{ code:"+46", name:"Sverige" },{ code:"+47", name:"Norge" },{ code:"+358", name:"Suomi" },{ code:"+353", name:"Ireland" },{ code:"+30", name:"Greece" },{ code:"+48", name:"Polska" },{ code:"+420", name:"Czech Republic" },{ code:"+36", name:"Magyarorszag" },{ code:"+40", name:"Romania" },{ code:"+359", name:"Bulgaria" },{ code:"+385", name:"Hrvatska" },{ code:"+386", name:"Slovenija" },{ code:"+421", name:"Slovensko" },{ code:"+371", name:"Latvija" },{ code:"+370", name:"Lietuva" },{ code:"+372", name:"Eesti" },{ code:"+352", name:"Luxembourg" },{ code:"+377", name:"Monaco" },{ code:"+90", name:"Turkiye" },{ code:"+7", name:"Russia" },{ code:"+380", name:"Ukraine" },{ code:"+212", name:"Maroc" },{ code:"+213", name:"Algerie" },{ code:"+216", name:"Tunisie" },{ code:"+20", name:"Egypt" },{ code:"+218", name:"Libya" },{ code:"+221", name:"Senegal" },{ code:"+225", name:"Cote d Ivoire" },{ code:"+229", name:"Benin" },{ code:"+237", name:"Cameroun" },{ code:"+241", name:"Gabon" },{ code:"+242", name:"Congo" },{ code:"+243", name:"DR Congo" },{ code:"+244", name:"Angola" },{ code:"+27", name:"South Africa" },{ code:"+234", name:"Nigeria" },{ code:"+233", name:"Ghana" },{ code:"+254", name:"Kenya" },{ code:"+972", name:"Israel" },{ code:"+961", name:"Liban" },{ code:"+962", name:"Jordan" },{ code:"+966", name:"Saudi Arabia" },{ code:"+971", name:"UAE" },{ code:"+974", name:"Qatar" },{ code:"+965", name:"Kuwait" },{ code:"+973", name:"Bahrain" },{ code:"+968", name:"Oman" },{ code:"+98", name:"Iran" },{ code:"+92", name:"Pakistan" },{ code:"+91", name:"India" },{ code:"+880", name:"Bangladesh" },{ code:"+94", name:"Sri Lanka" },{ code:"+977", name:"Nepal" },{ code:"+66", name:"Thailand" },{ code:"+84", name:"Vietnam" },{ code:"+62", name:"Indonesia" },{ code:"+60", name:"Malaysia" },{ code:"+65", name:"Singapore" },{ code:"+63", name:"Philippines" },{ code:"+86", name:"China" },{ code:"+852", name:"Hong Kong" },{ code:"+853", name:"Macau" },{ code:"+886", name:"Taiwan" },{ code:"+81", name:"Japan" },{ code:"+82", name:"South Korea" },{ code:"+52", name:"Mexico" },{ code:"+55", name:"Brasil" },{ code:"+54", name:"Argentina" },{ code:"+56", name:"Chile" },{ code:"+57", name:"Colombia" },{ code:"+58", name:"Venezuela" },{ code:"+51", name:"Peru" },{ code:"+593", name:"Ecuador" },{ code:"+598", name:"Uruguay" },{ code:"+595", name:"Paraguay" },{ code:"+591", name:"Bolivia" },{ code:"+506", name:"Costa Rica" },{ code:"+507", name:"Panama" },{ code:"+61", name:"Australia" },{ code:"+64", name:"New Zealand" }
];

const COUNTRIES = ["Afrique du Sud","Algerie","Allemagne","Angola","Arabie Saoudite","Argentine","Australie","Autriche","Bahrein","Bangladesh","Belgique","Benin","Bolivie","Bosnie","Bresil","Bulgarie","Cameroun","Canada","Chili","Chine","Chypre","Colombie","Congo","Coree du Sud","Costa Rica","Cote d Ivoire","Croatie","Danemark","Egypte","Emirats Arabes Unis","Equateur","Espagne","Estonie","Etats-Unis","Finlande","France","Gabon","Ghana","Grece","Guatemala","Hong Kong","Hongrie","Inde","Indonesie","Iran","Irlande","Islande","Israel","Italie","Japon","Jordanie","Kenya","Koweit","Lettonie","Liban","Libye","Lituanie","Luxembourg","Macao","Madagascar","Malaisie","Mali","Malte","Maroc","Mexique","Moldavie","Monaco","Mongolie","Montenegro","Mozambique","Namibie","Nepal","Nicaragua","Niger","Nigeria","Norvege","Nouvelle-Zelande","Oman","Ouganda","Pakistan","Panama","Paraguay","Pays-Bas","Perou","Philippines","Pologne","Portugal","Qatar","Republique Tcheque","Roumanie","Royaume-Uni","Russie","Rwanda","Senegal","Serbie","Singapour","Slovaquie","Slovenie","Sri Lanka","Suede","Suisse","Taiwan","Tanzanie","Thailande","Tunisie","Turquie","Ukraine","Uruguay","Venezuela","Vietnam","Yemen","Zambie","Zimbabwe"];

const INP = { width:"100%", padding:"13px 16px", background:"rgba(0,0,0,0.04)", border:"1px solid rgba(0,0,0,0.12)", borderRadius:"10px", color:"#1A1A1A", fontSize:"16px", fontFamily:"DM Sans, sans-serif", boxSizing:"border-box" };
const LBL = { fontSize:"9px", letterSpacing:"2.5px", color:"rgba(0,0,0,0.4)", marginBottom:"7px", fontFamily:"DM Sans, sans-serif", display:"block" };

const TEXT_SHADOW_STRONG = "0 2px 8px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.9)";

function genOrderNumber() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
  return out;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(function() {
    const check = function() { setIsMobile(window.innerWidth < 768); };
    check();
    window.addEventListener("resize", check);
    return function() { window.removeEventListener("resize", check); };
  }, []);
  return isMobile;
}

function useCountdown(endDate) {
  const [tl, setTl] = useState({ days:0, hours:0, minutes:0, seconds:0, total:0 });
  useEffect(function() {
    if (!endDate) return;
    const target = new Date(endDate).getTime();
    const tick = function() {
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) {
        setTl({ days:0, hours:0, minutes:0, seconds:0, total:0 });
        return;
      }
      const days = Math.floor(diff / (1000*60*60*24));
      const hours = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
      const minutes = Math.floor((diff % (1000*60*60)) / (1000*60));
      const seconds = Math.floor((diff % (1000*60)) / 1000);
      setTl({ days, hours, minutes, seconds, total: diff });
    };
    tick();
    const itv = setInterval(tick, 1000);
    return function() { clearInterval(itv); };
  }, [endDate]);
  return tl;
}

function OlawinLogo(props) {
  const size = props.size || 36;
  const showText = props.showText !== false;
  return (
    <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <polygon points="20,2 38,20 20,38 2,20" fill="none" stroke="#1A1A1A" strokeWidth="1.5"></polygon>
        <circle cx="20" cy="20" r="7" fill="none" stroke="#1A1A1A" strokeWidth="1.5"></circle>
        <circle cx="20" cy="6" r="1.5" fill="#1A1A1A"></circle>
        <circle cx="34" cy="20" r="1.5" fill="#1A1A1A"></circle>
        <circle cx="20" cy="34" r="1.5" fill="#1A1A1A"></circle>
        <circle cx="6" cy="20" r="1.5" fill="#1A1A1A"></circle>
      </svg>
      {showText ? <span style={{fontSize:size*0.52,letterSpacing:"5px",fontFamily:"Montserrat, sans-serif",color:"#1A1A1A",lineHeight:1,fontWeight:"500"}}>OLAWIN</span> : null}
    </div>
  );
}

function ArcProgress(props) {
  const pct = props.pct;
  const label = props.label;
  const r = 70;
  const circ = 2 * Math.PI * r;
  return (
    <svg width="140" height="140" viewBox="0 0 160 160">
      <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="6"></circle>
      <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(0,0,0,0.75)" strokeWidth="6" strokeDasharray={circ} strokeDashoffset={circ-(pct/100)*circ} strokeLinecap="round" transform="rotate(-90 80 80)"></circle>
      <text x="80" y="74" textAnchor="middle" fill="#111" fontSize="26" fontFamily="Bebas Neue, sans-serif">{pct}%</text>
      <text x="80" y="90" textAnchor="middle" fill="rgba(0,0,0,0.4)" fontSize="9" fontFamily="sans-serif" letterSpacing="2">{label}</text>
    </svg>
  );
}

function Countdown(props) {
  const tl = useCountdown(props.endDate);
  const t = props.t;
  const compact = props.compact;
  if (tl.total <= 0) return <span style={{fontSize:compact?"11px":"13px",letterSpacing:"1.5px",color:"#ff4444",fontWeight:"700"}}>{t.countdown.closed}</span>;
  const isUrgent = tl.total < 24*60*60*1000;
  const c = isUrgent ? "#ff4444" : "#ffffff";
  const pad = function(n) { return String(n).padStart(2,"0"); };
  return (
    <div style={{display:"inline-flex",alignItems:"center",gap:compact?"4px":"8px",fontFamily:"Bebas Neue, sans-serif",fontWeight:"700"}}>
      <span style={{fontSize:compact?"14px":"18px",color:c,letterSpacing:"1px"}}>{tl.days}{t.countdown.d}</span>
      <span style={{opacity:0.5,color:c}}>:</span>
      <span style={{fontSize:compact?"14px":"18px",color:c,letterSpacing:"1px"}}>{pad(tl.hours)}{t.countdown.h}</span>
      <span style={{opacity:0.5,color:c}}>:</span>
      <span style={{fontSize:compact?"14px":"18px",color:c,letterSpacing:"1px"}}>{pad(tl.minutes)}{t.countdown.m}</span>
      <span style={{opacity:0.5,color:c}}>:</span>
      <span style={{fontSize:compact?"14px":"18px",color:c,letterSpacing:"1px"}}>{pad(tl.seconds)}{t.countdown.s}</span>
    </div>
  );
}

function DrawCard(props) {
  const draw = props.draw;
  const t = props.t;
  const onClick = props.onClick;
  const isFinished = props.finished;
  const [hovered, setHovered] = useState(false);
  const pct = Math.round((draw.soldTickets / draw.totalTickets) * 100);
  return (
    <div onMouseEnter={function(){setHovered(true);}} onMouseLeave={function(){setHovered(false);}} onClick={onClick} style={{position:"relative",borderRadius:"18px",overflow:"hidden",cursor:isFinished?"default":"pointer",height:"360px",border:"1px solid "+(hovered&&!isFinished?"rgba(0,0,0,0.2)":"rgba(0,0,0,0.08)"),transition:"all 0.3s",boxShadow:hovered&&!isFinished?"0 20px 48px rgba(0,0,0,0.18)":"0 4px 16px rgba(0,0,0,0.06)",transform:hovered&&!isFinished?"translateY(-4px)":"none",opacity:isFinished?0.65:1,filter:isFinished?"grayscale(0.4)":"none"}}>
      <div style={{position:"absolute",inset:0,background:draw.gradient||"#333"}}></div>
      <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontSize:"80px",opacity:0.12,zIndex:1}}>{draw.emoji}</div>
      {draw.image ? <img src={draw.image} alt={draw.location} onError={function(e){e.target.style.display="none";}} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",objectPosition:draw.heroPosition||"center"}}></img> : null}
      <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.92) 0%,rgba(0,0,0,0.5) 50%,rgba(0,0,0,0.15) 100%)",zIndex:2}}></div>
      <div style={{position:"absolute",inset:0,padding:"24px",display:"flex",flexDirection:"column",justifyContent:"space-between",zIndex:3}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:"6px"}}>
          <div style={{background:isFinished?"rgba(120,120,120,0.85)":"rgba(0,0,0,0.5)",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,0.25)",borderRadius:"20px",padding:"5px 14px",fontSize:"12px",letterSpacing:"1.5px",color:"#ffffff",fontWeight:"700",textShadow:TEXT_SHADOW_STRONG}}>{isFinished ? t.finished : (draw.country + " " + (draw.location ? draw.location.toUpperCase() : ""))}</div>
          {!isFinished ? <div style={{background:"#ffffff",border:"1px solid rgba(255,255,255,0.95)",borderRadius:"20px",padding:"5px 14px",fontSize:"15px",color:"#1A1A1A",fontWeight:"800",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"1.5px"}}>{draw.ticketPrice}£ / TICKET</div> : null}
        </div>
        <div>
          <div style={{fontSize:"13px",letterSpacing:"1px",color:"#ffffff",marginBottom:"8px",fontWeight:"700",textShadow:TEXT_SHADOW_STRONG}}>{trd(draw,"title") ? trd(draw,"title").toUpperCase() : ""}</div>
          <div style={{fontSize:"clamp(28px,4vw,42px)",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"3px",color:"#ffffff",lineHeight:0.95,marginBottom:"18px",fontWeight:"900",textShadow:TEXT_SHADOW_STRONG}}>{trd(draw,"prize") ? trd(draw,"prize").toUpperCase() : ""}</div>
          {!isFinished && draw.drawDate ? (
            <div style={{marginBottom:"12px",padding:"8px 12px",background:"rgba(0,0,0,0.5)",backdropFilter:"blur(8px)",borderRadius:"8px",border:"1px solid rgba(255,255,255,0.2)",textAlign:"center"}}>
              <Countdown endDate={draw.drawDate} t={t} compact={true}></Countdown>
            </div>
          ) : null}
          <div style={{marginBottom:"4px"}}>
           <div style={{display:"flex",justifyContent:"flex-start",marginBottom:"7px",alignItems:"baseline"}}>
              <span style={{fontSize:"15px",color:"#ffffff",fontWeight:"800",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"2px",textShadow:TEXT_SHADOW_STRONG}}>{draw.totalTickets} tickets</span>
            </div>
          <div style={{background:"rgba(255,255,255,0.25)",borderRadius:"2px",height:"3px"}}>
              <div style={{width:pct+"%",height:"100%",background:"#ffffff",borderRadius:"2px"}}></div>
            </div>
          </div>
          {isFinished && draw.winner && draw.winner.name ? (
            <div style={{marginTop:"12px",padding:"10px 14px",background:"rgba(0,0,0,0.55)",backdropFilter:"blur(8px)",borderRadius:"10px",border:"1px solid rgba(212,175,55,0.5)"}}>
              <div style={{fontSize:"9px",letterSpacing:"2px",color:"#D4AF37",marginBottom:"4px",fontWeight:"700"}}>{t.winnerLabel}</div>
              <div style={{fontSize:"18px",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"2px",color:"#ffffff",fontWeight:"800",textShadow:TEXT_SHADOW_STRONG}}>🏆 {shortWinnerName(draw.winner.name)}</div>
              {draw.winner.certificateUrl ? (
                <a href={draw.winner.certificateUrl} target="_blank" rel="noopener noreferrer" onClick={function(e){e.stopPropagation();}} style={{display:"inline-block",marginTop:"6px",fontSize:"10px",letterSpacing:"1px",color:"#D4AF37",textDecoration:"underline",fontWeight:"600"}}>🔒 {t.verifyCert}</a>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function shortWinnerName(fullName) {
  if (!fullName) return "";
  const parts = fullName.trim().split(" ");
  if (parts.length === 1) return parts[0];
  const first = parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  return first + " " + lastInitial + ".";
}

function LangSwitcher(props) {
  const lang = props.lang;
  const setLang = props.setLang;
  const isMobile = props.isMobile;
  const langs = [{ code:"en", label:"EN" }, { code:"fr", label:"FR" }, { code:"es", label:"ES" }];
  return (
    <div style={{display:"flex",alignItems:"center",gap:"4px",background:"rgba(0,0,0,0.05)",border:"1px solid rgba(0,0,0,0.08)",borderRadius:"20px",padding:"3px"}}>
      {langs.map(function(l) {
        return (
          <button key={l.code} onClick={function(){ setLang(l.code); localStorage.setItem("olawin_lang", l.code); }} style={{background: lang===l.code ? "#1A1A1A" : "transparent", color: lang===l.code ? "#E8E4DC" : "rgba(0,0,0,0.5)", border:"none", borderRadius:"16px", padding: isMobile ? "5px 9px" : "5px 11px", fontSize:"10px", letterSpacing:"1px", fontWeight:"600", cursor:"pointer", fontFamily:"DM Sans, sans-serif", transition:"all 0.2s"}}>{l.label}</button>
        );
      })}
    </div>
  );
}

function WhatsAppButton(props) {
  const phone = props.phone;
  const message = props.message;
  if (!phone) return null;
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  const encodedMsg = encodeURIComponent(message || "Bonjour, j'ai une question sur Olawin");
  const url = "https://wa.me/" + cleanPhone + "?text=" + encodedMsg;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" style={{position:"fixed",bottom:"24px",right:"24px",zIndex:1000,width:"60px",height:"60px",borderRadius:"50%",background:"#25D366",boxShadow:"0 8px 24px rgba(37,211,102,0.4), 0 4px 12px rgba(0,0,0,0.15)",display:"flex",alignItems:"center",justifyContent:"center",textDecoration:"none",animation:"wapulse 2s infinite",transition:"transform 0.2s"}} onMouseEnter={function(e){e.currentTarget.style.transform="scale(1.08)";}} onMouseLeave={function(e){e.currentTarget.style.transform="scale(1)";}}>
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M16 0C7.163 0 0 7.163 0 16c0 2.825 0.738 5.476 2.029 7.776L0 32l8.428-2.014A15.93 15.93 0 0016 32c8.837 0 16-7.163 16-16S24.837 0 16 0z" fill="#fff" opacity="0.001"></path>
        <path d="M16.001 5.333c-5.881 0-10.667 4.785-10.667 10.667 0 1.882 0.494 3.727 1.431 5.345l-1.518 5.547 5.682-1.491c1.554 0.846 3.296 1.292 5.072 1.292 5.881 0 10.667-4.785 10.667-10.667S21.882 5.333 16.001 5.333zM16.001 24.482c-1.602 0-3.173-0.43-4.544-1.244l-0.326-0.194-3.376 0.886 0.901-3.291-0.213-0.339a8.79 8.79 0 01-1.345-4.7c0-4.866 3.96-8.825 8.825-8.825 4.866 0 8.825 3.96 8.825 8.825-0.001 4.866-3.961 8.825-8.826 8.825zm4.842-6.605c-0.265-0.133-1.57-0.776-1.814-0.865-0.244-0.089-0.421-0.133-0.598 0.133-0.177 0.265-0.687 0.865-0.842 1.042-0.155 0.177-0.31 0.199-0.576 0.066-0.265-0.133-1.12-0.413-2.134-1.317-0.789-0.704-1.322-1.572-1.478-1.837-0.155-0.265-0.017-0.408 0.117-0.541 0.12-0.119 0.265-0.31 0.398-0.465 0.133-0.155 0.177-0.265 0.265-0.443 0.089-0.177 0.044-0.332-0.022-0.465-0.066-0.133-0.598-1.443-0.82-1.974-0.216-0.518-0.435-0.448-0.598-0.456-0.155-0.008-0.332-0.01-0.51-0.01s-0.465 0.066-0.708 0.332c-0.244 0.265-0.93 0.909-0.93 2.219 0 1.31 0.952 2.574 1.085 2.751 0.133 0.177 1.873 2.86 4.538 4.011 0.634 0.274 1.129 0.437 1.515 0.559 0.636 0.202 1.215 0.174 1.673 0.105 0.51-0.076 1.57-0.642 1.792-1.262 0.221-0.62 0.221-1.151 0.155-1.262-0.066-0.111-0.244-0.177-0.51-0.31z" fill="#fff"></path>
      </svg>
    </a>
  );
}

function InstagramIcon(props) {
  const size = props.size || 18;
  const gradId = "igGrad" + size;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <radialGradient id={gradId} cx="0.3" cy="1" r="1.2">
          <stop offset="0%" stopColor="#fdf497"></stop>
          <stop offset="12%" stopColor="#fdf497"></stop>
          <stop offset="28%" stopColor="#fd5949"></stop>
          <stop offset="50%" stopColor="#d6249f"></stop>
          <stop offset="80%" stopColor="#285AEB"></stop>
        </radialGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke={"url(#"+gradId+")"} strokeWidth="2" fill="none"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" stroke={"url(#"+gradId+")"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke={"url(#"+gradId+")"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></line>
    </svg>
  );
}

export default function Olawin() {
  const isMobile = useIsMobile();
  const [lang, setLang] = useState(function() {
    if (typeof window === "undefined") return "en";
    const saved = localStorage.getItem("olawin_lang");
    if (saved && T[saved]) return saved;
    const browser = (navigator.language || "").slice(0,2).toLowerCase();
    if (T[browser]) return browser;
    return "en";
  });
  const t = T[lang];

  useEffect(function() {
    if (typeof document !== "undefined") document.documentElement.lang = lang;
  }, [lang]);

  const [page, setPage] = useState("home");
  const [draws, setDraws] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroConfig, setHeroConfig] = useState(null);
  const [socialConfig, setSocialConfig] = useState(null);
  const [contentConfig, setContentConfig] = useState(null);
  const [legalConfig, setLegalConfig] = useState(null);
  const [selectedDraw, setSelectedDraw] = useState(null);
  const [selectedPack, setSelectedPack] = useState(null);
  const [qty, setQty] = useState(1);
  const [customQty, setCustomQty] = useState("");
  const [form, setForm] = useState(function(){ try { var s = localStorage.getItem("olawin_client_info"); if (s) { var d = JSON.parse(s); return {firstName:d.firstName||"",lastName:d.lastName||"",email:d.email||"",phoneCode:d.phoneCode||"+1",phone:d.phone||"",address:d.address||"",city:d.city||"",zip:d.zip||"",country:d.country||""}; } } catch(e){} return {firstName:"",lastName:"",email:"",phoneCode:"+1",phone:"",address:"",city:"",zip:"",country:""}; });
  const [openFaq, setOpenFaq] = useState(null);
  const [paying, setPaying] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [lastOrderNumber, setLastOrderNumber] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [searchOrder, setSearchOrder] = useState("");
  const [searching, setSearching] = useState(false);
  const [foundOrders, setFoundOrders] = useState(null);
  const [searchError, setSearchError] = useState(false);
  const [ageVerified, setAgeVerified] = useState(function(){ try { return localStorage.getItem("olawin_age_ok") === "1"; } catch(e){ return false; } });
  const [ageWarning, setAgeWarning] = useState(false);
  const [quizIdx] = useState(function(){ return Math.floor(Math.random()*QUIZ.length); });
  const [quizOk, setQuizOk] = useState(false);
  const [quizError, setQuizError] = useState(false);
  const topRef = useRef();
  const drawsRef = useRef();

  useEffect(function() {
    const q = query(collection(db,"draws"), orderBy("createdAt","desc"));
    const unsub = onSnapshot(q, function(snap) {
      const data = snap.docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); });
      setDraws(data);
      setLoading(false);
    }, function(err) { console.error("Firebase error:", err); setLoading(false); });
    return function() { unsub(); };
  }, []);

  useEffect(function() {
    getDoc(doc(db,"settings","hero")).then(function(snap) {
      if (snap.exists()) setHeroConfig(snap.data());
    }).catch(function(err) { console.error("Hero load error:", err); });
    getDoc(doc(db,"settings","social")).then(function(snap) {
      if (snap.exists()) setSocialConfig(snap.data());
    }).catch(function(err) { console.error("Social load error:", err); });
    getDoc(doc(db,"settings","content")).then(function(snap) {
      if (snap.exists()) setContentConfig(snap.data());
    }).catch(function(err) { console.error("Content load error:", err); });
    getDoc(doc(db,"settings","legal")).then(function(snap) {
      if (snap.exists()) setLegalConfig(snap.data());
    }).catch(function(err) { console.error("Legal load error:", err); });
  }, []);

  const now = Date.now();
  const isDrawnOrPast = function(d) {
    if (d.status === "drawn") return true;
    if (d.drawDate) {
      const dt = new Date(d.drawDate).getTime();
      if (!isNaN(dt) && dt < now) return true;
    }
    return false;
  };
  const activeDraws = draws.filter(function(d) { return d.status === "active" && !isDrawnOrPast(d); });
  const pastDraws = draws.filter(function(d) { return isDrawnOrPast(d); });
  activeDraws.sort(function(a, b) {
    const ta = a.drawDate ? new Date(a.drawDate).getTime() : 0;
    const tb = b.drawDate ? new Date(b.drawDate).getTime() : 0;
    return tb - ta;
  });
  pastDraws.sort(function(a, b) {
    const ta = a.drawDate ? new Date(a.drawDate).getTime() : 0;
    const tb = b.drawDate ? new Date(b.drawDate).getTime() : 0;
    return tb - ta;
  });

  const activeDraw = selectedDraw;
  const remaining = activeDraw ? activeDraw.totalTickets - activeDraw.soldTickets : 0;
  const finalQty = selectedPack ? selectedPack.qty : (customQty !== "" ? Math.min(parseInt(customQty)||1, remaining) : qty);
  const discount = selectedPack ? selectedPack.discount : 0;
  const baseTotal = finalQty * (activeDraw ? activeDraw.ticketPrice : 0);
  const savings = Math.round(baseTotal * discount / 100);
  const total = baseTotal - savings;
  const pct = activeDraw ? Math.round((activeDraw.soldTickets / activeDraw.totalTickets) * 100) : 0;
  const formValid = form.firstName && form.lastName && form.email && form.phone && form.address && form.city && form.country;
  const featured = activeDraws[0] || null;
  const heroData = heroConfig && heroConfig.enabled ? heroConfig : featured;
  const localeMap = { en:"en-US", fr:"fr-FR", es:"es-ES" };
  const fmtDate = function(d) { return d ? new Date(d).toLocaleDateString(localeMap[lang],{day:"numeric",month:"short"}) : ""; };
  const fmtDateLong = function(d) { return d ? new Date(d).toLocaleDateString(localeMap[lang],{day:"numeric",month:"long",year:"numeric"}) : ""; };

  const goTo = function(p) {
    setPage(p);
    setMenuOpen(false);
    setTimeout(function() { if (topRef.current) topRef.current.scrollIntoView({behavior:"smooth"}); }, 50);
  };

  const scrollToDraws = function() {
    setPage("home");
    setMenuOpen(false);
    setTimeout(function() {
      if (drawsRef.current) {
        drawsRef.current.scrollIntoView({behavior:"smooth", block:"start"});
      } else if (topRef.current) {
        topRef.current.scrollIntoView({behavior:"smooth"});
      }
    }, 100);
  };

  const handlePay = async function() {
    if (!formValid || !activeDraw) return;
    if (!quizOk) { setQuizError(true); return; }
    setPaying(true);
    try {
      const checkoutRes = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drawId: activeDraw.id,
          drawTitle: activeDraw.title,
          drawLocation: activeDraw.location,
          drawCountry: activeDraw.country,
          drawDate: activeDraw.drawDate,
          tickets: finalQty,
          unitPrice: activeDraw.ticketPrice,
          currency: activeDraw.currency || "gbp",
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email.toLowerCase().trim(),
          phoneCode: form.phoneCode,
          phone: form.phone,
          address: form.address,
          zip: form.zip,
          city: form.city,
          country: form.country,
          discount: discount,
          pack: selectedPack ? selectedPack.qty : null
        })
      });
      const checkoutData = await checkoutRes.json();
      if (!checkoutData.url) { throw new Error(checkoutData.error || "No checkout URL"); }
      try { localStorage.setItem("olawin_pending_order", JSON.stringify({ orderNumber: checkoutData.orderNumber, drawId: activeDraw.id, qty: finalQty, amount: total })); } catch(e) {}
      try { localStorage.setItem("olawin_client_info", JSON.stringify({ firstName: form.firstName, lastName: form.lastName, email: form.email, phoneCode: form.phoneCode, phone: form.phone, address: form.address, zip: form.zip, city: form.city, country: form.country })); } catch (e) {}
      window.location.href = checkoutData.url;
      return;
    } catch(err) { console.error("Checkout error:", err); setPaying(false); alert("Erreur, veuillez réessayer."); return; }
    setPaying(true);
    if (!stripeUrl) { alert(t.confirm.bookingError || "Lien de paiement indisponible pour cette quantité. Contactez-nous."); return; }
    setPaying(true);
    var orderNumber = genOrderNumber();
    try { localStorage.setItem("olawin_pending_order", JSON.stringify({ orderNumber: orderNumber, drawId: activeDraw.id, drawTitle: activeDraw.title, drawLocation: activeDraw.location, drawCountry: activeDraw.country, drawDate: activeDraw.drawDate, firstName: form.firstName, lastName: form.lastName, email: form.email.toLowerCase().trim(), phoneCode: form.phoneCode, phone: form.phone, address: form.address, zip: form.zip, city: form.city, country: form.country, qty: finalQty, amount: total, discount: discount, pack: selectedPack ? selectedPack.qty : null, createdAt: Date.now() })); } catch(e) {}
    try { localStorage.setItem("olawin_client_info", JSON.stringify({ firstName: form.firstName, lastName: form.lastName, email: form.email, phoneCode: form.phoneCode, phone: form.phone, address: form.address, zip: form.zip, city: form.city, country: form.country })); } catch (e) {}
    var sep = stripeUrl.indexOf("?") >= 0 ? "&" : "?";
    var redirectUrl = stripeUrl + sep + "client_reference_id=" + encodeURIComponent(orderNumber) + "&prefilled_email=" + encodeURIComponent(form.email.toLowerCase().trim());
    window.location.href = redirectUrl;
    return;
    setPaying(true);
   const startNum = (activeDraw.soldTickets || 0) + 1;
    const nums = [];
    for (var qi = 0; qi < finalQty; qi++) { nums.push(startNum + qi); }
    const orderNumber_legacy = genOrderNumber();
    try {
      await addDoc(collection(db,"orders"), {
        orderNumber: orderNumber,
        drawId: activeDraw.id, drawTitle: activeDraw.title,
        firstName: form.firstName, lastName: form.lastName, email: form.email.toLowerCase().trim(),
        phone: form.phoneCode + " " + form.phone,
        address: form.address + ", " + form.zip + " " + form.city + ", " + form.country,
        tickets: finalQty, ticketNums: nums, amount: total,
        discount: discount, pack: selectedPack ? selectedPack.qty : null,
        status: "paid", createdAt: serverTimestamp()
    });
    try { localStorage.setItem("olawin_client_info", JSON.stringify({ firstName: form.firstName, lastName: form.lastName, email: form.email, phoneCode: form.phoneCode, phone: form.phone, address: form.address, zip: form.zip, city: form.city, country: form.country })); } catch (e) {}
    await updateDoc(doc(db,"draws",activeDraw.id), { soldTickets: increment(finalQty) });
      await Promise.allSettled([
        sendTicketConfirmation({ firstName: form.firstName, lastName: form.lastName, email: form.email, drawTitle: activeDraw.title, drawLocation: activeDraw.location, drawCountry: activeDraw.country, drawDate: activeDraw.drawDate, ticketNums: nums, qty: finalQty, total: total, discount: discount, pack: selectedPack ? selectedPack.qty : null, orderNumber: orderNumber }),
        sendAdminNotification({ firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phoneCode + " " + form.phone, address: form.address + ", " + form.zip + " " + form.city + ", " + form.country, drawTitle: activeDraw.title, drawLocation: activeDraw.location, drawCountry: activeDraw.country, ticketNums: nums, qty: finalQty, total: total, pack: selectedPack ? selectedPack.qty : null, orderId: orderNumber })
      ]);
      setLastOrderNumber(orderNumber);
      setPaying(false);
      goTo("success");
    } catch (err) {
      console.error("Firebase error:", err);
      setPaying(false);
      alert(t.confirm.bookingError);
    }
  };

  const handleSearch = async function() {
  if (!searchEmail) return;
    setSearching(true);
    setSearchError(false);
    setFoundOrders(null);
    const emailNorm = searchEmail.toLowerCase().trim();
    try {
      const snap = await getDocs(collection(db,"orders"));
      const matches = [];
      snap.forEach(function(docSnap) {
        const data = docSnap.data();
        const docId = docSnap.id;
        const orderEmail = (data.email || "").toLowerCase().trim();
        if (orderEmail === emailNorm) {
          matches.push(Object.assign({ id: docId }, data));
        }
      });
      if (matches.length === 0) {
        setSearchError(true);
        setFoundOrders(null);
      } else {
        setFoundOrders(matches);
        setSearchError(false);
      }
      setSearching(false);
    } catch (err) {
      console.error("Search error:", err);
      setSearchError(true);
      setSearching(false);
    }
  };

  const resetSearch = function() {
    setSearchEmail("");
    setSearchOrder("");
    setFoundOrders(null);
    setSearchError(false);
  };

const CSS = "@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Playfair+Display:ital,wght@0,300;0,400;1,300&family=DM+Sans:wght@300;400;500;600&family=Montserrat:wght@400;500;600;700&display=swap');*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}html{scroll-behavior:smooth;}body{background:" + C_BG + ";color:#1A1A1A;overflow-x:hidden;}input:focus,textarea:focus,select:focus{outline:none;}::-webkit-scrollbar{width:3px;background:" + C_BG + ";}::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.15);border-radius:4px;}@keyframes pulse{0%,100%{opacity:.3;}50%{opacity:1;}}@keyframes spin{to{transform:rotate(360deg);}}@keyframes bounceDown{0%,100%{transform:translateY(0);}50%{transform:translateY(8px);}}@keyframes wapulse{0%,100%{box-shadow:0 8px 24px rgba(37,211,102,0.4), 0 4px 12px rgba(0,0,0,0.15);}50%{box-shadow:0 8px 24px rgba(37,211,102,0.7), 0 0 0 8px rgba(37,211,102,0.2);}}.nav-link{color:rgba(0,0,0,0.42);font-size:11px;letter-spacing:2px;font-family:'DM Sans',sans-serif;cursor:pointer;background:none;border:none;padding:0;text-transform:uppercase;}.nav-link:hover{color:#000;}.qty-btn{transition:all 0.18s;border:2px solid #1A1A1A;background:transparent;color:#1A1A1A;border-radius:10px;cursor:pointer;font-family:'Playfair Display',serif;}.qty-btn.active{border:2px solid #1A1A1A;background:#1A1A1A;color:#fff;}.cta-dark{background:#1A1A1A;color:#E8E4DC;border:none;border-radius:12px;cursor:pointer;font-family:'DM Sans',sans-serif;font-weight:600;letter-spacing:2.5px;}.cta-dark:disabled{background:rgba(0,0,0,0.1);color:rgba(0,0,0,0.25);cursor:not-allowed;}";
  const SOLD_LABEL = { en:"SOLD", fr:"VENDUS", es:"VENDIDOS" }[lang];

  const updateForm = function(field, value) { setForm(Object.assign({}, form, { [field]: value })); };

  const steps = (contentConfig && contentConfig.steps && contentConfig.steps[lang] && contentConfig.steps[lang].length > 0) ? contentConfig.steps[lang] : t.steps;
  const faqItems = (contentConfig && contentConfig.faq && contentConfig.faq[lang] && contentConfig.faq[lang].length > 0) ? contentConfig.faq[lang] : t.faq.items;
  const footerCopyright = (contentConfig && contentConfig.footer && contentConfig.footer.copyright) ? contentConfig.footer.copyright : t.footer.copyright;
const footerContactEmail = (contentConfig && contentConfig.footer && contentConfig.footer.contactEmail) ? contentConfig.footer.contactEmail : "contact@olawin.org";
  const navShowIG = socialConfig && socialConfig.instagram && socialConfig.instagram.enabled && socialConfig.instagram.username;
  const navIgUrl = navShowIG ? "https://instagram.com/" + socialConfig.instagram.username.replace(/^@/, "") : "";

  const comingSoonBypass = (function(){
    try {
      var params = new URLSearchParams(window.location.search);
      var p = params.get("preview");
      if (p === "olawin2026") { localStorage.setItem("olawin_preview", "olawin2026"); return true; }
      if (p === "reset") { localStorage.removeItem("olawin_preview"); return false; }
      return localStorage.getItem("olawin_preview") === "olawin2026";
    } catch(e) { return false; }
  })();

const comingSoonContent = true ? null : (    <div style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(20,20,20,0.55)",backdropFilter:"blur(14px)",WebkitBackdropFilter:"blur(14px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"24px"}}>
      <div style={{maxWidth:"460px",width:"100%",background:"#E8E4DC",borderRadius:"22px",padding:isMobile?"36px 24px":"48px 40px",textAlign:"center",boxShadow:"0 30px 80px rgba(0,0,0,0.4)",border:"1px solid rgba(0,0,0,0.08)"}}>
        <OlawinLogo size={isMobile?42:52}></OlawinLogo>
<div style={{display:"flex",justifyContent:"center",gap:"6px",marginTop:"20px",marginBottom:"14px"}}>
          {[{code:"fr",label:"FR"},{code:"en",label:"EN"},{code:"es",label:"ES"}].map(function(l){ return (
            <button key={l.code} onClick={function(){ setLang(l.code); try{ localStorage.setItem("olawin_lang", l.code); }catch(e){} }} style={{background:lang===l.code?"#1A1A1A":"transparent",color:lang===l.code?"#E8E4DC":"rgba(0,0,0,0.5)",border:"1px solid rgba(0,0,0,0.15)",borderRadius:"20px",padding:"4px 12px",fontSize:"10px",letterSpacing:"1.5px",fontFamily:"DM Sans, sans-serif",fontWeight:600,cursor:"pointer"}}>{l.label}</button>
          ); })}
        </div>
        <div style={{fontSize:"10px",letterSpacing:"4px",color:"rgba(0,0,0,0.4)",marginBottom:"10px",fontFamily:"DM Sans, sans-serif"}}>{lang==="fr"?"BIENTÔT DISPONIBLE":lang==="es"?"PRÓXIMAMENTE":"COMING SOON"}</div>        <h2 style={{fontSize:isMobile?"clamp(28px,7vw,36px)":"clamp(32px,4vw,42px)",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"3px",lineHeight:1,marginBottom:"18px",color:"#1A1A1A"}}>{lang==="fr"?"GAGNEZ VOS PLUS BEAUX VOYAGES":lang==="es"?"GANE SUS MEJORES VIAJES":"WIN YOUR MOST BEAUTIFUL JOURNEYS"}</h2>
        <p style={{fontSize:"14px",fontFamily:"Playfair Display, serif",fontStyle:"italic",color:"rgba(0,0,0,0.55)",lineHeight:"1.7",marginBottom:"28px"}}>{lang==="fr"?"Le site sera bientôt disponible. Restez connectés pour ne rien manquer du lancement.":lang==="es"?"El sitio estará disponible pronto. Manténgase conectado para no perderse el lanzamiento.":"The site will be available soon. Stay connected so you don't miss the launch."}</p>
        <div style={{display:"flex",flexDirection:"column",gap:"12px",alignItems:"center"}}>
          <a href="https://instagram.com/olawin.official" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:"10px",background:"#1A1A1A",color:"#E8E4DC",textDecoration:"none",padding:"14px 28px",borderRadius:"12px",fontSize:"12px",fontFamily:"DM Sans, sans-serif",fontWeight:600,letterSpacing:"2.5px",minWidth:"220px"}}>
            <InstagramIcon size={18}></InstagramIcon>
            <span>{lang==="fr"?"SUIVEZ-NOUS":lang==="es"?"SÍGANOS":"FOLLOW US"}</span>
          </a>
          <div style={{fontSize:"11px",color:"rgba(0,0,0,0.4)",fontFamily:"DM Sans, sans-serif",letterSpacing:"1px"}}>@olawin.official</div>
        </div>
      </div>
    </div>
  );

  const navContent = (
    <nav style={{position:"sticky",top:0,zIndex:100,background:"rgba(216,212,206,0.96)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(0,0,0,0.09)",height:"64px",padding:isMobile?"0 16px":"0 48px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:isMobile?"10px":"20px"}}>
        <button onClick={function(){ goTo("home"); }} style={{background:"none",border:"none",cursor:"pointer"}}>
          <OlawinLogo size={isMobile?26:34}></OlawinLogo>
        </button>
        {!isMobile ? (
          <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
            <div style={{width:"1px",height:"28px",background:"rgba(0,0,0,0.15)"}}></div>
            <span style={{fontSize:"8px",letterSpacing:"2px",color:"rgba(0,0,0,0.4)",fontFamily:"DM Sans, sans-serif",lineHeight:"1.3",textAlign:"right",whiteSpace:"nowrap"}}>{t.partner}</span>
            <img src={PARTNER_LOGO} alt="Private Honors" style={{height:"24px",width:"auto",objectFit:"contain"}}></img>
          </div>
        ) : null}
      </div>
      {!isMobile ? (
        <div style={{display:"flex",alignItems:"center",gap:"20px"}}>
          <button className="nav-link" onClick={function(){ scrollToDraws(); }}>{t.nav.draws}</button>
          <button className="nav-link" onClick={function(){ goTo("mytickets"); }}>{t.nav.myTickets}</button>
          <button className="nav-link" onClick={function(){ goTo("faq"); }}>{t.nav.faq}</button>
          <button className="nav-link" onClick={function(){ goTo("legal"); }}>{t.nav.legal}</button>
<LangSwitcher lang={lang} setLang={setLang} isMobile={false}></LangSwitcher>
          {navShowIG ? <a href={navIgUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram" style={{display:"inline-flex",alignItems:"center",padding:"4px",borderRadius:"50%",transition:"opacity 0.2s"}} onMouseEnter={function(e){e.currentTarget.style.opacity="0.6";}} onMouseLeave={function(e){e.currentTarget.style.opacity="1";}}><InstagramIcon size={20}></InstagramIcon></a> : null}
          <button onClick={scrollToDraws} className="cta-dark" style={{padding:"10px 22px",fontSize:"11px",borderRadius:"8px"}}>{t.nav.buy}</button>
        </div>
      ) : (
<div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          {navShowIG ? <a href={navIgUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram" style={{display:"inline-flex",alignItems:"center",padding:"4px"}}><InstagramIcon size={22}></InstagramIcon></a> : null}
          <LangSwitcher lang={lang} setLang={setLang} isMobile={true}></LangSwitcher>
          <button onClick={function(){ setMenuOpen(!menuOpen); }} style={{background:"none",border:"none",cursor:"pointer",padding:"8px",display:"flex",flexDirection:"column",gap:"4px"}}>
            <span style={{width:"22px",height:"2px",background:"#1A1A1A",borderRadius:"2px",transition:"all 0.2s"}}></span>
            <span style={{width:"22px",height:"2px",background:"#1A1A1A",borderRadius:"2px",transition:"all 0.2s"}}></span>
            <span style={{width:"22px",height:"2px",background:"#1A1A1A",borderRadius:"2px",transition:"all 0.2s"}}></span>
          </button>
        </div>
      )}
      {isMobile && menuOpen ? (
        <div style={{position:"absolute",top:"64px",left:0,right:0,background:"rgba(216,212,206,0.98)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(0,0,0,0.09)",padding:"24px 20px",display:"flex",flexDirection:"column",gap:"20px"}}>
          <button className="nav-link" onClick={function(){ goTo("home"); }} style={{textAlign:"left",fontSize:"14px",padding:"8px 0"}}>{t.nav.draws}</button>
          <button className="nav-link" onClick={function(){ goTo("mytickets"); }} style={{textAlign:"left",fontSize:"14px",padding:"8px 0"}}>{t.nav.myTickets}</button>
          <button className="nav-link" onClick={function(){ goTo("faq"); }} style={{textAlign:"left",fontSize:"14px",padding:"8px 0"}}>{t.nav.faq}</button>
          <button className="nav-link" onClick={function(){ goTo("legal"); }} style={{textAlign:"left",fontSize:"14px",padding:"8px 0"}}>{t.nav.legal}</button>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"10px",padding:"12px 0",borderTop:"1px solid rgba(0,0,0,0.08)",borderBottom:"1px solid rgba(0,0,0,0.08)"}}>
            <span style={{fontSize:"9px",letterSpacing:"2px",color:"rgba(0,0,0,0.4)"}}>{t.partnerMobile}</span>
            <img src={PARTNER_LOGO} alt="Private Honors" style={{height:"18px",width:"auto",objectFit:"contain"}}></img>
          </div>
          <button onClick={scrollToDraws} className="cta-dark" style={{padding:"14px",fontSize:"12px",borderRadius:"10px",width:"100%"}}>{t.nav.buy}</button>
        </div>
      ) : null}
    </nav>
  );

  let pageContent = null;

  if (page === "home") {
    if (loading) {
      pageContent = (
        <div style={{minHeight:"60vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"20px"}}>
          <OlawinLogo size={40}></OlawinLogo>
          <div style={{width:"32px",height:"32px",border:"2px solid rgba(0,0,0,0.1)",borderTopColor:"#1A1A1A",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}></div>
          <p style={{fontSize:"12px",letterSpacing:"3px",color:"rgba(0,0,0,0.35)"}}>{t.loading}</p>
        </div>
      );
    } else if (activeDraws.length === 0 && pastDraws.length === 0) {
      pageContent = (
        <div style={{minHeight:"60vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"16px",textAlign:"center",padding:"48px 20px"}}>
          <h2 style={{fontSize:"clamp(22px,5vw,28px)",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"4px"}}>{t.empty.title}</h2>
          <p style={{fontSize:"14px",color:"rgba(0,0,0,0.45)"}}>{t.empty.sub}</p>
        </div>
      );
    } else {
      const heroEndDate = heroData && heroData.drawDate ? heroData.drawDate : (heroData && heroData.endDate ? heroData.endDate : null);
      pageContent = (
        <div>
          <section style={{position:"relative",height:isMobile?"75vh":"92vh",minHeight:"500px",overflow:"hidden",display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
            <div style={{position:"absolute",inset:0,background:(heroData && heroData.gradient) || "#1A1A1A"}}></div>
            {heroData && heroData.image ? <img src={heroData.image} alt={heroData.location||"Olawin"} onError={function(e){e.target.style.display="none";}} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",objectPosition:heroData.heroPosition||"center"}}></img> : null}
            <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.92) 0%,rgba(0,0,0,0.5) 50%,rgba(0,0,0,0.15) 100%)"}}></div>
            <div style={{position:"relative",padding:isMobile?"0 20px 40px":"0 64px 72px",maxWidth:"900px"}}>
              {heroEndDate ? (
                <div style={{display:"inline-flex",alignItems:"center",gap:"8px",background:"rgba(0,0,0,0.5)",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,0.25)",borderRadius:"100px",padding:"7px 16px",marginBottom:"16px"}}>
                  <span style={{width:"7px",height:"7px",borderRadius:"50%",background:"#ff4444",animation:"pulse 1.5s infinite"}}></span>
                  <span style={{fontSize:"11px",letterSpacing:"2px",color:"#ffffff",fontWeight:"700",textShadow:TEXT_SHADOW_STRONG}}>{t.hero.live} {fmtDate(heroEndDate)}</span>
                </div>
              ) : null}
              <div style={{fontSize:"14px",letterSpacing:"3px",color:"#ffffff",marginBottom:"10px",fontWeight:"700",textShadow:TEXT_SHADOW_STRONG}}>{heroData && heroData.country} {trd(heroData,"location") ? trd(heroData,"location").toUpperCase() : ""}</div>
              <h1 style={{fontSize:isMobile?"clamp(38px,9vw,56px)":"clamp(52px,7vw,100px)",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"3px",lineHeight:0.92,color:"#FFFFFF",marginBottom:"14px",textShadow:TEXT_SHADOW_STRONG}}>
                {trd(heroData,"title") ? trd(heroData,"title").toUpperCase() : ""}
                <br></br>
                <span style={{color:"#ffffff",opacity:0.85}}>{trd(heroData,"location") ? trd(heroData,"location").toUpperCase() : ""}</span>
              </h1>
              <p style={{fontSize:isMobile?"15px":"17px",fontFamily:"Playfair Display, serif",fontStyle:"italic",color:"#ffffff",maxWidth:"480px",lineHeight:"1.7",marginBottom:"24px",textShadow:TEXT_SHADOW_STRONG,opacity:0.95}}>{trd(heroData,"description")}</p>
              {heroEndDate ? (
                <div style={{marginBottom:"20px",padding:"12px 16px",background:"rgba(0,0,0,0.5)",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:"12px",display:"inline-block"}}>
                  <Countdown endDate={heroEndDate} t={t} compact={false}></Countdown>
                </div>
              ) : null}
              <div style={{display:"flex",alignItems:isMobile?"stretch":"center",gap:"16px",flexWrap:"wrap",flexDirection:isMobile?"column":"row"}}>
                {featured ? <button onClick={function(){ setSelectedDraw(featured); goTo("shop"); }} className="cta-dark" style={{background:"#FFFFFF",color:"#1A1A1A",padding:"16px 32px",fontSize:"14px",width:isMobile?"100%":"auto",fontWeight:"800"}}>{t.hero.buyTicket} {featured.ticketPrice}£</button> : null}
{featured ? <div style={{color:"#ffffff",fontSize:"13px",textAlign:isMobile?"center":"left",fontWeight:"700",textShadow:TEXT_SHADOW_STRONG}}>{featured.totalTickets} {t.hero.ticketsWord}</div> : null}
{activeDraws.length > 1 ? (
<div onClick={scrollToDraws} style={{marginTop:"28px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:isMobile?"center":"flex-start",gap:"6px"}}>
<span style={{fontSize:"11px",letterSpacing:"3px",color:"#ffffff",fontWeight:"700",textShadow:TEXT_SHADOW_STRONG}}>↓ {t.section.allDraws}</span>
<span style={{fontSize:"22px",color:"#ffffff",animation:"bounceDown 1.6s ease-in-out infinite",textShadow:TEXT_SHADOW_STRONG}}>⌄</span>
</div>
) : null}            </div>
          </section>

          {activeDraws.length > 0 ? (
            <section ref={drawsRef} style={{background:C_BG,padding:isMobile?"48px 20px":"80px 48px",scrollMarginTop:"80px"}}>
              <div style={{maxWidth:"1200px",margin:"0 auto"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:"32px",flexWrap:"wrap",gap:"12px"}}>
                  <div>
                    <div style={{fontSize:"9px",letterSpacing:"4px",color:"rgba(0,0,0,0.35)",marginBottom:"8px"}}>{t.section.upcoming}</div>
                    <h2 style={{fontSize:isMobile?"clamp(32px,8vw,42px)":"clamp(36px,5vw,60px)",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"3px",lineHeight:0.95}}>{t.section.allDraws}</h2>
                  </div>
                  <div style={{fontSize:"12px",color:"rgba(0,0,0,0.4)"}}>{activeDraws.length} {t.section.activeDraws}</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(auto-fill,minmax(320px,1fr))",gap:"16px"}}>
                  {activeDraws.map(function(draw) {
                    return <DrawCard key={draw.id} draw={draw} t={t} onClick={function(){ setSelectedDraw(draw); goTo("shop"); }}></DrawCard>;
                  })}
                </div>
              </div>
            </section>
          ) : null}

          {pastDraws.length > 0 ? (
            <section style={{background:C_BG,padding:isMobile?"40px 20px":"60px 48px",borderTop:"1px solid rgba(0,0,0,0.06)"}}>
              <div style={{maxWidth:"1200px",margin:"0 auto"}}>
                <div style={{marginBottom:"24px"}}>
                  <div style={{fontSize:"9px",letterSpacing:"4px",color:"rgba(0,0,0,0.35)",marginBottom:"8px"}}>{t.section.past}</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(auto-fill,minmax(320px,1fr))",gap:"16px"}}>
                  {pastDraws.map(function(draw) {
                    return <DrawCard key={draw.id} draw={draw} t={t} finished={true} onClick={function(){}}></DrawCard>;
                  })}
                </div>
              </div>
            </section>
          ) : null}

          <section style={{borderTop:"1px solid rgba(0,0,0,0.09)",borderBottom:"1px solid rgba(0,0,0,0.09)",padding:isMobile?"32px 0":"40px 0",display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",background:"rgba(0,0,0,0.02)"}}>
{[
          { val: String(activeDraws.length), lbl: t.stats.active },
          { val: activeDraws.reduce(function(s,d){ return s + (d.ticketPrice * d.totalTickets); }, 0).toLocaleString(localeMap[lang]) + "£", lbl: t.stats.value },
          { val: String(activeDraws.reduce(function(s,d){ return s + (d.totalTickets - d.soldTickets); }, 0)), lbl: t.stats.remaining },
          { val: "100+", lbl: t.stats.countries }
        ].map(function(s, i) {
          return (
                <div key={i} style={{textAlign:"center",padding:isMobile?"16px 12px":"0 24px"}}>
                  <div style={{fontSize:isMobile?"clamp(22px,6vw,28px)":"clamp(28px,3.5vw,44px)",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"2px",marginBottom:"4px"}}>{s.val}</div>
                  <div style={{fontSize:"9px",letterSpacing:"2px",color:"rgba(0,0,0,0.35)"}}>{s.lbl}</div>
                </div>
              );
            })}
          </section>

          <section style={{padding:isMobile?"64px 20px":"100px 48px"}}>
            <div style={{maxWidth:"1100px",margin:"0 auto"}}>
              <div style={{textAlign:"center",marginBottom:isMobile?"40px":"64px"}}>
                <div style={{fontSize:"9px",letterSpacing:"4px",color:"rgba(0,0,0,0.35)",marginBottom:"12px"}}>{t.section.process}</div>
                <h2 style={{fontSize:isMobile?"clamp(28px,7vw,38px)":"clamp(36px,5vw,60px)",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"4px"}}>{t.section.howItWorks}</h2>
              </div>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(4,1fr)",gap:"2px"}}>
                {steps.map(function(s, i) {
                  return (
                    <div key={i} style={{padding:isMobile?"24px 0":"40px 32px"}}>
                      <div style={{fontSize:isMobile?"56px":"80px",fontFamily:"Bebas Neue, sans-serif",color:"rgba(0,0,0,0.05)",lineHeight:1,marginBottom:"16px"}}>0{i+1}</div>
                      <div style={{fontSize:"18px",fontFamily:"Playfair Display, serif",marginBottom:"10px"}}>{s.title}</div>
                      <div style={{fontSize:"13px",color:"rgba(0,0,0,0.48)",lineHeight:"1.7"}}>{s.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section style={{padding:isMobile?"56px 20px":"100px 32px",textAlign:"center",borderTop:"1px solid rgba(0,0,0,0.09)"}}>
            <OlawinLogo size={isMobile?40:48}></OlawinLogo>
            <h2 style={{fontSize:isMobile?"clamp(36px,9vw,48px)":"clamp(36px,6vw,72px)",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"4px",margin:"24px 0 12px",lineHeight:0.95}}>{t.cta.tryLuck}</h2>
            <p style={{fontSize:"15px",fontFamily:"Playfair Display, serif",fontStyle:"italic",color:"rgba(0,0,0,0.45)",marginBottom:"32px"}}>{activeDraws.length} {t.cta.active}</p>
            <button onClick={scrollToDraws} className="cta-dark" style={{padding:isMobile?"16px 40px":"18px 60px",fontSize:"12px",width:isMobile?"100%":"auto",maxWidth:"400px"}}>{t.cta.viewDraws}</button>
          </section>
        </div>
      );
    }
  } else if (page === "shop") {
    if (!activeDraw) {
      pageContent = (
        <div style={{padding:"100px 20px",textAlign:"center"}}>
          {t.shop.notFound} <button onClick={function(){ goTo("home"); }} style={{textDecoration:"underline",background:"none",border:"none",cursor:"pointer"}}>{t.shop.returnHome}</button>
        </div>
      );
    } else {
      const isPast = isDrawnOrPast(activeDraw);
      pageContent = (
        <div>
          <div style={{position:"relative",height:isMobile?"200px":"300px",overflow:"hidden",background:activeDraw.gradient||"#1A1A1A"}}>
            {activeDraw.image ? <img src={activeDraw.image} alt={activeDraw.location} onError={function(e){e.target.style.display="none";}} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}></img> : null}
            <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,rgba(0,0,0,0.2) 0%,rgba(232,228,220,1) 100%)"}}></div>
            <div style={{position:"absolute",bottom:"20px",left:isMobile?"20px":"48px",right:"20px",display:"flex",alignItems:"center",gap:"10px",flexWrap:"wrap"}}>
              <div style={{background:"rgba(0,0,0,0.55)",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,0.3)",borderRadius:"20px",padding:"6px 14px",fontSize:"13px",letterSpacing:"2px",color:"#ffffff",fontWeight:"700",textShadow:TEXT_SHADOW_STRONG}}>{activeDraw.country} {trd(activeDraw,"location") ? trd(activeDraw,"location").toUpperCase() : ""}</div>
              <button onClick={function(){ goTo("home"); }} style={{background:"rgba(0,0,0,0.45)",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,0.25)",borderRadius:"20px",padding:"6px 14px",color:"#ffffff",fontSize:"12px",cursor:"pointer",fontWeight:"600",textShadow:TEXT_SHADOW_STRONG}}>{t.shop.back}</button>
            </div>
          </div>
          <div style={{maxWidth:"1100px",margin:"0 auto",padding:isMobile?"32px 20px 60px":"40px 32px 60px"}}>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 420px",gap:isMobile?"32px":"64px"}}>
              <div>
                <h1 style={{fontSize:isMobile?"clamp(36px,9vw,48px)":"clamp(42px,5.5vw,72px)",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"3px",lineHeight:0.95,marginBottom:"16px",color:"#1A1A1A",fontWeight:"900"}}>{trd(activeDraw,"title") ? trd(activeDraw,"title").toUpperCase() : ""}</h1>
                <div style={{fontSize:isMobile?"clamp(24px,6vw,32px)":"clamp(28px,3vw,40px)",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"2px",color:"#1A1A1A",marginBottom:"24px",fontWeight:"800"}}>{trd(activeDraw,"prize") ? trd(activeDraw,"prize").toUpperCase() : ""}</div>
                <p style={{fontSize:"15px",color:"rgba(0,0,0,0.65)",lineHeight:"1.8",marginBottom:"24px"}}>{trd(activeDraw,"description")}</p>
                <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"24px",padding:"10px 14px",background:"rgba(0,0,0,0.04)",border:"1px solid rgba(0,0,0,0.08)",borderRadius:"10px",width:"fit-content"}}>
                  <span style={{fontSize:"10px",letterSpacing:"2px",color:"rgba(0,0,0,0.45)",fontFamily:"DM Sans, sans-serif",fontWeight:500,textTransform:"uppercase"}}>{lang==="fr"?"Avec":lang==="es"?"Con":"With"}</span>
                  <img src={PARTNER_LOGO} alt="Private Honors" style={{height:"22px",width:"auto",objectFit:"contain"}}></img>
                </div>
                {activeDraw.drawDate && !isPast ? (
                  <div style={{marginBottom:"24px",padding:"16px 20px",background:"#1A1A1A",borderRadius:"12px",display:"inline-block"}}>
                    <div style={{fontSize:"10px",letterSpacing:"2px",color:"rgba(255,255,255,0.5)",marginBottom:"6px"}}>{t.shop.drawDate}</div>
                    <Countdown endDate={activeDraw.drawDate} t={t} compact={false}></Countdown>
                  </div>
                ) : null}
                <div style={{display:"flex",alignItems:"center",gap:isMobile?"16px":"24px"}}>
                  <ArcProgress pct={pct} label={SOLD_LABEL}></ArcProgress>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:"18px",color:"#1A1A1A",marginBottom:"8px",fontWeight:"800",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"2px"}}>{activeDraw.soldTickets}/{activeDraw.totalTickets} {t.shop.tickets.toUpperCase()}</div>
                    <div style={{background:"rgba(0,0,0,0.08)",borderRadius:"2px",height:"3px"}}>
                      <div style={{width:pct+"%",height:"100%",background:"#1A1A1A",borderRadius:"2px"}}></div>
                    </div>
                  </div>
                  </div>
              </div>
              <div style={{position:isMobile?"static":"sticky",top:"84px",height:"fit-content"}}>
                <div style={{border:"1px solid rgba(0,0,0,0.1)",borderRadius:"20px",padding:isMobile?"24px 20px":"36px",background:"rgba(0,0,0,0.02)",boxShadow:"0 32px 80px rgba(0,0,0,0.08)"}}>
                  {isPast ? (
                    <div style={{textAlign:"center",padding:"24px 0"}}>
                      <div style={{fontSize:"32px",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"4px",color:"rgba(0,0,0,0.4)",marginBottom:"8px"}}>{t.finished}</div>
                      <div style={{fontSize:"13px",color:"rgba(0,0,0,0.4)"}}>{t.countdown.closed}</div>
                    </div>
                  ) : (
                    <div>
                      <div style={{fontSize:"9px",letterSpacing:"3px",color:"rgba(0,0,0,0.38)",marginBottom:"5px"}}>{t.shop.reserve}</div>
                      <div style={{fontSize:"28px",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"3px",marginBottom:"24px",color:"#1A1A1A",fontWeight:"900"}}>{activeDraw.ticketPrice}£ {t.shop.perTicket}</div>
                      <div style={{marginBottom:"20px"}}>
                        <div style={{fontSize:"9px",letterSpacing:"2px",color:"rgba(0,0,0,0.38)",marginBottom:"10px"}}>{t.shop.individual}</div>
                        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:"6px"}}>
                          {TICKET_OPTS.map(function(n) {
                            const cls = "qty-btn" + (qty===n && !selectedPack && customQty==="" ? " active" : "");
                            return <button key={n} onClick={function(){ setQty(n); setCustomQty(""); setSelectedPack(null); }} className={cls} style={{padding:isMobile?"14px 0":"11px 0",fontSize:isMobile?"18px":"16px",minHeight:"44px"}}>{n}</button>;
                          })}
                        </div>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:"8px",marginBottom:"20px"}}>
                        {PACKS.map(function(pack) {
                          const packBase = pack.qty * activeDraw.ticketPrice;
                          const packSave = Math.round(packBase * pack.discount / 100);
                          const packTotal = packBase - packSave;
                          const isActive = selectedPack && selectedPack.qty === pack.qty;
                          return (
                            <button key={pack.qty} onClick={function(){ setSelectedPack(isActive ? null : pack); setQty(0); setCustomQty(""); }} style={{border:"2px solid #1A1A1A",borderRadius:"12px",padding:"14px 16px",background:isActive?"#1A1A1A":"transparent",cursor:"pointer",textAlign:"left",color:isActive?"#fff":"#1A1A1A",fontFamily:"'DM Sans',sans-serif"}}>
                              <div style={{fontSize:"20px",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"2px",marginBottom:"4px"}}>{pack.qty} {t.shop.tickets.toUpperCase()}</div>
                              <div style={{fontSize:"24px",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"2px"}}>{packTotal}£ <span style={{fontSize:"11px",color:"rgba(0,0,0,0.4)"}}>-{pack.discount}%</span></div>
                            </button>
                          );
                        })}
                      </div>
                      <div style={{borderTop:"1px solid rgba(0,0,0,0.08)",paddingTop:"16px",marginBottom:"20px"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                          <span style={{fontSize:"12px",color:"rgba(0,0,0,0.45)"}}>{t.shop.total}</span>
                          <span style={{fontSize:isMobile?"30px":"36px",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"2px"}}>{total}£</span>
                        </div>
                      </div>
                      <button onClick={function(){ goTo("confirm"); }} className="cta-dark" style={{width:"100%",padding:"16px",fontSize:"12px"}}>{t.shop.continueBtn} {total}£</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  } else if (page === "confirm") {
    pageContent = (
      <div style={{maxWidth:"580px",margin:"0 auto",padding:isMobile?"40px 20px":"60px 32px"}}>
        <button onClick={function(){ goTo("shop"); }} style={{background:"none",border:"none",color:"rgba(0,0,0,0.38)",cursor:"pointer",fontSize:"11px",letterSpacing:"2px",marginBottom:"32px"}}>{t.confirm.back}</button>
        <h2 style={{fontSize:isMobile?"32px":"40px",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"3px",marginBottom:"28px"}}>{t.confirm.title}</h2>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"16px"}}>
          <div>
            <label style={LBL}>{t.confirm.firstName}</label>
            <input type="text" value={form.firstName} onChange={function(e){ updateForm("firstName", e.target.value); }} style={INP}></input>
          </div>
          <div>
            <label style={LBL}>{t.confirm.lastName}</label>
            <input type="text" value={form.lastName} onChange={function(e){ updateForm("lastName", e.target.value); }} style={INP}></input>
          </div>
        </div>
        <div style={{marginBottom:"12px"}}>
          <label style={LBL}>{t.confirm.email}</label>
          <input type="email" value={form.email} onChange={function(e){ updateForm("email", e.target.value); }} style={INP}></input>
        </div>
        <div style={{marginBottom:"16px"}}>
          <label style={LBL}>{t.confirm.phone}</label>
          <div style={{display:"flex",gap:"8px"}}>
            <select value={form.phoneCode} onChange={function(e){ updateForm("phoneCode", e.target.value); }} style={Object.assign({}, INP, {width: isMobile?"140px":"180px", flexShrink: 0})}>
              {COUNTRY_CODES.map(function(c) {
                return <option key={c.code+c.name} value={c.code}>{c.code} {c.name}</option>;
              })}
            </select>
            <input type="tel" value={form.phone} onChange={function(e){ updateForm("phone", e.target.value); }} style={Object.assign({}, INP, {flex: 1})}></input>
          </div>
        </div>
        <div style={{marginBottom:"12px"}}>
          <label style={LBL}>{t.confirm.street}</label>
          <input type="text" value={form.address} onChange={function(e){ updateForm("address", e.target.value); }} style={INP}></input>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"110px 1fr",gap:"10px",marginBottom:"12px"}}>
          <div>
            <label style={LBL}>{t.confirm.zip}</label>
            <input type="text" value={form.zip} onChange={function(e){ updateForm("zip", e.target.value); }} style={INP}></input>
          </div>
          <div>
            <label style={LBL}>{t.confirm.city}</label>
            <input type="text" value={form.city} onChange={function(e){ updateForm("city", e.target.value); }} style={INP}></input>
          </div>
        </div>
        <div style={{marginBottom:"20px"}}>
          <label style={LBL}>{t.confirm.country}</label>
          <select value={form.country} onChange={function(e){ updateForm("country", e.target.value); }} style={INP}>
            <option value="">{t.confirm.countryPlaceholder}</option>
            {COUNTRIES.map(function(c) { return <option key={c} value={c}>{c}</option>; })}
          </select>
        </div>
        <div style={{marginBottom:"20px",padding:"18px",border:"1px solid rgba(0,0,0,0.12)",borderRadius:"14px",background:"rgba(0,0,0,0.02)"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"10px",marginBottom:"12px"}}><div style={{fontSize:"13px",fontWeight:600,fontFamily:"'DM Sans',sans-serif",color:"#1A1A1A"}}>{QUIZ[quizIdx].q[lang]}</div><span style={{fontSize:"10px",letterSpacing:"1px",textTransform:"uppercase",color:"#C0392B",fontFamily:"'DM Sans',sans-serif",fontWeight:600,whiteSpace:"nowrap",marginTop:"2px"}}>{lang==="fr"?"Réponse obligatoire":lang==="es"?"Respuesta obligatoria":"Answer required"}</span></div>
<div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
{QUIZ[quizIdx].opts.map(function(opt,oi){ return (
<button key={oi} type="button" onClick={function(){ if(oi===QUIZ[quizIdx].a){ setQuizOk(true); setQuizError(false); } else { setQuizError(true); } }} style={{padding:"12px 14px",borderRadius:"10px",border:quizOk&&oi===QUIZ[quizIdx].a?"2px solid #1A8A3A":"2px solid #1A1A1A",background:quizOk&&oi===QUIZ[quizIdx].a?"#1A8A3A":"transparent",color:quizOk&&oi===QUIZ[quizIdx].a?"#fff":"#1A1A1A",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"13px",textAlign:"left"}}>{opt}</button>
); })}
</div>
{quizError ? <div style={{marginTop:"10px",fontSize:"12px",color:"#C0392B",fontFamily:"'DM Sans',sans-serif"}}>{lang==="fr"?"Mauvaise réponse, réessayez.":lang==="es"?"Respuesta incorrecta, inténtalo de nuevo.":"Wrong answer, try again."}</div> : null}
{quizOk ? <div style={{marginTop:"10px",fontSize:"12px",color:"#1A8A3A",fontFamily:"'DM Sans',sans-serif"}}>{lang==="fr"?"Bonne réponse !":lang==="es"?"¡Respuesta correcta!":"Correct!"}</div> : null}
</div>
<button onClick={handlePay} disabled={!formValid || paying} className="cta-dark" style={{width:"100%",padding:"17px",fontSize:"12px"}}>
          {paying ? t.confirm.processing : (t.confirm.pay + " " + total + "£ " + t.confirm.payVia)}
        </button>
      </div>
    );
  } else if (page === "success") {
    pageContent = (
      <div style={{minHeight:"80vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"60px 24px"}}>
        <div style={{maxWidth:"500px",width:"100%",textAlign:"center"}}>
          <OlawinLogo size={56}></OlawinLogo>
          <h1 style={{fontSize:isMobile?"42px":"56px",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"4px",margin:"20px 0 16px"}}>{t.success.title}</h1>
          <p style={{fontSize:"14px",color:"rgba(0,0,0,0.45)",marginBottom:"24px"}}>{t.success.msg}</p>
          {lastOrderNumber ? (
            <div style={{background:"rgba(0,0,0,0.04)",border:"1px solid rgba(0,0,0,0.1)",borderRadius:"14px",padding:"20px",marginBottom:"24px"}}>
              <div style={{fontSize:"10px",letterSpacing:"3px",color:"rgba(0,0,0,0.4)",marginBottom:"8px"}}>{t.success.orderNum}</div>
              <div style={{fontSize:"28px",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"4px",color:"#1A1A1A",marginBottom:"8px"}}>OLA-{lastOrderNumber}</div>
              <div style={{fontSize:"11px",color:"rgba(0,0,0,0.5)",lineHeight:"1.5"}}>{t.success.saveIt}</div>
            </div>
          ) : null}
          <button onClick={function(){ goTo("home"); }} className="cta-dark" style={{padding:"13px 28px",fontSize:"11px"}}>{t.success.home}</button>
        </div>
      </div>
    );
  } else if (page === "mytickets") {
    pageContent = (
      <div style={{maxWidth:"720px",margin:"0 auto",padding:isMobile?"48px 20px 60px":"80px 32px 80px"}}>
        <h1 style={{fontSize:isMobile?"42px":"56px",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"4px",marginBottom:"16px"}}>{t.myTickets.title}</h1>
        {!foundOrders ? (
          <div>
            <p style={{fontSize:"14px",color:"rgba(0,0,0,0.55)",lineHeight:"1.7",marginBottom:"32px"}}>{t.myTickets.subtitle}</p>
            <div style={{marginBottom:"16px"}}>
              <label style={LBL}>{t.myTickets.emailLabel}</label>
              <input type="email" value={searchEmail} onChange={function(e){ setSearchEmail(e.target.value); }} style={INP}></input>
            </div>
            <div style={{marginBottom:"8px"}}>
              <label style={LBL}>{t.myTickets.orderLabel}</label>
              <input type="text" value={searchOrder} onChange={function(e){ setSearchOrder(e.target.value); }} placeholder="OLA-XXXXXX" style={INP}></input>
            </div>
            <div style={{fontSize:"11px",color:"rgba(0,0,0,0.45)",marginBottom:"24px",lineHeight:"1.5"}}>{t.myTickets.orderHint}</div>
            {searchError ? (
              <div style={{background:"rgba(220,50,50,0.08)",border:"1px solid rgba(220,50,50,0.2)",borderRadius:"10px",padding:"14px 16px",marginBottom:"16px",fontSize:"13px",color:"rgba(180,30,30,0.9)"}}>
                {t.myTickets.notFound}
              </div>
            ) : null}
            <button onClick={handleSearch} disabled={!searchEmail || !searchOrder || searching} className="cta-dark" style={{width:"100%",padding:"16px",fontSize:"12px"}}>
              {searching ? t.myTickets.searching : t.myTickets.search}
            </button>
          </div>
        ) : (
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"28px",flexWrap:"wrap",gap:"12px"}}>
              <div style={{fontSize:"11px",letterSpacing:"3px",color:"rgba(0,0,0,0.4)"}}>{t.myTickets.found} ({foundOrders.length})</div>
              <button onClick={resetSearch} style={{background:"none",border:"1px solid rgba(0,0,0,0.15)",borderRadius:"20px",padding:"6px 14px",fontSize:"10px",letterSpacing:"2px",cursor:"pointer",color:"rgba(0,0,0,0.55)",fontFamily:"DM Sans, sans-serif"}}>{t.myTickets.logout}</button>
            </div>
            {foundOrders.map(function(order, i) {
              const displayOrderNum = order.orderNumber || order.id.slice(-6).toUpperCase();
              const orderDate = order.createdAt && order.createdAt.toDate ? fmtDateLong(order.createdAt.toDate()) : "";
              return (
                <div key={order.id} style={{border:"1px solid rgba(0,0,0,0.1)",borderRadius:"16px",padding:isMobile?"20px":"28px",marginBottom:"16px",background:"rgba(0,0,0,0.02)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:"10px",marginBottom:"16px",paddingBottom:"16px",borderBottom:"1px solid rgba(0,0,0,0.08)"}}>
                    <div>
                      <div style={{fontSize:"10px",letterSpacing:"2px",color:"rgba(0,0,0,0.4)",marginBottom:"6px"}}>OLA-{displayOrderNum}</div>
                      <div style={{fontSize:"20px",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"2px",color:"#1A1A1A"}}>{order.drawTitle ? order.drawTitle.toUpperCase() : ""}</div>
                    </div>
                    <div style={{textAlign:isMobile?"left":"right"}}>
                      <div style={{fontSize:"10px",color:"rgba(0,0,0,0.4)",marginBottom:"4px"}}>{t.myTickets.totalPaid}</div>
                      <div style={{fontSize:"22px",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"2px"}}>{order.amount}£</div>
                    </div>
                  </div>
                  {orderDate ? (
                    <div style={{fontSize:"12px",color:"rgba(0,0,0,0.5)",marginBottom:"14px"}}>{t.myTickets.orderDate} {orderDate}</div>
                  ) : null}
                  <div style={{fontSize:"10px",letterSpacing:"2px",color:"rgba(0,0,0,0.4)",marginBottom:"10px"}}>{t.myTickets.ticketsLabel}</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
                    {(order.ticketNums || []).map(function(n, idx) {
                      return (
                        <span key={idx} style={{display:"inline-block",background:"#1A1A1A",color:"#E8E4DC",borderRadius:"8px",padding:"6px 12px",fontSize:"13px",fontFamily:"Courier New, monospace",fontWeight:"600",letterSpacing:"1px"}}>
                          #{String(n).padStart(3,"0")}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  } else if (page === "faq") {
    pageContent = (
      <div style={{maxWidth:"700px",margin:"0 auto",padding:isMobile?"48px 20px":"80px 32px"}}>
        <h1 style={{fontSize:isMobile?"42px":"56px",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"4px",marginBottom:"40px"}}>{t.faq.title}</h1>
        {faqItems.map(function(item, i) {
          return (
            <div key={i} style={{borderTop: i===0 ? "1px solid rgba(0,0,0,0.08)" : "none", borderBottom:"1px solid rgba(0,0,0,0.08)"}}>
              <button onClick={function(){ setOpenFaq(openFaq===i ? null : i); }} style={{width:"100%",padding:"20px 4px",display:"flex",justifyContent:"space-between",alignItems:"center",background:"none",border:"none",fontSize:"16px",cursor:"pointer",textAlign:"left",fontFamily:"Playfair Display, serif"}}>
                <span>{item.q}</span>
                <span>{openFaq===i ? "-" : "+"}</span>
              </button>
              {openFaq===i ? <div style={{padding:"0 4px 20px",fontSize:"13px",color:"rgba(0,0,0,0.5)",lineHeight:"1.75"}}>{item.a}</div> : null}
            </div>
          );
        })}
      </div>
    );
  } else if (page === "legal") {
    pageContent = (
      <div style={{maxWidth:"700px",margin:"0 auto",padding:isMobile?"48px 20px":"80px 32px"}}>
        <h1 style={{fontSize:isMobile?"42px":"56px",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"4px",marginBottom:"40px"}}>{t.legal.title}</h1>
        <div style={{fontSize:"13px",color:"rgba(0,0,0,0.6)",lineHeight:"1.8",whiteSpace:"pre-wrap",fontFamily:"DM Sans, sans-serif"}}>{(legalConfig && legalConfig[lang]) ? legalConfig[lang] : t.legal.body}</div>
      </div>
    );
  }

  const showWA = socialConfig && socialConfig.whatsapp && socialConfig.whatsapp.enabled && socialConfig.whatsapp.phone;
  const showIG = socialConfig && socialConfig.instagram && socialConfig.instagram.enabled && socialConfig.instagram.username;
  const igUrl = showIG ? "https://instagram.com/" + socialConfig.instagram.username.replace(/^@/, "") : "";

  return (
    <div ref={topRef} style={{background:C_BG,minHeight:"100vh",color:"#1A1A1A"}}>
      <style>{CSS}</style>{!ageVerified && (
<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:99999,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
<div style={{background:"#E8E4DC",borderRadius:"18px",maxWidth:"420px",width:"100%",padding:"40px 32px",textAlign:"center"}}>
<div style={{marginBottom:"18px"}}><OlawinLogo size={32}></OlawinLogo></div>
<div style={{display:"flex",justifyContent:"center",gap:"6px",marginBottom:"20px"}}>
{[{code:"fr",label:"FR"},{code:"en",label:"EN"},{code:"es",label:"ES"}].map(function(l){ return (<button key={l.code} onClick={function(){ setLang(l.code); try { localStorage.setItem("olawin_lang", l.code); } catch(e){} }} style={{background:lang===l.code?"#1A1A1A":"transparent",color:lang===l.code?"#E8E4DC":"#1A1A1A",border:"1px solid rgba(0,0,0,0.2)",borderRadius:"8px",padding:"6px 14px",fontSize:"12px",fontWeight:"500",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{l.label}</button>); })}
</div>
<div style={{fontSize:"11px",letterSpacing:"2px",color:"rgba(0,0,0,0.4)",marginBottom:"10px"}}>{lang==="en"?"AGE VERIFICATION":lang==="es"?"VERIFICACION DE EDAD":"VERIFICATION D'AGE"}</div>
<div style={{fontSize:"21px",fontWeight:"500",color:"#1A1A1A",marginBottom:"12px",fontFamily:"'DM Sans',sans-serif"}}>{lang==="en"?"Are you over 18?":lang==="es"?"Tienes mas de 18 anos?":"Avez-vous plus de 18 ans ?"}</div>
<div style={{fontSize:"14px",color:"rgba(0,0,0,0.6)",lineHeight:"1.6",marginBottom:"26px"}}>{ageWarning ? (lang==="en"?"You must be 18 or older to take part in Olawin draws. Please come back when you reach the legal age.":lang==="es"?"Debes tener 18 anos o mas para participar en los sorteos Olawin. Vuelve cuando tengas la edad legal.":"Vous devez avoir 18 ans ou plus pour participer aux tirages Olawin. Revenez lorsque vous aurez l'age legal.") : (lang==="en"?"Participation in Olawin draws is strictly reserved for adults (18 years and older).":lang==="es"?"La participacion en los sorteos Olawin esta reservada a personas mayores de edad (18 anos o mas).":"La participation aux tirages Olawin est strictement reservee aux personnes majeures (18 ans et plus).")}</div>
<div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
<button onClick={function(){ try { localStorage.setItem("olawin_age_ok","1"); } catch(e){} setAgeVerified(true); }} style={{background:"#1A1A1A",color:"#E8E4DC",border:"none",borderRadius:"12px",padding:"15px",fontSize:"13px",fontWeight:"500",letterSpacing:"1px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{lang==="en"?"I AM 18 OR OLDER":lang==="es"?"TENGO 18 ANOS O MAS":"J'AI PLUS DE 18 ANS"}</button>
<button onClick={function(){ setAgeWarning(true); }} style={{background:"transparent",color:"#1A1A1A",border:"1.5px solid rgba(0,0,0,0.25)",borderRadius:"12px",padding:"15px",fontSize:"13px",fontWeight:"500",letterSpacing:"1px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{lang==="en"?"I AM UNDER 18":lang==="es"?"TENGO MENOS DE 18":"J'AI MOINS DE 18 ANS"}</button>
</div>
<div style={{fontSize:"11px",color:"rgba(0,0,0,0.35)",lineHeight:"1.5",marginTop:"22px"}}>{lang==="en"?"By continuing, you confirm you meet the legal age requirement. Play responsibly.":lang==="es"?"Al continuar, confirmas que cumples con la edad legal requerida. Juega con moderacion.":"En continuant, vous confirmez avoir l'age legal requis. Jouez avec moderation."}</div>
</div>
</div>
)}
      {comingSoonContent}
        {comingSoonContent}
        {navContent}
        {pageContent}
      <footer style={{borderTop:"1px solid rgba(0,0,0,0.09)",padding:isMobile?"32px 20px":"48px",display:"flex",flexDirection:isMobile?"column":"row",alignItems:"center",justifyContent:"space-between",gap:"20px",textAlign:isMobile?"center":"left"}}>
        <div>
          <OlawinLogo size={26}></OlawinLogo>
          <div style={{fontSize:"10px",color:"rgba(0,0,0,0.28)",marginTop:"6px"}}>{footerCopyright}</div>
        </div>
        <div style={{display:"flex",gap:"20px",alignItems:"center",flexWrap:"wrap",justifyContent:"center"}}>
          <button onClick={function(){ goTo("mytickets"); }} className="nav-link">{t.nav.myTickets}</button>
          <button onClick={function(){ goTo("faq"); }} className="nav-link">{t.nav.faq}</button>
          <button onClick={function(){ goTo("legal"); }} className="nav-link">{t.nav.legal}</button>
          <a href={"mailto:" + footerContactEmail} style={{fontSize:"11px",letterSpacing:"2px",color:"rgba(0,0,0,0.38)",textDecoration:"none",textTransform:"uppercase"}}>{t.footer.contact}</a>
          {showIG ? (
            <a href={igUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram" style={{display:"inline-flex",alignItems:"center",padding:"4px",borderRadius:"50%",transition:"opacity 0.2s"}} onMouseEnter={function(e){e.currentTarget.style.opacity="0.6";}} onMouseLeave={function(e){e.currentTarget.style.opacity="1";}}>
              <InstagramIcon size={18}></InstagramIcon>
            </a>
          ) : null}
        </div>
      </footer>
      {showWA ? <WhatsAppButton phone={socialConfig.whatsapp.phone} message={socialConfig.whatsapp.message}></WhatsAppButton> : null}
    </div>
  );
}
