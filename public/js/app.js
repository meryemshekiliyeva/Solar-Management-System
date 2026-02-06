// Global variables
const API_URL = 'http://localhost:3000/api';
let token = localStorage.getItem('token');
let currentUser = null;
let ws = null;
let charts = {};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
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
            showApp();
        } else {
            errorDiv.textContent = data.error || 'Login failed';
        }
    } catch (error) {
        errorDiv.textContent = 'Connection error. Please try again.';
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
    document.querySelector(`[data-page="${page}"]`).classList.add('active');
    
    // Update active content page
    document.querySelectorAll('.content-page').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${page}-content`).classList.add('active');
    
    // Update page title
    const titles = {
        dashboard: 'Dashboard',
        devices: 'Devices',
        map: 'Map',
        history: 'History',
        alerts: 'Alerts',
        prediction: 'Energy Prediction',
        export: 'Export Data',
        users: 'User Management'
    };
    document.getElementById('page-title').textContent = titles[page];
    
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
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'sensor_update') {
            updateRealtimeData(data);
        }
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
        console.log('WebSocket disconnected. Reconnecting...');
        setTimeout(initWebSocket, 5000);
    };
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

        document.getElementById('total-generated').textContent = (summary.total_generated || 0).toFixed(2) + ' kWh';
        document.getElementById('total-consumed').textContent = (summary.total_used || 0).toFixed(2) + ' kWh';

        // Load devices count
        const devicesResponse = await fetch(`${API_URL}/devices`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const devices = await devicesResponse.json();
        const activeDevices = devices.filter(d => d.status === 'active').length;
        document.getElementById('active-devices').textContent = activeDevices;

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
    }
}

// Display recent alerts
function displayRecentAlerts(alerts) {
    const container = document.getElementById('recent-alerts');

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

// Load Devices
async function loadDevices() {
    try {
        const response = await fetch(`${API_URL}/devices`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const devices = await response.json();

        const tbody = document.getElementById('devices-table-body');

        if (devices.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="no-data">No devices found</td></tr>';
            return;
        }

        tbody.innerHTML = devices.map(device => `
            <tr>
                <td>${device.id}</td>
                <td>${device.name}</td>
                <td>${device.type.replace('_', ' ').toUpperCase()}</td>
                <td><span class="status-badge ${device.status}">${device.status}</span></td>
                <td>${device.location}</td>
                <td>${new Date(device.last_update).toLocaleString()}</td>
                <td>
                    <button class="btn btn-primary" onclick="toggleDevice(${device.id}, '${device.status}')">
                        ${device.status === 'active' ? 'Turn Off' : 'Turn On'}
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading devices:', error);
    }
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
async function loadMap() {
    try {
        const response = await fetch(`${API_URL}/devices`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const devices = await response.json();

        // Initialize map if not already done
        if (!map) {
            map = L.map('map').setView([40.7128, -74.0060], 13);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);
        }

        // Clear existing markers
        map.eachLayer((layer) => {
            if (layer instanceof L.Marker) {
                map.removeLayer(layer);
            }
        });

        // Add markers for each device
        devices.forEach(device => {
            const icon = device.type === 'solar_panel' ? '☀️' : '🔋';
            const color = device.status === 'active' ? 'green' : 'red';

            const marker = L.marker([device.latitude, device.longitude]).addTo(map);
            marker.bindPopup(`
                <b>${icon} ${device.name}</b><br>
                Type: ${device.type.replace('_', ' ')}<br>
                Status: <span style="color: ${color}">${device.status}</span><br>
                Location: ${device.location}
            `);
        });

    } catch (error) {
        console.error('Error loading map:', error);
    }
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

        const container = document.getElementById('alerts-list-full');

        if (alerts.length === 0) {
            container.innerHTML = '<p class="no-data">No alerts found</p>';
            return;
        }

        container.innerHTML = alerts.map(alert => `
            <div class="alert-item ${alert.severity}">
                <div class="alert-message">${alert.message}</div>
                <div class="alert-time">${new Date(alert.timestamp).toLocaleString()} - Status: ${alert.status}</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading alerts:', error);
    }
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
        const response = await fetch(`${API_URL}/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const users = await response.json();

        const tbody = document.getElementById('users-table-body');

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="no-data">No users found</td></tr>';
            return;
        }

        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.email}</td>
                <td><span class="badge">${user.role}</span></td>
                <td>${new Date(user.created_at).toLocaleString()}</td>
                <td>
                    ${user.id !== currentUser.id ? `
                        <button class="btn btn-secondary" onclick="deleteUser(${user.id})">Delete</button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading users:', error);
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
            closeAddUserModal();
            loadUsers();
        } else {
            const data = await response.json();
            alert(data.error || 'Failed to create user');
        }
    } catch (error) {
        console.error('Error creating user:', error);
        alert('Failed to create user');
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
        } else {
            const data = await response.json();
            alert(data.error || 'Failed to delete user');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
    }
}

