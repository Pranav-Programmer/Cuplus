# CuPlus – Development Guidelines

## Code Quality Standards

### Directive & Module Pattern
- All interactive components start with `'use client';` (100% of components analyzed)
- Imports are grouped: React → Next.js → third-party → internal `@/components` → internal `@/lib`
- Path alias `@/` is used for all internal imports — never use relative `../../` paths

### TypeScript Conventions
- Strict mode is enabled; always type props with explicit interfaces
- Use `interface` for component props and data shapes, `type` for unions/aliases
- Firestore timestamps typed as `any` or `Date | { seconds: number; nanoseconds: number }` — always guard with `ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts)`
- Use `Omit<T, 'id' | 'createdAt' | 'updatedAt'>` pattern for input/create types
- Export types from `src/components/editor/types.ts` as the shared type source

### Naming Conventions
- Components: PascalCase files and exports (`ProjectCard.tsx`, `CuplusLoader`)
- Lib functions: camelCase, verb-first (`getProject`, `createHabitDef`, `removeProject`)
- Firestore collection constants: SCREAMING_SNAKE_CASE (`const COL = 'projects'`, `const HABITS_COL = 'habits'`)
- Event handlers: `handle` prefix (`handleSave`, `handleDelete`, `handleFormat`)
- Boolean state: descriptive (`editMode`, `saving`, `loading`, `menuOpen`)
- CSS class helpers: `cn()` from `@/lib/utils` (clsx + tailwind-merge)

---

## Structural Conventions

### Page Component Pattern
Every page follows this structure:
```tsx
'use client';
// 1. State declarations (useState, useRef)
// 2. Data loading useEffect (async IIFE pattern)
// 3. Action handlers (useCallback for expensive ones)
// 4. Keyboard shortcut useEffect
// 5. Early returns: loading → error → main render
```

Async IIFE in useEffect (standard data-loading pattern):
```tsx
useEffect(() => {
  if (!id) return;
  (async () => {
    setLoading(true);
    const data = await getSomething(id);
    if (!data) { setError('Not found.'); setLoading(false); return; }
    setData(data);
    setLoading(false);
  })();
}, [id]);
```

### Loading & Error States
- Always show `<CuplusLoader fullScreen label="Loading…" />` for page-level loading
- Error state renders a centered dark screen with `text-red-400` message + back link
- `CuplusLoader` accepts `fullScreen` (boolean) and `label` (string) props
- Use `dynamic(() => import(...), { ssr: false, loading: () => <CuplusLoader /> })` for heavy client components (e.g., RichTextEditor)

### Component Props Pattern
- Optional callback props use `?` and are called with `prop?.()` or guarded with `if (prop)`
- Render callback props conditionally: `{onEdit && (<button onClick={() => onEdit(project)}>`)}`
- Spread `...input` into Firestore writes, then add server fields separately

---

## Firestore / Data Layer Patterns

### Lib Layer Isolation
- ALL Firestore calls live in `src/lib/` — pages and components never import from `firebase/firestore` directly (exception: home page uses direct `onSnapshot` for tasks)
- Each lib file exports typed CRUD functions; pages import only what they need

### Data Normalization
- Every collection has a `toX(id, data)` mapper function that applies `?? defaultValue` fallbacks:
```ts
function toProject(id: string, data: Record<string, any>): Project {
  return {
    id,
    title: data.title ?? 'Untitled',
    // ...all fields with ?? fallbacks
  };
}
```

### Soft-Delete Lifecycle
Projects (and similar entities) follow a 3-state lifecycle:
- `archived: false, removed: false` → active (shown on main page)
- `archived: true, removed: false` → archived (shown on /archive)
- `removed: true` → recycle bin (shown on /recycle-bin)
- Hard delete is a separate `deleteProjectPermanently()` function

### Real-time vs One-shot
- Use `onSnapshot` for data that needs live updates (habits, tasks on home page)
- Use `getDocs`/`getDoc` for data loaded once per page visit (projects, notes)
- Always return the `Unsubscribe` function from `onSnapshot` as the useEffect cleanup
- Silence `permission-denied` errors: `if (err.code !== 'permission-denied') console.error(err)`

### Firebase Singleton Init
```ts
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
```
Always guard against multi-initialization.

### Firestore Query Pattern
```ts
const q = query(
  collection(db, COL),
  where('userId', '==', userId),
  where('archived', '==', false),
  orderBy('updatedAt', 'desc'),
);
```
Always filter by `userId` first, then status flags, then order.

---

## UI & Styling Patterns

### Color Palette (Dark Theme)
| Token | Value | Usage |
|---|---|---|
| Background | `#0B0E14` | Page background |
| Surface | `#151922` | Cards, panels, header |
| Surface overlay | `#151922/95` | Sticky headers with backdrop-blur |
| Border | `border-white/10` | All card/panel borders |
| Text primary | `text-[#E2E8F0]` | Headings, main content |
| Text muted | `text-[#94A3B8]` | Labels, secondary text |
| Text faint | `text-[#94A3B8]/60` | Timestamps, hints |
| Primary | `bg-primary` / `#2e5bff` | CTA buttons, accents |
| Danger | `text-red-400` / `hover:bg-red-500/10` | Delete actions |

