const express = require('express');
const db = require('../database/db');
const { verifyToken } = require('./auth');

const router = express.Router();

// Get all devices (with optional university filter)
router.get('/', verifyToken, (req, res) => {
    const { universityId } = req.query;
    
    let query = 'SELECT * FROM devices';
    let params = [];
    
    if (universityId) {
        query += ' WHERE university_id = ?';
        params.push(universityId);
    }
    
    query += ' ORDER BY id';
    
    db.all(query, params, (err, devices) => {
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

// Add new device (admin only)
router.post('/', verifyToken, (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    const { name, type, status, capacity, location, latitude, longitude, universityId } = req.body;

    if (!name || !type || !status || !universityId) {
        return res.status(400).json({ error: 'Name, type, status, and university are required' });
    }

    const timestamp = new Date().toISOString();

    db.run(
        `INSERT INTO devices (name, type, status, capacity, location, latitude, longitude, university_id, last_update) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, type, status, capacity || null, location || null, latitude || null, longitude || null, universityId, timestamp],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ 
                message: 'Device added successfully',
                deviceId: this.lastID 
            });
        }
    );
});

// Update device (admin only)
router.put('/:id', verifyToken, (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    const { name, type, status, capacity, location, latitude, longitude, universityId } = req.body;
    const timestamp = new Date().toISOString();

    db.run(
        `UPDATE devices SET name = ?, type = ?, status = ?, capacity = ?, location = ?, 
         latitude = ?, longitude = ?, university_id = ?, last_update = ? WHERE id = ?`,
        [name, type, status, capacity, location, latitude, longitude, universityId, timestamp, req.params.id],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Device not found' });
            }
            res.json({ message: 'Device updated successfully' });
        }
    );
});

// Delete device (admin only)
router.delete('/:id', verifyToken, (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    db.run('DELETE FROM devices WHERE id = ?', [req.params.id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Device not found' });
        }
        res.json({ message: 'Device deleted successfully' });
    });
});

module.exports = router;

