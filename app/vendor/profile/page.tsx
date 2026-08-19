"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase' 
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// 🌟 ALL INDIAN STATES FOR EXACT MATCHING
const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", 
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", 
  "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", 
  "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", 
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
  "Uttarakhand", "West Bengal"
].sort();

export default function VendorProfile() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [userId, setUserId] = useState('')

  // Profile States
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [address, setAddress] = useState('')
  const [website, setWebsite] = useState('') 
  
  // 🌟 NEW: Location States (City & State)
  const [city, setCity] = useState('')
  const [selectedState, setSelectedState] = useState('')

  // 🌟 Document States for Logo & Visiting Card
  const [logoUrl, setLogoUrl] = useState('')
  const [visitingCardUrl, setVisitingCardUrl] = useState('')
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isUploadingCard, setIsUploadingCard] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (error || !profile || profile.role !== 'vendor') {
      router.push('/login')
      return
    }

    setUserId(session.user.id)
    setFullName(profile.full_name || '')
    setEmail(profile.email || '')
    setPhone(profile.phone || '')
    setCompanyName(profile.company_name || '')
    setAddress(profile.address || '')
    setWebsite(profile.website || '') 
    
    // 🌟 Set City and State from profile
    setCity(profile.city || '')
    setSelectedState(profile.state || '')
    
    // 🌟 Set Document URLs from profile metadata
    setLogoUrl(profile.logo_url || '')
    setVisitingCardUrl(profile.visiting_card_url || '')

    setLoading(false)
  }

  // 🌟 SUPABASE STORAGE UPLOAD HELPER FUNCTION
  const uploadToSupabase = async (file: File, folderName: string) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
      const filePath = `${folderName}/${fileName}`

      const { data, error } = await supabase.storage
        .from('documents') 
        .upload(filePath, file)

      if (error) throw error

      const { data: publicUrlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath)

      return publicUrlData.publicUrl

    } catch (error: any) {
      console.error("Supabase image upload error:", error)
      alert("Image upload fail ho gaya: " + error.message)
      return null
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingLogo(true)
    const url = await uploadToSupabase(file, 'logos')
    if (url) setLogoUrl(url)
    setIsUploadingLogo(false)
  }

  const handleCardUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingCard(true)
    const url = await uploadToSupabase(file, 'visiting_cards')
    if (url) setVisitingCardUrl(url)
    setIsUploadingCard(false)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    setMessage({ type: '', text: '' })

    // 🌟 Format location exactly like Tour Packages (City, State)
    const formattedLocation = city && selectedState ? `${city}, ${selectedState}` : address;

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone: phone,
        company_name: companyName,
        address: address,
        website: website, 
        location: formattedLocation,       // 🌟 Save formatted location
        city: city,                        // 🌟 Save City separately
        state: selectedState,              // 🌟 Save State separately
        logo_url: logoUrl,                 // 🌟 Save Logo URL to DB
        visiting_card_url: visitingCardUrl // 🌟 Save Card URL to DB
      })
      .eq('id', userId)

    if (error) {
      setMessage({ type: 'error', text: 'Profile update fail ho gaya: ' + error.message })
    } else {
      setMessage({ type: 'success', text: '✅ Profile successfully update ho gayi!' })
    }
    setUpdating(false)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-blue-600">Loading Profile...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10 font-sans">
      <div className="max-w-3xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">My Profile</h1>
            <p className="text-gray-500 mt-1">Apni personal aur business details manage karein</p>
          </div>
          <Link href="/vendor" className="bg-white border border-gray-200 text-gray-700 font-bold px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors shadow-sm">
            ← Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8">
            {message.text && (
              <div className={`mb-6 p-4 rounded-xl text-sm font-bold ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                  <input type="text" required className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                  <input type="email" disabled className="w-full px-4 py-3 border rounded-xl outline-none bg-gray-100 text-gray-500 cursor-not-allowed" value={email} title="Email cannot be changed directly" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
                  <input type="tel" className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Agency / Company Name</label>
                  <input type="text" className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. Dream Travel Agency" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Business Website URL</label>
                <input type="url" className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://www.yourtravelwebsite.com" />
              </div>

              {/* 🌟 NEW: SMART STRUCTURED LOCATION FIELD 🌟 */}
              <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 transition-all">
                <label className="block text-sm font-bold text-blue-900 mb-3">Operating Location (City & State) *</label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* State Dropdown */}
                  <select required
                    className="w-full px-4 py-3 rounded-xl border border-white bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-800 font-medium shadow-sm cursor-pointer"
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                  >
                    <option value="" disabled>Select State</option>
                    {INDIAN_STATES.map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                  
                  {/* City Input */}
                  <input type="text" required 
                    className="w-full px-4 py-3 rounded-xl border border-white bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-800 font-medium placeholder-gray-400 shadow-sm"
                    value={city} onChange={(e) => setCity(e.target.value)} 
                    placeholder="City (e.g. Mumbai)" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Full Address</label>
                <textarea rows={3} className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 resize-none" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Aapka office ya business address..."></textarea>
              </div>

              {/* 🌟 BUSINESS DOCUMENTS SECTION 🌟 */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mt-6">
                <h3 className="block text-base font-black text-slate-800 mb-4 border-b border-slate-200 pb-2">Business Verification Documents</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Agency Logo */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Agency Logo</label>
                    {logoUrl ? (
                      <div className="relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={logoUrl} alt="Logo Preview" className="w-full h-32 object-contain bg-white border border-slate-200 rounded-xl p-2 shadow-sm" />
                        <button type="button" onClick={() => setLogoUrl('')} className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-md hover:bg-red-600 transition-colors">✕</button>
                      </div>
                    ) : (
                      <label className="w-full h-32 flex flex-col items-center justify-center px-4 py-2 border-2 border-dashed border-blue-300 bg-blue-50/50 rounded-xl cursor-pointer hover:bg-blue-50 hover:border-blue-500 transition-all">
                        <span className="text-3xl mb-2">{isUploadingLogo ? '⏳' : '📁'}</span>
                        <span className="text-sm font-bold text-blue-700">{isUploadingLogo ? 'Uploading Logo...' : 'Upload Logo'}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={isUploadingLogo} />
                      </label>
                    )}
                  </div>

                  {/* Visiting Card */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Visiting Card</label>
                    {visitingCardUrl ? (
                      <div className="relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={visitingCardUrl} alt="Card Preview" className="w-full h-32 object-cover border border-slate-200 rounded-xl shadow-sm" />
                        <button type="button" onClick={() => setVisitingCardUrl('')} className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-md hover:bg-red-600 transition-colors">✕</button>
                      </div>
                    ) : (
                      <label className="w-full h-32 flex flex-col items-center justify-center px-4 py-2 border-2 border-dashed border-blue-300 bg-blue-50/50 rounded-xl cursor-pointer hover:bg-blue-50 hover:border-blue-500 transition-all">
                        <span className="text-3xl mb-2">{isUploadingCard ? '⏳' : '🪪'}</span>
                        <span className="text-sm font-bold text-blue-700">{isUploadingCard ? 'Uploading Card...' : 'Upload Visiting Card'}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleCardUpload} disabled={isUploadingCard} />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 mt-6">
                <button type="submit" disabled={updating || isUploadingLogo || isUploadingCard} className="w-full md:w-auto bg-blue-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-700 transition-all disabled:bg-blue-400 shadow-md">
                  {updating ? 'Updating...' : 'Save Profile Changes'}
                </button>
              </div>

            </form>
          </div>
        </div>

      </div>
    </div>
  )
}