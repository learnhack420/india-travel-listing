import { supabase } from '../../utils/supabase'
import Link from 'next/link'
import type { Metadata } from 'next'
import VendorInfoCard from '../components/VendorInfoCard' 

export const metadata: Metadata = {
  title: 'Verified Travel Partners | India Tour Operators',
  description: 'Find verified local travel agencies, cab operators, and hotel partners by state.',
}

export default async function VendorsPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ [key: string]: string | undefined }> 
}) {
  const resolvedParams = await searchParams
  const state = resolvedParams.state

  // Fetch approved vendors
  let query = supabase
    .from('profiles')
    .select('*')
    .eq('role', 'vendor')
    .eq('approval_status', 'approved')

  // Filter by state if provided in URL
  if (state) {
    query = query.ilike('state', `%${state}%`)
  }

  const { data: vendors, error } = await query.order('created_at', { ascending: false })

  if (error) console.error('Error fetching vendors:', error)

  const displayState = state || 'All Locations'

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      
      {/* 🌟 SEARCH STYLE HEADER */}
      <div className="bg-blue-800 text-white py-12 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <Link href="/" className="text-blue-200 hover:text-white text-sm font-bold mb-4 inline-block transition-colors">
            ← Back to Home
          </Link>
          <h1 className="text-3xl md:text-4xl font-extrabold mt-2 tracking-tight">
            Verified Vendors in <span className="text-[#ff5a00]">{displayState}</span>
          </h1>
          <p className="text-blue-200 mt-2 text-lg">
            Connect directly with {vendors?.length || 0} trusted local travel agencies and cab operators.
          </p>
        </div>
      </div>

      {/* 🌟 VENDOR RESULTS GRID */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 mt-12">
        {vendors && vendors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {vendors.map((vendor: any) => (
              <div key={vendor.id} className="h-full">
                <VendorInfoCard vendorId={vendor.id} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm max-w-3xl mx-auto">
            <span className="text-6xl block mb-6 drop-shadow-md">🏢</span>
            <h2 className="text-2xl font-bold text-gray-800">No vendors found</h2>
            <p className="text-gray-500 mt-2 max-w-md mx-auto text-lg">
              We currently do not have any registered vendors in <strong className="text-gray-800">{displayState}</strong>.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link href="/register" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors">
                Join as a Partner
              </Link>
            </div>
          </div>
        )}
      </div>

    </main>
  )
}