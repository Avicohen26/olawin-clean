// ════════════════════════════════════════════════════════════
// olawin-client.jsx — Site multilingue EN/FR/ES (complet)
// ════════════════════════════════════════════════════════════
import { useState, useEffect, useRef } from "react";
import { db } from "./firebase";
import {
  collection, onSnapshot, query, orderBy,
  addDoc, serverTimestamp, doc, updateDoc, increment,
} from "firebase/firestore";
import { sendTicketConfirmation, sendAdminNotification } from "./emails";

// ── TRADUCTIONS ──────────────────────────────────────────────
const T = {
  en: {
    nav: { draws:"Draws", faq:"FAQ", legal:"Legal", buy:"BUY" },
    hero: { live:"LIVE · CLOSES", buyTicket:"BUY A TICKET", remaining:"tickets remaining out of" },
    section: { thisWeek:"THIS WEEK", allDraws:"ALL DRAWS", activeDraws:"active draws", howItWorks:"HOW IT WORKS", process:"PROCESS" },
    stats: { active:"ACTIVE DRAWS", value:"TOTAL VALUE", remaining:"TICKETS LEFT", countries:"ELIGIBLE COUNTRIES" },
    cta: { tryLuck:"TRY YOUR LUCK", viewDraws:"VIEW DRAWS", active:"active draw" },
    empty: { title:"NO DRAW IN PROGRESS", sub:"Come back soon, new draws every week!" },
    loading: "LOADING...",
    partner: "WITH OUR PARTNER",
    partnerMobile: "OUR PARTNER",
    steps: [
      {title:"Choose",desc:"Select the draw and your tickets."},
      {title:"Pay",desc:"100% secure payment via Stripe."},
      {title:"Track",desc:"Receive your ticket number by email."},
      {title:"Win",desc:"Live draw streamed on our channels."},
    ],
    shop: {
      back: "← Back",
      notFound: "Draw not found.",
      returnHome: "Return",
      reserve: "RESERVE YOUR TICKETS",
      perTicket: "/ TICKET",
      individual: "INDIVIDUAL TICKETS",
      total: "TOTAL",
      continue: "CONTINUE →",
      tickets: "tickets",
      packs: { silver:"SILVER PACK", gold:"GOLD PACK", elite:"ELITE PACK" },
    },
    confirm: {
      back: "← BACK",
      title: "YOUR INFORMATION",
      firstName: "FIRST NAME *",
      lastName: "LAST NAME *",
      email: "EMAIL *",
      phone: "PHONE *",
      street: "STREET *",
      zip: "ZIP *",
      city: "CITY *",
      country: "COUNTRY *",
      countryPlaceholder: "Select...",
      pay: "PAY",
      payVia: "VIA STRIPE",
      processing: "PROCESSING...",
      bookingError: "An error occurred during booking.",
    },
    success: {
      title: "GOOD LUCK!",
      msgOne: "Your ticket is registered.",
      msgMany: "Your {n} tickets are registered.",
      home: "HOME",
    },
    faq: {
      title: "FAQ",
      items: [
        { q:"How does the draw work?", a:"At the closing date, a certified random draw is performed live on our channels." },
        { q:"When do I receive my ticket?", a:"Immediately after Stripe payment — a confirmation email is sent automatically." },
        { q:"What happens if not all tickets are sold?", a:"The draw still takes place. Your chances increase." },
        { q:"How do I use the PrivateHonors voucher?", a:"The winner receives a code by email within 48h." },
        { q:"Is payment secure?", a:"100%. Stripe does not store any banking data." },
      ],
    },
    legal: {
      title: "LEGAL",
      body: "Terms and conditions of use. Any person of legal age may participate. The draw is conducted publicly. The winner receives a voucher within 48 hours.",
    },
    footer: { copyright: "© 2026 Olawin.", contact: "Contact" },
  },
  fr: {
    nav: { draws:"Tirages", faq:"FAQ", legal:"Légal", buy:"ACHETER" },
    hero: { live:"EN COURS · CLÔTURE", buyTicket:"ACHETER UN TICKET", remaining:"tickets restants sur" },
    section: { thisWeek:"CETTE SEMAINE", allDraws:"TOUS LES TIRAGES", activeDraws:"tirage(s) actif(s)", howItWorks:"COMMENT ÇA MARCHE", process:"PROCESSUS" },
    stats: { active:"TIRAGES ACTIFS", value:"VALEUR TOTALE", remaining:"TICKETS RESTANTS", countries:"PAYS ÉLIGIBLES" },
    cta: { tryLuck:"TENTEZ VOTRE CHANCE", viewDraws:"VOIR LES TIRAGES", active:"tirage(s) actif(s)" },
    empty: { title:"AUCUN TIRAGE EN COURS", sub:"Revenez bientôt, de nouveaux tirages chaque semaine !" },
    loading: "CHARGEMENT...",
    partner: "AVEC NOTRE PARTENAIRE",
    partnerMobile: "NOTRE PARTENAIRE",
    steps: [
      {title:"Choisissez",desc:"Sélectionnez le tirage et vos tickets."},
      {title:"Payez",desc:"Paiement 100% sécurisé via Stripe."},
      {title:"Suivez",desc:"Recevez votre numéro de ticket par email."},
      {title:"Gagnez",desc:"Le tirage en direct est diffusé sur nos réseaux."},
    ],
    shop: {
      back: "← Retour",
      notFound: "Tirage introuvable.",
      returnHome: "Retour",
      reserve: "RÉSERVER VOS TICKETS",
      perTicket: "/ TICKET",
      individual: "TICKETS INDIVIDUELS",
      total: "TOTAL",
      continue: "CONTINUER →",
      tickets: "tickets",
      packs: { silver:"PACK SILVER", gold:"PACK GOLD", elite:"PACK ELITE" },
    },
    confirm: {
      back: "← RETOUR",
      title: "VOS INFORMATIONS",
      firstName: "PRÉNOM *",
      lastName: "NOM *",
      email: "EMAIL *",
      phone: "TÉLÉPHONE *",
      street: "RUE *",
      zip: "CP *",
      city: "VILLE *",
      country: "PAYS *",
      countryPlaceholder: "Sélectionner...",
      pay: "PAYER",
      payVia: "VIA STRIPE",
      processing: "EN COURS...",
      bookingError: "Erreur lors de la réservation.",
    },
    success: {
      title: "BONNE CHANCE !",
      msgOne: "Votre ticket est enregistré.",
      msgMany: "Vos {n} tickets sont enregistrés.",
      home: "ACCUEIL",
    },
    faq: {
      title: "FAQ",
      items: [
        { q:"Comment fonctionne le tirage ?", a:"À la date de clôture, un tirage aléatoire certifié est effectué en live sur nos réseaux." },
        { q:"Quand je reçois mon ticket ?", a:"Immédiatement après paiement Stripe — un email de confirmation vous est envoyé automatiquement." },
        { q:"Que se passe-t-il si les tickets ne sont pas tous vendus ?", a:"Le tirage se tient quand même. Vos chances augmentent." },
        { q:"Comment utiliser le bon PrivateHonors ?", a:"Le gagnant reçoit un code par email dans les 48h." },
        { q:"Le paiement est-il sécurisé ?", a:"100%. Stripe ne stocke aucune donnée bancaire." },
      ],
    },
    legal: {
      title: "LÉGAL",
      body: "Conditions générales d'utilisation. Toute personne majeure peut participer. Le tirage est effectué publiquement. Le gagnant reçoit un bon dans les 48h.",
    },
    footer: { copyright: "© 2026 Olawin.", contact: "Contact" },
  },
  es: {
    nav: { draws:"Sorteos", faq:"FAQ", legal:"Legal", buy:"COMPRAR" },
    hero: { live:"EN VIVO · CIERRE", buyTicket:"COMPRAR UN BOLETO", remaining:"boletos restantes de" },
    section: { thisWeek:"ESTA SEMANA", allDraws:"TODOS LOS SORTEOS", activeDraws:"sorteo(s) activo(s)", howItWorks:"CÓMO FUNCIONA", process:"PROCESO" },
    stats: { active:"SORTEOS ACTIVOS", value:"VALOR TOTAL", remaining:"BOLETOS DISPONIBLES", countries:"PAÍSES ELEGIBLES" },
    cta: { tryLuck:"PRUEBA TU SUERTE", viewDraws:"VER SORTEOS", active:"sorteo(s) activo(s)" },
    empty: { title:"NINGÚN SORTEO EN CURSO", sub:"¡Vuelve pronto, nuevos sorteos cada semana!" },
    loading: "CARGANDO...",
    partner: "CON NUESTRO SOCIO",
    partnerMobile: "NUESTRO SOCIO",
    steps: [
      {title:"Elige",desc:"Selecciona el sorteo y tus boletos."},
      {title:"Paga",desc:"Pago 100% seguro vía Stripe."},
      {title:"Sigue",desc:"Recibe tu número de boleto por email."},
      {title:"Gana",desc:"Sorteo en vivo transmitido en nuestras redes."},
    ],
    shop: {
      back: "← Atrás",
      notFound: "Sorteo no encontrado.",
      returnHome: "Volver",
      reserve: "RESERVA TUS BOLETOS",
      perTicket: "/ BOLETO",
      individual: "BOLETOS INDIVIDUALES",
      total: "TOTAL",
      continue: "CONTINUAR →",
      tickets: "boletos",
      packs: { silver:"PACK SILVER", gold:"PACK GOLD", elite:"PACK ELITE" },
    },
    confirm: {
      back: "← ATRÁS",
      title: "TUS DATOS",
      firstName: "NOMBRE *",
      lastName: "APELLIDO *",
      email: "EMAIL *",
      phone: "TELÉFONO *",
      street: "CALLE *",
      zip: "CP *",
      city: "CIUDAD *",
      country: "PAÍS *",
      countryPlaceholder: "Seleccionar...",
      pay: "PAGAR",
      payVia: "VÍA STRIPE",
      processing: "PROCESANDO...",
      bookingError: "Error en la reserva.",
    },
    success: {
      title: "¡BUENA SUERTE!",
      msgOne: "Tu boleto está registrado.",
      msgMany: "Tus {n} boletos están registrados.",
      home: "INICIO",
    },
    faq: {
      title: "FAQ",
      items: [
        { q:"¿Cómo funciona el sorteo?", a:"En la fecha de cierre, se realiza un sorteo aleatorio certificado en vivo en nuestras redes." },
        { q:"¿Cuándo recibo mi boleto?", a:"Inmediatamente después del pago con Stripe — se envía un email de confirmación automáticamente." },
        { q:"¿Qué pasa si no se venden todos los boletos?", a:"El sorteo se realiza igualmente. Tus posibilidades aumentan." },
        { q:"¿Cómo uso el bono PrivateHonors?", a:"El ganador recibe un código por email en las 48h." },
        { q:"¿Es seguro el pago?", a:"100%. Stripe no almacena ningún dato bancario." },
      ],
    },
    legal: {
      title: "LEGAL",
      body: "Términos y condiciones de uso. Cualquier persona mayor de edad puede participar. El sorteo se realiza públicamente. El ganador recibe un bono en un plazo de 48 horas.",
    },
    footer: { copyright: "© 2026 Olawin.", contact: "Contacto" },
  },
};

