"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase'
import Link from 'next/link'

export default function ManageListings() {
  const [listings, setListings] = useState<any[]>([])
  const [allProfiles, setAllProfiles] = useState<any[]>([])
  const [activeListingCategory, setActiveListingCategory] = useState('all') 
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchListings()
    fetchAllProfiles()
  }, [])

  async function fetchListings() {
    const { data } = await supabase.from('listings').select('*').order('created_at', { ascending: false })
    if (data) setListings(data)
  }

  async function fetchAllProfiles() {
    const { data } = await supabase.from('profiles').select('id, full_name, company_name, email')
    if (data) setAllProfiles(data)
  }

  async function updateListingStatus(id: string, newStatus: string) {
    const { data, error } = await supabase.from('listings').update({ status: newStatus }).eq('id', id).select()
    if (error) alert("Error updating status: " + error.message)
    else fetchListings()
  }

  async function deleteListing(id: string) {
    if (!window.confirm("Kya aap is listing ko hide karke Trash mein dalna chahte hain?")) return
    const { error } = await supabase.from('listings').update({ is_deleted: true }).eq('id', id)
    if (error) alert("Error: " + error.message)
    else fetchListings()
  }

  async function restoreListing(id: string) {
    if (!window.confirm("Kya aap is listing ko wapas Restore karna chahte hain?")) return
    const { error } = await supabase.from('listings').update({ is_deleted: false }).eq('id', id)
    if (error) alert("Error: " + error.message)
    else fetchListings()
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

  const listingCategories = [
    { id: 'all', label: 'All Listings' },
    { id: 'destination', label: 'Tourist Places' },
    { id: 'tour', label: 'Tour Packages' },
    { id: 'hotel', label: 'Hotels' },
    { id: 'cab', label: 'Cabs' },
    { id: 'blog', label: 'Blogs' },
    { id: 'trash', label: '🗑️ Trash (Deleted)' }
  ]

  const getCategoryCount = (categoryId: string) => {
    if (categoryId === 'trash') return listings.filter(l => l.is_deleted === true).length;
    const activeListings = listings.filter(l => !l.is_deleted);
    if (categoryId === 'all') return activeListings.length;
    return activeListings.filter(l => l.category === categoryId).length;
  }

  const displayedListings = listings.filter(listing => {
    if (activeListingCategory === 'trash') {
      if (!listing.is_deleted) return false;
    } else {
      if (listing.is_deleted) return false;
    }
    const matchesCategory = activeListingCategory === 'all' || activeListingCategory === 'trash' ? true : listing.category === activeListingCategory;
    const q = searchQuery.toLowerCase();
    const title = typeof listing.title === 'string' ? listing.title.toLowerCase() : '';
    const location = typeof listing.location === 'string' ? listing.location.toLowerCase() : '';
    return matchesCategory && (title.includes(q) || location.includes(q));
  });

  const formatLocationForList = (locStr: any) => {
    if (!locStr) return 'Online / Blog'
    if (Array.isArray(locStr)) return locStr.join(', ')
    return String(locStr).replace(/ > /g, ', ')
  }

  return (
    <div className="flex flex-col bg-white rounded-lg shadow-md border border-gray-200">
      <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center gap-4 flex-wrap">
        <div className="relative w-full md:w-96">
          <input 
            type="text" placeholder="🔍 Search by Title or Location..." 
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 font-medium"
          />
          <span className="absolute left-3.5 top-3 text-gray-400">🔍</span>
        </div>
      </div>

      <div className="bg-gray-50 border-b border-gray-200 p-4 flex gap-3 overflow-x-auto whitespace-nowrap">
        {listingCategories.map(cat => (
          <button 
            key={cat.id} onClick={() => setActiveListingCategory(cat.id)} 
            className={`px-5 py-2 text-sm font-bold rounded-full transition-colors ${activeListingCategory === cat.id ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-200 border border-gray-200'}`}
          >
            {cat.label} <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${activeListingCategory === cat.id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>{getCategoryCount(cat.id)}</span>
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Title & Location</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Vendor Info</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Category & Price</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
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
                  {(() => {
                    const vendor = allProfiles.find(p => p.id === listing.vendor_id);
                    const vendorName = vendor ? (vendor.company_name || vendor.full_name || vendor.email) : 'Unknown Admin/Vendor';
                    return <div className="text-sm font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-md inline-block border">👤 {vendorName}</div>
                  })()}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-bold text-blue-600 uppercase">{listing.category}</div>
                  <div className="text-sm text-gray-600 font-bold">{listing.category === 'destination' || listing.category === 'blog' ? 'Free / Info' : `₹${listing.price}`}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase ${listing.status === 'approved' ? 'bg-green-100 text-green-800' : listing.status === 'declined' ? 'bg-red-100 text-red-800' : listing.status === 'draft' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {listing.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                  {listing.is_deleted ? (
                    <button onClick={() => restoreListing(listing.id)} className="text-green-600 font-bold bg-green-50 px-3 py-1 rounded-md border">♻️ Restore</button>
                  ) : (
                    <>
                      <Link href={getViewUrl(listing)} target="_blank" className="text-purple-600 font-bold bg-purple-50 px-3 py-1 rounded-md">👁️ View</Link>
                      <Link href={getEditUrl(listing)} className="text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded-md">✏️ Edit</Link>
                      {listing.status === 'pending' && (
                        <>
                          <button onClick={() => updateListingStatus(listing.id, 'approved')} className="text-green-600 font-bold ml-1">Approve</button>
                          <button onClick={() => updateListingStatus(listing.id, 'declined')} className="text-red-600 font-bold ml-1">Decline</button>
                        </>
                      )}
                      {listing.status === 'approved' && <button onClick={() => updateListingStatus(listing.id, 'declined')} className="text-red-600 font-bold ml-1">Remove</button>}
                      {(listing.status === 'declined' || listing.status === 'draft') && <button onClick={() => deleteListing(listing.id)} className="text-red-600 font-bold bg-red-50 px-3 py-1 rounded-md border">🗑️ Delete</button>}
                    </>
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
  )
}