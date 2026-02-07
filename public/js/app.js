// Global variables
const API_URL = 'http://localhost:3000/api';
let token = localStorage.getItem('token');
let currentUser = null;
let ws = null;
let charts = {};
let alertsAutoRefresh = null;
let currentAlertFilter = 'all';

// Toast notification system
function showToast(title, message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
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
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon();
    
    // Setup theme toggle
    document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
    
    // Setup sidebar toggle
    document.getElementById('sidebar-toggle')?.addEventListener('click', toggleSidebar);
    
    if (token) {
        verifyTokenAndLoadApp();
    } else {
        showLoginPage();
    }
});

// Theme toggle
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon();
    showToast('Theme Changed', `Switched to ${newTheme} mode`, 'success');
}

function updateThemeIcon() {
    const icon = document.getElementById('theme-icon');
    if (!icon) return;
    const theme = document.documentElement.getAttribute('data-theme');
    icon.textContent = theme === 'light' ? '🌙' : '☀️';
}

// Sidebar toggle
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar?.classList.toggle('collapsed');
    localStorage.setItem('sidebarCollapsed', sidebar?.classList.contains('collapsed'));
}

// Restore sidebar state
function restoreSidebarState() {
    const collapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (collapsed) {
        document.getElementById('sidebar')?.classList.add('collapsed');
    }
}

// Auth form switching
function showAuthForm(type) {
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form-container');
    const registerForm = document.getElementById('register-form-container');
    const authMessage = document.getElementById('auth-message');
    
    authMessage.style.display = 'none';
    authMessage.className = 'auth-message';
    
    if (type === 'login') {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
    } else {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
    }
}

// Register functionality
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fullName = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-password-confirm').value;
    const authMessage = document.getElementById('auth-message');
    
    if (password !== confirmPassword) {
        authMessage.className = 'auth-message error';
        authMessage.innerHTML = 'Passwords do not match';
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, fullName })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authMessage.className = 'auth-message success';
            authMessage.innerHTML = `
                ✅ Registration successful!<br>
                Your account is pending admin approval. You will be notified via email when approved.<br>
                <strong>Contact:</strong> <a href="mailto:admin@university.edu">admin@university.edu</a>
            `;
            document.getElementById('register-form').reset();
        } else {
            authMessage.className = 'auth-message error';
            authMessage.textContent = data.error || 'Registration failed';
        }
    } catch (error) {
        authMessage.className = 'auth-message error';
        authMessage.textContent = 'Connection error. Please try again.';
    }
});

// Login functionality
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const authMessage = document.getElementById('auth-message');
    
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
            showToast('Login Successful', `Welcome back, ${data.user.email}!`, 'success');
            showApp();
        } else if (response.status === 403) {
            authMessage.className = 'auth-message warning';
            authMessage.innerHTML = `
                ⏳ <strong>Account Pending Approval</strong><br>
                Your account (${data.email}) is awaiting admin approval.<br>
                Please contact the administrator: <a href="mailto:admin@university.edu?subject=Account Approval Request&body=Hello, I am requesting approval for my account: ${data.email}">admin@university.edu</a>
            `;
        } else {
            authMessage.className = 'auth-message error';
            authMessage.textContent = data.error || 'Login failed';
        }
    } catch (error) {
        authMessage.className = 'auth-message error';
        authMessage.textContent = 'Connection error. Please try again.';
    }
});

// Logout
document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('token');
    token = null;
    currentUser = null;
    if (ws) ws.close();
    location.reload();
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
    document.getElementById('user-role').textContent = currentUser.role;
    document.getElementById('user-avatar').textContent = currentUser.email.charAt(0).toUpperCase();
    
    // Restore sidebar state
    restoreSidebarState();
    
    // Update last update time
    updateLastUpdateTime();
    setInterval(updateLastUpdateTime, 60000);
    
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
}

// Update last update time
function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    const lastUpdate = document.getElementById('last-update');
    if (lastUpdate) {
        lastUpdate.textContent = timeString;
    }
}

