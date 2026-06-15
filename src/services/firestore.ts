import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'

import { db } from '@/services/firebase'
import type { AiRisk, QrHistoryInput, QrHistoryItem, QrSource, QrType } from '@/types/qrHistory.types'

function qrCollection(uid: string) {
  return collection(db, 'users', uid, 'qrcodes')
}

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate()
  if (value instanceof Date) return value
  return new Date()
}

export async function saveQr(uid: string, input: QrHistoryInput): Promise<string> {
  const ref = await addDoc(qrCollection(uid), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function listQrs(uid: string): Promise<QrHistoryItem[]> {
  const q = query(qrCollection(uid), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((docSnap) => {
    const d = docSnap.data()
    return {
      id: docSnap.id,
      title: String(d['title'] ?? ''),
      content: String(d['content'] ?? ''),
      type: d['type'] as QrType,
      source: d['source'] as QrSource,
      aiRisk: (d['aiRisk'] as AiRisk | null) ?? null,
      aiSummary: (d['aiSummary'] as string | null) ?? null,
      createdAt: toDate(d['createdAt']),
      updatedAt: toDate(d['updatedAt']),
    }
  })
}

export async function deleteQr(uid: string, docId: string): Promise<void> {
  await deleteDoc(doc(qrCollection(uid), docId))
}

export async function updateQrTitle(uid: string, docId: string, title: string): Promise<void> {
  await updateDoc(doc(qrCollection(uid), docId), {
    title,
    updatedAt: serverTimestamp(),
  })
}
