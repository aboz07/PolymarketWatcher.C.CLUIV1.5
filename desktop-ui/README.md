# Desktop UI for Polymarket Watcher

This folder contains a standalone desktop application UI built with Electron. It does not modify the base watcher code.

## Features

- Desktop application (no browser required)
- Real-time dashboard showing:
  - Total trades, wallets, markets, and alerts
  - Recent trades with full details
  - Current configuration settings
- Auto-refresh every 5 seconds
- Modern dark-themed UI

## Installation

1. Install dependencies (from project root):
   ```bash
   npm install
   ```

2. The Electron dependency will be installed automatically.

## Usage

### Start the Desktop UI

From the project root, run:
```bash
npm run ui
```

Or for development mode (with DevTools):
```bash
npm run ui:dev
```

### How It Works

1. The desktop UI starts a local HTTP server on port 3000
2. The Electron window loads the UI from `http://localhost:3000`
3. The UI reads data from the `state.json` file that the main watcher creates
4. The UI auto-refreshes to show the latest data

### Running with the Watcher

The desktop UI is completely independent. You can:
- Run the watcher normally: `npm run dev`
- Run the UI separately: `npm run ui`
- Both can run simultaneously - the UI will read the state file that the watcher updates

## File Structure

```
desktop-ui/
├── main.js          # Electron main process
├── server.ts        # HTTP server for the UI (TypeScript)
├── server.js        # Helper file for running server.ts
├── public/          # UI files
│   ├── index.html   # Main HTML
│   ├── app.js       # Frontend JavaScript
│   └── style.css    # Styling
└── README.md        # This file
```

## Removing the UI

If you want to remove the desktop UI completely:
1. Delete the `desktop-ui` folder
2. Remove Electron from `package.json` devDependencies
3. Remove the `ui` and `ui:dev` scripts from `package.json`

The base watcher code remains completely unchanged.
