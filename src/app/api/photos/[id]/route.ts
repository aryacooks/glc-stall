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

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const updates = await req.json();

    // If transformed photo is base64, store in Supabase Storage
    if (updates.transformedPhotoUrl && updates.transformedPhotoUrl.startsWith('data:')) {
      const filename = `transformed_${id}_${Date.now()}.jpg`;
      updates.transformedPhotoUrl = await uploadBase64ToSupabase(updates.transformedPhotoUrl, filename);
    }

    // Update in Supabase DB if available
    if (supabaseAdmin) {
      try {
        await supabaseAdmin
          .from('nexora_photos')
          .update(updates)
          .eq('id', id);
      } catch (err) {
        console.warn('DB update failed:', err);
      }
    }

    // Update in local memory
    const photos = globalStore.nexoraPhotosStore || [];
    const index = photos.findIndex((p: any) => p.id === id);

    let updated;
    if (index !== -1) {
      updated = {
        ...photos[index],
        ...updates,
        updatedAt: Date.now()
      };
      photos[index] = updated;
    } else {
      updated = { id, ...updates, updatedAt: Date.now() };
      photos.push(updated);
    }

    globalStore.nexoraPhotosStore = photos;

    return NextResponse.json({ success: true, photo: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    if (supabaseAdmin) {
      try {
        await supabaseAdmin
          .from('nexora_photos')
          .delete()
          .eq('id', id);
      } catch (err) {
        console.warn('DB delete warning:', err);
      }
    }

    const photos = globalStore.nexoraPhotosStore || [];
    globalStore.nexoraPhotosStore = photos.filter((p: any) => p.id !== id);

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

