// ════════════════════════════════════════════════════════════
//  olawin-client.jsx  —  Site client avec Firebase temps réel
//  Version responsive mobile + logo Private Honors
// ════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from "react";
import { db } from "./firebase";
import {
  collection, onSnapshot, query, orderBy,
  addDoc, serverTimestamp, doc, updateDoc, increment,
} from "firebase/firestore";
import { sendTicketConfirmation, sendAdminNotification } from "./emails";

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
        <circle cx="20" cy="6"  r="1.5" fill="#1A1A1A"/>
        <circle cx="34" cy="20" r="1.5" fill="#1A1A1A"/>
        <circle cx="20" cy="34" r="1.5" fill="#1A1A1A"/>
        <circle cx="6"  cy="20" r="1.5" fill="#1A1A1A"/>
      </svg>
      {showText && <span style={{fontSize:size*0.56,letterSpacing:"4px",fontFamily:"'Bebas Neue',sans-serif",color:"#1A1A1A",lineHeight:1}}>OLAWIN</span>}
    </div>
  );
}

function ArcProgress({pct}) {
  const r=70,circ=2*Math.PI*r;
  return (
    <svg width="140" height="140" viewBox="0 0 160 160">
      <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="6"/>
      <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(0,0,0,0.75)" strokeWidth="6"
        strokeDasharray={circ} strokeDashoffset={circ-(pct/100)*circ}
        strokeLinecap="round" transform="rotate(-90 80 80)"/>
      <text x="80" y="74" textAnchor="middle" fill="#111" fontSize="26" fontFamily="'Bebas Neue',sans-serif">{pct}%</text>
      <text x="80" y="90" textAnchor="middle" fill="rgba(0,0,0,0.4)" fontSize="9" fontFamily="sans-serif" letterSpacing="2">VENDUS</text>
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
              <span style={{fontSize:"10px",color:"rgba(255,255,255,0.55)"}}>{draw.soldTickets}/{draw.totalTickets} vendus</span>
              <span style={{fontSize:"10px",color:"rgba(255,255,255,0.7)"}}>{pct}%</span>
            </div>
            <div style={{background:"rgba(255,255,255,0.15)",borderRadius:"2px",height:"2px"}}>
              <div style={{width:`${pct}%`,height:"100%",background:"rgba(255,255,255,0.85)",borderRadius:"2px"}}/>
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:"11px",color:"rgba(255,255,255,0.45)"}}>Tirage le {new Date(draw.drawDate).toLocaleDateString("fr-FR",{day:"numeric",month:"long"})}</div>
            <div style={{background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.3)",borderRadius:"20px",padding:"6px 16px",fontSize:"11px",fontWeight:"600",color:"rgba(255,255,255,0.9)"}}>VOIR</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Olawin() {
  const isMobile = useIsMobile();
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
        discount: discount, pack: selectedPack?.label || null,
        status: "paid", createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db,"draws",activeDraw.id),{ soldTickets: increment(finalQty) });
      await Promise.allSettled([
        sendTicketConfirmation({ firstName: form.firstName, lastName: form.lastName, email: form.email, drawTitle: activeDraw.title, drawLocation: activeDraw.location, drawCountry: activeDraw.country, drawDate: activeDraw.drawDate, ticketNums: nums, qty: finalQty, total, discount, pack: selectedPack?.label || null }),
        sendAdminNotification({ firstName: form.firstName, lastName: form.lastName, email: form.email, phone: `${form.phoneCode} ${form.phone}`, address: `${form.address}, ${form.zip} ${form.city}, ${form.country}`, drawTitle: activeDraw.title, drawLocation: activeDraw.location, drawCountry: activeDraw.country, ticketNums: nums, qty: finalQty, total, pack: selectedPack?.label || null, orderId: `ORD-${Date.now()}` }),
      ]);
      setPaying(false); goTo("success");
    } catch(err) { console.error("Erreur Firebase:", err); setPaying(false); alert("Erreur lors de la réservation."); }
  };

  useEffect(()=>{
    if(page==="success" && ticketNums.length===0 && finalQty>0){
      const used=new Set();const nums=[];
      while(nums.length<finalQty){const n=Math.floor(Math.random()*200)+1;if(!used.has(n)){used.add(n);nums.push(n);}}
      setTicketNums(nums);
    }
  },[page]);

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
    @keyframes pop{0%{transform:scale(.5);opacity:0;}80%{transform:scale(1.06);}100%{transform:scale(1);opacity:1;}}
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
    {code:"+216",flag:"🇹🇳",name:"Tunisie"},{code:"+221",flag:"🇸🇳",name:"Sénégal"},
    {code:"+225",flag:"🇨🇮",name:"Côte d'Ivoire"},{code:"+237",flag:"🇨🇲",name:"Cameroun"},
    {code:"+243",flag:"🇨🇩",name:"Congo RDC"},{code:"+44",flag:"🇬🇧",name:"UK"},
    {code:"+49",flag:"🇩🇪",name:"Allemagne"},{code:"+34",flag:"🇪🇸",name:"Espagne"},
    {code:"+39",flag:"🇮🇹",name:"Italie"},{code:"+351",flag:"🇵🇹",name:"Portugal"},
    {code:"+52",flag:"🇲🇽",name:"Mexique"},{code:"+55",flag:"🇧🇷",name:"Brésil"},
    {code:"+971",flag:"🇦🇪",name:"UAE"},{code:"+961",flag:"🇱🇧",name:"Liban"},
  ];

  const COUNTRIES = ["Algérie","Allemagne","Angola","Arabie Saoudite","Argentine","Australie","Autriche","Belgique","Bénin","Brésil","Cameroun","Canada","Chine","Colombie","Congo","Congo RDC","Côte d'Ivoire","Danemark","Égypte","Émirats arabes unis","Espagne","États-Unis","France","Gabon","Ghana","Grèce","Inde","Indonésie","Irlande","Israël","Italie","Japon","Kenya","Liban","Luxembourg","Madagascar","Mali","Maroc","Mauritanie","Mexique","Monaco","Niger","Nigeria","Norvège","Pays-Bas","Pérou","Portugal","Qatar","Royaume-Uni","Russie","Sénégal","Singapour","Suède","Suisse","Tchad","Thaïlande","Togo","Tunisie","Turquie","Vietnam"];

  const Nav = () => (
    <nav style={{position:"sticky",top:0,zIndex:100,background:"rgba(216,212,206,0.96)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(0,0,0,0.09)",height:"64px",padding:isMobile?"0 20px":"0 48px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:isMobile?"12px":"20px"}}>
        <button onClick={()=>goTo("home")} style={{background:"none",border:"none",cursor:"pointer"}}>
          <OlawinLogo size={isMobile?28:34}/>
        </button>
        {!isMobile && (
          <>
            <div style={{width:"1px",height:"28px",background:"rgba(0,0,0,0.15)"}}/>
            <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
              <span style={{fontSize:"8px",letterSpacing:"2px",color:"rgba(0,0,0,0.4)",fontFamily:"'DM Sans',sans-serif",lineHeight:"1.3",textAlign:"right"}}>AVEC NOTRE<br/>PARTENAIRE</span>
              <img src={PARTNER_LOGO} alt="Private Honors" style={{height:"24px",width:"auto",objectFit:"contain"}}/>
            </div>
          </>
        )}
      </div>
      {!isMobile ? (
        <div style={{display:"flex",alignItems:"center",gap:"32px"}}>
          <button className="nav-link" onClick={()=>goTo("home")}>Tirages</button>
          <button className="nav-link" onClick={()=>goTo("faq")}>FAQ</button>
          <button className="nav-link" onClick={()=>goTo("legal")}>Légal</button>
          <button onClick={()=>{ if(draws[0]){setSelectedDraw(draws[0]);goTo("shop");} }} className="cta-dark" style={{padding:"10px 24px",fontSize:"11px",borderRadius:"8px"}}>ACHETER</button>
        </div>
      ) : (
        <button onClick={()=>setMenuOpen(!menuOpen)} style={{background:"none",border:"none",cursor:"pointer",padding:"8px",display:"flex",flexDirection:"column",gap:"4px"}}>
          <span style={{width:"22px",height:"2px",background:"#1A1A1A",borderRadius:"2px",transition:"all 0.2s",transform:menuOpen?"rotate(45deg) translate(4px, 5px)":"none"}}/>
          <span style={{width:"22px",height:"2px",background:"#1A1A1A",borderRadius:"2px",transition:"all 0.2s",opacity:menuOpen?0:1}}/>
          <span style={{width:"22px",height:"2px",background:"#1A1A1A",borderRadius:"2px",transition:"all 0.2s",transform:menuOpen?"rotate(-45deg) translate(4px, -5px)":"none"}}/>
        </button>
      )}
      {isMobile && menuOpen && (
        <div style={{position:"absolute",top:"64px",left:0,right:0,background:"rgba(216,212,206,0.98)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(0,0,0,0.09)",padding:"24px 20px",display:"flex",flexDirection:"column",gap:"20px",animation:"fadeUp 0.2s ease"}}>
          <button className="nav-link" onClick={()=>goTo("home")} style={{textAlign:"left",fontSize:"14px",padding:"8px 0"}}>Tirages</button>
          <button className="nav-link" onClick={()=>goTo("faq")} style={{textAlign:"left",fontSize:"14px",padding:"8px 0"}}>FAQ</button>
          <button className="nav-link" onClick={()=>goTo("legal")} style={{textAlign:"left",fontSize:"14px",padding:"8px 0"}}>Légal</button>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"10px",padding:"12px 0",borderTop:"1px solid rgba(0,0,0,0.08)",borderBottom:"1px solid rgba(0,0,0,0.08)"}}>
            <span style={{fontSize:"9px",letterSpacing:"2px",color:"rgba(0,0,0,0.4)"}}>PARTENAIRE</span>
            <img src={PARTNER_LOGO} alt="Private Honors" style={{height:"18px",width:"auto",objectFit:"contain"}}/>
          </div>
          <button onClick={()=>{ if(draws[0]){setSelectedDraw(draws[0]);goTo("shop");} }} className="cta-dark" style={{padding:"14px",fontSize:"12px",borderRadius:"10px",width:"100%"}}>ACHETER</button>
        </div>
      )}
    </nav>
  );

  const LoadingScreen = () => (
    <div style={{minHeight:"60vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"20px"}}>
      <OlawinLogo size={40}/>
      <div style={{width:"32px",height:"32px",border:"2px solid rgba(0,0,0,0.1)",borderTopColor:"#1A1A1A",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <p style={{fontSize:"12px",letterSpacing:"3px",color:"rgba(0,0,0,0.35)"}}>CHARGEMENT...</p>
    </div>
  );

  const HomePage = () => {
    if (loading) return <LoadingScreen/>;
    if (draws.length === 0) return (
      <div style={{minHeight:"60vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"16px",textAlign:"center",padding:"48px 20px"}}>
        <div style={{fontSize:"48px"}}>🎰</div>
        <h2 style={{fontSize:"clamp(22px,5vw,28px)",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"4px"}}>AUCUN TIRAGE EN COURS</h2>
        <p style={{fontSize:"14px",color:"rgba(0,0,0,0.45)"}}>Revenez bientôt !</p>
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
              <span style={{fontSize:"10px",letterSpacing:"2px",color:"rgba(255,255,255,0.9)"}}>EN COURS · CLÔTURE {featured ? new Date(featured.endDate).toLocaleDateString("fr-FR",{day:"numeric",month:"short"}) : ""}</span>
            </div>
            <div style={{fontSize:"12px",letterSpacing:"3px",color:"rgba(255,255,255,0.6)",marginBottom:"10px"}}>{featured?.country} {featured?.location?.toUpperCase()}</div>
            <h1 style={{fontSize:isMobile?"clamp(38px,9vw,56px)":"clamp(52px,7vw,100px)",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"3px",lineHeight:0.92,color:"#FFFFFF",marginBottom:"14px"}}>
              {featured?.title?.toUpperCase()}<br/>
              <span style={{color:"rgba(255,255,255,0.5)"}}>{featured?.location?.toUpperCase()}</span>
            </h1>
            <p style={{fontSize:isMobile?"14px":"16px",fontFamily:"'Playfair Display',serif",fontStyle:"italic",color:"rgba(255,255,255,0.65)",maxWidth:"480px",lineHeight:"1.7",marginBottom:"24px"}}>{featured?.description}</p>
            <div style={{display:"flex",alignItems:isMobile?"stretch":"center",gap:"16px",flexWrap:"wrap",flexDirection:isMobile?"column":"row"}}>
              <button onClick={()=>{setSelectedDraw(featured);goTo("shop");}} className="cta-dark" style={{background:"#FFFFFF",color:"#1A1A1A",padding:"16px 32px",fontSize:"13px",width:isMobile?"100%":"auto"}}>
                ACHETER UN TICKET — {featured?.ticketPrice}$
              </button>
              <div style={{color:"rgba(255,255,255,0.5)",fontSize:"12px",textAlign:isMobile?"center":"left"}}>
                {featured ? featured.totalTickets-featured.soldTickets : 0} tickets restants sur {featured?.totalTickets}
              </div>
            </div>
          </div>
        </section>

        <section style={{background:C_BG,padding:isMobile?"48px 20px":"80px 48px"}}>
          <div style={{maxWidth:"1200px",margin:"0 auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:"32px",flexWrap:"wrap",gap:"12px"}}>
              <div>
                <div style={{fontSize:"9px",letterSpacing:"4px",color:"rgba(0,0,0,0.35)",marginBottom:"8px"}}>CETTE SEMAINE</div>
                <h2 style={{fontSize:isMobile?"clamp(32px,8vw,42px)":"clamp(36px,5vw,60px)",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"3px",lineHeight:0.95}}>TOUS LES TIRAGES</h2>
              </div>
              <div style={{fontSize:"12px",color:"rgba(0,0,0,0.4)"}}>{draws.length} tirage{draws.length>1?"s":""}</div>
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
            {val:`${draws.length}`,lbl:"TIRAGES ACTIFS"},
            {val:`${draws.reduce((s,d)=>s+(d.ticketPrice*d.totalTickets),0).toLocaleString("fr-FR")}$`,lbl:"VALEUR TOTALE"},
            {val:`${draws.reduce((s,d)=>s+(d.totalTickets-d.soldTickets),0)}`,lbl:"TICKETS RESTANTS"},
            {val:"100+",lbl:"PAYS ÉLIGIBLES"},
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
              <div style={{fontSize:"9px",letterSpacing:"4px",color:"rgba(0,0,0,0.35)",marginBottom:"12px"}}>PROCESSUS</div>
              <h2 style={{fontSize:isMobile?"clamp(28px,7vw,38px)":"clamp(36px,5vw,60px)",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"4px"}}>COMMENT ÇA MARCHE</h2>
            </div>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(4,1fr)",gap:"2px"}}>
              {[
                {num:"01",title:"Choisissez",desc:"Sélectionnez le tirage et vos tickets."},
                {num:"02",title:"Payez",desc:"Paiement 100% sécurisé via Stripe."},
                {num:"03",title:"Suivez",desc:"Recevez votre numéro de ticket par email."},
                {num:"04",title:"Gagnez",desc:"Le tirage en direct est diffusé sur nos réseaux."},
              ].map((s,i)=>(
                <div key={i} style={{padding:isMobile?"24px 0":"40px 32px",borderLeft:!isMobile&&i>0?"1px solid rgba(0,0,0,0.08)":"none",borderTop:isMobile&&i>0?"1px solid rgba(0,0,0,0.08)":"none"}}>
                  <div style={{fontSize:isMobile?"56px":"80px",fontFamily:"'Bebas Neue',sans-serif",color:"rgba(0,0,0,0.05)",lineHeight:1,marginBottom:"16px"}}>{s.num}</div>
                  <div style={{fontSize:"18px",fontFamily:"'Playfair Display',serif",marginBottom:"10px"}}>{s.title}</div>
                  <div style={{fontSize:"13px",color:"rgba(0,0,0,0.48)",lineHeight:"1.7"}}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{padding:isMobile?"56px 20px":"100px 32px",textAlign:"center",borderTop:"1px solid rgba(0,0,0,0.09)"}}>
          <OlawinLogo size={isMobile?40:48}/>
          <h2 style={{fontSize:isMobile?"clamp(36px,9vw,48px)":"clamp(36px,6vw,72px)",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"4px",margin:"24px 0 12px",lineHeight:0.95}}>TENTEZ VOTRE CHANCE</h2>
          <p style={{fontSize:"15px",fontFamily:"'Playfair Display',serif",fontStyle:"italic",color:"rgba(0,0,0,0.45)",marginBottom:"32px"}}>{draws.length} tirage{draws.length>1?"s":""} actif{draws.length>1?"s":""}</p>
          <button onClick={()=>{if(draws[0]){setSelectedDraw(draws[0]);goTo("shop");}}} className="cta-dark" style={{padding:isMobile?"16px 40px":"18px 60px",fontSize:"12px",width:isMobile?"100%":"auto",maxWidth:"400px"}}>VOIR LES TIRAGES</button>
        </section>
      </div>
    );
  };

  const ShopPage = () => {
    if (!activeDraw) return <div style={{padding:"100px 20px",textAlign:"center"}}>Tirage introuvable. <button onClick={()=>goTo("home")} style={{textDecoration:"underline",background:"none",border:"none",cursor:"pointer"}}>Retour</button></div>;
    return (
    <div style={{animation:"fadeUp 0.5s ease"}}>
      <div style={{position:"relative",height:isMobile?"200px":"300px",overflow:"hidden",background:activeDraw.gradient||"#1A1A1A"}}>
        <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontSize:isMobile?"80px":"120px",opacity:0.1}}>{activeDraw.emoji}</div>
        {activeDraw.image && <img src={activeDraw.image} alt={activeDraw.location} onError={e=>e.target.style.display="none"} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",objectPosition:activeDraw.heroPosition||"center"}}/>}
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,rgba(0,0,0,0.2) 0%,rgba(232,228,220,1) 100%)"}}/>
        <div style={{position:"absolute",bottom:"20px",left:isMobile?"20px":"48px",right:"20px",display:"flex",alignItems:"center",gap:"10px",flexWrap:"wrap"}}>
          <div style={{background:"rgba(255,255,255,0.18)",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,0.3)",borderRadius:"20px",padding:"5px 12px",fontSize:"11px",letterSpacing:"2px",color:"#fff"}}>{activeDraw.country} {activeDraw.location?.toUpperCase()}</div>
          <button onClick={()=>goTo("home")} style={{background:"rgba(255,255,255,0.15)",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:"20px",padding:"5px 12px",color:"rgba(255,255,255,0.85)",fontSize:"11px",cursor:"pointer"}}>← Retour</button>
        </div>
      </div>

      <div style={{maxWidth:"1100px",margin:"0 auto",padding:isMobile?"32px 20px 60px":"40px 32px 60px"}}>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 420px",gap:isMobile?"32px":"64px"}}>
          <div>
            <div style={{fontSize:"9px",letterSpacing:"3px",color:"rgba(0,0,0,0.38)",marginBottom:"12px"}}>TIRAGE ACTIF</div>
            <h1 style={{fontSize:isMobile?"clamp(32px,8vw,42px)":"clamp(36px,5vw,64px)",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"3px",lineHeight:0.95,marginBottom:"16px"}}>{activeDraw.title?.toUpperCase()}</h1>
            <div style={{fontSize:isMobile?"clamp(18px,5vw,24px)":"clamp(20px,2.5vw,30px)",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"2px",color:"rgba(0,0,0,0.56)",marginBottom:"24px"}}>{activeDraw.prize?.toUpperCase()}</div>
            <p style={{fontSize:"14px",color:"rgba(0,0,0,0.52)",lineHeight:"1.8",marginBottom:"32px"}}>{activeDraw.description}</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1px",border:"1px solid rgba(0,0,0,0.1)",borderRadius:"14px",overflow:"hidden",marginBottom:"32px"}}>
              {[
                {label:"PRIX TICKET",val:`${activeDraw.ticketPrice}$`},
                {label:"TICKETS RESTANTS",val:`${remaining}`},
                {label:"CLÔTURE",val:new Date(activeDraw.endDate).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})},
                {label:"TIRAGE",val:new Date(activeDraw.drawDate).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})},
              ].map((d,i)=>(
                <div key={i} style={{padding:isMobile?"14px 16px":"20px 24px",background:"rgba(0,0,0,0.03)",borderRight:i%2===0?"1px solid rgba(0,0,0,0.08)":"none",borderBottom:i<2?"1px solid rgba(0,0,0,0.08)":"none"}}>
                  <div style={{fontSize:"9px",letterSpacing:"2px",color:"rgba(0,0,0,0.32)",marginBottom:"6px"}}>{d.label}</div>
                  <div style={{fontSize:isMobile?"18px":"22px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"2px"}}>{d.val}</div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:isMobile?"16px":"24px"}}>
              <ArcProgress pct={pct}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:"12px",color:"rgba(0,0,0,0.4)",marginBottom:"8px"}}>{activeDraw.soldTickets}/{activeDraw.totalTickets} tickets vendus</div>
                <div style={{background:"rgba(0,0,0,0.08)",borderRadius:"2px",height:"2px"}}>
                  <div style={{width:`${pct}%`,height:"100%",background:"rgba(0,0,0,0.55)",borderRadius:"2px"}}/>
                </div>
              </div>
            </div>
          </div>

          <div style={{position:isMobile?"static":"sticky",top:"84px",height:"fit-content"}}>
            <div style={{border:"1px solid rgba(0,0,0,0.1)",borderRadius:"20px",padding:isMobile?"24px 20px":"36px",background:"rgba(0,0,0,0.02)",boxShadow:"0 32px 80px rgba(0,0,0,0.08)"}}>
              <div style={{fontSize:"9px",letterSpacing:"3px",color:"rgba(0,0,0,0.38)",marginBottom:"5px"}}>RÉSERVER VOS TICKETS</div>
              <div style={{fontSize:"22px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"3px",marginBottom:"24px"}}>{activeDraw.ticketPrice}$ / TICKET</div>

              <div style={{marginBottom:"20px"}}>
                <div style={{fontSize:"9px",letterSpacing:"2px",color:"rgba(0,0,0,0.38)",marginBottom:"10px"}}>TICKETS INDIVIDUELS</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:"6px"}}>
                  {TICKET_OPTS.map(n=>(
                    <button key={n} onClick={()=>{setQty(n);setCustomQty("");setSelectedPack(null);}}
                      className={`qty-btn${qty===n&&!selectedPack&&customQty===""?" active":""}`}
                      style={{padding:isMobile?"14px 0":"11px 0",fontSize:isMobile?"18px":"16px",minHeight:"44px"}}>{n}</button>
                  ))}
                </div>
              </div>

              <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"16px"}}>
                <div style={{flex:1,height:"1px",background:"rgba(0,0,0,0.08)"}}/>
                <span style={{fontSize:"9px",letterSpacing:"2px",color:"rgba(0,0,0,0.28)"}}>OU CHOISIR UNE FORMULE</span>
                <div style={{flex:1,height:"1px",background:"rgba(0,0,0,0.08)"}}/>
              </div>

              <div style={{display:"flex",flexDirection:"column",gap:"8px",marginBottom:"20px"}}>
                {PACKS.map(pack=>{
                  const packBase=pack.qty*activeDraw.ticketPrice;
                  const packSave=Math.round(packBase*pack.discount/100);
                  const packTotal=packBase-packSave;
                  const isActive=selectedPack?.qty===pack.qty;
                  return (
                    <button key={pack.qty} onClick={()=>{setSelectedPack(isActive?null:pack);setQty(0);setCustomQty("");}}
                      style={{border:`1px solid ${isActive?"rgba(0,0,0,0.45)":"rgba(0,0,0,0.09)"}`,borderRadius:"12px",padding:"14px 16px",background:isActive?"rgba(0,0,0,0.07)":"rgba(0,0,0,0.02)",cursor:"pointer",textAlign:"left",position:"relative",overflow:"hidden"}}>
                      <div style={{position:"absolute",top:"8px",right:"10px",background:"rgba(0,0,0,0.07)",border:"1px solid rgba(0,0,0,0.1)",borderRadius:"20px",padding:"2px 8px",fontSize:"8px",letterSpacing:"1px",color:"rgba(0,0,0,0.5)"}}>{pack.badge}</div>
                      <div style={{display:"flex",alignItems:"baseline",gap:"10px",marginBottom:"4px",flexWrap:"wrap"}}>
                        <span style={{fontSize:"20px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"2px"}}>{pack.qty} TICKETS</span>
                        <span style={{fontSize:"11px",color:"rgba(0,0,0,0.4)",textDecoration:"line-through"}}>{packBase}$</span>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap"}}>
                        <span style={{fontSize:"24px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"2px"}}>{packTotal}$</span>
                        <span style={{background:"rgba(0,0,0,0.08)",border:"1px solid rgba(0,0,0,0.12)",borderRadius:"20px",padding:"2px 10px",fontSize:"11px",fontWeight:"600"}}>-{pack.discount}%</span>
                        <span style={{fontSize:"11px",color:"rgba(0,0,0,0.38)"}}>économie {packSave}$</span>
                      </div>
                      <div style={{fontSize:"10px",color:"rgba(0,0,0,0.35)",marginTop:"4px"}}>{pack.label} · {(packTotal/pack.qty).toFixed(0)}$ / ticket</div>
                    </button>
                  );
                })}
              </div>

              <div style={{background:"rgba(0,0,0,0.04)",border:"1px solid rgba(0,0,0,0.08)",borderRadius:"10px",padding:"13px 16px",marginBottom:"20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:"11px",color:"rgba(0,0,0,0.45)"}}>Chances de gagner</span>
                <span style={{fontSize:"22px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"2px"}}>{odds}%</span>
              </div>

              <div style={{borderTop:"1px solid rgba(0,0,0,0.08)",paddingTop:"16px",marginBottom:"20px"}}>
                {discount>0&&<div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}>
                  <span style={{fontSize:"12px",color:"rgba(0,0,0,0.38)"}}>{finalQty} tickets × {activeDraw.ticketPrice}$</span>
                  <span style={{fontSize:"13px",color:"rgba(0,0,0,0.38)",textDecoration:"line-through"}}>{baseTotal}$</span>
                </div>}
                {discount>0&&<div style={{display:"flex",justifyContent:"space-between",marginBottom:"8px"}}>
                  <span style={{fontSize:"12px",color:"rgba(0,0,0,0.55)"}}>Remise {discount}%</span>
                  <span style={{fontSize:"13px"}}>-{savings}$</span>
                </div>}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                  <span style={{fontSize:"12px",color:"rgba(0,0,0,0.45)"}}>{discount===0?`${finalQty} ticket${finalQty>1?"s":""} × ${activeDraw.ticketPrice}$`:"TOTAL"}</span>
                  <span style={{fontSize:isMobile?"30px":"36px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"2px"}}>{total}$</span>
                </div>
              </div>

              <button onClick={()=>goTo("confirm")} className="cta-dark" style={{width:"100%",padding:"16px",fontSize:"12px",marginBottom:"12px"}}>CONTINUER → {total}$</button>
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",padding:"10px",background:"rgba(0,0,0,0.02)",border:"1px solid rgba(0,0,0,0.07)",borderRadius:"8px"}}>
                <span style={{fontSize:"11px",color:"rgba(0,0,0,0.35)"}}>🔒 Paiement sécurisé · Stripe</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );};

  const ConfirmPage = () => (
    <div style={{maxWidth:"580px",margin:"0 auto",padding:isMobile?"40px 20px":"60px 32px",animation:"fadeUp 0.4s ease"}}>
      <button onClick={()=>goTo("shop")} style={{background:"none",border:"none",color:"rgba(0,0,0,0.38)",cursor:"pointer",fontSize:"11px",letterSpacing:"2px",marginBottom:"32px"}}>← RETOUR</button>
      <div style={{fontSize:"9px",letterSpacing:"4px",color:"rgba(0,0,0,0.38)",marginBottom:"10px"}}>ÉTAPE 2 / 2</div>
      <h2 style={{fontSize:isMobile?"32px":"40px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"3px",marginBottom:"8px"}}>VOS INFORMATIONS</h2>
      <p style={{fontSize:"13px",color:"rgba(0,0,0,0.45)",marginBottom:"28px",lineHeight:"1.6"}}>Nécessaires pour envoyer votre ticket.</p>

      <div style={{border:"1px solid rgba(0,0,0,0.1)",borderRadius:"14px",padding:"18px 20px",marginBottom:"28px",background:"rgba(0,0,0,0.03)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"12px"}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:"15px",fontFamily:"'Playfair Display',serif",marginBottom:"4px"}}>{activeDraw?.title}</div>
            <div style={{fontSize:"12px",color:"rgba(0,0,0,0.42)"}}>{finalQty} ticket{finalQty>1?"s":""} · {odds}%</div>
          </div>
          <div style={{textAlign:"right"}}>
            {discount>0&&<div style={{fontSize:"13px",color:"rgba(0,0,0,0.35)",textDecoration:"line-through"}}>{baseTotal}$</div>}
            <div style={{fontSize:"28px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"2px"}}>{total}$</div>
          </div>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"16px"}}>
        <div><label style={LBL}>PRÉNOM *</label><input type="text" placeholder="Jean" value={form.firstName} onChange={e=>setForm({...form,firstName:e.target.value})} style={INP}/></div>
        <div><label style={LBL}>NOM *</label><input type="text" placeholder="Dupont" value={form.lastName} onChange={e=>setForm({...form,lastName:e.target.value})} style={INP}/></div>
      </div>

      <div style={{marginBottom:"12px"}}><label style={LBL}>EMAIL *</label><input type="email" placeholder="jean@exemple.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} style={INP}/></div>
      <div style={{marginBottom:"16px"}}><label style={LBL}>TÉLÉPHONE *</label>
        <div style={{display:"flex",gap:"8px"}}>
          <select value={form.phoneCode} onChange={e=>setForm({...form,phoneCode:e.target.value})} style={{...INP,width:isMobile?"105px":"130px",flexShrink:0,paddingRight:"24px"}}>
            {COUNTRY_CODES.map(c=><option key={c.code+c.name} value={c.code}>{c.flag} {c.code}</option>)}
          </select>
          <input type="tel" placeholder="6 12 34 56 78" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} style={{...INP,flex:1,minWidth:0}}/>
        </div>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:"12px",marginBottom:"20px"}}>
        <div><label style={LBL}>RUE *</label><input type="text" placeholder="12 rue de la Paix" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} style={INP}/></div>
        <div style={{display:"grid",gridTemplateColumns:"110px 1fr",gap:"10px"}}>
          <div><label style={LBL}>CP *</label><input type="text" placeholder="75001" value={form.zip} onChange={e=>setForm({...form,zip:e.target.value})} style={INP}/></div>
          <div><label style={LBL}>VILLE *</label><input type="text" placeholder="Paris" value={form.city} onChange={e=>setForm({...form,city:e.target.value})} style={INP}/></div>
        </div>
        <div><label style={LBL}>PAYS *</label>
          <select value={form.country} onChange={e=>setForm({...form,country:e.target.value})} style={{...INP,color:form.country?"#1A1A1A":"rgba(0,0,0,0.25)"}}>
            <option value="" disabled>Sélectionner...</option>
            {COUNTRIES.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div style={{background:"rgba(0,0,0,0.03)",border:"1px solid rgba(0,0,0,0.08)",borderRadius:"10px",padding:"12px 14px",marginBottom:"18px",display:"flex",gap:"10px"}}>
        <span style={{fontSize:"14px"}}>🔒</span>
        <p style={{fontSize:"11px",color:"rgba(0,0,0,0.4)",lineHeight:"1.6",margin:0}}>Données protégées. Suppression : <strong>contact@olawin.org</strong>.</p>
      </div>

      <button onClick={handlePay} disabled={!formValid||paying} className="cta-dark" style={{width:"100%",padding:"17px",fontSize:"12px",marginBottom:"10px",display:"flex",alignItems:"center",justifyContent:"center",gap:"10px"}}>
        {paying?<><div style={{width:"15px",height:"15px",border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#E8E4DC",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/> EN COURS...</>:`PAYER ${total}$ VIA STRIPE`}
      </button>
      <div style={{textAlign:"center",fontSize:"11px",color:"rgba(0,0,0,0.28)"}}>SSL 256-bit · Stripe</div>
    </div>
  );

  const SuccessPage = () => (
    <div style={{minHeight:"80vh",display:"flex",alignItems:"center",justifyContent:"center",padding:isMobile?"40px 20px":"60px 24px",animation:"fadeIn 0.5s ease"}}>
      <div style={{maxWidth:"500px",width:"100%",textAlign:"center"}}>
        <div style={{marginBottom:"24px",animation:"pop 0.6s ease"}}><OlawinLogo size={isMobile?44:56}/></div>
        <div style={{fontSize:"9px",letterSpacing:"4px",color:"rgba(0,0,0,0.38)",marginBottom:"10px"}}>PAIEMENT CONFIRMÉ</div>
        <h1 style={{fontSize:isMobile?"42px":"56px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"4px",marginBottom:"14px"}}>BONNE CHANCE !</h1>
        <p style={{fontSize:"14px",fontFamily:"'Playfair Display',serif",fontStyle:"italic",color:"rgba(0,0,0,0.45)",lineHeight:"1.7",marginBottom:"32px"}}>Félicitations <strong>{form.firstName} {form.lastName}</strong> ! Vos {finalQty} ticket{finalQty>1?"s":""} sont enregistrés.</p>
        <div style={{border:"1px solid rgba(0,0,0,0.1)",borderRadius:"16px",padding:"24px",marginBottom:"20px",background:"rgba(0,0,0,0.02)"}}>
          <div style={{fontSize:"9px",letterSpacing:"3px",color:"rgba(0,0,0,0.35)",marginBottom:"14px"}}>VOS NUMÉROS</div>
          <div style={{display:"flex",gap:"8px",flexWrap:"wrap",justifyContent:"center",marginBottom:"18px"}}>
            {ticketNums.map((n,i)=>(
              <div key={i} style={{border:"1px solid rgba(0,0,0,0.15)",borderRadius:"8px",padding:"8px 14px",fontFamily:"'Bebas Neue',sans-serif",fontSize:"18px",letterSpacing:"2px",background:"rgba(0,0,0,0.04)"}}>#{String(n).padStart(3,"0")}</div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"12px",borderTop:"1px solid rgba(0,0,0,0.08)",paddingTop:"16px"}}>
            {[{label:"TICKETS",val:`${finalQty}x`},{label:"MONTANT",val:`${total}$`},{label:"TIRAGE",val:activeDraw?new Date(activeDraw.drawDate).toLocaleDateString("fr-FR",{day:"numeric",month:"short"}):"—"}].map((s,i)=>(
              <div key={i}><div style={{fontSize:"20px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"2px",marginBottom:"4px"}}>{s.val}</div><div style={{fontSize:"9px",letterSpacing:"2px",color:"rgba(0,0,0,0.32)"}}>{s.label}</div></div>
            ))}
          </div>
        </div>
        <div style={{display:"flex",gap:"10px",justifyContent:"center",flexDirection:isMobile?"column":"row"}}>
          <button onClick={()=>goTo("home")} className="cta-dark" style={{padding:"13px 28px",fontSize:"11px"}}>ACCUEIL</button>
          <button onClick={()=>{setQty(1);setCustomQty("");setSelectedPack(null);goTo("shop");}} style={{background:"rgba(0,0,0,0.04)",border:"1px solid rgba(0,0,0,0.1)",borderRadius:"10px",padding:"13px 28px",color:"rgba(0,0,0,0.6)",fontSize:"11px",letterSpacing:"2px",cursor:"pointer"}}>+ TICKETS</button>
        </div>
      </div>
    </div>
  );

  const FaqPage = () => (
    <div style={{maxWidth:"700px",margin:"0 auto",padding:isMobile?"48px 20px":"80px 32px",animation:"fadeUp 0.4s ease"}}>
      <div style={{fontSize:"9px",letterSpacing:"4px",color:"rgba(0,0,0,0.38)",marginBottom:"12px"}}>AIDE</div>
      <h1 style={{fontSize:isMobile?"42px":"56px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"4px",marginBottom:"40px"}}>FAQ</h1>
      <div style={{display:"flex",flexDirection:"column"}}>
        {FAQ_ITEMS.map((item,i)=>(
          <div key={i} style={{borderTop:i===0?"1px solid rgba(0,0,0,0.08)":"none",borderBottom:"1px solid rgba(0,0,0,0.08)"}}>
            <button onClick={()=>setOpenFaq(openFaq===i?null:i)} style={{width:"100%",padding:"20px 4px",display:"flex",justifyContent:"space-between",alignItems:"center",background:"none",border:"none",fontSize:isMobile?"14px":"16px",cursor:"pointer",textAlign:"left",fontFamily:"'Playfair Display',serif",gap:"16px"}}>
              <span>{item.q}</span>
              <span style={{fontSize:"20px",flexShrink:0,transform:openFaq===i?"rotate(45deg)":"none",color:openFaq===i?"rgba(0,0,0,0.8)":"rgba(0,0,0,0.3)"}}>+</span>
            </button>
            {openFaq===i&&<div style={{padding:"0 4px 20px",fontSize:"13px",color:"rgba(0,0,0,0.5)",lineHeight:"1.75"}}>{item.a}</div>}
          </div>
        ))}
      </div>
      <div style={{textAlign:"center",marginTop:"40px"}}>
        <button onClick={()=>{if(draws[0]){setSelectedDraw(draws[0]);goTo("shop");}}} className="cta-dark" style={{padding:"14px 36px",fontSize:"11px",width:isMobile?"100%":"auto"}}>ACHETER MES TICKETS</button>
      </div>
    </div>
  );

  const LegalPage = () => (
    <div style={{maxWidth:"700px",margin:"0 auto",padding:isMobile?"48px 20px":"80px 32px"}}>
      <div style={{fontSize:"9px",letterSpacing:"4px",color:"rgba(0,0,0,0.38)",marginBottom:"12px"}}>LÉGAL</div>
      <h1 style={{fontSize:isMobile?"42px":"56px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"4px",marginBottom:"40px"}}>CGU</h1>
      {[
        {t:"1. Participation",c:"Toute personne majeure peut participer au tirage Olawin."},
        {t:"2. Mécanisme du tirage",c:"Le tirage est effectué publiquement à la date annoncée."},
        {t:"3. Prix & remise du bon",c:"Le gagnant reçoit un bon dans les 48h. Valable 24 mois, nominatif."},
        {t:"4. Paiement Stripe",c:"Tous les paiements sont traités par Stripe. Achats définitifs."},
        {t:"5. Remboursement",c:"En cas d'annulation, remboursement sous 14 jours via Stripe."},
        {t:"6. RGPD",c:"Vos données ne sont pas revendues. contact@olawin.org pour suppression."},
      ].map((s,i)=>(
        <div key={i} style={{marginBottom:"28px",paddingBottom:"28px",borderBottom:i<5?"1px solid rgba(0,0,0,0.06)":"none"}}>
          <h3 style={{fontSize:"14px",letterSpacing:"2px",color:"rgba(0,0,0,0.7)",marginBottom:"10px",fontWeight:"500"}}>{s.t.toUpperCase()}</h3>
          <p style={{fontSize:"13px",color:"rgba(0,0,0,0.45)",lineHeight:"1.8"}}>{s.c}</p>
        </div>
      ))}
    </div>
  );

  const Footer = () => (
    <footer style={{borderTop:"1px solid rgba(0,0,0,0.09)",padding:isMobile?"32px 20px":"48px",display:isMobile?"flex":"grid",flexDirection:isMobile?"column":undefined,gridTemplateColumns:isMobile?undefined:"1fr auto 1fr",alignItems:"center",gap:isMobile?"20px":"32px",textAlign:isMobile?"center":undefined}}>
      <div><OlawinLogo size={26}/><div style={{fontSize:"10px",color:"rgba(0,0,0,0.28)",marginTop:"6px"}}>© 2026 Olawin.</div></div>
      <div style={{display:"flex",gap:"20px",justifyContent:"center",flexWrap:"wrap"}}>
        {[["FAQ","faq"],["CGU","legal"]].map(([l,p])=><button key={p} onClick={()=>goTo(p)} className="nav-link">{l}</button>)}
        <a href="mailto:contact@olawin.org" style={{fontSize:"11px",letterSpacing:"2px",color:"rgba(0,0,0,0.38)",textDecoration:"none",textTransform:"uppercase"}}>Contact</a>
      </div>
      <div style={{display:"flex",justifyContent:isMobile?"center":"flex-end",alignItems:"center",gap:"8px"}}>
        <span style={{fontSize:"11px",color:"rgba(0,0,0,0.28)"}}>🔒 Stripe Secure</span>
      </div>
    </footer>
  );

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
