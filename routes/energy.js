const express = require('express');
const db = require('../database/db');
const { verifyToken } = require('./auth');

const router = express.Router();

// Get energy summary for today
router.get('/summary/today', verifyToken, (req, res) => {
    const { universityId } = req.query;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    let query = `SELECT 
            SUM(energy_generated) as total_generated,
            SUM(energy_used) as total_used,
            AVG(battery_level) as avg_battery
        FROM energy_logs 
        WHERE timestamp >= ?`;
    
    let params = [todayISO];
    
    if (universityId) {
        query += ' AND university_id = ?';
        params.push(universityId);
    }

    db.get(query, params, (err, summary) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(summary || { total_generated: 0, total_used: 0, avg_battery: 0 });
    });
});

// Get energy logs with filters
router.get('/logs', verifyToken, (req, res) => {
    const { period, universityId } = req.query; // today, 7days, 30days
    
    let dateFilter = new Date();
    if (period === 'today') {
        dateFilter.setHours(0, 0, 0, 0);
    } else if (period === '7days') {
        dateFilter.setDate(dateFilter.getDate() - 7);
    } else if (period === '30days') {
        dateFilter.setDate(dateFilter.getDate() - 30);
    }

    let query = `SELECT * FROM energy_logs WHERE timestamp >= ?`;
    let params = [dateFilter.toISOString()];
    
    if (universityId) {
        query += ' AND university_id = ?';
        params.push(universityId);
    }
    
    query += ' ORDER BY timestamp DESC';

    db.all(query, params, (err, logs) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(logs);
    });
});

// Get hourly energy data for charts
router.get('/hourly', verifyToken, (req, res) => {
    const { hours = 24, universityId } = req.query;
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    let query = `SELECT 
            strftime('%Y-%m-%d %H:00:00', timestamp) as hour,
            AVG(energy_generated) as avg_generated,
            AVG(energy_used) as avg_used,
            AVG(battery_level) as avg_battery
        FROM energy_logs 
        WHERE timestamp >= ?`;
    
    let params = [startTime];
    
    if (universityId) {
        query += ' AND university_id = ?';
        params.push(universityId);
    }
    
    query += ' GROUP BY hour ORDER BY hour';

    db.all(query, params, (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(data);
    });
});

// Get energy prediction
router.get('/prediction', verifyToken, (req, res) => {
    const { universityId } = req.query;
    // Simple prediction based on last 7 days average
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    let query = `SELECT 
            AVG(energy_generated) as avg_generated,
            AVG(energy_used) as avg_used
        FROM energy_logs 
        WHERE timestamp >= ?`;
    
    let params = [sevenDaysAgo];
    
    if (universityId) {
        query += ' AND university_id = ?';
        params.push(universityId);
    }

    db.get(query, params, (err, avg) => {
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
    });
});

// Get energy stats by period (weekly, monthly, yearly)
router.get('/stats/:period', verifyToken, (req, res) => {
    const { period } = req.params; // week, month, year
    const { universityId } = req.query;
    
    let dateFilter = new Date();
    if (period === 'week') {
        dateFilter.setDate(dateFilter.getDate() - 7);
    } else if (period === 'month') {
        dateFilter.setMonth(dateFilter.getMonth() - 1);
    } else if (period === 'year') {
        dateFilter.setFullYear(dateFilter.getFullYear() - 1);
    } else {
        return res.status(400).json({ error: 'Invalid period. Use: week, month, or year' });
    }

    let query = `SELECT 
            SUM(energy_generated) as total_generated,
            SUM(energy_used) as total_used,
            AVG(battery_level) as avg_battery,
            COUNT(*) as data_points
        FROM energy_logs 
        WHERE timestamp >= ?`;
    
    let params = [dateFilter.toISOString()];
    
    if (universityId) {
        query += ' AND university_id = ?';
        params.push(universityId);
    }

    db.get(query, params, (err, stats) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(stats || { total_generated: 0, total_used: 0, avg_battery: 0, data_points: 0 });
    });
});

module.exports = router;

