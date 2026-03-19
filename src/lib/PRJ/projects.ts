// ────────────────────────────────────────────────────────────────────────────
// Add these functions to your existing src/lib/firebase.ts
// This file shows the additions needed for the Projects feature.
// ────────────────────────────────────────────────────────────────────────────

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';   // your existing firebase init
import { Project, ProjectInput } from '@/components/editor/types';

const COLLECTION = 'projects';

// ── Convert Firestore doc → Project ──────────────────────────────────────────
function toProject(id: string, data: Record<string, any>): Project {
  return {
    id,
    title: data.title ?? 'Untitled',
    category: data.category ?? '',
    content: data.content ?? '',
    thumbnailUrl: data.thumbnailUrl ?? '',
    color: data.color ?? '',
    wordCount: data.wordCount ?? 0,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    userId: data.userId ?? '',
  };
}

// ── CREATE ───────────────────────────────────────────────────────────────────
export async function createProject(
  input: ProjectInput,
  userId: string
): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), {
    ...input,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

// ── READ ALL (for current user) ───────────────────────────────────────────────
export async function getProjects(userId: string): Promise<Project[]> {
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toProject(d.id, d.data()));
}

// ── READ ONE ──────────────────────────────────────────────────────────────────
export async function getProject(projectId: string): Promise<Project | null> {
  const snap = await getDoc(doc(db, COLLECTION, projectId));
  if (!snap.exists()) return null;
  return toProject(snap.id, snap.data());
}

// ── UPDATE ───────────────────────────────────────────────────────────────────
export async function updateProject(
  projectId: string,
  input: Partial<ProjectInput>
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, projectId), {
    ...input,
    updatedAt: serverTimestamp(),
  });
}

// ── GET USER CATEGORIES ───────────────────────────────

export async function getUserCategories(userId: string): Promise<string[]> {
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'asc')
  );
  const snap = await getDocs(q);
  const categories = new Set<string>();
  snap.docs.forEach((d) => {
    const data = d.data();
    if (data.category) {
      categories.add(data.category);
    }
  });
  return Array.from(categories);
}

// ── DELETE ───────────────────────────────────────────────────────────────────
export async function deleteProject(projectId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, projectId));
}

// ── SOFT DELETE → Recycle Bin ─────────────────────────────────────────────────
export async function archiveProject(projectId: string): Promise<void> {
  await updateDoc(doc(db, COLLECTION, projectId), {
    archived: true,
    updatedAt: serverTimestamp(),
  });
}
