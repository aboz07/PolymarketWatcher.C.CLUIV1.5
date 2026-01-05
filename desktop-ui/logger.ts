// Logger utility to capture watcher logs and send to UI server

type LogLevel = 'info' | 'success' | 'warning' | 'error';

type LogEntry = {
  id: number;
  timestamp: number;
  level: LogLevel;
  message: string;
};

let logBuffer: LogEntry[] = [];
let logIdCounter = 0;
const MAX_LOGS = 1000;

export function addLog(level: LogLevel, message: string) {
  const entry: LogEntry = {
    id: ++logIdCounter,
    timestamp: Date.now(),
    level,
    message
  };
  logBuffer.push(entry);
  
  // Keep only recent logs
  if (logBuffer.length > MAX_LOGS) {
    logBuffer = logBuffer.slice(-MAX_LOGS);
  }
  
  // Also log to console
  const prefix = level === 'error' ? '❌' : level === 'warning' ? '⚠️' : level === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} ${message}`);
}

export function getLogs(sinceId: number = 0): { logs: LogEntry[]; lastId: number } {
  const newLogs = logBuffer.filter(log => log.id > sinceId);
  return {
    logs: newLogs,
    lastId: logBuffer.length > 0 ? logBuffer[logBuffer.length - 1].id : 0
  };
}

// Note: Auto-generated logs removed - logs now come from actual watcher process
// Initial log will be added when watcher starts
