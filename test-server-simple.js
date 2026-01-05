#!/usr/bin/env node

/**
 * Quick Server Test (Windows-compatible)
 * Tests if the server can start and respond
 */

console.log('🔍 Testing Polymarket Watcher Server\n');

const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

const serverPath = path.join(__dirname, 'desktop-ui', 'server.ts');

console.log('Starting server...');
console.log('Server script:', serverPath);
console.log('');

// Start the server
const serverProcess = spawn('npx', ['tsx', serverPath], {
  cwd: __dirname,
  shell: true,
  stdio: ['ignore', 'pipe', 'pipe']
});

let serverStarted = false;

serverProcess.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(output);

  if (output.includes('Desktop UI server running')) {
    serverStarted = true;
    console.log('\n✅ Server started successfully!\n');

    // Test if we can reach it
    setTimeout(() => {
      console.log('Testing server response...\n');

      http.get('http://localhost:3000/', (res) => {
        console.log('✅ Server is responding!');
        console.log('Status:', res.statusCode);

        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          if (data.length > 0) {
            console.log('✅ Server returned content (' + data.length + ' bytes)');
            console.log('\nServer is working correctly!');
            console.log('\nNow try: npm run ui');
          } else {
            console.log('⚠️  Server returned empty content');
            console.log('This is why the UI is blank!');
          }

          console.log('\nShutting down test server...');
          serverProcess.kill();
          setTimeout(() => process.exit(0), 500);
        });
      }).on('error', (err) => {
        console.log('❌ Cannot reach server:', err.message);
        console.log('\nThe server started but is not responding.');
        console.log('Check if port 3000 is blocked by firewall.');

        serverProcess.kill();
        setTimeout(() => process.exit(1), 500);
      });
    }, 1000);
  }
});

serverProcess.stderr.on('data', (data) => {
  console.error('❌ Server error:', data.toString());
});

serverProcess.on('error', (err) => {
  console.error('❌ Failed to start server:', err.message);
  console.log('\nMake sure tsx is installed:');
  console.log('  npm install');
  process.exit(1);
});

serverProcess.on('exit', (code) => {
  if (!serverStarted) {
    console.log('\n❌ Server exited before starting (code:', code + ')');
    console.log('\nTroubleshooting:');
    console.log('1. Run: npm install');
    console.log('2. Check .env file exists');
    console.log('3. Make sure port 3000 is free');
    process.exit(1);
  }
});

// Timeout
setTimeout(() => {
  if (!serverStarted) {
    console.log('\n❌ Server did not start within 10 seconds');
    console.log('\nCheck for errors above.');
    serverProcess.kill();
    process.exit(1);
  }
}, 10000);

console.log('Waiting for server to start...\n');
