"use client"
import { useState } from 'react'

interface CustomTourModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CustomTourModal({ isOpen, onClose }: CustomTourModalProps) {
  const [step, setStep] = useState(1)

  // STEP 1 STATES: Trip Details
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [pickupLocation, setPickupLocation] = useState('')
  
  // Dynamic Places to Visit
  const [placesToVisit, setPlacesToVisit] = useState<string[]>([])
  const [currentPlace, setCurrentPlace] = useState('')
  
  // Cab Options
  const [cabOption, setCabOption] = useState('')
  const [customCabOption, setCustomCabOption] = useState('')
  
  const [requirements, setRequirements] = useState('')

  // STEP 2 STATES: Personal Details
  const [name, setName] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)
  const [needHotel, setNeedHotel] = useState('Yes')

  // 🌟 ACTUAL WHATSAPP NUMBER
  const ADMIN_WHATSAPP_NUMBER = "919892455466" 

  if (!isOpen) return null;

  const handleAddPlace = () => {
    if (currentPlace.trim() !== '') {
      setPlacesToVisit([...placesToVisit, currentPlace.trim()])
      setCurrentPlace('')
    }
  }

  const handleRemovePlace = (index: number) => {
    setPlacesToVisit(placesToVisit.filter((_, i) => i !== index))
  }

  const handleNext = () => {
    if (!startDate || !pickupLocation || placesToVisit.length === 0) {
      alert("Please fill Start Date, Pickup Location and at least 1 Destination.")
      return
    }
    setStep(2)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name || !whatsappNumber) {
      alert("Please enter Name and WhatsApp Number.")
      return
    }

    const finalCab = cabOption === 'Other' ? customCabOption : cabOption;
    
    const message = `*🌟 New Custom Tour Enquiry 🌟*
    
*📅 Trip Dates:* ${startDate} to ${endDate || 'Not decided'}
*📍 Pickup Location:* ${pickupLocation}
*🗺️ Places to Visit:* ${placesToVisit.join(', ')}
*🚖 Cab Required:* ${finalCab || 'Not sure'}
*🏨 Need Hotel:* ${needHotel}

*👥 Travelers:* ${adults} Adults, ${children} Children
*📝 Specific Requirements:* ${requirements || 'None'}

*👤 Customer Details:*
*Name:* ${name}
*WhatsApp No:* ${whatsappNumber}

_Generated via IndiaTourOperators.com_`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    onClose(); 
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl relative flex flex-col max-h-[90vh] my-auto animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-blue-50/50 rounded-t-3xl shrink-0">
          <div>
            <h2 className="text-2xl font-black text-slate-800">Plan Your Custom Tour</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Step {step} of 2: {step === 1 ? 'Trip Details' : 'Contact Info'}
            </p>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors shadow-sm border border-slate-200">
            ✕
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {step === 1 ? (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Start Date *</label>
                  <input type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">End Date (Optional)</label>
                  <input type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Pickup City / Location *</label>
                <input type="text" placeholder="e.g. Mumbai Airport, Pune, etc." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} required />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Places to Visit *</label>
                <div className="flex gap-2 mb-3">
                  <input 
                    type="text" 
                    placeholder="e.g. Lonavala, Khandala..." 
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" 
                    value={currentPlace} 
                    onChange={(e) => setCurrentPlace(e.target.value)} 
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPlace())}
                  />
                  <button type="button" onClick={handleAddPlace} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 rounded-xl transition-colors shrink-0">
                    Add
                  </button>
                </div>
                
                {placesToVisit.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    {placesToVisit.map((place, index) => (
                      <span key={index} className="bg-white border border-slate-200 shadow-sm text-slate-700 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2">
                        {place}
                        <button type="button" onClick={() => handleRemovePlace(index)} className="text-red-500 hover:text-red-700">✕</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Cab Preference</label>
                <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium mb-2 cursor-pointer" value={cabOption} onChange={(e) => setCabOption(e.target.value)}>
                  <option value="">-- Select Cab Type --</option>
                  <option value="Hatchback (4 Seater)">Hatchback (4 Seater)</option>
                  <option value="Sedan (4 Seater)">Sedan (Dzire, Etios etc.)</option>
                  <option value="SUV (6 Seater)">SUV (Innova, Crysta etc.)</option>
                  <option value="Tempo Traveller">Tempo Traveller (12+ Seater)</option>
                  <option value="Other">Other (Type Custom)</option>
                </select>
                
                {cabOption === 'Other' && (
                  <input type="text" placeholder="Please specify cab requirement..." className="w-full px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 font-medium" value={customCabOption} onChange={(e) => setCustomCabOption(e.target.value)} />
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Any Specific Requirements?</label>
                <textarea rows={3} placeholder="Tell us more about your trip plan..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium resize-none" value={requirements} onChange={(e) => setRequirements(e.target.value)}></textarea>
              </div>

            </div>
          ) : (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Your Name *</label>
                  <input type="text" placeholder="John Doe" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">WhatsApp Number *</label>
                  <div className="flex">
                    <span className="bg-slate-100 border border-slate-200 border-r-0 px-4 py-3 rounded-l-xl text-slate-600 font-bold">+91</span>
                    <input type="tel" placeholder="9876543210" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-r-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, ''))} maxLength={10} required />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Number of Travelers *</label>
                <div className="flex gap-4">
                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center">
                    <span className="font-bold text-slate-600">Adults</span>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => setAdults(Math.max(1, adults - 1))} className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 font-bold flex items-center justify-center">-</button>
                      <span className="font-black text-lg w-4 text-center">{adults}</span>
                      <button type="button" onClick={() => setAdults(adults + 1)} className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 font-bold flex items-center justify-center">+</button>
                    </div>
                  </div>
                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center">
                    <span className="font-bold text-slate-600">Children</span>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => setChildren(Math.max(0, children - 1))} className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 font-bold flex items-center justify-center">-</button>
                      <span className="font-black text-lg w-4 text-center">{children}</span>
                      <button type="button" onClick={() => setChildren(children + 1)} className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 font-bold flex items-center justify-center">+</button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Accommodation Requirement? *</label>
                <div className="flex gap-4">
                  <button 
                    type="button" 
                    onClick={() => setNeedHotel('Yes')} 
                    className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${needHotel === 'Yes' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}
                  >
                    🏨 Yes, Need Hotel
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setNeedHotel('No')} 
                    className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${needHotel === 'No' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}
                  >
                    ❌ No Hotel
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 bg-white rounded-b-3xl shrink-0 flex gap-4">
          {step === 2 && (
            <button onClick={() => setStep(1)} className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-2xl transition-colors">
              ← Back
            </button>
          )}
          
          {step === 1 ? (
            <button onClick={handleNext} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-transform hover:-translate-y-1 shadow-lg shadow-blue-600/30 text-lg">
              Next Step →
            </button>
          ) : (
            <button onClick={handleSubmit} className="flex-1 bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-2xl transition-transform hover:-translate-y-1 shadow-lg shadow-green-500/30 text-lg flex items-center justify-center gap-2">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.405-.883-.733-1.48-1.638-1.653-1.935-.173-.298-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.015c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
              Submit on WhatsApp
            </button>
          )}
        </div>
      </div>
    </div>
  )
}