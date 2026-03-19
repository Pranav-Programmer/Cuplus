'use client';

import React, {
  useRef,
  useCallback,
  useEffect,
  useState,
} from 'react';
import EditorToolbar from './EditorToolbar';
import TableModal from './modals/TableModal';
import CodeBlockModal from './modals/CodeBlockModal';
import ImageModal from './modals/ImageModal';
import LinkModal from './modals/LinkModal';
import ColorModal from './modals/ColorModal';
import {
  TableConfig,
  CodeBlockConfig,
  LinkConfig,
  ModalType,
} from './types';

// ─── Prism syntax highlighting ────────────────────────────────────────────────
// Import core + every language we expose in the modal.
// These are side-effect imports — they register grammars on the Prism object.
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup';      // html / xml
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-go';

interface RichTextEditorProps {
  initialContent?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(str: string): string {
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function RichTextEditor({
  initialContent = '',
  onChange,
  placeholder = 'Start writing your document…',
  minHeight = '400px',
  className = '',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [colorMode, setColorMode] = useState<'text' | 'highlight'>('text');
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  // ── Initialize on mount only ────────────────────────────────────────────────
  // We NEVER re-run this when initialContent changes during typing — that would
  // reset innerHTML and move the cursor to position 0 (reverse-writing bug).
  // Re-initialization when switching projects is handled by the parent giving
  // the editor a new `key` prop, which unmounts and remounts it cleanly.
  useEffect(() => {
    if (editorRef.current && initialContent) {
      editorRef.current.innerHTML = initialContent;
      updateCounts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Selection management ────────────────────────────────────────────────────
  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  }, []);

  const restoreSelection = useCallback(() => {
    const range = savedRangeRef.current;
    if (!range) {
      editorRef.current?.focus();
      return;
    }
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, []);

  // ── execCommand wrapper ─────────────────────────────────────────────────────
  const exec = useCallback((cmd: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value ?? undefined);
    notifyChange();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const notifyChange = useCallback(() => {
    const html = editorRef.current?.innerHTML ?? '';
    onChange?.(html);
    updateCounts();
  }, [onChange]);

  const updateCounts = () => {
    const text = editorRef.current?.innerText ?? '';
    setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
    setCharCount(text.length);
  };

  // ── Format handler ──────────────────────────────────────────────────────────
  const handleFormat = useCallback((cmd: string) => {
    if (cmd === 'inline-code') {
      wrapInlineCode();
      return;
    }
    exec(cmd);
  }, [exec]);

  const wrapInlineCode = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    const text = sel.toString();
    const code = `<code class="editor-inline-code">${escapeHtml(text)}</code>`;
    exec('insertHTML', code);
  };

  // ── Block format ─────────────────────────────────────────────────────────────
  const handleBlockFormat = useCallback((tag: string) => {
    editorRef.current?.focus();
    document.execCommand('formatBlock', false, `<${tag}>`);
    notifyChange();
  }, [notifyChange]);

  // ── Open modal (save selection first) ───────────────────────────────────────
  const openModal = useCallback((modal: ModalType) => {
    saveSelection();
    setActiveModal(modal);
  }, [saveSelection]);

  const openColorModal = useCallback((mode: 'text' | 'highlight') => {
    saveSelection();
    setColorMode(mode);
    setActiveModal(mode === 'text' ? 'textColor' : 'highlight');
  }, [saveSelection]);

  // ── Table ───────────────────────────────────────────────────────────────────
  const handleInsertTable = useCallback((config: TableConfig) => {
    restoreSelection();
    const { rows, cols, hasHeader } = config;

    let html = '<div class="editor-table-wrap"><table class="editor-table">';
    if (hasHeader) {
      html += '<thead><tr>';
      for (let c = 0; c < cols; c++) {
        html += `<th contenteditable="true">Column ${c + 1}</th>`;
      }
      html += '</tr></thead>';
    }
    html += '<tbody>';
    const dataRows = hasHeader ? rows - 1 : rows;
    for (let r = 0; r < dataRows; r++) {
      html += '<tr>';
      for (let c = 0; c < cols; c++) {
        html += '<td contenteditable="true">&nbsp;</td>';
      }
      html += '</tr>';
    }
    html += '</tbody></table>';
    html += `<div class="editor-table-controls">
      <button class="editor-table-btn" onclick="(function(btn){
        var table=btn.closest('.editor-table-wrap').querySelector('tbody');
        var cols=table.querySelector('tr')?.cells?.length||3;
        var tr=document.createElement('tr');
        for(var i=0;i<cols;i++){var td=document.createElement('td');td.contentEditable='true';td.innerHTML='&nbsp;';tr.appendChild(td);}
        table.appendChild(tr);
      })(this)">+ Row</button>
      <button class="editor-table-btn" onclick="(function(btn){
        btn.closest('.editor-table-wrap').querySelector('table').querySelectorAll('tr').forEach(function(row){
          var isHead=row.closest('thead');
          var cell=document.createElement(isHead?'th':'td');
          cell.contentEditable='true';cell.innerHTML=isHead?'Header':'&nbsp;';row.appendChild(cell);
        });
      })(this)">+ Column</button>
      <button class="editor-table-btn editor-table-btn--danger" onclick="this.closest('.editor-table-wrap').remove()">Remove</button>
    </div></div><p><br></p>`;

    editorRef.current?.focus();
    document.execCommand('insertHTML', false, html);
    notifyChange();
  }, [restoreSelection, notifyChange]);

  // ── Code block ──────────────────────────────────────────────────────────────
  const handleInsertCode = useCallback((config: CodeBlockConfig) => {
    restoreSelection();
    const { language, code } = config;

    // ── Resolve the Prism grammar ─────────────────────────────────────────────
    // "html" maps to the "markup" grammar in Prism.
    // Fall back to plain escaped text if the grammar isn't loaded.
    const grammarKey = language === 'html' ? 'markup' : language;
    const grammar = Prism.languages[grammarKey];

    // Prism.highlight() returns a string of <span class="token …">…</span> HTML.
    // If the grammar isn't available we fall back to escaped plain text.
    const highlightedCode = grammar
      ? Prism.highlight(code, grammar, grammarKey)
      : escapeHtml(code);

    const html = `<div class="editor-code-wrap" contenteditable="false">
      <div class="editor-code-header">
        <span class="editor-code-lang">${escapeHtml(language)}</span>
        <button class="editor-code-copy" onclick="(function(btn){
          var code=btn.closest('.editor-code-wrap').querySelector('code').innerText;
          navigator.clipboard.writeText(code).then(function(){btn.textContent='Copied!';setTimeout(function(){btn.textContent='Copy'},1500)});
        })(this)">Copy</button>
      </div>
      <pre class="editor-pre language-${language}"><code class="language-${language}">${highlightedCode}</code></pre>
    </div><p><br></p>`;

    editorRef.current?.focus();
    document.execCommand('insertHTML', false, html);
    notifyChange();
  }, [restoreSelection, notifyChange]);

  // ── Image ───────────────────────────────────────────────────────────────────
  const handleInsertImage = useCallback((url: string, alt: string) => {
    restoreSelection();
    const html = `<div class="editor-image-wrap" contenteditable="false">
      <img src="${escapeAttr(url)}" alt="${escapeAttr(alt)}" class="editor-image" />
      <button class="editor-image-del" onclick="this.closest('.editor-image-wrap').remove()">✕ Remove</button>
    </div><p><br></p>`;

    editorRef.current?.focus();
    document.execCommand('insertHTML', false, html);
    notifyChange();
  }, [restoreSelection, notifyChange]);

  // ── Link ────────────────────────────────────────────────────────────────────
  const handleInsertLink = useCallback((config: LinkConfig) => {
    restoreSelection();
    if (config.text) {
      exec('insertHTML', `<a href="${escapeAttr(config.url)}" target="_blank" rel="noopener" class="editor-link">${escapeHtml(config.text)}</a>`);
    } else {
      exec('createLink', config.url);
      editorRef.current?.querySelectorAll(`a[href="${config.url}"]`).forEach((a) => {
        (a as HTMLAnchorElement).target = '_blank';
        a.className = 'editor-link';
      });
    }
  }, [restoreSelection, exec]);

  // ── Color ───────────────────────────────────────────────────────────────────
  const handleApplyColor = useCallback((color: string) => {
    restoreSelection();
    if (colorMode === 'text') {
      exec('foreColor', color);
    } else {
      exec('hiliteColor', color);
    }
  }, [restoreSelection, colorMode, exec]);

  // ── Checklist ───────────────────────────────────────────────────────────────
  const handleInsertChecklist = useCallback(() => {
    editorRef.current?.focus();
    const html = `<div class="editor-checklist-item" data-checked="false">
      <input type="checkbox" class="editor-checkbox" onchange="(function(cb){
        var item=cb.closest('.editor-checklist-item');
        item.dataset.checked=cb.checked;
        var text=item.querySelector('.editor-check-text');
        if(text){text.style.textDecoration=cb.checked?'line-through':'none';text.style.opacity=cb.checked?'0.4':'1';}
      })(this)">
      <span class="editor-check-text" contenteditable="true">New task</span>
      <button class="editor-check-del" onclick="this.closest('.editor-checklist-item').remove()">✕</button>
    </div>`;
    exec('insertHTML', html);
  }, [exec]);

  // ── HR ──────────────────────────────────────────────────────────────────────
  const handleInsertHR = useCallback(() => {
    editorRef.current?.focus();
    exec('insertHTML', '<hr class="editor-hr"><p><br></p>');
  }, [exec]);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      // Bubble up to parent save handler
      editorRef.current?.dispatchEvent(new CustomEvent('editor-save', { bubbles: true }));
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      exec('insertHTML', '&nbsp;&nbsp;&nbsp;&nbsp;');
    }
  }, [exec]);

  // ── Clipboard: paste images ─────────────────────────────────────────────────
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;
        const reader = new FileReader();
        reader.onload = (ev) => {
          const url = ev.target?.result as string;
          handleInsertImage(url, 'Pasted image');
        };
        reader.readAsDataURL(file);
        return;
      }
    }
  }, [handleInsertImage]);

  return (
    /*
     * Layout contract:
     *   • The outer wrapper is a FLEX COLUMN with a FIXED height supplied by
     *     the parent (via `className`).  It must NOT overflow-y itself.
     *   • Toolbar  → flex-shrink:0  – never scrolls, always visible.
     *   • Content  → flex:1 min-h-0 overflow-y-auto  – scrolls internally.
     *   • Footer   → flex-shrink:0  – always visible at bottom.
     *
     * When used inside ProjectCreator pass className="flex-1 min-h-0"
     * When used as a standalone block pass a fixed height, e.g. className="h-[600px]"
     */
    <div
      className={`
        flex flex-col rounded-xl border border-white/10 bg-[#0B0E14]
        overflow-hidden
        ${className}
      `}
    >
      {/* ── Toolbar – sticky at top, never scrolls ── */}
      <div className="flex-shrink-0 sticky top-0 z-10 bg-[#151922]">
        <EditorToolbar
          onFormat={handleFormat}
          onBlockFormat={handleBlockFormat}
          onOpenModal={(modal) => {
            if (modal === 'textColor') openColorModal('text');
            else if (modal === 'highlight') openColorModal('highlight');
            else openModal(modal);
          }}
          onInsertChecklist={handleInsertChecklist}
          onInsertHR={handleInsertHR}
        />
      </div>

      {/* ── Content area – this is the ONLY part that scrolls ── */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={notifyChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onMouseUp={saveSelection}
        onKeyUp={saveSelection}
        className="editor-body flex-1 min-h-0 overflow-y-auto outline-none
          text-[#E2E8F0] text-sm leading-7 p-5"
        style={{ minHeight }}
      />

      {/* ── Word count footer – always visible at bottom ── */}
      <div className="flex-shrink-0 px-5 py-2 border-t border-white/5 bg-[#0d1015]
        flex items-center justify-end gap-4">
        <span className="text-xs text-[#94A3B8]/60">
          {wordCount} words · {charCount} chars
        </span>
      </div>

      {/* Modals */}
      <TableModal
        isOpen={activeModal === 'table'}
        onClose={() => setActiveModal(null)}
        onInsert={handleInsertTable}
      />
      <CodeBlockModal
        isOpen={activeModal === 'code'}
        onClose={() => setActiveModal(null)}
        onInsert={handleInsertCode}
      />
      <ImageModal
        isOpen={activeModal === 'image'}
        onClose={() => setActiveModal(null)}
        onInsert={handleInsertImage}
      />
      <LinkModal
        isOpen={activeModal === 'link'}
        onClose={() => setActiveModal(null)}
        onInsert={handleInsertLink}
      />
      <ColorModal
        isOpen={activeModal === 'textColor' || activeModal === 'highlight'}
        onClose={() => setActiveModal(null)}
        mode={colorMode}
        onApply={handleApplyColor}
      />
    </div>
  );
}
