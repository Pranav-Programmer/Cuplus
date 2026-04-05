# CuPlus — Product Overview

## Purpose
CuPlus is a Personal Knowledge Management (PKM) web app that lets users capture, organize, and protect their ideas, notes, and projects in one place. It is deployed on Vercel and also packaged as an Android app via Capacitor.

## Key Features

### Core Modules
- **Notes** — Create and edit rich-text notes with a full Tiptap-powered editor (headings, lists, code blocks, images, tables, checklists, links)
- **Projects** — Organize long-form writing or work into titled, categorized, thumbnail-supported project documents
- **Sanctum** — Password-protected encrypted space (personal & official) where title and content are AES-GCM encrypted client-side; the server never sees plaintext
- **Habits** — Habit tracking module
- **Tasks** — Upcoming task management with a calendar widget
- **Archive** — Archived projects view
- **Recycle Bin** — Soft-deleted items before permanent removal

### Supporting Features
- **Quick Capture** — Fast note/idea capture from the sidebar
- **Scratchpad** — Ephemeral scratch area in the sidebar
- **Remember This** — Sidebar memory/reminder widget
- **Theme Toggle** — Dark (default) / Light mode with instant CSS-variable switching, persisted in `localStorage`
- **Contact Form** — EmailJS-powered contact section on the profile page
- **Data Export** — User data export capability
- **Onboarding** — First-run onboarding flow
- **Google Auth** — Firebase Google sign-in

## Target Users
Individual knowledge workers, writers, students, and developers who want a private, self-contained PKM tool with an optional encrypted vault (Sanctum).

## Value Proposition
- All-in-one PKM: notes + projects + encrypted vault + habits + tasks
- Client-side encryption for sensitive content (Sanctum)
- Dark-first, polished UI with smooth light/dark theme switching
- Cross-platform: web (Vercel) + Android (Capacitor)
