"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { supabase } from "@/utils/supabase"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"
import LocationSelector from "../../components/LocationSelector" 
import SeoAnalyzer from "../../components/SeoAnalyzer"

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false })
import "react-quill-new/dist/quill.snow.css"

function PlaceFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get("edit")

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })
  const [vendorId, setVendorId] = useState("")
  const [userRole, setUserRole] = useState("")
  
  // 🌟 NEW: Track button action (draft or publish)
  const [submitAction, setSubmitAction] = useState("publish")

  const [location, setLocation] = useState("")

  const [formData, setFormData] = useState({
    placeName: "",
    slug: "",
    metaTitle: "", 
    metaDescription: "",
    metaKeywords: "", 
    category: "Historical",
    description: "",
    image: "",
    entryFee: "Free",
    timing: "24 Hours",
    bestTime: "",
    nearestPlaces: "",
    howToReach: "",
    whyVisit: "",
    history: "",
    rituals: "",
    faqItems: [{ question: "", answer: "" }]
  })

  const [slugEdited, setSlugEdited] = useState(false)

  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [isManagingCategories, setIsManagingCategories] = useState(false)
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategory, setNewCategory] = useState("")
  const [editingCatIndex, setEditingCatIndex] = useState<number | null>(null)
  const [editingCatName, setEditingCatName] = useState("")

  const [topAttractions, setTopAttractions] = useState([""])
  const [gallery, setGallery] = useState([""])
  const [uploadingGalleryIndex, setUploadingGalleryIndex] = useState<number | null>(null)

  useEffect(() => {
    checkAccessAndLoadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId])

  async function checkAccessAndLoadData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push("/login")
      return
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, approval_status")
      .eq("id", session.user.id)
      .single()

    if (!profile || (profile.role !== "vendor" && profile.role !== "admin")) {
      router.push("/login")
      return
    }

    if (profile.role === "vendor" && profile.approval_status !== "approved") {
      router.push("/login")
      return
    }

    setVendorId(session.user.id)
    setUserRole(profile.role)

    const savedCats = typeof window !== "undefined" ? localStorage.getItem("adminPlaceCategories") : null
    if (savedCats) {
      try {
        setAvailableCategories(JSON.parse(savedCats))
      } catch (e) {
        setAvailableCategories(["Historical", "Pilgrimage", "Nature", "Beach", "Hill Station"])
      }
    } else {
      setAvailableCategories(["Historical", "Pilgrimage", "Nature", "Beach", "Hill Station"])
    }

    if (editId) {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", editId)
        .single()

      if (error || !data) {
        setMessage({ type: "error", text: "Place not found or failed to load data." })
        setLoading(false)
        return
      }

      setLocation(data.location || "")

      const meta = data.metadata || {}

      setFormData({
        placeName: data.title || "",
        slug: data.slug || "",
        metaTitle: meta.metaTitle || data.title || "",
        metaDescription: meta.shortDescription || "",
        metaKeywords: meta.metaKeywords || "",
        category: data.category || "Historical",
        description: data.description || "",
        image: meta.image || data.image || "", 
        entryFee: meta.entryFee || "Free",
        timing: meta.timing || "24 Hours",
        bestTime: meta.bestTimeToVisit || "",
        nearestPlaces: meta.nearestPlaces || "",
        howToReach: meta.howToReach || "",
        whyVisit: meta.whyVisit || "",
        history: meta.history || "",
        rituals: meta.rituals || "",
        faqItems: meta.faqItems && meta.faqItems.length > 0 ? meta.faqItems : [{ question: "", answer: "" }]
      })

      if (meta.topAttractions && meta.topAttractions.length > 0) {
        setTopAttractions(meta.topAttractions)
      }

      if (meta.gallery && meta.gallery.length > 0) {
        setGallery(meta.gallery)
      }
      setSlugEdited(true)
    }

    setLoading(false)
  }

  const uploadImageToServer = async (file: File) => {
    const formData = new FormData()
    formData.append('image', file)
    
    const IMGBB_API_KEY = process.env.NEXT_PUBLIC_IMGBB_API_KEY || 'YOUR_IMGBB_API_KEY_HERE' 
    
    try {
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      if (data.success) {
        return data.data.url 
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      console.error("Image upload error:", error)
      alert("Image upload fail ho gaya. Kripya image size chota rakhein ya URL direct paste karein.")
      return null
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setMessage({ type: "", text: "" })

    const url = await uploadImageToServer(file)
    if (url) {
      setFormData(prev => ({ ...prev, image: url }))
    }
    setIsUploading(false)
  }

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setUploadingGalleryIndex(index)
    const url = await uploadImageToServer(file)
    if (url) {
      const newGallery = [...gallery]
      newGallery[index] = url
      setGallery(newGallery)
    }
    setUploadingGalleryIndex(null)
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setFormData(prev => ({
      ...prev,
      placeName: name,
      metaTitle: prev.metaTitle ? prev.metaTitle : name,
      slug: slugEdited ? prev.slug : generateSlug(name)
    }))
  }

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))
    setSlugEdited(true)
  }

  const handleAddNewCategory = () => {
    if (newCategory.trim() !== "") {
      const formattedCategory = newCategory.trim()
      const updatedCategories = Array.from(new Set([...availableCategories, formattedCategory]))
      setAvailableCategories(updatedCategories)
      localStorage.setItem("adminPlaceCategories", JSON.stringify(updatedCategories))
      setFormData(prev => ({ ...prev, category: formattedCategory }))
      setNewCategory("")
      setIsAddingCategory(false)
    }
  }

  const handleDeleteCategory = (catToDelete: string) => {
    if (window.confirm(`Are you sure you want to delete "${catToDelete}"?`)) {
      const updatedCategories = availableCategories.filter(c => c !== catToDelete)
      setAvailableCategories(updatedCategories)
      localStorage.setItem("adminPlaceCategories", JSON.stringify(updatedCategories))
      if (formData.category === catToDelete) {
        setFormData(prev => ({ ...prev, category: updatedCategories[0] || "" }))
      }
    }
  }

  const startEditingCategory = (index: number, cat: string) => {
    setEditingCatIndex(index)
    setEditingCatName(cat)
  }

  const saveEditedCategory = (index: number, oldCat: string) => {
    const trimmedName = editingCatName.trim()
    if (trimmedName && trimmedName !== oldCat) {
      const updatedCategories = [...availableCategories]
      updatedCategories[index] = trimmedName
      setAvailableCategories(updatedCategories)
      localStorage.setItem("adminPlaceCategories", JSON.stringify(updatedCategories))
      if (formData.category === oldCat) {
        setFormData(prev => ({ ...prev, category: trimmedName }))
      }
    }
    setEditingCatIndex(null)
    setEditingCatName("")
  }

  const handleDescriptionChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, description: value }))
  }, [])

  const handleArrayChange = (index: number, value: string, type: string) => {
    if (type === "gallery") {
      const newArr = [...gallery]
      newArr[index] = value
      setGallery(newArr)
    } else {
      const newArr = [...topAttractions]
      newArr[index] = value
      setTopAttractions(newArr)
    }
  }

  const handleRemoveArrayItem = (index: number, type: string) => {
    if (type === "gallery" && gallery.length > 1) {
      setGallery(gallery.filter((_, i) => i !== index))
    } else if (type === "attraction" && topAttractions.length > 1) {
      setTopAttractions(topAttractions.filter((_, i) => i !== index))
    }
  }

  const handleFaqChange = (index: number, field: string, value: string) => {
    const newFaqs = [...formData.faqItems]
    ;(newFaqs[index] as any)[field] = value
    setFormData(prev => ({ ...prev, faqItems: newFaqs }))
  }

  const addFaq = () => setFormData(prev => ({ ...prev, faqItems: [...prev.faqItems, { question: "", answer: "" }] }))

  const removeFaq = (index: number) => {
    const newFaqs = [...formData.faqItems]
    newFaqs.splice(index, 1)
    setFormData(prev => ({ ...prev, faqItems: newFaqs }))
  }

  // 🌟 NEW: Handles permanent deletion of the draft/listing
  const handleDeleteListing = async () => {
    if (!window.confirm("WARNING: Kya aap sach mein is listing ko delete karna chahte hain? Yeh wapas recover nahi hogi.")) return

    setSubmitting(true)
    const { error } = await supabase.from("listings").delete().eq("id", editId)
    
    if (error) {
      alert("Error deleting listing: " + error.message)
      setSubmitting(false)
    } else {
      alert("Listing deleted successfully!")
      router.push(userRole === 'admin' ? "/admin" : "/vendor")
    }
  }

  const handleUpdateOrInsert = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isUploading) return alert("Please wait for the image to upload...")
    if (!formData.image) return alert("Please provide a Featured Image!")
    if (!formData.slug) return alert("URL Slug is required!")
    if (!location) return alert("Please select a location!")

    setSubmitting(true)
    setMessage({ type: "", text: "" })

    const cleanGallery = gallery.filter(link => link.trim() !== "")
    const cleanAttractions = topAttractions.filter(item => item.trim() !== "")
    const cleanFaqs = formData.faqItems.filter(f => f.question.trim() !== "" && f.answer.trim() !== "")

    const metadata = {
      metaTitle: formData.metaTitle,
      shortDescription: formData.metaDescription,
      metaKeywords: formData.metaKeywords,
      bestTimeToVisit: formData.bestTime,
      howToReach: formData.howToReach,
      topAttractions: cleanAttractions,
      gallery: cleanGallery,
      entryFee: formData.entryFee,
      timing: formData.timing,
      nearestPlaces: formData.nearestPlaces,
      whyVisit: formData.whyVisit,
      history: formData.history,
      rituals: formData.rituals,
      image: formData.image,
      faqItems: cleanFaqs
    }

    // 🌟 NEW: Determine Final Status based on which button was clicked
    let finalStatus = "draft";
    if (submitAction === "publish") {
      finalStatus = userRole === "admin" ? "approved" : "pending";
    }

    const dbPayload = {
      title: formData.placeName,
      slug: formData.slug,
      description: formData.description,
      category: "destination", 
      location: location,
      price: 0,
      status: finalStatus, // Applied Draft or Publish status here
      metadata: metadata 
    }

    let error;

    if (editId) {
      const res = await supabase
        .from("listings")
        .update(dbPayload)
        .eq("id", editId)
      error = res.error
    } else {
      const res = await supabase
        .from("listings")
        .insert([{
          ...dbPayload,
          vendor_id: vendorId
        }])
      error = res.error
    }

    if (error) {
      if (error.code === '23505') {
        setMessage({ type: "error", text: "Error: URL Slug pehle se kisi aur jagah use ho raha hai." })
      } else {
        setMessage({ type: "error", text: "Error: " + error.message })
      }
      setSubmitting(false)
    } else {
      // Only send email if a new item is submitted for approval (not saved as draft)
      if (!editId && submitAction === "publish") {
        fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'New Tourist Place Added 🏔️',
            data: {
              Place_Name: formData.placeName,
              Category: formData.category,
              Location: location,
              Vendor_ID: vendorId,
              Action: 'Please review and approve from Admin Panel'
            }
          })
        }).catch(err => console.error("Email error:", err))
      }

      setMessage({ type: "success", text: submitAction === "draft" ? "✅ Draft saved successfully!" : "✅ Attraction submitted successfully!" })
      setSubmitting(false)
      setTimeout(() => { router.push(userRole === 'admin' ? "/admin" : "/vendor") }, 2000)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-xl">Loading place details...</div>

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50 font-sans">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        
        <div className="bg-amber-600 p-6 text-white flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-black">{editId ? '✏️ Edit Tourist Attraction' : '🌟 Add New Attraction'}</h1>
            <p className="text-amber-100 text-sm mt-1">Manage destination details, descriptions & SEO metadata</p>
          </div>
          <Link href={userRole === 'admin' ? "/admin" : "/add-listing"} className="bg-amber-700 hover:bg-amber-800 px-4 py-2 rounded-lg font-medium text-sm transition-colors">
            &larr; Back
          </Link>
        </div>

        <div className="p-6 md:p-8">
          {message.text && (
            <div className={`mb-6 p-4 rounded-xl text-sm font-bold ${message.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleUpdateOrInsert} className="space-y-8">
            
            <div className="border border-gray-200 p-6 rounded-xl space-y-6">
              <h2 className="text-lg font-bold text-gray-800 border-b pb-2">1. Place Name & URL Structure</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Place Name*</label>
                  <input type="text" required className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-amber-500 font-semibold" value={formData.placeName} onChange={handleNameChange} placeholder="e.g. Gateway of India" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-blue-600 mb-1">URL Slug (/place/[slug])*</label>
                  <div className="flex items-center">
                    <span className="px-3 py-3 bg-blue-50 border border-blue-200 border-r-0 rounded-l-xl text-blue-500 text-xs font-mono">/place/</span>
                    <input type="text" required className="w-full px-4 py-3 border border-blue-200 bg-blue-50 rounded-r-xl outline-none text-blue-700 font-mono text-sm" value={formData.slug} onChange={handleSlugChange} placeholder="gateway-of-india" />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <LocationSelector 
                    label="Location (City / Area)*" 
                    selected={location} 
                    onChange={setLocation} 
                    multiple={false}
                    placeholder="Select or Add Location..."
                  />
                </div>
              </div>
            </div>

            <SeoAnalyzer 
              pageTitle={formData.placeName}
              pageDescription={formData.description || formData.metaDescription}
              location={location}
              categoryType="tour" 
              metaTitle={formData.metaTitle}
              setMetaTitle={(val) => setFormData(prev => ({ ...prev, metaTitle: val }))}
              metaDescription={formData.metaDescription}
              setMetaDescription={(val) => setFormData(prev => ({ ...prev, metaDescription: val }))}
              metaKeywords={formData.metaKeywords}
              setMetaKeywords={(val) => setFormData(prev => ({ ...prev, metaKeywords: val }))}
            />

            <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1 text-indigo-900">SEO Meta Title</label>
                <input 
                  type="text" 
                  placeholder="Meta Title for Google search..." 
                  className="w-full p-3.5 border border-indigo-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm font-semibold" 
                  value={formData.metaTitle} 
                  onChange={(e) => setFormData({...formData, metaTitle: e.target.value})} 
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1 text-indigo-900">Meta Description (SEO)*</label>
                <textarea 
                  rows={2} 
                  placeholder="Write a catchy 150-160 character summary for Google search results..." 
                  className="w-full p-3.5 border border-indigo-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm" 
                  value={formData.metaDescription} 
                  onChange={(e) => setFormData({...formData, metaDescription: e.target.value})} 
                />
                <p className="text-xs text-indigo-600 mt-2 font-medium">Appears in Google search snippets. Keep it concise & engaging.</p>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1 text-indigo-900">SEO Meta Keywords</label>
                <input 
                  type="text" 
                  placeholder="keyword 1, keyword 2, keyword 3..." 
                  className="w-full p-3.5 border border-indigo-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm" 
                  value={formData.metaKeywords} 
                  onChange={(e) => setFormData({...formData, metaKeywords: e.target.value})} 
                />
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-bold text-slate-800">Select Place Category*</label>
                <button type="button" onClick={() => setIsManagingCategories(!isManagingCategories)} className={`text-xs font-bold px-3 py-1.5 rounded-full ${isManagingCategories ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>
                  {isManagingCategories ? "Done Managing" : "⚙️ Manage Categories"}
                </button>
              </div>
              
              <div className="flex flex-wrap gap-3 items-center">
                {availableCategories.map((cat, index) => {
                  if (isManagingCategories) {
                    if (editingCatIndex === index) {
                      return (
                        <div key={index} className="flex items-center gap-2 bg-amber-50 p-1.5 rounded-full border border-amber-200">
                          <input type="text" className="px-3 py-1 rounded-full text-sm outline-none w-32 border" value={editingCatName} onChange={(e) => setEditingCatName(e.target.value)} autoFocus />
                          <button type="button" onClick={() => saveEditedCategory(index, cat)} className="bg-amber-600 text-white px-3 py-1 rounded-full text-xs font-bold">Save</button>
                          <button type="button" onClick={() => setEditingCatIndex(null)} className="text-gray-500 px-2 font-bold">✕</button>
                        </div>
                      )
                    }
                    return (
                      <div key={index} className="flex items-center gap-1 bg-white px-3.5 py-1.5 rounded-full border border-slate-300 shadow-sm">
                        <span className="text-sm font-bold text-slate-700 mr-2">{cat}</span>
                        <button type="button" onClick={() => startEditingCategory(index, cat)} className="text-blue-500 text-xs mr-2 font-bold hover:bg-blue-100 p-1 rounded">Edit</button>
                        <button type="button" onClick={() => handleDeleteCategory(cat)} className="text-red-500 text-xs font-bold hover:bg-red-100 p-1 rounded">Del</button>
                      </div>
                    )
                  }

                  const isSelected = formData.category === cat
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, category: cat }))}
                      className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                        isSelected
                          ? "bg-amber-600 text-white border-amber-700 shadow-md"
                          : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      {cat} {isSelected && "✓"}
                    </button>
                  )
                })}

                {!isManagingCategories && (
                  !isAddingCategory ? (
                    <button type="button" onClick={() => setIsAddingCategory(true)} className="px-5 py-2.5 rounded-xl text-sm font-bold border border-dashed border-slate-400 text-slate-500 hover:bg-slate-100 transition-all">
                      + Add New Category
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-300 shadow-sm">
                      <input type="text" className="px-4 py-1.5 rounded-lg outline-none text-sm border" placeholder="New Cat..." value={newCategory} onChange={(e) => setNewCategory(e.target.value)} autoFocus />
                      <button type="button" onClick={handleAddNewCategory} className="bg-amber-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold">Save</button>
                      <button type="button" onClick={() => setIsAddingCategory(false)} className="text-red-500 px-2 font-bold">✕</button>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="border border-gray-200 p-6 rounded-xl space-y-6">
              <h2 className="text-lg font-bold text-gray-800 border-b pb-2">2. Visitor Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Entry Fee</label>
                  <input type="text" className="w-full px-4 py-3 border rounded-xl outline-none bg-gray-50" value={formData.entryFee} onChange={(e) => setFormData({...formData, entryFee: e.target.value})} placeholder="Free or ₹50" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Timing</label>
                  <input type="text" className="w-full px-4 py-3 border rounded-xl outline-none bg-gray-50" value={formData.timing} onChange={(e) => setFormData({...formData, timing: e.target.value})} placeholder="9 AM - 6 PM" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Best Time To Visit</label>
                  <input type="text" className="w-full px-4 py-3 border rounded-xl outline-none bg-gray-50" value={formData.bestTime} onChange={(e) => setFormData({...formData, bestTime: e.target.value})} placeholder="October to March" />
                </div>
              </div>
            </div>

            <div className="bg-amber-50 p-6 rounded-xl border border-amber-100">
              <label className="block text-sm font-bold mb-3 text-amber-900">Featured Photo (Main Image)*</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-4">
                  <input type="text" placeholder="Paste Image URL..." className="w-full p-3 border border-amber-200 rounded-xl bg-white text-sm" value={formData.image} onChange={(e) => setFormData({...formData, image: e.target.value})} />
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-amber-700 uppercase">Or Upload File</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="text-xs text-slate-500 file:bg-amber-100 file:border-0 file:rounded-full file:px-4 file:py-2 file:text-amber-800 cursor-pointer" disabled={isUploading} />
                  </div>
                </div>
                <div className="flex justify-center border-2 border-dashed border-amber-200 rounded-xl p-2 bg-white/50 min-h-[140px] items-center">
                  {isUploading ? (
                    <span className="animate-pulse text-amber-600 font-bold">Uploading image...</span>
                  ) : formData.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={formData.image} className="h-32 rounded-lg shadow-md object-cover" alt="Preview" />
                  ) : (
                    <span className="text-slate-400 text-xs">Image Preview</span>
                  )}
                </div>
              </div>
            </div>

            <div className="border border-gray-200 p-6 rounded-xl">
              <h2 className="text-lg font-bold text-gray-800 mb-3">3. Main Description & Story*</h2>
              <div className="h-64 mb-16">
                <ReactQuill 
                  theme="snow" 
                  value={formData.description} 
                  onChange={handleDescriptionChange} 
                  className="h-52" 
                  placeholder="Tell the detailed story and beauty of this place..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 p-6 rounded-xl">
                <label className="block text-sm font-bold mb-2 text-gray-800">📜 History & Significance</label>
                <textarea rows={4} placeholder="Origin and historical background..." className="w-full p-3.5 border rounded-xl outline-none bg-gray-50 focus:ring-2 focus:ring-amber-500 text-sm" value={formData.history} onChange={(e) => setFormData({...formData, history: e.target.value})} />
              </div>
              <div className="border border-gray-200 p-6 rounded-xl">
                <label className="block text-sm font-bold mb-2 text-gray-800">💡 Why Visit? (Highlights)</label>
                <textarea rows={4} placeholder="Unique features and top highlights..." className="w-full p-3.5 border rounded-xl outline-none bg-gray-50 focus:ring-2 focus:ring-amber-500 text-sm" value={formData.whyVisit} onChange={(e) => setFormData({...formData, whyVisit: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 p-6 rounded-xl">
                <label className="block text-sm font-bold mb-2 text-gray-800">🚆 How to Reach</label>
                <textarea rows={3} placeholder="Nearest airport, railway station, bus routes..." className="w-full p-3.5 border rounded-xl outline-none bg-gray-50 focus:ring-2 focus:ring-amber-500 text-sm" value={formData.howToReach} onChange={(e) => setFormData({...formData, howToReach: e.target.value})} />
              </div>
              <div className="border border-gray-200 p-6 rounded-xl">
                <label className="block text-sm font-bold mb-2 text-gray-800">📍 Nearest Places</label>
                <textarea rows={3} placeholder="Other nearby tourist attractions..." className="w-full p-3.5 border rounded-xl outline-none bg-gray-50 focus:ring-2 focus:ring-amber-500 text-sm" value={formData.nearestPlaces} onChange={(e) => setFormData({...formData, nearestPlaces: e.target.value})} />
              </div>
              <div className="md:col-span-2 border border-gray-200 p-6 rounded-xl">
                <label className="block text-sm font-bold mb-2 text-gray-800">🙏 Rituals / Activities / Things to Do</label>
                <textarea rows={3} placeholder="Local rituals, festivals, or fun activities to do here..." className="w-full p-3.5 border rounded-xl outline-none bg-gray-50 focus:ring-2 focus:ring-amber-500 text-sm" value={formData.rituals} onChange={(e) => setFormData({...formData, rituals: e.target.value})} />
              </div>
            </div>

            <div className="border border-amber-200 p-6 rounded-xl bg-amber-50/50">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-amber-900">4. Top Attractions / Spot Highlights</h2>
                <button type="button" onClick={() => setTopAttractions([...topAttractions, ""])} className="text-sm bg-amber-600 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-amber-700 shadow-sm">+ Add Spot</button>
              </div>
              <div className="space-y-3">
                {topAttractions.map((spot, index) => (
                  <div key={index} className="flex gap-2">
                    <input type="text" className="w-full px-4 py-2 border border-amber-200 rounded-lg outline-none bg-white text-sm" placeholder="e.g. Echo Point, Sunset View" value={spot} onChange={(e) => handleArrayChange(index, e.target.value, "attraction")} />
                    {topAttractions.length > 1 && (
                      <button type="button" onClick={() => handleRemoveArrayItem(index, "attraction")} className="text-red-500 font-bold px-3 hover:bg-red-50 rounded-lg">✕</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-gray-200 p-6 rounded-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800">5. Photo Gallery (Extra Image URLs)</h2>
                <button type="button" onClick={() => setGallery([...gallery, ""])} className="text-sm bg-gray-200 text-gray-700 font-bold px-3 py-1.5 rounded-lg hover:bg-gray-300">+ Add New Line</button>
              </div>
              <div className="space-y-3">
                {gallery.map((url, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input type="url" className="flex-1 px-4 py-2 border rounded-lg outline-none bg-gray-50 text-sm" placeholder="https://website.com/image.jpg" value={url} onChange={(e) => handleArrayChange(index, e.target.value, "gallery")} />
                    
                    <label className={`px-3 py-2 rounded-lg cursor-pointer flex items-center justify-center font-bold text-sm transition-colors border ${uploadingGalleryIndex === index ? 'bg-gray-200 text-gray-500 border-gray-300' : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'}`}>
                      {uploadingGalleryIndex === index ? '⏳...' : '📁'}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleGalleryUpload(e, index)} disabled={uploadingGalleryIndex === index} />
                    </label>

                    {gallery.length > 1 && (
                      <button type="button" onClick={() => handleRemoveArrayItem(index, "gallery")} className="text-red-500 hover:text-red-700 font-bold px-3 py-2 bg-red-50 hover:bg-red-100 rounded-lg border border-red-100 transition-colors">✕</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
              <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">❓ FAQ Builder (Google Schema Ready)</h3>
              <div className="space-y-4">
                {formData.faqItems.map((faq, index) => (
                  <div key={index} className="bg-white p-4 rounded-xl border relative shadow-sm flex flex-col gap-2">
                    <input placeholder="Question" className="p-2 border-b font-bold outline-none text-sm" value={faq.question} onChange={(e) => handleFaqChange(index, 'question', e.target.value)} />
                    <textarea placeholder="Answer" rows={2} className="p-2 text-sm outline-none resize-none" value={formData.faqItems[index].answer} onChange={(e) => handleFaqChange(index, 'answer', e.target.value)} />
                    <button type="button" onClick={() => removeFaq(index)} className="absolute top-2 right-2 text-red-400 hover:text-red-600 font-bold">✕</button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addFaq} className="mt-4 bg-white px-4 py-2 rounded-lg text-indigo-600 font-bold text-xs border border-indigo-200 hover:bg-indigo-50 transition-all">+ Add More FAQ</button>
            </div>

            {/* 🌟 NEW: Action Buttons (Delete, Save Draft, Publish) */}
            <div className="pt-6 border-t flex flex-col md:flex-row gap-4">
              
              {editId && (
                <button 
                  type="button" 
                  onClick={handleDeleteListing}
                  disabled={submitting || isUploading || uploadingGalleryIndex !== null}
                  className="w-full md:w-1/4 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-4 rounded-2xl font-black text-lg transition-transform hover:scale-[1.01]"
                >
                  🗑️ Delete
                </button>
              )}

              <button 
                type="submit" 
                onClick={() => setSubmitAction("draft")}
                disabled={submitting || isUploading || uploadingGalleryIndex !== null} 
                className="w-full md:w-auto flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-4 rounded-2xl font-black text-lg shadow-sm transition-transform hover:scale-[1.01]"
              >
                💾 Save as Draft
              </button>

              <button 
                type="submit" 
                onClick={() => setSubmitAction("publish")}
                disabled={submitting || isUploading || uploadingGalleryIndex !== null} 
                className="w-full md:w-auto flex-1 bg-amber-600 hover:bg-amber-700 text-white py-4 rounded-2xl font-black text-lg shadow-lg transition-transform hover:scale-[1.01] disabled:bg-amber-400"
              >
                {submitting ? "Processing..." : (userRole === "admin" ? "🚀 Publish Now" : "🚀 Submit for Approval")}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}

export default function AddPlaceListing() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-xl">Loading Form...</div>}>
      <PlaceFormContent />
    </Suspense>
  )
}