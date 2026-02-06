# 👤 USER GUIDE - University Solar Management System

## 🔐 Getting Started

### Step 1: Access the System
1. Open your web browser (Chrome, Firefox, Edge, Safari)
2. Navigate to: `http://localhost:3000`
3. You will see the **Login Page**

### Step 2: Login
**Default Credentials:**
- **Email:** `admin@university.edu`
- **Password:** `admin123`

Click the **Login** button to access the system.

---

## 📊 Page-by-Page Guide

### 1️⃣ DASHBOARD PAGE (Default Landing Page)

**What You'll See:**

**Top Section - Summary Cards (4 cards in a row):**
1. **Energy Generated Today** (Green card with ⚡ icon)
   - Shows total kWh generated today
   - Updates in real-time

2. **Current Battery Level** (Blue card with 🔋 icon)
   - Shows battery percentage
   - Updates every 5 seconds

3. **Energy Consumption Today** (Orange card with 💡 icon)
   - Shows total kWh consumed today
   - Updates in real-time

4. **Active Devices** (Purple card with 📱 icon)
   - Shows count of online devices
   - Updates when devices change status

**Middle Section - Charts (2 charts side by side):**
1. **Energy Generated Over Time** (Line chart)
   - Green line: Energy generated
   - Red line: Energy used
   - Shows last 24 hours
   - Updates automatically

2. **Battery Level** (Line chart)
   - Blue line: Battery percentage
   - Shows last 24 hours
   - Updates automatically

**Bottom Section - Live Monitoring (2 panels side by side):**
1. **Live Solar Panel Data**
   - Voltage (V)
   - Current (A)
   - Temperature (°C)
   - Power (W)
   - Updates every 5 seconds

2. **Recent Alerts**
   - Last 5 alerts
   - Color-coded by severity
   - Shows message and time

**What You Can Do:**
- Watch real-time data updates
- Monitor system health at a glance
- Check recent alerts

---

### 2️⃣ DEVICES PAGE

**What You'll See:**
A table with all solar panels and batteries:

**Table Columns:**
- ID
- Device Name (e.g., "Solar Panel 1")
- Type (Solar Panel / Battery)
- Status (Green "active" or Red "offline" badge)
- Location (e.g., "Engineering Building")
- Last Update (timestamp)
- Actions (Turn On/Off button)

**What You Can Do:**
1. **View all devices** - See complete list
2. **Check status** - See which devices are online/offline
3. **Control devices** - Click "Turn Off" to simulate turning off a device
4. **Refresh** - Click "Refresh" button to reload data

**Example Actions:**
- Click "Turn Off" on Solar Panel 1
- Watch status change to "offline" (red badge)
- Click "Turn On" to reactivate
- Watch status change to "active" (green badge)

---

### 3️⃣ MAP PAGE

**What You'll See:**
- Interactive map of university campus
- Markers showing device locations
- ☀️ icon for solar panels
- 🔋 icon for batteries

**What You Can Do:**
1. **Zoom in/out** - Use mouse wheel or +/- buttons
2. **Pan** - Click and drag to move around
3. **Click markers** - See device details in popup:
   - Device name
   - Type
   - Status (green or red text)
   - Location

**Pre-loaded Locations:**
- Solar Panel 1: Engineering Building
- Solar Panel 2: Science Building
- Solar Panel 3: Library
- Battery Storage 1: Main Campus
- Battery Storage 2: East Campus

---

### 4️⃣ HISTORY PAGE

**What You'll See:**
A table showing historical energy data:

**Table Columns:**
- Date & Time
- Energy Generated (kWh)
- Energy Used (kWh)
- Battery Level (%)

**Filter Buttons (Top of page):**
- **Today** - Shows today's data only
- **7 Days** - Shows last 7 days
- **30 Days** - Shows last 30 days

**What You Can Do:**
1. Click filter buttons to change time period
2. Scroll through historical data
3. Compare energy generation vs usage
4. Track battery level trends

**Pre-loaded Data:**
- System comes with 7 days (168 hours) of sample data
- New data added every 5 seconds

---

### 5️⃣ ALERTS PAGE

**What You'll See:**
List of all system alerts with color coding:

**Alert Types:**
- **High Severity** (Red background)
  - Example: "Battery level critically low"
  
- **Medium Severity** (Orange background)
  - Example: "Solar panel temperature high"
  
- **Low Severity** (Blue background)
  - Example: "Device offline"

**Each Alert Shows:**
- Alert message
- Timestamp
- Status (active/resolved)

**What You Can Do:**
- View all alerts
- Check alert severity
- See when alerts occurred
- Click "Refresh" to reload

