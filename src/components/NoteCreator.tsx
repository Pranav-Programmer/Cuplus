'use client';

import React, { useState, useRef, useCallback } from "react";

interface Note {
  title: string;
  category: string;
  cardColor: string;
  content: string;
  remove: boolean;
}

interface NoteCreatorProps {
  onSubmit: (note: Omit<Note, "id" | "createdAt">) => Promise<void>;
  className?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const CARD_COLORS = [
  { hex: '#2e5bff', name: 'Blue'       },
  { hex: '#8B5CF6', name: 'Violet'     },
  { hex: '#10B981', name: 'Emerald'    },
  { hex: '#F59E0B', name: 'Amber'      },
  { hex: '#EF4444', name: 'Red'        },
  { hex: '#06B6D4', name: 'Cyan'       },
  { hex: '#EC4899', name: 'Pink'       },
  { hex: '#F97316', name: 'Orange'     },
  { hex: '#84CC16', name: 'Lime'       },
  { hex: '#14B8A6', name: 'Teal'       },
  { hex: '#A855F7', name: 'Purple'     },
  { hex: '#FFD700', name: 'Gold'       },
];

const TEXT_COLORS = [
  '#E2E8F0', '#60A5FA', '#34D399', '#FBBF24',
  '#F87171', '#A78BFA', '#2DD4BF', '#FB923C',
  '#F472B6', '#94A3B8', '#ffffff', '#000000',
];

const FORMATTING_TOOLS = [
  { cmd: 'bold',          icon: 'format_bold',          title: 'Bold (Ctrl+B)' },
  { cmd: 'italic',        icon: 'format_italic',        title: 'Italic (Ctrl+I)' },
  { cmd: 'underline',     icon: 'format_underlined',    title: 'Underline (Ctrl+U)' },
  { cmd: 'strikeThrough', icon: 'format_strikethrough', title: 'Strikethrough' },
];

const BLOCK_TOOLS = [
  { cmd: 'insertUnorderedList', icon: 'format_list_bulleted', title: 'Bullet list' },
  { cmd: 'insertOrderedList',   icon: 'format_list_numbered', title: 'Numbered list' },
  { cmd: 'formatBlock',         icon: 'format_quote',         title: 'Blockquote', value: 'blockquote' },
  { cmd: 'indent',              icon: 'format_indent_increase',title: 'Indent' },
  { cmd: 'outdent',             icon: 'format_indent_decrease',title: 'Outdent' },
];

const HEADING_TOOLS = [
  { label: 'H1', value: 'h1', title: 'Heading 1' },
  { label: 'H2', value: 'h2', title: 'Heading 2' },
  { label: 'H3', value: 'h3', title: 'Heading 3' },
];

// ── Component ─────────────────────────────────────────────────────────────────
const NoteCreator: React.FC<NoteCreatorProps> = ({ onSubmit, className = "" }) => {
  const [title,       setTitle]       = useState("");
  const [category,    setCategory]    = useState("");
  const [cardColor,   setCardColor]   = useState('#2e5bff');
  const [activeTextColor, setActiveTextColor] = useState('');
  const [showColorPanel, setShowColorPanel]   = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [charCount,   setCharCount]   = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // ── Exec command ─────────────────────────────────────────────────────────
  const exec = useCallback((cmd: string, value?: string) => {
    contentRef.current?.focus();
    document.execCommand(cmd, false, value ?? undefined);
  }, []);

  const applyTextColor = (color: string) => {
    exec('foreColor', color);
    setActiveTextColor(color);
    contentRef.current?.focus();
  };

  const applyHighlight = (color: string) => {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || sel.toString().trim() === '') return; // no selection → do nothing
  exec('hiliteColor', color + '55');
  contentRef.current?.focus();
};

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalContent = contentRef.current?.innerHTML ?? '';
    if (!title.trim() || !finalContent.replace(/<[^>]*>/g,'').trim()) return;
    setSaving(true);
    try {
      await onSubmit({ title: title.trim(), category: category.trim(), cardColor, content: finalContent, remove: false });
      setTitle(''); setCategory(''); setCharCount(0);
      if (contentRef.current) contentRef.current.innerHTML = '';
    } finally { setSaving(false); }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    exec('insertText', text);
  };

  const handleInput = () => {
    setCharCount(contentRef.current?.innerText.length ?? 0);
  };

  // ── Shared input style ────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--bg)',
    border: '1px solid var(--border-strong)',
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: '0.875rem',
    color: 'var(--text-main)',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  };

  const onInputFocus  = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'rgba(46,91,255,0.5)';
    e.currentTarget.style.boxShadow   = '0 0 0 3px rgba(46,91,255,0.08)';
  };
  const onInputBlur   = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'var(--border-strong)';
    e.currentTarget.style.boxShadow   = 'none';
  };

  const ToolBtn = ({ icon, title: t, onClick, active = false }: { icon: string; title: string; onClick: () => void; active?: boolean }) => (
    <button
      type="button" title={t} onClick={onClick}
      className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
      style={{
        background: active ? 'rgba(46,91,255,0.2)' : 'transparent',
        color:      active ? '#2e5bff' : 'var(--text-muted)',
        border:     active ? '1px solid rgba(46,91,255,0.3)' : '1px solid transparent',
      }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'var(--border)'; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
    >
      <span className="material-icons" style={{ fontSize: 16 }}>{icon}</span>
    </button>
  );

  return (
    <form onSubmit={handleSubmit}
      className={`rounded-2xl overflow-hidden ${className}`}
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-5 py-4"
        style={{ borderBottom: '1px solid var(--border)' }}>
        {/* Card colour dot — acts as colour picker trigger */}
        <button type="button" onClick={() => setShowColorPanel(v => !v)}
          title="Choose card colour"
          className="w-7 h-7 rounded-full shrink-0 transition-transform hover:scale-110 active:scale-95"
          style={{ background: cardColor, boxShadow: `0 0 10px ${cardColor}80` }} />
        <h3 className="font-bold text-base" style={{ color: 'var(--text-main)' }}>New Note</h3>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{charCount} chars</span>
        </div>
      </div>

      {/* ── Colour picker panel (collapsible) ── */}
      {showColorPanel && (
        <div className="px-5 py-4 space-y-4"
          style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>

          {/* Card colour */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'var(--text-faint)' }}>Card Accent</p>
            <div className="flex flex-wrap gap-2">
              {CARD_COLORS.map(c => (
                <button key={c.hex} type="button" title={c.name} onClick={() => setCardColor(c.hex)}
                  className="w-7 h-7 rounded-full transition-all hover:scale-110"
                  style={{
                    background: c.hex,
                    boxShadow:  cardColor === c.hex ? `0 0 0 2px var(--surface), 0 0 0 4px ${c.hex}` : 'none',
                  }} />
              ))}
            </div>
          </div>

          {/* Text colour */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'var(--text-faint)' }}>Text Colour</p>
            <div className="flex flex-wrap gap-2">
              {TEXT_COLORS.map(c => (
                <button key={c} type="button" title={c} onClick={() => applyTextColor(c)}
                  className="w-7 h-7 rounded-full border-2 transition-all hover:scale-110"
                  style={{
                    background:  c,
                    borderColor: activeTextColor === c ? '#2e5bff' : 'var(--border-strong)',
                  }} />
              ))}
            </div>
          </div>

          {/* Highlight colour */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'var(--text-faint)' }}>Highlight (select text first)</p>
            <div className="flex flex-wrap gap-2">
              {['#FBBF24','#34D399','#60A5FA','#F472B6','#A78BFA','#FB923C'].map(c => (
              <button key={c} type="button" title={`Highlight ${c}`}
                onClick={() => applyHighlight(c)}
                className="w-7 h-4 rounded transition-all hover:scale-110"
                style={{ background: c + '88', border: `1px solid ${c}` }} />
            ))}
            {/* Remove highlight */}
            <button type="button" title="Remove highlight"
              onClick={() => {
                const sel = window.getSelection();
                if (!sel || sel.isCollapsed || sel.toString().trim() === '') return;
                exec('hiliteColor', 'transparent');
                contentRef.current?.focus();
              }}
              className="h-4 px-2 rounded transition-all hover:scale-105 flex items-center gap-1 text-[10px] font-semibold"
              style={{
                background: 'transparent',
                border: '1px solid var(--border-strong)',
                color: 'var(--text-faint)',
              }}>
              <span className="material-icons" style={{ fontSize: 10 }}>format_color_reset</span>
              Remove
            </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-5 space-y-4">

        {/* Title + Category row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ fontSize: 15, color: 'var(--text-faint)' }}>title</span>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Note title…" required
              style={{ ...inputStyle, paddingLeft: 34 }}
              onFocus={onInputFocus} onBlur={onInputBlur} />
          </div>
          <div className="relative">
            <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ fontSize: 15, color: 'var(--text-faint)' }}>label</span>
            <input type="text" value={category} onChange={e => setCategory(e.target.value)}
              placeholder="Category (e.g. Work, Personal)…"
              style={{ ...inputStyle, paddingLeft: 34 }}
              onFocus={onInputFocus} onBlur={onInputBlur} />
          </div>
        </div>

        {/* ── Editor ── */}
        <div className="rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--border-strong)' }}>

          {/* Toolbar */}
          <div className="flex items-center flex-wrap gap-0.5 px-2 py-1.5"
            style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>

            {/* Headings */}
            {HEADING_TOOLS.map(h => (
              <button key={h.value} type="button" title={h.title}
                onClick={() => exec('formatBlock', `<${h.value}>`)}
                className="px-2 h-8 rounded-lg text-xs font-bold transition-all"
                style={{ color: 'var(--text-muted)', background: 'transparent' }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'var(--border)'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}>
                {h.label}
              </button>
            ))}

            <div className="w-px h-5 mx-1" style={{ background: 'var(--border-strong)' }} />

            {/* Inline formatting */}
            {FORMATTING_TOOLS.map(t => (
              <ToolBtn key={t.cmd} icon={t.icon} title={t.title} onClick={() => exec(t.cmd)} />
            ))}

            <div className="w-px h-5 mx-1" style={{ background: 'var(--border-strong)' }} />

            {/* Block formatting */}
            {BLOCK_TOOLS.map(t => (
              <ToolBtn key={t.cmd} icon={t.icon} title={t.title}
                onClick={() => exec(t.cmd, t.value)} />
            ))}

            <div className="w-px h-5 mx-1" style={{ background: 'var(--border-strong)' }} />

            {/* Alignment */}
            {[
              { cmd: 'justifyLeft',   icon: 'format_align_left',    title: 'Align left' },
              { cmd: 'justifyCenter', icon: 'format_align_center',  title: 'Center' },
              { cmd: 'justifyRight',  icon: 'format_align_right',   title: 'Align right' },
            ].map(t => (
              <ToolBtn key={t.cmd} icon={t.icon} title={t.title} onClick={() => exec(t.cmd)} />
            ))}

            <div className="w-px h-5 mx-1" style={{ background: 'var(--border-strong)' }} />

            {/* Colours shortcut */}
            <button type="button" title="Colour options"
              onClick={() => setShowColorPanel(v => !v)}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
              style={{
                background:  showColorPanel ? 'rgba(46,91,255,0.18)' : 'transparent',
                color:       showColorPanel ? '#2e5bff' : 'var(--text-muted)',
                border:     showColorPanel ? '1px solid rgba(46,91,255,0.3)' : '1px solid transparent',
              }}>
              <span className="material-icons" style={{ fontSize: 16 }}>palette</span>
            </button>

            {/* Undo / Redo */}
            <div className="ml-auto flex gap-0.5">
              <ToolBtn icon="undo" title="Undo (Ctrl+Z)" onClick={() => exec('undo')} />
              <ToolBtn icon="redo" title="Redo (Ctrl+Y)" onClick={() => exec('redo')} />
            </div>
          </div>

          {/* Editable area */}
          <div
            ref={contentRef}
            contentEditable
            suppressContentEditableWarning
            onPaste={handlePaste}
            onInput={handleInput}
            data-placeholder="Start writing your note…"
            className="note-editor-body outline-none px-4 py-3 text-sm leading-relaxed overflow-y-auto"
            style={{ color: 'var(--text-main)', background: 'var(--bg)', height: 'calc(100vh - 420px)', minHeight: '200px' }}
          />
        </div>

        {/* ── Footer: card colour preview + submit ── */}
        <div className="flex items-center justify-between gap-4">

          {/* Card preview chip */}
          <div className="flex items-center gap-2 text-xs"
            style={{ color: 'var(--text-faint)' }}>
            {/* <div className="w-4 h-4 rounded-full" style={{ background: cardColor }} /> */}
            <button type="button" onClick={() => setShowColorPanel(v => !v)}
          title="Choose card colour"
          className="w-4 h-4 rounded-full shrink-0 transition-transform hover:scale-110 active:scale-95"
          style={{ background: cardColor, boxShadow: `0 0 10px ${cardColor}80` }} />
            Card: {CARD_COLORS.find(c => c.hex === cardColor)?.name ?? cardColor}
          </div>

          {/* Submit */}
          <button type="submit" disabled={saving || !title.trim()}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: `linear-gradient(135deg, ${cardColor}, ${cardColor}bb)`,
              boxShadow:  saving || !title.trim() ? 'none' : `0 0 18px -4px ${cardColor}80`,
            }}
            onMouseEnter={e => { if (!saving) (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.15)'; }}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1)'}>
            {saving
              ? <><span className="material-icons" style={{ fontSize: 13, animation: 'spin 1s linear infinite' }}>sync</span> Saving…</>
              : <><span className="material-icons" style={{ fontSize: 13 }}>add_circle</span> Create Note</>}
          </button>
        </div>
      </div>

      {/* Editor placeholder + blockquote styles */}
      <style>{`
        .note-editor-body:empty::before {
          content: attr(data-placeholder);
          color: var(--text-faint);
          pointer-events: none;
        }
        .note-editor-body h1 { font-size:1.5rem; font-weight:700; margin:.5rem 0; color: var(--text-main); }
        .note-editor-body h2 { font-size:1.2rem; font-weight:700; margin:.4rem 0; color: var(--text-main); }
        .note-editor-body h3 { font-size:1rem;   font-weight:600; margin:.3rem 0; color: var(--text-main); }
        .note-editor-body blockquote {
          border-left: 3px solid #2e5bff;
          margin: .5rem 0; padding: .4rem .75rem;
          background: rgba(46,91,255,0.07);
          border-radius: 0 6px 6px 0;
          color: var(--text-muted); font-style: italic;
        }
        .note-editor-body ul { list-style: disc;    padding-left: 1.25rem; margin: .3rem 0; }
        .note-editor-body ol { list-style: decimal; padding-left: 1.25rem; margin: .3rem 0; }
        .note-editor-body a  { color: #60A5FA; text-decoration: underline; }
      `}</style>
    </form>
  );
};

export default NoteCreator;