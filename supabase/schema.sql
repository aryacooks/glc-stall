-- ==============================================================================
-- NEXORA PHOTO BOOTH — COMPLETE SUPABASE BACKEND SCHEMA
-- ==============================================================================
-- Instructions: Copy and paste this entire script into your Supabase SQL Editor
-- (Dashboard -> SQL Editor -> New Query -> Paste -> Click 'Run').
-- ==============================================================================

-- 1. Create the photos queue table
CREATE TABLE IF NOT EXISTS public.nexora_photos (
  id TEXT PRIMARY KEY,
  "ticketNumber" TEXT NOT NULL,
  "guestName" TEXT NOT NULL,
  "styleId" TEXT NOT NULL,
  "rawPhotoUrl" TEXT NOT NULL,
  "transformedPhotoUrl" TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  progress INTEGER DEFAULT 0,
  "statusMessage" TEXT,
  "createdAt" BIGINT NOT NULL,
  "updatedAt" BIGINT NOT NULL,
  "apiCost" DOUBLE PRECISION DEFAULT 0,
  "modelUsed" TEXT
);

-- Migration helpers if table already exists
ALTER TABLE public.nexora_photos ADD COLUMN IF NOT EXISTS "apiCost" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE public.nexora_photos ADD COLUMN IF NOT EXISTS "modelUsed" TEXT;

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.nexora_photos ENABLE ROW LEVEL SECURITY;

-- 3. Create permissive policies for stall kiosk & anonymous mobile uploads
DROP POLICY IF EXISTS "Allow public all access" ON public.nexora_photos;
CREATE POLICY "Allow public all access" 
ON public.nexora_photos 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 4. Enable Supabase Realtime for instant multi-screen sync
-- (Powers live updates on Operator Desk & TV Exhibition Screen)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'nexora_photos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.nexora_photos;
  END IF;
END $$;

-- 5. Create Storage Bucket for photo uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stall-photos', 
  'stall-photos', 
  true, 
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 10485760;

-- 6. Storage Bucket RLS Policies (Allow public uploads, reads, and deletes)
DROP POLICY IF EXISTS "Public Access to stall-photos" ON storage.objects;
CREATE POLICY "Public Access to stall-photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'stall-photos');

DROP POLICY IF EXISTS "Public Upload to stall-photos" ON storage.objects;
CREATE POLICY "Public Upload to stall-photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'stall-photos');

DROP POLICY IF EXISTS "Public Update stall-photos" ON storage.objects;
CREATE POLICY "Public Update stall-photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'stall-photos');

DROP POLICY IF EXISTS "Public Delete stall-photos" ON storage.objects;
CREATE POLICY "Public Delete stall-photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'stall-photos');
