# 🌞 University Solar Panel and Battery Management System

A complete web-based IoT monitoring system for managing solar panels and battery storage at university campuses.

## ✨ Features

### Core Functionality
- ⚡ **Real-time Solar Energy Monitoring** - Live voltage, current, temperature, and power readings
- 🔋 **Battery Level Monitoring** - Real-time battery status and charging state
- 💡 **Energy Usage Tracking** - Track consumption across campus buildings
- 📊 **Interactive Dashboard** - Summary cards and live charts
- 📱 **Device Management** - View and control all solar panels and batteries
- 🔔 **Alert System** - Automatic alerts for low battery, high temperature, etc.
- 📜 **Historical Logs** - View energy data with filters (today, 7 days, 30 days)
- 👥 **User Management** - Admin and viewer roles with access control
- 🎮 **Remote Control Simulation** - Turn devices on/off remotely
- 🗺️ **Interactive Map** - View device locations on campus map
- 🔮 **Energy Prediction** - AI-based prediction for next 24 hours
- 📥 **CSV Export** - Export energy logs and device data

### Pages Included
1. **Login Page** - Secure authentication
2. **Dashboard** - Overview with cards, charts, and live monitoring
3. **Devices** - Table of all devices with status and controls
4. **Map** - Interactive map showing device locations
5. **History** - Historical energy data with filters
6. **Alerts** - All system alerts and notifications
7. **Prediction** - Energy generation predictions
8. **Export** - Download data as CSV files
9. **User Management** - Admin panel for user control

## 🛠️ Technology Stack

### Backend
- **Node.js** + **Express** - Server framework
- **SQLite** - Database
- **WebSocket (ws)** - Real-time communication
- **bcryptjs** - Password hashing
- **jsonwebtoken** - Authentication

### Frontend
- **HTML5** + **CSS3** + **JavaScript**
- **Chart.js** - Data visualization
- **Leaflet.js** - Interactive maps

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)

### Step 1: Install Dependencies

Open terminal in the project folder and run:

```bash
npm install
```

This will install all required packages:
- express
- sqlite3
- bcryptjs
- jsonwebtoken
- cors
- ws
- json2csv

### Step 2: Start the Server

```bash
npm start
```

Or for development with auto-restart:

```bash
npm run dev
```

### Step 3: Open the Application

Open your browser and navigate to:

```
http://localhost:3000
```

## 🔐 Default Login Credentials

```
Email: admin@university.edu
Password: admin123
```

## 📁 Project Structure

```
university-solar-management/
├── server.js                 # Main server file
├── package.json             # Dependencies
├── database/
│   ├── db.js               # Database setup and initialization
│   └── solar_system.db     # SQLite database (auto-created)
├── routes/
│   ├── auth.js             # Authentication routes
│   ├── devices.js          # Device management routes
│   ├── energy.js           # Energy data routes
│   ├── alerts.js           # Alert management routes
│   ├── users.js            # User management routes
│   └── export.js           # CSV export routes
└── public/
    ├── index.html          # Main HTML file
    ├── css/
    │   └── style.css       # Styling
    └── js/
        └── app.js          # Frontend JavaScript
```

## 🎯 How to Use

### For Administrators

1. **Login** with admin credentials
2. **Dashboard** - View real-time energy data and alerts
3. **Devices** - Monitor all solar panels and batteries
   - Click "Turn Off/On" to simulate device control
4. **Map** - See device locations on campus
5. **History** - View past energy data
   - Use filters: Today, 7 Days, 30 Days
6. **Alerts** - Check all system notifications
7. **Prediction** - View tomorrow's energy forecast
8. **Export** - Download CSV reports
9. **Users** - Add/remove users and assign roles

### For Viewers

Viewers have read-only access to:
- Dashboard
- Devices (view only)
- Map
- History
- Alerts
- Prediction
- Export

## 🔄 Real-time Features

The system automatically:
- Updates sensor data every 5 seconds
- Generates realistic solar panel data based on time of day
- Simulates battery charging/discharging
- Creates alerts for:
  - Battery level < 20%
  - Temperature > 35°C
- Broadcasts updates to all connected clients via WebSocket

## 📊 Sample Data

The system comes pre-loaded with:
- 3 Solar Panels (Engineering, Science, Library buildings)
- 2 Battery Storage units (Main Campus, East Campus)
- 7 days of historical energy data
- Sample alerts

## 🔧 Configuration

### Change Server Port

Edit `server.js`:
```javascript
const PORT = process.env.PORT || 3000;
```

### Change JWT Secret

Edit `routes/auth.js`:
```javascript
const JWT_SECRET = 'your-secret-key-change-in-production';
```

### Adjust Sensor Simulation Interval

Edit `server.js`:
```javascript
setInterval(simulateSensorData, 5000); // 5000ms = 5 seconds
```

## 🎨 UI Design

The interface features:
- **Color Theme**: Green (#2ecc71), White, Dark Gray (#2c3e50)
- **Sidebar Navigation** - Easy access to all pages
- **Responsive Cards** - Summary statistics
- **Interactive Charts** - Real-time data visualization
- **Clean Tables** - Device and history data
- **Professional Design** - Modern energy monitoring aesthetic

## 📱 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Devices
- `GET /api/devices` - Get all devices
- `GET /api/devices/:id` - Get device by ID
- `PUT /api/devices/:id/status` - Update device status

### Energy
- `GET /api/energy/summary/today` - Today's summary
- `GET /api/energy/logs?period=today` - Energy logs
- `GET /api/energy/hourly?hours=24` - Hourly data
- `GET /api/energy/prediction` - Energy prediction

### Alerts
- `GET /api/alerts` - Get all alerts
- `GET /api/alerts/recent` - Get recent alerts
- `PUT /api/alerts/:id/status` - Update alert status

### Users (Admin only)
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `DELETE /api/users/:id` - Delete user

### Export
- `GET /api/export/energy-logs` - Export energy logs CSV
- `GET /api/export/devices` - Export devices CSV

## 🚀 Production Deployment

For production:

1. Change JWT secret in `routes/auth.js`
2. Use environment variables for sensitive data
3. Consider using PostgreSQL instead of SQLite
4. Enable HTTPS
5. Add rate limiting
6. Implement proper logging

## 📝 License

This project is open source and available for educational purposes.

## 👨‍💻 Support

For issues or questions, please check the code comments or create an issue in the repository.

---

**Built with ❤️ for University Energy Management**

