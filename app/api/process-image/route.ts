import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

// Ensure your Environment Variables are correctly set in Cloudflare/Vercel
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { imageUrl } = await req.json();

    // 1. Fetch image from the external URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();

    // 2. Generate a Unique Filename
    // Extracting extension from contentType (e.g., 'image/jpeg' -> 'jpeg')
    let extension = contentType.split('/')[1] || 'jpg';
    if (extension === 'jpeg') extension = 'jpg';
    
    const fileName = `tour-images/${Date.now()}-${Math.floor(Math.random() * 1000)}.${extension}`;

    // 3. Upload to Supabase Storage (ArrayBuffer supports edge environments like Cloudflare)
    const { data, error } = await supabase.storage
      .from('public-images')
      .upload(fileName, arrayBuffer, { 
        contentType: contentType,
        upsert: false
      });

    if (error) {
      throw new Error(`Supabase Upload Error: ${error.message}`);
    }

    // 4. Get the Public URL
    const { data: publicUrlData } = supabase.storage
      .from('public-images')
      .getPublicUrl(fileName);

    return NextResponse.json({ success: true, url: publicUrlData.publicUrl });
    
  } catch (error: any) {
    console.error("Image Upload API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}