# CuPlus – Project Structure

## Directory Layout

```
cuplus/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx            # Root → delegates to home/page.tsx
│   │   ├── layout.tsx          # Root layout (Inter font, theme init script, metadata)
│   │   ├── globals.css         # Global styles + Tailwind base
│   │   ├── home/               # Dashboard page
│   │   ├── auth/               # Authentication page
│   │   ├── onboarding/         # New-user onboarding flow
│   │   ├── projects/
│   │   │   ├── page.tsx        # Projects list
│   │   │   └── [projectId]/    # Individual project detail/editor
│   │   ├── notes/
│   │   │   ├── page.tsx        # Notes list
│   │   │   └── [id]/           # Individual note editor
│   │   ├── habits/             # Habit tracker page
│   │   ├── tasks/              # Tasks page
│   │   ├── sanctum/
│   │   │   ├── page.tsx        # Sanctum vault list
│   │   │   └── [sanctumId]/    # Individual sanctum document
│   │   ├── archive/            # Archived projects page
│   │   ├── recycle-bin/        # Soft-deleted items page
│   │   └── profile/            # User profile & settings
│   │
│   ├── components/
│   │   ├── editor/             # Rich-text editor (Tiptap-based)
│   │   │   ├── RichTextEditor.tsx
│   │   │   ├── EditorToolbar.tsx
│   │   │   ├── types.ts        # Shared types (Project, FormatCommand, etc.)
│   │   │   └── modals/         # Table, code, image, link, color modals
│   │   ├── projects/           # ProjectCard, ProjectCreator, ProjectGrid, ProjectsHero
│   │   ├── Note/               # NoteCreator, NoteGrid
│   │   ├── Sanctum/            # SanctumCard, SanctumCreator, SanctumHero
│   │   ├── profile/            # Profile section components (8 sections)
│   │   ├── sidebar/            # AddMemoryModal, RememberThis, UserProfile, ViewMemoryModal
│   │   ├── Layout.tsx          # App shell with sidebar
│   │   ├── Sidebar.tsx         # Navigation sidebar
│   │   ├── Header.tsx          # Top header bar
│   │   ├── CuplusLoader.tsx    # Full-screen / inline loading spinner
│   │   ├── HabitTracker.tsx    # Habit tracking widget
│   │   ├── CalendarWidget.tsx  # Calendar UI widget
│   │   ├── QuickCapture.tsx    # Fast note capture
│   │   ├── Scratchpad.tsx      # Ephemeral scratch area
│   │   ├── UpcomingTasks.tsx   # Task preview widget
│   │   ├── ThemeToggle.tsx     # Light/dark toggle
│   │   ├── ThumbnailUpload.tsx # Cloudinary image upload
│   │   ├── CategoryInput.tsx / CategoryRow.tsx / CategorySelector.tsx
│   │   └── DeleteConfirmation.tsx
│   │
│   └── lib/                    # Data access & utilities
│       ├── firebase.ts         # Firebase app init (singleton guard)
│       ├── projects.ts         # Firestore CRUD for projects
│       ├── habits.ts           # Firestore CRUD + real-time subscriptions for habits
│       ├── sanctum.ts          # Encrypted Firestore CRUD + crypto helpers
│       ├── cloudinary.ts       # Cloudinary upload helper
│       └── utils.ts            # cn() utility (clsx + tailwind-merge)
│
├── android/                    # Capacitor Android project
├── firebase/                   # Firebase service account keys (gitignored in prod)
├── public/                     # Static assets (icons, images)
├── next.config.ts              # Next.js config (remote images, build error suppression)
├── capacitor.config.ts         # Capacitor config (appId: com.cuplus.app)
├── tsconfig.json               # TypeScript config (strict, paths: @/* → src/*)
└── package.json
```

## Architectural Patterns

- **Next.js App Router** – File-based routing under `src/app/`. Each feature is a folder with `page.tsx`.
- **Dynamic routes** – `[projectId]`, `[id]`, `[sanctumId]` for detail pages.
- **Feature-sliced components** – Components grouped by domain (`projects/`, `Note/`, `Sanctum/`, `profile/`, `sidebar/`).
- **Lib layer** – All Firebase/Firestore calls isolated in `src/lib/`. Pages/components import from lib, never call Firestore directly.
- **Client-side encryption** – Sanctum uses Web Crypto API (AES-GCM + PBKDF2) entirely in the browser.
- **Soft-delete lifecycle** – Projects have `archived` and `removed` boolean flags; hard delete is a separate explicit action.
- **Real-time + one-shot reads** – Habits use `onSnapshot` subscriptions; projects use one-shot `getDocs`/`getDoc`.
- **Singleton Firebase init** – `getApps().length` guard prevents duplicate initialization.
