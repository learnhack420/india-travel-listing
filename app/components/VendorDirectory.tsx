"use client"
import Link from 'next/link'

interface VendorDirectoryProps {
  groupedVendors: Record<string, any[]>;
  stateData: any[];
}

export default function VendorDirectory({ groupedVendors, stateData }: VendorDirectoryProps) {
  const availableStates = Object.keys(groupedVendors).sort()

  const getStateImage = (stateName: string) => {
    const found = stateData.find(s => s.name.toLowerCase() === stateName.toLowerCase())
    return found ? found.img : 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=800&auto=format&fit=crop'
  }

  if (availableStates.length === 0) return null;

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {availableStates.map((state, idx) => {
          const vendorCount = groupedVendors[state].length;
          
          return (
            <Link 
              key={idx} 
              href={`/vendors?state=${encodeURIComponent(state)}`}
              className="group relative h-64 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 text-left w-full border-[3px] border-transparent hover:border-amber-500 block"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={getStateImage(state)} 
                alt={state} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent transition-opacity duration-300 group-hover:bg-slate-900/60"></div>
              
              <div className="absolute bottom-0 left-0 p-6 w-full">
                <h3 className="text-2xl font-bold text-white mb-2 shadow-sm drop-shadow-md">{state}</h3>
                <span className="backdrop-blur-md text-[10px] uppercase tracking-wider font-bold px-4 py-1.5 rounded-full transition-colors bg-white/20 border border-white/20 text-white group-hover:bg-amber-500 group-hover:text-slate-900 group-hover:border-amber-400">
                  {vendorCount} {vendorCount === 1 ? 'Vendor' : 'Vendors'}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}