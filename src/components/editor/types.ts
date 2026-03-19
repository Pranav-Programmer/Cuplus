// ─── Editor Types ────────────────────────────────────────────────────────────

export type FormatCommand =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikeThrough'
  | 'insertUnorderedList'
  | 'insertOrderedList'
  | 'justifyLeft'
  | 'justifyCenter'
  | 'justifyRight'
  | 'justifyFull'
  | 'undo'
  | 'redo';

export type BlockFormat = 'p' | 'h1' | 'h2' | 'h3' | 'blockquote';

export interface TableConfig {
  rows: number;
  cols: number;
  hasHeader: boolean;
}

export interface CodeBlockConfig {
  language: string;
  code: string;
}

export interface ImageConfig {
  url: string;
  alt: string;
  file?: File | null;
}

export interface LinkConfig {
  url: string;
  text: string;
}

export type ModalType =
  | 'table'
  | 'code'
  | 'image'
  | 'link'
  | 'textColor'
  | 'highlight'
  | null;

// ─── Project Types ────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  title: string;
  category: string;
  content: string;           // HTML string from the editor
  thumbnailUrl?: string;
  color?: string;
  wordCount?: number;
  archived: boolean;         // true → shown only on Archive page
  removed: boolean;          // true → shown only on Recycle Bin page
  createdAt: Date | { seconds: number; nanoseconds: number };
  updatedAt: Date | { seconds: number; nanoseconds: number };
  userId?: string;
}

export type ProjectInput = Omit<Project, 'id' | 'createdAt' | 'updatedAt'>;

export const SUPPORTED_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'css', label: 'CSS' },
  { value: 'html', label: 'HTML' },
  { value: 'sql', label: 'SQL' },
  { value: 'java', label: 'Java' },
  { value: 'bash', label: 'Bash' },
  { value: 'json', label: 'JSON' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'rust', label: 'Rust' },
  { value: 'go', label: 'Go' },
] as const;

export const TEXT_COLORS = [
  '#E2E8F0', '#60A5FA', '#34D399', '#FBBF24',
  '#F87171', '#A78BFA', '#2DD4BF', '#FB923C',
  '#F472B6', '#94A3B8',
];

export const HIGHLIGHT_COLORS = [
  'rgba(96,165,250,0.25)',
  'rgba(52,211,153,0.25)',
  'rgba(251,191,36,0.30)',
  'rgba(248,113,113,0.25)',
  'rgba(167,139,250,0.25)',
  'rgba(45,212,191,0.20)',
];
