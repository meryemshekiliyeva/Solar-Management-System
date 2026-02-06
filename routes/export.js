const express = require('express');
const db = require('../database/db');
const { verifyToken } = require('./auth');

const router = express.Router();

// Export energy logs to CSV
router.get('/energy-logs', verifyToken, (req, res) => {
    db.all('SELECT * FROM energy_logs ORDER BY timestamp DESC LIMIT 1000', (err, logs) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        // Convert to CSV
        const headers = ['ID', 'Timestamp', 'Energy Generated (kW)', 'Energy Used (kW)', 'Battery Level (%)'];
        const csvRows = [headers.join(',')];

        logs.forEach(log => {
            const row = [
                log.id,
                log.timestamp,
                log.energy_generated.toFixed(2),
                log.energy_used.toFixed(2),
                log.battery_level.toFixed(2)
            ];
            csvRows.push(row.join(','));
        });

        const csv = csvRows.join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=energy_logs.csv');
        res.send(csv);
    });
});

// Export devices to CSV
router.get('/devices', verifyToken, (req, res) => {
    db.all('SELECT * FROM devices', (err, devices) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        // Convert to CSV
        const headers = ['ID', 'Name', 'Type', 'Status', 'Location', 'Latitude', 'Longitude', 'Last Update'];
        const csvRows = [headers.join(',')];

        devices.forEach(device => {
            const row = [
                device.id,
                `"${device.name}"`,
                device.type,
                device.status,
                `"${device.location}"`,
                device.latitude,
                device.longitude,
                device.last_update
            ];
            csvRows.push(row.join(','));
        });

        const csv = csvRows.join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=devices.csv');
        res.send(csv);
    });
});

module.exports = router;

