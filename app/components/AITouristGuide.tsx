"use client"
import { useEffect, useState } from 'react'

export default function AITouristGuide({ 
  placeId,
  targetCity, 
  hasExistingFaqs,
  placeTitle
}: { 
  placeId: string,
  targetCity: string, 
  hasExistingFaqs: boolean,
  placeTitle: string
}) {
  const [aiData, setAiData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 🌟 FIX 2: Combining Place + City properly for specific results
  // For example: "Gateway of India, Mumbai"
  const queryName = targetCity ? `${placeTitle}, ${targetCity}` : placeTitle;
  
  const exactLocationQuery = encodeURIComponent(queryName);
  const hotelSearchUrl = `https://www.google.com/maps/search/Hotels+near+${encodeURIComponent(placeTitle)}`;

  useEffect(() => {
    async function fetchAIGuide() {
      try {
        const res = await fetch('/api/place-guide', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            placeId,
            targetCity: queryName, // Passing exact specific name to AI
            needFaqs: !hasExistingFaqs
          })
        });
        
        if (res.ok) {
          const data = await res.json();
          if(!data.error) {
             setAiData(data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch AI guide", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAIGuide();
  }, [placeId, queryName, hasExistingFaqs]);

  const getCardStyle = (index: number) => {
    const styles = [
      { border: "border-amber-100", shadow: "shadow-amber-100/50 hover:shadow-amber-200/60", bgGlow: "bg-amber-50", iconBg: "bg-amber-100 text-amber-600 border-amber-200/50", bullet: "text-amber-500" },
      { border: "border-blue-100", shadow: "shadow-blue-100/50 hover:shadow-blue-200/60", bgGlow: "bg-blue-50", iconBg: "bg-blue-100 text-blue-600 border-blue-200/50", bullet: "text-blue-500" },
      { border: "border-purple-100", shadow: "shadow-purple-100/50 hover:shadow-purple-200/60", bgGlow: "bg-purple-50", iconBg: "bg-purple-100 text-purple-600 border-purple-200/50", bullet: "text-purple-500" },
      { border: "border-emerald-100", shadow: "shadow-emerald-100/50 hover:shadow-emerald-200/60", bgGlow: "bg-emerald-50", iconBg: "bg-emerald-100 text-emerald-600 border-emerald-200/50", bullet: "text-emerald-500" },
      { border: "border-slate-200", shadow: "shadow-slate-200/50 hover:shadow-slate-300/60", bgGlow: "bg-slate-100", iconBg: "bg-slate-200 text-slate-700 border-slate-300/50", bullet: "text-slate-500" }
    ];
    return styles[index] || styles[0];
  };

  const renderAiContent = (item: any, style: any) => {
    let listItems: string[] = [];

    if (Array.isArray(item.options)) {
      listItems = item.options;
    } else if (Array.isArray(item.description)) {
      listItems = item.description;
    } else if (typeof item.description === 'string') {
      if (item.description.includes('\n') || item.description.includes('•') || item.description.includes('*')) {
        listItems = item.description
          .split('\n')
          .filter((line: string) => line.trim().length > 2)
          .map((line: string) => line.replace(/^[-*•\d.]\s*/, '').trim()); 
      } else {
        return <p className="text-slate-600 font-medium leading-relaxed text-sm md:text-base">{item.description}</p>;
      }
    }

    if (listItems.length > 0) {
      return (
        <ul className="space-y-3">
          {listItems.slice(0, 5).map((opt: string, optIdx: number) => (
            <li key={optIdx} className="text-slate-600 font-medium leading-relaxed text-sm flex items-start gap-2">
              <span className={`${style.bullet} mt-0.5 flex-shrink-0`}>✦</span>
              <span className="flex-1">{opt}</span>
            </li>
          ))}
        </ul>
      );
    }

    return <p className="text-slate-400 italic text-sm">Generating local insights...</p>;
  };

  return (
    <div className="space-y-12 mt-10">
      
      {/* 🗺️ MAP SECTION */}
      <section className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🗺️</span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Location of {placeTitle}</h2>
          </div>
          <a 
            href={hotelSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl text-sm transition-all shadow-sm active:scale-95"
          >
            🏨 Find Nearby Hotels
          </a>
        </div>
        <div className="w-full h-[350px] bg-slate-100 rounded-3xl overflow-hidden border border-slate-200 relative shadow-inner">
          <iframe 
            width="100%" 
            height="100%" 
            style={{ border: 0, position: 'absolute', top: 0, left: 0 }}
            loading="lazy" 
            allowFullScreen 
            referrerPolicy="no-referrer-when-downgrade" 
            src={`https://maps.google.com/maps?q=${exactLocationQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
          ></iframe>
        </div>
      </section>

      {/* ✨ AI GUIDE SECTION */}
      <section className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -z-10 opacity-50"></div>
        
        <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-2xl shadow-sm">
            ✨
          </div>
          <div>
            {/* 🌟 Now it will say exactly: AI Travel Guide for Gateway of India, Mumbai */}
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">AI Travel Guide for {queryName}</h2>
            <p className="text-sm font-bold text-blue-600 mt-1 uppercase tracking-wider">Expert local recommendations</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {loading ? (
            <>
              <div className="h-48 bg-slate-100 rounded-[2rem] w-full animate-pulse border border-slate-200"></div>
              <div className="h-48 bg-slate-100 rounded-[2rem] w-full animate-pulse border border-slate-200"></div>
              <div className="h-48 bg-slate-100 rounded-[2rem] w-full animate-pulse border border-slate-200"></div>
            </>
          ) : (
            <>
              {aiData?.insights && aiData.insights.map((item: any, idx: number) => {
                const style = getCardStyle(idx);
                return (
                  <div key={idx} className={`group relative bg-white p-6 md:p-8 rounded-[2rem] border ${style.border} shadow-md ${style.shadow} hover:shadow-xl transition-all duration-300 z-10 h-full`}>
                    <div className={`absolute top-0 right-0 w-32 h-32 ${style.bgGlow} rounded-full blur-3xl -mr-10 -mt-10 transition-transform duration-500 group-hover:scale-150 -z-10`}></div>
                    
                    <div className={`w-14 h-14 ${style.iconBg} rounded-2xl flex items-center justify-center text-2xl mb-5 shadow-sm border`}>
                      {item.icon || "📍"}
                    </div>
                    
                    <h3 className="text-base md:text-lg font-black text-slate-900 uppercase tracking-wide mb-4 leading-snug">
                      {item.title}
                    </h3>
                    
                    <div className="mt-2">
                      {renderAiContent(item, style)}
                    </div>
                  </div>
                )
              })}
              
              {!aiData?.insights && (
                 <div className="col-span-full p-6 bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 text-center font-bold">
                    No detailed insights available for this location yet. Please check back later!
                 </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ❓ GENERATED FAQS */}
      {!hasExistingFaqs && aiData?.faqs && !loading && (
        <section className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
            <span className="text-3xl">❓</span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Frequently Asked Questions about {queryName}</h2>
          </div>
          <div className="space-y-4">
            {aiData.faqs.map((faq: any, idx: number) => (
              <div key={idx} className="bg-slate-50 rounded-2xl p-6 border border-slate-100 shadow-sm transition-all hover:shadow-md">
                <h3 className="font-bold text-slate-900 text-lg mb-2">Q: {faq.question}</h3>
                <p className="text-slate-600 font-medium leading-relaxed">A: {faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  )
}