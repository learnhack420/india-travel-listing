import { supabase } from '@/utils/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import CabBookingSidebar from '@/app/components/CabBookingSidebar'
import AIAutoRoutePlanner from '@/app/components/AIAutoRoutePlanner'
import VendorInfoCard from '@/app/components/VendorInfoCard'
import RelatedCabSections from '@/app/components/RelatedCabSections'



export const revalidate = 60

// 🌟 Helper function to clean the new location format
const formatLocation = (locStr?: string) => {
  if (!locStr) return 'N/A'
  return locStr.replace(/ > /g, ', ')
}

// 🌟 SEO UPGRADE 1: Advanced Metadata with Canonical URLs & OpenGraph
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params
  const { data: cab } = await supabase.from('listings').select('title, location, category, metadata').eq('slug', resolvedParams.slug).single()
  
  if (!cab) return { title: 'Not Found' }
  
  const cleanLocation = cab.location ? cab.location.replace(/ > /g, ', ') : 'India'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.indiatouroperators.com'
  const currentUrl = `${siteUrl}/cabs/${resolvedParams.slug}`
  
  const meta = cab.metadata || {}
  const thumbnail = meta.gallery && meta.gallery.length > 0 ? meta.gallery[0] : `${siteUrl}/default-cab.jpg`

  return {
    title: meta.seo?.metaTitle || `${cab.title} - Book Best Cabs in ${cleanLocation}`,
    description: meta.seo?.metaDescription || `Book reliable and comfortable outstation and local cabs for ${cab.title}. Best prices guaranteed for your trip.`,
    keywords: meta.seo?.metaKeywords || `cab booking ${cleanLocation}, outstation cab, taxi service ${cleanLocation}, rent a car`,
    alternates: {
      canonical: currentUrl,
    },
    openGraph: {
      title: meta.seo?.metaTitle || `${cab.title} - Book Best Cabs`,
      description: meta.seo?.metaDescription || `Book reliable cabs for ${cab.title}. Best prices guaranteed.`,
      url: currentUrl,
      type: 'website',
      images: [{ url: thumbnail, width: 1200, height: 630, alt: cab.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.seo?.metaTitle || cab.title,
      description: meta.seo?.metaDescription || `Reliable outstation and local cabs for ${cab.title}.`,
      images: [thumbnail],
    }
  }
}

export default async function CabDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params
  const slug = resolvedParams.slug

  let { data: cab, error } = await supabase.from('listings').select('*').eq('slug', slug).single()

  if (error || !cab) {
    const { data: cabById } = await supabase.from('listings').select('*').eq('id', slug).single()
    if (!cabById) return notFound()
    cab = cabById
  }

  // Security check: Only show cab categories
  if (cab.category !== 'cab') {
    return notFound()
  }

  const meta = cab.metadata || {}
  
  // Extract Origins and Destinations FIRST to filter Tourist Places
  const rawOrigin = meta.pickupCity || meta.pickupPoint || meta.serviceCity || cab.location || 'India';
  const rawDrop = meta.dropCity || meta.dropPoint || cab.location || 'Destination';
  
  const aiOrigin = rawOrigin.replace(/ > /g, ', ').split(' to ')[0].trim();
  const aiDrop = rawDrop.replace(/ > /g, ', ').split(' to ').pop()?.trim() || '';
  
  // Clean Target City for filtering Places
  const targetCity = aiDrop !== 'Destination' ? aiDrop : (cab.location ? cab.location.split(' > ').pop()?.trim() : '');

  const gallery = meta.gallery && meta.gallery.length > 0 
    ? meta.gallery 
    : ['https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=1200']

  const isLocal = meta.mainType === 'Local';
  const isOutstation = meta.mainType === 'Outstation';

  // 🌟 SEO UPGRADE 2: JSON-LD Structured Data for TaxiService
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.indiatouroperators.com';
  
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": `${siteUrl}/` },
      { "@type": "ListItem", "position": 2, "name": "Cabs", "item": `${siteUrl}/cabs` },
      { "@type": "ListItem", "position": 3, "name": cab.title, "item": `${siteUrl}/cabs/${slug}` }
    ]
  };

  // Find minimum price for schema
  const cabPrices = meta.cabPrices || {};
  const prices = Object.values(cabPrices).filter((p: any) => p && p.amount).map((p: any) => Number(p.amount));
  const minPrice = prices.length > 0 ? Math.min(...prices) : undefined;

  const taxiServiceSchema = {
    "@context": "https://schema.org",
    "@type": "TaxiService",
    "name": cab.title,
    "description": meta.description || `Reliable cab services from ${aiOrigin} to ${aiDrop}.`,
    "provider": {
      "@type": "Organization",
      "name": "India Tour Operators"
    },
    "areaServed": {
      "@type": "Place",
      "name": aiOrigin
    },
    ...(minPrice && {
      "offers": {
        "@type": "Offer",
        "priceCurrency": "INR",
        "price": minPrice,
        "availability": "https://schema.org/InStock",
        "url": `${siteUrl}/cabs/${slug}`
      }
    })
  };

  // 🌟 AUTO-GENERATED SEO FAQs (If vendor forgets to add them)
  const defaultFaqs = [
    {
      question: `How can I book a cab for ${cab.title}?`,
      answer: `Booking is simple! Just select your preferred vehicle from the sidebar, fill in your travel details, and confirm your booking instantly via WhatsApp.`
    },
    {
      question: `What types of cabs are available from ${aiOrigin} to ${aiDrop || targetCity}?`,
      answer: `We offer a wide range of well-maintained vehicles including Hatchbacks, Sedans, SUVs, and premium options like Innova Crysta to suit your needs.`
    },
    {
      question: `Are toll taxes and parking charges included in the fare?`,
      answer: `Please check the 'Included & Not Included' section above. We maintain 100% transparent pricing so you know exactly what you are paying for.`
    },
    {
      question: `Is it safe to travel at night with your cab service?`,
      answer: `Absolutely. Your safety is our top priority. We provide highly experienced, background-verified drivers and our cabs are tracked for a secure journey 24/7.`
    },
    {
      question: `Can I customize my trip or add multiple stops?`,
      answer: `Yes! Our ${meta.subType || 'cab'} services are highly flexible. You can discuss any custom stops or detours with our support team while confirming your booking.`
    }
  ];

  // Logic: Pehle check karo ki vendor ne jo FAQ daale hain wo khali to nahi hain
