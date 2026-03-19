'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  MoreVertical, Edit2, Trash2, Archive, ExternalLink, ArchiveRestore,
} from 'lucide-react';
import { Project } from './editor/types';

interface ProjectCardProps {
  project: Project;
  /** Called when user clicks Edit — opens ProjectCreator pre-filled */
  onEdit?: (project: Project) => void;
  /** Soft-delete: sends project to Recycle Bin */
  onRemove?: (id: string) => void;
  /** Archive the project */
  onArchive?: (id: string) => void;
  /** Unarchive (shown only on the Archive page) */
  onUnarchive?: (id: string) => void;
}

function formatDate(ts: any): string {
  if (!ts) return '';
  const date = ts?.seconds
    ? new Date(ts.seconds * 1000)
    : ts instanceof Date ? ts : new Date(ts);
  return date.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function getExcerpt(html: string, maxLen = 120): string {
  if (!html) return '';
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text;
}

export default function ProjectCard({
  project,
  onEdit,
  onRemove,
  onArchive,
  onUnarchive,
}: ProjectCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const stopProp = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div
      className="group relative bg-[#151922] border border-white/10 rounded-2xl overflow-hidden
        hover:border-[#2e5bff]/40 transition-all duration-300
        hover:shadow-[0_0_20px_-5px_rgba(46,91,255,0.25)] flex flex-col"
    >
      {/* ── Thumbnail ── */}
      <Link href={`/projects/${project.id}`} className="block">
        {project.thumbnailUrl ? (
          <div className="h-44 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={project.thumbnailUrl}
              alt={project.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="h-44 bg-gradient-to-br from-[#1e2330] to-[#0B0E14] flex items-center
            justify-center border-b border-white/5">
            <span className="text-5xl opacity-20 select-none">📄</span>
          </div>
        )}
      </Link>

      {/* ── Body ── */}
      <div className="flex-1 p-4 flex flex-col gap-2">
        {project.category && (
          <span className="inline-flex w-fit px-2.5 py-0.5 rounded-full text-xs font-medium
            bg-[#2e5bff]/15 text-[#60A5FA] border border-[#2e5bff]/20">
            {project.category}
          </span>
        )}

        <Link href={`/projects/${project.id}`}>
          <h3 className="font-bold text-[#E2E8F0] text-base leading-snug line-clamp-2
            hover:text-[#60A5FA] transition-colors">
            {project.title}
          </h3>
        </Link>

        <p className="text-sm text-[#94A3B8] line-clamp-2 leading-relaxed flex-1">
          {getExcerpt(project.content)}
        </p>

        {/* ── Footer row ── */}
        <div className="flex items-center justify-between pt-1 mt-auto">
          <span className="text-xs text-[#94A3B8]/60">{formatDate(project.updatedAt)}</span>

          {/* Actions kebab menu */}
          <div className="relative" onClick={stopProp}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="p-1 rounded-lg text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-white/10
                transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreVertical size={15} />
            </button>

            {menuOpen && (
              <>
                {/* Backdrop */}
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />

                <div className="absolute right-0 bottom-full mb-1 w-48 bg-[#151922]
                  border border-white/10 rounded-xl shadow-2xl z-50 py-1 overflow-hidden">

                  {/* ── Open — "Open in new tab" on md+, "Open" on mobile ── */}
                  <Link
                    href={`/projects/${project.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-[#94A3B8]
                      hover:bg-white/5 hover:text-[#E2E8F0] transition-colors"
                  >
                    <ExternalLink size={13} />
                    {/* Responsive label */}
                    <span className="hidden md:inline">Open in new tab</span>
                    <span className="md:hidden">Open</span>
                  </Link>

                  {/* ── Edit ── */}
                  {onEdit && (
                    <button
                      onClick={() => { setMenuOpen(false); onEdit(project); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#94A3B8]
                        hover:bg-white/5 hover:text-[#E2E8F0] transition-colors"
                    >
                      <Edit2 size={13} /> Edit
                    </button>
                  )}

                  {/* ── Archive  OR  Unarchive ── */}
                  {onArchive && (
                    <button
                      onClick={() => { setMenuOpen(false); onArchive(project.id); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#94A3B8]
                        hover:bg-white/5 hover:text-[#E2E8F0] transition-colors"
                    >
                      <Archive size={13} /> Archive
                    </button>
                  )}

                  {onUnarchive && (
                    <button
                      onClick={() => { setMenuOpen(false); onUnarchive(project.id); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#94A3B8]
                        hover:bg-white/5 hover:text-[#E2E8F0] transition-colors"
                    >
                      <ArchiveRestore size={13} /> Restore to Projects
                    </button>
                  )}

                  {/* ── Remove (soft-delete → Recycle Bin) ── */}
                  {onRemove && (
                    <>
                      <div className="mx-3 my-1 border-t border-white/5" />
                      <button
                        onClick={() => { setMenuOpen(false); onRemove(project.id); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400
                          hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={13} /> Remove
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
