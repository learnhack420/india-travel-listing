import { supabase } from '../../../utils/supabase'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import TourBookingSidebar from '../../components/TourBookingSidebar'
import AIAutoRoutePlanner from '../../components/AIAutoRoutePlanner'
// 🌟 NAYA COMPONENT IMPORT KIYA HAI
import AIAutoFAQs from '../../components/AIAutoFAQs'
import VendorInfoCard from '../../components/VendorInfoCard'
import RelatedTourSections from '../../components/RelatedTourSections'

export const revalidate = 60

const formatLocation = (locStr?: string) => {
  if (!locStr) return 'Not specified'
  return locStr.replace(/ > /g, ', ')
}

// String safety function for SEO descriptions to remove accidental HTML tags
const cleanTextForSEO = (htmlString: any) => {
  if (!htmlString || typeof htmlString !== 'string') return "";
  return String(htmlString).replace(/(<([^>]+)>)/gi, "").replace(/&nbsp;/gi, " ").trim();
};

// 🌟 SEO UPGRADE 1: Advanced Metadata with Canonical URLs, OpenGraph, and Robots
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params
  const slug = resolvedParams.slug

  let { data: tour } = await supabase.from('listings').select('*').eq('slug', slug).single()
  
  if (!tour) {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)
    if (isUUID) {
      const { data: tourById } = await supabase.from('listings').select('*').eq('id', slug).single()
      tour = tourById
    }
  }

  if (!tour) return { title: 'Tour Not Found' }

  const seo = tour.metadata?.seo || {}
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.indiatouroperators.com'
  const currentUrl = `${siteUrl}/tour/${slug}`
  const thumbnail = tour.metadata?.thumbnail || tour.metadata?.gallery?.[0] || `${siteUrl}/default-tour.jpg`
  
  const rawDescription = seo.metaDescription || tour.metadata?.shortDescription || `Book the ultimate ${tour.title}. Explore the best itinerary, places to visit, and inclusions. Get guaranteed best prices from verified local operators.`
  const cleanDescription = cleanTextForSEO(rawDescription).substring(0, 160)

  return {
    title: seo.metaTitle || `${tour.title} - Best Tour Package | India Tour Operators`,
    description: cleanDescription,
    keywords: seo.metaKeywords || `${tour.title}, ${formatLocation(tour.location)} tour package, sightseeing in ${formatLocation(tour.location)}, book cab, travel agency, vacation package`,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: currentUrl,
    },
    openGraph: {
      title: seo.metaTitle || tour.title,
      description: cleanDescription,
      url: currentUrl,
      siteName: 'India Tour Operators',
      type: 'website',
      images: [{ url: thumbnail, width: 1200, height: 630, alt: tour.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.metaTitle || tour.title,
      description: cleanDescription,
      images: [thumbnail],
    }
  }
}

