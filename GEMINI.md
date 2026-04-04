# GEMINI Instructions - my-link / my-profile

This workspace contains a Next.js profile/portfolio application located in the `my-profile` directory.

## Project Overview

- **Core Framework:** Next.js 16.2.2 (App Router)
- **UI Library:** React 19.2.4
- **Styling:** Tailwind CSS v4
- **Language:** TypeScript
- **Purpose:** A personal profile/portfolio site bootstrapped with `create-next-app`.

## Critical Instructions (from AGENTS.md)

⚠️ **Next.js 16 Compatibility:** This project uses a version of Next.js that may contain breaking changes relative to earlier versions. APIs, conventions, and file structure may differ from standard training data.
- Refer to `my-profile/AGENTS.md` for specific agent rules.
- Check `node_modules/next/dist/docs/` for relevant guidance before writing code.
- Heed all deprecation notices.

## Building and Running

Commands should be executed within the `my-profile` directory:

| Task | Command |
| :--- | :--- |
| Development | `npm run dev` |
| Production Build | `npm run build` |
| Start Production | `npm run start` |
| Linting | `npm run lint` |

## Directory Structure

- `my-profile/app/`: Next.js App Router directory (Routes, Layouts, Components).
- `my-profile/public/`: Static assets (images, fonts).
- `my-profile/globals.css`: Global styles including Tailwind imports.
- `my-profile/next.config.ts`: Next.js configuration.

## Development Conventions

- **Component Structure:** Use functional components with TypeScript and Tailwind CSS v4.
- **Styling:** Prefer Tailwind CSS utility classes. Note that Tailwind v4 might have different configuration or syntax compared to v3 (check `postcss.config.mjs` and imports).
- **Fonts:** Uses `next/font` for Geist and Geist Mono.
- **Routing:** Follow Next.js App Router conventions (folders define routes, `page.tsx` for views).
