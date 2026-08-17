'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

export default function CityDropdown({
  availableCities,
  resultsCount,
}: {
  availableCities: { name: string; count: number }[]
  resultsCount: number
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentFilter = searchParams.get('filterCity') || 'all'

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    const params = new URLSearchParams(searchParams.toString())

    if (val === 'all') {
      params.delete('filterCity')
    } else {
      params.set('filterCity', val)
    }

    // Soft navigation: Bina page refresh kiye URL aur results update honge
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100 flex items-center gap-4">
      <span className="text-xs md:text-sm font-black uppercase tracking-wider text-gray-500 pl-2">
        Filter City:
      </span>
      <div className="relative flex-1 max-w-[250px] md:max-w-xs">
        <select
          value={currentFilter}
          onChange={handleChange}
          className="w-full appearance-none px-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50 text-gray-800 font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 cursor-pointer transition-all shadow-sm"
        >
          <option value="all">🌍 All Cities ({resultsCount})</option>
          {availableCities.map((city) => (
            <option key={city.name} value={city.name}>
              📍 {city.name} ({city.count})
            </option>
          ))}
        </select>
        {/* Custom Dropdown Arrow */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-xs">
          ▼
        </div>
      </div>
    </div>
  )
}