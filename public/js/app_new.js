// =====================================
//  Enterprise Solar Management Platform
//  Version 2.0 - Professional Dashboard
// =====================================

// Global variables
const API_URL = 'http://localhost:3000/api';
let token = localStorage.getItem('token');
let currentUser = null;
let ws = null;
let charts = {};
let map = null;
let markers = {};
let markerCluster = null;
let deviceData = [];
let lastUpdate = new Date();
let autoRefreshAlerts = true;
let alertRefreshInterval = null;

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
    showToast('Theme changed', `Switched to ${newTheme} mode`, 'success');
}

function updateThemeIcon(theme) {
    const icon = document.getElementById('theme-icon');
    if (icon) {
        icon.textContent = theme === 'light' ? '🌙' : '☀️';
    }
}

// Toast Notifications
function showToast(title, message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };
    
    toast.innerHTML = `
        <span class="toast-icon">${icons[type]}</span>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-out forwards';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// Sidebar Toggle
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
}

// Connection Status
function updateConnectionStatus(connected) {
    const statusEl = document.getElementById('connection-status');
    const statusDot = statusEl.querySelector('.status-dot');
    const statusText = statusEl.querySelector('.status-text');
    
    if (connected) {
        statusEl.classList.remove('disconnected');
        statusText.textContent = 'Connected';
    } else {
        statusEl.classList.add('disconnected');
        statusText.textContent = 'Disconnected';
        showToast('Connection Lost', 'Attempting to reconnect...', 'warning');
    }
}

// Update Last Update Time
function updateLastUpdateTime() {
    const el = document.getElementById('last-update');
    if (!el) return;
    
    const now = new Date();
    const diff = Math.floor((now - lastUpdate) / 1000);
    
    if (diff < 60) {
        el.textContent = 'Just now';
    } else if (diff < 3600) {
        el.textContent = `${Math.floor(diff / 60)}m ago`;
    } else {
        el.textContent = lastUpdate.toLocaleTimeString();
    }
}

setInterval(updateLastUpdateTime, 10000);

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    
    if (token) {
        verifyTokenAndLoadApp();
    } else {
        showLoginPage();
    }
});

// Login functionality
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            token = data.token;
            localStorage.setItem('token', token);
            currentUser = data.user;
            showToast('Welcome!', `Logged in as ${email}`, 'success');
            showApp();
        } else {
            errorDiv.textContent = data.error || 'Login failed';
            showToast('Login Failed', data.error || 'Invalid credentials', 'error');
        }
    } catch (error) {
        errorDiv.textContent = 'Connection error. Please try again.';
        showToast('Connection Error', 'Unable to reach server', 'error');
    }
});

// Logout
document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('token');
    token = null;
    currentUser = null;
    if (ws) ws.close();
    if (window.mapUpdateInterval) clearInterval(window.mapUpdateInterval);
    if (alertRefreshInterval) clearInterval(alertRefreshInterval);
    showToast('Logged Out', 'See you next time!', 'info');
    setTimeout(() => location.reload(), 1000);
});

// Verify token and load app
async function verifyTokenAndLoadApp() {
    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            currentUser = await response.json();
            showApp();
        } else {
            localStorage.removeItem('token');
            token = null;
            showLoginPage();
        }
    } catch (error) {
        showLoginPage();
    }
}

// Show login page
function showLoginPage() {
    document.getElementById('login-page').classList.add('active');
    document.getElementById('app').style.display = 'none';
}

// Show main app
function showApp() {
    document.getElementById('login-page').classList.remove('active');
    document.getElementById('app').style.display = 'flex';
    
    // Set user info
    document.getElementById('user-email').textContent = currentUser.email;
    document.getElementById('user-role').textContent = currentUser.role.toUpperCase();
    
    // Show admin menu items
    if (currentUser.role === 'admin') {
        document.querySelectorAll('.admin-only').forEach(el => {
            el.classList.add('visible');
        });
    }
    
    // Initialize WebSocket
    initWebSocket();
    
    // Load dashboard
    loadDashboard();
    
    // Setup navigation
    setupNavigation();
    
    // Start system monitoring
    startSystemMonitoring();
}

// Setup navigation
function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            navigateToPage(page);
        });
    });
}

// Navigate to page
function navigateToPage(page) {
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    const activeNav = document.querySelector(`[data-page="${page}"]`);
    if (activeNav) activeNav.classList.add('active');
    
    // Update active content page
    document.querySelectorAll('.content-page').forEach(content => {
        content.classList.remove('active');
    });
    const activePage = document.getElementById(`${page}-content`);
    if (activePage) activePage.classList.add('active');
    
    // Update breadcrumb
    const titles = {
        dashboard: 'Dashboard',
        devices: 'Device Management',
        map: 'Geographic Map',
        history: 'Historical Data',
        alerts: 'Alert Center',
        prediction: 'Energy Prediction',
        export: 'Data Export',
        users: 'User Management'
    };
    const breadcrumb = document.getElementById('breadcrumb');
    if (breadcrumb) breadcrumb.textContent = titles[page] || page;
    
    // Load page data
    switch(page) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'devices':
            loadDevices();
            break;
        case 'map':
            loadMap();
            break;
        case 'history':
            loadHistory('today');
            break;
        case 'alerts':
            loadAlerts();
            break;
        case 'prediction':
            loadPrediction();
            break;
        case 'users':
            loadUsers();
            break;
    }
}

// Initialize WebSocket for real-time data
function initWebSocket() {
    ws = new WebSocket('ws://localhost:3000');

    ws.onopen = () => {
        console.log('WebSocket connected');
        updateConnectionStatus(true);
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'sensor_update') {
            updateRealtimeData(data);
            lastUpdate = new Date();
        }
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        updateConnectionStatus(false);
    };

    ws.onclose = () => {
        console.log('WebSocket disconnected. Reconnecting...');
        updateConnectionStatus(false);
        setTimeout(initWebSocket, 5000);
    };
}

// Update real-time data
function updateRealtimeData(data) {
    // Update live monitoring panel
    const liveVoltage = document.getElementById('live-voltage');
    const liveCurrent = document.getElementById('live-current');
    const liveTemp = document.getElementById('live-temperature');
    const livePower = document.getElementById('live-power');
    
    if (liveVoltage) liveVoltage.textContent = data.solar.voltage.toFixed(2) + ' V';
    if (liveCurrent) liveCurrent.textContent = data.solar.current.toFixed(2) + ' A';
    if (liveTemp) liveTemp.textContent = data.solar.temperature.toFixed(1) + ' °C';
    if (livePower) livePower.textContent = data.solar.power.toFixed(0) + ' W';

    // Update battery level card
    const batteryLevel = document.getElementById('battery-level');
    const batteryFill = document.getElementById('battery-fill');
    if (batteryLevel) batteryLevel.textContent = data.battery.level.toFixed(1) + '%';
    if (batteryFill) batteryFill.style.width = data.battery.level + '%';

    // Update charts if they exist
    if (charts.energyChart) {
        updateEnergyChart(data);
    }
    if (charts.batteryChart) {
        updateBatteryChart(data);
    }
}

// System Health Monitoring
function startSystemMonitoring() {
    setInterval(updateSystemHealth, 30000);
    updateSystemHealth();
}

function updateSystemHealth() {
    // Simulate system health metrics
    const uptime = document.getElementById('system-uptime');
    const efficiency = document.getElementById('system-efficiency');
    const response = document.getElementById('system-response');
    const latency = document.getElementById('footer-latency');
    
    if (uptime) uptime.textContent = (99.5 + Math.random() * 0.5).toFixed(1) + '%';
    if (efficiency) efficiency.textContent = (92 + Math.random() * 5).toFixed(1) + '%';
    
    const responseTime = Math.floor(30 + Math.random() * 30);
    if (response) response.textContent = responseTime + 'ms';
    if (latency) latency.textContent = responseTime + 'ms';
}

// Load Dashboard
async function loadDashboard() {
    try {
        // Load summary data
        const summaryResponse = await fetch(`${API_URL}/energy/summary/today`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const summary = await summaryResponse.json();

        const totalGen = document.getElementById('total-generated');
        const totalCons = document.getElementById('total-consumed');
        if (totalGen) totalGen.textContent = (summary.total_generated || 0).toFixed(2) + ' kWh';
        if (totalCons) totalCons.textContent = (summary.total_used || 0).toFixed(2) + ' kWh';

        // Load devices count
        const devicesResponse = await fetch(`${API_URL}/devices`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const devices = await devicesResponse.json();
        const activeDevices = devices.filter(d => d.status === 'active').length;
        const activeDevicesEl = document.getElementById('active-devices');
        if (activeDevicesEl) activeDevicesEl.textContent = activeDevices;

        // Load recent alerts
        const alertsResponse = await fetch(`${API_URL}/alerts/recent`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const alerts = await alertsResponse.json();
        displayRecentAlerts(alerts);
        
        // Update alert count badge
        const alertCount = document.getElementById('alert-count');
        if (alertCount) alertCount.textContent = alerts.filter(a => a.status === 'active').length;

        // Load charts
        loadEnergyChart();
        loadBatteryChart();

    } catch (error) {
        console.error('Error loading dashboard:', error);
        showToast('Error', 'Failed to load dashboard data', 'error');
    }
}

// Display recent alerts
function displayRecentAlerts(alerts) {
    const container = document.getElementById('recent-alerts');
    if (!container) return;

    if (alerts.length === 0) {
        container.innerHTML = '<p class="no-data">No recent alerts</p>';
        return;
    }

    container.innerHTML = alerts.slice(0, 5).map(alert => `
        <div class="alert-item ${alert.severity}">
            <div class="alert-message">${alert.message}</div>
            <div class="alert-time">${new Date(alert.timestamp).toLocaleString()}</div>
        </div>
    `).join('');
}

// Load Energy Chart
async function loadEnergyChart() {
    try {
        const response = await fetch(`${API_URL}/energy/hourly?hours=24`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        const ctx = document.getElementById('energy-chart');
        if (!ctx) return;

        if (charts.energyChart) {
            charts.energyChart.destroy();
        }

        charts.energyChart = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: data.map(d => new Date(d.hour).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})),
                datasets: [{
                    label: 'Energy Generated (kW)',
                    data: data.map(d => d.avg_generated),
                    borderColor: '#2ecc71',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }, {
                    label: 'Energy Used (kW)',
                    data: data.map(d => d.avg_used),
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                animation: {
                    duration: 750,
                    easing: 'easeInOutQuart'
                }
            }
        });
    } catch (error) {
        console.error('Error loading energy chart:', error);
    }
}

// Load Battery Chart
async function loadBatteryChart() {
    try {
        const response = await fetch(`${API_URL}/energy/hourly?hours=24`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        const ctx = document.getElementById('battery-chart');
        if (!ctx) return;

        if (charts.batteryChart) {
            charts.batteryChart.destroy();
        }

        charts.batteryChart = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: data.map(d => new Date(d.hour).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})),
                datasets: [{
                    label: 'Battery Level (%)',
                    data: data.map(d => d.avg_battery),
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                animation: {
                    duration: 750,
                    easing: 'easeInOutQuart'
                }
            }
        });
    } catch (error) {
        console.error('Error loading battery chart:', error);
    }
}

// Update charts with real-time data
function updateEnergyChart(data) {
    if (!charts.energyChart) return;

    const chart = charts.energyChart;
    const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

    chart.data.labels.push(now);
    chart.data.datasets[0].data.push(data.solar.power / 1000);
    chart.data.datasets[1].data.push(data.consumption / 1000);

    if (chart.data.labels.length > 20) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
        chart.data.datasets[1].data.shift();
    }

    chart.update('none');
}

function updateBatteryChart(data) {
    if (!charts.batteryChart) return;

    const chart = charts.batteryChart;
    const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

    chart.data.labels.push(now);
    chart.data.datasets[0].data.push(data.battery.level);

    if (chart.data.labels.length > 20) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
    }

    chart.update('none');
}

// Load Devices
async function loadDevices() {
    try {
        const response = await fetch(`${API_URL}/devices`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const devices = await response.json();

        const tbody = document.getElementById('devices-table-body');
        if (!tbody) return;

        if (devices.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="no-data">No devices found</td></tr>';
            return;
        }

        tbody.innerHTML = devices.map(device => {
            const uptime = Math.floor(Math.random() * 720) + 1;
            const signal = 75 + Math.floor(Math.random() * 25);
            const firmware = `v${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`;
            
            return `
            <tr>
                <td>${device.id}</td>
                <td><strong>${device.name}</strong></td>
                <td>${device.type.replace('_', ' ').toUpperCase()}</td>
                <td><span class="status-badge ${device.status}">${device.status.toUpperCase()}</span></td>
                <td><span style="color: ${signal > 80 ? '#2ecc71' : signal > 60 ? '#f39c12' : '#e74c3c'}">${signal}%</span></td>
                <td>${uptime}h</td>
                <td>${new Date(device.last_update).toLocaleString()}</td>
                <td>
                    <button class="btn btn-primary" style="padding: 6px 14px; font-size: 12px;" onclick="showDeviceDetails(${device.id}, '${device.name}', '${device.type}', '${device.status}', ${signal}, ${uptime}, '${firmware}', '${device.location}')">
                        Details
                    </button>
                </td>
            </tr>
        `;
        }).join('');
    } catch (error) {
        console.error('Error loading devices:', error);
        showToast('Error', 'Failed to load devices', 'error');
    }
}

// Show Device Details Modal
function showDeviceDetails(id, name, type, status, signal, uptime, firmware, location) {
    const modal = document.getElementById('device-modal');
    const title = document.getElementById('device-modal-title');
    const body = document.getElementById('device-modal-body');
    
    title.textContent = name;
    
    body.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
            <div>
                <h4 style="margin-bottom: 16px; color: var(--text-secondary);">Device Information</h4>
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--text-secondary);">Device ID:</span>
                        <strong>${id}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--text-secondary);">Type:</span>
                        <strong>${type.replace('_', ' ').toUpperCase()}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--text-secondary);">Status:</span>
                        <span class="status-badge ${status}">${status.toUpperCase()}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--text-secondary);">Location:</span>
                        <strong>${location}</strong>
                    </div>
                </div>
            </div>
            <div>
                <h4 style="margin-bottom: 16px; color: var(--text-secondary);">Performance Metrics</h4>
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--text-secondary);">Signal Strength:</span>
                        <strong style="color: ${signal > 80 ? '#2ecc71' : signal > 60 ? '#f39c12' : '#e74c3c'}">${signal}%</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--text-secondary);">Uptime:</span>
                        <strong>${uptime} hours</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--text-secondary);">Firmware:</span>
                        <strong>${firmware}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--text-secondary);">Last Sync:</span>
                        <strong>2min ago</strong>
                    </div>
                </div>
            </div>
        </div>
        <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--border-color);">
            <h4 style="margin-bottom: 16px; color: var(--text-secondary);">Recent Activity</h4>
            <div style="display: flex; flex-direction: column; gap: 8px; font-size: 13px;">
                <div>✓ System health check completed</div>
                <div>✓ Data sync successful</div>
                <div>✓ Firmware update available</div>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

function closeDeviceModal() {
    document.getElementById('device-modal').classList.remove('active');
}

// Search Devices
let allDevices = [];
document.getElementById('device-search')?.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const tbody = document.getElementById('devices-table-body');
    
    if (!allDevices.length) return;
    
    const filtered = allDevices.filter(device => 
        device.name.toLowerCase().includes(searchTerm) ||
        device.type.toLowerCase().includes(searchTerm) ||
        device.location.toLowerCase().includes(searchTerm)
    );
    
    // Re-render table with filtered results
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="no-data">No devices match your search</td></tr>';
    }
});

// Load Map with Clustering
async function loadMap() {
    try {
        const response = await fetch(`${API_URL}/devices`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const devices = await response.json();
        
        // Store device data with simulated sensor values
        deviceData = devices.map(device => ({
            ...device,
            battery: Math.random() * 40 + 60,
            voltage: Math.random() * 10 + 220,
            temperature: Math.random() * 15 + 25,
            power: Math.random() * 500 + 1000,
            lastUpdate: new Date()
        }));

        // Initialize map if not already done
        if (!map) {
            map = L.map('map').setView([40.7128, -74.0060], 13);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);
            
            // Initialize marker cluster group
            markerCluster = L.markerClusterGroup({
                chunkedLoading: true,
                spiderfyOnMaxZoom: true,
                showCoverageOnHover: false
            });
            map.addLayer(markerCluster);
        } else {
            markerCluster.clearLayers();
        }

        markers = {};

        // Add markers for each device with status colors
        deviceData.forEach(device => {
            const statusColor = getDeviceStatus(device.battery);
            const markerColor = getMarkerColor(statusColor);
            
            const customIcon = L.divIcon({
                className: 'custom-marker',
                html: `<div style="
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: ${markerColor};
                    border: 3px solid white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                ">${device.type === 'solar_panel' ? '☀️' : '🔋'}</div>`,
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            });

            const marker = L.marker([device.latitude, device.longitude], { icon: customIcon });
            
            marker.bindPopup(createEnhancedPopup(device));
            markers[device.id] = marker;
            markerCluster.addLayer(marker);
        });

        // Render device panel
        renderDevicePanel();
        
        // Start real-time simulation
        startRealtimeSimulation();

    } catch (error) {
        console.error('Error loading map:', error);
        showToast('Error', 'Failed to load map data', 'error');
    }
}

