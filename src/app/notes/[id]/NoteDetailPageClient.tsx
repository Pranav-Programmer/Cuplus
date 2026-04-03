"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createPortal } from "react-dom";
import DeleteConfirmation from "@/components/DeleteConfirmation";
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

// ── Toolbar constants ─────────────────────────────────────────────────────────
const INLINE_TOOLS = [
  { cmd: 'bold',          icon: 'format_bold',          title: 'Bold (Ctrl+B)' },
  { cmd: 'italic',        icon: 'format_italic',        title: 'Italic (Ctrl+I)' },
  { cmd: 'underline',     icon: 'format_underlined',    title: 'Underline (Ctrl+U)' },
  { cmd: 'strikeThrough', icon: 'format_strikethrough', title: 'Strikethrough' },
];
const BLOCK_TOOLS = [
  { cmd: 'insertUnorderedList', icon: 'format_list_bulleted',  title: 'Bullet list' },
  { cmd: 'insertOrderedList',   icon: 'format_list_numbered',  title: 'Numbered list' },
  { cmd: 'formatBlock',         icon: 'format_quote',          title: 'Blockquote', value: 'blockquote' },
  { cmd: 'indent',              icon: 'format_indent_increase', title: 'Indent' },
  { cmd: 'outdent',             icon: 'format_indent_decrease', title: 'Outdent' },
];
const ALIGN_TOOLS = [
  { cmd: 'justifyLeft',   icon: 'format_align_left',   title: 'Align left' },
  { cmd: 'justifyCenter', icon: 'format_align_center', title: 'Center' },
  { cmd: 'justifyRight',  icon: 'format_align_right',  title: 'Align right' },
];
const HEADING_TOOLS = [
  { label: 'H1', value: 'h1' },
  { label: 'H2', value: 'h2' },
  { label: 'H3', value: 'h3' },
];
const TEXT_COLORS   = ['#E2E8F0','#60A5FA','#34D399','#FBBF24','#F87171','#A78BFA','#2DD4BF','#FB923C','#F472B6','#94A3B8','#ffffff','#000000'];
const HIGHLIGHT_CLR = ['#FBBF24','#34D399','#60A5FA','#F472B6','#A78BFA','#FB923C'];

function formatDateTime(ts: any) {
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric", year:"numeric" });
}

