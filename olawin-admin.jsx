// ════════════════════════════════════════════════════════════
//  olawin-admin.jsx  —  Admin connecté à Firebase Firestore
//  Tirages et commandes synchronisés en temps réel avec le site
// ════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from "react";
import { db } from "./firebase";
import {
  collection, onSnapshot, query, orderBy,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from "firebase/firestore";

const ADMIN_PASSWORD = "olawin2026";

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

const fmt  = (n) => `${(n||0).toLocaleString("fr-FR")}$`;
const fmtD = (d) => {
  if (!d) return "—";
  try {
    const date = d.toDate ? d.toDate() : new Date(d);
    return date.toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"});
  } catch { return "—"; }
};

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

function Logo({ size=28 }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <polygon points="20,2 38,20 20,38 2,20" fill="none" stroke={C.text} strokeWidth="1.5"/>
        <circle cx="20" cy="20" r="7" fill="none" stroke
  );
}
