'use client';

import React, { useState } from "react";

interface CalendarWidgetProps {
  onDateClick?: (date: string) => void;
  selectedDate?: string | null;
}

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAYS = ["Mo","Tu","We","Th","Fr","Sa","Su"];

const CalendarWidget: React.FC<CalendarWidgetProps> = ({ onDateClick, selectedDate }) => {
  const [current, setCurrent] = useState(new Date());

  const year  = current.getFullYear();
  const month = current.getMonth();
  const today = new Date();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev  = new Date(year, month, 0).getDate();
  const rawFirstDay = new Date(year, month, 1).getDay();
  // Mon=0 … Sun=6
  const firstDay = rawFirstDay === 0 ? 6 : rawFirstDay - 1;

  const toISO = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

  const todayISO = toISO(today.getFullYear(), today.getMonth(), today.getDate());

  // Build 42-cell grid
  const cells: { label: number; iso: string; type: 'prev'|'curr'|'next' }[] = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = daysInPrev - i;
    cells.push({ label: d, iso: toISO(year, month - 1, d), type: 'prev' });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ label: d, iso: toISO(year, month, d), type: 'curr' });
  }
  let next = 1;
  while (cells.length < 42) {
    cells.push({ label: next, iso: toISO(year, month + 1, next), type: 'next' });
    next++;
  }

  return (
    <div className="mb-6 select-none"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold leading-tight" style={{ color: 'var(--text-main)' }}>
            {MONTHS[month]}
          </h3>
          <p className="text-xs" style={{ color: 'var(--text-faint)' }}>{year}</p>
        </div>
        <div className="flex items-center gap-1">
          {/* Today dot */}
          <button
            onClick={() => setCurrent(new Date())}
            title="Go to today"
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full transition-all mr-1"
            style={{
              background: 'rgba(46,91,255,0.12)',
              color: '#2e5bff',
              border: '1px solid rgba(46,91,255,0.2)',
            }}
          >
            Today
          </button>
          <button
            onClick={() => setCurrent(new Date(year, month - 1, 1))}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
            style={{ background: 'var(--border)', color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'var(--border-strong)'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'var(--border)'}
          >
            <span className="material-icons" style={{ fontSize: 15 }}>chevron_left</span>
          </button>
          <button
            onClick={() => setCurrent(new Date(year, month + 1, 1))}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
            style={{ background: 'var(--border)', color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'var(--border-strong)'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'var(--border)'}
          >
            <span className="material-icons" style={{ fontSize: 15 }}>chevron_right</span>
          </button>
        </div>
      </div>

      {/* ── Day-of-week labels ── */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-semibold py-1"
            style={{ color: i >= 5 ? 'rgba(46,91,255,0.7)' : 'var(--text-faint)' }}>
            {d}
          </div>
        ))}
      </div>

      {/* ── Day grid ── */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((cell, idx) => {
          const isCurr     = cell.type === 'curr';
          const isToday    = cell.iso === todayISO;
          const isSelected = cell.iso === selectedDate && isCurr;
          const isWeekend  = idx % 7 >= 5;

          let bg     = 'transparent';
          let color  = 'var(--text-faint)';
          let fw     = '400';
          let shadow = 'none';
          let radius = 8;

          if (isCurr) {
            color = isWeekend ? 'rgba(46,91,255,0.8)' : 'var(--text-main)';
            fw    = '500';
          }
          if (isToday) {
            bg     = '#2e5bff';
            color  = '#fff';
            fw     = '700';
            shadow = '0 0 12px -2px rgba(46,91,255,0.6)';
            radius = 10;
          } else if (isSelected) {
            bg     = 'rgba(46,91,255,0.18)';
            color  = '#60A5FA';
            fw     = '600';
            radius = 10;
          }

          return (
            <button
              key={idx}
              onClick={() => isCurr && onDateClick?.(cell.iso)}
              disabled={!isCurr}
              className="relative flex items-center justify-center text-xs transition-all duration-150"
              style={{
                height: 30,
                background: bg,
                color,
                fontWeight: fw,
                borderRadius: radius,
                boxShadow: shadow,
                cursor: isCurr ? 'pointer' : 'default',
                opacity: !isCurr ? 0.3 : 1,
              }}
              onMouseEnter={e => {
                if (isCurr && !isToday && !isSelected)
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--border)';
              }}
              onMouseLeave={e => {
                if (isCurr && !isToday && !isSelected)
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }}
            >
              {cell.label}
              {/* Dot for today when viewing another month */}
              {isToday && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white opacity-60" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Footer: mini legend ── */}
      {/* <div className="flex items-center gap-3 mt-4 pt-3"
        style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--text-faint)' }}>
          <div className="w-3 h-3 rounded-sm" style={{ background: '#2e5bff' }} />
          Today
        </div>
        <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--text-faint)' }}>
          <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(46,91,255,0.18)' }} />
          Selected
        </div>
      </div> */}
    </div>
  );
};

export default CalendarWidget;