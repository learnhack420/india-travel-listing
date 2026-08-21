import { supabase } from '../../../utils/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import FloatingContact from '../../components/FloatingContact'
import RelatedPlaceSections from '../../components/RelatedPlaceSections'
import AITouristGuide from '../../components/AITouristGuide'

export const revalidate = 60 

const cleanText = (htmlString: string) => {
  if (!htmlString) return "";
  return htmlString
    .replace(/(<([^>]+)>)/gi, "") 
    .replace(/&nbsp;/gi, " ")     
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .trim();
};

const formatLocation = (locStr?: string) => {
  if (!locStr) return 'Not specified'
  return locStr.replace(/ > /g, ', ')
}

// 🌟 SEO UPGRADE 1: Advanced Metadata with OpenGraph & Twitter Cards
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params
  const slug = resolvedParams.slug

  const { data: place } = await supabase.from('listings').select('title, metadata, location, image').eq('slug', slug).single()

  if (!place) return { title: 'Place Not Found' }

  const meta = place.metadata || {};
  const descriptionText = meta.shortDescription ? cleanText(meta.shortDescription) : `Complete travel guide to visit ${place.title}. Find timings, entry fees, and attractions.`;
  
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.indiatouroperators.com';
  const currentUrl = `${siteUrl}/places/${slug}`;
  const imageUrl = place.image || (meta.gallery && meta.gallery.length > 0 ? meta.gallery[0] : `${siteUrl}/default-tour.jpg`);

  return {
    title: meta.seo?.metaTitle || `${place.title} - Ultimate Travel Guide & Details`,
    description: meta.seo?.metaDescription || descriptionText.substring(0, 160),
    keywords: meta.seo?.metaKeywords || `${place.title}, visit ${place.title}, ${formatLocation(place.location)} tourism, tourist places in ${formatLocation(place.location).split(',')[0]}`,
    alternates: { 
      canonical: currentUrl 
    },
    openGraph: {
      title: meta.seo?.metaTitle || place.title,
      description: meta.seo?.metaDescription || descriptionText.substring(0, 160),
      url: currentUrl,
      type: 'website',
      images: [{ url: imageUrl, width: 1200, height: 630, alt: place.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.seo?.metaTitle || place.title,
      description: meta.seo?.metaDescription || descriptionText.substring(0, 160),
      images: [imageUrl],
    }
  }
}

export default async function TouristPlacePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params
  const slug = resolvedParams.slug
  
  let { data: place, error } = await supabase.from('listings').select('*').eq('slug', slug).single()

  if (error || !place) {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)
    if (isUUID) {
      const { data: placeById } = await supabase.from('listings').select('*').eq('id', slug).single()
      if (!placeById) return notFound()
      place = placeById
    } else {
      return notFound()
    }
  }

  const formattedLocation = formatLocation(place.location);
  const targetCity = formattedLocation !== 'Not specified' ? formattedLocation.split(',')[0].trim() : '';

  const meta = place.metadata || {}
  const image = place.image || (meta.gallery && meta.gallery.length > 0 ? meta.gallery[0] : 'https://images.unsplash.com/photo-1506461883276-594c8e0eb500?auto=format&fit=crop&q=80&w=1200')
  const galleryUrls = meta.gallery && meta.gallery.length > 0 ? meta.gallery : []
  
  // 🌟 FIX FOR SEO: Combine Manual FAQs and AI Generated FAQs for Google Schema
  const manualFaqs = meta.faqItems || []
  const aiFaqs = meta.ai_guide?.faqs || []
  const allFaqsForSEO = [...manualFaqs, ...aiFaqs]

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.indiatouroperators.com';

  // 1. Breadcrumb Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": `${siteUrl}/` },
      { "@type": "ListItem", "position": 2, "name": "Places", "item": `${siteUrl}/places` },
      { "@type": "ListItem", "position": 3, "name": place.title, "item": `${siteUrl}/places/${slug}` }
    ]
  };

  // 2. TouristAttraction Schema
  const placeSchema = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    "name": place.title,
    "description": meta.seo?.metaDescription || meta.shortDescription || `Explore ${place.title} located in ${formattedLocation}.`,
    "image": image,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": targetCity,
      "addressCountry": "IN"
    }
  };

  // 🌟 3. FAQ Schema (Now includes AI Generated FAQs!)
  const faqSchema = allFaqsForSEO.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": allFaqsForSEO.map((faq: any) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": { "@type": "Answer", "text": faq.answer }
    }))
  } : null;

  return (
    <main className="min-h-screen bg-slate-50 pb-20 font-sans selection:bg-blue-600 selection:text-white">
      
      {/* --- INJECT GOOGLE SCHEMAS --- */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(placeSchema) }} />
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}

      {/* HERO SECTION */}
      <div className="relative h-[60vh] md:h-[75vh] w-full bg-slate-900 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={place.title} className="w-full h-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent flex items-end">
          <div className="max-w-7xl mx-auto w-full p-6 md:p-12 text-white">
            <Link href="/" className="text-amber-400 hover:text-white text-sm font-bold mb-4 inline-block transition-colors">← Back to Home</Link>
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-amber-500 text-slate-900 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-md">Tourist Attraction</span>
            </div>
            <h1 className="text-4xl md:text-7xl font-black mb-3 tracking-tight">{place.title}</h1>
            <p className="text-slate-200 mt-2 text-lg md:text-2xl font-medium flex items-center gap-2">📍 {formattedLocation}</p>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT WRAPPER */}
      <div className="max-w-7xl mx-auto px-4 md:px-12 py-8">
        
        {/* Breadcrumbs */}
        <nav className="flex items-center text-xs md:text-sm text-slate-500 font-bold mb-8 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-blue-600 transition-colors flex items-center gap-1">🏠 Home</Link>
          <span className="mx-2 text-slate-300">/</span>
          <Link href="/places" className="hover:text-blue-600 transition-colors flex items-center gap-1">Places</Link>
          <span className="mx-2 text-slate-300">/</span>
          <span className="text-slate-800 truncate">{place.title}</span>
        </nav>

        {/* 1. VISITOR INFO */}
        {(meta.timing || meta.entryFee || meta.bestTimeToVisit || meta.howToReach || meta.nearestPlaces) && (
          <section className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200 mb-10 w-full">
            <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2 border-b pb-3">
              <span>📋</span> Essential Visitor Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {meta.timing && (
                <div className="flex gap-4 items-start bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-3xl bg-amber-100 p-3 rounded-2xl">🕒</span>
                  <div><h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-1">Timings</h4><p className="text-slate-900 font-black text-base md:text-lg">{meta.timing}</p></div>
                </div>
              )}
              {meta.entryFee && (
                <div className="flex gap-4 items-start bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-3xl bg-amber-100 p-3 rounded-2xl">🎟️</span>
                  <div><h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-1">Entry Fee</h4><p className="text-slate-900 font-black text-base md:text-lg">{meta.entryFee}</p></div>
                </div>
              )}
              {meta.bestTimeToVisit && (
                <div className="flex gap-4 items-start bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-3xl bg-amber-100 p-3 rounded-2xl">⛅</span>
                  <div><h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-1">Best Time To Visit</h4><p className="text-slate-900 font-black text-base md:text-lg">{meta.bestTimeToVisit}</p></div>
                </div>
              )}
              {meta.howToReach && (
                <div className="flex gap-4 items-start bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-3xl bg-blue-100 p-3 rounded-2xl">🚆</span>
                  <div><h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-1">How To Reach</h4><p className="text-slate-800 font-bold text-base leading-relaxed whitespace-pre-line">{meta.howToReach}</p></div>
                </div>
              )}
              {meta.nearestPlaces && (
                <div className="flex gap-4 items-start bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm sm:col-span-2 lg:col-span-2">
                  <span className="text-3xl bg-blue-100 p-3 rounded-2xl">📍</span>
                  <div><h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-1">Nearby Attractions</h4><p className="text-slate-800 font-bold text-base leading-relaxed whitespace-pre-line">{meta.nearestPlaces}</p></div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 2. REST OF THE CONTENT */}
        <div className="w-full space-y-10">
          
          {/* PHOTO GALLERY */}
          {galleryUrls.length > 0 && (
            <section className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
              <h2 className="text-2xl font-black text-slate-900 mb-6 border-b pb-4">Photo Gallery</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {galleryUrls.map((imgUrl: string, idx: number) => (
                  <div key={idx} className="h-48 rounded-2xl overflow-hidden bg-slate-100 group relative shadow-sm">
                    {/* 🌟 SEO UPGRADE 3: Dynamic Image Alt Tags */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imgUrl} alt={`${place.title} tourist spot in ${targetCity} - View ${idx+1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* About Section */}
          <section className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-6 flex items-center gap-3">
              <span className="w-8 h-1 bg-amber-500 rounded-full inline-block"></span> About {place.title}
            </h2>
            {meta.shortDescription && <p className="text-amber-800 font-bold text-lg leading-relaxed mb-8 border-l-4 border-amber-500 pl-5 bg-amber-50/60 py-4 pr-4 rounded-r-2xl">"{meta.shortDescription}"</p>}
            <div className="prose prose-slate prose-a:text-blue-600 max-w-none text-slate-600 leading-relaxed text-lg break-words marker:text-blue-500" dangerouslySetInnerHTML={{ __html: place.description }} />
          </section>

          {/* History */}
          {meta.history && (
            <section className="bg-slate-900 text-slate-300 p-8 md:p-10 rounded-[2.5rem] shadow-xl">
              <h2 className="text-2xl font-black text-white mb-4 flex items-center gap-2"><span>📜</span> History & Significance</h2>
              <p className="leading-relaxed opacity-90 whitespace-pre-line text-lg">{meta.history}</p>
            </section>
          )}

          {/* Why Visit */}
          {meta.whyVisit && (
            <section className="bg-blue-50 text-blue-950 p-8 md:p-10 rounded-[2.5rem] border border-blue-100 shadow-sm">
              <h2 className="text-2xl font-black mb-4 flex items-center gap-2"><span>💡</span> Why You Should Visit</h2>
              <p className="leading-relaxed opacity-90 whitespace-pre-line text-lg">{meta.whyVisit}</p>
            </section>
          )}

          {/* Top Attractions */}
          {meta.topAttractions && meta.topAttractions.length > 0 && (
            <section className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
              <h2 className="text-2xl font-black text-slate-900 mb-6">✨ Top Attractions & Highlights</h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {meta.topAttractions.map((spot: string, idx: number) => (
                  <li key={idx} className="bg-slate-50 px-5 py-4 rounded-2xl border border-slate-100 text-slate-800 font-bold flex gap-3 items-center"><span className="text-amber-500 text-xl">✦</span> {spot}</li>
                ))}
              </ul>
            </section>
          )}

          {/* 🌟 AI SMART GUIDE & MAP 🌟 */}
          <AITouristGuide 
            placeId={place.id}
            targetCity={targetCity} 
            hasExistingFaqs={manualFaqs.length > 0} 
            placeTitle={place.title}
          />

          {/* Existing Manual FAQs */}
          {manualFaqs.length > 0 && (
            <section className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
              <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2"><span>❓</span> Frequently Asked Questions</h2>
              <div className="space-y-4">
                {manualFaqs.map((faq: any, idx: number) => (
                  <div key={idx} className="bg-slate-50 rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <h3 className="font-bold text-slate-900 text-lg mb-2">Q: {faq.question}</h3>
                    <p className="text-slate-600 text-lg leading-relaxed whitespace-pre-line">A: {faq.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Cab Booking Banner */}
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-8 md:p-10 rounded-[2.5rem] text-center text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-left">
              <div className="text-4xl mb-2">🚖</div>
              <h4 className="font-black text-2xl mb-1">Planning a Visit to {place.title}?</h4>
              <p className="text-white/90 font-medium">Book a comfortable private outstation or local cab for a hassle-free trip today.</p>
            </div>
            <Link href={targetCity ? `/?service=cab&city=${encodeURIComponent(targetCity)}` : '/'} className="bg-slate-900 hover:bg-black text-white font-black py-4 px-8 rounded-2xl transition-all shadow-md active:scale-95 whitespace-nowrap">
              Search Cabs Now →
            </Link>
          </div>

        </div>
      </div>

      <RelatedPlaceSections placeId={place.id} targetCity={targetCity} />
      <FloatingContact />

    </main>
  )
}