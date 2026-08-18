"use client"
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '../../utils/supabase'

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [categories, setCategories] = useState<any[]>([]) 

  useEffect(() => {
    checkUser()
    fetchCategories() 
    
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

  // 🌟 FUNCTION: Fetch Tour Categories (Themes)
  async function fetchCategories() {
    const { data, error } = await supabase
      .from('tour_categories')
      .select('*')
      .order('created_at', { ascending: true }) 
      
    if (data && !error) {
      setCategories(data)
    }
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo Section */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-2xl font-extrabold tracking-tight flex items-center flex-wrap">
              <span className="text-orange-500">India</span> 
              <span className="text-blue-400 ml-1">Tour</span> 
              <span className="text-green-500 ml-1">Operators</span>
              <span className="text-gray-400 text-sm ml-1">.com</span>
            </Link>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex space-x-8 h-full items-center">
            <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Home</Link>
            
            {/* 🌟 MEGA MENU ITEM: INDIA PACKAGES 🌟 */}
            <div className="group relative flex items-center h-full">
              <button className="text-gray-700 font-medium hover:text-blue-600 transition-colors flex items-center gap-1 h-full py-5">
                India Packages
                <span className="text-[10px]">▼</span>
              </button>

              {/* MEGA MENU DROPDOWN PANEL */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-[900px] bg-white rounded-b-2xl shadow-2xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top -translate-y-2 group-hover:translate-y-0">
                
                {/* 4 COLUMNS GRID with Vertical Dividers (divide-x) */}
                <div className="grid grid-cols-4 divide-x divide-gray-200 p-6 text-left cursor-default">
                  
                  {/* 🌟 COLUMN 1: STATES (Search Links) 🌟 */}
                  <div className="px-4">
                    <h3 className="text-xs font-black text-orange-600 uppercase tracking-widest mb-4">Popular Destinations</h3>
                    <ul className="space-y-3 text-sm font-medium text-gray-600">
                      <li><Link href="/search?destination=Maharashtra" className="hover:text-blue-600 transition-colors block">Maharashtra Tour Packages</Link></li>
                      <li><Link href="/search?destination=Kerala" className="hover:text-blue-600 transition-colors block">Kerala Tour Packages</Link></li>
                      <li><Link href="/search?destination=Goa" className="hover:text-blue-600 transition-colors block">Goa Tour Packages</Link></li>
                      <li><Link href="/search?destination=Rajasthan" className="hover:text-blue-600 transition-colors block">Rajasthan Tour Packages</Link></li>
                      <li><Link href="/search?destination=Kashmir" className="hover:text-blue-600 transition-colors block">Kashmir Tour Packages</Link></li>
                      <li><Link href="/search?destination=Himachal" className="hover:text-blue-600 transition-colors block">Himachal Tour Packages</Link></li>
                      <li className="pt-2"><Link href="/destinations" className="text-blue-600 hover:underline">View All Destinations →</Link></li>
                    </ul>
                  </div>

                  {/* 🌟 COLUMN 2 & 3: DYNAMIC TOUR CATEGORIES 🌟 */}
                  <div className="col-span-2 grid grid-cols-2 divide-x divide-gray-200">
                    
                    {/* First Half of Categories */}
                    <div className="px-4">
                      <h3 className="text-xs font-black text-orange-600 uppercase tracking-widest mb-4">Tour Themes</h3>
                      <ul className="space-y-3 text-sm font-medium text-gray-600">
                        {categories.slice(0, Math.ceil(categories.length / 2)).map((cat) => (
                          <li key={cat.id}>
                            <Link href={`/search?theme=${cat.value}`} className="hover:text-blue-600 transition-colors block">
                              {cat.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Second Half of Categories */}
                    <div className="px-4">
                      <h3 className="text-xs font-black text-orange-600 uppercase tracking-widest mb-4">More Themes</h3>
                      <ul className="space-y-3 text-sm font-medium text-gray-600">
                        {categories.slice(Math.ceil(categories.length / 2)).map((cat) => (
                          <li key={cat.id}>
                            <Link href={`/search?theme=${cat.value}`} className="hover:text-blue-600 transition-colors block">
                              {cat.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>

                  </div>

                  {/* COLUMN 4: TRENDING */}
                  <div className="px-4">
                    <h3 className="text-xs font-black text-orange-600 uppercase tracking-widest mb-4">Trending This Month</h3>
                    <ul className="space-y-3 text-sm font-medium text-gray-600">
                      <li><Link href="/category/trending" className="hover:text-blue-600 transition-colors block">Trending Tours</Link></li>
                      <li><Link href="/category/offers" className="hover:text-blue-600 transition-colors block">Special Offers</Link></li>
                      <li><Link href="/category/group" className="hover:text-blue-600 transition-colors block">Group Departures</Link></li>
                      <li className="pt-2"><Link href="/search?service=tour" className="text-blue-600 hover:underline">View All Tours →</Link></li>
                    </ul>
                  </div>

                </div>
              </div>
            </div>

            {/* 🌟 CABS DROPDOWN MENU 🌟 */}
            <div className="group relative flex items-center h-full">
              <button className="text-gray-700 font-medium hover:text-blue-600 transition-colors flex items-center gap-1 h-full py-5">
                Cabs
                <span className="text-[10px]">▼</span>
              </button>

              {/* Cabs Dropdown Panel */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-[450px] bg-white rounded-b-2xl shadow-2xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top -translate-y-2 group-hover:translate-y-0">
                
                {/* 2 COLUMNS GRID for Local and Outstation */}
                <div className="grid grid-cols-2 divide-x divide-gray-200 p-6 text-left cursor-default">
                  
                  {/* LOCAL CABS */}
                  <div className="px-4">
                    <h3 className="text-xs font-black text-orange-600 uppercase tracking-widest mb-4">Local Cabs</h3>
                    <ul className="space-y-3 text-sm font-medium text-gray-600">
                      <li>
                        {/* 🌟 MODIFIED TO SEARCH PAGE */}
                        <Link href="/search?service=cab&type=local&cabType=point-to-point" className="hover:text-blue-600 transition-colors block">
                          Point 2 Point
                        </Link>
                      </li>
                      <li>
                        {/* 🌟 MODIFIED TO SEARCH PAGE */}
                        <Link href="/search?service=cab&type=local&cabType=package" className="hover:text-blue-600 transition-colors block">
                          Local Package
                        </Link>
                      </li>
                    </ul>
                  </div>

                  {/* OUTSTATION CABS */}
                  <div className="px-4">
                    <h3 className="text-xs font-black text-orange-600 uppercase tracking-widest mb-4">Outstation Cabs</h3>
                    <ul className="space-y-3 text-sm font-medium text-gray-600">
                      <li>
                        {/* 🌟 MODIFIED TO SEARCH PAGE */}
                        <Link href="/search?service=cab&type=outstation&cabType=one-way" className="hover:text-blue-600 transition-colors block">
                          One Way Trip
                        </Link>
                      </li>
                      <li>
                        {/* 🌟 MODIFIED TO SEARCH PAGE */}
                        <Link href="/search?service=cab&type=outstation&cabType=round-trip" className="hover:text-blue-600 transition-colors block">
                          Round Trip
                        </Link>
                      </li>
                    </ul>
                  </div>

                </div>
                
                {/* Optional Bottom Link for all cabs */}
                <div className="bg-gray-50 p-4 text-center rounded-b-2xl border-t border-gray-100">
                  {/* 🌟 MODIFIED TO SEARCH PAGE */}
                  <Link href="/search?service=cab" className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">
                    View All Cab Services →
                  </Link>
                </div>

              </div>
            </div>
            
            {/* Hotels Link */}
            <Link href="/search?service=hotel" className="text-gray-700 hover:text-blue-600 font-medium transition-colors h-full flex items-center">Hotels</Link>
          </nav>

          {/* Right Section (Login / Dashboard) */}
          <div className="flex items-center space-x-4">
            {isLoggedIn ? (
              <Link href="/vendor" className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-bold hover:bg-blue-100 transition-colors">
                Dashboard
              </Link>
            ) : (
              <Link href="/login" className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm">
                Become a Partner
              </Link>
            )}
          </div>

        </div>
      </div>
    </header>
  )
}