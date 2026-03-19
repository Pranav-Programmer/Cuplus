'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { X, Loader2, Save, AlertCircle } from 'lucide-react';
import CuplusLoader from '@/components/CuplusLoader';
import ThumbnailUpload from './ThumbnailUpload';
import CategoryInput from './CategoryInput';
import { ProjectInput } from './editor/types';
import { createProject, updateProject, getUserCategories } from '@/lib/projects';
import { uploadToCloudinary } from '@/lib/cloudinary';

// Dynamic import – contenteditable is browser-only
const RichTextEditor = dynamic(() => import('./editor/RichTextEditor'), {
  ssr: false,
  loading: () => (
    <CuplusLoader />
  ),
});

interface ProjectCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (projectId: string) => void;
  userId: string;
  editProject?: {
    id: string;
    title: string;
    category: string;
    content: string;
    thumbnailUrl?: string;
    color?: string;
  } | null;
}

export default function ProjectCreator({
  isOpen,
  onClose,
  onSaved,
  userId,
  editProject = null,
}: ProjectCreatorProps) {
  const [title, setTitle]             = useState('');
  const [category, setCategory]       = useState('');
  const [content, setContent]         = useState('');   // tracks current HTML for saving
  const [thumbnailUrl, setThumbnail]  = useState('');
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');
  const [lastSaved, setLastSaved]     = useState<Date | null>(null);
  const [categoryHistory, setCategoryHistory] = useState<string[]>([]);

  // ── Stable seed values for the editor ─────────────────────────────────────
  // CRITICAL: These are passed as `initialContent` + `key` to RichTextEditor.
  // They must ONLY change when a genuinely different project is opened —
  // never on every keystroke (which would cause reverse-writing via innerHTML reset).
  //
  // `editorKey`            → changing it unmounts + remounts the editor cleanly
  // `editorInitialContent` → the HTML that the freshly mounted editor seeds from
  //
  // `content` state is updated by onChange for saving purposes only and is
  // NEVER fed back into `initialContent` — that would close the feedback loop.
  const [editorKey, setEditorKey]                       = useState(0);
  const [editorInitialContent, setEditorInitialContent] = useState('');

  // ── Populate fields when opening a project ─────────────────────────────────
  useEffect(() => {
    if (editProject) {
      setTitle(editProject.title);
      setCategory(editProject.category);
      setContent(editProject.content);
      setThumbnail(editProject.thumbnailUrl ?? '');
      // Bump the key so the editor unmounts/remounts with fresh content
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

  // ── Load category history from Firestore ───────────────────────────────────
  useEffect(() => {
    if (!isOpen || !userId) return;
    getUserCategories(userId)
      .then(setCategoryHistory)
      .catch(() => {/* non-fatal */});
  }, [isOpen, userId]);

  // ── Keyboard shortcut ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, title, category, content, thumbnailUrl]);

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!title.trim()) { setError('Please add a project title.'); return; }
    setError('');
    setSaving(true);
    try {
      const wordCount = content
        ? new DOMParser()
            .parseFromString(content, 'text/html')
            .body.innerText.trim()
            .split(/\s+/).length
        : 0;

      const payload: ProjectInput = {
        title: title.trim(),
        category: category.trim(),
        content,
        thumbnailUrl,
        wordCount,
      };

      if (editProject) {
        await updateProject(editProject.id, payload);
        onSaved?.(editProject.id);
      } else {
        const id = await createProject(payload, userId);
        onSaved?.(id);
      }

      // Optimistically add the new category to local history
      if (category.trim() && !categoryHistory.includes(category.trim())) {
        setCategoryHistory((prev) => [...prev, category.trim()].sort());
      }

      setLastSaved(new Date());
    } catch (e: any) {
      setError(e.message ?? 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [title, category, content, thumbnailUrl, editProject, userId, onSaved, categoryHistory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] flex flex-col bg-[#0B0E14]">

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

        {/* Editable title */}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled Project…"
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
            className="flex items-center gap-2 px-4 py-2 bg-[#2e5bff] hover:bg-[#1a40cc]
              disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold
              rounded-lg transition-colors shadow-[0_0_15px_-3px_rgba(46,91,255,0.4)]"
          >
            {saving
              ? <Loader2 size={14} className="animate-spin" />
              : <Save size={14} />}
            {saving ? 'Saving…' : editProject ? 'Update' : 'Publish'}
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left meta panel (desktop) ── */}
        <aside className="w-72 shrink-0 border-r border-white/10 bg-[#151922]
          overflow-y-auto hidden lg:flex flex-col p-5 gap-5">

          {/* Thumbnail */}
          <div>
            <p className="text-xs text-[#94A3B8] font-semibold mb-2 uppercase tracking-wider">
              Thumbnail
            </p>
            <ThumbnailUpload value={thumbnailUrl} onChange={setThumbnail} />
          </div>

          {/* Category – free text with autocomplete */}
          <div>
            <p className="text-xs text-[#94A3B8] font-semibold mb-2 uppercase tracking-wider">
              Category
            </p>
            <CategoryInput
              value={category}
              onChange={setCategory}
              suggestions={categoryHistory}
              placeholder="e.g. Research, Design…"
            />
            <p className="text-[10px] text-[#94A3B8]/50 mt-1.5">
              {categoryHistory.length > 0
                ? 'Type to filter or create a new category'
                : 'Type to create your first category'}
            </p>
          </div>

          {/* Shortcuts hint */}
          <div className="rounded-xl bg-[#2e5bff]/10 border border-[#2e5bff]/20 p-3">
            <p className="text-xs text-[#60A5FA] font-semibold mb-1.5">Shortcuts</p>
            <ul className="text-xs text-[#94A3B8] space-y-1">
              <li><kbd className="bg-white/10 px-1 rounded text-[10px]">Ctrl+S</kbd> Save</li>
              <li><kbd className="bg-white/10 px-1 rounded text-[10px]">Ctrl+V</kbd> Paste</li>
              <li><kbd className="bg-white/10 px-1 rounded text-[10px]">Ctrl+Shift+V</kbd>Paste as Plain Text</li>
              <li><kbd className="bg-white/10 px-1 rounded text-[10px]">Ctrl+Q</kbd>Cycle Block Format</li>
              <li><kbd className="bg-white/10 px-1 rounded text-[10px]">Ctrl+B</kbd> Bold</li>
              <li><kbd className="bg-white/10 px-1 rounded text-[10px]">Ctrl+I</kbd> Italic</li>
              <li><kbd className="bg-white/10 px-1 rounded text-[10px]">Ctrl+U</kbd> Underline</li>
              <li><kbd className="bg-white/10 px-1 rounded text-[10px]">Esc</kbd> Close</li>
              <li><kbd className="bg-white/10 px-1 rounded text-[10px]">Ctrl+Z</kbd>Undo</li>
              <li><kbd className="bg-white/10 px-1 rounded text-[10px]">Ctrl+Y</kbd>Redo</li>
            </ul>
          </div>
        </aside>

        {/* ── Right editor area ── */}
        {/*
         * CRITICAL: overflow-hidden here so the outer <main> does NOT scroll.
         * Scrolling happens ONLY inside RichTextEditor's content div.
         * This is what keeps the toolbar pinned at the top.
         */}
        <main className="flex-1 min-w-0 flex flex-col overflow-hidden">

          {/* Mobile meta row */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10
            lg:hidden flex-shrink-0">
            <div className="flex-1">
              <CategoryInput
                value={category}
                onChange={setCategory}
                suggestions={categoryHistory}
                placeholder="Category…"
              />
            </div>
            <label
              className="flex items-center justify-center w-9 h-9 rounded-lg border border-white/10
                bg-[#1e2330] cursor-pointer hover:border-[#2e5bff]/50 transition-colors"
              title="Upload thumbnail"
            >
              <span className="text-lg">🖼</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try { setThumbnail(await uploadToCloudinary(file)); } catch {}
                  e.target.value = '';
                }}
              />
            </label>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mx-4 mt-3 flex items-center gap-2 text-sm text-red-400
              bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 flex-shrink-0">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {/*
           * Editor wrapper:
           *   flex-1 min-h-0  → fills remaining height, allows shrinking
           *   overflow-hidden → do NOT scroll here; editor scrolls inside
           *   flex flex-col   → so RichTextEditor fills with flex-1
           */}
          <div className="flex-1 min-h-0 flex flex-col p-4 sm:p-8 overflow-hidden">
            <div className="flex-1 min-h-0 flex flex-col max-w-4xl w-full mx-auto">
              <RichTextEditor
                key={editorKey}
                initialContent={editorInitialContent}
                onChange={setContent}
                placeholder="Start writing your project document…"
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
