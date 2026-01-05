# How to Run the Desktop UI

## Quick Start Guide

### Step 1: Install Dependencies (if not already installed)
```bash
npm install
```

This installs Electron and all required dependencies.

### Step 2: Run the Desktop UI

You have two options:

#### Option A: Desktop Application (Recommended)
```bash
npm run ui
```

This opens the UI as a native desktop application using Electron.

#### Option B: Browser Preview (Quick Testing)
```bash
npm run ui:test
```

Then open your browser to: **http://localhost:3000**

### Step 3: Test Start Scanning

1. **Open the UI** (either desktop app or browser)
2. **Go to Recent Trades tab** (should be open by default)
3. **Click "Start Scanning"** button (green button to the left of Refresh)
4. **Check the Scanning tab** - You should see:
   - Real-time logs from the watcher
   - Messages like `[poll] fetched 200 trades at 10:30:45 AM`
   - Status indicator showing "🟢 Scanning is active"

### Troubleshooting

#### If Start Scanning doesn't work:

1. **Check the console/terminal** where you ran `npm run ui` for errors
2. **Verify environment variables** are set (you need `.env` file with `DISCORD_WEBHOOK_URL`)
3. **Check if port 3000 is available** - the server runs on port 3000
4. **Try browser version first**: `npm run ui:test` to see if there are any errors

#### Common Issues:

- **"Watcher process error"**: Make sure `tsx` is installed (`npm install`)
- **"Failed to start watcher"**: Check that `src/index.ts` exists and is valid
- **No logs appearing**: Switch to Scanning tab and wait a few seconds

### Development Mode

For debugging with DevTools:
```bash
npm run ui:dev
```

This opens the desktop app with developer tools enabled.

## What Happens When You Click Start Scanning

1. The UI calls `/api/watcher/start` endpoint
2. Server spawns `npx tsx src/index.ts` process
3. All console output (stdout/stderr) is captured
4. Logs appear in real-time in the Scanning tab
5. The watcher pulls and filters Polymarket transactions
6. Trades appear in Recent Trades tab as they're processed

## Testing Without Real Watcher

The test server (`npm run ui:test`) shows mock data, but the real desktop UI (`npm run ui`) will start the actual watcher script when you click "Start Scanning".
