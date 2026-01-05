# 🤖 Automation Guide - Start Scanning Function Fixes

This guide explains all the **automated tools** created to fix the Start Scanning function and make setup effortless.

## 🚀 Quick Start (One Command)

### Linux/macOS
```bash
./setup.sh
```

### Windows
```bash
setup.bat
```

That's it! The script will:
1. ✅ Check Node.js version
2. ✅ Install all dependencies (tsx, electron, etc.)
3. ✅ Create `.env` from template
4. ✅ Prompt for your Discord webhook URL
5. ✅ Verify project structure
6. ✅ Test your configuration
7. ✅ Provide next steps

---

## 📋 Validation Tool

Before or after setup, validate your configuration:

```bash
npm run validate
# or
node validate-setup.js
```

### What It Checks

**✅ System Requirements:**
- Node.js version (requires v18+)
- Port 3000 availability

**✅ Project Structure:**
- All required files exist
- TypeScript syntax is valid

**✅ Dependencies:**
- `tsx` is installed (critical for Start Scanning)
- `electron` is installed
- `axios`, `ws`, `dotenv`, `typescript` are present
- Binary executables are in place

**✅ Configuration:**
- `.env` file exists
- `DISCORD_WEBHOOK_URL` is set
- Webhook URL is valid format

**✅ Code Fixes:**
- Improved project root detection
- TSX validation code
- Enhanced error messages

### Example Output

```
🍃 Polymarket Watcher - Setup Validation

━━━ Node.js Version ━━━
✅ Node.js version: v22.21.1 ✓

━━━ Project Structure ━━━
✅ package.json exists
✅ src/index.ts exists
✅ desktop-ui/watcher-manager.ts exists
... (all checks)

━━━ Dependencies ━━━
✅ node_modules folder exists
✅ tsx is installed
✅ tsx binary is available

━━━ Environment Configuration ━━━
✅ .env file exists
✅ DISCORD_WEBHOOK_URL is configured

━━━ Summary ━━━
✅ All checks passed! Your setup is ready.

You can now run:
  npm run ui    # Start the desktop UI
  npm run dev   # Run in terminal mode
```

---

## 🛠️ Automated Setup Scripts

### setup.sh (Linux/macOS)

**Features:**
- Color-coded output (green = success, red = error, yellow = warning)
- Interactive prompts for configuration
- Validates each step before proceeding
- Graceful error handling
- Optional webhook testing

**Steps it performs:**
1. Checks if in correct directory
2. Verifies Node.js version (≥18)
3. Runs `npm install`
4. Validates `tsx` installation
5. Creates `.env` from template
6. Prompts for Discord webhook URL
7. Updates `.env` with webhook
8. Verifies project structure
9. Offers to test webhook
10. Provides next steps

**Usage:**
```bash
chmod +x setup.sh  # Make executable (first time only)
./setup.sh
```

### setup.bat (Windows)

Same functionality as `setup.sh` but for Windows:
- Uses Windows-native commands
- Handles Windows path separators
- Uses `notepad` for editing `.env`
- Works with Windows command prompt or PowerShell

**Usage:**
```bash
setup.bat
```

### What if setup fails?

Both scripts provide clear error messages:
- **Missing Node.js**: Link to download page
- **Wrong directory**: Instructions to navigate
- **Failed dependencies**: Continues with warning
- **No webhook**: Reminds to configure later

---

## 📊 Added npm Scripts

All new automation is accessible via npm:

| Command | What It Does |
|---------|--------------|
| `npm run setup` | Runs automated setup (Linux/macOS) |
| `npm run validate` | Validates your configuration |
| `npm run dev` | Runs watcher in terminal |
| `npm run ui` | Launches desktop UI |
| `npm run test:webhook` | Tests Discord webhook |

---

## 🔍 How the Fixes Work

### Before (Broken)

```
User clicks "Start Scanning"
  ↓
watcher-manager.ts tries to find project root
  ❌ Uses unreliable logic
  ❌ May pick wrong directory
  ↓
Spawns: npx tsx src/index.ts
  ❌ tsx not found (not validated)
  ❌ Script path incorrect
  ↓
Silent failure or cryptic error
  ❌ No clear feedback to user
```

### After (Fixed)

```
User clicks "Start Scanning"
  ↓
watcher-manager.ts validates setup:
  ✅ Checks 4 different methods to find project root
  ✅ Verifies src/index.ts exists
  ✅ Confirms tsx is installed
  ✅ Logs each step for debugging
  ↓
If validation fails:
  ❌ "tsx not found. Run 'npm install'"
  ❌ "Script not found at: /path/to/src/index.ts"
  (Clear, actionable error messages)
  ↓
If validation passes:
  ✅ Spawns: npx tsx src/index.ts
  ✅ Captures stdout/stderr
  ✅ Displays logs in "Scanning" tab
  ✅ Shows status updates
  ↓
Success! Watcher is running
```

---

## 📁 New Files Created

### Core Automation

| File | Purpose | Usage |
|------|---------|-------|
| `setup.sh` | Automated setup (Linux/macOS) | `./setup.sh` |
| `setup.bat` | Automated setup (Windows) | `setup.bat` |
| `validate-setup.js` | Configuration validator | `npm run validate` |

