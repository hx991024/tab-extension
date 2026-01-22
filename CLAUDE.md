# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A minimal Chrome/Edge new tab extension with real-time clock, multi-search engine support, wallpaper customization, and theme switching.

**Tech Stack:**
- Manifest V3 (Chrome & Edge compatible)
- Vanilla JavaScript ES6+ modules (no frameworks)
- Chrome Storage API for persistence
- CSS Variables for theming

## Development Workflow

### Loading the Extension

1. Open `chrome://extensions/` or `edge://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked extension" and select the project root
4. Open a new tab to verify

### Testing Changes

- **CSS/JS changes:** Refresh the new tab page (F5)
- **Background script changes:** Click refresh icon on the extension card in `chrome://extensions/`

### Debugging

- **Page:** Open DevTools on new tab page (F12)
- **Background worker:** Click "Service Worker" in extension card
- **Storage:** Run `chrome.storage.local.get(console.log)` in console

## Architecture

### Core Initialization (scripts/main.js)

The `App` class orchestrates all modules in this order:
1. `storageManager.init()` - Initialize storage first
2. `Theme` - Must load first (other modules may depend on theme state)
3. `Wallpaper`, `Clock`, `Search`, `Settings` - Parallel initialization
4. `bindModuleEvents()` - Bind CustomEvent listeners for cross-module communication
5. `applyInitialSettings()` - Apply stored settings to UI

### Module Communication Pattern

Settings changes dispatch CustomEvents that main.js listens to:

```javascript
// In settings.js - dispatch event
document.dispatchEvent(new CustomEvent('searchWidthChanged', { detail: value }))

// In main.js - listen and handle
document.addEventListener('searchWidthChanged', (e) => {
  this.updateSearchWidth(e.detail)
})
```

**Key Events:**
- `searchWidthChanged`, `searchHeightChanged`, `searchRadiusChanged`, `searchOpacityChanged`
- `wallpaperUpload`, `wallpaperReset`, `wallpaperBlurChanged`, `wallpaperOverlayOpacityChanged`
- `defaultEngineChanged`, `enginesUpdated`
- `themeChanged`

### Storage Synchronization

Changes in other tabs sync automatically via `storageManager.onChanged()`:
```javascript
storageManager.onChanged((newSettings, oldSettings) => {
  this.handleStorageChange(newSettings, oldSettings)
})
```

### Key Modules

| Module | Responsibility |
|--------|----------------|
| `storage.js` | Singleton wrapper for `chrome.storage.local`; Promise-based API; merges stored data with defaults |
| `search.js` | Search input, engine switching (Tab key), query execution with `%s` URL placeholder |
| `theme.js` | Applies `data-theme` attribute to `<html>`; `prefers-color-scheme: dark` detection |
| `wallpaper.js` | Base64 image upload (max 5MB), blur filter, overlay opacity |
| `settings.js` | Settings drawer UI, debounced slider inputs, emits events on changes |
| `clock.js` | Simple interval-based clock (1000ms updates) |

### Storage Schema

```javascript
{
  general: { searchWidth: 40, searchHeight: 6, searchRadius: 30, searchOpacity: 0.8, openIn: 'new-tab', tabSwitch: true },
  wallpaper: { imageUrl: 'assets/images/default.png', blur: 0, overlayOpacity: 0.3 },
  engines: { default: 'google', list: [{ id, name, url: '...?q=%s', icon }] },
  theme: { mode: 'system' }  // 'system' | 'light' | 'dark'
}
```

### Module Lifecycle Pattern

```javascript
class SomeModule {
  constructor() {
    // Cache DOM references
    this.element = document.getElementById('...')
    this.init()
  }

  async init() {
    await this.loadSettings()
    this.bindEvents()
  }

  destroy() {
    clearInterval(this.timer)
    // Remove event listeners
  }
}
```

## CSS Architecture

**Loading Order (newtab.html):**
1. `main.css` - Reset and base layout
2. `theme.css` - CSS custom properties (light/dark)
3. `components.css` - Search box, clock, buttons
4. `wallpaper.css` - Background layers
5. `settings.css` - Drawer and modal

**Theme System:**
- Set `data-theme="light|dark"` on `<html>` to switch themes
- Variables in `theme.css` include colors, shadows, backdrop filters

**Search Height Auto-Scaling:**
When search height changes, icon size (40%), margin (30%), and font size (32%) scale proportionally.

## Important Patterns

### Adding a Settings Control

1. Add HTML in `newtab.html` settings drawer
2. Bind event in `scripts/settings.js` with debounce for sliders
3. Call `this.emit('eventName', value)` to dispatch CustomEvent
4. Add listener in `scripts/main.js.bindModuleEvents()` to handle it
5. Update `scripts/storage.js` defaults if needed

### Adding a New Search Engine

User adds via settings modal → `settings.js` validates `%s` placeholder → updates storage → dispatches `enginesUpdated` → `search.js` updates via event listener.

## File Naming

- Module files: lowercase single word (`search.js`, `theme.js`)
- CSS files: lowercase descriptive (`components.css`)
- Documentation: kebab-case (`responsive-design.md`)

## Known Limitations

- Wallpaper stored as Base64 in storage (5MB limit)
- Background service worker has no persistent state
- Tab key engine switching only works when search input is focused
