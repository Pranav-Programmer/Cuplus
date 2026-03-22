'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { X, Loader2, Save, AlertCircle } from 'lucide-react';
import CuplusLoader from '@/components/CuplusLoader';
import ThumbnailUpload from '../ThumbnailUpload';
import CategoryInput from '../CategoryInput';
import {
  createSanctumProject,
  updateSanctumProject,
  SanctumProject,
  SanctumSpace,
} from '@/lib/sanctum';

const RichTextEditor = dynamic(() => import('../editor/RichTextEditor'), {
  ssr: false,
  loading: () => (
    <CuplusLoader />
  ),
});

interface SanctumCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
  userId: string;
  space: SanctumSpace;
  password: string;           // session password for encryption
  editProject?: SanctumProject | null;
  categoryHistory?: string[]; // previously used categories in this space
}

export default function SanctumCreator({
  isOpen,
  onClose,
  onSaved,
  userId,
  space,
  password,
  editProject = null,
  categoryHistory = [],
}: SanctumCreatorProps) {
  const [title, setTitle]             = useState('');
  const [category, setCategory]       = useState('');
  const [content, setContent]         = useState('');
  const [thumbnailUrl, setThumbnail]  = useState('');
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');
  const [lastSaved, setLastSaved]     = useState<Date | null>(null);

  // ── Stable editor seed (same pattern as ProjectCreator to prevent reverse-write bug) ──
  const [editorKey, setEditorKey]                       = useState(0);
  const [editorInitialContent, setEditorInitialContent] = useState('');

  useEffect(() => {
    if (editProject) {
      setTitle(editProject.title);
      setCategory(editProject.category);
      setContent(editProject.content);
      setThumbnail(editProject.thumbnailUrl ?? '');
      setEditorInitialContent(editProject.content);
      setEditorKey((k) => k + 1);
    } else {
      setTitle('');
      setCategory('');
      setContent('');
      setThumbnail('');
      setEditorInitialContent('');
      setEditorKey((k) => k + 1);
    }
    setError('');
    setLastSaved(null);
  }, [editProject, isOpen]);

  // ── Ctrl+S shortcut ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSave(); }
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, title, category, content, thumbnailUrl]);

  // ── Save (encrypts before writing) ────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!title.trim()) { setError('Please add a project title.'); return; }
    setError('');
    setSaving(true);
    try {
      const wordCount = content
        ? new DOMParser()
            .parseFromString(content, 'text/html')
            .body.innerText.trim()
            .split(/\s+/).filter(Boolean).length
        : 0;

      if (editProject) {
        await updateSanctumProject(
          editProject.id,
          { title: title.trim(), category: category.trim(), content, thumbnailUrl, wordCount },
          password
        );
        onSaved?.();
      } else {
        await createSanctumProject(
          { title: title.trim(), category: category.trim(), content, thumbnailUrl, wordCount },
          userId,
          space,
          password
        );
        onSaved?.();
      }
      setLastSaved(new Date());
      onClose();
    } catch (e: any) {
      setError(e.message ?? 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [title, category, content, thumbnailUrl, editProject, userId, space, password, onSaved, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-500 flex flex-col bg-[#0B0E14]">

      {/* ── Top bar ── */}
      <header className="flex items-center gap-3 px-4 sm:px-6 py-3 bg-[#151922]
        border-b border-white/10 shrink-0">
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#E2E8F0]
            hover:bg-white/10 transition-colors"
          title="Close (Esc)"
        >
          <X size={18} />
        </button>

        {/* Space badge */}
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider
          ${space === 'personal'
            ? 'bg-violet-500/15 text-violet-300 border border-violet-500/20'
            : 'bg-amber-500/15 text-amber-300 border border-amber-500/20'}`}>
          🔐 {space}
        </span>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled Sanctum Project…"
          className="flex-1 bg-transparent text-[#E2E8F0] font-semibold text-base
            outline-none placeholder-[#94A3B8]/50 min-w-0"
        />

        <div className="flex items-center gap-2 shrink-0">
          {lastSaved && (
            <span className="text-xs text-[#94A3B8]/60 hidden sm:block">
              Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark
              disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold
              rounded-lg transition-colors shadow-[0_0_15px_-3px_rgba(46,91,255,0.4)]"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Encrypting…' : editProject ? 'Update' : 'Save'}
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left panel */}
        <aside className="w-72 shrink-0 border-r border-white/10 bg-[#151922]
          overflow-y-auto hidden lg:flex flex-col p-5 gap-5">

          <div>
            <p className="text-xs text-[#94A3B8] font-semibold mb-2 uppercase tracking-wider">Thumbnail</p>
            <ThumbnailUpload value={thumbnailUrl} onChange={setThumbnail} />
          </div>

          <div>
            <p className="text-xs text-[#94A3B8] font-semibold mb-2 uppercase tracking-wider">Category</p>
            <CategoryInput
              value={category}
              onChange={setCategory}
              suggestions={categoryHistory}
              placeholder="e.g. Private, Work…"
            />
          </div>

          {/* Security notice */}
          <div className="rounded-xl bg-violet-500/10 border border-violet-500/20 p-3">
            <p className="text-xs text-violet-300 font-semibold mb-1.5">🔒 End-to-end encrypted</p>
            <p className="text-[10px] text-[#94A3B8]/70 leading-relaxed">
              Title and content are AES-256 encrypted before leaving your device.
              Only you can decrypt them with your Sanctum password.
            </p>
          </div>

          <div className="rounded-xl bg-[#1e2330] border border-white/5 p-3">
            <p className="text-xs text-[#60A5FA] font-semibold mb-1.5">Shortcuts</p>
            <ul className="text-xs text-[#94A3B8] space-y-1">
              <li><kbd className="bg-white/10 px-1 rounded text-[10px]">Ctrl+S</kbd> Save</li>
              <li><kbd className="bg-white/10 px-1 rounded text-[10px]">Ctrl+B</kbd> Bold</li>
              <li><kbd className="bg-white/10 px-1 rounded text-[10px]">Esc</kbd> Close</li>
            </ul>
          </div>
        </aside>

        {/* Editor area */}
        <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {error && (
            <div className="mx-4 mt-3 flex items-center gap-2 text-sm text-red-400
              bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 shrink-0">
              <AlertCircle size={14} />
              {error}
            </div>
          )}
          <div className="flex-1 min-h-0 flex flex-col p-4 sm:p-8 overflow-hidden">
            <div className="flex-1 min-h-0 flex flex-col max-w-4xl w-full mx-auto">
              <RichTextEditor
                key={editorKey}
                initialContent={editorInitialContent}
                onChange={setContent}
                placeholder="Write your encrypted content here…"
                minHeight="0px"
                className="flex-1 min-h-0"
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
