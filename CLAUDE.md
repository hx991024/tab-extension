# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A minimal, high-performance Chrome/Edge new tab extension built with vanilla JavaScript (ES6+ modules). The extension provides a distraction-free start page with real-time clock, multi-search engine support, wallpaper customization, and theme switching.

**Key Tech Stack:**
- Manifest V3 (Chrome & Edge compatible)
- Vanilla HTML5, CSS3, JavaScript ES6+ (no frameworks)
- Chrome Storage API for persistence
- CSS Variables for theming
- Glassmorphism UI design with responsive layout

## Development Workflow

### Installing the Extension

1. Open Chrome/Edge and navigate to `chrome://extensions/` or `edge://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked extension"
4. Select the project root directory
5. Open a new tab to see changes

### Testing Changes

After modifying code:
1. Go to `chrome://extensions/`
2. Click the refresh icon on the extension card
3. Open a new tab to verify changes

**Note:** Changes to `background.js` require a full extension reload. CSS/JS changes in the newtab page only need a page refresh.

### Debugging

- **Page debugging:** Open DevTools on the new tab page (F12)
- **Background script:** Click "Service Worker" link in `chrome://extensions/`
- **Storage inspection:** Use `chrome.storage.local.get(console.log)` in console

## Architecture

### Module System

The codebase uses ES6 modules with a clear separation of concerns:

**Core Initialization Flow (scripts/main.js):**
1. `App` class orchestrates all modules
2. Modules are initialized in order: Theme → Wallpaper → Clock → Search → Settings
3. Theme loads first as other modules may depend on theme state
4. Event-driven communication between modules using CustomEvents
5. Storage changes from other tabs are synchronized via `chrome.storage.onChanged`

**Module Communication Pattern:**
- Settings panel dispatches CustomEvents (e.g., `searchWidthChanged`)
- Main app listens to events and coordinates module updates
- Each module is self-contained and manages its own DOM and state

### Key Modules

**scripts/storage.js:**
- Singleton wrapper around `chrome.storage.local`
- Provides Promise-based API
- Merges stored settings with defaults to handle missing keys
- Category-based storage: `general`, `wallpaper`, `engines`, `theme`

**scripts/search.js:**
- Manages search input, engine switching, and query execution
- Tab key cycles through engines (when enabled in settings)
- Supports both new tab and current tab search modes
- Search URL format uses `%s` as keyword placeholder

**scripts/theme.js:**
- Applies theme by setting `data-theme` attribute on `<html>`
- System theme detection via `matchMedia('prefers-color-scheme: dark')`
- Modes: `system` (auto), `light`, `dark`

**scripts/wallpaper.js:**
- Handles wallpaper upload as Base64 data URL (max 5MB)
- Applies CSS `filter: blur()` and overlay opacity
- Default wallpaper: `assets/images/default.png`

**scripts/clock.js:**
- Simple interval-based clock (updates every 1000ms)
- Formats time as HH:mm:ss and date in Chinese format

**scripts/settings.js:**
- Manages settings drawer UI and user interactions
- Uses debouncing for slider inputs to reduce storage writes
- Dispatches CustomEvents when settings change

### Storage Schema

```javascript
{
  general: {
    searchWidth: 650,        // px, 400-900
    searchHeight: 55,        // px, 40-70
    searchRadius: 12,        // px, 0-30
    searchOpacity: 0.8,      // 0.2-1.0
    openIn: 'new-tab',       // 'new-tab' | 'current-tab'
    tabSwitch: true          // Enable Tab key engine switching
  },
  wallpaper: {
    imageUrl: 'assets/images/default.png',  // Base64 or path
    blur: 0,                 // px, 0-20
    overlayOpacity: 0.3      // 0-0.8
  },
  engines: {
    default: 'google',       // Engine ID
    list: [                  // Array of engine objects
      {
        id: 'google',
        name: 'Google',
        url: 'https://www.google.com/search?q=%s',
        icon: 'https://www.google.com/favicon.ico'
      }
    ]
  },
  theme: {
    mode: 'system'           // 'system' | 'light' | 'dark'
  }
}
```

## CSS Architecture

**CSS Loading Order (newtab.html):**
1. `main.css` - Reset and base layout
2. `theme.css` - CSS custom properties for light/dark themes
3. `components.css` - Search box, clock, buttons
4. `wallpaper.css` - Background layers
5. `settings.css` - Settings drawer and modal

**Responsive Design:**
- Uses `clamp(min, preferred, max)` for fluid sizing
- Viewport units (vw/vh) for proportional scaling
- Minimal media queries due to clamp() usage
- Details in `docs/responsive-design.md`

**Theme System:**
- Themes defined via CSS custom properties in `theme.css`
- Switched by changing `data-theme` attribute on `<html>`
- Variables include colors, shadows, backdrop filters

## Important Patterns

### Event-Driven Updates

Settings changes trigger CustomEvents that the main app listens to:
```javascript
// In settings.js
document.dispatchEvent(new CustomEvent('searchWidthChanged', {
  detail: value
}))

// In main.js
document.addEventListener('searchWidthChanged', (e) => {
  this.updateSearchWidth(e.detail)
})
```

**Search Height Auto-Scaling:**
When search box height is adjusted, the icon size, icon margin, and font size automatically scale proportionally:
- Icon size: `height * 0.4` (e.g., 50px height → 20px icon)
- Icon margin: `height * 0.3` (e.g., 50px height → 15px margin)
- Font size: `height * 0.32` (e.g., 50px height → 16px font)

This ensures visual consistency across different search box heights (40-70px range).

### Storage Synchronization

Changes from other tabs are automatically synchronized:
```javascript
storageManager.onChanged((newSettings, oldSettings) => {
  // Update local state and UI
})
```

### Module Lifecycle

Each module follows this pattern:
- Constructor: Initialize properties, call `init()`
- `init()`: Load settings, bind events, apply state
- `destroy()`: Clean up timers and event listeners

## Common Tasks

### Adding a New Search Engine

1. User adds via settings modal (engines tab)
2. `scripts/engines.js` validates input and updates `engines.list`
3. Storage is updated via `storageManager.updateCategory('engines', ...)`
4. Search module receives update via CustomEvent `enginesUpdated`

### Modifying Theme Colors

Edit CSS custom properties in `styles/theme.css`:
```css
[data-theme='light'] {
  --color-text: #333;
  --color-bg: rgba(255, 255, 255, 0.8);
}
```

### Adding a Settings Control

1. Add HTML in `newtab.html` settings drawer
2. Add event binding in `scripts/settings.js`
3. Dispatch CustomEvent with new value
4. Handle event in `scripts/main.js` to coordinate updates
5. Update storage schema in `scripts/storage.js` defaults

## File Naming Conventions

- Module files: lowercase, single word (e.g., `search.js`, `theme.js`)
- CSS files: lowercase, descriptive (e.g., `components.css`)
- Documentation: kebab-case (e.g., `responsive-design.md`)

## Browser Compatibility

- Chrome 79+ (for `clamp()` support)
- Edge 79+ (Chromium-based)
- Requires Manifest V3 support

## Known Limitations

- Wallpaper stored as Base64 in `chrome.storage.local` (5MB file size limit)
- Background service worker has limited capabilities (no persistent state)
- Tab key switching only works when search input is focused