// Update breadcrumb
function updateBreadcrumb(page) {
    const breadcrumb = document.getElementById('breadcrumb');
    if (!breadcrumb) return;
    
    const pageTitles = {
        dashboard: 'Dashboard',
        devices: 'Devices',
        map: 'Map View',
        history: 'History',
        alerts: 'Alerts',
        prediction: 'Prediction',
        export: 'Export',
        users: 'Users'
    };
    
    breadcrumb.innerHTML = `
        <span class="breadcrumb-item">Home</span>
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-item">${pageTitles[page]}</span>
    `;
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
    const navItem = document.querySelector(`[data-page="${page}"]`);
    if (navItem) navItem.classList.add('active');
    
    // Update active content page
    document.querySelectorAll('.content-page').forEach(content => {
        content.classList.remove('active');
    });
    const contentPage = document.getElementById(`${page}-content`);
    if (contentPage) contentPage.classList.add('active');
    
    // Update page title
    const titles = {
        dashboard: 'Dashboard',
        devices: 'Device Management',
        map: 'Map View',
        history: 'Energy History',
        alerts: 'System Alerts',
        prediction: 'Energy Prediction',
        export: 'Export Data',
        users: 'User Management'
    };
    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.textContent = titles[page];
    
    // Update breadcrumb
    updateBreadcrumb(page);
    
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
            startAlertsAutoRefresh();
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

// Update connection status indicator
function updateConnectionStatus(connected) {
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');
    
    if (statusDot && statusText) {
        if (connected) {
            statusDot.className = 'status-dot connected';
            statusText.textContent = 'Connected';
        } else {
            statusDot.className = 'status-dot disconnected';
            statusText.textContent = 'Disconnected';
        }
    }
}

// Update real-time data
function updateRealtimeData(data) {
    // Update live monitoring panel
    document.getElementById('live-voltage').textContent = data.solar.voltage.toFixed(2) + ' V';
    document.getElementById('live-current').textContent = data.solar.current.toFixed(2) + ' A';
    document.getElementById('live-temperature').textContent = data.solar.temperature.toFixed(1) + ' °C';
    document.getElementById('live-power').textContent = data.solar.power.toFixed(0) + ' W';

    // Update battery level card
    document.getElementById('battery-level').textContent = data.battery.level.toFixed(1) + '%';

    // Update charts if they exist
    if (charts.energyChart) {
        updateEnergyChart(data);
    }
    if (charts.batteryChart) {
        updateBatteryChart(data);
    }
}

// Load Dashboard
async function loadDashboard() {
    try {
        // Load summary data
        const summaryResponse = await fetch(`${API_URL}/energy/summary/today`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const summary = await summaryResponse.json();

        const generated = summary.total_generated || 0;
        const consumed = summary.total_used || 0;
        
        document.getElementById('total-generated').textContent = generated.toFixed(2) + ' kWh';
        document.getElementById('total-consumed').textContent = consumed.toFixed(2) + ' kWh';
        
        // Update progress bars
        const generatedPercent = Math.min((generated / 50) * 100, 100);
        const consumedPercent = Math.min((consumed / 50) * 100, 100);
        document.getElementById('generated-progress').style.width = generatedPercent + '%';
        document.getElementById('consumed-progress').style.width = consumedPercent + '%';

        // Load devices count
        const devicesResponse = await fetch(`${API_URL}/devices`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const devices = await devicesResponse.json();
        const activeDevices = devices.filter(d => d.status === 'active').length;
        const totalDevices = devices.length;
        
        document.getElementById('active-devices').textContent = activeDevices;
        document.getElementById('devices-online').textContent = `${activeDevices}/${totalDevices}`;
        document.getElementById('device-count').textContent = totalDevices;
        
        const devicesPercent = (activeDevices / totalDevices) * 100;
        document.getElementById('devices-progress').style.width = devicesPercent + '%';

        // Load recent alerts
        const alertsResponse = await fetch(`${API_URL}/alerts/recent`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const alerts = await alertsResponse.json();
        displayRecentAlerts(alerts);

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

    if (alerts.length === 0) {
        container.innerHTML = '<p class="no-data">No recent alerts</p>';
        return;
    }

    container.innerHTML = alerts.slice(0, 5).map(alert => {
        const severityColors = {
            high: 'danger',
            medium: 'warning',
            low: 'info'
        };
        const badgeClass = severityColors[alert.severity] || 'info';
        
        return `
            <div class="card" style="padding: 16px; margin-bottom: 12px;">
                <div class="flex justify-between items-center mb-1">
                    <span class="badge ${badgeClass}">
                        <span class="badge-dot"></span>
                        ${alert.severity.toUpperCase()}
                    </span>
                    <span style="font-size: 12px; color: var(--text-tertiary);">
                        ${new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                </div>
                <div style="font-size: 14px; color: var(--text-primary); margin-top: 8px;">
                    ${alert.message}
                </div>
            </div>
        `;
    }).join('');
}

// Load Energy Chart
async function loadEnergyChart() {
    try {
        const response = await fetch(`${API_URL}/energy/hourly?hours=24`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        const ctx = document.getElementById('energy-chart').getContext('2d');

        if (charts.energyChart) {
            charts.energyChart.destroy();
        }

        charts.energyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => new Date(d.hour).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})),
                datasets: [{
                    label: 'Energy Generated (kW)',
                    data: data.map(d => d.avg_generated),
                    borderColor: '#2ecc71',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Energy Used (kW)',
                    data: data.map(d => d.avg_used),
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    tension: 0.4,
                    fill: true
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
                        beginAtZero: true
                    }
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

        const ctx = document.getElementById('battery-chart').getContext('2d');

        if (charts.batteryChart) {
            charts.batteryChart.destroy();
        }

        charts.batteryChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => new Date(d.hour).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})),
                datasets: [{
                    label: 'Battery Level (%)',
                    data: data.map(d => d.avg_battery),
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    tension: 0.4,
                    fill: true
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
                        max: 100
                    }
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

    // Add new data point
    chart.data.labels.push(now);
    chart.data.datasets[0].data.push(data.solar.power / 1000);
    chart.data.datasets[1].data.push(data.consumption / 1000);

    // Keep only last 20 points
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

// Update chart period
function updateChartPeriod(period) {
    // Update button states
    document.querySelectorAll('.chart-filters .filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Reload chart data
    loadEnergyChart();
    showToast('Chart Updated', `Showing ${period} data`, 'info');
}

// Load Devices
async function loadDevices() {
    try {
        const response = await fetch(`${API_URL}/devices`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const devices = await response.json();

        const tbody = document.getElementById('devices-table-body');

        if (devices.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="no-data">No devices found</td></tr>';
            return;
        }

        tbody.innerHTML = devices.map(device => {
            const statusBadge = device.status === 'active' ? 'success' : 'danger';
            const uptime = Math.floor(Math.random() * 30) + 1;
            const signal = Math.floor(Math.random() * 30) + 70;
            
            return `
                <tr>
                    <td>${device.id}</td>
                    <td><strong>${device.name}</strong></td>
                    <td>${device.type.replace('_', ' ').toUpperCase()}</td>
                    <td>
                        <span class="badge ${statusBadge}">
                            <span class="badge-dot"></span>
                            ${device.status.toUpperCase()}
                        </span>
                    </td>
                    <td>${signal}%</td>
                    <td>${uptime} days</td>
                    <td>${new Date(device.last_update).toLocaleString()}</td>
                    <td>
                        <button class="btn btn-primary" style="padding: 8px 16px; font-size: 13px;" onclick="showDeviceDetail(${device.id})">
                            View
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
        
        // Add search functionality
        const searchInput = document.getElementById('device-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const rows = tbody.querySelectorAll('tr');
                rows.forEach(row => {
                    const text = row.textContent.toLowerCase();
                    row.style.display = text.includes(searchTerm) ? '' : 'none';
                });
            });
        }
    } catch (error) {
        console.error('Error loading devices:', error);
        showToast('Error', 'Failed to load devices', 'error');
    }
}

// Show device detail modal
function showDeviceDetail(deviceId) {
    const modal = document.getElementById('device-detail-modal');
    const modalBody = document.getElementById('device-modal-body');
    
    // Simulate device details
    modalBody.innerHTML = `
        <div style="display: grid; gap: 20px;">
            <div class="card" style="padding: 16px;">
                <h4 style="margin-bottom: 16px; color: var(--text-primary);">Device Information</h4>
                <div style="display: grid; gap: 12px;">
                    <div style="display: flex; justify-between;">
                        <span style="color: var(--text-secondary);">Device ID:</span>
                        <strong>${deviceId}</strong>
                    </div>
                    <div style="display: flex; justify-between;">
                        <span style="color: var(--text-secondary);">Firmware:</span>
                        <strong>v2.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}</strong>
                    </div>
                    <div style="display: flex; justify-between;">
                        <span style="color: var(--text-secondary);">Signal Strength:</span>
                        <strong>${Math.floor(Math.random() * 30) + 70}%</strong>
                    </div>
                    <div style="display: flex; justify-between;">
                        <span style="color: var(--text-secondary);">Uptime:</span>
                        <strong>${Math.floor(Math.random() * 30) + 1} days</strong>
                    </div>
                </div>
            </div>
            <div class="card" style="padding: 16px;">
                <h4 style="margin-bottom: 16px; color: var(--text-primary);">Performance Metrics</h4>
                <div style="display: grid; gap: 12px;">
                    <div>
                        <div style="display: flex; justify-between; margin-bottom: 8px;">
                            <span style="color: var(--text-secondary);">Efficiency:</span>
                            <strong>94%</strong>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill success" style="width: 94%"></div>
                        </div>
                    </div>
                    <div>
                        <div style="display: flex; justify-between; margin-bottom: 8px;">
                            <span style="color: var(--text-secondary);">Health Score:</span>
                            <strong>89%</strong>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 89%"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

function closeDeviceModal() {
    document.getElementById('device-detail-modal').classList.remove('active');
}

// Toggle device status
async function toggleDevice(deviceId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'offline' : 'active';

    try {
        await fetch(`${API_URL}/devices/${deviceId}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });

        loadDevices();
    } catch (error) {
        console.error('Error toggling device:', error);
    }
}

// Load Map
let map = null;
let markers = {};
let deviceData = [];
let markerCluster = null;

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
                showCoverageOnHover: false,
                zoomToBoundsOnClick: true
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
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    background: ${markerColor};
                    border: 3px solid white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                "></div>`,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });

            const marker = L.marker([device.latitude, device.longitude], { icon: customIcon });
            
            marker.bindPopup(createPopupContent(device));
            markers[device.id] = marker;
            markerCluster.addLayer(marker);
        });

        // Render device  panel
        renderDevicePanel();
        
        // Start real-time simulation
        startRealtimeSimulation();

    } catch (error) {
        console.error('Error loading map:', error);
        showToast('Error', 'Failed to load map', 'error');
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

function createPopupContent(device) {
    const status = getDeviceStatus(device.battery);
    const statusColors = {
        active: 'success',
        warning: 'warning',
        offline: 'danger'
    };
    
    return `
        <div class="popup-container">
            <div class="popup-header">${device.name}</div>
            <div class="popup-details">
                <div class="popup-detail">
                    <span class="popup-label">Status:</span>
                    <span class="badge ${statusColors[status]}">
                        <span class="badge-dot"></span>
                        ${status.toUpperCase()}
                    </span>
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
                    <span class="popup-label">Temperature:</span>
                    <span class="popup-value">${device.temperature.toFixed(1)} °C</span>
                </div>
                <div class="popup-detail">
                    <span class="popup-label">Last Update:</span>
                    <span class="popup-value">${device.lastUpdate.toLocaleTimeString()}</span>
                </div>
            </div>
        </div>
    `;
}

function renderDevicePanel() {
    const panel = document.getElementById('device-list');
    
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
        map.flyTo([device.latitude, device.longitude], 15, {
            duration: 1.5
        });
        setTimeout(() => {
            markers[deviceId].openPopup();
        }, 1500);
    }
}

function startRealtimeSimulation() {
    // Clear existing interval if any
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
            
            device.lastUpdate = new Date();
            
            // Update marker color based on new battery level
            const status = getDeviceStatus(device.battery);
            const markerColor = getMarkerColor(status);
            
            if (markers[device.id]) {
                const newIcon = L.divIcon({
                    className: 'custom-marker',
                    html: `<div style="
                        width: 30px;
                        height: 30px;
                        border-radius: 50%;
                        background: ${markerColor};
                        border: 3px solid white;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    "></div>`,
                    iconSize: [30, 30],
                    iconAnchor: [15, 15]
                });
                
                markers[device.id].setIcon(newIcon);
                
                // Update popup if open
                const popup = markers[device.id].getPopup();
                if (popup && popup.isOpen()) {
                    popup.setContent(createPopupContent(device));
                }
                
                // Update marker in cluster if using clustering
                if (markerCluster) {
                    markerCluster.refreshClusters(markers[device.id]);
                }
            }
        });
        
        // Refresh device panel
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

        if (logs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="no-data">No history data found</td></tr>';
            return;
        }

        tbody.innerHTML = logs.map(log => `
            <tr>
                <td>${new Date(log.timestamp).toLocaleString()}</td>
                <td>${log.energy_generated.toFixed(2)}</td>
                <td>${log.energy_used.toFixed(2)}</td>
                <td>${log.battery_level.toFixed(1)}%</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

// Load Alerts
async function loadAlerts() {
    try {
        const response = await fetch(`${API_URL}/alerts`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const alerts = await response.json();

        displayFilteredAlerts(alerts);
    } catch (error) {
        console.error('Error loading alerts:', error);
        showToast('Error', 'Failed to load alerts', 'error');
    }
}

// Filter alerts
function filterAlerts(severity) {
    currentAlertFilter = severity;
    
    // Update filter buttons
    document.querySelectorAll('[id^="filter-"]').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`filter-${severity}`)?.classList.add('active');
    
    loadAlerts();
}

// Display filtered alerts
function displayFilteredAlerts(alerts) {
    const container = document.getElementById('alerts-list-full');
    
    // Filter based on current filter
    let filteredAlerts = alerts;
    if (currentAlertFilter !== 'all') {
        filteredAlerts = alerts.filter(a => a.severity === currentAlertFilter);
    }

    if (filteredAlerts.length === 0) {
        container.innerHTML = '<p class="no-data">No alerts found</p>';
        return;
    }

    container.innerHTML = filteredAlerts.map(alert => {
        const severityColors = {
            high: 'danger',
            medium: 'warning',
            low: 'info'
        };
        const badgeClass = severityColors[alert.severity] || 'info';
        
        return `
            <div class="card" style="padding: 20px; margin-bottom: 16px;">
                <div class="flex justify-between items-center mb-2">
                    <span class="badge ${badgeClass}">
                        <span class="badge-dot"></span>
                        ${alert.severity.toUpperCase()}
                    </span>
                    <span style="font-size: 13px; color: var(--text-tertiary);">
                        ${new Date(alert.timestamp).toLocaleString()}
                    </span>
                </div>
                <div style="font-size: 15px; color: var(--text-primary); margin: 12px 0; font-weight: 500;">
                    ${alert.message}
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <span style="font-size: 13px; color: var(--text-secondary);">Status: ${alert.status}</span>
                    ${alert.status === 'active' ? `
                        <button class="btn btn-success" style="padding: 6px 16px; font-size: 12px;" onclick="acknowledgeAlert(${alert.id})">
                            ✓ Acknowledge
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Acknowledge alert
function acknowledgeAlert(alertId) {
    showToast('Alert Acknowledged', 'Alert has been marked as resolved', 'success');
    setTimeout(loadAlerts, 500);
}

// Start alerts auto-refresh
function startAlertsAutoRefresh() {
    if (alertsAutoRefresh) {
        clearInterval(alertsAutoRefresh);
    }
    alertsAutoRefresh = setInterval(loadAlerts, 30000); // Refresh every 30 seconds
}

// Load Prediction
async function loadPrediction() {
    try {
        const response = await fetch(`${API_URL}/energy/prediction`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const prediction = await response.json();

        // Calculate total predicted energy
        const totalPredicted = prediction.reduce((sum, p) => sum + p.predicted_generated, 0);
        document.getElementById('predicted-energy').textContent = totalPredicted.toFixed(2) + ' kWh';

        // Create prediction chart
        const ctx = document.getElementById('prediction-chart').getContext('2d');

        if (charts.predictionChart) {
            charts.predictionChart.destroy();
        }

        charts.predictionChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: prediction.map(p => `${p.hour}:00`),
                datasets: [{
                    label: 'Predicted Generation (kW)',
                    data: prediction.map(p => p.predicted_generated),
                    backgroundColor: 'rgba(46, 204, 113, 0.6)',
                    borderColor: '#2ecc71',
                    borderWidth: 1
                }, {
                    label: 'Predicted Usage (kW)',
                    data: prediction.map(p => p.predicted_used),
                    backgroundColor: 'rgba(231, 76, 60, 0.6)',
                    borderColor: '#e74c3c',
                    borderWidth: 1
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
                        beginAtZero: true
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading prediction:', error);
    }
}

// Export functions
async function exportEnergyLogs() {
    try {
        const response = await fetch(`${API_URL}/export/energy-logs`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'energy_logs.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error exporting energy logs:', error);
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
        a.download = 'devices.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error exporting devices:', error);
    }
}

// Load Users (Admin only)
async function loadUsers() {
    try {
        // Load pending users
        const pendingResponse = await fetch(`${API_URL}/users/pending`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const pendingUsers = await pendingResponse.json();
        
        // Display pending users
        const pendingList = document.getElementById('pending-users-list');
        const pendingCard = document.getElementById('pending-users-card');
        const pendingCount = document.getElementById('pending-count');
        
        pendingCount.textContent = pendingUsers.length;
        
        if (pendingUsers.length === 0) {
            pendingList.innerHTML = '<p class="no-data" style="padding: 20px;">No pending approvals</p>';
        } else {
            pendingList.innerHTML = pendingUsers.map(user => `
                <div class="pending-user-item">
                    <div class="pending-user-info">
                        <div class="pending-user-name">${user.full_name || 'N/A'}</div>
                        <div class="pending-user-email">
                            📧 ${user.email} • 
                            Registered: ${new Date(user.created_at).toLocaleDateString()}
                        </div>
                    </div>
                    <div class="pending-user-actions">
                        <a href="mailto:${user.email}" class="btn btn-secondary" style="padding: 8px 16px; font-size: 13px;">
                            📧 Contact
                        </a>
                        <button class="btn btn-success" style="padding: 8px 16px; font-size: 13px;" onclick="approveUser(${user.id})">
                            ✓ Approve
                        </button>
                        <button class="btn btn-danger" style="padding: 8px 16px; font-size: 13px;" onclick="rejectUser(${user.id})">
                            ✗ Reject
                        </button>
                    </div>
                </div>
            `).join('');
        }
        
        // Load all users
        const response = await fetch(`${API_URL}/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const users = await response.json();

        const tbody = document.getElementById('users-table-body');

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="no-data">No users found</td></tr>';
            return;
        }

        tbody.innerHTML = users.map(user => {
            const roleColor = user.role === 'admin' ? 'danger' : 'info';
            const statusBadge = user.approved ? 
                '<span class="badge success"><span class="badge-dot"></span>APPROVED</span>' :
                '<span class="badge warning"><span class="badge-dot"></span>PENDING</span>';
            
            return `
                <tr>
                    <td>${user.id}</td>
                    <td><strong>${user.full_name || 'N/A'}</strong></td>
                    <td>${user.email}</td>
                    <td>
                        <span class="badge ${roleColor}">
                            <span class="badge-dot"></span>
                            ${user.role.toUpperCase()}
                        </span>
                    </td>
                    <td>${statusBadge}</td>
                    <td>${new Date(user.created_at).toLocaleString()}</td>
                    <td>
                        ${user.id !== currentUser.id ? `
                            ${!user.approved ? `
                                <button class="btn btn-success" style="padding: 8px 16px; font-size: 13px; margin-right: 4px;" onclick="approveUser(${user.id})">
                                    Approve
                                </button>
                            ` : ''}
                            <button class="btn btn-danger" style="padding: 8px 16px; font-size: 13px;" onclick="deleteUser(${user.id})">
                                Delete
                            </button>
                        ` : '<span style="color: var(--text-tertiary); font-size: 13px;">Current User</span>'}
                    </td>
                </tr>
            `;
        }).join('');
        
        // Add search functionality
        const searchInput = document.getElementById('user-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const rows = tbody.querySelectorAll('tr');
                rows.forEach(row => {
                    const text = row.textContent.toLowerCase();
                    row.style.display = text.includes(searchTerm) ? '' : 'none';
                });
            });
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showToast('Error', 'Failed to load users', 'error');
    }
}

// Approve user
async function approveUser(userId) {
    try {
        const response = await fetch(`${API_URL}/users/${userId}/approve`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            showToast('Success', 'User approved successfully', 'success');
            loadUsers();
        } else {
            const data = await response.json();
            showToast('Error', data.error || 'Failed to approve user', 'error');
        }
    } catch (error) {
        console.error('Error approving user:', error);
        showToast('Error', 'Failed to approve user', 'error');
    }
}

// Reject user
async function rejectUser(userId) {
    if (!confirm('Are you sure you want to reject this user? This will permanently delete their account.')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/users/${userId}/reject`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            showToast('Success', 'User rejected and removed', 'success');
            loadUsers();
        } else {
            const data = await response.json();
            showToast('Error', data.error || 'Failed to reject user', 'error');
        }
    } catch (error) {
        console.error('Error rejecting user:', error);
        showToast('Error', 'Failed to reject user', 'error');
    }
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
            showToast('Success', 'User created successfully', 'success');
            closeAddUserModal();
            loadUsers();
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
            showToast('Success', 'User deleted successfully', 'success');
            loadUsers();
        } else {
            const data = await response.json();
            showToast('Error', data.error || 'Failed to delete user', 'error');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showToast('Error', 'Failed to delete user', 'error');
    }
}

