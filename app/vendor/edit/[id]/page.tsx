"use client"
import { useEffect } from 'react'
import { supabase } from '../../../../utils/supabase'
import { useRouter, useParams } from 'next/navigation'

export const runtime = 'edge';

export default function EditListingRouter() {
  const router = useRouter()
  const params = useParams()
  const listingId = params.id as string

  useEffect(() => {
    routeToCorrectEditPage()
  }, [])

  async function routeToCorrectEditPage() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }

    // Listing ki category check karna
    const { data, error } = await supabase
      .from('listings')
      .select('category, vendor_id')
      .eq('id', listingId)
      .single()

    if (error || !data) {
      alert("Listing nahi mili ya delete ho chuki hai.")
      router.push('/vendor')
      return
    }

    if (data.vendor_id !== session.user.id) {
      alert("Aap is listing ko edit nahi kar sakte.")
      router.push('/vendor')
      return
    }

    // Category ke hisaab se sahi EDIT form par redirect karna
    if (data.category === 'tour') {
      router.push(`/vendor/edit/tour/${listingId}`)
    } else if (data.category === 'cab') {
      router.push(`/vendor/edit/cab/${listingId}`)
    } else if (data.category === 'hotel') {
      router.push(`/vendor/edit/hotel/${listingId}`)
    } else {
      router.push('/vendor') // Fallback
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-xl font-bold text-gray-700 animate-pulse">
        Opening Editor...
      </div>
    </div>
  )
}