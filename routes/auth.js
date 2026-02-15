const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');

const router = express.Router();
const JWT_SECRET = 'your-secret-key-change-in-production';

// Register
router.post('/register', (req, res) => {
    const { email, password, fullName, role, universityId } = req.body;

    if (!email || !password || !role) {
        return res.status(400).json({ error: 'Email, password, and role are required' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate role - super_admin cannot register via form
    if (!['student', 'viewer', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }

    // All roles require university selection
    if (!universityId) {
        return res.status(400).json({ error: 'University selection is required' });
    }

    // Validate email domain matches university
    const emailDomain = email.split('@')[1];
    
    db.get('SELECT * FROM universities WHERE id = ?', [parseInt(universityId)], (err, university) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (!university) {
            return res.status(400).json({ error: 'Invalid university' });
        }

        if (emailDomain !== university.domain) {
            return res.status(400).json({ 
                error: `Email domain must be @${university.domain} for ${university.name}` 
            });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);
        
        // Approval logic:
        // - Student: auto-approved (status = 'approved')
        // - Viewer: pending, approved by university admin (status = 'pending')
        // - Admin: pending, approved by super admin (status = 'pending')
        const approvalStatus = role === 'student' ? 'approved' : 'pending';

        db.run(
            'INSERT INTO users (email, password, role, full_name, university_id, status) VALUES (?, ?, ?, ?, ?, ?)',
            [email, hashedPassword, role, fullName || '', universityId, approvalStatus],
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE')) {
                        return res.status(400).json({ error: 'Email already exists' });
                    }
                    return res.status(500).json({ error: 'Database error' });
                }
                
                let message;
                if (role === 'student') {
                    message = 'Registration successful. You can now login.';
                } else if (role === 'viewer') {
                    message = 'Registration successful. Your account is pending university admin approval.';
                } else if (role === 'admin') {
                    message = 'Registration successful. Your account is pending super admin approval.';
                }
                    
                res.json({ 
                    message: message,
                    userId: this.lastID,
                    autoApproved: role === 'student'
                });
            }
        );
    });
});

// Login
router.post('/login', (req, res) => {
    const { email, password, role, universityId } = req.body;

    // Super admin and admin can login without university
    if (!['admin', 'super_admin'].includes(role) && !universityId) {
        return res.status(400).json({ error: 'University selection required' });
    }

    if (!role) {
        return res.status(400).json({ error: 'Role selection required' });
    }

    // Validate email domain matches university (except for admin/super_admin)
    if (!['admin', 'super_admin'].includes(role)) {
        const emailDomain = email.split('@')[1];
        
        db.get('SELECT * FROM universities WHERE id = ?', [parseInt(universityId)], (err, university) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (!university) {
                return res.status(400).json({ error: 'Invalid university' });
            }

            if (emailDomain !== university.domain) {
                return res.status(400).json({ 
                    error: `Email domain must be @${university.domain} for ${university.name}` 
                });
            }

            // Continue with authentication
            authenticateUser(email, password, role, universityId, res);
        });
    } else {
        // Admin/Super admin login
        authenticateUser(email, password, role, null, res);
    }
});

function authenticateUser(email, password, role, universityId, res) {
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify role matches
        if (user.role !== role) {
            return res.status(401).json({ error: 'Invalid role for this account' });
        }

        // Verify university matches (except for admin/super_admin)
        if (!['admin', 'super_admin'].includes(role)) {
            // Convert to number for comparison (universityId from form is string)
            if (user.university_id !== parseInt(universityId)) {
                return res.status(401).json({ error: 'Invalid university for this account' });
            }
        }

        const validPassword = bcrypt.compareSync(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check if account is approved
        if (user.status !== 'approved') {
            let message = 'Your account is pending approval.';
            if (user.role === 'viewer') {
                message = 'Your account is pending university admin approval.';
            } else if (user.role === 'admin') {
                message = 'Your account is pending super admin approval.';
            }
            
            return res.status(403).json({ 
                error: 'Account not approved',
                email: user.email,
                status: user.status,
                message: message
            });
        }

        // Update last login
        db.run('UPDATE users SET last_login = ? WHERE id = ?', [new Date().toISOString(), user.id]);

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, universityId: user.university_id },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                fullName: user.full_name,
                universityId: user.university_id
            }
        });
    });
}

// Verify token middleware
function verifyToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(403).json({ error: 'No token provided' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        req.user = decoded;
        next();
    });
}

// Get current user
router.get('/me', verifyToken, (req, res) => {
    db.get('SELECT id, email, role FROM users WHERE id = ?', [req.user.id], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(user);
    });
});

module.exports = router;
module.exports.verifyToken = verifyToken;

