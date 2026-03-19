// src/lib/sanctum.ts
// ─── Sanctum – crypto helpers + Firestore CRUD ───────────────────────────────
//
// Security model:
//   • Passwords are NEVER stored in plaintext — only SHA-256 hash for verification
//   • Title + content are AES-GCM encrypted using PBKDF2 key derived from password
//   • Category + thumbnailUrl are stored in plaintext (not sensitive)
//   • The session password lives in React state only — never in localStorage/DB
//   • Decryption happens client-side; the server never sees plaintext
//
// Encrypted string format:  base64(salt) : base64(iv) : base64(ciphertext)

import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, getDocs, query, where, orderBy,
  serverTimestamp, getDoc, setDoc,
} from 'firebase/firestore';
import { db } from './firebase';

export type SanctumSpace = 'personal' | 'official';

// ── Types ──────────────────────────────────────────────────────────────────────
export interface SanctumProject {
  id: string;
  userId: string;
  space: SanctumSpace;
  title: string;          // decrypted
  content: string;        // decrypted
  category: string;       // plaintext
  thumbnailUrl?: string;  // plaintext
  wordCount?: number;
  createdAt: any;
  updatedAt: any;
}

export interface SanctumSettings {
  personalPasswordHash: string | null;
  officialPasswordHash: string | null;
}

// ── Crypto: password hashing (SHA-256 → base64) ───────────────────────────────
export async function hashPassword(password: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(password)
  );
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return (await hashPassword(password)) === hash;
}

// ── Crypto: AES-GCM encryption via PBKDF2 key derivation ─────────────────────
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

function toB64(buf: ArrayBuffer | Uint8Array): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf instanceof ArrayBuffer ? buf : buf.buffer)));
}

function fromB64(b64: string): Uint8Array {
  return new Uint8Array(atob(b64).split('').map((c) => c.charCodeAt(0)));
}

export async function encryptText(plaintext: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  const key  = await deriveKey(password, salt);
  const enc  = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext)
  );
  return `${toB64(salt)}:${toB64(iv)}:${toB64(enc)}`;
}

export async function decryptText(encrypted: string, password: string): Promise<string | null> {
  try {
    const [saltB64, ivB64, dataB64] = encrypted.split(':');
    const key = await deriveKey(password, fromB64(saltB64));
    const dec = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromB64(ivB64) },
      key,
      fromB64(dataB64)
    );
    return new TextDecoder().decode(dec);
  } catch {
    return null;  // wrong password or corrupted data
  }
}

// ── Firestore: settings ────────────────────────────────────────────────────────
const SETTINGS_COL = 'sanctumSettings';
const PROJECTS_COL = 'sanctumProjects';

export async function getSanctumSettings(userId: string): Promise<SanctumSettings | null> {
  const snap = await getDoc(doc(db, SETTINGS_COL, userId));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    personalPasswordHash: d.personalPasswordHash ?? null,
    officialPasswordHash: d.officialPasswordHash ?? null,
  };
}

export async function activateSanctum(
  userId: string,
  space: SanctumSpace,
  passwordHash: string
): Promise<void> {
  const ref  = doc(db, SETTINGS_COL, userId);
  const snap = await getDoc(ref);
  const field = space === 'personal' ? 'personalPasswordHash' : 'officialPasswordHash';
  if (snap.exists()) {
    await updateDoc(ref, { [field]: passwordHash, updatedAt: serverTimestamp() });
  } else {
    await setDoc(ref, {
      personalPasswordHash: space === 'personal' ? passwordHash : null,
      officialPasswordHash: space === 'official' ? passwordHash : null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

// ── Firestore: projects ────────────────────────────────────────────────────────
export async function createSanctumProject(
  data: { title: string; content: string; category: string; thumbnailUrl?: string; wordCount?: number },
  userId: string,
  space: SanctumSpace,
  password: string
): Promise<string> {
  const encTitle   = await encryptText(data.title || '', password);
  const encContent = await encryptText(data.content || '', password);
  const ref = await addDoc(collection(db, PROJECTS_COL), {
    userId,
    space,
    title:        encTitle,
    content:      encContent,
    category:     data.category || '',
    thumbnailUrl: data.thumbnailUrl || '',
    wordCount:    data.wordCount ?? 0,
    createdAt:    serverTimestamp(),
    updatedAt:    serverTimestamp(),
  });
  return ref.id;
}

export async function getSanctumProjects(
  userId: string,
  space: SanctumSpace,
  password: string
): Promise<SanctumProject[]> {
  const q = query(
    collection(db, PROJECTS_COL),
    where('userId', '==', userId),
    where('space',  '==', space),
    orderBy('updatedAt', 'desc')
  );
  const snap = await getDocs(q);
  const results: SanctumProject[] = [];
  for (const d of snap.docs) {
    const raw = d.data();
    const title   = await decryptText(raw.title,   password);
    const content = await decryptText(raw.content, password);
    if (title === null) continue;  // skip if wrong password decrypts to null
    results.push({
      id:           d.id,
      userId:       raw.userId,
      space:        raw.space,
      title:        title   ?? '',
      content:      content ?? '',
      category:     raw.category     ?? '',
      thumbnailUrl: raw.thumbnailUrl ?? '',
      wordCount:    raw.wordCount    ?? 0,
      createdAt:    raw.createdAt,
      updatedAt:    raw.updatedAt,
    });
  }
  return results;
}

export async function updateSanctumProject(
  projectId: string,
  data: Partial<{ title: string; content: string; category: string; thumbnailUrl?: string; wordCount?: number }>,
  password: string
): Promise<void> {
  const update: Record<string, any> = { updatedAt: serverTimestamp() };
  if (data.title   !== undefined) update.title   = await encryptText(data.title,   password);
  if (data.content !== undefined) update.content = await encryptText(data.content, password);
  if (data.category     !== undefined) update.category     = data.category;
  if (data.thumbnailUrl !== undefined) update.thumbnailUrl = data.thumbnailUrl;
  if (data.wordCount    !== undefined) update.wordCount    = data.wordCount;
  await updateDoc(doc(db, PROJECTS_COL, projectId), update);
}

export async function deleteSanctumProject(projectId: string): Promise<void> {
  await deleteDoc(doc(db, PROJECTS_COL, projectId));
}
