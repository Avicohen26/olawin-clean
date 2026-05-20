// olawin-admin.jsx - Admin v2
import { useState, useEffect, useRef } from "react";
import { db } from "./firebase";
import {
  collection, onSnapshot, query, orderBy,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDoc, setDoc,
} from "firebase/firestore";
import { sendTicketConfirmation, sendWinnerEmail } from "./emails";

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

function fmtMoney(n) { return ((n||0).toLocaleString("fr-FR")) + "$"; }
function fmtD(d) {
  if (!d) return "-";
  try {
    const date = d.toDate ? d.toDate() : new Date(d);
    return date.toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"});
  } catch(e) { return "-"; }
}
function fmtDFull(d) {
  if (!d) return "-";
  try {
    const date = d.toDate ? d.toDate() : new Date(d);
    return date.toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"}) + " a " + date.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});
  } catch(e) { return "-"; }
}

const INP = {
  width:"100%", padding:"11px 14px",
  background:"rgba(0,0,0,0.04)", border:"1px solid rgba(0,0,0,0.12)",
  borderRadius:"9px", color:C.text, fontSize:"14px", fontFamily:"DM Sans, sans-serif",
  outline:"none", boxSizing:"border-box",
};
const BTN = {
  padding:"10px 20px", borderRadius:"9px", border:"none",
  fontSize:"12px", fontWeight:"700", letterSpacing:"1.5px",
  cursor:"pointer", fontFamily:"DM Sans, sans-serif",
};

const PHOTOS = {
  "dubai": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1600&q=85",
  "dubai marina": "https://images.unsplash.com/photo-1582672060674-bc2bd808a8f5?w=1600&q=85",
  "abu dhabi": "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1600&q=85",
  "paris": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1600&q=85",
  "paris eiffel": "https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=1600&q=85",
  "paris louvre": "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1600&q=85",
  "maldives": "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1600&q=85",
  "maldives villa": "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1600&q=85",
  "bali": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1600&q=85",
  "bali rizieres": "https://images.unsplash.com/photo-1604999333679-b86d54738315?w=1600&q=85",
  "new york": "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=1600&q=85",
  "new york skyline": "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1600&q=85",
  "tokyo": "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1600&q=85",
  "tokyo shibuya": "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=1600&q=85",
  "kyoto": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1600&q=85",
  "rome": "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1600&q=85",
  "rome colisee": "https://images.unsplash.com/photo-1552432552-06c0b0a94dda?w=1600&q=85",
  "venise": "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=1600&q=85",
  "florence": "https://images.unsplash.com/photo-1543429776-2782fc8e1acd?w=1600&q=85",
  "miami": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=85",
  "miami beach": "https://images.unsplash.com/photo-1513415564515-763d91423bdc?w=1600&q=85",
  "los angeles": "https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=1600&q=85",
  "santorini": "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1600&q=85",
  "mykonos": "https://images.unsplash.com/photo-1601581875309-fafbf2d3ed3a?w=1600&q=85",
  "londres": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1600&q=85",
  "londres big ben": "https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=1600&q=85",
  "marrakech": "https://images.unsplash.com/photo-1597212618440-806262de4f8b?w=1600&q=85",
  "tel aviv": "https://images.unsplash.com/photo-1544986581-efac024faf62?w=1600&q=85",
  "monaco": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=85",
  "saint tropez": "https://images.unsplash.com/photo-1591129841117-3adfd313a592?w=1600&q=85",
  "nice": "https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=1600&q=85",
  "cannes": "https://images.unsplash.com/photo-1597209891376-cfc9d4ee4bcd?w=1600&q=85",
  "barcelone": "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1600&q=85",
  "madrid": "https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=1600&q=85",
  "ibiza": "https://images.unsplash.com/photo-1531123414780-f74242c2b052?w=1600&q=85",
  "lisbonne": "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1600&q=85",
  "amsterdam": "https://images.unsplash.com/photo-1534351590666-13e3e96c5017?w=1600&q=85",
  "prague": "https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=1600&q=85",
  "vienne": "https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=1600&q=85",
  "berlin": "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=1600&q=85",
  "istanbul": "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=1600&q=85",
  "bora bora": "https://images.unsplash.com/photo-1559128010-7c1ad6e1e85e?w=1600&q=85",
  "seychelles": "https://images.unsplash.com/photo-1589197331516-4d84b72ebde3?w=1600&q=85",
  "ile maurice": "https://images.unsplash.com/photo-1544550581-5f7ceaf7f3ed?w=1600&q=85",
  "thailande": "https://images.unsplash.com/photo-1528181304800-259b08848526?w=1600&q=85",
  "phuket": "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=1600&q=85",
  "singapour": "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1600&q=85",
  "hong kong": "https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=1600&q=85",
  "las vegas": "https://images.unsplash.com/photo-1581351721010-8cf859cb14a4?w=1600&q=85",
  "rio": "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=1600&q=85"
};

function getPhoto(loc) {
  if (!loc) return null;
  const k = loc.toLowerCase().trim();
  if (PHOTOS[k]) return PHOTOS[k];
  for (const key of Object.keys(PHOTOS)) {
    if (k.includes(key) || key.includes(k)) return PHOTOS[key];
  }
  return null;
}

function normalizeUrl(url) {
  if (!url) return "";
  url = url.trim();
  if (url.includes("google.com/imgres") || url.includes("google.com/url")) {
    const match = url.match(/[?&]imgurl=([^&]+)/) || url.match(/[?&]url=([^&]+)/);
    if (match) return decodeURIComponent(match[1]);
  }
  if (url.startsWith("//")) return "https:" + url;
  return url;
}

function Logo(props) {
  const size = props.size || 28;
  return (
    <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <polygon points="20,2 38,20 20,38 2,20" fill="none" stroke={C.text} strokeWidth="1.5"></polygon>
        <circle cx="20" cy="20" r="7" fill="none" stroke={C.text} strokeWidth="1.5"></circle>
        <circle cx="20" cy="6" r="1.5" fill={C.text}></circle>
        <circle cx="34" cy="20" r="1.5" fill={C.text}></circle>
        <circle cx="20" cy="34" r="1.5" fill={C.text}></circle>
        <circle cx="6" cy="20" r="1.5" fill={C.text}></circle>
      </svg>
      <span style={{fontSize:size*0.6,letterSpacing:"5px",fontFamily:"Montserrat, sans-serif",color:C.text,lineHeight:1,fontWeight:"500"}}>OLAWIN</span>
    </div>
  );
}

function StatCard(props) {
  return (
    <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:"14px",padding:"24px"}}>
      <div style={{fontSize:"28px",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"2px",marginBottom:"3px"}}>{props.value}</div>
      <div style={{fontSize:"9px",letterSpacing:"2px",color:C.textLt}}>{props.label}</div>
      {props.sub ? <div style={{fontSize:"11px",color:C.textMd,marginTop:"5px"}}>{props.sub}</div> : null}
    </div>
  );
}

function Badge(props) {
  const color = props.color || "gray";
  const colors = {
    gray: { bg: "rgba(0,0,0,0.07)", border: "rgba(0,0,0,0.12)", text: C.textMd },
    green: { bg: "rgba(0,120,60,0.1)", border: "rgba(0,120,60,0.2)", text: "rgba(0,100,50,0.9)" },
    red: { bg: "rgba(180,30,30,0.08)", border: "rgba(180,30,30,0.2)", text: "rgba(150,20,20,0.9)" },
    gold: { bg: "rgba(200,140,30,0.12)", border: "rgba(200,140,30,0.3)", text: "rgba(150,100,20,0.95)" }
  };
  const c = colors[color] || colors.gray;
  return (
    <span style={{
      background: c.bg, border: "1px solid " + c.border,
      borderRadius:"20px", padding:"3px 10px",
      fontSize:"10px", letterSpacing:"1px", color: c.text, fontWeight:"600"
    }}>{props.children}</span>
  );
}

