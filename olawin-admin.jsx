import { useState, useEffect, useRef } from "react";

const ADMIN_PASSWORD = "olawin2026";

const INITIAL_STATE = {
  draws: [
    {
      id: 1,
      title: "Séjour Prestige Dubaï",
      prize: "Bon hôtel 15 000$",
      partner: "PrivateHonors.com",
      ticketPrice: 100,
      totalTickets: 200,
      soldTickets: 143,
      endDate: "2026-06-15",
      drawDate: "2026-06-20",
      status: "active",
      winner: null,
      stripeLinks: { 1:"",3:"",5:"",10:"",15:"",25:"",50:"" },
    },
  ],
  orders: [
    { id:"ORD001", name:"Marie D.",     email:"marie@email.com",  tickets:3,  amount:300,  date:"2026-05-10", ticketNums:[12,45,78],                          drawId:1 },
    { id:"ORD002", name:"Jean-Paul M.", email:"jpm@email.com",    tickets:2,  amount:200,  date:"2026-05-11", ticketNums:[33,99],                             drawId:1 },
    { id:"ORD003", name:"Sophie L.",    email:"sophie@email.com", tickets:5,  amount:500,  date:"2026-05-12", ticketNums:[1,2,3,4,5],                         drawId:1 },
    { id:"ORD004", name:"Ahmed B.",     email:"ahmed@email.com",  tickets:1,  amount:100,  date:"2026-05-13", ticketNums:[143],                               drawId:1 },
    { id:"ORD005", name:"Laura R.",     email:"laura@email.com",  tickets:10, amount:1000, date:"2026-05-13", ticketNums:[50,51,52,53,54,55,56,57,58,59],     drawId:1 },
    { id:"ORD006", name:"Carlos M.",    email:"carlos@email.com", tickets:15, amount:1350, date:"2026-05-14", ticketNums:[60,61,62,63,64,65,66,67,68,69,70,71,72,73,74], drawId:1 },
  ],
};

// ── COULEURS LIGHT ────────────────────────────────────────────
const C = {
  bg:       "#E8E4DC",
  sidebar:  "#DDD9D0",
  card:     "#F0EDE7",
  cardAlt:  "#E3DFD8",
  border:   "rgba(0,0,0,0.1)",
  borderSt: "rgba(0,0,0,0.15)",
  text:     "#1A1A1A",
  textMd:   "rgba(0,0,0,0.55)",
  textLt:   "rgba(0,0,0,0.38)",
  accent:   "#1A1A1A",
  btnBg:    "#1A1A1A",
  btnText:  "#F0EDE7",
};

const fmt  = (n) => `${n.toLocaleString("fr-FR")}$`;
const fmtD = (d) => new Date(d).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"});

function useLS(key, init) {
  const [v,setV] = useState(()=>{ try{const s=localStorage.getItem(key);return s?JSON.parse(s):init;}catch{return init;} });
  const set=(val)=>{setV(val);try{localStorage.setItem(key,JSON.stringify(val));}catch{}};
  return [v,set];
}

const inp = {
  width:"100%", padding:"11px 14px",
  background:"rgba(0,0,0,0.04)", border:`1px solid rgba(0,0,0,0.12)`,
  borderRadius:"9px", color:C.text, fontSize:"14px", fontFamily:"'DM Sans',sans-serif",
  outline:"none", transition:"border-color 0.2s", boxSizing:"border-box",
};
const btn = {
  padding:"10px 20px", borderRadius:"9px", border:"none",
  fontSize:"12px", fontWeight:"700", letterSpacing:"1.5px",
  cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all 0.2s",
};

// ── LOGO ──────────────────────────────────────────────────────
function Logo({ size=28 }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <polygon points="20,2 38,20 20,38 2,20" fill="none" stroke={C.text} strokeWidth="1.5"/>
        <circle cx="20" cy="20" r="7" fill="none" stroke={C.text} strokeWidth="1.5"/>
        <circle cx="20" cy="6"  r="1.5" fill={C.text}/>
        <circle cx="34" cy="20" r="1.5" fill={C.text}/>
        <circle cx="20" cy="34" r="1.5" fill={C.text}/>
        <circle cx="6"  cy="20" r="1.5" fill={C.text}/>
        <line x1="20" y1="13" x2="20" y2="6"  stroke={C.text} strokeWidth="0.8" opacity="0.3"/>
        <line x1="27" y1="20" x2="34" y2="20" stroke={C.text} strokeWidth="0.8" opacity="0.3"/>
        <line x1="20" y1="27" x2="20" y2="34" stroke={C.text} strokeWidth="0.8" opacity="0.3"/>
        <line x1="13" y1="20" x2="6"  y2="20" stroke={C.text} strokeWidth="0.8" opacity="0.3"/>
      </svg>
      <span style={{fontSize:size*0.64,letterSpacing:"4px",fontFamily:"'Bebas Neue',sans-serif",color:C.text,lineHeight:1}}>OLAWIN</span>
    </div>
  );
}

function StatCard({icon,label,value,sub}) {
  return (
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"14px",padding:"24px",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:"2px",background:C.text,opacity:0.15}}/>
      <div style={{fontSize:"22px",marginBottom:"10px"}}>{icon}</div>
      <div style={{fontSize:"28px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"2px",color:C.text,marginBottom:"3px"}}>{value}</div>
      <div style={{fontSize:"9px",letterSpacing:"2px",color:C.textLt,fontFamily:"'DM Sans',sans-serif"}}>{label}</div>
      {sub && <div style={{fontSize:"11px",color:C.textMd,marginTop:"5px",fontFamily:"'DM Sans',sans-serif"}}>{sub}</div>}
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
      fontFamily:"'DM Sans',sans-serif",
    }}>{children}</span>
  );
}

