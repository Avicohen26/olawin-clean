// ════════════════════════════════════════════════════════════
//  olawin-client.jsx  —  Site client avec Firebase temps réel
//  Les tirages sont lus depuis Firestore en direct.
//  Les commandes sont enregistrées dans Firestore après paiement.
// ════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from "react";
import { db } from "./firebase";
import {
  collection, onSnapshot, query, orderBy,
  addDoc, serverTimestamp, doc, updateDoc, increment,
} from "firebase/firestore";
import { sendTicketConfirmation, sendAdminNotification } from "./emails";

// ── FORMULES REMISE ───────────────────────────────────────────
const PACKS = [
  { qty: 15, discount: 10, label: "PACK SILVER", badge: "POPULAIRE" },
  { qty: 25, discount: 15, label: "PACK GOLD",   badge: "MEILLEURE VALEUR" },
  { qty: 50, discount: 20, label: "PACK ELITE",  badge: "MAXIMUM CHANCES" },
];

const TICKET_OPTS = [1,2,3,4,5,6,7,8,9,10];

const FAQ_ITEMS = [
  { q:"Comment fonctionne le tirage ?",           a:"À la date de clôture, un tirage aléatoire certifié est effectué en live sur nos réseaux. Le numéro gagnant est sélectionné publiquement et enregistré." },
  { q:"Quand je reçois mon ticket ?",             a:"Immédiatement après paiement Stripe — un email de confirmation avec votre numéro de ticket unique vous est envoyé automatiquement." },
  { q:"Que se passe-t-il si les tickets ne sont pas tous vendus ?", a:"Si la date de clôture arrive avant la vente complète, le tirage se tient quand même. Vos chances augmentent." },
  { q:"Comment utiliser le bon PrivateHonors ?",  a:"Le gagnant reçoit un code par email dans les 48h. Utilisable directement sur hotels.privatehonors.com pour tout séjour." },
  { q:"Le paiement est-il sécurisé ?",            a:"100%. Stripe ne stocke aucune donnée bancaire sur nos serveurs. C'est le standard mondial du paiement en ligne." },
];

const C_BG = "#D8D4CE";

// ── LOGO ─────────────────────────────────────────────────────
function OlawinLogo({ size=36, showText=true }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <polygon points="20,2 38,20 20,38 2,20" fill="none" stroke="#1A1A1A" strokeWidth="1.5"/>
        <circle cx="20" cy="20" r="7" fill="none" stroke="#1A1A1A" strokeWidth="1.5"/>
        <circle cx="20" cy="6"  r="1.5" fill="#1A1A1A"/>
        <circle cx="34" cy="20" r="1.5" fill="#1A1A1A"/>
        <circle cx="20" cy="34" r="1.5" fill="#1A1A1A"/>
        <circle cx="6"  cy="20" r="1.5" fill="#1A1A1A"/>
        <line x1="20" y1="13" x2="20" y2="6"  stroke="#1A1A1A" strokeWidth="0.8" opacity="0.3"/>
        <line x1="27" y1="20" x2="34" y2="20" stroke="#1A1A1A" strokeWidth="0.8" opacity="0.3"/>
        <line x1="20" y1="27" x2="20" y2="34" stroke="#1A1A1A" strokeWidth="0.8" opacity="0.3"/>
        <line x1="13" y1="20" x2="6"  y2="20" stroke="#1A1A1A" strokeWidth="0.8" opacity="0.3"/>
      </svg>
      {showText && <span style={{fontSize:size*0.56,letterSpacing:"4px",fontFamily:"'Bebas Neue',sans-serif",color:"#1A1A1A",lineHeight:1}}>OLAWIN</span>}
    </div>
  );
}

