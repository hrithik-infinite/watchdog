# WatchDog - Accessibility Checker Chrome Extension

## Overview
WatchDog is a Chrome extension for instant accessibility audits with visual highlighting. It uses axe-core to scan web pages for accessibility issues and provides fix suggestions.

## Project Type
This is a **Chrome Extension** built with:
- React 19 + TypeScript
- Vite + CRXJS plugin for extension development
- Tailwind CSS for styling
- Zustand for state management
- axe-core for accessibility scanning

## Project Structure
```
src/
├── background/       # Service worker (extension background script)
├── content/          # Content scripts injected into web pages
├── popup/            # Extension popup UI
├── sidepanel/        # Side panel UI (main interface)
├── shared/           # Shared utilities, types, and constants
└── manifest.json     # Chrome extension manifest v3
icons/                # Extension icons (16, 32, 48, 128px)
dist/                 # Built extension (after npm run build)
```

## Development
The dev server runs on port 5000 with HMR support via CRXJS.

**Note:** Since this is a Chrome extension, the full functionality requires loading the extension in Chrome. The dev server provides preview of the UI components but Chrome APIs (like `chrome.runtime.sendMessage`) won't work outside of Chrome's extension context.

## How to Use the Extension

### Development Mode
1. Run `npm run dev` to start the dev server
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `dist` folder

### Production Build
1. Run `npm run build` to build the extension
2. The built extension will be in the `dist/` folder
3. Load it as an unpacked extension in Chrome

## Scripts
- `npm run dev` - Start development server with HMR
- `npm run build` - Build production extension
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Recent Changes
- January 14, 2026: Initial setup for Replit environment
  - Configured Vite for port 5000 with host 0.0.0.0
  - Generated extension icons
  - Fixed ESM imports in vite.config.ts
