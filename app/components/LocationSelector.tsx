"use client"
import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../utils/supabase'

interface Location {
  id: string
  label: string
}

interface LocationSelectorProps {
  label: string
  selected: string | string[]
  onChange: (val: any) => void
  multiple?: boolean
  placeholder?: string
}

const DEFAULT_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir'
]

export default function LocationSelector({ label, selected, onChange, multiple = false, placeholder }: LocationSelectorProps) {
  const [locations, setLocations] = useState<Location[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  
  // Smart Inline Add States
  const [isInlineAdding, setIsInlineAdding] = useState(false)
  const [areaInput, setAreaInput] = useState('') 
  const [cityInput, setCityInput] = useState('') 
  const [stateName, setStateName] = useState('Maharashtra')
  const [country, setCountry] = useState('India')
  
  // Dropdown visibility states
  const [stateSearchOpen, setStateSearchOpen] = useState(false)
  const [citySearchOpen, setCitySearchOpen] = useState(false)

  useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    const { data, error } = await supabase.from('locations').select('*').order('label', { ascending: true })
    if (data && !error) setLocations(data)
  }

  const filteredLocations = useMemo(() => {
    return locations.filter(loc => 
      loc.label.toLowerCase().includes(search.toLowerCase())
    )
  }, [locations, search])

  const filteredStates = useMemo(() => {
    return DEFAULT_STATES.filter(s => 
      s.toLowerCase().includes(stateName.toLowerCase())
    )
  }, [stateName])

  // 🌟 NEW: Extract Unique Cities from existing locations dynamically
  const uniqueCities = useMemo(() => {
    const cities = new Set<string>()
    locations.forEach(loc => {
      const parts = loc.label.split(' > ').map(p => p.trim())
      // Format: [Area >] City > State > Country
      // City is always the 3rd element from the end
      if (parts.length >= 3) {
        cities.add(parts[parts.length - 3])
      } else if (parts.length > 0) {
        cities.add(parts[0])
      }
    })
    return Array.from(cities).sort()
  }, [locations])

  // 🌟 NEW: Filter Cities for the City Dropdown
  const filteredCities = useMemo(() => {
    return uniqueCities.filter(c => 
      c.toLowerCase().includes(cityInput.toLowerCase())
    )
  }, [uniqueCities, cityInput])

  const handleSelect = (locLabel: string) => {
    if (multiple) {
      const currentSelected = Array.isArray(selected) ? selected : []
      if (currentSelected.includes(locLabel)) {
        onChange(currentSelected.filter(item => item !== locLabel))
      } else {
        onChange([...currentSelected, locLabel])
      }
    } else {
      onChange(locLabel)
      setIsOpen(false)
    }
  }

  // Smart trigger
  const startSmartAdd = (query: string) => {
    setCityInput(query) 
    setAreaInput('')
    setIsInlineAdding(true)
    setCitySearchOpen(false)
    setStateSearchOpen(false)
  }

  const handleSaveInlineLocation = async () => {
    if (!cityInput.trim() || !stateName.trim() || !country.trim()) {
      return alert("City, State aur Country bharna zaroori hai!")
    }
    
    let newLabel = ''
    if (areaInput.trim()) {
      newLabel = `${areaInput.trim()} > ${cityInput.trim()} > ${stateName.trim()} > ${country.trim()}`
    } else {
      newLabel = `${cityInput.trim()} > ${stateName.trim()} > ${country.trim()}`
    }
    
    const { data, error } = await supabase.from('locations').insert([{ label: newLabel }]).select().single()
    
    if (error) {
      alert("Error saving location. Shayad yeh exact combination pehle se add hai.")
    } else if (data) {
      const updatedList = [...locations, data].sort((a, b) => a.label.localeCompare(b.label))
      setLocations(updatedList)
      handleSelect(data.label) 
      setIsInlineAdding(false)
      setSearch('')
      setCityInput('')
      setAreaInput('')
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if(confirm('Kya aap sach mein is location ko delete karna chahte hain?')) {
      await supabase.from('locations').delete().eq('id', id)
      fetchLocations()
    }
  }

  const selectedArray = Array.isArray(selected) ? selected : (selected ? [selected] : [])

  return (
    <div className="relative w-full">
      <label className="block text-sm font-bold text-gray-700 mb-1">{label}</label>
      
      {/* Selector Display */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 border rounded-lg bg-gray-50 flex flex-wrap gap-2 items-center cursor-pointer min-h-[42px]"
      >
        {selectedArray.length === 0 && <span className="text-gray-400">{placeholder || 'Select Location...'}</span>}
        
        {selectedArray.map((sel, idx) => (
          <span key={idx} className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
            {sel}
            {multiple && (
              <button type="button" onClick={(e) => { e.stopPropagation(); handleSelect(sel) }} className="text-blue-500 hover:text-red-500">✕</button>
            )}
          </span>
        ))}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-xl max-h-[400px] overflow-hidden flex flex-col">
          
          {/* SEARCH BAR */}
          <div className="p-2 border-b bg-gray-50 sticky top-0 z-20">
            <input 
              type="text" 
              placeholder="🔍 Search location..." 
              className="w-full px-3 py-1.5 text-sm border rounded-md outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                if (isInlineAdding) setIsInlineAdding(false)
              }}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>

          {/* SMART INLINE ADD FORM */}
          {isInlineAdding ? (
            <div 
              className="p-3 bg-blue-50 border-b space-y-3" 
              onClick={(e) => {
                e.stopPropagation();
                // Close dropdowns if clicked on the background of the form
                setCitySearchOpen(false);
                setStateSearchOpen(false);
              }}
            >
              <div className="text-xs font-bold text-blue-800">
                ✨ Add New Location (Create custom combination):
              </div>

              <div>
                <label className="text-[10px] text-gray-500 font-bold">Area / Landmark (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Lonavala Station"
                  className="w-full px-2 py-1.5 text-sm border rounded bg-white text-black focus:ring-1 focus:ring-blue-500 outline-none" 
                  value={areaInput} 
                  onChange={(e) => setAreaInput(e.target.value)} 
                />
              </div>
              
              {/* 🌟 NEW: City Dropdown/Input Field */}
              <div className="relative">
                <label className="text-[10px] text-gray-500 font-bold">City / Destination *</label>
                <input 
                  type="text" 
                  className="w-full px-2 py-1.5 text-sm border rounded bg-white text-black focus:ring-1 focus:ring-blue-500 outline-none" 
                  value={cityInput} 
                  onChange={(e) => {
                    setCityInput(e.target.value)
                    setCitySearchOpen(true)
                    setStateSearchOpen(false)
                  }}
                  onFocus={() => {
                    setCitySearchOpen(true)
                    setStateSearchOpen(false)
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                {citySearchOpen && filteredCities.length > 0 && (
                  <div className="absolute z-30 w-full bg-white border rounded shadow-md max-h-32 overflow-y-auto mt-1">
                    {filteredCities.map((ct) => (
                      <div 
                        key={ct} 
                        className="px-3 py-1.5 text-xs hover:bg-blue-50 cursor-pointer text-gray-700 font-medium"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCityInput(ct)
                          setCitySearchOpen(false)
                        }}
                      >
                        {ct}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <label className="text-[10px] text-gray-500 font-bold">State *</label>
                <input 
                  type="text" 
                  className="w-full px-2 py-1.5 text-sm border rounded bg-white text-black focus:ring-1 focus:ring-blue-500 outline-none" 
                  value={stateName} 
                  onChange={(e) => {
                    setStateName(e.target.value)
                    setStateSearchOpen(true)
                    setCitySearchOpen(false)
                  }}
                  onFocus={() => {
                    setStateSearchOpen(true)
                    setCitySearchOpen(false)
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                {stateSearchOpen && filteredStates.length > 0 && (
                  <div className="absolute z-30 w-full bg-white border rounded shadow-md max-h-28 overflow-y-auto mt-1">
                    {filteredStates.map((st) => (
                      <div 
                        key={st} 
                        className="px-3 py-1.5 text-xs hover:bg-blue-50 cursor-pointer text-gray-700 font-medium border-b border-gray-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          setStateName(st)
                          setStateSearchOpen(false)
                        }}
                      >
                        {st}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] text-gray-500 font-bold">Country *</label>
                <input 
                  type="text" 
                  className="w-full px-2 py-1.5 text-sm border rounded bg-white text-black focus:ring-1 focus:ring-blue-500 outline-none" 
                  value={country} 
                  onChange={(e) => setCountry(e.target.value)} 
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={handleSaveInlineLocation} className="bg-green-600 text-white text-xs px-3 py-2 rounded font-bold flex-1 hover:bg-green-700">Save & Select</button>
                <button type="button" onClick={() => setIsInlineAdding(false)} className="bg-gray-300 text-gray-800 text-xs px-3 py-2 rounded font-bold flex-1 hover:bg-gray-400">Cancel</button>
              </div>
            </div>
          ) : null}

          {/* 🌟 NEW: Add Button is ALWAYS Visible if search is not empty */}
          {!isInlineAdding && search.trim() !== '' && (
            <div className="p-2 bg-amber-50 border-b" onClick={(e) => e.stopPropagation()}>
              <button 
                type="button" 
                onClick={(e) => { e.stopPropagation(); startSmartAdd(search.trim()) }}
                className="w-full bg-blue-600 text-white text-xs px-3 py-2.5 rounded-lg font-bold hover:bg-blue-700 shadow-sm transition-all"
              >
                + Add "{search.trim()}" to a New State/Location
              </button>
            </div>
          )}

          {/* LOCATION LIST */}
          <div className="overflow-y-auto max-h-60 flex-1 bg-white">
            {filteredLocations.length > 0 ? (
              filteredLocations.map((loc) => (
                <div key={loc.id} className="flex justify-between items-center px-4 py-2.5 hover:bg-blue-50 border-b cursor-pointer transition-colors" onClick={() => handleSelect(loc.label)}>
                  <span className={`text-sm ${selectedArray.includes(loc.label) ? 'font-bold text-blue-600' : 'text-gray-700'}`}>
                    {selectedArray.includes(loc.label) ? '✓ ' : ''}{loc.label}
                  </span>
                  <button type="button" onClick={(e) => handleDelete(e, loc.id)} className="text-red-400 hover:text-red-600 text-xs font-bold px-2 py-1 rounded hover:bg-red-50">Delete</button>
                </div>
              ))
            ) : (
              <div className="p-6 text-center">
                <p className="text-sm text-gray-500">No matching locations found.</p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}