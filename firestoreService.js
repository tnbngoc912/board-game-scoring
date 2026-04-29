// All Firestore read/write operations live here.
// The store calls these functions; components never touch Firestore directly.

import {
  collection, doc, setDoc, getDocs,
  deleteDoc, onSnapshot, query, orderBy, serverTimestamp,
} from 'firebase/firestore'
import { db } from './config'

// ── Helpers ────────────────────────────────────────────────────
function historyCol(uid) {
  return collection(db, 'users', uid, 'history')
}

// ── Save a finished game ───────────────────────────────────────
export async function saveGameToFirestore(uid, game) {
  const ref = doc(historyCol(uid), String(game.id))
  await setDoc(ref, {
    ...game,
    savedAt: serverTimestamp(),
  })
}

// ── Delete one game ────────────────────────────────────────────
export async function deleteGameFromFirestore(uid, gameId) {
  await deleteDoc(doc(historyCol(uid), String(gameId)))
}

// ── Fetch all history once (used on first load) ────────────────
export async function fetchHistory(uid) {
  const q = query(historyCol(uid), orderBy('savedAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data())
}

// ── Real-time listener (updates history whenever another device writes) ──
export function subscribeToHistory(uid, callback) {
  const q = query(historyCol(uid), orderBy('savedAt', 'desc'))
  return onSnapshot(q, snap => {
    const games = snap.docs.map(d => d.data())
    callback(games)
  })
}

// ── Save in-progress game state (so you can resume on another device) ──
export async function saveActiveGame(uid, gameState) {
  const ref = doc(db, 'users', uid, 'activeGame', 'current')
  await setDoc(ref, { ...gameState, updatedAt: serverTimestamp() })
}

// ── Load in-progress game ──────────────────────────────────────
export async function loadActiveGame(uid) {
  const { getDoc } = await import('firebase/firestore')
  const ref = doc(db, 'users', uid, 'activeGame', 'current')
  const snap = await getDoc(ref)
  return snap.exists() ? snap.data() : null
}

// ── Clear in-progress game (after save or abandon) ────────────
export async function clearActiveGame(uid) {
  await deleteDoc(doc(db, 'users', uid, 'activeGame', 'current'))
}