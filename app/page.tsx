import { supabase } from '../utils/supabase'
import Link from 'next/link'
import type { Metadata } from 'next'
import InteractiveIndiaMap from './components/InteractiveIndiaMap'
import VendorInfoCard from './components/VendorInfoCard' 
import VendorDirectory from './components/VendorDirectory' 

export const metadata: Metadata = {
  title: 'India Tour Operators - Best Tour Packages, Cabs & Hotels',
  description: 'Book verified India tour packages, outstation cabs, and luxury hotels with top-rated local tour operators across top destinations at the best prices.',
  keywords: 'India tour operators, tour packages India, cab booking India, hotel booking, travel agency, local guides, tourism portal'
}

const stripHtml = (html: string) => {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');   
}

const testimonials = [
  { name: "Rahul Sharma", location: "Mumbai", text: "Booked a Lonavala & Mahabaleshwar tour package through this portal. The local operator was extremely professional, and the price was 20% lower than other big sites!", rating: 5 },
  { name: "Priya Desai", location: "Pune", text: "Got an outstation cab for my Goa trip within 10 minutes. The driver was verified and the car was in top condition. Highly recommended.", rating: 5 },
  { name: "Amit Patel", location: "Ahmedabad", text: "Finding authentic local tour guides used to be hard. This platform made it so easy to compare prices and book a luxury hotel safely.", rating: 5 }
];

const homeFaqs = [
  { q: "Why should I book through India Tour Operators?", a: "We connect you directly with verified local tour operators across India, cutting out middlemen to ensure authentic experiences at the best guaranteed prices." },
  { q: "Are the outstation cabs and drivers verified?", a: "Yes, all our cab partners and drivers undergo a strict background check. We prioritize your safety, comfort, and reliability for outstation and local trips." },
  { q: "Can I customize my tour package?", a: "Absolutely! Most of our local travel partners offer fully customizable itineraries based on your budget, days, and personal preferences." },
  { q: "Are there any hidden booking fees?", a: "No! We believe in 100% transparency. The prices you see are directly from local operators with zero hidden charges or surprise platform fees." },
  { q: "How do I know the travel agents are genuine?", a: "We have a rigorous vetting process. Every travel agency, hotel, and cab provider listed on our portal is manually verified for quality, safety, and customer satisfaction." },
  { q: "What if I need help during my trip?", a: "We provide 24/7 expert customer support. In case of any emergencies or queries during your travel, our dedicated team is always just a call away to assist you." }
];

