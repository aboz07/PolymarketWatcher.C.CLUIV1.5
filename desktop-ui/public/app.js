const API_BASE = '';

let autoRefreshInterval = null;

// Format utilities
function formatTime(timestamp) {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
}

function formatUsd(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function formatPrice(price) {
    return (price * 100).toFixed(2) + '%';
}

function abbrevWallet(wallet) {
    if (!wallet) return 'N/A';
    return wallet.slice(0, 6) + '…' + wallet.slice(-4);
}

// API calls
async function fetchState() {
    try {
        const response = await fetch(`${API_BASE}/api/state`);
        if (!response.ok) throw new Error('Failed to fetch state');
        return await response.json();
    } catch (error) {
        console.error('Error fetching state:', error);
        throw error;
    }
}

async function fetchStats() {
    try {
        const response = await fetch(`${API_BASE}/api/stats`);
        if (!response.ok) throw new Error('Failed to fetch stats');
        return await response.json();
    } catch (error) {
        console.error('Error fetching stats:', error);
        throw error;
    }
}

async function fetchConfig() {
    try {
        const response = await fetch(`${API_BASE}/api/config`);
        if (!response.ok) throw new Error('Failed to fetch config');
        return await response.json();
    } catch (error) {
        console.error('Error fetching config:', error);
        throw error;
    }
}

// Update UI functions
function updateStatus(connected) {
    const dot = document.getElementById('status-dot');
    const text = document.getElementById('status-text');
    
    if (connected) {
        dot.classList.add('active');
        text.textContent = 'Connected';
    } else {
        dot.classList.remove('active');
        text.textContent = 'Disconnected';
    }
}

function updateStats(stats) {
    document.getElementById('stat-trades').textContent = stats.totalTrades.toLocaleString();
    document.getElementById('stat-wallets').textContent = stats.totalWallets.toLocaleString();
    document.getElementById('stat-markets').textContent = stats.totalMarkets.toLocaleString();
    document.getElementById('stat-alerts').textContent = stats.totalAlerts.toLocaleString();
    
    if (stats.lastUpdate) {
        document.getElementById('last-update').textContent = formatTime(stats.lastUpdate);
    }
}

function renderTrades(trades) {
    const container = document.getElementById('trades-list');
    
    if (!trades || trades.length === 0) {
        container.innerHTML = '<div class="loading">No trades found</div>';
        return;
    }
    
    container.innerHTML = trades.map(trade => `
        <div class="trade-item">
            <div class="trade-header">
                <div class="trade-market">${escapeHtml(trade.marketTitle || trade.marketId)}</div>
                <div class="trade-time">${formatTime(trade.ts)}</div>
            </div>
            <div class="trade-details">
                <div class="trade-detail">
                    <span class="trade-detail-label">Wallet</span>
                    <span class="trade-detail-value">${abbrevWallet(trade.wallet)}</span>
                </div>
                <div class="trade-detail">
                    <span class="trade-detail-label">Side</span>
                    <span class="trade-detail-value trade-side ${trade.side.toLowerCase()}">${trade.side}</span>
                </div>
                <div class="trade-detail">
                    <span class="trade-detail-label">Outcome</span>
                    <span class="trade-detail-value">${trade.outcome}</span>
                </div>
                <div class="trade-detail">
                    <span class="trade-detail-label">Shares</span>
                    <span class="trade-detail-value">${Math.round(trade.shares).toLocaleString()}</span>
                </div>
                <div class="trade-detail">
                    <span class="trade-detail-label">Price</span>
                    <span class="trade-detail-value">${formatPrice(trade.price)}</span>
                </div>
                <div class="trade-detail">
                    <span class="trade-detail-label">Notional</span>
                    <span class="trade-detail-value">${formatUsd(trade.notional)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function renderConfig(config) {
    const container = document.getElementById('config-display');
    
    if (!config) {
        container.innerHTML = '<div class="error">Failed to load configuration</div>';
        return;
    }
    
    container.innerHTML = `
        <div class="config-group">
            <div class="config-group-title">General Settings</div>
            <div class="config-item">
                <span class="config-item-label">Poll Interval</span>
                <span class="config-item-value">${config.pollIntervalMs}ms</span>
            </div>
            <div class="config-item">
                <span class="config-item-label">Min Nominal USD</span>
                <span class="config-item-value">${formatUsd(config.minNominalUsd)}</span>
            </div>
        </div>
        
        <div class="config-group">
            <div class="config-group-title">Filters</div>
            <div class="config-item">
                <span class="config-item-label">Min Gamma Liquidity</span>
                <span class="config-item-value">${formatUsd(config.filters.minGammaLiquidityUsd)}</span>
            </div>
            <div class="config-item">
                <span class="config-item-label">Min Top 5 Book Depth</span>
                <span class="config-item-value">${formatUsd(config.filters.minTop5DepthUsd)}</span>
            </div>
            <div class="config-item">
                <span class="config-item-label">Excluded Categories</span>
                <span class="config-item-value">${config.filters.excludeCategories.join(', ')}</span>
            </div>
        </div>
        
        <div class="config-group">
            <div class="config-group-title">Criterion A</div>
            <div class="config-item">
                <span class="config-item-label">Implied Yes Prob Max</span>
                <span class="config-item-value">${(config.criteriaA.impliedYesProbMax * 100).toFixed(1)}%</span>
            </div>
            <div class="config-item">
                <span class="config-item-label">Burst Window (min)</span>
                <span class="config-item-value">${config.criteriaA.burstWindowMin}</span>
            </div>
            <div class="config-item">
                <span class="config-item-label">Burst Min UMT Wallets</span>
                <span class="config-item-value">${config.criteriaA.burstMinUMTWallets}</span>
            </div>
        </div>
        
        <div class="config-group">
            <div class="config-group-title">Criterion B</div>
            <div class="config-item">
                <span class="config-item-label">Fresh Wallet Days Max</span>
                <span class="config-item-value">${config.criteriaB.freshWalletDaysMax}</span>
            </div>
            <div class="config-item">
                <span class="config-item-label">Single Trade Min Notional</span>
                <span class="config-item-value">${formatUsd(config.criteriaB.singleTradeMinNotionalUsd)}</span>
            </div>
            <div class="config-item">
                <span class="config-item-label">Conviction Max Markets (24h)</span>
                <span class="config-item-value">${config.criteriaB.convictionMaxMarkets24h}</span>
            </div>
        </div>
    `;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Main refresh function
async function refresh() {
    try {
        updateStatus(true);
        
        const [state, stats, config] = await Promise.all([
            fetchState(),
            fetchStats(),
            fetchConfig()
        ]);
        
        // Enrich trades with market titles
        const enrichedTrades = stats.recentTrades.map(trade => ({
            ...trade,
            marketTitle: state.markets[trade.marketId]?.title || trade.marketId
        }));
        
        updateStats(stats);
        renderTrades(enrichedTrades);
        renderConfig(config);
    } catch (error) {
        updateStatus(false);
        console.error('Refresh error:', error);
    }
}

// Tab management
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            
            // Update buttons
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update content
            tabContents.forEach(c => c.classList.remove('active'));
            document.getElementById(`${targetTab}-tab`).classList.add('active');
            
            // Start/stop log polling based on active tab
            if (targetTab === 'scanning') {
                startLogPolling();
            } else {
                stopLogPolling();
            }
        });
    });
}

// Logs functionality
let logPollingInterval = null;
let lastLogId = 0;

async function fetchLogs() {
    try {
        const response = await fetch(`${API_BASE}/api/logs?since=${lastLogId}`);
        if (!response.ok) throw new Error('Failed to fetch logs');
        const data = await response.json();
        
        if (data.logs && data.logs.length > 0) {
            appendLogs(data.logs);
            lastLogId = data.lastId || lastLogId;
        }
    } catch (error) {
        console.error('Error fetching logs:', error);
    }
}

function appendLogs(logs) {
    const container = document.getElementById('logs-container');
    if (!container) return;
    
    // Remove loading message if present
    if (container.querySelector('.loading')) {
        container.innerHTML = '';
    }
    
    logs.forEach(log => {
        const entry = document.createElement('div');
        entry.className = `log-entry ${log.level || 'info'}`;
        
        const timestamp = new Date(log.timestamp).toLocaleTimeString();
        entry.innerHTML = `
            <span class="log-timestamp">[${timestamp}]</span>
            <span class="log-message">${escapeHtml(log.message)}</span>
        `;
        
        container.appendChild(entry);
    });
    
    // Auto-scroll if enabled
    if (autoScrollEnabled) {
        container.scrollTop = container.scrollHeight;
    }
}

function startLogPolling() {
    if (logPollingInterval) return;
    logPollingInterval = setInterval(fetchLogs, 1000); // Poll every second
    fetchLogs(); // Initial fetch
}

function stopLogPolling() {
    if (logPollingInterval) {
        clearInterval(logPollingInterval);
        logPollingInterval = null;
    }
}

function clearLogs() {
    const container = document.getElementById('logs-container');
    if (container) {
        container.innerHTML = '<div class="loading">Logs cleared. Waiting for new logs...</div>';
        lastLogId = 0;
    }
}

// Auto-refresh toggle
let autoRefreshEnabled = true;

function toggleAutoRefresh() {
    autoRefreshEnabled = !autoRefreshEnabled;
    const btn = document.getElementById('auto-refresh-btn');
    
    if (btn) {
        if (autoRefreshEnabled) {
            btn.classList.add('active');
            autoRefreshInterval = setInterval(refresh, 5000);
        } else {
            btn.classList.remove('active');
            if (autoRefreshInterval) {
                clearInterval(autoRefreshInterval);
                autoRefreshInterval = null;
            }
        }
    }
}

// Auto-scroll toggle for Scanning tab
let autoScrollEnabled = true;

function toggleAutoScroll() {
    autoScrollEnabled = !autoScrollEnabled;
    const btn = document.getElementById('auto-scroll-btn');
    if (btn) {
        if (autoScrollEnabled) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    }
}

// Event listeners
document.getElementById('refresh-btn').addEventListener('click', refresh);
document.getElementById('auto-refresh-btn')?.addEventListener('click', toggleAutoRefresh);
document.getElementById('auto-scroll-btn')?.addEventListener('click', toggleAutoScroll);
document.getElementById('clear-logs-btn')?.addEventListener('click', clearLogs);

// Watcher control
async function startWatcher() {
    try {
        const response = await fetch(`${API_BASE}/api/watcher/start`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const result = await response.json();
        
        if (result.success) {
            updateWatcherStatus(true);
            // Log will appear from watcher process output
            // Show initial feedback
            appendLogs([{ level: 'success', message: 'Watcher start requested. Check logs below...', timestamp: Date.now() }]);
        } else {
            updateWatcherStatus(false);
            appendLogs([{ level: 'error', message: `Failed: ${result.message}`, timestamp: Date.now() }]);
        }
    } catch (error) {
        console.error('Error starting watcher:', error);
        updateWatcherStatus(false);
        appendLogs([{ 
            level: 'error', 
            message: `Failed to start watcher: ${error.message}. Make sure the UI server is running.`, 
            timestamp: Date.now() 
        }]);
    }
}

async function stopWatcher() {
    try {
        const response = await fetch(`${API_BASE}/api/watcher/stop`);
        const result = await response.json();
        
        if (result.success) {
            updateWatcherStatus(false);
            // Log will appear from watcher process output
        } else {
            appendLogs([{ level: 'error', message: result.message, timestamp: Date.now() }]);
        }
    } catch (error) {
        console.error('Error stopping watcher:', error);
        appendLogs([{ level: 'error', message: 'Failed to stop watcher', timestamp: Date.now() }]);
    }
}

async function checkWatcherStatus() {
    try {
        const response = await fetch(`${API_BASE}/api/watcher/status`);
        const status = await response.json();
        updateWatcherStatus(status.isRunning);
    } catch (error) {
        console.error('Error checking watcher status:', error);
    }
}

function updateWatcherStatus(isRunning) {
    const startBtn = document.getElementById('start-watcher-btn');
    const stopBtn = document.getElementById('stop-watcher-btn');
    const statusDiv = document.getElementById('watcher-status');
    
    if (startBtn) startBtn.style.display = isRunning ? 'none' : 'inline-block';
    if (stopBtn) stopBtn.style.display = isRunning ? 'inline-block' : 'none';
    
    if (statusDiv) {
        if (isRunning) {
            statusDiv.className = 'watcher-status running';
            statusDiv.textContent = '🟢 Scanning is active';
        } else {
            statusDiv.className = 'watcher-status stopped';
            statusDiv.textContent = '🔴 Scanning is stopped';
        }
    }
}

// Note: addLog function removed - using appendLogs instead which handles log objects from API

document.getElementById('start-watcher-btn')?.addEventListener('click', startWatcher);
document.getElementById('stop-watcher-btn')?.addEventListener('click', stopWatcher);

// Check watcher status periodically
setInterval(checkWatcherStatus, 2000);
checkWatcherStatus();

// Initialize
initTabs();
refresh();
// Start auto-refresh (enabled by default)
autoRefreshInterval = setInterval(refresh, 5000);
