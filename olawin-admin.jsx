// ════════════════════════════════════════════════════════════
// olawin-admin.jsx — Admin connecté à Firebase Firestore
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

const fmt = (n) => `${(n||0).toLocaleString("fr-FR")}$`;
const fmtD = (d) => {
if (!d) return "—";
try {
const date = d.toDate ? d.toDate() : new Date(d);
return date.toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"});
} catch { return "—"; }
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

function Badge({children, green=false}) {
return (
<span style={{
background: green ? "rgba(0,120,60,0.1)" : "rgba(0,0,0,0.07)",
border: `1px solid ${green ? "rgba(0,120,60,0.2)" : "rgba(0,0,0,0.12)"}`,
borderRadius:"20px", padding:"3px 10px",
fontSize:"10px", letterSpacing:"1px",
color: green ? "rgba(0,100,50,0.9)" : C.textMd,
}}>{children}</span>
);
}

const PHOTOS = {
"dubai": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80",
"dubaï": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80",
"paris": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80",
"maldives": "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1200&q=80",
"bali": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&q=80",
"new york": "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=1200&q=80",
"tokyo": "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&q=80",
"rome": "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&q=80",
"miami": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80",
"santorini": "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1200&q=80",
"londres": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200&q=80",
"marrakech": "https://images.unsplash.com/photo-1597212618440-806262de4f8b?w=1200&q=80",
"tel aviv": "https://images.unsplash.com/photo-1544986581-efac024faf62?w=1200&q=80",
"monaco": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80",
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
<div style={{display:"flex",gap:"8px"}}>
<input type="text" placeholder="https://..." value={urlInput} onChange={e=>setUrlInput(e.target.value)} style={{...inp,flex:1,fontSize:"13px"}}/>
<button onClick={()=>set("image",urlInput)} style={{...btn,padding:"11px 18px",background:C.btnBg,color:C.btnText,fontSize:"12px"}}>Appliquer</button>
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
{k:"title",l:"NOM DU TIRAGE",t:"text",ph:"Séjour Prestige..."},
{k:"location",l:"DESTINATION",t:"text",ph:"Dubaï..."},
{k:"country",l:"PAYS (emoji 🇦🇪)",t:"text",ph:"🇦🇪"},
{k:"prize",l:"PRIX À GAGNER",t:"text",ph:"Bon hôtel 10 000$"},
{k:"partner",l:"PARTENAIRE",t:"text",ph:"PrivateHonors.com"},
{k:"emoji",l:"EMOJI",t:"text",ph:"🏝️"},
{k:"ticketPrice",l:"PRIX TICKET ($)",t:"number",ph:"100"},
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
}} style={inp}/>
</div>
))}
</div>
<div style={{marginTop:"12px"}}>
<div style={{fontSize:"9px",letterSpacing:"2px",color:C.textLt,marginBottom:"6px"}}>DESCRIPTION</div>
<textarea placeholder="Description..." value={f.description||""} onChange={e=>set("description",e.target.value)} rows={3} style={{...inp,resize:"vertical"}}/>
</div>
<div style={{marginTop:"12px"}}>
<div style={{fontSize:"9px",letterSpacing:"2px",color:C.textLt,marginBottom:"6px"}}>DÉGRADÉ (CSS)</div>
<input type="text" placeholder="linear-gradient(135deg, #1a1a1a, #444)" value={f.gradient||""} onChange={e=>set("gradient",e.target.value)} style={inp}/>
</div>
</div>
<div style={{marginBottom:"20px"}}>
<div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt,marginBottom:"12px"}}>LIENS STRIPE</div>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
{[1,3,5,10,15,25,50].map(n => (
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
<div style={{fontSize:"11px",color:C.textLt}}>Bouton flottant en bas à droite du site</div>
</div>
</div>
<label style={{display:"flex",alignItems:"center",gap:"8px",cursor:"pointer"}}>
<input type="checkbox" checked={!!f.whatsapp?.enabled} onChange={e=>setWA("enabled", e.target.checked)} style={{width:"18px",height:"18px",cursor:"pointer"}}/>
<span style={{fontSize:"12px",fontWeight:"600",color:f.whatsapp?.enabled?"rgba(0,100,50,0.9)":C.textLt}}>{f.whatsapp?.enabled?"ACTIVÉ":"DÉSACTIVÉ"}</span>
</label>
</div>
<div style={{marginBottom:"12px"}}>
<div style={{fontSize:"9px",letterSpacing:"2px",color:C.textLt,marginBottom:"6px"}}>NUMÉRO (format international, ex: +33612345678)</div>
<input type="tel" placeholder="+33612345678" value={f.whatsapp?.phone||""} onChange={e=>setWA("phone", e.target.value)} style={inp}/>
</div>
<div>
<div style={{fontSize:"9px",letterSpacing:"2px",color:C.textLt,marginBottom:"6px"}}>MESSAGE PRÉ-REMPLI</div>
<textarea placeholder="Bonjour, j'ai une question sur Olawin..." value={f.whatsapp?.message||""} onChange={e=>setWA("message", e.target.value)} rows={2} style={{...inp,resize:"vertical"}}/>
</div>
</div>

<div style={{marginBottom:"28px",padding:"20px",background:C.cardAlt,border:`1px solid ${C.border}`,borderRadius:"14px"}}>
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px"}}>
<div style={{display:"flex",alignItems:"center",gap:"10px"}}>
<div style={{width:"32px",height:"32px",borderRadius:"50%",background:"linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px"}}>📷</div>
<div>
<div style={{fontSize:"15px",fontWeight:"600"}}>Instagram</div>
<div style={{fontSize:"11px",color:C.textLt}}>Icône dans le footer du site</div>
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
{[{id:"steps",label:"📋 Étapes (Comment ça marche)"},{id:"faq",label:"❓ FAQ"},{id:"footer",label:"📧 Footer"}].map(s=>(
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
4 étapes affichées dans la section "Comment ça marche" du site. Remplissez chaque étape pour la langue sélectionnée.
</div>
{steps4.map((step, i) => (
<div key={i} style={{marginBottom:"14px",padding:"14px",background:C.cardAlt,border:`1px solid ${C.border}`,borderRadius:"10px"}}>
<div style={{fontSize:"9px",letterSpacing:"2px",color:C.textLt,marginBottom:"10px"}}>ÉTAPE 0{i+1}</div>
<input type="text" placeholder="Titre (ex: Choisissez)" value={step.title||""} onChange={e=>updateStep(i,"title",e.target.value)} style={{...inp,marginBottom:"8px"}}/>
<textarea placeholder="Description courte de l'étape" value={step.desc||""} onChange={e=>updateStep(i,"desc",e.target.value)} rows={2} style={{...inp,resize:"vertical",fontSize:"13px"}}/>
</div>
))}
</div>
)}

{section === "faq" && (
<div>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
<div style={{fontSize:"11px",color:C.textMd,lineHeight:"1.6"}}>
Questions/réponses pour la langue sélectionnée. Ajoutez-en autant que vous voulez.
</div>
<button onClick={addFaq} style={{...btn,padding:"8px 14px",fontSize:"11px",background:C.btnBg,color:C.btnText}}>+ AJOUTER</button>
</div>
{currentFaq.length === 0 ? (
<div style={{padding:"30px",textAlign:"center",background:C.cardAlt,border:`1px dashed ${C.border}`,borderRadius:"10px",fontSize:"13px",color:C.textMd}}>
Aucune question. Cliquez sur "+ AJOUTER" pour commencer.
</div>
) : currentFaq.map((item, i) => (
<div key={i} style={{marginBottom:"14px",padding:"14px",background:C.cardAlt,border:`1px solid ${C.border}`,borderRadius:"10px",position:"relative"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
<div style={{fontSize:"9px",letterSpacing:"2px",color:C.textLt}}>QUESTION #{i+1}</div>
<button onClick={()=>removeFaq(i)} style={{...btn,padding:"4px 10px",fontSize:"10px",background:"rgba(160,0,0,0.08)",color:"rgba(140,0,0,0.7)",border:"1px solid rgba(160,0,0,0.15)"}}>🗑 SUPPRIMER</button>
</div>
<input type="text" placeholder="Question" value={item.q||""} onChange={e=>updateFaq(i,"q",e.target.value)} style={{...inp,marginBottom:"8px"}}/>
<textarea placeholder="Réponse" value={item.a||""} onChange={e=>updateFaq(i,"a",e.target.value)} rows={3} style={{...inp,resize:"vertical",fontSize:"13px"}}/>
</div>
))}
</div>
)}

{section === "footer" && (
<div>
<div style={{fontSize:"11px",color:C.textMd,marginBottom:"16px",lineHeight:"1.6"}}>
Informations affichées dans le footer du site (en bas de chaque page).
</div>
<div style={{marginBottom:"14px"}}>
<div style={{fontSize:"9px",letterSpacing:"2px",color:C.textLt,marginBottom:"6px"}}>TEXTE COPYRIGHT</div>
<input type="text" placeholder="2026 Olawin. Tous droits réservés." value={f.footer?.copyright||""} onChange={e=>setFooter("copyright", e.target.value)} style={inp}/>
</div>
<div>
<div style={{fontSize:"9px",letterSpacing:"2px",color:C.textLt,marginBottom:"6px"}}>EMAIL DE CONTACT (lien "CONTACT" du footer)</div>
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
const [notif, setNotif] = useState(null);
const [orderSearch, setOrderSearch] = useState("");
const [showSocial, setShowSocial] = useState(false);
const [showContent, setShowContent] = useState(false);
const [socialData, setSocialData] = useState(null);
const [contentData, setContentData] = useState(null);

const notify = (msg, type="ok") => { setNotif({msg,type}); setTimeout(()=>setNotif(null),3000); };

useEffect(() => {
if (!authed) return;
const qDraws = query(collection(db,"draws"), orderBy("createdAt","desc"));
const unsubD = onSnapshot(qDraws, (snap) => {
setDraws(snap.docs.map(d => ({ id: d.id, ...d.data() })));
setLoading(false);
}, (err) => {
console.error("Firebase draws error:", err);
setLoading(false);
notify("Erreur Firebase","err");
});
const qOrders = query(collection(db,"orders"), orderBy("createdAt","desc"));
const unsubO = onSnapshot(qOrders, (snap) => {
setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
});
getDoc(doc(db,"settings","social")).then(snap => {
if (snap.exists()) setSocialData(snap.data());
}).catch(err => console.error("Social load:", err));
getDoc(doc(db,"settings","content")).then(snap => {
if (snap.exists()) setContentData(snap.data());
}).catch(err => console.error("Content load:", err));
return () => { unsubD(); unsubO(); };
}, [authed]);

const saveDraw = async (d) => {
const { id, ...payload } = d;
if (!payload.createdAt) payload.createdAt = serverTimestamp();
payload.updatedAt = serverTimestamp();
if (!payload.soldTickets) payload.soldTickets = 0;
await updateDoc(doc(db,"draws",id), payload);
setEditDraw(null);
notify("Tirage mis à jour ✓");
};

const createDraw = async (d) => {
const payload = { ...d, soldTickets: 0, winner: null, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
await addDoc(collection(db,"draws"), payload);
setShowNew(false);
notify("Tirage créé ✓ — visible sur le site");
};

const deleteDraw = async (id) => {
if (!window.confirm("Supprimer ce tirage ?")) return;
try {
await deleteDoc(doc(db,"draws",id));
notify("Supprimé","err");
} catch (err) {
notify("Erreur","err");
}
};

const saveSocial = async (data) => {
await setDoc(doc(db,"settings","social"), data);
setSocialData(data);
setShowSocial(false);
notify("Réseaux sociaux mis à jour ✓");
};

const saveContent = async (data) => {
await setDoc(doc(db,"settings","content"), data);
setContentData(data);
setShowContent(false);
notify("Contenu du site mis à jour ✓");
};

const totalRevenue = orders.reduce((s,o)=>s+(o.amount||0),0);
const totalTickets = orders.reduce((s,o)=>s+(o.tickets||0),0);
const activeDraws = draws.filter(d=>d.status==="active").length;
const filtered = orders.filter(o=>{
const s = orderSearch.toLowerCase();
return (o.firstName||"").toLowerCase().includes(s) ||
(o.lastName||"").toLowerCase().includes(s) ||
(o.email||"").toLowerCase().includes(s);
});

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&family=DM+Mono&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
input::placeholder{color:rgba(0,0,0,0.25);}
input:focus{outline:none;border-color:rgba(0,0,0,0.4);}
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
<div style={{textAlign:"center",marginTop:"16px",fontSize:"11px",color:C.textLt}}>Connecté à Firebase · olawin-99639</div>
</div>
</div>
);

return (
<div style={{background:C.bg,minHeight:"100vh",color:C.text,fontFamily:"'DM Sans',sans-serif",display:"grid",gridTemplateColumns:"220px 1fr"}}>
<style>{CSS}</style>
{editDraw && <DrawModal draw={editDraw} onSave={saveDraw} onClose={()=>setEditDraw(null)}/>}
{showNew && <DrawModal draw={{title:"",location:"",country:"",prize:"",partner:"PrivateHonors.com",emoji:"🏝️",ticketPrice:100,totalTickets:200,soldTickets:0,endDate:"",drawDate:"",status:"active",image:"",description:"",gradient:"",stripeLinks:{}}} onSave={createDraw} onClose={()=>setShowNew(false)} isNew/>}
{showSocial && <SocialModal initial={socialData} onSave={saveSocial} onClose={()=>setShowSocial(false)}/>}
{showContent && <ContentModal initial={contentData} onSave={saveContent} onClose={()=>setShowContent(false)}/>}
{notif && (
<div style={{position:"fixed",top:"20px",right:"20px",zIndex:300,background:notif.type==="err"?"#8B0000":C.btnBg,color:C.btnText,borderRadius:"10px",padding:"13px 20px",fontSize:"13px",fontWeight:"600",animation:"slideIn 0.3s ease",maxWidth:"400px"}}>{notif.msg}</div>
)}

<aside style={{background:C.sidebar,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh"}}>
<div style={{padding:"28px 24px 20px",borderBottom:`1px solid ${C.border}`}}>
<Logo size={26}/>
<div style={{fontSize:"9px",letterSpacing:"2px",color:C.textLt,marginTop:"6px"}}>ADMIN PANEL · LIVE</div>
</div>
<nav style={{padding:"20px 14px",flex:1}}>
{[{id:"dashboard",icon:"◈",label:"Dashboard"},{id:"draws",icon:"▣",label:"Tirages"},{id:"orders",icon:"≡",label:"Commandes"},{id:"settings",icon:"⚙",label:"Réglages"}].map(item=>(
<button key={item.id} onClick={()=>setTab(item.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:"10px",padding:"10px 12px",borderRadius:"8px",border:"none",background:tab===item.id?"rgba(0,0,0,0.08)":"transparent",color:tab===item.id?C.text:C.textLt,fontSize:"13px",cursor:"pointer",marginBottom:"3px",borderLeft:`2px solid ${tab===item.id?C.text:"transparent"}`,textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
<span style={{fontSize:"15px"}}>{item.icon}</span>{item.label}
</button>
))}
</nav>
<div style={{padding:"16px",borderTop:`1px solid ${C.border}`}}>
<div style={{fontSize:"9px",letterSpacing:"1.5px",color:C.textLt,marginBottom:"8px",textAlign:"center"}}>🟢 SYNCHRO FIREBASE</div>
<button onClick={()=>setAuthed(false)} style={{...btn,width:"100%",padding:"10px",background:"rgba(0,0,0,0.05)",color:C.textMd,border:`1px solid ${C.border}`,fontSize:"11px"}}>DÉCONNEXION</button>
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
<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"14px",marginBottom:"36px"}}>
<StatCard icon="💰" label="REVENUS" value={fmt(totalRevenue)} sub={`${orders.length} commandes`}/>
<StatCard icon="🎟️" label="TICKETS" value={totalTickets} sub="tous tirages"/>
<StatCard icon="▣" label="TIRAGES ACTIFS" value={activeDraws} sub={`${draws.length} au total`}/>
<StatCard icon="👥" label="PARTICIPANTS" value={orders.length} sub="acheteurs"/>
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
<div style={{fontSize:"12px",color:C.textLt}}>Cliquez sur "Nouveau tirage" — il apparaîtra sur le site public.</div>
</div>
) : (
<div style={{display:"flex",flexDirection:"column",gap:"10px",marginBottom:"36px"}}>
{draws.map(d=>{
const pct = d.totalTickets ? Math.round((d.soldTickets/d.totalTickets)*100) : 0;
return (
<div key={d.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"14px",overflow:"hidden",display:"flex"}}>
{d.image && <div style={{width:"100px",flexShrink:0,backgroundImage:`url(${d.image})`,backgroundSize:"cover",backgroundPosition:"center"}}/>}
<div style={{flex:1,padding:"18px 20px",display:"flex",alignItems:"center",gap:"20px"}}>
<div style={{flex:1}}>
<div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px"}}>
<span style={{fontSize:"15px",fontWeight:"500"}}>{d.title}</span>
{d.location && <span style={{fontSize:"12px",color:C.textLt}}>· {d.location}</span>}
<Badge green={d.status==="active"}>{(d.status||"—").toUpperCase()}</Badge>
</div>
<div style={{background:"rgba(0,0,0,0.08)",borderRadius:"2px",height:"3px",marginBottom:"6px"}}>
<div style={{width:`${pct}%`,height:"100%",background:C.btnBg,borderRadius:"2px"}}/>
</div>
<div style={{fontSize:"11px",color:C.textLt}}>{d.soldTickets||0}/{d.totalTickets||0} tickets · {pct}% · {fmt((d.soldTickets||0)*(d.ticketPrice||0))}</div>
</div>
  <button onClick={()=>setEditDraw(d)} style={{...btn,background:"rgba(0,0,0,0.06)",color:C.textMd,border:`1px solid ${C.border}`,padding:"8px 14px",fontSize:"11px"}}>✏️ ÉDITER</button>
</div>
</div>
);
})}
</div>
)}
<div style={{marginBottom:"14px"}}>
<div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt}}>ACTIVITÉ</div>
<h2 style={{fontSize:"20px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"2px",marginTop:"4px"}}>Dernières commandes</h2>
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
{orders.slice(0,5).map(o=>(
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
<button onClick={()=>setShowNew(true)} style={{...btn,background:C.btnBg,color:C.btnText,padding:"12px 24px"}}>+ CRÉER UN TIRAGE</button>
</div>
{draws.length === 0 ? (
<div style={{background:C.card,border:`1px dashed ${C.border}`,borderRadius:"14px",padding:"60px",textAlign:"center"}}>
<div style={{fontSize:"48px",marginBottom:"16px"}}>🎰</div>
<div style={{fontSize:"16px",marginBottom:"6px",fontWeight:"500"}}>Aucun tirage</div>
<div style={{fontSize:"13px",color:C.textMd,marginBottom:"20px"}}>Créez votre premier tirage — visible sur www.olawin.org</div>
<button onClick={()=>setShowNew(true)} style={{...btn,background:C.btnBg,color:C.btnText,padding:"12px 24px"}}>+ CRÉER UN TIRAGE</button>
</div>
) : (
<div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
{draws.map(d=>{
const pct = d.totalTickets ? Math.round((d.soldTickets/d.totalTickets)*100) : 0;
return (
<div key={d.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"16px",overflow:"hidden"}}>
{d.image && (
<div style={{height:"140px",backgroundImage:`url(${d.image})`,backgroundSize:"cover",backgroundPosition:"center",position:"relative"}}>
<div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.5) 100%)"}}/>
<div style={{position:"absolute",bottom:"12px",left:"20px",display:"flex",gap:"8px",alignItems:"center"}}>
{d.location && <span style={{background:"rgba(255,255,255,0.2)",backdropFilter:"blur(6px)",border:"1px solid rgba(255,255,255,0.3)",borderRadius:"20px",padding:"3px 10px",fontSize:"10px",color:"#fff"}}>{d.location.toUpperCase()}</span>}
<Badge green={d.status==="active"}>{(d.status||"—").toUpperCase()}</Badge>
</div>
</div>
)}
<div style={{padding:"24px"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"20px"}}>
<div>
<h3 style={{fontSize:"18px",fontWeight:"600",marginBottom:"4px"}}>{d.title}</h3>
<div style={{fontSize:"13px",color:C.textMd}}>{d.prize} {d.partner && `· ${d.partner}`}</div>
</div>
<div style={{display:"flex",gap:"8px"}}>
<button onClick={()=>setEditDraw(d)} style={{...btn,background:"rgba(0,0,0,0.06)",color:C.textMd,border:`1px solid ${C.border}`,padding:"9px 16px",fontSize:"11px"}}>✏️ ÉDITER</button>
<button onClick={()=>deleteDraw(d.id)} style={{...btn,background:"rgba(160,0,0,0.06)",color:"rgba(140,0,0,0.7)",border:"1px solid rgba(160,0,0,0.12)",padding:"9px 14px",fontSize:"11px"}}>🗑</button>
</div>
</div>
<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"12px",marginBottom:"16px"}}>
{[{l:"PRIX",v:fmt(d.ticketPrice)},{l:"VENDUS",v:`${d.soldTickets||0}/${d.totalTickets||0}`},{l:"REVENUS",v:fmt((d.soldTickets||0)*(d.ticketPrice||0))},{l:"COMMANDES",v:orders.filter(o=>o.drawId===d.id).length}].map((s,i)=>(
<div key={i} style={{background:C.cardAlt,border:`1px solid ${C.border}`,borderRadius:"10px",padding:"14px"}}>
<div style={{fontSize:"9px",letterSpacing:"2px",color:C.textLt,marginBottom:"5px"}}>{s.l}</div>
<div style={{fontSize:"20px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"1px"}}>{s.v}</div>
</div>
))}
</div>
<div style={{background:"rgba(0,0,0,0.08)",borderRadius:"3px",height:"4px"}}>
<div style={{width:`${pct}%`,height:"100%",background:C.btnBg,borderRadius:"3px"}}/>
</div>
<div style={{display:"flex",justifyContent:"space-between",marginTop:"6px"}}>
<span style={{fontSize:"11px",color:C.textLt}}>Clôture: {fmtD(d.endDate)} · Tirage: {fmtD(d.drawDate)}</span>
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
<div style={{fontSize:"13px",color:C.textMd}}>Les ventes apparaîtront ici en temps réel.</div>
</div>
) : (
<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"14px",overflow:"hidden"}}>
<table style={{width:"100%",borderCollapse:"collapse"}}>
<thead>
<tr style={{borderBottom:`1px solid ${C.border}`}}>
{["Client","Email","Tickets","Montant","Date"].map(h=>(<th key={h} style={{padding:"14px 18px",textAlign:"left",fontSize:"9px",letterSpacing:"2px",color:C.textLt,fontWeight:"400"}}>{h}</th>))}
</tr>
</thead>
<tbody>
{filtered.map(o=>(
<tr key={o.id} className="row" style={{borderBottom:`1px solid rgba(0,0,0,0.05)`}}>
<td style={{padding:"13px 18px",fontSize:"13px",fontWeight:"500"}}>{o.firstName} {o.lastName}</td>
<td style={{padding:"13px 18px",fontSize:"12px",color:C.textMd}}>{o.email}</td>
<td style={{padding:"13px 18px",fontSize:"13px",color:C.textMd}}>{o.tickets||0}x</td>
<td style={{padding:"13px 18px",fontSize:"14px",fontWeight:"600"}}>{fmt(o.amount)}</td>
<td style={{padding:"13px 18px",fontSize:"12px",color:C.textLt}}>{fmtD(o.createdAt)}</td>
</tr>
))}
</tbody>
</table>
</div>
)}
</div>
)}

{!loading && tab==="settings" && (
<div style={{animation:"fadeUp 0.4s ease"}}>
<div style={{marginBottom:"32px"}}>
<div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt}}>CONFIGURATION</div>
<h1 style={{fontSize:"32px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"3px",marginTop:"4px"}}>Réglages du site</h1>
<p style={{color:C.textMd,fontSize:"13px",marginTop:"6px"}}>Personnalisez le contenu et les fonctionnalités visibles sur www.olawin.org</p>
</div>

<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px"}}>

<button onClick={()=>setShowSocial(true)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"16px",padding:"28px",cursor:"pointer",textAlign:"left",transition:"all 0.2s",fontFamily:"'DM Sans',sans-serif"}}
onMouseEnter={e=>{e.currentTarget.style.background=C.cardAlt;e.currentTarget.style.transform="translateY(-2px)";}}
onMouseLeave={e=>{e.currentTarget.style.background=C.card;e.currentTarget.style.transform="translateY(0)";}}>
<div style={{display:"flex",gap:"12px",marginBottom:"16px"}}>
<div style={{width:"40px",height:"40px",borderRadius:"50%",background:"#25D366",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px"}}>💬</div>
<div style={{width:"40px",height:"40px",borderRadius:"50%",background:"linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px"}}>📷</div>
</div>
<div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt,marginBottom:"6px"}}>RÉSEAUX SOCIAUX</div>
<h3 style={{fontSize:"20px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"2px",marginBottom:"8px"}}>WhatsApp & Instagram</h3>
<p style={{fontSize:"13px",color:C.textMd,lineHeight:"1.6",marginBottom:"16px"}}>Activez le bouton WhatsApp flottant et l'icône Instagram du footer. Configurez le numéro et le nom d'utilisateur.</p>
<div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
<Badge green={!!socialData?.whatsapp?.enabled}>WhatsApp {socialData?.whatsapp?.enabled?"✓ ACTIF":"INACTIF"}</Badge>
<Badge green={!!socialData?.instagram?.enabled}>Instagram {socialData?.instagram?.enabled?"✓ ACTIF":"INACTIF"}</Badge>
</div>
</button>

<button onClick={()=>setShowContent(true)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"16px",padding:"28px",cursor:"pointer",textAlign:"left",transition:"all 0.2s",fontFamily:"'DM Sans',sans-serif"}}
onMouseEnter={e=>{e.currentTarget.style.background=C.cardAlt;e.currentTarget.style.transform="translateY(-2px)";}}
onMouseLeave={e=>{e.currentTarget.style.background=C.card;e.currentTarget.style.transform="translateY(0)";}}>
<div style={{display:"flex",gap:"12px",marginBottom:"16px"}}>
<div style={{width:"40px",height:"40px",borderRadius:"10px",background:"rgba(0,0,0,0.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px"}}>📋</div>
<div style={{width:"40px",height:"40px",borderRadius:"10px",background:"rgba(0,0,0,0.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px"}}>❓</div>
<div style={{width:"40px",height:"40px",borderRadius:"10px",background:"rgba(0,0,0,0.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px"}}>📧</div>
</div>
<div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt,marginBottom:"6px"}}>CONTENU DU SITE</div>
<h3 style={{fontSize:"20px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"2px",marginBottom:"8px"}}>Étapes, FAQ & Footer</h3>
<p style={{fontSize:"13px",color:C.textMd,lineHeight:"1.6",marginBottom:"16px"}}>Modifiez les 4 étapes "Comment ça marche", la liste des questions FAQ, et le texte du footer. Trilingue 🇫🇷 🇬🇧 🇪🇸.</p>
<div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
<Badge green={!!(contentData?.steps?.fr?.length || contentData?.steps?.en?.length)}>Étapes {(contentData?.steps?.fr?.length||contentData?.steps?.en?.length)?"✓":"par défaut"}</Badge>
<Badge green={!!(contentData?.faq?.fr?.length || contentData?.faq?.en?.length)}>FAQ {(contentData?.faq?.fr?.length||contentData?.faq?.en?.length)?"✓":"par défaut"}</Badge>
<Badge green={!!contentData?.footer?.copyright}>Footer {contentData?.footer?.copyright?"✓":"par défaut"}</Badge>
</div>
</button>

</div>

<div style={{marginTop:"32px",padding:"20px",background:C.cardAlt,border:`1px solid ${C.border}`,borderRadius:"12px"}}>
<div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt,marginBottom:"8px"}}>💡 INFORMATION</div>
<p style={{fontSize:"13px",color:C.textMd,lineHeight:"1.6"}}>
Les modifications sont sauvegardées dans Firebase et visibles instantanément sur le site public.
Si un contenu est laissé vide, les textes par défaut du site seront utilisés.
</p>
</div>
</div>
)}

</main>
</div>
);
}
