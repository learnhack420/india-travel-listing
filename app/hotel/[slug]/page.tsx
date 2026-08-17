import { supabase } from '../../../utils/supabase'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const runtime = 'edge';

export const revalidate = 60

// 🌟 Helper function to clean the new location format (Replaces ' > ' with ', ')
const formatLocation = (locStr?: string) => {
  if (!locStr) return 'Not specified'
  return locStr.replace(/ > /g, ', ')
}

// 🌟 SEO Metadata Generation
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params
  const { data: hotel } = await supabase.from('listings').select('title, location, metadata').eq('slug', resolvedParams.slug).single()
  
  if (!hotel) return { title: 'Hotel Not Found' }
  
  const cleanLocation = formatLocation(hotel.location)
  const meta = hotel.metadata || {}

  return {
    title: meta.seo?.metaTitle || `${hotel.title} - Best Stay in ${cleanLocation}`,
    description: meta.seo?.metaDescription || `Book your stay at ${hotel.title} located in ${cleanLocation}. Enjoy top amenities and comfortable rooms at the best prices.`,
    keywords: meta.seo?.metaKeywords || `${hotel.title}, hotel in ${cleanLocation}, book room`,
    openGraph: {
      images: [meta.thumbnail || meta.gallery?.[0] || ''],
    }
  }
}

export default async function HotelDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params
  const slug = resolvedParams.slug

  let { data: hotel, error } = await supabase.from('listings').select('*').eq('slug', slug).single()

  if (error || !hotel) {
    const { data: hotelById } = await supabase.from('listings').select('*').eq('id', slug).single()
    if (!hotelById) return notFound()
    hotel = hotelById
  }

  // Security check: Only show hotel categories
  if (hotel.category !== 'hotel') {
    return notFound()
  }

  const meta = hotel.metadata || {}
  const gallery = meta.gallery && meta.gallery.length > 0 
    ? meta.gallery 
    : ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1200']

  // 🌟 Clean Location for display
  const formattedLocation = formatLocation(hotel.location)

  return (
    <main className="min-h-screen bg-gray-50 pb-20 font-sans">
      
      {/* Hero Section */}
      <div className="relative h-[400px] md:h-[500px] w-full bg-gray-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={gallery[0]} alt={hotel.title} className="w-full h-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 max-w-6xl mx-auto">
          <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide shadow-md">
            {meta.starRating || 'Hotel'}
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mt-4 leading-tight drop-shadow-md">{hotel.title}</h1>
          <p className="text-gray-200 mt-3 text-lg font-medium flex items-center gap-2 drop-shadow-md">
            📍 {formattedLocation}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-8 overflow-hidden">
          
          {/* 🌟 Top Amenities (Shifted to the Top) */}
          <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-4 border-b pb-2">Top Amenities</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {meta.wifi === 'Yes' && <div className="flex items-center gap-2 text-gray-700 font-medium">📶 Free WiFi</div>}
              {meta.ac === 'Yes' && <div className="flex items-center gap-2 text-gray-700 font-medium">❄️ AC Rooms</div>}
              {meta.breakfast === 'Yes' && <div className="flex items-center gap-2 text-gray-700 font-medium">🍳 Breakfast</div>}
              {meta.pool === 'Yes' && <div className="flex items-center gap-2 text-gray-700 font-medium">🏊‍♂️ Swimming Pool</div>}
              {meta.parking === 'Yes' && <div className="flex items-center gap-2 text-gray-700 font-medium">🚗 Free Parking</div>}
            </div>
          </section>

          {/* Hotel Overview (With break-words to prevent overflow) */}
          <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-4 border-b pb-2">About the Hotel</h2>
            <div className="prose max-w-none text-gray-600 leading-relaxed break-words overflow-hidden" dangerouslySetInnerHTML={{ __html: meta.description || hotel.description.replace(/\n/g, '<br/>') }} />
          </section>

          {/* Gallery */}
          {gallery.length > 1 && (
            <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-4 border-b pb-2">Hotel Gallery</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {gallery.slice(1).map((imgUrl: string, idx: number) => (
                  <div key={idx} className="h-32 md:h-40 rounded-xl overflow-hidden bg-gray-100 shadow-sm relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imgUrl} alt={`Hotel ${idx+1}`} className="absolute w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Hotel Policies / FAQs (With break-words) */}
          {meta.faqs && meta.faqs.length > 0 && (
            <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-4 border-b pb-2">Hotel Policies & FAQs</h2>
              <div className="space-y-4">
                {meta.faqs.map((faq: any, idx: number) => (
                  <div key={idx} className="border border-gray-100 rounded-xl p-4 bg-gray-50 break-words">
                    <h4 className="font-bold text-gray-800 flex gap-2"><span>📋</span> <span className="break-words">{faq.question}</span></h4>
                    <p className="text-gray-600 text-sm mt-2 flex gap-2"><span>👉</span> <span className="break-words">{faq.answer}</span></p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Pricing Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-blue-100 sticky top-24 relative">
            
            {/* 🌟 NEW: Star Rating Ribbon (Bada Star) */}
            {meta.starRating && (
              <div className="mb-4">
                <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-orange-400 to-orange-500 text-black text-xs font-extrabold px-3 py-1.5 rounded-md shadow-sm">
                  <span className="text-lg">⭐</span> {meta.starRating}
                </span>
              </div>
            )}

            <h3 className="text-gray-500 font-bold uppercase tracking-wider text-xs mb-2">Starting From</h3>
            <div className="text-4xl font-extrabold text-blue-600 mb-6 break-words">
              ₹{hotel.price} <span className="text-sm font-medium text-gray-500">/ night</span>
            </div>

            <div className="flex gap-4 mb-6 text-sm bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="w-1/2">
                <span className="block text-gray-500 text-xs font-bold uppercase">Check-in</span>
                <span className="font-bold text-gray-800 break-words">{meta.checkIn || '12:00 PM'}</span>
              </div>
              <div className="w-1/2 border-l border-gray-200 pl-4">
                <span className="block text-gray-500 text-xs font-bold uppercase">Check-out</span>
                <span className="font-bold text-gray-800 break-words">{meta.checkOut || '11:00 AM'}</span>
              </div>
            </div>

            {meta.roomPrices && (
              <div className="mb-6 space-y-3">
                <h4 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-2 mb-3">Available Rooms</h4>
                {Object.entries(meta.roomPrices).map(([room, price]) => {
                  if (!price) return null;
                  const roomCount = meta.roomCounts?.[room];
                  
                  return (
                    <div key={room} className="flex justify-between items-center text-sm gap-2 border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                      <div className="flex flex-col flex-1">
                        <span className="text-gray-700 font-medium break-words">{room}</span> 
                        {roomCount && (
                          <span className="text-xs text-green-600 font-bold mt-0.5">{roomCount} Room(s) Left</span>
                        )}
                      </div>
                      <span className="font-bold text-blue-700 whitespace-nowrap">₹{price as string}</span>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mt-4">
              <p className="text-xs text-blue-800 font-medium text-center break-words">
                Click the WhatsApp button to check availability and book your stay! 💬
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}