'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, RotateCcw, Search, Trash } from 'lucide-react';
import CuplusLoader from '@/components/CuplusLoader';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import {
  collection, query, where, orderBy,
  getDocs, updateDoc, deleteDoc, doc,
} from 'firebase/firestore';
import Layout from '@/components/Layout';
import DeleteConfirmation from '@/components/DeleteConfirmation';
import {
  getRemovedProjects,
  restoreProject,
  deleteProjectPermanently,
} from '@/lib/projects';
import { Project } from '@/components/editor/types';

// ── Note shape (mirrors what NotesPage uses) ─────────────────────────────────
interface RemovedNote {
  id: string;
  title: string;
  category: string;
  color: string;
  content: string;
  createdAt: any;
  remove: boolean;
}

type Tab = 'projects' | 'notes';

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(ts: any): string {
  if (!ts) return '';
  const date = ts?.seconds
    ? new Date(ts.seconds * 1000)
    : ts?.toDate?.()
    ? ts.toDate()
    : new Date(ts);
  return date.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function stripHtml(html: string, maxLen = 100): string {
  if (!html) return '';
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text;
}

// ── Note card color accent ────────────────────────────────────────────────────
const NOTE_COLORS: Record<string, string> = {
  blue:   '#3B82F6',
  green:  '#10B981',
  yellow: '#F59E0B',
  red:    '#EF4444',
  purple: '#8B5CF6',
  pink:   '#EC4899',
};

export default function RecycleBinPage() {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading]   = useState(true);
  const [activeTab, setActiveTab]       = useState<Tab>('projects');
  const [searchQuery, setSearchQuery]   = useState('');

  // ── Projects state ────────────────────────────────────────────────────────
  const [projects, setProjects] = useState<Project[]>([]);
  const [projLoading, setProjLoading] = useState(true);

  // ── Notes state ────────────────────────────────────────────────────────────
  const [notes, setNotes] = useState<RemovedNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);

  // ── Delete confirmation modal ─────────────────────────────────────────────
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    type: 'project' | 'note';
    id: string;
    name: string;
  }>({ open: false, type: 'project', id: '', name: '' });

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const userId = firebaseUser?.uid ?? '';

  // ── Load removed projects ─────────────────────────────────────────────────
  const loadProjects = useCallback(async () => {
    if (!userId) return;
    setProjLoading(true);
    try { setProjects(await getRemovedProjects(userId)); }
    catch (e) { console.error(e); }
    finally { setProjLoading(false); }
  }, [userId]);

  // ── Load removed notes ────────────────────────────────────────────────────
  const loadNotes = useCallback(async () => {
    if (!userId) return;
    setNotesLoading(true);
    try {
      const q = query(
        collection(db, 'notes'),
        where('userId', '==', userId),
        where('remove', '==', true),
        orderBy('createdAt', 'desc'),
      );
      const snap = await getDocs(q);
      setNotes(snap.docs.map((d) => ({ id: d.id, ...d.data() } as RemovedNote)));
    } catch (e) { console.error(e); }
    finally { setNotesLoading(false); }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    loadProjects();
    loadNotes();
  }, [userId, loadProjects, loadNotes]);

  // ── Restore ───────────────────────────────────────────────────────────────
  const handleRestoreProject = async (id: string) => {
    await restoreProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const handleRestoreNote = async (id: string) => {
    await updateDoc(doc(db, 'notes', id), { remove: false });
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  // ── Open delete confirmation ───────────────────────────────────────────────
  const openDelete = (type: 'project' | 'note', id: string, name: string) => {
    setDeleteModal({ open: true, type, id, name });
  };

  // ── Confirm permanent delete ───────────────────────────────────────────────
  const confirmDelete = async () => {
    const { type, id } = deleteModal;
    if (type === 'project') {
      await deleteProjectPermanently(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } else {
      await deleteDoc(doc(db, 'notes', id));
      setNotes((prev) => prev.filter((n) => n.id !== id));
    }
    setDeleteModal({ open: false, type: 'project', id: '', name: '' });
  };

  // ── Filter ────────────────────────────────────────────────────────────────
  const filteredProjects = projects.filter((p) => {
    const q = searchQuery.toLowerCase();
    return !q || p.title.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q);
  });

  const filteredNotes = notes.filter((n) => {
    const q = searchQuery.toLowerCase();
    return !q || n.title.toLowerCase().includes(q) || n.content?.toLowerCase().includes(q);
  });

  // ── Auth guards ───────────────────────────────────────────────────────────
  if (authLoading) {
    return <CuplusLoader fullScreen />;
  }

  if (!firebaseUser) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
        <p className="text-[#94A3B8] text-sm">Please sign in.</p>
      </div>
    );
  }

  const isLoading = activeTab === 'projects' ? projLoading : notesLoading;
  const isEmpty   = activeTab === 'projects'
    ? filteredProjects.length === 0
    : filteredNotes.length === 0;

  return (
    <Layout>
      <div className="min-h-screen bg-[#0B0E14] px-4 sm:px-8 py-8 w-full overflow-y-auto no-scrollbar-mobile">

        {/* ── Page header ── */}
        <div className="flex items-center gap-3 mb-2 mt-10 md:mt-0">
          <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20
            flex items-center justify-center">
            <Trash size={16} className="text-red-400" />
          </div>
          <h1 className="text-3xl font-bold text-[#E2E8F0]">Recycle Bin</h1>
        </div>
        <p className="text-[#94A3B8] text-sm mb-8 ml-12">
          Items here are removed from view. Restore or permanently delete them.
        </p>

        {/* ── Search ── */}
        <div className="mb-6">
          <div className="relative w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
            <input
              type="text"
              placeholder={`Search ${activeTab}…`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#151922] border border-white/10 rounded-2xl pl-10 pr-4 py-3
                text-[#E2E8F0] text-sm outline-none focus:border-primary/50
                placeholder-[#94A3B8]/60 transition-colors"
            />
          </div>
        </div>

        {/* ── Tabs — centered ── */}
        <div className="flex justify-center mb-8">
          <div className="flex gap-1 p-1 bg-[#151922] border border-white/10 rounded-full">
            {(['projects', 'notes'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setSearchQuery(''); }}
                className={`
                  px-6 py-2 rounded-full text-sm font-medium capitalize transition-all duration-200
                  ${activeTab === tab
                    ? 'bg-primary text-white shadow-[0_0_12px_-2px_rgba(46,91,255,0.5)]'
                    : 'text-[#94A3B8] hover:text-[#E2E8F0]'}
                `}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {/* Badge count */}
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full
                  ${activeTab === tab ? 'bg-white/20' : 'bg-white/10'}`}>
                  {tab === 'projects' ? projects.length : notes.length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Content ── */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24 text-[#94A3B8]">
            <CuplusLoader fullScreen />
          </div>
        ) : isEmpty ? (
          <div className="py-24 text-center">
            <p className="text-5xl mb-4">🗑️</p>
            <p className="text-[#94A3B8] text-sm">
              {searchQuery
                ? `No ${activeTab} matching "${searchQuery}"`
                : `No removed ${activeTab}`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">

            {/* ── Project cards ── */}
            {activeTab === 'projects' && filteredProjects.map((project) => (
              <div
                key={project.id}
                className="bg-[#151922] border border-white/10 rounded-2xl overflow-hidden
                  flex flex-col hover:border-white/20 transition-all duration-200"
              >
                {/* Thumbnail or placeholder */}
                {project.thumbnailUrl ? (
                  <div className="h-40 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={project.thumbnailUrl}
                      alt={project.title}
                      className="w-full h-full object-cover opacity-60"
                    />
                  </div>
                ) : (
                  <div className="h-40 bg-linear-to-br from-[#1e2330] to-[#0B0E14]
                    flex items-center justify-center border-b border-white/5 opacity-60">
                    <span className="text-4xl opacity-20">📄</span>
                  </div>
                )}

                {/* Card body */}
                <div className="p-4 flex flex-col gap-2 flex-1">
                  {project.category && (
                    <span className="inline-flex w-fit px-2.5 py-0.5 rounded-full text-xs
                      font-medium bg-primary/15 text-[#60A5FA] border border-primary/20">
                      {project.category}
                    </span>
                  )}
                  <h3 className="font-bold text-[#E2E8F0] text-base leading-snug line-clamp-2">
                    {project.title}
                  </h3>
                  <p className="text-xs text-[#94A3B8]/60 mt-auto">
                    {formatDate(project.updatedAt)}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2 mt-2 pt-3 border-t border-white/5">
                    <button
                      onClick={() => handleRestoreProject(project.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2
                        text-xs font-medium text-[#34D399] bg-emerald-500/10
                        hover:bg-emerald-500/20 border border-emerald-500/20
                        rounded-lg transition-colors"
                    >
                      <RotateCcw size={12} /> Restore
                    </button>
                    <button
                      onClick={() => openDelete('project', project.id, project.title)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2
                        text-xs font-medium text-red-400 bg-red-500/10
                        hover:bg-red-500/20 border border-red-500/20
                        rounded-lg transition-colors"
                    >
                      <Trash2 size={12} /> Delete forever
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* ── Note cards ── */}
            {activeTab === 'notes' && filteredNotes.map((note) => {
              const accent = NOTE_COLORS[note.color] ?? '#2e5bff';
              return (
                <div
                  key={note.id}
                  className="bg-[#151922] border border-white/10 rounded-2xl overflow-hidden
                    flex flex-col hover:border-white/20 transition-all duration-200"
                  style={{ borderTop: `3px solid ${accent}` }}
                >
                  <div className="p-4 flex flex-col gap-2 flex-1">
                    {note.category && (
                      <span
                        className="inline-flex w-fit px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          background: `${accent}20`,
                          color: accent,
                          border: `1px solid ${accent}30`,
                        }}
                      >
                        {note.category}
                      </span>
                    )}
                    <h3 className="font-bold text-[#E2E8F0] text-base leading-snug line-clamp-2">
                      {note.title || 'Untitled Note'}
                    </h3>
                    <p className="text-sm text-[#94A3B8] line-clamp-2 leading-relaxed flex-1">
                      {stripHtml(note.content)}
                    </p>
                    <p className="text-xs text-[#94A3B8]/60 mt-auto">
                      {formatDate(note.createdAt)}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2 mt-2 pt-3 border-t border-white/5">
                      <button
                        onClick={() => handleRestoreNote(note.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2
                          text-xs font-medium text-[#34D399] bg-emerald-500/10
                          hover:bg-emerald-500/20 border border-emerald-500/20
                          rounded-lg transition-colors"
                      >
                        <RotateCcw size={12} /> Restore
                      </button>
                      <button
                        onClick={() => openDelete('note', note.id, note.title || 'this note')}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2
                          text-xs font-medium text-red-400 bg-red-500/10
                          hover:bg-red-500/20 border border-red-500/20
                          rounded-lg transition-colors"
                      >
                        <Trash2 size={12} /> Delete forever
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

          </div>
        )}
      </div>

      {/* ── Delete confirmation modal ── */}
      <DeleteConfirmation
        isOpen={deleteModal.open}
        itemName={deleteModal.name}
        type={deleteModal.type}
        permanent={true}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ open: false, type: 'project', id: '', name: '' })}
      />
    </Layout>
  );
}