// ── SUGGESTIONS PHOTOS PAR DESTINATION ───────────────────────
const PHOTO_SUGGESTIONS = {
  "dubai":       "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80&fit=crop",
  "dubaï":       "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80&fit=crop",
  "ile maurice": "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1200&q=80&fit=crop",
  "île maurice": "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1200&q=80&fit=crop",
  "paris":       "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80&fit=crop",
  "maldives":    "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1200&q=80&fit=crop",
  "bali":        "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&q=80&fit=crop",
  "new york":    "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=1200&q=80&fit=crop",
  "tokyo":       "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&q=80&fit=crop",
  "barcelone":   "https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=1200&q=80&fit=crop",
  "rome":        "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&q=80&fit=crop",
  "miami":       "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80&fit=crop",
  "santorini":   "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1200&q=80&fit=crop",
  "londre":      "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200&q=80&fit=crop",
  "london":      "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200&q=80&fit=crop",
  "marrakech":   "https://images.unsplash.com/photo-1597212618440-806262de4f8b?w=1200&q=80&fit=crop",
  "monaco":      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80&fit=crop",
  "seychelles":  "https://images.unsplash.com/photo-1512100356356-de79b4f0f8e3?w=1200&q=80&fit=crop",
  "cappadoce":   "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=1200&q=80&fit=crop",
  "sydney":      "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1200&q=80&fit=crop",
  "singapour":   "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1200&q=80&fit=crop",
};

function getSuggestedPhoto(location) {
  if (!location) return null;
  const key = location.toLowerCase().trim();
  return PHOTO_SUGGESTIONS[key] || null;
}

