"use client"
import { useState } from 'react'
import { supabase } from '../../utils/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: '',       // Will be used for 'Name of Vendor'
    email: '',
    password: '',
    phone: '',          
    location: '',       
    website: '',        // 🌟 NEW: Added website field to registration form
    role: 'vendor'      // Role is strictly fixed to 'vendor' now
  })
  
  // States for Logo and Visiting Card
  const [logoUrl, setLogoUrl] = useState('')
  const [visitingCardUrl, setVisitingCardUrl] = useState('')
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isUploadingCard, setIsUploadingCard] = useState(false)

  const [status, setStatus] = useState({ loading: false, success: false, error: '', message: '' })
  const router = useRouter()

  // SECURE SUPABASE STORAGE UPLOAD HELPER FUNCTION
  const uploadToSupabase = async (file: File, folderName: string) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
      const filePath = `${folderName}/${fileName}`

      const { data, error } = await supabase.storage
        .from('documents') 
        .upload(filePath, file)

      if (error) {
        throw error
      }

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus({ loading: true, success: false, error: '', message: '' })

    // Validations for document uploads
    if (!logoUrl) {
      setStatus({ loading: false, success: false, error: 'Please upload your Agency Logo.', message: '' })
      return
    }
    if (!visitingCardUrl) {
      setStatus({ loading: false, success: false, error: 'Please upload your Visiting Card.', message: '' })
      return
    }

    // Supabase Auth se naya user create karna aur metadata mein extra fields bhejna
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          role: formData.role,
          phone: formData.phone,
          location: formData.location,
          website: formData.website,             // 🌟 Pass website to metadata
          logo_url: logoUrl,                 
          visiting_card_url: visitingCardUrl 
        }
      }
    })

    if (error) {
      setStatus({ loading: false, success: false, error: error.message, message: '' })
    } else {
      // EMAIL TRIGGER API CALL FOR REGISTRATION
      fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'New Vendor / Partner Registration 🏢',
          data: {
            Name_of_Vendor: formData.fullName,
            Email: formData.email,
            Phone: formData.phone,
            Account_Type: 'VENDOR',
            Operating_Location: formData.location || 'N/A',
            Website: formData.website || 'N/A', // 🌟 Included in email payload
            Logo: logoUrl,                   
            Visiting_Card: visitingCardUrl,  
            Admin_Action: 'Pending Approval (Please approve from Admin Panel)'
          }
        })
      }).catch(err => console.error("Email bhejte waqt error aaya:", err))

      // Set success state to show the success banner
      setStatus({ loading: false, success: true, error: '', message: '' })
      
      setTimeout(() => {
        router.push('/login')
      }, 6000)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-sky-300 via-cyan-200 to-orange-100 p-4 font-sans py-12">
      
      {/* Custom CSS for Beach Theme Animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes sway {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        @keyframes sun-glow {
          0%, 100% { box-shadow: 0 0 40px rgba(253, 224, 71, 0.6); }
          50% { box-shadow: 0 0 80px rgba(253, 224, 71, 1); }
        }
        .animate-sway { animation: sway 4s ease-in-out infinite; transform-origin: bottom center; }
        .animate-sway-slow { animation: sway 6s ease-in-out infinite; transform-origin: bottom center; animation-delay: 1s; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float 5s ease-in-out infinite; animation-delay: 2s; }
        .sun-glow { animation: sun-glow 4s ease-in-out infinite; }
      `}} />

      {/* --- ANIMATED BACKGROUND ELEMENTS --- */}
      {/* Sun */}
      <div className="absolute top-10 right-10 md:top-20 md:right-32 w-32 h-32 md:w-48 md:h-48 bg-gradient-to-br from-yellow-200 to-orange-400 rounded-full sun-glow"></div>
      
      {/* Clouds */}
      <div className="absolute top-20 left-10 md:left-32 text-6xl opacity-80 animate-float">☁️</div>
      <div className="absolute top-32 right-1/4 text-5xl opacity-60 animate-float-delayed">☁️</div>
      
      {/* Ocean / Waves */}
      <div className="absolute bottom-0 w-full h-1/4 bg-gradient-to-t from-blue-500/80 to-cyan-400/30 backdrop-blur-sm border-t border-white/20"></div>

      {/* Coconut Trees */}
      <div className="absolute -bottom-5 left-2 md:left-10 text-8xl md:text-[10rem] animate-sway">🌴</div>
      <div className="absolute bottom-0 right-5 md:right-20 text-7xl md:text-[8rem] animate-sway-slow">🌴</div>
      <div className="absolute bottom-5 right-2 md:right-10 text-5xl md:text-[6rem] animate-sway opacity-80">🌴</div>


      {/* --- REGISTRATION CARD (GLASSMORPHISM) --- */}
      <div className="relative z-10 w-full max-w-lg bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.15)] p-8 border border-white/50 my-10">
        
        {/* SUCCESS SCREEN */}
        {status.success ? (
          <div className="text-center py-6 animate-float">
            <div className="text-6xl mb-4 animate-bounce">🎊</div>
            
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600 mb-6 leading-tight">
              Congratulations!<br/>Registration Successful
            </h2>
            
            {/* CHECK EMAIL BANNER */}
            <div className="bg-amber-50 border-2 border-amber-200 p-5 rounded-2xl mb-8 shadow-sm">
              <div className="text-4xl mb-2">📧</div>
              <h3 className="text-xl font-black text-amber-800 mb-2">Check Your Email & Confirm!</h3>
              <p className="text-amber-700 font-medium text-sm leading-relaxed">
                A verification link has been sent to your email address. Please click on that link to confirm and activate your account.
              </p>
            </div>

            <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-cyan-600 font-bold animate-pulse">Redirecting to login page...</p>
          </div>
        ) : (
          /* FORM SCREEN */
          <>
            <h2 className="text-3xl font-black text-center text-slate-800 mb-2 drop-shadow-sm">Partner Sign Up</h2>
            <p className="text-center text-slate-500 mb-8 font-medium">India Tour Operators par aapka swagat hai 🏖️</p>
            
            {status.error && (
              <div className="mb-6 p-3 bg-red-50/90 backdrop-blur-sm border border-red-200 text-red-700 text-sm rounded-xl font-medium shadow-sm">
                ⚠️ {status.error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Name of Vendor */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Agency Name
                  </label>
                  <input type="text" required 
                    className="w-full px-4 py-3 rounded-xl border border-white/60 bg-white/50 focus:bg-white focus:ring-2 focus:ring-cyan-400 outline-none transition-all text-slate-800 font-medium placeholder-slate-400 shadow-sm"
                    value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} 
                    placeholder="Ex: Raj Travels" />
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Mobile Number</label>
                  <input type="tel" required 
                    className="w-full px-4 py-3 rounded-xl border border-white/60 bg-white/50 focus:bg-white focus:ring-2 focus:ring-cyan-400 outline-none transition-all text-slate-800 font-medium placeholder-slate-400 shadow-sm"
                    value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                    placeholder="Ex: 9876543210" />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
                <input type="email" required 
                  className="w-full px-4 py-3 rounded-xl border border-white/60 bg-white/50 focus:bg-white focus:ring-2 focus:ring-cyan-400 outline-none transition-all text-slate-800 font-medium placeholder-slate-400 shadow-sm"
                  value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} 
                  placeholder="email@example.com" />
              </div>

              {/* Operating Location */}
              <div className="bg-cyan-50/80 p-4 rounded-2xl border border-cyan-100 transition-all">
                <label className="block text-sm font-bold text-cyan-900 mb-1">Operating City / Location</label>
                <input type="text" required 
                  className="w-full px-4 py-3 rounded-xl border border-white bg-white focus:ring-2 focus:ring-cyan-400 outline-none transition-all text-slate-800 font-medium placeholder-slate-400 shadow-sm"
                  value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} 
                  placeholder="Ex: Kochi, Kerala or Mumbai" />
                <p className="text-xs text-cyan-700 mt-2 font-medium">📍 Aap kis sheher se apni services operate karte hain?</p>
              </div>

              {/* 🌟 NEW: Business Website URL */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Business Website URL (Optional)</label>
                <input type="url" 
                  className="w-full px-4 py-3 rounded-xl border border-white/60 bg-white/50 focus:bg-white focus:ring-2 focus:ring-cyan-400 outline-none transition-all text-slate-800 font-medium placeholder-slate-400 shadow-sm"
                  value={formData.website} onChange={(e) => setFormData({...formData, website: e.target.value})} 
                  placeholder="https://www.yourwebsite.com" />
              </div>

              {/* DOCUMENT UPLOADS & PREVIEWS */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 transition-all">
                <h3 className="block text-sm font-bold text-slate-800 mb-3 border-b border-slate-200 pb-2">Business Verification Documents</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Agency Logo */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">Agency Logo *</label>
                    {logoUrl ? (
                      <div className="relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={logoUrl} alt="Logo Preview" className="w-full h-24 object-contain bg-white border border-slate-200 rounded-xl p-2" />
                        <button type="button" onClick={() => setLogoUrl('')} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-md hover:bg-red-600">✕</button>
                      </div>
                    ) : (
                      <label className="w-full h-24 flex flex-col items-center justify-center px-4 py-2 border-2 border-dashed border-cyan-300 bg-white/50 rounded-xl cursor-pointer hover:bg-white hover:border-cyan-500 transition-all">
                        <span className="text-xl mb-1">{isUploadingLogo ? '⏳' : '📁'}</span>
                        <span className="text-xs font-bold text-cyan-700">{isUploadingLogo ? 'Uploading...' : 'Upload Logo'}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={isUploadingLogo} />
                      </label>
                    )}
                  </div>

                  {/* Visiting Card */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">Visiting Card *</label>
                    {visitingCardUrl ? (
                      <div className="relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={visitingCardUrl} alt="Card Preview" className="w-full h-24 object-cover border border-slate-200 rounded-xl shadow-sm" />
                        <button type="button" onClick={() => setVisitingCardUrl('')} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-md hover:bg-red-600">✕</button>
                      </div>
                    ) : (
                      <label className="w-full h-24 flex flex-col items-center justify-center px-4 py-2 border-2 border-dashed border-cyan-300 bg-white/50 rounded-xl cursor-pointer hover:bg-white hover:border-cyan-500 transition-all">
                        <span className="text-xl mb-1">{isUploadingCard ? '⏳' : '🪪'}</span>
                        <span className="text-xs font-bold text-cyan-700">{isUploadingCard ? 'Uploading...' : 'Upload Card'}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleCardUpload} disabled={isUploadingCard} />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Create Password</label>
                <input type="password" required 
                  className="w-full px-4 py-3 rounded-xl border border-white/60 bg-white/50 focus:bg-white focus:ring-2 focus:ring-cyan-400 outline-none transition-all text-slate-800 font-medium placeholder-slate-400 shadow-sm"
                  value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} 
                  placeholder="Minimum 6 characters" />
              </div>

              <button type="submit" disabled={status.loading || isUploadingLogo || isUploadingCard}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-black py-4 px-4 rounded-xl transition-all disabled:opacity-70 mt-6 shadow-lg shadow-cyan-500/30 transform hover:-translate-y-1">
                {status.loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> 
                    Processing...
                  </span>
                ) : 'Sign Up as Partner'}
              </button>
            </form>

            <p className="text-center text-sm text-slate-600 mt-8 font-medium">
              Already have an account? <Link href="/login" className="text-cyan-600 font-black hover:underline ml-1">Login here</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}