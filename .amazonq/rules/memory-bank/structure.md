# CuPlus — Project Structure

## Directory Layout

```
cuplus/
├── src/
│   ├── app/                        # Next.js App Router pages
│   │   ├── page.tsx                # Root → redirects to home/page.tsx
│   │   ├── layout.tsx              # Root layout: fonts, theme init script, metadata
│   │   ├── globals.css             # Design tokens, Tailwind v4 @theme, editor styles
│   │   ├── auth/page.tsx           # Google sign-in page
│   │   ├── onboarding/page.tsx     # First-run onboarding
│   │   ├── home/page.tsx           # Main dashboard
│   │   ├── notes/
│   │   │   ├── page.tsx            # Notes list
│   │   │   └── [id]/page.tsx       # Single note editor
│   │   ├── projects/
│   │   │   ├── page.tsx            # Projects grid
│   │   │   └── [projectId]/page.tsx # Single project editor
│   │   ├── sanctum/
│   │   │   ├── page.tsx            # Sanctum vault entry (password gate)
│   │   │   └── [sanctumId]/page.tsx # Single sanctum document editor
│   │   ├── habits/page.tsx         # Habit tracker
│   │   ├── tasks/page.tsx          # Task list
│   │   ├── archive/page.tsx        # Archived projects
│   │   ├── recycle-bin/page.tsx    # Soft-deleted items
│   │   └── profile/page.tsx        # User profile & settings
│   │
│   ├── components/
│   │   ├── editor/                 # Rich text editor (Tiptap)
│   │   │   ├── RichTextEditor.tsx  # Main editor component
│   │   │   ├── EditorToolbar.tsx   # Formatting toolbar
│   │   │   ├── types.ts            # Shared types: Project, Note, ProjectInput, etc.
│   │   │   └── modals/             # Editor-specific modals (link, image, table…)
│   │   ├── Note/
│   │   │   ├── NoteCreator.tsx     # New note creation form
│   │   │   └── NoteGrid.tsx        # Notes grid/list display
│   │   ├── projects/
│   │   │   ├── ProjectCard.tsx     # Project card in grid
│   │   │   ├── ProjectCreator.tsx  # New project creation form
│   │   │   ├── ProjectGrid.tsx     # Projects grid display
│   │   │   └── ProjectsHero.tsx    # Projects page hero/header
│   │   ├── Sanctum/
│   │   │   ├── SanctumCard.tsx     # Sanctum item card
│   │   │   ├── SanctumCreator.tsx  # New sanctum document form
│   │   │   └── SanctumHero.tsx     # Sanctum page hero
│   │   ├── profile/
│   │   │   ├── AccountSection.tsx
│   │   │   ├── AppearanceSection.tsx
│   │   │   ├── ContactSection.tsx  # EmailJS contact form
│   │   │   ├── DataExportSection.tsx
│   │   │   ├── DeleteAccountSection.tsx
│   │   │   ├── ProfileSidebar.tsx  # Profile page nav
│   │   │   ├── SanctumSection.tsx
│   │   │   └── StorageSection.tsx
│   │   ├── sidebar/
│   │   │   ├── AddMemoryModal.tsx
│   │   │   ├── RememberThis.tsx
│   │   │   ├── UserProfile.tsx
│   │   │   └── ViewMemoryModal.tsx
│   │   ├── CalendarWidget.tsx
│   │   ├── CategoryInput.tsx
│   │   ├── CategoryRow.tsx
│   │   ├── CategorySelector.tsx
│   │   ├── CuplusLoader.tsx        # App-wide loading spinner
│   │   ├── DeleteConfirmation.tsx  # Reusable delete confirm modal
│   │   ├── HabitTracker.tsx
│   │   ├── Header.tsx              # Top navigation bar
│   │   ├── Layout.tsx              # App shell (sidebar + header + content)
│   │   ├── QuickCapture.tsx
│   │   ├── Scratchpad.tsx
│   │   ├── Sidebar.tsx             # Left navigation sidebar
│   │   ├── ThemeToggle.tsx         # Dark/light toggle
│   │   ├── ThumbnailUpload.tsx     # Cloudinary image upload
│   │   └── UpcomingTasks.tsx
│   │
│   └── lib/
│       ├── firebase.ts             # Firebase app init (auth, db, googleProvider)
│       ├── projects.ts             # Firestore CRUD for projects
│       ├── sanctum.ts              # Firestore CRUD + AES-GCM crypto for sanctum
│       ├── habits.ts               # Firestore CRUD for habits
│       ├── cloudinary.ts           # Cloudinary upload helpers
│       └── utils.ts                # Shared utility functions
│
├── public/                         # Static assets (logos, favicons, images)
├── android/cuplus/                 # Capacitor Android project
├── firebase/                       # Firebase service account keys (gitignored)
├── next.config.ts                  # Next.js config (remote images, skip TS/ESLint errors on build)
├── postcss.config.mjs              # PostCSS with Tailwind v4
├── tsconfig.json
├── .env.local                      # Environment variables (Firebase, Cloudinary, EmailJS)
└── package.json
```

## Architectural Patterns

### Routing
- Next.js App Router with file-based routing
- Dynamic segments: `[id]`, `[projectId]`, `[sanctumId]`
- Root `page.tsx` delegates to `home/page.tsx`

### Data Layer (`src/lib/`)
- All Firestore operations are isolated in `lib/*.ts` modules
- Each module exports typed async functions (create, read, update, delete)
- Firebase initialized once with `getApps()` guard to prevent multi-init
- Data mapper functions (e.g., `toProject`) normalize Firestore documents to typed objects with safe defaults

### State Management
- Local React state (`useState`, `useRef`) — no global state library
- `react-firebase-hooks` for auth state (`useAuthState`)
- Form state managed with `react-hook-form` or local `useState`

### Security (Sanctum)
- Passwords hashed with SHA-256 (stored in Firestore for verification only)
- Content encrypted with AES-GCM, key derived via PBKDF2 (100k iterations)
- Encrypted format: `base64(salt):base64(iv):base64(ciphertext)`
- Session password lives in React state only — never persisted

### Theming
- CSS custom properties (`--bg`, `--surface`, `--text-main`, etc.) defined on `:root` (dark default)
- Light mode overrides on `[data-theme="light"]` selector
- Theme persisted in `localStorage` under key `cuplus-theme`
- Inline `<script>` in `<head>` applies theme before hydration to prevent flash
