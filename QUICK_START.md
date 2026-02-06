# 🚀 QUICK START GUIDE

## ⚡ Fast Setup (3 Steps)

### Step 1: Install Dependencies ✅
**Already completed!** Dependencies are installed.

### Step 2: Start the Server

**Option A - Double-click the batch file:**
- Double-click `START_SERVER.bat`

**Option B - Use terminal:**
```bash
node server.js
```

**Option C - Use npm:**
```bash
npm start
```

### Step 3: Open in Browser

Open your browser and go to:
```
http://localhost:3000
```

## 🔐 Login Credentials

```
Email: admin@university.edu
Password: admin123
```

## ✅ What You'll See

1. **Login Page** - Enter credentials above
2. **Dashboard** - Real-time energy monitoring with:
   - 4 summary cards (Energy Generated, Battery Level, Consumption, Active Devices)
   - 2 live charts (Energy Over Time, Battery Level)
   - Live solar panel data (Voltage, Current, Temperature, Power)
   - Recent alerts panel

3. **Navigation Menu** (Left sidebar):
   - 📊 Dashboard
   - ⚡ Devices
   - 🗺️ Map
   - 📜 History
   - 🔔 Alerts
   - 🔮 Prediction
   - 📥 Export
   - 👥 Users (Admin only)

## 🎯 Try These Features

### Real-time Monitoring
- Watch the live data update every 5 seconds
- See charts update automatically
- Battery level changes in real-time

### Device Control
1. Click **Devices** in sidebar
2. Click "Turn Off" button on any device
3. Watch status change to "offline"
4. Click "Turn On" to reactivate

### View Map
1. Click **Map** in sidebar
2. See all solar panels and batteries on campus map
3. Click markers to see device details

### Check History
1. Click **History** in sidebar
2. Try different filters: Today, 7 Days, 30 Days
3. See all energy generation and consumption data

### Energy Prediction
1. Click **Prediction** in sidebar
2. See tomorrow's predicted energy generation
3. View 24-hour prediction chart

### Export Data
1. Click **Export** in sidebar
2. Click "Download CSV" for energy logs
3. Click "Download CSV" for device data
4. Open files in Excel or any spreadsheet app

### User Management (Admin Only)
1. Click **Users** in sidebar
2. Click "Add User" button
3. Enter email, password, and role
4. Create new users with Viewer or Admin access

## 🔄 Real-time Features

The system automatically:
- ✅ Updates sensor data every 5 seconds
- ✅ Generates realistic solar data (more during daytime)
- ✅ Simulates battery charging/discharging
- ✅ Creates alerts when:
  - Battery level drops below 20%
  - Temperature exceeds 35°C
- ✅ Broadcasts updates to all connected browsers

## 📊 Pre-loaded Data

The system includes:
- ✅ 3 Solar Panels (Engineering, Science, Library)
- ✅ 2 Battery Storage units (Main Campus, East Campus)
- ✅ 7 days of historical energy data (168 hours)
- ✅ Sample alerts
- ✅ Default admin user

## 🎨 UI Features

- ✅ Professional green and dark gray theme
- ✅ Responsive design
- ✅ Interactive charts with Chart.js
- ✅ Interactive map with Leaflet.js
- ✅ Real-time WebSocket updates
- ✅ Clean, modern interface

## 🛑 Stop the Server

Press `Ctrl + C` in the terminal window

## 🔧 Troubleshooting

### Port Already in Use
If you see "Port 3000 already in use":
1. Close any other applications using port 3000
2. Or change the port in `server.js`:
   ```javascript
   const PORT = 3001; // Change to any available port
   ```

### Database Issues
If you have database errors:
1. Delete `database/solar_system.db`
2. Restart the server (database will be recreated)

### WebSocket Not Connecting
1. Make sure server is running
2. Refresh the browser page
3. Check browser console for errors (F12)

## 📱 Test on Mobile

The app is responsive! Try it on your phone:
1. Find your computer's IP address
2. Open `http://YOUR_IP:3000` on your phone
3. Make sure phone and computer are on same network

## 🎓 Learning Points

This project demonstrates:
- ✅ Full-stack web development
- ✅ Real-time WebSocket communication
- ✅ RESTful API design
- ✅ JWT authentication
- ✅ Database operations (SQLite)
- ✅ Data visualization (Chart.js)
- ✅ Interactive maps (Leaflet.js)
- ✅ IoT sensor simulation
- ✅ Role-based access control
- ✅ CSV data export

## 📚 Next Steps

1. Explore all 9 pages
2. Try creating new users
3. Export data to CSV
4. Watch real-time updates
5. Check the prediction algorithm
6. Customize the UI colors in `public/css/style.css`
7. Add more devices in `database/db.js`
8. Modify sensor simulation in `server.js`

## 💡 Tips

- Keep the terminal window open while using the app
- Open browser console (F12) to see WebSocket messages
- Try opening the app in multiple browser tabs to see real-time sync
- Check `database/solar_system.db` to see the SQLite database

---

**Enjoy your Solar Management System! 🌞**