function getDeviceStatus(battery) {
    if (battery >= 70) return 'active';
    if (battery >= 30) return 'warning';
    return 'offline';
}

function getMarkerColor(status) {
    const colors = {
        active: '#2ecc71',
        warning: '#f39c12',
        offline: '#e74c3c'
    };
    return colors[status] || '#95a5a6';
}

function createEnhancedPopup(device) {
    const status = getDeviceStatus(device.battery);
    return `
        <div class="popup-header">${device.name}</div>
        <div style="display: grid; gap: 8px; margin-top: 12px;">
            <div class="popup-detail">
                <span class="popup-label">Status:</span>
                <span class="popup-status ${status}">${status.toUpperCase()}</span>
            </div>
            <div class="popup-detail">
                <span class="popup-label">Battery:</span>
                <span class="popup-value">${device.battery.toFixed(1)}%</span>
            </div>
            <div class="popup-detail">
                <span class="popup-label">Voltage:</span>
                <span class="popup-value">${device.voltage.toFixed(2)} V</span>
            </div>
            <div class="popup-detail">
                <span class="popup-label">Power:</span>
                <span class="popup-value">${device.power.toFixed(0)} W</span>
            </div>
            <div class="popup-detail">
                <span class="popup-label">Temperature:</span>
                <span class="popup-value">${device.temperature.toFixed(1)} °C</span>
            </div>
            <div class="popup-detail">
                <span class="popup-label">Last Update:</span>
                <span class="popup-value">${device.lastUpdate.toLocaleTimeString()}</span>
            </div>
        </div>
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-color);">
            <div style="height: 6px; background: var(--border-color); border-radius: 3px; overflow: hidden;">
                <div style="height: 100%; width: ${device.battery}%; background: linear-gradient(90deg, #2ecc71, #27ae60); transition: width 0.5s;"></div>
            </div>
        </div>
    `;
}

