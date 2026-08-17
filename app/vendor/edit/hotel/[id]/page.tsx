"use client"
import { useEffect, useState } from 'react'
import { supabase } from '../../../../../utils/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'



const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false })
import 'react-quill-new/dist/quill.snow.css'

export default function EditHotelListing() {
  const router = useRouter()
  const params = useParams()
  const listingId = params.id as string

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [vendorId, setVendorId] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })

  // 1. Basic Details & SEO
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('') 
  const [slugEdited, setSlugEdited] = useState(false) 
  const [location, setLocation] = useState('') 
  const [starRating, setStarRating] = useState('3 Star')
  
  // 2. Room Types, Pricing & Inventory
  const [roomPrices, setRoomPrices] = useState({
    'Standard Room': '', 'Deluxe Room': '', 'Super Deluxe Room': '', 'Suite': '', 'Family Room': ''
  })
  const [roomCounts, setRoomCounts] = useState({
    'Standard Room': '', 'Deluxe Room': '', 'Super Deluxe Room': '', 'Suite': '', 'Family Room': ''
  })

  // 3. Amenities (Yes/No)
  const [wifi, setWifi] = useState('Yes')
  const [ac, setAc] = useState('Yes')
  const [breakfast, setBreakfast] = useState('No')
  const [pool, setPool] = useState('No')
  const [parking, setParking] = useState('Yes')

  // 4. Hotel Policies
  const [checkIn, setCheckIn] = useState('12:00 PM')
  const [checkOut, setCheckOut] = useState('11:00 AM')
  const [description, setDescription] = useState('')
  
  // 5. Image Gallery (Links)
  const [gallery, setGallery] = useState([''])

  // 6. FAQs
  const [faqs, setFaqs] = useState([{ question: '', answer: '' }])

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['clean']
    ]
  }

  useEffect(() => {
    fetchHotelData()
  }, [])

  async function fetchHotelData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }
    setVendorId(session.user.id)

    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('id', listingId)
      .single()

    if (error || !data || data.vendor_id !== session.user.id) {
      alert("Hotel listing nahi mili ya unauthorized access hai.")
      router.push('/vendor')
      return
    }

    // Load Basic Details
    setTitle(data.title || '')
    setLocation(data.location || '')

    // Load Slug
    if (data.slug) {
      setSlug(data.slug)
      setSlugEdited(true) // Prevent auto-update if slug already exists
    }

    // Load Metadata
    const meta = data.metadata || {}
    setStarRating(meta.starRating || '3 Star')
    if (meta.roomPrices) setRoomPrices(meta.roomPrices)
    if (meta.roomCounts) setRoomCounts(meta.roomCounts) 
    setWifi(meta.wifi || 'Yes')
    setAc(meta.ac || 'Yes')
    setBreakfast(meta.breakfast || 'No')
    setPool(meta.pool || 'No')
    setParking(meta.parking || 'Yes')
    setCheckIn(meta.checkIn || '12:00 PM')
    setCheckOut(meta.checkOut || '11:00 AM')
    setDescription(meta.description || meta.overview || '')
    
    if (meta.gallery && meta.gallery.length > 0) setGallery(meta.gallery)
    if (meta.faqs && meta.faqs.length > 0) setFaqs(meta.faqs)

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

  // Gallery Handlers
  const handleGalleryChange = (index: number, value: string) => {
    const newGallery = [...gallery]; newGallery[index] = value; setGallery(newGallery)
  }
  const addGalleryImage = () => setGallery([...gallery, ''])
  const removeGalleryImage = (index: number) => { if (gallery.length > 1) setGallery(gallery.filter((_, i) => i !== index)) }

  // FAQ Handlers
  const handleFaqChange = (index: number, field: 'question' | 'answer', value: string) => {
    const newFaqs = [...faqs]; newFaqs[index][field] = value; setFaqs(newFaqs)
  }
  const addFaq = () => setFaqs([...faqs, { question: '', answer: '' }])
  const removeFaq = (index: number) => { if (faqs.length > 1) setFaqs(faqs.filter((_, i) => i !== index)) }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage({ type: '', text: '' })

    // Price & Count Logic
    const activeRooms = Object.entries(roomPrices).filter(([_, price]) => price.trim() !== '')
    if (activeRooms.length === 0) {
      setMessage({ type: 'error', text: 'Error: Kam se kam ek Room Type ka amount daalna zaroori hai!' })
      setSubmitting(false)
      return
    }
    const lowestPrice = Math.min(...activeRooms.map(([_, price]) => parseFloat(price)))
    
    const formattedRoomPricing = activeRooms.map(([room, price]) => {
      const count = roomCounts[room as keyof typeof roomCounts]
      return `• ${room}: ₹${price} / night (Available Rooms: ${count || 'Not Specified'})`
    }).join('\n')

    // Amenities formatting
    let availableAmenities = []
    if (wifi === 'Yes') availableAmenities.push('Free WiFi')
    if (ac === 'Yes') availableAmenities.push('Air Conditioning')
    if (breakfast === 'Yes') availableAmenities.push('Complimentary Breakfast')
    if (pool === 'Yes') availableAmenities.push('Swimming Pool')
    if (parking === 'Yes') availableAmenities.push('Free Parking')

    const cleanGallery = gallery.filter(link => link.trim() !== '')
    const formattedFaqs = faqs.filter(f => f.question.trim() !== '' && f.answer.trim() !== '').map(f => `❓ Q: ${f.question}\n👉 A: ${f.answer}`).join('\n\n') || 'No FAQs provided';

    const detailedDescription = `
🏨 **Hotel Category:** ${starRating} Hotel
⏱️ **Timings:** Check-in: ${checkIn} | Check-out: ${checkOut}

🛏️ **Available Rooms & Pricing:**
${formattedRoomPricing}

✨ **Top Amenities:**
${availableAmenities.join(', ') || 'Standard amenities apply.'}

📝 **About Hotel:**
${description}

💡 **Hotel Policies & FAQs:**
${formattedFaqs}
    `.trim()

    const metadata = {
      starRating, roomPrices, roomCounts, wifi, ac, breakfast, pool, parking, checkIn, checkOut, description, gallery: cleanGallery, faqs
    }

    const { error } = await supabase
      .from('listings')
      .update({
        title: title,
        slug: slug, // Saving updated slug to database
        description: detailedDescription,
        location: location,
        price: lowestPrice,
        metadata: metadata
      })
      .eq('id', listingId)

    if (error) {
      if (error.code === '23505') {
        setMessage({ type: 'error', text: 'Error: Yeh SEO Slug pehle se kisi aur hotel ne use kiya hua hai. Kripya thoda alag slug banayein.' })
      } else {
        setMessage({ type: 'error', text: 'Error: ' + error.message })
      }
      setSubmitting(false)
    } else {
      setMessage({ type: 'success', text: 'Hotel successfully update ho gaya hai!' })
      setSubmitting(false)
      setTimeout(() => { router.push('/vendor') }, 2000)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-xl">Loading Hotel Details...</div>

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        
        <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-extrabold">Edit Hotel Property</h1>
            <p className="text-blue-100 text-sm mt-1">Apne hotel ki details update karein</p>
          </div>
          <Link href="/vendor" className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-lg font-medium text-sm transition-colors">← Cancel</Link>
        </div>

        <div className="p-8">
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg text-sm font-bold ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-8">
            {/* 1. Basic Info & SEO */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">1. Hotel Information & SEO</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Hotel Name</label>
                  <input type="text" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50" value={title} onChange={handleTitleChange} />
                </div>
                
                {/* SLUG FIELD UI */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">SEO URL (Slug)</label>
                  <div className="flex items-center">
                    <span className="px-3 py-2 bg-gray-200 border border-gray-300 border-r-0 rounded-l-lg text-gray-500 text-sm select-none">
                      /hotel/
                    </span>
                    <input 
                      type="text" required 
                      className="w-full px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium text-blue-700" 
                      value={slug} 
                      onChange={handleSlugChange} 
                      placeholder="e.g. taj-palace-mumbai" 
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Google search ke liye clean URL. (Sirf dashes aur letters use karein)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Star Rating</label>
                  <select className="w-full px-4 py-2 border rounded-lg outline-none bg-gray-50" value={starRating} onChange={(e) => setStarRating(e.target.value)}>
                    <option>Homestay / Guest House</option>
                    <option>2 Star</option>
                    <option>3 Star</option>
                    <option>4 Star</option>
                    <option>5 Star</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">City / Full Address</label>
                  <input type="text" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50" value={location} onChange={(e) => setLocation(e.target.value)} />
                </div>
              </div>
            </div>

            {/* 2. Room Types, Prices & Inventory */}
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
              <h2 className="text-lg font-bold text-blue-900 mb-2">2. Room Types, Pricing & Inventory</h2>
              <p className="text-sm text-blue-700 mb-5">Jo rooms aap offer karte hain, unka Price aur Total Available Rooms daalein.</p>
              
              <div className="grid grid-cols-1 gap-4">
                {Object.keys(roomPrices).map((room) => (
                  <div key={room} className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-lg border border-blue-200">
                    <span className="font-bold text-gray-700 md:w-1/3">{room}</span>
                    <input 
                      type="number" min="0" className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-700" placeholder="₹ Price / night"
                      value={roomPrices[room as keyof typeof roomPrices]} 
                      onChange={(e) => setRoomPrices({...roomPrices, [room]: e.target.value})}
                    />
                    <input 
                      type="number" min="0" className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-700" placeholder="Total Available Rooms"
                      value={roomCounts[room as keyof typeof roomCounts]} 
                      onChange={(e) => setRoomCounts({...roomCounts, [room]: e.target.value})}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Amenities & Timings */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">3. Amenities & Timings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">Free WiFi</label><select className="w-full px-3 py-2 border rounded-md" value={wifi} onChange={(e) => setWifi(e.target.value)}><option>Yes</option><option>No</option></select></div>
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">AC Rooms</label><select className="w-full px-3 py-2 border rounded-md" value={ac} onChange={(e) => setAc(e.target.value)}><option>Yes</option><option>No</option></select></div>
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">Breakfast Included</label><select className="w-full px-3 py-2 border rounded-md" value={breakfast} onChange={(e) => setBreakfast(e.target.value)}><option>Yes</option><option>No</option></select></div>
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">Swimming Pool</label><select className="w-full px-3 py-2 border rounded-md" value={pool} onChange={(e) => setPool(e.target.value)}><option>Yes</option><option>No</option></select></div>
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">Free Parking</label><select className="w-full px-3 py-2 border rounded-md" value={parking} onChange={(e) => setParking(e.target.value)}><option>Yes</option><option>No</option></select></div>
                </div>
                
                <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Check-in Time</label>
                    <input type="time" className="w-full px-4 py-2 border rounded-lg outline-none bg-white" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Check-out Time</label>
                    <input type="time" className="w-full px-4 py-2 border rounded-lg outline-none bg-white" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Image Gallery */}
            <div className="border border-gray-200 p-6 rounded-xl bg-gray-50">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">4. Hotel Gallery (Images)</h2>
                  <p className="text-xs text-gray-500">Apne hotel ki images ke links (URLs) yahan add karein.</p>
                </div>
                <button type="button" onClick={addGalleryImage} className="text-sm bg-blue-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm">+ Add Image Link</button>
              </div>
              <div className="space-y-3">
                {gallery.map((url, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <input 
                      type="url" 
                      className="flex-1 px-4 py-2 border rounded-lg outline-none bg-white focus:ring-2 focus:ring-blue-500" 
                      placeholder="e.g. https://website.com/image1.jpg"
                      value={url} 
                      onChange={(e) => handleGalleryChange(index, e.target.value)} 
                    />
                    {gallery.length > 1 && (
                      <button type="button" onClick={() => removeGalleryImage(index)} className="text-red-500 hover:text-red-700 font-bold px-2 py-2">✕ Remove</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Description */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">5. Hotel Overview / Description</label>
              <div className="bg-white rounded-lg overflow-hidden border border-gray-300">
                <ReactQuill theme="snow" value={description} onChange={setDescription} modules={quillModules} className="h-40" />
              </div>
              <div className="mt-12"></div>
            </div>

            {/* 6. FAQs */}
            <div>
              <div className="flex justify-between items-center border-b pb-2 mb-4">
                <h2 className="text-lg font-bold text-gray-800">6. Hotel Policies & FAQs</h2>
                <button type="button" onClick={addFaq} className="text-sm bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full hover:bg-blue-200">+ Add Rule/FAQ</button>
              </div>
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-xl border border-gray-200 relative">
                    {faqs.length > 1 && (<button type="button" onClick={() => removeFaq(index)} className="absolute top-4 right-4 text-red-500 text-sm font-bold">✕</button>)}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Policy / Question {index + 1}</label>
                        <input type="text" className="w-full px-4 py-2 border rounded-lg bg-white" value={faq.question} onChange={(e) => handleFaqChange(index, 'question', e.target.value)} placeholder="e.g. Unmarried couples allowed?" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Details / Answer</label>
                        <textarea rows={2} className="w-full px-4 py-2 border rounded-lg bg-white" value={faq.answer} onChange={(e) => handleFaqChange(index, 'answer', e.target.value)}></textarea>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white font-bold py-4 px-4 rounded-xl hover:bg-blue-700 transition-colors disabled:bg-blue-400 text-lg shadow-lg">
              {submitting ? 'Updating Hotel...' : 'Update Hotel'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}