const PACKS = [
  { qty: 15, discount: 10, key: "silver" },
  { qty: 25, discount: 15, key: "gold" },
  { qty: 50, discount: 20, key: "elite" },
];

const TICKET_OPTS = [1,2,3,4,5,6,7,8,9,10];
const C_BG = "#D8D4CE";
const PARTNER_LOGO = "https://raw.githubusercontent.com/Avicohen26/olawin-clean/main/private-honors-logo.png";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

function OlawinLogo({ size=36, showText=true }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <polygon points="20,2 38,20 20,38 2,20" fill="none" stroke="#1A1A1A" strokeWidth="1.5"/>
        <circle cx="20" cy="20" r="7" fill="none" stroke="#1A1A1A" strokeWidth="1.5"/>
        <circle cx="20" cy="6" r="1.5" fill="#1A1A1A"/>
        <circle cx="34" cy="20" r="1.5" fill="#1A1A1A"/>
        <circle cx="20" cy="34" r="1.5" fill="#1A1A1A"/>
        <circle cx="6" cy="20" r="1.5" fill="#1A1A1A"/>
      </svg>
      {showText && <span style={{fontSize:size*0.56,letterSpacing:"4px",fontFamily:"'Bebas Neue',sans-serif",color:"#1A1A1A",lineHeight:1}}>OLAWIN</span>}
    </div>
  );
}

function ArcProgress({pct, label}) {
  const r=70,circ=2*Math.PI*r;
  return (
    <svg width="140" height="140" viewBox="0 0 160 160">
      <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="6"/>
      <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(0,0,0,0.75)" strokeWidth="6"
        strokeDasharray={circ} strokeDashoffset={circ-(pct/100)*circ}
        strokeLinecap="round" transform="rotate(-90 80 80)"/>
      <text x="80" y="74" textAnchor="middle" fill="#111" fontSize="26" fontFamily="'Bebas Neue',sans-serif">{pct}%</text>
      <text x="80" y="90" textAnchor="middle" fill="rgba(0,0,0,0.4)" fontSize="9" fontFamily="sans-serif" letterSpacing="2">{label}</text>
    </svg>
  );
}

