'use client';

import React from "react";
import Link from "next/link";
import CuplusLoader from "@/components/CuplusLoader";

interface Note {
  id: string;
  title: string;
  category: string;
  cardColor: string;
  content: string;
  createdAt: any;
  remove?: boolean;
}

interface NoteGridProps {
  notes: Note[];
  loading?: boolean;
}

function formatDate(ts: any): string {
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(ts: any): string {
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function stripHtml(html: string, max = 140): string {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > max ? text.slice(0, max) + '…' : text;
}

const NoteGrid: React.FC<NoteGridProps> = ({ notes, loading }) => {
  if (loading) return <CuplusLoader label="Loading notes…" />;
  if (notes.length === 0) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-16 rounded-2xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <span className="material-icons text-5xl mb-3" style={{ color: 'var(--text-faint)' }}>
          sticky_note_2
        </span>
        <p className="font-semibold text-sm" style={{ color: 'var(--text-muted)' }}>No notes yet</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>Create one to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {notes.map(note => {
        const color = note.cardColor ?? '#2e5bff';

        return (
          <Link key={note.id} href={`/notes/${note.id}`} className="group block">
            <div
              className="min-h-full relative rounded-2xl overflow-hidden flex flex-col transition-all duration-200"
              style={{
                background:  'var(--surface)',
                border:      `1px solid var(--border)`,
                boxShadow:   '0 2px 12px rgba(0,0,0,0.08)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = color + '60';
                (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 20px -5px ${color}35, 0 4px 16px rgba(0,0,0,0.12)`;
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)';
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
              }}
            >
              {/* Top accent bar */}
              <div className="h-1 w-full shrink-0"
                style={{ background: `linear-gradient(90deg, ${color}, ${color}80)` }} />

              <div className="p-4 flex flex-col gap-2 flex-1">

                {/* Category pill */}
                {note.category && (
                  <span className="inline-flex w-fit items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{
                      background: `${color}18`,
                      color,
                      border: `1px solid ${color}30`,
                    }}>
                    {note.category}
                  </span>
                )}

                {/* Title */}
                <h3 className="font-bold text-sm leading-snug line-clamp-2 transition-colors"
                  style={{ color: 'var(--text-main)' }}>
                  {note.title}
                </h3>

                {/* Content excerpt — plain text, no HTML injection */}
                <p className="text-xs leading-relaxed line-clamp-3 flex-1"
                  style={{ color: 'var(--text-muted)' }}>
                  {stripHtml(note.content)}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 mt-auto"
                  style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-1"
                    style={{ color: 'var(--text-faint)' }}>
                    <span className="material-icons" style={{ fontSize: 11 }}>schedule</span>
                    <span className="text-[10px]">{formatTime(note.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1"
                    style={{ color: 'var(--text-faint)' }}>
                    <span className="material-icons" style={{ fontSize: 11 }}>calendar_today</span>
                    <span className="text-[10px]">{formatDate(note.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Subtle corner glow */}
              <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none rounded-bl-full"
                style={{ background: `radial-gradient(circle at top right, ${color}15, transparent 70%)` }} />
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default NoteGrid;