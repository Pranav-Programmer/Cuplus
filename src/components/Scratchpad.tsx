'use client';

import React, { useState, useEffect, useRef, useCallback } from "react";
import { db, auth } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";

const Scratchpad: React.FC = () => {
  const [user]        = useAuthState(auth);
  const [content,     setContent]     = useState("");
  const [saving,      setSaving]      = useState(false);
  const [saveStatus,  setSaveStatus]  = useState<"idle" | "success" | "error">("idle");
  const [lastSaved,   setLastSaved]   = useState<string | null>(null);
  const [charCount,   setCharCount]   = useState(0);
  const [focused,     setFocused]     = useState(false);
  const autoSaveRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const MAX_CHARS     = 1000;

  // ── Load ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "scratchpads", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          const text = data.content ?? "";
          setContent(text);
          setCharCount(text.length);
          if (data.updatedAt) {
            const d = data.updatedAt.toDate?.() ?? new Date(data.updatedAt);
            setLastSaved(d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
          }
        }
      } catch (e) { console.error(e); }
    })();
  }, [user]);

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async (text = content) => {
    if (!user || !text.trim()) return;
    setSaving(true); setSaveStatus("idle");
    try {
      await setDoc(doc(db, "scratchpads", user.uid), {
        content: text, updatedAt: new Date(), userId: user.uid,
      }, { merge: true });
      setSaveStatus("success");
      setLastSaved(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally { setSaving(false); }
  }, [user, content]);

  // ── Auto-save on pause ─────────────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value.slice(0, MAX_CHARS);
    setContent(val);
    setCharCount(val.length);
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => handleSave(val), 2000);
  };

  // Ctrl+S
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault(); handleSave();
    }
  };

  const pct = (charCount / MAX_CHARS) * 100;
  const fillColor = pct > 90 ? '#EF4444' : pct > 70 ? '#F59E0B' : '#2e5bff';

  return (
    <section className="mb-8">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
          <span className="material-icons text-base" style={{ color: '#2e5bff' }}>edit_note</span>
          Scratchpad
        </h2>
        <div className="flex items-center gap-2">
          {/* Status */}
          {saveStatus === "success" && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
              <span className="material-icons" style={{ fontSize: 12 }}>check_circle</span>
              Saved
            </span>
          )}
          {saveStatus === "error" && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-red-400">
              <span className="material-icons" style={{ fontSize: 12 }}>error_outline</span>
              Error
            </span>
          )}
          {lastSaved && saveStatus === "idle" && (
            <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
              {lastSaved}
            </span>
          )}
        </div>
      </div>

      {/* ── Textarea card ── */}
      <div className="rounded-2xl overflow-hidden transition-all duration-200"
        style={{
          background:  'var(--surface)',
          border:      `1px solid ${focused ? 'rgba(46,91,255,0.4)' : 'var(--border)'}`,
          boxShadow:   focused ? '0 0 0 3px rgba(46,91,255,0.08), 0 4px 20px rgba(0,0,0,0.12)' : '0 4px 16px rgba(0,0,0,0.08)',
          transition:  'border-color 0.2s, box-shadow 0.2s',
        }}>

        {/* Top toolbar strip */}
        <div className="flex items-center gap-2 px-4 py-2.5"
          style={{ borderBottom: `1px solid ${focused ? 'rgba(46,91,255,0.15)' : 'var(--border)'}`, transition: 'border-color 0.2s' }}>
          <span className="material-icons" style={{ fontSize: 14, color: focused ? '#2e5bff' : 'var(--text-faint)' }}>
            notes
          </span>
          <span className="text-[11px] font-medium" style={{ color: 'var(--text-faint)' }}>
            Quick thoughts, ideas, reminders…
          </span>
          <div className="ml-auto flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--text-faint)' }}>
            <kbd className="px-1.5 py-0.5 rounded text-[9px] font-mono"
              style={{ background: 'var(--border)', border: '1px solid var(--border-strong)' }}>
              Ctrl+S
            </kbd>
            to save
          </div>
        </div>

        {/* Textarea */}
        <textarea
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Start writing…"
          rows={5}
          className="w-full resize-none outline-none p-4 text-sm leading-relaxed"
          style={{
            background: 'transparent',
            color:      'var(--text-main)',
            caretColor: '#2e5bff',
          }}
        />

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5"
          style={{ borderTop: '1px solid var(--border)' }}>

          {/* Char count + progress bar */}
          <div className="flex items-center gap-2">
            {/* Mini progress bar */}
            <div className="w-20 h-1 rounded-full overflow-hidden"
              style={{ background: 'var(--border-strong)' }}>
              <div className="h-full rounded-full transition-all duration-300"
                style={{ width: `${pct}%`, background: fillColor, boxShadow: `0 0 6px ${fillColor}80` }} />
            </div>
            <span className="text-[10px] font-mono"
              style={{ color: pct > 90 ? '#EF4444' : 'var(--text-faint)' }}>
              {charCount}/{MAX_CHARS}
            </span>
          </div>

          {/* Save button */}
          <button
            onClick={() => handleSave()}
            disabled={saving || !content.trim() || !user}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background:  'linear-gradient(135deg,#2e5bff,#1a3acc)',
              boxShadow:   saving || !content.trim() ? 'none' : '0 0 14px -4px rgba(46,91,255,0.6)',
            }}
            onMouseEnter={e => { if (!saving) (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.15)'; }}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1)'}>
            {saving
              ? <><span className="material-icons" style={{ fontSize: 11, animation: 'spin 1s linear infinite' }}>sync</span> Saving…</>
              : <><span className="material-icons" style={{ fontSize: 11 }}>save</span> Save</>}
          </button>
        </div>
      </div>
    </section>
  );
};

export default Scratchpad;