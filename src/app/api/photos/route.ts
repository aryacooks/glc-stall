import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://hjwgcfqwjsalpimggtbk.supabase.co';

const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqd2djZnF3anNhbHBpbWdndGJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY0NDMyMCwiZXhwIjoyMTA1MjIwMzIwfQ.hcIe0LaJv5_1hMV-YxYqMcdslst7-ovoEn19G3Z8IhE';

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const globalStore = globalThis as unknown as {
  nexoraPhotosStore?: any[];
};

if (!globalStore.nexoraPhotosStore) {
  globalStore.nexoraPhotosStore = [];
}

// Helper to upload base64 to Supabase Storage
async function uploadBase64ToSupabase(base64Data: string, filename: string): Promise<string> {
  if (!supabaseAdmin) return base64Data;

  try {
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return base64Data; // Not a base64 string or already an HTTP URL
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
      console.warn('Storage upload warning:', error.message);
      return base64Data;
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('stall-photos')
      .getPublicUrl(filename);

    return urlData.publicUrl;
  } catch (err) {
    console.warn('Storage upload failed, retaining data uri', err);
    return base64Data;
  }
}

export async function GET() {
  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('nexora_photos')
        .select('*')
        .order('createdAt', { ascending: false });

      if (!error && data && data.length > 0) {
        return NextResponse.json({ success: true, photos: data });
      }
    } catch (e) {
      // Fallback to memory
    }
  }

  return NextResponse.json({
    success: true,
    photos: globalStore.nexoraPhotosStore || []
  });
}

export async function POST(req: Request) {
  try {
    const photo = await req.json();

    // 1. Upload raw photo to Supabase storage if base64
    if (photo.rawPhotoUrl && photo.rawPhotoUrl.startsWith('data:')) {
      const filename = `raw_${photo.id || Date.now()}.jpg`;
      photo.rawPhotoUrl = await uploadBase64ToSupabase(photo.rawPhotoUrl, filename);
    }

    // 2. Try inserting into Supabase DB table
    if (supabaseAdmin) {
      try {
        const { error } = await supabaseAdmin
          .from('nexora_photos')
          .upsert([photo]);
        if (error) {
          console.warn('DB upsert notice:', error.message);
        }
      } catch (err) {
        console.warn('DB upsert failed:', err);
      }
    }

    // 3. Keep in global LAN store
    if (!globalStore.nexoraPhotosStore) {
      globalStore.nexoraPhotosStore = [];
    }
    globalStore.nexoraPhotosStore = [
      photo,
      ...globalStore.nexoraPhotosStore.filter((p: any) => p.id !== photo.id)
    ];

    return NextResponse.json({
      success: true,
      photo
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
