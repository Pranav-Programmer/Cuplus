'use client';

import React, { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";

interface Task {
  task: string;
  date: string;
  time: string;
  notify: boolean;
  tags: string[];
}

interface QuickCaptureProps {
  onSubmit?: (newTask: Omit<Task, "id" | "createdAt">) => Promise<void>;
}

const QuickCapture: React.FC<QuickCaptureProps> = ({ onSubmit }) => {
  const [user] = useAuthState(auth);
  const [task,       setTask]       = useState("");
  const [date,       setDate]       = useState(new Date().toISOString().split("T")[0]);
  const [time,       setTime]       = useState("");
  const [notify,     setNotify]     = useState(false);
  const [tagsInput,  setTagsInput]  = useState("");
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !task || !date || !time) return;

    const tags = tagsInput.split(",").map(t => t.trim()).filter(Boolean);
    const payload = { userId: user.uid, task, date, time, notify, tags };

    setSaving(true); setError(null);
    try {
      await addDoc(collection(db, "tasks"), { ...payload, done: false, createdAt: new Date() });
      if (onSubmit) await onSubmit(payload);

      // Reset
      setTask(""); setDate(new Date().toISOString().split("T")[0]);
      setTime(""); setNotify(false); setTagsInput("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setError(err.code === "permission-denied"
        ? "Permission denied. Please sign in again."
        : "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Shared input style ─────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--bg)',
    border: '1px solid var(--border-strong)',
    borderRadius: 10,
    padding: '10px 12px',
    fontSize: '0.8125rem',
    color: 'var(--text-main)',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  };

  const onFocus  = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'rgba(46,91,255,0.5)';
    e.currentTarget.style.boxShadow   = '0 0 0 3px rgba(46,91,255,0.1)';
  };
  const onBlur   = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'var(--border-strong)';
    e.currentTarget.style.boxShadow   = 'none';
  };

  return (
    <div className="mt-auto">
      <div className="rounded-2xl overflow-hidden"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
        }}>

        {/* ── Header ── */}
        <div className="flex items-center gap-2 px-4 py-3"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(46,91,255,0.15)', border: '1px solid rgba(46,91,255,0.25)' }}>
            <span className="material-icons" style={{ fontSize: 13, color: '#2e5bff' }}>bolt</span>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#2e5bff' }}>
            Quick Capture
          </span>
          {saved && (
            <span className="ml-auto flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
              <span className="material-icons" style={{ fontSize: 12 }}>check_circle</span>
              Saved!
            </span>
          )}
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3">

          {/* Task name */}
          <div className="relative">
            <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ fontSize: 15, color: 'var(--text-faint)' }}>edit</span>
            <input
              type="text"
              value={task}
              onChange={e => setTask(e.target.value)}
              placeholder="What needs to be done?"
              required
              style={{ ...inputStyle, paddingLeft: 34 }}
              onFocus={onFocus} onBlur={onBlur}
            />
          </div>

          {/* Date + Time row */}
          <div className="grid grid-cols-1 gap-2">
            <div className="relative">
              <span className="material-icons absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ fontSize: 13, color: 'var(--text-faint)' }}>calendar_today</span>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                style={{ ...inputStyle, paddingLeft: 28, fontSize: '0.75rem' }}
                onFocus={onFocus} onBlur={onBlur}
              />
            </div>
            <div className="relative">
              <span className="material-icons absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ fontSize: 13, color: 'var(--text-faint)' }}>schedule</span>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                required
                style={{ ...inputStyle, paddingLeft: 28, fontSize: '0.75rem' }}
                onFocus={onFocus} onBlur={onBlur}
              />
            </div>
          </div>

          {/* Tags */}
          <div className="relative">
            <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ fontSize: 14, color: 'var(--text-faint)' }}>label</span>
            <input
              type="text"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="Tags: Work, Urgent…"
              style={{ ...inputStyle, paddingLeft: 34 }}
              onFocus={onFocus} onBlur={onBlur}
            />
          </div>

          {/* Tag pills preview */}
          {tagsInput.trim() && (
            <div className="flex flex-wrap gap-1.5">
              {tagsInput.split(",").map(t => t.trim()).filter(Boolean).map((tag, i) => (
                <span key={i} className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(46,91,255,0.12)', color: '#60A5FA', border: '1px solid rgba(46,91,255,0.2)' }}>
                  # {tag}
                </span>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-400"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <span className="material-icons shrink-0" style={{ fontSize: 13 }}>error_outline</span>
              {error}
            </div>
          )}

          {/* Footer row: notify toggle + save button */}
          <div className="flex items-center justify-between pt-1">

            {/* Notify toggle */}
            <button type="button" onClick={() => setNotify(v => !v)}
              className="flex items-center gap-2 text-xs font-medium transition-colors"
              style={{ color: notify ? '#2e5bff' : 'var(--text-faint)' }}>
              {/* Custom toggle */}
              <div className="relative w-7 h-4 rounded-full transition-colors duration-200"
                style={{ background: notify ? '#2e5bff' : 'var(--border-strong)' }}>
                <div className="absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all duration-200"
                  style={{ left: notify ? '14px' : '2px' }} />
              </div>
              <span className="material-icons" style={{ fontSize: 12 }}>
                {notify ? 'notifications_active' : 'notifications_none'}
              </span>
              Notify
            </button>

            {/* Save button */}
            <button
              type="submit"
              disabled={saving || !task || !date || !time}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg,#2e5bff,#1a3acc)',
                boxShadow: '0 0 16px -4px rgba(46,91,255,0.5)',
              }}
              onMouseEnter={e => { if (!saving) (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.15)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1)'; }}>
              {saving
                ? <><span className="material-icons animate-spin" style={{ fontSize: 12 }}>sync</span> Saving…</>
                : <><span className="material-icons" style={{ fontSize: 12 }}>add_task</span> Save Task</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickCapture;