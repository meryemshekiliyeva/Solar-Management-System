const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'solar_system.db'), (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

function initializeDatabase() {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Devices table
    db.run(`CREATE TABLE IF NOT EXISTS devices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        location TEXT,
        latitude REAL,
        longitude REAL,
        last_update DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Energy logs table
    db.run(`CREATE TABLE IF NOT EXISTS energy_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME NOT NULL,
        energy_generated REAL NOT NULL,
        energy_used REAL NOT NULL,
        battery_level REAL NOT NULL
    )`);

    // Alerts table
    db.run(`CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message TEXT NOT NULL,
        severity TEXT NOT NULL,
        timestamp DATETIME NOT NULL,
        status TEXT NOT NULL
    )`);

    // Insert default admin user
    const defaultPassword = bcrypt.hashSync('admin123', 10);
    db.run(`INSERT OR IGNORE INTO users (email, password, role) VALUES (?, ?, ?)`,
        ['admin@university.edu', defaultPassword, 'admin']
    );

    // Insert sample devices
    const devices = [
        ['Solar Panel 1', 'solar_panel', 'active', 'Engineering Building', 40.7128, -74.0060],
        ['Solar Panel 2', 'solar_panel', 'active', 'Science Building', 40.7138, -74.0070],
        ['Solar Panel 3', 'solar_panel', 'active', 'Library', 40.7148, -74.0080],
        ['Battery Storage 1', 'battery', 'active', 'Main Campus', 40.7158, -74.0090],
        ['Battery Storage 2', 'battery', 'active', 'East Campus', 40.7168, -74.0100]
    ];

    devices.forEach(device => {
        db.run(`INSERT OR IGNORE INTO devices (name, type, status, location, latitude, longitude) 
                VALUES (?, ?, ?, ?, ?, ?)`, device);
    });

    // Insert sample energy logs for the past 7 days
    const now = new Date();
    for (let i = 0; i < 168; i++) { // 7 days * 24 hours
        const timestamp = new Date(now - i * 60 * 60 * 1000);
        const hour = timestamp.getHours();
        const solarMultiplier = (hour >= 6 && hour <= 18) ? Math.sin((hour - 6) * Math.PI / 12) : 0;
        
        const energyGenerated = (2 + Math.random() * 3) * solarMultiplier;
        const energyUsed = 0.8 + Math.random() * 0.4;
        const batteryLevel = 60 + Math.random() * 30;
        
        db.run(`INSERT INTO energy_logs (timestamp, energy_generated, energy_used, battery_level) 
                VALUES (?, ?, ?, ?)`,
            [timestamp.toISOString(), energyGenerated, energyUsed, batteryLevel]
        );
    }

    console.log('Database initialized with sample data');
    console.log('Default login: admin@university.edu / admin123');
}

module.exports = db;

