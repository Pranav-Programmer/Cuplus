'use client';

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import ProjectCard from './ProjectCard';
import { Project } from './editor/types';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import CuplusLoader from '@/components/CuplusLoader';

interface ProjectGridProps {
  projects: Project[];
  loading?: boolean;
  onEdit?: (project: Project) => void;
  onRemove?: (id: string) => void;
  onArchive?: (id: string) => void;
  onUnarchive?: (id: string) => void;
  searchQuery?: string;
}

export default function ProjectGrid({
  projects,
  loading,
  onEdit,
  onRemove,
  onArchive,
  onUnarchive,
  searchQuery = '',
}: ProjectGridProps) {
  const [activeCategory, setActiveCategory] = useState<string>('All');

  // ── Scroll-based category strip ───────────────────────────────────────────────
  const stripRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft,  setCanScrollLeft]  = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const syncArrows = useCallback(() => {
    const el = stripRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    syncArrows();
    el.addEventListener('scroll', syncArrows, { passive: true });
    const ro = new ResizeObserver(syncArrows);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', syncArrows); ro.disconnect(); };
  }, [syncArrows]);

  // ── Derive unique categories from loaded projects ─────────────────────────────
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

  // Re-measure arrows when category list changes
  useEffect(() => { setTimeout(syncArrows, 0); }, [cats, syncArrows]);

  const scrollBy = useCallback((dir: 'left' | 'right') => {
    const el = stripRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'right' ? el.clientWidth * 0.7 : -el.clientWidth * 0.7, behavior: 'smooth' });
  }, []);

  // ── Filtered projects ─────────────────────────────────────────────────────────
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

  if (loading) {
    return <CuplusLoader fullScreen label="Loading Projects…" />;
  }

  return (
    <div className="space-y-5">

      {/* ── Category strip ─────────────────────────────────────────────────────
       *
       *  Design goals:
       *  1. Always a SINGLE ROW — no wrapping ever.
       *  2. Strip uses full available width (flex-1).
       *     When pills are fewer than the width they sit naturally at the left;
       *     there's no visual gap because the pill div is w-max (shrinks to fit).
       *  3. When pills overflow, left/right arrow buttons appear automatically
       *     (driven by actual DOM scroll position via syncArrows).
       *  4. Arrows fade out (opacity-0, pointer-events-none) when at the edge,
       *     so they don't take up space when not needed.
       *
       *  Layout:
       *    [←]  [pill pill pill pill pill ……]  [→]
       *    shrink-0    flex-1 / overflow-hidden    shrink-0
       * ----------------------------------------------------------------------- */}
      {cats.length > 1 && (
        <div>
          <p className="text-xs text-[#94A3B8] font-semibold uppercase tracking-widest mb-3">
            Categories
          </p>

          <div className="flex items-center gap-2 w-full">

            {/* Left scroll button */}
            <button
              onClick={() => scrollBy('left')}
              disabled={!canScrollLeft}
              aria-label="Scroll categories left"
              className="w-8 h-8 flex-shrink-0 flex items-center justify-center
                rounded-lg border border-white/10 bg-[#151922]
                text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-white/10
                disabled:opacity-0 disabled:pointer-events-none
                transition-all duration-200"
            >
              <ChevronLeft size={14} />
            </button>

            {/* Pill strip — flex-1 so it takes all space between the two arrows.
                overflow-x-hidden hides the scrollbar; we scroll programmatically. */}
            <div ref={stripRef} className="flex-1 min-w-0 overflow-x-hidden">
              {/* w-max: the inner row shrinks to pill content, never forces full width.
                  flex-nowrap: single row, guaranteed. */}
              <div className="flex gap-2 flex-nowrap w-max">
                {cats.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`
                      px-4 py-1.5 rounded-full text-sm font-medium
                      whitespace-nowrap flex-shrink-0
                      transition-all duration-200
                      ${activeCategory === cat
                        ? 'bg-[#2e5bff] text-white shadow-[0_0_12px_-2px_rgba(46,91,255,0.5)]'
                        : 'text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-white/10 border border-white/10'
                      }
                    `}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Right scroll button */}
            <button
              onClick={() => scrollBy('right')}
              disabled={!canScrollRight}
              aria-label="Scroll categories right"
              className="w-8 h-8 flex-shrink-0 flex items-center justify-center
                rounded-lg border border-white/10 bg-[#151922]
                text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-white/10
                disabled:opacity-0 disabled:pointer-events-none
                transition-all duration-200"
            >
              <ChevronRight size={14} />
            </button>

          </div>
        </div>
      )}

      {/* ── Project grid ──────────────────────────────────────────────────────── */}
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
              onRemove={onRemove}
              onArchive={onArchive}
              onUnarchive={onUnarchive}
            />
          ))}
        </div>
      )}
    </div>
  );
}
