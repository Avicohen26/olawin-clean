// ════════════════════════════════════════════════════════════
// olawin-admin.jsx — Admin Firebase COMPLET
// Dashboard + Tirages + Commandes + Guide + Reglages
// Avec : Random.org integration + CGV trilingue + Social + Content
// ════════════════════════════════════════════════════════════
import { useState, useEffect, useRef } from "react";
import { db } from "./firebase";
import {
collection, onSnapshot, query, orderBy,
addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
getDoc, setDoc,
} from "firebase/firestore";

const ADMIN_PASSWORD = "olawin2026";

const C = {
bg: "#E8E4DC",
sidebar: "#DDD9D0",
card: "#F0EDE7",
cardAlt: "#E3DFD8",
border: "rgba(0,0,0,0.1)",
text: "#1A1A1A",
textMd: "rgba(0,0,0,0.55)",
textLt: "rgba(0,0,0,0.38)",
btnBg: "#1A1A1A",
btnText: "#F0EDE7",
};

const fmt = (n) => `£${(n||0).toLocaleString("fr-FR")}`;
const fmtD = (d) => {
if (!d) return "—";
try {
const date = d.toDate ? d.toDate() : new Date(d);
return date.toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"});
} catch { return "—"; }
};

const isClosedByDate = (draw) => {
if (!draw.endDate) return false;
try {
return new Date(draw.endDate).getTime() < Date.now();
} catch { return false; }
};

const inp = {
width:"100%", padding:"11px 14px",
background:"rgba(0,0,0,0.04)", border:"1px solid rgba(0,0,0,0.12)",
borderRadius:"9px", color:C.text, fontSize:"14px", fontFamily:"'DM Sans',sans-serif",
outline:"none", boxSizing:"border-box",
};

const btn = {
padding:"10px 20px", borderRadius:"9px", border:"none",
fontSize:"12px", fontWeight:"700", letterSpacing:"1.5px",
cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
};

function Logo({ size=28 }) {
return (
<div style={{display:"flex",alignItems:"center",gap:"10px"}}>
<svg width={size} height={size} viewBox="0 0 40 40" fill="none">
<polygon points="20,2 38,20 20,38 2,20" fill="none" stroke={C.text} strokeWidth="1.5"/>
<circle cx="20" cy="20" r="7" fill="none" stroke={C.text} strokeWidth="1.5"/>
<circle cx="20" cy="6" r="1.5" fill={C.text}/>
<circle cx="34" cy="20" r="1.5" fill={C.text}/>
<circle cx="20" cy="34" r="1.5" fill={C.text}/>
<circle cx="6" cy="20" r="1.5" fill={C.text}/>
</svg>
<span style={{fontSize:size*0.64,letterSpacing:"4px",fontFamily:"'Bebas Neue',sans-serif",color:C.text,lineHeight:1}}>OLAWIN</span>
</div>
);
}

function StatCard({icon,label,value,sub}) {
return (
<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"14px",padding:"24px"}}>
<div style={{fontSize:"22px",marginBottom:"10px"}}>{icon}</div>
<div style={{fontSize:"28px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"2px",marginBottom:"3px"}}>{value}</div>
<div style={{fontSize:"9px",letterSpacing:"2px",color:C.textLt}}>{label}</div>
{sub && <div style={{fontSize:"11px",color:C.textMd,marginTop:"5px"}}>{sub}</div>}
</div>
);
}

function Badge({children, green=false, gold=false}) {
const colors = gold
? {bg:"rgba(180,140,0,0.12)", border:"rgba(180,140,0,0.3)", text:"rgba(140,100,0,0.95)"}
: green
? {bg:"rgba(0,120,60,0.1)", border:"rgba(0,120,60,0.2)", text:"rgba(0,100,50,0.9)"}
: {bg:"rgba(0,0,0,0.07)", border:"rgba(0,0,0,0.12)", text:C.textMd};
return (
<span style={{background:colors.bg, border:`1px solid ${colors.border}`,borderRadius:"20px", padding:"3px 10px",fontSize:"10px", letterSpacing:"1px",color:colors.text}}>{children}</span>
);
}

const PHOTOS = {
"dubai": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80",
"dubaï": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80",
"paris": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80",
"maldives": "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1200&q=80",
"bali": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&q=80",
"new york": "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200&q=80",
"tokyo": "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&q=80",
"rome": "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&q=80",
"miami": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80",
"santorini": "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1200&q=80",
"londres": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200&q=80",
"marrakech": "https://images.unsplash.com/photo-1597212618440-806262de4f8b?w=1200&q=80",
"tel aviv": "https://images.unsplash.com/photo-1544986581-efac024faf62?w=1200&q=80",
"monaco": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80",
"bora bora": "https://images.unsplash.com/photo-1589197331516-4d84b72ba4d8?w=1200&q=80",
"seychelles": "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=1200&q=80",
"maurice": "https://images.unsplash.com/photo-1544737151151-6e4b9d4d0b8e?w=1200&q=80",
"bahamas": "https://images.unsplash.com/photo-1548574505-5e239809ee19?w=1200&q=80",
"tahiti": "https://images.unsplash.com/photo-1573790387438-4da905039392?w=1200&q=80",
"zanzibar": "https://images.unsplash.com/photo-1623492818-9ac6b5e74c33?w=1200&q=80",
"phuket": "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=1200&q=80",
"cancun": "https://images.unsplash.com/photo-1510097467424-192d713fd8b2?w=1200&q=80",
"barcelone": "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200&q=80",
"venise": "https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=1200&q=80",
"istanbul": "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1200&q=80",
"singapour": "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1200&q=80",
"mykonos": "https://images.unsplash.com/photo-1601581875309-fafbf2d3ed3a?w=1200&q=80",
"amalfi": "https://images.unsplash.com/photo-1633321088355-d0f81134ca3b?w=1200&q=80",
"ibiza": "https://images.unsplash.com/photo-1570135460810-2b97a7da6cad?w=1200&q=80",
"nice": "https://images.unsplash.com/photo-1491166617655-0723a0999cfc?w=1200&q=80",
"saint-tropez": "https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?w=1200&q=80",
"capri": "https://images.unsplash.com/photo-1559554704-7d59f3d5f108?w=1200&q=80",
"cape town": "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=1200&q=80",
"rio": "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=1200&q=80",
"los angeles": "https://images.unsplash.com/photo-1534190760961-74e8c1b5c3da?w=1200&q=80",
"las vegas": "https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=1200&q=80",
"courchevel": "https://images.unsplash.com/photo-1551524559-8af4e6624178?w=1200&q=80",
"disneyland": "https://images.unsplash.com/photo-1597466599360-3b9775841aec?w=1200&q=80",
"disney": "https://images.unsplash.com/photo-1597466599360-3b9775841aec?w=1200&q=80",
"plage": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80",
"ocean": "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1200&q=80",
"lagon": "https://images.unsplash.com/photo-1505228395891-9a51e7e86bf6?w=1200&q=80",
"montagne": "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1200&q=80",
"coucher de soleil": "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=1200&q=80",
};

function getPhoto(loc) {
if (!loc) return null;
return PHOTOS[loc.toLowerCase().trim()] || null;
}


