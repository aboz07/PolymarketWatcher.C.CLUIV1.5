# Polymarket Watcher - Setup Guide

## Prerequisites

1. **Node.js** (v18 or higher)
2. **npm** (comes with Node.js)
3. **Discord Webhook URL** (required for alerts)

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

This will install:
- `tsx` - TypeScript execution engine
- `electron` - Desktop application framework
- `axios`, `dotenv`, `ws` - Runtime dependencies
- `typescript` - TypeScript compiler

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and set your Discord webhook URL:

```env
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN
```

**How to get a Discord Webhook URL:**
1. Go to your Discord server settings
2. Navigate to Integrations → Webhooks
3. Click "New Webhook"
4. Copy the webhook URL

### 3. Verify Configuration

Test that your webhook is working:

```bash
npm run test:webhook
```

You should see a test message in your Discord channel.

## Running the Application

### Option 1: Desktop UI (Recommended)

```bash
npm run ui
```

This will:
1. Start the web server on `http://localhost:3000`
2. Launch the Electron desktop application
3. Load the UI automatically

**Using the UI:**
- Click "Start Scanning" to begin monitoring trades
- Switch to the "Scanning" tab to see live logs
- The "Recent Trades" tab shows trades matching your criteria

### Option 2: Command Line

```bash
npm run dev
```

This runs the watcher script directly in your terminal (no UI).

### Option 3: Development Mode (with DevTools)

```bash
npm run ui:dev
```

Same as Option 1 but opens Chrome DevTools for debugging.

## Troubleshooting

### "Start Scanning" Button Doesn't Work

**Symptoms:**
- Clicking "Start Scanning" does nothing
- No logs appear in the "Scanning" tab
- Error messages in the console

**Common Causes & Fixes:**

#### 1. Dependencies Not Installed
```bash
# Check if node_modules exists
ls node_modules

# If missing or incomplete, reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 2. Missing Environment Variables
```bash
# Check if .env file exists
cat .env

# Should contain:
# DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...

# If missing, create it:
cp .env.example .env
# Then edit .env with your webhook URL
```

#### 3. Wrong Directory
The desktop UI must be run from the project root directory:
```bash
# Make sure you're in the right directory
pwd
# Should show: /path/to/PolymarketWatcher.C.CLUIV1.5

# If not, navigate there:
cd /path/to/PolymarketWatcher.C.CLUIV1.5
```

#### 4. Port Already in Use
If port 3000 is already in use:
```bash
# Find process using port 3000
lsof -i :3000

# Kill it
kill -9 <PID>

# Or change the port in desktop-ui/server.ts
```

#### 5. Check Logs for Errors
Open the browser console in the Electron app:
- On macOS: `Cmd + Option + I`
- On Windows/Linux: `Ctrl + Shift + I`

Look for error messages in red.

### Watcher Stops Immediately After Starting

Check the "Scanning" tab for error messages. Common issues:

1. **Invalid Discord Webhook URL**
   - Error: "Missing env var: DISCORD_WEBHOOK_URL"
   - Fix: Set `DISCORD_WEBHOOK_URL` in `.env`

2. **Network Issues**
   - Error: "ECONNREFUSED" or "ETIMEDOUT"
   - Fix: Check your internet connection

3. **API Rate Limiting**
   - Error: "429 Too Many Requests"
   - Fix: Increase `POLL_INTERVAL_MS` in `.env`

### No Trades Appearing

This is normal! The watcher only alerts on trades matching specific criteria:
- Minimum notional value: $1,500
- Excludes sports and crypto categories
- Requires sufficient market liquidity
- Must meet Criterion A or B conditions

You can:
1. Wait longer (may take hours to see matches)
2. Lower thresholds in `src/config.ts` (advanced)
3. Test with the webhook test: `npm run test:webhook`

## Understanding the UI

### Tabs

**Recent Trades Tab:**
- Shows the last 10 trades that matched your criteria
- Displays market info, wallet, trade details
- Auto-refreshes every 5 seconds

**Scanning Tab:**
- Live logs from the watcher process
- Shows polling activity, market checks, and alerts
- Auto-scrolls to latest logs
- Use "Clear Logs" to reset

### Status Indicators

- 🟢 **Connected** - UI is connected to the server
- 🔴 **Disconnected** - Server connection lost
- 🟢 **Scanning is active** - Watcher is running
- 🔴 **Scanning is stopped** - Watcher is not running

## Configuration Options

All configuration is in `src/config.ts`:

### Market Filters
- **minNominalUsd**: Minimum trade size (default: $1,500)
- **excludeCategories**: Market categories to ignore (default: sports, crypto)
- **minGammaLiquidityUsd**: Minimum market liquidity (default: $25,000)
- **minTop5DepthUsd**: Minimum order book depth (default: $8,000)

### Criterion A (Low-Volume Market Pressure)
Detects coordinated buying in low-volume markets:
- **impliedYesProbMax**: Max YES probability (default: 0.20 = 20%)
- **burstWindowMin**: Time window for burst detection (default: 30 min)
- **burstMinUMTWallets**: Min unique wallets for burst (default: 5)

### Criterion B (Fresh/Low-Activity Big Capital)
Detects large trades from new or inactive wallets:
- **freshWalletDaysMax**: Max wallet age (default: 30 days)
- **lowActivityTrades30dMax**: Max trades in 30 days (default: 30)
- **singleTradeMinNotionalUsd**: Min trade size (default: $2,500)
- **tiersUsd**: Alert tiers (default: [2500, 5000, 7500, 10000])

## Technical Architecture

```
┌─────────────────┐
│  Electron App   │
│   (main.js)     │
└────────┬────────┘
         │ Spawns
         ▼
┌─────────────────┐
│   Web Server    │
│  (server.ts)    │  Serves UI + API
└────────┬────────┘
         │ Manages
         ▼
┌─────────────────┐
│ Watcher Process │
│  (index.ts)     │  Scans Polymarket
└─────────────────┘
         │
         ▼
    Discord Alerts
```

1. **Electron** launches the web server
2. **Web Server** provides UI and API endpoints
3. **Start Scanning** spawns the watcher process
4. **Watcher Process** monitors Polymarket and sends Discord alerts
5. **Logs** are captured and displayed in the UI

## Development

### Project Structure
```
.
├── src/              # Core watcher logic
│   ├── index.ts      # Main scanning script
│   ├── config.ts     # Configuration
│   ├── polymarket.ts # API interactions
│   ├── rules.ts      # Criteria evaluation
│   └── ...
├── desktop-ui/       # Desktop application
│   ├── main.js       # Electron entry point
│   ├── server.ts     # Web server
│   ├── watcher-manager.ts # Process manager
│   └── public/       # UI assets
└── state.json        # Persistent state
```

### Running Tests
```bash
# Test Discord webhook
npm run test:webhook

# Test UI server only (without Electron)
npm run ui:test
```

## Support

If you encounter issues:
1. Check this guide's troubleshooting section
2. Review logs in the "Scanning" tab
3. Check browser console for errors (DevTools)
4. Ensure all dependencies are installed: `npm install`
5. Verify your `.env` file has the correct webhook URL
