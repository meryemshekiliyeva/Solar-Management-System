"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Sun, Wind, Droplets, Zap, Calculator, TrendingUp, Info } from "lucide-react"

interface EnergyCalculatorProps extends React.HTMLAttributes<HTMLDivElement> {}

type EnergyType = 'solar' | 'wind' | 'hydro'

interface SolarInputs {
  panelArea: number
  efficiency: number
  sunHours: number
  systemLoss: number
}

interface WindInputs {
  rotorDiameter: number
  windSpeed: number
  airDensity: number
  efficiency: number
}

interface HydroInputs {
  flowRate: number
  height: number
  efficiency: number
  gravity: number
}

export function EnergyCalculator({ className, ...props }: EnergyCalculatorProps) {
  const [activeTab, setActiveTab] = React.useState<EnergyType>('solar')
  
  // Solar inputs
  const [solarInputs, setSolarInputs] = React.useState<SolarInputs>({
    panelArea: 20,
    efficiency: 18,
    sunHours: 5,
    systemLoss: 14
  })
  
  // Wind inputs
  const [windInputs, setWindInputs] = React.useState<WindInputs>({
    rotorDiameter: 10,
    windSpeed: 12,
    airDensity: 1.225,
    efficiency: 35
  })
  
  // Hydro inputs
  const [hydroInputs, setHydroInputs] = React.useState<HydroInputs>({
    flowRate: 100,
    height: 50,
    efficiency: 85,
    gravity: 9.81
  })

  // Solar calculation based on Omnicalculator formula
  // Power = Area × Solar Irradiance × Efficiency × (1 - System Loss)
  const calculateSolar = () => {
    const solarIrradiance = 1000 // W/m² (standard test conditions)
    const peakPower = (solarInputs.panelArea * solarIrradiance * solarInputs.efficiency / 100) * (1 - solarInputs.systemLoss / 100)
    const dailyEnergy = (peakPower * solarInputs.sunHours) / 1000 // kWh per day
    const monthlyEnergy = dailyEnergy * 30
    const yearlyEnergy = dailyEnergy * 365
    
    return {
      peakPower: peakPower.toFixed(2),
      dailyEnergy: dailyEnergy.toFixed(2),
      monthlyEnergy: monthlyEnergy.toFixed(2),
      yearlyEnergy: yearlyEnergy.toFixed(2)
    }
  }

  // Wind calculation based on Omnicalculator formula
  // Power = 0.5 × Air Density × Swept Area × Wind Speed³ × Efficiency
  const calculateWind = () => {
    const radius = windInputs.rotorDiameter / 2
    const sweptArea = Math.PI * radius * radius // m²
    const power = 0.5 * windInputs.airDensity * sweptArea * Math.pow(windInputs.windSpeed, 3) * (windInputs.efficiency / 100)
    const dailyEnergy = (power * 24) / 1000 // kWh per day
    const monthlyEnergy = dailyEnergy * 30
    const yearlyEnergy = dailyEnergy * 365
    
    return {
      power: power.toFixed(2),
      sweptArea: sweptArea.toFixed(2),
      dailyEnergy: dailyEnergy.toFixed(2),
      monthlyEnergy: monthlyEnergy.toFixed(2),
      yearlyEnergy: yearlyEnergy.toFixed(2)
    }
  }

  // Hydro calculation based on Omnicalculator formula
  // Power = Density × Flow Rate × Gravity × Height × Efficiency
  const calculateHydro = () => {
    const waterDensity = 1000 // kg/m³
    const power = waterDensity * hydroInputs.flowRate * hydroInputs.gravity * hydroInputs.height * (hydroInputs.efficiency / 100)
    const powerKW = power / 1000 // kW
    const dailyEnergy = (powerKW * 24) // kWh per day
    const monthlyEnergy = dailyEnergy * 30
    const yearlyEnergy = dailyEnergy * 365
    
    return {
      power: powerKW.toFixed(2),
      dailyEnergy: dailyEnergy.toFixed(2),
      monthlyEnergy: monthlyEnergy.toFixed(2),
      yearlyEnergy: yearlyEnergy.toFixed(2)
    }
  }

  const solarResults = calculateSolar()
  const windResults = calculateWind()
  const hydroResults = calculateHydro()

  const tabs = [
    { id: 'solar' as EnergyType, label: 'Solar Panels', icon: Sun, color: 'text-yellow-500' },
    { id: 'wind' as EnergyType, label: 'Wind Turbines', icon: Wind, color: 'text-blue-500' },
    { id: 'hydro' as EnergyType, label: 'Hydroelectric', icon: Droplets, color: 'text-cyan-500' }
  ]

  return (
    <div className={cn("w-full max-w-6xl mx-auto p-6", className)} {...props}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-yellow-400 via-green-500 to-blue-500 rounded-lg">
            <Calculator className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Renewable Energy Calculator
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 ml-14">
          Calculate energy output for solar, wind, and hydroelectric power systems
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-lg"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              )}
            >
              <Icon className={cn("w-5 h-5", activeTab === tab.id && tab.color)} />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Inputs Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
            <Zap className="w-5 h-5 text-yellow-500" />
            System Parameters
          </h2>

          {/* Solar Inputs */}
          {activeTab === 'solar' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Panel Area (m²)
                </label>
                <input
                  type="number"
                  value={solarInputs.panelArea}
                  onChange={(e) => setSolarInputs({ ...solarInputs, panelArea: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., 20"
                  min="0"
                  step="0.1"
                />
                <p className="text-xs text-gray-500 mt-1">Total surface area of solar panels</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Panel Efficiency (%)
                </label>
                <input
                  type="number"
                  value={solarInputs.efficiency}
                  onChange={(e) => setSolarInputs({ ...solarInputs, efficiency: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., 18"
                  min="0"
                  max="100"
                  step="0.1"
                />
                <p className="text-xs text-gray-500 mt-1">Typical panels: 15-22%</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Peak Sun Hours (h/day)
                </label>
                <input
                  type="number"
                  value={solarInputs.sunHours}
                  onChange={(e) => setSolarInputs({ ...solarInputs, sunHours: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., 5"
                  min="0"
                  max="24"
                  step="0.1"
                />
                <p className="text-xs text-gray-500 mt-1">Average daily sunlight hours at peak intensity</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  System Loss (%)
                </label>
                <input
                  type="number"
                  value={solarInputs.systemLoss}
                  onChange={(e) => setSolarInputs({ ...solarInputs, systemLoss: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., 14"
                  min="0"
                  max="100"
                  step="0.1"
                />
                <p className="text-xs text-gray-500 mt-1">Wiring, inverter, and other losses (10-15%)</p>
              </div>
            </div>
          )}

          {/* Wind Inputs */}
          {activeTab === 'wind' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rotor Diameter (m)
                </label>
                <input
                  type="number"
                  value={windInputs.rotorDiameter}
                  onChange={(e) => setWindInputs({ ...windInputs, rotorDiameter: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., 10"
                  min="0"
                  step="0.1"
                />
                <p className="text-xs text-gray-500 mt-1">Diameter of turbine rotor blades</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Wind Speed (m/s)
                </label>
                <input
                  type="number"
                  value={windInputs.windSpeed}
                  onChange={(e) => setWindInputs({ ...windInputs, windSpeed: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., 12"
                  min="0"
                  step="0.1"
                />
                <p className="text-xs text-gray-500 mt-1">Average wind speed at hub height</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Air Density (kg/m³)
                </label>
                <input
                  type="number"
                  value={windInputs.airDensity}
                  onChange={(e) => setWindInputs({ ...windInputs, airDensity: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., 1.225"
                  min="0"
                  step="0.001"
                />
                <p className="text-xs text-gray-500 mt-1">Sea level: 1.225 kg/m³</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Turbine Efficiency (%)
                </label>
                <input
                  type="number"
                  value={windInputs.efficiency}
                  onChange={(e) => setWindInputs({ ...windInputs, efficiency: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., 35"
                  min="0"
                  max="100"
                  step="0.1"
                />
                <p className="text-xs text-gray-500 mt-1">Typical turbines: 25-45%</p>
              </div>
            </div>
          )}

          {/* Hydro Inputs */}
          {activeTab === 'hydro' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Water Flow Rate (m³/s)
                </label>
                <input
                  type="number"
                  value={hydroInputs.flowRate}
                  onChange={(e) => setHydroInputs({ ...hydroInputs, flowRate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., 100"
                  min="0"
                  step="0.1"
                />
                <p className="text-xs text-gray-500 mt-1">Volume of water flowing per second</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Head Height (m)
                </label>
                <input
                  type="number"
                  value={hydroInputs.height}
                  onChange={(e) => setHydroInputs({ ...hydroInputs, height: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., 50"
                  min="0"
                  step="0.1"
                />
                <p className="text-xs text-gray-500 mt-1">Vertical height difference (head)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Turbine Efficiency (%)
                </label>
                <input
                  type="number"
                  value={hydroInputs.efficiency}
                  onChange={(e) => setHydroInputs({ ...hydroInputs, efficiency: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., 85"
                  min="0"
                  max="100"
                  step="0.1"
                />
                <p className="text-xs text-gray-500 mt-1">Typical hydro turbines: 80-90%</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Gravity (m/s²)
                </label>
                <input
                  type="number"
                  value={hydroInputs.gravity}
                  onChange={(e) => setHydroInputs({ ...hydroInputs, gravity: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., 9.81"
                  min="0"
                  step="0.01"
                />
                <p className="text-xs text-gray-500 mt-1">Standard gravity: 9.81 m/s²</p>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex gap-2">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-300">
                <p className="font-medium mb-1">Calculation Notes:</p>
                <p className="text-xs">
                  {activeTab === 'solar' && "Based on standard test conditions (1000 W/m² irradiance, 25°C)"}
                  {activeTab === 'wind' && "Power varies with the cube of wind speed - small changes have big effects"}
                  {activeTab === 'hydro' && "Power = ρ × Q × g × h × η (density × flow × gravity × height × efficiency)"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Energy Output
          </h2>

          {/* Solar Results */}
          {activeTab === 'solar' && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Peak Power</span>
                  <Sun className="w-4 h-4 text-yellow-600" />
                </div>
                <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-400">{solarResults.peakPower} W</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Maximum instantaneous power</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Daily</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{solarResults.dailyEnergy}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">kWh</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Monthly</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{solarResults.monthlyEnergy}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">kWh</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Yearly</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{solarResults.yearlyEnergy}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">kWh</p>
                </div>
              </div>

              {/* Visual Progress Bar */}
              <div className="mt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Energy Production</span>
                  <span className="text-gray-900 dark:text-white font-medium">{solarResults.yearlyEnergy} kWh/year</span>
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((parseFloat(solarResults.yearlyEnergy) / 10000) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Wind Results */}
          {activeTab === 'wind' && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Power Output</span>
                  <Wind className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">{windResults.power} W</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Continuous power generation</p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Swept Area</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">{windResults.sweptArea} m²</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Daily</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{windResults.dailyEnergy}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">kWh</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Monthly</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{windResults.monthlyEnergy}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">kWh</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Yearly</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{windResults.yearlyEnergy}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">kWh</p>
                </div>
              </div>

              {/* Visual Progress Bar */}
              <div className="mt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Energy Production</span>
                  <span className="text-gray-900 dark:text-white font-medium">{windResults.yearlyEnergy} kWh/year</span>
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((parseFloat(windResults.yearlyEnergy) / 50000) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Hydro Results */}
          {activeTab === 'hydro' && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-xl border border-cyan-200 dark:border-cyan-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Power Output</span>
                  <Droplets className="w-4 h-4 text-cyan-600" />
                </div>
                <p className="text-3xl font-bold text-cyan-700 dark:text-cyan-400">{hydroResults.power} kW</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Continuous power generation</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Daily</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{hydroResults.dailyEnergy}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">kWh</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Monthly</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{hydroResults.monthlyEnergy}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">kWh</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Yearly</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{hydroResults.yearlyEnergy}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">kWh</p>
                </div>
              </div>

              {/* Visual Progress Bar */}
              <div className="mt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Energy Production</span>
                  <span className="text-gray-900 dark:text-white font-medium">{hydroResults.yearlyEnergy} kWh/year</span>
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((parseFloat(hydroResults.yearlyEnergy) / 1000000) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Comparison Card */}
          <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
            <h3 className="text-sm font-semibold text-green-800 dark:text-green-400 mb-2">Environmental Impact</h3>
            <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
              <p>• CO₂ saved: ~{(parseFloat(activeTab === 'solar' ? solarResults.yearlyEnergy : activeTab === 'wind' ? windResults.yearlyEnergy : hydroResults.yearlyEnergy) * 0.5).toFixed(0)} kg/year</p>
              <p>• Equivalent trees planted: ~{Math.round(parseFloat(activeTab === 'solar' ? solarResults.yearlyEnergy : activeTab === 'wind' ? windResults.yearlyEnergy : hydroResults.yearlyEnergy) * 0.5 / 21)} trees</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
          Calculations based on standard formulas from Omnicalculator. Results are estimates and actual performance may vary based on location, weather, and system configuration.
        </p>
      </div>
    </div>
  )
}
