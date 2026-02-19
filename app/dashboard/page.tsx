"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sun, Battery, Zap, TrendingUp, AlertTriangle, Users, Building2, LogOut, Menu, X } from 'lucide-react'

interface User {
  id: number
  email: string
  role: string
  fullName: string
  universityId: number
}

interface SolarData {
  voltage: number
  current: number
  temperature: number
  power: number
}

interface BatteryData {
  level: number
  voltage: number
  charging: boolean
}

interface RealtimeData {
  type: string
  timestamp: string
  solar: SolarData
  battery: BatteryData
  consumption: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [realtimeData, setRealtimeData] = useState<RealtimeData | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [ws, setWs] = useState<WebSocket | null>(null)

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    
    if (!token || !userStr) {
      router.push('/login')
      return
    }

    try {
      const userData = JSON.parse(userStr)
      setUser(userData)
    } catch (err) {
      router.push('/login')
    }

    // Setup WebSocket for real-time data
    const websocket = new WebSocket('ws://localhost:3001')
    
    websocket.onopen = () => {
      console.log('Connected to WebSocket')
    }

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setRealtimeData(data)
      } catch (err) {
        console.error('Error parsing WebSocket data:', err)
      }
    }

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    setWs(websocket)

    return () => {
      if (websocket) {
        websocket.close()
      }
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    if (ws) {
      ws.close()
    }
    router.push('/login')
  }

  if (!user || !realtimeData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const solarPower = realtimeData.solar.power / 1000 // Convert to kW
  const batteryLevel = realtimeData.battery.level
  const consumption = realtimeData.consumption / 1000 // Convert to kW

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-lg">
                <Sun className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">EcoVolt</h1>
                <p className="text-xs text-gray-500">Energy Management</p>
              </div>
            </div>

            {/* User Info & Logout */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-gray-900">{user.fullName || user.email}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Solar Power */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Sun className="w-6 h-6 text-yellow-600" />
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                Live
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Solar Power</h3>
            <p className="text-3xl font-bold text-gray-900">{solarPower.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-1">kW</p>
          </div>

          {/* Battery Level */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Battery className="w-6 h-6 text-green-600" />
              </div>
              {realtimeData.battery.charging && (
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  Charging
                </span>
              )}
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Battery Level</h3>
            <p className="text-3xl font-bold text-gray-900">{batteryLevel.toFixed(1)}</p>
            <p className="text-sm text-gray-500 mt-1">%</p>
            {/* Battery Level Bar */}
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  batteryLevel > 60 ? 'bg-green-500' : 
                  batteryLevel > 30 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${batteryLevel}%` }}
              />
            </div>
          </div>

          {/* Energy Consumption */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Zap className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Consumption</h3>
            <p className="text-3xl font-bold text-gray-900">{consumption.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-1">kW</p>
          </div>

          {/* Net Energy */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Net Energy</h3>
            <p className={`text-3xl font-bold ${
              solarPower - consumption >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {(solarPower - consumption).toFixed(2)}
            </p>
            <p className="text-sm text-gray-500 mt-1">kW</p>
          </div>
        </div>

        {/* Solar Panel Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Panel Metrics */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Sun className="w-5 h-5 mr-2 text-yellow-600" />
              Solar Panel Metrics
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-sm text-gray-600">Voltage</span>
                <span className="text-lg font-semibold text-gray-900">
                  {realtimeData.solar.voltage.toFixed(1)} V
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-sm text-gray-600">Current</span>
                <span className="text-lg font-semibold text-gray-900">
                  {realtimeData.solar.current.toFixed(2)} A
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-sm text-gray-600">Temperature</span>
                <span className={`text-lg font-semibold ${
                  realtimeData.solar.temperature > 35 ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {realtimeData.solar.temperature.toFixed(1)} °C
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Power Output</span>
                <span className="text-lg font-semibold text-green-600">
                  {solarPower.toFixed(2)} kW
                </span>
              </div>
            </div>
          </div>

          {/* Battery Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Battery className="w-5 h-5 mr-2 text-green-600" />
              Battery Status
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-sm text-gray-600">Charge Level</span>
                <span className="text-lg font-semibold text-gray-900">
                  {batteryLevel.toFixed(1)} %
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-sm text-gray-600">Voltage</span>
                <span className="text-lg font-semibold text-gray-900">
                  {realtimeData.battery.voltage.toFixed(1)} V
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-sm text-gray-600">Status</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  realtimeData.battery.charging 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {realtimeData.battery.charging ? 'Charging' : 'Discharging'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Health</span>
                <span className="text-lg font-semibold text-green-600">
                  Excellent
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts Section */}
        {(batteryLevel < 20 || realtimeData.solar.temperature > 35) && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
              Active Alerts
            </h2>
            <div className="space-y-3">
              {batteryLevel < 20 && (
                <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-900">Critical Battery Level</p>
                    <p className="text-sm text-red-700">Battery level is below 20%. Please charge immediately.</p>
                  </div>
                </div>
              )}
              {realtimeData.solar.temperature > 35 && (
                <div className="flex items-start space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-900">High Panel Temperature</p>
                    <p className="text-sm text-yellow-700">Solar panel temperature is above normal. Monitor for efficiency.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* System Info */}
        <div className="mt-8 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Sun className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">System Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Last Updated</p>
                  <p className="font-medium text-gray-900">
                    {new Date(realtimeData.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">System Status</p>
                  <p className="font-medium text-green-600">Operational</p>
                </div>
                <div>
                  <p className="text-gray-600">Connection</p>
                  <p className="font-medium text-green-600">Connected</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
