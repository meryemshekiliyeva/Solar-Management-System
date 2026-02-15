# Approval System Update - Implementation Summary

## 🎯 Overview
Updated the role and approval system with strict separation of approval responsibilities between University Admins and Super Admins. All changes maintain existing UI design, layout, and colors.

---

## ✅ Approval Matrix (Final Implementation)

| Role | Needs Approval | Approved By | Status After Registration |
|------|---------------|-------------|---------------------------|
| **Student** | ❌ No | Auto-approved | `approved` |
| **Viewer** | ✅ Yes | University Admin ONLY | `pending` |
| **Admin** | ✅ Yes | Super Admin ONLY | `pending` |
| **Super Admin** | ❌ No | Predefined (cannot register) | `approved` |

---

## 📊 Key Changes Summary

### 1. Database Schema Changes
**File:** `database/db.js`

#### Changed:
- ✅ `approved INTEGER` → `status TEXT` with values: `'pending'`, `'approved'`, `'rejected'`
- ✅ Default super admin now has `status = 'approved'`
- ✅ `university_id` is nullable only for super_admin

#### Migration Required:
⚠️ **Delete existing database**: `solar_system.db` must be removed before starting the server.

```sql
-- Old Schema
approved INTEGER DEFAULT 0  -- 0 or 1

-- New Schema  
status TEXT DEFAULT 'pending'  -- 'pending', 'approved', 'rejected'
```

---

### 2. Registration Logic Changes
**File:** `routes/auth.js`

#### Updated Registration Rules:

**Students:**
- Status: `'approved'` (auto-approved)
- Must select university
- Must use university email domain
- Can login immediately after registration

**Viewers:**
- Status: `'pending'` (requires approval)
- Must select university
- Must use university email domain
- Can only be approved by their university's Admin
- Message: "Your account is pending university admin approval"

**Admins:**
- Status: `'pending'` (requires approval)
- Must select university
- Must use university email domain
- Can only be approved by Super Admin
- Message: "Your account is pending super admin approval"

**Super Admins:**
- Cannot register via form (removed from registration UI)
- Predefined in system only
- Email: `admin@university.edu`
- Password: `admin123`

---

### 3. Login Validation Changes
**File:** `routes/auth.js`

#### Updated Login Checks:
```javascript
// New status-based validation
if (user.status !== 'approved') {
    return res.status(403).json({
        error: 'Account not approved',
        status: user.status,
        message: role-specific message
    });
}
```

#### Role-Specific Messages:
- **Viewer**: "Your account is pending university admin approval"
- **Admin**: "Your account is pending super admin approval"
- **Student**: Never shown (auto-approved)

---

### 4. User Management Changes
**File:** `routes/users.js`

#### GET /api/users/pending - Filtered by Role:

**For University Admin (`role = 'admin'`):**
```javascript
// Shows ONLY pending viewers from their university
SELECT * FROM users 
WHERE status = 'pending' 
  AND role = 'viewer' 
  AND university_id = admin.university_id
```

**For Super Admin (`role = 'super_admin'`):**
```javascript
// Shows ONLY pending admins (all universities)
SELECT * FROM users 
WHERE status = 'pending' 
  AND role = 'admin'
```

#### PUT /api/users/:id/approve - Permission Checks:

**University Admin can approve:**
- ✅ Viewers from their own university ONLY
- ❌ Cannot approve admins
- ❌ Cannot approve users from other universities

**Super Admin can approve:**
- ✅ Admins from any university
- ❌ Cannot approve viewers (not shown in their pending list)

#### Error Messages:
- Admin trying to approve non-viewer: `"You can only approve viewers from your university"`
- Super Admin trying to approve non-admin: `"Super admin can only approve admin accounts"`

---

### 5. Frontend Changes

#### A. Registration Form
**File:** `public/index.html`

**Removed:**
- ❌ Super Admin option from registration role selector

**Available Registration Roles:**
- ✅ Student
- ✅ Viewer
- ✅ Admin

#### B. Role Change Handler
**File:** `public/js/app.js`