**Automatic Alerts:**
System automatically creates alerts when:
- Battery level < 20%
- Temperature > 35°C

---

### 6️⃣ PREDICTION PAGE

**What You'll See:**

**Top Section:**
- Summary card showing "Tomorrow's Predicted Energy"
- Total kWh predicted for next 24 hours

**Chart Section:**
- Bar chart showing 24-hour prediction
- Green bars: Predicted energy generation
- Red bars: Predicted energy usage
- X-axis: Hours (0-23)
- Y-axis: kW

**How Prediction Works:**
- Based on last 7 days average
- Considers time of day (solar generation higher during daytime)
- Simple algorithm: averages historical data and applies solar curve

**What You Can Do:**
- View tomorrow's energy forecast
- Plan energy usage
- Compare predicted generation vs usage

---

### 7️⃣ EXPORT PAGE

**What You'll See:**
Two export options in card format:

**Card 1: Export Energy Logs**
- 📊 Icon
- Description: "Download all energy generation and consumption data"
- Button: "Download CSV"

**Card 2: Export Device Data**
- ⚡ Icon
- Description: "Download all device information and status"
- Button: "Download CSV"

**What You Can Do:**
1. Click "Download CSV" on Energy Logs
   - Downloads: `energy_logs.csv`
   - Contains: ID, Timestamp, Energy Generated, Energy Used, Battery Level
   
2. Click "Download CSV" on Device Data
   - Downloads: `devices.csv`
   - Contains: ID, Name, Type, Status, Location, Coordinates, Last Update

**Use Cases:**
- Open in Excel for analysis
- Create reports
- Backup data
- Share with stakeholders

---

### 8️⃣ USER MANAGEMENT PAGE (Admin Only)

**What You'll See:**
Table of all users in the system:

**Table Columns:**
- ID
- Email
- Role (badge: Admin or Viewer)
- Created At
- Actions (Delete button)

**What You Can Do:**

**Add New User:**
1. Click "Add User" button (top of page)
2. Modal window appears
3. Fill in:
   - Email
   - Password
   - Role (dropdown: Viewer or Admin)
4. Click "Create User"
5. New user appears in table

**Delete User:**
1. Click "Delete" button next to user
2. Confirm deletion
3. User removed from system
4. Note: Cannot delete your own account

**User Roles:**
- **Admin:** Full access to all features + user management
- **Viewer:** Read-only access (cannot modify data or manage users)

---

## 🎯 Common Tasks

### Task 1: Monitor Real-time Energy
1. Go to **Dashboard**
2. Watch "Live Solar Panel Data" panel
3. See voltage, current, temperature, power update every 5 seconds

### Task 2: Check Device Status
1. Go to **Devices**
2. Look at Status column
3. Green badge = Active, Red badge = Offline

### Task 3: Turn Off a Device
1. Go to **Devices**
2. Find device in table
3. Click "Turn Off" button
4. Status changes to "offline"

### Task 4: View Energy History
1. Go to **History**
2. Click "7 Days" button
3. Scroll through table to see past week's data

### Task 5: Export Data
1. Go to **Export**
2. Click "Download CSV" on Energy Logs
3. Open downloaded file in Excel

### Task 6: Add New User
1. Go to **Users** (Admin only)
2. Click "Add User"
3. Enter: email, password, role
4. Click "Create User"

### Task 7: Check Predictions
1. Go to **Prediction**
2. See tomorrow's total predicted energy
3. View 24-hour chart

### Task 8: View Device Locations
1. Go to **Map**
2. Click on any marker
3. See device details in popup

---

## 🔔 Understanding Alerts

**Alert Colors:**
- 🔴 **Red** = High severity (immediate attention needed)
- 🟠 **Orange** = Medium severity (monitor closely)
- 🔵 **Blue** = Low severity (informational)

**Common Alerts:**
- "Battery level critically low" - Battery < 20%
- "Solar panel temperature high" - Temp > 35°C
- "Panel not responding" - Device offline

---

## 💡 Tips & Tricks

1. **Keep Dashboard Open** - Best overview of system
2. **Watch Real-time Updates** - Data refreshes every 5 seconds
3. **Use Filters** - History page has Today/7 Days/30 Days filters
4. **Export Regularly** - Download CSV files for backup
5. **Check Alerts Daily** - Stay on top of issues
6. **Use Map** - Visual way to see device locations
7. **Monitor Predictions** - Plan ahead for energy needs

---

## 🚪 Logout

Click the **Logout** button at the bottom of the sidebar (left side).

---

**Need Help?** Check README.md or QUICK_START.md for more information.

