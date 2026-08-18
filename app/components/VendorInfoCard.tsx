"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase' 

export default function VendorInfoCard({ vendorId }: { vendorId?: string }) {
  const [vendor, setVendor] = useState<any>({
    full_name: 'Raj Cabs & Tours',
    company_name: 'Raj Cabs Official',
    phone: '9892455466',
    address: 'Mumbai, Maharashtra',
    website: 'https://www.tourismdna.com',
    logo_url: '' // 🌟 Default fallback mein empty logo
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (vendorId) {
      fetchVendorDetails()
    }
  }, [vendorId])

  async function fetchVendorDetails() {
    try {
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', vendorId)
        .single()

      if (!error && data) {
        setVendor(data)
      }
    } catch (err) {
      console.error("Using default vendor fallback due to fetch error", err)
    }
  }

  const firmName = vendor?.company_name || vendor?.full_name || 'Raj Cabs & Tours'
  const mobile = vendor?.phone || '9892455466'
  const address = vendor?.address || vendor?.location || 'Mumbai, Maharashtra'
  const website = (vendor?.website || 'https://www.tourismdna.com').trim()
  const formattedWebsite = website.startsWith('http') ? website : `https://${website}`
  
  // 🌟 NEW: Extract Logo URL
  const logoUrl = vendor?.logo_url

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-3xl shadow-xl border border-slate-700 my-6">
      <div className="flex items-center gap-4 mb-4">
        
        {/* 🌟 LOGO YA DEFAULT ICON RENDER KARNE KA LOGIC */}
        {logoUrl ? (
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-inner overflow-hidden border border-slate-600 p-1 flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt={`${firmName} Logo`} className="w-full h-full object-contain" />
          </div>
        ) : (
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-2xl font-black shadow-inner flex-shrink-0">
            🏢
          </div>
        )}

        <div>
          <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Listed By Partner</span>
          <h3 className="text-lg font-black text-white leading-tight">{firmName}</h3>
        </div>
      </div>

      <div className="space-y-2.5 text-sm text-slate-300 border-t border-slate-700/60 pt-4">
        
        {/* Address */}
        <div className="flex items-start gap-3">
          <span className="text-base">📍</span>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Firm Address</span>
            <span className="font-medium text-slate-200">{address}</span>
          </div>
        </div>

        {/* Phone */}
        <div className="flex items-center gap-3 pt-1">
          <span className="text-base">📞</span>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Direct Contact</span>
            <a href={`tel:${mobile}`} className="font-bold text-blue-400 hover:underline">
              {mobile}
            </a>
          </div>
        </div>

        {/* Website Link Row */}
        {formattedWebsite && (
          <div className="flex items-center gap-3 pt-1">
            <span className="text-base">🌐</span>
            <div>
              <span className="text-xs font-semibold text-slate-400 block">Official Website</span>
              <a 
                href={formattedWebsite} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="font-bold text-blue-400 hover:underline truncate block max-w-[240px]"
              >
                {website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          </div>
        )}

      </div>

      <div className="mt-5 pt-3 border-t border-slate-700/40 flex items-center justify-between text-xs text-slate-400 font-medium">
        <span>✅ Verified Local Partner</span>
        <span className="text-green-400 font-bold">● Active</span>
      </div>
    </div>
  )
}