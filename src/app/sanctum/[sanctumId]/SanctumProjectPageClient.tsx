'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  Save, Edit2, Loader2, Calendar,
  BookOpen, Tag, Trash2, Shield, Eye, EyeOff, AlertCircle,
} from 'lucide-react';
import CuplusLoader from '@/components/CuplusLoader';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Layout from '@/components/Layout';
import DeleteConfirmation from '@/components/DeleteConfirmation';
import {
  getSanctumSettings,
  getSanctumProjects,
  updateSanctumProject,
  deleteSanctumProject,
  verifyPassword,
  SanctumSpace,
  SanctumProject,
  SanctumSettings,
} from '@/lib/sanctum';

const RichTextEditor = dynamic(() => import('@/components/editor/RichTextEditor'), {
  ssr: false,
  loading: () => <CuplusLoader fullScreen label="Loading editor…" />,
});

function formatDate(ts: any): string {
  if (!ts) return '—';
  const d = ts?.seconds ? new Date(ts.seconds * 1000) : ts?.toDate?.() ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

interface GateProps {
  settings: SanctumSettings | null;
  onUnlocked: (space: SanctumSpace, password: string) => void;
}

function SanctumGate({ settings, onUnlocked }: GateProps) {
  const [space, setSpace]       = useState<SanctumSpace>('personal');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const spaceHash = space === 'personal'
    ? settings?.personalPasswordHash
    : settings?.officialPasswordHash;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) { setError('Enter your password.'); return; }
    if (!spaceHash) { setError('This Sanctum space has not been activated yet.'); return; }
    setLoading(true);
    const valid = await verifyPassword(password, spaceHash);
    if (!valid) { setError('Incorrect password.'); setLoading(false); return; }
    onUnlocked(space, password);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4  no-scrollbar-mobile">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/30
          flex items-center justify-center">
          <Shield size={32} className="text-violet-400" />
        </div>
        <h1 className="text-2xl font-bold text-[#E2E8F0]">Unlock Sanctum</h1>
        <p className="text-sm text-[#94A3B8] text-center max-w-xs">
          Choose a space and enter your password to view this project.
        </p>
      </div>

      <div className="w-full max-w-sm bg-[#151922] border border-white/10 rounded-2xl p-6">
        <div className="flex gap-2 mb-5 p-1 bg-[#0B0E14] rounded-xl">
          {(['personal', 'official'] as SanctumSpace[]).map((s) => (
            <button
              key={s}
              onClick={() => { setSpace(s); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all
                ${space === s
                  ? s === 'personal'
                    ? 'bg-violet-600 text-white'
                    : 'bg-amber-600 text-white'
                  : 'text-[#94A3B8] hover:text-[#E2E8F0]'}`}
            >
              {s === 'personal' ? '🔮' : '💼'} {s}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Master password"
              autoFocus
              className="w-full bg-[#0B0E14] border border-white/10 rounded-xl px-4 py-3 pr-10
                text-[#E2E8F0] text-sm outline-none focus:border-violet-500/50
                placeholder-[#94A3B8]/50 transition-colors"
            />
            <button type="button" onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#E2E8F0]">
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-400
              bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
              <AlertCircle size={14} className="shrink-0" /> {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl
              text-sm font-semibold text-white transition-all disabled:opacity-60
              ${space === 'personal'
                ? 'bg-violet-600 hover:bg-violet-500'
                : 'bg-amber-600 hover:bg-amber-500'}`}>
            {loading
              ? <><Loader2 size={14} className="animate-spin" /> Unlocking…</>
              : '🔓 Unlock'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function SanctumProjectPageClient() {
  const { sanctumId } = useParams<{ sanctumId: string }>();
  const router = useRouter();

  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading]   = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const userId = firebaseUser?.uid ?? '';

  const [session, setSession] = useState<{ space: SanctumSpace; password: string } | null>(() => {
    if (typeof window === 'undefined') return null;
    const space    = sessionStorage.getItem('sanctum_space')    as SanctumSpace | null;
    const password = sessionStorage.getItem('sanctum_password');
    if (space && password) return { space, password };
    return null;
  });
  const [settings, setSettings] = useState<SanctumSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    getSanctumSettings(userId)
      .then(s => { setSettings(s); setSettingsLoading(false); })
      .catch(() => setSettingsLoading(false));
  }, [userId]);

  const [project, setProject]   = useState<SanctumProject | null>(null);
  const [content, setContent]   = useState('');
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [editorKey, setEditorKey]                       = useState(0);
  const [editorInitialContent, setEditorInitialContent] = useState('');

  useEffect(() => {
    if (!session || !sanctumId || !userId) return;
    setLoading(true);
    getSanctumProjects(userId, session.space, session.password)
      .then(list => {
        const found = list.find(p => p.id === sanctumId) ?? null;
        if (!found) { setError('Project not found or belongs to a different space.'); }
        setProject(found);
        setContent(found?.content ?? '');
        setEditorInitialContent(found?.content ?? '');
        setEditorKey(k => k + 1);
      })
      .catch(e => setError(e.message ?? 'Failed to load project.'))
      .finally(() => setLoading(false));
  }, [session, sanctumId, userId]);

  const handleSave = useCallback(async () => {
    if (!project || !session) return;
    setSaving(true);
    try {
      const wordCount = content
        ? new DOMParser().parseFromString(content, 'text/html')
            .body.innerText.trim().split(/\s+/).filter(Boolean).length
        : 0;
      await updateSanctumProject(project.id, { content, wordCount }, session.password);
      setProject(p => p ? { ...p, content, wordCount } : p);
      setLastSaved(new Date());
      setEditMode(false);
    } catch (e: any) {
      setError(e.message ?? 'Save failed.');
    } finally {
      setSaving(false);
    }
  }, [project, content, session]);

  useEffect(() => {
    if (!editMode) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSave(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [editMode, handleSave]);

  const handleDelete = async () => {
    if (!project) return;
    await deleteSanctumProject(project.id);
    router.push('/sanctum');
  };

  const accentClass = session?.space === 'personal'
    ? { pill: 'bg-violet-500/15 text-violet-300 border-violet-500/20', text: 'text-violet-400' }
    : { pill: 'bg-amber-500/15 text-amber-300 border-amber-500/20',   text: 'text-amber-400' };

  if (authLoading || settingsLoading) return <CuplusLoader fullScreen />;

  if (!firebaseUser) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
        <p className="text-[#94A3B8] text-sm">Please sign in to access Sanctum.</p>
      </div>
    );
  }

  if (!session) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#0B0E14]">
          <SanctumGate
            settings={settings}
            onUnlocked={(space, pw) => {
              sessionStorage.setItem('sanctum_space',    space);
              sessionStorage.setItem('sanctum_password', pw);
              setSession({ space, password: pw });
            }}
          />
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <CuplusLoader label="Decrypting Projects…" />
      </Layout>
    );
  }

  if (error || !project) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#0B0E14] flex flex-col items-center justify-center gap-4">
          <Shield size={40} className="text-violet-500/40" />
          <p className="text-red-400 text-sm">{error || 'Project not found.'}</p>
          <button onClick={() => router.push('/sanctum')}
            className="text-sm text-violet-400 hover:underline">
            ← Back to Sanctum
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#0B0E14] flex flex-col">
        <header className="sticky top-0 z-30 bg-[#151922]/95 backdrop-blur
          border-b border-white/10 px-4 sm:px-8 py-4 pt-[35px] sm:pt-4">
          <div className="max-w-5xl mx-auto flex items-center gap-3">
            <span className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full
              text-[10px] font-semibold uppercase border ${accentClass.pill}`}>
              🔐 {session.space}
            </span>

            <h1 className="flex-1 font-semibold text-[#E2E8F0] text-base truncate min-w-0">
              {project.title}
            </h1>

            <div className="flex items-center gap-2 shrink-0">
              {lastSaved && !editMode && (
                <span className="text-xs text-[#94A3B8]/60 hidden sm:block">
                  Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}

              {editMode ? (
                <>
                  <button
                    onClick={() => {
                      setEditMode(false);
                      setContent(project.content ?? '');
                      setEditorInitialContent(project.content ?? '');
                      setEditorKey(k => k + 1);
                    }}
                    className="px-3 py-1.5 text-sm text-[#94A3B8] hover:text-[#E2E8F0]
                      bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
                  >
                    Discard
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold
                      text-white rounded-lg transition-colors disabled:opacity-60
                      ${session.space === 'personal'
                        ? 'bg-violet-600 hover:bg-violet-500'
                        : 'bg-amber-600 hover:bg-amber-500'}`}
                  >
                    {saving
                      ? <><Loader2 size={13} className="animate-spin" /> Encrypting…</>
                      : <><Save size={13} /> Save</>}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setEditMode(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#94A3B8]
                      hover:text-[#E2E8F0] hover:bg-white/10 border border-white/10
                      rounded-lg transition-colors"
                  >
                    <Edit2 size={13} /> Edit
                  </button>
                  <button
                    onClick={() => setDeleteModal(true)}
                    className="p-1.5 text-[#94A3B8] hover:text-red-400 hover:bg-red-500/10
                      rounded-lg transition-colors border border-white/10"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 flex max-w-5xl mx-auto w-full px-4 sm:px-8 py-8 gap-8">
          <main className="flex-1 min-w-0">
            {project.thumbnailUrl && (
              <div className="w-full h-56 sm:h-72 rounded-2xl overflow-hidden mb-8 border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={project.thumbnailUrl} alt={project.title}
                  className="w-full h-full object-cover" />
              </div>
            )}

            <div className="flex items-center flex-wrap gap-2 mb-4">
              {project.category && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium
                  bg-violet-500/15 text-violet-300 border border-violet-500/20">
                  {project.category}
                </span>
              )}
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold
                uppercase ${accentClass.pill} border`}>
                🔐 {session.space}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-[#E2E8F0] mb-6 leading-tight">
              {project.title}
            </h1>

            {editMode ? (
              <RichTextEditor
                key={editorKey}
                initialContent={editorInitialContent}
                onChange={setContent}
                placeholder="Write your encrypted content…"
                minHeight="0px"
                className="h-[calc(100vh-280px)] min-h-125"
              />
            ) : (
              <div
                className="editor-body prose-invert text-[#E2E8F0] text-sm leading-7"
                dangerouslySetInnerHTML={{
                  __html: project.content ||
                    '<p class="text-[#94A3B8]">No content yet. Click Edit to start writing.</p>',
                }}
              />
            )}
          </main>

          <aside className="w-60 shrink-0 hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <div className="bg-[#151922] border border-white/10 rounded-2xl p-4 space-y-4">
                <h3 className="text-xs text-[#94A3B8] font-semibold uppercase tracking-wider">
                  Project Info
                </h3>

                {project.category && (
                  <div className="flex items-start gap-2">
                    <Tag size={14} className="text-[#94A3B8] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-[#94A3B8] mb-0.5">Category</p>
                      <span className="text-sm text-[#E2E8F0] font-medium">{project.category}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2">
                  <Shield size={14} className="text-[#94A3B8] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-[#94A3B8] mb-0.5">Space</p>
                    <span className={`text-sm font-semibold capitalize ${accentClass.text}`}>
                      {session.space === 'personal' ? '🔮' : '💼'} {session.space}
                    </span>
                  </div>
                </div>

                {(project.wordCount ?? 0) > 0 && (
                  <div className="flex items-start gap-2">
                    <BookOpen size={14} className="text-[#94A3B8] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-[#94A3B8] mb-0.5">Word count</p>
                      <span className="text-sm text-[#E2E8F0] font-medium">
                        {project.wordCount?.toLocaleString()} words
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2">
                  <Calendar size={14} className="text-[#94A3B8] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-[#94A3B8] mb-0.5">Last updated</p>
                    <span className="text-xs text-[#E2E8F0]">{formatDate(project.updatedAt)}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Calendar size={14} className="text-[#94A3B8] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-[#94A3B8] mb-0.5">Created</p>
                    <span className="text-xs text-[#E2E8F0]">{formatDate(project.createdAt)}</span>
                  </div>
                </div>

                <div className={`rounded-xl p-2.5 bg-violet-500/10 border
                  ${session.space === 'personal' ? 'border-violet-500/20' : 'border-amber-500/20'}`}>
                  <p className="text-[10px] text-violet-300 leading-relaxed">
                    🔒 AES-256 encrypted. Decrypted only on your device.
                  </p>
                </div>
              </div>

              <div className="bg-[#151922] border border-white/10 rounded-2xl p-4 space-y-1">
                <h3 className="text-xs text-[#94A3B8] font-semibold uppercase tracking-wider mb-3">
                  Quick Actions
                </h3>
                <button
                  onClick={() => setEditMode(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#94A3B8]
                    hover:text-[#E2E8F0] hover:bg-white/5 rounded-lg transition-colors text-left"
                >
                  <Edit2 size={13} /> Edit Document
                </button>
                <button
                  onClick={() => setDeleteModal(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400
                    hover:bg-red-500/10 rounded-lg transition-colors text-left"
                >
                  <Trash2 size={13} /> Delete forever
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <DeleteConfirmation
        isOpen={deleteModal}
        itemName={project.title}
        type="project"
        permanent={true}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal(false)}
      />
    </>
  );
}
