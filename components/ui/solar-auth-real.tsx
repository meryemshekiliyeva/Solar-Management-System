"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Sun, Battery, LineChart, Zap, Settings, Eye, EyeOff, Mail, Lock, CheckCircle2, User, Building2 } from "lucide-react"

interface SolarAuthProps extends React.HTMLAttributes<HTMLDivElement> {}

interface University {
  id: number
  name: string
  domain: string
}

export function SolarAuthReal({ className, ...props }: SolarAuthProps) {
  const router = useRouter()
  const [isLogin, setIsLogin] = React.useState(true)
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [fullName, setFullName] = React.useState("")
  const [role, setRole] = React.useState("")
  const [universityId, setUniversityId] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [successMessage, setSuccessMessage] = React.useState("")
  const [universities, setUniversities] = React.useState<University[]>([])

  // Fetch universities on mount
  React.useEffect(() => {
    fetchUniversities()
  }, [])

  const fetchUniversities = async () => {
    try {
      const response = await fetch('/api/universities')
      const data = await response.json()
      setUniversities(data)
    } catch (err) {
      console.error('Error fetching universities:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccessMessage("")

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'
      const body: any = {
        email,
        password,
        role
      }

      // Add university for non-admin roles
      if (!['admin', 'super_admin'].includes(role)) {
        body.universityId = universityId
      }

      // Add full name for registration
      if (!isLogin) {
        body.fullName = fullName
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed')
      }

      if (isLogin) {
        // Store token in localStorage
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        
        setSuccessMessage('Login successful!')
        setTimeout(() => {
          router.push('/dashboard')
        }, 1000)
      } else {
        // Registration successful
        setSuccessMessage(data.message)
        if (data.autoApproved) {
          setTimeout(() => {
            setIsLogin(true)
            setPassword('')
          }, 2000)
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const showUniversitySelect = role && !['admin', 'super_admin'].includes(role)

  return (
    <div
      className={cn("min-h-screen w-full relative overflow-hidden", className)}
      {...props}
    >
      {/* Renewable Energy Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 via-orange-500 to-green-600">
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/30 to-transparent" />
        
        {/* Animated Solar Particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-yellow-300/30 rounded-full animate-pulse"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
          
          {/* Left Side - Branding */}
          <div className="hidden lg:flex flex-col space-y-8 text-white">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                  <Sun className="w-10 h-10 text-yellow-300" />
                </div>
                <h1 className="text-5xl font-bold tracking-tight">SolarCore</h1>
              </div>
              <p className="text-xl text-white/90 font-light">
                Monitor and optimize your solar energy
              </p>
            </div>

            {/* Feature Icons */}
            <div className="grid grid-cols-2 gap-4 pt-8">
              <div className="flex items-center space-x-3 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-all">
                <Battery className="w-8 h-8 text-green-300" />
                <div>
                  <p className="font-semibold">Energy Storage</p>
                  <p className="text-sm text-white/70">Smart battery management</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-all">
                <LineChart className="w-8 h-8 text-blue-300" />
                <div>
                  <p className="font-semibold">Analytics</p>
                  <p className="text-sm text-white/70">Real-time insights</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-all">
                <Zap className="w-8 h-8 text-yellow-300" />
                <div>
                  <p className="font-semibold">Performance</p>
                  <p className="text-sm text-white/70">Optimize output</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-all">
                <Settings className="w-8 h-8 text-orange-300" />
                <div>
                  <p className="font-semibold">Control</p>
                  <p className="text-sm text-white/70">System management</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Auth Form */}
          <div className="w-full max-w-md mx-auto">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8">
              
              {/* Mobile Logo */}
              <div className="lg:hidden flex items-center justify-center space-x-2 mb-6">
                <Sun className="w-8 h-8 text-orange-500" />
                <h2 className="text-2xl font-bold text-gray-900">SolarCore</h2>
              </div>

              <div className="space-y-6">
                <div className="space-y-2 text-center lg:text-left">
                  <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                  </h2>
                  <p className="text-gray-600">
                    {isLogin 
                      ? 'Sign in to access your solar dashboard' 
                      : 'Join the solar energy management platform'
                    }
                  </p>
                </div>

                {/* Toggle Auth Mode */}
                <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(true)
                      setError("")
                      setSuccessMessage("")
                    }}
                    className={cn(
                      "flex-1 py-2 px-4 rounded-md font-medium transition-all",
                      isLogin 
                        ? "bg-white text-orange-600 shadow-sm" 
                        : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(false)
                      setError("")
                      setSuccessMessage("")
                    }}
                    className={cn(
                      "flex-1 py-2 px-4 rounded-md font-medium transition-all",
                      !isLogin 
                        ? "bg-white text-orange-600 shadow-sm" 
                        : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    Sign Up
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Full Name (Registration only) */}
                  {!isLogin && (
                    <div className="space-y-2">
                      <label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          id="fullName"
                          type="text"
                          placeholder="John Doe"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                          className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-400"
                        />
                      </div>
                    </div>
                  )}

                  {/* Role Selection */}
                  <div className="space-y-2">
                    <label htmlFor="role" className="text-sm font-medium text-gray-700">
                      Role
                    </label>
                    <select
                      id="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-gray-900"
                    >
                      <option value="">Select your role</option>
                      <option value="student">Student</option>
                      <option value="viewer">Viewer</option>
                      <option value="admin">Admin</option>
                      {isLogin && <option value="super_admin">Super Admin</option>}
                    </select>
                  </div>

                  {/* University Selection */}
                  {showUniversitySelect && (
                    <div className="space-y-2">
                      <label htmlFor="university" className="text-sm font-medium text-gray-700">
                        University
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        <select
                          id="university"
                          value={universityId}
                          onChange={(e) => setUniversityId(e.target.value)}
                          required
                          className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-gray-900 appearance-none"
                        >
                          <option value="">Select your university</option>
                          {universities.map((uni) => (
                            <option key={uni.id} value={uni.id}>
                              {uni.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      {universityId && (
                        <p className="text-xs text-gray-500">
                          Email must end with @{universities.find(u => u.id === Number(universityId))?.domain}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Email Input */}
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  {/* Success Message */}
                  {successMessage && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-600">{successMessage}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={cn(
                      "w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-300",
                      "focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2",
                      "bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600",
                      isLoading && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center space-x-2">
                        <svg
                          className="animate-spin h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
                      </span>
                    ) : (
                      isLogin ? 'Sign In' : 'Create Account'
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Footer Info */}
            <p className="mt-6 text-center text-sm text-white/80">
              Secure authentication powered by SolarCore™
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
