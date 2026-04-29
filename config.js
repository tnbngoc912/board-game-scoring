// ─────────────────────────────────────────────────────────────
//  🔥 FIREBASE SETUP
//  1. Go to https://console.firebase.google.com
//  2. Create a project (free Spark plan is fine)
//  3. Add a Web App  →  copy the firebaseConfig object below
//  4. In Firebase console: Build → Firestore Database → Create
//     • Start in "test mode" for now (you can add rules later)
//  5. In Firebase console: Build → Authentication → Sign-in method
//     • Enable "Google"  AND  "Anonymous"
// ─────────────────────────────────────────────────────────────

import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously, onAuthStateChanged, signOut } from 'firebase/auth'
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore'

// 👇 Replace this entire object with YOUR project's config
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID",
}

const app  = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db   = getFirestore(app)

// Enable offline persistence (works even without internet)
enableIndexedDbPersistence(db).catch(err => {
  if (err.code === 'failed-precondition') {
    console.warn('Firestore persistence: multiple tabs open')
  } else if (err.code === 'unimplemented') {
    console.warn('Firestore persistence: not supported in this browser')
  }
})

export const googleProvider = new GoogleAuthProvider()

export async function loginWithGoogle() {
  return signInWithPopup(auth, googleProvider)
}

export async function loginAnonymously() {
  return signInAnonymously(auth)
}

export async function logout() {
  return signOut(auth)
}

export { onAuthStateChanged }