function DrawModal(props) {
  const draw = props.draw;
  const onSave = props.onSave;
  const onClose = props.onClose;
  const isNew = props.isNew;
  const [f, setF] = useState(Object.assign({}, draw, {image: draw.image || ""}));
  const [imgTab, setImgTab] = useState("upload");
  const [urlInput, setUrlInput] = useState(draw.image || "");
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  const set = function(k, v) { setF(function(p) { return Object.assign({}, p, { [k]: v }); }); };

  const handleFile = function(file) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = function(e) { set("image", e.target.result); };
    reader.readAsDataURL(file);
  };

  const handleSave = async function() {
    setSaving(true);
    try { await onSave(f); }
    catch (err) { alert("Erreur Firebase: " + err.message); }
    finally { setSaving(false); }
  };

  const handleUrlApply = function() { set("image", normalizeUrl(urlInput)); };
  const suggestedPhoto = getPhoto(f.location || f.title);

  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.4)",backdropFilter:"blur(10px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"16px",overflowY:"auto"}}>
      <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:"20px",width:"100%",maxWidth:"720px",maxHeight:"95vh",overflowY:"auto"}}>
        <div style={{padding:"28px 32px 0",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"24px"}}>
          <div>
            <div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt,marginBottom:"4px"}}>{isNew?"NOUVEAU TIRAGE":"MODIFIER"}</div>
            <h2 style={{fontSize:"24px",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"3px"}}>{isNew?"CREER UN TIRAGE":(f.title||"-")}</h2>
          </div>
          <button onClick={onClose} style={Object.assign({}, BTN, {background:"rgba(0,0,0,0.06)",color:C.textMd,border:"1px solid "+C.border,width:"36px",height:"36px",padding:0,borderRadius:"50%"})}>X</button>
        </div>
        <div style={{padding:"0 32px 32px"}}>
          <div style={{marginBottom:"24px"}}>
            <div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt,marginBottom:"14px"}}>PHOTO</div>
            {f.image ? (
              <div style={{position:"relative",marginBottom:"14px",borderRadius:"12px",overflow:"hidden",height:"180px"}}>
                <img src={f.image} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}></img>
                <button onClick={function(){set("image","");setUrlInput("");}} style={{position:"absolute",top:"10px",right:"10px",background:"rgba(0,0,0,0.5)",border:"none",borderRadius:"20px",padding:"4px 10px",color:"#fff",fontSize:"11px",cursor:"pointer"}}>Changer</button>
              </div>
            ) : (
              <div style={{height:"160px",borderRadius:"12px",border:"2px dashed "+(dragOver?"rgba(0,0,0,0.4)":C.border),background:dragOver?"rgba(0,0,0,0.05)":"rgba(0,0,0,0.02)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"8px",marginBottom:"14px",cursor:"pointer"}}
                onClick={function(){ if(fileRef.current) fileRef.current.click(); }}
                onDragOver={function(e){e.preventDefault();setDragOver(true);}}
                onDragLeave={function(){setDragOver(false);}}
                onDrop={function(e){e.preventDefault();setDragOver(false);handleFile(e.dataTransfer.files[0]);}}>
                <div style={{fontSize:"24px",color:C.textLt}}>+</div>
                <div style={{fontSize:"13px",color:C.textMd}}>Glisser une photo ici</div>
                <div style={{fontSize:"11px",color:C.textLt}}>ou cliquer pour parcourir</div>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={function(e){handleFile(e.target.files[0]);}}></input>
            <div style={{display:"flex",gap:"6px",marginBottom:"12px"}}>
              {[{id:"upload",label:"Mon ordi"},{id:"url",label:"URL"},{id:"suggest",label:"Suggestions"}].map(function(tab) {
                return <button key={tab.id} onClick={function(){setImgTab(tab.id);}} style={Object.assign({}, BTN, {padding:"7px 14px",fontSize:"11px",background:imgTab===tab.id?C.btnBg:"rgba(0,0,0,0.05)",color:imgTab===tab.id?C.btnText:C.textMd,border:"1px solid "+(imgTab===tab.id?C.btnBg:C.border)})}>{tab.label}</button>;
              })}
            </div>
            {imgTab==="upload" ? <button onClick={function(){ if(fileRef.current) fileRef.current.click(); }} style={Object.assign({}, BTN, {width:"100%",padding:"11px",background:"rgba(0,0,0,0.05)",color:C.textMd,border:"1px solid "+C.border,fontSize:"12px"})}>Choisir un fichier</button> : null}
            {imgTab==="url" ? (
              <div>
                <div style={{display:"flex",gap:"8px"}}>
                  <input type="text" placeholder="https://... (Google, Unsplash...)" value={urlInput} onChange={function(e){setUrlInput(e.target.value);}} style={Object.assign({}, INP, {flex:1,fontSize:"13px"})}></input>
                  <button onClick={handleUrlApply} style={Object.assign({}, BTN, {padding:"11px 18px",background:C.btnBg,color:C.btnText,fontSize:"12px"})}>Appliquer</button>
                </div>
                <div style={{fontSize:"10px",color:C.textLt,marginTop:"6px",lineHeight:"1.4"}}>Astuce: si l'URL Google ne marche pas, faites clic-droit sur l'image et "Copier l'adresse de l'image".</div>
              </div>
            ) : null}
            {imgTab==="suggest" ? (
              <div>
                {suggestedPhoto ? (
                  <div style={{display:"flex",gap:"10px",alignItems:"center",marginBottom:"12px",padding:"10px",background:"rgba(0,120,60,0.06)",border:"1px solid rgba(0,120,60,0.15)",borderRadius:"10px"}}>
                    <img src={suggestedPhoto} alt="" style={{width:"80px",height:"54px",objectFit:"cover",borderRadius:"8px"}}></img>
                    <div style={{flex:1}}>
                      <div style={{fontSize:"11px",color:"rgba(0,100,50,0.9)",marginBottom:"4px",fontWeight:"600"}}>SUGGESTION AUTO</div>
                      <button onClick={function(){set("image",suggestedPhoto);}} style={Object.assign({}, BTN, {padding:"7px 14px",background:C.btnBg,color:C.btnText,fontSize:"11px"})}>Utiliser cette photo</button>
                    </div>
                  </div>
                ) : null}
                <div style={{fontSize:"10px",letterSpacing:"2px",color:C.textLt,marginBottom:"8px"}}>TOUTES LES DESTINATIONS</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"6px",maxHeight:"260px",overflowY:"auto"}}>
                  {Object.keys(PHOTOS).map(function(city) {
                    return (
                      <div key={city} onClick={function(){set("image",PHOTOS[city]);}} style={{cursor:"pointer",borderRadius:"8px",overflow:"hidden",position:"relative",height:"70px",border:"1px solid "+C.border}}>
                        <img src={PHOTOS[city]} alt={city} style={{width:"100%",height:"100%",objectFit:"cover"}}></img>
                        <div style={{position:"absolute",bottom:0,left:0,right:0,background:"linear-gradient(to top,rgba(0,0,0,0.8),transparent)",padding:"3px 6px",fontSize:"9px",color:"#fff",textTransform:"capitalize",fontWeight:"600"}}>{city}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
          <div style={{marginBottom:"20px"}}>
            <div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt,marginBottom:"14px"}}>INFORMATIONS</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
              {[
                {k:"title",l:"NOM DU TIRAGE",t:"text",ph:"Sejour Prestige..."},
                {k:"location",l:"DESTINATION",t:"text",ph:"Dubai..."},
                {k:"country",l:"PAYS (emoji)",t:"text",ph:""},
                {k:"prize",l:"PRIX A GAGNER",t:"text",ph:"Bon hotel 10000$"},
                {k:"partner",l:"PARTENAIRE",t:"text",ph:"PrivateHonors.com"},
                {k:"emoji",l:"EMOJI",t:"text",ph:""},
                {k:"ticketPrice",l:"PRIX TICKET ($)",t:"number",ph:"100"},
                {k:"totalTickets",l:"TOTAL TICKETS",t:"number",ph:"200"},
                {k:"endDate",l:"DATE CLOTURE",t:"date"},
                {k:"drawDate",l:"DATE DU TIRAGE",t:"date"}
              ].map(function(fi) {
                return (
                  <div key={fi.k}>
                    <div style={{fontSize:"9px",letterSpacing:"2px",color:C.textLt,marginBottom:"6px"}}>{fi.l}</div>
                    <input type={fi.t} placeholder={fi.ph||""} value={f[fi.k]||""}
                      onChange={function(e) {
                        const val = fi.t==="number" ? +e.target.value : e.target.value;
                        set(fi.k, val);
                        if (fi.k==="location" && !f.image) {
                          const sugg = getPhoto(e.target.value);
                          if (sugg) set("image", sugg);
                        }
                      }} style={INP}></input>
                  </div>
                );
              })}
            </div>
            <div style={{marginTop:"12px"}}>
              <div style={{fontSize:"9px",letterSpacing:"2px",color:C.textLt,marginBottom:"6px"}}>DESCRIPTION</div>
              <textarea placeholder="Description..." value={f.description||""} onChange={function(e){set("description",e.target.value);}} rows={3} style={Object.assign({}, INP, {resize:"vertical"})}></textarea>
            </div>
            <div style={{marginTop:"12px"}}>
              <div style={{fontSize:"9px",letterSpacing:"2px",color:C.textLt,marginBottom:"6px"}}>DEGRADE (CSS, optionnel)</div>
              <input type="text" placeholder="linear-gradient(135deg, #1a1a1a, #444)" value={f.gradient||""} onChange={function(e){set("gradient",e.target.value);}} style={INP}></input>
            </div>
          </div>
          <div style={{marginBottom:"20px"}}>
            <div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt,marginBottom:"12px"}}>LIENS STRIPE</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
              {[1,3,5,10,15,25,50].map(function(n) {
                return (
                  <div key={n} style={{display:"grid",gridTemplateColumns:"52px 1fr",gap:"7px",alignItems:"center"}}>
                    <div style={{background:"rgba(0,0,0,0.05)",border:"1px solid "+C.border,borderRadius:"7px",padding:"8px",textAlign:"center",fontSize:"12px",color:C.textMd}}>{n}x</div>
                    <input type="text" placeholder="buy.stripe.com/..." value={(f.stripeLinks && f.stripeLinks[n])||""} onChange={function(e){set("stripeLinks", Object.assign({}, f.stripeLinks||{}, { [n]: e.target.value }));}} style={Object.assign({}, INP, {fontSize:"11px",padding:"9px 10px"})}></input>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{marginBottom:"24px"}}>
            <div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt,marginBottom:"10px"}}>STATUT</div>
            <div style={{display:"flex",gap:"8px"}}>
              {["active","closed","drawn"].map(function(s) {
                return <button key={s} onClick={function(){set("status",s);}} style={Object.assign({}, BTN, {flex:1,padding:"10px",textTransform:"uppercase",fontSize:"10px",background:f.status===s?C.btnBg:"rgba(0,0,0,0.04)",color:f.status===s?C.btnText:C.textMd,border:"1px solid "+(f.status===s?C.btnBg:C.border)})}>{s}</button>;
              })}
            </div>
            {f.status==="active" ? <div style={{marginTop:"10px",fontSize:"11px",color:"rgba(0,100,50,0.8)",background:"rgba(0,120,60,0.06)",border:"1px solid rgba(0,120,60,0.15)",borderRadius:"8px",padding:"8px 12px"}}>Visible sur www.olawin.org</div> : null}
          </div>
          <div style={{display:"flex",gap:"10px"}}>
            <button onClick={handleSave} disabled={saving} style={Object.assign({}, BTN, {flex:1,padding:"14px",background:saving?"rgba(0,0,0,0.3)":C.btnBg,color:C.btnText,fontSize:"13px",cursor:saving?"wait":"pointer"})}>
              {saving?"ENREGISTREMENT...":(isNew?"CREER":"SAUVEGARDER")}
            </button>
            <button onClick={onClose} disabled={saving} style={Object.assign({}, BTN, {padding:"14px 20px",background:"rgba(0,0,0,0.05)",color:C.textMd,border:"1px solid "+C.border})}>Annuler</button>
          </div>
        </div>
      </div>
    </div>
  );
}
function OrderDetailModal(props) {
  const order = props.order;
  const onClose = props.onClose;
  const onDelete = props.onDelete;
  const onResend = props.onResend;
  const draws = props.draws || [];
  const [working, setWorking] = useState(false);
  const drawInfo = draws.find(function(d){ return d.id === order.drawId; });
  const displayOrderNum = order.orderNumber || (order.id ? order.id.slice(-6).toUpperCase() : "");

  const handleResend = async function() {
    setWorking(true);
    try { await onResend(order); }
    catch(e) { alert("Erreur: " + e.message); }
    finally { setWorking(false); }
  };
  const handleDelete = async function() {
    if (!window.confirm("Supprimer cette commande ?\n\nATTENTION: action irreversible. Les tickets ne seront PAS restitues au tirage.")) return;
    setWorking(true);
    try { await onDelete(order); }
    catch(e) { alert("Erreur: " + e.message); }
    finally { setWorking(false); }
  };

  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.4)",backdropFilter:"blur(10px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"16px",overflowY:"auto"}}>
      <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:"20px",width:"100%",maxWidth:"600px",maxHeight:"95vh",overflowY:"auto"}}>
        <div style={{padding:"28px 32px",borderBottom:"1px solid "+C.border,display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt,marginBottom:"4px"}}>COMMANDE</div>
            <h2 style={{fontSize:"22px",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"3px"}}>OLA-{displayOrderNum}</h2>
            <div style={{fontSize:"12px",color:C.textMd,marginTop:"4px"}}>{fmtDFull(order.createdAt)}</div>
          </div>
          <button onClick={onClose} style={Object.assign({}, BTN, {background:"rgba(0,0,0,0.06)",color:C.textMd,border:"1px solid "+C.border,width:"36px",height:"36px",padding:0,borderRadius:"50%"})}>X</button>
        </div>
        <div style={{padding:"24px 32px"}}>
          <div style={{marginBottom:"20px"}}>
            <div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt,marginBottom:"8px"}}>CLIENT</div>
            <div style={{fontSize:"17px",fontWeight:"600",marginBottom:"6px"}}>{order.firstName} {order.lastName}</div>
            <div style={{fontSize:"13px",color:C.textMd,marginBottom:"3px"}}>{order.email}</div>
            <div style={{fontSize:"13px",color:C.textMd,marginBottom:"3px"}}>{order.phone}</div>
            <div style={{fontSize:"13px",color:C.textMd}}>{order.address}</div>
          </div>
          <div style={{marginBottom:"20px",paddingTop:"16px",borderTop:"1px solid "+C.border}}>
            <div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt,marginBottom:"8px"}}>TIRAGE</div>
            <div style={{fontSize:"15px",fontWeight:"600",marginBottom:"4px"}}>{order.drawTitle || (drawInfo && drawInfo.title) || "-"}</div>
            {drawInfo ? <div style={{fontSize:"12px",color:C.textMd}}>{drawInfo.location} {drawInfo.country}</div> : null}
          </div>
          <div style={{marginBottom:"20px",paddingTop:"16px",borderTop:"1px solid "+C.border}}>
            <div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt,marginBottom:"10px"}}>TICKETS ({order.tickets || 0})</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
              {(order.ticketNums||[]).map(function(n, i) {
                return <span key={i} style={{display:"inline-block",background:C.btnBg,color:C.btnText,borderRadius:"8px",padding:"6px 12px",fontSize:"13px",fontFamily:"Courier New, monospace",fontWeight:"600",letterSpacing:"1px"}}>#{String(n).padStart(3,"0")}</span>;
              })}
            </div>
          </div>
          <div style={{marginBottom:"24px",paddingTop:"16px",borderTop:"1px solid "+C.border}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
              <div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt}}>TOTAL PAYE</div>
              <div style={{fontSize:"28px",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"2px"}}>{fmtMoney(order.amount)}</div>
            </div>
            {order.discount ? <div style={{fontSize:"11px",color:C.textMd,marginTop:"4px",textAlign:"right"}}>Pack {order.pack} tickets, reduction {order.discount}%</div> : null}
          </div>
          <div style={{display:"flex",gap:"8px",flexDirection:"column"}}>
            <button onClick={handleResend} disabled={working} style={Object.assign({}, BTN, {width:"100%",padding:"12px",background:C.btnBg,color:C.btnText,fontSize:"12px",cursor:working?"wait":"pointer"})}>
              {working?"ENVOI EN COURS...":"RENVOYER EMAIL AU CLIENT"}
            </button>
            <button onClick={handleDelete} disabled={working} style={Object.assign({}, BTN, {width:"100%",padding:"12px",background:"rgba(160,0,0,0.06)",color:"rgba(140,0,0,0.85)",border:"1px solid rgba(160,0,0,0.18)",fontSize:"12px"})}>
              SUPPRIMER LA COMMANDE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TicketListModal(props) {
  const draw = props.draw;
  const orders = props.orders;
  const onClose = props.onClose;
  const ticketsList = [];
  orders.forEach(function(o) {
    (o.ticketNums || []).forEach(function(n) {
      ticketsList.push({
        num: n, firstName: o.firstName, lastName: o.lastName, email: o.email,
        orderNumber: o.orderNumber || (o.id ? o.id.slice(-6).toUpperCase() : "")
      });
    });
  });
  ticketsList.sort(function(a,b){ return a.num - b.num; });

  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.4)",backdropFilter:"blur(10px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"16px",overflowY:"auto"}}>
      <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:"20px",width:"100%",maxWidth:"700px",maxHeight:"95vh",overflowY:"auto"}}>
        <div style={{padding:"24px 32px",borderBottom:"1px solid "+C.border,display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt,marginBottom:"4px"}}>TICKETS VENDUS</div>
            <h2 style={{fontSize:"20px",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"3px"}}>{draw.title}</h2>
            <div style={{fontSize:"12px",color:C.textMd,marginTop:"4px"}}>{ticketsList.length} tickets sur {draw.totalTickets || 0}</div>
          </div>
          <button onClick={onClose} style={Object.assign({}, BTN, {background:"rgba(0,0,0,0.06)",color:C.textMd,border:"1px solid "+C.border,width:"36px",height:"36px",padding:0,borderRadius:"50%"})}>X</button>
        </div>
        <div style={{padding:"24px 32px"}}>
          {ticketsList.length === 0 ? (
            <div style={{textAlign:"center",padding:"40px 0",color:C.textMd,fontSize:"13px"}}>Aucun ticket vendu.</div>
          ) : (
            <div style={{background:C.cardAlt,border:"1px solid "+C.border,borderRadius:"12px",overflow:"hidden"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:"13px"}}>
                <thead>
                  <tr style={{borderBottom:"1px solid "+C.border,background:"rgba(0,0,0,0.03)"}}>
                    <th style={{padding:"10px 14px",textAlign:"left",fontSize:"9px",letterSpacing:"2px",color:C.textLt,fontWeight:"400"}}>TICKET</th>
                    <th style={{padding:"10px 14px",textAlign:"left",fontSize:"9px",letterSpacing:"2px",color:C.textLt,fontWeight:"400"}}>PROPRIETAIRE</th>
                    <th style={{padding:"10px 14px",textAlign:"left",fontSize:"9px",letterSpacing:"2px",color:C.textLt,fontWeight:"400"}}>EMAIL</th>
                    <th style={{padding:"10px 14px",textAlign:"left",fontSize:"9px",letterSpacing:"2px",color:C.textLt,fontWeight:"400"}}>COMMANDE</th>
                  </tr>
                </thead>
                <tbody>
                  {ticketsList.map(function(t, i) {
                    return (
                      <tr key={i} style={{borderBottom:"1px solid rgba(0,0,0,0.05)"}}>
                        <td style={{padding:"10px 14px",fontFamily:"Courier New, monospace",fontWeight:"600"}}>#{String(t.num).padStart(3,"0")}</td>
                        <td style={{padding:"10px 14px"}}>{t.firstName} {t.lastName}</td>
                        <td style={{padding:"10px 14px",color:C.textMd,fontSize:"11px"}}>{t.email}</td>
                        <td style={{padding:"10px 14px",color:C.textLt,fontSize:"11px"}}>OLA-{t.orderNumber}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DrawWinnerModal(props) {
  const draw = props.draw;
  const orders = props.orders;
  const onClose = props.onClose;
  const onConfirm = props.onConfirm;
  const [phase, setPhase] = useState("ready");
  const [currentNum, setCurrentNum] = useState(null);
  const [winnerNum, setWinnerNum] = useState(null);
  const [winnerOrder, setWinnerOrder] = useState(null);

  const allTickets = [];
  orders.forEach(function(o) {
    (o.ticketNums || []).forEach(function(n) { allTickets.push({ num: n, order: o }); });
  });

  const startDraw = function() {
    if (allTickets.length === 0) { alert("Aucun ticket vendu."); return; }
    setPhase("rolling");
    let count = 0;
    const max = 50;
    const interval = setInterval(function() {
      const random = allTickets[Math.floor(Math.random() * allTickets.length)];
      setCurrentNum(random.num);
      count++;
      if (count >= max) {
        clearInterval(interval);
        const final = allTickets[Math.floor(Math.random() * allTickets.length)];
        setWinnerNum(final.num);
        setWinnerOrder(final.order);
        setPhase("revealed");
      }
    }, 80);
  };

  const handleConfirm = async function() {
    if (winnerOrder && winnerNum != null) await onConfirm(winnerOrder, winnerNum);
  };

  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(10px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}>
      <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:"20px",width:"100%",maxWidth:"560px",overflow:"hidden"}}>
        <div style={{padding:"28px 32px",borderBottom:"1px solid "+C.border,display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt,marginBottom:"4px"}}>TIRAGE AU SORT</div>
            <h2 style={{fontSize:"22px",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"3px"}}>{draw.title}</h2>
          </div>
          <button onClick={onClose} style={Object.assign({}, BTN, {background:"rgba(0,0,0,0.06)",color:C.textMd,border:"1px solid "+C.border,width:"36px",height:"36px",padding:0,borderRadius:"50%"})}>X</button>
        </div>
        <div style={{padding:"40px 32px",textAlign:"center"}}>
          {phase === "ready" ? (
            <div>
              <p style={{fontSize:"14px",color:C.textMd,marginBottom:"24px",lineHeight:"1.6"}}>
                {allTickets.length} tickets vendus.<br></br>Un ticket sera tire au sort.
              </p>
              <button onClick={startDraw} style={Object.assign({}, BTN, {padding:"16px 32px",background:C.btnBg,color:C.btnText,fontSize:"13px"})}>LANCER LE TIRAGE</button>
            </div>
          ) : null}
          {phase === "rolling" ? (
            <div>
              <div style={{fontSize:"12px",letterSpacing:"3px",color:C.textLt,marginBottom:"20px"}}>TIRAGE EN COURS...</div>
              <div style={{fontSize:"72px",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"4px",color:C.text,minHeight:"90px"}}>#{String(currentNum||0).padStart(3,"0")}</div>
            </div>
          ) : null}
          {phase === "revealed" && winnerOrder ? (
            <div>
              <div style={{fontSize:"11px",letterSpacing:"3px",color:C.textLt,marginBottom:"14px"}}>TICKET GAGNANT</div>
              <div style={{fontSize:"56px",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"4px",color:C.text,marginBottom:"24px"}}>#{String(winnerNum).padStart(3,"0")}</div>
              <div style={{background:C.cardAlt,border:"1px solid "+C.border,borderRadius:"12px",padding:"20px",marginBottom:"20px"}}>
                <div style={{fontSize:"18px",fontWeight:"600",marginBottom:"6px"}}>{winnerOrder.firstName} {winnerOrder.lastName}</div>
                <div style={{fontSize:"13px",color:C.textMd,marginBottom:"4px"}}>{winnerOrder.email}</div>
                <div style={{fontSize:"13px",color:C.textMd}}>{winnerOrder.phone}</div>
              </div>
              <div style={{display:"flex",gap:"10px"}}>
                <button onClick={handleConfirm} style={Object.assign({}, BTN, {flex:1,padding:"14px",background:C.btnBg,color:C.btnText,fontSize:"12px"})}>CONFIRMER ET ENVOYER EMAIL</button>
                <button onClick={onClose} style={Object.assign({}, BTN, {padding:"14px 20px",background:"rgba(0,0,0,0.05)",color:C.textMd,border:"1px solid "+C.border})}>Annuler</button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function HeroSettingsModal(props) {
  const heroConfig = props.heroConfig;
  const onSave = props.onSave;
  const onClose = props.onClose;
  const [f, setF] = useState({
    enabled: heroConfig.enabled || false,
    image: heroConfig.image || "",
    title: heroConfig.title || "",
    subtitle: heroConfig.subtitle || "",
    description: heroConfig.description || "",
    country: heroConfig.country || "",
    location: heroConfig.location || ""
  });
  const [urlInput, setUrlInput] = useState(heroConfig.image || "");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  const set = function(k, v) { setF(function(p) { return Object.assign({}, p, { [k]: v }); }); };
  const handleFile = function(file) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = function(e) { set("image", e.target.result); };
    reader.readAsDataURL(file);
  };
  const handleSave = async function() {
    setSaving(true);
    try { await onSave(f); }
    catch(err) { alert("Erreur: "+err.message); }
    finally { setSaving(false); }
  };

  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.4)",backdropFilter:"blur(10px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"16px",overflowY:"auto"}}>
      <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:"20px",width:"100%",maxWidth:"640px",maxHeight:"95vh",overflowY:"auto"}}>
        <div style={{padding:"28px 32px",borderBottom:"1px solid "+C.border,display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt,marginBottom:"4px"}}>IMAGE PRINCIPALE</div>
            <h2 style={{fontSize:"22px",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"3px"}}>HERO DU SITE</h2>
          </div>
          <button onClick={onClose} style={Object.assign({}, BTN, {background:"rgba(0,0,0,0.06)",color:C.textMd,border:"1px solid "+C.border,width:"36px",height:"36px",padding:0,borderRadius:"50%"})}>X</button>
        </div>
        <div style={{padding:"24px 32px"}}>
          <div style={{background:"rgba(0,120,200,0.06)",border:"1px solid rgba(0,120,200,0.15)",borderRadius:"10px",padding:"12px 14px",marginBottom:"20px",fontSize:"12px",color:"rgba(0,80,140,0.9)",lineHeight:"1.5"}}>
            <strong>Info:</strong> Si active, cette image remplace le 1er tirage comme grande image d'accueil. Si desactivee, le site affiche normalement le tirage le plus proche du tirage.
          </div>
          <div style={{marginBottom:"20px",display:"flex",alignItems:"center",gap:"12px"}}>
            <button onClick={function(){set("enabled", !f.enabled);}} style={Object.assign({}, BTN, {padding:"10px 18px",background:f.enabled?C.btnBg:"rgba(0,0,0,0.05)",color:f.enabled?C.btnText:C.textMd,border:"1px solid "+(f.enabled?C.btnBg:C.border)})}>
              {f.enabled ? "ACTIVE" : "DESACTIVE"}
            </button>
            <div style={{fontSize:"12px",color:C.textMd}}>{f.enabled ? "Hero personnalise affiche" : "Hero automatique"}</div>
          </div>
          <div style={{marginBottom:"20px"}}>
            <div style={{fontSize:"9px",letterSpacing:"2px",color:C.textLt,marginBottom:"8px"}}>IMAGE</div>
            {f.image ? (
              <div style={{position:"relative",marginBottom:"12px",borderRadius:"12px",overflow:"hidden",height:"180px"}}>
                <img src={f.image} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}></img>
                <button onClick={function(){set("image","");setUrlInput("");}} style={{position:"absolute",top:"10px",right:"10px",background:"rgba(0,0,0,0.5)",border:"none",borderRadius:"20px",padding:"4px 10px",color:"#fff",fontSize:"11px",cursor:"pointer"}}>Retirer</button>
              </div>
            ) : null}
            <div style={{display:"flex",gap:"8px",marginBottom:"8px"}}>
              <button onClick={function(){ if(fileRef.current) fileRef.current.click(); }} style={Object.assign({}, BTN, {flex:1,padding:"10px",background:"rgba(0,0,0,0.05)",color:C.textMd,border:"1px solid "+C.border,fontSize:"12px"})}>Charger un fichier</button>
              <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={function(e){handleFile(e.target.files[0]);}}></input>
            </div>
            <div style={{display:"flex",gap:"8px"}}>
              <input type="text" placeholder="ou URL d'image..." value={urlInput} onChange={function(e){setUrlInput(e.target.value);}} style={Object.assign({}, INP, {flex:1,fontSize:"12px"})}></input>
              <button onClick={function(){set("image", normalizeUrl(urlInput));}} style={Object.assign({}, BTN, {padding:"10px 16px",background:C.btnBg,color:C.btnText,fontSize:"11px"})}>OK</button>
            </div>
          </div>
          <div style={{marginBottom:"20px"}}>
            <div style={{fontSize:"9px",letterSpacing:"2px",color:C.textLt,marginBottom:"6px"}}>TITRE</div>
            <input type="text" placeholder="OLAWIN" value={f.title} onChange={function(e){set("title", e.target.value);}} style={INP}></input>
          </div>
          <div style={{marginBottom:"20px"}}>
            <div style={{fontSize:"9px",letterSpacing:"2px",color:C.textLt,marginBottom:"6px"}}>SOUS-TITRE (optionnel)</div>
            <input type="text" placeholder="EXCLUSIVE" value={f.subtitle} onChange={function(e){set("subtitle", e.target.value);}} style={INP}></input>
          </div>
          <div style={{marginBottom:"20px"}}>
            <div style={{fontSize:"9px",letterSpacing:"2px",color:C.textLt,marginBottom:"6px"}}>DESCRIPTION</div>
            <textarea placeholder="Description elegante..." value={f.description} onChange={function(e){set("description", e.target.value);}} rows={3} style={Object.assign({}, INP, {resize:"vertical"})}></textarea>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"24px"}}>
            <div>
              <div style={{fontSize:"9px",letterSpacing:"2px",color:C.textLt,marginBottom:"6px"}}>EMOJI PAYS</div>
              <input type="text" placeholder="emoji drapeau" value={f.country} onChange={function(e){set("country", e.target.value);}} style={INP}></input>
            </div>
            <div>
              <div style={{fontSize:"9px",letterSpacing:"2px",color:C.textLt,marginBottom:"6px"}}>VILLE/PAYS</div>
              <input type="text" placeholder="Dubai" value={f.location} onChange={function(e){set("location", e.target.value);}} style={INP}></input>
            </div>
          </div>
          <div style={{display:"flex",gap:"10px"}}>
            <button onClick={handleSave} disabled={saving} style={Object.assign({}, BTN, {flex:1,padding:"14px",background:saving?"rgba(0,0,0,0.3)":C.btnBg,color:C.btnText,fontSize:"13px",cursor:saving?"wait":"pointer"})}>
              {saving?"ENREGISTREMENT...":"SAUVEGARDER"}
            </button>
            <button onClick={onClose} disabled={saving} style={Object.assign({}, BTN, {padding:"14px 20px",background:"rgba(0,0,0,0.05)",color:C.textMd,border:"1px solid "+C.border})}>Annuler</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LivePage(props) {
  const draw = props.draw;
  const orders = props.orders;
  const onExit = props.onExit;
  const onWinnerConfirm = props.onWinnerConfirm;
  const [phase, setPhase] = useState("intro");
  const [currentNum, setCurrentNum] = useState(null);
  const [winnerNum, setWinnerNum] = useState(null);
  const [winnerOrder, setWinnerOrder] = useState(null);

  const allTickets = [];
  orders.forEach(function(o) {
    (o.ticketNums || []).forEach(function(n) { allTickets.push({ num: n, order: o }); });
  });

  const startDraw = function() {
    if (allTickets.length === 0) { alert("Aucun ticket vendu."); return; }
    setPhase("rolling");
    let count = 0;
    const max = 80;
    let speed = 50;
    const tick = function() {
      const random = allTickets[Math.floor(Math.random() * allTickets.length)];
      setCurrentNum(random.num);
      count++;
      if (count >= max) {
        const final = allTickets[Math.floor(Math.random() * allTickets.length)];
        setWinnerNum(final.num);
        setWinnerOrder(final.order);
        setPhase("revealed");
        return;
      }
      if (count > 50) speed = Math.min(400, speed * 1.15);
      setTimeout(tick, speed);
    };
    tick();
  };

  const handleConfirm = async function() {
    if (winnerOrder && winnerNum != null) {
      await onWinnerConfirm(winnerOrder, winnerNum);
      setPhase("confirmed");
    }
  };

  return (
    <div style={{position:"fixed",inset:0,zIndex:300,background:"#0a0a0a",color:"#fff",display:"flex",flexDirection:"column",fontFamily:"DM Sans, sans-serif"}}>
      <button onClick={onExit} style={{position:"absolute",top:"20px",right:"20px",zIndex:10,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:"20px",padding:"8px 16px",color:"rgba(255,255,255,0.8)",fontSize:"11px",cursor:"pointer",letterSpacing:"2px"}}>QUITTER LE LIVE</button>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px",textAlign:"center"}}>
        <div style={{marginBottom:"40px",filter:"invert(1)"}}>
          <Logo size={48}></Logo>
        </div>
        <div style={{fontSize:"11px",letterSpacing:"4px",color:"rgba(255,255,255,0.5)",marginBottom:"16px"}}>TIRAGE OFFICIEL</div>
        <h1 style={{fontSize:"clamp(36px,5vw,72px)",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"4px",lineHeight:0.95,marginBottom:"12px"}}>{(draw.title||"").toUpperCase()}</h1>
        <div style={{fontSize:"18px",color:"rgba(255,255,255,0.6)",marginBottom:"60px",letterSpacing:"3px"}}>{draw.country} {(draw.location||"").toUpperCase()}</div>
        {phase === "intro" ? (
          <div>
            <div style={{fontSize:"14px",color:"rgba(255,255,255,0.5)",letterSpacing:"3px",marginBottom:"40px"}}>{allTickets.length} TICKETS EN JEU</div>
            <button onClick={startDraw} style={{background:"#fff",color:"#000",border:"none",borderRadius:"12px",padding:"20px 48px",fontSize:"15px",fontWeight:"700",letterSpacing:"4px",cursor:"pointer",fontFamily:"DM Sans, sans-serif"}}>LANCER LE TIRAGE</button>
          </div>
        ) : null}
        {phase === "rolling" ? (
          <div>
            <div style={{fontSize:"12px",letterSpacing:"4px",color:"rgba(255,255,255,0.5)",marginBottom:"30px"}}>TIRAGE EN COURS</div>
            <div style={{fontSize:"clamp(120px,18vw,220px)",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"4px",lineHeight:0.9,color:"#fff"}}>#{String(currentNum||0).padStart(3,"0")}</div>
          </div>
        ) : null}
        {phase === "revealed" && winnerOrder ? (
          <div>
            <div style={{fontSize:"12px",letterSpacing:"4px",color:"rgba(255,255,255,0.5)",marginBottom:"20px"}}>TICKET GAGNANT</div>
            <div style={{fontSize:"clamp(120px,18vw,220px)",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"4px",lineHeight:0.9,color:"#fff",marginBottom:"40px"}}>#{String(winnerNum).padStart(3,"0")}</div>
            <div style={{fontSize:"30px",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"3px",marginBottom:"40px",color:"#fff"}}>
              {(winnerOrder.firstName||"").toUpperCase()} {((winnerOrder.lastName||"").charAt(0)||"")}.
            </div>
            <button onClick={handleConfirm} style={{background:"#fff",color:"#000",border:"none",borderRadius:"12px",padding:"16px 40px",fontSize:"13px",fontWeight:"700",letterSpacing:"3px",cursor:"pointer",fontFamily:"DM Sans, sans-serif"}}>CONFIRMER ET ENVOYER EMAIL</button>
          </div>
        ) : null}
        {phase === "confirmed" ? (
          <div>
            <div style={{fontSize:"24px",letterSpacing:"3px",color:"#fff",marginBottom:"16px"}}>EMAIL ENVOYE</div>
            <div style={{fontSize:"14px",color:"rgba(255,255,255,0.6)",marginBottom:"40px"}}>Le tirage est officiellement clos.</div>
            <button onClick={onExit} style={{background:"rgba(255,255,255,0.1)",color:"#fff",border:"1px solid rgba(255,255,255,0.2)",borderRadius:"12px",padding:"16px 40px",fontSize:"13px",fontWeight:"600",letterSpacing:"3px",cursor:"pointer"}}>RETOUR ADMIN</button>
          </div>
        ) : null}
      </div>
      <div style={{padding:"16px",textAlign:"center",fontSize:"10px",color:"rgba(255,255,255,0.3)",letterSpacing:"2px",borderTop:"1px solid rgba(255,255,255,0.05)"}}>OLAWIN OFFICIAL DRAW</div>
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
  const [showHero, setShowHero] = useState(false);
  const [heroConfig, setHeroConfig] = useState({});
  const [notif, setNotif] = useState(null);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderFilter, setOrderFilter] = useState("");
  const [viewOrder, setViewOrder] = useState(null);
  const [viewTickets, setViewTickets] = useState(null);
  const [drawingDraw, setDrawingDraw] = useState(null);
  const [livePage, setLivePage] = useState(null);

  const notify = function(msg, type) {
    setNotif({msg: msg, type: type || "ok"});
    setTimeout(function(){ setNotif(null); }, 3000);
  };

  useEffect(function() {
    if (!authed) return;
    const qDraws = query(collection(db,"draws"), orderBy("createdAt","desc"));
    const unsubD = onSnapshot(qDraws, function(snap) {
      const data = snap.docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); });
      data.sort(function(a, b) {
        const aDate = a.drawDate ? new Date(a.drawDate).getTime() : 0;
        const bDate = b.drawDate ? new Date(b.drawDate).getTime() : 0;
        if (!aDate && !bDate) return 0;
        if (!aDate) return 1;
        if (!bDate) return -1;
        return bDate - aDate;
      });
      setDraws(data);
      setLoading(false);
    }, function(err) {
      console.error("Firebase error:", err);
      setLoading(false);
      notify("Erreur Firebase", "err");
    });
    const qOrders = query(collection(db,"orders"), orderBy("createdAt","desc"));
    const unsubO = onSnapshot(qOrders, function(snap) {
      setOrders(snap.docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); }));
    });
    getDoc(doc(db, "settings", "hero")).then(function(snap) {
      if (snap.exists()) setHeroConfig(snap.data());
    }).catch(function(e){ console.error("Hero config error:", e); });
    return function() { unsubD(); unsubO(); };
  }, [authed]);

  const saveDraw = async function(d) {
    const id = d.id;
    const payload = Object.assign({}, d);
    delete payload.id;
    if (!payload.createdAt) payload.createdAt = serverTimestamp();
    payload.updatedAt = serverTimestamp();
    if (!payload.soldTickets) payload.soldTickets = 0;
    await updateDoc(doc(db,"draws",id), payload);
    setEditDraw(null);
    notify("Tirage mis a jour");
  };

  const createDraw = async function(d) {
    const payload = Object.assign({}, d, { soldTickets: 0, winner: null, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    await addDoc(collection(db,"draws"), payload);
    setShowNew(false);
    notify("Tirage cree, visible sur le site");
  };

  const deleteDraw = async function(id) {
    if (!window.confirm("Supprimer ce tirage ?")) return;
    try { await deleteDoc(doc(db,"draws",id)); notify("Supprime", "err"); }
    catch (err) { notify("Erreur","err"); }
  };

  const deleteOrder = async function(order) {
    try {
      await deleteDoc(doc(db, "orders", order.id));
      setViewOrder(null);
      notify("Commande supprimee", "err");
    } catch (err) { notify("Erreur: "+err.message, "err"); throw err; }
  };

  const resendOrder = async function(order) {
    try {
      const drawInfo = draws.find(function(d){ return d.id === order.drawId; });
      await sendTicketConfirmation({
        firstName: order.firstName, lastName: order.lastName, email: order.email,
        drawTitle: order.drawTitle || (drawInfo && drawInfo.title),
        drawLocation: drawInfo && drawInfo.location, drawCountry: drawInfo && drawInfo.country,
        drawDate: drawInfo && drawInfo.drawDate,
        ticketNums: order.ticketNums, qty: order.tickets, total: order.amount,
        discount: order.discount, pack: order.pack,
        orderNumber: order.orderNumber || (order.id ? order.id.slice(-6).toUpperCase() : "")
      });
      notify("Email renvoye au client");
    } catch (err) { notify("Erreur: "+err.message, "err"); throw err; }
  };

  const confirmWinner = async function(order, winningNum) {
    try {
      const drawData = drawingDraw || livePage;
      if (!drawData) return;
      await updateDoc(doc(db,"draws", drawData.id), {
        winner: {
          orderNumber: order.orderNumber || (order.id ? order.id.slice(-6).toUpperCase() : ""),
          firstName: order.firstName, lastName: order.lastName, email: order.email,
          ticketNum: winningNum, drawnAt: serverTimestamp()
        },
        status: "drawn"
      });
      try {
        await sendWinnerEmail({
          firstName: order.firstName, lastName: order.lastName, email: order.email,
          drawTitle: drawData.title, drawLocation: drawData.location, drawCountry: drawData.country,
          prize: drawData.prize, partner: drawData.partner, ticketNum: winningNum
        });
        notify("Gagnant enregistre et email envoye");
      } catch(e) { notify("Gagnant enregistre mais email a echoue", "err"); }
      setDrawingDraw(null);
    } catch (err) { notify("Erreur: "+err.message, "err"); }
  };

  const saveHero = async function(config) {
    try {
      await setDoc(doc(db, "settings", "hero"), config);
      setHeroConfig(config);
      setShowHero(false);
      notify("Hero sauvegarde");
    } catch (err) { notify("Erreur: "+err.message, "err"); throw err; }
  };

  const exportCSV = function() {
    const list = orders.filter(filterOrder);
    const headers = ["OrderNumber","Date","FirstName","LastName","Email","Phone","Address","Draw","Tickets","TicketNums","Amount","Discount","Pack"];
    const rows = list.map(function(o) {
      const dateStr = o.createdAt && o.createdAt.toDate ? o.createdAt.toDate().toISOString() : "";
      const ola = o.orderNumber || (o.id ? o.id.slice(-6).toUpperCase() : "");
      return [
        "OLA-"+ola, dateStr,
        (o.firstName||"").replace(/"/g,'""'), (o.lastName||"").replace(/"/g,'""'),
        (o.email||""), (o.phone||""),
        (o.address||"").replace(/"/g,'""'),
        (o.drawTitle||"").replace(/"/g,'""'),
        o.tickets||0, (o.ticketNums||[]).join(";"),
        o.amount||0, o.discount||0, o.pack||""
      ].map(function(v){ return '"'+v+'"'; }).join(",");
    });
    const csv = headers.join(",") + "\n" + rows.join("\n");
    const blob = new Blob([csv], {type:"text/csv;charset=utf-8;"});
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "olawin-commandes-"+new Date().toISOString().slice(0,10)+".csv";
    link.click();
    notify("Export termine: "+list.length+" commandes");
  };

  const filterOrder = function(o) {
    const s = orderSearch.toLowerCase().trim().replace(/^ola-?/i,"");
    if (orderFilter && o.drawId !== orderFilter) return false;
    if (!s) return true;
    const ola = (o.orderNumber || (o.id ? o.id.slice(-6).toUpperCase() : "")).toLowerCase();
    if (ola.includes(s)) return true;
    if ((o.firstName||"").toLowerCase().includes(s)) return true;
    if ((o.lastName||"").toLowerCase().includes(s)) return true;
    if ((o.email||"").toLowerCase().includes(s)) return true;
    if ((o.ticketNums||[]).some(function(n){ return String(n).includes(s) || String(n).padStart(3,"0").includes(s); })) return true;
    return false;
  };

  const totalRevenue = orders.reduce(function(s,o){ return s+(o.amount||0); },0);
  const totalTickets = orders.reduce(function(s,o){ return s+(o.tickets||0); },0);
  const activeDraws = draws.filter(function(d){return d.status==="active";}).length;
  const filtered = orders.filter(filterOrder);

  const revenueByDraw = draws.map(function(d) {
    const drawOrders = orders.filter(function(o){ return o.drawId === d.id; });
    const revenue = drawOrders.reduce(function(s,o){ return s+(o.amount||0); },0);
    return { drawId: d.id, title: d.title, revenue: revenue, orders: drawOrders.length };
  }).sort(function(a,b){ return b.revenue - a.revenue; });

  const topBuyers = (function() {
    const map = {};
    orders.forEach(function(o) {
      const key = (o.email||"").toLowerCase();
      if (!key) return;
      if (!map[key]) map[key] = { email: o.email, name: o.firstName+" "+o.lastName, count: 0, total: 0, tickets: 0 };
      map[key].count++;
      map[key].total += o.amount || 0;
      map[key].tickets += o.tickets || 0;
    });
    return Object.values(map).sort(function(a,b){ return b.total - a.total; }).slice(0,5);
  })();

  const CSS = "@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&family=Montserrat:wght@400;500;600;700&display=swap');*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}input::placeholder{color:rgba(0,0,0,0.25);}input:focus{outline:none;border-color:rgba(0,0,0,0.4);}@keyframes fadeUp{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}@keyframes slideIn{from{transform:translateX(100%);opacity:0;}to{transform:translateX(0);opacity:1;}}@keyframes spin{to{transform:rotate(360deg);}}.row:hover{background:rgba(0,0,0,0.03);cursor:pointer;}";

  if (livePage) {
    return (
      <div>
        <style>{CSS}</style>
        <LivePage draw={livePage} orders={orders.filter(function(o){return o.drawId === livePage.id;})} onExit={function(){setLivePage(null);}} onWinnerConfirm={confirmWinner}></LivePage>
      </div>
    );
  }

  if (!authed) return (
    <div style={{background:C.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"DM Sans, sans-serif",color:C.text}}>
      <style>{CSS}</style>
      <div style={{width:"360px"}}>
        <div style={{textAlign:"center",marginBottom:"40px"}}>
          <Logo size={36}></Logo>
          <div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt,marginTop:"8px"}}>ESPACE ADMINISTRATEUR</div>
        </div>
        <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:"16px",padding:"32px"}}>
          <div style={{fontSize:"9px",letterSpacing:"2px",color:C.textLt,marginBottom:"7px"}}>MOT DE PASSE</div>
          <input type="password" placeholder="..........." value={pw}
            onChange={function(e){setPw(e.target.value);setPwErr(false);}}
            onKeyDown={function(e){ if(e.key==="Enter") (pw===ADMIN_PASSWORD?setAuthed(true):setPwErr(true)); }}
            style={Object.assign({}, INP, {marginBottom:"12px",borderColor:pwErr?"rgba(180,0,0,0.3)":"rgba(0,0,0,0.12)"})}
            autoFocus></input>
          {pwErr ? <div style={{fontSize:"12px",color:"rgba(160,0,0,0.7)",marginBottom:"12px"}}>Mot de passe incorrect</div> : null}
          <button onClick={function(){ pw===ADMIN_PASSWORD?setAuthed(true):setPwErr(true); }} style={Object.assign({}, BTN, {width:"100%",padding:"14px",background:C.btnBg,color:C.btnText})}>SE CONNECTER</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{background:C.bg,minHeight:"100vh",color:C.text,fontFamily:"DM Sans, sans-serif",display:"grid",gridTemplateColumns:"220px 1fr"}}>
      <style>{CSS}</style>
      {editDraw ? <DrawModal draw={editDraw} onSave={saveDraw} onClose={function(){setEditDraw(null);}}></DrawModal> : null}
      {showNew ? <DrawModal draw={{title:"",location:"",country:"",prize:"",partner:"PrivateHonors.com",emoji:"",ticketPrice:100,totalTickets:200,soldTickets:0,endDate:"",drawDate:"",status:"active",image:"",description:"",gradient:"",stripeLinks:{}}} onSave={createDraw} onClose={function(){setShowNew(false);}} isNew></DrawModal> : null}
      {showHero ? <HeroSettingsModal heroConfig={heroConfig} onSave={saveHero} onClose={function(){setShowHero(false);}}></HeroSettingsModal> : null}
      {viewOrder ? <OrderDetailModal order={viewOrder} draws={draws} onClose={function(){setViewOrder(null);}} onDelete={deleteOrder} onResend={resendOrder}></OrderDetailModal> : null}
      {viewTickets ? <TicketListModal draw={viewTickets} orders={orders.filter(function(o){return o.drawId === viewTickets.id;})} onClose={function(){setViewTickets(null);}}></TicketListModal> : null}
      {drawingDraw ? <DrawWinnerModal draw={drawingDraw} orders={orders.filter(function(o){return o.drawId === drawingDraw.id;})} onClose={function(){setDrawingDraw(null);}} onConfirm={confirmWinner}></DrawWinnerModal> : null}
      {notif ? <div style={{position:"fixed",top:"20px",right:"20px",zIndex:300,background:notif.type==="err"?"#8B0000":C.btnBg,color:C.btnText,borderRadius:"10px",padding:"13px 20px",fontSize:"13px",fontWeight:"600",animation:"slideIn 0.3s ease",maxWidth:"400px"}}>{notif.msg}</div> : null}

      <aside style={{background:C.sidebar,borderRight:"1px solid "+C.border,display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh"}}>
        <div style={{padding:"28px 24px 20px",borderBottom:"1px solid "+C.border}}>
          <Logo size={26}></Logo>
          <div style={{fontSize:"9px",letterSpacing:"2px",color:C.textLt,marginTop:"6px"}}>ADMIN PANEL</div>
        </div>
        <nav style={{padding:"20px 14px",flex:1}}>
          {[{id:"dashboard",label:"Dashboard"},{id:"draws",label:"Tirages"},{id:"orders",label:"Commandes"},{id:"stats",label:"Statistiques"},{id:"settings",label:"Reglages"}].map(function(item) {
            return <button key={item.id} onClick={function(){setTab(item.id);}} style={{width:"100%",display:"flex",alignItems:"center",gap:"10px",padding:"10px 12px",borderRadius:"8px",border:"none",background:tab===item.id?"rgba(0,0,0,0.08)":"transparent",color:tab===item.id?C.text:C.textLt,fontSize:"13px",cursor:"pointer",marginBottom:"3px",borderLeft:"2px solid "+(tab===item.id?C.text:"transparent"),textAlign:"left",fontFamily:"DM Sans, sans-serif"}}>{item.label}</button>;
          })}
        </nav>
        <div style={{padding:"16px",borderTop:"1px solid "+C.border}}>
          <div style={{fontSize:"9px",letterSpacing:"1.5px",color:C.textLt,marginBottom:"8px",textAlign:"center"}}>FIREBASE LIVE</div>
          <button onClick={function(){setAuthed(false);}} style={Object.assign({}, BTN, {width:"100%",padding:"10px",background:"rgba(0,0,0,0.05)",color:C.textMd,border:"1px solid "+C.border,fontSize:"11px"})}>DECONNEXION</button>
        </div>
      </aside>

      <main style={{padding:"40px 44px",overflowY:"auto"}}>
        {loading ? (
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"60vh",gap:"16px"}}>
            <div style={{width:"32px",height:"32px",border:"2px solid rgba(0,0,0,0.1)",borderTopColor:C.text,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}></div>
            <p style={{fontSize:"12px",letterSpacing:"3px",color:C.textLt}}>CHARGEMENT...</p>
          </div>
        ) : null}

        {!loading && tab==="dashboard" ? (
          <div style={{animation:"fadeUp 0.4s ease"}}>
            <div style={{marginBottom:"36px"}}>
              <div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt,marginBottom:"6px"}}>TABLEAU DE BORD</div>
              <h1 style={{fontSize:"32px",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"3px",marginBottom:"4px"}}>Bonjour</h1>
              <p style={{color:C.textMd,fontSize:"13px"}}>{new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</p>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"14px",marginBottom:"36px"}}>
              <StatCard label="REVENUS" value={fmtMoney(totalRevenue)} sub={orders.length+" commandes"}></StatCard>
              <StatCard label="TICKETS" value={totalTickets} sub="tous tirages"></StatCard>
              <StatCard label="TIRAGES ACTIFS" value={activeDraws} sub={draws.length+" au total"}></StatCard>
              <StatCard label="PARTICIPANTS" value={orders.length} sub="acheteurs"></StatCard>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"}}>
              <div>
                <div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt}}>TIRAGES</div>
                <h2 style={{fontSize:"20px",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"2px",marginTop:"4px"}}>En cours</h2>
              </div>
              <button onClick={function(){setShowNew(true);}} style={Object.assign({}, BTN, {background:C.btnBg,color:C.btnText,padding:"10px 20px"})}>+ NOUVEAU TIRAGE</button>
            </div>
            {draws.length === 0 ? (
              <div style={{background:C.card,border:"1px dashed "+C.border,borderRadius:"14px",padding:"40px",textAlign:"center",marginBottom:"36px"}}>
                <div style={{fontSize:"15px",color:C.textMd,marginBottom:"4px"}}>Aucun tirage</div>
                <div style={{fontSize:"12px",color:C.textLt}}>Cliquez sur "Nouveau tirage" pour commencer.</div>
              </div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:"10px",marginBottom:"36px"}}>
                {draws.map(function(d) {
                  const pct = d.totalTickets ? Math.round((d.soldTickets/d.totalTickets)*100) : 0;
                  const isPast = d.drawDate && new Date(d.drawDate) < new Date();
                  return (
                    <div key={d.id} style={{background:C.card,border:"1px solid "+C.border,borderRadius:"14px",overflow:"hidden",display:"flex"}}>
                      {d.image ? <div style={{width:"100px",flexShrink:0,backgroundImage:"url("+d.image+")",backgroundSize:"cover",backgroundPosition:"center"}}></div> : null}
                      <div style={{flex:1,padding:"18px 20px",display:"flex",alignItems:"center",gap:"20px"}}>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px",flexWrap:"wrap"}}>
                            <span style={{fontSize:"15px",fontWeight:"500"}}>{d.title}</span>
                            {d.location ? <span style={{fontSize:"12px",color:C.textLt}}>{d.location}</span> : null}
                            <Badge color={d.status==="active"?"green":(d.status==="drawn"?"gold":"gray")}>{(d.status||"-").toUpperCase()}</Badge>
                            {isPast && d.status==="active" ? <Badge color="red">DATE PASSEE</Badge> : null}
                            {d.winner ? <Badge color="gold">GAGNANT: {d.winner.firstName}</Badge> : null}
                          </div>
                          <div style={{background:"rgba(0,0,0,0.08)",borderRadius:"2px",height:"3px",marginBottom:"6px"}}>
                            <div style={{width:pct+"%",height:"100%",background:C.btnBg,borderRadius:"2px"}}></div>
                          </div>
                          <div style={{fontSize:"11px",color:C.textLt}}>{d.soldTickets||0}/{d.totalTickets||0} tickets - {pct}% - {fmtMoney((d.soldTickets||0)*(d.ticketPrice||0))} - Tirage le {fmtD(d.drawDate)}</div>
                        </div>
                        <button onClick={function(){setEditDraw(d);}} style={Object.assign({}, BTN, {background:"rgba(0,0,0,0.06)",color:C.textMd,border:"1px solid "+C.border,padding:"8px 14px",fontSize:"11px"})}>EDITER</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{marginBottom:"14px"}}>
              <div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt}}>ACTIVITE</div>
              <h2 style={{fontSize:"20px",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"2px",marginTop:"4px"}}>Dernieres commandes</h2>
            </div>
            {orders.length === 0 ? (
              <div style={{background:C.card,border:"1px dashed "+C.border,borderRadius:"14px",padding:"24px",textAlign:"center",fontSize:"13px",color:C.textMd}}>Aucune commande.</div>
            ) : (
              <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:"14px",overflow:"hidden"}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead>
                    <tr style={{borderBottom:"1px solid "+C.border}}>
                      {["N", "Client","Tickets","Montant","Date"].map(function(h){return <th key={h} style={{padding:"13px 20px",textAlign:"left",fontSize:"9px",letterSpacing:"2px",color:C.textLt,fontWeight:"400"}}>{h}</th>;})}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0,5).map(function(o) {
                      const ola = o.orderNumber || (o.id ? o.id.slice(-6).toUpperCase() : "");
                      return (
                        <tr key={o.id} className="row" onClick={function(){setViewOrder(o);}} style={{borderBottom:"1px solid rgba(0,0,0,0.05)"}}>
                          <td style={{padding:"12px 20px",fontSize:"11px",color:C.textMd,fontFamily:"Courier New, monospace"}}>OLA-{ola}</td>
                          <td style={{padding:"12px 20px",fontSize:"13px",fontWeight:"500"}}>{o.firstName} {o.lastName}</td>
                          <td style={{padding:"12px 20px",fontSize:"13px",color:C.textMd}}>{o.tickets||0}x</td>
                          <td style={{padding:"12px 20px",fontSize:"13px",fontWeight:"600"}}>{fmtMoney(o.amount)}</td>
                          <td style={{padding:"12px 20px",fontSize:"12px",color:C.textLt}}>{fmtD(o.createdAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}

        {!loading && tab==="draws" ? (
          <div style={{animation:"fadeUp 0.4s ease"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:"32px"}}>
              <div>
                <div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt}}>GESTION</div>
                <h1 style={{fontSize:"32px",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"3px",marginTop:"4px"}}>Tirages</h1>
              </div>
              <button onClick={function(){setShowNew(true);}} style={Object.assign({}, BTN, {background:C.btnBg,color:C.btnText,padding:"12px 24px"})}>+ CREER UN TIRAGE</button>
            </div>
            {draws.length === 0 ? (
              <div style={{background:C.card,border:"1px dashed "+C.border,borderRadius:"14px",padding:"60px",textAlign:"center"}}>
                <div style={{fontSize:"16px",marginBottom:"6px",fontWeight:"500"}}>Aucun tirage</div>
                <div style={{fontSize:"13px",color:C.textMd,marginBottom:"20px"}}>Creez votre premier tirage.</div>
                <button onClick={function(){setShowNew(true);}} style={Object.assign({}, BTN, {background:C.btnBg,color:C.btnText,padding:"12px 24px"})}>+ CREER UN TIRAGE</button>
              </div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
                {draws.map(function(d) {
                  const pct = d.totalTickets ? Math.round((d.soldTickets/d.totalTickets)*100) : 0;
                  const drawOrdersCount = orders.filter(function(o){return o.drawId===d.id;}).length;
                  const isPast = d.drawDate && new Date(d.drawDate) < new Date();
                  return (
                    <div key={d.id} style={{background:C.card,border:"1px solid "+C.border,borderRadius:"16px",overflow:"hidden"}}>
                      {d.image ? (
                        <div style={{height:"140px",backgroundImage:"url("+d.image+")",backgroundSize:"cover",backgroundPosition:"center",position:"relative"}}>
                          <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.5) 100%)"}}></div>
                          <div style={{position:"absolute",bottom:"12px",left:"20px",display:"flex",gap:"8px",alignItems:"center",flexWrap:"wrap"}}>
                            {d.location ? <span style={{background:"rgba(255,255,255,0.2)",backdropFilter:"blur(6px)",border:"1px solid rgba(255,255,255,0.3)",borderRadius:"20px",padding:"3px 10px",fontSize:"10px",color:"#fff",fontWeight:"600"}}>{d.location.toUpperCase()}</span> : null}
                            <Badge color={d.status==="active"?"green":(d.status==="drawn"?"gold":"gray")}>{(d.status||"-").toUpperCase()}</Badge>
                            {isPast && d.status==="active" ? <Badge color="red">DATE PASSEE</Badge> : null}
                          </div>
                        </div>
                      ) : null}
                      <div style={{padding:"24px"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"20px",flexWrap:"wrap",gap:"10px"}}>
                          <div>
                            <h3 style={{fontSize:"18px",fontWeight:"600",marginBottom:"4px"}}>{d.title}</h3>
                            <div style={{fontSize:"13px",color:C.textMd}}>{d.prize} {d.partner ? "- "+d.partner : ""}</div>
                            {d.winner ? <div style={{fontSize:"12px",color:"rgba(150,100,20,0.95)",marginTop:"6px",fontWeight:"600"}}>GAGNANT: {d.winner.firstName} {d.winner.lastName} - Ticket #{String(d.winner.ticketNum).padStart(3,"0")}</div> : null}
                          </div>
                          <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
                            <button onClick={function(){setViewTickets(d);}} style={Object.assign({}, BTN, {background:"rgba(0,0,0,0.06)",color:C.textMd,border:"1px solid "+C.border,padding:"9px 14px",fontSize:"11px"})}>VOIR TICKETS</button>
                            {d.status !== "drawn" ? (
                              <button onClick={function(){setDrawingDraw(d);}} style={Object.assign({}, BTN, {background:"rgba(200,140,30,0.15)",color:"rgba(150,100,20,0.95)",border:"1px solid rgba(200,140,30,0.3)",padding:"9px 14px",fontSize:"11px"})}>TIRER AU SORT</button>
                            ) : null}
                            <button onClick={function(){setLivePage(d);}} style={Object.assign({}, BTN, {background:"#1A1A1A",color:"#F0EDE7",padding:"9px 14px",fontSize:"11px"})}>MODE LIVE</button>
                            <button onClick={function(){setEditDraw(d);}} style={Object.assign({}, BTN, {background:"rgba(0,0,0,0.06)",color:C.textMd,border:"1px solid "+C.border,padding:"9px 14px",fontSize:"11px"})}>EDITER</button>
                            <button onClick={function(){deleteDraw(d.id);}} style={Object.assign({}, BTN, {background:"rgba(160,0,0,0.06)",color:"rgba(140,0,0,0.7)",border:"1px solid rgba(160,0,0,0.12)",padding:"9px 14px",fontSize:"11px"})}>SUPP</button>
                          </div>
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"12px",marginBottom:"16px"}}>
                          {[{l:"PRIX",v:fmtMoney(d.ticketPrice)},{l:"VENDUS",v:(d.soldTickets||0)+"/"+(d.totalTickets||0)},{l:"REVENUS",v:fmtMoney((d.soldTickets||0)*(d.ticketPrice||0))},{l:"COMMANDES",v:drawOrdersCount}].map(function(s,i) {
                            return (
                              <div key={i} style={{background:C.cardAlt,border:"1px solid "+C.border,borderRadius:"10px",padding:"14px"}}>
                                <div style={{fontSize:"9px",letterSpacing:"2px",color:C.textLt,marginBottom:"5px"}}>{s.l}</div>
                                <div style={{fontSize:"20px",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"1px"}}>{s.v}</div>
                              </div>
                            );
                          })}
                        </div>
                        <div style={{background:"rgba(0,0,0,0.08)",borderRadius:"3px",height:"4px"}}>
                          <div style={{width:pct+"%",height:"100%",background:C.btnBg,borderRadius:"3px"}}></div>
                        </div>
                        <div style={{display:"flex",justifyContent:"space-between",marginTop:"6px"}}>
                          <span style={{fontSize:"11px",color:C.textLt}}>Cloture: {fmtD(d.endDate)} - Tirage: {fmtD(d.drawDate)}</span>
                          <span style={{fontSize:"11px",color:C.textMd,fontWeight:"500"}}>{pct}% vendus</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}

        {!loading && tab==="orders" ? (
          <div style={{animation:"fadeUp 0.4s ease"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:"28px",flexWrap:"wrap",gap:"12px"}}>
              <div>
                <div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt}}>GESTION</div>
                <h1 style={{fontSize:"32px",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"3px",marginTop:"4px"}}>Commandes</h1>
              </div>
              <button onClick={exportCSV} style={Object.assign({}, BTN, {background:C.btnBg,color:C.btnText,padding:"10px 18px",fontSize:"11px"})}>EXPORTER CSV ({filtered.length})</button>
            </div>
            <div style={{display:"flex",gap:"10px",marginBottom:"20px",flexWrap:"wrap"}}>
              <input placeholder="Rechercher (nom, email, OLA-XXX, ticket...)..." value={orderSearch} onChange={function(e){setOrderSearch(e.target.value);}} style={Object.assign({}, INP, {flex:"1 1 300px",padding:"9px 14px"})}></input>
              <select value={orderFilter} onChange={function(e){setOrderFilter(e.target.value);}} style={Object.assign({}, INP, {width:"260px",padding:"9px 14px"})}>
                <option value="">Tous les tirages</option>
                {draws.map(function(d){return <option key={d.id} value={d.id}>{d.title}</option>;})}
              </select>
            </div>
            {filtered.length === 0 ? (
              <div style={{background:C.card,border:"1px dashed "+C.border,borderRadius:"14px",padding:"60px",textAlign:"center"}}>
                <div style={{fontSize:"16px",marginBottom:"6px",fontWeight:"500"}}>Aucune commande</div>
                <div style={{fontSize:"13px",color:C.textMd}}>{orders.length === 0 ? "Les ventes apparaitront ici." : "Aucun resultat pour cette recherche."}</div>
              </div>
            ) : (
              <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:"14px",overflow:"hidden"}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead>
                    <tr style={{borderBottom:"1px solid "+C.border}}>
                      {["N", "Client","Email","Tirage","Tickets","Montant","Date"].map(function(h){return <th key={h} style={{padding:"14px 18px",textAlign:"left",fontSize:"9px",letterSpacing:"2px",color:C.textLt,fontWeight:"400"}}>{h}</th>;})}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(function(o) {
                      const ola = o.orderNumber || (o.id ? o.id.slice(-6).toUpperCase() : "");
                      return (
                        <tr key={o.id} className="row" onClick={function(){setViewOrder(o);}} style={{borderBottom:"1px solid rgba(0,0,0,0.05)"}}>
                          <td style={{padding:"13px 18px",fontSize:"11px",color:C.textMd,fontFamily:"Courier New, monospace"}}>OLA-{ola}</td>
                          <td style={{padding:"13px 18px",fontSize:"13px",fontWeight:"500"}}>{o.firstName} {o.lastName}</td>
                          <td style={{padding:"13px 18px",fontSize:"11px",color:C.textMd}}>{o.email}</td>
                          <td style={{padding:"13px 18px",fontSize:"11px",color:C.textMd}}>{o.drawTitle || "-"}</td>
                          <td style={{padding:"13px 18px",fontSize:"13px",color:C.textMd}}>{o.tickets||0}x</td>
                          <td style={{padding:"13px 18px",fontSize:"14px",fontWeight:"600"}}>{fmtMoney(o.amount)}</td>
                          <td style={{padding:"13px 18px",fontSize:"12px",color:C.textLt}}>{fmtD(o.createdAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}

        {!loading && tab==="stats" ? (
          <div style={{animation:"fadeUp 0.4s ease"}}>
            <div style={{marginBottom:"32px"}}>
              <div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt}}>ANALYSE</div>
              <h1 style={{fontSize:"32px",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"3px",marginTop:"4px"}}>Statistiques</h1>
            </div>
            <div style={{marginBottom:"36px"}}>
              <h2 style={{fontSize:"18px",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"2px",marginBottom:"14px"}}>Revenus par tirage</h2>
              {revenueByDraw.length === 0 ? (
                <div style={{background:C.card,border:"1px dashed "+C.border,borderRadius:"14px",padding:"24px",textAlign:"center",fontSize:"13px",color:C.textMd}}>Aucune donnee.</div>
              ) : (
                <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:"14px",padding:"20px"}}>
                  {revenueByDraw.map(function(r, i) {
                    const max = revenueByDraw[0].revenue || 1;
                    const pct = (r.revenue / max) * 100;
                    return (
                      <div key={r.drawId} style={{marginBottom: i===revenueByDraw.length-1 ? 0 : "16px"}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}>
                          <span style={{fontSize:"13px",fontWeight:"500"}}>{r.title || "-"}</span>
                          <span style={{fontSize:"14px",fontWeight:"600"}}>{fmtMoney(r.revenue)} <span style={{fontSize:"11px",color:C.textLt,fontWeight:"400"}}>({r.orders} cmd)</span></span>
                        </div>
                        <div style={{background:"rgba(0,0,0,0.06)",borderRadius:"3px",height:"6px"}}>
                          <div style={{width:pct+"%",height:"100%",background:C.btnBg,borderRadius:"3px"}}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div>
              <h2 style={{fontSize:"18px",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"2px",marginBottom:"14px"}}>Top acheteurs</h2>
              {topBuyers.length === 0 ? (
                <div style={{background:C.card,border:"1px dashed "+C.border,borderRadius:"14px",padding:"24px",textAlign:"center",fontSize:"13px",color:C.textMd}}>Aucun client encore.</div>
              ) : (
                <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:"14px",overflow:"hidden"}}>
                  <table style={{width:"100%",borderCollapse:"collapse"}}>
                    <thead>
                      <tr style={{borderBottom:"1px solid "+C.border}}>
                        {["#","Client","Email","Commandes","Tickets","Total depense"].map(function(h){return <th key={h} style={{padding:"13px 18px",textAlign:"left",fontSize:"9px",letterSpacing:"2px",color:C.textLt,fontWeight:"400"}}>{h}</th>;})}
                      </tr>
                    </thead>
                    <tbody>
                      {topBuyers.map(function(b, i) {
                        return (
                          <tr key={b.email} style={{borderBottom:"1px solid rgba(0,0,0,0.05)"}}>
                            <td style={{padding:"13px 18px",fontSize:"14px",fontWeight:"700",color:C.text}}>#{i+1}</td>
                            <td style={{padding:"13px 18px",fontSize:"13px",fontWeight:"500"}}>{b.name}</td>
                            <td style={{padding:"13px 18px",fontSize:"11px",color:C.textMd}}>{b.email}</td>
                            <td style={{padding:"13px 18px",fontSize:"13px",color:C.textMd}}>{b.count}</td>
                            <td style={{padding:"13px 18px",fontSize:"13px",color:C.textMd}}>{b.tickets}</td>
                            <td style={{padding:"13px 18px",fontSize:"14px",fontWeight:"600"}}>{fmtMoney(b.total)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {!loading && tab==="settings" ? (
          <div style={{animation:"fadeUp 0.4s ease"}}>
            <div style={{marginBottom:"32px"}}>
              <div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt}}>CONFIGURATION</div>
              <h1 style={{fontSize:"32px",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"3px",marginTop:"4px"}}>Reglages</h1>
            </div>
            <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:"14px",padding:"24px",marginBottom:"20px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
                <div>
                  <div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt,marginBottom:"4px"}}>IMAGE PRINCIPALE DU SITE</div>
                  <h2 style={{fontSize:"18px",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"2px"}}>Hero personnalise</h2>
                </div>
                <Badge color={heroConfig.enabled?"green":"gray"}>{heroConfig.enabled?"ACTIVE":"DESACTIVE"}</Badge>
              </div>
              <p style={{fontSize:"13px",color:C.textMd,lineHeight:"1.6",marginBottom:"16px"}}>
                Personnalisez la grande image qui apparait en haut de la page d'accueil. Quand active, elle remplace le 1er tirage. Sinon le site affiche le tirage le plus proche.
              </p>
              {heroConfig.image ? (
                <div style={{marginBottom:"16px",borderRadius:"10px",overflow:"hidden",height:"120px"}}>
                  <img src={heroConfig.image} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}></img>
                </div>
              ) : null}
              <button onClick={function(){setShowHero(true);}} style={Object.assign({}, BTN, {background:C.btnBg,color:C.btnText,padding:"11px 22px"})}>CONFIGURER LE HERO</button>
            </div>
            <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:"14px",padding:"24px"}}>
              <div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt,marginBottom:"6px"}}>INFORMATIONS</div>
              <h2 style={{fontSize:"18px",fontFamily:"Bebas Neue, sans-serif",letterSpacing:"2px",marginBottom:"16px"}}>A propos de l'admin</h2>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
                <div style={{background:C.cardAlt,border:"1px solid "+C.border,borderRadius:"10px",padding:"14px"}}>
                  <div style={{fontSize:"9px",letterSpacing:"2px",color:C.textLt,marginBottom:"5px"}}>VERSION</div>
                  <div style={{fontSize:"15px",fontWeight:"600"}}>Admin v2</div>
                </div>
                <div style={{background:C.cardAlt,border:"1px solid "+C.border,borderRadius:"10px",padding:"14px"}}>
                  <div style={{fontSize:"9px",letterSpacing:"2px",color:C.textLt,marginBottom:"5px"}}>BASE DE DONNEES</div>
                  <div style={{fontSize:"15px",fontWeight:"600"}}>Firebase Live</div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

      </main>
    </div>
  );
}
  );
}