// ── MODAL ÉDITION ─────────────────────────────────────────────
function DrawModal({draw, onSave, onClose, isNew=false}) {
  const [f, setF]           = useState({...draw, image: draw.image || ""});
  const [imgTab, setImgTab] = useState("upload");  // upload | url | suggest
  const [urlInput, setUrlInput] = useState(draw.image || "");
  const [dragOver, setDragOver] = useState(false);
  const [imgError, setImgError] = useState(false);
  const fileRef = useRef();

  const set = (k,v) => setF(p=>({...p,[k]:v}));

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => { set("image", e.target.result); setImgError(false); };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const applyUrl = () => {
    set("image", urlInput);
    setImgError(false);
  };

  const suggestedPhoto = getSuggestedPhoto(f.location || f.title);

  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.4)",backdropFilter:"blur(10px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"16px",overflowY:"auto"}}>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"20px",width:"100%",maxWidth:"720px",maxHeight:"95vh",overflowY:"auto",margin:"auto"}}>

        {/* Header */}
        <div style={{padding:"28px 32px 0",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"24px"}}>
          <div>
            <div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt,marginBottom:"4px",fontFamily:"'DM Sans',sans-serif"}}>{isNew?"NOUVEAU TIRAGE":"MODIFIER LE TIRAGE"}</div>
            <h2 style={{fontSize:"24px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"3px",color:C.text}}>{isNew?"CRÉER UN TIRAGE":f.title||"—"}</h2>
          </div>
          <button onClick={onClose} style={{...btn,background:"rgba(0,0,0,0.06)",color:C.textMd,border:`1px solid ${C.border}`,width:"36px",height:"36px",padding:0,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>

        <div style={{padding:"0 32px 32px"}}>

          {/* ── PHOTO ── */}
          <div style={{marginBottom:"24px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"14px"}}>
              <div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt,fontFamily:"'DM Sans',sans-serif"}}>PHOTO DE DESTINATION</div>
              <div style={{flex:1,height:"1px",background:C.border}}/>
            </div>

            {/* Preview */}
            {f.image && !imgError ? (
              <div style={{position:"relative",marginBottom:"14px",borderRadius:"12px",overflow:"hidden",height:"180px"}}>
                <img src={f.image} alt="preview"
                  onError={()=>setImgError(true)}
                  style={{width:"100%",height:"100%",objectFit:"cover"}}
                />
                <div style={{position:"absolute",inset:0,background:"linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)"}}/>
                <div style={{position:"absolute",bottom:"12px",left:"14px",fontSize:"11px",color:"rgba(255,255,255,0.8)",fontFamily:"'DM Sans',sans-serif"}}>
                  ✓ Photo sélectionnée
                </div>
                <button onClick={()=>{set("image","");setUrlInput("");setImgError(false);}} style={{
                  position:"absolute",top:"10px",right:"10px",
                  background:"rgba(0,0,0,0.5)",border:"none",borderRadius:"20px",
                  padding:"4px 10px",color:"#fff",fontSize:"11px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",
                }}>Changer</button>
              </div>
            ) : (
              <div style={{
                height:"160px",borderRadius:"12px",
                border:`2px dashed ${dragOver ? "rgba(0,0,0,0.4)" : C.border}`,
                background: dragOver ? "rgba(0,0,0,0.05)" : "rgba(0,0,0,0.02)",
                display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"8px",
                marginBottom:"14px",transition:"all 0.2s",cursor:"pointer",
              }}
                onClick={()=>fileRef.current?.click()}
                onDragOver={e=>{e.preventDefault();setDragOver(true);}}
                onDragLeave={()=>setDragOver(false)}
                onDrop={handleDrop}
              >
                <div style={{fontSize:"32px"}}>🖼️</div>
                <div style={{fontSize:"13px",color:C.textMd,fontFamily:"'DM Sans',sans-serif",fontWeight:"500"}}>Glisser une photo ici</div>
                <div style={{fontSize:"11px",color:C.textLt,fontFamily:"'DM Sans',sans-serif"}}>ou cliquer pour parcourir — JPG, PNG, WEBP</div>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}}
              onChange={e=>handleFile(e.target.files[0])}
            />

            {/* Onglets méthodes */}
            <div style={{display:"flex",gap:"6px",marginBottom:"12px"}}>
              {[
                {id:"upload",  label:"📁 Depuis mon ordi"},
                {id:"url",     label:"🔗 Lien URL"},
                {id:"suggest", label:"✨ Suggestions"},
              ].map(t=>(
                <button key={t.id} onClick={()=>setImgTab(t.id)} style={{
                  ...btn, padding:"7px 14px", fontSize:"11px",
                  background: imgTab===t.id ? C.btnBg : "rgba(0,0,0,0.05)",
                  color:      imgTab===t.id ? C.btnText : C.textMd,
                  border:     `1px solid ${imgTab===t.id ? C.btnBg : C.border}`,
                  letterSpacing:"0.5px",
                }}>{t.label}</button>
              ))}
            </div>

            {/* Upload */}
            {imgTab==="upload" && (
              <div style={{display:"flex",gap:"8px"}}>
                <button onClick={()=>fileRef.current?.click()} style={{
                  ...btn, flex:1, padding:"11px",
                  background:"rgba(0,0,0,0.05)", color:C.textMd,
                  border:`1px solid ${C.border}`, fontSize:"12px",
                }}>
                  📁 Choisir un fichier image
                </button>
              </div>
            )}

            {/* URL */}
            {imgTab==="url" && (
              <div style={{display:"flex",gap:"8px"}}>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/photo-... ou lien direct"
                  value={urlInput}
                  onChange={e=>setUrlInput(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&applyUrl()}
                  style={{...inp,flex:1,fontSize:"13px"}}
                  onFocus={e=>e.target.style.borderColor="rgba(0,0,0,0.4)"}
                  onBlur={e=>e.target.style.borderColor="rgba(0,0,0,0.12)"}
                />
                <button onClick={applyUrl} style={{
                  ...btn, padding:"11px 18px",
                  background:C.btnBg, color:C.btnText, fontSize:"12px",
                  whiteSpace:"nowrap",
                }}>Appliquer</button>
              </div>
            )}

            {/* Suggestions automatiques */}
            {imgTab==="suggest" && (
              <div>
                <div style={{fontSize:"12px",color:C.textMd,fontFamily:"'DM Sans',sans-serif",marginBottom:"10px"}}>
                  {suggestedPhoto
                    ? `Photo trouvée pour "${f.location || f.title}" :`
                    : "Renseignez d'abord la destination ou choisissez une ville ci-dessous :"}
                </div>
                {suggestedPhoto && (
                  <div style={{display:"flex",gap:"10px",alignItems:"center",marginBottom:"12px"}}>
                    <img src={suggestedPhoto} alt="suggestion" style={{width:"80px",height:"54px",objectFit:"cover",borderRadius:"8px",border:`1px solid ${C.border}`}}/>
                    <button onClick={()=>{set("image",suggestedPhoto);setImgError(false);}} style={{
                      ...btn, padding:"9px 18px", background:C.btnBg, color:C.btnText, fontSize:"12px",
                    }}>Utiliser cette photo</button>
                  </div>
                )}
                <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
                  {Object.keys(PHOTO_SUGGESTIONS).filter((_,i)=>i%2===0).map(city=>(
                    <button key={city} onClick={()=>{set("image",PHOTO_SUGGESTIONS[city]);setImgError(false);}} style={{
                      ...btn, padding:"6px 12px", fontSize:"11px", letterSpacing:"0.5px",
                      background:"rgba(0,0,0,0.05)", color:C.textMd,
                      border:`1px solid ${C.border}`,
                      textTransform:"capitalize",
                    }}>
                      {city.charAt(0).toUpperCase()+city.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── INFOS DU TIRAGE ── */}
          <div style={{marginBottom:"20px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"14px"}}>
              <div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt,fontFamily:"'DM Sans',sans-serif"}}>INFORMATIONS</div>
              <div style={{flex:1,height:"1px",background:C.border}}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
              {[
                {k:"title",       l:"NOM DU TIRAGE",       t:"text",   ph:"Séjour Prestige..."},
                {k:"location",    l:"DESTINATION / VILLE", t:"text",   ph:"Dubaï, Maldives..."},
                {k:"prize",       l:"PRIX À GAGNER",       t:"text",   ph:"Bon hôtel 10 000$"},
                {k:"partner",     l:"PARTENAIRE",          t:"text",   ph:"PrivateHonors.com"},
                {k:"ticketPrice", l:"PRIX TICKET ($)",     t:"number", ph:"100"},
                {k:"totalTickets",l:"TOTAL TICKETS",       t:"number", ph:"200"},
                {k:"endDate",     l:"DATE CLÔTURE",        t:"date"},
                {k:"drawDate",    l:"DATE DU TIRAGE",      t:"date"},
              ].map(fi => (
                <div key={fi.k}>
                  <div style={{fontSize:"9px",letterSpacing:"2px",color:C.textLt,marginBottom:"6px",fontFamily:"'DM Sans',sans-serif"}}>{fi.l}</div>
                  <input type={fi.t} placeholder={fi.ph||""} value={f[fi.k]||""}
                    onChange={e=>{
                      const val = fi.t==="number"?+e.target.value:e.target.value;
                      set(fi.k, val);
                      // Auto-suggestion photo quand on tape la destination
                      if (fi.k==="location") {
                        const sugg = getSuggestedPhoto(e.target.value);
                        if (sugg && !f.image) set("image", sugg);
                      }
                    }}
                    style={inp}
                    onFocus={e=>e.target.style.borderColor="rgba(0,0,0,0.4)"}
                    onBlur={e=>e.target.style.borderColor="rgba(0,0,0,0.12)"}
                  />
                </div>
              ))}
            </div>
            <div style={{marginTop:"12px"}}>
              <div style={{fontSize:"9px",letterSpacing:"2px",color:C.textLt,marginBottom:"6px",fontFamily:"'DM Sans',sans-serif"}}>DESCRIPTION</div>
              <textarea placeholder="Description du séjour..." value={f.description||""}
                onChange={e=>set("description",e.target.value)}
                rows={3}
                style={{...inp,resize:"vertical",lineHeight:"1.5"}}
                onFocus={e=>e.target.style.borderColor="rgba(0,0,0,0.4)"}
                onBlur={e=>e.target.style.borderColor="rgba(0,0,0,0.12)"}
              />
            </div>
          </div>

          {/* ── LIENS STRIPE ── */}
          <div style={{marginBottom:"20px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"12px"}}>
              <div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt,fontFamily:"'DM Sans',sans-serif"}}>LIENS STRIPE</div>
              <div style={{flex:1,height:"1px",background:C.border}}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
              {[1,3,5,10,15,25,50].map(n => (
                <div key={n} style={{display:"grid",gridTemplateColumns:"52px 1fr",gap:"7px",alignItems:"center"}}>
                  <div style={{background:"rgba(0,0,0,0.05)",border:`1px solid ${C.border}`,borderRadius:"7px",padding:"8px",textAlign:"center",fontSize:"12px",color:C.textMd,fontFamily:"'DM Sans',sans-serif"}}>
                    {n}x
                  </div>
                  <input type="text" placeholder="buy.stripe.com/..."
                    value={f.stripeLinks?.[n]||""}
                    onChange={e=>set("stripeLinks",{...f.stripeLinks,[n]:e.target.value})}
                    style={{...inp,fontSize:"11px",padding:"9px 10px"}}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ── STATUT ── */}
          <div style={{marginBottom:"24px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"10px"}}>
              <div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt,fontFamily:"'DM Sans',sans-serif"}}>STATUT</div>
              <div style={{flex:1,height:"1px",background:C.border}}/>
            </div>
            <div style={{display:"flex",gap:"8px"}}>
              {["active","closed","drawn"].map(s=>(
                <button key={s} onClick={()=>set("status",s)} style={{
                  ...btn, flex:1, padding:"10px", textTransform:"uppercase", fontSize:"10px",
                  background: f.status===s ? C.btnBg : "rgba(0,0,0,0.04)",
                  color:      f.status===s ? C.btnText : C.textMd,
                  border:     `1px solid ${f.status===s ? C.btnBg : C.border}`,
                }}>{s}</button>
              ))}
            </div>
          </div>

          {/* ── ACTIONS ── */}
          <div style={{display:"flex",gap:"10px"}}>
            <button onClick={()=>onSave(f)} style={{...btn,flex:1,padding:"14px",background:C.btnBg,color:C.btnText,boxShadow:"0 4px 16px rgba(0,0,0,0.15)",fontSize:"13px"}}>
              {isNew?"✨ CRÉER LE TIRAGE":"💾 SAUVEGARDER"}
            </button>
            <button onClick={onClose} style={{...btn,padding:"14px 20px",background:"rgba(0,0,0,0.05)",color:C.textMd,border:`1px solid ${C.border}`}}>
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── EXPLICATION DU TIRAGE ─────────────────────────────────────
function DrawExplanation() {
  const steps = [
    {
      num:"01", icon:"🔒", title:"Clôture des ventes",
      desc:"À la date de clôture, les achats sont automatiquement bloqués sur le site. Aucun nouveau ticket ne peut être acheté. La liste finale des participants est figée.",
      detail:"Stripe cesse d'accepter les paiements via les liens de paiement du tirage concerné.",
    },
    {
      num:"02", icon:"📋", title:"Liste complète des tickets",
      desc:"Tous les numéros de tickets vendus sont compilés dans une liste unique. Chaque ticket acheté correspond à un numéro unique entre 1 et le total vendu.",
      detail:"Exemple : 143 tickets vendus → liste de #001 à #143. Un participant ayant acheté 5 tickets possède 5 numéros distincts.",
    },
    {
      num:"03", icon:"🎲", title:"Tirage aléatoire certifié",
      desc:"Un algorithme de tirage aléatoire sélectionne un numéro parmi tous les tickets valides. Le résultat est imprévisible et ne peut pas être influencé.",
      detail:"En production, nous recommandons d'utiliser un service certifié comme Random.org (générateur de nombres aléatoires basé sur des phénomènes atmosphériques) pour garantir l'impartialité totale.",
    },
    {
      num:"04", icon:"📺", title:"Diffusion en direct",
      desc:"Le tirage est filmé et diffusé en direct sur vos réseaux sociaux (Instagram Live, YouTube Live, TikTok Live). Les spectateurs voient le numéro gagnant apparaître en temps réel.",
      detail:"Vous partagez l'écran montrant le système de tirage, le numéro sélectionné, puis vous annoncez publiquement le nom du gagnant.",
    },
    {
      num:"05", icon:"🏆", title:"Annonce du gagnant",
      desc:"Le gagnant est identifié en consultant la liste des commandes. Son nom est annoncé publiquement en direct. L'enregistrement du live est conservé comme preuve.",
      detail:"Dans votre Admin Panel → onglet Commandes → rechercher le numéro gagnant → identifier le participant.",
    },
    {
      num:"06", icon:"📧", title:"Remise du bon",
      desc:"Le gagnant reçoit un email dans les 48h avec son bon PrivateHonors de 15 000$. Le bon est nominatif et directement utilisable sur hotels.privatehonors.com.",
      detail:"Vous contactez le gagnant via l'email enregistré dans la commande. Le code du bon PrivateHonors lui est transmis de façon sécurisée.",
    },
  ];

  return (
    <div style={{animation:"fadeUp 0.4s ease"}}>
      <div style={{marginBottom:"40px"}}>
        <div style={{fontSize:"9px",letterSpacing:"4px",color:C.textLt,marginBottom:"8px",fontFamily:"'DM Sans',sans-serif"}}>PROCESSUS</div>
        <h1 style={{fontSize:"36px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"4px",color:C.text,marginBottom:"8px"}}>COMMENT SE DÉROULE LE TIRAGE</h1>
        <p style={{fontSize:"14px",color:C.textMd,fontFamily:"'DM Sans',sans-serif",lineHeight:"1.7",maxWidth:"600px"}}>
          Guide complet étape par étape — de la clôture des ventes à la remise du bon gagnant.
        </p>
      </div>

      {/* Timeline */}
      <div style={{position:"relative"}}>
        {/* Ligne verticale */}
        <div style={{
          position:"absolute",left:"28px",top:"40px",bottom:"40px",
          width:"1px",background:`linear-gradient(to bottom, ${C.border}, transparent)`,
        }}/>

        <div style={{display:"flex",flexDirection:"column",gap:"4px"}}>
          {steps.map((s,i) => (
            <div key={i} style={{
              display:"flex",gap:"24px",alignItems:"flex-start",
              background: i===0 || i===2 || i===4 ? C.card : "transparent",
              border: i===0 || i===2 || i===4 ? `1px solid ${C.border}` : "1px solid transparent",
              borderRadius:"14px",padding:"24px",marginBottom:"4px",
              position:"relative",
            }}>
              {/* Numéro cercle */}
              <div style={{
                width:"56px",height:"56px",borderRadius:"50%",flexShrink:0,
                background: i===2 ? C.btnBg : C.cardAlt,
                border:`1px solid ${i===2 ? C.btnBg : C.border}`,
                display:"flex",alignItems:"center",justifyContent:"center",
                flexDirection:"column",
              }}>
                <span style={{fontSize:"18px",lineHeight:1}}>{s.icon}</span>
              </div>

              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"8px"}}>
                  <span style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt,fontFamily:"'DM Sans',sans-serif"}}>ÉTAPE {s.num}</span>
                  {i===2 && <span style={{background:"rgba(0,0,0,0.08)",border:`1px solid rgba(0,0,0,0.15)`,borderRadius:"20px",padding:"2px 10px",fontSize:"9px",letterSpacing:"1.5px",color:C.text,fontFamily:"'DM Sans',sans-serif"}}>CLEF</span>}
                </div>
                <h3 style={{fontSize:"18px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"2px",color:C.text,marginBottom:"8px"}}>{s.title.toUpperCase()}</h3>
                <p style={{fontSize:"14px",color:C.text,fontFamily:"'DM Sans',sans-serif",lineHeight:"1.7",marginBottom:"10px"}}>{s.desc}</p>
                <div style={{
                  background:"rgba(0,0,0,0.04)",border:`1px solid ${C.border}`,
                  borderRadius:"8px",padding:"12px 14px",
                  fontSize:"12px",color:C.textMd,fontFamily:"'DM Sans',sans-serif",lineHeight:"1.6",
                  borderLeft:`3px solid rgba(0,0,0,0.2)`,
                }}>
                  💡 {s.detail}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bloc Random.org */}
      <div style={{
        marginTop:"32px",
        background:C.card,border:`1px solid ${C.border}`,borderRadius:"16px",padding:"32px",
      }}>
        <div style={{fontSize:"9px",letterSpacing:"4px",color:C.textLt,marginBottom:"12px",fontFamily:"'DM Sans',sans-serif"}}>RECOMMANDATION</div>
        <h3 style={{fontSize:"20px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"3px",marginBottom:"12px"}}>UTILISER RANDOM.ORG POUR LE TIRAGE</h3>
        <p style={{fontSize:"14px",color:C.textMd,fontFamily:"'DM Sans',sans-serif",lineHeight:"1.75",marginBottom:"20px"}}>
          Random.org est un générateur de nombres aléatoires certifié, reconnu internationalement. Il génère des nombres basés sur du bruit atmosphérique réel — pas un algorithme informatique. C'est la référence pour les tirages publics transparents.
        </p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"12px",marginBottom:"20px"}}>
          {[
            {t:"Gratuit",d:"Utilisable sans compte pour des tirages simples"},
            {t:"Certifié",d:"Reconnu comme aléatoire vrai par des auditeurs indépendants"},
            {t:"Transparent",d:"Vous partagez l'URL en direct — tout le monde voit le résultat"},
          ].map((c,i)=>(
            <div key={i} style={{background:C.cardAlt,border:`1px solid ${C.border}`,borderRadius:"10px",padding:"16px"}}>
              <div style={{fontSize:"13px",fontWeight:"600",color:C.text,marginBottom:"4px",fontFamily:"'DM Sans',sans-serif"}}>{c.t}</div>
              <div style={{fontSize:"12px",color:C.textMd,fontFamily:"'DM Sans',sans-serif",lineHeight:"1.5"}}>{c.d}</div>
            </div>
          ))}
        </div>
        <div style={{
          background:"rgba(0,0,0,0.04)",border:`1px solid ${C.border}`,
          borderRadius:"10px",padding:"16px 18px",
          display:"flex",alignItems:"center",gap:"12px",
        }}>
          <div style={{fontSize:"20px"}}>🔗</div>
          <div>
            <div style={{fontSize:"12px",fontWeight:"600",color:C.text,fontFamily:"'DM Sans',sans-serif",marginBottom:"2px"}}>Mode d'emploi</div>
            <div style={{fontSize:"12px",color:C.textMd,fontFamily:"'DM Sans',sans-serif"}}>
              Aller sur <strong>random.org</strong> → "Integer Generator" → Min: 1 → Max: [nombre de tickets vendus] → Générer → Le numéro obtenu est le ticket gagnant
            </div>
          </div>
        </div>
      </div>

      {/* FAQ rapide */}
      <div style={{marginTop:"24px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
        {[
          {q:"Que faire si le gagnant ne répond pas ?",a:"Relancer par email 3 fois sur 7 jours. Sans réponse, un nouveau tirage peut être organisé selon vos CGU."},
          {q:"Faut-il filmer le tirage ?",a:"Oui, fortement recommandé. Le live est la meilleure preuve de transparence et renforce la confiance des participants."},
          {q:"Le tirage peut-il être annulé ?",a:"Oui, si force majeure. Dans ce cas tous les participants sont remboursés intégralement via Stripe dans les 14 jours."},
          {q:"Comment prouver l'équité ?",a:"Diffusez en live, conservez l'enregistrement, utilisez Random.org et affichez le numéro gagnant avec le nom du participant publiquement."},
        ].map((f,i)=>(
          <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"12px",padding:"18px"}}>
            <div style={{fontSize:"13px",fontWeight:"600",color:C.text,marginBottom:"6px",fontFamily:"'DM Sans',sans-serif"}}>{f.q}</div>
            <div style={{fontSize:"12px",color:C.textMd,fontFamily:"'DM Sans',sans-serif",lineHeight:"1.6"}}>{f.a}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ADMIN PRINCIPAL ───────────────────────────────────────────
export default function OlawinAdmin() {
  const [authed, setAuthed]         = useState(false);
  const [pw, setPw]                 = useState("");
  const [pwErr, setPwErr]           = useState(false);
  const [tab, setTab]               = useState("dashboard");
  const [data, setData]             = useLS("olawin_admin_v2", INITIAL_STATE);
  const [editDraw, setEditDraw]     = useState(null);
  const [showNew, setShowNew]       = useState(false);
  const [notif, setNotif]           = useState(null);
  const [orderSearch, setOrderSearch] = useState("");

  const notify = (msg, type="ok") => { setNotif({msg,type}); setTimeout(()=>setNotif(null),3000); };
  const saveDraw  = (d) => { setData({...data,draws:data.draws.map(x=>x.id===d.id?d:x)}); setEditDraw(null); notify("Tirage mis à jour ✓"); };
  const createDraw = (d) => { setData({...data,draws:[...data.draws,{...d,id:Date.now(),soldTickets:0,winner:null}]}); setShowNew(false); notify("Tirage créé ✓"); };
  const deleteDraw = (id) => { if(!window.confirm("Supprimer ce tirage ?"))return; setData({...data,draws:data.draws.filter(x=>x.id!==id)}); notify("Supprimé","err"); };

  const totalRevenue = data.orders.reduce((s,o)=>s+o.amount,0);
  const totalTickets = data.orders.reduce((s,o)=>s+o.tickets,0);
  const activeDraws  = data.draws.filter(d=>d.status==="active").length;
  const filtered     = data.orders.filter(o=>
    o.name.toLowerCase().includes(orderSearch.toLowerCase())||
    o.email.toLowerCase().includes(orderSearch.toLowerCase())||
    o.id.toLowerCase().includes(orderSearch.toLowerCase())
  );

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&family=DM+Mono&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    input::placeholder{color:rgba(0,0,0,0.25);}
    input:focus{outline:none;}
    ::-webkit-scrollbar{width:4px;background:${C.bg};}
    ::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.12);border-radius:4px;}
    @keyframes fadeUp{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
    @keyframes slideIn{from{transform:translateX(100%);opacity:0;}to{transform:translateX(0);opacity:1;}}
    @keyframes pop{0%{transform:scale(.6);opacity:0;}80%{transform:scale(1.04);}100%{transform:scale(1);opacity:1;}}
    .tab-btn:hover{color:${C.text} !important;}
    .row:hover{background:rgba(0,0,0,0.03);}
    .act-btn:hover{opacity:0.75;}
  `;

  // ── LOGIN ─────────────────────────────────────────────────────
  if (!authed) return (
    <div style={{background:C.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif",color:C.text}}>
      <style>{CSS}</style>
      <div style={{width:"360px",animation:"fadeUp 0.4s ease"}}>
        <div style={{textAlign:"center",marginBottom:"40px"}}>
          <Logo size={36}/>
          <div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt,fontFamily:"'DM Sans',sans-serif",marginTop:"8px"}}>ESPACE ADMINISTRATEUR</div>
        </div>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"16px",padding:"32px"}}>
          <div style={{fontSize:"9px",letterSpacing:"2px",color:C.textLt,marginBottom:"7px"}}>MOT DE PASSE</div>
          <input type="password" placeholder="••••••••••" value={pw}
            onChange={e=>{setPw(e.target.value);setPwErr(false);}}
            onKeyDown={e=>e.key==="Enter"&&(pw===ADMIN_PASSWORD?setAuthed(true):setPwErr(true))}
            style={{...inp,marginBottom:"12px",borderColor:pwErr?"rgba(180,0,0,0.3)":"rgba(0,0,0,0.12)"}}
            autoFocus
          />
          {pwErr && <div style={{fontSize:"12px",color:"rgba(160,0,0,0.7)",marginBottom:"12px"}}>Mot de passe incorrect</div>}
          <button onClick={()=>pw===ADMIN_PASSWORD?setAuthed(true):setPwErr(true)} style={{...btn,width:"100%",padding:"14px",background:C.btnBg,color:C.btnText}}>
            SE CONNECTER →
          </button>
        </div>
        <div style={{textAlign:"center",marginTop:"16px",fontSize:"11px",color:C.textLt}}>Démo : olawin2026</div>
      </div>
    </div>
  );

  return (
    <div style={{background:C.bg,minHeight:"100vh",color:C.text,fontFamily:"'DM Sans',sans-serif",display:"grid",gridTemplateColumns:"220px 1fr"}}>
      <style>{CSS}</style>

      {/* Modals */}
      {editDraw && <DrawModal draw={editDraw} onSave={saveDraw} onClose={()=>setEditDraw(null)}/>}
      {showNew  && <DrawModal draw={{title:"",location:"",prize:"",partner:"PrivateHonors.com",ticketPrice:100,totalTickets:200,soldTickets:0,endDate:"",drawDate:"",status:"active",image:"",description:"",stripeLinks:{}}} onSave={createDraw} onClose={()=>setShowNew(false)} isNew/>}

      {/* Notif */}
      {notif && (
        <div style={{
          position:"fixed",top:"20px",right:"20px",zIndex:300,
          background: notif.type==="err" ? "#8B0000" : C.btnBg,
          color:C.btnText,borderRadius:"10px",padding:"13px 20px",
          fontSize:"13px",fontWeight:"600",boxShadow:"0 8px 24px rgba(0,0,0,0.2)",
          animation:"slideIn 0.3s ease",
        }}>{notif.msg}</div>
      )}

      {/* SIDEBAR */}
      <aside style={{background:C.sidebar,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh"}}>
        <div style={{padding:"28px 24px 20px",borderBottom:`1px solid ${C.border}`}}>
          <Logo size={26}/>
          <div style={{fontSize:"9px",letterSpacing:"2px",color:C.textLt,marginTop:"6px"}}>ADMIN PANEL</div>
        </div>
        <nav style={{padding:"20px 14px",flex:1}}>
          {[
            {id:"dashboard",  icon:"◈", label:"Dashboard"},
            {id:"draws",      icon:"▣", label:"Tirages"},
            {id:"orders",     icon:"≡", label:"Commandes"},
            {id:"tirage",     icon:"◎", label:"Guide Tirage"},
          ].map(item=>(
            <button key={item.id} onClick={()=>setTab(item.id)} className="tab-btn" style={{
              width:"100%",display:"flex",alignItems:"center",gap:"10px",
              padding:"10px 12px",borderRadius:"8px",border:"none",
              background: tab===item.id ? "rgba(0,0,0,0.08)" : "transparent",
              color: tab===item.id ? C.text : C.textLt,
              fontSize:"13px",cursor:"pointer",marginBottom:"3px",
              borderLeft:`2px solid ${tab===item.id ? C.text : "transparent"}`,
              textAlign:"left",letterSpacing:"0.3px",transition:"all 0.18s",
            }}>
              <span style={{fontSize:"15px"}}>{item.icon}</span>{item.label}
              {item.id==="tirage" && (
                <span style={{marginLeft:"auto",background:"rgba(0,0,0,0.07)",border:`1px solid ${C.border}`,borderRadius:"10px",padding:"1px 7px",fontSize:"9px",color:C.textMd,letterSpacing:"1px"}}>
                  NOUVEAU
                </span>
              )}
            </button>
          ))}
        </nav>
        <div style={{padding:"16px",borderTop:`1px solid ${C.border}`}}>
          <button onClick={()=>setAuthed(false)} style={{...btn,width:"100%",padding:"10px",background:"rgba(0,0,0,0.05)",color:C.textMd,border:`1px solid ${C.border}`,fontSize:"11px"}}>
            DÉCONNEXION
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{padding:"40px 44px",overflowY:"auto"}}>

        {/* ── DASHBOARD ── */}
        {tab==="dashboard" && (
          <div style={{animation:"fadeUp 0.4s ease"}}>
            <div style={{marginBottom:"36px"}}>
              <div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt,marginBottom:"6px"}}>TABLEAU DE BORD</div>
              <h1 style={{fontSize:"32px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"3px",marginBottom:"4px"}}>Bonjour 👋</h1>
              <p style={{color:C.textMd,fontSize:"13px"}}>
                {new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
              </p>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"14px",marginBottom:"36px"}}>
              <StatCard icon="💰" label="REVENUS TOTAUX"  value={fmt(totalRevenue)}        sub={`${data.orders.length} commandes`}/>
              <StatCard icon="🎟️" label="TICKETS VENDUS"  value={totalTickets}              sub="tous tirages"/>
              <StatCard icon="▣"  label="TIRAGES ACTIFS"  value={activeDraws}               sub={`${data.draws.length} au total`}/>
              <StatCard icon="👥" label="PARTICIPANTS"     value={data.orders.length}        sub="acheteurs uniques"/>
            </div>

            {/* Tirages rapides */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"}}>
              <div>
                <div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt}}>TIRAGES</div>
                <h2 style={{fontSize:"20px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"2px",marginTop:"4px"}}>En cours</h2>
              </div>
              <button onClick={()=>setShowNew(true)} style={{...btn,background:C.btnBg,color:C.btnText,padding:"10px 20px"}}>+ NOUVEAU TIRAGE</button>
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:"10px",marginBottom:"36px"}}>
              {data.draws.map(d=>{
                const pct=Math.round((d.soldTickets/d.totalTickets)*100);
                return (
                  <div key={d.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"14px",overflow:"hidden",display:"flex",alignItems:"stretch"}}>
                    {/* Photo thumbnail */}
                    {d.image && (
                      <div style={{
                        width:"100px", flexShrink:0,
                        backgroundImage:`url(${d.image})`,
                        backgroundSize:"cover", backgroundPosition:"center",
                      }}/>
                    )}
                    <div style={{flex:1,padding:"18px 20px",display:"flex",alignItems:"center",gap:"20px"}}>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px"}}>
                        <span style={{fontSize:"15px",fontWeight:"500"}}>{d.title}</span>
                        {d.location && <span style={{fontSize:"12px",color:C.textLt,fontFamily:"'DM Sans',sans-serif"}}>· {d.location}</span>}
                        <Badge green={d.status==="active"}>{d.status.toUpperCase()}</Badge>
                      </div>
                      <div style={{background:"rgba(0,0,0,0.08)",borderRadius:"2px",height:"3px",marginBottom:"6px"}}>
                        <div style={{width:`${pct}%`,height:"100%",background:C.btnBg,borderRadius:"2px",transition:"width 1s"}}/>
                      </div>
                      <div style={{fontSize:"11px",color:C.textLt}}>
                        {d.soldTickets}/{d.totalTickets} tickets · {pct}% · {fmt(d.soldTickets*d.ticketPrice)}
                      </div>
                    </div>
                    <div style={{display:"flex",gap:"8px"}}>
                      <button onClick={()=>setEditDraw(d)} className="act-btn" style={{...btn,background:"rgba(0,0,0,0.06)",color:C.textMd,border:`1px solid ${C.border}`,padding:"8px 14px",fontSize:"11px"}}>
                        ✏️ ÉDITER
                      </button>
                    </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Dernières commandes */}
            <div style={{marginBottom:"14px"}}>
              <div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt}}>ACTIVITÉ</div>
              <h2 style={{fontSize:"20px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"2px",marginTop:"4px"}}>Dernières commandes</h2>
            </div>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"14px",overflow:"hidden"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead>
                  <tr style={{borderBottom:`1px solid ${C.border}`}}>
                    {["ID","Client","Tickets","Montant","Date"].map(h=>(
                      <th key={h} style={{padding:"13px 20px",textAlign:"left",fontSize:"9px",letterSpacing:"2px",color:C.textLt,fontWeight:"400"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.orders.slice(-5).reverse().map(o=>(
                    <tr key={o.id} className="row" style={{borderBottom:`1px solid rgba(0,0,0,0.05)`,transition:"background 0.15s"}}>
                      <td style={{padding:"12px 20px",fontSize:"11px",color:C.textLt,fontFamily:"'DM Mono',monospace"}}>{o.id}</td>
                      <td style={{padding:"12px 20px",fontSize:"13px",fontWeight:"500"}}>{o.name}</td>
                      <td style={{padding:"12px 20px",fontSize:"13px",color:C.textMd}}>{o.tickets}x</td>
                      <td style={{padding:"12px 20px",fontSize:"13px",fontWeight:"600"}}>{fmt(o.amount)}</td>
                      <td style={{padding:"12px 20px",fontSize:"12px",color:C.textLt}}>{fmtD(o.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TIRAGES ── */}
        {tab==="draws" && (
          <div style={{animation:"fadeUp 0.4s ease"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:"32px"}}>
              <div>
                <div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt}}>GESTION</div>
                <h1 style={{fontSize:"32px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"3px",marginTop:"4px"}}>Tirages</h1>
              </div>
              <button onClick={()=>setShowNew(true)} style={{...btn,background:C.btnBg,color:C.btnText,padding:"12px 24px"}}>+ CRÉER UN TIRAGE</button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
              {data.draws.map(d=>{
                const pct=Math.round((d.soldTickets/d.totalTickets)*100);
                const drawOrders=data.orders.filter(o=>o.drawId===d.id);
                return (
                  <div key={d.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"16px",overflow:"hidden"}}>
                    {/* Photo banner */}
                    {d.image && (
                      <div style={{
                        height:"140px",
                        backgroundImage:`url(${d.image})`,
                        backgroundSize:"cover",backgroundPosition:"center",
                        position:"relative",
                      }}>
                        <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.5) 100%)"}}/>
                        <div style={{position:"absolute",bottom:"12px",left:"20px",display:"flex",gap:"8px",alignItems:"center"}}>
                          {d.location && <span style={{background:"rgba(255,255,255,0.2)",backdropFilter:"blur(6px)",border:"1px solid rgba(255,255,255,0.3)",borderRadius:"20px",padding:"3px 10px",fontSize:"10px",color:"#fff",fontFamily:"'DM Sans',sans-serif",letterSpacing:"1px"}}>{d.location.toUpperCase()}</span>}
                          <Badge green={d.status==="active"}>{d.status.toUpperCase()}</Badge>
                        </div>
                      </div>
                    )}
                    <div style={{padding:"24px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"20px"}}>
                      <div>
                        {!d.image && (
                          <div style={{display:"flex",gap:"8px",alignItems:"center",marginBottom:"6px"}}>
                            <h3 style={{fontSize:"18px",fontWeight:"600"}}>{d.title}</h3>
                            <Badge green={d.status==="active"}>{d.status.toUpperCase()}</Badge>
                          </div>
                        )}
                        {d.image && <h3 style={{fontSize:"18px",fontWeight:"600",marginBottom:"4px"}}>{d.title}</h3>}
                        <div style={{fontSize:"13px",color:C.textMd}}>{d.prize} · {d.partner}</div>
                        {d.winner && (
                          <div style={{marginTop:"8px",background:"rgba(0,100,50,0.06)",border:"1px solid rgba(0,100,50,0.15)",borderRadius:"8px",padding:"8px 14px",fontSize:"12px",color:"rgba(0,80,40,0.9)",display:"inline-block"}}>
                            🏆 Gagnant : {d.winner.owner} — Ticket #{d.winner.num}
                          </div>
                        )}
                      </div>
                      <div style={{display:"flex",gap:"8px"}}>
                        <button onClick={()=>setEditDraw(d)} style={{...btn,background:"rgba(0,0,0,0.06)",color:C.textMd,border:`1px solid ${C.border}`,padding:"9px 16px",fontSize:"11px"}}>✏️ ÉDITER</button>
                        <button onClick={()=>deleteDraw(d.id)} style={{...btn,background:"rgba(160,0,0,0.06)",color:"rgba(140,0,0,0.7)",border:"1px solid rgba(160,0,0,0.12)",padding:"9px 14px",fontSize:"11px"}}>🗑</button>
                      </div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"12px",marginBottom:"16px"}}>
                      {[
                        {l:"PRIX TICKET",v:fmt(d.ticketPrice)},
                        {l:"TICKETS VENDUS",v:`${d.soldTickets}/${d.totalTickets}`},
                        {l:"REVENUS",v:fmt(d.soldTickets*d.ticketPrice)},
                        {l:"COMMANDES",v:drawOrders.length},
                      ].map((s,i)=>(
                        <div key={i} style={{background:C.cardAlt,border:`1px solid ${C.border}`,borderRadius:"10px",padding:"14px"}}>
                          <div style={{fontSize:"9px",letterSpacing:"2px",color:C.textLt,marginBottom:"5px"}}>{s.l}</div>
                          <div style={{fontSize:"20px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"1px"}}>{s.v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{background:"rgba(0,0,0,0.08)",borderRadius:"3px",height:"4px"}}>
                      <div style={{width:`${pct}%`,height:"100%",background:C.btnBg,borderRadius:"3px",transition:"width 1s"}}/>
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
          </div>
        )}

        {/* ── COMMANDES ── */}
        {tab==="orders" && (
          <div style={{animation:"fadeUp 0.4s ease"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:"28px"}}>
              <div>
                <div style={{fontSize:"9px",letterSpacing:"3px",color:C.textLt}}>GESTION</div>
                <h1 style={{fontSize:"32px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"3px",marginTop:"4px"}}>Commandes</h1>
              </div>
              <div style={{display:"flex",gap:"8px"}}>
                <input placeholder="Rechercher..." value={orderSearch} onChange={e=>setOrderSearch(e.target.value)}
                  style={{...inp,width:"220px",padding:"9px 14px"}}
                  onFocus={e=>e.target.style.borderColor="rgba(0,0,0,0.4)"}
                  onBlur={e=>e.target.style.borderColor="rgba(0,0,0,0.12)"}
                />
                <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"9px",padding:"9px 16px",fontSize:"12px",color:C.textMd,display:"flex",alignItems:"center"}}>
                  {filtered.length} résultat{filtered.length>1?"s":""}
                </div>
              </div>
            </div>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"14px",overflow:"hidden"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead>
                  <tr style={{borderBottom:`1px solid ${C.border}`}}>
                    {["ID","Client","Email","Tickets","N° tickets","Montant","Date"].map(h=>(
                      <th key={h} style={{padding:"14px 18px",textAlign:"left",fontSize:"9px",letterSpacing:"2px",color:C.textLt,fontWeight:"400"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(o=>(
                    <tr key={o.id} className="row" style={{borderBottom:`1px solid rgba(0,0,0,0.05)`,transition:"background 0.15s"}}>
                      <td style={{padding:"13px 18px",fontSize:"11px",color:C.textLt,fontFamily:"'DM Mono',monospace"}}>{o.id}</td>
                      <td style={{padding:"13px 18px",fontSize:"13px",fontWeight:"500"}}>{o.name}</td>
                      <td style={{padding:"13px 18px",fontSize:"12px",color:C.textMd}}>{o.email}</td>
                      <td style={{padding:"13px 18px",fontSize:"13px",color:C.textMd}}>{o.tickets}x</td>
                      <td style={{padding:"13px 18px"}}>
                        <div style={{display:"flex",gap:"3px",flexWrap:"wrap"}}>
                          {o.ticketNums.slice(0,5).map(n=>(
                            <span key={n} style={{background:"rgba(0,0,0,0.07)",border:`1px solid ${C.border}`,borderRadius:"5px",padding:"2px 6px",fontSize:"10px",fontFamily:"'DM Mono',monospace",color:C.textMd}}>
                              #{n}
                            </span>
                          ))}
                          {o.ticketNums.length>5 && <span style={{fontSize:"11px",color:C.textLt}}>+{o.ticketNums.length-5}</span>}
                        </div>
                      </td>
                      <td style={{padding:"13px 18px",fontSize:"14px",fontWeight:"600"}}>{fmt(o.amount)}</td>
                      <td style={{padding:"13px 18px",fontSize:"12px",color:C.textLt}}>{fmtD(o.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{padding:"13px 18px",borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",fontSize:"12px",color:C.textLt}}>
                <span>Total : {filtered.reduce((s,o)=>s+o.tickets,0)} tickets</span>
                <span>Revenus : {fmt(filtered.reduce((s,o)=>s+o.amount,0))}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── GUIDE TIRAGE ── */}
        {tab==="tirage" && <DrawExplanation/>}
      </main>
    </div>
  );
}
