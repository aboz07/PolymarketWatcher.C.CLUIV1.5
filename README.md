# 🍃 Polymarket Watcher

A real-time monitoring tool for detecting interesting trading patterns on Polymarket prediction markets.

## 🚀 Quick Start (Automated Setup)

### Option 1: One-Command Setup (Recommended)

**Linux/macOS:**
```bash
./setup.sh
```

**Windows:**
```bash
setup.bat
```

This will automatically:
- ✅ Install all dependencies (tsx, electron, etc.)
- ✅ Create `.env` file from template
- ✅ Prompt you for Discord webhook URL
- ✅ Verify project structure
- ✅ Test your configuration

### Option 2: Manual Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   nano .env  # Add your Discord webhook URL
   ```

3. **Validate setup:**
   ```bash
   npm run validate
   ```

4. **Start the application:**
   ```bash
   npm run ui
   ```

## 🎯 Using the Start Scanning Function

### Desktop UI Mode (Recommended)

1. **Start the UI:**
   ```bash
   npm run ui
   ```

2. **In the Electron window:**
   - Click the **"Start Scanning"** button
   - Switch to the **"Scanning"** tab to see live logs
   - View matching trades in the **"Recent Trades"** tab

3. **Tabs explained:**
   - **Recent Trades**: Shows the last 10 trades matching your criteria
   - **Scanning**: Live logs from the watcher process (filtering activity)

### Terminal Mode (No UI)

```bash
npm run dev
```

This runs the scanner directly in your terminal with no graphical interface.

## ✅ Verify Your Setup

Run the validation script to check if everything is configured correctly:

```bash
npm run validate
```

This will check:
- ✅ Node.js version (requires v18+)
- ✅ All required files exist
- ✅ Dependencies are installed (tsx, electron, etc.)
- ✅ Environment variables are configured
- ✅ Code fixes are applied
- ✅ Port 3000 is available

## 🔧 Configuration

### Required Environment Variables

Edit `.env` and set:

```env
# Required: Your Discord webhook URL for receiving alerts
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_TOKEN
```

**How to get a Discord webhook:**
1. Open Discord server settings
2. Go to Integrations → Webhooks
3. Click "New Webhook"
4. Copy the webhook URL

### Optional Configuration

All in `.env`:

```env
# Polling interval (milliseconds, default: 12000)
POLL_INTERVAL_MS=12000

# Minimum Gamma market liquidity (USD, default: 25000)
MIN_GAMMA_LIQUIDITY_USD=25000

# Minimum top 5 book depth (USD, default: 8000)
MIN_TOP5_BOOK_DEPTH_USD=8000

