# Fix: Port 3000 Already in Use

## The Problem

You ran `npm run diagnose` and got:
```
❌ Port 3000 is already in use
```

Then you tried `npm run ui` and clicked "Start Scanning" but got:
```
Failed to start watcher: HTTP 404: Not Found
```

## Why This Happens

**Port 3000 is being used by another process!**

When you run `npm run ui`:
1. ✅ Electron starts
2. ❌ UI server tries to start on port 3000 but **CAN'T** (port taken)
3. 🤔 Electron still tries to connect to http://localhost:3000
4. ⚠️ It connects to the **WRONG SERVER** (whatever else is on port 3000)
5. ❌ That server doesn't have `/api/watcher/start` endpoint
6. 💥 Returns **404 Not Found**

**The fix:** Free up port 3000 so the Polymarket Watcher server can use it!

---

## 🚀 Quick Fix (Automated)

### One Command:
```bash
npm run kill-port
```

**What it does:**
1. Finds what's using port 3000
2. Shows you the process details
3. Asks if you want to kill it
4. Kills it for you

**Example:**
```
🔍 Checking port 3000...

⚠️  Port 3000 is in use by process: 12345

Process details:
node    12345  user   ...  *:3000  (LISTEN)

Kill this process? (y/N): y
✅ Port 3000 is now available

You can now run:
  npm run ui
```

Then:
```bash
npm run ui
```

Click "Start Scanning" → **Should work!** ✅

---

## 🔧 Manual Fix

### Step 1: Find What's Using Port 3000

**macOS/Linux:**
```bash
lsof -i :3000
```

**Output:**
```
COMMAND   PID  USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
node      12345 user   21u  IPv6 0x...      0t0  TCP *:3000 (LISTEN)
```

The **PID** is the process ID (12345 in this example).

**Windows:**
```bash
netstat -ano | findstr :3000
```

**Output:**
```
TCP    0.0.0.0:3000    0.0.0.0:0    LISTENING    12345
```

The **PID** is the last number (12345).

### Step 2: Kill the Process

**macOS/Linux:**
```bash
kill -9 12345
```

**Windows:**
```bash
taskkill /PID 12345 /F
```

### Step 3: Verify Port is Free

**macOS/Linux:**
```bash
lsof -i :3000
```

Should return nothing (no output).

**Windows:**
```bash
netstat -ano | findstr :3000
```

Should return nothing (no output).

### Step 4: Try Again

```bash
npm run ui
```

Click "Start Scanning" → **Should work!** ✅

---

## 🔍 Common Causes

### 1. Previous Polymarket Watcher Still Running

You ran `npm run ui` before and it's still running.

**Fix:**
```bash
# Find it
ps aux | grep "tsx.*server.ts"

# Kill it
kill -9 <PID>

# Or use the automated tool
npm run kill-port
```

### 2. Another Development Server on Port 3000

Common culprits:
- React dev server (`npm start`)
- Next.js dev server (`next dev`)
- Express server
- Another Electron app

**Fix:** Stop that other server, or change its port.

### 3. Zombie Process

A server crashed but didn't release the port.

**Fix:**
```bash
npm run kill-port
```

This will force-kill it.

### 4. Docker Container

A Docker container is using port 3000.

**Check:**
```bash
docker ps
```

**Stop it:**
```bash
docker stop <container-id>
```

---

## 🧪 Verify the Fix

### Test 1: Check Port is Free
```bash
lsof -i :3000   # macOS/Linux
# Should return nothing
```

### Test 2: Run Diagnostic
```bash
npm run diagnose
```

**Expected:**
```
✅ Port 3000 is available
✅ Server started successfully!
✅ All checks passed!
```

### Test 3: Start UI
```bash
npm run ui
```

**Check terminal output:**
```
🚀 Starting UI server...
🚀 Starting Polymarket Watcher UI Server...
✅ Desktop UI server running on port 3000
```

If you see that, the server is running!

### Test 4: Test Start Scanning
1. Click "Start Scanning"
2. Switch to "Scanning" tab
3. Logs should appear ✅

---

## 💡 Prevent This Issue

### Option 1: Always Kill Port Before Starting

Create an alias or script:
```bash
# In your shell rc file (.bashrc, .zshrc, etc.)
alias pmw='npm run kill-port && npm run ui'
```

Then just run:
```bash
pmw
```

### Option 2: Check Before Running

```bash
# Quick check
lsof -i :3000 || npm run ui
```

This only runs the UI if port 3000 is free.

### Option 3: Use Different Port (Advanced)

Edit `desktop-ui/server.ts` and `desktop-ui/main.js` to use a different port (e.g., 3001).

**Not recommended** - just kill the process on 3000 instead!

---

## 🆘 Still Not Working?

### Check if you have permission to kill the process

If you get "Operation not permitted":

**macOS/Linux:**
```bash
sudo kill -9 <PID>
```

**Windows:**
Run Command Prompt as Administrator, then:
```bash
taskkill /PID <PID> /F
```

### Check if process keeps coming back

If the process restarts immediately after you kill it:

1. Check if it's a system service
2. Check if it's in your startup scripts
3. Check if it's a Docker container with restart policy

**Find what's starting it:**
```bash
# macOS/Linux
ps aux | grep <PID>

# Check parent process
pstree -p <PID>
```

### Try a different diagnostic

```bash
# See ALL processes on port 3000
lsof -i :3000 -n -P

# Forcefully kill ALL processes on port 3000 (use with caution!)
lsof -ti :3000 | xargs kill -9
```

---

## 📋 Troubleshooting Checklist

Before asking for help:

- [ ] Ran `npm run kill-port` and killed the process
- [ ] Verified port is free: `lsof -i :3000` returns nothing
- [ ] Ran `npm run diagnose` - shows port is available
- [ ] Ran `npm run ui` - see "Server running on port 3000" in terminal
- [ ] No firewall/antivirus blocking port 3000
- [ ] Not running in a restricted network environment

---

## 🎯 Quick Reference

| Problem | Command |
|---------|---------|
| Find what's using port 3000 | `lsof -i :3000` (Mac/Linux)<br>`netstat -ano \| findstr :3000` (Windows) |
| Kill process automatically | `npm run kill-port` |
| Kill process manually | `kill -9 <PID>` (Mac/Linux)<br>`taskkill /PID <PID> /F` (Windows) |
| Verify port is free | `lsof -i :3000` (should return nothing) |
| Test server | `npm run diagnose` |
| Run UI | `npm run ui` |

---

## 📊 Summary

**Root Cause:**
- Port 3000 is being used by another process
- Polymarket Watcher server can't start
- UI connects to wrong server on port 3000
- Wrong server returns 404

**The Fix:**
```bash
npm run kill-port    # Kill whatever's using port 3000
npm run diagnose     # Verify port is free
npm run ui           # Start the UI
```

**Success indicators:**
- ✅ `npm run diagnose` shows "Port 3000 is available"
- ✅ `npm run ui` shows "Server running on port 3000"
- ✅ "Start Scanning" button works
- ✅ Logs appear in "Scanning" tab

**If this doesn't fix it**, you have a different issue. Run:
```bash
npm run validate
```

And check the other troubleshooting guides.
