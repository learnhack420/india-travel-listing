import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { placeId, targetCity, needFaqs } = body;
    
    const apiKey = process.env.GEMINI_API_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY is missing" }, { status: 500 });
    if (!supabaseUrl || !supabaseKey) return NextResponse.json({ error: "Supabase credentials missing" }, { status: 500 });

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 🌟 1. CHECK DEDICATED CACHE TABLE FIRST
    if (placeId) {
      try {
        const { data: cachedRow } = await supabase
          .from('ai_guide_cache')
          .select('data')
          .eq('place_id', placeId)
          .single();

        if (cachedRow?.data?.insights) {
          console.log(`⚡ Using DEDICATED Cache Table for place ID: ${placeId}`);
          return NextResponse.json(cachedRow.data);
        }
      } catch (dbErr) {
        // Table khali ho ya error ho, toh fresh fetch karenge
      }
    }

    console.log(`⏳ Fetching fresh AI Data from Gemini for: ${targetCity}...`);

    // 🌟 2. FETCH GEMINI DATA
    const modelsReq = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const modelsData = await modelsReq.json();
    let selectedModel = "models/gemini-2.5-flash"; 
    if (modelsData?.models) {
        const validModels = modelsData.models.filter((m: any) => m.name.includes("gemini") && m.name.includes("flash"));
        if (validModels.length > 0) selectedModel = validModels[0].name;
    }

    const prompt = `Act as an expert local travel guide for ${targetCity}, India.
    Provide practical and engaging local recommendations in a professional English tone.
    Respond in strict JSON format ONLY with:
    1. "insights": EXACTLY 5 objects (Famous Food, Hotels, Shopping, Hidden Gems, Parking). Keys: "title", "options" (array of up to 5 short strings), "icon" (emoji).
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

    // 🌟 3. SAVE TO NEW DEDICATED CACHE TABLE
    if (placeId) {
      try {
        const { error: insertErr } = await supabase
          .from('ai_guide_cache')
          .upsert({ 
            place_id: placeId, 
            data: finalData 
          }, { onConflict: 'place_id' }); // Upsert taaki duplicate na ho

        if (insertErr) {
          console.error("❌ CACHE INSERT ERROR:", insertErr);
        } else {
          console.log("✅ SUCCESS! AI Data saved to ai_guide_cache table for:", targetCity);
        }
      } catch (saveErr) {
        console.error("❌ CRITICAL CACHE ERROR:", saveErr);
      }
    }

    return NextResponse.json(finalData);

  } catch (error: any) {
    console.error("❌ API Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}