"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase'

const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", 
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", 
  "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", 
  "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", 
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
  "Uttarakhand", "West Bengal"
].sort();

export default function ManagePartners() {
  const [vendors, setVendors] = useState<any[]>([])
  
  // Add Vendor States
  const [showAddVendorModal, setShowAddVendorModal] = useState(false)
  const [newVendor, setNewVendor] = useState({
    fullName: '', email: '', password: '', phone: '', company: '', state: '', city: '', website: ''
  })
  const [isAddingVendor, setIsAddingVendor] = useState(false)

  // Edit Vendor States
  const [editingVendor, setEditingVendor] = useState<any>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editCompany, setEditCompany] = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [editCity, setEditCity] = useState('')
  const [editState, setEditState] = useState('')
  const [editWebsite, setEditWebsite] = useState('')
  const [editLogoUrl, setEditLogoUrl] = useState('')
  const [editCardUrl, setEditCardUrl] = useState('')

  useEffect(() => {
    fetchVendors()
  }, [])

  async function fetchVendors() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'vendor')
      .order('created_at', { ascending: false })
    if (data) setVendors(data)
  }

  async function handleAddVendor(e: React.FormEvent) {
    e.preventDefault()
    setIsAddingVendor(true)

    const formattedLocation = newVendor.city && newVendor.state ? `${newVendor.city}, ${newVendor.state}` : '';

    const { data, error } = await supabase.auth.signUp({
      email: newVendor.email,
      password: newVendor.password,
      options: {
        data: {
          full_name: newVendor.fullName,
          role: 'vendor',
          phone: newVendor.phone,
          company_name: newVendor.company,
          state: newVendor.state,
          city: newVendor.city,
          location: formattedLocation,
          website: newVendor.website,
          approval_status: 'approved'
        }
      }
    })

    setIsAddingVendor(false)

    if (error) {
      alert("Error adding partner: " + error.message)
    } else {
      alert("✅ Partner successfully added!")
      setShowAddVendorModal(false)
      setNewVendor({ fullName: '', email: '', password: '', phone: '', company: '', state: '', city: '', website: '' })
      fetchVendors()
    }
  }

  async function updateVendorStatus(id: string, newStatus: string, vendorEmail?: string, vendorName?: string) {
    const { data, error } = await supabase.from('profiles').update({ approval_status: newStatus }).eq('id', id).select()

    if (error) {
      alert("Error updating status: " + error.message)
    } else if (!data || data.length === 0) {
      alert("Warning: No rows updated.")
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
        } catch (mailErr) { console.error("Email error:", mailErr) }
      }
      fetchVendors()
    }
  }

  async function deleteVendor(id: string) {
    if (!window.confirm("WARNING: Kya aap sach mein is vendor ko delete karna chahte hain? Inki saari listings bhi remove ho sakti hain.")) return
    const { error } = await supabase.from('profiles').delete().eq('id', id)
    if (error) alert("Error deleting vendor: " + error.message)
    else fetchVendors()
  }

  const openEditVendorModal = (vendor: any) => {
    setEditingVendor(vendor)
    setEditName(vendor.full_name || '')
    setEditEmail(vendor.email || '')
    setEditPhone(vendor.phone || '')
    setEditCompany(vendor.company_name || '')
    setEditAddress(vendor.address || '')
    setEditCity(vendor.city || '')
    setEditState(vendor.state || '')
    setEditWebsite(vendor.website || '')
    setEditLogoUrl(vendor.logo_url || '')
    setEditCardUrl(vendor.visiting_card_url || '')
  }

  async function handleUpdateVendor(e: React.FormEvent) {
    e.preventDefault()
    if (!editingVendor) return

    const formattedLocation = editCity && editState ? `${editCity}, ${editState}` : editAddress;

    const { error } = await supabase
      .from('profiles')
      .update({ 
        full_name: editName, email: editEmail, phone: editPhone, company_name: editCompany,
        address: editAddress, city: editCity, state: editState, location: formattedLocation,
        website: editWebsite, logo_url: editLogoUrl, visiting_card_url: editCardUrl
      }).eq('id', editingVendor.id)

    if (error) {
      alert("Error updating vendor: " + error.message)
    } else {
      setEditingVendor(null)
      fetchVendors()
    }
  }

  return (
    <>
      <div className="overflow-x-auto bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">Verified & Pending Partners</h2>
          <button onClick={() => setShowAddVendorModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 font-bold rounded-lg shadow-sm">
            + Add New Partner
          </button>
        </div>

        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Partner Info</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Contact & Agency</th>
              <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase">Logo</th>
              <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase">Card</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
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
                  <div className="text-xs text-blue-500 font-semibold">{vendor.city ? `${vendor.city}, ${vendor.state}` : ''}</div>
                </td>
                <td className="px-6 py-4 text-center">
                  {vendor.logo_url ? <a href={vendor.logo_url} target="_blank" className="text-2xl">🖼️</a> : <span className="text-gray-300">N/A</span>}
                </td>
                <td className="px-6 py-4 text-center">
                  {vendor.visiting_card_url ? <a href={vendor.visiting_card_url} target="_blank" className="text-2xl">🪪</a> : <span className="text-gray-300">N/A</span>}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase ${vendor.approval_status === 'approved' ? 'bg-green-100 text-green-800' : vendor.approval_status === 'declined' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {vendor.approval_status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                  <button onClick={() => openEditVendorModal(vendor)} className="text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded-md">👁️ View/Edit</button>
                  <button onClick={() => deleteVendor(vendor.id)} className="text-red-600 font-bold bg-red-50 px-3 py-1 rounded-md">🗑️ Del</button>
                  {vendor.approval_status === 'pending' && (
                    <>
                      <button onClick={() => updateVendorStatus(vendor.id, 'approved', vendor.email, vendor.full_name)} className="text-green-600 font-bold ml-1">Approve</button>
                      <button onClick={() => updateVendorStatus(vendor.id, 'declined')} className="text-red-600 font-bold ml-1">Decline</button>
                    </>
                  )}
                  {vendor.approval_status === 'approved' && (
                      <button onClick={() => updateVendorStatus(vendor.id, 'declined')} className="text-red-600 font-bold ml-1">Revoke</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {vendors.length === 0 && <div className="p-8 text-center text-gray-500">Is section mein abhi koi vendor nahi hai.</div>}
      </div>

      {/* Add Vendor Modal */}
      {showAddVendorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 my-8">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-2xl font-extrabold text-gray-900">Add New Partner / Vendor</h2>
              <button onClick={() => setShowAddVendorModal(false)} className="text-gray-400 hover:text-red-500 text-2xl font-bold">✕</button>
            </div>
            <form onSubmit={handleAddVendor} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-bold mb-1">Full Name</label><input type="text" required className="w-full px-4 py-2 border rounded-lg" value={newVendor.fullName} onChange={e => setNewVendor({...newVendor, fullName: e.target.value})} /></div>
                <div><label className="block text-sm font-bold mb-1">Phone Number</label><input type="tel" required className="w-full px-4 py-2 border rounded-lg" value={newVendor.phone} onChange={e => setNewVendor({...newVendor, phone: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-bold mb-1">Email (Login ID)</label><input type="email" required className="w-full px-4 py-2 border rounded-lg" value={newVendor.email} onChange={e => setNewVendor({...newVendor, email: e.target.value})} /></div>
                <div><label className="block text-sm font-bold mb-1">Password</label><input type="password" required className="w-full px-4 py-2 border rounded-lg" value={newVendor.password} onChange={e => setNewVendor({...newVendor, password: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-bold mb-1">Agency Name</label><input type="text" className="w-full px-4 py-2 border rounded-lg" value={newVendor.company} onChange={e => setNewVendor({...newVendor, company: e.target.value})} /></div>
                <div><label className="block text-sm font-bold mb-1">Website</label><input type="url" className="w-full px-4 py-2 border rounded-lg" value={newVendor.website} onChange={e => setNewVendor({...newVendor, website: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg">
                <div>
                  <label className="block text-sm font-bold text-blue-900 mb-1">State</label>
                  <select required className="w-full px-4 py-2 border rounded-lg bg-white" value={newVendor.state} onChange={e => setNewVendor({...newVendor, state: e.target.value})}>
                    <option value="" disabled>Select State</option>
                    {INDIAN_STATES.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>
                <div><label className="block text-sm font-bold text-blue-900 mb-1">City</label><input type="text" required className="w-full px-4 py-2 border rounded-lg" value={newVendor.city} onChange={e => setNewVendor({...newVendor, city: e.target.value})} /></div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4">
                <button type="button" onClick={() => setShowAddVendorModal(false)} className="bg-gray-100 font-bold px-5 py-2.5 rounded-xl hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={isAddingVendor} className="bg-blue-600 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-blue-700 disabled:bg-blue-300">{isAddingVendor ? 'Adding...' : 'Add Vendor'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Vendor Modal */}
      {editingVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 my-8">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-2xl font-extrabold text-gray-900">View / Edit Partner Details</h2>
              <button onClick={() => setEditingVendor(null)} className="text-gray-400 hover:text-red-500 text-2xl font-bold">✕</button>
            </div>
            <form onSubmit={handleUpdateVendor} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-bold mb-1">Full Name</label><input type="text" required className="w-full px-4 py-2 border rounded-lg bg-gray-50" value={editName} onChange={e => setEditName(e.target.value)} /></div>
                <div><label className="block text-sm font-bold mb-1">Email</label><input type="email" required className="w-full px-4 py-2 border rounded-lg bg-gray-50" value={editEmail} onChange={e => setEditEmail(e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-bold mb-1">Phone Number</label><input type="tel" required className="w-full px-4 py-2 border rounded-lg bg-gray-50" value={editPhone} onChange={e => setEditPhone(e.target.value)} /></div>
                <div><label className="block text-sm font-bold mb-1">Agency Name</label><input type="text" className="w-full px-4 py-2 border rounded-lg bg-gray-50" value={editCompany} onChange={e => setEditCompany(e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1">State</label>
                  <select className="w-full px-4 py-2 border rounded-lg bg-gray-50" value={editState} onChange={e => setEditState(e.target.value)}>
                    <option value="">Select State</option>
                    {INDIAN_STATES.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>
                <div><label className="block text-sm font-bold mb-1">City</label><input type="text" className="w-full px-4 py-2 border rounded-lg bg-gray-50" value={editCity} onChange={e => setEditCity(e.target.value)} /></div>
                <div><label className="block text-sm font-bold mb-1">Website</label><input type="url" className="w-full px-4 py-2 border rounded-lg bg-gray-50" value={editWebsite} onChange={e => setEditWebsite(e.target.value)} /></div>
              </div>
              <div><label className="block text-sm font-bold mb-1">Full Address</label><textarea rows={2} className="w-full px-4 py-2 border rounded-lg bg-gray-50 resize-none" value={editAddress} onChange={e => setEditAddress(e.target.value)}></textarea></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border">
                <div><label className="block text-sm font-bold mb-1">Logo URL</label><input type="url" className="w-full px-3 py-2 border rounded-lg text-sm" value={editLogoUrl} onChange={e => setEditLogoUrl(e.target.value)} />{editLogoUrl && <img src={editLogoUrl} alt="Logo" className="h-12 mt-2" />}</div>
                <div><label className="block text-sm font-bold mb-1">Visiting Card URL</label><input type="url" className="w-full px-3 py-2 border rounded-lg text-sm" value={editCardUrl} onChange={e => setEditCardUrl(e.target.value)} />{editCardUrl && <img src={editCardUrl} alt="Card" className="h-12 mt-2 border" />}</div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button type="button" onClick={() => setEditingVendor(null)} className="bg-gray-100 font-bold px-5 py-2.5 rounded-xl hover:bg-gray-200">Cancel</button>
                <button type="submit" className="bg-blue-600 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-blue-700">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}