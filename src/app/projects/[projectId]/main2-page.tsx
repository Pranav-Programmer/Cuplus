'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  ArrowLeft, Save, Edit2, Loader2, Calendar,
  BookOpen, Tag, ExternalLink, Trash2
} from 'lucide-react';
import { getProject, updateProject, removeProject } from '@/lib/projects';
import { Project } from '@/components/editor/types';
import DeleteConfirmation from "@/components/DeleteConfirmation";

const RichTextEditor = dynamic(() => import('@/components/editor/RichTextEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-20 text-[#94A3B8]">
      <Loader2 className="animate-spin mr-2" size={20} /> Loading editor…
    </div>
  ),
});

function formatDate(ts: any): string {
  if (!ts) return '—';
  const date = ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  return date.toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [content, setContent] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // ── Load project ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!projectId) return;
    (async () => {
      setLoading(true);
      const p = await getProject(projectId);
      if (!p) { setError('Project not found.'); setLoading(false); return; }
      setProject(p);
      setContent(p.content ?? '');
      setLoading(false);
    })();
  }, [projectId]);

  // ── Save ─────────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!project) return;
    setSaving(true);
    try {
      const wordCount = content
        ? new DOMParser().parseFromString(content, 'text/html').body.innerText.trim().split(/\s+/).length
        : 0;
      await updateProject(project.id, { content, wordCount });
      setProject((p) => p ? { ...p, content, wordCount } : p);
      setLastSaved(new Date());
      setEditMode(false);
    } catch (e: any) {
      setError(e.message ?? 'Save failed.');
    } finally {
      setSaving(false);
    }
  }, [project, content]);

  // Ctrl+S shortcut
  useEffect(() => {
    if (!editMode) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSave(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [editMode, handleSave]);

  // const handleDelete = async () => {
  //   if (!project) return;
  //   if (!confirm('Move this project to Recycle Bin?')) return;
  //   await removeProject(project.id);
  //   router.push('/projects');
  // };

  //Delete confirmation modal (optional enhancement)
  const openDeleteModal = () => setShowDeleteModal(true);
  const confirmDelete = async () => {
    if (!project) return;
    await removeProject(project.id);
    router.push('/projects');
    setShowDeleteModal(false);
  };
  const cancelDelete = () => setShowDeleteModal(false);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center text-[#94A3B8]">
        <Loader2 className="animate-spin mr-2" size={24} /> Loading…
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex flex-col items-center justify-center gap-4">
        <p className="text-red-400">{error || 'Project not found.'}</p>
        <Link href="/projects" className="text-sm text-[#60A5FA] hover:underline">
          ← Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] flex flex-col">

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-[#151922]/95 backdrop-blur border-b border-white/10 px-4 sm:px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link
            href="/projects"
            className="flex items-center gap-1.5 text-sm text-[#94A3B8] hover:text-[#E2E8F0] transition-colors"
          >
            <ArrowLeft size={16} /> Projects
          </Link>

          <span className="text-white/20">/</span>

          <h1 className="flex-1 font-semibold text-[#E2E8F0] text-base truncate">
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
                  onClick={() => { setEditMode(false); setContent(project.content ?? ''); }}
                  className="px-3 py-1.5 text-sm text-[#94A3B8] hover:text-[#E2E8F0]
                    bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold text-white
                    bg-[#2e5bff] hover:bg-[#1a40cc] rounded-lg transition-colors
                    disabled:opacity-60 disabled:cursor-not-allowed
                    shadow-[0_0_15px_-3px_rgba(46,91,255,0.4)]"
                >
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setEditMode(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#94A3B8]
                    hover:text-[#E2E8F0] hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
                >
                  <Edit2 size={13} /> Edit
                </button>
                {/* <button
                  onClick={handleDelete}
                  className="p-1.5 text-[#94A3B8] hover:text-red-400 hover:bg-red-500/10
                    rounded-lg transition-colors border border-white/10"
                >
                  <Trash2 size={14} />
                </button> */}
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex-1 flex max-w-5xl mx-auto w-full px-4 sm:px-8 py-8 gap-8">

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {/* Hero thumbnail */}
          {project.thumbnailUrl && (
            <div className="w-full h-56 sm:h-72 rounded-2xl overflow-hidden mb-8 border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={project.thumbnailUrl}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-[#E2E8F0] mb-6 leading-tight">
            {project.title}
          </h1>

          {/* Editor or read-only view */}
          {editMode ? (
            <RichTextEditor
              initialContent={content}
              onChange={setContent}
              placeholder="Write your project content…"
              minHeight="0px"
              className="h-[calc(100vh-280px)] min-h-[500px]"
            />
          ) : (
            <div
              className="editor-body prose-invert text-[#E2E8F0] text-sm leading-7"
              dangerouslySetInnerHTML={{ __html: project.content || '<p class="text-[#94A3B8]">No content yet. Click Edit to start writing.</p>' }}
            />
          )}
        </main>

        {/* Sidebar meta */}
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

              {project.wordCount !== undefined && (
                <div className="flex items-start gap-2">
                  <BookOpen size={14} className="text-[#94A3B8] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-[#94A3B8] mb-0.5">Word count</p>
                    <span className="text-sm text-[#E2E8F0] font-medium">
                      {project.wordCount.toLocaleString()} words
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
            </div>

            {/* Quick actions */}
            <div className="bg-[#151922] border border-white/10 rounded-2xl p-4 space-y-2">
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
                onClick={() => window.print()}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#94A3B8]
                  hover:text-[#E2E8F0] hover:bg-white/5 rounded-lg transition-colors text-left"
              >
                <ExternalLink size={13} /> Print / Export
              </button>
              <button
                onClick={openDeleteModal}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400
                  hover:bg-red-500/10 rounded-lg transition-colors text-left"
              >
                <Trash2 size={13} /> Move to Recycle Bin
              </button>
            </div>
          </div>
        </aside>
      </div>
      <DeleteConfirmation
        isOpen={showDeleteModal}
        itemName={project?.title || "this project"} // NEW: itemName
        type="project" // NEW: type="project"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}
