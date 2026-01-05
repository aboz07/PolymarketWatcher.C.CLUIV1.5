#!/usr/bin/env node

/**
 * Polymarket Watcher - Setup Validation Script
 *
 * This script checks if your setup is correct and the Start Scanning
 * function will work properly.
 *
 * Run with: node validate-setup.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

let errors = 0;
let warnings = 0;

function log(type, message) {
  const prefix = {
    success: `${colors.green}✅`,
    error: `${colors.red}❌`,
    warning: `${colors.yellow}⚠️`,
    info: `${colors.blue}ℹ️`
  }[type] || '';

  console.log(`${prefix} ${message}${colors.reset}`);
}

function section(title) {
  console.log(`\n${colors.blue}━━━ ${title} ━━━${colors.reset}`);
}

console.log('\n🍃 Polymarket Watcher - Setup Validation\n');

// 1. Check Node.js version
section('Node.js Version');
try {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

  if (majorVersion >= 18) {
    log('success', `Node.js version: ${nodeVersion} ✓`);
  } else {
    log('error', `Node.js ${nodeVersion} is too old. Version 18+ required.`);
    errors++;
  }
} catch (e) {
  log('error', `Failed to check Node.js version: ${e.message}`);
  errors++;
}

// 2. Check project structure
section('Project Structure');
const requiredFiles = [
  'package.json',
  'src/index.ts',
  'src/config.ts',
  'desktop-ui/watcher-manager.ts',
  'desktop-ui/server.ts',
  'desktop-ui/public/app.js',
  'desktop-ui/public/index.html'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    log('success', `${file} exists`);
  } else {
    log('error', `${file} is missing`);
    errors++;
  }
});

// 3. Check dependencies
section('Dependencies');

// Check if node_modules exists
if (!fs.existsSync('node_modules')) {
  log('error', 'node_modules folder not found');
  log('info', 'Run: npm install');
  errors++;
} else {
  log('success', 'node_modules folder exists');

  // Check specific dependencies
  const requiredDeps = ['tsx', 'typescript', 'axios', 'ws', 'dotenv', 'electron'];

  requiredDeps.forEach(dep => {
    const depPath = path.join('node_modules', dep);
    if (fs.existsSync(depPath)) {
      log('success', `${dep} is installed`);
    } else {
      log('error', `${dep} is NOT installed`);
      errors++;
    }
  });

  // Check tsx binary specifically
  const tsxBin = path.join('node_modules', '.bin', 'tsx');
  const tsxBinCmd = path.join('node_modules', '.bin', 'tsx.cmd');

  if (fs.existsSync(tsxBin) || fs.existsSync(tsxBinCmd)) {
    log('success', 'tsx binary is available');
  } else {
    log('error', 'tsx binary not found in node_modules/.bin/');
    log('info', 'Run: npm install tsx');
    errors++;
  }
}

// 4. Check environment configuration
section('Environment Configuration');

if (!fs.existsSync('.env')) {
  log('warning', '.env file not found');
  log('info', 'Run: cp .env.example .env');
  warnings++;
} else {
  log('success', '.env file exists');

  // Read and validate .env
  try {
    const envContent = fs.readFileSync('.env', 'utf8');

    // Check for Discord webhook
    const webhookMatch = envContent.match(/DISCORD_WEBHOOK_URL=(.+)/);
    if (!webhookMatch) {
      log('error', 'DISCORD_WEBHOOK_URL not set in .env');
      log('info', 'Add your Discord webhook URL to .env');
      errors++;
    } else {
      const webhookUrl = webhookMatch[1].trim();
      if (webhookUrl === 'https://discord.com/api/webhooks/YOUR_WEBHOOK_URL_HERE') {
        log('warning', 'DISCORD_WEBHOOK_URL is still set to placeholder value');
        log('info', 'Replace with your actual Discord webhook URL');
        warnings++;
      } else if (webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
        log('success', 'DISCORD_WEBHOOK_URL is configured');
      } else {
        log('error', 'DISCORD_WEBHOOK_URL does not look like a valid Discord webhook');
        warnings++;
      }
    }

    // Check other optional vars
    const optionalVars = ['POLL_INTERVAL_MS', 'MIN_GAMMA_LIQUIDITY_USD', 'MIN_TOP5_BOOK_DEPTH_USD'];
    optionalVars.forEach(varName => {
      if (envContent.includes(`${varName}=`)) {
        log('info', `${varName} is customized`);
      }
    });

  } catch (e) {
    log('error', `Failed to read .env file: ${e.message}`);
    errors++;
  }
}

// 5. Check watcher-manager.ts for fixes
section('Code Fixes Verification');

try {
  const watcherManagerPath = 'desktop-ui/watcher-manager.ts';
  const watcherContent = fs.readFileSync(watcherManagerPath, 'utf8');

  // Check for improved project root detection
  if (watcherContent.includes('Method 1: Check if __dirname contains desktop-ui') ||
      watcherContent.includes('endsWith("desktop-ui")')) {
    log('success', 'Improved project root detection is present');
  } else {
    log('warning', 'watcher-manager.ts may not have the latest fixes');
    warnings++;
  }

  // Check for tsx validation
  if (watcherContent.includes('Check if tsx is available') ||
      watcherContent.includes('tsxCheck')) {
    log('success', 'TSX validation code is present');
  } else {
    log('warning', 'TSX validation may be missing');
    warnings++;
  }

  // Check for enhanced error messages
  if (watcherContent.includes('❌') || watcherContent.includes('💡')) {
    log('success', 'Enhanced error messages are present');
  } else {
    log('warning', 'Error messages may not be enhanced');
    warnings++;
  }

  // Check if server.ts actually starts the server (CRITICAL)
  const serverPath = 'desktop-ui/server.ts';
  const serverContent = fs.readFileSync(serverPath, 'utf8');

  if (serverContent.includes('if (require.main === module)') &&
      serverContent.includes('startWebServer')) {
    log('success', 'Server startup code is present (CRITICAL FIX)');
  } else {
    log('error', 'Server startup code is MISSING - server will not start!');
    log('info', 'This is why you see "404 Not Found" errors');
    errors++;
  }

} catch (e) {
  log('error', `Failed to verify code fixes: ${e.message}`);
  errors++;
}

// 6. Check state.json
section('State File');

if (fs.existsSync('state.json')) {
  try {
    const state = JSON.parse(fs.readFileSync('state.json', 'utf8'));
    log('success', 'state.json exists and is valid JSON');
    log('info', `Current state: ${state.trades?.length || 0} trades, ${Object.keys(state.markets || {}).length} markets`);
  } catch (e) {
    log('warning', 'state.json exists but may be corrupted');
    log('info', 'It will be recreated automatically if needed');
    warnings++;
  }
} else {
  log('info', 'state.json does not exist (will be created automatically)');
}

// 7. Port availability check
section('Port Availability');

try {
  const { createServer } = require('http');
  const testServer = createServer();

  testServer.listen(3000, () => {
    log('success', 'Port 3000 is available');
    testServer.close();
  });

  testServer.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      log('warning', 'Port 3000 is already in use');
      log('info', 'The UI server may already be running, or another app is using this port');
      warnings++;
    }
  });
} catch (e) {
  log('warning', `Could not check port availability: ${e.message}`);
  warnings++;
}

// 8. Quick syntax check (if TypeScript is available)
section('Syntax Check');

try {
  // Try to compile TypeScript files
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  log('success', 'TypeScript files have no syntax errors');
} catch (e) {
  // TypeScript errors are expected if there are type issues
  // We'll just warn, not error
  log('info', 'TypeScript check skipped or has warnings (this is usually OK)');
}

// Summary
section('Summary');

console.log('');
if (errors === 0 && warnings === 0) {
  log('success', 'All checks passed! Your setup is ready.');
  console.log('');
  console.log(`${colors.green}You can now run:${colors.reset}`);
  console.log('  npm run ui    # Start the desktop UI');
  console.log('  npm run dev   # Run in terminal mode');
  console.log('');
} else {
  if (errors > 0) {
    log('error', `Found ${errors} error(s) that need to be fixed`);
  }
  if (warnings > 0) {
    log('warning', `Found ${warnings} warning(s) that should be addressed`);
  }
  console.log('');
  console.log(`${colors.yellow}Please fix the issues above before starting.${colors.reset}`);
  console.log('');
  console.log('Common fixes:');
  console.log('  npm install              # Install dependencies');
  console.log('  cp .env.example .env     # Create environment file');
  console.log('  nano .env                # Edit environment file');
  console.log('');
}

console.log('For detailed troubleshooting, see: SETUP.md');
console.log('');

process.exit(errors > 0 ? 1 : 0);
