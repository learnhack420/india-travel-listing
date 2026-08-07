"use client"
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '../../utils/supabase'

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    checkUser()
    // Jab bhi auth state change ho (login/logout), tab header update ho
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session)
    })
    return () => authListener.subscription.unsubscribe()
  }, [])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    setIsLoggedIn(!!session)
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo Section */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-2xl font-extrabold tracking-tight flex items-center">
              <span className="text-orange-500">India</span> 
              <span className="text-blue-900 ml-1">Tour Operators</span> 
            </Link>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Home</Link>
            <Link href="/tours" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Tour Packages</Link>
            <Link href="/cabs" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Cabs</Link>
            <Link href="/hotels" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Hotels</Link>
          </nav>

          {/* Right Section (Login / Dashboard) */}
          <div className="flex items-center space-x-4">
            {isLoggedIn ? (
              <Link href="/vendor" className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-bold hover:bg-blue-100 transition-colors">
                Dashboard
              </Link>
            ) : (
              <Link href="/login" className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm">
                Login / Join
              </Link>
            )}
          </div>

        </div>
      </div>
    </header>
  )
}