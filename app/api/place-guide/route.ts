import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    // 🌟 ADDED 'placeTitle' here to get exact place name for headings
    const { placeId, targetCity, needFaqs, placeTitle } = body; 
    const destination = placeTitle || targetCity; // Prefer placeTitle, fallback to targetCity
    
    const apiKey = process.env.GEMINI_API_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseKey = serviceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Supabase credentials missing on live server" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    if (placeId) {
      try {
        const { data: cachedRow } = await supabase
          .from('ai_guide_cache')
          .select('data')
          .eq('place_id', placeId)
          .single();

        if (cachedRow?.data?.insights) {
          console.log(`⚡ Data found in NEW Table for: ${destination}`);
          return NextResponse.json(cachedRow.data);
        }
      } catch (dbErr) {
        // Data nahi mila, Gemini se fresh fetch karenge
      }
    }

    console.log(`⏳ Fetching STRICTLY FRESH AI Data from Gemini for: ${destination}...`);

    if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY is missing" }, { status: 500 });

    const modelsReq = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const modelsData = await modelsReq.json();
    let selectedModel = "models/gemini-2.5-flash"; 
    if (modelsData?.models) {
        const validModels = modelsData.models.filter((m: any) => m.name.includes("gemini") && m.name.includes("flash"));
        if (validModels.length > 0) selectedModel = validModels[0].name;
    }

    // 🌟 STRICT PROMPT FOR DYNAMIC SENTENCE HEADINGS
    const prompt = `Act as an expert local travel guide for ${destination}, India.
    Provide practical and engaging local recommendations in a highly professional pure English tone.
    Respond in strict JSON format ONLY with:
    1. "insights": EXACTLY 6 objects in this order (Famous Food, Hotels, Shopping, Hidden Gems, Parking, Activity). 
       Each object MUST have:
       - "title": A complete, engaging sentence heading including the place name (e.g., "Best Shopping Spots near ${destination}", "Parking Options around ${destination}", "Must-Try Food near ${destination}"). Do NOT use boring 1-2 word generic titles.
       - "options": An array of EXACTLY 4 to 5 short strings (bullet points). Do NOT write a paragraph.
       - "icon": A relevant emoji.
    ${needFaqs ? `2. "faqs": EXACTLY 5 FAQs (keys: "question", "answer").` : ''}
    Ensure ONLY a valid JSON object is returned without markdown.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${selectedModel}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const rawData = await response.json();
    if (rawData.error) throw new Error(rawData.error.message);

    let generatedText = rawData.candidates[0].content.parts[0].text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const finalData = JSON.parse(generatedText);

    // 🌟 SAVE FRESH FORMATTED DATA TO NEW TABLE
    if (placeId) {
      try {
        await supabase
          .from('ai_guide_cache')
          .upsert({ place_id: placeId, data: finalData }, { onConflict: 'place_id' });
      } catch (saveErr) {
        console.error("❌ Failed to save to cache:", saveErr);
      }
    }

    return NextResponse.json(finalData);

  } catch (error: any) {
    console.error("❌ API Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}