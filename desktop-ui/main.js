const { app, BrowserWindow } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let serverProcess = null;
let mainWindow = null;

function startServer() {
  // Use tsx to run the TypeScript server file directly
  const { spawn } = require('child_process');
  const serverPath = path.join(__dirname, 'server.ts');
  const projectRoot = path.join(__dirname, '..');

  console.log('🚀 Starting UI server...');
  console.log('   Server script:', serverPath);
  console.log('   Working directory:', projectRoot);

  serverProcess = spawn('npx', ['tsx', serverPath], {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: true
  });

  serverProcess.on('error', (err) => {
    console.error('❌ Failed to start server:', err);
    console.error('   Make sure tsx is installed: npm install tsx');
  });

  serverProcess.on('exit', (code) => {
    if (code === 0) {
      console.log('ℹ️  Server process exited normally');
    } else {
      console.error(`❌ Server process exited with code ${code}`);
      console.error('   Check if dependencies are installed: npm install');
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    },
    title: 'Polymarket Watcher',
    backgroundColor: '#0f0f0f',
    show: false // Don't show until ready
  });

  // Wait a bit for server to start, then load
  setTimeout(() => {
    console.log('🌐 Connecting to http://localhost:3000...');
    mainWindow.loadURL('http://localhost:3000').catch(err => {
      console.error('❌ Failed to load URL:', err.message);
      console.log('⏳ Retrying in 1 second...');
      // Retry after another second
      setTimeout(() => {
        mainWindow.loadURL('http://localhost:3000').catch(err2 => {
          console.error('❌ Still cannot connect to server');
          console.error('   The server may not have started properly');
          console.error('   Try running: npm run ui:test (to test server standalone)');
        });
      }, 1000);
    });
  }, 1500);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development (optional)
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  startServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
