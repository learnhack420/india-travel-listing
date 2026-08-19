"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase' 
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// 🌟 IMPORTING EXTRACTED COMPONENTS
import ManagePartners from './ManagePartners'
import ManageListings from './ManageListings'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('bookings')
  const [bookings, setBookings] = useState<any[]>([]) 
  const [categories, setCategories] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Edit Booking Modal States
  const [editingBooking, setEditingBooking] = useState<any>(null)
  const [editCustomerName, setEditCustomerName] = useState('')
  const [editCustomerMobile, setEditCustomerMobile] = useState('')

  // Category Modal States
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [catLabel, setCatLabel] = useState('')
  const [catValue, setCatValue] = useState('')
  const [showCategoryModal, setShowCategoryModal] = useState(false)

  const router = useRouter()

  useEffect(() => {
    checkAdmin()
  }, [])

  async function checkAdmin() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
      if (!profile || profile.role !== 'admin') {
        router.push('/')
        return
      }

      await Promise.all([
        fetchBookings(),
        fetchCategories() 
      ])
    } catch (error) {
      console.error("Admin check failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // ============================
  // CATEGORIES FUNCTIONS
  // ============================
  
  async function fetchCategories() {
    const { data } = await supabase.from('tour_categories').select('*').order('created_at', { ascending: true })
    if (data) setCategories(data)
  }

  async function handleSaveCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!catLabel || !catValue) return
    const formattedValue = catValue.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')

    if (editingCategory) {
      await supabase.from('tour_categories').update({ label: catLabel, value: formattedValue }).eq('id', editingCategory.id)
    } else {
      await supabase.from('tour_categories').insert([{ label: catLabel, value: formattedValue }])
    }

    setShowCategoryModal(false)
    setEditingCategory(null)
    setCatLabel('')
    setCatValue('')
    fetchCategories()
  }

  async function deleteCategory(id: string) {
    if (!window.confirm("WARNING: Kya aap is category ko delete karna chahte hain?")) return
    await supabase.from('tour_categories').delete().eq('id', id)
    fetchCategories()
  }

  const openCategoryModal = (cat: any = null) => {
    if (cat) {
      setEditingCategory(cat)
      setCatLabel(cat.label)
      setCatValue(cat.value)
    } else {
      setEditingCategory(null)
      setCatLabel('')
      setCatValue('')
    }
    setShowCategoryModal(true)
  }

  // ============================
  // BOOKINGS / LEADS FUNCTIONS
  // ============================
  
  async function fetchBookings() {
    const { data } = await supabase.from('bookings').select('*').order('created_at', { ascending: false })
    if (data) setBookings(data)
  }

  async function updateBookingStatus(id: string, newStatus: string) {
    await supabase.from('bookings').update({ status: newStatus }).eq('id', id)
    fetchBookings()
  }

  async function deleteBooking(id: string) {
    if (!window.confirm("WARNING: Kya aap sach mein is lead/booking ko permanently delete karna chahte hain?")) return
    await supabase.from('bookings').delete().eq('id', id)
    fetchBookings()
  }

  const openEditBookingModal = (booking: any) => {
    setEditingBooking(booking)
    setEditCustomerName(booking.customer_name || '')
    setEditCustomerMobile(booking.customer_mobile || '')
  }

  async function handleUpdateBooking(e: React.FormEvent) {
    e.preventDefault()
    if (!editingBooking) return
    await supabase.from('bookings').update({ customer_name: editCustomerName, customer_mobile: editCustomerMobile }).eq('id', editingBooking.id)
    setEditingBooking(null)
    fetchBookings()
  }

  const formatLocationForList = (locStr: any) => {
    if (!locStr) return 'Online / Blog'
    if (Array.isArray(locStr)) return locStr.join(', ')
    return String(locStr).replace(/ > /g, ', ')
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-xl font-bold">Checking Security...</div>

  return (
    <div className="min-h-screen p-8 bg-gray-100 relative font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-3xl font-extrabold text-gray-900">Admin Control Panel</h1>
          <div className="flex flex-wrap gap-3">
            <Link href="/add-listing/place" className="bg-teal-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors text-sm">+ Add Tourist Place</Link>
            <Link href="/add-listing/tour" className="bg-emerald-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm">+ Add Tour</Link>
            <Link href="/add-listing/hotel" className="bg-amber-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors text-sm">+ Add Hotel</Link>
            <Link href="/add-listing/cab" className="bg-blue-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">+ Add Cab</Link>
            <Link href="/add-listing/blog" className="bg-indigo-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm">+ Add Blog Article</Link>
            <button onClick={handleLogout} className="bg-red-100 text-red-600 font-bold px-4 py-2 rounded-lg hover:bg-red-200 transition-colors text-sm">Logout</button>
          </div>
        </div>

        {/* Primary Tab Buttons */}
        <div className="flex space-x-4 mb-8 overflow-x-auto pb-2">
          <button onClick={() => setActiveTab('bookings')} className={`px-6 py-3 font-bold rounded-lg transition-colors whitespace-nowrap ${activeTab === 'bookings' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>📋 Customer Bookings / Leads</button>
          <button onClick={() => setActiveTab('vendors')} className={`px-6 py-3 font-bold rounded-lg transition-colors whitespace-nowrap ${activeTab === 'vendors' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>👥 Manage Partners</button>
          <button onClick={() => setActiveTab('listings')} className={`px-6 py-3 font-bold rounded-lg transition-colors whitespace-nowrap ${activeTab === 'listings' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>📑 Manage Listings</button>
          <button onClick={() => setActiveTab('categories')} className={`px-6 py-3 font-bold rounded-lg transition-colors whitespace-nowrap ${activeTab === 'categories' ? 'bg-purple-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>🏷️ Tour Categories</button>
        </div>
        
        {/* 🌟 RENDER EXTRACTED COMPONENTS HERE 🌟 */}
        {activeTab === 'vendors' && <ManagePartners />}
        {activeTab === 'listings' && <ManageListings />}

        {/* ORIGINAL TABS CONTENT (Bookings & Categories) */}
        <div className={`${activeTab === 'bookings' || activeTab === 'categories' ? 'bg-white rounded-lg shadow-md overflow-hidden border border-gray-200' : 'hidden'}`}>
          
          {/* TAB 1: BOOKINGS & INQUIRIES */}
          {activeTab === 'bookings' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Customer Details</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Service Inquired</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Extra Details</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(booking.created_at).toLocaleDateString('en-IN')} <br/>
                        <span className="text-xs">{new Date(booking.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-gray-900">{booking.customer_name}</div>
                        <div className="text-sm font-bold text-green-600">{booking.customer_mobile}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 inline-flex text-xs leading-5 font-bold rounded-full bg-blue-100 text-blue-800 uppercase mb-1">{booking.booking_type}</span>
                        <div className="text-sm text-gray-800 font-bold">{booking.listing_title}</div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600">
                        {booking.booking_details && typeof booking.booking_details === 'object' && (
                          <div className="space-y-1">
                            {booking.booking_details.date && <div>📅 <span className="font-semibold">{booking.booking_details.date}</span></div>}
                            {booking.booking_details.pickup && <div>📍 {formatLocationForList(booking.booking_details.pickup)} ➔ {formatLocationForList(booking.booking_details.drop)}</div>}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-left text-sm font-medium">
                        <select 
                          className={`text-xs font-bold rounded-lg px-2 py-1 outline-none border-2 ${booking.status === 'New' ? 'border-red-200 bg-red-50 text-red-700' : booking.status === 'Contacted' ? 'border-yellow-200 bg-yellow-50 text-yellow-700' : 'border-green-200 bg-green-50 text-green-700'}`}
                          value={booking.status || 'New'} onChange={(e) => updateBookingStatus(booking.id, e.target.value)}
                        >
                          <option value="New">🔴 New Lead</option>
                          <option value="Contacted">🟡 Contacted</option>
                          <option value="Completed">🟢 Completed</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium space-x-2 whitespace-nowrap">
                        <button onClick={() => openEditBookingModal(booking)} className="text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded-md">✏️ Edit</button>
                        <button onClick={() => deleteBooking(booking.id)} className="text-red-600 font-bold bg-red-50 px-3 py-1 rounded-md">🗑️ Del</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {bookings.length === 0 && <div className="p-8 text-center text-gray-500 font-bold text-lg">Koi bookings ya leads nahi aayi hain.</div>}
            </div>
          )}

          {/* TAB 4: CATEGORIES MANAGEMENT */}
          {activeTab === 'categories' && (
            <div className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div><h2 className="text-xl font-bold text-gray-800">Manage Tour Categories</h2></div>
                <button onClick={() => openCategoryModal()} className="bg-purple-600 text-white px-4 py-2 font-bold rounded-lg">+ Add New Category</button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Category Label</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Slug / Value</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {categories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-bold text-gray-900">{cat.label}</td>
                        <td className="px-6 py-4"><span className="text-sm text-purple-600 bg-purple-50 px-2 py-1 rounded-md font-mono border">{cat.value}</span></td>
                        <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                          <button onClick={() => openCategoryModal(cat)} className="text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded-md">✏️ Edit</button>
                          <button onClick={() => deleteCategory(cat.id)} className="text-red-600 font-bold bg-red-50 px-3 py-1 rounded-md">🗑️ Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* EDIT BOOKING MODAL */}
      {editingBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-6 border-b pb-4"><h2 className="text-xl font-extrabold text-gray-900">Edit Customer</h2><button onClick={() => setEditingBooking(null)} className="text-gray-400 font-bold">✕</button></div>
            <form onSubmit={handleUpdateBooking} className="space-y-4">
              <div><label className="block text-sm font-bold mb-1">Customer Name</label><input type="text" required className="w-full px-4 py-2 border rounded-lg" value={editCustomerName} onChange={(e) => setEditCustomerName(e.target.value)} /></div>
              <div><label className="block text-sm font-bold mb-1">Customer Mobile</label><input type="text" required className="w-full px-4 py-2 border rounded-lg" value={editCustomerMobile} onChange={(e) => setEditCustomerMobile(e.target.value)} /></div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t"><button type="button" onClick={() => setEditingBooking(null)} className="bg-gray-100 font-bold px-5 py-2.5 rounded-xl">Cancel</button><button type="submit" className="bg-blue-600 text-white font-bold px-5 py-2.5 rounded-xl">Save Changes</button></div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY ADD/EDIT MODAL */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6 border-b pb-4"><h2 className="text-xl font-extrabold text-gray-900">{editingCategory ? 'Edit Category' : 'Add New Category'}</h2><button onClick={() => setShowCategoryModal(false)} className="text-gray-400 font-bold">✕</button></div>
            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div><label className="block text-sm font-bold mb-1">Category Label</label><input type="text" required className="w-full px-4 py-2 border rounded-lg" value={catLabel} onChange={(e) => { setCatLabel(e.target.value); if(!editingCategory) setCatValue(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')) }} /></div>
              <div><label className="block text-sm font-bold mb-1">Category Value (Slug)</label><input type="text" required className="w-full px-4 py-2 border rounded-lg font-mono" value={catValue} onChange={(e) => setCatValue(e.target.value)} /></div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t"><button type="button" onClick={() => setShowCategoryModal(false)} className="bg-gray-100 font-bold px-5 py-2.5 rounded-xl">Cancel</button><button type="submit" className="bg-purple-600 text-white font-bold px-5 py-2.5 rounded-xl">Save Category</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}