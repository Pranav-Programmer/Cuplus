# CuPlus – Technology Stack

## Core Framework
- **Next.js 16.1.6** – App Router, SSR/SSG, image optimization
- **React 19.2.3** – UI library
- **TypeScript 5** – Strict mode enabled (`"strict": true`)
- **Target**: ES2017, module resolution: bundler

## Styling
- **Tailwind CSS 4.2.1** – Utility-first CSS via `@tailwindcss/postcss`
- **@tailwindcss/forms** – Form element resets
- **@tailwindcss/container-queries** – Container query support
- **class-variance-authority** – Variant-based component styling
- **clsx + tailwind-merge** – Conditional class merging via `cn()` utility

## Backend / Database
- **Firebase 12.10.0** – Auth (Google OAuth), Firestore (database)
- **react-firebase-hooks 5.1.1** – Firebase React hooks
- All config via `NEXT_PUBLIC_FIREBASE_*` environment variables

## Rich Text Editor
- **Tiptap 3.20.1** – Headless rich-text editor
  - Extensions: StarterKit, Highlight, Image, Link, Strike, Underline
  - `@tiptap/pm` – ProseMirror core

## Media
- **Cloudinary (next-cloudinary 6.17.5)** – Image upload and hosting
- Remote image patterns: `https://**` (all HTTPS hosts allowed)

## Mobile
- **Capacitor 8.3.0** – Web-to-native bridge
  - `@capacitor/core`, `@capacitor/android`
  - App ID: `com.cuplus.app`
  - Android project in `android/`

## UI Components & Icons
- **lucide-react 0.577.0** – Icon library
- **@radix-ui/react-popover**, **@radix-ui/react-select**, **@radix-ui/react-toggle** – Accessible primitives
- **@material-tailwind/react 2.1.10** – Material-style components
- **Google Fonts** – Inter (body), Material Icons, Material Symbols Outlined

## Forms
- **react-hook-form 7.71.2** – Form state management

## Email
- **@emailjs/browser 4.4.1** – Client-side email sending

## Code Highlighting
- **prismjs 1.30.0** – Syntax highlighting in code blocks

## Crypto
- **Web Crypto API** (native browser) – AES-GCM encryption, PBKDF2 key derivation, SHA-256 hashing (used in Sanctum)

## Development Commands
```bash
npm run dev      # Start Next.js dev server (Turbopack)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
```

## Build Configuration
- TypeScript build errors: **ignored** (`ignoreBuildErrors: true`)
- ESLint during builds: **ignored** (`ignoreDuringBuilds: true`)
- Path alias: `@/*` → `src/*`

## Deployment
- **Vercel** (`.vercel/project.json` present)
- Environment variables required: all `NEXT_PUBLIC_FIREBASE_*` keys + Cloudinary config
