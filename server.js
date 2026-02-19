const express = require('express');
const cors = require('cors');
const path = require('path');
const WebSocket = require('ws');
const http = require('http');
const next = require('next');
const db = require('./database/db');
const authRoutes = require('./routes/auth');
const deviceRoutes = require('./routes/devices');
const energyRoutes = require('./routes/energy');
const alertRoutes = require('./routes/alerts');
const userRoutes = require('./routes/users');
const exportRoutes = require('./routes/export');
const universityRoutes = require('./routes/universities');

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev, dir: __dirname });
const handle = nextApp.getRequestHandler();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Prepare Next.js
nextApp.prepare().then(() => {
    // Middleware
    app.use(cors());
    app.use(express.json());

    // API Routes (must come before static files)
    app.use('/api/auth', authRoutes);
    app.use('/api/devices', deviceRoutes);
    app.use('/api/energy', energyRoutes);
    app.use('/api/alerts', alertRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/export', exportRoutes);
    app.use('/api/universities', universityRoutes);

    // Serve public folder for CSS, JS, images
    app.use(express.static(path.join(__dirname, 'public')));
    
    // Next.js login page - NEW appearance only
    app.get('/login', (req, res) => {
        return nextApp.render(req, res, '/login');
    });

    // Main dashboard - serves the OLD index.html with all functionality
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    // Let Next.js handle all other routes
    app.all('*', (req, res) => {
        return handle(req, res);
    });

    // WebSocket connection for real-time data
    wss.on('connection', (ws) => {
        console.log('Client connected to WebSocket');
        
        ws.on('close', () => {
            console.log('Client disconnected');
        });
    });

    // Broadcast real-time data to all connected clients
    function broadcastData(data) {
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    }

    // IoT Sensor Data Simulation
    function simulateSensorData() {
        const timestamp = new Date().toISOString();
        
        // Simulate solar panel data
        const hour = new Date().getHours();
        const solarMultiplier = (hour >= 6 && hour <= 18) ? Math.sin((hour - 6) * Math.PI / 12) : 0;
        
        const solarData = {
            voltage: (220 + Math.random() * 20) * solarMultiplier,
            current: (10 + Math.random() * 5) * solarMultiplier,
            temperature: 25 + Math.random() * 15,
            power: 0
        };
        solarData.power = solarData.voltage * solarData.current;
        
        // Simulate battery data
        const batteryLevel = 60 + Math.random() * 30;
        
        const realtimeData = {
            type: 'sensor_update',
            timestamp,
            solar: solarData,
            battery: {
                level: batteryLevel,
                voltage: 48 + Math.random() * 4,
                charging: solarData.power > 1000
            },
            consumption: 800 + Math.random() * 400
        };
        
        // Broadcast to WebSocket clients
        broadcastData(realtimeData);
        
        // Store energy data in database for all universities
        const energyGenerated = solarData.power / 1000; // Convert to kW
        const energyUsed = realtimeData.consumption / 1000;
        
        // Insert for BMU (university_id = 1)
        db.run(`INSERT INTO energy_logs (timestamp, energy_generated, energy_used, battery_level, university_id) 
                VALUES (?, ?, ?, ?, ?)`,
            [timestamp, energyGenerated, energyUsed, batteryLevel, 1]
        );
        
        // Insert for ADU (university_id = 2) with slightly different values
        const energyGeneratedADU = energyGenerated * 0.85;
        const energyUsedADU = energyUsed * 0.9;
        const batteryLevelADU = batteryLevel * 0.95;
        
        db.run(`INSERT INTO energy_logs (timestamp, energy_generated, energy_used, battery_level, university_id) 
                VALUES (?, ?, ?, ?, ?)`,
            [timestamp, energyGeneratedADU, energyUsedADU, batteryLevelADU, 2]
        );
        
        // Check for alerts
        if (batteryLevel < 20) {
            db.run(`INSERT INTO alerts (message, severity, timestamp, status) 
                    VALUES (?, ?, ?, ?)`,
                ['Battery level critically low', 'high', timestamp, 'active']
            );
        }
        
        if (solarData.temperature > 35) {
            db.run(`INSERT INTO alerts (message, severity, timestamp, status) 
                    VALUES (?, ?, ?, ?)`,
                ['Solar panel temperature high', 'medium', timestamp, 'active']
            );
        }
    }

    // Start sensor simulation (every 5 seconds)
    setInterval(simulateSensorData, 5000);

    // Start server
    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => {
        console.log(`🚀 Unified server running on port ${PORT}`);
        console.log(`📡 API available at http://localhost:${PORT}/api`);
        console.log(`🌐 New login at http://localhost:${PORT}/login`);
        console.log(`📊 Old dashboard at http://localhost:${PORT}/`);
    });

    module.exports = { broadcastData };
}).catch((err) => {
    console.error('Error starting Next.js:', err);
    process.exit(1);
});

