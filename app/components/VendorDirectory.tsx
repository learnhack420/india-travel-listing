"use client"
import { useState, useRef } from 'react'

interface VendorDirectoryProps {
  groupedVendors: Record<string, any[]>;
  stateData: any[];
}

export default function VendorDirectory({ groupedVendors, stateData }: VendorDirectoryProps) {
  const availableStates = Object.keys(groupedVendors).sort()
  const [activeState, setActiveState] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const getStateImage = (stateName: string) => {
    const found = stateData.find(s => s.name.toLowerCase() === stateName.toLowerCase())
    return found ? found.img : 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=800&auto=format&fit=crop'
  }

  const handleStateClick = (state: string) => {
    if (activeState === state) {
      setActiveState(null) // Toggle off if already open
    } else {
      setActiveState(state)
      setTimeout(() => {
        listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 150)
    }
  }

  if (availableStates.length === 0) return null;

  return (
    <div className="w-full">
      {/* 🌟 IMAGE GRID FOR STATES (Like Destination Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {availableStates.map((state, idx) => {
          const vendorCount = groupedVendors[state].length;
          const isActive = activeState === state;
          
          return (
            <button 
              key={idx} 
              onClick={() => handleStateClick(state)}
              className={`group relative h-64 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 text-left w-full border-[3px] ${isActive ? 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'border-transparent'}`}
            >
              {/* Background Image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={getStateImage(state)} 
                alt={state} 
                className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} 
              />
              
              {/* Dark Gradient Overlay */}
              <div className={`absolute inset-0 transition-opacity duration-300 ${isActive ? 'bg-slate-900/60' : 'bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent'}`}></div>
              
              {/* Content Container */}
              <div className="absolute bottom-0 left-0 p-6 w-full">
                <h3 className="text-2xl font-bold text-white mb-2 shadow-sm drop-shadow-md">{state}</h3>
                
                {/* Badge Count */}
                <span className={`backdrop-blur-md text-[10px] uppercase tracking-wider font-bold px-4 py-1.5 rounded-full transition-colors ${isActive ? 'bg-amber-500 text-slate-900 border-amber-400' : 'bg-white/20 border border-white/20 text-white'}`}>
                  {vendorCount} {vendorCount === 1 ? 'Partner' : 'Partners'}
                </span>
              </div>

              {/* Active Arrow Indicator */}
              {isActive && (
                <div className="absolute top-4 right-4 bg-amber-500 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                  ↓
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* 🌟 UNIQUE STYLE VENDOR LIST FOR SELECTED STATE */}
      {activeState && (
        <div ref={listRef} className="mt-12 bg-slate-900 rounded-[2.5rem] p-6 md:p-10 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500">
          
          {/* Background Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none"></div>

          <div className="flex justify-between items-center mb-8 relative z-10 border-b border-slate-700 pb-4">
            <h3 className="text-2xl md:text-3xl font-black text-white">
              Partners in <span className="text-amber-400">{activeState}</span>
            </h3>
            <button onClick={() => setActiveState(null)} className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 w-10 h-10 rounded-full flex items-center justify-center transition-colors">
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
            {groupedVendors[activeState].map((vendor) => {
              const firmName = vendor.company_name || vendor.full_name || 'Verified Partner';
              const mobile = vendor.phone || 'N/A';
              const address = vendor.location || vendor.address || `${vendor.city || ''}, ${vendor.state || ''}`.replace(/^, /, '');
              const website = vendor.website ? (vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`) : null;
              
              return (
                <div key={vendor.id} className="relative group p-[1px] rounded-[2rem] overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800 hover:from-amber-400 hover:to-orange-500 transition-all duration-500">
                  <div className="bg-slate-800/90 backdrop-blur-xl h-full rounded-[2rem] p-6 md:p-8 flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
                    
                    {/* Logo Section */}
                    <div className="relative">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-inner overflow-hidden border-4 border-slate-700 group-hover:border-amber-400 transition-colors flex-shrink-0 z-10 relative">
                        {vendor.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={vendor.logo_url} alt="Logo" className="w-full h-full object-contain p-2" />
                        ) : (
                          <span className="text-3xl">🏢</span>
                        )}
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-lg border-2 border-slate-800 z-20">
                        VERIFIED
                      </div>
                    </div>

                    {/* Info Section */}
                    <div className="flex-1 w-full">
                      <h4 className="text-xl font-black text-white mb-1 group-hover:text-amber-400 transition-colors leading-tight">{firmName}</h4>
                      <p className="text-sm text-slate-400 font-medium mb-4 flex items-center justify-center sm:justify-start gap-1.5">
                        <span>📍</span> {address || 'Location not specified'}
                      </p>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                        {mobile !== 'N/A' && (
                          <a href={`tel:${mobile}`} className="flex items-center gap-2 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white border border-blue-500/30 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm">
                            📞 {mobile}
                          </a>
                        )}
                        {website && (
                          <a href={website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-slate-700/50 hover:bg-amber-500 text-slate-300 hover:text-slate-900 border border-slate-600 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm">
                            🌐 Visit Website
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}