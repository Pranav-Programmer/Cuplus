'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Search, Trash2, AlertCircle, Eye, EyeOff, Shield, Tag, BookOpen, Calendar, Edit2 } from 'lucide-react';
import CuplusLoader from '@/components/CuplusLoader';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Layout from '@/components/Layout';
import SanctumCard from '@/components/Sanctum/SanctumCard';
import SanctumCreator from '@/components/Sanctum/SanctumCreator';
import SanctumHero from '@/components/Sanctum/SanctumHero';
import DeleteConfirmation from '@/components/DeleteConfirmation';
import {
  getSanctumSettings,
  activateSanctum,
  getSanctumProjects,
  deleteSanctumProject,
  hashPassword,
  verifyPassword,
  SanctumSpace,
  SanctumProject,
  SanctumSettings,
} from '@/lib/sanctum';

// ── Constants ──────────────────────────────────────────────────────────────────
const INACTIVITY_MS = 60_000; // 60 seconds

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(ts: any): string {
  if (!ts) return '—';
  const d = ts?.seconds ? new Date(ts.seconds * 1000) : ts?.toDate?.() ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Sanctum lock screen / gate ─────────────────────────────────────────────────
type GateMode = 'choose_space' | 'activate' | 'unlock';

interface GateProps {
  settings: SanctumSettings | null;
  onUnlocked: (space: SanctumSpace, password: string) => void;
  userId: string;
}

function SanctumGate({ settings, onUnlocked, userId }: GateProps) {
  const [space, setSpace]           = useState<SanctumSpace>('personal');
  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [showPw, setShowPw]         = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  // Determine mode based on whether this space is already activated
  const spaceHash = space === 'personal' ? settings?.personalPasswordHash : settings?.officialPasswordHash;
  const isActivated = !!spaceHash;
  const mode: GateMode = !settings ? 'activate' : isActivated ? 'unlock' : 'activate';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!password.trim()) { setError('Please enter a password.'); return; }

    if (mode === 'activate') {
      if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
      if (password !== confirm) { setError('Passwords do not match.'); return; }
      setLoading(true);
      try {
        const hash = await hashPassword(password);
        await activateSanctum(userId, space, hash);
        onUnlocked(space, password);
      } catch {
        setError('Activation failed. Please try again.');
      } finally { setLoading(false); }
    } else {
      // unlock
      setLoading(true);
      try {
        const valid = await verifyPassword(password, spaceHash!);
        if (!valid) { setError('Incorrect password.'); setLoading(false); return; }
        onUnlocked(space, password);
      } catch {
        setError('Unlock failed. Please try again.');
      } finally { setLoading(false); }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-16 no-scrollbar-mobile">

      {/* Icon + title */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="w-20 h-20 rounded-2xl bg-violet-500/10 border border-violet-500/30
          flex items-center justify-center shadow-[0_0_40px_-10px_rgba(139,92,246,0.4)]">
          <Shield size={40} className="text-violet-400" />
        </div>
        <h1 className="text-3xl font-bold text-[#E2E8F0] tracking-tight">Sanctum</h1>
        <p className="text-sm text-[#94A3B8] text-center max-w-xs">
          {mode === 'activate'
            ? `Activate your ${space} Sanctum space with a master password.`
            : `Enter your password to unlock the ${space} space.`}
        </p>
      </div>

      <div className="w-full max-w-sm bg-[#151922] border border-white/10 rounded-2xl p-6 shadow-2xl no-scrollbar-mobile">

        {/* Space selector */}
        <div className="flex gap-2 mb-6 p-1 bg-[#0B0E14] rounded-xl">
          {(['personal', 'official'] as SanctumSpace[]).map((s) => {
            const activated = s === 'personal' ? !!settings?.personalPasswordHash : !!settings?.officialPasswordHash;
            return (
              <button
                key={s}
                onClick={() => { setSpace(s); setPassword(''); setConfirm(''); setError(''); }}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-lg text-sm
                  font-medium capitalize transition-all duration-200
                  ${space === s
                    ? s === 'personal'
                      ? 'bg-violet-600 text-white shadow-[0_0_12px_-2px_rgba(139,92,246,0.5)]'
                      : 'bg-amber-600 text-white shadow-[0_0_12px_-2px_rgba(217,119,6,0.5)]'
                    : 'text-[#94A3B8] hover:text-[#E2E8F0]'}`}
              >
                <span>{s === 'personal' ? '🔮' : '💼'} {s}</span>
                {activated && (
                  <span className={`text-[10px] px-1.5 py-0 rounded-full
                    ${space === s ? 'bg-white/20 text-white' : 'bg-white/10 text-[#94A3B8]'}`}>
                    activated
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 no-scrollbar-mobile">

          {mode === 'activate' && (
            <div className="flex items-start gap-2 rounded-xl bg-violet-500/10
              border border-violet-500/20 px-3 py-2.5">
              <Shield size={14} className="text-violet-400 mt-0.5 shrink-0" />
              <p className="text-xs text-violet-300">
                This is a new space. Set a strong master password — it encrypts all your content.
                <span className="text-red-400 font-semibold"> It cannot be recovered if lost.</span>
              </p>
            </div>
          )}

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
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8]
                hover:text-[#E2E8F0] transition-colors"
            >
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          {mode === 'activate' && (
            <input
              type={showPw ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm password"
              className="w-full bg-[#0B0E14] border border-white/10 rounded-xl px-4 py-3
                text-[#E2E8F0] text-sm outline-none focus:border-violet-500/50
                placeholder-[#94A3B8]/50 transition-colors"
            />
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-400
              bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
              <AlertCircle size={14} className="shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl
              text-sm font-semibold text-white transition-all
              disabled:opacity-60 disabled:cursor-not-allowed
              ${space === 'personal'
                ? 'bg-violet-600 hover:bg-violet-500 shadow-[0_0_15px_-3px_rgba(139,92,246,0.4)]'
                : 'bg-amber-600 hover:bg-amber-500 shadow-[0_0_15px_-3px_rgba(217,119,6,0.4)]'}`}
          >
            {loading
              ? <><Loader2 size={15} className="animate-spin" /> {mode === 'activate' ? 'Activating…' : 'Unlocking…'}</>
              : <>{mode === 'activate' ? '✨ Activate Sanctum' : '🔓 Unlock Sanctum'}</>}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function SanctumPage() {

  // ── Auth ────────────────────────────────────────────────────────────────────
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading]   = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { setFirebaseUser(u); setAuthLoading(false); });
    return () => unsub();
  }, []);

  const userId = firebaseUser?.uid ?? '';

  // ── Settings (activation state) ─────────────────────────────────────────────
  const [settings, setSettings]   = useState<SanctumSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    getSanctumSettings(userId)
      .then((s) => { setSettings(s); setSettingsLoading(false); })
      .catch(() => setSettingsLoading(false));
  }, [userId]);

  // ── Session state (null = locked) ───────────────────────────────────────────
  const [session, setSession] = useState<{ space: SanctumSpace; password: string } | null>(null);

  // ── Projects ─────────────────────────────────────────────────────────────────
  const [projects, setProjects]   = useState<SanctumProject[]>([]);
  const [projLoading, setProjLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ── Creator ──────────────────────────────────────────────────────────────────
  const [creatorOpen, setCreatorOpen]       = useState(false);
  const [editingProject, setEditingProject] = useState<SanctumProject | null>(null);
  const [categoryHistory, setCategoryHistory] = useState<string[]>([]);

  // ── Delete modal ─────────────────────────────────────────────────────────────
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string; name: string }>({
    open: false, id: '', name: '',
  });

  // ── Inactivity auto-lock — DISABLED (timer caused scroll-up via scroll listener) ─
  // Uncomment the block below to re-enable 60-second auto-lock with countdown.
  // Root cause of scroll issue: 'scroll' in the events array called resetLockTimer
  // on every scroll event, which called setLockCountdown() → React re-render →
  // Layout scroll container reset its position back to top on every scroll tick.
  // Removing the timer entirely fixes the scroll. If you re-enable, remove 'scroll'
  // from the events array and the problem won't recur.
  //
  // const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [lockCountdown, setLockCountdown] = useState(INACTIVITY_MS / 1000); // kept for UI display
  // const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  //
  // const resetLockTimer = useCallback(() => {
  //   if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
  //   if (countdownRef.current) clearInterval(countdownRef.current);
  //   setLockCountdown(INACTIVITY_MS / 1000);
  //   lockTimerRef.current = setTimeout(() => {
  //     setSession(null);
  //     setProjects([]);
  //     setDetailProject(null);
  //     setCreatorOpen(false);
  //   }, INACTIVITY_MS);
  //   // countdown display
  //   let remaining = INACTIVITY_MS / 1000;
  //   countdownRef.current = setInterval(() => {
  //     remaining -= 1;
  //     setLockCountdown(remaining);
  //     if (remaining <= 0) clearInterval(countdownRef.current!);
  //   }, 1000);
  // }, []);
  //
  // // Attach activity listeners when unlocked — NOTE: remove 'scroll' if re-enabling
  // useEffect(() => {
  //   if (!session) {
  //     if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
  //     if (countdownRef.current) clearInterval(countdownRef.current);
  //     return;
  //   }
  //   const events = ['mousemove', 'mousedown', 'keydown', 'touchstart'];
  //   events.forEach((ev) => window.addEventListener(ev, resetLockTimer, { passive: true }));
  //   resetLockTimer();
  //   return () => {
  //     events.forEach((ev) => window.removeEventListener(ev, resetLockTimer));
  //     if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
  //     if (countdownRef.current) clearInterval(countdownRef.current);
  //   };
  // }, [session, resetLockTimer]);

  // ── Load projects when session starts ────────────────────────────────────────
  const loadProjects = useCallback(async () => {
    if (!session || !userId) return;
    setProjLoading(true);
    try {
      const list = await getSanctumProjects(userId, session.space, session.password);
      setProjects(list);
      // derive category history from loaded projects
      const cats = [...new Set(list.map((p) => p.category).filter(Boolean))].sort();
      setCategoryHistory(cats);
    } catch (e) { console.error(e); }
    finally { setProjLoading(false); }
  }, [session, userId]);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  // ── Gate callback ─────────────────────────────────────────────────────────────
  const handleUnlocked = (space: SanctumSpace, password: string) => {
    setSession({ space, password });
    // Store in sessionStorage so [sanctumId] pages can read it without re-asking.
    // sessionStorage is tab-scoped and cleared when the tab closes — same security
    // level as React state (both are accessible via browser DevTools).
    sessionStorage.setItem('sanctum_space',    space);
    sessionStorage.setItem('sanctum_password', password);
    getSanctumSettings(userId).then(setSettings);
  };

  // ── Delete ────────────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    await deleteSanctumProject(deleteModal.id);
    setProjects((prev) => prev.filter((p) => p.id !== deleteModal.id));
    setDeleteModal({ open: false, id: '', name: '' });
  };

  // ── Filter ────────────────────────────────────────────────────────────────────
  const filtered = projects.filter((p) => {
    const q = searchQuery.toLowerCase();
    return !q || p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });

  // ── Loading guards ────────────────────────────────────────────────────────────
  if (authLoading || settingsLoading) {
    return <CuplusLoader fullScreen />;
  }

  if (!firebaseUser) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
        <p className="text-[#94A3B8] text-sm">Please sign in to access Sanctum.</p>
      </div>
    );
  }

  // ── Detail view — portal renders on document.body, outside Layout's scroll DOM ──
  // const DetailView = ({ project }: { project: SanctumProject }) => {
  //   const accentClass = project.space === 'personal'
  //     ? { badge: 'bg-violet-500/10 text-violet-400', border: 'border-violet-500/20' }
  //     : { badge: 'bg-amber-500/10 text-amber-400',   border: 'border-amber-500/20' };

  //   // Lock body scroll for the duration this overlay is mounted
  //   useEffect(() => {
  //     const prev = document.body.style.overflow;
  //     document.body.style.overflow = 'hidden';
  //     return () => { document.body.style.overflow = prev; };
  //   }, []);

  //   return createPortal(
  //     <div className="fixed inset-0 z-[9999] bg-[#0B0E14] flex flex-col">

  //       {/* ── Sticky header ── */}
  //       <header className="shrink-0 bg-[#151922]/95 backdrop-blur border-b border-white/10
  //         px-4 sm:px-8 py-4 flex items-center gap-3">
  //         <button
  //           onClick={() => setDetailProject(null)}
  //           className="flex items-center gap-1.5 text-sm text-[#94A3B8]
  //             hover:text-[#E2E8F0] transition-colors shrink-0"
  //         >
  //           ← Back
  //         </button>
  //         <span className="text-white/20">/</span>
  //         <h1 className="flex-1 font-semibold text-[#E2E8F0] text-base truncate min-w-0">
  //           {project.title}
  //         </h1>
  //         <button
  //           onClick={() => { setDetailProject(null); setEditingProject(project); setCreatorOpen(true); }}
  //           className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#94A3B8]
  //             hover:text-[#E2E8F0] hover:bg-white/10 border border-white/10
  //             rounded-lg transition-colors shrink-0"
  //         >
  //           <Edit2 size={13} /> Edit
  //         </button>
  //         <button
  //           onClick={() => {
  //             setDetailProject(null);
  //             setDeleteModal({ open: true, id: project.id, name: project.title });
  //           }}
  //           className="p-1.5 text-[#94A3B8] hover:text-red-400 hover:bg-red-500/10
  //             rounded-lg transition-colors border border-white/10 shrink-0"
  //         >
  //           <Trash2 size={14} />
  //         </button>
  //       </header>

  //       {/* ── Body: scrollable main + sticky sidebar ── */}
  //       {/* flex-1 + min-h-0 gives the row a bounded height so overflow-y-auto works */}
  //       <div className="flex flex-1 min-h-0 gap-8 px-4 sm:px-8 py-8
  //         max-w-6xl mx-auto w-full overflow-hidden">

  //         {/* Main content — ONLY this scrolls */}
  //         <main className="flex-1 min-w-0 overflow-y-auto pr-1">
  //           {project.thumbnailUrl && (
  //             <div className="w-full h-56 sm:h-72 rounded-2xl overflow-hidden mb-8 border border-white/10">
  //               {/* eslint-disable-next-line @next/next/no-img-element */}
  //               <img src={project.thumbnailUrl} alt={project.title}
  //                 className="w-full h-full object-cover" />
  //             </div>
  //           )}

  //           <div className="flex items-center flex-wrap gap-2 mb-3">
  //             {project.category && (
  //               <span className="px-2.5 py-0.5 rounded-full text-xs font-medium
  //                 bg-violet-500/15 text-violet-300 border border-violet-500/20">
  //                 {project.category}
  //               </span>
  //             )}
  //             <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase
  //               ${accentClass.badge}`}>
  //               🔐 {project.space}
  //             </span>
  //           </div>

  //           <h1 className="text-3xl sm:text-4xl font-bold text-[#E2E8F0] mb-6 leading-tight">
  //             {project.title}
  //           </h1>

  //           <div
  //             className="editor-body prose-invert text-[#E2E8F0] text-sm leading-7"
  //             dangerouslySetInnerHTML={{
  //               __html: project.content ||
  //                 '<p style="color:#94A3B8">No content yet. Click Edit to start writing.</p>',
  //             }}
  //           />
  //         </main>

  //         {/* Sidebar — sticky, never scrolls itself */}
  //         <aside className="w-60 shrink-0 hidden lg:block">
  //           <div className="sticky top-0 space-y-4">

  //             {/* Project Info */}
  //             <div className="bg-[#151922] border border-white/10 rounded-2xl p-4 space-y-4">
  //               <h3 className="text-xs text-[#94A3B8] font-semibold uppercase tracking-wider">
  //                 Project Info
  //               </h3>

  //               {project.category && (
  //                 <div className="flex items-start gap-2">
  //                   <Tag size={14} className="text-[#94A3B8] mt-0.5 shrink-0" />
  //                   <div>
  //                     <p className="text-xs text-[#94A3B8] mb-0.5">Category</p>
  //                     <span className="text-sm text-[#E2E8F0] font-medium">{project.category}</span>
  //                   </div>
  //                 </div>
  //               )}

  //               <div className="flex items-start gap-2">
  //                 <Shield size={14} className="text-[#94A3B8] mt-0.5 shrink-0" />
  //                 <div>
  //                   <p className="text-xs text-[#94A3B8] mb-0.5">Space</p>
  //                   <span className={`text-sm font-semibold capitalize
  //                     ${project.space === 'personal' ? 'text-violet-400' : 'text-amber-400'}`}>
  //                     {project.space === 'personal' ? '🔮' : '💼'} {project.space}
  //                   </span>
  //                 </div>
  //               </div>

  //               {(project.wordCount ?? 0) > 0 && (
  //                 <div className="flex items-start gap-2">
  //                   <BookOpen size={14} className="text-[#94A3B8] mt-0.5 shrink-0" />
  //                   <div>
  //                     <p className="text-xs text-[#94A3B8] mb-0.5">Word count</p>
  //                     <span className="text-sm text-[#E2E8F0] font-medium">
  //                       {project.wordCount?.toLocaleString()} words
  //                     </span>
  //                   </div>
  //                 </div>
  //               )}

  //               <div className="flex items-start gap-2">
  //                 <Calendar size={14} className="text-[#94A3B8] mt-0.5 shrink-0" />
  //                 <div>
  //                   <p className="text-xs text-[#94A3B8] mb-0.5">Last updated</p>
  //                   <span className="text-xs text-[#E2E8F0]">{formatDate(project.updatedAt)}</span>
  //                 </div>
  //               </div>

  //               <div className="flex items-start gap-2">
  //                 <Calendar size={14} className="text-[#94A3B8] mt-0.5 shrink-0" />
  //                 <div>
  //                   <p className="text-xs text-[#94A3B8] mb-0.5">Created</p>
  //                   <span className="text-xs text-[#E2E8F0]">{formatDate(project.createdAt)}</span>
  //                 </div>
  //               </div>

  //               {/* Encryption notice */}
  //               <div className={`rounded-xl p-2.5 bg-violet-500/10 border ${accentClass.border}`}>
  //                 <p className="text-[10px] text-violet-300 leading-relaxed">
  //                   🔒 Title & content are AES-256 encrypted. Only you can read this.
  //                 </p>
  //               </div>
  //             </div>

  //             {/* Quick Actions */}
  //             <div className="bg-[#151922] border border-white/10 rounded-2xl p-4 space-y-1">
  //               <h3 className="text-xs text-[#94A3B8] font-semibold uppercase tracking-wider mb-3">
  //                 Quick Actions
  //               </h3>
  //               <button
  //                 onClick={() => { setDetailProject(null); setEditingProject(project); setCreatorOpen(true); }}
  //                 className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#94A3B8]
  //                   hover:text-[#E2E8F0] hover:bg-white/5 rounded-lg transition-colors text-left"
  //               >
  //                 <Edit2 size={13} /> Edit Document
  //               </button>
  //               <button
  //                 onClick={() => {
  //                   setDetailProject(null);
  //                   setDeleteModal({ open: true, id: project.id, name: project.title });
  //                 }}
  //                 className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400
  //                   hover:bg-red-500/10 rounded-lg transition-colors text-left"
  //               >
  //                 <Trash2 size={13} /> Delete forever
  //               </button>
  //             </div>
  //           </div>
  //         </aside>
  //       </div>
  //     </div>,
  //     document.body
  //   );
  // };

  return (
    <Layout>
      <div className="min-h-screen bg-[#0B0E14] w-full relative overflow-y-auto mt-10 md:mt-0">

        {/* ── Locked: show gate ── */}
        {!session ? (
          <SanctumGate
            settings={settings}
            onUnlocked={handleUnlocked}
            userId={userId}
          />
        ) : (
          <>
            {/* ── Unlocked content ── */}
            <div className="px-4 sm:px-8 pb-16 pt-6 sm:pb-8">

            {/* ── Desktop-only slim top bar: Switch button ── */}
              {/* On mobile the Switch button lives inside SanctumHero */}
              <div className="hidden sm:flex items-center justify-end gap-2 mb-4">
                {/* Countdown pill disabled — uncomment to re-enable (remove 'scroll' from timer events first)
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs
                  border transition-colors
                  ${lockCountdown <= 15
                    ? 'bg-red-500/10 border-red-500/20 text-red-400'
                    : 'bg-white/5 border-white/10 text-[#94A3B8]'}`}>
                  <Lock size={11} />
                  Locks in {lockCountdown}s
                </div>
                */}
              </div>

              {/* ── Hero banner (has mobile lock controls built in) ── */}
              <SanctumHero
                space={session.space}
                onCreateNew={() => { setEditingProject(null); setCreatorOpen(true); }}
                onLock={() => { setSession(null); setProjects([]); sessionStorage.removeItem('sanctum_space'); sessionStorage.removeItem('sanctum_password'); }}
                lockCountdown={lockCountdown}
              />

              {/* Search */}
              <div className="mb-6">
                <div className="relative w-full">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2
                    text-[#94A3B8] pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search Sanctum projects…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#151922] border border-white/10 rounded-2xl
                      pl-10 pr-4 py-3 text-[#E2E8F0] text-sm outline-none
                      focus:border-violet-500/50 placeholder-[#94A3B8]/60 transition-colors"
                  />
                </div>
              </div>

              {/* Grid */}
              {projLoading ? (
                <CuplusLoader label="Decrypting Projects…" />
              ) : filtered.length === 0 ? (
                <div className="py-24 text-center">
                  <p className="text-5xl mb-4">🔐</p>
                  <p className="text-[#94A3B8] text-sm">
                    {searchQuery
                      ? `No projects matching "${searchQuery}"`
                      : 'No projects in this Sanctum space yet.'}
                  </p>
                  {!searchQuery && (
                    <button
                      onClick={() => { setEditingProject(null); setCreatorOpen(true); }}
                      className="mt-4 px-5 py-2.5 bg-violet-600 hover:bg-violet-500
                        text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                      + Create your first project
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filtered.map((p) => (
                    <SanctumCard
                      key={p.id}
                      project={p}
                      onEdit={(proj) => { setEditingProject(proj); setCreatorOpen(true); }}
                      onDelete={(id, name) => setDeleteModal({ open: true, id, name })}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ── SanctumCreator overlay ── */}
            <SanctumCreator
              isOpen={creatorOpen}
              onClose={() => { setCreatorOpen(false); setEditingProject(null); }}
              onSaved={() => { setCreatorOpen(false); setEditingProject(null); loadProjects(); }}
              userId={userId}
              space={session.space}
              password={session.password}
              editProject={editingProject}
              categoryHistory={categoryHistory}
            />

          </>
        )}

        {/* ── Delete confirmation ── */}
        <DeleteConfirmation
          isOpen={deleteModal.open}
          itemName={deleteModal.name}
          type="project"
          permanent={true}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteModal({ open: false, id: '', name: '' })}
        />
      </div>
    </Layout>
  );
}
