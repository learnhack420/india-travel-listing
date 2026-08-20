"use client"
import { useEffect, useState, Suspense, useRef } from 'react'
import { supabase } from '../../../utils/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import LocationSelector from '../../components/LocationSelector' 
import SeoAnalyzer from '../../components/SeoAnalyzer' 

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false })
import 'react-quill-new/dist/quill.snow.css'

function TourFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [vendorId, setVendorId] = useState('')
  const [userRole, setUserRole] = useState('') 
  const [message, setMessage] = useState({ type: '', text: '' })

  const [vendorsList, setVendorsList] = useState<any[]>([])
  const [tourThemesOptions, setTourThemesOptions] = useState<{value: string, label: string}[]>([])

  const [currentEditId, setCurrentEditId] = useState<string | null>(editId)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [tourThemes, setTourThemes] = useState<string[]>([])

  const [thumbnail, setThumbnail] = useState('')
  const [isUploadingThumb, setIsUploadingThumb] = useState(false)

  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [metaKeywords, setMetaKeywords] = useState('')

  const [startLocation, setStartLocation] = useState('')
  const [destinations, setDestinations] = useState<string[]>([])

  const [durationDays, setDurationDays] = useState('3')
  const [durationNights, setDurationNights] = useState('2')
  const [durationHours, setDurationHours] = useState('0')
  const [pickupTimes, setPickupTimes] = useState(['08:00']) 

  const [price, setPrice] = useState('') 

  const [bestTimeToVisit, setBestTimeToVisit] = useState('')
  const [bestMonths, setBestMonths] = useState<string[]>([])

  const [overview, setOverview] = useState('') 
  const [personPrices, setPersonPrices] = useState({ min2: '', min4: '', min6: '', min8: '' })
  const [cabPrices, setCabPrices] = useState({ hatchback: '', sedan: '', suv: '', innova: '', tempo: '' })
  const [cabExtraCharges, setCabExtraCharges] = useState({ hatchback: '', sedan: '', suv: '', innova: '', tempo: '' })

  const [placesToVisit, setPlacesToVisit] = useState(['']) 
  const [itineraryDays, setItineraryDays] = useState([{ day: 1, title: '', description: '' }]) 
  const [inclusions, setInclusions] = useState('')
  const [exclusions, setExclusions] = useState('')

  const [gallery, setGallery] = useState([''])
  const [uploadingGalleryIndex, setUploadingGalleryIndex] = useState<number | null>(null)

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
    fetchDynamicCategories() 
    checkVendorAndLoadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId])

  async function fetchDynamicCategories() {
    const { data, error } = await supabase
      .from('tour_categories')
      .select('label, value')
      .order('created_at', { ascending: true })

    if (data && !error) {
      setTourThemesOptions(data)
    } else {
      setTourThemesOptions([
        { value: 'honeymoon', label: '💑 Honeymoon Packages' },
        { value: 'family', label: '👨‍👩‍👧‍👦 Family Tour Packages' },
        { value: 'general', label: '🌐 General Sightseeing' }
      ])
    }
  }

  async function checkVendorAndLoadData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }

    const { data: profile } = await supabase.from('profiles').select('role, approval_status').eq('id', session.user.id).single()

    if (!profile || (profile.role !== 'vendor' && profile.role !== 'admin')) {
      router.push('/login')
      return
    }
    if (profile.role === 'vendor' && profile.approval_status !== 'approved') {
      router.push('/login')
      return
    }

    setVendorId(session.user.id)
    setUserRole(profile.role)

    if (profile.role === 'admin') {
      const { data: vendorsData, error: vendorErr } = await supabase
        .from('profiles')
        .select('*') 
        .in('role', ['vendor', 'admin'])
        .order('created_at', { ascending: false });

      if (vendorErr) {
        setMessage({ type: 'error', text: 'Admin Warning: Vendor list load nahi hui. Shayad Profiles table par RLS active hai.' })
      } else if (vendorsData) {
        setVendorsList(vendorsData);
      }
    }

    if (editId) {
      setCurrentEditId(editId)
      const { data: listing, error } = await supabase.from('listings').select('*').eq('id', editId).single()

      if (error || !listing) {
        setMessage({ type: 'error', text: 'Listing nahi mili!' })
        setLoading(false)
        return
      }

      if (listing.vendor_id) setVendorId(listing.vendor_id)

      setTitle(listing.title || '')
      setSlug(listing.slug || '')
      setSlugEdited(true)
      setPrice(listing.price?.toString() || '')

      const meta = listing.metadata || {}

      if (meta.tourTheme) {
        setTourThemes(Array.isArray(meta.tourTheme) ? meta.tourTheme : [meta.tourTheme])
      }

      setThumbnail(meta.thumbnail || '')
      setMetaTitle(meta.seo?.metaTitle || '')
      setMetaDescription(meta.seo?.metaDescription || '')
      setMetaKeywords(meta.seo?.metaKeywords || '')

      setStartLocation(meta.startLocation || (listing.location?.split(' ➔ ')[0]) || '')
      if (meta.destinationsArray) {
        setDestinations(meta.destinationsArray)
      } else {
        const destStr = listing.location?.split(' ➔ ')[1] || ''
        setDestinations(destStr ? destStr.split(', ') : [])
      }

      if (meta.durationRaw) {
        setDurationDays(meta.durationRaw.d || '0')
        setDurationNights(meta.durationRaw.n || '0')
        setDurationHours(meta.durationRaw.h || '0')
      }

      if (meta.pickupTimes?.length > 0) setPickupTimes(meta.pickupTimes)
      setBestTimeToVisit(meta.bestTimeToVisit || '')
      if (meta.bestMonths?.length > 0) setBestMonths(meta.bestMonths)

      setOverview(meta.overview || '')
      if (meta.personPrices) setPersonPrices(meta.personPrices)
      if (meta.cabPrices) setCabPrices(meta.cabPrices)
      if (meta.cabExtraCharges) setCabExtraCharges(meta.cabExtraCharges)

      if (meta.placesToVisit?.length > 0) setPlacesToVisit(meta.placesToVisit)
      if (meta.itineraryDays?.length > 0) setItineraryDays(meta.itineraryDays)

      setInclusions(meta.inclusions || '')
      setExclusions(meta.exclusions || '')

      if (meta.gallery?.length > 0) setGallery(meta.gallery)
      if (meta.faqs?.length > 0) setFaqs(meta.faqs)
    }

    setLoading(false)
  }

  const toggleTheme = (value: string) => {
    setTourThemes(prev =>
      prev.includes(value) ? prev.filter(t => t !== value) : [...prev, value]
    )
  }

  const generatePayload = (statusAction: string) => {
    const formattedDestinations = destinations.join(', ')
    const fullLocationString = `${startLocation} ${destinations.length > 0 ? '➔ ' + formattedDestinations : ''}`.trim()

    const dStr = []
    if (parseInt(durationDays) > 0) dStr.push(`${durationDays} Day${parseInt(durationDays) > 1 ? 's' : ''}`)
    if (parseInt(durationNights) > 0) dStr.push(`${durationNights} Night${parseInt(durationNights) > 1 ? 's' : ''}`)
    if (parseInt(durationHours) > 0) dStr.push(`${durationHours} Hour${parseInt(durationHours) > 1 ? 's' : ''}`)
    const finalDuration = dStr.join(' / ') || 'Custom Duration'

    const cleanPickupTimes = pickupTimes.filter(t => t.trim() !== '')
    const formatTime12hr = (time24: string) => {
      if (!time24) return ''
      const [h, m] = time24.split(':')
      const hours = parseInt(h, 10)
      const ampm = hours >= 12 ? 'PM' : 'AM'
      return `${hours % 12 || 12}:${m} ${ampm}`
    }
    const formattedPickupTimesStr = cleanPickupTimes.map(formatTime12hr).join(', ') || 'Not fixed'

    const formattedPersonPricing = [
      personPrices.min2 ? `Min 2 Pax: ₹${personPrices.min2} / person` : '',
      personPrices.min4 ? `Min 4 Pax: ₹${personPrices.min4} / person` : '',
      personPrices.min6 ? `Min 6 Pax: ₹${personPrices.min6} / person` : '',
      personPrices.min8 ? `Min 8+ Pax: ₹${personPrices.min8} / person` : ''
    ].filter(Boolean).join('\n') || 'Not Available'

    const formattedCabPricing = [
      cabPrices.hatchback ? `Hatchback (Max 4): ₹${cabPrices.hatchback}${cabExtraCharges.hatchback ? ` | Extra: ₹${cabExtraCharges.hatchback}/hr` : ''}` : '',
      cabPrices.sedan ? `Sedan (Max 4): ₹${cabPrices.sedan}${cabExtraCharges.sedan ? ` | Extra: ₹${cabExtraCharges.sedan}/hr` : ''}` : '',
      cabPrices.suv ? `SUV / Ertiga (Max 6): ₹${cabPrices.suv}${cabExtraCharges.suv ? ` | Extra: ₹${cabExtraCharges.suv}/hr` : ''}` : '',
      cabPrices.innova ? `Innova / Crysta (Max 6): ₹${cabPrices.innova}${cabExtraCharges.innova ? ` | Extra: ₹${cabExtraCharges.innova}/hr` : ''}` : '',
      cabPrices.tempo ? `Tempo Traveller (Max 12): ₹${cabPrices.tempo}${cabExtraCharges.tempo ? ` | Extra: ₹${cabExtraCharges.tempo}/hr` : ''}` : ''
    ].filter(Boolean).join('\n') || 'Not Available'

    const formattedFaqs = faqs.filter(f => f.question.trim() !== '' && f.answer.trim() !== '').map(f => `❓ **Q: ${f.question}**\n👉 A: ${f.answer}`).join('\n\n') || 'No FAQs provided'
    const formattedItinerary = itineraryDays.filter(d => d.title.trim() !== '').map(d => `🔹 **Day ${d.day}: ${d.title}**\n${d.description}`).join('\n\n') || 'Not provided'
    const formattedPlaces = placesToVisit.filter(p => p.trim() !== '').join(', ') || 'Not provided'
    const formattedBestTime = `Description: ${bestTimeToVisit || 'Not specified'}\nRecommended Months: ${bestMonths.length > 0 ? bestMonths.join(', ') : 'All Year Round'}`.trim()

    const selectedThemeLabels = tourThemes.length > 0 
      ? tourThemes.map(val => tourThemesOptions.find(t => t.value === val)?.label || val).join(', ') 
      : 'Not Categorized'

    const detailedDescription = `
📝 Overview:
${overview}

🏷️ Tour Themes / Categories: ${selectedThemeLabels}

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

    const metadata = {
      duration: finalDuration, durationRaw: { d: durationDays, n: durationNights, h: durationHours },
      startLocation, destinationsArray: destinations, pickupTimes: cleanPickupTimes,
      tourTheme: tourThemes,
      overview, placesToVisit: placesToVisit.filter(p => p.trim() !== ''),
      itineraryDays: itineraryDays.filter(d => d.title.trim() !== ''),
      personPrices, cabPrices, cabExtraCharges,
      inclusions, exclusions, thumbnail, gallery: gallery.filter(link => link.trim() !== ''),
      faqs, bestTimeToVisit, bestMonths, seo: { metaTitle, metaDescription, metaKeywords }
    }

    return {
      title,
      slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
      location: fullLocationString,
      price: parseFloat(price) || 0,
      description: detailedDescription,
      status: statusAction,
      metadata
    }
  }

  const uploadImageToServer = async (file: File) => {
    const formData = new FormData()
    formData.append('image', file)
    const IMGBB_API_KEY = process.env.NEXT_PUBLIC_IMGBB_API_KEY || 'YOUR_IMGBB_API_KEY_HERE' 
    try {
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: 'POST', body: formData })
      const data = await response.json()
      if (data.success) return data.data.url 
      else throw new Error('Upload failed')
    } catch (error) {
      alert("Image upload fail ho gaya. Kripya image size chota rakhein ya URL direct paste karein.")
      return null
    }
  }

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setIsUploadingThumb(true); const url = await uploadImageToServer(file); if (url) setThumbnail(url); setIsUploadingThumb(false)
  }

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploadingGalleryIndex(index); const url = await uploadImageToServer(file)
    if (url) { const newGallery = [...gallery]; newGallery[index] = url; setGallery(newGallery) }
    setUploadingGalleryIndex(null)
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value; setTitle(newTitle)
    if (!slugEdited) setSlug(newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''))
  }

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); setSlugEdited(true)
  }

  const handlePickupTimeChange = (index: number, value: string) => { const newTimes = [...pickupTimes]; newTimes[index] = value; setPickupTimes(newTimes) }
  const addPickupTime = () => setPickupTimes([...pickupTimes, '09:00'])
  const removePickupTime = (index: number) => { if (pickupTimes.length > 1) setPickupTimes(pickupTimes.filter((_, i) => i !== index)) }

  const handlePlaceChange = (index: number, value: string) => { const newPlaces = [...placesToVisit]; newPlaces[index] = value; setPlacesToVisit(newPlaces) }
  const addPlace = () => setPlacesToVisit([...placesToVisit, ''])
  const removePlace = (index: number) => { if (placesToVisit.length > 1) setPlacesToVisit(placesToVisit.filter((_, i) => i !== index)) }

  const handleItineraryChange = (index: number, field: 'title' | 'description', value: string) => { const newItinerary = [...itineraryDays]; newItinerary[index][field] = value; setItineraryDays(newItinerary) }
  const addItineraryDay = () => setItineraryDays([...itineraryDays, { day: itineraryDays.length + 1, title: '', description: '' }])
  const removeItineraryDay = (index: number) => { if (itineraryDays.length > 1) { const filtered = itineraryDays.filter((_, i) => i !== index); setItineraryDays(filtered.map((item, i) => ({ ...item, day: i + 1 }))) } }

  const handleGalleryChange = (index: number, value: string) => { const newGallery = [...gallery]; newGallery[index] = value; setGallery(newGallery) }
  const addGalleryImage = () => setGallery([...gallery, ''])
  const removeGalleryImage = (index: number) => { if (gallery.length > 1) setGallery(gallery.filter((_, i) => i !== index)) }

  const handleFaqChange = (index: number, field: 'question' | 'answer', value: string) => { const newFaqs = [...faqs]; newFaqs[index][field] = value; setFaqs(newFaqs) }
  const addFaq = () => setFaqs([...faqs, { question: '', answer: '' }])
  const removeFaq = (index: number) => { if (faqs.length > 1) setFaqs(faqs.filter((_, i) => i !== index)) }

  const toggleMonth = (month: string) => { setBestMonths(bestMonths.includes(month) ? bestMonths.filter(m => m !== month) : [...bestMonths, month]) }

  const handleDeleteListing = async () => {
    if (!window.confirm("WARNING: Kya aap sach mein is tour package ko delete karna chahte hain? Yeh wapas recover nahi hoga.")) return
    setSubmitting(true)
    const { error } = await supabase.from("listings").delete().eq("id", currentEditId)
    if (error) { alert("Error deleting: " + error.message); setSubmitting(false) } 
    else { alert("Deleted successfully!"); router.push(userRole === 'admin' ? "/admin" : "/vendor") }
  }

  // 🌟 FIXED HANDLESUBMIT: Ab button ka 'action' direct read hoga
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!startLocation || destinations.length === 0) {
      setMessage({ type: 'error', text: 'Please select both Origin and at least one Destination!' })
      return
    }

    if (tourThemes.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one Tour Theme/Category!' })
      return
    }

    // Capture explicit action value from the button clicked (draft or publish)
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement;
    const actionClicked = submitter ? submitter.value : 'publish';

    setSubmitting(true)
    setMessage({ type: '', text: '' })

    let finalStatus = "draft";
    if (actionClicked === "publish") {
      finalStatus = userRole === "admin" ? "approved" : "pending";
    }

    const dbPayload = generatePayload(finalStatus)
    let error;
    let newId = currentEditId;

    if (currentEditId) {
      const res = await supabase.from('listings').update({ ...dbPayload, vendor_id: vendorId }).eq('id', currentEditId)
      error = res.error
    } else {
      const res = await supabase.from('listings').insert([{ ...dbPayload, vendor_id: vendorId, category: 'tour' }]).select('id').single()
      error = res.error
      if (res.data?.id) {
        newId = res.data.id;
        setCurrentEditId(newId);
        setLastSaved(new Date());
      }
    }

    if (error) {
      setMessage({ type: 'error', text: error.code === '23505' ? 'Error: Yeh SEO Slug pehle se kisi aur listing me used hai. Kripya slug change karein.' : 'Error: ' + error.message })
      setSubmitting(false)
    } else {
      if (!currentEditId && actionClicked === 'publish') {
        fetch('/api/send-email', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'New Tour Package Added 🗺️',
            data: { Package_Name: title, Route: dbPayload.location, Starting_Price: `₹${price}`, Vendor_ID: vendorId, Action: 'Review required' }
          })
        }).catch(err => console.error(err))
      }

      setMessage({ type: 'success', text: actionClicked === 'draft' ? '✅ Draft saved successfully!' : (currentEditId ? '✅ Tour package successfully updated!' : '✅ Tour package submitted for approval!') })
      setSubmitting(false)

      // Agar 'publish' hua hai toh dashboard par bhej do
      if (actionClicked === 'publish') {
        setTimeout(() => { router.push(userRole === 'admin' ? '/admin' : '/vendor') }, 2000)
      } else {
        // Draft save karne par wahi raho, URL me edit ID daal do
        window.history.replaceState(null, '', `?edit=${newId}`);
      }
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-xl">Loading Form...</div>

  const combinedLocationForSEO = destinations.length > 0 ? `${startLocation} to ${destinations.join(', ')}` : startLocation

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">

        <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-extrabold">{currentEditId ? 'Edit Tour Package' : 'Add New Tour Package'}</h1>
            <p className="text-blue-100 text-sm mt-1">Apne tour ki details bharein</p>
          </div>
          <Link href={userRole === 'admin' ? '/admin' : '/add-listing'} className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-lg font-medium text-sm transition-colors">
            ← Back
          </Link>
        </div>

        <div className="p-8">
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg text-sm font-bold ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-10">

            {userRole === 'admin' && (
              <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 shadow-sm">
                <label className="block text-sm font-black text-amber-900 mb-2 flex items-center gap-2">
                  <span className="text-lg">🛡️</span> Admin Control: Assign this Tour to Vendor
                </label>

                {vendorsList.length === 0 ? (
                  <p className="text-red-600 font-bold bg-white p-3 border border-red-200 rounded-lg">
                    ⚠️ Vendors fetch nahi ho paye. Kripya apna Supabase "profiles" table ka Row Level Security (RLS) check karein.
                  </p>
                ) : (
                  <>
                    <select
                      value={vendorId}
                      onChange={(e) => setVendorId(e.target.value)}
                      className="w-full px-4 py-3 border border-amber-300 rounded-lg outline-none bg-white font-bold text-amber-900 focus:ring-2 focus:ring-amber-500 cursor-pointer"
                    >
                      <option value="">-- Select Vendor --</option>
                      {vendorsList.map((v) => {
                        const displayTitle = v.business_name || v.name || v.full_name || v.email || 'Unnamed Vendor'
                        return (
                          <option key={v.id} value={v.id}>
                            {displayTitle}
                          </option>
                        )
                      })}
                    </select>
                    <p className="text-xs text-amber-700 mt-2 font-medium">As an admin, you can assign or re-assign this listing to any registered vendor.</p>
                  </>
                )}
              </div>
            )}

            <div>
              <h2 className="text-xl font-bold text-gray-800 border-b pb-2 mb-6">1. Basic Info & SEO Metadata</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Package Name</label>
                  <input type="text" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50" value={title} onChange={handleTitleChange} placeholder="e.g. Kerala Backwaters Tour" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">SEO URL (Slug)</label>
                  <div className="flex items-center">
                    <span className="px-3 py-2 bg-gray-200 border border-gray-300 border-r-0 rounded-l-lg text-gray-500 text-sm select-none">/tour/</span>
                    <input type="text" required className="w-full px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium text-blue-700" value={slug} onChange={handleSlugChange} placeholder="e.g. kerala-backwaters" />
                  </div>
                </div>
              </div>

              <div className="mb-6 p-5 bg-indigo-50 border border-indigo-100 rounded-xl">
                <label className="block text-sm font-bold text-indigo-900 mb-2">Tour Categorization (Themes)</label>
                <div className="flex flex-wrap gap-2">
                  {tourThemesOptions.map(theme => (
                    <button
                      key={theme.value}
                      type="button"
                      onClick={() => toggleTheme(theme.value)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                        tourThemes.includes(theme.value) 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                        : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                      }`}
                    >
                      {theme.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-indigo-700 mt-3 font-medium">Select one or more themes to help users filter packages (e.g., Honeymoon, Family).</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <LocationSelector label="Start From (Origin)" selected={startLocation} onChange={setStartLocation} multiple={false} placeholder="Select Origin location..."/>
                <LocationSelector label="Destinations Covered" selected={destinations} onChange={setDestinations} multiple={true} placeholder="Select one or more destinations..."/>
              </div>

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
                  <label className="block text-sm font-bold text-gray-700 mb-1">Main Thumbnail (Upload or URL)</label>
                  <div className="flex gap-2">
                    <input type="url" required className="flex-1 px-4 py-2 border rounded-lg bg-gray-50 outline-none" value={thumbnail} onChange={(e) => setThumbnail(e.target.value)} placeholder="https://.../image.jpg" />
                    <label className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-2 rounded-lg cursor-pointer flex items-center justify-center font-bold text-sm border border-blue-200 transition-colors">
                      {isUploadingThumb ? '⏳ Uploading...' : '📁 Upload'}
                      <input type="file" accept="image/*" className="hidden" onChange={handleThumbnailUpload} disabled={isUploadingThumb} />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <SeoAnalyzer 
              pageTitle={title}
              pageDescription={overview} 
              location={combinedLocationForSEO}
              categoryType="tour" 
              metaTitle={metaTitle}
              setMetaTitle={setMetaTitle}
              metaDescription={metaDescription}
              setMetaDescription={setMetaDescription}
              metaKeywords={metaKeywords}
              setMetaKeywords={setMetaKeywords}
            />

            <div>
              <h2 className="text-xl font-bold text-gray-800 border-b pb-2 mb-6">2. Best Time to Visit</h2>
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Short Description</label>
                  <input type="text" className="w-full px-4 py-2 border rounded-lg outline-none bg-gray-50 focus:ring-2 focus:ring-blue-500" placeholder="e.g. October to March is the best time..." value={bestTimeToVisit} onChange={(e) => setBestTimeToVisit(e.target.value)} />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Select Recommended Months</label>
                  <div className="flex flex-wrap gap-2">
                    {allMonths.map((month) => (
                      <button
                        key={month} type="button" onClick={() => toggleMonth(month)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${bestMonths.includes(month) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                      >
                        {month}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-800 border-b pb-2 mb-6">3. Description & Pricing</h2>
              <div className="mb-8">
                <label className="block text-sm font-bold text-gray-700 mb-2">Tour Overview</label>
                <div className="bg-white rounded-lg border border-gray-300">
                  <ReactQuill theme="snow" value={overview} onChange={setOverview} modules={quillModules} className="[&_.ql-editor]:min-h-[200px] [&_.ql-editor]:max-h-[400px]" />
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
                      <div key={item.key} className="flex flex-col lg:flex-row justify-between lg:items-center gap-2 lg:gap-4 bg-white p-3 rounded-lg border border-orange-100">
                        <span className="text-sm font-medium text-gray-700 lg:w-2/5 px-1">{item.label}</span>
                        <div className="flex gap-2 lg:w-3/5">
                          <input type="number" min="0" placeholder="₹ Rate" className="w-1/2 px-3 py-2 border rounded-md outline-none text-sm" value={cabPrices[item.key as keyof typeof cabPrices]} onChange={(e) => setCabPrices({...cabPrices, [item.key]: e.target.value})} />
                          <input type="number" min="0" placeholder="₹ Extra/hr" className="w-1/2 px-3 py-2 border rounded-md outline-none text-sm" value={cabExtraCharges[item.key as keyof typeof cabExtraCharges]} onChange={(e) => setCabExtraCharges({...cabExtraCharges, [item.key]: e.target.value})} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

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
                        <label className="block text-xs font-bold text-gray-600 mb-2">Day Description</label>
                        <div className="bg-white rounded-lg border border-gray-300">
                          <ReactQuill theme="snow" value={day.description} onChange={(value) => handleItineraryChange(index, 'description', value)} modules={quillModules} className="[&_.ql-editor]:min-h-[150px] [&_.ql-editor]:max-h-[300px]" />
                        </div>
                        <div className="mt-12"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

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

            <div>
              <div className="flex justify-between items-center border-b pb-2 mb-6">
                <h2 className="text-xl font-bold text-gray-800">7. Tour Gallery</h2>
                <button type="button" onClick={addGalleryImage} className="text-sm bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full hover:bg-blue-200">+ Add New Line</button>
              </div>
              <div className="space-y-3">
                {gallery.map((url, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input type="url" className="flex-1 px-4 py-2 border rounded-lg outline-none bg-gray-50" placeholder="e.g. https://website.com/image.jpg" value={url} onChange={(e) => handleGalleryChange(index, e.target.value)} />

                    <label className={`px-3 py-2 rounded-lg cursor-pointer flex items-center justify-center font-bold text-sm transition-colors border ${uploadingGalleryIndex === index ? 'bg-gray-200 text-gray-500 border-gray-300' : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'}`}>
                      {uploadingGalleryIndex === index ? '⏳...' : '📁'}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleGalleryUpload(e, index)} disabled={uploadingGalleryIndex === index} />
                    </label>

                    {gallery.length > 1 && (
                      <button type="button" onClick={() => removeGalleryImage(index)} className="text-red-500 hover:text-red-700 font-bold px-3 py-2 bg-red-50 hover:bg-red-100 rounded-lg border border-red-100 transition-colors">✕</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="border-b pb-2 mb-6">
                <h2 className="text-xl font-bold text-gray-800">8. FAQs</h2>
              </div>
              <div className="space-y-4 mb-4">
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
              <button type="button" onClick={addFaq} className="mt-2 text-sm bg-blue-100 text-blue-700 font-bold px-4 py-2 rounded-full hover:bg-blue-200">+ Add FAQ</button>
            </div>

            <div className="pt-6 border-t mt-8">

              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-medium text-gray-500">
                  {lastSaved ? `✅ Checked: Ready to publish.` : 'Data is safe in your browser until submitted.'}
                </span>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                {currentEditId && (
                  <button 
                    type="button" 
                    onClick={handleDeleteListing}
                    disabled={submitting || isUploadingThumb || uploadingGalleryIndex !== null}
                    className="w-full md:w-1/4 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-4 rounded-2xl font-black text-lg transition-transform hover:scale-[1.01]"
                  >
                    🗑️ Delete
                  </button>
                )}

                <button 
                  type="submit" 
                  name="action"
                  value="draft"
                  disabled={submitting || isUploadingThumb || uploadingGalleryIndex !== null} 
                  className="w-full md:w-auto flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-4 rounded-2xl font-black text-lg shadow-sm transition-transform hover:scale-[1.01]"
                >
                  💾 Save as Draft
                </button>

                <button 
                  type="submit" 
                  name="action"
                  value="publish"
                  disabled={submitting || isUploadingThumb || uploadingGalleryIndex !== null} 
                  className="w-full md:w-auto flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black text-lg shadow-lg transition-transform hover:scale-[1.01] disabled:bg-blue-400"
                >
                  {submitting ? "Processing..." : (userRole === "admin" ? "🚀 Publish Now" : "🚀 Submit for Approval")}
                </button>
              </div>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}

export default function AddTourListing() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-xl">Loading Form...</div>}>
      <TourFormContent />
    </Suspense>
  )
}