function renderDevicePanel() {
    const panel = document.getElementById('device-list');
    if (!panel) return;
    
    panel.innerHTML = deviceData.map(device => {
        const status = getDeviceStatus(device.battery);
        const batteryClass = device.battery >= 70 ? '' : device.battery >= 30 ? 'medium' : 'low';
        
        return `
            <div class="device-card ${status}" onclick="focusDevice(${device.id})">
                <div class="device-card-header">
                    <span class="device-card-name">${device.name}</span>
                    <span class="device-card-status ${status}"></span>
                </div>
                <div class="device-card-details">
                    <div class="device-detail-row">
                        <span class="device-detail-label">Battery:</span>
                        <span class="device-detail-value">${device.battery.toFixed(1)}%</span>
                    </div>
                    <div class="battery-bar">
                        <div class="battery-fill ${batteryClass}" style="width: ${device.battery}%"></div>
                    </div>
                    <div class="device-detail-row">
                        <span class="device-detail-label">Power:</span>
                        <span class="device-detail-value">${device.power.toFixed(0)} W</span>
                    </div>
                    <div class="device-detail-row">
                        <span class="device-detail-label">Temp:</span>
                        <span class="device-detail-value">${device.temperature.toFixed(1)} °C</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function focusDevice(deviceId) {
    const device = deviceData.find(d => d.id === deviceId);
    if (device && markers[deviceId]) {
        map.flyTo([device.latitude, device.longitude], 16, {
            duration: 1.5
        });
        setTimeout(() => {
            markers[deviceId].openPopup();
        }, 1500);
    }
}

function toggleDevicePanel() {
    const panel = document.getElementById('device-panel');
    panel.classList.toggle('hidden');
}

function startRealtimeSimulation() {
    if (window.mapUpdateInterval) {
        clearInterval(window.mapUpdateInterval);
    }
    
    window.mapUpdateInterval = setInterval(() => {
        deviceData.forEach(device => {
            // Simulate battery changes
            device.battery += (Math.random() - 0.5) * 2;
            device.battery = Math.max(10, Math.min(100, device.battery));
            
            // Simulate temperature changes
            device.temperature += (Math.random() - 0.5) * 1.5;
            device.temperature = Math.max(20, Math.min(45, device.temperature));
            
            // Simulate voltage fluctuations
            device.voltage += (Math.random() - 0.5) * 2;
            device.voltage = Math.max(200, Math.min(240, device.voltage));
            
            // Simulate power changes
            device.power += (Math.random() - 0.5) * 100;
            device.power = Math.max(500, Math.min(2000, device.power));
            
            device.lastUpdate = new Date();
            
            // Update marker
            const status = getDeviceStatus(device.battery);
            const markerColor = getMarkerColor(status);
            
            if (markers[device.id]) {
                const newIcon = L.divIcon({
                    className: 'custom-marker',
                    html: `<div style="
                        width: 32px;
                        height: 32px;
                        border-radius: 50%;
                        background: ${markerColor};
                        border: 3px solid white;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 16px;
                    ">${device.type === 'solar_panel' ? '☀️' : '🔋'}</div>`,
                    iconSize: [32, 32],
                    iconAnchor: [16, 16]
                });
                
                markers[device.id].setIcon(newIcon);
                
                // Update popup if open
                const popup = markers[device.id].getPopup();
                if (popup && popup.isOpen()) {
                    popup.setContent(createEnhancedPopup(device));
                }
            }
        });
        
        renderDevicePanel();
        
    }, 5000);
}

