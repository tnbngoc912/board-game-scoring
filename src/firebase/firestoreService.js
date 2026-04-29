import {
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'

export async function createRoomDocument(roomId, createdBy) {
  await setDoc(doc(db, 'rooms', roomId), {
    gameName: '',
    players: [],
    categories: [],
    publishedScores: [],
    history: [],
    createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function getRoom(roomId) {
  const snap = await getDoc(doc(db, 'rooms', roomId))
  if (!snap.exists()) return null
  return { roomId: snap.id, ...snap.data() }
}

export function subscribeToRoom(roomId, callback) {
  return onSnapshot(doc(db, 'rooms', roomId), (snap) => {
    if (!snap.exists()) {
      callback(null)
      return
    }
    callback({ roomId: snap.id, ...snap.data() })
  })
}

export async function updateBoard(roomId, payload) {
  await updateDoc(doc(db, 'rooms', roomId), {
    ...payload,
    updatedAt: serverTimestamp(),
  })
}

export async function publishScores(roomId, payload) {
  const roomRef = doc(db, 'rooms', roomId)

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(roomRef)
    if (!snap.exists()) throw new Error('Board not found')

    const current = snap.data()
    const history = Array.isArray(current.history) ? current.history : []

    transaction.update(roomRef, {
      gameName: payload.gameName,
      players: payload.players,
      categories: payload.categories,
      publishedScores: payload.publishedScores,
      history: [payload.historyEntry, ...history].slice(0, 20),
      updatedAt: serverTimestamp(),
    })
  })
}
