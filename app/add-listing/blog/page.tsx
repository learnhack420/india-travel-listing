"use client"
import { useEffect, useState, Suspense, useRef, useCallback, useMemo } from 'react'
import { supabase } from '@/utils/supabase' 
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import LocationSelector from '../../components/LocationSelector'
import SeoAnalyzer from '../../components/SeoAnalyzer'

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false }) as any
import "react-quill-new/dist/quill.snow.css"

function BlogFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [vendorId, setVendorId] = useState('')
  const [userRole, setUserRole] = useState('')

  // 🌟 NEW: Track button action (draft or publish)
  const [submitAction, setSubmitAction] = useState('publish')

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [location, setLocation] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [longDescription, setLongDescription] = useState('')
  
  // 🌟 Thumbnail & Gallery States
  const [thumbnail, setThumbnail] = useState('')
  const [isUploadingThumb, setIsUploadingThumb] = useState(false)
  const [gallery, setGallery] = useState([''])
  const [uploadingGalleryIndex, setUploadingGalleryIndex] = useState<number | null>(null)
  
  // 🌟 SEO Meta States
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [metaKeywords, setMetaKeywords] = useState('')

  const [faqItems, setFaqItems] = useState([{ question: "", answer: "" }])

  const [category, setCategory] = useState("Travel Guide")
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [isManagingCategories, setIsManagingCategories] = useState(false)
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategory, setNewCategory] = useState("")
  const [editingCatIndex, setEditingCatIndex] = useState<number | null>(null)
  const [editingCatName, setEditingCatName] = useState("")

  // 🌟 Quill Editor Ref (Image handler ke liye zaroori hai)
  const quillRef = useRef<any>(null)

  useEffect(() => {
    checkAccessAndLoadData()
  }, [editId])

  async function checkAccessAndLoadData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, approval_status')
      .eq('id', session.user.id)
      .single()

    if (!profile || (profile.role !== 'vendor' && profile.role !== 'admin')) {
      router.push('/login')
      return
    }

    setVendorId(session.user.id)
    setUserRole(profile.role)

    let currentCats = ["Travel Guide", "Tips & Tricks", "Itinerary", "Food & Culture"]
    const savedCats = localStorage.getItem("adminBlogCategories")
    if (savedCats) {
      currentCats = JSON.parse(savedCats)
      setAvailableCategories(currentCats)
    } else {
      setAvailableCategories(currentCats)
    }

    if (editId) {
      const { data: listing, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', editId)
        .single()

      if (error || !listing) {
        setMessage({ type: 'error', text: 'Blog article not found!' })
        setLoading(false)
        return
      }

      setTitle(listing.title || '')
      setSlug(listing.slug || '')
      setSlugEdited(true)
      setLocation(listing.location || '')
      setLongDescription(listing.description || '')

      const meta = listing.metadata || {}
      setShortDescription(meta.shortDescription || '')
      
      // Load SEO Data
      setMetaTitle(meta.metaTitle || listing.title || '')
      setMetaDescription(meta.metaDescription || meta.shortDescription || '')
      setMetaKeywords(meta.metaKeywords || '')

      if (meta.blogCategory) {
        setCategory(meta.blogCategory)
        if (!currentCats.includes(meta.blogCategory)) {
          const updatedCats = [...currentCats, meta.blogCategory]
          setAvailableCategories(updatedCats)
          localStorage.setItem("adminBlogCategories", JSON.stringify(updatedCats))
        }
      }

      setThumbnail(meta.thumbnail || meta.gallery?.[0] || '')

      if (meta.gallery && meta.gallery.length > 0) {
        setGallery(meta.gallery)
      }

      if (meta.faqItems && meta.faqItems.length > 0) {
        setFaqItems(meta.faqItems)
      }
    } else {
      if (currentCats.length > 0) setCategory(currentCats[0])
    }

    setLoading(false)
  }

  // 🌟 IMGBB IMAGE UPLOAD HELPER FUNCTION
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
      alert("Image upload fail ho gaya. Kripya image size chota rakhein.")
      return null
    }
  }

  // 🌟 REACT QUILL CUSTOM IMAGE HANDLER (Base64 Error Fix)
  const imageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      if (input.files && input.files[0]) {
        const file = input.files[0];
        
        // Upload image to ImgBB
        const url = await uploadImageToServer(file);
        
        // Insert URL into Quill editor
        if (url && quillRef.current) {
          const quill = quillRef.current.getEditor();
          const range = quill.getSelection(true);
          quill.insertEmbed(range.index, 'image', url);
          quill.setSelection(range.index + 1); // Move cursor right after the image
        }
      }
    };
  }, []);

  // 🌟 Memoized Quill Modules so it doesn't re-render infinitely
  const quillModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [2, 3, 4, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['link', 'image'], 
        ['clean']
      ],
      handlers: {
        image: imageHandler // Custom handler hook kiya
      }
    }
  }), [imageHandler]);

  // 🌟 Regular Upload Handlers
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingThumb(true)
    const url = await uploadImageToServer(file)
    if (url) setThumbnail(url)
    setIsUploadingThumb(false)
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

  // --- Category & Field Handlers ---
  const handleAddNewCategory = () => {
    if (newCategory.trim() !== "") {
      const formattedCategory = newCategory.trim()
      const updatedCategories = [...new Set([...availableCategories, formattedCategory])]
      setAvailableCategories(updatedCategories)
      localStorage.setItem("adminBlogCategories", JSON.stringify(updatedCategories))
      setCategory(formattedCategory)
      setNewCategory("")
      setIsAddingCategory(false)
    }
  }

  const handleDeleteCategory = (catToDelete: string) => {
    if (window.confirm(`Are you sure you want to delete "${catToDelete}"?`)) {
      const updatedCategories = availableCategories.filter(c => c !== catToDelete)
      setAvailableCategories(updatedCategories)
      localStorage.setItem("adminBlogCategories", JSON.stringify(updatedCategories))
      if (category === catToDelete) {
        setCategory(updatedCategories[0] || "")
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
      localStorage.setItem("adminBlogCategories", JSON.stringify(updatedCategories))
      if (category === oldCat) {
        setCategory(trimmedName)
      }
    }
    setEditingCatIndex(null)
    setEditingCatName("")
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    if (!metaTitle) setMetaTitle(newTitle)
    if (!slugEdited) {
      const generatedSlug = newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')    
      setSlug(generatedSlug)
    }
  }

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
    setSlugEdited(true) 
  }

  const handleGalleryChange = (index: number, value: string) => {
    const newGallery = [...gallery]
    newGallery[index] = value
    setGallery(newGallery)
  }

  const handleRemoveGalleryItem = (index: number) => {
    if (gallery.length > 1) {
      setGallery(gallery.filter((_, i) => i !== index))
    }
  }

  const handleFaqChange = (index: number, field: string, value: string) => {
    const newFaqs = [...faqItems]
    newFaqs[index] = { ...newFaqs[index], [field]: value }
    setFaqItems(newFaqs)
  }

  const addFaq = () => setFaqItems([...faqItems, { question: "", answer: "" }])

  const removeFaq = (index: number) => {
    const newFaqs = [...faqItems]
    newFaqs.splice(index, 1)
    setFaqItems(newFaqs)
  }

  // 🌟 NEW: Handles permanent deletion of the draft/listing
  const handleDeleteListing = async () => {
    if (!window.confirm("WARNING: Kya aap sach mein is blog article ko delete karna chahte hain? Yeh wapas recover nahi hoga.")) return

    setSubmitting(true)
    const { error } = await supabase.from("listings").delete().eq("id", editId)
    
    if (error) {
      alert("Error deleting article: " + error.message)
      setSubmitting(false)
    } else {
      alert("Blog article deleted successfully!")
      router.push(userRole === 'admin' ? "/admin" : "/vendor")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!category) return alert("Please select or add a category!")
    if (!longDescription || longDescription === '<p><br></p>') return alert("Article content cannot be empty!")

    setSubmitting(true)
    setMessage({ type: '', text: '' })

    const cleanGallery = gallery.filter(link => link.trim() !== '')
    const cleanFaqs = faqItems.filter(f => f.question.trim() !== "" && f.answer.trim() !== "")

    const metadata = {
      shortDescription,
      thumbnail, 
      gallery: cleanGallery,
      blogCategory: category,
      faqItems: cleanFaqs,
      metaTitle,
      metaDescription,
      metaKeywords
    }

    // 🌟 NEW: Determine Final Status based on button clicked
    let finalStatus = "draft";
    if (submitAction === "publish") {
      finalStatus = userRole === "admin" ? "approved" : "pending";
    }

    const dbPayload = {
      title: title,
      slug: slug,
      description: longDescription,
      location: location || null, 
      status: finalStatus, // Add the calculated status
      metadata: metadata
    }

    let error;

    if (editId) {
      const res = await supabase
        .from('listings')
        .update(dbPayload)
        .eq('id', editId)
      error = res.error
    } else {
      const res = await supabase
        .from('listings')
        .insert([{
          ...dbPayload,
          vendor_id: vendorId,
          category: 'blog', 
          price: 0,
        }])
      error = res.error
    }

    if (error) {
      if (error.code === '23505') {
        setMessage({ type: 'error', text: 'Error: Yeh SEO Slug pehle se used hai. Kripya thoda alag slug banayein.' })
      } else {
        setMessage({ type: 'error', text: 'Error: ' + error.message })
      }
      setSubmitting(false)
    } else {
      
      // Send email if a new article is submitted for approval
      if (!editId && submitAction === 'publish') {
        fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'New Blog Article Added 📝',
            data: {
              Article_Title: title,
              Category: category,
              Vendor_ID: vendorId,
              Action: 'Please review and approve from Admin Panel'
            }
          })
        }).catch(err => console.error("Email bhejte waqt error aaya:", err))
      }

      setMessage({ type: 'success', text: submitAction === 'draft' ? '✅ Draft saved successfully!' : (editId ? '✅ Blog article successfully updated!' : '✅ Blog article successfully published!') })
      setSubmitting(false)
      
      setTimeout(() => { router.push(userRole === 'admin' ? '/admin' : '/vendor') }, 2000)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-indigo-600">Loading Form...</div>

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        
        <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-extrabold">{editId ? 'Edit Blog Article' : 'Add New Blog Article'}</h1>
            <p className="text-indigo-100 text-sm mt-1">Create an SEO-friendly blog post with rich text, FAQs and categories</p>
          </div>
          <Link href={userRole === 'admin' ? '/admin' : '/vendor'} className="bg-indigo-700 hover:bg-indigo-800 px-4 py-2 rounded-lg font-medium text-sm transition-colors">
            ← Back
          </Link>
        </div>

        <div className="p-6 md:p-8">
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg text-sm font-bold ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            
            <div className="border border-gray-200 p-6 rounded-xl">
              <h2 className="text-lg font-bold text-gray-800 mb-4">1. Title & Direct URL (Slug)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Blog Title</label>
                  <input type="text" required className="w-full px-4 py-2 border rounded-lg outline-none bg-gray-50 focus:ring-2 focus:ring-indigo-500" value={title} onChange={handleTitleChange} placeholder="e.g. Valley of Flowers Complete Trek Guide" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Root URL Slug</label>
                  <div className="flex items-center">
                    <span className="px-3 py-2 bg-gray-200 border border-gray-300 border-r-0 rounded-l-lg text-gray-500 text-sm">/</span>
                    <input type="text" required className="w-full px-4 py-2 border rounded-r-lg outline-none bg-white text-blue-700 font-medium focus:ring-2 focus:ring-indigo-500" value={slug} onChange={handleSlugChange} placeholder="valley-of-flowers" />
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <LocationSelector 
                    label="Location / Tag (Optional)" 
                    selected={location} 
                    onChange={setLocation} 
                    multiple={false}
                    placeholder="Select or Add Location (e.g. Uttarakhand, India)"
                  />
                </div>
              </div>
            </div>

            {/* 🌟 AI SEO Analyzer Component */}
            <SeoAnalyzer 
              pageTitle={title}
              pageDescription={shortDescription || longDescription.replace(/<[^>]*>/g, '').substring(0, 160)}
              location={location || 'India'}
              categoryType="blog"
              metaTitle={metaTitle}
              setMetaTitle={setMetaTitle}
              metaDescription={metaDescription}
              setMetaDescription={setMetaDescription}
              metaKeywords={metaKeywords}
              setMetaKeywords={setMetaKeywords}
            />

            {/* Meta Fields for SEO */}
            <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 space-y-4">
              <h3 className="font-bold text-indigo-900">Search Engine Optimization (SEO) Metadata</h3>
              <div>
                <label className="block text-sm font-bold text-indigo-900 mb-1">Meta Title</label>
                <input type="text" className="w-full px-4 py-2 border border-indigo-200 rounded-lg outline-none bg-white font-semibold text-sm" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder="Meta Title for Google search..." />
              </div>
              <div>
                <label className="block text-sm font-bold text-indigo-900 mb-1">Meta Description</label>
                <textarea rows={2} className="w-full px-4 py-2 border border-indigo-200 rounded-lg outline-none bg-white text-sm resize-none" value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} placeholder="Short description for Google search results (140-160 chars)..."></textarea>
              </div>
              <div>
                <label className="block text-sm font-bold text-indigo-900 mb-1">Meta Keywords</label>
                <input type="text" className="w-full px-4 py-2 border border-indigo-200 rounded-lg outline-none bg-white text-sm" value={metaKeywords} onChange={(e) => setMetaKeywords(e.target.value)} placeholder="keyword 1, keyword 2, keyword 3..." />
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-bold text-slate-800">Select Blog Category*</label>
                <button type="button" onClick={() => setIsManagingCategories(!isManagingCategories)} className={`text-xs font-bold px-3 py-1.5 rounded-full ${isManagingCategories ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>
                  {isManagingCategories ? "Done Managing" : "⚙️ Manage Categories"}
                </button>
              </div>
              
              <div className="flex flex-wrap gap-3 items-center">
                {availableCategories.map((cat, index) => {
                  if (isManagingCategories) {
                    if (editingCatIndex === index) {
                      return (
                        <div key={index} className="flex items-center gap-2 bg-indigo-50 p-1.5 rounded-full border border-indigo-200">
                          <input type="text" className="px-3 py-1 rounded-full text-sm outline-none w-32 border" value={editingCatName} onChange={(e) => setEditingCatName(e.target.value)} autoFocus />
                          <button type="button" onClick={() => saveEditedCategory(index, cat)} className="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold">Save</button>
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

                  const isSelected = category === cat
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                        isSelected
                          ? "bg-indigo-600 text-white border-indigo-700 shadow-md"
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
                      <button type="button" onClick={handleAddNewCategory} className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold">Save</button>
                      <button type="button" onClick={() => setIsAddingCategory(false)} className="text-red-500 px-2 font-bold">✕</button>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="border border-gray-200 p-6 rounded-xl">
              <h2 className="text-lg font-bold text-gray-800 mb-4">2. Article Content</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Short Description (Excerpt / Meta Description)</label>
                  <textarea rows={2} required className="w-full px-4 py-2 border rounded-lg outline-none resize-none bg-gray-50 focus:ring-2 focus:ring-indigo-500" value={shortDescription} onChange={e => setShortDescription(e.target.value)} placeholder="Write a brief 2-line summary for the blog card grid..."></textarea>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Full Article Content (Rich Text)</label>
                  <div className="h-[400px] mb-12">
                    {/* @ts-ignore - Dynamic import causes ref type mismatch */}
                    <ReactQuill 
                      ref={quillRef} 
                      theme="snow" 
                      value={longDescription} 
                      onChange={setLongDescription} 
                      modules={quillModules}
                      className="h-[350px]" 
                      placeholder="Write your complete blog article here. Use the image icon in the toolbar to safely upload pictures..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 🌟 Main Image & Gallery Uploads */}
            <div className="border border-gray-200 p-6 rounded-xl bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800 mb-4">3. Featured Image & Gallery</h2>
              
              <div className="mb-6 pb-6 border-b border-gray-200">
                <label className="block text-sm font-bold text-gray-700 mb-2">Main Thumbnail (Blog Cover Photo)*</label>
                <div className="flex gap-2">
                  <input type="url" required className="flex-1 px-4 py-2 border rounded-lg bg-white outline-none" value={thumbnail} onChange={(e) => setThumbnail(e.target.value)} placeholder="https://.../blog-cover.jpg" />
                  <label className="bg-indigo-100 hover:bg-indigo-200 text-indigo-800 px-4 py-2 rounded-lg cursor-pointer flex items-center justify-center font-bold text-sm border border-indigo-200 transition-colors">
                    {isUploadingThumb ? '⏳...' : '📁 Upload'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleThumbnailUpload} disabled={isUploadingThumb} />
                  </label>
                </div>
              </div>

              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-bold text-gray-700">Extra Gallery Images</label>
                <button type="button" onClick={() => setGallery([...gallery, ''])} className="text-sm bg-gray-200 text-gray-700 font-bold px-3 py-1 rounded hover:bg-gray-300">+ Add New Row</button>
              </div>
              <div className="space-y-3">
                {gallery.map((url, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <input type="url" className="flex-1 px-4 py-2 border rounded-lg outline-none bg-white focus:ring-2 focus:ring-indigo-500" placeholder="https://images.unsplash.com/photo-..." value={url} onChange={(e) => handleGalleryChange(index, e.target.value)} />
                    
                    {/* 🌟 Folder Icon logic for ImgBB gallery upload */}
                    <label className={`px-3 py-2 rounded-lg cursor-pointer flex items-center justify-center font-bold text-sm transition-colors border ${uploadingGalleryIndex === index ? 'bg-gray-200 text-gray-500 border-gray-300' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'}`}>
                      {uploadingGalleryIndex === index ? '⏳...' : '📁'}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleGalleryUpload(e, index)} disabled={uploadingGalleryIndex === index} />
                    </label>

                    {gallery.length > 1 && (
                      <button type="button" onClick={() => handleRemoveGalleryItem(index)} className="text-red-500 font-bold px-3 py-2 bg-red-50 rounded-lg hover:bg-red-100">✕</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
              <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">4. ❓ FAQ Builder (Google Schema Ready)</h3>
              <div className="space-y-4">
                {faqItems.map((faq, index) => (
                  <div key={index} className="bg-white p-4 rounded-xl border relative shadow-sm flex flex-col gap-2">
                    <input 
                      placeholder="Question (e.g., What is the best time to visit?)" 
                      className="p-2 border-b font-bold outline-none text-sm focus:border-indigo-400" 
                      value={faq.question} 
                      onChange={(e) => handleFaqChange(index, 'question', e.target.value)} 
                    />
                    <textarea 
                      placeholder="Answer..." 
                      rows={2} 
                      className="p-2 text-sm outline-none resize-none focus:bg-gray-50 rounded" 
                      value={faq.answer} 
                      onChange={(e) => handleFaqChange(index, 'answer', e.target.value)} 
                    />
                    <button 
                      type="button" 
                      onClick={() => removeFaq(index)} 
                      className="absolute top-2 right-2 text-red-400 hover:text-red-600 font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button 
                type="button" 
                onClick={addFaq} 
                className="mt-4 bg-white px-4 py-2 rounded-lg text-indigo-600 font-bold text-xs border border-indigo-200 hover:bg-indigo-50 transition-all shadow-sm"
              >
                + Add More FAQ
              </button>
            </div>

            {/* 🌟 NEW: Action Buttons (Delete, Save Draft, Publish) */}
            <div className="pt-6 border-t flex flex-col md:flex-row gap-4 mt-8">
              
              {editId && (
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
                onClick={() => setSubmitAction("draft")}
                disabled={submitting || isUploadingThumb || uploadingGalleryIndex !== null} 
                className="w-full md:w-auto flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-4 rounded-2xl font-black text-lg shadow-sm transition-transform hover:scale-[1.01]"
              >
                💾 Save as Draft
              </button>

              <button 
                type="submit" 
                onClick={() => setSubmitAction("publish")}
                disabled={submitting || isUploadingThumb || uploadingGalleryIndex !== null} 
                className="w-full md:w-auto flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black text-lg shadow-lg transition-transform hover:scale-[1.01] disabled:bg-indigo-400"
              >
                {submitting ? 'Processing...' : (userRole === "admin" ? "🚀 Publish Now" : "🚀 Submit for Approval")}
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  )
}

export default function AddBlogListing() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-indigo-600">Loading Form...</div>}>
      <BlogFormContent />
    </Suspense>
  )
}