// ── COUNTDOWN ────────────────────────────────────────────────
function Countdown({ endDate }) {
  const [t,setT] = useState({});
  useEffect(()=>{
    const calc=()=>{
      const diff=new Date(endDate)-Date.now();
      if(diff<=0)return setT({d:0,h:0,m:0,s:0});
      setT({d:Math.floor(diff/86400000),h:Math.floor(diff%86400000/3600000),m:Math.floor(diff%3600000/60000),s:Math.floor(diff%60000/1000)});
    };
    calc();const id=setInterval(calc,1000);return()=>clearInterval(id);
  },[endDate]);
  return (
    <div style={{display:"flex",gap:"8px"}}>
      {[["d","J"],["h","H"],["m","M"],["s","S"]].map(([k,l])=>(
        <div key={k} style={{textAlign:"center"}}>
          <div style={{width:"56px",height:"56px",border:"1px solid rgba(0,0,0,0.12)",borderRadius:"8px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.04)",backdropFilter:"blur(4px)"}}>
            <span style={{fontSize:"22px",fontFamily:"'Bebas Neue',sans-serif",color:"#1A1A1A",lineHeight:1}}>{String(t[k]??0).padStart(2,"0")}</span>
            <span style={{fontSize:"8px",letterSpacing:"1.5px",color:"rgba(0,0,0,0.35)",fontFamily:"'DM Sans',sans-serif"}}>{l}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── ARC PROGRESS ─────────────────────────────────────────────
function ArcProgress({pct}) {
  const r=70,circ=2*Math.PI*r;
  return (
    <svg width="160" height="160" viewBox="0 0 160 160">
      <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="6"/>
      <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(0,0,0,0.75)" strokeWidth="6"
        strokeDasharray={circ} strokeDashoffset={circ-(pct/100)*circ}
        strokeLinecap="round" transform="rotate(-90 80 80)"
        style={{transition:"stroke-dashoffset 1.4s cubic-bezier(.4,0,.2,1)"}}/>
      <text x="80" y="74" textAnchor="middle" fill="#111" fontSize="26" fontFamily="'Bebas Neue',sans-serif">{pct}%</text>
      <text x="80" y="90" textAnchor="middle" fill="rgba(0,0,0,0.4)" fontSize="9" fontFamily="sans-serif" letterSpacing="2">VENDUS</text>
    </svg>
  );
}

// ── DRAW CARD ─────────────────────────────────────────────────
function DrawCard({ draw, onClick }) {
  const [hovered, setHovered] = useState(false);
  const pct = Math.round((draw.soldTickets / draw.totalTickets)*100);
  return (
    <div
      onMouseEnter={()=>setHovered(true)}
      onMouseLeave={()=>setHovered(false)}
      onClick={onClick}
      style={{
        position:"relative",borderRadius:"18px",overflow:"hidden",
        cursor:"pointer",height:"320px",
        border:`1px solid ${hovered?"rgba(0,0,0,0.2)":"rgba(0,0,0,0.08)"}`,
        transition:"all 0.3s",
        boxShadow:hovered?"0 20px 48px rgba(0,0,0,0.18)":"0 4px 16px rgba(0,0,0,0.06)",
        transform:hovered?"translateY(-4px)":"none",
      }}
    >
      {/* Fond dégradé */}
      <div style={{position:"absolute",inset:0,background:draw.gradient||"#333"}}/>
      {/* Emoji déco */}
      <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontSize:"80px",opacity:0.12,pointerEvents:"none",userSelect:"none",zIndex:1}}>{draw.emoji}</div>
      {/* Photo */}
      {draw.image && <img src={draw.image} alt={draw.location} onError={e=>e.target.style.display="none"}
        style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",objectPosition:draw.heroPosition||"center",transform:hovered?"scale(1.06)":"scale(1)",transition:"transform 0.7s ease"}}/>}
      {/* Overlay */}
      <div style={{position:"absolute",inset:0,background:hovered?"linear-gradient(to top,rgba(0,0,0,0.9) 0%,rgba(0,0,0,0.3) 60%,rgba(0,0,0,0.1) 100%)":"linear-gradient(to top,rgba(0,0,0,0.82) 0%,rgba(0,0,0,0.2) 60%,rgba(0,0,0,0.0) 100%)",transition:"background 0.4s",zIndex:2}}/>
      {/* Contenu */}
      <div style={{position:"absolute",inset:0,padding:"24px",display:"flex",flexDirection:"column",justifyContent:"space-between",zIndex:3}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div style={{background:"rgba(255,255,255,0.15)",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:"20px",padding:"4px 12px",fontSize:"10px",letterSpacing:"1.5px",color:"rgba(255,255,255,0.9)",fontFamily:"'DM Sans',sans-serif"}}>
            {draw.country} {draw.location?.toUpperCase()}
          </div>
          <div style={{background:"rgba(255,255,255,0.12)",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:"20px",padding:"4px 12px",fontSize:"10px",letterSpacing:"1px",color:"rgba(255,255,255,0.8)",fontFamily:"'DM Sans',sans-serif"}}>
            {draw.ticketPrice}$ / ticket
          </div>
        </div>
        <div>
          <div style={{fontSize:"11px",letterSpacing:"1px",color:"rgba(255,255,255,0.55)",fontFamily:"'DM Sans',sans-serif",marginBottom:"6px"}}>{draw.title?.toUpperCase()}</div>
          <div style={{fontSize:"clamp(22px,3vw,34px)",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"3px",color:"#fff",lineHeight:0.95,marginBottom:"14px"}}>{draw.prize?.toUpperCase()}</div>
          <div style={{marginBottom:"14px"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"5px"}}>
              <span style={{fontSize:"10px",color:"rgba(255,255,255,0.55)",fontFamily:"'DM Sans',sans-serif"}}>{draw.soldTickets}/{draw.totalTickets} vendus</span>
              <span style={{fontSize:"10px",color:"rgba(255,255,255,0.7)",fontFamily:"'DM Sans',sans-serif"}}>{pct}%</span>
            </div>
            <div style={{background:"rgba(255,255,255,0.15)",borderRadius:"2px",height:"2px"}}>
              <div style={{width:`${pct}%`,height:"100%",background:"rgba(255,255,255,0.85)",borderRadius:"2px",transition:"width 1s ease"}}/>
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:"11px",color:"rgba(255,255,255,0.45)",fontFamily:"'DM Sans',sans-serif"}}>
              Tirage le {new Date(draw.drawDate).toLocaleDateString("fr-FR",{day:"numeric",month:"long"})}
            </div>
            <div style={{background:hovered?"rgba(255,255,255,0.95)":"rgba(255,255,255,0.15)",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,0.3)",borderRadius:"20px",padding:"6px 16px",fontSize:"11px",fontWeight:"600",letterSpacing:"1px",color:hovered?"#1A1A1A":"rgba(255,255,255,0.9)",fontFamily:"'DM Sans',sans-serif",transition:"all 0.3s"}}>
              {hovered?"ACHETER →":"VOIR"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  APP PRINCIPALE
// ═══════════════════════════════════════════════════════════════
export default function Olawin() {
  // ── STATE ─────────────────────────────────────────────────
  const [page, setPage]               = useState("home");
  const [draws, setDraws]             = useState([]);          // ← Firebase
  const [loading, setLoading]         = useState(true);
  const [selectedDraw, setSelectedDraw] = useState(null);
  const [selectedPack, setSelectedPack] = useState(null);
  const [qty, setQty]                 = useState(1);
  const [customQty, setCustomQty]     = useState("");
  const [form, setForm]               = useState({firstName:"",lastName:"",email:"",phoneCode:"+1",phone:"",address:"",city:"",zip:"",country:""});
  const [openFaq, setOpenFaq]         = useState(null);
  const [paying, setPaying]           = useState(false);
  const [ticketNums, setTicketNums]   = useState([]);
  const topRef                        = useRef();

  // ── FIREBASE : écoute les tirages en temps réel ───────────
  useEffect(() => {
    const q = query(collection(db,"draws"), orderBy("createdAt","desc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setDraws(data.filter(d => d.status === "active"));
      setLoading(false);
    }, (err) => {
      console.error("Firebase error:", err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // ── COMPUTED ──────────────────────────────────────────────
  const activeDraw = selectedDraw;
  const remaining  = activeDraw ? activeDraw.totalTickets - activeDraw.soldTickets : 0;
  const finalQty   = selectedPack ? selectedPack.qty : customQty !== "" ? Math.min(parseInt(customQty)||1, remaining) : qty;
  const discount   = selectedPack ? selectedPack.discount : 0;
  const baseTotal  = finalQty * (activeDraw?.ticketPrice || 0);
  const savings    = Math.round(baseTotal * discount / 100);
  const total      = baseTotal - savings;
  const pct        = activeDraw ? Math.round((activeDraw.soldTickets / activeDraw.totalTickets)*100) : 0;
  const odds       = activeDraw ? ((finalQty / activeDraw.totalTickets)*100).toFixed(1) : "0";
  const formValid  = form.firstName && form.lastName && form.email && form.phone && form.address && form.city && form.country;
  const featured   = draws[0] || null;

  const goTo = (p) => {
    setPage(p);
    setTimeout(()=>topRef.current?.scrollIntoView({behavior:"smooth"}),50);
  };

  // ── PAIEMENT + ENREGISTREMENT FIREBASE ───────────────────
  const handlePay = async () => {
    if (!formValid || !activeDraw) return;
    setPaying(true);

    // Générer numéros de tickets
    const used=new Set();
    const nums=[];
    while(nums.length<finalQty){
      const n=Math.floor(Math.random()*(activeDraw.totalTickets-activeDraw.soldTickets))+activeDraw.soldTickets+1;
      if(!used.has(n)){used.add(n);nums.push(n);}
    }
    setTicketNums(nums);

    try {
      // 1. Enregistrer la commande dans Firestore
      await addDoc(collection(db,"orders"),{
        drawId:       activeDraw.id,
        drawTitle:    activeDraw.title,
        firstName:    form.firstName,
        lastName:     form.lastName,
        email:        form.email,
        phone:        `${form.phoneCode} ${form.phone}`,
        address:      `${form.address}, ${form.zip} ${form.city}, ${form.country}`,
        tickets:      finalQty,
        ticketNums:   nums,
        amount:       total,
        discount:     discount,
        pack:         selectedPack?.label || null,
        status:       "paid",
        createdAt:    serverTimestamp(),
      });

      // 2. Incrémenter les tickets vendus du tirage
      await updateDoc(doc(db,"draws",activeDraw.id),{
        soldTickets: increment(finalQty),
      });

      // 3. Envoi des emails en parallèle
      await Promise.allSettled([
        // Email au client — confirmation + numéros de tickets
        sendTicketConfirmation({
          firstName:    form.firstName,
          lastName:     form.lastName,
          email:        form.email,
          drawTitle:    activeDraw.title,
          drawLocation: activeDraw.location,
          drawCountry:  activeDraw.country,
          drawDate:     activeDraw.drawDate,
          ticketNums:   nums,
          qty:          finalQty,
          total,
          discount,
          pack:         selectedPack?.label || null,
        }),
        // Email à l'admin — notification de vente
        sendAdminNotification({
          firstName:    form.firstName,
          lastName:     form.lastName,
          email:        form.email,
          phone:        `${form.phoneCode} ${form.phone}`,
          address:      `${form.address}, ${form.zip} ${form.city}, ${form.country}`,
          drawTitle:    activeDraw.title,
          drawLocation: activeDraw.location,
          drawCountry:  activeDraw.country,
          ticketNums:   nums,
          qty:          finalQty,
          total,
          pack:         selectedPack?.label || null,
          orderId:      `ORD-${Date.now()}`,
        }),
      ]);

      // 3. Redirection Stripe (décommente en production)
      // const stripeLink = activeDraw.stripeLinks?.[finalQty] || activeDraw.stripeLinks?.[1];
      // if (stripeLink) window.location.href = stripeLink;

      setPaying(false);
      goTo("success");

    } catch(err) {
      console.error("Erreur Firebase:", err);
      setPaying(false);
      alert("Erreur lors de la réservation. Veuillez réessayer.");
    }
  };

  useEffect(()=>{
    if(page==="success" && ticketNums.length===0 && finalQty>0){
      const used=new Set();const nums=[];
      while(nums.length<finalQty){const n=Math.floor(Math.random()*200)+1;if(!used.has(n)){used.add(n);nums.push(n);}}
      setTicketNums(nums);
    }
  },[page]);

  // ── CSS ───────────────────────────────────────────────────
  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Playfair+Display:ital,wght@0,300;0,400;1,300&family=DM+Sans:wght@300;400;500;600&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    html{scroll-behavior:smooth;}
    body{background:${C_BG};color:#1A1A1A;}
    ::selection{background:rgba(0,0,0,0.1);}
    input::placeholder,textarea::placeholder,select::placeholder{color:rgba(0,0,0,0.25);}
    input:focus,textarea:focus,select:focus{outline:none;}
    ::-webkit-scrollbar{width:3px;background:${C_BG};}
    ::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.15);border-radius:4px;}
    @keyframes fadeUp{from{opacity:0;transform:translateY(24px);}to{opacity:1;transform:translateY(0);}}
    @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
    @keyframes slideDown{from{opacity:0;transform:translateY(-8px);}to{opacity:1;transform:translateY(0);}}
    @keyframes float{0%,100%{transform:translateY(0);}50%{transform:translateY(-10px);}}
    @keyframes pulse{0%,100%{opacity:.3;}50%{opacity:1;}}
    @keyframes spin{to{transform:rotate(360deg);}}
    @keyframes pop{0%{transform:scale(.5);opacity:0;}80%{transform:scale(1.06);}100%{transform:scale(1);opacity:1;}}
    @keyframes shimmer{0%{opacity:0.4;}50%{opacity:1;}100%{opacity:0.4;}}
    .nav-link{color:rgba(0,0,0,0.42);font-size:11px;letter-spacing:2px;font-family:'DM Sans',sans-serif;cursor:pointer;background:none;border:none;padding:0;transition:color 0.2s;text-transform:uppercase;}
    .nav-link:hover{color:#000;}
    .qty-btn{transition:all 0.18s;border:1px solid rgba(0,0,0,0.1);background:rgba(0,0,0,0.03);color:rgba(0,0,0,0.45);border-radius:10px;cursor:pointer;font-family:'Playfair Display',serif;}
    .qty-btn:hover{border-color:rgba(0,0,0,0.3);background:rgba(0,0,0,0.06);color:#000;}
    .qty-btn.active{border-color:rgba(0,0,0,0.55);background:rgba(0,0,0,0.08);color:#000;}
    .cta-dark{background:#1A1A1A;color:#E8E4DC;border:none;border-radius:12px;cursor:pointer;font-family:'DM Sans',sans-serif;font-weight:600;letter-spacing:2.5px;transition:all 0.22s;}
    .cta-dark:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 14px 40px rgba(0,0,0,0.25)!important;}
    .cta-dark:disabled{background:rgba(0,0,0,0.1);color:rgba(0,0,0,0.25);cursor:not-allowed;}
    .faq-row:hover{background:rgba(0,0,0,0.03);}
  `;

  const INP = {
    width:"100%",padding:"13px 16px",background:"rgba(0,0,0,0.04)",
    border:"1px solid rgba(0,0,0,0.12)",borderRadius:"10px",color:"#1A1A1A",
    fontSize:"14px",fontFamily:"'DM Sans',sans-serif",transition:"border-color 0.2s",boxSizing:"border-box",
  };
  const LBL = {fontSize:"9px",letterSpacing:"2.5px",color:"rgba(0,0,0,0.4)",marginBottom:"7px",fontFamily:"'DM Sans',sans-serif",display:"block"};

  const COUNTRY_CODES = [
    {code:"+1",flag:"🇺🇸",name:"USA / Canada"},{code:"+33",flag:"🇫🇷",name:"France"},
    {code:"+32",flag:"🇧🇪",name:"Belgique"},{code:"+41",flag:"🇨🇭",name:"Suisse"},
    {code:"+212",flag:"🇲🇦",name:"Maroc"},{code:"+213",flag:"🇩🇿",name:"Algérie"},
    {code:"+216",flag:"🇹🇳",name:"Tunisie"},{code:"+221",flag:"🇸🇳",name:"Sénégal"},
    {code:"+225",flag:"🇨🇮",name:"Côte d'Ivoire"},{code:"+237",flag:"🇨🇲",name:"Cameroun"},
    {code:"+243",flag:"🇨🇩",name:"Congo RDC"},{code:"+44",flag:"🇬🇧",name:"Royaume-Uni"},
    {code:"+49",flag:"🇩🇪",name:"Allemagne"},{code:"+34",flag:"🇪🇸",name:"Espagne"},
    {code:"+39",flag:"🇮🇹",name:"Italie"},{code:"+351",flag:"🇵🇹",name:"Portugal"},
    {code:"+52",flag:"🇲🇽",name:"Mexique"},{code:"+55",flag:"🇧🇷",name:"Brésil"},
    {code:"+971",flag:"🇦🇪",name:"Émirats arabes unis"},{code:"+961",flag:"🇱🇧",name:"Liban"},
  ];

  const COUNTRIES = ["Afghanistan","Algérie","Allemagne","Angola","Arabie Saoudite","Argentine","Australie","Autriche","Belgique","Bénin","Bolivie","Brésil","Burkina Faso","Burundi","Cameroun","Canada","Chili","Chine","Colombie","Congo","Congo RDC","Corée du Sud","Côte d'Ivoire","Danemark","Égypte","Émirats arabes unis","Espagne","États-Unis","Éthiopie","Finlande","France","Gabon","Ghana","Grèce","Inde","Indonésie","Iran","Irlande","Israël","Italie","Japon","Jordanie","Kenya","Koweït","Liban","Libye","Luxembourg","Madagascar","Malaisie","Mali","Maroc","Mauritanie","Mexique","Monaco","Mozambique","Namibie","Népal","Niger","Nigeria","Norvège","Nouvelle-Zélande","Oman","Ouganda","Pakistan","Panama","Pays-Bas","Pérou","Philippines","Pologne","Portugal","Qatar","Roumanie","Royaume-Uni","Russie","Rwanda","Sénégal","Sierra Leone","Singapour","Somalie","Soudan","Sri Lanka","Suède","Suisse","Syrie","Tanzanie","Tchad","Thaïlande","Togo","Tunisie","Turquie","Ukraine","Uruguay","Venezuela","Vietnam","Yémen","Zambie","Zimbabwe"];

  // ── NAV ───────────────────────────────────────────────────
  const Nav = () => (
    <nav style={{position:"sticky",top:0,zIndex:100,background:"rgba(216,212,206,0.96)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(0,0,0,0.09)",height:"68px",padding:"0 48px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <button onClick={()=>goTo("home")} style={{background:"none",border:"none",cursor:"pointer"}}>
        <OlawinLogo size={34}/>
      </button>
      <div style={{display:"flex",alignItems:"center",gap:"32px"}}>
        <button className="nav-link" onClick={()=>goTo("home")}>Tirages</button>
        <button className="nav-link" onClick={()=>goTo("faq")}>FAQ</button>
        <button className="nav-link" onClick={()=>goTo("legal")}>Légal</button>
        <button onClick={()=>{ if(draws[0]){setSelectedDraw(draws[0]);goTo("shop");} }} className="cta-dark"
          style={{padding:"10px 24px",fontSize:"11px",borderRadius:"8px",boxShadow:"0 4px 16px rgba(0,0,0,0.15)"}}>
          ACHETER
        </button>
      </div>
    </nav>
  );

  // ── LOADING ───────────────────────────────────────────────
  const LoadingScreen = () => (
    <div style={{minHeight:"60vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"20px"}}>
      <OlawinLogo size={40}/>
      <div style={{width:"32px",height:"32px",border:"2px solid rgba(0,0,0,0.1)",borderTopColor:"#1A1A1A",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <p style={{fontSize:"12px",letterSpacing:"3px",color:"rgba(0,0,0,0.35)",fontFamily:"'DM Sans',sans-serif"}}>CHARGEMENT DES TIRAGES...</p>
    </div>
  );

  // ── HOME ──────────────────────────────────────────────────
  const HomePage = () => {
    if (loading) return <LoadingScreen/>;
    if (draws.length === 0) return (
      <div style={{minHeight:"60vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"16px",textAlign:"center",padding:"48px"}}>
        <div style={{fontSize:"48px"}}>🎰</div>
        <h2 style={{fontSize:"28px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"4px"}}>AUCUN TIRAGE EN COURS</h2>
        <p style={{fontSize:"14px",color:"rgba(0,0,0,0.45)",fontFamily:"'DM Sans',sans-serif"}}>Revenez bientôt, de nouveaux tirages arrivent chaque semaine !</p>
      </div>
    );

    return (
      <div style={{animation:"fadeUp 0.6s ease"}}>
        {/* HERO */}
        <section style={{position:"relative",height:"92vh",overflow:"hidden",display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
          <div style={{position:"absolute",inset:0,background:featured?.gradient||"#1A1A1A"}}/>
          <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontSize:"200px",opacity:0.08,pointerEvents:"none",userSelect:"none"}}>{featured?.emoji}</div>
          {featured?.image && <img src={featured.image} alt={featured.location} onError={e=>e.target.style.display="none"} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",objectPosition:featured.heroPosition||"center"}}/>}
          <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.85) 0%,rgba(0,0,0,0.3) 50%,rgba(0,0,0,0.05) 100%)"}}/>
          <div style={{position:"relative",padding:"0 64px 72px",maxWidth:"900px"}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:"8px",background:"rgba(255,255,255,0.12)",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:"100px",padding:"6px 16px",marginBottom:"20px"}}>
              <span style={{width:"7px",height:"7px",borderRadius:"50%",background:"#ff4444",display:"block",animation:"pulse 1.5s infinite"}}/>
              <span style={{fontSize:"10px",letterSpacing:"3px",color:"rgba(255,255,255,0.9)",fontFamily:"'DM Sans',sans-serif"}}>
                TIRAGE EN COURS · CLÔTURE {featured ? new Date(featured.endDate).toLocaleDateString("fr-FR",{day:"numeric",month:"long"}) : ""}
              </span>
            </div>
            <div style={{fontSize:"13px",letterSpacing:"4px",color:"rgba(255,255,255,0.6)",fontFamily:"'DM Sans',sans-serif",marginBottom:"12px"}}>{featured?.country} {featured?.location?.toUpperCase()}</div>
            <h1 style={{fontSize:"clamp(52px,7vw,100px)",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"4px",lineHeight:0.92,color:"#FFFFFF",marginBottom:"16px"}}>
              {featured?.title?.toUpperCase()}<br/>
              <span style={{color:"rgba(255,255,255,0.5)"}}>{featured?.location?.toUpperCase()}</span>
            </h1>
            <p style={{fontSize:"16px",fontFamily:"'Playfair Display',serif",fontStyle:"italic",color:"rgba(255,255,255,0.65)",maxWidth:"480px",lineHeight:"1.7",marginBottom:"28px"}}>{featured?.description}</p>
            <div style={{display:"flex",alignItems:"center",gap:"20px",flexWrap:"wrap"}}>
              <button onClick={()=>{setSelectedDraw(featured);goTo("shop");}} className="cta-dark"
                style={{background:"#FFFFFF",color:"#1A1A1A",padding:"16px 40px",fontSize:"13px",boxShadow:"0 8px 32px rgba(0,0,0,0.3)"}}>
                ACHETER UN TICKET — {featured?.ticketPrice}$
              </button>
              <div style={{color:"rgba(255,255,255,0.5)",fontSize:"13px",fontFamily:"'DM Sans',sans-serif"}}>
                {featured ? featured.totalTickets-featured.soldTickets : 0} tickets restants sur {featured?.totalTickets}
              </div>
            </div>
          </div>
          <div style={{position:"absolute",bottom:"32px",right:"48px",display:"flex",flexDirection:"column",alignItems:"center",gap:"6px",animation:"float 3s ease-in-out infinite"}}>
            <div style={{width:"1px",height:"48px",background:"linear-gradient(to bottom,transparent,rgba(255,255,255,0.4))"}}/>
            <span style={{fontSize:"9px",letterSpacing:"3px",color:"rgba(255,255,255,0.4)",fontFamily:"'DM Sans',sans-serif"}}>SCROLL</span>
          </div>
        </section>

        {/* TOUS LES TIRAGES */}
        <section style={{background:C_BG,padding:"80px 48px"}}>
          <div style={{maxWidth:"1200px",margin:"0 auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:"48px"}}>
              <div>
                <div style={{fontSize:"9px",letterSpacing:"4px",color:"rgba(0,0,0,0.35)",marginBottom:"10px",fontFamily:"'DM Sans',sans-serif"}}>CETTE SEMAINE</div>
                <h2 style={{fontSize:"clamp(36px,5vw,60px)",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"4px",color:"#1A1A1A",lineHeight:0.95}}>TOUS LES TIRAGES</h2>
              </div>
              <div style={{fontSize:"13px",color:"rgba(0,0,0,0.4)",fontFamily:"'DM Sans',sans-serif"}}>{draws.length} tirage{draws.length>1?"s":""} actif{draws.length>1?"s":""}</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:"20px"}}>
              {draws.map(draw => (
                <DrawCard key={draw.id} draw={draw} onClick={()=>{setSelectedDraw(draw);goTo("shop");}}/>
              ))}
            </div>
          </div>
        </section>

        {/* STATS */}
        <section style={{borderTop:"1px solid rgba(0,0,0,0.09)",borderBottom:"1px solid rgba(0,0,0,0.09)",padding:"40px 0",display:"grid",gridTemplateColumns:"repeat(4,1fr)",background:"rgba(0,0,0,0.02)"}}>
          {[
            {val:`${draws.length}`,lbl:"TIRAGES ACTIFS"},
            {val:`${draws.reduce((s,d)=>s+(d.ticketPrice*d.totalTickets),0).toLocaleString("fr-FR")}$`,lbl:"VALEUR TOTALE"},
            {val:`${draws.reduce((s,d)=>s+(d.totalTickets-d.soldTickets),0)}`,lbl:"TICKETS RESTANTS"},
            {val:"100+",lbl:"PAYS ÉLIGIBLES"},
          ].map((s,i)=>(
            <div key={i} style={{textAlign:"center",padding:"0 24px",borderRight:i<3?"1px solid rgba(0,0,0,0.09)":"none"}}>
              <div style={{fontSize:"clamp(28px,3.5vw,44px)",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"2px",color:"#1A1A1A",marginBottom:"4px"}}>{s.val}</div>
              <div style={{fontSize:"9px",letterSpacing:"2.5px",color:"rgba(0,0,0,0.35)",fontFamily:"'DM Sans',sans-serif"}}>{s.lbl}</div>
            </div>
          ))}
        </section>

        {/* COMMENT ÇA MARCHE */}
        <section style={{padding:"100px 48px"}}>
          <div style={{maxWidth:"1100px",margin:"0 auto"}}>
            <div style={{textAlign:"center",marginBottom:"64px"}}>
              <div style={{fontSize:"9px",letterSpacing:"4px",color:"rgba(0,0,0,0.35)",marginBottom:"14px",fontFamily:"'DM Sans',sans-serif"}}>PROCESSUS</div>
              <h2 style={{fontSize:"clamp(36px,5vw,60px)",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"5px",color:"#1A1A1A"}}>COMMENT ÇA MARCHE</h2>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"2px"}}>
              {[
                {num:"01",title:"Choisissez",desc:"Sélectionnez le tirage et vos tickets. Plus vous en prenez, plus vos chances augmentent."},
                {num:"02",title:"Payez",desc:"Paiement 100% sécurisé via Stripe. Aucune donnée bancaire ne transite par nos serveurs."},
                {num:"03",title:"Suivez",desc:"Recevez votre numéro de ticket par email. Suivez l'avancement des ventes en temps réel."},
                {num:"04",title:"Gagnez",desc:"Le tirage en direct est diffusé sur nos réseaux. Le gagnant reçoit son bon en 48h."},
              ].map((s,i)=>(
                <div key={i} style={{padding:"40px 32px",borderLeft:i>0?"1px solid rgba(0,0,0,0.08)":"none"}}>
                  <div style={{fontSize:"80px",fontFamily:"'Bebas Neue',sans-serif",color:"rgba(0,0,0,0.05)",lineHeight:1,marginBottom:"20px"}}>{s.num}</div>
                  <div style={{fontSize:"18px",fontFamily:"'Playfair Display',serif",marginBottom:"12px",color:"#1A1A1A"}}>{s.title}</div>
                  <div style={{fontSize:"13px",color:"rgba(0,0,0,0.48)",fontFamily:"'DM Sans',sans-serif",lineHeight:"1.7"}}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PARTENAIRE */}
        <section style={{borderTop:"1px solid rgba(0,0,0,0.09)",padding:"80px 48px",background:"rgba(0,0,0,0.02)"}}>
          <div style={{maxWidth:"900px",margin:"0 auto",display:"flex",alignItems:"center",gap:"64px"}}>
            <div style={{flex:1}}>
              <div style={{fontSize:"9px",letterSpacing:"4px",color:"rgba(0,0,0,0.35)",marginBottom:"14px",fontFamily:"'DM Sans',sans-serif"}}>PARTENAIRE OFFICIEL</div>
              <h2 style={{fontSize:"clamp(28px,4vw,48px)",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"3px",marginBottom:"16px",color:"#1A1A1A"}}>HOTELS.PRIVATEHONORS.COM</h2>
              <p style={{fontSize:"15px",color:"rgba(0,0,0,0.5)",fontFamily:"'DM Sans',sans-serif",lineHeight:"1.75",marginBottom:"24px"}}>Accès aux tarifs agents de voyage sur plus de 500 000 hôtels dans 100+ pays. Des villas privées aux palaces iconiques.</p>
              <div style={{display:"flex",gap:"24px"}}>
                {[["500K+","Hôtels"],["100+","Pays"],["24 mois","Validité"]].map(([v,l],i)=>(
                  <div key={i}>
                    <div style={{fontSize:"24px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"2px",color:"#1A1A1A"}}>{v}</div>
                    <div style={{fontSize:"10px",letterSpacing:"2px",color:"rgba(0,0,0,0.35)",fontFamily:"'DM Sans',sans-serif"}}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{width:"180px",height:"180px",borderRadius:"50%",flexShrink:0,background:"linear-gradient(135deg,#1A1A1A,#444)",display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid rgba(0,0,0,0.1)",boxShadow:"0 16px 48px rgba(0,0,0,0.12)"}}>
              <OlawinLogo size={56} showText={false}/>
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section style={{padding:"100px 32px",textAlign:"center",borderTop:"1px solid rgba(0,0,0,0.09)"}}>
          <OlawinLogo size={48}/>
          <h2 style={{fontSize:"clamp(36px,6vw,72px)",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"5px",margin:"32px 0 16px",lineHeight:0.95,color:"#1A1A1A"}}>TENTEZ VOTRE CHANCE</h2>
          <p style={{fontSize:"16px",fontFamily:"'Playfair Display',serif",fontStyle:"italic",color:"rgba(0,0,0,0.45)",marginBottom:"40px"}}>
            {draws.length} tirage{draws.length>1?"s":""} actif{draws.length>1?"s":""} cette semaine
          </p>
          <button onClick={()=>{if(draws[0]){setSelectedDraw(draws[0]);goTo("shop");}}} className="cta-dark"
            style={{padding:"18px 60px",fontSize:"13px",boxShadow:"0 8px 32px rgba(0,0,0,0.2)"}}>
            VOIR LES TIRAGES
          </button>
        </section>
      </div>
    );
  };

  // ── SHOP ──────────────────────────────────────────────────
  const ShopPage = () => {
    if (!activeDraw) return <div style={{padding:"100px",textAlign:"center",fontFamily:"'DM Sans',sans-serif"}}>Tirage introuvable. <button onClick={()=>goTo("home")} style={{textDecoration:"underline",background:"none",border:"none",cursor:"pointer"}}>Retour</button></div>;
    return (
    <div style={{animation:"fadeUp 0.5s ease"}}>
      {/* Banner photo */}
      <div style={{position:"relative",height:"300px",overflow:"hidden",background:activeDraw.gradient||"#1A1A1A"}}>
        <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontSize:"120px",opacity:0.1,pointerEvents:"none"}}>{activeDraw.emoji}</div>
        {activeDraw.image && <img src={activeDraw.image} alt={activeDraw.location} onError={e=>e.target.style.display="none"} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",objectPosition:activeDraw.heroPosition||"center"}}/>}
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,rgba(0,0,0,0.2) 0%,rgba(232,228,220,1) 100%)"}}/>
        <div style={{position:"absolute",bottom:"24px",left:"48px",display:"flex",alignItems:"center",gap:"12px"}}>
          <div style={{background:"rgba(255,255,255,0.18)",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,0.3)",borderRadius:"20px",padding:"5px 14px",fontSize:"11px",letterSpacing:"2px",color:"#fff",fontFamily:"'DM Sans',sans-serif"}}>
            {activeDraw.country} {activeDraw.location?.toUpperCase()}
          </div>
          <button onClick={()=>goTo("home")} style={{background:"rgba(255,255,255,0.15)",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:"20px",padding:"5px 14px",color:"rgba(255,255,255,0.85)",fontSize:"11px",letterSpacing:"1px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
            ← Autres tirages
          </button>
        </div>
      </div>

      <div style={{maxWidth:"1100px",margin:"0 auto",padding:"40px 32px 60px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 420px",gap:"64px"}}>
          {/* LEFT */}
          <div>
            <div style={{fontSize:"9px",letterSpacing:"4px",color:"rgba(0,0,0,0.38)",marginBottom:"14px",fontFamily:"'DM Sans',sans-serif"}}>TIRAGE ACTIF · PRIVATEHONORS.COM</div>
            <h1 style={{fontSize:"clamp(36px,5vw,64px)",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"4px",lineHeight:0.95,marginBottom:"20px"}}>{activeDraw.title?.toUpperCase()}</h1>
            <div style={{fontSize:"clamp(20px,2.5vw,30px)",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"3px",color:"rgba(0,0,0,0.56)",marginBottom:"28px"}}>{activeDraw.prize?.toUpperCase()}</div>
            <p style={{fontSize:"15px",fontFamily:"'DM Sans',sans-serif",color:"rgba(0,0,0,0.52)",lineHeight:"1.8",marginBottom:"40px"}}>{activeDraw.description}</p>
            {/* Info grid */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1px",border:"1px solid rgba(0,0,0,0.1)",borderRadius:"14px",overflow:"hidden",marginBottom:"40px"}}>
              {[
                {label:"PRIX TICKET",val:`${activeDraw.ticketPrice}$`},
                {label:"TICKETS RESTANTS",val:`${remaining}`},
                {label:"CLÔTURE",val:new Date(activeDraw.endDate).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})},
                {label:"TIRAGE",val:new Date(activeDraw.drawDate).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})},
              ].map((d,i)=>(
                <div key={i} style={{padding:"20px 24px",background:"rgba(0,0,0,0.03)",borderRight:i%2===0?"1px solid rgba(0,0,0,0.08)":"none",borderBottom:i<2?"1px solid rgba(0,0,0,0.08)":"none"}}>
                  <div style={{fontSize:"9px",letterSpacing:"2.5px",color:"rgba(0,0,0,0.32)",marginBottom:"6px",fontFamily:"'DM Sans',sans-serif"}}>{d.label}</div>
                  <div style={{fontSize:"22px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"2px"}}>{d.val}</div>
                </div>
              ))}
            </div>
            {/* Progress */}
            <div style={{display:"flex",alignItems:"center",gap:"24px"}}>
              <ArcProgress pct={pct}/>
              <div>
                <div style={{fontSize:"13px",color:"rgba(0,0,0,0.4)",fontFamily:"'DM Sans',sans-serif",marginBottom:"8px"}}>{activeDraw.soldTickets} tickets vendus sur {activeDraw.totalTickets}</div>
                <div style={{background:"rgba(0,0,0,0.08)",borderRadius:"2px",height:"2px",width:"200px"}}>
                  <div style={{width:`${pct}%`,height:"100%",background:"rgba(0,0,0,0.55)",borderRadius:"2px"}}/>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Purchase panel */}
          <div style={{position:"sticky",top:"84px",height:"fit-content"}}>
            <div style={{border:"1px solid rgba(0,0,0,0.1)",borderRadius:"20px",padding:"36px",background:"rgba(0,0,0,0.02)",boxShadow:"0 32px 80px rgba(0,0,0,0.08)"}}>
              <div style={{fontSize:"9px",letterSpacing:"3px",color:"rgba(0,0,0,0.38)",marginBottom:"5px",fontFamily:"'DM Sans',sans-serif"}}>RÉSERVER VOS TICKETS</div>
              <div style={{fontSize:"22px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"3px",marginBottom:"28px"}}>{activeDraw.ticketPrice}$ / TICKET</div>

              {/* Qty 1-10 */}
              <div style={{marginBottom:"24px"}}>
                <div style={{fontSize:"9px",letterSpacing:"2px",color:"rgba(0,0,0,0.38)",marginBottom:"10px",fontFamily:"'DM Sans',sans-serif"}}>TICKETS INDIVIDUELS</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:"5px"}}>
                  {TICKET_OPTS.map(n=>(
                    <button key={n} onClick={()=>{setQty(n);setCustomQty("");setSelectedPack(null);}}
                      className={`qty-btn${qty===n&&!selectedPack&&customQty===""?" active":""}`}
                      style={{padding:"11px 0",fontSize:"16px"}}>{n}</button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"20px"}}>
                <div style={{flex:1,height:"1px",background:"rgba(0,0,0,0.08)"}}/>
                <span style={{fontSize:"9px",letterSpacing:"2px",color:"rgba(0,0,0,0.28)",fontFamily:"'DM Sans',sans-serif"}}>OU CHOISIR UNE FORMULE</span>
                <div style={{flex:1,height:"1px",background:"rgba(0,0,0,0.08)"}}/>
              </div>

              {/* Packs */}
              <div style={{display:"flex",flexDirection:"column",gap:"8px",marginBottom:"20px"}}>
                {PACKS.map(pack=>{
                  const packBase=pack.qty*activeDraw.ticketPrice;
                  const packSave=Math.round(packBase*pack.discount/100);
                  const packTotal=packBase-packSave;
                  const isActive=selectedPack?.qty===pack.qty;
                  return (
                    <button key={pack.qty} onClick={()=>{setSelectedPack(isActive?null:pack);setQty(0);setCustomQty("");}}
                      style={{border:`1px solid ${isActive?"rgba(0,0,0,0.45)":"rgba(0,0,0,0.09)"}`,borderRadius:"12px",padding:"14px 16px",background:isActive?"rgba(0,0,0,0.07)":"rgba(0,0,0,0.02)",cursor:"pointer",textAlign:"left",transition:"all 0.18s",position:"relative",overflow:"hidden"}}
                      onMouseEnter={e=>{if(!isActive){e.currentTarget.style.borderColor="rgba(0,0,0,0.25)";e.currentTarget.style.background="rgba(0,0,0,0.04)";}}}
                      onMouseLeave={e=>{if(!isActive){e.currentTarget.style.borderColor="rgba(0,0,0,0.09)";e.currentTarget.style.background="rgba(0,0,0,0.02)";}}}
                    >
                      <div style={{position:"absolute",top:"10px",right:"12px",background:"rgba(0,0,0,0.07)",border:"1px solid rgba(0,0,0,0.1)",borderRadius:"20px",padding:"2px 8px",fontSize:"8px",letterSpacing:"1.5px",color:"rgba(0,0,0,0.5)",fontFamily:"'DM Sans',sans-serif"}}>{pack.badge}</div>
                      <div style={{display:"flex",alignItems:"baseline",gap:"10px",marginBottom:"4px"}}>
                        <span style={{fontSize:"22px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"2px",color:"#1A1A1A"}}>{pack.qty} TICKETS</span>
                        <span style={{fontSize:"11px",fontFamily:"'DM Sans',sans-serif",color:"rgba(0,0,0,0.4)",textDecoration:"line-through"}}>{packBase}$</span>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                        <span style={{fontSize:"26px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"2px"}}>{packTotal}$</span>
                        <span style={{background:"rgba(0,0,0,0.08)",border:"1px solid rgba(0,0,0,0.12)",borderRadius:"20px",padding:"2px 10px",fontSize:"11px",fontFamily:"'DM Sans',sans-serif",fontWeight:"600"}}>-{pack.discount}%</span>
                        <span style={{fontSize:"11px",color:"rgba(0,0,0,0.38)",fontFamily:"'DM Sans',sans-serif"}}>économie {packSave}$</span>
                      </div>
                      <div style={{fontSize:"10px",letterSpacing:"1px",color:"rgba(0,0,0,0.35)",fontFamily:"'DM Sans',sans-serif",marginTop:"4px"}}>{pack.label} · {(packTotal/pack.qty).toFixed(0)}$ / ticket</div>
                    </button>
                  );
                })}
              </div>

              {/* Odds */}
              <div style={{background:"rgba(0,0,0,0.04)",border:"1px solid rgba(0,0,0,0.08)",borderRadius:"10px",padding:"13px 16px",marginBottom:"20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:"11px",color:"rgba(0,0,0,0.45)",fontFamily:"'DM Sans',sans-serif"}}>Chances de gagner</span>
                <span style={{fontSize:"24px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"2px"}}>{odds}%</span>
              </div>

              {/* Total */}
              <div style={{borderTop:"1px solid rgba(0,0,0,0.08)",paddingTop:"18px",marginBottom:"22px"}}>
                {discount>0&&<div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}>
                  <span style={{fontSize:"12px",color:"rgba(0,0,0,0.38)",fontFamily:"'DM Sans',sans-serif"}}>{finalQty} tickets × {activeDraw.ticketPrice}$</span>
                  <span style={{fontSize:"13px",color:"rgba(0,0,0,0.38)",fontFamily:"'DM Sans',sans-serif",textDecoration:"line-through"}}>{baseTotal}$</span>
                </div>}
                {discount>0&&<div style={{display:"flex",justifyContent:"space-between",marginBottom:"8px"}}>
                  <span style={{fontSize:"12px",color:"rgba(0,0,0,0.55)",fontFamily:"'DM Sans',sans-serif"}}>Remise {discount}%</span>
                  <span style={{fontSize:"13px",fontFamily:"'DM Sans',sans-serif"}}>-{savings}$</span>
                </div>}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                  <span style={{fontSize:"12px",color:"rgba(0,0,0,0.45)",fontFamily:"'DM Sans',sans-serif"}}>
                    {discount===0?`${finalQty} ticket${finalQty>1?"s":""} × ${activeDraw.ticketPrice}$`:"TOTAL"}
                  </span>
                  <span style={{fontSize:"36px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"2px"}}>{total}$</span>
                </div>
              </div>

              <button onClick={()=>goTo("confirm")} className="cta-dark" style={{width:"100%",padding:"16px",fontSize:"12px",marginBottom:"12px",boxShadow:"0 8px 32px rgba(0,0,0,0.12)"}}>
                CONTINUER → {total}$
              </button>
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",padding:"10px",background:"rgba(0,0,0,0.02)",border:"1px solid rgba(0,0,0,0.07)",borderRadius:"8px"}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" stroke="rgba(0,0,0,0.4)" strokeWidth="1.5"/><path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="rgba(0,0,0,0.4)" strokeWidth="1.5"/></svg>
                <span style={{fontSize:"11px",color:"rgba(0,0,0,0.35)",fontFamily:"'DM Sans',sans-serif"}}>Paiement sécurisé · Stripe</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );};

  // ── CONFIRM ───────────────────────────────────────────────
  const ConfirmPage = () => (
    <div style={{maxWidth:"580px",margin:"0 auto",padding:"60px 32px",animation:"fadeUp 0.4s ease"}}>
      <button onClick={()=>goTo("shop")} style={{background:"none",border:"none",color:"rgba(0,0,0,0.38)",cursor:"pointer",fontSize:"11px",letterSpacing:"2px",fontFamily:"'DM Sans',sans-serif",marginBottom:"40px",display:"flex",alignItems:"center",gap:"6px"}}>← RETOUR</button>
      <div style={{fontSize:"9px",letterSpacing:"4px",color:"rgba(0,0,0,0.38)",marginBottom:"10px",fontFamily:"'DM Sans',sans-serif"}}>ÉTAPE 2 / 2</div>
      <h2 style={{fontSize:"40px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"4px",marginBottom:"8px",color:"#1A1A1A"}}>VOS INFORMATIONS</h2>
      <p style={{fontSize:"13px",color:"rgba(0,0,0,0.45)",fontFamily:"'DM Sans',sans-serif",marginBottom:"32px",lineHeight:"1.6"}}>Ces informations sont nécessaires pour vous envoyer votre ticket et vous contacter si vous gagnez.</p>

      {/* Récap */}
      <div style={{border:"1px solid rgba(0,0,0,0.1)",borderRadius:"14px",padding:"20px 24px",marginBottom:"36px",background:"rgba(0,0,0,0.03)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontSize:"15px",fontFamily:"'Playfair Display',serif",marginBottom:"4px",color:"#1A1A1A"}}>{activeDraw?.title}</div>
            <div style={{fontSize:"12px",color:"rgba(0,0,0,0.42)",fontFamily:"'DM Sans',sans-serif",marginBottom:discount>0?"8px":"0"}}>{finalQty} ticket{finalQty>1?"s":""} · Chances: {odds}%</div>
            {discount>0&&<div style={{display:"flex",gap:"8px",alignItems:"center"}}>
              <span style={{background:"rgba(0,0,0,0.08)",border:"1px solid rgba(0,0,0,0.12)",borderRadius:"20px",padding:"2px 10px",fontSize:"11px",color:"#1A1A1A",fontFamily:"'DM Sans',sans-serif",fontWeight:"600"}}>-{discount}%</span>
              <span style={{fontSize:"12px",color:"rgba(0,0,0,0.45)",fontFamily:"'DM Sans',sans-serif"}}>Économie de {savings}$</span>
            </div>}
          </div>
          <div style={{textAlign:"right"}}>
            {discount>0&&<div style={{fontSize:"14px",color:"rgba(0,0,0,0.35)",fontFamily:"'DM Sans',sans-serif",textDecoration:"line-through",marginBottom:"2px"}}>{baseTotal}$</div>}
            <div style={{fontSize:"32px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"2px",color:"#1A1A1A"}}>{total}$</div>
          </div>
        </div>
      </div>

      {/* Identité */}
      <div style={{fontSize:"9px",letterSpacing:"3px",color:"rgba(0,0,0,0.35)",marginBottom:"14px",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:"10px"}}>
        <span>IDENTITÉ</span><div style={{flex:1,height:"1px",background:"rgba(0,0,0,0.08)"}}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"20px"}}>
        <div><label style={LBL}>PRÉNOM *</label><input type="text" placeholder="Jean" value={form.firstName} onChange={e=>setForm({...form,firstName:e.target.value})} style={INP} onFocus={e=>e.target.style.borderColor="rgba(0,0,0,0.45)"} onBlur={e=>e.target.style.borderColor="rgba(0,0,0,0.12)"}/></div>
        <div><label style={LBL}>NOM *</label><input type="text" placeholder="Dupont" value={form.lastName} onChange={e=>setForm({...form,lastName:e.target.value})} style={INP} onFocus={e=>e.target.style.borderColor="rgba(0,0,0,0.45)"} onBlur={e=>e.target.style.borderColor="rgba(0,0,0,0.12)"}/></div>
      </div>

      {/* Contact */}
      <div style={{fontSize:"9px",letterSpacing:"3px",color:"rgba(0,0,0,0.35)",marginBottom:"14px",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:"10px"}}>
        <span>CONTACT</span><div style={{flex:1,height:"1px",background:"rgba(0,0,0,0.08)"}}/>
      </div>
      <div style={{marginBottom:"12px"}}><label style={LBL}>EMAIL *</label><input type="email" placeholder="jean.dupont@exemple.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} style={INP} onFocus={e=>e.target.style.borderColor="rgba(0,0,0,0.45)"} onBlur={e=>e.target.style.borderColor="rgba(0,0,0,0.12)"}/></div>
      <div style={{marginBottom:"20px"}}><label style={LBL}>TÉLÉPHONE *</label>
        <div style={{display:"flex",gap:"8px"}}>
          <select value={form.phoneCode} onChange={e=>setForm({...form,phoneCode:e.target.value})} style={{...INP,width:"auto",minWidth:"130px",flexShrink:0,cursor:"pointer",appearance:"none",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='rgba(0,0,0,0.35)'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 12px center",paddingRight:"32px"}}>
            {COUNTRY_CODES.map(c=><option key={c.code+c.name} value={c.code}>{c.flag} {c.code} — {c.name}</option>)}
          </select>
          <input type="tel" placeholder="6 12 34 56 78" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} style={{...INP,flex:1}} onFocus={e=>e.target.style.borderColor="rgba(0,0,0,0.45)"} onBlur={e=>e.target.style.borderColor="rgba(0,0,0,0.12)"}/>
        </div>
      </div>

      {/* Adresse */}
      <div style={{fontSize:"9px",letterSpacing:"3px",color:"rgba(0,0,0,0.35)",marginBottom:"14px",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:"10px"}}>
        <span>ADRESSE POSTALE</span><div style={{flex:1,height:"1px",background:"rgba(0,0,0,0.08)"}}/>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:"12px",marginBottom:"24px"}}>
        <div><label style={LBL}>RUE / NUMÉRO *</label><input type="text" placeholder="12 rue de la Paix" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} style={INP} onFocus={e=>e.target.style.borderColor="rgba(0,0,0,0.45)"} onBlur={e=>e.target.style.borderColor="rgba(0,0,0,0.12)"}/></div>
        <div style={{display:"grid",gridTemplateColumns:"120px 1fr",gap:"12px"}}>
          <div><label style={LBL}>CODE POSTAL *</label><input type="text" placeholder="75001" value={form.zip} onChange={e=>setForm({...form,zip:e.target.value})} style={INP} onFocus={e=>e.target.style.borderColor="rgba(0,0,0,0.45)"} onBlur={e=>e.target.style.borderColor="rgba(0,0,0,0.12)"}/></div>
          <div><label style={LBL}>VILLE *</label><input type="text" placeholder="Paris" value={form.city} onChange={e=>setForm({...form,city:e.target.value})} style={INP} onFocus={e=>e.target.style.borderColor="rgba(0,0,0,0.45)"} onBlur={e=>e.target.style.borderColor="rgba(0,0,0,0.12)"}/></div>
        </div>
        <div><label style={LBL}>PAYS *</label>
          <select value={form.country} onChange={e=>setForm({...form,country:e.target.value})} style={{...INP,cursor:"pointer",appearance:"none",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='rgba(0,0,0,0.35)'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 14px center",paddingRight:"36px",color:form.country?"#1A1A1A":"rgba(0,0,0,0.25)"}}>
            <option value="" disabled>Sélectionner votre pays...</option>
            {COUNTRIES.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* RGPD */}
      <div style={{background:"rgba(0,0,0,0.03)",border:"1px solid rgba(0,0,0,0.08)",borderRadius:"10px",padding:"14px 16px",marginBottom:"22px",display:"flex",gap:"10px",alignItems:"flex-start"}}>
        <span style={{fontSize:"14px",flexShrink:0,marginTop:"1px"}}>🔒</span>
        <p style={{fontSize:"11px",color:"rgba(0,0,0,0.4)",fontFamily:"'DM Sans',sans-serif",lineHeight:"1.65",margin:0}}>
          Vos données sont utilisées uniquement pour la gestion du tirage. Conformément au RGPD, vous pouvez demander leur suppression à <strong>contact@olawin.org</strong>.
        </p>
      </div>

      <button onClick={handlePay} disabled={!formValid||paying} className="cta-dark"
        style={{width:"100%",padding:"17px",fontSize:"12px",marginBottom:"12px",display:"flex",alignItems:"center",justifyContent:"center",gap:"10px"}}>
        {paying?<><div style={{width:"15px",height:"15px",border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#E8E4DC",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/> ENREGISTREMENT...</>:`PAYER ${total}$ VIA STRIPE`}
      </button>
      <div style={{textAlign:"center",fontSize:"11px",color:"rgba(0,0,0,0.28)",fontFamily:"'DM Sans',sans-serif"}}>SSL 256-bit · Aucune donnée bancaire stockée · Stripe</div>
    </div>
  );

  // ── SUCCESS ───────────────────────────────────────────────
  const SuccessPage = () => (
    <div style={{minHeight:"80vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"60px 24px",animation:"fadeIn 0.5s ease"}}>
      <div style={{maxWidth:"500px",width:"100%",textAlign:"center"}}>
        <div style={{marginBottom:"28px",animation:"pop 0.6s ease"}}><OlawinLogo size={56}/></div>
        <div style={{fontSize:"9px",letterSpacing:"4px",color:"rgba(0,0,0,0.38)",marginBottom:"12px",fontFamily:"'DM Sans',sans-serif"}}>PAIEMENT CONFIRMÉ</div>
        <h1 style={{fontSize:"56px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"5px",marginBottom:"16px"}}>BONNE CHANCE !</h1>
        <p style={{fontSize:"15px",fontFamily:"'Playfair Display',serif",fontStyle:"italic",color:"rgba(0,0,0,0.45)",lineHeight:"1.8",marginBottom:"40px"}}>
          Félicitations <strong style={{color:"#1A1A1A"}}>{form.firstName} {form.lastName}</strong> ! Vos {finalQty} ticket{finalQty>1?"s":""} pour <em style={{color:"rgba(0,0,0,0.7)"}}>{activeDraw?.title}</em> sont enregistrés. Confirmation envoyée à <span style={{color:"#1A1A1A",fontWeight:"500"}}>{form.email}</span>.
        </p>
        <div style={{border:"1px solid rgba(0,0,0,0.1)",borderRadius:"16px",padding:"28px",marginBottom:"24px",background:"rgba(0,0,0,0.02)"}}>
          <div style={{fontSize:"9px",letterSpacing:"3px",color:"rgba(0,0,0,0.35)",marginBottom:"16px",fontFamily:"'DM Sans',sans-serif"}}>VOS NUMÉROS</div>
          <div style={{display:"flex",gap:"8px",flexWrap:"wrap",justifyContent:"center",marginBottom:"20px"}}>
            {ticketNums.map((n,i)=>(
              <div key={i} style={{border:"1px solid rgba(0,0,0,0.15)",borderRadius:"8px",padding:"10px 18px",fontFamily:"'Bebas Neue',sans-serif",fontSize:"22px",letterSpacing:"2px",background:"rgba(0,0,0,0.04)"}}>#{String(n).padStart(3,"0")}</div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"16px",borderTop:"1px solid rgba(0,0,0,0.08)",paddingTop:"18px"}}>
            {[{label:"TICKETS",val:`${finalQty}x`},{label:"MONTANT",val:`${total}$`},{label:"TIRAGE",val:activeDraw?new Date(activeDraw.drawDate).toLocaleDateString("fr-FR",{day:"numeric",month:"short"}):"—"}].map((s,i)=>(
              <div key={i}><div style={{fontSize:"22px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"2px",marginBottom:"4px"}}>{s.val}</div><div style={{fontSize:"9px",letterSpacing:"2px",color:"rgba(0,0,0,0.32)",fontFamily:"'DM Sans',sans-serif"}}>{s.label}</div></div>
            ))}
          </div>
        </div>
        <div style={{display:"flex",gap:"10px",justifyContent:"center"}}>
          <button onClick={()=>goTo("home")} className="cta-dark" style={{padding:"13px 28px",fontSize:"11px"}}>ACCUEIL</button>
          <button onClick={()=>{setQty(1);setCustomQty("");setSelectedPack(null);goTo("shop");}} style={{background:"rgba(0,0,0,0.04)",border:"1px solid rgba(0,0,0,0.1)",borderRadius:"10px",padding:"13px 28px",color:"rgba(0,0,0,0.6)",fontSize:"11px",letterSpacing:"2px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"background 0.2s"}}>+ TICKETS</button>
        </div>
      </div>
    </div>
  );

  // ── FAQ ───────────────────────────────────────────────────
  const FaqPage = () => (
    <div style={{maxWidth:"700px",margin:"0 auto",padding:"80px 32px",animation:"fadeUp 0.4s ease"}}>
      <div style={{fontSize:"9px",letterSpacing:"4px",color:"rgba(0,0,0,0.38)",marginBottom:"12px",fontFamily:"'DM Sans',sans-serif"}}>AIDE</div>
      <h1 style={{fontSize:"56px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"5px",marginBottom:"56px"}}>FAQ</h1>
      <div style={{display:"flex",flexDirection:"column"}}>
        {FAQ_ITEMS.map((item,i)=>(
          <div key={i} className="faq-row" style={{borderTop:i===0?"1px solid rgba(0,0,0,0.08)":"none",borderBottom:"1px solid rgba(0,0,0,0.08)",transition:"background 0.2s",borderRadius:"4px"}}>
            <button onClick={()=>setOpenFaq(openFaq===i?null:i)} style={{width:"100%",padding:"24px 4px",display:"flex",justifyContent:"space-between",alignItems:"center",background:"none",border:"none",color:"#1A1A1A",fontSize:"16px",cursor:"pointer",textAlign:"left",fontFamily:"'Playfair Display',serif"}}>
              <span>{item.q}</span>
              <span style={{fontSize:"20px",flexShrink:0,marginLeft:"20px",transition:"transform 0.25s",transform:openFaq===i?"rotate(45deg)":"none",color:openFaq===i?"rgba(0,0,0,0.8)":"rgba(0,0,0,0.3)"}}>+</span>
            </button>
            {openFaq===i&&<div style={{padding:"0 4px 24px",fontSize:"14px",color:"rgba(0,0,0,0.5)",fontFamily:"'DM Sans',sans-serif",lineHeight:"1.75",animation:"fadeUp 0.2s ease"}}>{item.a}</div>}
          </div>
        ))}
      </div>
      <div style={{textAlign:"center",marginTop:"56px"}}>
        <button onClick={()=>{if(draws[0]){setSelectedDraw(draws[0]);goTo("shop");}}} className="cta-dark" style={{padding:"16px 40px",fontSize:"11px",boxShadow:"0 8px 32px rgba(0,0,0,0.12)"}}>ACHETER MES TICKETS</button>
      </div>
    </div>
  );

  // ── LEGAL ─────────────────────────────────────────────────
  const LegalPage = () => (
    <div style={{maxWidth:"700px",margin:"0 auto",padding:"80px 32px",animation:"fadeUp 0.4s ease"}}>
      <div style={{fontSize:"9px",letterSpacing:"4px",color:"rgba(0,0,0,0.38)",marginBottom:"12px",fontFamily:"'DM Sans',sans-serif"}}>LÉGAL</div>
      <h1 style={{fontSize:"56px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"5px",marginBottom:"56px"}}>CGU</h1>
      {[
        {t:"1. Participation",c:"Toute personne majeure peut participer au tirage Olawin. La participation implique l'acceptation du présent règlement. Olawin se réserve le droit de refuser toute participation en cas de fraude avérée."},
        {t:"2. Mécanisme du tirage",c:"Le tirage est effectué publiquement à la date annoncée. Un numéro gagnant est sélectionné aléatoirement parmi tous les tickets vendus, enregistré et diffusé en direct sur nos réseaux officiels."},
        {t:"3. Prix & remise du bon",c:"Le gagnant reçoit un bon sur hotels.privatehonors.com dans les 48h suivant le tirage. Le bon est valable 24 mois, nominatif et non cessible."},
        {t:"4. Paiement Stripe",c:"Tous les paiements sont traités par Stripe. Olawin ne stocke aucune donnée bancaire. Les achats sont définitifs sauf annulation du tirage par Olawin."},
        {t:"5. Remboursement",c:"En cas d'annulation du tirage (force majeure), l'intégralité des sommes sera remboursée sous 14 jours via Stripe."},
        {t:"6. RGPD",c:"Vos données (nom, email, téléphone, adresse) sont utilisées uniquement pour la gestion du tirage. Elles ne sont pas revendues. Droits RGPD : contact@olawin.org."},
      ].map((s,i)=>(
        <div key={i} style={{marginBottom:"36px",paddingBottom:"36px",borderBottom:i<5?"1px solid rgba(0,0,0,0.06)":"none"}}>
          <h3 style={{fontSize:"14px",letterSpacing:"2px",color:"rgba(0,0,0,0.7)",marginBottom:"12px",fontFamily:"'DM Sans',sans-serif",fontWeight:"500"}}>{s.t.toUpperCase()}</h3>
          <p style={{fontSize:"14px",color:"rgba(0,0,0,0.45)",fontFamily:"'DM Sans',sans-serif",lineHeight:"1.8"}}>{s.c}</p>
        </div>
      ))}
    </div>
  );

  // ── FOOTER ────────────────────────────────────────────────
  const Footer = () => (
    <footer style={{borderTop:"1px solid rgba(0,0,0,0.09)",padding:"48px",display:"grid",gridTemplateColumns:"1fr auto 1fr",alignItems:"center",gap:"32px"}}>
      <div><OlawinLogo size={28}/><div style={{fontSize:"10px",color:"rgba(0,0,0,0.28)",marginTop:"8px",fontFamily:"'DM Sans',sans-serif",letterSpacing:"1px"}}>© 2026 Olawin. Tous droits réservés.</div></div>
      <div style={{display:"flex",gap:"28px"}}>
        {[["FAQ","faq"],["CGU","legal"]].map(([l,p])=><button key={p} onClick={()=>goTo(p)} className="nav-link">{l}</button>)}
        <a href="mailto:contact@olawin.org" style={{fontSize:"11px",letterSpacing:"2px",color:"rgba(0,0,0,0.38)",fontFamily:"'DM Sans',sans-serif",textDecoration:"none",textTransform:"uppercase"}}>Contact</a>
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",alignItems:"center",gap:"8px"}}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" stroke="rgba(0,0,0,0.35)" strokeWidth="1.5"/><path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="rgba(0,0,0,0.35)" strokeWidth="1.5"/></svg>
        <span style={{fontSize:"11px",color:"rgba(0,0,0,0.28)",fontFamily:"'DM Sans',sans-serif",letterSpacing:"1px"}}>Stripe Secure</span>
      </div>
    </footer>
  );

  // ── RENDER ────────────────────────────────────────────────
  return (
    <div ref={topRef} style={{background:C_BG,minHeight:"100vh",color:"#1A1A1A"}}>
      <style>{CSS}</style>
      <Nav/>
      {page==="home"    && <HomePage/>}
      {page==="shop"    && <ShopPage/>}
      {page==="confirm" && <ConfirmPage/>}
      {page==="success" && <SuccessPage/>}
      {page==="faq"     && <FaqPage/>}
      {page==="legal"   && <LegalPage/>}
      <Footer/>
    </div>
  );
}
