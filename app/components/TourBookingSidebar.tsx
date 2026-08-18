"use client"
import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'

export default function TourBookingSidebar({ tour, meta, destinations }: { tour: any, meta: any, destinations: string }) {
  const [activeModal, setActiveModal] = useState<'book' | 'inquiry' | null>(null)
  
  // Booking ko 3 steps mein todne ke liye state
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3>(1)
  
  const [submitting, setSubmitting] = useState(false)
  
  const [minDate, setMinDate] = useState('')
  useEffect(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    setMinDate(tomorrow.toISOString().split('T')[0])
  }, [])

  const getOriginalPrice = (price: string | number) => {
    return Math.round(Number(price) * 1.15)
  }

  // ==========================================
  // 1. BOOKING FORM STATE & HANDLERS
  // ==========================================
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    date: '',
    time: '',
    pickup: '',
    selectedPackage: '',
    transactionId: '' // Naya field UTR/Transaction ID ke liye
  })
  
  const [consent1, setConsent1] = useState(false)
  const [consent2, setConsent2] = useState(false)

  const placesToVisitStr = meta.placesToVisit && meta.placesToVisit.length > 0 
    ? meta.placesToVisit.join(', ') 
    : destinations

  const packageOptions: string[] = []
  
  if (meta.personPrices) {
    if (meta.personPrices.min2) packageOptions.push(`Min 2 Pax: ₹${meta.personPrices.min2}/pax (Total: ₹${meta.personPrices.min2 * 2})`)
    if (meta.personPrices.min4) packageOptions.push(`Min 4 Pax: ₹${meta.personPrices.min4}/pax (Total: ₹${meta.personPrices.min4 * 4})`)
    if (meta.personPrices.min6) packageOptions.push(`Min 6 Pax: ₹${meta.personPrices.min6}/pax (Total: ₹${meta.personPrices.min6 * 6})`)
    if (meta.personPrices.min8) packageOptions.push(`Min 8+ Pax: ₹${meta.personPrices.min8}/pax (Total: ₹${meta.personPrices.min8 * 8})`)
  }

  if (meta.cabPrices) {
    if (meta.cabPrices.hatchback) {
      const ext = meta.cabExtraCharges?.hatchback ? ` (+₹${meta.cabExtraCharges.hatchback}/hr)` : '';
      packageOptions.push(`Hatchback (4+1D): ₹${meta.cabPrices.hatchback}${ext}`)
    }
    if (meta.cabPrices.sedan) {
      const ext = meta.cabExtraCharges?.sedan ? ` (+₹${meta.cabExtraCharges.sedan}/hr)` : '';
      packageOptions.push(`Sedan (4+1D): ₹${meta.cabPrices.sedan}${ext}`)
    }
    if (meta.cabPrices.suv) {
      const ext = meta.cabExtraCharges?.suv ? ` (+₹${meta.cabExtraCharges.suv}/hr)` : '';
      packageOptions.push(`SUV/Ertiga (6+1D): ₹${meta.cabPrices.suv}${ext}`)
    }
    if (meta.cabPrices.innova) {
      const ext = meta.cabExtraCharges?.innova ? ` (+₹${meta.cabExtraCharges.innova}/hr)` : '';
      packageOptions.push(`Innova/Crysta (6+1D): ₹${meta.cabPrices.innova}${ext}`)
    }
    if (meta.cabPrices.tempo) {
      const ext = meta.cabExtraCharges?.tempo ? ` (+₹${meta.cabExtraCharges.tempo}/hr)` : '';
      packageOptions.push(`Tempo Traveller (12+1D): ₹${meta.cabPrices.tempo}${ext}`)
    }
  }

  // YAHAN APNI UPI ID AUR NAAM DAALEIN
  const advanceAmount = "1.00" // Rs 1 advance payment
  const upiId = "rajcabs09@okicici" // Example: 9892455466@ybl
  const payeeName = "E-Mumbai Tourism"
  
  // Standard UPI Link format
  const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${advanceAmount}&cu=INR`
  // Free API se QR Code Generate karna
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiLink)}`

  const handleProceedToStep2 = () => {
    if (!formData.selectedPackage) {
      alert("Please select a Package / Vehicle to continue.")
      return
    }
    if (!consent1 || !consent2) {
      alert("Please accept both terms to proceed with booking.")
      return
    }
    setBookingStep(2)
  }

  const handleProceedToStep3 = (e: React.FormEvent) => {
    e.preventDefault()
    setBookingStep(3)
  }

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.transactionId) {
      alert("Please enter the UTR / Transaction ID after making the payment.")
      return
    }
    setSubmitting(true)

    const bookingDataPayload = {
      customer_name: formData.name,
      customer_mobile: formData.phone,
      booking_type: 'tour',
      listing_title: tour.title,
      booking_details: {
        tour_id: tour.id,
        vendor_id: tour.vendor_id,
        date: formData.date,
        time: formData.time,
        pickup: formData.pickup,
        selectedPackage: formData.selectedPackage,
        placesToVisit: placesToVisitStr,
        inclusions: meta.inclusions || 'Not specified',
        exclusions: meta.exclusions || 'Not specified',
        paymentStatus: 'Advance Paid',
        advanceAmount: `₹${advanceAmount}`,
        transactionId: formData.transactionId // Transaction ID saved
      }
    }

    const { error } = await supabase.from('bookings').insert([bookingDataPayload])
    if (error) console.error("Booking save error:", error)

    fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'New Tour Booking Lead (Advance Paid)', data: bookingDataPayload })
    }).catch(err => console.error("Email bhejte waqt error aaya:", err))

    const waNumber = '919892455466'
    const text = `🚀 *New Booking Confirmed*
-----------------------------
*Tour Name:* ${tour.title}
*Customer Name:* ${formData.name}
*Contact No:* ${formData.phone}
*Date & Time:* ${formData.date} at ${formData.time}
*Pickup Loc:* ${formData.pickup}
*Package Selected:* ${formData.selectedPackage}

💳 *Payment Details:*
*Advance Paid:* ₹${advanceAmount}
*Transaction ID (UTR):* ${formData.transactionId}

*(Note for Customer: Please attach the payment screenshot here in this chat for verification)*

📍 *Places to Visit:* 
${placesToVisitStr || 'As per itinerary'}`

    const encodedText = encodeURIComponent(text)
    
    setSubmitting(false)
    setActiveModal(null)
    setBookingStep(1)
    
    window.open(`https://wa.me/${waNumber}?text=${encodedText}`, '_blank')
  }

  // ==========================================
  // 2. INQUIRY FORM STATE & HANDLERS
  // ==========================================
  const [inquiryData, setInquiryData] = useState({
    name: '',
    mobile: '',
    purpose: ''
  })

  const handleInquiryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.target.name === 'mobile') {
      setInquiryData({ ...inquiryData, [e.target.name]: e.target.value.replace(/\D/g, '') })
    } else {
      setInquiryData({ ...inquiryData, [e.target.name]: e.target.value })
    }
  }

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const waNumber = '919892455466'

    const inquiryPayload = {
      customer_name: inquiryData.name,
      customer_mobile: inquiryData.mobile,
      booking_type: 'tour_inquiry',
      listing_title: tour.title,
      booking_details: {
        requestType: 'Inquiry',
        purpose: inquiryData.purpose,
        pageUrl: typeof window !== 'undefined' ? window.location.href : 'Unknown'
      }
    }

    const { error } = await supabase.from('bookings').insert([inquiryPayload])
    if (error) console.error("Inquiry save error:", error)

    fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'New Tour Inquiry Alert', data: inquiryPayload })
    }).catch(err => console.error("Email bhejte waqt error aaya:", err))

    const message = `*New Tour Inquiry* 💬
    
*Customer Details:*
👤 Name: ${inquiryData.name}
📞 Mobile: ${inquiryData.mobile}

*Inquiring For:* 
🗺️ ${tour.title}

*Purpose / Question:*
${inquiryData.purpose}

Kindly provide more details.`.trim()

    const encodedMessage = encodeURIComponent(message)
    window.open(`https://wa.me/${waNumber}?text=${encodedMessage}`, '_blank')

    setSubmitting(false)
    setActiveModal(null)
  }

  return (
    <>
      <div className="bg-white p-6 rounded-2xl shadow-xl border border-blue-100 sticky top-24">
        
        {/* Available Packages Pricing Section */}
        <div className="mb-2">
          <h3 className="text-gray-900 font-extrabold text-xl border-b pb-2 mb-4">{tour.title || 'Tour'} Package Cost</h3>
          
          {meta.duration && (
            <div className="mb-5 bg-blue-50/80 border border-blue-100 p-3 rounded-xl flex items-center gap-3">
              <span className="text-2xl">⏱️</span>
              <div>
                <span className="block text-[10px] font-black text-blue-900 uppercase tracking-widest">Tour Duration</span>
                <span className="font-black text-gray-800 text-sm">{meta.duration}</span>
              </div>
            </div>
          )}

          {/* Per Person Pricing List */}
          {meta.personPrices && (meta.personPrices.min2 || meta.personPrices.min4 || meta.personPrices.min6 || meta.personPrices.min8) && (
            <div className="mb-5 space-y-2">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Per Person Pricing</h4>
              
              {meta.personPrices.min2 && (
                <div className="flex justify-between items-center text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="text-gray-700 font-bold">Min 2 Pax:</span> 
                  <div className="text-right">
                    <div className="flex justify-end items-center gap-1.5 mb-1">
                      <span className="line-through text-gray-400 text-xs font-medium">₹{getOriginalPrice(meta.personPrices.min2)}</span>
                      <span className="bg-purple-100 text-purple-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded">15% OFF</span>
                    </div>
                    <span className="font-black text-green-600 text-lg">₹{meta.personPrices.min2} <span className="text-xs font-normal text-gray-500">/pax</span></span>
                    <span className="block text-xs font-black text-emerald-600 mt-0.5">Total: ₹{meta.personPrices.min2 * 2}</span>
                  </div>
                </div>
              )}
              
              {meta.personPrices.min4 && (
                <div className="flex justify-between items-center text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="text-gray-700 font-bold">Min 4 Pax:</span> 
                  <div className="text-right">
                    <div className="flex justify-end items-center gap-1.5 mb-1">
                      <span className="line-through text-gray-400 text-xs font-medium">₹{getOriginalPrice(meta.personPrices.min4)}</span>
                      <span className="bg-purple-100 text-purple-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded">15% OFF</span>
                    </div>
                    <span className="font-black text-green-600 text-lg">₹{meta.personPrices.min4} <span className="text-xs font-normal text-gray-500">/pax</span></span>
                    <span className="block text-xs font-black text-emerald-600 mt-0.5">Total: ₹{meta.personPrices.min4 * 4}</span>
                  </div>
                </div>
              )}
              
              {meta.personPrices.min6 && (
                <div className="flex justify-between items-center text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="text-gray-700 font-bold">Min 6 Pax:</span> 
                  <div className="text-right">
                    <div className="flex justify-end items-center gap-1.5 mb-1">
                      <span className="line-through text-gray-400 text-xs font-medium">₹{getOriginalPrice(meta.personPrices.min6)}</span>
                      <span className="bg-purple-100 text-purple-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded">15% OFF</span>
                    </div>
                    <span className="font-black text-green-600 text-lg">₹{meta.personPrices.min6} <span className="text-xs font-normal text-gray-500">/pax</span></span>
                    <span className="block text-xs font-black text-emerald-600 mt-0.5">Total: ₹{meta.personPrices.min6 * 6}</span>
                  </div>
                </div>
              )}
              
              {meta.personPrices.min8 && (
                <div className="flex justify-between items-center text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="text-gray-700 font-bold">Min 8+ Pax:</span> 
                  <div className="text-right">
                    <div className="flex justify-end items-center gap-1.5 mb-1">
                      <span className="line-through text-gray-400 text-xs font-medium">₹{getOriginalPrice(meta.personPrices.min8)}</span>
                      <span className="bg-purple-100 text-purple-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded">15% OFF</span>
                    </div>
                    <span className="font-black text-green-600 text-lg">₹{meta.personPrices.min8} <span className="text-xs font-normal text-gray-500">/pax</span></span>
                    <span className="block text-xs font-black text-emerald-600 mt-0.5">Total: ₹{meta.personPrices.min8 * 8}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cab Wise Pricing List with Extra Time Charges */}
          {meta.cabPrices && (meta.cabPrices.hatchback || meta.cabPrices.sedan || meta.cabPrices.suv || meta.cabPrices.innova || meta.cabPrices.tempo) && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Cab Wise Pricing</h4>
              
              {meta.cabPrices.hatchback && (
                <div className="flex flex-col text-sm bg-orange-50 p-3 rounded-lg border border-orange-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-gray-900 font-black block">Hatchback</span>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mt-0.5">4+1D Seater</span>
                    </div>
                    <div className="text-right">
                      <div className="flex justify-end items-center gap-1.5 mb-0.5">
                        <span className="line-through text-gray-400 text-xs font-medium">₹{getOriginalPrice(meta.cabPrices.hatchback)}</span>
                        <span className="bg-purple-100 text-purple-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded">15% OFF</span>
                      </div>
                      <span className="font-black text-green-600 text-lg">₹{meta.cabPrices.hatchback}</span>
                    </div>
                  </div>
                  {meta.cabExtraCharges?.hatchback && <span className="text-xs font-bold text-orange-600 mt-1 text-right">+ Extra: ₹{meta.cabExtraCharges.hatchback}/hr</span>}
                </div>
              )}
              
              {meta.cabPrices.sedan && (
                <div className="flex flex-col text-sm bg-orange-50 p-3 rounded-lg border border-orange-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-gray-900 font-black block">Sedan</span>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mt-0.5">4+1D Seater</span>
                    </div>
                    <div className="text-right">
                      <div className="flex justify-end items-center gap-1.5 mb-0.5">
                        <span className="line-through text-gray-400 text-xs font-medium">₹{getOriginalPrice(meta.cabPrices.sedan)}</span>
                        <span className="bg-purple-100 text-purple-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded">15% OFF</span>
                      </div>
                      <span className="font-black text-green-600 text-lg">₹{meta.cabPrices.sedan}</span>
                    </div>
                  </div>
                  {meta.cabExtraCharges?.sedan && <span className="text-xs font-bold text-orange-600 mt-1 text-right">+ Extra: ₹{meta.cabExtraCharges.sedan}/hr</span>}
                </div>
              )}
              
              {meta.cabPrices.suv && (
                <div className="flex flex-col text-sm bg-orange-50 p-3 rounded-lg border border-orange-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-gray-900 font-black block">SUV/Ertiga</span>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mt-0.5">6+1D Seater</span>
                    </div>
                    <div className="text-right">
                      <div className="flex justify-end items-center gap-1.5 mb-0.5">
                        <span className="line-through text-gray-400 text-xs font-medium">₹{getOriginalPrice(meta.cabPrices.suv)}</span>
                        <span className="bg-purple-100 text-purple-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded">15% OFF</span>
                      </div>
                      <span className="font-black text-green-600 text-lg">₹{meta.cabPrices.suv}</span>
                    </div>
                  </div>
                  {meta.cabExtraCharges?.suv && <span className="text-xs font-bold text-orange-600 mt-1 text-right">+ Extra: ₹{meta.cabExtraCharges.suv}/hr</span>}
                </div>
              )}
              
              {meta.cabPrices.innova && (
                <div className="flex flex-col text-sm bg-orange-50 p-3 rounded-lg border border-orange-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-gray-900 font-black block">Innova/Crysta</span>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mt-0.5">6+1D Seater</span>
                    </div>
                    <div className="text-right">
                      <div className="flex justify-end items-center gap-1.5 mb-0.5">
                        <span className="line-through text-gray-400 text-xs font-medium">₹{getOriginalPrice(meta.cabPrices.innova)}</span>
                        <span className="bg-purple-100 text-purple-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded">15% OFF</span>
                      </div>
                      <span className="font-black text-green-600 text-lg">₹{meta.cabPrices.innova}</span>
                    </div>
                  </div>
                  {meta.cabExtraCharges?.innova && <span className="text-xs font-bold text-orange-600 mt-1 text-right">+ Extra: ₹{meta.cabExtraCharges.innova}/hr</span>}
                </div>
              )}
              
              {meta.cabPrices.tempo && (
                <div className="flex flex-col text-sm bg-orange-50 p-3 rounded-lg border border-orange-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-gray-900 font-black block">Tempo Traveller</span>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mt-0.5">12+1D Seater</span>
                    </div>
                    <div className="text-right">
                      <div className="flex justify-end items-center gap-1.5 mb-0.5">
                        <span className="line-through text-gray-400 text-xs font-medium">₹{getOriginalPrice(meta.cabPrices.tempo)}</span>
                        <span className="bg-purple-100 text-purple-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded">15% OFF</span>
                      </div>
                      <span className="font-black text-green-600 text-lg">₹{meta.cabPrices.tempo}</span>
                    </div>
                  </div>
                  {meta.cabExtraCharges?.tempo && <span className="text-xs font-bold text-orange-600 mt-1 text-right">+ Extra: ₹{meta.cabExtraCharges.tempo}/hr</span>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* QUICK LINK FOR INCLUSIONS & EXCLUSIONS */}
        <div className="mt-3 mb-1 text-center">
          <a href="#inclusions" className="text-[13px] font-bold text-blue-600 hover:text-blue-800 underline underline-offset-4 decoration-blue-200 hover:decoration-blue-600 transition-all">
            See What's Included & Excluded ↓
          </a>
        </div>

        {/* TRUST BADGES */}
        <div className="mt-4 mb-6 grid grid-cols-3 gap-2 text-center border-t border-gray-100 pt-5">
          <div className="flex flex-col items-center">
            <span className="text-xl mb-1">🔒</span>
            <span className="text-[10px] font-bold text-gray-500 uppercase">Secure</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xl mb-1">✅</span>
            <span className="text-[10px] font-bold text-gray-500 uppercase">No Hidden<br/>Fees</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xl mb-1">🆓</span>
            <span className="text-[10px] font-bold text-gray-500 uppercase">Easy<br/>Cancel</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button 
            onClick={() => { setActiveModal('book'); setBookingStep(1); }}
            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors shadow-lg text-lg flex items-center justify-center gap-2"
          >
            🗓️ Book Now
          </button>
          
          <button 
            onClick={() => setActiveModal('inquiry')}
            className="w-full bg-green-50 border border-green-200 text-green-700 font-bold py-3 px-4 rounded-xl hover:bg-green-100 transition-colors text-lg flex items-center justify-center gap-2"
          >
            💬 Send Inquiry
          </button>
        </div>

      </div>

      {/* ========================================== */}
      {/* MODAL 1: BOOKING FORM                      */}
      {/* ========================================== */}
      {activeModal === 'book' && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative my-8">
            
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">Book: {tour.title}</h2>
                <span className="text-xs font-bold text-blue-600 tracking-wider uppercase mt-1 block">
                  Step {bookingStep} of 3
                </span>
              </div>
              <button onClick={() => { setActiveModal(null); setBookingStep(1); }} className="text-gray-400 hover:text-gray-800 font-bold text-xl">✕</button>
            </div>

            <div className="p-6">
              
              {/* --- STEP 1: Details & Package Selection --- */}
              {bookingStep === 1 && (
                <div className="space-y-6">
                  <div className="bg-gray-50 p-5 rounded-xl text-sm space-y-4 border border-gray-200">
                    <div>
                      <span className="font-bold text-blue-900 block mb-1">📍 Places to Visit:</span> 
                      <span className="text-gray-700">{placesToVisitStr || 'As per itinerary'}</span>
                    </div>
                    {meta.inclusions && (
                      <div>
                        <span className="font-bold text-green-700 block mb-1">✅ Included:</span> 
                        <span className="text-gray-700 whitespace-pre-wrap">{meta.inclusions}</span>
                      </div>
                    )}
                    {meta.exclusions && (
                      <div>
                        <span className="font-bold text-red-700 block mb-1">❌ Excluded:</span> 
                        <span className="text-gray-700 whitespace-pre-wrap">{meta.exclusions}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Select Package / Vehicle <span className="text-red-500">*</span></label>
                    <select required className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:border-blue-500 outline-none font-bold text-blue-800 bg-blue-50/30" value={formData.selectedPackage} onChange={(e) => setFormData({...formData, selectedPackage: e.target.value})}>
                      <option value="">-- Choose from available options --</option>
                      {packageOptions.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                    </select>
                  </div>

                  <div className="space-y-3 bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" required checked={consent1} onChange={(e) => setConsent1(e.target.checked)} className="mt-1 w-4 h-4 text-blue-600 rounded" />
                      <span className="text-sm font-bold text-gray-800">Your booking will be confirmed only after an advance payment of ₹{advanceAmount}.</span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" required checked={consent2} onChange={(e) => setConsent2(e.target.checked)} className="mt-1 w-4 h-4 text-blue-600 rounded" />
                      <span className="text-sm font-medium text-gray-700">I agree to the <a href="/cancellation-policy" target="_blank" className="text-blue-600 underline font-bold">Cancellation Policy</a>.</span>
                    </label>
                  </div>

                  <button type="button" onClick={handleProceedToStep2} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-colors shadow-lg text-lg">
                    Continue ➔
                  </button>
                </div>
              )}

              {/* --- STEP 2: Customer Details Form --- */}
              {bookingStep === 2 && (
                <form onSubmit={handleProceedToStep3} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <button type="button" onClick={() => setBookingStep(1)} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-bold text-sm mb-2 bg-blue-50 px-3 py-1.5 rounded-lg w-fit transition-colors">
                    ← Back to Package Info
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Your Name <span className="text-red-500">*</span></label>
                      <input type="text" required className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Full Name" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Contact Number <span className="text-red-500">*</span></label>
                      <input type="tel" required pattern="[0-9]{10}" maxLength={10} title="Please enter a valid 10-digit mobile number" className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})} placeholder="10-digit WhatsApp Number" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Date of Travel <span className="text-red-500">*</span></label>
                      <input type="date" required min={minDate} className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Pickup Time <span className="text-red-500">*</span></label>
                      <input type="time" required className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-700 mb-1">Pickup Address (Hotel / Airport / Station) <span className="text-red-500">*</span></label>
                      <input type="text" required className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm" value={formData.pickup} onChange={(e) => setFormData({...formData, pickup: e.target.value})} placeholder="Exact pickup location" />
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Selected Package</p>
                    <p className="text-sm font-black text-blue-900">{formData.selectedPackage}</p>
                  </div>

                  <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-colors shadow-lg text-lg flex items-center justify-center gap-2">
                    Proceed to Payment (₹{advanceAmount}) ➔
                  </button>
                </form>
              )}

              {/* --- STEP 3: Payment (UPI & QR) --- */}
              {bookingStep === 3 && (
                <form onSubmit={handleFinalSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <button type="button" onClick={() => setBookingStep(2)} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-bold text-sm mb-2 bg-blue-50 px-3 py-1.5 rounded-lg w-fit transition-colors">
                    ← Back to Details
                  </button>

                  <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-2xl text-center shadow-sm">
                    <h3 className="text-lg font-black text-gray-900 mb-1">Advance Booking Amount</h3>
                    <div className="text-4xl font-extrabold text-amber-600 mb-4">₹{advanceAmount}</div>
                    <p className="text-sm font-medium text-gray-600 mb-6">
                      Please scan the QR code below using any UPI app (GPay, PhonePe, Paytm) to confirm your booking.
                    </p>
                    
                    {/* QR CODE DISPLAY */}
                    <div className="bg-white p-4 inline-block rounded-2xl shadow-md border border-gray-200 mb-6">
                      <img src={qrCodeUrl} alt="UPI QR Code" className="w-48 h-48 object-contain" />
                    </div>

                    {/* MOBILE DIRECT PAY LINK */}
                    <div className="mb-6">
                      <a href={upiLink} className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-xl shadow-md inline-flex items-center gap-2 transition-all">
                        ⚡ Click here to Pay via UPI App
                      </a>
                    </div>
                  </div>

                  {/* UTR Input Section */}
                  <div className="bg-white border-2 border-blue-100 p-5 rounded-xl shadow-sm">
                    <label className="block text-sm font-bold text-gray-800 mb-2">
                      Enter 12-digit UTR / Transaction ID <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-500 mb-3">
                      Payment karne ke baad apna UTR ya Transaction ID yahan dalein. WhatsApp open hone ke baad wahan screenshot attach karein.
                    </p>
                    <input 
                      type="text" 
                      required 
                      className="w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 outline-none bg-gray-50 font-bold tracking-widest text-center uppercase" 
                      value={formData.transactionId} 
                      onChange={(e) => setFormData({...formData, transactionId: e.target.value})} 
                      placeholder="e.g. 312345678901" 
                    />
                  </div>

                  <button type="submit" disabled={submitting} className="w-full bg-green-600 text-white font-bold py-4 rounded-xl hover:bg-green-700 disabled:bg-green-400 transition-colors shadow-lg text-lg flex items-center justify-center gap-2">
                    {submitting ? 'Processing...' : 'Confirm Booking & Send WhatsApp ➔'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 2: INQUIRY FORM                      */}
      {/* ========================================== */}
      {activeModal === 'inquiry' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            
            <div className="bg-slate-800 p-6 flex justify-between items-center text-white">
              <h3 className="text-xl font-black">Send Inquiry</h3>
              <button onClick={() => setActiveModal(null)} className="text-white hover:bg-slate-700 rounded-full p-2 font-bold transition">✕</button>
            </div>

            <form onSubmit={handleInquirySubmit} className="p-6 md:p-8 space-y-5">
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Your Name</label>
                <input type="text" name="name" required className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 font-bold outline-none focus:border-slate-500" placeholder="John Doe" onChange={handleInquiryChange} />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mobile Number</label>
                <input type="tel" name="mobile" required pattern="[0-9]{10}" maxLength={10} title="Please enter a valid 10-digit mobile number" className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 font-bold outline-none focus:border-slate-500" placeholder="10-digit Mobile No." onChange={handleInquiryChange} />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Purpose / Your Question</label>
                <textarea name="purpose" required rows={3} className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 font-bold outline-none focus:border-slate-500 resize-none" placeholder="What details would you like to know?" onChange={handleInquiryChange}></textarea>
              </div>

              <div className="pt-4 mt-6 border-t border-slate-100">
                <button type="submit" disabled={submitting} className="w-full bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white font-black py-4 rounded-xl shadow-lg transition-all active:scale-95 text-lg">
                  {submitting ? 'Processing...' : 'Send Inquiry via WhatsApp →'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </>
  )
}