function DrawModal({draw, onSave, onClose, isNew=false}) {
const [f, setF] = useState({...draw, image: draw.image || ""});
const [imgTab, setImgTab] = useState("upload");
const [urlInput, setUrlInput] = useState(draw.image || "");
const [dragOver, setDragOver] = useState(false);
const [saving, setSaving] = useState(false);
const fileRef = useRef();

const set = (k,v) => setF(p=>({...p,[k]:v}));

const handleFile = (file) => {
if (!file || !file.type.startsWith("image/")) return;
const reader = new FileReader();
reader.onload = (e) => set("image", e.target.result);
reader.readAsDataURL(file);
};

const handleSave = async () => {
setSaving(true);
try { await onSave(f); }
catch (err) { alert("Erreur Firebase : " + err.message); }
finally { setSaving(false); }
};

const suggestedPhoto = getPhoto(f.location || f.title);

return (
<div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.4)",backdropFilter:"blur(10px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"16px",overflowY:"auto"}}>
<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"20px",width:"100%",maxWidth:"720px",maxHeight:"95vh",overflowY:"auto"}}>
<div style={{padding:"28px 32px 0",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"24px"}}>
<div>
<div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt,marginBottom:"4px"}}>{isNew?"NOUVEAU TIRAGE":"MODIFIER"}</div>
<h2 style={{fontSize:"24px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"3px"}}>{isNew?"CRÉER UN TIRAGE":f.title||"—"}</h2>
</div>
<button onClick={onClose} style={{...btn,background:"rgba(0,0,0,0.06)",color:C.textMd,border:`1px solid ${C.border}`,width:"36px",height:"36px",padding:0,borderRadius:"50%"}}>✕</button>
</div>
<div style={{padding:"0 32px 32px"}}>
<div style={{marginBottom:"24px"}}>
<div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt,marginBottom:"14px"}}>PHOTO</div>
{f.image ? (
<div style={{position:"relative",marginBottom:"14px",borderRadius:"12px",overflow:"hidden",height:"180px"}}>
<img src={f.image} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
<button onClick={()=>{set("image","");setUrlInput("");}} style={{position:"absolute",top:"10px",right:"10px",background:"rgba(0,0,0,0.5)",border:"none",borderRadius:"20px",padding:"4px 10px",color:"#fff",fontSize:"11px",cursor:"pointer"}}>Changer</button>
</div>
) : (
<div style={{height:"160px",borderRadius:"12px",border:`2px dashed ${dragOver?"rgba(0,0,0,0.4)":C.border}`,background:dragOver?"rgba(0,0,0,0.05)":"rgba(0,0,0,0.02)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"8px",marginBottom:"14px",cursor:"pointer"}}
onClick={()=>fileRef.current?.click()}
onDragOver={e=>{e.preventDefault();setDragOver(true);}}
onDragLeave={()=>setDragOver(false)}
onDrop={e=>{e.preventDefault();setDragOver(false);handleFile(e.dataTransfer.files[0]);}}>
<div style={{fontSize:"32px"}}>🖼️</div>
<div style={{fontSize:"13px",color:C.textMd}}>Glisser une photo ici</div>
<div style={{fontSize:"11px",color:C.textLt}}>ou cliquer pour parcourir</div>
</div>
)}
<input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])}/>
<div style={{display:"flex",gap:"6px",marginBottom:"12px"}}>
{[{id:"upload",label:"📁 Mon ordi"},{id:"url",label:"🔗 URL"},{id:"suggest",label:"✨ Suggestions"}].map(t=>(
<button key={t.id} onClick={()=>setImgTab(t.id)} style={{...btn,padding:"7px 14px",fontSize:"11px",background:imgTab===t.id?C.btnBg:"rgba(0,0,0,0.05)",color:imgTab===t.id?C.btnText:C.textMd,border:`1px solid ${imgTab===t.id?C.btnBg:C.border}`}}>{t.label}</button>
))}
</div>
{imgTab==="upload" && <button onClick={()=>fileRef.current?.click()} style={{...btn,width:"100%",padding:"11px",background:"rgba(0,0,0,0.05)",color:C.textMd,border:`1px solid ${C.border}`,fontSize:"12px"}}>📁 Choisir un fichier</button>}
{imgTab==="url" && (
<div>
<div style={{display:"flex",gap:"8px"}}>
<input type="text" placeholder="Collez le lien finissant par .jpg ou .png" value={urlInput} onChange={e=>setUrlInput(e.target.value)} style={{...inp,flex:1,fontSize:"13px"}}/>
<button onClick={()=>{ if(!urlInput){return;} const img=new Image(); img.onload=function(){ set("image",urlInput); }; img.onerror=function(){ alert("Cette image ne fonctionne pas. Astuce : sur Google Images, faites un clic droit sur la photo puis 'Copier l adresse de l image'. Le lien doit finir par .jpg ou .png. Ou utilisez Unsplash.com / Pexels.com."); }; img.src=urlInput; }} style={{...btn,padding:"11px 18px",background:C.btnBg,color:C.btnText,fontSize:"12px"}}>Appliquer</button>
</div>
<div style={{fontSize:"11px",color:C.textLt,marginTop:"8px",lineHeight:"1.5"}}>💡 Astuce : sur Google Images, clic droit sur la photo → "Copier l'adresse de l'image" (le lien doit finir par .jpg/.png). Ou utilisez Unsplash.com / Pexels.com (gratuit).</div>
</div>
)}
{imgTab==="suggest" && (
<div>
{suggestedPhoto && (
<div style={{display:"flex",gap:"10px",alignItems:"center",marginBottom:"12px"}}>
<img src={suggestedPhoto} alt="" style={{width:"80px",height:"54px",objectFit:"cover",borderRadius:"8px"}}/>
<button onClick={()=>set("image",suggestedPhoto)} style={{...btn,padding:"9px 18px",background:C.btnBg,color:C.btnText,fontSize:"12px"}}>Utiliser cette photo</button>
</div>
)}
<div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
{Object.keys(PHOTOS).map(city=>(
<button key={city} onClick={()=>set("image",PHOTOS[city])} style={{...btn,padding:"6px 12px",fontSize:"11px",background:"rgba(0,0,0,0.05)",color:C.textMd,border:`1px solid ${C.border}`,textTransform:"capitalize"}}>{city}</button>
))}
</div>
</div>
)}
</div>
<div style={{marginBottom:"20px"}}>
<div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt,marginBottom:"14px"}}>INFORMATIONS</div>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
{[
{k:"title",l:"NOM DU TIRAGE (FR)",t:"text",ph:"Séjour Prestige..."},
{k:"titleEn",l:"NOM DU TIRAGE (EN)",t:"text",ph:"Prestige Stay..."},
{k:"titleEs",l:"NOM DU TIRAGE (ES)",t:"text",ph:"Estancia Prestige..."},
{k:"location",l:"DESTINATION (FR)",t:"text",ph:"Dubaï..."},
{k:"locationEn",l:"DESTINATION (EN)",t:"text",ph:"Dubai..."},
{k:"locationEs",l:"DESTINATION (ES)",t:"text",ph:"Dubái..."},
{k:"country",l:"PAYS (emoji 🇦🇪)",t:"text",ph:"🇦🇪"},
{k:"prize",l:"PRIX À GAGNER (FR)",t:"text",ph:"Bon hôtel 10 000$"},
{k:"prizeEn",l:"PRIX À GAGNER (EN)",t:"text",ph:"Hotel voucher $10,000"},
{k:"prizeEs",l:"PRIX À GAGNER (ES)",t:"text",ph:"Bono hotel 10 000$"},
{k:"partner",l:"PARTENAIRE",t:"text",ph:"PrivateHonors.com"},
{k:"emoji",l:"EMOJI",t:"text",ph:"🏝️"},
{k:"ticketPrice",l:"PRIX TICKET (£)",t:"number",ph:"100"},
{k:"totalTickets",l:"TOTAL TICKETS",t:"number",ph:"200"},
{k:"endDate",l:"DATE CLÔTURE",t:"date"},
{k:"drawDate",l:"DATE DU TIRAGE",t:"date"},
].map(fi => (
<div key={fi.k}>
<div style={{fontSize:"9px",letterSpacing:"2px",color:C.textLt,marginBottom:"6px"}}>{fi.l}</div>
<input type={fi.t} placeholder={fi.ph||""} value={f[fi.k]||""}
onChange={e=>{
const val = fi.t==="number"?+e.target.value:e.target.value;
set(fi.k, val);
if (fi.k==="location" && !f.image) {
const sugg = getPhoto(e.target.value);
if (sugg) set("image", sugg);
}
if (fi.k==="location") {
const d = (e.target.value||"").toLowerCase();
const emojiMap = {
  "maurice":"🏝️","seychelles":"🏝️","bora bora":"🏝️","tahiti":"🏝️","polynesie":"🏝️","polynésie":"🏝️","maldives":"🏝️",
  "miami":"🏖️","cancun":"🏖️","caraibes":"🏖️","caraïbes":"🏖️","republique dominicaine":"🏖️","république dominicaine":"🏖️","bahamas":"🏖️",
  "los angeles":"🌴","californie":"🌴","bali":"🌴","thailande":"🌴","thaïlande":"🌴","phuket":"🌴",
  "las vegas":"🎰",
  "canada":"🍁",
  "australie":"🦘","sydney":"🦘",
  "angleterre":"🇬🇧","londres":"🇬🇧","royaume-uni":"🇬🇧",
  "new york":"🗽","etats-unis":"🗽","états-unis":"🗽","usa":"🗽",
  "dubai":"🏙️","dubaï":"🏙️","abu dhabi":"🏙️","singapour":"🏙️",
  "tokyo":"🗼","japon":"🗼",
  "paris":"🗼","france":"🇫🇷",
  "italie":"🍝","rome":"🍝","venise":"🛶",
  "grece":"🏛️","grèce":"🏛️","santorin":"🏛️",
  "maroc":"🕌","marrakech":"🕌","egypte":"🏜️","égypte":"🏜️",
  "laponie":"❄️","suisse":"🏔️","alpes":"⛷️",
  "espagne":"🇪🇸","barcelone":"🇪🇸","ibiza":"🪩"
};
let foundEmoji = "";
for (const key in emojiMap) { if (d.includes(key)) { foundEmoji = emojiMap[key]; break; } }
if (foundEmoji) set("emoji", foundEmoji);
}
if (fi.k==="location") {
const d = (e.target.value||"").toLowerCase();
const emojiMap = {
  "maurice":"🏝️","maldives":"🏝️","seychelles":"🏝️","bora bora":"🏝️","tahiti":"🏝️","polynesie":"🏝️","polynésie":"🏝️",
  "bali":"🌴","thailande":"🌴","thaïlande":"🌴","phuket":"🌴","caraibes":"🌴","caraïbes":"🌴","republique dominicaine":"🌴","république dominicaine":"🌴","cancun":"🌴","mexique":"🌴",
  "dubai":"🏙️","dubaï":"🏙️","abu dhabi":"🏙️","singapour":"🏙️","hong kong":"🏙️",
  "new york":"🗽","etats-unis":"🗽","états-unis":"🗽","usa":"🗽","miami":"🌴","los angeles":"🌴",
  "tokyo":"🗼","japon":"🗼","paris":"🗼","france":"🗼",
  "italie":"🍝","rome":"🍝","venise":"🛶",
  "grece":"🏛️","grèce":"🏛️","santorin":"🏛️",
  "egypte":"🏜️","égypte":"🏜️","maroc":"🕌","marrakech":"🕌",
  "laponie":"❄️","finlande":"❄️","norvege":"🏔️","norvège":"🏔️","suisse":"🏔️","alpes":"⛷️",
  "londres":"🇬🇧","royaume-uni":"🇬🇧",
  "espagne":"🇪🇸","barcelone":"🇪🇸","ibiza":"🪩",
  "las vegas":"🎰"
};
let foundEmoji = "";
for (const key in emojiMap) { if (d.includes(key)) { foundEmoji = emojiMap[key]; break; } }
if (foundEmoji) set("emoji", foundEmoji);
}
}} style={inp}/>
</div>
))}
</div>
<div style={{marginTop:"12px"}}>

