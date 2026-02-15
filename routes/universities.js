const express = require('express');
const db = require('../database/db');
const { verifyToken } = require('./auth');

const router = express.Router();

// Get all universities
router.get('/', (req, res) => {
    db.all('SELECT * FROM universities ORDER BY name', (err, universities) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(universities);
    });
});

// Get all universities (alias for super admin dropdown)
router.get('/all', (req, res) => {
    db.all('SELECT * FROM universities ORDER BY name', (err, universities) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(universities);
    });
});

// Get university by ID
router.get('/:id', verifyToken, (req, res) => {
    db.get('SELECT * FROM universities WHERE id = ?', [req.params.id], (err, university) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!university) {
            return res.status(404).json({ error: 'University not found' });
        }
        res.json(university);
    });
});

// Get university by domain
router.get('/domain/:domain', (req, res) => {
    db.get('SELECT * FROM universities WHERE domain = ?', [req.params.domain], (err, university) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!university) {
            return res.status(404).json({ error: 'University not found' });
        }
        res.json(university);
    });
});

// Add new university (admin only)
router.post('/', verifyToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    const { name, domain, code } = req.body;

    if (!name || !domain || !code) {
        return res.status(400).json({ error: 'Name, domain, and code are required' });
    }

    db.run(
        'INSERT INTO universities (name, domain, code) VALUES (?, ?, ?)',
        [name, domain, code],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ error: 'University domain or code already exists' });
                }
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ 
                message: 'University added successfully',
                universityId: this.lastID 
            });
        }
    );
});

module.exports = router;
