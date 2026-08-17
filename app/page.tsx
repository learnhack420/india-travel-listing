import { supabase } from '../utils/supabase'
import Link from 'next/link'
import type { Metadata } from 'next'
// 👇 1. Yahan import ko comment kar diya hai taaki error na aaye
// import MainSearchBox from './components/MainSearchBox' 
import InteractiveIndiaMap from './components/InteractiveIndiaMap'

// 🌟 SEO Metadata for India Tour Operators
export const metadata: Metadata = {
  title: 'India Tour Operators - Best Tour Packages, Cabs & Hotels',
  description: 'Book verified India tour packages, outstation cabs, and luxury hotels with top-rated local tour operators across top destinations at the best prices.',
  keywords: 'India tour operators, tour packages India, cab booking India, hotel booking, travel agency, local guides, tourism portal'
}

// Helper function to remove HTML tags
const stripHtml = (html: string) => {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');   
}

// 🌟 MOCK DATA FOR SEO & UX
const testimonials = [
  { name: "Rahul Sharma", location: "Mumbai", text: "Booked a Lonavala & Mahabaleshwar tour package through this portal. The local operator was extremely professional, and the price was 20% lower than other big sites!", rating: 5 },
  { name: "Priya Desai", location: "Pune", text: "Got an outstation cab for my Goa trip within 10 minutes. The driver was verified and the car was in top condition. Highly recommended.", rating: 5 },
  { name: "Amit Patel", location: "Ahmedabad", text: "Finding authentic local tour guides used to be hard. This platform made it so easy to compare prices and book a luxury hotel safely.", rating: 5 }
];

// 🌟 Extended FAQs for Better SEO & User Trust
const homeFaqs = [
  { q: "Why should I book through India Tour Operators?", a: "We connect you directly with verified local tour operators across India, cutting out middlemen to ensure authentic experiences at the best guaranteed prices." },
  { q: "Are the outstation cabs and drivers verified?", a: "Yes, all our cab partners and drivers undergo a strict background check. We prioritize your safety, comfort, and reliability for outstation and local trips." },
  { q: "Can I customize my tour package?", a: "Absolutely! Most of our local travel partners offer fully customizable itineraries based on your budget, days, and personal preferences." },
  { q: "Are there any hidden booking fees?", a: "No! We believe in 100% transparency. The prices you see are directly from local operators with zero hidden charges or surprise platform fees." },
  { q: "How do I know the travel agents are genuine?", a: "We have a rigorous vetting process. Every travel agency, hotel, and cab provider listed on our portal is manually verified for quality, safety, and customer satisfaction." },
  { q: "What if I need help during my trip?", a: "We provide 24/7 expert customer support. In case of any emergencies or queries during your travel, our dedicated team is always just a call away to assist you." }
];

