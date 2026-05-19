// ════════════════════════════════════════════════════════════
//  firebase.js — Configuration Firebase Olawin
//  ⚠️  Remplace les valeurs ci-dessous par tes vraies clés
//      (Firebase Console → Paramètres → Ajouter une app web)
// ════════════════════════════════════════════════════════════

import { initializeApp }              from "firebase/app";
import { getFirestore }               from "firebase/firestore";
import { getAuth }                    from "firebase/auth";
import { getStorage }                 from "firebase/storage";

const firebaseConfig = {
  apiKey:            "AIzaSyBgDjp1ww3mYsbme6_2qFZEN7QenWiVnrg",
  authDomain:        "olawin-99639.firebaseapp.com",
  projectId:         "olawin-99639",
  storageBucket:     "olawin-99639.firebasestorage.app",
  messagingSenderId: "842386061250",
  appId:             "1:842386061250:web:47651438763a909905c85b",
};

const app     = initializeApp(firebaseConfig);
export const db      = getFirestore(app);       // base de données
export const auth    = getAuth(app);            // authentification
export const storage = getStorage(app);         // stockage photos
