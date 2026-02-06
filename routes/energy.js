const express = require('express');
const db = require('../database/db');
const { verifyToken } = require('./auth');

const router = express.Router();

// Get energy summary for today
router.get('/summary/today', verifyToken, (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    db.get(`SELECT 
            SUM(energy_generated) as total_generated,
            SUM(energy_used) as total_used,
            AVG(battery_level) as avg_battery
        FROM energy_logs 
        WHERE timestamp >= ?`,
        [todayISO],
        (err, summary) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(summary || { total_generated: 0, total_used: 0, avg_battery: 0 });
        }
    );
});

// Get energy logs with filters
router.get('/logs', verifyToken, (req, res) => {
    const { period } = req.query; // today, 7days, 30days
    
    let dateFilter = new Date();
    if (period === 'today') {
        dateFilter.setHours(0, 0, 0, 0);
    } else if (period === '7days') {
        dateFilter.setDate(dateFilter.getDate() - 7);
    } else if (period === '30days') {
        dateFilter.setDate(dateFilter.getDate() - 30);
    }

    db.all(`SELECT * FROM energy_logs 
            WHERE timestamp >= ? 
            ORDER BY timestamp DESC`,
        [dateFilter.toISOString()],
        (err, logs) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(logs);
        }
    );
});

// Get hourly energy data for charts
router.get('/hourly', verifyToken, (req, res) => {
    const { hours = 24 } = req.query;
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    db.all(`SELECT 
            strftime('%Y-%m-%d %H:00:00', timestamp) as hour,
            AVG(energy_generated) as avg_generated,
            AVG(energy_used) as avg_used,
            AVG(battery_level) as avg_battery
        FROM energy_logs 
        WHERE timestamp >= ?
        GROUP BY hour
        ORDER BY hour`,
        [startTime],
        (err, data) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(data);
        }
    );
});

// Get energy prediction
router.get('/prediction', verifyToken, (req, res) => {
    // Simple prediction based on last 7 days average
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    db.get(`SELECT 
            AVG(energy_generated) as avg_generated,
            AVG(energy_used) as avg_used
        FROM energy_logs 
        WHERE timestamp >= ?`,
        [sevenDaysAgo],
        (err, avg) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            // Generate prediction for next 24 hours
            const prediction = [];
            const now = new Date();
            
            for (let i = 0; i < 24; i++) {
                const hour = (now.getHours() + i) % 24;
                const solarMultiplier = (hour >= 6 && hour <= 18) ? Math.sin((hour - 6) * Math.PI / 12) : 0;
                
                prediction.push({
                    hour: hour,
                    predicted_generated: (avg.avg_generated || 2) * solarMultiplier * 1.1,
                    predicted_used: avg.avg_used || 1
                });
            }

            res.json(prediction);
        }
    );
});

module.exports = router;

