const express = require('express');
const db = require('../database/db');
const { verifyToken } = require('./auth');

const router = express.Router();

// Get all alerts
router.get('/', verifyToken, (req, res) => {
    const { status } = req.query;
    
    let query = 'SELECT * FROM alerts ORDER BY timestamp DESC LIMIT 100';
    let params = [];
    
    if (status) {
        query = 'SELECT * FROM alerts WHERE status = ? ORDER BY timestamp DESC LIMIT 100';
        params = [status];
    }

    db.all(query, params, (err, alerts) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(alerts);
    });
});

// Get recent alerts (last 10)
router.get('/recent', verifyToken, (req, res) => {
    db.all('SELECT * FROM alerts ORDER BY timestamp DESC LIMIT 10', (err, alerts) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(alerts);
    });
});

// Update alert status
router.put('/:id/status', verifyToken, (req, res) => {
    const { status } = req.body;

    db.run('UPDATE alerts SET status = ? WHERE id = ?',
        [status, req.params.id],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ message: 'Alert status updated', id: req.params.id, status });
        }
    );
});

// Create manual alert
router.post('/', verifyToken, (req, res) => {
    const { message, severity } = req.body;
    const timestamp = new Date().toISOString();

    db.run('INSERT INTO alerts (message, severity, timestamp, status) VALUES (?, ?, ?, ?)',
        [message, severity, timestamp, 'active'],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ message: 'Alert created', id: this.lastID });
        }
    );
});

module.exports = router;

