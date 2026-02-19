"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sun } from 'lucide-react'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token')
    if (token) {
      // User is logged in, redirect to dashboard
      router.push('/dashboard')
    } else {
      // User not logged in, redirect to login
      router.push('/login')
    }
  }, [router])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-yellow-400 via-orange-500 to-green-600">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm flex flex-col">
        <div className="mb-8 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
          <Sun className="w-16 h-16 text-white animate-pulse" />
        </div>
        <h1 className="text-4xl font-bold text-center mb-4 text-white">
          EcoVolt
        </h1>
        <p className="text-center text-white/90 mb-8">
          Loading Renewable Energy Management System...
        </p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    </main>
  )
}
