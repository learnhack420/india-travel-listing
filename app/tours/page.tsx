"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase'
import Link from 'next/link'

interface Tour {
  id: string | number;
  title: string;
  slug?: string;
  category?: string;
  image?: string;
  thumbnail?: string;
  location?: string;
  description?: string;
  metadata?: {
    shortDescription?: string;
    price?: number | string;
    duration?: string;
    thumbnail?: string;
    image?: string;
  };
}

export default function ToursListingPage() {
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // 🌟 NEW: Advanced Search states
  const [keyword, setKeyword] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')

  useEffect(() => {
    fetchTours()
  }, [])

  async function fetchTours() {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error: fetchError } = await supabase
        .from('listings')
        .select('*')
        .or('category.eq.tour,category.eq.package,category.eq.tours')

      if (fetchError) throw fetchError

      if (data && data.length > 0) {
        setTours(data)
      } else {
        // Fallback filter if exact category match fails
        const { data: allData, error: allDataError } = await supabase
          .from('listings')
          .select('*')
        
        if (allDataError) throw allDataError

        if (allData) {
          const filtered = allData.filter(item => {
            const cat = item.category?.toLowerCase() || ''
            return cat.includes('tour') || cat.includes('package') || cat.includes('holiday')
          })
          setTours(filtered)
        }
      }
    } catch (err: any) {
      console.error("Error fetching tours:", err)
      setError("We couldn't load the tour packages right now. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  // 🌟 NEW: Advanced Real-time filtering logic
  const filteredTours = tours.filter(tour => {
    const kw = keyword.toLowerCase()
    const ct = city.toLowerCase()
    const st = state.toLowerCase()

    const title = (tour.title || '').toLowerCase()
    const loc = (tour.location || '').toLowerCase()

    const matchesKeyword = kw === '' || title.includes(kw) || loc.includes(kw)
    const matchesCity = ct === '' || loc.includes(ct)
    const matchesState = st === '' || loc.includes(st)

    return matchesKeyword && matchesCity && matchesState
  })

  const clearSearch = () => {
    setKeyword('')
    setCity('')
    setState('')
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-20 font-sans selection:bg-amber-100 selection:text-amber-900">
      
      {/* --- PRO HERO SECTION --- */}
      <section className="relative bg-slate-900 text-white pt-20 pb-32 px-6 text-center overflow-hidden">
        {/* Subtle background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600/90 to-slate-900/90 z-0"></div>
        
        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
          <span className="text-amber-400 font-bold tracking-widest text-sm uppercase mb-4 block">
            Premium Itineraries
          </span>
          <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight tracking-tight drop-shadow-md">
            Explore Popular Tour Packages
          </h1>
          <p className="text-slate-200 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed drop-shadow">
            Discover the best sightseeing trips, exclusive holiday packages, and custom curated tours.
          </p>
        </div>
      </section>

      {/* 🌟 ADVANCED MULTI-FIELD SEARCH BAR */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 -mt-16 relative z-20 mb-8">
        <div className="bg-white p-4 rounded-[2rem] shadow-xl border border-slate-200 flex flex-col md:flex-row items-center gap-3">
          
          {/* Keyword Field */}
          <div className="flex-1 flex items-center gap-3 bg-slate-50 px-5 py-4 rounded-2xl border border-slate-100 w-full">
            <span className="text-xl">🔍</span>
            <input 
              type="text" 
              placeholder="Search tours..." 
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full bg-transparent outline-none text-slate-800 font-bold placeholder:font-medium placeholder:text-slate-400"
            />
          </div>

          {/* City Field */}
          <div className="flex-1 flex items-center gap-3 bg-slate-50 px-5 py-4 rounded-2xl border border-slate-100 w-full">
            <span className="text-xl">🏙️</span>
            <input 
              type="text" 
              placeholder="City (e.g. Mumbai)" 
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-transparent outline-none text-slate-800 font-bold placeholder:font-medium placeholder:text-slate-400"
            />
          </div>

          {/* State Field */}
          <div className="flex-1 flex items-center gap-3 bg-slate-50 px-5 py-4 rounded-2xl border border-slate-100 w-full">
            <span className="text-xl">🗺️</span>
            <input 
              type="text" 
              placeholder="State (e.g. Kerala)" 
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full bg-transparent outline-none text-slate-800 font-bold placeholder:font-medium placeholder:text-slate-400"
            />
          </div>

          {/* Search Button */}
          <button className="bg-slate-900 hover:bg-black text-amber-400 font-black px-8 py-4 rounded-2xl shadow-md transition-all active:scale-95 w-full md:w-auto shrink-0 flex justify-center items-center gap-2">
            Search
          </button>
        </div>
      </div>

      {/* --- CONTENT SECTION --- */}
      <section className="max-w-7xl mx-auto px-4 md:px-8">
        
        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-2xl max-w-2xl mx-auto mt-8 shadow-sm">
            <h3 className="text-red-800 font-bold text-lg mb-2">Oops! Something went wrong</h3>
            <p className="text-red-700">{error}</p>
            <button 
              onClick={fetchTours}
              className="mt-4 text-sm font-bold bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading State (Skeleton Loaders) */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 animate-pulse flex flex-col">
                <div className="h-56 bg-slate-200 rounded-2xl mb-4 w-full"></div>
                <div className="h-4 bg-slate-200 rounded w-1/4 mb-3"></div>
                <div className="h-6 bg-slate-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-slate-200 rounded w-5/6 mb-6"></div>
                <div className="mt-auto flex justify-between items-center pt-4 border-t border-slate-50">
                  <div className="h-5 bg-slate-200 rounded w-1/4"></div>
                  <div className="h-10 bg-slate-200 rounded-xl w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : tours.length === 0 && !error ? (
          
          <div className="text-center py-24 bg-white rounded-3xl shadow-sm border border-slate-100 px-8 max-w-2xl mx-auto mt-12">
            <div className="text-6xl mb-6">🧳</div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">No Packages Found</h3>
            <p className="text-slate-500 mb-8 text-lg">We couldn&apos;t find any tour packages at the moment. Please check back later.</p>
            <Link href="/" className="inline-flex items-center gap-2 bg-slate-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-slate-800 transition-all shadow-md hover:shadow-lg active:scale-95">
              &larr; Return to Home
            </Link>
          </div>
          
        ) : filteredTours.length === 0 ? (
          
          /* No search results found state */
          <div className="text-center py-24 bg-white rounded-3xl shadow-sm border border-slate-100 px-8 max-w-2xl mx-auto mt-12">
            <div className="text-6xl mb-6">🔍</div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">No Match Found</h3>
            <p className="text-slate-500 mb-8 text-lg">We couldn&apos;t find any tours matching your criteria.</p>
            <button 
              onClick={clearSearch}
              className="inline-flex items-center gap-2 bg-amber-500 text-white font-bold px-6 py-3 rounded-xl hover:bg-amber-600 transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              Clear Search
            </button>
          </div>

        ) : (
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            {filteredTours.map((tour) => {
              const meta = tour.metadata || {}
              
              const imageUrl = tour.image || tour.thumbnail || meta.thumbnail || meta.image || null;

              let cleanDescription = 'Experience an unforgettable journey with our curated travel itinerary.';
              if (meta.shortDescription) {
                cleanDescription = meta.shortDescription;
              } else if (tour.description) {
                cleanDescription = tour.description
                  .replace(/<[^>]*>?/gm, '') 
                  .replace(/&nbsp;/g, ' ')   
                  .replace(/&amp;/g, '&')    
                  .replace(/&quot;/g, '"')   
                  .substring(0, 120) + '...';
              }

              return (
                <Link 
                  href={`/tour/${tour.slug || tour.id}`} 
                  key={tour.id} 
                  className="group bg-white rounded-3xl shadow-sm hover:shadow-xl border border-slate-100 overflow-hidden transition-all duration-300 flex flex-col hover:-translate-y-1"
                >
                  {/* Image Container */}
                  <div className="relative h-56 bg-slate-100 overflow-hidden">
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={imageUrl} 
                        alt={tour.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-400 font-medium bg-slate-100">
                        <span className="text-3xl mb-2 block text-center">🏞️</span>
                      </div>
                    )}
                    
                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                      <span className="bg-white/95 backdrop-blur-md text-slate-900 text-xs font-black px-3 py-1.5 rounded-full shadow-md uppercase tracking-wider flex items-center gap-1">
                        {meta.duration ? `⏳ ${meta.duration}` : (tour.category || 'Package')}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-amber-500 text-sm">📍</span>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        {tour.location || 'India'}
                      </span>
                    </div>
                    
                    <h3 className="text-2xl font-black text-slate-900 mb-3 leading-tight group-hover:text-amber-600 transition-colors">
                      {tour.title}
                    </h3>
                    
                    <p className="text-slate-600 text-sm leading-relaxed line-clamp-3 mb-6 flex-grow">
                      {cleanDescription}
                    </p>

                    {/* Footer Section */}
                    <div className="pt-5 border-t border-slate-100 flex items-center justify-between mt-auto">
                      <div>
                        <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Starting from</span>
                        <span className="text-lg font-black text-slate-900">
                          {meta.price ? `₹${meta.price}` : 'On Request'}
                        </span>
                      </div>
                      
                      <span className="bg-amber-50 text-amber-700 font-bold px-5 py-2.5 rounded-xl text-sm group-hover:bg-amber-600 group-hover:text-white transition-all duration-300 shadow-sm">
                        View Details &rarr;
                      </span>
                    </div>
                  </div>
                  
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}