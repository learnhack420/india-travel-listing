"use client"
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { ComposableMap, Geographies, Geography } from "react-simple-maps"

const geoUrl = "/india-states.json"

// 🌟 Sabhi Indian States aur UTs ki list Dropdown ke liye
const indianStates = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam",
  "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir",
  "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha",
  "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
]

export default function InteractiveIndiaMap() {
  const router = useRouter()
  const [hoveredState, setHoveredState] = useState<string | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleStateClick = (stateName: string) => {
    if (!stateName) return
    router.push(`/search?destination=${encodeURIComponent(stateName)}`)
  }

  // Cursor ke exact point ko track karne ka function
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
    }
  }

  if (!isMounted) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-12 bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-2xl h-96 flex items-center justify-center">
        <div className="text-white font-bold animate-pulse text-xl">Loading Map... 🗺️</div>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="w-full max-w-2xl mx-auto mt-12 bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-2xl relative overflow-hidden select-none"
    >
      <div className="text-center mb-6">
        <h3 className="text-2xl font-black text-white drop-shadow-md">Select a State to Explore</h3>
        <p className="text-blue-200 text-sm font-medium mb-4">Click on the map or select from the list below</p>
        
        {/* 🌟 NAYA STATE DROPDOWN */}
        <div className="max-w-xs mx-auto relative z-20">
          <select
            onChange={(e) => handleStateClick(e.target.value)}
            defaultValue=""
            className="w-full appearance-none bg-white/10 backdrop-blur-md border border-white/30 text-white font-bold px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer shadow-lg transition-all"
          >
            <option value="" disabled className="text-slate-900 font-bold">
              🌍 Search by State Name...
            </option>
            {indianStates.map((state) => (
              <option key={state} value={state} className="text-slate-900 font-medium">
                {state}
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white text-xs">
            ▼
          </div>
        </div>
      </div>
      
      {/* 🌟 EXACT CURSOR POINT TOOLTIP */}
      {hoveredState && (
        <div 
          className="absolute pointer-events-none z-50 bg-slate-900/90 border border-amber-400/50 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-2xl whitespace-nowrap flex items-center gap-1.5 -translate-x-1/2 -translate-y-full mb-2 backdrop-blur-sm transition-all duration-75 ease-out"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y - 10}px`,
          }}
        >
          <span>📍</span>
          <span>{hoveredState}</span>
        </div>
      )}

      {/* Map Container */}
      <div className="relative w-full aspect-square md:aspect-[4/3] flex justify-center items-center">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 1000, 
            center: [80, 22]
          }}
          style={{ width: "100%", height: "100%" }}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const stateName = geo.properties.State_Name || geo.properties.NAME_1 || geo.properties.ST_NM || geo.properties.name
                
                return (
                  <Geography
                    key={geo.rsmKey || geo.properties.ID_1 || Math.random()}
                    geography={geo}
                    onClick={() => handleStateClick(stateName)}
                    onMouseEnter={() => setHoveredState(stateName)}
                    onMouseLeave={() => setHoveredState(null)}
                    style={{
                      default: {
                        fill: "#e0f2fe",
                        stroke: "#0369a1",
                        strokeWidth: 0.8,
                        outline: "none",
                      },
                      hover: {
                        fill: "#fbbf24",
                        stroke: "#b45309",
                        strokeWidth: 1.5,
                        outline: "none",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      },
                      pressed: {
                        fill: "#f59e0b",
                        outline: "none",
                      }
                    }}
                  />
                )
              })
            }
          </Geographies>
        </ComposableMap>
      </div>
    </div>
  )
}