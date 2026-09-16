// Abonnement aux notifications push (PWA uniquement — pas de service worker
// dans le contexte Tauri, voir registerServiceWorker.js).
import axios from 'axios'
import API_BASE_URL from '@/api/config'

function urlBase64ToUint8Array (base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function notificationsSupportees () {
  return 'serviceWorker' in navigator && 'PushManager' in window && !window.__TAURI_INTERNALS__
}

/**
 * Demande la permission (si pas déjà refusée) et abonne l'appareil courant
 * aux notifications push pour le rôle de l'utilisateur connecté. Idempotent :
 * un appareil déjà abonné renvoie simplement le même abonnement.
 */
export async function activerNotifications () {
  if (!notificationsSupportees()) return false
  if (Notification.permission === 'denied') return false

  const raw = localStorage.getItem('LoggedUser')
  if (!raw) return false
  let user
  try { user = JSON.parse(raw) } catch (e) { return false }
  if (!user || !user.type_user) return false

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return false

  try {
    const registration = await navigator.serviceWorker.ready
    let subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      const { data } = await axios.get(`${API_BASE_URL}/api/push/public-key`)
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.publicKey),
      })
    }

    const json = subscription.toJSON()
    await axios.post(`${API_BASE_URL}/api/push/subscribe`, {
      endpoint: json.endpoint,
      keys: json.keys,
      type_user: user.type_user,
      login: user.username,
    })
    return true
  } catch (e) {
    console.log('[push] abonnement échoué :', e)
    return false
  }
}
