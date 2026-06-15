import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import type { Unsubscribe, User, UserCredential } from 'firebase/auth'

import { auth } from '@/services/firebase'

export function signUp(email: string, password: string): Promise<UserCredential> {
  return createUserWithEmailAndPassword(auth, email, password)
}

export function signIn(email: string, password: string): Promise<UserCredential> {
  return signInWithEmailAndPassword(auth, email, password)
}

export function signOut(): Promise<void> {
  return firebaseSignOut(auth)
}

export function observeAuthState(callback: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback)
}
