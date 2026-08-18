import { supabase } from '../../utils/supabase'
import Link from 'next/link'
import type { Metadata } from 'next'
import CityDropdown from './CityDropdown' 

export const metadata: Metadata = {
  title: 'Search Results | India Tour Operators',
  description: 'Find the best tours, cabs, and hotels.',
}

// Helper function to remove HTML tags and special entities
const stripHtml = (html: string) => {
  if (!html) return '';
  return html
    .replace(/<[^>]*>?/gm, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ')   // Replace non-breaking spaces
    .replace(/&amp;/g, '&');   // Replace ampersands
}

// Listing URL Helper (Super flexible for 'cab' and 'cabs')
const getListingUrl = (listing: any) => {
  const slug = listing.slug || listing.id
  const cat = listing.category?.toLowerCase() || '';
  if (cat.includes('tour')) return `/tour/${slug}`
  if (cat.includes('hotel')) return `/hotel/${slug}`
  if (cat.includes('cab')) return `/cabs/${slug}` 
  if (cat.includes('destination')) return `/places/${slug}`
  return `/listing/${slug}`
}

// 🌟 PERFECT THUMBNAIL EXTRACTOR
const getThumbnail = (listing: any) => {
  let meta: any = {};
  try {
    meta = typeof listing.metadata === 'string' ? JSON.parse(listing.metadata) : (listing.metadata || {})
  } catch (e) { meta = {}; }

  const exactImage = listing.image || listing.thumbnail || meta.thumbnail || meta.image;
  if (exactImage && typeof exactImage === 'string' && exactImage.trim() !== '') return exactImage.trim();
  if (meta.gallery && Array.isArray(meta.gallery) && meta.gallery.length > 0) {
    const firstValidImg = meta.gallery.find((img: string) => img && typeof img === 'string' && img.trim() !== '')
    if (firstValidImg) return firstValidImg.trim()
  }
  return '/ITO LOGO.png'
}

// 🌟 Helper to extract just the source city
const extractSourceCity = (locationStr?: string) => {
  if (!locationStr) return '';
  return locationStr.split(/->|>|,/)[0].trim();
}

export default async function SearchResultsPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ [key: string]: string | undefined }> 
}) {
  const resolvedParams = await searchParams
  
  const service = resolvedParams.service
  const destination = resolvedParams.destination
  const city = resolvedParams.city
  const pickup = resolvedParams.pickup
  const filterCity = resolvedParams.filterCity 
  
  // URL Parameters for filtering
  const theme = resolvedParams.theme 
  const cabTripType = resolvedParams.type // 'local' | 'outstation'
  const cabServiceType = resolvedParams.cabType // 'point-to-point' | 'package' | 'one-way' | 'round-trip'
  
  // Supabase Base Query
  let query = supabase
    .from('listings')
    .select('*')
    .eq('status', 'approved')

  // 1. Filter by Service Category (Smart '%ilike%' to cover 'cab' or 'cabs')
  if (service) {
    query = query.ilike('category', `%${service}%`)
  }

  // 2. SMART LOCATION FILTER
  const searchLocation = destination || city || pickup;
  
  if (searchLocation) {
    query = query.ilike('location', `%${searchLocation}%`)
  }

  const { data: allResults, error } = await query.order('created_at', { ascending: false })

  if (error) console.error('Search query error:', error)

  let results = allResults || [];

  // 🌟 3. ULTRA-SMART METADATA FILTERING
  if (theme || cabTripType || cabServiceType) {
    results = results.filter((item: any) => {
      let metaStr = '';
      let metaObj: any = {};
      try {
        const parsed = typeof item.metadata === 'string' ? JSON.parse(item.metadata || '{}') : (item.metadata || {});
        metaObj = parsed;
        metaStr = JSON.stringify(parsed).toLowerCase();
      } catch(e) { metaStr = ''; }
      
      let keep = true;
      const itemCategory = item.category?.toLowerCase() || '';
      const itemTitle = item.title?.toLowerCase() || '';

      // Theme Filter (Tours)
      if (theme && itemCategory.includes('tour')) {
        const itemTheme = metaObj.tourTheme;
        if (!itemTheme) keep = false;
        else if (Array.isArray(itemTheme)) {
          if (!itemTheme.some((t: string) => t.toLowerCase() === theme.toLowerCase())) keep = false;
        } else if (typeof itemTheme === 'string') {
          if (itemTheme.toLowerCase() !== theme.toLowerCase()) keep = false;
        } else {
          keep = false;
        }
      }

      // Cab Trip Type Filter (Local vs Outstation) - Deep Search
      if (cabTripType && itemCategory.includes('cab')) {
        const targetRaw = cabTripType.toLowerCase();
        const targetSpace = cabTripType.replace(/-/g, ' ').toLowerCase();

        const matchesAnywhere = metaStr.includes(targetRaw) || metaStr.includes(targetSpace) || itemTitle.includes(targetRaw) || itemTitle.includes(targetSpace);
        
        if (!matchesAnywhere) keep = false;
      }

      // Cab Service Type Filter (Round Trip, One Way, etc.) - Deep Search
      if (cabServiceType && itemCategory.includes('cab')) {
        const targetRaw = cabServiceType.toLowerCase(); // 'round-trip'
        const targetSpace = cabServiceType.replace(/-/g, ' ').toLowerCase(); // 'round trip'
        const targetJoined = cabServiceType.replace(/-/g, '').toLowerCase(); // 'roundtrip'
        
        const matchesAnywhere = metaStr.includes(targetRaw) || metaStr.includes(targetSpace) || metaStr.includes(targetJoined) || itemTitle.includes(targetRaw) || itemTitle.includes(targetSpace) || itemTitle.includes(targetJoined);

        if (!matchesAnywhere) keep = false;
      }

      return keep;
    });
  }

  // 🌟 Extract Unique Source Cities
  const availableCities = Array.from(
    new Set(results.map((item: any) => extractSourceCity(item.location)).filter(Boolean))
  ) as string[]

  // 🌟 Format Data for the Dropdown
  const availableCitiesData = availableCities.map((cityObj) => ({
    name: cityObj,
    count: results.filter((l: any) => extractSourceCity(l.location).toLowerCase() === cityObj.toLowerCase()).length
  }))

  // 🌟 Apply Active City Filter
  const filteredResults = filterCity
    ? results.filter((item: any) => extractSourceCity(item.location).toLowerCase() === filterCity.toLowerCase())
    : results;

  // 🌟 Calculate Category Counts (Case insensitive and safe)
  const tourCount = filteredResults.filter((l: any) => l.category?.toLowerCase().includes('tour')).length
  const hotelCount = filteredResults.filter((l: any) => l.category?.toLowerCase().includes('hotel')).length
  const cabCount = filteredResults.filter((l: any) => l.category?.toLowerCase().includes('cab')).length
  const placeCount = filteredResults.filter((l: any) => l.category?.toLowerCase().includes('destination')).length

  // Dynamic heading generator
  let searchHeading = "Search Results"
  
  if (theme) {
    const formattedTheme = theme.charAt(0).toUpperCase() + theme.slice(1).replace(/-/g, ' ');
    searchHeading = `${formattedTheme} Packages`
  } 
  else if (service?.toLowerCase().includes('cab')) {
    const tripText = cabTripType ? (cabTripType.charAt(0).toUpperCase() + cabTripType.slice(1)) : '';
    const cabTypeText = cabServiceType ? cabServiceType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : '';
    
    const parts = [tripText, cabTypeText, 'Cabs'].filter(Boolean);
    searchHeading = parts.length > 0 ? parts.join(' ') : 'Cab Services';
    if (city || pickup) searchHeading += ` in ${city || pickup}`;
  }
  else if (service === 'tour') searchHeading = `Tour Packages for ${destination || 'Anywhere'}`
  else if (service === 'hotel') searchHeading = `Hotels in ${city || 'Anywhere'}`
  else if (searchLocation) {
    searchHeading = `Best Places to Explore in ${searchLocation}`
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      
      {/* Search Header */}
      <div className="bg-blue-800 text-white py-12 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <Link href="/" className="text-blue-200 hover:text-white text-sm font-bold mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-3xl md:text-4xl font-extrabold mt-2">{searchHeading}</h1>
          <p className="text-blue-200 mt-2 text-lg">
            Found {filteredResults.length} verified options matching your search.
          </p>

          {/* 🌟 CATEGORY COUNTS BADGE */}
          <div className="flex justify-start gap-3 mt-6 flex-wrap">
            <span className="bg-blue-900/50 border border-blue-400/30 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">
              🗺️ Tours: {tourCount}
            </span>
            <span className="bg-blue-900/50 border border-blue-400/30 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">
              🏨 Hotels: {hotelCount}
            </span>
            <span className="bg-blue-900/50 border border-blue-400/30 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">
              🚖 Cabs: {cabCount}
            </span>
            <span className="bg-blue-900/50 border border-blue-400/30 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">
              📸 Places: {placeCount}
            </span>
          </div>
        </div>
      </div>

      {/* 🌟 CLEARED & CLEAN DROPDOWN COMPONENT */}
      {availableCities.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 md:px-8 -mt-6 relative z-10 mb-8">
          <CityDropdown 
            availableCities={availableCitiesData} 
            resultsCount={results.length} 
          />
        </div>
      )}

      {/* Results Grid */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredResults && filteredResults.length > 0 ? (
            filteredResults.map((listing: any) => {
              const detailUrl = getListingUrl(listing)
              const imageUrl = getThumbnail(listing)
              const cleanDescription = stripHtml(listing.description)
              const isInfoContent = listing.category?.toLowerCase() === 'destination' || listing.category?.toLowerCase() === 'blog';
              const displayLocation = extractSourceCity(listing.location) || 'India';
              
              // Formatting Category Display Label
              const displayCategory = listing.category?.toLowerCase().includes('cab') 
                ? 'Cab Service' 
                : listing.category === 'destination' ? 'Tourist Place' : listing.category;

              return (
                <Link 
                  href={detailUrl} 
                  key={listing.id} 
                  className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col group cursor-pointer"
                >
                  <div className="relative h-56 w-full bg-gray-200 overflow-hidden flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={imageUrl} 
                      alt={listing.title} 
                      className={`w-full h-full ${imageUrl === '/ITO LOGO.png' ? 'object-contain p-4' : 'object-cover group-hover:scale-110 transition-transform duration-500'}`} 
                    />
                    <span className="absolute top-3 left-3 text-xs font-bold text-white bg-blue-600 px-3 py-1 rounded-full uppercase tracking-wide shadow-md">
                      {displayCategory}
                    </span>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {listing.title}
                      </h3>
                      <p className="text-gray-600 mt-2 text-sm line-clamp-2 leading-relaxed">
                        {cleanDescription}
                      </p>
                    </div>
                    
                    <div>
                      <div className="mt-6 flex justify-between items-end border-t border-gray-100 pt-4">
                        <span className="text-gray-500 text-sm font-medium flex items-center truncate max-w-[60%]">
                          📍 {displayLocation}
                        </span>
                        <div className="text-right">
                          {isInfoContent ? (
                            <span className="block text-sm font-black text-blue-600 bg-blue-50 px-4 py-2 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-colors">Explore →</span>
                          ) : (
                            <>
                              <span className="block text-xs text-gray-400 font-medium mb-1">Starting from</span>
                              <span className="text-xl font-extrabold text-green-600">
                                ₹{listing.price}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })
          ) : (
            <div className="col-span-full text-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
              <span className="text-6xl block mb-4">🔍</span>
              <h2 className="text-2xl font-bold text-gray-800">No results found</h2>
              <p className="text-gray-500 mt-2 max-w-md mx-auto">
                We couldn't find any {service?.includes('cab') ? 'cabs' : 'packages'} matching this filter right now.
              </p>
              {/* Reset filter link */}
              <Link href={`/search${service ? `?service=${service}` : ''}`} className="inline-block mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors capitalize">
                View All {service?.includes('cab') ? 'Cabs' : 'Tours'}
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}