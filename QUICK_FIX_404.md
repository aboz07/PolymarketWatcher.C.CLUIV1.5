# Quick Fix: "404 Not Found" Error

## The Problem

Getting this error when clicking "Start Scanning":
```
Failed to start watcher: HTTP 404: Not Found. Make sure the UI server is running
```

## The Root Cause

**The server wasn't starting!**

The `desktop-ui/server.ts` file defined the server but never called the function to start it.

## The Fix (3 Steps)

### 1. Get Latest Code
```bash
git pull
```

### 2. Test It
```bash
npm run diagnose
```

**Expected output:**
```
✅ tsx is installed
✅ Port 3000 is available
✅ Server started successfully!
✅ All endpoints responding
```

### 3. Run It
```bash
npm run ui
```

Click "Start Scanning" → **Should work!** ✅

---

## If It Still Doesn't Work

### Run validation:
```bash
npm run validate
```

Look for this line:
```
✅ Server startup code is present (CRITICAL FIX)
```

If you see:
```
❌ Server startup code is MISSING - server will not start!
```

### Manual fix:

Add this to the **bottom** of `desktop-ui/server.ts`:

```typescript
// Start the server when this file is run directly
if (require.main === module) {
  console.log("🚀 Starting Polymarket Watcher UI Server...");
  startWebServer(3000);
}
```

Then run:
```bash
npm run validate
npm run diagnose
npm run ui
```

---

## Other Common Issues

### Issue: "tsx not installed"
```bash
npm install
```

### Issue: "Port 3000 already in use"
```bash
# macOS/Linux
lsof -i :3000
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Issue: "Missing .env file"
```bash
cp .env.example .env
nano .env  # Add your Discord webhook URL
```

---

## Testing Commands

| Command | What It Does |
|---------|--------------|
| `npm run diagnose` | **Full server diagnostic** - tests everything |
| `npm run validate` | Validates your setup is correct |
| `npm run ui:test` | Tests server without Electron |
| `npx tsx desktop-ui/server.ts` | Manually start server |

---

## How to Know It's Fixed

When you run `npm run ui`, you should see in the terminal:

```
🚀 Starting UI server...
   Server script: /path/to/desktop-ui/server.ts
   Working directory: /path/to/project
🚀 Starting Polymarket Watcher UI Server...
✅ Desktop UI server running on port 3000
🌐 Connecting to http://localhost:3000...
```

Then in the UI:
- Click "Start Scanning"
- Switch to "Scanning" tab
- See logs appear → **It's working!** ✅

---

## Need More Help?

Read the complete guide: **[TROUBLESHOOTING_404.md](TROUBLESHOOTING_404.md)**

It covers:
- All possible causes
- Step-by-step diagnostic process
- Manual verification steps
- How to collect diagnostic logs
