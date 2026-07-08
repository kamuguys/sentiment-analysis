import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { AuthContext } from './authContext'
import { auth, firebaseEnabled } from '../services/firebase'

const DEMO_USER_KEY = 'sme-demo-user'

function getDemoUser() {
  try {
    const raw = localStorage.getItem(DEMO_USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveDemoUser(user) {
  localStorage.setItem(DEMO_USER_KEY, JSON.stringify(user))
}

function clearDemoUser() {
  localStorage.removeItem(DEMO_USER_KEY)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [demoMode, setDemoMode] = useState(false)

  useEffect(() => {
    if (!firebaseEnabled) {
      queueMicrotask(() => {
        const savedUser = getDemoUser()
        if (savedUser) {
          setUser(savedUser)
          setDemoMode(true)
        }
        setLoading(false)
      })
      return undefined
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const normalizedUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || 'SME Manager',
          photoURL: firebaseUser.photoURL,
        }
        setUser(normalizedUser)
        setDemoMode(false)
      } else {
        setUser(null)
        setDemoMode(false)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signInWithEmail = useCallback(async (email, password) => {
    setError('')

    if (!firebaseEnabled) {
      const fallbackUser = {
        uid: 'demo-user',
        email,
        displayName: email.split('@')[0],
      }
      saveDemoUser(fallbackUser)
      setUser(fallbackUser)
      setDemoMode(true)
      return fallbackUser
    }

    const cred = await signInWithEmailAndPassword(auth, email, password)
    const normalizedUser = {
      uid: cred.user.uid,
      email: cred.user.email,
      displayName: cred.user.displayName || email.split('@')[0],
      photoURL: cred.user.photoURL,
    }
    setUser(normalizedUser)
    setDemoMode(false)
    return normalizedUser
  }, [])

  const signUpWithEmail = useCallback(async (email, password) => {
    setError('')

    if (!firebaseEnabled) {
      const fallbackUser = {
        uid: `demo-${Date.now()}`,
        email,
        displayName: email.split('@')[0],
      }
      saveDemoUser(fallbackUser)
      setUser(fallbackUser)
      setDemoMode(true)
      return fallbackUser
    }

    const cred = await createUserWithEmailAndPassword(auth, email, password)
    const normalizedUser = {
      uid: cred.user.uid,
      email: cred.user.email,
      displayName: cred.user.displayName || email.split('@')[0],
      photoURL: cred.user.photoURL,
    }
    setUser(normalizedUser)
    setDemoMode(false)
    return normalizedUser
  }, [])

  const signInWithGoogle = useCallback(async () => {
    setError('')

    if (!firebaseEnabled) {
      const fallbackUser = {
        uid: 'demo-google-user',
        email: 'demo.google@sme.app',
        displayName: 'Google Demo User',
      }
      saveDemoUser(fallbackUser)
      setUser(fallbackUser)
      setDemoMode(true)
      return fallbackUser
    }

    const provider = new GoogleAuthProvider()
    try {
      const cred = await signInWithPopup(auth, provider)
      const normalizedUser = {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName || 'Google User',
        photoURL: cred.user.photoURL,
      }
      setUser(normalizedUser)
      setDemoMode(false)
      return normalizedUser
    } catch (err) {
      if (err?.code === 'auth/operation-not-supported-in-this-environment' || err?.code === 'auth/popup-blocked' || err?.code === 'auth/cancelled-popup-request' || String(err.message).includes('window.closed')) {
        await signInWithRedirect(auth, provider)
        return
      }
      throw err
    }
  }, [])

  const signOut = useCallback(async () => {
    setError('')

    if (!firebaseEnabled) {
      clearDemoUser()
      setUser(null)
      setDemoMode(false)
      return
    }

    await firebaseSignOut(auth)
    setUser(null)
    setDemoMode(false)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      demoMode,
      setError,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      signOut,
    }),
    [user, loading, error, demoMode, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

