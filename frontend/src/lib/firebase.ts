import { initializeApp, getApps } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyAn_0LgZ9Qf8NmttkZT9Ryv-wPHsdrAZuA',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'punto-de-venta-c5131.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'punto-de-venta-c5131',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'punto-de-venta-c5131.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '595733993432',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:595733993432:web:placeholder',
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
