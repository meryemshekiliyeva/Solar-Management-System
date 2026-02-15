const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database/db');
const { verifyToken } = require('./auth');

const router = express.Router();

// Middleware to check admin role
function isAdmin(req, res, next) {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

// Get all users (admin only)
router.get('/', verifyToken, isAdmin, (req, res) => {
    let query = 'SELECT id, email, role, full_name, university_id, status, created_at FROM users';
    let params = [];
    
    // Filter by university for regular admins, super_admin sees all
    if (req.user.role === 'admin') {
        query += ' WHERE university_id = ?';
        params.push(req.user.universityId);
    }
    
    db.all(query, params, (err, users) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(users);
    });
});

// Get pending users (admin only)
router.get('/pending', verifyToken, isAdmin, (req, res) => {
    let query, params = [];
    
    // Admin role: show only pending viewers from their university
    // Super Admin role: show only pending admins (all universities)
    if (req.user.role === 'admin') {
        query = `SELECT id, email, role, full_name, university_id, created_at 
                 FROM users 
                 WHERE status = 'pending' AND role = 'viewer' AND university_id = ?`;
        params.push(req.user.universityId);
    } else if (req.user.role === 'super_admin') {
        query = `SELECT id, email, role, full_name, university_id, created_at 
                 FROM users 
                 WHERE status = 'pending' AND role = 'admin'`;
    }
    
    db.all(query, params, (err, users) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(users);
    });
});

// Approve user (admin only)
router.put('/:id/approve', verifyToken, isAdmin, (req, res) => {
    // First check if user has permission to approve this user
    db.get('SELECT role, university_id FROM users WHERE id = ?', [req.params.id], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Regular admin can only approve viewers from their university
        if (req.user.role === 'admin') {
            if (user.role !== 'viewer' || user.university_id !== req.user.universityId) {
                return res.status(403).json({ error: 'You can only approve viewers from your university' });
            }
        }
        
        // Super admin can only approve admins
        if (req.user.role === 'super_admin') {
            if (user.role !== 'admin') {
                return res.status(403).json({ error: 'Super admin can only approve admin accounts' });
            }
        }
        
        // Approve the user
        db.run('UPDATE users SET status = \'approved\' WHERE id = ?', [req.params.id], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json({ message: 'User approved successfully' });
        });
    });
});

// Reject user (admin only) - sets status to rejected
router.put('/:id/reject', verifyToken, isAdmin, (req, res) => {
    // First check if user has permission to reject this user
    db.get('SELECT role, university_id FROM users WHERE id = ?', [req.params.id], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Regular admin can only reject viewers from their university
        if (req.user.role === 'admin') {
            if (user.role !== 'viewer' || user.university_id !== req.user.universityId) {
                return res.status(403).json({ error: 'You can only reject viewers from your university' });
            }
        }
        
        // Super admin can only reject admins
        if (req.user.role === 'super_admin') {
            if (user.role !== 'admin') {
                return res.status(403).json({ error: 'Super admin can only reject admin accounts' });
            }
        }
        
        // Reject the user (delete them)
        db.run('DELETE FROM users WHERE id = ?', [req.params.id], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json({ message: 'User rejected and removed' });
        });
    });
});

// Create new user (admin only)
router.post('/', verifyToken, isAdmin, (req, res) => {
    const { email, password, role, fullName, universityId } = req.body;

    if (!email || !password || !role) {
        return res.status(400).json({ error: 'Email, password, and role are required' });
    }

    // Validate role
    if (!['student', 'viewer', 'admin', 'super_admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }

    // For regular admin, use their university. For super_admin, require universityId
    let targetUniversityId = universityId;
    if (req.user.role === 'admin') {
        targetUniversityId = req.user.universityId;
    } else if (req.user.role === 'super_admin' && !universityId) {
        return res.status(400).json({ error: 'University ID required for super admin to create users' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    // Auto-approve created users (status = 'approved')
    db.run('INSERT INTO users (email, password, role, full_name, university_id, status) VALUES (?, ?, ?, ?, ?, ?)',
        [email, hashedPassword, role, fullName || '', targetUniversityId, 'approved'],
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

