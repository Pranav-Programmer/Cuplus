'use client';

import React, { useState, useMemo } from 'react';
import ProjectCard from './ProjectCard';
import { Project } from './editor/types';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface ProjectGridProps {
  projects: Project[];
  loading?: boolean;
  onEdit?: (project: Project) => void;
  onDelete?: (id: string) => void;
  onArchive?: (id: string) => void;
  searchQuery?: string;
}

export default function ProjectGrid({
  projects,
  loading,
  onEdit,
  onDelete,
  onArchive,
  searchQuery = '',
}: ProjectGridProps) {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [catOffset, setCatOffset] = useState(0);

  const VISIBLE_CATS = 2;

  // ── Derive unique categories from the actual loaded projects ─────────────────
  // Only categories that exist in the user's real data appear here.
  const cats = useMemo(() => {
    const unique = Array.from(
      new Set(
        projects
          .map((p) => p.category?.trim())
          .filter((c): c is string => Boolean(c))
      )
    ).sort((a, b) => a.localeCompare(b));
    return ['All', ...unique];
  }, [projects]);

  const filtered = useMemo(() => {
    let list = projects;
    if (activeCategory !== 'All') {
      list = list.filter((p) => p.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.content?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [projects, activeCategory, searchQuery]);

  const visibleCats = cats.slice(catOffset, catOffset + VISIBLE_CATS);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-[#94A3B8]">
        <Loader2 className="animate-spin mr-2" size={20} /> Loading projects…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Category filter – only shown when there are categories to filter by */}
      {cats.length > 1 && (
        <div>
          <p className="text-xs text-[#94A3B8] font-semibold uppercase tracking-widest mb-3">
            Categories
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCatOffset(Math.max(0, catOffset - 1))}
              disabled={catOffset === 0}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10
                text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-white/10 disabled:opacity-30 transition-colors shrink-0"
            >
              <ChevronLeft size={14} />
            </button>

            <div className="flex gap-2 overflow-hidden flex-wrap">
              {cats.slice(catOffset, catOffset + VISIBLE_CATS).map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setActiveCategory(cat); setCatOffset(0); }}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
                    activeCategory === cat
                      ? 'bg-[#2e5bff] text-white shadow-[0_0_12px_-2px_rgba(46,91,255,0.5)]'
                      : 'text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCatOffset(Math.min(cats.length - VISIBLE_CATS, catOffset + 1))}
              disabled={catOffset + VISIBLE_CATS >= cats.length}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10
                text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-white/10 disabled:opacity-30 transition-colors shrink-0"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-[#94A3B8] text-sm">
            {searchQuery
              ? `No projects matching "${searchQuery}"`
              : activeCategory !== 'All'
              ? `No projects in "${activeCategory}"`
              : 'No projects yet — create your first one!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={onEdit}
              onDelete={onDelete}
              onArchive={onArchive}
            />
          ))}
        </div>
      )}
    </div>
  );
}