export default async function TourDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params
  const slug = resolvedParams.slug

  let { data: tour } = await supabase.from('listings').select('*').eq('slug', slug).single()

  if (!tour) {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)
    if (isUUID) {
      const { data: tourById } = await supabase.from('listings').select('*').eq('id', slug).single()
      tour = tourById
    }
  }

  if (!tour) return notFound() 

  const meta = tour.metadata || {}
  
  const locationParts = tour.location ? tour.location.split('➔').map((s: string) => s.trim()) : []
  const rawOrigin = locationParts.length > 0 ? locationParts[0] : 'Not specified'
  const rawDestinations = locationParts.length > 1 ? locationParts[1] : tour.location

  const origin = formatLocation(rawOrigin)
  const destinationsCovered = formatLocation(rawDestinations)
  const targetCity = destinationsCovered !== 'Not specified' ? destinationsCovered.split(',')[0].trim() : '';

  const thumbnail = meta.thumbnail || (meta.gallery && meta.gallery.length > 0 ? meta.gallery[0] : 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&q=80&w=1200')
  const gallery = meta.gallery || []
  
  const placesToVisitStr = meta.placesToVisit && meta.placesToVisit.length > 0 
    ? meta.placesToVisit.join(', ') 
    : destinationsCovered
    
  const isLocalTour = rawOrigin.toLowerCase() === rawDestinations.toLowerCase()

  const formatTime12hr = (time24: string) => {
    if (!time24) return ''
    const [h, m] = time24.split(':')
    const hours = parseInt(h, 10)
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const formattedHours = hours % 12 || 12
    return `${formattedHours}:${m} ${ampm}`
  }
  const pickupTimesStr = meta.pickupTimes && meta.pickupTimes.length > 0
    ? meta.pickupTimes.map(formatTime12hr).join(', ')
    : 'Flexible / Not fixed'

  const bestTimeToVisitText = meta.bestTimeToVisit || ''
  const bestMonths = meta.bestMonths || []
  const itineraryDays = meta.itineraryDays || []

  const formatListWithEmoji = (text: string, emoji: string) => {
    if (!text) return null
    return text.split('\n').filter(line => line.trim() !== '').map((line, idx) => (
      <div key={idx} className="flex items-start gap-2 mt-1">
        <span>{emoji}</span>
        <span className="flex-1">{line.replace(/^[✅❌\-\*]\s*/, '')}</span>
      </div>
    ))
  }

  // 🌟 SEO UPGRADE 2: JSON-LD Structured Data Enhanced
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.indiatouroperators.com'
  
  // 1. Breadcrumb Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": `${siteUrl}/` },
      { "@type": "ListItem", "position": 2, "name": "Tours", "item": `${siteUrl}/tours` },
      { "@type": "ListItem", "position": 3, "name": tour.title, "item": `${siteUrl}/tour/${slug}` }
    ]
  };

  // Build Image Array for Google Rich Snippets
  const schemaImages = [thumbnail, ...gallery].filter(Boolean);

  // Parse price safely for schema
  const parsedPrice = meta.price ? Number(meta.price.toString().replace(/[^0-9.]/g, '')) : (tour.price || 0);

  // 2. TouristTrip Schema (Enhanced for Rich Snippets)
  const tourSchema = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    "name": tour.title,
    "description": cleanTextForSEO(meta.seo?.metaDescription || meta.shortDescription || `Enjoy a wonderful trip to ${destinationsCovered}.`),
    "image": schemaImages,
    "touristType": ["Sightseeing", "Cultural", "Leisure", "Road Trip"],
    "provider": {
      "@type": "TravelAgency",
      "name": "India Tour Operators",
      "url": siteUrl
    },
    "itinerary": {
      "@type": "ItemList",
      "itemListElement": itineraryDays.map((day: any, idx: number) => ({
        "@type": "ListItem",
        "position": idx + 1,
        "name": `Day ${day.day}: ${day.title}`,
        "description": cleanTextForSEO(day.description)
      }))
    },
    ...(parsedPrice > 0 && {
      "offers": {
        "@type": "Offer",
        "price": parsedPrice,
        "priceCurrency": "INR",
        "availability": "https://schema.org/InStock",
        "url": `${siteUrl}/tour/${slug}`
      }
    })
  };

  // 3. FAQ Schema
  const faqSchema = meta.faqs && meta.faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": meta.faqs.map((faq: any) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": { "@type": "Answer", "text": cleanTextForSEO(faq.answer) }
    }))
  } : null;

  return (
    <main className="min-h-screen bg-gray-50 pb-20 font-sans selection:bg-blue-200 selection:text-blue-900">
      
      {/* --- INJECT GOOGLE SCHEMAS --- */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(tourSchema) }} />
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}

      {/* Hero Image */}
      <div className="relative h-[400px] md:h-[550px] w-full bg-gray-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={thumbnail} alt={`${tour.title} package from ${origin} to ${destinationsCovered}`} title={tour.title} className="w-full h-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 max-w-7xl mx-auto">
          {/* 🌟 SEO UPGRADE 3: UI Breadcrumbs */}
          <nav aria-label="breadcrumb" className="flex items-center text-xs md:text-sm text-gray-300 font-bold mb-6 overflow-x-auto whitespace-nowrap">
            <Link href="/" className="hover:text-white transition-colors flex items-center gap-1" title="Go to Homepage">🏠 Home</Link>
            <span className="mx-2 text-gray-500">/</span>
            <Link href="/tours" className="hover:text-white transition-colors" title="View all tours">Tours</Link>
            <span className="mx-2 text-gray-500">/</span>
            <span className="text-white truncate" aria-current="page">{tour.title}</span>
          </nav>

          <span className="bg-blue-600 text-white text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-md">
            Verified Tour Package
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-white mt-5 leading-tight drop-shadow-lg">{tour.title}</h1>
          <div className="flex flex-wrap items-center gap-5 mt-5 text-gray-200 font-bold text-lg">
            <span className="flex items-center gap-2 bg-slate-800/50 backdrop-blur-sm px-4 py-2 rounded-xl" title="Location">📍 {formatLocation(tour.location)}</span>
            <span className="flex items-center gap-2 bg-slate-800/50 backdrop-blur-sm px-4 py-2 rounded-xl" title="Duration">⏱️ {meta.duration || 'Custom Duration'}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Content Column */}
        <div className="lg:col-span-2 space-y-10">
          
          <section className="bg-white p-0 rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-5 md:p-8">
              <h2 className="text-2xl md:text-3xl font-black text-white">📋 Information of {tour.title} </h2>
              <p className="text-blue-100 text-sm md:text-base mt-2 font-medium">Key details about {tour.title}</p>
            </div>
            
            <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex items-start gap-4">
                <div className="bg-blue-50 p-4 rounded-2xl text-blue-600 text-2xl">🛫</div>
                <div>
                  <span className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Start From (Origin)</span>
                  <span className="font-black text-gray-900 text-xl">{origin}</span>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-green-50 p-4 rounded-2xl text-green-600 text-2xl">🎯</div>
                <div>
                  <span className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Destinations Covered</span>
                  <span className="font-black text-gray-900 text-xl">{destinationsCovered}</span>
                </div>
              </div>

              <div className="md:col-span-2 flex items-start gap-4 pt-6 border-t border-gray-100">
                <div className="bg-purple-50 p-4 rounded-2xl text-purple-600 text-2xl">📸</div>
                <div className="w-full">
                  <span className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                    Places to Visit {targetCity ? `in ${targetCity}` : ''}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {placesToVisitStr.split(',').map((place: string, idx: number) => (
                      <span key={idx} className="bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold border border-gray-200 shadow-sm">
                        {place.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 flex items-start gap-4 pt-6 border-t border-gray-100">
                <div className="bg-orange-50 p-4 rounded-2xl text-orange-600 text-2xl">⏰</div>
                <div>
                  <span className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Fixed Pickup Times</span>
                  <span className="font-bold text-gray-900 text-lg">{pickupTimesStr}</span>
                </div>
              </div>

              {(bestTimeToVisitText || bestMonths.length > 0) && (
                <div className="md:col-span-2 bg-amber-50 rounded-2xl p-6 border border-amber-100 mt-2">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">🌤️</span>
                    <h3 className="text-xl font-black text-amber-900">
                      Best Time to Visit {targetCity ? `in ${targetCity}` : ''}
                    </h3>
                  </div>
                  
                  {bestTimeToVisitText && (
                    <p className="text-amber-800 text-base font-medium mb-4 leading-relaxed">
                      {bestTimeToVisitText}
                    </p>
                  )}

                  {bestMonths.length > 0 && (
                    <div>
                      <span className="block text-xs font-black text-amber-700 uppercase tracking-widest mb-3">Recommended Months:</span>
                      <div className="flex flex-wrap gap-2">
                        {bestMonths.map((month: string, idx: number) => (
                          <span key={idx} className="bg-amber-200/50 text-amber-900 px-4 py-1.5 rounded-lg text-sm font-bold border border-amber-200 shadow-sm">
                            {month}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          </section>

          {gallery.length > 0 && (
            <section className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-gray-200">
              <h2 className="text-3xl font-black text-gray-900 mb-6 border-b border-gray-100 pb-4">Tour Gallery</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                {gallery.map((imgUrl: string, idx: number) => (
                  <div key={idx} className="h-40 md:h-48 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 relative group cursor-pointer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imgUrl} alt={`${tour.title} highlights - ${destinationsCovered} - Image ${idx+1}`} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 🌟 OVERVIEW FIX: Added Replace hacks for escaped HTML from visual editor */}
          {meta.overview && (
            <section className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
              <h2 className="text-3xl font-black text-gray-900 mb-6 border-b border-gray-100 pb-4">Overview of {tour.title}</h2>
              <div 
                className="prose prose-lg max-w-none text-gray-600 leading-loose break-words overflow-x-auto marker:text-blue-500" 
                dangerouslySetInnerHTML={{ 
                  __html: meta.overview
                    .replace(/&nbsp;/g, ' ')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                }} 
              />
            </section>
          )}

          {/* 🌟 ITINERARY FIX: Switched to prose block and added Replace hacks for escaped HTML */}
          {(itineraryDays.length > 0 || meta.itinerary) && (
            <section className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-gray-200">
              <h2 className="text-3xl font-black text-gray-900 mb-8 border-b border-gray-100 pb-4">
                Itinerary of {tour.title}
              </h2>
              {itineraryDays.length > 0 ? (
                <div className="space-y-8">
                  {itineraryDays.map((day: any, idx: number) => (
                    <div key={idx} className="relative pl-8 border-l-4 border-blue-100">
                      <div className="absolute w-6 h-6 bg-blue-600 rounded-full -left-[15px] top-1 ring-8 ring-blue-50 flex items-center justify-center text-[10px] font-black text-white">{day.day}</div>
                      <h3 className="text-xl font-black text-gray-900">Day {day.day}: {day.title}</h3>
                      <div 
                        className="mt-3 prose prose-sm sm:prose-base max-w-none text-gray-600 leading-relaxed marker:text-blue-500"
                        dangerouslySetInnerHTML={{ 
                          __html: day.description
                            .replace(/&nbsp;/g, ' ')
                            .replace(/&lt;/g, '<')
                            .replace(/&gt;/g, '>')
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div 
                  className="prose prose-lg max-w-none text-gray-600 leading-relaxed marker:text-blue-500"
                  dangerouslySetInnerHTML={{ 
                    __html: meta.itinerary
                      .replace(/&nbsp;/g, ' ')
                      .replace(/&lt;/g, '<')
                      .replace(/&gt;/g, '>')
                  }} 
                />
              )}
            </section>
          )}

          {(meta.inclusions || meta.exclusions) && (
            <section className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-gray-200">
              <h2 className="text-3xl font-black text-gray-900 mb-8 border-b border-gray-100 pb-4">
                What is Including and Not including in {tour.title}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {meta.inclusions && (
                  <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100">
                    <h3 className="text-xl font-black text-emerald-900 mb-5 flex items-center gap-3"><span className="text-2xl">✅</span> Price Includes</h3>
                    <div className="text-emerald-800 text-base space-y-2 font-medium">
                      {formatListWithEmoji(meta.inclusions, '✅')}
                    </div>
                  </div>
                )}
                {meta.exclusions && (
                  <div className="bg-red-50/50 p-6 rounded-2xl border border-red-100">
                    <h3 className="text-xl font-black text-red-900 mb-5 flex items-center gap-3"><span className="text-2xl">❌</span> Not Included</h3>
                    <div className="text-red-800 text-base space-y-2 font-medium">
                      {formatListWithEmoji(meta.exclusions, '❌')}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          <section className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-gray-200">
            <h2 className="text-3xl font-black text-gray-900 mb-8 border-b border-gray-100 pb-4">
              {isLocalTour ? "Local Sightseeing Map" : "How to Reach & Route Map"}
            </h2>
            
            <div className="flex flex-col gap-8">
              <div className="space-y-6">
                {isLocalTour ? (
                  <>
                    <p className="text-base text-gray-600 font-medium mb-2">
                      Explore the best local attractions in <strong className="text-gray-900">{destinationsCovered}</strong>:
                    </p>
                    
                    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex gap-5 items-start">
                      <span className="text-3xl">🚖</span>
                      <div>
                        <h4 className="font-black text-blue-900 text-lg">Local Cab Booking</h4>
                        <p className="text-sm text-blue-800 mt-2 leading-relaxed">Book our comfortable local cabs directly from the sidebar. We provide convenient pickup and drop for all sightseeing points.</p>
                      </div>
                    </div>

                    <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 flex gap-5 items-start">
                      <span className="text-3xl">📸</span>
                      <div>
                        <h4 className="font-black text-purple-900 text-lg">Key Attractions</h4>
                        <p className="text-sm text-purple-800 mt-2 leading-relaxed">This package covers major attractions. You can customize your local itinerary and spend as much time as you need at each spot.</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <AIAutoRoutePlanner 
                    origin={origin} 
                    destination={destinationsCovered} 
                  />
                )}
              </div>
            </div>
          </section>

          {/* 🌟 NAYA AI FAQs COMPONENT */}
          <AIAutoFAQs 
            origin={origin} 
            destination={destinationsCovered} 
            tourName={tour.title}
            existingFaqs={meta.faqs} 
          />

          {tour?.vendor_id && <VendorInfoCard vendorId={tour.vendor_id} />}

        </div>

        {/* Right Sidebar */}
        <aside className="lg:col-span-1">
          <div className="sticky top-6">
            <TourBookingSidebar tour={tour} meta={meta} destinations={destinationsCovered} />
          </div>
        </aside>

      </div>

      {/* Related Sections */}
      <RelatedTourSections 
        tourId={tour.id} 
        vendorId={tour.vendor_id} 
        location={tour.location} 
        targetCity={targetCity} 
        originCity={origin} // 👈 Yeh line zaroor honi chahiye
      />
    </main>
  )
}