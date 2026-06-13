import { initializeApp } from 'firebase/app'
import { deleteToken, getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging'
import { deleteFcmToken, saveFcmToken } from './backendService'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let messagingPromise = null
let foregroundUnsubscribe = null
const FCM_ENABLED_KEY = 'scorekeeper_fcm_enabled'
const FCM_TOKEN_KEY = 'scorekeeper_fcm_token'

function hasFirebaseConfig() {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId &&
    process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
  )
}

function getNotificationApi() {
  if (typeof window === 'undefined') return null
  return window.Notification || null
}

function buildServiceWorkerUrl() {
  const params = new URLSearchParams()
  Object.entries(firebaseConfig).forEach(([key, value]) => {
    if (value) params.set(key, value)
  })
  return `/firebase-messaging-sw.js?${params.toString()}`
}

async function getFirebaseMessaging() {
  if (!messagingPromise) {
    messagingPromise = (async () => {
      if (typeof window === 'undefined') return null
      if (!hasFirebaseConfig()) throw new Error('Thiếu cấu hình Firebase cho FCM')
      if (!getNotificationApi()) throw new Error('Trình duyệt không hỗ trợ Web Push Notification')
      if (!('serviceWorker' in navigator)) throw new Error('Trình duyệt không hỗ trợ Service Worker')
      if (!(await isSupported())) throw new Error('Trình duyệt không hỗ trợ Firebase Messaging')

      const app = initializeApp(firebaseConfig)
      return getMessaging(app)
    })()
  }

  return messagingPromise
}

export async function enableFcmNotifications() {
  const notificationApi = getNotificationApi()
  if (!notificationApi) throw new Error('Trình duyệt không hỗ trợ Web Push Notification')

  if (notificationApi.permission !== 'granted') {
    const permission = await notificationApi.requestPermission()
    if (permission !== 'granted') throw new Error('Bạn chưa cấp quyền nhận thông báo')
  }

  const messaging = await getFirebaseMessaging()
  const serviceWorkerRegistration = await navigator.serviceWorker.register(buildServiceWorkerUrl())
  const token = await getToken(messaging, {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration,
  })

  if (!token) throw new Error('Không lấy được FCM token')
  await saveFcmToken(token)
  window.localStorage.setItem(FCM_TOKEN_KEY, token)
  window.localStorage.setItem(FCM_ENABLED_KEY, 'true')
  window.dispatchEvent(new Event('scorekeeper:fcm-enabled'))
  return token
}

export async function disableFcmNotifications() {
  const token = window.localStorage.getItem(FCM_TOKEN_KEY)
  const messaging = await getFirebaseMessaging()

  if (token) {
    await deleteFcmToken(token)
  }

  try {
    await deleteToken(messaging)
  } catch {
    // The server-side token removal is enough for app-level opt-out.
  }

  window.localStorage.removeItem(FCM_TOKEN_KEY)
  window.localStorage.removeItem(FCM_ENABLED_KEY)
  window.dispatchEvent(new Event('scorekeeper:fcm-disabled'))
}

export async function listenForegroundNotifications(onNotification) {
  if (foregroundUnsubscribe) {
    foregroundUnsubscribe()
    foregroundUnsubscribe = null
  }

  const messaging = await getFirebaseMessaging()
  foregroundUnsubscribe = onMessage(messaging, (payload) => {
    onNotification?.(payload)
  })

  return () => {
    foregroundUnsubscribe?.()
    foregroundUnsubscribe = null
  }
}

export function hasEnabledFcmNotifications() {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(FCM_ENABLED_KEY) === 'true'
}

export function showFcmNotification(payload) {
  const notificationApi = getNotificationApi()
  if (!notificationApi || notificationApi.permission !== 'granted') return

  const notification = payload.notification || {}
  const data = payload.data || {}
  const title = notification.title || data.title || 'BG Score'
  const body = notification.body || data.body || 'Bạn có thông báo mới'
  const browserNotification = new notificationApi(title, {
    body,
    icon: '/apple-touch-icon.png',
    data: {
      url: data.url || '/',
    },
  })

  browserNotification.onclick = () => {
    window.focus()
    if (browserNotification.data?.url) {
      window.location.href = browserNotification.data.url
    }
    browserNotification.close()
  }
}
