'use client';

import React from 'react';
import {
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, CheckSquare,
  Table2, Image, Code2, Link2, Minus,
  Undo2, Redo2, Type, Highlighter, Palette,
} from 'lucide-react';
import { ModalType } from './types';

interface ToolbarProps {
  onFormat: (cmd: string, value?: string) => void;
  onBlockFormat: (tag: string) => void;
  onOpenModal: (modal: ModalType) => void;
  onInsertChecklist: () => void;
  onInsertHR: () => void;
}

interface ToolbarBtnProps {
  onClick: () => void;
  title: string;
  active?: boolean;
  children: React.ReactNode;
}

function ToolbarBtn({ onClick, title, active, children }: ToolbarBtnProps) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors shrink-0 ${
        active ? 'bg-[#2e5bff]/20 text-[#60A5FA]' : 'hover:bg-black/5'
      }`}
      style={active ? undefined : { color: 'var(--text-muted)' }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-main)'; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
    >
      {children}
    </button>
  );
}

function Separator() {
  return <div className="w-px h-5 mx-1 shrink-0" style={{ background: 'var(--border-strong)' }} />;
}

export default function EditorToolbar({
  onFormat,
  onBlockFormat,
  onOpenModal,
  onInsertChecklist,
  onInsertHR,
}: ToolbarProps) {
  return (
    <div
      className="flex items-center gap-0.5 px-3 py-2 overflow-x-auto scrollbar-none flex-wrap"
      style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}
    >
      {/* Block format */}
      <select
        onMouseDown={(e) => e.stopPropagation()}
        onChange={(e) => onBlockFormat(e.target.value)}
        defaultValue="p"
        className="text-xs rounded-lg px-2 py-1.5 outline-none cursor-pointer mr-1 shrink-0"
        style={{ background: 'var(--bg)', border: '1px solid var(--border-strong)', color: 'var(--text-muted)' }}
      >
        <option value="p">Paragraph</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
        <option value="blockquote">Quote</option>
      </select>

      <Separator />

      {/* Text marks */}
      <ToolbarBtn onClick={() => onFormat('bold')} title="Bold (Ctrl+B)">
        <Bold size={14} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => onFormat('italic')} title="Italic (Ctrl+I)">
        <Italic size={14} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => onFormat('underline')} title="Underline (Ctrl+U)">
        <Underline size={14} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => onFormat('strikeThrough')} title="Strikethrough">
        <Strikethrough size={14} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => onFormat('inline-code')} title="Inline Code">
        <Code2 size={14} />
      </ToolbarBtn>

      <Separator />

      {/* Colors */}
      <ToolbarBtn onClick={() => onOpenModal('textColor')} title="Text Color">
        <Type size={14} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => onOpenModal('highlight')} title="Highlight">
        <Highlighter size={14} />
      </ToolbarBtn>

      <Separator />

      {/* Alignment */}
      <ToolbarBtn onClick={() => onFormat('justifyLeft')} title="Align Left">
        <AlignLeft size={14} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => onFormat('justifyCenter')} title="Center">
        <AlignCenter size={14} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => onFormat('justifyRight')} title="Align Right">
        <AlignRight size={14} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => onFormat('justifyFull')} title="Justify">
        <AlignJustify size={14} />
      </ToolbarBtn>

      <Separator />

      {/* Lists */}
      <ToolbarBtn onClick={() => onFormat('insertUnorderedList')} title="Bullet List">
        <List size={14} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => onFormat('insertOrderedList')} title="Numbered List">
        <ListOrdered size={14} />
      </ToolbarBtn>
      <ToolbarBtn onClick={onInsertChecklist} title="Checklist">
        <CheckSquare size={14} />
      </ToolbarBtn>

      <Separator />

      {/* Inserts */}
      <ToolbarBtn onClick={() => onOpenModal('table')} title="Insert Table">
        <Table2 size={14} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => onOpenModal('image')} title="Insert Image">
        <Image size={14} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => onOpenModal('code')} title="Code Block">
        <Palette size={14} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => onOpenModal('link')} title="Insert Link">
        <Link2 size={14} />
      </ToolbarBtn>
      <ToolbarBtn onClick={onInsertHR} title="Horizontal Rule">
        <Minus size={14} />
      </ToolbarBtn>

      <Separator />

      {/* History */}
      <ToolbarBtn onClick={() => onFormat('undo')} title="Undo (Ctrl+Z)">
        <Undo2 size={14} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => onFormat('redo')} title="Redo (Ctrl+Y)">
        <Redo2 size={14} />
      </ToolbarBtn>
    </div>
  );
}