const validVendorFaqs = (meta.faqs || []).filter((f: any) => f && f.question && f.question.trim() !== '' && f.answer && f.answer.trim() !== '');

// Agar valid FAQs hain to wo dikhao, warna default 5 AI FAQs dikhao
const displayFaqs = validVendorFaqs.length > 0 ? validVendorFaqs : defaultFaqs;

  const faqSchema = displayFaqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": displayFaqs.map((faq: any) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": { "@type": "Answer", "text": faq.answer }
    }))
  } : null;

  return (
    <main className="min-h-screen bg-slate-50 pb-20 font-sans text-slate-800">
      
      {/* --- INJECT GOOGLE SCHEMAS --- */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(taxiServiceSchema) }} />
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}

      {/* Hero Section */}
      <div className="relative h-[40vh] md:h-[50vh] w-full bg-slate-900 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={gallery[0]} alt={`${cab.title} - Cab Booking`} className="w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 max-w-6xl mx-auto">
          
          <nav className="flex items-center text-xs md:text-sm text-gray-300 font-bold mb-6 overflow-x-auto whitespace-nowrap drop-shadow-md">
            <Link href="/" className="hover:text-yellow-400 transition-colors flex items-center gap-1">🏠 Home</Link>
            <span className="mx-2 text-gray-500">/</span>
            <Link href="/cabs" className="hover:text-yellow-400 transition-colors">Cabs</Link>
            <span className="mx-2 text-gray-500">/</span>
            <span className="text-white truncate">{cab.title}</span>
          </nav>

          <div className="mb-4">
            <span className="bg-yellow-500 text-yellow-950 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-md inline-block">
              Verified Cab Service
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight drop-shadow-lg">{cab.title}</h1>
          
          <p className="text-slate-200 mt-3 text-lg md:text-xl font-medium flex items-center gap-2 drop-shadow-md">
            📍 {formatLocation(cab.location)}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 mt-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* LEFT COLUMN: MAIN CONTENT */}
        <div className="lg:col-span-2 space-y-10">
          
          <section className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-200">
            {/* 🌟 SEO UPGRADE: Dynamic Title for Overview */}
            <h2 className="text-3xl font-black text-slate-900 mb-8 border-b border-slate-100 pb-4 tracking-tight">Overview of {cab.title}</h2>
            
            {/* 1. Trip Type & Service Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-slate-700 mb-8">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <span className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Trip Type:</span>
                <span className="font-bold text-lg text-slate-800">{meta.mainType || 'Local'}</span>
              </div>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <span className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Service Type:</span>
                <span className="font-bold text-lg text-slate-800">{meta.subType || 'Point to Point'}</span>
              </div>
            </div>

            {/* 2. Route & Details */}
            <div className="bg-slate-50 p-6 md:p-8 rounded-3xl border border-slate-100 mb-10">
              <h3 className="text-xl font-black text-slate-900 mb-6">Route & Details:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {meta.mainType === 'Local' && meta.subType === 'Point to Point' && (
                  <>
                    <div>
                      <span className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Pickup Point</span>
                      <span className="font-bold text-slate-800 text-lg">{formatLocation(meta.pickupPoint)}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Drop Point</span>
                      <span className="font-bold text-slate-800 text-lg">{formatLocation(meta.dropPoint)}</span>
                    </div>
                  </>
                )}

                {meta.mainType === 'Local' && meta.subType === 'Local Rental' && (
                  <>
                    <div>
                      <span className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Service City</span>
                      <span className="font-bold text-slate-800 text-lg">{formatLocation(meta.serviceCity)}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Rental Package</span>
                      <span className="font-bold text-slate-800 text-lg">{meta.rentalPackage || 'N/A'}</span>
                    </div>
                  </>
                )}

                {meta.mainType === 'Outstation' && meta.subType === 'One Way' && (
                  <>
                    <div>
                      <span className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Pickup City</span>
                      <span className="font-bold text-slate-800 text-lg">{formatLocation(meta.pickupCity)}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Drop City</span>
                      <span className="font-bold text-slate-800 text-lg">{formatLocation(meta.dropCity)}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Distance (km)</span>
                      <span className="font-bold text-slate-800 text-lg">{meta.distance ? `${meta.distance} KM` : 'N/A'}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Night Charge (9pm-6am)</span>
                      <span className="font-bold text-slate-800 text-lg">{meta.nightCharge ? `₹${meta.nightCharge}` : 'N/A'}</span>
                    </div>
                  </>
                )}

                {meta.mainType === 'Outstation' && meta.subType === 'Round Trip' && (
                  <>
                    <div>
                      <span className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Pickup City</span>
                      <span className="font-bold text-slate-800 text-lg">{formatLocation(meta.pickupCity)}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Destination City</span>
                      <span className="font-bold text-slate-800 text-lg">{formatLocation(meta.dropCity)}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Estimated Distance (km)</span>
                      <span className="font-bold text-slate-800 text-lg">{meta.distance ? `${meta.distance} KM` : 'N/A'}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Min KM per Day Limit</span>
                      <span className="font-bold text-slate-800 text-lg">{meta.minKmPerDay ? `${meta.minKmPerDay} KM` : 'N/A'}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 3. Description */}
            {meta.description && (
              <div className="mb-10">
                <h3 className="text-xl font-black text-slate-900 mb-4">Description:</h3>
                <div className="text-slate-700 text-base leading-relaxed whitespace-pre-wrap">
                  {meta.description}
                </div>
              </div>
            )}

            {/* 4. Included & Not Included */}
            <div className="mb-10">
              <h2 className="text-3xl font-black text-slate-900 mb-8 border-b border-slate-100 pb-4 tracking-tight">
                What is Included and Not Included in {cab.title}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-emerald-50 p-6 md:p-8 rounded-3xl border border-emerald-100 shadow-sm">
                  <h3 className="text-xl font-black text-emerald-950 mb-4 flex items-center gap-2">Included:</h3>
                  <ul className="text-emerald-900 font-medium space-y-3">
                    {meta.tollCharges === 'Yes' && <li className="flex items-center gap-2"><span className="text-emerald-500 text-lg leading-none">✓</span> Toll Charges</li>}
                    {meta.parkingCharges === 'Yes' && <li className="flex items-center gap-2"><span className="text-emerald-500 text-lg leading-none">✓</span> Parking Charges</li>}
                    {meta.driverDa === 'Yes' && meta.subType !== 'Round Trip' && <li className="flex items-center gap-2"><span className="text-emerald-500 text-lg leading-none">✓</span> Driver Allowance</li>}
                    
                    {meta.customInclusions && meta.customInclusions.length > 0 && meta.customInclusions.map((item: string, idx: number) => (
                      <li key={`inc-${idx}`} className="flex items-center gap-2">
                        <span className="text-emerald-500 text-lg leading-none">✓</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-rose-50 p-6 md:p-8 rounded-3xl border border-rose-100 shadow-sm">
                  <h3 className="text-xl font-black text-rose-950 mb-4 flex items-center gap-2">Not Included:</h3>
                  <ul className="text-rose-900 font-medium space-y-3">
                    {meta.tollCharges === 'No' && <li className="flex items-center gap-2"><span className="text-rose-500 text-lg leading-none">✕</span> Toll Charges</li>}
                    {meta.parkingCharges === 'No' && <li className="flex items-center gap-2"><span className="text-rose-500 text-lg leading-none">✕</span> Parking Charges</li>}
                    {meta.driverDa === 'No' && meta.subType !== 'Round Trip' && <li className="flex items-center gap-2"><span className="text-rose-500 text-lg leading-none">✕</span> Driver Allowance</li>}
                    
                    {meta.customExclusions && meta.customExclusions.length > 0 && meta.customExclusions.map((item: string, idx: number) => (
                      <li key={`exc-${idx}`} className="flex items-center gap-2">
                        <span className="text-rose-500 text-lg leading-none">✕</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* ============================================================== */}
          {/* 🔥 NEW SEO UPGRADES: BENEFITS, SAFETY, FLEET & TESTIMONIALS 🔥 */}
          {/* ============================================================== */}
          
          <section className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-200">
            <h2 className="text-3xl font-black text-slate-900 mb-6 tracking-tight border-b border-slate-100 pb-4">
              Why Book {cab.title} With Us?
            </h2>
            
            <p className="text-slate-600 mb-8 font-medium leading-relaxed">
              Whether you need a reliable <strong>cab from {aiOrigin} airport to {targetCity || aiDrop}</strong>, or a quick <strong>taxi from {aiOrigin} railway station</strong>, we ensure a premium and comfortable journey. Our fleet includes well-maintained Hatchbacks, Sedans, SUVs, and Innova Crystas to suit your family size and luggage needs.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex gap-4 items-start">
                <span className="text-3xl">🛡️</span>
                <div>
                  <h3 className="font-bold text-blue-900 text-lg">Safety & Hygiene First</h3>
                  <p className="text-blue-800 text-sm mt-1">100% verified, experienced drivers. Cabs are thoroughly cleaned and sanitized before every trip to {targetCity || aiDrop}.</p>
                </div>
              </div>
              
              <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 flex gap-4 items-start">
                <span className="text-3xl">💸</span>
                <div>
                  <h3 className="font-bold text-emerald-900 text-lg">Transparent Pricing</h3>
                  <p className="text-emerald-800 text-sm mt-1">No hidden charges or surprise tolls. What you see is what you pay for your {aiOrigin} to {aiDrop} taxi service.</p>
                </div>
              </div>
              
              <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 flex gap-4 items-start">
                <span className="text-3xl">🚪</span>
                <div>
                  <h3 className="font-bold text-purple-900 text-lg">Door-to-Door Pickup</h3>
                  <p className="text-purple-800 text-sm mt-1">We pick you up directly from your home, hotel, or airport in {aiOrigin} and drop you precisely at your destination.</p>
                </div>
              </div>

              <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 flex gap-4 items-start">
                <span className="text-3xl">🎧</span>
                <div>
                  <h3 className="font-bold text-orange-900 text-lg">24/7 Customer Support</h3>
                  <p className="text-orange-800 text-sm mt-1">Our booking and trip assistance helpline is always open to ensure a hassle-free journey.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-slate-900 text-white p-8 md:p-10 rounded-3xl shadow-md">
            <h2 className="text-3xl font-black mb-8 text-center tracking-tight">How to Book Your Cab in 3 Steps</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-0.5 bg-slate-700"></div>
              
              <div className="text-center relative z-10">
                <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-4 border-4 border-slate-900">1</div>
                <h3 className="font-bold text-lg mb-2">Check Prices</h3>
                <p className="text-slate-400 text-sm">Review our cab options (Sedan, SUV, etc.) and transparent pricing in the sidebar.</p>
              </div>
              
              <div className="text-center relative z-10">
                <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-4 border-4 border-slate-900">2</div>
                <h3 className="font-bold text-lg mb-2">Fill Details</h3>
                <p className="text-slate-400 text-sm">Enter your pickup time, date, and exact location in {aiOrigin}.</p>
              </div>
              
              <div className="text-center relative z-10">
                <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-4 border-4 border-slate-900">3</div>
                <h3 className="font-bold text-lg mb-2">Confirm on WhatsApp</h3>
                <p className="text-slate-400 text-sm">Click book, and instantly confirm your ride with our operator via WhatsApp!</p>
              </div>
            </div>
          </section>

          {/* ============================================================== */}
          
          {/* 5. Route & Map Section */}
          <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-200">
            {meta.howToReach && (
              <div className="mb-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">Route Information</h3>
                <p className="text-slate-700 leading-relaxed font-medium">{meta.howToReach}</p>
              </div>
            )}

            <AIAutoRoutePlanner 
              origin={aiOrigin} 
              destination={aiDrop} 
            />
          </div>

          {/* 6. Frequently Asked Questions (Dynamically populated if empty) */}
          {displayFaqs.length > 0 && (
            <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-200">
              <h3 className="text-3xl font-black text-slate-900 mb-6 tracking-tight border-b border-slate-100 pb-3">Frequently Asked Questions</h3>
              <div className="space-y-5">
                {displayFaqs.map((faq: any, idx: number) => (
                  <div key={idx} className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                    <h4 className="font-bold text-slate-900 text-lg flex items-start gap-3">
                      <span className="text-blue-500 text-xl leading-none mt-0.5">Q.</span> 
                      <span>{faq.question}</span>
                    </h4>
                    <p className="text-slate-600 font-medium mt-2 flex items-start gap-3 md:pl-8">
                      <span className="text-slate-400 font-bold text-lg leading-none mt-0.5 md:hidden">A.</span> 
                      <span>{faq.answer}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 🌟 SEO UPGRADE: Customer Testimonials */}
          <section className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-200">
            <h2 className="text-3xl font-black text-slate-900 mb-8 border-b border-slate-100 pb-4 tracking-tight">What Our Customers Say</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="text-yellow-400 text-xl mb-3">★★★★★</div>
                <p className="text-slate-700 italic mb-4">"Booked a cab from {aiOrigin} airport to {targetCity || aiDrop}. The driver was waiting for us with a name board. Very clean Innova and a smooth ride!"</p>
                <div className="font-bold text-slate-900 text-sm">— Rahul S.</div>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="text-yellow-400 text-xl mb-3">★★★★★</div>
                <p className="text-slate-700 italic mb-4">"Best taxi service for {aiDrop}. I compared prices with other apps, but this was more transparent with no hidden night charges."</p>
                <div className="font-bold text-slate-900 text-sm">— Priya M.</div>
              </div>
            </div>
          </section>

          {/* 7. VENDOR INFO CARD */}
          <div className="mt-10 pt-6">
            <VendorInfoCard vendorId={cab?.vendor_id || 'default-fallback'} />
          </div>

          {/* 8. Cab Gallery */}
          {gallery.length > 1 && (
            <section className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-200">
              <h2 className="text-3xl font-black text-slate-900 mb-6 border-b border-slate-100 pb-4 tracking-tight">Cab Gallery</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                {gallery.slice(1).map((imgUrl: string, idx: number) => (
                  <div key={idx} className="h-32 md:h-40 rounded-2xl overflow-hidden bg-slate-100 relative group cursor-pointer shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imgUrl} alt={`Cab from ${aiOrigin} to ${aiDrop} - View ${idx+1}`} className="absolute w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out" />
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>

        {/* RIGHT COLUMN: SIDEBAR (Booking Box) */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <CabBookingSidebar cab={cab} meta={meta} />
          </div>
        </div>

      </div>

      {/* 🌟 NEW CLIENT-SIDE FETCHED BOTTOM SECTIONS */}
      <RelatedCabSections 
        cabId={cab.id} 
        vendorId={cab.vendor_id} 
        location={cab.location} 
        targetCity={targetCity} 
      />

    </main>
  )
}