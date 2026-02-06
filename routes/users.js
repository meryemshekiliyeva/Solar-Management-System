const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database/db');
const { verifyToken } = require('./auth');

const router = express.Router();

// Middleware to check admin role
function isAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

// Get all users (admin only)
router.get('/', verifyToken, isAdmin, (req, res) => {
    db.all('SELECT id, email, role, created_at FROM users', (err, users) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(users);
    });
});

// Create new user (admin only)
router.post('/', verifyToken, isAdmin, (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
        return res.status(400).json({ error: 'Email, password, and role are required' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    db.run('INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
        [email, hashedPassword, role],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ error: 'Email already exists' });
                }
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ message: 'User created', id: this.lastID });
        }
    );
});

// Delete user (admin only)
router.delete('/:id', verifyToken, isAdmin, (req, res) => {
    // Prevent deleting yourself
    if (req.user.id == req.params.id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    db.run('DELETE FROM users WHERE id = ?', [req.params.id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'User deleted' });
    });
});

// Update user role (admin only)
router.put('/:id/role', verifyToken, isAdmin, (req, res) => {
    const { role } = req.body;

    db.run('UPDATE users SET role = ? WHERE id = ?',
        [role, req.params.id],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ message: 'User role updated' });
        }
    );
});

module.exports = router;

