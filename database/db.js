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
    // Universities table
    db.run(`CREATE TABLE IF NOT EXISTS universities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        domain TEXT UNIQUE NOT NULL,
        code TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('Error creating universities table:', err);
            return;
        }
        
        // Insert sample universities
        const universities = [
            ['Baku Metropolitan University', 'bmu.edu.az', 'BMU'],
            ['Azerbaijan Diplomatic University', 'adu.edu.az', 'ADU'],
            ['Baku Engineering University', 'beu.edu.az', 'BEU']
        ];
        
        universities.forEach(uni => {
            db.run(`INSERT OR IGNORE INTO universities (name, domain, code) VALUES (?, ?, ?)`, uni);
        });
    });

    // Users table with university_id
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        full_name TEXT,
        university_id INTEGER,
        approved INTEGER DEFAULT 0,
        last_login DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (university_id) REFERENCES universities(id)
    )`, (err) => {
        if (err) {
            console.error('Error creating users table:', err);
            return;
        }
        
        // Insert default super admin user
        const superAdminPassword = bcrypt.hashSync('admin123', 10);
        db.run(`INSERT OR IGNORE INTO users (email, password, role, full_name, university_id, approved) VALUES (?, ?, ?, ?, ?, ?)`,
            ['admin@university.edu', superAdminPassword, 'super_admin', 'Super Administrator', null, 1],
            (err) => {
                if (err) console.error('Error inserting super admin:', err);
            }
        );
    });

    // Devices table with university_id and capacity
    db.run(`CREATE TABLE IF NOT EXISTS devices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        capacity REAL,
        location TEXT,
        latitude REAL,
        longitude REAL,
        university_id INTEGER,
        last_update DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (university_id) REFERENCES universities(id)
    )`, (err) => {
        if (err) {
            console.error('Error creating devices table:', err);
            return;
        }

        // Insert sample devices for BMU (university_id = 1)
        const devicesBMU = [
            ['Solar Panel 1', 'solar_panel', 'active', 5.5, 'Engineering Building', 40.7128, -74.0060, 1],
            ['Solar Panel 2', 'solar_panel', 'active', 4.8, 'Science Building', 40.7138, -74.0070, 1],
            ['Solar Panel 3', 'solar_panel', 'active', 6.2, 'Library', 40.7148, -74.0080, 1],
            ['Battery Storage 1', 'battery', 'active', 100, 'Main Campus', 40.7158, -74.0090, 1]
        ];

        // Insert sample devices for ADU (university_id = 2)
        const devicesADU = [
            ['Solar Panel A', 'solar_panel', 'active', 5.0, 'Main Building', 40.7168, -74.0100, 2],
            ['Solar Panel B', 'solar_panel', 'active', 5.5, 'Student Center', 40.7178, -74.0110, 2],
            ['Battery Storage A', 'battery', 'active', 80, 'East Campus', 40.7188, -74.0120, 2]
        ];

        [...devicesBMU, ...devicesADU].forEach(device => {
            db.run(`INSERT OR IGNORE INTO devices (name, type, status, capacity, location, latitude, longitude, university_id) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, device);
        });
    });

    // Energy logs table with university_id
    db.run(`CREATE TABLE IF NOT EXISTS energy_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME NOT NULL,
        energy_generated REAL NOT NULL,
        energy_used REAL NOT NULL,
        battery_level REAL NOT NULL,
        university_id INTEGER,
        FOREIGN KEY (university_id) REFERENCES universities(id)
    )`, (err) => {
        if (err) {
            console.error('Error creating energy_logs table:', err);
            return;
        }

        // Insert sample energy logs for the past 7 days
        const now = new Date();
        for (let i = 0; i < 168; i++) { // 7 days * 24 hours
            const timestamp = new Date(now - i * 60 * 60 * 1000);
            const hour = timestamp.getHours();
            const solarMultiplier = (hour >= 6 && hour <= 18) ? Math.sin((hour - 6) * Math.PI / 12) : 0;
            
            // BMU data
            const energyGeneratedBMU = (2 + Math.random() * 3) * solarMultiplier;
            const energyUsedBMU = 0.8 + Math.random() * 0.4;
            const batteryLevelBMU = 60 + Math.random() * 30;
            
            db.run(`INSERT INTO energy_logs (timestamp, energy_generated, energy_used, battery_level, university_id) 
                    VALUES (?, ?, ?, ?, ?)`,
                [timestamp.toISOString(), energyGeneratedBMU, energyUsedBMU, batteryLevelBMU, 1]
            );

            // ADU data
            const energyGeneratedADU = (1.5 + Math.random() * 2.5) * solarMultiplier;
            const energyUsedADU = 0.6 + Math.random() * 0.3;
            const batteryLevelADU = 55 + Math.random() * 35;
            
            db.run(`INSERT INTO energy_logs (timestamp, energy_generated, energy_used, battery_level, university_id) 
                    VALUES (?, ?, ?, ?, ?)`,
                [timestamp.toISOString(), energyGeneratedADU, energyUsedADU, batteryLevelADU, 2]
            );
        }
    });

    // Alerts table
    db.run(`CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message TEXT NOT NULL,
        severity TEXT NOT NULL,
        timestamp DATETIME NOT NULL,
        status TEXT NOT NULL
    )`);

    console.log('Database initialized with sample data');
    console.log('Default login: admin@university.edu / admin123');
}

module.exports = db;

