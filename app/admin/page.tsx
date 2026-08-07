"use client"
import { useEffect, useState } from 'react'
import { supabase } from '../../utils/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('bookings')
  const [activeListingCategory, setActiveListingCategory] = useState('all') 
  const [searchQuery, setSearchQuery] = useState('') 
  
  const [listings, setListings] = useState<any[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([]) 
  const [isLoading, setIsLoading] = useState(true)

  // Edit Vendor Modal States
  const [editingVendor, setEditingVendor] = useState<any>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editCompany, setEditCompany] = useState('')
  const [editAddress, setEditAddress] = useState('')

  // 🌟 Edit Booking Modal States
  const [editingBooking, setEditingBooking] = useState<any>(null)
  const [editCustomerName, setEditCustomerName] = useState('')
  const [editCustomerMobile, setEditCustomerMobile] = useState('')

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

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (!profile || profile.role !== 'admin') {
        router.push('/')
        return
      }

      await Promise.all([
        fetchVendors(),
        fetchListings(),
        fetchBookings()
      ])
    } catch (error) {
      console.error("Admin check failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // ============================
  // BOOKINGS / LEADS FUNCTIONS
  // ============================
  
  async function fetchBookings() {
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setBookings(data)
  }

  async function updateBookingStatus(id: string, newStatus: string) {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', id)
      .select()

    if (error) {
      alert("Error updating booking status: " + error.message)
    } else if (!data || data.length === 0) {
      alert("Warning: No rows were updated. Please check your Supabase RLS policies for Bookings.")
    } else {
      fetchBookings()
    }
  }

  async function deleteBooking(id: string) {
    if (!window.confirm("WARNING: Kya aap sach mein is lead/booking ko permanently delete karna chahte hain?")) return

    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id)

    if (error) {
      alert("Error deleting booking: " + error.message)
    } else {
      fetchBookings()
    }
  }

  const openEditBookingModal = (booking: any) => {
    setEditingBooking(booking)
    setEditCustomerName(booking.customer_name || '')
    setEditCustomerMobile(booking.customer_mobile || '')
  }

  async function handleUpdateBooking(e: React.FormEvent) {
    e.preventDefault()
    if (!editingBooking) return

    const { data, error } = await supabase
      .from('bookings')
      .update({ 
        customer_name: editCustomerName, 
        customer_mobile: editCustomerMobile
      })
      .eq('id', editingBooking.id)
      .select()

    if (error) {
      alert("Error updating booking: " + error.message)
    } else if (!data || data.length === 0) {
      alert("Warning: Update blocked by RLS policy. Make sure Admins have UPDATE access to bookings.")
    } else {
      setEditingBooking(null)
      fetchBookings()
    }
  }

  // ============================
  // VENDORS FUNCTIONS
  // ============================
  
  async function fetchVendors() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'vendor')
      .order('created_at', { ascending: false })
    if (data) setVendors(data)
  }

  async function updateVendorStatus(id: string, newStatus: string, vendorEmail?: string, vendorName?: string) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ approval_status: newStatus })
      .eq('id', id)
      .select()

    if (error) {
      alert("Error updating status: " + error.message)
    } else if (!data || data.length === 0) {
      alert("Warning: No rows were updated. Please check your Supabase RLS policies for Profiles.")
    } else {
      if (newStatus === 'approved' && vendorEmail) {
        try {
          await fetch('/api/send-approval-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: vendorEmail,
              name: vendorName || 'Partner',
              message: "Your profile has been approved! You can now log in, update your profile, and start using the platform."
            })
          })
        } catch (mailErr) {
          console.error("Email sending failed:", mailErr)
        }
      }
      fetchVendors()
    }
  }

  async function deleteVendor(id: string) {
    if (!window.confirm("WARNING: Kya aap sach mein is vendor ko delete karna chahte hain? Inki saari listings bhi remove ho sakti hain.")) return

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)

    if (error) {
      alert("Error deleting vendor: " + error.message)
    } else {
      fetchVendors()
    }
  }

  const openEditVendorModal = (vendor: any) => {
    setEditingVendor(vendor)
    setEditName(vendor.full_name || '')
    setEditEmail(vendor.email || '')
    setEditPhone(vendor.phone || '')
    setEditCompany(vendor.company_name || '')
    setEditAddress(vendor.address || '')
  }

  async function handleUpdateVendor(e: React.FormEvent) {
    e.preventDefault()
    if (!editingVendor) return

    const { error } = await supabase
      .from('profiles')
      .update({ 
        full_name: editName, 
        email: editEmail,
        phone: editPhone,
        company_name: editCompany,
        address: editAddress
      })
      .eq('id', editingVendor.id)

    if (error) {
      alert("Error updating vendor: " + error.message)
    } else {
      setEditingVendor(null)
      fetchVendors()
    }
  }

  // ============================
  // LISTINGS FUNCTIONS
  // ============================
  
  async function fetchListings() {
    const { data } = await supabase
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setListings(data)
  }

  async function updateListingStatus(id: string, newStatus: string) {
    const { data, error } = await supabase
      .from('listings')
      .update({ status: newStatus })
      .eq('id', id)
      .select()

    if (error) {
      alert("Error updating listing status: " + error.message)
    } else if (!data || data.length === 0) {
      alert("Warning: No rows were updated. Please check your Supabase RLS policies for Listings.")
    } else {
      fetchListings() 
    }
  }

  async function deleteListing(id: string) {
    if (!window.confirm("WARNING: Kya aap sach mein is listing ko permanently delete karna chahte hain? Yeh wapas recover nahi hogi.")) return

    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id)

    if (error) {
      alert("Error deleting listing: " + error.message)
    } else {
      fetchListings() 
    }
  }

  const getEditUrl = (listing: any) => {
    const cat = listing.category
    if (cat === 'tour') return `/add-listing/tour?edit=${listing.id}`
    if (cat === 'hotel') return `/add-listing/hotel?id=${listing.id}`
    if (cat === 'cab') return `/add-listing/cab?edit=${listing.id}`
    if (cat === 'destination') return `/add-listing/place?edit=${listing.id}`
    if (cat === 'blog') return `/add-listing/blog?edit=${listing.id}` 
    return `/vendor`
  }

  const getViewUrl = (listing: any) => {
    const slug = listing.slug || listing.id
    if (listing.category === 'tour') return `/tour/${slug}`
    if (listing.category === 'hotel') return `/hotel/${slug}`
    if (listing.category === 'cab') return `/cabs/${slug}`
    if (listing.category === 'destination') return `/places/${slug}`
    if (listing.category === 'blog') return `/${slug}`
    return `/listing/${slug}`
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const listingCategories = [
    { id: 'all', label: 'All Listings' },
    { id: 'destination', label: 'Tourist Places' },
    { id: 'tour', label: 'Tour Packages' },
    { id: 'hotel', label: 'Hotels' },
    { id: 'cab', label: 'Cabs' },
    { id: 'blog', label: 'Blogs' }
  ]

  const getCategoryCount = (categoryId: string) => {
    if (categoryId === 'all') return listings.length;
    return listings.filter(l => l.category === categoryId).length;
  }

  const displayedListings = listings.filter(listing => {
    const matchesCategory = activeListingCategory === 'all' ? true : listing.category === activeListingCategory;
    const q = searchQuery.toLowerCase();
    const title = typeof listing.title === 'string' ? listing.title.toLowerCase() : '';
    const location = typeof listing.location === 'string' ? listing.location.toLowerCase() : '';
    const matchesSearch = title.includes(q) || location.includes(q);
    return matchesCategory && matchesSearch;
  });

  const formatLocationForList = (locStr: any) => {
    if (!locStr) return 'Online / Blog'
    if (Array.isArray(locStr)) return locStr.join(', ')
    return String(locStr).replace(/ > /g, ', ')
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
        <div className="flex space-x-4 mb-8">
          <button onClick={() => setActiveTab('bookings')} className={`px-6 py-3 font-bold rounded-lg transition-colors ${activeTab === 'bookings' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            📋 Customer Bookings / Leads
          </button>
          <button onClick={() => setActiveTab('vendors')} className={`px-6 py-3 font-bold rounded-lg transition-colors ${activeTab === 'vendors' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            👥 Manage Partners
          </button>
          <button onClick={() => setActiveTab('listings')} className={`px-6 py-3 font-bold rounded-lg transition-colors ${activeTab === 'listings' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            📑 Manage Listings
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          
          {/* TAB 1: BOOKINGS & INQUIRIES */}
          {activeTab === 'bookings' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Customer Details</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Service Inquired</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Extra Details</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(booking.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        <br/>
                        <span className="text-xs">{new Date(booking.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-gray-900">{booking.customer_name}</div>
                        <div className="text-sm font-bold text-green-600">{booking.customer_mobile}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 inline-flex text-xs leading-5 font-bold rounded-full bg-blue-100 text-blue-800 uppercase mb-1">
                          {booking.booking_type}
                        </span>
                        <div className="text-sm text-gray-800 font-bold">{booking.listing_title}</div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600">
                        {booking.booking_details && typeof booking.booking_details === 'object' && (
                          <div className="space-y-1">
                            {booking.booking_details.date && <div>📅 <span className="font-semibold">{booking.booking_details.date}</span></div>}
                            {booking.booking_details.pickup && <div>📍 {formatLocationForList(booking.booking_details.pickup)} ➔ {formatLocationForList(booking.booking_details.drop)}</div>}
                            {booking.booking_details.selectedCab && <div>🚘 {booking.booking_details.selectedCab}</div>}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-left text-sm font-medium">
                        <select 
                          className={`text-xs font-bold rounded-lg px-2 py-1 outline-none border-2 ${
                            booking.status === 'New' ? 'border-red-200 bg-red-50 text-red-700' : 
                            booking.status === 'Contacted' ? 'border-yellow-200 bg-yellow-50 text-yellow-700' : 
                            'border-green-200 bg-green-50 text-green-700'
                          }`}
                          value={booking.status || 'New'}
                          onChange={(e) => updateBookingStatus(booking.id, e.target.value)}
                        >
                          <option value="New">🔴 New Lead</option>
                          <option value="Contacted">🟡 Contacted</option>
                          <option value="Completed">🟢 Completed</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium space-x-2 whitespace-nowrap">
                        <button onClick={() => openEditBookingModal(booking)} className="text-blue-600 hover:text-blue-900 font-bold bg-blue-50 px-3 py-1 rounded-md inline-block">✏️ Edit</button>
                        <button onClick={() => deleteBooking(booking.id)} className="text-red-600 hover:text-red-900 font-bold bg-red-50 px-3 py-1 rounded-md inline-block">🗑️ Del</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {bookings.length === 0 && <div className="p-8 text-center text-gray-500 font-bold text-lg">Koi bookings ya leads abhi tak nahi aayi hain.</div>}
            </div>
          )}

          {/* TAB 2: VENDORS TABLE */}
          {activeTab === 'vendors' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Partner Info</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Contact & Agency</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-gray-900">{vendor.full_name}</div>
                        <div className="text-sm text-gray-500">{vendor.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-gray-700">{vendor.company_name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{vendor.phone || 'No Phone'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase ${
                          vendor.approval_status === 'approved' ? 'bg-green-100 text-green-800' : 
                          vendor.approval_status === 'declined' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {vendor.approval_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                        <button onClick={() => openEditVendorModal(vendor)} className="text-blue-600 hover:text-blue-900 font-bold bg-blue-50 px-3 py-1 rounded-md inline-block">✏️ Edit</button>
                        <button onClick={() => deleteVendor(vendor.id)} className="text-red-600 hover:text-red-900 font-bold bg-blue-50 px-3 py-1 rounded-md inline-block">🗑️ Del</button>

                        {vendor.approval_status === 'pending' && (
                          <>
                            <button onClick={() => updateVendorStatus(vendor.id, 'approved', vendor.email, vendor.full_name)} className="text-green-600 hover:text-green-900 font-bold ml-1">Approve</button>
                            <button onClick={() => updateVendorStatus(vendor.id, 'declined')} className="text-red-600 hover:text-red-900 font-bold ml-1">Decline</button>
                          </>
                        )}
                        {vendor.approval_status === 'approved' && (
                           <button onClick={() => updateVendorStatus(vendor.id, 'declined')} className="text-red-600 hover:text-red-900 font-bold ml-1">Revoke</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {vendors.length === 0 && <div className="p-8 text-center text-gray-500">Is section mein abhi koi vendor nahi hai.</div>}
            </div>
          )}

          {/* TAB 3: LISTINGS TABLE */}
          {activeTab === 'listings' && (
            <div className="flex flex-col">
              
              <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center gap-4 flex-wrap">
                <div className="relative w-full md:w-96">
                  <input 
                    type="text" 
                    placeholder="🔍 Search by Title or Location..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 font-medium text-gray-700 transition-all"
                  />
                  <span className="absolute left-3.5 top-3 text-gray-400">🔍</span>
                </div>
              </div>

              <div className="bg-gray-50 border-b border-gray-200 p-4 flex gap-3 overflow-x-auto whitespace-nowrap">
                {listingCategories.map(cat => {
                  const count = getCategoryCount(cat.id);
                  return (
                    <button 
                      key={cat.id} 
                      onClick={() => setActiveListingCategory(cat.id)} 
                      className={`px-5 py-2 text-sm font-bold rounded-full transition-colors ${
                        activeListingCategory === cat.id 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-white text-gray-600 hover:bg-gray-200 border border-gray-200'
                      }`}
                    >
                      {cat.label} <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${activeListingCategory === cat.id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>{count}</span>
                    </button>
                  )
                })}
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Title & Location</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Category & Price</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {displayedListings.map((listing) => (
                      <tr key={listing.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-gray-900">{listing.title}</div>
                          <div className="text-sm text-gray-500">📍 {formatLocationForList(listing.location)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-blue-600 uppercase">{listing.category}</div>
                          <div className="text-sm text-gray-600 font-bold">{listing.category === 'destination' || listing.category === 'blog' ? 'Free / Info' : `₹${listing.price}`}</div>
                        </td>
                        <td className="px-6 py-4">
                          {/* 🌟 Draft handling inside the status pill */}
                          <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase ${
                            listing.status === 'approved' ? 'bg-green-100 text-green-800' : 
                            listing.status === 'declined' ? 'bg-red-100 text-red-800' : 
                            listing.status === 'draft' ? 'bg-gray-100 text-gray-800' : 
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {listing.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                          <Link href={getViewUrl(listing)} target="_blank" className="text-purple-600 hover:text-purple-900 font-bold bg-purple-50 px-3 py-1 rounded-md inline-block">👁️ View</Link>
                          <Link href={getEditUrl(listing)} className="text-blue-600 hover:text-blue-900 font-bold bg-blue-50 px-3 py-1 rounded-md inline-block">✏️ Edit</Link>
                          {listing.status === 'pending' && (
                            <>
                              <button onClick={() => updateListingStatus(listing.id, 'approved')} className="text-green-600 hover:text-green-900 font-bold ml-1">Approve</button>
                              <button onClick={() => updateListingStatus(listing.id, 'declined')} className="text-red-600 hover:text-red-900 font-bold ml-1">Decline</button>
                            </>
                          )}
                          {listing.status === 'approved' && (
                            <button onClick={() => updateListingStatus(listing.id, 'declined')} className="text-red-600 hover:text-red-900 font-bold ml-1">Remove</button>
                          )}
                          
                          {/* 🌟 NEW: Added listing.status === 'draft' condition here to show delete button */}
                          {(listing.status === 'declined' || listing.status === 'draft') && (
                            <button onClick={() => deleteListing(listing.id)} className="text-red-600 hover:text-red-900 font-bold bg-red-50 px-3 py-1 rounded-md ml-1 inline-block border border-red-100">🗑️ Delete</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {displayedListings.length === 0 && (
                  <div className="p-12 flex flex-col items-center justify-center">
                    <span className="text-4xl mb-3">🔍</span>
                    <p className="text-gray-500 font-bold text-lg">Koi listing nahi mili!</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* EDIT BOOKING MODAL POPUP */}
      {editingBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-extrabold text-gray-900">Edit Customer Details</h2>
              <button onClick={() => setEditingBooking(null)} className="text-gray-400 hover:text-red-500 text-xl font-bold">✕</button>
            </div>
            
            <form onSubmit={handleUpdateBooking} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Customer Name</label>
                <input type="text" required className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" value={editCustomerName} onChange={(e) => setEditCustomerName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Customer Mobile</label>
                <input type="text" required className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" value={editCustomerMobile} onChange={(e) => setEditCustomerMobile(e.target.value)} />
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setEditingBooking(null)} className="bg-gray-100 text-gray-700 font-bold px-5 py-2.5 rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
                <button type="submit" className="bg-blue-600 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-blue-700 shadow-md transition-all active:scale-95">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT VENDOR MODAL POPUP */}
      {editingVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-extrabold text-gray-900">Edit Vendor Profile</h2>
              <button onClick={() => setEditingVendor(null)} className="text-gray-400 hover:text-red-500 text-xl font-bold">✕</button>
            </div>
            
            <form onSubmit={handleUpdateVendor} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                  <input type="text" required className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" value={editName} onChange={(e) => setEditName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                  <input type="email" required className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
                  <input type="tel" required className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Agency Name</label>
                  <input type="text" className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" value={editCompany} onChange={(e) => setEditCompany(e.target.value)} placeholder="Travel Agency" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Full Address</label>
                <textarea rows={2} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 resize-none" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} placeholder="Office location..."></textarea>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setEditingVendor(null)} className="bg-gray-100 text-gray-700 font-bold px-5 py-2.5 rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
                <button type="submit" className="bg-blue-600 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-blue-700 shadow-md transition-all active:scale-95">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}