# 🚀 Quick Start Guide - Multi-Role Solar Management System

## Setup & Testing

### 1. Delete Old Database (Important!)
```bash
# Delete the old database to apply new schema
Remove-Item database\solar_system.db
```

### 2. Start the Server
```bash
node server.js
```

You should see:
```
Connected to SQLite database
Database initialized with sample data
Default login: admin@university.edu / admin123
Server running on port 3000
Open http://localhost:3000 in your browser
```

---

## Testing the Multi-Role System

### Test 1: Admin Login ✅

1. Open: http://localhost:3000
2. Click "Sign In"
3. Fill in:
   - **Select Role:** Admin
   - **Email:** admin@university.edu
   - **Password:** admin123
4. Click "Sign In"

**Expected Result:**
- ✅ Login successful
- ✅ See full dashboard
- ✅ "Users" menu visible
- ✅ "Add Panel" button visible in Devices page

**Test Admin Features:**
- Go to **Devices** page
- Click "**Add Panel**"
- Fill in form and submit
- Verify new panel appears
- Click "**Edit**" on a panel
- Modify details and save
- Click "**Delete**" on a panel (with confirmation)

---

### Test 2: Create Student Account ✅

1. Click "**Sign Up**" tab
2. Fill in:
   - **Full Name:** John Student
   - **Select Role:** Student
   - **Select University:** Baku Metropolitan University (BMU)
   - **Email:** `john@bmu.edu.az` (must match BMU domain!)
   - **Password:** test123
   - **Confirm Password:** test123
3. Click "Create Account"

**Expected Result:**
- ✅ Registration successful
- ✅ Message: "Your account is pending admin approval"

#### Approve Student Account

1. Login as **Admin** (admin@university.edu / admin123)
2. Go to "**Users**" page
3. Find "**Pending Approvals**" section
4. Click "**Approve**" for John Student

---

### Test 3: Student Login ✅

1. **Logout** from admin
2. Click "**Sign In**"
3. Fill in:
   - **Select Role:** Student
   - **Select University:** Baku Metropolitan University (BMU)
   - **Email:** john@bmu.edu.az
   - **Password:** test123
4. Click "Sign In"

**Expected Result:**
- ✅ Login successful
- ✅ See **Student Dashboard** automatically
- ✅ Shows BMU data by default
- ✅ "Calculator" menu item visible
- ✅ Can select different university from dropdown
- ✅ Dashboard updates when university changes

**Visible Stats:**
- Weekly/Monthly/Yearly Energy Production
- Weekly/Monthly/Yearly Energy Consumption
- Number of Solar Panels

**Test Calculator:**
- Click "**Calculator**" in menu
- See placeholder message: "Calculator logic will be added later."

---

### Test 4: Create Viewer Account ✅

1. **Logout** from student
2. Click "**Sign Up**"
3. Fill in:
   - **Full Name:** Jane Viewer
   - **Select Role:** Viewer
   - **Select University:** Azerbaijan Diplomatic University (ADU)
   - **Email:** `jane@adu.edu.az` (must match ADU domain!)
   - **Password:** test123
   - **Confirm Password:** test123
4. Click "Create Account"

#### Approve Viewer Account

1. Login as **Admin**
2. Go to "**Users**" → Approve Jane Viewer
3. **Logout**

---

### Test 5: Viewer Login (Read-Only) ✅

1. Click "**Sign In**"
2. Fill in:
   - **Select Role:** Viewer
   - **Select University:** Azerbaijan Diplomatic University (ADU)
   - **Email:** jane@adu.edu.az
   - **Password:** test123
4. Click "Sign In"

**Expected Result:**
- ✅ Login successful
- ✅ See regular **Dashboard**
- ✅ Can view all pages (Devices, Map, History, etc.)
- ✅ "Users" menu **NOT** visible
- ✅ "Calculator" menu **NOT** visible

**Test Read-Only Access:**
- Go to "**Devices**" page
- ✅ "Add Panel" button is **HIDDEN**
- ✅ "Edit" button is **HIDDEN** in table
- ✅ "Delete" button is **HIDDEN** in table
- ✅ Can only "View" devices

---

## Email Domain Validation Testing

### Valid Emails:
- ✅ `student@bmu.edu.az` for BMU
- ✅ `user@adu.edu.az` for ADU
- ✅ `admin@university.edu` for Admin (any domain)

### Invalid Emails:
- ❌ `student@adu.edu.az` when BMU selected → Error
- ❌ `student@bmu.edu.az` when ADU selected → Error
- ❌ `student@gmail.com` → Error

**Test This:**
1. Try registering with wrong domain
2. See error: "Email domain must be @bmu.edu.az for Baku Metropolitan University"

---

## Features Checklist

### ✅ Multi-Role Login
- [x] Student role works
- [x] Viewer role works  
- [x] Admin role works
- [x] Role selection required
- [x] University selection for Student/Viewer

### ✅ Email Validation
- [x] Domain validation works
- [x] Error shown for wrong domain
- [x] Placeholder updates based on university

### ✅ Student Panel
- [x] Student Dashboard loads
- [x] Shows own university data by default
- [x] University dropdown works
- [x] Dashboard updates when university changes
- [x] All 7 statistics display correctly
- [x] Calculator page accessible
- [x] Calculator shows placeholder

### ✅ Viewer Panel
- [x] All pages visible
- [x] Add Panel button hidden
- [x] Edit button hidden
- [x] Delete button hidden
- [x] Users menu hidden
- [x] Calculator menu hidden

### ✅ Admin Panel
- [x] Add Panel button visible
- [x] Add Panel form works
- [x] Edit Panel form works
- [x] Delete Panel works (with confirmation)
- [x] All fields editable (name, capacity, status, university)

### ✅ UI Preservation
- [x] No design changes
- [x] Colors unchanged
- [x] Layout unchanged
- [x] Navigation style unchanged
- [x] Dark mode still works

---

## Sample Universities Data

**BMU** (Baku Metropolitan University)
- Domain: `bmu.edu.az`
- Devices: 3 Solar Panels + 1 Battery
- Sample data for past 7 days

**ADU** (Azerbaijan Diplomatic University)
- Domain: `adu.edu.az`
- Devices: 2 Solar Panels + 1 Battery
- Sample data for past 7 days

---

## Troubleshooting

### Issue: Can't login
- Check role selection matches your account
- Check university selection for Student/Viewer
- Check email domain matches university

### Issue: Account pending approval
- Login as Admin
- Go to Users page
- Approve the pending user

### Issue: Can't see Add Panel button
- Make sure you're logged in as **Admin**
- Student and Viewer cannot see this button

### Issue: Student Dashboard not loading
- Make sure you're logged in as **Student**
- Check browser console for errors
- Refresh the page

### Issue: Old data showing
- Delete `database/solar_system.db`
- Restart server
- New database created with sample data

---

## Next Steps

All features are implemented and ready! You can now:

1. ✅ Test all three roles
2. ✅ Create multiple universities
3. ✅ Add solar panels for each university
4. ✅ View energy statistics by university
5. ✅ Implement calculator formulas (when ready)

**Need to add more universities?**
- Login as Admin
- Use API: `POST /api/universities`
- Send: `{ "name": "...", "domain": "...", "code": "..." }`

---

## 🎉 Implementation Complete!

All requested features are working:
- ✅ Multi-role login with university selection
- ✅ Email domain validation
- ✅ Student dashboard with calculator
- ✅ Viewer read-only access
- ✅ Admin add/edit/delete panels
- ✅ No UI design changes
- ✅ Production-ready code

**Enjoy your enhanced Solar Management System!** ☀️
