# Desktop UI Files Structure

All UI-related files are contained in this `desktop-ui` folder for easy deletion.

## File Structure

```
desktop-ui/
├── main.js              # Electron main process (desktop app entry point)
├── server.ts            # HTTP server for UI (TypeScript)
├── server.js            # Helper file for running server.ts
├── logger.ts            # Logging system for Scanning tab
├── watcher-manager.ts   # Watcher process manager (start/stop, capture logs)
├── test-server.js       # Standalone test server (browser preview)
├── README.md            # Documentation
├── FILES.md            # This file - file structure reference
└── public/             # UI frontend files
    ├── index.html      # Main HTML (with tabs and Start Scanning button)
    ├── app.js          # Frontend JavaScript (tabs, logs, watcher control)
    └── style.css       # Styling (including tab styles, button styles)
```

## What Each File Does

### Core Files
- **main.js**: Electron desktop application entry point
- **server.ts**: HTTP server that serves the UI and provides API endpoints
- **logger.ts**: Logging system that captures watcher activity for the Scanning tab
- **watcher-manager.ts**: Manages watcher process (start/stop) and captures real console output

### UI Files (public/)
- **index.html**: Main UI structure with tabs (Recent Trades / Scanning)
- **app.js**: Frontend logic including:
  - Tab switching
  - Trade display
  - Real-time log polling
  - Auto-refresh functionality
- **style.css**: All styling including:
  - Tab button styles
  - Log container styles
  - Color-coded log levels

### Utility Files
- **test-server.js**: Standalone server for browser testing (doesn't require Electron)
- **server.js**: Helper for running TypeScript server

## To Delete Everything

Simply delete the entire `desktop-ui` folder:
```bash
rm -rf desktop-ui
# or on Windows:
rmdir /s desktop-ui
```

The base watcher code in `src/` remains completely untouched.

## Recent Changes (Tabs Feature)

All tab-related changes are in:
- `desktop-ui/public/index.html` - Tab HTML structure
- `desktop-ui/public/app.js` - Tab switching and log functionality
- `desktop-ui/public/style.css` - Tab styling
- `desktop-ui/logger.ts` - Log capture system
- `desktop-ui/server.ts` - Log API endpoint
