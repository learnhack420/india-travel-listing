"use client"
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ComposableMap, Geographies, Geography } from "react-simple-maps"

// 🌟 100% Permanent Solution: Loading map directly from your public folder!
const geoUrl = "/india-states.json"

export default function InteractiveIndiaMap() {
  const router = useRouter()
  const [hoveredState, setHoveredState] = useState<string | null>(null)
  
  // SSR mismatch ko rokne ke liye
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Jab kisi state par click ho
  const handleStateClick = (stateName: string) => {
    if (!stateName) return
    router.push(`/search?destination=${stateName}`)
  }

  // Jab tak component mount na ho, loading dikhayein
  if (!isMounted) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-12 bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-2xl h-96 flex items-center justify-center">
        <div className="text-white font-bold animate-pulse text-xl">Loading Map... 🗺️</div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto mt-12 bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-2xl relative">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-black text-white drop-shadow-md">Select a State to Explore</h3>
        <p className="text-blue-200 text-sm font-medium">Click on the map to find tours, cabs, and hotels</p>
      </div>
      
      {/* Tooltip for hovering */}
      {hoveredState && (
        <div className="absolute top-10 right-10 bg-white text-slate-900 px-5 py-2.5 rounded-xl font-black shadow-xl animate-fade-in z-50 flex items-center gap-2 border border-blue-100">
          📍 Explore {hoveredState}
        </div>
      )}

      {/* Map Container */}
      <div className="relative w-full aspect-square md:aspect-[4/3] flex justify-center items-center">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 1000, 
            center: [80, 22] // Exact center coordinates of India
          }}
          style={{ width: "100%", height: "100%" }}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                // 👇 YAHAN CHANGE KIYA HAI: 'State_Name' add kiya hai 
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
                        fill: "#e0f2fe", // Light Blue/White map color
                        stroke: "#0369a1", // Dark blue border line
                        strokeWidth: 1,
                        outline: "none",
                      },
                      hover: {
                        fill: "#fbbf24", // Amber-400 (Hover karne par yellow)
                        stroke: "#b45309",
                        strokeWidth: 1.5,
                        outline: "none",
                        cursor: "pointer",
                        transition: "all 0.3s"
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