**Updated Logic:**
```javascript
// All registration roles (student, viewer, admin) require university selection
if (role) {
    universityGroup.style.display = 'block';
    universitySelect.required = true;
}
```

#### C. User Display
**File:** `public/js/app.js`

**Updated Status Badges:**
```javascript
// Old: user.approved (boolean)
// New: user.status (string)

if (user.status === 'approved') → Green badge "APPROVED"
if (user.status === 'pending') → Yellow badge "PENDING"
if (user.status === 'rejected') → Red badge "REJECTED"
```

**Approve Button Display:**
```javascript
// Show approve button only for pending users
${user.status === 'pending' ? `<button>Approve</button>` : ''}
```

---

## 🔒 Security Rules Implemented

### 1. University Isolation
- ✅ Admins can ONLY see/manage users from their university
- ✅ Admins can ONLY see/manage devices from their university
- ✅ Admins can ONLY approve viewers from their university

### 2. Role-Based Access Control
- ✅ Viewers cannot modify anything (read-only)
- ✅ Admins cannot access other universities
- ✅ Super Admin bypasses university filters (global access)

### 3. Status Validation
- ✅ All logins check `status = 'approved'`
- ✅ Pending users are blocked from login
- ✅ Rejected users are blocked from login

### 4. Approval Separation
- ✅ University Admin cannot see/approve Admin accounts
- ✅ Super Admin cannot see/approve Viewer accounts
- ✅ Clear separation of approval responsibilities

---

## 🧪 Testing Scenarios

### Scenario 1: Student Registration (Auto-Approved)
```
1. Register as Student
2. Select: Baku Engineering University
3. Email: student@beu.edu.az
4. Expected: "Registration successful. You can now login."
5. Login immediately → ✅ SUCCESS
```

### Scenario 2: Viewer Registration (Requires Admin Approval)
```
1. Register as Viewer
2. Select: Baku Engineering University
3. Email: viewer@beu.edu.az
4. Expected: "Your account is pending university admin approval."
5. Login attempt → ❌ BLOCKED (status = pending)
6. Admin from BEU logs in → Sees viewer in pending list
7. Admin approves viewer
8. Viewer can now login → ✅ SUCCESS
```

### Scenario 3: Admin Registration (Requires Super Admin Approval)
```
1. Register as Admin
2. Select: Azerbaijan Diplomatic University
3. Email: newadmin@adu.edu.az
4. Expected: "Your account is pending super admin approval."
5. Login attempt → ❌ BLOCKED (status = pending)
6. Super Admin logs in → Sees admin in pending list
7. Super Admin approves admin
8. Admin can now login → ✅ SUCCESS
```

### Scenario 4: Super Admin Cannot See Viewer Approvals
```
1. Viewer registers at BMU
2. Super Admin logs in
3. Navigate to Users page → Pending section
4. Expected: Viewer NOT shown (only admins shown)
5. University Admin at BMU logs in
6. Navigate to Users page → Pending section
7. Expected: Viewer IS shown (only viewers from BMU shown)
```

### Scenario 5: Admin Cannot See Admin Approvals
```
1. New admin registers at ADU
2. University Admin at ADU logs in
3. Navigate to Users page → Pending section
4. Expected: Admin account NOT shown (only viewers shown)
5. Super Admin logs in
6. Navigate to Users page → Pending section
7. Expected: Admin account IS shown (only admins shown)
```

### Scenario 6: Cross-University Approval Blocked
```
1. Viewer registers at BEU
2. Admin from BMU logs in
3. Attempts to approve viewer from BEU
4. Expected: ❌ ERROR "You can only approve viewers from your university"
```

---

## 📝 Database Migration Steps

### Before Starting Server:
```powershell
# Stop server if running
Stop-Process -Name node -Force

# Delete old database
Remove-Item database\solar_system.db

# Start server (will create new database with correct schema)
node server.js
```

### Verification:
```sql
-- Check schema
.schema users

-- Should show:
status TEXT DEFAULT 'pending'  -- ✅ Correct

-- Should NOT show:
approved INTEGER DEFAULT 0  -- ❌ Old schema
```

