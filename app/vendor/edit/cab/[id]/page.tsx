"use client"
import { useEffect, useState } from 'react'
import { supabase } from '../../../../../utils/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'



export default function EditCabListing() {
  const router = useRouter()
  const params = useParams()
  const listingId = params.id as string

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [vendorId, setVendorId] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })

  // 1. Basic Info & SEO
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('') 
  const [slugEdited, setSlugEdited] = useState(false) 

  // 2. Trip Type States
  const [mainType, setMainType] = useState('Local') 
  const [subType, setSubType] = useState('Point to Point') 

  // 3. Cab Categories & Pricing
  const [cabPrices, setCabPrices] = useState({
    'Bike': '', 'Auto': '', 'Hatchback': '', 'Sedan cab': '', 'SUV cab': '', 'Innova cab': ''
  })
  const [description, setDescription] = useState('')

  // 4. Conditional Fields
  const [serviceCity, setServiceCity] = useState('')
  const [pickupPoint, setPickupPoint] = useState('')
  const [dropPoint, setDropPoint] = useState('')
  
  const [rentalPackage, setRentalPackage] = useState('8 Hour 80km')
  const [extraKmCharge, setExtraKmCharge] = useState('')
  const [extraHourCharge, setExtraHourCharge] = useState('')

  const [pickupCity, setPickupCity] = useState('')
  const [dropCity, setDropCity] = useState('') 
  const [distance, setDistance] = useState('')
  const [nightCharge, setNightCharge] = useState('') 
  const [perKmRate, setPerKmRate] = useState('') 

  // 5. Inclusions / Exclusions
  const [tollCharges, setTollCharges] = useState('Yes')
  const [parkingCharges, setParkingCharges] = useState('Yes')
  const [driverDa, setDriverDa] = useState('Yes')

  // 6. Image Gallery
  const [gallery, setGallery] = useState([''])

  // 7. FAQs
  const [faqs, setFaqs] = useState([{ question: '', answer: '' }])

  useEffect(() => {
    fetchCabData()
  }, [])

  const handleMainTypeChange = (newType: string) => {
    setMainType(newType)
    if (newType === 'Local') setSubType('Point to Point')
    else if (newType === 'Outstation') setSubType('One Way')
  }

  async function fetchCabData() {
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
      alert("Cab listing nahi mili ya unauthorized access hai.")
      router.push('/vendor')
      return
    }

    setTitle(data.title || '')
    if (data.slug) {
      setSlug(data.slug)
      setSlugEdited(true)
    }

    const meta = data.metadata || {}
    setMainType(meta.mainType || 'Local')
    setSubType(meta.subType || 'Point to Point')
    
    if (meta.cabPrices) {
      setCabPrices(meta.cabPrices)
    } else if (meta.cabType && data.price) {
      setCabPrices(prev => ({ ...prev, [meta.cabType]: data.price.toString() }))
    }

    setDescription(meta.description || meta.overview || '')
    setServiceCity(meta.serviceCity || '')
    setPickupPoint(meta.pickupPoint || '')
    setDropPoint(meta.dropPoint || '')
    setRentalPackage(meta.rentalPackage || '8 Hour 80km')
    setExtraKmCharge(meta.extraKmCharge || '')
    setExtraHourCharge(meta.extraHourCharge || '')
    setPickupCity(meta.pickupCity || '')
    setDropCity(meta.dropCity || '')
    setDistance(meta.distance || '')
    setNightCharge(meta.nightCharge || '')
    setPerKmRate(meta.perKmRate || '')
    setTollCharges(meta.tollCharges || 'Yes')
    setParkingCharges(meta.parkingCharges || 'Yes')
    setDriverDa(meta.driverDa || 'Yes')
    
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

  const handleFaqChange = (index: number, field: 'question' | 'answer', value: string) => {
    const newFaqs = [...faqs]
    newFaqs[index][field] = value
    setFaqs(newFaqs)
  }
  const addFaq = () => setFaqs([...faqs, { question: '', answer: '' }])
  const removeFaq = (index: number) => {
    if (faqs.length > 1) {
      setFaqs(faqs.filter((_, i) => i !== index))
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage({ type: '', text: '' })

    const activeCabs = Object.entries(cabPrices).filter(([_, price]) => price.trim() !== '')
    
    if (activeCabs.length === 0) {
      setMessage({ type: 'error', text: 'Error: Kam se kam ek gaadi (Cab Category) ka amount daalna zaroori hai!' })
      setSubmitting(false)
      return
    }

    const lowestPrice = Math.min(...activeCabs.map(([_, price]) => parseFloat(price)))
    const formattedCabPricing = activeCabs.map(([cab, price]) => `• ${cab}: ₹${price}`).join('\n')

    let incl = []
    let excl = ['Tourist attraction Fees', 'State border tax']
    
    if (tollCharges === 'Yes') incl.push('Toll charges')
    else excl.push('Toll charges')

    if (parkingCharges === 'Yes') incl.push('Parking charges')
    else excl.push('Parking charges')

    if (driverDa === 'Yes') incl.push('Driver DA')
    else excl.push('Driver DA')

    if (subType !== 'One Way') {
      excl.push('Night charges (if traveling between 9PM-6AM)')
    }

    const finalInclusions = incl.join(', ')
    const finalExclusions = excl.join(', ')

    const formattedFaqs = faqs
      .filter(f => f.question.trim() !== '' && f.answer.trim() !== '')
      .map(f => `❓ Q: ${f.question}\n👉 A: ${f.answer}`)
      .join('\n\n') || 'No FAQs provided';

    let displayLocation = ''
    let tripDetails = ''

    if (subType === 'Point to Point') {
      displayLocation = serviceCity
      tripDetails = `Pickup: ${pickupPoint} | Drop: ${dropPoint}`
    } else if (subType === 'Local Rental') {
      displayLocation = serviceCity
      tripDetails = `Package: ${rentalPackage} | Extra KM: ₹${extraKmCharge} | Extra Hour: ₹${extraHourCharge}`
    } else if (subType === 'One Way') {
      displayLocation = `${pickupCity} to ${dropCity}`
      tripDetails = `Distance: ${distance} km | Night Charges (9PM-6AM): ₹${nightCharge}`
    } else if (subType === 'Round Trip') {
      displayLocation = `${pickupCity} to ${dropCity}`
      tripDetails = `Distance: ${distance} km | Per KM Rate: ₹${perKmRate}`
    }

    const detailedDescription = `
🚖 **Available Cabs & Pricing:**
${formattedCabPricing}

🗺️ **Trip Type:** ${mainType} (${subType})
📌 **Trip Details:** ${tripDetails}

📝 **Description:**
${description || 'No additional details provided.'}

✅ **Included:** ${finalInclusions}
❌ **Not Included:** ${finalExclusions}

💡 **Frequently Asked Questions:**
${formattedFaqs}
    `.trim()

    const cleanGallery = gallery.filter(link => link.trim() !== '')

    const metadata = {
      mainType, subType, cabPrices, description,
      serviceCity, pickupPoint, dropPoint, rentalPackage, extraKmCharge, extraHourCharge,
      pickupCity, dropCity, distance, nightCharge, perKmRate,
      tollCharges, parkingCharges, driverDa, gallery: cleanGallery, faqs
    }

    const { error } = await supabase
      .from('listings')
      .update({
        title: title,
        slug: slug,
        location: displayLocation,
        price: lowestPrice,
        description: detailedDescription,
        metadata: metadata
      })
      .eq('id', listingId)

    if (error) {
      if (error.code === '23505') {
        setMessage({ type: 'error', text: 'Error: Yeh SEO Slug pehle se kisi aur cab service ne use kiya hua hai. Kripya thoda alag slug banayein.' })
      } else {
        setMessage({ type: 'error', text: 'Error updating cab: ' + error.message })
      }
      setSubmitting(false)
    } else {
      setMessage({ type: 'success', text: 'Cab Service successfully update ho gayi hai!' })
      setSubmitting(false)
      setTimeout(() => {
        router.push('/vendor')
      }, 2000)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-xl">Loading Cab Details...</div>

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        
        <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-extrabold">Edit Cab Service</h1>
            <p className="text-blue-100 text-sm mt-1">Apni taxi/cab ki details update karein</p>
          </div>
          <Link href="/vendor" className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-lg font-medium text-sm transition-colors">
            ← Cancel
          </Link>
        </div>

        <div className="p-8">
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg text-sm font-bold ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-8">
            
            {/* Title & SEO Slug */}
            <div className="border border-gray-200 p-6 rounded-xl">
              <h2 className="text-lg font-bold text-gray-800 mb-4">1. Service Title & SEO</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Service Title</label>
                  <input type="text" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50" value={title} onChange={handleTitleChange} />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">SEO URL (Slug)</label>
                  <div className="flex items-center">
                    <span className="px-3 py-2 bg-gray-200 border border-gray-300 border-r-0 rounded-l-lg text-gray-500 text-sm select-none">
                      /cabs/
                    </span>
                    <input 
                      type="text" required 
                      className="w-full px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium text-blue-700" 
                      value={slug} 
                      onChange={handleSlugChange} 
                      placeholder="e.g. mumbai-to-pune-cab" 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Trip Type Selection */}
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
              <h2 className="text-lg font-bold text-blue-900 mb-4">2. Select Trip Type</h2>
              
              <div className="flex gap-4 mb-4">
                <label className="flex-1 cursor-pointer">
                  <div className={`text-center py-3 rounded-lg border-2 font-bold transition-colors ${mainType === 'Local' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-600'}`} onClick={() => handleMainTypeChange('Local')}>
                    🏙️ Local
                  </div>
                </label>
                <label className="flex-1 cursor-pointer">
                  <div className={`text-center py-3 rounded-lg border-2 font-bold transition-colors ${mainType === 'Outstation' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-600'}`} onClick={() => handleMainTypeChange('Outstation')}>
                    🛣️ Outstation
                  </div>
                </label>
              </div>

              {mainType === 'Local' && (
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2 font-medium text-blue-900">
                    <input type="radio" checked={subType === 'Point to Point'} onChange={() => setSubType('Point to Point')} /> Point to Point
                  </label>
                  <label className="flex items-center gap-2 font-medium text-blue-900 ml-4">
                    <input type="radio" checked={subType === 'Local Rental'} onChange={() => setSubType('Local Rental')} /> Local Rental
                  </label>
                </div>
              )}

              {mainType === 'Outstation' && (
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2 font-medium text-blue-900">
                    <input type="radio" checked={subType === 'One Way'} onChange={() => setSubType('One Way')} /> One Way
                  </label>
                  <label className="flex items-center gap-2 font-medium text-blue-900 ml-4">
                    <input type="radio" checked={subType === 'Round Trip'} onChange={() => setSubType('Round Trip')} /> Round Trip
                  </label>
                </div>
              )}
            </div>

            {/* Route & Details */}
            <div className="border border-gray-200 p-6 rounded-xl">
              <h2 className="text-lg font-bold text-gray-800 mb-4">3. Route & Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {subType === 'Point to Point' && (
                  <>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-gray-700 mb-1">Service City</label>
                      <input type="text" required className="w-full px-4 py-2 border rounded-lg outline-none bg-gray-50" value={serviceCity} onChange={(e) => setServiceCity(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Pickup Point</label>
                      <input type="text" required className="w-full px-4 py-2 border rounded-lg outline-none bg-gray-50" value={pickupPoint} onChange={(e) => setPickupPoint(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Drop Point</label>
                      <input type="text" required className="w-full px-4 py-2 border rounded-lg outline-none bg-gray-50" value={dropPoint} onChange={(e) => setDropPoint(e.target.value)} />
                    </div>
                  </>
                )}

                {subType === 'Local Rental' && (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Service City</label>
                      <input type="text" required className="w-full px-4 py-2 border rounded-lg outline-none bg-gray-50" value={serviceCity} onChange={(e) => setServiceCity(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Rental Package</label>
                      <select className="w-full px-4 py-2 border rounded-lg outline-none bg-gray-50" value={rentalPackage} onChange={(e) => setRentalPackage(e.target.value)}>
                        <option>4 Hour 40km</option>
                        <option>6 Hour 60km</option>
                        <option>8 Hour 80km</option>
                        <option>10 Hour 100km</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Extra KM Charge (₹)</label>
                      <input type="number" required className="w-full px-4 py-2 border rounded-lg outline-none bg-gray-50" value={extraKmCharge} onChange={(e) => setExtraKmCharge(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Extra Hour Charge (₹)</label>
                      <input type="number" required className="w-full px-4 py-2 border rounded-lg outline-none bg-gray-50" value={extraHourCharge} onChange={(e) => setExtraHourCharge(e.target.value)} />
                    </div>
                  </>
                )}

                {subType === 'One Way' && (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Pickup City</label>
                      <input type="text" required className="w-full px-4 py-2 border rounded-lg outline-none bg-gray-50" value={pickupCity} onChange={(e) => setPickupCity(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Drop City</label>
                      <input type="text" required className="w-full px-4 py-2 border rounded-lg outline-none bg-gray-50" value={dropCity} onChange={(e) => setDropCity(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Total Distance (km)</label>
                      <input type="number" required className="w-full px-4 py-2 border rounded-lg outline-none bg-gray-50" value={distance} onChange={(e) => setDistance(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Night Charge (9pm-6am) Amount ₹</label>
                      <input type="number" required className="w-full px-4 py-2 border rounded-lg outline-none bg-gray-50" value={nightCharge} onChange={(e) => setNightCharge(e.target.value)} />
                    </div>
                  </>
                )}

                {subType === 'Round Trip' && (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Pickup City</label>
                      <input type="text" required className="w-full px-4 py-2 border rounded-lg outline-none bg-gray-50" value={pickupCity} onChange={(e) => setPickupCity(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Destination City</label>
                      <input type="text" required className="w-full px-4 py-2 border rounded-lg outline-none bg-gray-50" value={dropCity} onChange={(e) => setDropCity(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Total Distance (km)</label>
                      <input type="number" required className="w-full px-4 py-2 border rounded-lg outline-none bg-gray-50" value={distance} onChange={(e) => setDistance(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Per KM Rate (₹)</label>
                      <input type="number" required className="w-full px-4 py-2 border rounded-lg outline-none bg-gray-50" value={perKmRate} onChange={(e) => setPerKmRate(e.target.value)} />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Cab Categories & Pricing */}
            <div className="bg-green-50 p-6 rounded-xl border border-green-100">
              <h2 className="text-lg font-bold text-green-900 mb-2">4. Edit Cabs & Prices</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['Bike', 'Auto', 'Hatchback', 'Sedan cab', 'SUV cab', 'Innova cab'].map((cab) => (
                  <div key={cab} className="flex items-center gap-4 bg-white p-3 rounded-lg border border-green-200">
                    <span className="font-bold text-gray-700 w-1/2">{cab}</span>
                    <input 
                      type="number" min="0"
                      className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 font-bold text-green-700"
                      placeholder="₹ Amount"
                      value={cabPrices[cab as keyof typeof cabPrices]} 
                      onChange={(e) => setCabPrices({...cabPrices, [cab]: e.target.value})}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">5. Description</label>
              <textarea rows={3} className="w-full px-4 py-2 border rounded-lg outline-none resize-none bg-gray-50" value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
            </div>

            {/* Inclusions / Exclusions */}
            <div className="border border-gray-200 p-6 rounded-xl">
              <h2 className="text-lg font-bold text-gray-800 mb-4">6. Inclusions & Exclusions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Toll Charges</label>
                  <select className="w-full px-4 py-2 border rounded-lg outline-none bg-gray-50" value={tollCharges} onChange={(e) => setTollCharges(e.target.value)}>
                    <option value="Yes">Yes (Included)</option>
                    <option value="No">No (Not Included)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Parking Charges</label>
                  <select className="w-full px-4 py-2 border rounded-lg outline-none bg-gray-50" value={parkingCharges} onChange={(e) => setParkingCharges(e.target.value)}>
                    <option value="Yes">Yes (Included)</option>
                    <option value="No">No (Not Included)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Driver DA</label>
                  <select className="w-full px-4 py-2 border rounded-lg outline-none bg-gray-50" value={driverDa} onChange={(e) => setDriverDa(e.target.value)}>
                    <option value="Yes">Yes (Included)</option>
                    <option value="No">No (Not Included)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Image Gallery */}
            <div className="border border-gray-200 p-6 rounded-xl bg-gray-50">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">7. Cab / Car Gallery (Images)</h2>
                  <p className="text-xs text-gray-500">Gaadi ki images ke links (URLs) yahan add karein.</p>
                </div>
                <button type="button" onClick={addGalleryImage} className="text-sm bg-blue-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-blue-700">+ Add Image Link</button>
              </div>
              <div className="space-y-3">
                {gallery.map((url, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <input 
                      type="url" 
                      className="flex-1 px-4 py-2 border rounded-lg outline-none bg-white" 
                      placeholder="e.g. https://website.com/cab.jpg"
                      value={url} 
                      onChange={(e) => handleGalleryChange(index, e.target.value)} 
                    />
                    {gallery.length > 1 && (
                      <button type="button" onClick={() => removeGalleryImage(index)} className="text-red-500 font-bold px-2 py-2">✕ Remove</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* FAQs */}
            <div>
              <div className="flex justify-between items-center border-b pb-2 mb-4">
                <h2 className="text-lg font-bold text-gray-800">8. Frequently Asked Questions (FAQs)</h2>
                <button type="button" onClick={addFaq} className="text-sm bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full">+ Add FAQ</button>
              </div>
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-xl border border-gray-200 relative">
                    {faqs.length > 1 && (
                      <button type="button" onClick={() => removeFaq(index)} className="absolute top-4 right-4 text-red-500 text-sm font-bold">✕ Remove</button>
                    )}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Question {index + 1}</label>
                        <input type="text" className="w-full px-4 py-2 border rounded-lg bg-white" value={faq.question} onChange={(e) => handleFaqChange(index, 'question', e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Answer</label>
                        <textarea rows={2} className="w-full px-4 py-2 border rounded-lg bg-white" value={faq.answer} onChange={(e) => handleFaqChange(index, 'answer', e.target.value)}></textarea>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white font-bold py-4 px-4 rounded-xl hover:bg-blue-700 transition-colors disabled:bg-blue-400 text-lg shadow-lg">
              {submitting ? 'Updating Cab...' : 'Update Cab Service'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}