const INDIAN_STATES = [
  { name: 'Maharashtra', desc: 'Forts, caves, Pilgrimage Temple, Hill Station & coastal Konkan', img: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?q=80&w=800&auto=format&fit=crop' },
  { name: 'Kerala', desc: 'Backwaters, tea gardens, hill station & beaches', img: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=800&auto=format&fit=crop' },
  { name: 'Goa', desc: 'Beaches, forts, cruises & nightlife', img: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=800&auto=format&fit=crop' },
  { name: 'Karnataka', desc: 'Heritage, temples, hill stations, Hampi ruins', img: 'https://i.ibb.co/C5sMFH3c/Mysore-5.webp' },
  { name: 'Himachal Pradesh', desc: 'Hill stations, temples, adventure, Snow valleys', img: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=800&auto=format&fit=crop' },
  { name: 'Kashmir', desc: 'Valleys, lakes & spiritual escapes, Dal Lake', img: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?q=80&w=800&auto=format&fit=crop' },
  { name: 'Gujarat', desc: 'Temples, desert & heritage', img: 'https://i.ibb.co/whRPWNWJ/Rani-Ki-Vav-Patan-Gujarat-JM22.jpg' },
  { name: 'Rajasthan', desc: 'Forts, palaces & desert adventures', img: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?q=80&w=800&auto=format&fit=crop' },
  { name: 'Uttarakhand', desc: 'Yoga, spirituality, trekking & Himalayas', img: 'https://i.ibb.co/pBx0h2bQ/Valley-of-flowers-national-park-Uttarakhand-India-03-edit.jpg' },
  { name: 'Sikkim', desc: 'Glaciers, alpine meadows & Buddhist shrines', img: 'https://i.ibb.co/Mxgx0CJG/Buddha-statue-at-Buddha-Park-of-Ravangla-Sikkim-India-1.jpg' }
];

export default async function Home() {
  const { data: listings, error } = await supabase
    .from('listings')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  if (error) console.error('Error fetching listings:', error)

  const { data: vendorsData, error: vendorsError } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'vendor')
    .eq('approval_status', 'approved')
    .order('created_at', { ascending: false })

  if (vendorsError) console.error('Error fetching vendors:', vendorsError)

  const approvedVendors = vendorsData || [];
  
  const newlyRegisteredVendors = approvedVendors.slice(0, 10);

  const vendorsByState = approvedVendors.reduce((acc, vendor) => {
    const state = vendor.state && vendor.state.trim() !== '' ? vendor.state : 'Other Locations';
    if (!acc[state]) acc[state] = [];
    acc[state].push(vendor);
    return acc;
  }, {} as Record<string, any[]>);

  const sortedVendorStates = Object.keys(vendorsByState).sort();

  const getListingUrl = (listing: any) => {
    const slug = listing.slug || listing.id
    if (listing.category === 'tour') return `/tour/${slug}`
    if (listing.category === 'hotel') return `/hotel/${slug}`
    if (listing.category === 'cab') return `/cabs/${slug}`
    if (listing.category === 'destination') return `/places/${slug}` 
    if (listing.category === 'blog') return `/${slug}`            
    return `/listing/${slug}`
  }

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

  const activeStates = INDIAN_STATES.map(state => {
    const stateListings = listings?.filter(l => l.location?.toLowerCase().includes(state.name.toLowerCase())) || [];
    const tourCount = stateListings.filter(l => l.category === 'tour').length;
    const placeCount = stateListings.filter(l => l.category === 'destination').length;

    return {
      ...state,
      tourCount,
      placeCount,
      total: tourCount + placeCount
    };
  }).filter(state => state.total > 0); 

  // 🌟 NEW: Split titles into two parts for the Premium Two-Color Highlight
  const sections = [
    { titleStart: "Top Tour", titleHighlight: "Packages", items: tours, viewAllLink: "/tours", icon: "🗺️", badge: "Most Popular" },
    { titleStart: "Trending", titleHighlight: "Destinations", items: destinations, viewAllLink: "/places", icon: "📍", badge: "Must Visit" },
    { titleStart: "Luxury & Budget", titleHighlight: "Hotels", items: hotels, viewAllLink: "/hotels", icon: "🏨", badge: "Best Stays" },
    { titleStart: "Outstation", titleHighlight: "Cabs", items: cabs, viewAllLink: "/cabs", icon: "🚖", badge: "Safe & Reliable" },
    { titleStart: "Travel Guides &", titleHighlight: "Blogs", items: blogs, viewAllLink: "/blogs", icon: "📖", badge: "Expert Tips" },
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
    <main className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-amber-300 selection:text-slate-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* --- 💎 ULTRA-PREMIUM HERO SECTION --- */}
      <section className="relative bg-slate-950 text-white pt-28 pb-32 px-4 md:px-8 overflow-hidden flex flex-col justify-center min-h-[90vh]">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen"></div>
          <div className="absolute top-[30%] -right-[10%] w-[40%] h-[40%] bg-amber-500/10 rounded-full blur-[120px] mix-blend-screen"></div>
          <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[60%] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 backdrop-blur-md px-5 py-2 rounded-full mb-8 shadow-2xl">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="text-amber-100 text-xs font-black uppercase tracking-[0.2em]">Official India Tour Portal</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black mt-2 mb-6 leading-[1.1] tracking-tight drop-shadow-2xl">
            Explore India & Beyond with <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-amber-500 drop-shadow-lg">
              Expert Locals
            </span>
          </h1>
          <p className="text-lg md:text-2xl text-slate-300 max-w-2xl mx-auto font-medium opacity-90 leading-relaxed">
            Book verified holiday packages, comfortable outstation cabs, and premium hotels handpicked for your ultimate vacation.
          </p>
        </div>

        <div className="relative z-20 max-w-5xl mx-auto mt-8 pb-10 w-full">
          <InteractiveIndiaMap />
        </div>
      </section>

      {/* --- 💎 FLOATING TRUST SECTION --- */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 -mt-24 relative z-30 mb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/90 backdrop-blur-xl p-8 rounded-[2rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border border-white/50 flex flex-col items-start gap-4 transform transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_30px_50px_-15px_rgba(37,99,235,0.15)] group cursor-default">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 group-hover:scale-110 transition-transform duration-500 shadow-sm border border-emerald-100">🛡️</div>
            <div>
              <h3 className="font-black text-slate-800 text-xl mb-1">Verified Operators</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">Every local partner is 100% genuine and manually verified for your safety.</p>
            </div>
          </div>
          
          <div className="bg-white/90 backdrop-blur-xl p-8 rounded-[2rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border border-white/50 flex flex-col items-start gap-4 transform transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_30px_50px_-15px_rgba(245,158,11,0.15)] group cursor-default">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 group-hover:scale-110 transition-transform duration-500 shadow-sm border border-amber-100">💎</div>
            <div>
              <h3 className="font-black text-slate-800 text-xl mb-1">Best Price Guarantee</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">Direct booking with local experts means zero hidden platform fees.</p>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-xl p-8 rounded-[2rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border border-white/50 flex flex-col items-start gap-4 transform transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_30px_50px_-15px_rgba(139,92,246,0.15)] group cursor-default">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 group-hover:scale-110 transition-transform duration-500 shadow-sm border border-indigo-100">🎧</div>
            <div>
              <h3 className="font-black text-slate-800 text-xl mb-1">24/7 Expert Support</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">Our dedicated travel assistance team is available anytime, anywhere.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- 🌟 NEWLY REGISTERED VENDORS (SLIDER / CAROUSEL) --- */}
      {newlyRegisteredVendors.length > 0 && (
        <section className="max-w-[90rem] mx-auto mb-20 pt-4 overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 md:px-8 mb-8 text-center md:text-left">
            <span className="text-amber-500 font-black tracking-widest uppercase text-sm mb-2 block">Our Newest Additions</span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
              Newly Registered <span className="text-orange-600">Vendors</span>
            </h2>
            <p className="text-slate-500 mt-2 text-lg font-medium">Swipe left to discover the latest local travel experts who joined us.</p>
          </div>
          
          <div className="flex gap-6 overflow-x-auto pb-8 pt-2 px-4 md:px-8 snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            {newlyRegisteredVendors.map(vendor => (
              <div key={`new-${vendor.id}`} className="shrink-0 w-[85vw] sm:w-[400px] snap-center">
                <div className="h-full">
                  <VendorInfoCard vendorId={vendor.id} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* --- 🌟 STATE-WISE VENDORS SECTION --- */}
      {sortedVendorStates.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 md:px-8 mb-20">
          <div className="mb-10 text-center md:text-left">
            <span className="text-emerald-500 font-black tracking-widest uppercase text-sm mb-2 block">Find Local Experts</span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
              Vendors by <span className="text-orange-600">State</span>
            </h2>
            <p className="text-slate-500 mt-3 text-lg font-medium max-w-2xl mx-auto md:mx-0">
              Click on any state card below to discover verified travel agencies and cab operators in that region.
            </p>
          </div>

          <VendorDirectory groupedVendors={vendorsByState} stateData={INDIAN_STATES} />
          
        </section>
      )}

      {/* --- 🌟 EXPLORE BY DESTINATION (STATE) SECTION --- */}
      {activeStates.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 md:px-8 mb-20 pt-4">
          <div className="mb-10 text-center md:text-left">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
              Explore Packages by <span className="text-orange-600">Destination</span>
            </h2>
            <p className="text-slate-500 mt-3 text-lg font-medium">
              Pick a state and jump straight to its live, bookable packages and places.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {activeStates.map((state, idx) => (
              <Link 
                href={`/search?destination=${state.name}`} 
                key={idx} 
                className="group relative h-64 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={state.img} 
                  alt={state.name} 
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-6 w-full">
                  <h3 className="text-2xl font-bold text-white mb-1 shadow-sm">{state.name}</h3>
                  <p className="text-slate-200 text-xs line-clamp-2 mb-4 font-medium leading-relaxed">{state.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {state.tourCount > 0 && (
                      <span className="bg-white/20 backdrop-blur-md border border-white/20 text-white text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-full">
                        {state.tourCount} {state.tourCount === 1 ? 'Tour' : 'Tours'}
                      </span>
                    )}
                    {state.placeCount > 0 && (
                      <span className="bg-white/20 backdrop-blur-md border border-white/20 text-white text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-full">
                        {state.placeCount} {state.placeCount === 1 ? 'Place' : 'Places'}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* --- 💎 PREMIUM LISTINGS CONTAINER --- */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 pb-10">
        {sections.map((section, idx) => {
          if (section.items.length === 0) return null;
          const displayItems = section.items.slice(0, 6);
          const hasMoreItems = section.items.length > 6;

          return (
            <div key={idx} className="mb-24">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 pb-4 gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-8 h-1 bg-amber-400 rounded-full"></span>
                    <span className="text-xs font-black text-slate-500 uppercase tracking-[0.15em]">
                      {section.badge}
                    </span>
                  </div>
                  {/* 🌟 HIGHLIGHTING THE LAST WORD IN ORANGE */}
                  <h2 className="text-3xl md:text-5xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
                    <span className="text-4xl md:text-5xl drop-shadow-sm">{section.icon}</span> 
                    <span>
                      {section.titleStart} <span className="text-orange-600">{section.titleHighlight}</span>
                    </span>
                  </h2>
                </div>
                {hasMoreItems && (
                  <Link href={section.viewAllLink} className="hidden md:inline-flex items-center gap-2 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-sm hover:shadow-md text-slate-700 font-bold px-6 py-3 rounded-full transition-all duration-300 text-sm active:scale-95">
                    Explore All <span className="text-lg leading-none">→</span>
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
                    <Link href={detailUrl} key={listing.id} className="bg-white rounded-[2rem] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-1.5 hover:border-blue-200 transition-all duration-500 flex flex-col group cursor-pointer">
                      
                      <div className="relative h-64 w-full bg-slate-100 overflow-hidden flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={imageUrl} 
                          alt={listing.title} 
                          className={`w-full h-full ${imageUrl === '/ITO LOGO.png' ? 'object-contain p-8 opacity-50' : 'object-cover group-hover:scale-110 transition-transform duration-1000 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]'}`} 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500"></div>
                        
                        <span className="absolute top-5 left-5 text-[10px] font-black text-slate-900 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full uppercase tracking-widest shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-white/50">
                          {listing.category === 'blog' && listing.metadata?.blogCategory ? listing.metadata.blogCategory : listing.category === 'destination' ? 'Tourist Place' : listing.category}
                        </span>
                        
                        <span className="absolute bottom-5 left-5 text-white text-sm font-bold flex items-center gap-1.5 drop-shadow-md">
                          <span className="text-amber-400">📍</span> {listing.location ? listing.location.split(',')[0] : 'India'}
                        </span>
                      </div>

                      <div className="p-7 flex-1 flex flex-col justify-between relative bg-white">
                        <div>
                          <h3 className="text-xl md:text-2xl font-black text-slate-800 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight mb-3">
                            {listing.title}
                          </h3>
                          <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed font-medium">
                            {excerpt}
                          </p>
                        </div>

                        <div className="mt-6 flex justify-between items-end border-t border-slate-100 pt-5">
                          <div className="w-full text-right">
                            {isInfoContent ? (
                              <span className="inline-flex items-center gap-2 text-sm font-black text-blue-600 bg-blue-50/50 hover:bg-blue-600 hover:text-white px-5 py-2.5 rounded-full transition-colors w-full justify-center border border-blue-100 group-hover:border-blue-600">
                                Read Guide →
                              </span>
                            ) : (
                              <div className="flex justify-between items-center w-full">
                                <span className="block text-[10px] text-slate-400 font-black uppercase tracking-[0.1em]">Starting From</span>
                                <span className="text-2xl font-black text-emerald-600">₹{listing.price}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>

              {hasMoreItems && (
                <div className="mt-12 text-center md:hidden">
                  <Link href={section.viewAllLink} className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white font-bold px-8 py-4 rounded-full transition-all shadow-lg text-sm w-full">
                    Explore All {section.titleStart} {section.titleHighlight} →
                  </Link>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* --- 💎 GLASSMORPHISM TESTIMONIALS SECTION --- */}
      <section className="bg-slate-950 py-24 px-4 md:px-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]"></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <span className="text-amber-400 font-black tracking-widest uppercase text-sm mb-2 block">Our Community</span>
            <h2 className="text-4xl md:text-5xl font-black mb-4">Loved by <span className="text-orange-500">Travelers</span></h2>
            <p className="text-slate-400 font-medium text-lg max-w-2xl mx-auto">Real experiences from travelers who explored India with our trusted local operators.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300 shadow-2xl flex flex-col justify-between group">
                <div>
                  <div className="text-amber-400 mb-6 text-xl tracking-widest drop-shadow-sm">{"★".repeat(t.rating)}</div>
                  <p className="text-slate-300 font-medium leading-relaxed mb-8 text-lg">"{t.text}"</p>
                </div>
                <div className="flex items-center gap-4 pt-6 border-t border-white/10">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center font-black text-white text-lg shadow-inner">{t.name[0]}</div>
                  <div>
                    <h4 className="font-black text-white text-base">{t.name}</h4>
                    <p className="text-amber-400/80 text-xs font-bold uppercase tracking-widest mt-0.5">{t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- 💎 PREMIUM SEO KEYWORD TEXT & FAQ SECTION --- */}
      <section className="bg-white py-24 px-4 md:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-24">
            <div className="text-center max-w-4xl mx-auto mb-16">
              <span className="w-12 h-1 bg-amber-400 rounded-full inline-block mb-6"></span>
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-8 tracking-tight leading-tight">
                Why Choose <span className="text-orange-600">India Tour Operators?</span>
              </h2>
              <div className="space-y-6 text-slate-600 text-lg leading-relaxed font-medium text-left md:text-center">
                <p>
                  Welcome to <strong className="text-slate-900 font-black">India Tour Operators</strong>, the leading aggregator platform connecting travelers with verified, top-rated local travel agencies across India. Whether you are looking for customized <strong className="text-blue-600 font-black">tour packages</strong>, reliable <strong className="text-blue-600 font-black">outstation cab booking</strong> services, or luxurious yet affordable <strong className="text-blue-600 font-black">hotel bookings</strong>, we have everything organized in one place.
                </p>
                <p>
                  Our platform eliminates the middleman, ensuring that you get the most authentic travel experiences directly from local experts at highly competitive prices. Explore detailed <strong className="text-slate-800 font-bold border-b-2 border-amber-300">tourist place guides</strong>, read our expert <strong className="text-slate-800 font-bold border-b-2 border-amber-300">travel blogs</strong>, and plan your next vacation with complete peace of mind.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-black text-slate-900 mb-10 text-center tracking-tight">Frequently Asked <span className="text-orange-600">Questions</span></h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {homeFaqs.map((faq, i) => (
                <div key={i} className="bg-[#F8FAFC] p-8 rounded-[2rem] border border-slate-200 hover:border-blue-300 transition-colors shadow-sm">
                  <h3 className="font-black text-slate-800 mb-3 text-lg">{faq.q}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed font-medium">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- 💎 MASSIVE BOTTOM CTA SECTION --- */}
      <section className="relative py-24 px-4 md:px-8 overflow-hidden bg-blue-600">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent bg-[length:20px_20px]"></div>
        
        <div className="relative z-10 max-w-5xl mx-auto bg-white/10 backdrop-blur-xl border border-white/20 p-10 md:p-16 rounded-[3rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-12 text-center md:text-left">
          <div className="flex-1">
            <span className="bg-amber-400 text-slate-900 text-xs font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full mb-6 inline-block">For Businesses</span>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">Are you a <span className="text-amber-400">Travel Expert?</span></h2>
            <p className="text-blue-100 text-lg md:text-xl font-medium max-w-xl">
              List your tour packages, hotels, and cabs on India's fastest-growing travel network and reach thousands of daily tourists.
            </p>
          </div>
          <div className="flex flex-col w-full md:w-auto gap-4 shrink-0">
            <Link href="/register" className="bg-white hover:bg-slate-50 text-blue-600 font-black px-10 py-5 rounded-2xl text-center shadow-xl transition-all text-lg active:scale-95 border border-white hover:shadow-2xl">
              Join as Vendor →
            </Link>
            <Link href="/contact" className="bg-transparent hover:bg-white/10 border-2 border-white/30 text-white font-black px-10 py-5 rounded-2xl text-center transition-all text-lg active:scale-95">
              Contact Support
            </Link>
          </div>
        </div>
      </section>

    </main>
  )
}