---

## 🔑 Default Accounts

### Super Admin Account
```
Email: admin@university.edu
Password: admin123
Role: super_admin
Status: approved
University: null (has access to all)
```

### Test Accounts Setup
After database creation, you can create test accounts:

**University Admin (BMU):**
```
Email: admin@bmu.edu.az
Password: admin123
Role: admin
University: Baku Metropolitan University
Status: approved (created by super admin)
```

**University Admin (ADU):**
```
Email: admin@adu.edu.az
Password: admin123
Role: admin
University: Azerbaijan Diplomatic University
Status: approved (created by super admin)
```

---

## 🎨 UI Design Preserved

### No Changes To:
- ✅ Color scheme
- ✅ Layout structure
- ✅ CSS styles
- ✅ Dashboard design
- ✅ Typography
- ✅ Component positioning
- ✅ Responsive design
- ✅ Navigation structure

### Only Changed:
- ✅ Backend logic
- ✅ Access control
- ✅ Approval workflows
- ✅ Data filtering
- ✅ Status field implementation
- ✅ Role validation

---

## 🚀 Deployment Checklist

- [x] Database schema updated
- [x] Registration logic fixed
- [x] Login validation updated
- [x] Approval filtering implemented
- [x] Permission checks added
- [x] Frontend status display updated
- [x] Super admin removed from registration
- [x] All university roles require university selection
- [x] Role-based approval separation enforced
- [x] No UI design changes

---

## 📊 API Endpoints Summary

### Registration
```
POST /api/auth/register
Body: { email, password, fullName, role, universityId }
Returns: 
  - Student: "You can now login"
  - Viewer: "Pending university admin approval"
  - Admin: "Pending super admin approval"
```

### Login
```
POST /api/auth/login
Body: { email, password, role, universityId }
Status Check: user.status === 'approved'
```

### Get Pending Users
```
GET /api/users/pending
Admin: Returns only pending viewers from their university
Super Admin: Returns only pending admins (all universities)
```

### Approve User
```
PUT /api/users/:id/approve
Admin: Can approve only viewers from their university
Super Admin: Can approve only admins
Returns: 403 if permission denied
```

### Reject User
```
PUT /api/users/:id/reject
Admin: Can reject only viewers from their university
Super Admin: Can reject only admins
Action: Deletes user from database
```

---

## ⚠️ Important Notes

1. **Database Reset Required**: Old database must be deleted
2. **Super Admin Predefined**: Cannot register via form
3. **Approval Separation**: Strict - Admin cannot see admin approvals, Super Admin cannot see viewer approvals
4. **University Required**: All registrations require university selection
5. **Email Validation**: Email domain must match university domain
6. **Status Values**: Only `'pending'`, `'approved'`, `'rejected'` are valid

---

## 🔍 Troubleshooting

### Issue: "Cannot register as Super Admin"
**Solution**: Super Admin cannot register. Use default account: `admin@university.edu` / `admin123`

### Issue: "Viewer approval not showing for Admin"
**Solution**: Check that:
- Viewer registered at same university as Admin
- Viewer status is 'pending'
- Viewer role is 'viewer' (not admin)

### Issue: "Super Admin sees no pending approvals"
**Solution**: Super Admin only sees pending **admins**, not viewers. If no admins are pending, list will be empty.

### Issue: "Admin cannot approve user"
**Solution**: Check:
- User is a viewer (not admin)
- User's university matches admin's university
- User status is 'pending'

---

## ✅ Success Indicators

- ✅ Server starts without errors
- ✅ Database uses `status TEXT` field
- ✅ Students auto-approved on registration
- ✅ Viewers require university admin approval
- ✅ Admins require super admin approval
- ✅ Super admin not in registration form
- ✅ Approval lists properly filtered by role
- ✅ Permission checks prevent cross-approval
- ✅ All UI design unchanged

---

**Implementation Complete!** 🎉

Server: http://localhost:3000
Status: ✅ Running
Database: ✅ New schema applied
