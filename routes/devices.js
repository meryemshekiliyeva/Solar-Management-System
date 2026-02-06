const express = require('express');
const db = require('../database/db');
const { verifyToken } = require('./auth');

const router = express.Router();

// Get all devices
router.get('/', verifyToken, (req, res) => {
    db.all('SELECT * FROM devices ORDER BY id', (err, devices) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(devices);
    });
});

// Get device by ID
router.get('/:id', verifyToken, (req, res) => {
    db.get('SELECT * FROM devices WHERE id = ?', [req.params.id], (err, device) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }
        res.json(device);
    });
});

// Update device status (simulate on/off)
router.put('/:id/status', verifyToken, (req, res) => {
    const { status } = req.body;
    const timestamp = new Date().toISOString();

    db.run('UPDATE devices SET status = ?, last_update = ? WHERE id = ?',
        [status, timestamp, req.params.id],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ message: 'Device status updated', id: req.params.id, status });
        }
    );
});

// Get device statistics
router.get('/stats/summary', verifyToken, (req, res) => {
    db.all('SELECT type, status, COUNT(*) as count FROM devices GROUP BY type, status', (err, stats) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(stats);
    });
});

module.exports = router;

