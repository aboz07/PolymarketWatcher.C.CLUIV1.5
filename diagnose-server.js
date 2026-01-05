#!/usr/bin/env node

/**
 * Server Diagnostic Tool
 *
 * Tests the UI server independently to diagnose connection issues
 * Run with: node diagnose-server.js
 */

const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

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

console.log('\n🔍 Server Diagnostic Tool\n');

// Check 1: tsx installed
section('Checking Dependencies');
const fs = require('fs');
const tsxPath = path.join(process.cwd(), 'node_modules', '.bin', 'tsx');
const tsxPathCmd = tsxPath + '.cmd';

if (fs.existsSync(tsxPath) || fs.existsSync(tsxPathCmd)) {
  log('success', 'tsx is installed');
} else {
  log('error', 'tsx is NOT installed');
  log('info', 'Run: npm install tsx');
  process.exit(1);
}

// Check 2: server.ts exists
const serverPath = path.join(process.cwd(), 'desktop-ui', 'server.ts');
if (fs.existsSync(serverPath)) {
  log('success', 'server.ts exists');
} else {
  log('error', 'server.ts not found at: ' + serverPath);
  process.exit(1);
}

// Check 3: Port 3000 availability
section('Checking Port Availability');
const testServer = http.createServer();
testServer.once('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    log('error', 'Port 3000 is already in use');
    log('info', 'Kill the process using port 3000 or use a different port');
    log('info', 'Find process: lsof -i :3000 (macOS/Linux) or netstat -ano | findstr :3000 (Windows)');
    process.exit(1);
  }
});
testServer.once('listening', () => {
  log('success', 'Port 3000 is available');
  testServer.close();

  // Check 4: Start test server
  section('Starting Test Server');
  log('info', 'Starting server on http://localhost:3000...');

  const serverProcess = spawn('npx', ['tsx', serverPath], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true
  });

  let serverStarted = false;

  serverProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(output.trim());

    if (output.includes('Desktop UI server running')) {
      serverStarted = true;
      log('success', 'Server started successfully!');

      // Test connection
      setTimeout(() => {
        section('Testing Server Endpoints');
        testEndpoints(serverProcess);
      }, 500);
    }
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(colors.red + data.toString().trim() + colors.reset);
  });

  serverProcess.on('error', (err) => {
    log('error', 'Failed to start server: ' + err.message);
    process.exit(1);
  });

  serverProcess.on('exit', (code) => {
    if (!serverStarted) {
      log('error', 'Server exited before starting (code: ' + code + ')');
      log('info', 'Check for error messages above');
      process.exit(1);
    }
  });

  // Timeout if server doesn't start
  setTimeout(() => {
    if (!serverStarted) {
      log('error', 'Server did not start within 5 seconds');
      log('info', 'Check for error messages above');
      serverProcess.kill();
      process.exit(1);
    }
  }, 5000);
});

testServer.listen(3000);

function testEndpoints(serverProcess) {
  const endpoints = [
    { path: '/', desc: 'Home page' },
    { path: '/api/config', desc: 'Config API' },
    { path: '/api/state', desc: 'State API' },
    { path: '/api/stats', desc: 'Stats API' },
    { path: '/api/watcher/status', desc: 'Watcher Status API' }
  ];

  let tested = 0;
  let passed = 0;

  endpoints.forEach((endpoint, index) => {
    setTimeout(() => {
      http.get(`http://localhost:3000${endpoint.path}`, (res) => {
        tested++;

        if (res.statusCode === 200) {
          log('success', `${endpoint.desc} (${endpoint.path}): ${res.statusCode}`);
          passed++;
        } else {
          log('warning', `${endpoint.desc} (${endpoint.path}): ${res.statusCode}`);
        }

        if (tested === endpoints.length) {
          // All tests done
          setTimeout(() => {
            section('Results');
            console.log('');
            log('info', `${passed}/${endpoints.length} endpoints responding`);

            if (passed === endpoints.length) {
              log('success', 'All checks passed! Server is working correctly.');
              log('info', 'The Start Scanning button should work now.');
            } else {
              log('warning', 'Some endpoints are not responding correctly');
              log('info', 'But basic functionality should work');
            }

            console.log('');
            log('info', 'Shutting down test server...');
            serverProcess.kill();

            setTimeout(() => {
              console.log('');
              log('success', 'Diagnostic complete!');
              console.log('');
              console.log('Next steps:');
              console.log('  1. Close this window');
              console.log('  2. Run: npm run ui');
              console.log('  3. Click "Start Scanning"');
              console.log('');
              process.exit(0);
            }, 500);
          }, 500);
        }
      }).on('error', (err) => {
        tested++;
        log('error', `${endpoint.desc} (${endpoint.path}): ${err.message}`);

        if (tested === endpoints.length) {
          log('error', 'Server is not responding');
          serverProcess.kill();
          process.exit(1);
        }
      });
    }, index * 200); // Stagger requests
  });
}