### Card Pattern
```tsx
<div className="bg-[#151922] border border-white/10 rounded-2xl p-4">
```
Cards always use `rounded-2xl`, `border-white/10`, and `bg-[#151922]`.

### Button Variants
- Primary CTA: `bg-primary hover:bg-primary-dark rounded-lg text-white font-semibold shadow-[0_0_15px_-3px_rgba(46,91,255,0.4)]`
- Secondary: `bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[#94A3B8] hover:text-[#E2E8F0]`
- Ghost: `hover:bg-white/10 rounded-lg text-[#94A3B8] hover:text-[#E2E8F0]`
- Danger: `text-red-400 hover:bg-red-500/10 rounded-lg`
- All buttons include `transition-colors`
- Disabled state: `disabled:opacity-60 disabled:cursor-not-allowed`

### Sticky Header Pattern
```tsx
<header className="sticky top-0 z-30 bg-[#151922]/95 backdrop-blur border-b border-white/10 px-4 sm:px-8 py-4">
  <div className="max-w-5xl mx-auto flex items-center gap-3">
```
Max-width container is `max-w-5xl mx-auto` for content pages.

### Responsive Layout
- Mobile-first with `sm:`, `md:`, `lg:`, `xl:` breakpoints
- Sidebar hidden on mobile: `hidden lg:block` or `hidden xl:flex`
- Padding: `px-4 sm:px-8` for responsive horizontal padding
- `no-scrollbar` / `no-scrollbar-mobile` utility classes for scroll containers

### Icon Usage
- Use `lucide-react` for all UI icons with explicit `size` prop (e.g., `size={13}`, `size={14}`, `size={16}`)
- Use Material Icons (`<span className="material-icons">`) for sidebar/navigation icons
- Icons in buttons always paired with text: `<Icon size={13} /> Label`

### Hover-reveal Pattern (Kebab Menus)
```tsx
// Button hidden by default, revealed on group hover
className="opacity-0 group-hover:opacity-100"
// Parent has className="group"
```

### Dropdown/Context Menu Pattern
```tsx
{menuOpen && (
  <>
    {/* Backdrop to close on outside click */}
    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
    <div className="absolute right-0 bottom-full mb-1 w-48 bg-[#151922]
      border border-white/10 rounded-xl shadow-2xl z-50 py-1">
      {/* menu items */}
    </div>
  </>
)}
```

---

## Keyboard & Accessibility Patterns

### Keyboard Shortcuts
- Ctrl/Cmd+S for save — registered in `useEffect` with `editMode` dependency, cleaned up on unmount
- Always use `e.preventDefault()` before custom shortcut handling
- Pattern: `if ((e.ctrlKey || e.metaKey) && e.key === 's')`

### Saving State Feedback
- Show `<Loader2 size={13} className="animate-spin" />` during async operations
- Button text changes: `saving ? 'Saving…' : 'Save'`
- Show "Saved HH:MM" timestamp after successful save

---

## Security Patterns (Sanctum)

### Client-side Encryption
- Passwords: SHA-256 hashed via `crypto.subtle.digest`, stored as base64
- Content: AES-GCM encrypted with PBKDF2-derived key (100,000 iterations, SHA-256)
- Encrypted format: `base64(salt):base64(iv):base64(ciphertext)`
- Passwords NEVER stored in localStorage or DB — only in React state
- Decryption returns `null` on failure (wrong password or corrupted data) — never throws to UI

### Auth Guard Pattern
```tsx
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (!user) router.push('/onboarding');
  });
  return unsubscribe;
}, [router]);
```

---

## Editor Patterns

### RichTextEditor Usage
```tsx
// Dynamic import (SSR disabled) with loading fallback
const RichTextEditor = dynamic(() => import('@/components/editor/RichTextEditor'), {
  ssr: false,
  loading: () => <CuplusLoader fullScreen label="Loading…" />,
});

// Usage
<RichTextEditor
  initialContent={content}
  onChange={setContent}
  placeholder="Write your content…"
  className="h-[calc(100vh-280px)] min-h-125"
/>
```
- Parent controls height via `className` — editor fills it with flex layout
- Use a `key` prop to remount editor when switching documents (avoids cursor reset bug)
- Read-only view uses `dangerouslySetInnerHTML={{ __html: content }}` with class `editor-body prose-invert`

### Word Count Calculation
```ts
const wordCount = content
  ? new DOMParser().parseFromString(content, 'text/html').body.innerText.trim().split(/\s+/).length
  : 0;
```

---

## Anti-patterns to Avoid
- Do NOT call Firestore directly from page components (use lib functions)
- Do NOT re-initialize Firebase without the `getApps()` guard
- Do NOT use `useEffect` dependency on `initialContent` in the editor (causes cursor reset)
- Do NOT store passwords or decrypted content in localStorage
- Do NOT use `next/image` for user-uploaded thumbnails — use `<img>` with `// eslint-disable-next-line @next/next/no-img-element`
- Do NOT suppress TypeScript errors with `// @ts-ignore` — use proper typing or `as` casts
