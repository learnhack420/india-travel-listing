import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';



export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { placeId, targetCity, needFaqs } = body;
    
    const apiKey = process.env.GEMINI_API_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is missing" }, { status: 500 });
    }

    // Safe Supabase initialization for Edge/Cloudflare
    let supabase = null;
    if (supabaseUrl && supabaseKey) {
      supabase = createClient(supabaseUrl, supabaseKey);
    }

    // 🌟 1. Check Database Cache First
    if (placeId && supabase) {
      try {
        const { data: existingPlace } = await supabase
          .from('listings')
          .select('metadata')
          .eq('id', placeId)
          .single();

        if (existingPlace?.metadata?.ai_guide) {
          console.log(`⚡ Using Cached AI Data for place ID: ${placeId}`);
          return NextResponse.json(existingPlace.metadata.ai_guide);
        }
      } catch (dbErr) {
        console.log("Cache fetch skipped/failed, proceeding to AI generation.");
      }
    }

    console.log(`⏳ Fetching fresh AI Data for: ${targetCity}...`);

    // 🌟 2. Fetch Gemini Models List
    const modelsReq = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const modelsData = await modelsReq.json();
    
    let selectedModel = "models/gemini-2.5-flash"; 
    if (modelsData && modelsData.models) {
        const validModels = modelsData.models.filter((m: any) => 
            m.supportedGenerationMethods && 
            m.supportedGenerationMethods.includes("generateContent") &&
            m.name.includes("gemini")
        );
        if (validModels.length > 0) {
            const flashModel = validModels.find((m: any) => m.name.includes("flash"));
            selectedModel = flashModel ? flashModel.name : validModels[0].name;
        }
    }

    // 🌟 3. Generate Content from Gemini
    const prompt = `Act as an expert local travel guide for ${targetCity}, India.
    Provide the following information in strict JSON format ONLY. 
    1. "food": 2-3 sentences about what local food a tourist MUST eat here (in English).
    2. "shopping": 2-3 sentences about what to shop and the best local markets (in English).
    3. "famous": 2-3 sentences about what this city/place is most famous for (in English).
    ${needFaqs ? `4. "faqs": Provide EXACTLY 5 frequently asked questions and answers for a tourist visiting ${targetCity}. Format as an array of objects with "question" and "answer" keys.` : ''}
    
    Ensure the response is ONLY a valid JSON object. Do not add markdown like \`\`\`json.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${selectedModel}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const rawData = await response.json();
    
    if (rawData.error) {
      return NextResponse.json({ error: rawData.error.message }, { status: 500 });
    }

    let generatedText = rawData.candidates[0].content.parts[0].text;
    generatedText = generatedText.replace(/```json/gi, '').replace(/```/g, '').trim();

    const finalData = JSON.parse(generatedText);

    // 🌟 4. Save to Database Cache (Non-blocking)
    if (placeId && supabase) {
      try {
        const { data: currentPlace } = await supabase
          .from('listings')
          .select('metadata')
          .eq('id', placeId)
          .single();

        const updatedMetadata = {
          ...(currentPlace?.metadata || {}),
          ai_guide: finalData
        };

        await supabase
          .from('listings')
          .update({ metadata: updatedMetadata })
          .eq('id', placeId);
      } catch (saveErr) {
        console.error("Failed to cache to DB:", saveErr);
      }
    }

    return NextResponse.json(finalData);

  } catch (error: any) {
    console.error("❌ Cloudflare Worker Route Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate AI guide" }, { status: 500 });
  }
}