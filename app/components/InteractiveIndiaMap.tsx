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
      <div className="w-full max-w-3xl mx-auto mt-12 bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl h-96 flex items-center justify-center">
        <div className="text-white font-bold animate-pulse text-xl tracking-widest flex flex-col items-center gap-4">
          <span className="text-4xl">🌍</span>
          Initializing Map...
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      // 🌟 ULTRA PREMIUM CONTAINER STYLING 🌟
      className="w-full max-w-3xl mx-auto mt-12 bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-2xl p-6 md:p-10 rounded-[2.5rem] border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] relative overflow-hidden select-none group"
    >
      {/* 🌟 Background Ambient Glow (Sirf container ke andar) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none transition-opacity duration-700 opacity-50 group-hover:opacity-80"></div>
      
      <div className="text-center mb-10 relative z-20">
        {/* 🌟 GRADIENT HEADING */}
        <h3 className="text-3xl md:text-5xl font-black mb-3 tracking-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-100">Select a State to </span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-500">Explore</span>
        </h3>
        <p className="text-blue-200/80 text-sm md:text-base font-medium mb-6 tracking-wide">
          Click on the interactive map or select from the list below
        </p>
        
        {/* 🌟 PREMIUM STATE DROPDOWN */}
        <div className="max-w-sm mx-auto relative z-20">
          <div className="relative group/dropdown">
            <select
              onChange={(e) => handleStateClick(e.target.value)}
              defaultValue=""
              className="w-full appearance-none bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold px-6 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent cursor-pointer shadow-lg transition-all duration-300"
            >
              <option value="" disabled className="text-slate-900 font-bold">
                📍 Search by State Name...
              </option>
              {indianStates.map((state) => (
                <option key={state} value={state} className="text-slate-900 font-medium">
                  {state}
                </option>
              ))}
            </select>
            {/* Custom SVG Icon for Dropdown */}
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-white/50 group-hover/dropdown:text-amber-400 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      {/* 🌟 GLOWING EXACT CURSOR TOOLTIP */}
      {hoveredState && (
        <div 
          className="absolute pointer-events-none z-50 bg-slate-900/80 backdrop-blur-md border border-amber-400/50 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(251,191,36,0.3)] whitespace-nowrap flex items-center gap-2 -translate-x-1/2 -translate-y-[120%] transition-all duration-75 ease-out"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
          }}
        >
          <span className="text-amber-400 drop-shadow-md">📍</span>
          <span className="tracking-wide">{hoveredState}</span>
        </div>
      )}

      {/* Map Container */}
      <div className="relative w-full aspect-square md:aspect-[4/3] flex justify-center items-center z-10 scale-[1.02] hover:scale-[1.03] transition-transform duration-700 ease-out">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 1100, // Thoda aur bada kiya hai taaki premium lage
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
                        fill: "rgba(255, 255, 255, 0.15)", // Premium semi-transparent glass look
                        stroke: "rgba(255, 255, 255, 0.4)", // Soft white borders
                        strokeWidth: 0.7,
                        outline: "none",
                      },
                      hover: {
                        fill: "rgba(251, 191, 36, 0.8)", // Rich glowing amber
                        stroke: "#ffffff", // Pure white border on hover
                        strokeWidth: 1.5,
                        outline: "none",
                        cursor: "pointer",
                        transition: "all 0.3s ease-in-out",
                      },
                      pressed: {
                        fill: "rgba(245, 158, 11, 1)",
                        stroke: "#ffffff",
                        strokeWidth: 2,
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