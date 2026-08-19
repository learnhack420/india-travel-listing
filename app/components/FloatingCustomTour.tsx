"use client"
import { useState } from 'react'
import CustomTourModal from './CustomTourModal'

export default function FloatingCustomTour() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      {/* Floating Button - Fixed on bottom right, slightly above WhatsApp */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-24 right-5 md:bottom-28 md:right-8 z-[90] flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white px-4 py-3 md:px-5 md:py-3.5 rounded-full font-black shadow-[0_8px_30px_rgba(245,158,11,0.4)] hover:shadow-[0_12px_40px_rgba(245,158,11,0.6)] transition-all transform hover:-translate-y-1 animate-bounce"
        style={{ animationDuration: '3s' }}
      >
        <span className="text-lg md:text-xl">✨</span> 
        <span className="text-sm md:text-base">Plan Custom Tour</span>
      </button>

      {/* Modal component yaha render hoga */}
      <CustomTourModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}