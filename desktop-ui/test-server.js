// Simple test server to preview the UI without Electron
// Run with: node desktop-ui/test-server.js
// Then open http://localhost:3000 in your browser

const { createServer } = require('http');
const { readFileSync } = require('fs');
const { join } = require('path');

const publicDir = join(__dirname, 'public');

// Mock log generator for testing
let mockLogId = 0;
const mockLogMessages = [
  { level: 'info', message: 'Starting watcher...' },
  { level: 'success', message: '✅ Watcher running. lastSeenTs = 0' },
  { level: 'info', message: '[poll] fetched 200 trades at 10:30:45 AM' },
  { level: 'info', message: 'Processing trade: 0x1234...abcd on market 0x5678' },
  { level: 'info', message: 'Trade passed filters: notional $2500' },
  { level: 'info', message: 'Fetching market metadata...' },
  { level: 'success', message: 'Market metadata retrieved' },
  { level: 'info', message: 'Checking liquidity requirements...' },
  { level: 'success', message: 'Liquidity check passed' },
  { level: 'info', message: 'Evaluating criteria A and B...' },
  { level: 'warning', message: 'Trade did not meet criteria thresholds' },
  { level: 'info', message: '[poll] fetched 200 trades at 10:31:00 AM' },
  { level: 'info', message: 'Processing trade: 0xabcd...efgh on market 0x9876' },
  { level: 'success', message: '✅ Criterion A triggered! Sending Discord alert...' },
  { level: 'success', message: 'Discord webhook sent successfully' },
];

function generateMockLogs(sinceId) {
  const logs = [];
  const now = Date.now();
  
  // Generate logs up to current mockLogId
  for (let i = sinceId; i < mockLogId + 5; i++) {
    if (i >= mockLogMessages.length * 3) break; // Limit total logs
    
    const msgIndex = i % mockLogMessages.length;
    const logEntry = mockLogMessages[msgIndex];
    
    logs.push({
      id: i + 1,
      timestamp: now - (mockLogMessages.length - msgIndex) * 1000,
      level: logEntry.level,
      message: logEntry.message
    });
  }
  
  // Increment for next call
  if (sinceId === 0 || mockLogId < 10) {
    mockLogId += 2;
  }
  
  return {
    logs: logs.slice(-50), // Return last 50 logs
    lastId: mockLogId
  };
}

// Simulate new logs periodically
setInterval(() => {
  if (mockLogId < 20) {
    mockLogId++;
  }
}, 3000);

const server = createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);

  // Mock API responses for testing
  if (url.pathname === '/api/state') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      trades: [],
      wallets: {},
      markets: {},
      alertState: {}
    }));
    return;
  }

  if (url.pathname === '/api/stats') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      totalTrades: 0,
      totalWallets: 0,
      totalMarkets: 0,
      totalAlerts: 0,
      recentTrades: [],
      lastUpdate: null
    }));
    return;
  }

  if (url.pathname === '/api/config') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      pollIntervalMs: 12000,
      minNominalUsd: 1500,
      filters: {
        minGammaLiquidityUsd: 25000,
        minTop5DepthUsd: 8000,
        excludeCategories: ['sports', 'crypto']
      },
      criteriaA: {
        impliedYesProbMax: 0.20,
        burstWindowMin: 30,
        burstMinUMTWallets: 5
      },
      criteriaB: {
        freshWalletDaysMax: 30,
        singleTradeMinNotionalUsd: 2500,
        convictionMaxMarkets24h: 3
      }
    }));
    return;
  }

  if (url.pathname === '/api/logs') {
    const sinceParam = url.searchParams.get('since');
    const sinceId = sinceParam ? parseInt(sinceParam, 10) : 0;
    
    // Generate mock logs for testing
    const mockLogs = generateMockLogs(sinceId);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      logs: mockLogs.logs,
      lastId: mockLogs.lastId
    }));
    return;
  }

  // Serve static files
  if (url.pathname === '/' || url.pathname === '/index.html') {
    try {
      const html = readFileSync(join(publicDir, 'index.html'), 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    } catch (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('UI not found');
    }
    return;
  }

  if (url.pathname === '/style.css') {
    try {
      const css = readFileSync(join(publicDir, 'style.css'), 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/css' });
      res.end(css);
    } catch (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('');
    }
    return;
  }

  if (url.pathname === '/app.js') {
    try {
      const js = readFileSync(join(publicDir, 'app.js'), 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.end(js);
    } catch (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('');
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

const port = 3000;
server.listen(port, () => {
  console.log(`✅ Test UI server running at http://localhost:${port}`);
  console.log(`   Open this URL in your browser to preview the UI`);
  console.log(`   Press Ctrl+C to stop the server`);
});