export default async function Home() {
  const { data: listings, error } = await supabase
    .from('listings')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  if (error) console.error('Error fetching listings:', error)

  const getListingUrl = (listing: any) => {
    const slug = listing.slug || listing.id
    if (listing.category === 'tour') return `/tour/${slug}`
    if (listing.category === 'hotel') return `/hotel/${slug}`
    if (listing.category === 'cab') return `/cabs/${slug}`
    if (listing.category === 'destination') return `/places/${slug}` 
    if (listing.category === 'blog') return `/${slug}`            
    return `/listing/${slug}`
  }

  // 🌟 PERFECT THUMBNAIL EXTRACTOR
  const getThumbnail = (listing: any) => {
    const meta = typeof listing.metadata === 'string' ? JSON.parse(listing.metadata) : (listing.metadata || {})
    const exactImage = listing.image || listing.thumbnail || meta.thumbnail || meta.image;
    if (exactImage && typeof exactImage === 'string' && exactImage.trim() !== '') {
      return exactImage.trim();
    }
    if (meta.gallery && Array.isArray(meta.gallery) && meta.gallery.length > 0) {
      const firstValidImg = meta.gallery.find((img: string) => img && typeof img === 'string' && img.trim() !== '')
      if (firstValidImg) return firstValidImg.trim()
    }
    return '/ITO LOGO.png'
  }

  const tours = listings?.filter((l) => l.category === 'tour') || []
  const destinations = listings?.filter((l) => l.category === 'destination') || []
  const hotels = listings?.filter((l) => l.category === 'hotel') || []
  const cabs = listings?.filter((l) => l.category === 'cab') || []
  const blogs = listings?.filter((l) => l.category === 'blog') || []

  const sections = [
    { title: "Top Tour Packages", items: tours, viewAllLink: "/tours", icon: "🗺️", badge: "Most Popular" },
    { title: "Trending Destinations", items: destinations, viewAllLink: "/places", icon: "📍", badge: "Must Visit" },
    { title: "Luxury & Budget Hotels", items: hotels, viewAllLink: "/hotels", icon: "🏨", badge: "Best Stays" },
    { title: "Outstation Cabs", items: cabs, viewAllLink: "/cabs", icon: "🚖", badge: "Safe & Reliable" },
    { title: "Travel Guides & Blogs", items: blogs, viewAllLink: "/blogs", icon: "📖", badge: "Expert Tips" },
  ]

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": homeFaqs.map((faq) => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": { "@type": "Answer", "text": faq.a }
    }))
  };

  return (
    <main className="min-h-screen bg-slate-50 font-sans selection:bg-blue-200 selection:text-blue-900">

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <section className="relative bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white py-20 px-4 md:px-8 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 right-10 w-72 h-72 bg-purple-500 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center mb-12">
          <span className="inline-block bg-orange-500/20 border border-orange-500/50 text-orange-400 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm mb-6">
            Official India Tour Operators Portal
          </span>
          <h1 className="text-4xl md:text-6xl font-black mt-2 mb-6 leading-tight tracking-tight drop-shadow-lg">
            Explore India & Beyond with <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">Expert Locals</span>
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto font-medium opacity-90">
            Book verified holiday packages, comfortable outstation cabs, and premium hotels handpicked for your ultimate Indian vacation.
          </p>
        </div>

        {/* 👇 2. YAHAN SEARCH BOX KO COMMENT KAR DIYA HAI 👇 */}
        {/* 
        <div className="relative z-20 max-w-5xl mx-auto drop-shadow-2xl">
          <MainSearchBox />
        </div> 
        */}

        {/* 👇 Map component wahi rahega 👇 */}
        <div className="relative z-20 max-w-5xl mx-auto mt-12 pb-8">
          <InteractiveIndiaMap />
        </div>

      </section>

      {/* --- TRUST & FEATURES SECTION --- */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 -mt-10 relative z-30 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-[2rem] shadow-lg border border-slate-100 flex items-center gap-4 transform transition-transform hover:-translate-y-1">
            <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-2xl flex-shrink-0">✔️</div>
            <div>
              <h3 className="font-black text-slate-800">Verified Operators</h3>
              <p className="text-sm text-slate-500 font-medium">100% genuine local partners.</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[2rem] shadow-lg border border-slate-100 flex items-center gap-4 transform transition-transform hover:-translate-y-1">
            <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl flex-shrink-0">💎</div>
            <div>
              <h3 className="font-black text-slate-800">Best Price Guarantee</h3>
              <p className="text-sm text-slate-500 font-medium">Direct booking, zero hidden fees.</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[2rem] shadow-lg border border-slate-100 flex items-center gap-4 transform transition-transform hover:-translate-y-1">
            <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-2xl flex-shrink-0">🎧</div>
            <div>
              <h3 className="font-black text-slate-800">24/7 Expert Support</h3>
              <p className="text-sm text-slate-500 font-medium">Assistance anytime, anywhere.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- MAIN LISTINGS CONTAINER --- */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 pb-10">
        {sections.map((section, idx) => {
          if (section.items.length === 0) return null;
          const displayItems = section.items.slice(0, 6);
          const hasMoreItems = section.items.length > 6;

          return (
            <div key={idx} className="mb-20">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b-2 border-slate-100 pb-5 gap-4">
                <div>
                  <span className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1 block">
                    {section.badge}
                  </span>
                  <h2 className="text-3xl md:text-4xl font-black text-slate-900 flex items-center gap-3">
                    <span className="text-4xl">{section.icon}</span> {section.title}
                  </h2>
                </div>
                {hasMoreItems && (
                  <Link href={section.viewAllLink} className="hidden md:inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-full transition-colors text-sm">
                    View All <span className="text-lg leading-none">→</span>
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {displayItems.map((listing) => {
                  const detailUrl = getListingUrl(listing)
                  const imageUrl = getThumbnail(listing)
                  const excerpt = listing.metadata?.shortDescription || stripHtml(listing.description);
                  const isInfoContent = listing.category === 'destination' || listing.category === 'blog';

                  return (
                    <Link href={detailUrl} key={listing.id} className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden hover:shadow-2xl hover:border-blue-100 transition-all duration-300 flex flex-col group cursor-pointer">
                      <div className="relative h-60 w-full bg-slate-200 overflow-hidden flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={imageUrl} 
                          alt={listing.title} 
                          className={`w-full h-full ${imageUrl === '/ITO LOGO.png' ? 'object-contain p-4' : 'object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out'}`} 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <span className="absolute top-4 left-4 text-xs font-black text-white bg-slate-900/80 backdrop-blur-md px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                          {listing.category === 'blog' && listing.metadata?.blogCategory ? listing.metadata.blogCategory : listing.category === 'destination' ? 'Tourist Place' : listing.category}
                        </span>
                      </div>

                      <div className="p-6 md:p-8 flex-1 flex flex-col justify-between relative">
                        <div>
                          <h3 className="text-xl md:text-2xl font-black text-slate-800 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight mb-3">
                            {listing.title}
                          </h3>
                          <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed font-medium">
                            {excerpt}
                          </p>
                        </div>

                        <div className="mt-6 flex justify-between items-end border-t border-slate-100 pt-5">
                          <span className="text-slate-500 text-sm font-bold flex items-center truncate max-w-[55%]">📍 {listing.location ? listing.location.split(',')[0] : 'India'}</span>
                          <div className="text-right">
                            {isInfoContent ? (
                              <span className="block text-sm font-black text-blue-600 bg-blue-50 px-4 py-2 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-colors">Explore →</span>
                            ) : (
                              <>
                                <span className="block text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Starting From</span>
                                <span className="text-2xl font-black text-emerald-600">₹{listing.price}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>

              {hasMoreItems && (
                <div className="mt-10 text-center">
                  <Link href={section.viewAllLink} className="inline-flex items-center justify-center gap-2 bg-white border-2 border-slate-200 hover:border-blue-500 hover:text-blue-600 text-slate-700 font-black px-8 py-3.5 rounded-full transition-all shadow-sm hover:shadow-md">
                    Explore All {section.title} <span className="text-xl">🚀</span>
                  </Link>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* --- ⭐ TESTIMONIALS SECTION --- */}
      <section className="bg-slate-900 py-20 px-4 md:px-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl"></div>
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-black mb-4">Loved by Travelers</h2>
            <p className="text-slate-400 font-medium text-lg">See what our community has to say about their experience.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-slate-800 p-8 rounded-[2rem] border border-slate-700 hover:border-amber-500/50 transition-colors">
                <div className="text-amber-400 mb-4 text-xl">{"★".repeat(t.rating)}</div>
                <p className="text-slate-300 font-medium leading-relaxed mb-6 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center font-black text-white">{t.name[0]}</div>
                  <div>
                    <h4 className="font-black text-white">{t.name}</h4>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- 📝 SEO KEYWORD TEXT & FAQ SECTION --- */}
      <section className="bg-white py-20 px-4 md:px-8">
        <div className="max-w-5xl mx-auto">

          <div className="mb-16">
            <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3"><span>❓</span> Frequently Asked Questions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {homeFaqs.map((faq, i) => (
                <div key={i} className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <h3 className="font-black text-slate-800 mb-2">{faq.q}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* --- 📝 PREMIUM SEO KEYWORD TEXT SECTION --- */}
          <div className="mt-20">
            <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 p-8 md:p-12 rounded-[2.5rem] border border-blue-100 shadow-sm relative overflow-hidden">

              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-200/40 rounded-full blur-3xl -mr-10 -mt-10"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-amber-200/30 rounded-full blur-3xl -ml-10 -mb-10"></div>

              <div className="relative z-10 text-center max-w-4xl mx-auto">
                <span className="text-blue-500 text-5xl mb-6 block drop-shadow-sm">✨</span>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-8 tracking-tight">
                  Why Choose India Tour Operators?
                </h2>

                <div className="space-y-6 text-slate-600 text-lg md:text-xl leading-relaxed font-medium">
                  <p>
                    Welcome to <strong className="text-slate-900 font-black">India Tour Operators</strong>, the leading aggregator platform connecting travelers with verified, top-rated local travel agencies across India. Whether you are looking for customized <strong className="text-blue-600 font-black">tour packages</strong>, reliable <strong className="text-blue-600 font-black">outstation cab booking</strong> services, or luxurious yet affordable <strong className="text-blue-600 font-black">hotel bookings</strong>, we have everything organized in one place.
                  </p>
                  <p>
                    Our platform eliminates the middleman, ensuring that you get the most authentic travel experiences directly from local experts at highly competitive prices. Explore detailed <strong className="text-slate-800 font-bold border-b-2 border-amber-300">tourist place guides</strong>, read our expert <strong className="text-slate-800 font-bold border-b-2 border-amber-300">travel blogs</strong>, and plan your next vacation with complete peace of mind.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- MASSIVE BOTTOM CTA SECTION --- */}
      <section className="bg-blue-600 text-white py-16 px-4 md:px-8 border-t-[8px] border-amber-500">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="text-center md:text-left">
            <h2 className="text-3xl md:text-5xl font-black mb-4 drop-shadow-md">Are you a Travel Expert?</h2>
            <p className="text-blue-100 text-lg md:text-xl font-medium max-w-xl">
              List your tour packages, hotels, and cabs on India's fastest-growing travel network and reach thousands of daily tourists.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <Link href="/register" className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-black px-8 py-4 rounded-2xl text-center shadow-lg transition-all text-lg whitespace-nowrap active:scale-95">
              Join as Partner →
            </Link>
            <Link href="/contact" className="bg-blue-700 hover:bg-blue-800 border border-blue-400 text-white font-black px-8 py-4 rounded-2xl text-center transition-all text-lg whitespace-nowrap active:scale-95">
              Contact Support
            </Link>
          </div>
        </div>
      </section>

    </main>
  )
}