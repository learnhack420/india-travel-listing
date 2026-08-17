"use client"
import { useEffect, useState } from 'react'
import { supabase } from '../../../../../utils/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'



const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false })
import 'react-quill-new/dist/quill.snow.css'

export default function EditTourListing() {
  const router = useRouter()
  const params = useParams()
  const listingId = params.id as string

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // 1. Basic Info & SEO States
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('') 
  const [slugEdited, setSlugEdited] = useState(false) 
  
  // Thumbnail & Metadata
  const [thumbnail, setThumbnail] = useState('')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [metaKeywords, setMetaKeywords] = useState('')

  const [startLocation, setStartLocation] = useState('')
  const [destinations, setDestinations] = useState('')
  
  // Duration & Fixed Pickup Times State
  const [durationDays, setDurationDays] = useState('3')
  const [durationNights, setDurationNights] = useState('2')
  const [durationHours, setDurationHours] = useState('0')
  const [pickupTimes, setPickupTimes] = useState(['08:00'])

  const [price, setPrice] = useState('') 

  // 🌟 NEW: Best Time to Visit State
  const [bestTimeToVisit, setBestTimeToVisit] = useState('')
  const [bestMonths, setBestMonths] = useState<string[]>([])
  
  // 2. Pricing & Description
  const [overview, setOverview] = useState('') 
  const [personPrices, setPersonPrices] = useState({ min2: '', min4: '', min6: '', min8: '' })
  const [cabPrices, setCabPrices] = useState({ hatchback: '', sedan: '', suv: '', innova: '', tempo: '' })
  
  // 3. Tour Details
  const [placesToVisit, setPlacesToVisit] = useState(['']) 
  const [itineraryDays, setItineraryDays] = useState([{ day: 1, title: '', description: '' }]) 
  const [inclusions, setInclusions] = useState('')
  const [exclusions, setExclusions] = useState('')

  // 4. Image Gallery (Links)
  const [gallery, setGallery] = useState([''])

  // 5. FAQs State
  const [faqs, setFaqs] = useState([{ question: '', answer: '' }])

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ]
  }

  const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  useEffect(() => {
    checkAuthAndFetchData()
  }, [])

  async function checkAuthAndFetchData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }

    // Check user role (Admin vs Vendor)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    const isAdmin = profile?.role === 'admin'

    // Fetch listing
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('id', listingId)
      .single()

    // Authorization check
    if (error || !data || (!isAdmin && data.vendor_id !== session.user.id)) {
      alert("Tour package nahi mila ya unauthorized access hai.")
      router.push(isAdmin ? '/admin' : '/vendor')
      return
    }

    // Basic fields populate karna
    setTitle(data.title || '')
    setPrice(data.price ? data.price.toString() : '')
    
    if (data.slug) {
      setSlug(data.slug)
      setSlugEdited(true) 
    }

    if (data.location && data.location.includes('➔')) {
      const parts = data.location.split('➔').map((s: string) => s.trim())
      setStartLocation(parts[0] || '')
      setDestinations(parts[1] || '')
    } else {
      setStartLocation(data.location || '')
    }

    // Metadata se structured data load karna
    const meta = data.metadata || {}
    setOverview(meta.overview || '')
    setThumbnail(meta.thumbnail || '')
    
    // Extract Duration (Parse string to Days, Nights, Hours)
    if (meta.duration) {
      let d = '0', n = '0', h = '0'
      meta.duration.split('/').forEach((part: string) => {
        if (part.toLowerCase().includes('day')) d = part.replace(/[^0-9]/g, '')
        if (part.toLowerCase().includes('night')) n = part.replace(/[^0-9]/g, '')
        if (part.toLowerCase().includes('hour')) h = part.replace(/[^0-9]/g, '')
      })
      setDurationDays(d || '0')
      setDurationNights(n || '0')
      setDurationHours(h || '0')
    }

    // Load Pickup Times
    if (meta.pickupTimes && meta.pickupTimes.length > 0) {
      setPickupTimes(meta.pickupTimes)
    }

    if (meta.seo) {
      setMetaTitle(meta.seo.metaTitle || '')
      setMetaDescription(meta.seo.metaDescription || '')
      setMetaKeywords(meta.seo.metaKeywords || '')
    }

    // 🌟 Load Best Time to Visit
    setBestTimeToVisit(meta.bestTimeToVisit || '')
    if (meta.bestMonths && meta.bestMonths.length > 0) {
      setBestMonths(meta.bestMonths)
    }

    setPersonPrices(meta.personPrices || { min2: '', min4: '', min6: '', min8: '' })
    setCabPrices(meta.cabPrices || { hatchback: '', sedan: '', suv: '', innova: '', tempo: '' })
    setInclusions(meta.inclusions || '')
    setExclusions(meta.exclusions || '')
    
    if (meta.placesToVisit && meta.placesToVisit.length > 0) {
      setPlacesToVisit(meta.placesToVisit)
    }

    // Load new dynamic itinerary OR fallback to old string itinerary
    if (meta.itineraryDays && meta.itineraryDays.length > 0) {
      setItineraryDays(meta.itineraryDays)
    } else if (meta.itinerary) {
      setItineraryDays([{ day: 1, title: 'Day 1 Itinerary', description: meta.itinerary }])
    }
    
    if (meta.gallery && meta.gallery.length > 0) {
      setGallery(meta.gallery)
    }
    if (meta.faqs && meta.faqs.length > 0) {
      setFaqs(meta.faqs)
    }

    setLoading(false)
  }

  // --- SLUG LOGIC ---
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    if (!slugEdited) {
      const generatedSlug = newTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') 
        .replace(/(^-|-$)+/g, '')    
      setSlug(generatedSlug)
    }
  }

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const manualSlug = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '') 
    setSlug(manualSlug)
    setSlugEdited(true) 
  }
  // ------------------

  // Dynamic Handlers
  const handlePickupTimeChange = (index: number, value: string) => {
    const newTimes = [...pickupTimes]; newTimes[index] = value; setPickupTimes(newTimes)
  }
  const addPickupTime = () => setPickupTimes([...pickupTimes, '09:00'])
  const removePickupTime = (index: number) => { if (pickupTimes.length > 1) setPickupTimes(pickupTimes.filter((_, i) => i !== index)) }

  const handlePlaceChange = (index: number, value: string) => {
    const newPlaces = [...placesToVisit]; newPlaces[index] = value; setPlacesToVisit(newPlaces)
  }
  const addPlace = () => setPlacesToVisit([...placesToVisit, ''])
  const removePlace = (index: number) => { if (placesToVisit.length > 1) setPlacesToVisit(placesToVisit.filter((_, i) => i !== index)) }

  const handleItineraryChange = (index: number, field: 'title' | 'description', value: string) => {
    const newItinerary = [...itineraryDays]
    newItinerary[index][field] = value
    setItineraryDays(newItinerary)
  }
  const addItineraryDay = () => setItineraryDays([...itineraryDays, { day: itineraryDays.length + 1, title: '', description: '' }])
  const removeItineraryDay = (index: number) => { 
    if (itineraryDays.length > 1) {
      const filtered = itineraryDays.filter((_, i) => i !== index)
      const reIndexed = filtered.map((item, i) => ({ ...item, day: i + 1 }))
      setItineraryDays(reIndexed)
    }
  }

  // Gallery & FAQ Handlers
  const handleGalleryChange = (index: number, value: string) => {
    const newGallery = [...gallery]; newGallery[index] = value; setGallery(newGallery)
  }
  const addGalleryImage = () => setGallery([...gallery, ''])
  const removeGalleryImage = (index: number) => { if (gallery.length > 1) setGallery(gallery.filter((_, i) => i !== index)) }

  const handleFaqChange = (index: number, field: 'question' | 'answer', value: string) => {
    const newFaqs = [...faqs]; newFaqs[index][field] = value; setFaqs(newFaqs)
  }
  const addFaq = () => setFaqs([...faqs, { question: '', answer: '' }])
  const removeFaq = (index: number) => { if (faqs.length > 1) setFaqs(faqs.filter((_, i) => i !== index)) }

  // Handler for Month Selection
  const toggleMonth = (month: string) => {
    if (bestMonths.includes(month)) {
      setBestMonths(bestMonths.filter(m => m !== month))
    } else {
      setBestMonths([...bestMonths, month])
    }
  }

  // Delete Handler
  const handleDelete = async () => {
    if (!window.confirm("Kya aap sach mein is tour package ko delete karna chahte hain?")) return
    setDeleting(true)

    const { error } = await supabase.from('listings').delete().eq('id', listingId)

    if (error) {
      alert("Error deleting listing: " + error.message)
      setDeleting(false)
    } else {
      alert("Tour package successfully delete ho gaya hai!")
      router.push('/vendor') 
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage({ type: '', text: '' })

    // Format Duration String safely
    const dStr = []
    if (parseInt(durationDays) > 0) dStr.push(`${durationDays} Day${parseInt(durationDays) > 1 ? 's' : ''}`)
    if (parseInt(durationNights) > 0) dStr.push(`${durationNights} Night${parseInt(durationNights) > 1 ? 's' : ''}`)
    if (parseInt(durationHours) > 0) dStr.push(`${durationHours} Hour${parseInt(durationHours) > 1 ? 's' : ''}`)
    const finalDuration = dStr.join(' / ') || 'Custom Duration'

    // Format Pickup Times
    const cleanPickupTimes = pickupTimes.filter(t => t.trim() !== '')
    const formatTime12hr = (time24: string) => {
      if (!time24) return ''
      const [h, m] = time24.split(':')
      const hours = parseInt(h, 10)
      const ampm = hours >= 12 ? 'PM' : 'AM'
      const formattedHours = hours % 12 || 12
      return `${formattedHours}:${m} ${ampm}`
    }
    const formattedPickupTimesStr = cleanPickupTimes.map(formatTime12hr).join(', ') || 'Not fixed'

    const formattedPersonPricing = [
      personPrices.min2 ? `Min 2 Pax: ₹${personPrices.min2} / person` : '',
      personPrices.min4 ? `Min 4 Pax: ₹${personPrices.min4} / person` : '',
      personPrices.min6 ? `Min 6 Pax: ₹${personPrices.min6} / person` : '',
      personPrices.min8 ? `Min 8+ Pax: ₹${personPrices.min8} / person` : ''
    ].filter(Boolean).join('\n') || 'Not Available';

    const formattedCabPricing = [
      cabPrices.hatchback ? `Hatchback (Max 4): ₹${cabPrices.hatchback}` : '',
      cabPrices.sedan ? `Sedan (Max 4): ₹${cabPrices.sedan}` : '',
      cabPrices.suv ? `SUV / Ertiga (Max 6): ₹${cabPrices.suv}` : '',
      cabPrices.innova ? `Innova / Crysta (Max 6): ₹${cabPrices.innova}` : '',
      cabPrices.tempo ? `Tempo Traveller (Max 12): ₹${cabPrices.tempo}` : ''
    ].filter(Boolean).join('\n') || 'Not Available';

    const formattedFaqs = faqs
      .filter(f => f.question.trim() !== '' && f.answer.trim() !== '')
      .map(f => `❓ **Q: ${f.question}**\n👉 A: ${f.answer}`)
      .join('\n\n') || 'No FAQs provided';

    const formattedItinerary = itineraryDays
      .filter(d => d.title.trim() !== '')
      .map(d => `🔹 **Day ${d.day}: ${d.title}**\n${d.description}`)
      .join('\n\n') || 'Not provided';
      
    const formattedPlaces = placesToVisit.filter(p => p.trim() !== '').join(', ') || 'Not provided';

    // Format Best Time to Visit for Description
    const formattedBestTime = `
Description: ${bestTimeToVisit || 'Not specified'}
Recommended Months: ${bestMonths.length > 0 ? bestMonths.join(', ') : 'All Year Round'}
    `.trim()

    const detailedDescription = `
📝 Overview:
${overview}

📍 Places to Visit:
${formattedPlaces}

🗓️ Best Time to Visit:
${formattedBestTime}

👥 Per Person Pricing (Based on Group Size):
${formattedPersonPricing}

🚖 Cab Wise Pricing (Entire Tour):
${formattedCabPricing}

⏳ Duration: ${finalDuration}
⏰ Pickup Times: ${formattedPickupTimesStr}

📋 Day-wise Itinerary:
${formattedItinerary}

✅ Inclusions: ${inclusions}
❌ Exclusions: ${exclusions}

💡 Frequently Asked Questions:
${formattedFaqs}
    `.trim()

    const cleanGallery = gallery.filter(link => link.trim() !== '')
    const cleanPlaces = placesToVisit.filter(p => p.trim() !== '')
    const cleanItinerary = itineraryDays.filter(d => d.title.trim() !== '')

    const { error } = await supabase
      .from('listings')
      .update({
        title: title,
        slug: slug,
        location: `${startLocation} ➔ ${destinations}`,
        price: parseFloat(price),
        description: detailedDescription,
        metadata: {
          duration: finalDuration,
          pickupTimes: cleanPickupTimes,
          overview,
          placesToVisit: cleanPlaces,
          itineraryDays: cleanItinerary,
          personPrices,
          cabPrices,
          inclusions,
          exclusions,
          thumbnail,
          gallery: cleanGallery,
          faqs,
          bestTimeToVisit, // 🌟 Save Best Time text
          bestMonths, // 🌟 Save Selected Months array
          seo: {
            metaTitle,
            metaDescription,
            metaKeywords
          }
        }
      })
      .eq('id', listingId)

    if (error) {
      if (error.code === '23505') {
        setMessage({ type: 'error', text: 'Error: Yeh SEO Slug pehle se kisi aur package ne use kiya hua hai.' })
      } else {
        setMessage({ type: 'error', text: 'Error updating tour: ' + error.message })
      }
      setSubmitting(false)
    } else {
      setMessage({ type: 'success', text: 'Tour package successfully update ho gaya hai!' })
      setSubmitting(false)
      setTimeout(() => {
        router.push('/vendor')
      }, 2000)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-xl">Loading Tour Details...</div>

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        
        <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-extrabold">Edit Tour Package</h1>
            <p className="text-blue-100 text-sm mt-1">Apne tour ki details update karein</p>
          </div>
          <div className="flex gap-3">
            <button 
              type="button" 
              onClick={handleDelete} 
              disabled={deleting}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-medium text-sm transition-colors text-white"
            >
              {deleting ? 'Deleting...' : '🗑️ Delete Package'}
            </button>
            <Link href="/vendor" className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-lg font-medium text-sm transition-colors">
              ← Cancel
            </Link>
          </div>
        </div>

        <div className="p-8">
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg text-sm font-bold ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-10">
            
            {/* Section 1: Basic Info & SEO */}
            <div>
              <h2 className="text-xl font-bold text-gray-800 border-b pb-2 mb-6">1. Basic Info & SEO Metadata</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Package Name</label>
                  <input type="text" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50" value={title} onChange={handleTitleChange} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">SEO URL (Slug)</label>
                  <div className="flex items-center">
                    <span className="px-3 py-2 bg-gray-200 border border-gray-300 border-r-0 rounded-l-lg text-gray-500 text-sm select-none">/tour/</span>
                    <input type="text" required className="w-full px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium text-blue-700" value={slug} onChange={handleSlugChange} />
                  </div>
                </div>
              </div>

              {/* SEO Meta Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-blue-900 mb-1">Meta Title (SEO)</label>
                  <input type="text" className="w-full px-4 py-2 border rounded-lg outline-none bg-white" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-blue-900 mb-1">Meta Description</label>
                  <textarea rows={2} className="w-full px-4 py-2 border rounded-lg outline-none bg-white resize-none" value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)}></textarea>
                </div>
                <div>
                  <label className="block text-sm font-bold text-blue-900 mb-1">Meta Keywords</label>
                  <textarea rows={2} className="w-full px-4 py-2 border rounded-lg outline-none bg-white resize-none" value={metaKeywords} onChange={(e) => setMetaKeywords(e.target.value)}></textarea>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Start From (Origin)</label>
                  <input type="text" required className="w-full px-4 py-2 border rounded-lg bg-gray-50 outline-none" value={startLocation} onChange={(e) => setStartLocation(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Destinations Covered</label>
                  <input type="text" required className="w-full px-4 py-2 border rounded-lg bg-gray-50 outline-none" value={destinations} onChange={(e) => setDestinations(e.target.value)} />
                </div>
              </div>

              {/* Duration & Pickup Times Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Tour Duration</label>
                  <div className="flex gap-2">
                    <div className="w-1/3">
                      <input type="number" min="0" className="w-full px-2 py-2 border rounded-lg bg-gray-50 outline-none text-center font-bold" value={durationDays} onChange={(e) => setDurationDays(e.target.value)} />
                      <span className="block text-xs text-gray-500 text-center mt-1">Days</span>
                    </div>
                    <div className="w-1/3">
                      <input type="number" min="0" className="w-full px-2 py-2 border rounded-lg bg-gray-50 outline-none text-center font-bold" value={durationNights} onChange={(e) => setDurationNights(e.target.value)} />
                      <span className="block text-xs text-gray-500 text-center mt-1">Nights</span>
                    </div>
                    <div className="w-1/3">
                      <input type="number" min="0" max="23" className="w-full px-2 py-2 border rounded-lg bg-gray-50 outline-none text-center font-bold" value={durationHours} onChange={(e) => setDurationHours(e.target.value)} />
                      <span className="block text-xs text-gray-500 text-center mt-1">Hours</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-bold text-gray-700">Fixed Pickup Times</label>
                    <button type="button" onClick={addPickupTime} className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded hover:bg-blue-200">+ Add Time</button>
                  </div>
                  <div className="space-y-2 max-h-24 overflow-y-auto pr-1">
                    {pickupTimes.map((time, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input type="time" required className="flex-1 px-3 py-1.5 border rounded-lg bg-gray-50 outline-none text-sm font-bold text-gray-700" value={time} onChange={(e) => handlePickupTimeChange(index, e.target.value)} />
                        {pickupTimes.length > 1 && (
                          <button type="button" onClick={() => removePickupTime(index)} className="text-red-500 font-bold px-2 hover:text-red-700">✕</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Starting Price (₹)</label>
                  <input type="number" required min="0" className="w-full px-4 py-2 border rounded-lg bg-gray-50 font-bold text-blue-700 outline-none" value={price} onChange={(e) => setPrice(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Main Thumbnail URL</label>
                  <input type="url" required className="w-full px-4 py-2 border rounded-lg bg-gray-50 outline-none" value={thumbnail} onChange={(e) => setThumbnail(e.target.value)} />
                </div>
              </div>
            </div>

            {/* 🌟 NEW: Best Time to Visit Block */}
            <div>
              <h2 className="text-xl font-bold text-gray-800 border-b pb-2 mb-6">2. Best Time to Visit</h2>
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Short Description</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 border rounded-lg outline-none bg-gray-50 focus:ring-2 focus:ring-blue-500" 
                    placeholder="e.g. October to March is the best time..." 
                    value={bestTimeToVisit} 
                    onChange={(e) => setBestTimeToVisit(e.target.value)} 
                  />
                  <p className="text-xs text-gray-500 mt-1">Brief text explaining the ideal season.</p>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Select Recommended Months</label>
                  <div className="flex flex-wrap gap-2">
                    {allMonths.map((month) => (
                      <button
                        key={month}
                        type="button"
                        onClick={() => toggleMonth(month)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                          bestMonths.includes(month) 
                            ? 'bg-blue-600 text-white border-blue-600' 
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {month}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Pricing & Overview */}
            <div>
              <h2 className="text-xl font-bold text-gray-800 border-b pb-2 mb-6">3. Description & Pricing</h2>
              <div className="mb-8">
                <label className="block text-sm font-bold text-gray-700 mb-2">Tour Overview</label>
                <div className="bg-white rounded-lg overflow-hidden border border-gray-300">
                  <ReactQuill theme="snow" value={overview} onChange={setOverview} modules={quillModules} className="h-48" />
                </div>
                <div className="mt-12"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-blue-50/50 p-5 border border-blue-100 rounded-xl">
                  <label className="block text-base font-bold text-blue-900 mb-4">👥 Per Person Pricing</label>
                  <div className="space-y-3">
                    {[{ label: 'Min 2 Persons', key: 'min2' }, { label: 'Min 4 Persons', key: 'min4' }, { label: 'Min 6 Persons', key: 'min6' }, { label: 'Min 8+ Persons', key: 'min8' }].map((item) => (
                      <div key={item.key} className="flex justify-between items-center gap-4 bg-white p-2 rounded-lg border border-blue-100">
                        <span className="text-sm font-medium text-gray-700 w-1/2 px-2">{item.label}</span>
                        <input type="number" min="0" placeholder="₹ Rate" className="w-1/2 px-3 py-2 border rounded-md outline-none" value={personPrices[item.key as keyof typeof personPrices]} onChange={(e) => setPersonPrices({...personPrices, [item.key]: e.target.value})} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-orange-50/50 p-5 border border-orange-100 rounded-xl">
                  <label className="block text-base font-bold text-orange-900 mb-4">🚖 Cab Wise Pricing</label>
                  <div className="space-y-3">
                    {[{ label: 'Hatchback (Max 4)', key: 'hatchback' }, { label: 'Sedan (Max 4)', key: 'sedan' }, { label: 'SUV / Ertiga (Max 6)', key: 'suv' }, { label: 'Innova / Crysta (Max 6)', key: 'innova' }, { label: 'Tempo Traveller (Max 12)', key: 'tempo' }].map((item) => (
                      <div key={item.key} className="flex justify-between items-center gap-4 bg-white p-2 rounded-lg border border-orange-100">
                        <span className="text-sm font-medium text-gray-700 w-1/2 px-2">{item.label}</span>
                        <input type="number" min="0" placeholder="₹ Rate" className="w-1/2 px-3 py-2 border rounded-md outline-none" value={cabPrices[item.key as keyof typeof cabPrices]} onChange={(e) => setCabPrices({...cabPrices, [item.key]: e.target.value})} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Places to Visit */}
            <div>
              <div className="flex justify-between items-center border-b pb-2 mb-6">
                <h2 className="text-xl font-bold text-gray-800">4. Places to Visit</h2>
                <button type="button" onClick={addPlace} className="text-sm bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full hover:bg-blue-200">+ Add Place</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {placesToVisit.map((place, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input type="text" className="w-full px-4 py-2 border rounded-lg outline-none bg-gray-50" placeholder="e.g. Gateway of India" value={place} onChange={(e) => handlePlaceChange(index, e.target.value)} />
                    {placesToVisit.length > 1 && (
                      <button type="button" onClick={() => removePlace(index)} className="text-red-500 hover:text-red-700 font-bold px-2">✕</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Section 5: Dynamic Itinerary */}
            <div>
              <div className="flex justify-between items-center border-b pb-2 mb-6">
                <h2 className="text-xl font-bold text-gray-800">5. Day-wise Itinerary</h2>
                <button type="button" onClick={addItineraryDay} className="text-sm bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full hover:bg-blue-200">+ Add Day</button>
              </div>
              <div className="space-y-6">
                {itineraryDays.map((day, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-xl border border-gray-200 relative">
                    {itineraryDays.length > 1 && (
                      <button type="button" onClick={() => removeItineraryDay(index)} className="absolute top-4 right-4 text-red-500 hover:text-red-700 text-sm font-bold">✕ Remove</button>
                    )}
                    <h3 className="font-bold text-blue-800 mb-3">Day {day.day}</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Day Title</label>
                        <input type="text" required className="w-full px-4 py-2 border rounded-lg outline-none bg-white" placeholder="e.g. Arrival in Mumbai & Local Sightseeing" value={day.title} onChange={(e) => handleItineraryChange(index, 'title', e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Day Description</label>
                        <textarea rows={3} required className="w-full px-4 py-2 border rounded-lg outline-none bg-white resize-none" placeholder="Describe the activities for this day..." value={day.description} onChange={(e) => handleItineraryChange(index, 'description', e.target.value)}></textarea>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Inclusions & Exclusions */}
            <div>
              <h2 className="text-xl font-bold text-gray-800 border-b pb-2 mb-6">6. Inclusions & Exclusions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">✅ Price Includes</label>
                  <textarea rows={3} className="w-full px-4 py-2 border border-green-200 rounded-lg outline-none bg-green-50" value={inclusions} onChange={(e) => setInclusions(e.target.value)}></textarea>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">❌ Not Included</label>
                  <textarea rows={3} className="w-full px-4 py-2 border border-red-200 rounded-lg outline-none bg-red-50" value={exclusions} onChange={(e) => setExclusions(e.target.value)}></textarea>
                </div>
              </div>
            </div>

            {/* Gallery */}
            <div>
              <div className="flex justify-between items-center border-b pb-2 mb-6">
                <h2 className="text-xl font-bold text-gray-800">7. Tour Gallery</h2>
                <button type="button" onClick={addGalleryImage} className="text-sm bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full hover:bg-blue-200">+ Add Image Link</button>
              </div>
              <div className="space-y-3">
                {gallery.map((url, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <input type="url" className="flex-1 px-4 py-2 border rounded-lg outline-none bg-gray-50" placeholder="e.g. https://website.com/image.jpg" value={url} onChange={(e) => handleGalleryChange(index, e.target.value)} />
                    {gallery.length > 1 && (
                      <button type="button" onClick={() => removeGalleryImage(index)} className="text-red-500 font-bold px-2">✕</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* FAQs */}
            <div>
              <div className="flex justify-between items-center border-b pb-2 mb-6">
                <h2 className="text-xl font-bold text-gray-800">8. FAQs</h2>
                <button type="button" onClick={addFaq} className="text-sm bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full hover:bg-blue-200">+ Add FAQ</button>
              </div>
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-xl border border-gray-200 relative">
                    {faqs.length > 1 && (
                      <button type="button" onClick={() => removeFaq(index)} className="absolute top-4 right-4 text-red-500 hover:text-red-700 text-sm font-bold">✕ Remove</button>
                    )}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Question {index + 1}</label>
                        <input type="text" className="w-full px-4 py-2 border rounded-lg outline-none bg-white" value={faq.question} onChange={(e) => handleFaqChange(index, 'question', e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Answer</label>
                        <textarea rows={2} className="w-full px-4 py-2 border rounded-lg outline-none bg-white resize-none" value={faq.answer} onChange={(e) => handleFaqChange(index, 'answer', e.target.value)}></textarea>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white font-bold py-4 px-4 rounded-xl hover:bg-blue-700 transition-colors disabled:bg-blue-400 text-lg shadow-lg">
              {submitting ? 'Updating Tour...' : 'Update Tour Package'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}