<button onClick={()=>{
  var dest = f.location || "[DESTINATION]";
  var val = f.prize || "[VALEUR]";
  var tplFr = "Vivez l'évasion à " + dest + " ! 🌊🌴 Un séjour de rêve d'une valeur de " + val + " vous attend, entre plages paradisiaques, lagons turquoise et douceur de vivre. ✨ À partager en couple ou en famille. Participez et laissez le rêve devenir réalité ! 🌟";
  var tplEn = "Experience the escape to " + dest + "! 🌊🌴 A dream getaway worth " + val + " awaits you, with paradise beaches, turquoise lagoons and a sweet way of life. ✨ To share as a couple or with your family. Enter now and let the dream come true! 🌟";
  var tplEs = "¡Vive la evasión en " + dest + "! 🌊🌴 Te espera una escapada de ensueño valorada en " + val + ", entre playas paradisíacas, lagunas turquesas y dulzura de vivir. ✨ Para disfrutar en pareja o en familia. ¡Participa y haz realidad el sueño! 🌟";
  if (!(f.description||"").trim()) set("description", tplFr);
  if (!(f.descriptionEn||"").trim()) set("descriptionEn", tplEn);
  if (!(f.descriptionEs||"").trim()) set("descriptionEs", tplEs);
}} style={{...btn,width:"100%",padding:"10px",marginBottom:"12px",background:C.btnBg,color:C.btnText,fontSize:"11px",letterSpacing:"1px"}}>✨ Générer les descriptions (FR/EN/ES)</button>
<div style={{fontSize:"9px",letterSpacing:"2px",color:C.textLt,marginBottom:"6px"}}>DESCRIPTION (FR)</div>
<textarea placeholder="Description..." value={f.description||""} onChange={e=>set("description",e.target.value)} rows={3} style={{...inp,resize:"vertical"}}/>
<div style={{fontSize:"9px",letterSpacing:"2px",color:C.textLt,marginBottom:"6px",marginTop:"12px"}}>DESCRIPTION (EN)</div>
<textarea placeholder="Description..." value={f.descriptionEn||""} onChange={e=>set("descriptionEn",e.target.value)} rows={3} style={{...inp,resize:"vertical"}}/>
<div style={{fontSize:"9px",letterSpacing:"2px",color:C.textLt,marginBottom:"6px",marginTop:"12px"}}>DESCRIPTION (ES)</div>
<textarea placeholder="Description..." value={f.descriptionEs||""} onChange={e=>set("descriptionEs",e.target.value)} rows={3} style={{...inp,resize:"vertical"}}/>
</div>
<div style={{marginTop:"12px"}}>
<div style={{fontSize:"9px",letterSpacing:"2px",color:C.textLt,marginBottom:"6px"}}>DÉGRADÉ (CSS)</div>
<input type="text" placeholder="linear-gradient(135deg, #1a1a1a, #444)" value={f.gradient||""} onChange={e=>set("gradient",e.target.value)} style={inp}/>
</div>
</div>
<div style={{marginBottom:"20px"}}>
<div style={{display:"none",fontSize:"9px",letterSpacing:"3px",color:C.textLt,marginBottom:"12px"}}>LIENS STRIPE (optionnel)</div>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
{[].map(n => (
<div key={n} style={{display:"grid",gridTemplateColumns:"52px 1fr",gap:"7px",alignItems:"center"}}>
<div style={{background:"rgba(0,0,0,0.05)",border:`1px solid ${C.border}`,borderRadius:"7px",padding:"8px",textAlign:"center",fontSize:"12px",color:C.textMd}}>{n}x</div>
<input type="text" placeholder="buy.stripe.com/..." value={f.stripeLinks?.[n]||""} onChange={e=>set("stripeLinks",{...(f.stripeLinks||{}),[n]:e.target.value})} style={{...inp,fontSize:"11px",padding:"9px 10px"}}/>
</div>
))}
</div>
</div>
<div style={{marginBottom:"24px"}}>
<div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt,marginBottom:"10px"}}>STATUT</div>
<div style={{display:"flex",gap:"8px"}}>
{["active","closed","drawn"].map(s=>(
<button key={s} onClick={()=>set("status",s)} style={{...btn,flex:1,padding:"10px",textTransform:"uppercase",fontSize:"10px",background:f.status===s?C.btnBg:"rgba(0,0,0,0.04)",color:f.status===s?C.btnText:C.textMd,border:`1px solid ${f.status===s?C.btnBg:C.border}`}}>{s}</button>
))}
</div>
{f.status==="active" && (
<div style={{marginTop:"10px",fontSize:"11px",color:"rgba(0,100,50,0.8)",background:"rgba(0,120,60,0.06)",border:"1px solid rgba(0,120,60,0.15)",borderRadius:"8px",padding:"8px 12px"}}>
✓ Visible sur www.olawin.org
</div>
)}
</div>
<div style={{display:"flex",gap:"10px"}}>
<button onClick={handleSave} disabled={saving} style={{...btn,flex:1,padding:"14px",background:saving?"rgba(0,0,0,0.3)":C.btnBg,color:C.btnText,fontSize:"13px",cursor:saving?"wait":"pointer"}}>
{saving?"ENREGISTREMENT...":(isNew?"✨ CRÉER":"💾 SAUVEGARDER")}
</button>
<button onClick={onClose} disabled={saving} style={{...btn,padding:"14px 20px",background:"rgba(0,0,0,0.05)",color:C.textMd,border:`1px solid ${C.border}`}}>Annuler</button>
</div>
</div>
</div>
</div>
);
}
function RandomDrawModal({draw, orders, onSave, onClose}) {
const [step, setStep] = useState(1);
const [winnerNum, setWinnerNum] = useState("");
const [saving, setSaving] = useState(false);

const drawOrders = orders.filter(o => o.drawId === draw.id);
const allTickets = [];
drawOrders.forEach(o => {
(o.ticketNums || []).forEach(n => allTickets.push({num: n, order: o}));
});

const maxNum = allTickets.length > 0 ? Math.max(...allTickets.map(t => t.num)) : draw.soldTickets || 0;
const randomUrl = `https://www.random.org/integers/?num=1&min=1&max=${maxNum}&col=1&base=10&format=html&rnd=new`;

const winnerTicket = allTickets.find(t => t.num === parseInt(winnerNum));

const handleSave = async () => {
if (!winnerTicket) {
alert("Aucun ticket ne correspond a ce numero. Verifiez la saisie.");
return;
}
setSaving(true);
try {
await onSave({
num: parseInt(winnerNum),
name: `${winnerTicket.order.firstName} ${winnerTicket.order.lastName}`,
email: winnerTicket.order.email,
orderId: winnerTicket.order.id,
date: new Date().toISOString(),
});
} catch (err) { alert("Erreur : " + err.message); }
finally { setSaving(false); }
};

return (
<div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(10px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"16px",overflowY:"auto"}}>
<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"20px",width:"100%",maxWidth:"680px",maxHeight:"95vh",overflowY:"auto"}}>
<div style={{padding:"28px 32px 0",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"}}>
<div>
<div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt,marginBottom:"4px"}}>🎲 TIRAGE AU SORT</div>
<h2 style={{fontSize:"24px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"3px"}}>{draw.title ? draw.title.toUpperCase() : "—"}</h2>
</div>
<button onClick={onClose} style={{...btn,background:"rgba(0,0,0,0.06)",color:C.textMd,border:`1px solid ${C.border}`,width:"36px",height:"36px",padding:0,borderRadius:"50%"}}>✕</button>
</div>
<div style={{padding:"0 32px 32px"}}>

<div style={{display:"flex",gap:"4px",marginBottom:"24px"}}>
{[1,2,3].map(n => (
<div key={n} style={{flex:1,height:"4px",borderRadius:"4px",background: step>=n ? C.btnBg : "rgba(0,0,0,0.08)"}}/>
))}
</div>

{step === 1 && (
<div>
<div style={{marginBottom:"20px",padding:"20px",background:C.cardAlt,border:`1px solid ${C.border}`,borderRadius:"12px"}}>
<div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt,marginBottom:"10px"}}>RECAPITULATIF</div>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"12px"}}>
<div>
<div style={{fontSize:"9px",color:C.textLt,marginBottom:"4px",letterSpacing:"1px"}}>TICKETS VENDUS</div>
<div style={{fontSize:"22px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"1px"}}>{allTickets.length}</div>
</div>
<div>
<div style={{fontSize:"9px",color:C.textLt,marginBottom:"4px",letterSpacing:"1px"}}>NUMERO MAX</div>
<div style={{fontSize:"22px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"1px"}}>{maxNum}</div>
</div>
<div>
<div style={{fontSize:"9px",color:C.textLt,marginBottom:"4px",letterSpacing:"1px"}}>PARTICIPANTS</div>
<div style={{fontSize:"22px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"1px"}}>{drawOrders.length}</div>
</div>
</div>
</div>

<h3 style={{fontSize:"18px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"2px",marginBottom:"10px"}}>ETAPE 1/3 : LANCER LE TIRAGE</h3>
<p style={{fontSize:"13px",color:C.textMd,lineHeight:"1.7",marginBottom:"16px"}}>
Cliquez sur le bouton ci-dessous pour ouvrir <strong>Random.org</strong> dans un nouvel onglet.
Random.org genere un numero entre <strong>1 et {maxNum}</strong> en utilisant du bruit atmospherique reel.
</p>
<div style={{marginBottom:"16px",padding:"14px",background:"rgba(0,0,0,0.04)",borderRadius:"10px",border:"1px solid rgba(0,0,0,0.08)",fontSize:"12px",color:C.textMd,lineHeight:"1.6"}}>
<strong>💡 Astuce livestream :</strong> Partagez votre ecran sur Instagram/YouTube/TikTok AVANT de cliquer. Vos participants verront le tirage en direct, ce qui garantit la transparence.
</div>

<a href={randomUrl} target="_blank" rel="noopener noreferrer" onClick={()=>setTimeout(()=>setStep(2), 500)} style={{...btn,display:"block",width:"100%",padding:"18px",background:C.btnBg,color:C.btnText,fontSize:"14px",textDecoration:"none",textAlign:"center",marginBottom:"10px"}}>
🎲 OUVRIR RANDOM.ORG (1 → {maxNum})
</a>
<button onClick={()=>setStep(2)} style={{...btn,width:"100%",padding:"12px",background:"transparent",color:C.textMd,border:`1px solid ${C.border}`,fontSize:"11px"}}>
J'ai deja le numero gagnant → passer a l'etape suivante
</button>
</div>
)}

{step === 2 && (
<div>
<h3 style={{fontSize:"18px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"2px",marginBottom:"10px"}}>ETAPE 2/3 : SAISIR LE NUMERO GAGNANT</h3>
<p style={{fontSize:"13px",color:C.textMd,lineHeight:"1.7",marginBottom:"20px"}}>
Entrez le numero que Random.org a genere. Le systeme identifiera automatiquement le proprietaire du ticket.
</p>

<div style={{marginBottom:"16px"}}>
<div style={{fontSize:"9px",letterSpacing:"2px",color:C.textLt,marginBottom:"8px"}}>NUMERO GAGNANT (entre 1 et {maxNum})</div>
<input type="number" min="1" max={maxNum} value={winnerNum} onChange={e=>setWinnerNum(e.target.value)} placeholder="Ex : 47" style={{...inp,fontSize:"24px",textAlign:"center",padding:"18px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"3px"}} autoFocus/>
</div>

{winnerNum && winnerTicket && (
<div style={{padding:"18px",background:"rgba(0,120,60,0.08)",border:"1px solid rgba(0,120,60,0.2)",borderRadius:"12px",marginBottom:"20px"}}>
<div style={{fontSize:"9px",letterSpacing:"3px",color:"rgba(0,100,50,0.8)",marginBottom:"8px"}}>✓ GAGNANT TROUVE</div>
<div style={{fontSize:"20px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"2px",color:"rgba(0,90,45,0.95)",marginBottom:"6px"}}>{winnerTicket.order.firstName} {winnerTicket.order.lastName}</div>
<div style={{fontSize:"12px",color:"rgba(0,90,45,0.8)"}}>📧 {winnerTicket.order.email}</div>
<div style={{fontSize:"12px",color:"rgba(0,90,45,0.8)"}}>🎟️ Ticket #{winnerNum}</div>
</div>
)}

{winnerNum && !winnerTicket && parseInt(winnerNum) >= 1 && parseInt(winnerNum) <= maxNum && (
<div style={{padding:"14px",background:"rgba(180,40,40,0.08)",border:"1px solid rgba(180,40,40,0.2)",borderRadius:"10px",marginBottom:"20px",fontSize:"13px",color:"rgba(140,20,20,0.9)"}}>
⚠️ Aucun ticket ne correspond au numero {winnerNum}. Verifiez les commandes pour ce tirage.
</div>
)}

<div style={{display:"flex",gap:"10px"}}>
<button onClick={()=>setStep(1)} style={{...btn,padding:"14px 20px",background:"rgba(0,0,0,0.05)",color:C.textMd,border:`1px solid ${C.border}`}}>← Retour</button>
<button onClick={()=>setStep(3)} disabled={!winnerTicket} style={{...btn,flex:1,padding:"14px",background:winnerTicket?C.btnBg:"rgba(0,0,0,0.15)",color:C.btnText,fontSize:"13px",cursor:winnerTicket?"pointer":"not-allowed"}}>
CONTINUER →
</button>
</div>
</div>
)}

{step === 3 && winnerTicket && (
<div>
<h3 style={{fontSize:"18px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"2px",marginBottom:"10px"}}>ETAPE 3/3 : CONFIRMATION</h3>
<p style={{fontSize:"13px",color:C.textMd,lineHeight:"1.7",marginBottom:"20px"}}>
Verifiez les informations avant de valider. Une fois enregistre, le tirage passera en statut <strong>"DRAWN"</strong> et le gagnant sera affiche sur le site public.
</p>

<div style={{padding:"24px",background:"linear-gradient(135deg, rgba(180,140,0,0.08), rgba(140,100,0,0.06))",border:"1px solid rgba(180,140,0,0.25)",borderRadius:"14px",marginBottom:"20px",textAlign:"center"}}>
<div style={{fontSize:"40px",marginBottom:"8px"}}>🏆</div>
<div style={{fontSize:"10px",letterSpacing:"3px",color:"rgba(140,100,0,0.8)",marginBottom:"6px"}}>GAGNANT OFFICIEL</div>
<div style={{fontSize:"28px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"3px",color:"rgba(120,80,0,1)",marginBottom:"8px"}}>{winnerTicket.order.firstName} {winnerTicket.order.lastName}</div>
<div style={{fontSize:"12px",color:"rgba(140,100,0,0.85)",marginBottom:"4px"}}>📧 {winnerTicket.order.email}</div>
<div style={{fontSize:"12px",color:"rgba(140,100,0,0.85)",marginBottom:"12px"}}>🎟️ Ticket #{winnerNum}</div>
<div style={{display:"inline-block",background:"rgba(255,255,255,0.5)",borderRadius:"20px",padding:"5px 14px",fontSize:"11px",letterSpacing:"1px",color:"rgba(120,80,0,1)"}}>
PRIX : {draw.prize}
</div>
</div>

<div style={{padding:"14px",background:"rgba(0,0,0,0.04)",borderRadius:"10px",border:"1px solid rgba(0,0,0,0.08)",fontSize:"12px",color:C.textMd,lineHeight:"1.6",marginBottom:"20px"}}>
<strong>📧 Prochaines etapes :</strong>
<ul style={{margin:"6px 0 0 18px",padding:0}}>
<li>Le tirage sera marque comme termine (DRAWN)</li>
<li>Le gagnant sera affiche publiquement sur www.olawin.org</li>
<li>Contactez le gagnant par email avec son bon dans les 48h</li>
</ul>
</div>

<div style={{display:"flex",gap:"10px"}}>
<button onClick={()=>setStep(2)} disabled={saving} style={{...btn,padding:"14px 20px",background:"rgba(0,0,0,0.05)",color:C.textMd,border:`1px solid ${C.border}`}}>← Retour</button>
<button onClick={handleSave} disabled={saving} style={{...btn,flex:1,padding:"14px",background:saving?"rgba(0,0,0,0.3)":"rgba(180,140,0,0.95)",color:"#fff",fontSize:"13px"}}>
{saving?"ENREGISTREMENT...":"🏆 VALIDER LE GAGNANT"}
</button>
</div>
</div>
)}
</div>
</div>
</div>
);
}
function SocialModal({initial, onSave, onClose}) {
const [f, setF] = useState(initial || {
whatsapp: { enabled: false, phone: "", message: "" },
instagram: { enabled: false, username: "" }
});
const [saving, setSaving] = useState(false);

const setWA = (k,v) => setF(p => ({...p, whatsapp: {...(p.whatsapp||{}), [k]: v}}));
const setIG = (k,v) => setF(p => ({...p, instagram: {...(p.instagram||{}), [k]: v}}));

const handleSave = async () => {
setSaving(true);
try { await onSave(f); }
catch (err) { alert("Erreur Firebase : " + err.message); }
finally { setSaving(false); }
};

return (
<div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.4)",backdropFilter:"blur(10px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"16px",overflowY:"auto"}}>
<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"20px",width:"100%",maxWidth:"620px",maxHeight:"95vh",overflowY:"auto"}}>
<div style={{padding:"28px 32px 0",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"24px"}}>
<div>
<div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt,marginBottom:"4px"}}>RÉGLAGES</div>
<h2 style={{fontSize:"24px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"3px"}}>RÉSEAUX SOCIAUX</h2>
</div>
<button onClick={onClose} style={{...btn,background:"rgba(0,0,0,0.06)",color:C.textMd,border:`1px solid ${C.border}`,width:"36px",height:"36px",padding:0,borderRadius:"50%"}}>✕</button>
</div>
<div style={{padding:"0 32px 32px"}}>

<div style={{marginBottom:"28px",padding:"20px",background:C.cardAlt,border:`1px solid ${C.border}`,borderRadius:"14px"}}>
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px"}}>
<div style={{display:"flex",alignItems:"center",gap:"10px"}}>
<div style={{width:"32px",height:"32px",borderRadius:"50%",background:"#25D366",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px"}}>💬</div>
<div>
<div style={{fontSize:"15px",fontWeight:"600"}}>WhatsApp</div>
<div style={{fontSize:"11px",color:C.textLt}}>Bouton flottant en bas a droite du site</div>
</div>
</div>
<label style={{display:"flex",alignItems:"center",gap:"8px",cursor:"pointer"}}>
<input type="checkbox" checked={!!f.whatsapp?.enabled} onChange={e=>setWA("enabled", e.target.checked)} style={{width:"18px",height:"18px",cursor:"pointer"}}/>
<span style={{fontSize:"12px",fontWeight:"600",color:f.whatsapp?.enabled?"rgba(0,100,50,0.9)":C.textLt}}>{f.whatsapp?.enabled?"ACTIVÉ":"DÉSACTIVÉ"}</span>
</label>
</div>
<div style={{marginBottom:"12px"}}>
<div style={{fontSize:"9px",letterSpacing:"2px",color:C.textLt,marginBottom:"6px"}}>NUMERO (format international, ex: +33612345678)</div>
<input type="tel" placeholder="+33612345678" value={f.whatsapp?.phone||""} onChange={e=>setWA("phone", e.target.value)} style={inp}/>
</div>
<div>
<div style={{fontSize:"9px",letterSpacing:"2px",color:C.textLt,marginBottom:"6px"}}>MESSAGE PRE-REMPLI</div>
<textarea placeholder="Bonjour, j'ai une question sur Olawin..." value={f.whatsapp?.message||""} onChange={e=>setWA("message", e.target.value)} rows={2} style={{...inp,resize:"vertical"}}/>
</div>
</div>

<div style={{marginBottom:"28px",padding:"20px",background:C.cardAlt,border:`1px solid ${C.border}`,borderRadius:"14px"}}>
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px"}}>
<div style={{display:"flex",alignItems:"center",gap:"10px"}}>
<div style={{width:"32px",height:"32px",borderRadius:"50%",background:"linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px"}}>📷</div>
<div>
<div style={{fontSize:"15px",fontWeight:"600"}}>Instagram</div>
<div style={{fontSize:"11px",color:C.textLt}}>Icone dans le footer du site</div>
</div>
</div>
<label style={{display:"flex",alignItems:"center",gap:"8px",cursor:"pointer"}}>
<input type="checkbox" checked={!!f.instagram?.enabled} onChange={e=>setIG("enabled", e.target.checked)} style={{width:"18px",height:"18px",cursor:"pointer"}}/>
<span style={{fontSize:"12px",fontWeight:"600",color:f.instagram?.enabled?"rgba(0,100,50,0.9)":C.textLt}}>{f.instagram?.enabled?"ACTIVÉ":"DÉSACTIVÉ"}</span>
</label>
</div>
<div>
<div style={{fontSize:"9px",letterSpacing:"2px",color:C.textLt,marginBottom:"6px"}}>NOM D'UTILISATEUR (sans @)</div>
<input type="text" placeholder="olawin_official" value={f.instagram?.username||""} onChange={e=>setIG("username", e.target.value.replace(/^@/,""))} style={inp}/>
</div>
</div>

<div style={{display:"flex",gap:"10px"}}>
<button onClick={handleSave} disabled={saving} style={{...btn,flex:1,padding:"14px",background:saving?"rgba(0,0,0,0.3)":C.btnBg,color:C.btnText,fontSize:"13px",cursor:saving?"wait":"pointer"}}>
{saving?"ENREGISTREMENT...":"💾 SAUVEGARDER"}
</button>
<button onClick={onClose} disabled={saving} style={{...btn,padding:"14px 20px",background:"rgba(0,0,0,0.05)",color:C.textMd,border:`1px solid ${C.border}`}}>Annuler</button>
</div>
</div>
</div>
</div>
);
}

const LANGS_LIST = [
{code:"fr", label:"🇫🇷 Français"},
{code:"en", label:"🇬🇧 English"},
{code:"es", label:"🇪🇸 Español"}
];

function ContentModal({initial, onSave, onClose}) {
const [f, setF] = useState(initial || {
steps: { fr:[], en:[], es:[] },
faq: { fr:[], en:[], es:[] },
footer: { copyright: "2026 Olawin.", contactEmail: "contact@olawin.org" }
});
const [section, setSection] = useState("steps");
const [lang, setLang] = useState("fr");
const [saving, setSaving] = useState(false);

const currentSteps = (f.steps && f.steps[lang]) || [];
const currentFaq = (f.faq && f.faq[lang]) || [];

const updateStep = (i, key, val) => {
const arr = [...currentSteps];
arr[i] = {...(arr[i]||{}), [key]: val};
setF(p => ({...p, steps: {...(p.steps||{}), [lang]: arr}}));
};

const updateFaq = (i, key, val) => {
const arr = [...currentFaq];
arr[i] = {...(arr[i]||{}), [key]: val};
setF(p => ({...p, faq: {...(p.faq||{}), [lang]: arr}}));
};

const addFaq = () => {
const arr = [...currentFaq, {q:"", a:""}];
setF(p => ({...p, faq: {...(p.faq||{}), [lang]: arr}}));
};

const removeFaq = (i) => {
const arr = currentFaq.filter((_,idx) => idx !== i);
setF(p => ({...p, faq: {...(p.faq||{}), [lang]: arr}}));
};

const setFooter = (k,v) => setF(p => ({...p, footer: {...(p.footer||{}), [k]: v}}));

const ensure4Steps = () => {
const arr = [...currentSteps];
while (arr.length < 4) arr.push({title:"", desc:""});
return arr.slice(0,4);
};
const steps4 = ensure4Steps();

const handleSave = async () => {
setSaving(true);
try {
const cleaned = {
steps: f.steps || {fr:[],en:[],es:[]},
faq: f.faq || {fr:[],en:[],es:[]},
footer: f.footer || {copyright:"", contactEmail:""}
};
await onSave(cleaned);
}
catch (err) { alert("Erreur Firebase : " + err.message); }
finally { setSaving(false); }
};

return (
<div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.4)",backdropFilter:"blur(10px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"16px",overflowY:"auto"}}>
<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"20px",width:"100%",maxWidth:"760px",maxHeight:"95vh",overflowY:"auto"}}>
<div style={{padding:"28px 32px 0",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"}}>
<div>
<div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt,marginBottom:"4px"}}>RÉGLAGES</div>
<h2 style={{fontSize:"24px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"3px"}}>CONTENU DU SITE</h2>
</div>
<button onClick={onClose} style={{...btn,background:"rgba(0,0,0,0.06)",color:C.textMd,border:`1px solid ${C.border}`,width:"36px",height:"36px",padding:0,borderRadius:"50%"}}>✕</button>
</div>
<div style={{padding:"0 32px 32px"}}>

<div style={{display:"flex",gap:"6px",marginBottom:"16px"}}>
{[{id:"steps",label:"📋 Etapes"},{id:"faq",label:"❓ FAQ"},{id:"footer",label:"📧 Footer"}].map(s=>(
<button key={s.id} onClick={()=>setSection(s.id)} style={{...btn,padding:"8px 14px",fontSize:"11px",background:section===s.id?C.btnBg:"rgba(0,0,0,0.05)",color:section===s.id?C.btnText:C.textMd,border:`1px solid ${section===s.id?C.btnBg:C.border}`}}>{s.label}</button>
))}
</div>

{section !== "footer" && (
<div style={{display:"flex",gap:"4px",marginBottom:"20px",background:"rgba(0,0,0,0.04)",padding:"4px",borderRadius:"10px"}}>
{LANGS_LIST.map(l=>(
<button key={l.code} onClick={()=>setLang(l.code)} style={{...btn,flex:1,padding:"8px",fontSize:"11px",background:lang===l.code?C.btnBg:"transparent",color:lang===l.code?C.btnText:C.textMd,border:"none"}}>{l.label}</button>
))}
</div>
)}

{section === "steps" && (
<div>
<div style={{fontSize:"11px",color:C.textMd,marginBottom:"16px",lineHeight:"1.6"}}>
4 etapes affichees dans "Comment ca marche". Remplissez pour la langue selectionnee.
</div>
{steps4.map((step, i) => (
<div key={i} style={{marginBottom:"14px",padding:"14px",background:C.cardAlt,border:`1px solid ${C.border}`,borderRadius:"10px"}}>
<div style={{fontSize:"9px",letterSpacing:"2px",color:C.textLt,marginBottom:"10px"}}>ETAPE 0{i+1}</div>
<input type="text" placeholder="Titre (ex: Choisissez)" value={step.title||""} onChange={e=>updateStep(i,"title",e.target.value)} style={{...inp,marginBottom:"8px"}}/>
<textarea placeholder="Description courte" value={step.desc||""} onChange={e=>updateStep(i,"desc",e.target.value)} rows={2} style={{...inp,resize:"vertical",fontSize:"13px"}}/>
</div>
))}
</div>
)}

{section === "faq" && (
<div>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
<div style={{fontSize:"11px",color:C.textMd,lineHeight:"1.6"}}>Questions/reponses pour la langue selectionnee.</div>
<button onClick={addFaq} style={{...btn,padding:"8px 14px",fontSize:"11px",background:C.btnBg,color:C.btnText}}>+ AJOUTER</button>
</div>
{currentFaq.length === 0 ? (
<div style={{padding:"30px",textAlign:"center",background:C.cardAlt,border:`1px dashed ${C.border}`,borderRadius:"10px",fontSize:"13px",color:C.textMd}}>
Aucune question. Cliquez sur "+ AJOUTER" pour commencer.
</div>
) : currentFaq.map((item, i) => (
<div key={i} style={{marginBottom:"14px",padding:"14px",background:C.cardAlt,border:`1px solid ${C.border}`,borderRadius:"10px"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
<div style={{fontSize:"9px",letterSpacing:"2px",color:C.textLt}}>QUESTION #{i+1}</div>
<button onClick={()=>removeFaq(i)} style={{...btn,padding:"4px 10px",fontSize:"10px",background:"rgba(160,0,0,0.08)",color:"rgba(140,0,0,0.7)",border:"1px solid rgba(160,0,0,0.15)"}}>🗑 SUPPRIMER</button>
</div>
<input type="text" placeholder="Question" value={item.q||""} onChange={e=>updateFaq(i,"q",e.target.value)} style={{...inp,marginBottom:"8px"}}/>
<textarea placeholder="Reponse" value={item.a||""} onChange={e=>updateFaq(i,"a",e.target.value)} rows={3} style={{...inp,resize:"vertical",fontSize:"13px"}}/>
</div>
))}
</div>
)}

{section === "footer" && (
<div>
<div style={{fontSize:"11px",color:C.textMd,marginBottom:"16px",lineHeight:"1.6"}}>
Informations affichees dans le footer du site.
</div>
<div style={{marginBottom:"14px"}}>
<div style={{fontSize:"9px",letterSpacing:"2px",color:C.textLt,marginBottom:"6px"}}>TEXTE COPYRIGHT</div>
<input type="text" placeholder="2026 Olawin. Tous droits reserves." value={f.footer?.copyright||""} onChange={e=>setFooter("copyright", e.target.value)} style={inp}/>
</div>
<div>
<div style={{fontSize:"9px",letterSpacing:"2px",color:C.textLt,marginBottom:"6px"}}>EMAIL DE CONTACT</div>
<input type="email" placeholder="contact@olawin.org" value={f.footer?.contactEmail||""} onChange={e=>setFooter("contactEmail", e.target.value)} style={inp}/>
</div>
</div>
)}

<div style={{display:"flex",gap:"10px",marginTop:"24px"}}>
<button onClick={handleSave} disabled={saving} style={{...btn,flex:1,padding:"14px",background:saving?"rgba(0,0,0,0.3)":C.btnBg,color:C.btnText,fontSize:"13px",cursor:saving?"wait":"pointer"}}>
{saving?"ENREGISTREMENT...":"💾 SAUVEGARDER"}
</button>
<button onClick={onClose} disabled={saving} style={{...btn,padding:"14px 20px",background:"rgba(0,0,0,0.05)",color:C.textMd,border:`1px solid ${C.border}`}}>Annuler</button>
</div>
</div>
</div>
</div>
);
}

function CGVModal({initial, onSave, onClose}) {
const [f, setF] = useState(initial || { fr:"", en:"", es:"" });
const [lang, setLang] = useState("fr");
const [saving, setSaving] = useState(false);

const setText = (val) => setF(p => ({...p, [lang]: val}));

const handleSave = async () => {
setSaving(true);
try { await onSave(f); }
catch (err) { alert("Erreur Firebase : " + err.message); }
finally { setSaving(false); }
};

const currentText = f[lang] || "";
const charCount = currentText.length;

return (
<div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.4)",backdropFilter:"blur(10px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"16px",overflowY:"auto"}}>
<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"20px",width:"100%",maxWidth:"820px",maxHeight:"95vh",overflowY:"auto"}}>
<div style={{padding:"28px 32px 0",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"}}>
<div>
<div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt,marginBottom:"4px"}}>RÉGLAGES</div>
<h2 style={{fontSize:"24px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"3px"}}>⚖️ MENTIONS LÉGALES & CGV</h2>
</div>
<button onClick={onClose} style={{...btn,background:"rgba(0,0,0,0.06)",color:C.textMd,border:`1px solid ${C.border}`,width:"36px",height:"36px",padding:0,borderRadius:"50%"}}>✕</button>
</div>
<div style={{padding:"0 32px 32px"}}>

<div style={{padding:"14px 16px",background:"rgba(180,140,0,0.08)",border:"1px solid rgba(180,140,0,0.2)",borderRadius:"10px",fontSize:"12px",color:"rgba(120,80,0,0.95)",lineHeight:"1.6",marginBottom:"20px"}}>
💡 <strong>Conseil :</strong> Collez ici le texte de vos CGV / Mentions Legales fourni par votre avocat. Il s'affichera sur la page "Mentions Legales" du site, dans la langue correspondante. Vous pouvez utiliser des sauts de ligne pour separer les sections.
</div>

<div style={{display:"flex",gap:"4px",marginBottom:"16px",background:"rgba(0,0,0,0.04)",padding:"4px",borderRadius:"10px"}}>
{LANGS_LIST.map(l=>(
<button key={l.code} onClick={()=>setLang(l.code)} style={{...btn,flex:1,padding:"10px",fontSize:"12px",background:lang===l.code?C.btnBg:"transparent",color:lang===l.code?C.btnText:C.textMd,border:"none"}}>
{l.label} {f[l.code] ? "✓" : ""}
</button>
))}
</div>

<div style={{marginBottom:"8px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
<div style={{fontSize:"9px",letterSpacing:"2px",color:C.textLt}}>TEXTE DES CGV ({LANGS_LIST.find(l=>l.code===lang)?.label})</div>
<div style={{fontSize:"11px",color:C.textLt}}>{charCount.toLocaleString()} caracteres</div>
</div>
<textarea
value={currentText}
onChange={e=>setText(e.target.value)}
placeholder={`Collez ici le texte de vos CGV en ${LANGS_LIST.find(l=>l.code===lang)?.label}...

Exemple de structure :

1. EDITEUR DU SITE
Olawin SAS, ...

2. CONDITIONS DE PARTICIPATION
Pour participer aux tirages...

3. PROTECTION DES DONNEES
...`}
rows={22}
style={{...inp, resize:"vertical", fontSize:"13px", lineHeight:"1.6", fontFamily:"'DM Sans', monospace"}}
/>

<div style={{display:"flex",gap:"10px",marginTop:"24px"}}>
<button onClick={handleSave} disabled={saving} style={{...btn,flex:1,padding:"14px",background:saving?"rgba(0,0,0,0.3)":C.btnBg,color:C.btnText,fontSize:"13px",cursor:saving?"wait":"pointer"}}>
{saving?"ENREGISTREMENT...":"💾 SAUVEGARDER LES CGV"}
</button>
<button onClick={onClose} disabled={saving} style={{...btn,padding:"14px 20px",background:"rgba(0,0,0,0.05)",color:C.textMd,border:`1px solid ${C.border}`}}>Annuler</button>
</div>
</div>
</div>
</div>
);
}
function DrawExplanation() {
const steps = [
{num:"01", icon:"🔒", title:"Cloture des ventes", desc:"A la date de cloture, les achats sont automatiquement bloques sur le site. Aucun nouveau ticket ne peut etre achete. La liste finale des participants est figee.", detail:"Stripe cesse d'accepter les paiements via les liens de paiement du tirage concerne."},
{num:"02", icon:"📋", title:"Liste complete des tickets", desc:"Tous les numeros de tickets vendus sont compiles dans une liste unique. Chaque ticket achete correspond a un numero unique entre 1 et le total vendu.", detail:"Exemple : 143 tickets vendus -> liste de #001 a #143. Un participant ayant achete 5 tickets possede 5 numeros distincts."},
{num:"03", icon:"🎲", title:"Tirage aleatoire certifie", desc:"L'admin Olawin ouvre Random.org en un clic avec les bons parametres. Random.org genere un numero base sur du bruit atmospherique reel (pas un algorithme), ce qui garantit un resultat impartial et imprevisible.", detail:"Random.org est utilise par des etats, des loteries officielles et la recherche scientifique. C'est la reference mondiale du tirage aleatoire transparent."},
{num:"04", icon:"📺", title:"Diffusion en direct", desc:"Le tirage est filme et diffuse en direct sur les reseaux sociaux (Instagram Live, YouTube Live, TikTok Live). Les spectateurs voient le numero gagnant apparaitre en temps reel.", detail:"On partage l'ecran montrant Random.org, le numero selectionne, puis on annonce publiquement le nom du gagnant."},
{num:"05", icon:"🏆", title:"Annonce du gagnant", desc:"Le gagnant est identifie automatiquement par l'admin Olawin en saisissant le numero gagnant. Son nom est annonce publiquement en direct. L'enregistrement du live est conserve comme preuve.", detail:"L'admin enregistre le gagnant dans Firebase. Il apparait alors sur la fiche du tirage sur le site public."},
{num:"06", icon:"📧", title:"Remise du bon", desc:"Le gagnant recoit un email dans les 48h avec son bon partenaire. Le bon est nominatif et directement utilisable.", detail:"Vous contactez le gagnant via l'email enregistre dans la commande. Le code du bon lui est transmis de facon securisee."},
];

return (
<div style={{animation:"fadeUp 0.4s ease"}}>
<div style={{marginBottom:"40px"}}>
<div style={{fontSize:"9px",letterSpacing:"4px",color:C.textLt,marginBottom:"8px"}}>PROCESSUS</div>
<h1 style={{fontSize:"36px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"4px",color:C.text,marginBottom:"8px"}}>COMMENT SE DEROULE LE TIRAGE</h1>
<p style={{fontSize:"14px",color:C.textMd,lineHeight:"1.7",maxWidth:"600px"}}>
Guide complet etape par etape — de la cloture des ventes a la remise du bon gagnant.
</p>
</div>

<div style={{display:"flex",flexDirection:"column",gap:"4px"}}>
{steps.map((s,i) => (
<div key={i} style={{
display:"flex",gap:"24px",alignItems:"flex-start",
background: i===0 || i===2 || i===4 ? C.card : "transparent",
border: i===0 || i===2 || i===4 ? `1px solid ${C.border}` : "1px solid transparent",
borderRadius:"14px",padding:"24px",marginBottom:"4px",
}}>
<div style={{
width:"56px",height:"56px",borderRadius:"50%",flexShrink:0,
background: i===2 ? C.btnBg : C.cardAlt,
border:`1px solid ${i===2 ? C.btnBg : C.border}`,
display:"flex",alignItems:"center",justifyContent:"center",
}}>
<span style={{fontSize:"18px"}}>{s.icon}</span>
</div>
<div style={{flex:1}}>
<div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"8px"}}>
<span style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt}}>ETAPE {s.num}</span>
{i===2 && <Badge>CLEF</Badge>}
</div>
<h3 style={{fontSize:"18px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"2px",color:C.text,marginBottom:"8px"}}>{s.title.toUpperCase()}</h3>
<p style={{fontSize:"14px",color:C.text,lineHeight:"1.7",marginBottom:"10px"}}>{s.desc}</p>
<div style={{
background:"rgba(0,0,0,0.04)",border:`1px solid ${C.border}`,
borderRadius:"8px",padding:"12px 14px",
fontSize:"12px",color:C.textMd,lineHeight:"1.6",
borderLeft:`3px solid rgba(0,0,0,0.2)`,
}}>
💡 {s.detail}
</div>
</div>
</div>
))}
</div>

<div style={{marginTop:"32px",background:C.card,border:`1px solid ${C.border}`,borderRadius:"16px",padding:"32px"}}>
<div style={{fontSize:"9px",letterSpacing:"4px",color:C.textLt,marginBottom:"12px"}}>INTEGRATION DIRECTE</div>
<h3 style={{fontSize:"20px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"3px",marginBottom:"12px"}}>🎲 RANDOM.ORG INTEGRE A L'ADMIN</h3>
<p style={{fontSize:"14px",color:C.textMd,lineHeight:"1.75",marginBottom:"20px"}}>
Pas besoin de configurer quoi que ce soit ! Dans l'onglet "Tirages", chaque tirage actif dont la date de cloture est passee affiche automatiquement un bouton <strong>🎲 LANCER LE TIRAGE</strong>. Un clic ouvre Random.org avec les bons parametres (numero entre 1 et le nombre de tickets vendus). Vous n'avez plus qu'a saisir le numero gagnant et le systeme identifie automatiquement le proprietaire.
</p>
<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"12px",marginBottom:"20px"}}>
{[
{t:"100% Gratuit",d:"Aucun compte, aucune limite pour vos tirages"},
{t:"Certifie",d:"Reference mondiale du tirage aleatoire reel"},
{t:"Transparent",d:"Vous montrez l'URL en live sur vos reseaux"},
].map((c,i)=>(
<div key={i} style={{background:C.cardAlt,border:`1px solid ${C.border}`,borderRadius:"10px",padding:"16px"}}>
<div style={{fontSize:"13px",fontWeight:"600",color:C.text,marginBottom:"4px"}}>{c.t}</div>
<div style={{fontSize:"12px",color:C.textMd,lineHeight:"1.5"}}>{c.d}</div>
</div>
))}
</div>
</div>

<div style={{marginTop:"24px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
{[
{q:"Que faire si le gagnant ne repond pas ?",a:"Relancer par email 3 fois sur 7 jours. Sans reponse, un nouveau tirage peut etre organise selon vos CGV."},
{q:"Faut-il filmer le tirage ?",a:"Oui, fortement recommande. Le live est la meilleure preuve de transparence et renforce la confiance des participants."},
{q:"Le tirage peut-il etre annule ?",a:"Oui, si force majeure. Dans ce cas tous les participants sont rembourses integralement via Stripe dans les 14 jours."},
{q:"Comment prouver l'equite ?",a:"Diffusez en live, conservez l'enregistrement, utilisez Random.org et affichez le numero gagnant avec le nom du participant publiquement."},
].map((f,i)=>(
<div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"12px",padding:"18px"}}>
<div style={{fontSize:"13px",fontWeight:"600",color:C.text,marginBottom:"6px"}}>{f.q}</div>
<div style={{fontSize:"12px",color:C.textMd,lineHeight:"1.6"}}>{f.a}</div>
</div>
))}
</div>
</div>
);
}


export default function OlawinAdmin() {
const [authed, setAuthed] = useState(false);
const [pw, setPw] = useState("");
const [pwErr, setPwErr] = useState(false);
const [tab, setTab] = useState("dashboard");
const [draws, setDraws] = useState([]);
const [orders, setOrders] = useState([]);
const [loading, setLoading] = useState(true);
const [editDraw, setEditDraw] = useState(null);
const [showNew, setShowNew] = useState(false);
const [randomDraw, setRandomDraw] = useState(null);
const [notif, setNotif] = useState(null);
const [orderSearch, setOrderSearch] = useState("");
const [showSocial, setShowSocial] = useState(false);
const [showContent, setShowContent] = useState(false);
const [showCGV, setShowCGV] = useState(false);
const [socialData, setSocialData] = useState(null);
const [contentData, setContentData] = useState(null);
const [legalData, setLegalData] = useState(null);

const notify = (msg, type="ok") => { setNotif({msg,type}); setTimeout(()=>setNotif(null),3000); };

useEffect(() => {
if (!authed) return;
const qDraws = query(collection(db,"draws"), orderBy("createdAt","desc"));
const unsubD = onSnapshot(qDraws, (snap) => {
setDraws(snap.docs.map(d => ({ id: d.id, ...d.data() })));
setLoading(false);
}, (err) => { console.error("Firebase draws:", err); setLoading(false); notify("Erreur Firebase","err"); });
const qOrders = query(collection(db,"orders"), orderBy("createdAt","desc"));
const unsubO = onSnapshot(qOrders, (snap) => {
setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
});
getDoc(doc(db,"settings","social")).then(snap => { if (snap.exists()) setSocialData(snap.data()); }).catch(()=>{});
getDoc(doc(db,"settings","content")).then(snap => { if (snap.exists()) setContentData(snap.data()); }).catch(()=>{});
getDoc(doc(db,"settings","legal")).then(snap => { if (snap.exists()) setLegalData(snap.data()); }).catch(()=>{});
return () => { unsubD(); unsubO(); };
}, [authed]);

const saveDraw = async (d) => {
const { id, ...payload } = d;
if (!payload.createdAt) payload.createdAt = serverTimestamp();
payload.updatedAt = serverTimestamp();
if (!payload.soldTickets) payload.soldTickets = 0;
await updateDoc(doc(db,"draws",id), payload);
setEditDraw(null);
notify("Tirage mis a jour ✓");
};

const createDraw = async (d) => {
const payload = { ...d, soldTickets: 0, winner: null, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
await addDoc(collection(db,"draws"), payload);
setShowNew(false);
notify("Tirage cree ✓ — visible sur le site");
};

const deleteDraw = async (id) => {
if (!window.confirm("Supprimer ce tirage ?")) return;
try { await deleteDoc(doc(db,"draws",id)); notify("Supprime","err"); }
catch (err) { notify("Erreur","err"); }
};

const deleteOrder = async (orderId, drawId, ticketCount) => {
if (!window.confirm("Supprimer cette commande ?")) return;
try {
await deleteDoc(doc(db,"orders",orderId));
if (drawId && ticketCount) { await updateDoc(doc(db,"draws",drawId), { soldTickets: increment(-ticketCount) }); }
notify("Commande supprimee");
} catch (err) { notify("Erreur","err"); }
};

const clearDrawOrders = async (drawId) => {
const toDelete = orders.filter(o => o.drawId === drawId);
if (toDelete.length === 0) { notify("Aucune commande pour ce tirage"); return; }
if (!window.confirm("Supprimer les " + toDelete.length + " commandes de ce tirage ET remettre le compteur a zero ?")) return;
try {
for (const o of toDelete) { await deleteDoc(doc(db,"orders",o.id)); }
await updateDoc(doc(db,"draws",drawId), { soldTickets: 0 });
notify(toDelete.length + " commandes supprimees, compteur a zero");
} catch (err) { notify("Erreur","err"); }
};

const saveWinner = async (winnerData) => {
if (!randomDraw) return;
await updateDoc(doc(db,"draws",randomDraw.id), {
winner: winnerData,
status: "drawn",
drawnAt: serverTimestamp(),
});
setRandomDraw(null);
notify(`🏆 Gagnant enregistre : ${winnerData.name}`);
};

const saveSocial = async (data) => {
await setDoc(doc(db,"settings","social"), data);
setSocialData(data);
setShowSocial(false);
notify("Reseaux sociaux mis a jour ✓");
};

const saveContent = async (data) => {
await setDoc(doc(db,"settings","content"), data);
setContentData(data);
setShowContent(false);
notify("Contenu du site mis a jour ✓");
};

const saveLegal = async (data) => {
await setDoc(doc(db,"settings","legal"), {...data, updatedAt: serverTimestamp()});
setLegalData(data);
setShowCGV(false);
notify("CGV mises a jour ✓");
};

const paidOrders = orders.filter(o=>o.status==="paid");
const totalRevenue = paidOrders.reduce((s,o)=>s+(o.amount||0),0);
const totalTickets = paidOrders.reduce((s,o)=>s+(o.tickets||0),0);
const activeDraws = draws.filter(d=>d.status==="active").length;
const norm = (v)=>(v||"").toString().toLowerCase().replace(/\s/g,"");
const paidEmails = new Set(paidOrders.map(o=>norm(o.email)).filter(Boolean));
const paidPhones = new Set(paidOrders.map(o=>norm(o.phone)).filter(Boolean));
const visibleOrders = orders.filter(o=>{
  if (o.status==="paid") return true;
  const e = norm(o.email);
  const p = norm(o.phone);
  if (e && paidEmails.has(e)) return false;
  if (p && paidPhones.has(p)) return false;
  return true;
});
const filtered = visibleOrders.filter(o=>{
const s = orderSearch.toLowerCase();
return (o.firstName||"").toLowerCase().includes(s) ||
(o.lastName||"").toLowerCase().includes(s) ||
(o.email||"").toLowerCase().includes(s);
});

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&family=DM+Mono&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
input::placeholder, textarea::placeholder{color:rgba(0,0,0,0.25);}
input:focus, textarea:focus{outline:none;border-color:rgba(0,0,0,0.4);}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
@keyframes slideIn{from{transform:translateX(100%);opacity:0;}to{transform:translateX(0);opacity:1;}}
@keyframes spin{to{transform:rotate(360deg);}}
.row:hover{background:rgba(0,0,0,0.03);}
`;

if (!authed) return (
<div style={{background:C.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif",color:C.text}}>
<style>{CSS}</style>
<div style={{width:"360px"}}>
<div style={{textAlign:"center",marginBottom:"40px"}}>
<Logo size={36}/>
<div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt,marginTop:"8px"}}>ESPACE ADMINISTRATEUR</div>
</div>
<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"16px",padding:"32px"}}>
<div style={{fontSize:"9px",letterSpacing:"2px",color:C.textLt,marginBottom:"7px"}}>MOT DE PASSE</div>
<input type="password" placeholder="••••••••••" value={pw}
onChange={e=>{setPw(e.target.value);setPwErr(false);}}
onKeyDown={e=>e.key==="Enter"&&(pw===ADMIN_PASSWORD?setAuthed(true):setPwErr(true))}
style={{...inp,marginBottom:"12px",borderColor:pwErr?"rgba(180,0,0,0.3)":"rgba(0,0,0,0.12)"}}
autoFocus/>
{pwErr && <div style={{fontSize:"12px",color:"rgba(160,0,0,0.7)",marginBottom:"12px"}}>Mot de passe incorrect</div>}
<button onClick={()=>pw===ADMIN_PASSWORD?setAuthed(true):setPwErr(true)} style={{...btn,width:"100%",padding:"14px",background:C.btnBg,color:C.btnText}}>SE CONNECTER →</button>
</div>
<div style={{textAlign:"center",marginTop:"16px",fontSize:"11px",color:C.textLt}}>Connecte a Firebase · olawin-99639</div>
</div>
</div>
);

return (
<div style={{background:C.bg,minHeight:"100vh",color:C.text,fontFamily:"'DM Sans',sans-serif",display:"grid",gridTemplateColumns:"220px 1fr"}}>
<style>{CSS}</style>
{editDraw && <DrawModal draw={editDraw} onSave={saveDraw} onClose={()=>setEditDraw(null)}/>}
{showNew && <DrawModal draw={{title:"",location:"",country:"",prize:"",partner:"PrivateHonors.com",emoji:"🏝️",ticketPrice:100,totalTickets:200,soldTickets:0,endDate:"",drawDate:"",status:"active",image:"",description:"",gradient:"",stripeLinks:{}}} onSave={createDraw} onClose={()=>setShowNew(false)} isNew/>}
{randomDraw && <RandomDrawModal draw={randomDraw} orders={orders} onSave={saveWinner} onClose={()=>setRandomDraw(null)}/>}
{showSocial && <SocialModal initial={socialData} onSave={saveSocial} onClose={()=>setShowSocial(false)}/>}
{showContent && <ContentModal initial={contentData} onSave={saveContent} onClose={()=>setShowContent(false)}/>}
{showCGV && <CGVModal initial={legalData} onSave={saveLegal} onClose={()=>setShowCGV(false)}/>}
{notif && (
<div style={{position:"fixed",top:"20px",right:"20px",zIndex:300,background:notif.type==="err"?"#8B0000":C.btnBg,color:C.btnText,borderRadius:"10px",padding:"13px 20px",fontSize:"13px",fontWeight:"600",animation:"slideIn 0.3s ease",maxWidth:"400px"}}>{notif.msg}</div>
)}

<aside style={{background:C.sidebar,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh"}}>
<div style={{padding:"28px 24px 20px",borderBottom:`1px solid ${C.border}`}}>
<Logo size={26}/>
<div style={{fontSize:"9px",letterSpacing:"2px",color:C.textLt,marginTop:"6px"}}>ADMIN PANEL · LIVE</div>
</div>
<nav style={{padding:"20px 14px",flex:1}}>
{[
{id:"dashboard",icon:"◈",label:"Dashboard"},
{id:"draws",icon:"▣",label:"Tirages"},
{id:"orders",icon:"≡",label:"Commandes"},
{id:"guide",icon:"◎",label:"Guide Tirage"},
{id:"settings",icon:"⚙",label:"Reglages"},
].map(item=>(
<button key={item.id} onClick={()=>setTab(item.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:"10px",padding:"10px 12px",borderRadius:"8px",border:"none",background:tab===item.id?"rgba(0,0,0,0.08)":"transparent",color:tab===item.id?C.text:C.textLt,fontSize:"13px",cursor:"pointer",marginBottom:"3px",borderLeft:`2px solid ${tab===item.id?C.text:"transparent"}`,textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
<span style={{fontSize:"15px"}}>{item.icon}</span>{item.label}
</button>
))}
</nav>
<div style={{padding:"16px",borderTop:`1px solid ${C.border}`}}>
<div style={{fontSize:"9px",letterSpacing:"1.5px",color:C.textLt,marginBottom:"8px",textAlign:"center"}}>🟢 SYNCHRO FIREBASE</div>
<button onClick={()=>setAuthed(false)} style={{...btn,width:"100%",padding:"10px",background:"rgba(0,0,0,0.05)",color:C.textMd,border:`1px solid ${C.border}`,fontSize:"11px"}}>DECONNEXION</button>
</div>
</aside>

<main style={{padding:"40px 44px",overflowY:"auto"}}>
{loading && (
<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"60vh",gap:"16px"}}>
<div style={{width:"32px",height:"32px",border:"2px solid rgba(0,0,0,0.1)",borderTopColor:C.text,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
<p style={{fontSize:"12px",letterSpacing:"3px",color:C.textLt}}>CHARGEMENT FIREBASE...</p>
</div>
)}

{!loading && tab==="dashboard" && (
<div style={{animation:"fadeUp 0.4s ease"}}>
<div style={{marginBottom:"36px"}}>
<div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt,marginBottom:"6px"}}>TABLEAU DE BORD</div>
<h1 style={{fontSize:"32px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"3px",marginBottom:"4px"}}>Bonjour 👋</h1>
<p style={{color:C.textMd,fontSize:"13px"}}>{new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</p>
</div>
<div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:"14px",marginBottom:"36px"}}>
<StatCard icon="💰" label="REVENUS" value={fmt(totalRevenue)} sub={`${paidOrders.length} commandes`}/>
<StatCard icon="🎟️" label="TICKETS" value={totalTickets} sub="tous tirages"/>
  <StatCard icon="▣" label="TIRAGES ACTIFS" value={activeDraws} sub={`${draws.length} au total`}/>
<StatCard icon="👥" label="PARTICIPANTS" value={paidOrders.length} sub="acheteurs"/>
<StatCard icon="⏳" label="EN ATTENTE" value={visibleOrders.filter(o=>o.status!=="paid").length} sub="a relancer"/></div>
<div style={{marginBottom:"36px"}}>
<a href="https://vercel.com/avianglais-7761s-projects/olawin-clean/analytics?environment=all" target="_blank" rel="noopener noreferrer" style={{...btn,display:"inline-block",background:C.card,color:C.text,border:`1px solid ${C.border}`,padding:"12px 20px",fontSize:"12px",textDecoration:"none"}}>📊 VOIR LES STATISTIQUES DU SITE</a>
</div>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"}}>
<div>
<div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt}}>TIRAGES</div>
<h2 style={{fontSize:"20px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"2px",marginTop:"4px"}}>En cours</h2>
</div>
<button onClick={()=>setShowNew(true)} style={{...btn,background:C.btnBg,color:C.btnText,padding:"10px 20px"}}>+ NOUVEAU TIRAGE</button>
</div>
{draws.length === 0 ? (
<div style={{background:C.card,border:`1px dashed ${C.border}`,borderRadius:"14px",padding:"40px",textAlign:"center",marginBottom:"36px"}}>
<div style={{fontSize:"40px",marginBottom:"12px"}}>🎰</div>
<div style={{fontSize:"15px",color:C.textMd,marginBottom:"4px"}}>Aucun tirage dans Firebase</div>
<div style={{fontSize:"12px",color:C.textLt}}>Cliquez sur "Nouveau tirage" — il apparaitra sur le site public.</div>
</div>
) : (
<div style={{display:"flex",flexDirection:"column",gap:"10px",marginBottom:"36px"}}>
{draws.slice(0,5).map(d=>{
const pct = d.totalTickets ? Math.round((d.soldTickets/d.totalTickets)*100) : 0;
return (
<div key={d.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"14px",overflow:"hidden",display:"flex"}}>
{d.image && <div style={{width:"100px",flexShrink:0,backgroundImage:`url(${d.image})`,backgroundSize:"cover",backgroundPosition:"center"}}/>}
<div style={{flex:1,padding:"18px 20px",display:"flex",alignItems:"center",gap:"20px"}}>
<div style={{flex:1}}>
<div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px",flexWrap:"wrap"}}>
<span style={{fontSize:"15px",fontWeight:"500"}}>{d.title}</span>
{d.location && <span style={{fontSize:"12px",color:C.textLt}}>· {d.location}</span>}
<Badge green={d.status==="active"} gold={d.status==="drawn"}>{(d.status||"—").toUpperCase()}</Badge>
{d.winner && <Badge gold>🏆 {d.winner.name}</Badge>}
</div>
<div style={{background:"rgba(0,0,0,0.08)",borderRadius:"2px",height:"3px",marginBottom:"6px"}}>
<div style={{width:`${pct}%`,height:"100%",background:C.btnBg,borderRadius:"2px"}}/>
</div>
<div style={{fontSize:"11px",color:C.textLt}}>{d.soldTickets||0}/{d.totalTickets||0} tickets · {pct}% · {fmt((d.soldTickets||0)*(d.ticketPrice||0))}</div>
</div>
<button onClick={()=>setEditDraw(d)} style={{...btn,background:"rgba(0,0,0,0.06)",color:C.textMd,border:`1px solid ${C.border}`,padding:"8px 14px",fontSize:"11px"}}>✏️ EDITER</button>
</div>
</div>
);
})}
</div>
)}
<div style={{marginBottom:"14px"}}>
<div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt}}>ACTIVITE</div>
<h2 style={{fontSize:"20px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"2px",marginTop:"4px"}}>Dernieres commandes</h2>
</div>
{orders.length === 0 ? (
<div style={{background:C.card,border:`1px dashed ${C.border}`,borderRadius:"14px",padding:"24px",textAlign:"center",fontSize:"13px",color:C.textMd}}>Aucune commande.</div>
) : (
<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"14px",overflow:"hidden"}}>
<table style={{width:"100%",borderCollapse:"collapse"}}>
<thead>
<tr style={{borderBottom:`1px solid ${C.border}`}}>
{["Client","Tickets","Montant","Date"].map(h=>(<th key={h} style={{padding:"13px 20px",textAlign:"left",fontSize:"9px",letterSpacing:"2px",color:C.textLt,fontWeight:"400"}}>{h}</th>))}
</tr>
</thead>
<tbody>
{orders.filter(o=>o.status==="paid").slice(0,5).map(o=>(
<tr key={o.id} className="row" style={{borderBottom:`1px solid rgba(0,0,0,0.05)`}}>
<td style={{padding:"12px 20px",fontSize:"13px",fontWeight:"500"}}>{o.firstName} {o.lastName}</td>
<td style={{padding:"12px 20px",fontSize:"13px",color:C.textMd}}>{o.tickets||0}x</td>
<td style={{padding:"12px 20px",fontSize:"13px",fontWeight:"600"}}>{fmt(o.amount)}</td>
<td style={{padding:"12px 20px",fontSize:"12px",color:C.textLt}}>{fmtD(o.createdAt)}</td>
</tr>
))}
</tbody>
</table>
</div>
)}
</div>
)}

{!loading && tab==="draws" && (
<div style={{animation:"fadeUp 0.4s ease"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:"32px"}}>
<div>
<div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt}}>GESTION</div>
<h1 style={{fontSize:"32px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"3px",marginTop:"4px"}}>Tirages</h1>
</div>
<button onClick={()=>setShowNew(true)} style={{...btn,background:C.btnBg,color:C.btnText,padding:"12px 24px"}}>+ CREER UN TIRAGE</button>
</div>
{draws.length === 0 ? (
<div style={{background:C.card,border:`1px dashed ${C.border}`,borderRadius:"14px",padding:"60px",textAlign:"center"}}>
<div style={{fontSize:"48px",marginBottom:"16px"}}>🎰</div>
<div style={{fontSize:"16px",marginBottom:"6px",fontWeight:"500"}}>Aucun tirage</div>
<div style={{fontSize:"13px",color:C.textMd,marginBottom:"20px"}}>Creez votre premier tirage — visible sur www.olawin.org</div>
<button onClick={()=>setShowNew(true)} style={{...btn,background:C.btnBg,color:C.btnText,padding:"12px 24px"}}>+ CREER UN TIRAGE</button>
</div>
) : (
<div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
{draws.map(d=>{
const pct = d.totalTickets ? Math.round((d.soldTickets/d.totalTickets)*100) : 0;
const canDraw = (d.status==="active" || d.status==="closed") && (d.soldTickets||0) > 0 && isClosedByDate(d) && !d.winner;
return (
<div key={d.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"16px",overflow:"hidden"}}>
{d.image && (
<div style={{height:"140px",backgroundImage:`url(${d.image})`,backgroundSize:"cover",backgroundPosition:"center",position:"relative"}}>
<div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.5) 100%)"}}/>
<div style={{position:"absolute",bottom:"12px",left:"20px",display:"flex",gap:"8px",alignItems:"center",flexWrap:"wrap"}}>
{d.location && <span style={{background:"rgba(255,255,255,0.2)",backdropFilter:"blur(6px)",border:"1px solid rgba(255,255,255,0.3)",borderRadius:"20px",padding:"3px 10px",fontSize:"10px",color:"#fff"}}>{d.location.toUpperCase()}</span>}
<Badge green={d.status==="active"} gold={d.status==="drawn"}>{(d.status||"—").toUpperCase()}</Badge>
</div>
</div>
)}
<div style={{padding:"24px"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"16px"}}>
<div>
<h3 style={{fontSize:"18px",fontWeight:"600",marginBottom:"4px"}}>{d.title}</h3>
<div style={{fontSize:"13px",color:C.textMd}}>{d.prize} {d.partner && `· ${d.partner}`}</div>
</div>
<div style={{display:"flex",gap:"8px"}}>
<button onClick={()=>setEditDraw(d)} style={{...btn,background:"rgba(0,0,0,0.06)",color:C.textMd,border:`1px solid ${C.border}`,padding:"9px 16px",fontSize:"11px"}}>✏️ EDITER</button>
<button onClick={()=>deleteDraw(d.id)} style={{...btn,background:"rgba(160,0,0,0.06)",color:"rgba(140,0,0,0.7)",border:"1px solid rgba(160,0,0,0.12)",padding:"9px 14px",fontSize:"11px"}}>🗑</button>
</div>
</div>
{d.winner && d.winner.name && (
<div style={{marginBottom:"16px",padding:"14px 16px",background:"linear-gradient(135deg, rgba(180,140,0,0.1), rgba(140,100,0,0.08))",border:"1px solid rgba(180,140,0,0.25)",borderRadius:"12px"}}>
<div style={{fontSize:"9px",letterSpacing:"3px",color:"rgba(140,100,0,0.8)",marginBottom:"6px"}}>🏆 GAGNANT</div>
<div style={{fontSize:"18px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"2px",color:"rgba(120,80,0,1)"}}>{d.winner.name}{d.winner.certificateUrl?(<a href={d.winner.certificateUrl} target="_blank" rel="noopener noreferrer" style={{marginLeft:"12px",fontSize:"11px",color:"rgba(140,100,0,0.9)",textDecoration:"underline"}}>🔒 Certificat</a>):null}</div>
</div>
)}
<div style={{marginBottom:"16px"}}>
<button onClick={()=>{const NL=String.fromCharCode(10);const dOrders=orders.filter(o=>o.drawId===d.id);let totalTicketsVendus=0;dOrders.forEach(o=>{totalTicketsVendus+=(o.ticketNums||[]).length;});let csv="Numero ticket,Prenom,Nom,Email"+NL;dOrders.forEach(o=>{(o.ticketNums||[]).forEach(n=>{csv+=n+',"'+(o.firstName||"")+'","'+(o.lastName||"")+'","'+(o.email||"")+'"'+NL;});});const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="participants-"+((d.title||"tirage").replace(/[^a-zA-Z0-9]/g,"-"))+".csv";document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);const recap="=== INFOS POUR RANDOMDRAWS ==="+NL+NL+"Nom du tirage : "+(d.title||"-")+NL+"Prix a gagner : "+(d.prize||"-")+NL+"Nombre de participants (entrees) : "+totalTicketsVendus+NL+"Numero le plus haut : "+totalTicketsVendus+NL+"Date du tirage : "+(d.drawDate||"-")+NL+NL+"-> Televerse le fichier CSV telecharge sur randomdraws.com"+NL+"-> Nombre d'entrees a indiquer : "+totalTicketsVendus;window.prompt("Copie ces infos pour randomdraws (Cmd+C) :", recap);notify("CSV telecharge + infos pretes");}} style={{...btn,display:"inline-block",background:"#1A1A1A",color:"#fff",padding:"11px 20px",fontSize:"12px",marginRight:"8px",border:"none",cursor:"pointer"}}>📥 EXPORTER PARTICIPANTS + INFOS</button><a href="https://www.randomdraws.com/" target="_blank" rel="noopener noreferrer" style={{...btn,display:"inline-block",background:"#25ab29",color:"#fff",padding:"11px 20px",fontSize:"12px",textDecoration:"none",marginRight:"8px"}}>🎲 LANCER LE TIRAGE (randomdraws.com)</a>
<button onClick={()=>{const name=prompt("Nom complet du gagnant (ex: Jean Dupont):");if(!name)return;const cert=prompt("URL du certificat randomdraws.com (optionnel):")||"";updateDoc(doc(db,"draws",d.id),{winner:{name:name,certificateUrl:cert,date:new Date().toISOString()},status:"drawn",drawnAt:serverTimestamp()}).then(()=>notify("🏆 Gagnant enregistre : "+name));}} style={{...btn,background:"rgba(180,140,0,0.95)",color:"#fff",padding:"11px 20px",fontSize:"12px",border:"none",cursor:"pointer"}}>🏆 ENREGISTRER LE GAGNANT</button>
<span style={{fontSize:"11px",color:C.textLt}}>Cloture: {fmtD(d.endDate)} · Tirage: {fmtD(d.drawDate)}</span>
<span style={{fontSize:"11px",color:C.textMd,fontWeight:"500"}}>{pct}% vendus</span>
</div>
</div>
</div>
);
})}
</div>
)}
</div>
)}

{!loading && tab==="orders" && (
<div style={{animation:"fadeUp 0.4s ease"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:"28px"}}>
<div>
<div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt}}>GESTION</div>
<h1 style={{fontSize:"32px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"3px",marginTop:"4px"}}>Commandes</h1>
</div>
<input placeholder="Rechercher..." value={orderSearch} onChange={e=>setOrderSearch(e.target.value)} style={{...inp,width:"220px",padding:"9px 14px"}}/>
</div>
{orders.length === 0 ? (
<div style={{background:C.card,border:`1px dashed ${C.border}`,borderRadius:"14px",padding:"60px",textAlign:"center"}}>
<div style={{fontSize:"48px",marginBottom:"16px"}}>📦</div>
<div style={{fontSize:"16px",marginBottom:"6px",fontWeight:"500"}}>Aucune commande</div>
<div style={{fontSize:"13px",color:C.textMd}}>Les ventes apparaitront ici en temps reel.</div>
</div>
) : (
<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"14px",overflow:"hidden"}}>
<table style={{width:"100%",borderCollapse:"collapse"}}>
<thead>
<tr style={{borderBottom:`1px solid ${C.border}`}}>
{["Client","Email","Téléphone","Tickets","N° tickets","Montant","Date","Action"].map(h=>(<th key={h} style={{padding:"14px 18px",textAlign:"left",fontSize:"9px",letterSpacing:"2px",color:C.textLt,fontWeight:"400"}}>{h}</th>))}</tr>
</thead>
<tbody>
{filtered.map(o=>(
<tr key={o.id} className="row" style={{borderBottom:`1px solid rgba(0,0,0,0.05)`}}>
<td style={{padding:"13px 18px",fontSize:"13px",fontWeight:"500"}}>{o.firstName} {o.lastName}</td>
<td style={{padding:"13px 18px",fontSize:"12px",color:C.textMd}}>{o.email}</td>
<td style={{padding:"13px 18px",fontSize:"12px",color:C.textMd,whiteSpace:"nowrap"}}>{o.phone||"—"}</td><td style={{padding:"13px 18px"}}>
{o.status==="paid" ? (
<span style={{background:"rgba(34,170,90,0.12)",color:"#1a8a4a",border:"1px solid rgba(34,170,90,0.3)",borderRadius:"20px",padding:"3px 10px",fontSize:"11px",fontWeight:"600",whiteSpace:"nowrap"}}>✓ Payé</span>
) : (
<span style={{background:"rgba(230,150,20,0.12)",color:"#b8780f",border:"1px solid rgba(230,150,20,0.3)",borderRadius:"20px",padding:"3px 10px",fontSize:"11px",fontWeight:"600",whiteSpace:"nowrap"}}>⏳ En attente</span>
)}
</td>
<td style={{padding:"13px 18px",fontSize:"13px",color:C.textMd}}>{o.tickets||0}x</td>
<td style={{padding:"13px 18px"}}>
<div style={{display:"flex",gap:"3px",flexWrap:"wrap",maxWidth:"180px"}}>
{(o.ticketNums||[]).slice(0,5).map(n=>(
<span key={n} style={{background:"rgba(0,0,0,0.07)",border:`1px solid ${C.border}`,borderRadius:"5px",padding:"2px 6px",fontSize:"10px",fontFamily:"'DM Mono',monospace",color:C.textMd}}>#{n}</span>
))}
{(o.ticketNums||[]).length>5 && <span style={{fontSize:"11px",color:C.textLt}}>+{(o.ticketNums||[]).length-5}</span>}
</div>
</td>
<td style={{padding:"13px 18px",fontSize:"14px",fontWeight:"600"}}>{fmt(o.amount)}</td>
<td style={{padding:"13px 18px",fontSize:"12px",color:C.textLt}}>{fmtD(o.createdAt)}</td>
<td style={{padding:"13px 18px",whiteSpace:"nowrap"}}>
{o.status!=="paid" ? (
<span>
<a href={"https://wa.me/"+((o.phone||"").replace(/[^0-9]/g,""))+"?text="+encodeURIComponent("Bonjour "+(o.firstName||"")+", votre commande Olawin n'a pas ete finalisee. Completez-la ici : https://www.olawin.org")} target="_blank" rel="noopener noreferrer" style={{textDecoration:"none",marginRight:"6px",background:"rgba(37,180,80,0.1)",color:"#1a8a4a",border:"1px solid rgba(37,180,80,0.25)",borderRadius:"7px",padding:"6px 10px",fontSize:"11px"}}>💬 WA</a>
<a href={"mailto:"+(o.email||"")+"?subject=Votre commande Olawin&body="+encodeURIComponent("Bonjour "+(o.firstName||"")+", votre commande Olawin n'a pas ete finalisee. Completez-la sur https://www.olawin.org")} style={{textDecoration:"none",marginRight:"6px",background:"rgba(0,90,180,0.08)",color:"rgba(0,70,150,0.9)",border:"1px solid rgba(0,90,180,0.2)",borderRadius:"7px",padding:"6px 10px",fontSize:"11px"}}>✉️ Mail</a>
</span>
) : null}
<button onClick={()=>deleteOrder(o.id, o.drawId, o.tickets||0)} style={{background:"rgba(160,0,0,0.06)",color:"rgba(140,0,0,0.7)",border:"1px solid rgba(160,0,0,0.12)",borderRadius:"7px",padding:"6px 10px",fontSize:"11px",cursor:"pointer"}}>🗑</button>
</td></tr>
))}
</tbody>
</table>
</div>
)}
</div>
)}

{!loading && tab==="guide" && <DrawExplanation/>}

{!loading && tab==="settings" && (
<div style={{animation:"fadeUp 0.4s ease"}}>
<div style={{marginBottom:"32px"}}>
<div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt}}>CONFIGURATION</div>
<h1 style={{fontSize:"32px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"3px",marginTop:"4px"}}>Reglages du site</h1>
<p style={{color:C.textMd,fontSize:"13px",marginTop:"6px"}}>Personnalisez le contenu et les fonctionnalites visibles sur www.olawin.org</p>
</div>

<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"16px"}}>

<button onClick={()=>setShowSocial(true)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"16px",padding:"24px",cursor:"pointer",textAlign:"left",transition:"all 0.2s",fontFamily:"'DM Sans',sans-serif"}}
onMouseEnter={e=>{e.currentTarget.style.background=C.cardAlt;}}
onMouseLeave={e=>{e.currentTarget.style.background=C.card;}}>
<div style={{display:"flex",gap:"8px",marginBottom:"14px"}}>
<div style={{width:"36px",height:"36px",borderRadius:"50%",background:"#25D366",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px"}}>💬</div>
<div style={{width:"36px",height:"36px",borderRadius:"50%",background:"linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px"}}>📷</div>
</div>
<div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt,marginBottom:"6px"}}>RESEAUX SOCIAUX</div>
<h3 style={{fontSize:"18px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"2px",marginBottom:"8px"}}>WhatsApp & Instagram</h3>
<p style={{fontSize:"12px",color:C.textMd,lineHeight:"1.6",marginBottom:"12px"}}>Bouton WhatsApp flottant + icone Instagram du footer.</p>
<div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
<Badge green={!!socialData?.whatsapp?.enabled}>WA {socialData?.whatsapp?.enabled?"✓":"—"}</Badge>
<Badge green={!!socialData?.instagram?.enabled}>IG {socialData?.instagram?.enabled?"✓":"—"}</Badge>
</div>
</button>

<button onClick={()=>setShowContent(true)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"16px",padding:"24px",cursor:"pointer",textAlign:"left",transition:"all 0.2s",fontFamily:"'DM Sans',sans-serif"}}
onMouseEnter={e=>{e.currentTarget.style.background=C.cardAlt;}}
onMouseLeave={e=>{e.currentTarget.style.background=C.card;}}>
<div style={{display:"flex",gap:"8px",marginBottom:"14px"}}>
<div style={{width:"36px",height:"36px",borderRadius:"10px",background:"rgba(0,0,0,0.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px"}}>📋</div>
<div style={{width:"36px",height:"36px",borderRadius:"10px",background:"rgba(0,0,0,0.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px"}}>❓</div>
<div style={{width:"36px",height:"36px",borderRadius:"10px",background:"rgba(0,0,0,0.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px"}}>📧</div>
</div>
<div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt,marginBottom:"6px"}}>CONTENU DU SITE</div>
<h3 style={{fontSize:"18px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"2px",marginBottom:"8px"}}>Etapes, FAQ & Footer</h3>
<p style={{fontSize:"12px",color:C.textMd,lineHeight:"1.6",marginBottom:"12px"}}>Etapes "Comment ca marche", FAQ, footer. Trilingue 🇫🇷 🇬🇧 🇪🇸.</p>
<div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
<Badge green={!!(contentData?.steps?.fr?.length || contentData?.steps?.en?.length)}>Etapes</Badge>
<Badge green={!!(contentData?.faq?.fr?.length || contentData?.faq?.en?.length)}>FAQ</Badge>
<Badge green={!!contentData?.footer?.copyright}>Footer</Badge>
</div>
</button>

<button onClick={()=>setShowCGV(true)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"16px",padding:"24px",cursor:"pointer",textAlign:"left",transition:"all 0.2s",fontFamily:"'DM Sans',sans-serif"}}
onMouseEnter={e=>{e.currentTarget.style.background=C.cardAlt;}}
onMouseLeave={e=>{e.currentTarget.style.background=C.card;}}>
<div style={{display:"flex",gap:"8px",marginBottom:"14px"}}>
<div style={{width:"36px",height:"36px",borderRadius:"10px",background:"rgba(180,140,0,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px"}}>⚖️</div>
</div>
<div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt,marginBottom:"6px"}}>MENTIONS LEGALES</div>
<h3 style={{fontSize:"18px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"2px",marginBottom:"8px"}}>CGV & Conditions</h3>
<p style={{fontSize:"12px",color:C.textMd,lineHeight:"1.6",marginBottom:"12px"}}>Collez le texte de vos CGV (trilingue) — affiche sur la page Mentions Legales.</p>
<div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
<Badge green={!!legalData?.fr}>🇫🇷 {legalData?.fr?"✓":"—"}</Badge>
<Badge green={!!legalData?.en}>🇬🇧 {legalData?.en?"✓":"—"}</Badge>
<Badge green={!!legalData?.es}>🇪🇸 {legalData?.es?"✓":"—"}</Badge>
</div>
</button>

</div>

<div style={{marginTop:"32px",padding:"20px",background:C.cardAlt,border:`1px solid ${C.border}`,borderRadius:"12px"}}>
<div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt,marginBottom:"8px"}}>💡 INFORMATION</div>
<p style={{fontSize:"13px",color:C.textMd,lineHeight:"1.6"}}>
Les modifications sont sauvegardees dans Firebase et visibles instantanement sur le site public.
Si un contenu est laisse vide, les textes par defaut du site seront utilises.
</p>
</div>
</div>
)}

</main>
</div>
);
}