// ── Component ─────────────────────────────────────────────────────────────────
const NoteDetailPageClient: React.FC = () => {
  const params = useParams();
  const noteId = params.id as string;

  const [note,           setNote]           = useState<Note | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [isEditing,      setIsEditing]      = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [showColors,     setShowColors]     = useState(false);
  const [showDeleteModal,setShowDeleteModal] = useState(false);
  const [lastSaved,      setLastSaved]      = useState<string | null>(null);
  const [charCount,      setCharCount]      = useState(0);
  const [editTitle, setEditTitle] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "notes", noteId));
        if (snap.exists() && !snap.data()?.remove)
          setNote({ id: snap.id, ...snap.data() } as Note);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [noteId]);

  const exec = useCallback((cmd: string, value?: string) => {
    contentRef.current?.focus();
    document.execCommand(cmd, false, value ?? undefined);
  }, []);

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    exec('insertText', e.clipboardData.getData('text/plain'));
  };

  const startEditing = () => {
    setEditTitle(note?.title ?? '');
    setIsEditing(true);
  };

  useEffect(() => {
    if (!isEditing || !contentRef.current || !note) return;
    contentRef.current.innerHTML = note.content;
    setCharCount(contentRef.current.innerText.length);
    contentRef.current.focus();
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(contentRef.current);
    range.collapse(false);
    sel?.removeAllRanges();
    sel?.addRange(range);
  }, [isEditing, note]);

  const saveEdit = async () => {
    if (!contentRef.current || !note) return;
    setSaving(true);
    try {
      const updatedContent = contentRef.current.innerHTML;
      const updatedTitle   = editTitle.trim() || note.title;
      await updateDoc(doc(db, 'notes', note.id), {
        content: updatedContent,
        title:   updatedTitle,
      });
      setNote({ ...note, content: updatedContent, title: updatedTitle });
      setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setIsEditing(false);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setShowColors(false);
  };

  const confirmDelete = async () => {
    if (!note) return;
    await updateDoc(doc(db, "notes", note.id), { remove: true });
    window.history.back();
    setShowDeleteModal(false);
  };

  const applyTextColor = (color: string) => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    exec('foreColor', color);
  };

  const applyHighlight = (color: string) => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    exec('hiliteColor', color + '55');
  };

  const removeHighlight = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    exec('hiliteColor', 'transparent');
  };

  if (loading) return <CuplusLoader fullScreen label="Loading note…" />;

  if (!note) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ background: 'var(--bg)' }}>
      <span className="material-icons text-5xl" style={{ color: 'var(--text-faint)' }}>
        sticky_note_2
      </span>
      <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
        Note not found or removed.
      </p>
      <button onClick={() => window.history.back()}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
        style={{ background: '#2e5bff' }}>
        <span className="material-icons" style={{ fontSize: 15 }}>arrow_back</span>
        Back to Notes
      </button>
    </div>
  );

  const color = note.cardColor ?? '#2e5bff';

  const ToolBtn = ({ icon, title: t, onClick }: { icon: string; title: string; onClick: () => void }) => (
    <button type="button" title={t} onClick={onClick}
      className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
      style={{ color: 'var(--text-muted)', background: 'transparent' }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-main)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}>
      <span className="material-icons" style={{ fontSize: 16 }}>{icon}</span>
    </button>
  );

  const ColorPanel = () => createPortal(
    <div className="fixed bottom-0 left-0 right-0 z-9999 p-4 space-y-4"
      style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', boxShadow: '0 -4px 24px rgba(0,0,0,0.15)' }}>
      <div className="max-w-3xl mx-auto space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
            Select text first, then choose colour
          </p>
          <button onClick={() => setShowColors(false)}
            className="w-7 h-7 flex items-center justify-center rounded-lg"
            style={{ background: 'var(--border)', color: 'var(--text-muted)' }}>
            <span className="material-icons" style={{ fontSize: 15 }}>close</span>
          </button>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-2"
            style={{ color: 'var(--text-faint)' }}>Text Colour</p>
          <div className="flex flex-wrap gap-2">
            {TEXT_COLORS.map(c => (
              <button key={c} onClick={() => applyTextColor(c)}
                className="w-7 h-7 rounded-full border-2 transition-all hover:scale-110"
                style={{ background: c, borderColor: 'var(--border-strong)' }}
                title={c} />
            ))}
          </div>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-2"
            style={{ color: 'var(--text-faint)' }}>Highlight</p>
          <div className="flex flex-wrap gap-2 items-center">
            {HIGHLIGHT_CLR.map(c => (
              <button key={c} onClick={() => applyHighlight(c)}
                className="w-7 h-4 rounded transition-all hover:scale-110"
                style={{ background: c + '88', border: `1px solid ${c}` }}
                title={`Highlight ${c}`} />
            ))}
            <button onClick={removeHighlight}
              className="flex items-center gap-1 h-7 px-2 rounded-lg text-[10px] font-semibold transition-all"
              style={{ background: 'var(--border)', border: '1px solid var(--border-strong)', color: 'var(--text-faint)' }}>
              <span className="material-icons" style={{ fontSize: 11 }}>format_color_reset</span>
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--bg)' }}>
      <header className="shrink-0 sticky top-0 z-30 px-4 sm:px-8 py-3"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button onClick={() => window.history.back()}
            className="flex items-center gap-1.5 text-sm font-medium transition-colors shrink-0"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-main)'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'}>
            <span className="material-icons" style={{ fontSize: 18 }}>arrow_back</span>
            <span className="hidden sm:inline">Notes</span>
          </button>
          <span style={{ color: 'var(--border-strong)' }}>/</span>
          <div className="w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
          <h1 className="flex-1 font-bold truncate text-sm" style={{ color: 'var(--text-main)' }}>
            {note.title}
          </h1>
          <div className="flex items-center gap-2 shrink-0">
            {isEditing ? (
              <>
                {lastSaved && !saving && (
                  <span className="hidden sm:flex items-center gap-1 text-[11px]"
                    style={{ color: 'var(--text-faint)' }}>
                    <span className="material-icons" style={{ fontSize: 12 }}>check_circle</span>
                    {lastSaved}
                  </span>
                )}
                <button onClick={cancelEdit}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
                  style={{ background: 'var(--border)', color: 'var(--text-muted)', border: '1px solid var(--border-strong)' }}>
                  <span className="material-icons" style={{ fontSize: 14 }}>close</span>
                  <span className="hidden sm:inline">Discard</span>
                </button>
                <button onClick={saveEdit} disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold text-white transition-all disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#2e5bff,#1a3acc)', boxShadow: '0 0 14px -4px rgba(46,91,255,0.5)' }}>
                  {saving
                    ? <><span className="material-icons" style={{ fontSize: 14, animation: 'spin 1s linear infinite' }}>sync</span> Saving…</>
                    : <><span className="material-icons" style={{ fontSize: 14 }}>save</span> <span className="hidden sm:inline">Save</span></>
                  }
                </button>
              </>
            ) : (
              <>
                <button onClick={startEditing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
                  style={{ background: 'var(--border)', color: 'var(--text-muted)', border: '1px solid var(--border-strong)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--border-strong)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-main)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}>
                  <span className="material-icons" style={{ fontSize: 14 }}>edit</span>
                  <span className="hidden sm:inline">Edit</span>
                </button>
                <button onClick={() => setShowDeleteModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all text-red-400"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.15)'}
                  onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)'}>
                  <span className="material-icons" style={{ fontSize: 14 }}>delete</span>
                  <span className="hidden sm:inline">Remove</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {isEditing && (
        <div className="shrink-0 px-4 sm:px-8 py-1.5"
          style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-4xl mx-auto flex items-center flex-wrap gap-0.5">
            {HEADING_TOOLS.map(h => (
              <button key={h.value} type="button" title={`Heading ${h.value}`}
                onClick={() => exec('formatBlock', `<${h.value}>`)}
                className="px-2 h-8 rounded-lg text-xs font-bold transition-all"
                style={{ color: 'var(--text-muted)', background: 'transparent' }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'var(--border)'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}>
                {h.label}
              </button>
            ))}
            <div className="w-px h-5 mx-1" style={{ background: 'var(--border-strong)' }} />
            {INLINE_TOOLS.map(t => <ToolBtn key={t.cmd} icon={t.icon} title={t.title} onClick={() => exec(t.cmd)} />)}
            <div className="w-px h-5 mx-1" style={{ background: 'var(--border-strong)' }} />
            {BLOCK_TOOLS.map(t => <ToolBtn key={t.cmd} icon={t.icon} title={t.title} onClick={() => exec(t.cmd, t.value)} />)}
            <div className="w-px h-5 mx-1" style={{ background: 'var(--border-strong)' }} />
            {ALIGN_TOOLS.map(t => <ToolBtn key={t.cmd} icon={t.icon} title={t.title} onClick={() => exec(t.cmd)} />)}
            <div className="w-px h-5 mx-1" style={{ background: 'var(--border-strong)' }} />
            <button type="button" title="Colour options"
              onClick={() => setShowColors(v => !v)}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
              style={{
                background:  showColors ? 'rgba(46,91,255,0.15)' : 'transparent',
                color:       showColors ? '#2e5bff' : 'var(--text-muted)',
                border:      showColors ? '1px solid rgba(46,91,255,0.3)' : '1px solid transparent',
              }}>
              <span className="material-icons" style={{ fontSize: 16 }}>palette</span>
            </button>
            <div className="ml-auto flex gap-0.5">
              <ToolBtn icon="undo" title="Undo (Ctrl+Z)" onClick={() => exec('undo')} />
              <ToolBtn icon="redo" title="Redo (Ctrl+Y)" onClick={() => exec('redo')} />
            </div>
            <span className="ml-2 text-[10px] font-mono" style={{ color: 'var(--text-faint)' }}>
              {charCount} chars
            </span>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
          {!isEditing ? (
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-4">
                {note.category && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                    style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
                    {note.category}
                  </span>
                )}
                <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-faint)' }}>
                  <span className="material-icons" style={{ fontSize: 12 }}>calendar_today</span>
                  {formatDateTime(note.createdAt)}
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black mb-6 leading-tight"
                style={{ color: 'var(--text-main)' }}>
                {note.title}
              </h1>
              <div className="h-0.5 w-16 rounded-full mb-6"
                style={{ background: `linear-gradient(90deg, ${color}, ${color}40)` }} />
              <div
                className="note-detail-body text-sm leading-8"
                style={{ color: 'var(--text-main)' }}
                dangerouslySetInnerHTML={{ __html: note.content }}
              />
            </div>
          ) : (
            <div>
              <input
                type="text"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                placeholder="Note title…"
                className="w-full text-2xl sm:text-3xl font-black mb-4 outline-none bg-transparent border-b pb-2 transition-colors"
                style={{ color: 'var(--text-main)', borderColor: 'var(--border-strong)' }}
                onFocus={e => e.currentTarget.style.borderColor = 'rgba(46,91,255,0.5)'}
                onBlur={e  => e.currentTarget.style.borderColor = 'var(--border-strong)'}
              />
              <div
                ref={contentRef}
                contentEditable
                suppressContentEditableWarning
                onPaste={handlePaste}
                onInput={() => setCharCount(contentRef.current?.innerText.length ?? 0)}
                data-placeholder="Start editing…"
                className="note-detail-body outline-none text-sm leading-8 min-h-[60vh]"
                style={{ color: 'var(--text-main)', caretColor: color }}
              />
            </div>
          )}
        </div>
      </div>

      {isEditing && showColors && <ColorPanel />}

      <DeleteConfirmation
        isOpen={showDeleteModal}
        itemName={note.title}
        type="note"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

      <style>{`
        .note-detail-body:empty::before {
          content: attr(data-placeholder);
          color: var(--text-faint);
          pointer-events: none;
        }
        .note-detail-body h1 { font-size:1.75rem; font-weight:800; margin:.75rem 0 .5rem; color:var(--text-main); }
        .note-detail-body h2 { font-size:1.35rem; font-weight:700; margin:.6rem 0 .4rem; color:var(--text-main); }
        .note-detail-body h3 { font-size:1.1rem;  font-weight:600; margin:.5rem 0 .3rem; color:var(--text-main); }
        .note-detail-body p  { margin-bottom:.5rem; }
        .note-detail-body strong { font-weight:700; }
        .note-detail-body em     { font-style:italic; color:var(--text-muted); }
        .note-detail-body u      { text-decoration-color:#2e5bff; }
        .note-detail-body s      { opacity:.5; }
        .note-detail-body ul { list-style:disc;    padding-left:1.5rem; margin:.4rem 0; }
        .note-detail-body ol { list-style:decimal; padding-left:1.5rem; margin:.4rem 0; }
        .note-detail-body li { margin-bottom:.2rem; }
        .note-detail-body blockquote {
          border-left:3px solid #2e5bff;
          margin:.75rem 0; padding:.5rem .875rem;
          background:rgba(46,91,255,0.06);
          border-radius:0 8px 8px 0;
          color:var(--text-muted); font-style:italic;
        }
        .note-detail-body a { color:#60A5FA; text-decoration:underline; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
};

export default NoteDetailPageClient;
