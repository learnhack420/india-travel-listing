"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabase'

// 🌟 SUPER SMART CITY EXTRACTOR
// Yeh function lambe address "Area > City > State > Country ➔ Dest..." ko automatically sirf "City" mein convert kar dega.
const extractCityName = (locStr?: string) => {
  if (!locStr || locStr === 'Not specified') return '';
  // Agar arrow (➔ ya ->) hai, toh uske pehle wala hissa lo (Sirf Origin)
  let cleanStr = locStr.split(/➔|->/)[0].trim();
  
  // Ab Comma (,) ya Arrow (>) se split karo
  const parts = cleanStr.split(/,| > /).map(s => s.trim());
  
  if (parts.length >= 4) return parts[parts.length - 3]; // Area, City, State, Country -> City
  if (parts.length >= 3) return parts[parts.length - 3]; // City, State, Country -> City
  if (parts.length === 2) return parts[0];               // City, State -> City
  return parts[0];                                       // City -> City
}

export default function MainSearchBox() {
  const router = useRouter()

  // 1. Main Tabs
  const [mainTab, setMainTab] = useState('tour')

  // 2. Cab States
  const [cabType, setCabType] = useState('local')
  const [localSubType, setLocalSubType] = useState('point2point') 
  const [outstationSubType, setOutstationSubType] = useState('oneway') 
  const [pickupCity, setPickupCity] = useState('')
  const [dropCity, setDropCity] = useState('')
  const [rentalPackage, setRentalPackage] = useState('8 Hour 80km')
  
  // 🌟 3. TOUR STATES (Smart Dependent Dropdowns)
  const [tourMap, setTourMap] = useState<Record<string, string[]>>({})
  const [availableOrigins, setAvailableOrigins] = useState<string[]>([])
  const [availableDestinations, setAvailableDestinations] = useState<string[]>([])
  
  const [tourOrigin, setTourOrigin] = useState('')
  const [tourDestination, setTourDestination] = useState('')
  
  // 4. Hotel States
  const [hotelCity, setHotelCity] = useState('')

  // 🌟 KADAM 1: Database se Tours fetch karke Origin-Destination ka Map banana
  useEffect(() => {
    async function fetchTourRoutes() {
      try {
        const { data: tours } = await supabase.from('listings').select('location, metadata').eq('category', 'tour');

        const map: Record<string, Set<string>> = {};
        const allDests = new Set<string>();

        if (tours) {
          tours.forEach((t: any) => {
            const meta = typeof t.metadata === 'string' ? JSON.parse(t.metadata) : (t.metadata || {});
            
            let originStr = t.location || '';
            let destStr = meta.destination || '';

            // Agar database mein "Mumbai ➔ Pune" jaisa saved hai
            if (originStr.includes('➔')) {
              const parts = originStr.split('➔');
              originStr = parts[0];
              destStr = destStr || parts[1]; // Dest agar pehle se nahi hai toh yahan se le lo
            } else if (originStr.includes('->')) {
              const parts = originStr.split('->');
              originStr = parts[0];
              destStr = destStr || parts[1];
            }

            const originCity = extractCityName(originStr);
            const destCity = extractCityName(destStr);

            if (originCity) {
              if (!map[originCity]) map[originCity] = new Set();
              if (destCity) {
                map[originCity].add(destCity);
                allDests.add(destCity);
              }
            }
          });
        }

        // Sets ko array mein convert karke alphabetically sort kar lo
        const finalMap: Record<string, string[]> = {};
        Object.keys(map).forEach(k => {
          finalMap[k] = Array.from(map[k]).sort();
        });

        setTourMap(finalMap);
        setAvailableOrigins(Object.keys(finalMap).sort());
        setAvailableDestinations(Array.from(allDests).sort()); // Default me saare destinations dikhao
      } catch (error) {
        console.error("Error fetching tour routes:", error);
      }
    }

    fetchTourRoutes();
  }, []);

  // 🌟 KADAM 2: Jab Origin change ho, tab Destination Dropdown ko update karo
  useEffect(() => {
    if (tourOrigin && tourMap[tourOrigin]) {
      // Sirf wahi destination dikhao jahan ki trip is origin se jati hai
      setAvailableDestinations(tourMap[tourOrigin]);
      
      // Agar purana selected destination naye origin ke options me nahi hai, toh clear kar do
      if (tourDestination && !tourMap[tourOrigin].includes(tourDestination)) {
        setTourDestination('');
      }
    } else {
      // Agar "Anywhere" select kiya, toh wapas saare destinations dikha do
      const all = new Set<string>();
      Object.values(tourMap).forEach(dests => dests.forEach(d => all.add(d)));
      setAvailableDestinations(Array.from(all).sort());
    }
  }, [tourOrigin, tourMap]);


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    let query = `?service=${mainTab}`

    if (mainTab === 'cab') {
      query += `&type=${cabType}`
      if (cabType === 'local') {
        query += `&subType=${localSubType}&city=${pickupCity}`
        if (localSubType === 'point2point') query += `&drop=${dropCity}`
        if (localSubType === 'rental') query += `&package=${rentalPackage}`
      } else {
        query += `&subType=${outstationSubType}&pickup=${pickupCity}&drop=${dropCity}`
      }
    } else if (mainTab === 'tour') {
      // 🌟 Ab origin aur destination dono pass honge search result page par
      if (tourOrigin) query += `&origin=${encodeURIComponent(tourOrigin)}`
      if (tourDestination) query += `&destination=${encodeURIComponent(tourDestination)}`
    } else if (mainTab === 'hotel') {
      query += `&city=${hotelCity}`
    }

    router.push(`/search${query}`)
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
      
      {/* --- 1. MAIN TABS --- */}
      <div className="flex bg-gray-50 border-b border-gray-200 text-gray-800">
        <button 
          type="button"
          className={`flex-1 py-4 text-center font-extrabold text-sm md:text-base flex items-center justify-center gap-2 transition-colors ${mainTab === 'tour' ? 'bg-white text-blue-600 border-t-4 border-t-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
          onClick={() => setMainTab('tour')}
        >
          🗺️ Tour Package
        </button>
        <button 
          type="button"
          className={`flex-1 py-4 text-center font-extrabold text-sm md:text-base flex items-center justify-center gap-2 transition-colors ${mainTab === 'cab' ? 'bg-white text-blue-600 border-t-4 border-t-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
          onClick={() => setMainTab('cab')}
        >
          🚖 Cab / Taxi
        </button>
        <button 
          type="button"
          className={`flex-1 py-4 text-center font-extrabold text-sm md:text-base flex items-center justify-center gap-2 transition-colors ${mainTab === 'hotel' ? 'bg-white text-blue-600 border-t-4 border-t-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
          onClick={() => setMainTab('hotel')}
        >
          🏨 Hotel
        </button>
      </div>

      <div className="p-6 md:p-8 text-gray-900">
        <form onSubmit={handleSearch}>
          
          {/* --- 🌟 DEPENDENT DROPDOWNS: TOUR PACKAGE --- */}
          {mainTab === 'tour' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Starting From (Origin)</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 font-bold outline-none focus:border-blue-500 text-blue-900 bg-blue-50/50 cursor-pointer"
                  value={tourOrigin}
                  onChange={(e) => setTourOrigin(e.target.value)}
                >
                  <option value="">Anywhere (All Origins)</option>
                  {availableOrigins.map((city, idx) => (
                    <option key={idx} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Going To (Destination)</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 font-bold outline-none focus:border-blue-500 text-blue-900 bg-blue-50/50 cursor-pointer"
                  value={tourDestination}
                  onChange={(e) => setTourDestination(e.target.value)}
                >
                  <option value="">Anywhere (All Destinations)</option>
                  {availableDestinations.length === 0 ? (
                    <option disabled>No destinations found</option>
                  ) : (
                    availableDestinations.map((city, idx) => (
                      <option key={idx} value={city}>{city}</option>
                    ))
                  )}
                </select>
                {tourOrigin && availableDestinations.length > 0 && (
                  <p className="text-[10px] font-bold text-emerald-600 mt-1">
                    Showing tours available from {tourOrigin}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* --- CAB SEARCH SECTION --- */}
          {mainTab === 'cab' && (
            <div className="space-y-6">
              <div className="flex justify-center mb-6">
                <div className="inline-flex bg-gray-100 rounded-full p-1 border border-gray-200">
                  <button type="button" className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${cabType === 'local' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:text-blue-600'}`} onClick={() => setCabType('local')}>
                    🏙️ Local
                  </button>
                  <button type="button" className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${cabType === 'outstation' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:text-blue-600'}`} onClick={() => setCabType('outstation')}>
                    🛣️ Outstation
                  </button>
                </div>
              </div>

              {cabType === 'local' && (
                <div className="flex gap-4 border-b border-gray-100 pb-4">
                  <label className="flex items-center gap-2 font-bold text-gray-700 cursor-pointer">
                    <input type="radio" name="localType" checked={localSubType === 'point2point'} onChange={() => setLocalSubType('point2point')} className="w-4 h-4 text-blue-600" />
                    Point 2 Point
                  </label>
                  <label className="flex items-center gap-2 font-bold text-gray-700 cursor-pointer ml-4">
                    <input type="radio" name="localType" checked={localSubType === 'rental'} onChange={() => setLocalSubType('rental')} className="w-4 h-4 text-blue-600" />
                    Local Rental
                  </label>
                </div>
              )}

              {cabType === 'outstation' && (
                <div className="flex gap-4 border-b border-gray-100 pb-4">
                  <label className="flex items-center gap-2 font-bold text-gray-700 cursor-pointer">
                    <input type="radio" name="outstationType" checked={outstationSubType === 'oneway'} onChange={() => setOutstationSubType('oneway')} className="w-4 h-4 text-blue-600" />
                    One Way
                  </label>
                  <label className="flex items-center gap-2 font-bold text-gray-700 cursor-pointer ml-4">
                    <input type="radio" name="outstationType" checked={outstationSubType === 'roundtrip'} onChange={() => setOutstationSubType('roundtrip')} className="w-4 h-4 text-blue-600" />
                    Round Trip
                  </label>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {cabType === 'local' && localSubType === 'point2point' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pickup City / Location</label>
                      <input type="text" required placeholder="e.g. Mumbai" className="w-full border border-gray-300 rounded-lg px-4 py-3 font-medium outline-none focus:border-blue-500 text-gray-900 bg-white" value={pickupCity} onChange={e => setPickupCity(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Drop Location</label>
                      <input type="text" required placeholder="e.g. Andheri East" className="w-full border border-gray-300 rounded-lg px-4 py-3 font-medium outline-none focus:border-blue-500 text-gray-900 bg-white" value={dropCity} onChange={e => setDropCity(e.target.value)} />
                    </div>
                  </>
                )}

                {cabType === 'local' && localSubType === 'rental' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Service City</label>
                      <input type="text" required placeholder="e.g. Pune" className="w-full border border-gray-300 rounded-lg px-4 py-3 font-medium outline-none focus:border-blue-500 text-gray-900 bg-white" value={pickupCity} onChange={e => setPickupCity(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Package</label>
                      <select className="w-full border border-gray-300 rounded-lg px-4 py-3 font-medium outline-none focus:border-blue-500 text-gray-900 bg-white" value={rentalPackage} onChange={e => setRentalPackage(e.target.value)}>
                        <option>4 Hour 40km</option>
                        <option>8 Hour 80km</option>
                        <option>12 Hour 120km</option>
                      </select>
                    </div>
                  </>
                )}

                {cabType === 'outstation' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pickup City</label>
                      <input type="text" required placeholder="From (e.g. Delhi)" className="w-full border border-gray-300 rounded-lg px-4 py-3 font-medium outline-none focus:border-blue-500 text-gray-900 bg-white" value={pickupCity} onChange={e => setPickupCity(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Destination City</label>
                      <input type="text" required placeholder="To (e.g. Agra)" className="w-full border border-gray-300 rounded-lg px-4 py-3 font-medium outline-none focus:border-blue-500 text-gray-900 bg-white" value={dropCity} onChange={e => setDropCity(e.target.value)} />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* --- HOTEL SEARCH SECTION --- */}
          {mainTab === 'hotel' && (
            <div className="mt-4">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">City or Hotel Name</label>
              <input 
                type="text" 
                required
                placeholder="e.g. Mumbai, Taj Hotel" 
                className="w-full border border-gray-300 rounded-lg px-4 py-3 font-medium outline-none focus:border-blue-500 text-gray-900 bg-white" 
                value={hotelCity} 
                onChange={e => setHotelCity(e.target.value)} 
              />
            </div>
          )}

          {/* SEARCH BUTTON */}
          <div className="mt-8 text-center">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-lg px-12 py-4 rounded-xl shadow-lg transition-transform transform hover:scale-105 w-full md:w-auto">
              SEARCH {mainTab.toUpperCase()}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}