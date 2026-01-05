# Troubleshooting "404 Not Found" Error

If you're getting **"Failed to start watcher: HTTP 404: Not Found"** when clicking "Start Scanning", this guide will help you fix it.

## What This Error Means

The error means the UI (frontend) can't reach the API server (backend). This happens when:
1. ❌ The server isn't running
2. ❌ The server is running on the wrong port
3. ❌ The server started but crashed
4. ❌ There's a critical bug in the server code

---

## 🔍 Quick Diagnosis

### Run the diagnostic tool:
```bash
npm run diagnose
```

This will:
- ✅ Check if tsx is installed
- ✅ Test if port 3000 is available
- ✅ Start a test server
- ✅ Test all API endpoints
- ✅ Show you exactly what's wrong

**Example output:**
```
🔍 Server Diagnostic Tool

━━━ Checking Dependencies ━━━
✅ tsx is installed

━━━ Checking Port Availability ━━━
✅ Port 3000 is available

━━━ Starting Test Server ━━━
ℹ️  Starting server on http://localhost:3000...
✅ Desktop UI server running on port 3000
✅ Server started successfully!

━━━ Testing Server Endpoints ━━━
✅ Home page (/): 200
✅ Config API (/api/config): 200
✅ State API (/api/state): 200
✅ Stats API (/api/stats): 200
✅ Watcher Status API (/api/watcher/status): 200

━━━ Results ━━━
ℹ️  5/5 endpoints responding
✅ All checks passed! Server is working correctly.
```

---

## 🛠️ Common Causes & Fixes

### Issue 1: Server Never Starts (MOST COMMON)

**Symptom:** UI loads but shows "404 Not Found" immediately

**Cause:** Critical bug - server.ts doesn't call `startWebServer()`

**Fix:** This has been fixed in the latest code. Update your files:

```bash
git pull
npm run validate
```

The validation tool will check:
```
✅ Server startup code is present (CRITICAL FIX)
```

If it says:
```
❌ Server startup code is MISSING - server will not start!
```

Then manually add this to the bottom of `desktop-ui/server.ts`:

```typescript
// Start the server when this file is run directly
if (require.main === module) {
  console.log("🚀 Starting Polymarket Watcher UI Server...");
  startWebServer(3000);
}
```

---

### Issue 2: tsx Not Installed

**Symptom:** Console shows "tsx: command not found" or similar

**Fix:**
```bash
npm install
npm run validate
```

Check for:
```
✅ tsx is installed
✅ tsx binary is available
```

---

### Issue 3: Port 3000 Already in Use

**Symptom:** Console shows "EADDRINUSE" error

**Diagnosis:**
```bash
# macOS/Linux
lsof -i :3000

# Windows
netstat -ano | findstr :3000
```

**Fix:**
```bash
# macOS/Linux
kill -9 <PID>

# Windows
taskkill /PID <PID> /F
```

---

### Issue 4: Server Crashes Immediately

**Symptom:** Server starts but exits right away

**Common causes:**
- Missing `.env` file
- Invalid configuration
- Missing dependencies

**Fix:**
```bash
# Check validation
npm run validate

# Recreate environment file
cp .env.example .env
nano .env  # Add your Discord webhook

# Reinstall dependencies
npm install
```

---

### Issue 5: Wrong Working Directory

**Symptom:** Server starts but can't find files

**Diagnosis:** Check terminal output when running `npm run ui`:
```
🚀 Starting UI server...
   Server script: /path/to/desktop-ui/server.ts
   Working directory: /path/to/project
```

**Fix:** Make sure you're running from the project root:
```bash
cd /path/to/PolymarketWatcher.C.CLUIV1.5
npm run ui
```

---

## 🧪 Testing Steps

### Step 1: Validate Setup
```bash
npm run validate
```

All checks should pass. Fix any errors shown.

### Step 2: Test Server Standalone
```bash
npm run ui:test
```

This starts just the server (no Electron). You should see:
```
✅ Desktop UI server running on port 3000
```

Then test in browser: http://localhost:3000

If this works, the server is fine. The issue is with Electron.

### Step 3: Run Full Diagnostic
```bash
npm run diagnose
```

This performs comprehensive tests and shows exactly what's wrong.

### Step 4: Check Logs
Run with development mode to see all logs:
```bash
npm run ui:dev
```

This opens Chrome DevTools. Check:
- **Console tab** for JavaScript errors
- **Network tab** for failed requests
- **Terminal** for server logs

---

## 📋 Checklist

Before asking for help, verify:

- [ ] Ran `npm install` successfully
- [ ] Created `.env` file from `.env.example`
- [ ] `npm run validate` shows all ✅
- [ ] Port 3000 is not in use
- [ ] Running from project root directory
- [ ] tsx is installed (`which npx tsx` works)
- [ ] server.ts has startup code at the bottom
- [ ] No errors in terminal when running `npm run ui`

---

## 🔧 Manual Verification

### Check server.ts has startup code:

```bash
tail -10 desktop-ui/server.ts
```

Should show:
```typescript
// Start the server when this file is run directly
if (require.main === module) {
  console.log("🚀 Starting Polymarket Watcher UI Server...");
  startWebServer(3000);
}
```

If not, add it!

### Test server manually:

```bash
npx tsx desktop-ui/server.ts
```

Should output:
```
🚀 Starting Polymarket Watcher UI Server...
✅ Desktop UI server running on port 3000
```

Then test: http://localhost:3000

---

## 🆘 Still Not Working?

### Collect diagnostic information:

```bash
# 1. Run validation
npm run validate > validation.log 2>&1

# 2. Run diagnosis
npm run diagnose > diagnosis.log 2>&1

# 3. Check Node/npm versions
node --version > versions.log
npm --version >> versions.log

# 4. Try manual server start
npx tsx desktop-ui/server.ts > server.log 2>&1 &

# Wait 2 seconds
sleep 2

# Test endpoints
curl http://localhost:3000 >> server.log 2>&1
curl http://localhost:3000/api/config >> server.log 2>&1

# Kill test server
pkill -f "tsx desktop-ui/server.ts"
```

Then review the log files to see exactly what's failing.

---

## 🎯 The Fix That Solved This

**Root Cause:** The `desktop-ui/server.ts` file defined `startWebServer()` but never called it!

When Electron ran `npx tsx server.ts`, it loaded the file but the server never actually started. This caused all API calls to return 404.

**The Fix:** Added entry point code at the bottom of server.ts:

```typescript
if (require.main === module) {
  startWebServer(3000);
}
```

This ensures the server actually starts when the file is run directly.

**How to verify the fix is applied:**

```bash
npm run validate
```

Look for:
```
✅ Server startup code is present (CRITICAL FIX)
```

---

## 📚 Related Issues

- **"Cannot connect to server"** → Same root cause
- **"Connection refused"** → Server not running
- **"ECONNREFUSED localhost:3000"** → Port issue
- **Blank UI with no errors** → Server not responding

All these issues can be diagnosed with:
```bash
npm run diagnose
```

---

## 🚀 Quick Fix Summary

```bash
# 1. Get latest code (if using git)
git pull

# 2. Install dependencies
npm install

# 3. Validate
npm run validate

# 4. If validation fails, run diagnostic
npm run diagnose

# 5. Fix any issues shown

# 6. Try again
npm run ui
```

If `npm run diagnose` shows all ✅, the Start Scanning button should work!