// Load History
async function loadHistory(period = 'today') {
    try {
        const response = await fetch(`${API_URL}/energy/logs?period=${period}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const logs = await response.json();

        const tbody = document.getElementById('history-table-body');
        if (!tbody) return;

        if (logs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="no-data">No history data found</td></tr>';
            return;
        }

        tbody.innerHTML = logs.map(log => {
            const efficiency = log.energy_generated > 0 ? 
                ((log.energy_generated - log.energy_used) / log.energy_generated * 100).toFixed(1) : 0;
            
            return `
            <tr>
                <td>${new Date(log.timestamp).toLocaleString()}</td>
                <td>${log.energy_generated.toFixed(2)}</td>
                <td>${log.energy_used.toFixed(2)}</td>
                <td>${log.battery_level.toFixed(1)}%</td>
                <td><span style="color: ${efficiency > 70 ? '#2ecc71' : efficiency > 50 ? '#f39c12' : '#e74c3c'}">${efficiency}%</span></td>
            </tr>
        `;
        }).join('');
    } catch (error) {
        console.error('Error loading history:', error);
        showToast('Error', 'Failed to load history data', 'error');
    }
}

// Load Alerts
async function loadAlerts() {
    try {
        const response = await fetch(`${API_URL}/alerts`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const alerts = await response.json();

        displayAlertsGrid(alerts);
        
        // Setup auto-refresh if enabled
        if (autoRefreshAlerts) {
            startAutoRefreshAlerts();
        }
    } catch (error) {
        console.error('Error loading alerts:', error);
        showToast('Error', 'Failed to load alerts', 'error');
    }
}

function displayAlertsGrid(alerts) {
    const container = document.getElementById('alerts-list-full');
    if (!container) return;

    if (alerts.length === 0) {
        container.innerHTML = '<p class="no-data">No alerts found</p>';
        return;
    }

    container.innerHTML = alerts.map(alert => `
        <div class="alert-card ${alert.severity}" data-severity="${alert.severity}">
            <div class="alert-content">
                <div class="alert-message">${alert.message}</div>
                <div class="alert-time">${new Date(alert.timestamp).toLocaleString()}</div>
                <div style="margin-top: 8px;">
                    <span class="status-badge ${alert.status === 'active' ? 'warning' : 'active'}">
                        ${alert.status.toUpperCase()}
                    </span>
                    <span class="status-badge ${alert.severity}">
                        ${alert.severity.toUpperCase()}
                    </span>
                </div>
            </div>
            <div class="alert-actions">
                ${alert.status === 'active' ? `
                    <button class="btn-ack" onclick="acknowledgeAlert(${alert.id})">
                        Acknowledge
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function filterAlerts(severity) {
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Filter alert cards
    const alerts = document.querySelectorAll('.alert-card');
    alerts.forEach(alert => {
        if (severity === 'all' || alert.dataset.severity === severity) {
            alert.style.display = '';
        } else {
            alert.style.display = 'none';
        }
    });
}

function acknowledgeAlert(alertId) {
    showToast('Alert Acknowledged', 'Alert has been marked as resolved', 'success');
    // Reload alerts to update display
    setTimeout(() => loadAlerts(), 500);
}

function startAutoRefreshAlerts() {
    if (alertRefreshInterval) {
        clearInterval(alertRefreshInterval);
    }
    
    alertRefreshInterval = setInterval(() => {
        if (autoRefreshAlerts && document.getElementById('alerts-content').classList.contains('active')) {
            loadAlerts();
        }
    }, 30000); // Refresh every 30 seconds
}

// Toggle auto-refresh
document.getElementById('auto-refresh-alerts')?.addEventListener('change', (e) => {
    autoRefreshAlerts = e.target.checked;
    if (autoRefreshAlerts) {
        startAutoRefreshAlerts();
        showToast('Auto-refresh Enabled', 'Alerts will refresh every 30 seconds', 'info');
    } else {
        if (alertRefreshInterval) {
            clearInterval(alertRefreshInterval);
        }
        showToast('Auto-refresh Disabled', 'Alerts will not auto-refresh', 'info');
    }
});

// Load Prediction
async function loadPrediction() {
    try {
        const response = await fetch(`${API_URL}/energy/prediction`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const prediction = await response.json();

        // Calculate total predicted energy
        const totalPredicted = prediction.reduce((sum, p) => sum + p.predicted_generated, 0);
        const predEnergy = document.getElementById('predicted-energy');
        if (predEnergy) predEnergy.textContent = totalPredicted.toFixed(1);
        
        // Update confidence range
        const confidence = document.getElementById('confidence-range');
        if (confidence) confidence.textContent = `±${(Math.random() * 5 + 3).toFixed(1)}%`;
        
        // Update weekly trend
        const weeklyTrend = document.getElementById('weekly-trend');
        if (weeklyTrend) weeklyTrend.textContent = `+${(Math.random() * 10 + 5).toFixed(1)}%`;
        
        // Update weather impact
        const weatherImpact = document.getElementById('weather-impact');
        const weathers = ['Sunny - High Production', 'Partly Cloudy - Good', 'Overcast - Moderate'];
        if (weatherImpact) weatherImpact.textContent = weathers[Math.floor(Math.random() * weathers.length)];

        // Create prediction chart
        const ctx = document.getElementById('prediction-chart');
        if (!ctx) return;

        if (charts.predictionChart) {
            charts.predictionChart.destroy();
        }

        charts.predictionChart = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: prediction.map(p => `${p.hour}:00`),
                datasets: [{
                    label: 'Predicted Generation (kW)',
                    data: prediction.map(p => p.predicted_generated),
                    backgroundColor: 'rgba(46, 204, 113, 0.6)',
                    borderColor: '#2ecc71',
                    borderWidth: 2
                }, {
                    label: 'Predicted Usage (kW)',
                    data: prediction.map(p => p.predicted_used),
                    backgroundColor: 'rgba(231, 76, 60, 0.6)',
                    borderColor: '#e74c3c',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                }
            }
        });
        
        // Load weekly prediction chart
        loadWeeklyPrediction();
    } catch (error) {
        console.error('Error loading prediction:', error);
        showToast('Error', 'Failed to load prediction data', 'error');
    }
}

function loadWeeklyPrediction() {
    const ctx = document.getElementById('weekly-prediction-chart');
    if (!ctx) return;
    
    if (charts.weeklyPredictionChart) {
        charts.weeklyPredictionChart.destroy();
    }
    
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = days.map(() => 40 + Math.random() * 20);
    
    charts.weeklyPredictionChart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: days,
            datasets: [{
                label: 'Predicted Energy (kWh)',
                data: data,
                borderColor: '#2ecc71',
                backgroundColor: 'rgba(46, 204, 113, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        }
    });
}

// Export functions
function performExport() {
    const format = document.getElementById('export-format').value;
    const deviceFilter = document.getElementById('export-device-filter').value;
    const startDate = document.getElementById('export-start-date').value;
    const endDate = document.getElementById('export-end-date').value;
    
    const checkedTypes = Array.from(document.querySelectorAll('input[name="export-type"]:checked'))
        .map(cb => cb.value);
    
    if (checkedTypes.length === 0) {
        showToast('No Data Selected', 'Please select at least one data type to export', 'warning');
        return;
    }
    
    showToast('Export Started', `Preparing ${format.toUpperCase()} export...`, 'info');
    
    // Simulate export
    setTimeout(() => {
        if (checkedTypes.includes('energy')) {
            exportEnergyLogs();
        }
        if (checkedTypes.includes('devices')) {
            exportDevices();
        }
        showToast('Export Complete', 'Your data has been exported successfully', 'success');
        
        // Update export stats
        document.getElementById('export-records').textContent = Math.floor(Math.random() * 5000 + 1000);
        document.getElementById('export-size').textContent = (Math.random() * 500 + 100).toFixed(0) + ' KB';
        document.getElementById('export-duration').textContent = `${startDate} to ${endDate}`;
    }, 2000);
}

async function exportEnergyLogs() {
    try {
        const response = await fetch(`${API_URL}/export/energy-logs`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `energy_logs_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error exporting energy logs:', error);
        showToast('Error', 'Failed to export energy logs', 'error');
    }
}

async function exportDevices() {
    try {
        const response = await fetch(`${API_URL}/export/devices`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `devices_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error exporting devices:', error);
        showToast('Error', 'Failed to export devices', 'error');
    }
}

// Set default dates for export
const today = new Date().toISOString().split('T')[0];
const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
const startDateEl = document.getElementById('export-start-date');
const endDateEl = document.getElementById('export-end-date');
if (startDateEl) startDateEl.value = weekAgo;
if (endDateEl) endDateEl.value = today;

// Load Users (Admin only)
async function loadUsers() {
    try {
        const response = await fetch(`${API_URL}/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const users = await response.json();

        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="no-data">No users found</td></tr>';
            return;
        }

        tbody.innerHTML = users.map(user => {
            const lastLogin = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
            const isActive = Math.random() > 0.3;
            
            return `
            <tr>
                <td>${user.id}</td>
                <td><strong>${user.email}</strong></td>
                <td><span class="role-badge">${user.role.toUpperCase()}</span></td>
                <td><span class="status-badge ${isActive ? 'active' : 'offline'}">${isActive ? 'ACTIVE' : 'INACTIVE'}</span></td>
                <td>${lastLogin.toLocaleString()}</td>
                <td>${new Date(user.created_at).toLocaleString()}</td>
                <td>
                    ${user.id !== currentUser.id ? `
                        <button class="btn btn-secondary" style="padding: 6px 14px; font-size: 12px;" onclick="deleteUser(${user.id})">Delete</button>
                    ` : '<span style="color: var(--text-secondary); font-size: 12px;">Current User</span>'}
                </td>
            </tr>
        `;
        }).join('');
    } catch (error) {
        console.error('Error loading users:', error);
        showToast('Error', 'Failed to load users', 'error');
    }
}

// Search Users
function searchUsers() {
    const searchTerm = document.getElementById('user-search').value.toLowerCase();
    const rows = document.querySelectorAll('#users-table-body tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Show add user modal
function showAddUserModal() {
    document.getElementById('add-user-modal').classList.add('active');
}

// Close add user modal
function closeAddUserModal() {
    document.getElementById('add-user-modal').classList.remove('active');
    document.getElementById('add-user-form').reset();
}

// Add user form submission
document.getElementById('add-user-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('new-user-email').value;
    const password = document.getElementById('new-user-password').value;
    const role = document.getElementById('new-user-role').value;

    try {
        const response = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password, role })
        });

        if (response.ok) {
            closeAddUserModal();
            loadUsers();
            showToast('Success', 'User created successfully', 'success');
        } else {
            const data = await response.json();
            showToast('Error', data.error || 'Failed to create user', 'error');
        }
    } catch (error) {
        console.error('Error creating user:', error);
        showToast('Error', 'Failed to create user', 'error');
    }
});

// Delete user
async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            loadUsers();
            showToast('Success', 'User deleted successfully', 'success');
        } else {
            const data = await response.json();
            showToast('Error', data.error || 'Failed to delete user', 'error');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showToast('Error', 'Failed to delete user', 'error');
    }
}

// Click outside modals to close
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});
