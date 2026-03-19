// src/lib/projects.ts
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, getDocs, getDoc, query, where, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Project, ProjectInput } from '@/components/editor/types';

const COL = 'projects';

function toProject(id: string, data: Record<string, any>): Project {
  return {
    id,
    title:        data.title        ?? 'Untitled',
    category:     data.category     ?? '',
    content:      data.content      ?? '',
    thumbnailUrl: data.thumbnailUrl ?? '',
    color:        data.color        ?? '',
    wordCount:    data.wordCount    ?? 0,
    archived:     data.archived     ?? false,
    removed:      data.removed      ?? false,
    createdAt:    data.createdAt,
    updatedAt:    data.updatedAt,
    userId:       data.userId       ?? '',
  };
}

// ── Create ─────────────────────────────────────────────────────────────────────
export async function createProject(input: ProjectInput, userId: string): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    ...input,
    userId,
    archived: false,   // always start as active
    removed:  false,   // always start as visible
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

// ── Read: active projects (not archived, not removed) ──────────────────────────
export async function getProjects(userId: string): Promise<Project[]> {
  if (!userId) return [];
  const q = query(
    collection(db, COL),
    where('userId',   '==', userId),
    where('archived', '==', false),
    where('removed',  '==', false),
    orderBy('updatedAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toProject(d.id, d.data()));
}

// ── Read: archived projects ────────────────────────────────────────────────────
export async function getArchivedProjects(userId: string): Promise<Project[]> {
  if (!userId) return [];
  const q = query(
    collection(db, COL),
    where('userId',   '==', userId),
    where('archived', '==', true),
    where('removed',  '==', false),
    orderBy('updatedAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toProject(d.id, d.data()));
}

// ── Read: removed/trashed projects ────────────────────────────────────────────
export async function getRemovedProjects(userId: string): Promise<Project[]> {
  if (!userId) return [];
  const q = query(
    collection(db, COL),
    where('userId',  '==', userId),
    where('removed', '==', true),
    orderBy('updatedAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toProject(d.id, d.data()));
}

// ── Read: single ───────────────────────────────────────────────────────────────
export async function getProject(projectId: string): Promise<Project | null> {
  const snap = await getDoc(doc(db, COL, projectId));
  if (!snap.exists()) return null;
  return toProject(snap.id, snap.data());
}

// ── Categories helper ──────────────────────────────────────────────────────────
export async function getUserCategories(userId: string): Promise<string[]> {
  if (!userId) return [];
  const q = query(collection(db, COL), where('userId', '==', userId));
  const snap = await getDocs(q);
  const cats = new Set<string>();
  snap.docs.forEach((d) => {
    const cat = d.data().category as string;
    if (cat?.trim()) cats.add(cat.trim());
  });
  return Array.from(cats).sort((a, b) => a.localeCompare(b));
}

// ── Update ─────────────────────────────────────────────────────────────────────
export async function updateProject(projectId: string, input: Partial<ProjectInput>): Promise<void> {
  await updateDoc(doc(db, COL, projectId), { ...input, updatedAt: serverTimestamp() });
}

// ── Soft-delete: send to Recycle Bin ──────────────────────────────────────────
export async function removeProject(projectId: string): Promise<void> {
  await updateDoc(doc(db, COL, projectId), { removed: true, updatedAt: serverTimestamp() });
}

// ── Restore from Recycle Bin ──────────────────────────────────────────────────
export async function restoreProject(projectId: string): Promise<void> {
  await updateDoc(doc(db, COL, projectId), { removed: false, updatedAt: serverTimestamp() });
}

// ── Hard delete (permanent, only from Recycle Bin) ────────────────────────────
export async function deleteProjectPermanently(projectId: string): Promise<void> {
  await deleteDoc(doc(db, COL, projectId));
}

// ── Archive ────────────────────────────────────────────────────────────────────
export async function archiveProject(projectId: string): Promise<void> {
  await updateDoc(doc(db, COL, projectId), { archived: true, updatedAt: serverTimestamp() });
}

// ── Unarchive: move back to active projects ───────────────────────────────────
export async function unarchiveProject(projectId: string): Promise<void> {
  await updateDoc(doc(db, COL, projectId), { archived: false, updatedAt: serverTimestamp() });
}
