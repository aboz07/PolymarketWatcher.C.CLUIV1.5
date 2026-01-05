# Windows Setup Guide

## You're on Windows! Here's what to do:

### Issue 1: Git Not Recognized

You're getting this error:
```
'git' is not recognized as the name of a cmdlet, function, script file, or operable program
```

**Solution:** Install Git for Windows

1. **Download Git:**
   - Go to: https://git-scm.com/download/win
   - Download and run the installer
   - Use default settings (just keep clicking Next)

2. **After installation, restart PowerShell**

3. **Verify it works:**
   ```powershell
   git --version
   ```

### Issue 2: Bash Scripts Don't Work on Windows

The npm scripts were trying to run bash commands, which don't work on Windows PowerShell.

**Solution:** I've fixed this! The scripts now use Node.js (cross-platform).

---

## Quick Fix for Your 404 Error (Windows)

### Step 1: Install Dependencies (if you haven't)

```powershell
npm install
```

### Step 2: Free Up Port 3000

```powershell
npm run kill-port
```

**This now uses a cross-platform Node.js script that works on Windows!**

What happens:
- Finds what's using port 3000
- Shows you the process
- Asks if you want to kill it
- Type `y` and press Enter

### Step 3: Start the UI

```powershell
npm run ui
```

### Step 4: Click "Start Scanning"

It should work now! ✅

---

## Manual Method (Windows)

If `npm run kill-port` doesn't work:

### Find what's using port 3000:
```powershell
netstat -ano | findstr :3000
```

**Output example:**
```
TCP    0.0.0.0:3000    0.0.0.0:0    LISTENING    12345
```

The last number (12345) is the PID.

### Kill the process:
```powershell
taskkill /PID 12345 /F
```

Replace `12345` with the actual PID from the previous command.

### Verify port is free:
```powershell
netstat -ano | findstr :3000
```

Should return nothing (no output).

---

## Common Windows Issues

### Issue: "Permission Denied" when killing process

**Solution:** Run PowerShell as Administrator

1. Right-click PowerShell icon
2. Select "Run as Administrator"
3. Navigate back to your project folder
4. Try again: `npm run kill-port`

### Issue: npm commands not working

Make sure Node.js is installed:
```powershell
node --version
npm --version
```

If not installed:
1. Go to: https://nodejs.org/
2. Download LTS version
3. Install with default settings
4. Restart PowerShell

### Issue: Electron won't start

Make sure all dependencies are installed:
```powershell
npm install
```

Then try again:
```powershell
npm run ui
```

---

## All npm Commands (Now Windows-Compatible!)

| Command | What It Does |
|---------|--------------|
| `npm install` | Install all dependencies |
| `npm run kill-port` | Free up port 3000 ✅ **NOW WORKS ON WINDOWS** |
| `npm run diagnose` | Test server setup ✅ **Windows compatible** |
| `npm run validate` | Check configuration ✅ **Windows compatible** |
| `npm run ui` | Start the desktop UI |
| `npm run dev` | Run watcher in terminal |
| `npm run test:webhook` | Test Discord webhook |

---

## Full Setup from Scratch (Windows)

### 1. Install Prerequisites

**Node.js:**
- Download: https://nodejs.org/
- Install LTS version
- Restart PowerShell

**Git (optional, for updates):**
- Download: https://git-scm.com/download/win
- Install with defaults
- Restart PowerShell

### 2. Install Project Dependencies

```powershell
npm install
```

### 3. Create .env File

```powershell
# Copy the example file
copy .env.example .env

# Edit it with Notepad
notepad .env
```

Add your Discord webhook URL:
```
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_TOKEN
```

Save and close Notepad.

### 4. Free Up Port 3000

```powershell
npm run kill-port
```

Type `y` when asked to kill the process.

### 5. Start the UI

```powershell
npm run ui
```

### 6. Use the App

1. Click "Start Scanning" button
2. Switch to "Scanning" tab to see logs
3. Check "Recent Trades" tab for matching trades

---

## Troubleshooting

### Test if Everything Works

```powershell
npm run diagnose
```

**Expected output:**
```
✅ tsx is installed
✅ Port 3000 is available
✅ Server started successfully!
✅ All endpoints responding
```

### If diagnose shows errors:

**Error: "tsx not installed"**
```powershell
npm install
```

**Error: "Port 3000 already in use"**
```powershell
npm run kill-port
```

**Error: ".env file not found"**
```powershell
copy .env.example .env
notepad .env
```

---

## Quick Reference Card (Windows)

**Port 3000 in use?**
```powershell
npm run kill-port
```

**Check setup:**
```powershell
npm run validate
```

**Test server:**
```powershell
npm run diagnose
```

**Start app:**
```powershell
npm run ui
```

**All good!** ✅

---

## Need Help?

1. **Run diagnostics:**
   ```powershell
   npm run diagnose
   ```

2. **Check what it says** - it will tell you exactly what's wrong

3. **Follow the suggestions** - they're specific to your issue

4. **Still stuck?**
   - Check this guide
   - Read: QUICK_FIX_404.md
   - Read: FIX_PORT_IN_USE.md

---

## What I Fixed for Windows

✅ `npm run kill-port` - Now uses Node.js (cross-platform)
✅ `npm run diagnose` - Already cross-platform
✅ `npm run validate` - Already cross-platform
✅ `npm run setup` - Now uses Node.js
✅ `npm run ui:dev` - Fixed for Windows (`SET` instead of export)

**All commands now work on Windows!** 🎉
