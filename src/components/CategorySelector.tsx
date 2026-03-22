'use client';

import React from "react";

interface CategorySelectorProps {
  categories: string[];
  selectedCategory: string | null;
  onSelect: (category: string | null) => void;
  counts?: Record<string, number>;  // ← add this
  totalCount?: number;               // ← and this
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  selectedCategory,
  onSelect,
  counts = {},
  totalCount,
}) => {
  const allCount = totalCount ?? categories.length;

  const Item = ({
    label,
    count,
    active,
    onClick,
  }: {
    label: string;
    count?: number;
    active: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-left"
      style={{
        background:  active ? 'rgba(46,91,255,0.12)' : 'transparent',
        color:       active ? '#2e5bff'              : 'var(--text-muted)',
        border:      active ? '1px solid rgba(46,91,255,0.25)' : '1px solid transparent',
      }}
      onMouseEnter={e => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--border)';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-main)';
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
        }
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="material-icons shrink-0"
          style={{ fontSize: 15, color: active ? '#2e5bff' : 'var(--text-faint)' }}
        >
          {label === 'All Notes' ? 'layers' : 'label'}
        </span>
        <span className="truncate">{label}</span>
      </div>

      {count !== undefined && (
        <span
          className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-5 text-center"
          style={{
            background: active ? 'rgba(46,91,255,0.2)' : 'var(--border-strong)',
            color:      active ? '#2e5bff'             : 'var(--text-faint)',
          }}
        >
          {count}
        </span>
      )}
    </button>
  );

  const visibleCategories = Object.keys(counts).length > 0
    ? categories.filter(cat => (counts[cat] ?? 0) > 0)
    : categories;

  return (
    <div className="space-y-1">
      {/* All Notes */}
      <Item
        label="All Notes"
        count={allCount}
        active={!selectedCategory}
        onClick={() => onSelect(null)}
      />

      {/* Category items — only those with at least 1 non-removed note */}
      {visibleCategories.map(cat => (
        <Item
          key={cat}
          label={cat}
          count={counts[cat]}
          active={selectedCategory === cat}
          onClick={() => onSelect(cat)}
        />
      ))}

      {/* Empty state */}
      {visibleCategories.length === 0 && (
        <div className="px-3 py-4 text-center">
          <span
            className="material-icons text-3xl block mb-1"
            style={{ color: 'var(--text-faint)' }}
          >
            label_off
          </span>
          <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
            No categories yet
          </p>
        </div>
      )}
    </div>
  );
};

export default CategorySelector;