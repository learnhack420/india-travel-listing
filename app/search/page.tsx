import { supabase } from '../../utils/supabase'
import Link from 'next/link'
import type { Metadata } from 'next'



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

// Listing URL Helper
const getListingUrl = (listing: any) => {
  const slug = listing.slug || listing.id
  if (listing.category === 'tour') return `/tour/${slug}`
  if (listing.category === 'hotel') return `/hotel/${slug}`
  if (listing.category === 'cab') return `/cabs/${slug}`
  return `/listing/${slug}`
}

// 🌟 PERFECT THUMBNAIL EXTRACTOR (Same as Homepage)
const getThumbnail = (listing: any) => {
  const meta = typeof listing.metadata === 'string' ? JSON.parse(listing.metadata) : (listing.metadata || {})
  
  // 1. Direct Image Match 
  const exactImage = listing.image || listing.thumbnail || meta.thumbnail || meta.image;
  if (exactImage && typeof exactImage === 'string' && exactImage.trim() !== '') {
    return exactImage.trim();
  }

  // 2. Check meta.gallery array as fallback 
  if (meta.gallery && Array.isArray(meta.gallery) && meta.gallery.length > 0) {
    const firstValidImg = meta.gallery.find((img: string) => img && typeof img === 'string' && img.trim() !== '')
    if (firstValidImg) return firstValidImg.trim()
  }

  // 3. Custom Default Logo (If no image is found anywhere)
  return '/ITO LOGO.png'
}

export default async function SearchResultsPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ [key: string]: string | undefined }> 
}) {
  const resolvedParams = await searchParams
  
  const service = resolvedParams.service // cab, tour, hotel
  const destination = resolvedParams.destination
  const city = resolvedParams.city
  const pickup = resolvedParams.pickup
  const drop = resolvedParams.drop
  
  // Supabase Base Query
  let query = supabase
    .from('listings')
    .select('*')
    .eq('status', 'approved')

  // 1. Filter by Service Category
  if (service) {
    query = query.eq('category', service)
  }

  // 🌟 2. SMART LOCATION FILTER (Map Click & Manual Search dono ke liye)
  const searchLocation = destination || city || pickup;
  
  if (searchLocation) {
    query = query.ilike('location', `%${searchLocation}%`)
  }

  // Finalize query order
  const { data: results, error } = await query.order('created_at', { ascending: false })

  if (error) {
    console.error('Search query error:', error)
  }

  // Dynamic heading generator
  let searchHeading = "Search Results"
  if (service === 'tour') searchHeading = `Tour Packages for ${destination || 'Anywhere'}`
  else if (service === 'hotel') searchHeading = `Hotels in ${city || 'Anywhere'}`
  else if (service === 'cab') {
    if (resolvedParams.type === 'local') searchHeading = `Local Cabs in ${city || 'City'}`
    else if (resolvedParams.type === 'outstation') searchHeading = `Outstation Cabs from ${pickup || 'City'}`
    else searchHeading = "Cab Services"
  } else if (searchLocation) {
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
            Found {results ? results.length : 0} verified options matching your search.
          </p>
        </div>
      </div>

      {/* Results Grid */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 mt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {results && results.length > 0 ? (
            results.map((listing) => {
              const detailUrl = getListingUrl(listing)
              const imageUrl = getThumbnail(listing)
              const cleanDescription = stripHtml(listing.description)

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
                      {listing.category}
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
                          📍 {listing.location ? listing.location.split(',')[0] : 'India'}
                        </span>
                        <div className="text-right">
                          <span className="block text-xs text-gray-400 font-medium mb-1">Starting from</span>
                          <span className="text-xl font-extrabold text-green-600">
                            ₹{listing.price}
                          </span>
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
                We couldn't find any services matching your search criteria right now. Try searching for a different location or category.
              </p>
              <Link href="/" className="inline-block mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors">
                Go Back Home
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}