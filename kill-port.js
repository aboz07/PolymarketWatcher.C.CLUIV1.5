#!/usr/bin/env node

/**
 * Cross-platform Port 3000 Cleanup Tool
 * Works on Windows, macOS, and Linux
 */

const { exec } = require('child_process');
const os = require('os');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m'
};

console.log('\n🔍 Checking port 3000...\n');

const platform = os.platform();
let findCommand, killCommand;

if (platform === 'win32') {
  // Windows
  findCommand = 'netstat -ano | findstr :3000';

  exec(findCommand, (error, stdout, stderr) => {
    if (error || !stdout) {
      console.log(`${colors.green}✅ Port 3000 is available (nothing using it)${colors.reset}`);
      process.exit(0);
    }

    // Parse Windows netstat output
    const lines = stdout.trim().split('\n');
    const pids = new Set();

    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 5 && parts[1].includes(':3000')) {
        pids.add(parts[4]);
      }
    });

    if (pids.size === 0) {
      console.log(`${colors.green}✅ Port 3000 is available${colors.reset}`);
      process.exit(0);
    }

    const pid = Array.from(pids)[0];
    console.log(`${colors.yellow}⚠️  Port 3000 is in use by process: ${pid}${colors.reset}\n`);

    // Show process details
    exec(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`, (err, out) => {
      if (!err && out) {
        console.log('Process details:');
        console.log(out);
      }

      console.log(`${colors.yellow}Kill this process? (y/N):${colors.reset} `);

      process.stdin.once('data', (data) => {
        const answer = data.toString().trim().toLowerCase();

        if (answer === 'y' || answer === 'yes') {
          exec(`taskkill /PID ${pid} /F`, (killErr, killOut) => {
            if (killErr) {
              console.log(`${colors.red}❌ Failed to kill process${colors.reset}`);
              console.log('Try running as Administrator');
              process.exit(1);
            }

            console.log(`${colors.green}✅ Port 3000 is now available${colors.reset}\n`);
            console.log('You can now run:');
            console.log('  npm run ui\n');
            process.exit(0);
          });
        } else {
          console.log('Process not killed. Port 3000 is still in use.');
          process.exit(1);
        }
      });
    });
  });

} else {
  // macOS/Linux
  findCommand = 'lsof -ti :3000';

  exec(findCommand, (error, stdout, stderr) => {
    if (error || !stdout) {
      console.log(`${colors.green}✅ Port 3000 is available (nothing using it)${colors.reset}`);
      process.exit(0);
    }

    const pid = stdout.trim().split('\n')[0];
    console.log(`${colors.yellow}⚠️  Port 3000 is in use by process: ${pid}${colors.reset}\n`);

    // Show process details
    exec(`lsof -i :3000`, (err, out) => {
      if (!err && out) {
        console.log('Process details:');
        console.log(out);
        console.log('');
      }

      process.stdout.write(`${colors.yellow}Kill this process? (y/N):${colors.reset} `);

      process.stdin.once('data', (data) => {
        const answer = data.toString().trim().toLowerCase();

        if (answer === 'y' || answer === 'yes') {
          exec(`kill -9 ${pid}`, (killErr, killOut) => {
            if (killErr) {
              console.log(`${colors.red}❌ Failed to kill process${colors.reset}`);
              console.log('Try: sudo kill -9 ' + pid);
              process.exit(1);
            }

            console.log(`${colors.green}✅ Port 3000 is now available${colors.reset}\n`);
            console.log('You can now run:');
            console.log('  npm run ui\n');
            process.exit(0);
          });
        } else {
          console.log('Process not killed. Port 3000 is still in use.');
          process.exit(1);
        }
      });
    });
  });
}