# Exclude categories (comma-separated, default: sports,crypto)
EXCLUDE_CATEGORIES=sports,crypto
```

Advanced configuration can be modified in `src/config.ts`.

## 🧪 Testing

### Test Discord Webhook

```bash
npm run test:webhook
```

This sends a test alert to verify your webhook is working.

### Test UI Server Only

```bash
npm run ui:test
```

Starts the web server without Electron (for debugging).

### Development Mode (with DevTools)

```bash
npm run ui:dev
```

Launches UI with Chrome DevTools open for debugging.

## 📊 What It Monitors

The watcher scans Polymarket for trades matching specific criteria:

### Criterion A: Low-Volume Market Pressure
Detects coordinated buying in low-volume markets:
- Multiple unique wallets buying within 30 minutes
- Market YES probability under 20%
- Minimum 5 unique wallets

### Criterion B: Fresh/Low-Activity Big Capital
Detects large trades from new or inactive wallets:
- Wallet less than 30 days old OR
- Fewer than 30 trades in last 30 days
- Single trade ≥ $2,500
- Focused activity (≤3 markets in 24h)

### Base Filters
- Minimum trade size: **$1,500**
- Excludes: **Sports, Crypto** categories
- Minimum market liquidity: **$25,000**
- Minimum order book depth: **$8,000**

## 🐛 Troubleshooting

### Start Scanning Button Not Working

**Run the validator first:**
```bash
npm run validate
```

**Common Issues:**

1. **Dependencies not installed:**
   ```bash
   npm install
   ```

2. **Missing .env file:**
   ```bash
   cp .env.example .env
   # Edit .env and add your Discord webhook URL
   ```

3. **tsx not found:**
   ```bash
   npm install tsx
   ```

4. **Port 3000 already in use:**
   ```bash
   # Find and kill the process using port 3000
   lsof -i :3000  # macOS/Linux
   netstat -ano | findstr :3000  # Windows
   ```

5. **Watcher exits immediately:**
   - Check the "Scanning" tab for error messages
   - Verify `DISCORD_WEBHOOK_URL` is set in `.env`
   - Check your internet connection

### No Trades Appearing

This is **normal**! The criteria are strict to avoid false positives.

You may need to wait several hours to see matching trades. To verify it's working:
1. Check the "Scanning" tab for polling activity
2. Look for logs like: `[poll] fetched 200 trades at ...`
3. Run `npm run test:webhook` to verify Discord alerts work

### Getting More Help

See the detailed troubleshooting guide: **[SETUP.md](SETUP.md)**

## 📁 Project Structure

```
.
├── src/                      # Core scanning logic
│   ├── index.ts              # Main watcher script (npm run dev)
│   ├── config.ts             # Configuration loader
│   ├── polymarket.ts         # Polymarket API client
│   ├── rules.ts              # Criteria evaluation logic
│   ├── discord.ts            # Discord webhook sender
│   └── ...
├── desktop-ui/               # Electron desktop app
│   ├── main.js               # Electron entry point
│   ├── server.ts             # Web server (localhost:3000)
│   ├── watcher-manager.ts    # Process manager for src/index.ts
│   ├── logger.ts             # Log capture system
│   └── public/               # UI assets (HTML/CSS/JS)
├── .env                      # Environment configuration (create from .env.example)
├── state.json                # Persistent state (auto-generated)
├── setup.sh                  # Automated setup (Linux/macOS)
├── setup.bat                 # Automated setup (Windows)
├── validate-setup.js         # Setup validation tool
├── SETUP.md                  # Detailed setup guide
└── FIX_SUMMARY.md            # Technical fix documentation
```

## 🔄 How It Works

```
┌─────────────────────────────────────────────────────┐
│ 1. Electron App (main.js)                          │
│    └─ Spawns Web Server                            │
└─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│ 2. Web Server (server.ts) on localhost:3000        │
│    └─ Serves UI + API Endpoints                    │
└─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│ 3. User clicks "Start Scanning" in Browser         │
│    └─ Calls POST /api/watcher/start                │
└─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│ 4. Watcher Manager (watcher-manager.ts)            │
│    └─ Spawns: npx tsx src/index.ts                 │
└─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│ 5. Watcher Process (src/index.ts)                  │
│    ├─ Polls Polymarket Data API every 12s          │
│    ├─ Filters trades by criteria A/B               │
│    ├─ Enriches with market data                    │
│    └─ Sends Discord alerts                         │
└─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│ 6. Logs Captured and Displayed in UI               │
│    └─ "Scanning" tab shows live activity           │
└─────────────────────────────────────────────────────┘
```

## 🛠️ Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Run watcher in terminal (no UI) |
| `npm run ui` | Launch desktop UI |
| `npm run ui:dev` | Launch UI with DevTools |
| `npm run test:webhook` | Send test Discord message |
| `npm run validate` | Validate setup configuration |
| `npm run setup` | Run automated setup script |

### Making Changes

The watcher logic is in `src/`:
- Modify criteria thresholds in `src/config.ts`
- Adjust filtering logic in `src/rules.ts`
- Change Discord message format in `src/discord.ts`

The UI is in `desktop-ui/public/`:
- Edit styles in `style.css`
- Modify UI behavior in `app.js`
- Update layout in `index.html`

After changes, just restart the app - no build step required (TypeScript runs via `tsx`).

## 📝 License

Private project.

## 🙏 Credits

Built for monitoring Polymarket prediction markets.

---

**Need help?** See [SETUP.md](SETUP.md) for detailed troubleshooting.
