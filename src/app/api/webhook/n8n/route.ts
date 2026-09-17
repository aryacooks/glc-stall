import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabaseAdmin = (SUPABASE_URL && SERVICE_KEY)
  ? createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })
  : null;

const globalStore = globalThis as unknown as {
  nexoraPhotosStore?: any[];
};

if (!globalStore.nexoraPhotosStore) {
  globalStore.nexoraPhotosStore = [];
}

async function uploadBase64ToSupabase(base64Data: string, filename: string): Promise<string> {
  if (!supabaseAdmin) return base64Data;

  try {
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return base64Data;
    }

    const contentType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');

    const { data, error } = await supabaseAdmin.storage
      .from('stall-photos')
      .upload(filename, buffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.warn('Storage upload error:', error.message);
      return base64Data;
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('stall-photos')
      .getPublicUrl(filename);

    return urlData.publicUrl;
  } catch (err) {
    console.warn('Storage upload failed:', err);
    return base64Data;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { photoId, transformedPhotoUrl, imageUrl } = body;
    const finalUrl = transformedPhotoUrl || imageUrl;

    if (!photoId || !finalUrl) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: photoId and transformedPhotoUrl (or imageUrl)' 
      }, { status: 400 });
    }

    let hostedUrl = finalUrl;
    if (finalUrl.startsWith('data:')) {
      const filename = `transformed_${photoId}_${Date.now()}.jpg`;
      hostedUrl = await uploadBase64ToSupabase(finalUrl, filename);
    }

    const updates = {
      transformedPhotoUrl: hostedUrl,
      status: 'ready',
      progress: 100,
      statusMessage: 'Transformation complete via n8n & ChatGPT',
      updatedAt: Date.now()
    };

    // 1. Update in Supabase DB
    if (supabaseAdmin) {
      const { error } = await supabaseAdmin
        .from('nexora_photos')
        .update(updates)
        .eq('id', photoId);

      if (error) {
        console.warn('Supabase webhook update warning:', error.message);
      }
    }

    // 2. Update in local memory cache
    const photos = globalStore.nexoraPhotosStore || [];
    const index = photos.findIndex((p: any) => p.id === photoId);
    if (index !== -1) {
      photos[index] = { ...photos[index], ...updates };
    }
    globalStore.nexoraPhotosStore = photos;

    return NextResponse.json({
      success: true,
      message: 'Photo transformation updated successfully',
      photoId,
      transformedPhotoUrl: hostedUrl
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