function DrawCard({ draw, onClick }) {
  const [hovered, setHovered] = useState(false);
  const pct = Math.round((draw.soldTickets / draw.totalTickets)*100);
  return (
    <div onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} onClick={onClick}
      style={{position:"relative",borderRadius:"18px",overflow:"hidden",cursor:"pointer",height:"320px",border:`1px solid ${hovered?"rgba(0,0,0,0.2)":"rgba(0,0,0,0.08)"}`,transition:"all 0.3s",boxShadow:hovered?"0 20px 48px rgba(0,0,0,0.18)":"0 4px 16px rgba(0,0,0,0.06)",transform:hovered?"translateY(-4px)":"none"}}>
      <div style={{position:"absolute",inset:0,background:draw.gradient||"#333"}}/>
      <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontSize:"80px",opacity:0.12,zIndex:1}}>{draw.emoji}</div>
      {draw.image && <img src={draw.image} alt={draw.location} onError={e=>e.target.style.display="none"} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",objectPosition:draw.heroPosition||"center"}}/>}
      <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.82) 0%,rgba(0,0,0,0.2) 60%,rgba(0,0,0,0.0) 100%)",zIndex:2}}/>
      <div style={{position:"absolute",inset:0,padding:"24px",display:"flex",flexDirection:"column",justifyContent:"space-between",zIndex:3}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:"6px"}}>
          <div style={{background:"rgba(255,255,255,0.15)",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:"20px",padding:"4px 12px",fontSize:"10px",letterSpacing:"1.5px",color:"rgba(255,255,255,0.9)"}}>{draw.country} {draw.location?.toUpperCase()}</div>
          <div style={{background:"rgba(255,255,255,0.12)",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:"20px",padding:"4px 12px",fontSize:"10px",color:"rgba(255,255,255,0.8)"}}>{draw.ticketPrice}$ / ticket</div>
        </div>
        <div>
          <div style={{fontSize:"11px",letterSpacing:"1px",color:"rgba(255,255,255,0.55)",marginBottom:"6px"}}>{draw.title?.toUpperCase()}</div>
          <div style={{fontSize:"clamp(22px,3vw,34px)",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"3px",color:"#fff",lineHeight:0.95,marginBottom:"14px"}}>{draw.prize?.toUpperCase()}</div>
          <div style={{marginBottom:"14px"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"5px"}}>
              <span style={{fontSize:"10px",color:"rgba(255,255,255,0.55)"}}>{draw.soldTickets}/{draw.totalTickets}</span>
              <span style={{fontSize:"10px",color:"rgba(255,255,255,0.7)"}}>{pct}%</span>
            </div>
            <div style={{background:"rgba(255,255,255,0.15)",borderRadius:"2px",height:"2px"}}>
              <div style={{width:`${pct}%`,height:"100%",background:"rgba(255,255,255,0.85)",borderRadius:"2px"}}/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LangSwitcher({ lang, setLang, isMobile }) {
  const langs = [
    { code:"en", label:"EN" },
    { code:"fr", label:"FR" },
    { code:"es", label:"ES" },
  ];
  return (
    <div style={{display:"flex",alignItems:"center",gap:"4px",background:"rgba(0,0,0,0.05)",border:"1px solid rgba(0,0,0,0.08)",borderRadius:"20px",padding:"3px"}}>
      {langs.map(l=>(
        <button key={l.code} onClick={()=>{setLang(l.code);localStorage.setItem("olawin_lang",l.code);}}
          style={{
            background: lang===l.code ? "#1A1A1A" : "transparent",
            color: lang===l.code ? "#E8E4DC" : "rgba(0,0,0,0.5)",
            border:"none",borderRadius:"16px",
            padding: isMobile ? "5px 9px" : "5px 11px",
            fontSize:"10px",letterSpacing:"1px",fontWeight:"600",
            cursor:"pointer",fontFamily:"'DM Sans',sans-serif",
            transition:"all 0.2s",
          }}>
          {l.label}
        </button>
      ))}
    </div>
  );
}
export default function Olawin() {
  const isMobile = useIsMobile();
  const [lang, setLang] = useState(() => {
    if (typeof window === "undefined") return "en";
    const saved = localStorage.getItem("olawin_lang");
    if (saved && T[saved]) return saved;
    const browser = (navigator.language || "").slice(0,2).toLowerCase();
    if (T[browser]) return browser;
    return "en";
  });
  const t = T[lang];

  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = lang;
  }, [lang]);

  const [page, setPage] = useState("home");
  const [draws, setDraws] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDraw, setSelectedDraw] = useState(null);
  const [selectedPack, setSelectedPack] = useState(null);
  const [qty, setQty] = useState(1);
  const [customQty, setCustomQty] = useState("");
  const [form, setForm] = useState({firstName:"",lastName:"",email:"",phoneCode:"+1",phone:"",address:"",city:"",zip:"",country:""});
  const [openFaq, setOpenFaq] = useState(null);
  const [paying, setPaying] = useState(false);
  const [ticketNums, setTicketNums] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const topRef = useRef();

  useEffect(() => {
    const q = query(collection(db,"draws"), orderBy("createdAt","desc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setDraws(data.filter(d => d.status === "active"));
      setLoading(false);
    }, (err) => { console.error("Firebase error:", err); setLoading(false); });
    return () => unsub();
  }, []);

  const activeDraw = selectedDraw;
  const remaining = activeDraw ? activeDraw.totalTickets - activeDraw.soldTickets : 0;
  const finalQty = selectedPack ? selectedPack.qty : customQty !== "" ? Math.min(parseInt(customQty)||1, remaining) : qty;
  const discount = selectedPack ? selectedPack.discount : 0;
  const baseTotal = finalQty * (activeDraw?.ticketPrice || 0);
  const savings = Math.round(baseTotal * discount / 100);
  const total = baseTotal - savings;
  const pct = activeDraw ? Math.round((activeDraw.soldTickets / activeDraw.totalTickets)*100) : 0;
  const formValid = form.firstName && form.lastName && form.email && form.phone && form.address && form.city && form.country;
  const featured = draws[0] || null;
  const localeMap = { en:"en-US", fr:"fr-FR", es:"es-ES" };
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString(localeMap[lang],{day:"numeric",month:"short"}) : "";

  const fmt = (str, vars) => Object.keys(vars||{}).reduce((s,k)=>s.replace(`{${k}}`, vars[k]), str);

  const goTo = (p) => {
    setPage(p); setMenuOpen(false);
    setTimeout(()=>topRef.current?.scrollIntoView({behavior:"smooth"}),50);
  };

  const handlePay = async () => {
    if (!formValid || !activeDraw) return;
    setPaying(true);
    const used=new Set(); const nums=[];
    while(nums.length<finalQty){
      const n=Math.floor(Math.random()*(activeDraw.totalTickets-activeDraw.soldTickets))+activeDraw.soldTickets+1;
      if(!used.has(n)){used.add(n);nums.push(n);}
    }
    setTicketNums(nums);
    try {
      await addDoc(collection(db,"orders"),{
        drawId: activeDraw.id, drawTitle: activeDraw.title,
        firstName: form.firstName, lastName: form.lastName, email: form.email,
        phone: `${form.phoneCode} ${form.phone}`,
        address: `${form.address}, ${form.zip} ${form.city}, ${form.country}`,
        tickets: finalQty, ticketNums: nums, amount: total,
        discount: discount, pack: selectedPack?.key || null,
        status: "paid", createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db,"draws",activeDraw.id),{ soldTickets: increment(finalQty) });
      await Promise.allSettled([
        sendTicketConfirmation({ firstName: form.firstName, lastName: form.lastName, email: form.email, drawTitle: activeDraw.title, drawLocation: activeDraw.location, drawCountry: activeDraw.country, drawDate: activeDraw.drawDate, ticketNums: nums, qty: finalQty, total, discount, pack: selectedPack?.key || null }),
        sendAdminNotification({ firstName: form.firstName, lastName: form.lastName, email: form.email, phone: `${form.phoneCode} ${form.phone}`, address: `${form.address}, ${form.zip} ${form.city}, ${form.country}`, drawTitle: activeDraw.title, drawLocation: activeDraw.location, drawCountry: activeDraw.country, ticketNums: nums, qty: finalQty, total, pack: selectedPack?.key || null, orderId: `ORD-${Date.now()}` }),
      ]);
      setPaying(false); goTo("success");
    } catch(err) { console.error("Erreur Firebase:", err); setPaying(false); alert(t.confirm.bookingError); }
  };

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Playfair+Display:ital,wght@0,300;0,400;1,300&family=DM+Sans:wght@300;400;500;600&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    html{scroll-behavior:smooth;}
    body{background:${C_BG};color:#1A1A1A;overflow-x:hidden;}
    ::selection{background:rgba(0,0,0,0.1);}
    input::placeholder,textarea::placeholder,select::placeholder{color:rgba(0,0,0,0.25);}
    input:focus,textarea:focus,select:focus{outline:none;}
    ::-webkit-scrollbar{width:3px;background:${C_BG};}
    ::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.15);border-radius:4px;}
    @keyframes fadeUp{from{opacity:0;transform:translateY(24px);}to{opacity:1;transform:translateY(0);}}
    @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
    @keyframes pulse{0%,100%{opacity:.3;}50%{opacity:1;}}
    @keyframes spin{to{transform:rotate(360deg);}}
    .nav-link{color:rgba(0,0,0,0.42);font-size:11px;letter-spacing:2px;font-family:'DM Sans',sans-serif;cursor:pointer;background:none;border:none;padding:0;text-transform:uppercase;}
    .nav-link:hover{color:#000;}
    .qty-btn{transition:all 0.18s;border:1px solid rgba(0,0,0,0.1);background:rgba(0,0,0,0.03);color:rgba(0,0,0,0.45);border-radius:10px;cursor:pointer;font-family:'Playfair Display',serif;}
    .qty-btn.active{border-color:rgba(0,0,0,0.55);background:rgba(0,0,0,0.08);color:#000;}
    .cta-dark{background:#1A1A1A;color:#E8E4DC;border:none;border-radius:12px;cursor:pointer;font-family:'DM Sans',sans-serif;font-weight:600;letter-spacing:2.5px;}
    .cta-dark:disabled{background:rgba(0,0,0,0.1);color:rgba(0,0,0,0.25);cursor:not-allowed;}
  `;

  const INP = {
    width:"100%",padding:"13px 16px",background:"rgba(0,0,0,0.04)",
    border:"1px solid rgba(0,0,0,0.12)",borderRadius:"10px",color:"#1A1A1A",
    fontSize:"16px",fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box",
  };
  const LBL = {fontSize:"9px",letterSpacing:"2.5px",color:"rgba(0,0,0,0.4)",marginBottom:"7px",fontFamily:"'DM Sans',sans-serif",display:"block"};

  const COUNTRY_CODES = [
    {code:"+1",flag:"🇺🇸",name:"USA"},{code:"+33",flag:"🇫🇷",name:"France"},
    {code:"+32",flag:"🇧🇪",name:"Belgique"},{code:"+41",flag:"🇨🇭",name:"Suisse"},
    {code:"+212",flag:"🇲🇦",name:"Maroc"},{code:"+213",flag:"🇩🇿",name:"Algérie"},
    {code:"+44",flag:"🇬🇧",name:"UK"},{code:"+49",flag:"🇩🇪",name:"Allemagne"},
    {code:"+34",flag:"🇪🇸",name:"Espagne"},{code:"+39",flag:"🇮🇹",name:"Italie"},
    {code:"+351",flag:"🇵🇹",name:"Portugal"},{code:"+52",flag:"🇲🇽",name:"Mexique"},
    {code:"+55",flag:"🇧🇷",name:"Brésil"},{code:"+971",flag:"🇦🇪",name:"UAE"},
  ];

  const COUNTRIES = ["Algérie","Allemagne","Angola","Argentine","Australie","Autriche","Belgique","Brésil","Cameroun","Canada","Chine","Colombie","Côte d'Ivoire","Danemark","Égypte","Espagne","États-Unis","France","Gabon","Ghana","Inde","Israël","Italie","Japon","Liban","Luxembourg","Maroc","Mexique","Monaco","Pays-Bas","Portugal","Royaume-Uni","Russie","Sénégal","Suède","Suisse","Tunisie","Turquie","UAE"];

  const SOLD_LABEL = { en:"SOLD", fr:"VENDUS", es:"VENDIDOS" }[lang];

  const Nav = () => (
    <nav style={{position:"sticky",top:0,zIndex:100,background:"rgba(216,212,206,0.96)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(0,0,0,0.09)",height:"64px",padding:isMobile?"0 16px":"0 48px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:isMobile?"10px":"20px"}}>
        <button onClick={()=>goTo("home")} style={{background:"none",border:"none",cursor:"pointer"}}>
          <OlawinLogo size={isMobile?26:34}/>
        </button>
        {!isMobile && (
          <>
            <div style={{width:"1px",height:"28px",background:"rgba(0,0,0,0.15)"}}/>
            <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
              <span style={{fontSize:"8px",letterSpacing:"2px",color:"rgba(0,0,0,0.4)",fontFamily:"'DM Sans',sans-serif",lineHeight:"1.3",textAlign:"right",whiteSpace:"nowrap"}}>{t.partner}</span>
              <img src={PARTNER_LOGO} alt="Private Honors" style={{height:"24px",width:"auto",objectFit:"contain"}}/>
            </div>
          </>
        )}
      </div>
      {!isMobile ? (
        <div style={{display:"flex",alignItems:"center",gap:"24px"}}>
          <button className="nav-link" onClick={()=>goTo("home")}>{t.nav.draws}</button>
          <button className="nav-link" onClick={()=>goTo("faq")}>{t.nav.faq}</button>
          <button className="nav-link" onClick={()=>goTo("legal")}>{t.nav.legal}</button>
          <LangSwitcher lang={lang} setLang={setLang} isMobile={false}/>
          <button onClick={()=>{ if(draws[0]){setSelectedDraw(draws[0]);goTo("shop");} }} className="cta-dark" style={{padding:"10px 22px",fontSize:"11px",borderRadius:"8px"}}>{t.nav.buy}</button>
        </div>
      ) : (
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <LangSwitcher lang={lang} setLang={setLang} isMobile={true}/>
          <button onClick={()=>setMenuOpen(!menuOpen)} style={{background:"none",border:"none",cursor:"pointer",padding:"8px",display:"flex",flexDirection:"column",gap:"4px"}}>
            <span style={{width:"22px",height:"2px",background:"#1A1A1A",borderRadius:"2px",transition:"all 0.2s",transform:menuOpen?"rotate(45deg) translate(4px, 5px)":"none"}}/>
            <span style={{width:"22px",height:"2px",background:"#1A1A1A",borderRadius:"2px",transition:"all 0.2s",opacity:menuOpen?0:1}}/>
            <span style={{width:"22px",height:"2px",background:"#1A1A1A",borderRadius:"2px",transition:"all 0.2s",transform:menuOpen?"rotate(-45deg) translate(4px, -5px)":"none"}}/>
          </button>
        </div>
      )}
      {isMobile && menuOpen && (
        <div style={{position:"absolute",top:"64px",left:0,right:0,background:"rgba(216,212,206,0.98)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(0,0,0,0.09)",padding:"24px 20px",display:"flex",flexDirection:"column",gap:"20px",animation:"fadeUp 0.2s ease"}}>
          <button className="nav-link" onClick={()=>goTo("home")} style={{textAlign:"left",fontSize:"14px",padding:"8px 0"}}>{t.nav.draws}</button>
          <button className="nav-link" onClick={()=>goTo("faq")} style={{textAlign:"left",fontSize:"14px",padding:"8px 0"}}>{t.nav.faq}</button>
          <button className="nav-link" onClick={()=>goTo("legal")} style={{textAlign:"left",fontSize:"14px",padding:"8px 0"}}>{t.nav.legal}</button>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"10px",padding:"12px 0",borderTop:"1px solid rgba(0,0,0,0.08)",borderBottom:"1px solid rgba(0,0,0,0.08)"}}>
            <span style={{fontSize:"9px",letterSpacing:"2px",color:"rgba(0,0,0,0.4)"}}>{t.partnerMobile}</span>
            <img src={PARTNER_LOGO} alt="Private Honors" style={{height:"18px",width:"auto",objectFit:"contain"}}/>
          </div>
          <button onClick={()=>{ if(draws[0]){setSelectedDraw(draws[0]);goTo("shop");} }} className="cta-dark" style={{padding:"14px",fontSize:"12px",borderRadius:"10px",width:"100%"}}>{t.nav.buy}</button>
        </div>
      )}
    </nav>
  );

  const LoadingScreen = () => (
    <div style={{minHeight:"60vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"20px"}}>
      <OlawinLogo size={40}/>
      <div style={{width:"32px",height:"32px",border:"2px solid rgba(0,0,0,0.1)",borderTopColor:"#1A1A1A",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <p style={{fontSize:"12px",letterSpacing:"3px",color:"rgba(0,0,0,0.35)"}}>{t.loading}</p>
    </div>
  );

  const HomePage = () => {
    if (loading) return <LoadingScreen/>;
    if (draws.length === 0) return (
      <div style={{minHeight:"60vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"16px",textAlign:"center",padding:"48px 20px"}}>
        <div style={{fontSize:"48px"}}>🎰</div>
        <h2 style={{fontSize:"clamp(22px,5vw,28px)",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"4px"}}>{t.empty.title}</h2>
        <p style={{fontSize:"14px",color:"rgba(0,0,0,0.45)"}}>{t.empty.sub}</p>
      </div>
    );
    return (
      <div style={{animation:"fadeUp 0.6s ease"}}>
        <section style={{position:"relative",height:isMobile?"75vh":"92vh",minHeight:"500px",overflow:"hidden",display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
          <div style={{position:"absolute",inset:0,background:featured?.gradient||"#1A1A1A"}}/>
          <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontSize:isMobile?"120px":"200px",opacity:0.08}}>{featured?.emoji}</div>
          {featured?.image && <img src={featured.image} alt={featured.location} onError={e=>e.target.style.display="none"} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",objectPosition:featured.heroPosition||"center"}}/>}
          <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.85) 0%,rgba(0,0,0,0.3) 50%,rgba(0,0,0,0.05) 100%)"}}/>
          <div style={{position:"relative",padding:isMobile?"0 20px 40px":"0 64px 72px",maxWidth:"900px"}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:"8px",background:"rgba(255,255,255,0.12)",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:"100px",padding:"6px 14px",marginBottom:"16px"}}>
              <span style={{width:"7px",height:"7px",borderRadius:"50%",background:"#ff4444",animation:"pulse 1.5s infinite"}}/>
              <span style={{fontSize:"10px",letterSpacing:"2px",color:"rgba(255,255,255,0.9)"}}>{t.hero.live} {fmtDate(featured?.endDate)}</span>
            </div>
            <div style={{fontSize:"12px",letterSpacing:"3px",color:"rgba(255,255,255,0.6)",marginBottom:"10px"}}>{featured?.country} {featured?.location?.toUpperCase()}</div>
            <h1 style={{fontSize:isMobile?"clamp(38px,9vw,56px)":"clamp(52px,7vw,100px)",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"3px",lineHeight:0.92,color:"#FFFFFF",marginBottom:"14px"}}>
              {featured?.title?.toUpperCase()}<br/>
              <span style={{color:"rgba(255,255,255,0.5)"}}>{featured?.location?.toUpperCase()}</span>
            </h1>
            <p style={{fontSize:isMobile?"14px":"16px",fontFamily:"'Playfair Display',serif",fontStyle:"italic",color:"rgba(255,255,255,0.65)",maxWidth:"480px",lineHeight:"1.7",marginBottom:"24px"}}>{featured?.description}</p>
            <div style={{display:"flex",alignItems:isMobile?"stretch":"center",gap:"16px",flexWrap:"wrap",flexDirection:isMobile?"column":"row"}}>
              <button onClick={()=>{setSelectedDraw(featured);goTo("shop");}} className="cta-dark" style={{background:"#FFFFFF",color:"#1A1A1A",padding:"16px 32px",fontSize:"13px",width:isMobile?"100%":"auto"}}>
                {t.hero.buyTicket} — {featured?.ticketPrice}$
              </button>
              <div style={{color:"rgba(255,255,255,0.5)",fontSize:"12px",textAlign:isMobile?"center":"left"}}>
                {featured ? featured.totalTickets-featured.soldTickets : 0} {t.hero.remaining} {featured?.totalTickets}
              </div>
            </div>
          </div>
        </section>

        <section style={{background:C_BG,padding:isMobile?"48px 20px":"80px 48px"}}>
          <div style={{maxWidth:"1200px",margin:"0 auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:"32px",flexWrap:"wrap",gap:"12px"}}>
              <div>
                <div style={{fontSize:"9px",letterSpacing:"4px",color:"rgba(0,0,0,0.35)",marginBottom:"8px"}}>{t.section.thisWeek}</div>
                <h2 style={{fontSize:isMobile?"clamp(32px,8vw,42px)":"clamp(36px,5vw,60px)",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"3px",lineHeight:0.95}}>{t.section.allDraws}</h2>
              </div>
              <div style={{fontSize:"12px",color:"rgba(0,0,0,0.4)"}}>{draws.length} {t.section.activeDraws}</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(auto-fill,minmax(320px,1fr))",gap:"16px"}}>
              {draws.map(draw => (
                <DrawCard key={draw.id} draw={draw} onClick={()=>{setSelectedDraw(draw);goTo("shop");}}/>
              ))}
            </div>
          </div>
        </section>

        <section style={{borderTop:"1px solid rgba(0,0,0,0.09)",borderBottom:"1px solid rgba(0,0,0,0.09)",padding:isMobile?"32px 0":"40px 0",display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",background:"rgba(0,0,0,0.02)"}}>
          {[
            {val:`${draws.length}`,lbl:t.stats.active},
            {val:`${draws.reduce((s,d)=>s+(d.ticketPrice*d.totalTickets),0).toLocaleString(localeMap[lang])}$`,lbl:t.stats.value},
            {val:`${draws.reduce((s,d)=>s+(d.totalTickets-d.soldTickets),0)}`,lbl:t.stats.remaining},
            {val:"100+",lbl:t.stats.countries},
          ].map((s,i)=>(
            <div key={i} style={{textAlign:"center",padding:isMobile?"16px 12px":"0 24px",borderRight:isMobile?(i%2===0?"1px solid rgba(0,0,0,0.09)":"none"):(i<3?"1px solid rgba(0,0,0,0.09)":"none"),borderBottom:isMobile&&i<2?"1px solid rgba(0,0,0,0.09)":"none"}}>
              <div style={{fontSize:isMobile?"clamp(22px,6vw,28px)":"clamp(28px,3.5vw,44px)",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"2px",marginBottom:"4px"}}>{s.val}</div>
              <div style={{fontSize:"9px",letterSpacing:"2px",color:"rgba(0,0,0,0.35)"}}>{s.lbl}</div>
            </div>
          ))}
        </section>

        <section style={{padding:isMobile?"64px 20px":"100px 48px"}}>
          <div style={{maxWidth:"1100px",margin:"0 auto"}}>
            <div style={{textAlign:"center",marginBottom:isMobile?"40px":"64px"}}>
              <div style={{fontSize:"9px",letterSpacing:"4px",color:"rgba(0,0,0,0.35)",marginBottom:"12px"}}>{t.section.process}</div>
              <h2 style={{fontSize:isMobile?"clamp(28px,7vw,38px)":"clamp(36px,5vw,60px)",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"4px"}}>{t.section.howItWorks}</h2>
            </div>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(4,1fr)",gap:"2px"}}>
              {t.steps.map((s,i)=>(
                <div key={i} style={{padding:isMobile?"24px 0":"40px 32px",borderLeft:!isMobile&&i>0?"1px solid rgba(0,0,0,0.08)":"none",borderTop:isMobile&&i>0?"1px solid rgba(0,0,0,0.08)":"none"}}>
                  <div style={{fontSize:isMobile?"56px":"80px",fontFamily:"'Bebas Neue',sans-serif",color:"rgba(0,0,0,0.05)",lineHeight:1,marginBottom:"16px"}}>0{i+1}</div>
                  <div style={{fontSize:"18px",fontFamily:"'Playfair Display',serif",marginBottom:"10px"}}>{s.title}</div>
                  <div style={{fontSize:"13px",color:"rgba(0,0,0,0.48)",lineHeight:"1.7"}}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{padding:isMobile?"56px 20px":"100px 32px",textAlign:"center",borderTop:"1px solid rgba(0,0,0,0.09)"}}>
          <OlawinLogo size={isMobile?40:48}/>
          <h2 style={{fontSize:isMobile?"clamp(36px,9vw,48px)":"clamp(36px,6vw,72px)",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"4px",margin:"24px 0 12px",lineHeight:0.95}}>{t.cta.tryLuck}</h2>
          <p style={{fontSize:"15px",fontFamily:"'Playfair Display',serif",fontStyle:"italic",color:"rgba(0,0,0,0.45)",marginBottom:"32px"}}>{draws.length} {t.cta.active}</p>
          <button onClick={()=>{if(draws[0]){setSelectedDraw(draws[0]);goTo("shop");}}} className="cta-dark" style={{padding:isMobile?"16px 40px":"18px 60px",fontSize:"12px",width:isMobile?"100%":"auto",maxWidth:"400px"}}>{t.cta.viewDraws}</button>
        </section>
      </div>
    );
  };
  const ShopPage = () => {
    if (!activeDraw) return <div style={{padding:"100px 20px",textAlign:"center"}}>{t.shop.notFound} <button onClick={()=>goTo("home")} style={{textDecoration:"underline",background:"none",border:"none",cursor:"pointer"}}>{t.shop.returnHome}</button></div>;
    return (
      <div style={{animation:"fadeUp 0.5s ease"}}>
        <div style={{position:"relative",height:isMobile?"200px":"300px",overflow:"hidden",background:activeDraw.gradient||"#1A1A1A"}}>
          {activeDraw.image && <img src={activeDraw.image} alt={activeDraw.location} onError={e=>e.target.style.display="none"} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>}
          <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,rgba(0,0,0,0.2) 0%,rgba(232,228,220,1) 100%)"}}/>
          <div style={{position:"absolute",bottom:"20px",left:isMobile?"20px":"48px",right:"20px",display:"flex",alignItems:"center",gap:"10px",flexWrap:"wrap"}}>
            <div style={{background:"rgba(255,255,255,0.18)",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,0.3)",borderRadius:"20px",padding:"5px 12px",fontSize:"11px",letterSpacing:"2px",color:"#fff"}}>{activeDraw.country} {activeDraw.location?.toUpperCase()}</div>
            <button onClick={()=>goTo("home")} style={{background:"rgba(255,255,255,0.15)",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:"20px",padding:"5px 12px",color:"rgba(255,255,255,0.85)",fontSize:"11px",cursor:"pointer"}}>{t.shop.back}</button>
          </div>
        </div>
        <div style={{maxWidth:"1100px",margin:"0 auto",padding:isMobile?"32px 20px 60px":"40px 32px 60px"}}>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 420px",gap:isMobile?"32px":"64px"}}>
            <div>
              <h1 style={{fontSize:isMobile?"clamp(32px,8vw,42px)":"clamp(36px,5vw,64px)",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"3px",lineHeight:0.95,marginBottom:"16px"}}>{activeDraw.title?.toUpperCase()}</h1>
              <div style={{fontSize:isMobile?"clamp(18px,5vw,24px)":"clamp(20px,2.5vw,30px)",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"2px",color:"rgba(0,0,0,0.56)",marginBottom:"24px"}}>{activeDraw.prize?.toUpperCase()}</div>
              <p style={{fontSize:"14px",color:"rgba(0,0,0,0.52)",lineHeight:"1.8",marginBottom:"32px"}}>{activeDraw.description}</p>
              <div style={{display:"flex",alignItems:"center",gap:isMobile?"16px":"24px"}}>
                <ArcProgress pct={pct} label={SOLD_LABEL}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:"12px",color:"rgba(0,0,0,0.4)",marginBottom:"8px"}}>{activeDraw.soldTickets}/{activeDraw.totalTickets} {t.shop.tickets}</div>
                  <div style={{background:"rgba(0,0,0,0.08)",borderRadius:"2px",height:"2px"}}>
                    <div style={{width:`${pct}%`,height:"100%",background:"rgba(0,0,0,0.55)",borderRadius:"2px"}}/>
                  </div>
                </div>
              </div>
            </div>
            <div style={{position:isMobile?"static":"sticky",top:"84px",height:"fit-content"}}>
              <div style={{border:"1px solid rgba(0,0,0,0.1)",borderRadius:"20px",padding:isMobile?"24px 20px":"36px",background:"rgba(0,0,0,0.02)",boxShadow:"0 32px 80px rgba(0,0,0,0.08)"}}>
                <div style={{fontSize:"9px",letterSpacing:"3px",color:"rgba(0,0,0,0.38)",marginBottom:"5px"}}>{t.shop.reserve}</div>
                <div style={{fontSize:"22px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"3px",marginBottom:"24px"}}>{activeDraw.ticketPrice}$ {t.shop.perTicket}</div>
                <div style={{marginBottom:"20px"}}>
                  <div style={{fontSize:"9px",letterSpacing:"2px",color:"rgba(0,0,0,0.38)",marginBottom:"10px"}}>{t.shop.individual}</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:"6px"}}>
                    {TICKET_OPTS.map(n=>(
                      <button key={n} onClick={()=>{setQty(n);setCustomQty("");setSelectedPack(null);}}
                        className={`qty-btn${qty===n&&!selectedPack&&customQty===""?" active":""}`}
                        style={{padding:isMobile?"14px 0":"11px 0",fontSize:isMobile?"18px":"16px",minHeight:"44px"}}>{n}</button>
                    ))}
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:"8px",marginBottom:"20px"}}>
                  {PACKS.map(pack=>{
                    const packBase=pack.qty*activeDraw.ticketPrice;
                    const packSave=Math.round(packBase*pack.discount/100);
                    const packTotal=packBase-packSave;
                    const isActive=selectedPack?.qty===pack.qty;
                    return (
                      <button key={pack.qty} onClick={()=>{setSelectedPack(isActive?null:pack);setQty(0);setCustomQty("");}}
                        style={{border:`1px solid ${isActive?"rgba(0,0,0,0.45)":"rgba(0,0,0,0.09)"}`,borderRadius:"12px",padding:"14px 16px",background:isActive?"rgba(0,0,0,0.07)":"rgba(0,0,0,0.02)",cursor:"pointer",textAlign:"left"}}>
                        <div style={{fontSize:"11px",letterSpacing:"2px",color:"rgba(0,0,0,0.5)",marginBottom:"4px"}}>{t.shop.packs[pack.key]}</div>
                        <div style={{fontSize:"20px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"2px",marginBottom:"4px"}}>{pack.qty} {t.shop.tickets.toUpperCase()}</div>
                        <div style={{fontSize:"24px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"2px"}}>{packTotal}$ <span style={{fontSize:"11px",color:"rgba(0,0,0,0.4)"}}>-{pack.discount}%</span></div>
                      </button>
                    );
                  })}
                </div>
                <div style={{borderTop:"1px solid rgba(0,0,0,0.08)",paddingTop:"16px",marginBottom:"20px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                    <span style={{fontSize:"12px",color:"rgba(0,0,0,0.45)"}}>{t.shop.total}</span>
                    <span style={{fontSize:isMobile?"30px":"36px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"2px"}}>{total}$</span>
                  </div>
                </div>
                <button onClick={()=>goTo("confirm")} className="cta-dark" style={{width:"100%",padding:"16px",fontSize:"12px"}}>{t.shop.continue} {total}$</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ConfirmPage = () => (
    <div style={{maxWidth:"580px",margin:"0 auto",padding:isMobile?"40px 20px":"60px 32px"}}>
      <button onClick={()=>goTo("shop")} style={{background:"none",border:"none",color:"rgba(0,0,0,0.38)",cursor:"pointer",fontSize:"11px",letterSpacing:"2px",marginBottom:"32px"}}>{t.confirm.back}</button>
      <h2 style={{fontSize:isMobile?"32px":"40px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"3px",marginBottom:"28px"}}>{t.confirm.title}</h2>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"16px"}}>
        <div><label style={LBL}>{t.confirm.firstName}</label><input type="text" value={form.firstName} onChange={e=>setForm({...form,firstName:e.target.value})} style={INP}/></div>
        <div><label style={LBL}>{t.confirm.lastName}</label><input type="text" value={form.lastName} onChange={e=>setForm({...form,lastName:e.target.value})} style={INP}/></div>
      </div>
      <div style={{marginBottom:"12px"}}><label style={LBL}>{t.confirm.email}</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} style={INP}/></div>
      <div style={{marginBottom:"16px"}}><label style={LBL}>{t.confirm.phone}</label>
        <div style={{display:"flex",gap:"8px"}}>
          <select value={form.phoneCode} onChange={e=>setForm({...form,phoneCode:e.target.value})} style={{...INP,width:isMobile?"105px":"130px",flexShrink:0}}>
            {COUNTRY_CODES.map(c=><option key={c.code+c.name} value={c.code}>{c.flag} {c.code}</option>)}
          </select>
          <input type="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} style={{...INP,flex:1}}/>
        </div>
      </div>
      <div style={{marginBottom:"12px"}}><label style={LBL}>{t.confirm.street}</label><input type="text" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} style={INP}/></div>
      <div style={{display:"grid",gridTemplateColumns:"110px 1fr",gap:"10px",marginBottom:"12px"}}>
        <div><label style={LBL}>{t.confirm.zip}</label><input type="text" value={form.zip} onChange={e=>setForm({...form,zip:e.target.value})} style={INP}/></div>
        <div><label style={LBL}>{t.confirm.city}</label><input type="text" value={form.city} onChange={e=>setForm({...form,city:e.target.value})} style={INP}/></div>
      </div>
      <div style={{marginBottom:"20px"}}><label style={LBL}>{t.confirm.country}</label>
        <select value={form.country} onChange={e=>setForm({...form,country:e.target.value})} style={INP}>
          <option value="">{t.confirm.countryPlaceholder}</option>
          {COUNTRIES.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <button onClick={handlePay} disabled={!formValid||paying} className="cta-dark" style={{width:"100%",padding:"17px",fontSize:"12px"}}>
        {paying ? t.confirm.processing : `${t.confirm.pay} ${total}$ ${t.confirm.payVia}`}
      </button>
    </div>
  );

  const SuccessPage = () => (
    <div style={{minHeight:"80vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"60px 24px"}}>
      <div style={{maxWidth:"500px",width:"100%",textAlign:"center"}}>
        <OlawinLogo size={56}/>
        <h1 style={{fontSize:isMobile?"42px":"56px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"4px",margin:"20px 0"}}>{t.success.title}</h1>
        <p style={{fontSize:"14px",color:"rgba(0,0,0,0.45)",marginBottom:"32px"}}>
          {finalQty > 1 ? fmt(t.success.msgMany, {n: finalQty}) : t.success.msgOne}
        </p>
        <button onClick={()=>goTo("home")} className="cta-dark" style={{padding:"13px 28px",fontSize:"11px"}}>{t.success.home}</button>
      </div>
    </div>
  );

  const FaqPage = () => (
    <div style={{maxWidth:"700px",margin:"0 auto",padding:isMobile?"48px 20px":"80px 32px"}}>
      <h1 style={{fontSize:isMobile?"42px":"56px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"4px",marginBottom:"40px"}}>{t.faq.title}</h1>
      {t.faq.items.map((item,i)=>(
        <div key={i} style={{borderTop:i===0?"1px solid rgba(0,0,0,0.08)":"none",borderBottom:"1px solid rgba(0,0,0,0.08)"}}>
          <button onClick={()=>setOpenFaq(openFaq===i?null:i)} style={{width:"100%",padding:"20px 4px",display:"flex",justifyContent:"space-between",alignItems:"center",background:"none",border:"none",fontSize:"16px",cursor:"pointer",textAlign:"left",fontFamily:"'Playfair Display',serif"}}>
            <span>{item.q}</span><span>{openFaq===i?"−":"+"}</span>
          </button>
          {openFaq===i&&<div style={{padding:"0 4px 20px",fontSize:"13px",color:"rgba(0,0,0,0.5)",lineHeight:"1.75"}}>{item.a}</div>}
        </div>
      ))}
    </div>
  );

  const LegalPage = () => (
    <div style={{maxWidth:"700px",margin:"0 auto",padding:isMobile?"48px 20px":"80px 32px"}}>
      <h1 style={{fontSize:isMobile?"42px":"56px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"4px",marginBottom:"40px"}}>{t.legal.title}</h1>
      <p style={{fontSize:"13px",color:"rgba(0,0,0,0.45)",lineHeight:"1.8"}}>{t.legal.body}</p>
    </div>
  );

  const Footer = () => (
    <footer style={{borderTop:"1px solid rgba(0,0,0,0.09)",padding:isMobile?"32px 20px":"48px",display:"flex",flexDirection:isMobile?"column":"row",alignItems:"center",justifyContent:"space-between",gap:"20px",textAlign:isMobile?"center":"left"}}>
      <div><OlawinLogo size={26}/><div style={{fontSize:"10px",color:"rgba(0,0,0,0.28)",marginTop:"6px"}}>{t.footer.copyright}</div></div>
      <div style={{display:"flex",gap:"20px"}}>
        <button onClick={()=>goTo("faq")} className="nav-link">{t.nav.faq}</button>
        <button onClick={()=>goTo("legal")} className="nav-link">{t.nav.legal}</button>
        <a href="mailto:contact@olawin.org" style={{fontSize:"11px",letterSpacing:"2px",color:"rgba(0,0,0,0.38)",textDecoration:"none",textTransform:"uppercase"}}>{t.footer.contact}</a>
      </div>
    </footer>
  );

  return (
    <div ref={topRef} style={{background:C_BG,minHeight:"100vh",color:"#1A1A1A"}}>
      <style>{CSS}</style>
      <Nav/>
      {page==="home" && <HomePage/>}
      {page==="shop" && <ShopPage/>}
      {page==="confirm" && <ConfirmPage/>}
      {page==="success" && <SuccessPage/>}
      {page==="faq" && <FaqPage/>}
      {page==="legal" && <LegalPage/>}
      <Footer/>
    </div>
  );
}
  );
}
