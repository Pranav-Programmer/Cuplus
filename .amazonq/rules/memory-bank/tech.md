# CuPlus — Technology Stack

## Core Framework
- **Next.js 16.1.6** — App Router, SSR/SSG, file-based routing
- **React 19.2.3** — UI library
- **TypeScript 5** — Strict typing throughout

## Styling
- **Tailwind CSS v4.2.1** — Utility-first CSS with `@tailwindcss/postcss`
- **@tailwindcss/forms** — Form element resets
- **@tailwindcss/container-queries** — Container query support
- **CSS Custom Properties** — Design token system (`--bg`, `--surface`, `--text-main`, etc.)
- **Google Fonts** — Inter (body), Material Icons, Material Symbols Outlined

## Backend / Database
- **Firebase 12.10.0** — Auth (Google OAuth) + Firestore (NoSQL database)
- **react-firebase-hooks 5.1.1** — `useAuthState` and other Firebase React hooks

## Rich Text Editor
- **Tiptap 3.20.1** — Headings, lists, code blocks, images, tables, links, highlight, underline, strike
- **PrismJS 1.30.0** — Syntax highlighting inside code blocks

## Media
- **Cloudinary (next-cloudinary 6.17.5)** — Image upload and hosting for thumbnails

## Email
- **@emailjs/browser 4.4.1** — Client-side email sending for the contact form

## UI Components
- **Radix UI** — `@radix-ui/react-popover`, `@radix-ui/react-select`, `@radix-ui/react-toggle`
- **lucide-react 0.577.0** — Icon library
- **class-variance-authority 0.7.1** — Variant-based className composition
- **@material-tailwind/react 2.1.10** — Additional UI components

## Forms
- **react-hook-form 7.71.2** — Form state and validation

## Mobile
- **Capacitor 8.3.0** — `@capacitor/core`, `@capacitor/android` — wraps the web app as an Android APK

## Development Tools
- **ESLint 9** with `eslint-config-next 16.1.6`
- **PostCSS** with Tailwind v4 plugin
- **type-coverage** — TypeScript coverage reporting

## Environment Variables (`.env.local`)
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
NEXT_PUBLIC_EMAILJS_SERVICE_ID
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME  (likely)
```

## Development Commands
```bash
npm run dev      # Start dev server (Next.js Turbopack)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Deployment
- **Vercel** — Primary deployment platform (`.vercel/project.json` present)
- **Android** — Capacitor build in `android/cuplus/`

## Build Notes
- TypeScript errors are ignored during build (`typescript.ignoreBuildErrors: true`)
- ESLint errors are ignored during build (`eslint.ignoreDuringBuilds: true`)
- Remote images: all HTTPS hostnames allowed (`hostname: "**"`)
