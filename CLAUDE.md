# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Theme-a-roo is a theme development and testing environment for [Theme-o-rama](https://github.com/dkackman/theme-o-rama) themes. It's a Tauri v2 desktop application with a React frontend that can also run as a standalone web app.

## Build and Development Commands

```bash
# Install dependencies
pnpm install

# Development - Tauri desktop app
pnpm tauri dev

# Development - Web only (faster iteration)
pnpm build:web && pnpm preview:web   # runs at http://localhost:4174/

# Production builds
pnpm build          # Tauri build
pnpm build:web      # Web-only build (outputs to dist-web/)

# Code quality
pnpm lint           # ESLint
pnpm prettier:check # Check formatting
pnpm prettier       # Fix formatting
```

## Architecture

### Dual Build Targets

- **Tauri app**: Uses `vite.config.ts`, runs on port 1425, full native features
- **Web app**: Uses `vite.config.web.ts`, outputs to `dist-web/`, sets `__TAURI__: false`

The `src/lib/web-fallbacks.ts` provides browser-compatible stubs for Tauri APIs when running as a web app.

### Theme System

- Themes live in `src/themes/[theme-name]/theme.json` with optional background images
- Theme discovery uses Vite's `import.meta.glob` to scan theme folders at build time
- Themes can inherit from other themes via the `inherits` property
- The `theme-o-rama` npm package provides `ThemeProvider`, `useTheme`, and `validateTheme`
- Theme schema defined in `src/themes/schema.json`

### State Management

- **Theme editing state**: `src/hooks/useWorkingThemeState.ts` - Zustand store persisted to localStorage
- **Background images**: Stored in IndexedDB via `src/lib/imageStorage.ts`, referenced by blob URLs
- **Error handling**: React context in `src/contexts/ErrorContext.tsx`

### Key Libraries

- UI: Shadcn/ui components (in `src/components/ui/`)
- Styling: Tailwind CSS with `@` path alias mapped to `./src`
- Routing: React Router with hash-based routing
- State: Zustand with persistence middleware

### Rust Backend

The Tauri backend (`src-tauri/`) is minimal - it just initializes plugins for window state, dialogs, filesystem access, and URL opening. No custom Rust commands are defined.