### Documentation

| File | Purpose |
|------|---------|
| `README.md` | Quick start guide |
| `SETUP.md` | Detailed setup & troubleshooting |
| `FIX_SUMMARY.md` | Technical fix documentation |
| `AUTOMATION_GUIDE.md` | This file |
| `.env.example` | Environment variable template |
| `.gitignore` | Git ignore rules |

### Code Fixes

| File | Changes |
|------|---------|
| `desktop-ui/watcher-manager.ts` | Improved path detection, validation, error messages |
| `package.json` | Added `validate` and `setup` scripts |

---

## 💡 Usage Examples

### Scenario 1: Brand New Setup

```bash
# Clone the repository
git clone <repo-url>
cd PolymarketWatcher.C.CLUIV1.5

# Run automated setup
./setup.sh

# Setup prompts for Discord webhook, installs everything
# When done, start the UI
npm run ui

# Click "Start Scanning" - it works! ✅
```

### Scenario 2: Troubleshooting

```bash
# Something's wrong, validate the setup
npm run validate

# Output shows what's missing:
# ❌ tsx is NOT installed
# ❌ .env file not found

# Fix the issues
npm install
cp .env.example .env
nano .env  # Add webhook

# Validate again
npm run validate
# ✅ All checks passed!

# Try again
npm run ui
```

### Scenario 3: Verifying After Pull

```bash
# Pull latest changes
git pull

# Validate everything still works
npm run validate

# If issues, re-run setup
./setup.sh
```

---

## 🎯 What Each Tool Solves

### Problem: "Start Scanning doesn't work"
**Solutions:**
1. ✅ `setup.sh` / `setup.bat` - Automates entire setup
2. ✅ `validate-setup.js` - Diagnoses issues
3. ✅ Code fixes in `watcher-manager.ts` - Better error messages

### Problem: "I don't know if tsx is installed"
**Solutions:**
1. ✅ `npm run validate` - Checks tsx installation
2. ✅ `setup.sh` - Installs and verifies tsx
3. ✅ `watcher-manager.ts` - Validates tsx before spawn

### Problem: "Missing environment variables"
**Solutions:**
1. ✅ `.env.example` - Template with comments
2. ✅ `setup.sh` - Creates .env and prompts for webhook
3. ✅ `validate-setup.js` - Checks .env configuration

### Problem: "Don't know what's wrong"
**Solutions:**
1. ✅ `npm run validate` - Comprehensive diagnostics
2. ✅ Enhanced error messages in UI
3. ✅ `SETUP.md` - Detailed troubleshooting guide

---

## 🔄 Maintenance

### Keeping Dependencies Updated

```bash
# Check for outdated packages
npm outdated

# Update all dependencies
npm update

# Validate everything still works
npm run validate
```

### After System Changes

If you change Node.js version, move the project, or modify files:

```bash
# Re-validate
npm run validate

# If issues, re-install
rm -rf node_modules package-lock.json
npm install
npm run validate
```

---

## 🎓 For Developers

### Adding New Validation Checks

Edit `validate-setup.js`:

```javascript
// Add a new section
section('My New Check');

try {
  // Your validation logic
  if (someCondition) {
    log('success', 'Check passed');
  } else {
    log('error', 'Check failed');
    errors++;
  }
} catch (e) {
  log('error', `Check failed: ${e.message}`);
  errors++;
}
```

### Customizing Setup Scripts

**setup.sh:**
- Add new prompts in Step 5
- Add validation in Step 6
- Update summary in Step 8

**setup.bat:**
- Same structure as setup.sh
- Use Windows commands (`set`, `if`, `copy`, etc.)

### Testing Changes

```bash
# Test validation
npm run validate

# Test setup (in a clean directory)
rm -rf node_modules .env
./setup.sh

# Verify UI works
npm run ui
```

---

## ✅ Success Checklist

After running the automated setup, you should have:

- ✅ `node_modules/` folder with all dependencies
- ✅ `.env` file with your Discord webhook URL
- ✅ `tsx` installed and working
- ✅ All validation checks passing
- ✅ "Start Scanning" button working in UI
- ✅ Logs appearing in "Scanning" tab
- ✅ Discord webhook tested and working

If any are missing, run:
```bash
npm run validate
```

And follow the suggested fixes.

---

## 🆘 Getting Help

1. **Run validation:**
   ```bash
   npm run validate
   ```

2. **Check detailed guide:**
   ```bash
   cat SETUP.md
   ```

3. **Review error messages in UI:**
   - They now include actionable fixes
   - Look for 💡 icons for hints

4. **Test individual components:**
   ```bash
   npm run test:webhook   # Test Discord
   npm run ui:test        # Test server only
   ```

---

## 🎉 Summary

You now have **three powerful automation tools**:

1. **setup.sh / setup.bat** - One-command complete setup
2. **validate-setup.js** - Comprehensive diagnostics
3. **Enhanced code** - Better error messages and reliability

The Start Scanning function is now:
- ✅ Easy to set up (one command)
- ✅ Easy to diagnose (npm run validate)
- ✅ Easy to fix (clear error messages)
- ✅ Reliable (multiple fallbacks, validation)

**Just run `./setup.sh` and you're done!** 🚀
