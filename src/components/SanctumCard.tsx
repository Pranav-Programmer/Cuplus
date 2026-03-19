'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MoreVertical, Edit2, Trash2, ExternalLink, Shield } from 'lucide-react';
import { SanctumProject } from '@/lib/sanctum';

interface SanctumCardProps {
  project: SanctumProject;
  onEdit: (project: SanctumProject) => void;
  onDelete: (id: string, title: string) => void;
}

function formatDate(ts: any): string {
  if (!ts) return '';
  const d = ts?.seconds ? new Date(ts.seconds * 1000) : ts?.toDate?.() ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getExcerpt(html: string, maxLen = 110): string {
  if (!html) return '';
  const t = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return t.length > maxLen ? t.slice(0, maxLen) + '…' : t;
}

export default function SanctumCard({ project, onEdit, onDelete }: SanctumCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const href = `/sanctum/${project.id}`;

  return (
    <div className="group relative bg-[#151922] border border-white/10 rounded-2xl overflow-hidden
      hover:border-violet-500/30 transition-all duration-300
      hover:shadow-[0_0_20px_-5px_rgba(139,92,246,0.2)] flex flex-col">

      {/* Thumbnail — links to detail page */}
      <Link href={href} className="block">
        {project.thumbnailUrl ? (
          <div className="h-44 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={project.thumbnailUrl} alt="thumbnail"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          </div>
        ) : (
          <div className="h-44 bg-gradient-to-br from-[#1a1330] to-[#0B0E14]
            flex items-center justify-center border-b border-white/5">
            <Shield size={36} className="text-violet-500/30" />
          </div>
        )}
      </Link>

      {/* Body */}
      <div className="flex-1 p-4 flex flex-col gap-2">
        {project.category && (
          <span className="inline-flex w-fit px-2.5 py-0.5 rounded-full text-xs font-medium
            bg-violet-500/15 text-violet-300 border border-violet-500/20">
            {project.category}
          </span>
        )}

        <Link href={href}>
          <h3 className="font-bold text-[#E2E8F0] text-base leading-snug line-clamp-2
            hover:text-violet-300 transition-colors">
            {project.title}
          </h3>
        </Link>

        <p className="text-sm text-[#94A3B8] line-clamp-2 leading-relaxed flex-1">
          {getExcerpt(project.content)}
        </p>

        <div className="flex items-center justify-between pt-1 mt-auto">
          <span className="text-xs text-[#94A3B8]/60">{formatDate(project.updatedAt)}</span>

          {/* Kebab menu */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="p-1 rounded-lg text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-white/10
                transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreVertical size={15} />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 bottom-full mb-1 w-48 bg-[#1a1d2e]
                  border border-violet-500/20 rounded-xl shadow-2xl z-50 py-1 overflow-hidden">

                  {/* Open in new tab */}
                  <Link
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-[#94A3B8]
                      hover:bg-white/5 hover:text-[#E2E8F0] transition-colors"
                  >
                    <ExternalLink size={13} />
                    <span className="hidden md:inline">Open in new tab</span>
                    <span className="md:hidden">Open</span>
                  </Link>

                  {/* Edit */}
                  <button
                    onClick={() => { setMenuOpen(false); onEdit(project); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#94A3B8]
                      hover:bg-white/5 hover:text-[#E2E8F0] transition-colors"
                  >
                    <Edit2 size={13} /> Edit
                  </button>

                  <div className="mx-3 my-1 border-t border-white/5" />

                  {/* Delete forever */}
                  <button
                    onClick={() => { setMenuOpen(false); onDelete(project.id, project.title); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400
                      hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={13} /> Delete forever
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
