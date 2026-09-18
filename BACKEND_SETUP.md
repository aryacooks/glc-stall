# ⚡ NEXORA — Complete Backend Setup Guide

This guide is for anyone cloning the **NEXORA GLC Stall** repository who wants to set up their own backend from scratch using **Supabase**.

---

## 🤖 Instructions for Antigravity AI Assistant

If you are using Google DeepMind's **Antigravity** or another AI coding assistant, simply paste this prompt into the chat:

> *"Please set up and verify my Supabase backend for NEXORA following the instructions in `BACKEND_SETUP.md`. My Supabase project URL and keys are in `.env.local`."*

### What Antigravity will do automatically:
1. Verify that `.env.local` contains `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
2. Inspect or apply the schema in `supabase/schema.sql`.
3. Run `npm run setup:backend` to verify storage bucket and table connectivity.
4. Launch the application and confirm multi-device sync.

---

## 📋 Architecture Overview

NEXORA uses 3 core Supabase features:
1. **PostgreSQL Database (`nexora_photos`)**: Stores queue items, guest names, ticket numbers (`NEX-101`), theme selections, and status.
2. **Supabase Storage (`stall-photos`)**: High-performance public CDN storage bucket for guest portraits and AI transformed portraits.
3. **Supabase Realtime (WebSockets)**: Automatically broadcasts inserts, updates, and deletes across visitor mobile phones, the volunteer workstation (`/operator`), and the TV exhibition screen (`/display`).

---

## 🚀 Quick Setup Guide (5 Steps)

### Step 1: Create a Supabase Project
1. Go to [database.new](https://database.new) or [supabase.com/dashboard](https://supabase.com/dashboard).
2. Click **New project**, select an organization, name your project (e.g. `nexora-glc-stall`), and choose a strong database password.
3. Choose a region closest to your stall event location.
4. Wait ~1 minute for the project to finish provisioning.

---

### Step 2: Grab Your API Keys
In your Supabase project dashboard:
1. Navigate to **Project Settings** (gear icon in the left sidebar) → **API**.
2. Copy the following 3 values:
   - **Project URL** (e.g., `https://xyzcompany.supabase.co`)
   - **Project API keys → `anon` `public`** (starts with `ey...`)
   - **Project API keys → `service_role` `secret`** (starts with `ey...`)

---

### Step 3: Create Your `.env.local` File
In the root directory of this project, create a file named `.env.local` (or copy `.env.example`):

```bash
cp .env.example .env.local
```

Paste your copied keys:

```ini
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI...

# Optional: Host URL for QR codes (defaults to http://localhost:3000 in dev)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> [!NOTE]
> `NEXT_PUBLIC_*` variables are exposed to client-side browser bundles (mobile upload & operator screen).
> `SUPABASE_SERVICE_ROLE_KEY` is only used on the server (`/api/photos`) for administrative storage uploads and maintenance.

---

### Step 4: Run the Complete Database & Storage SQL Script

1. In your Supabase dashboard, click on **SQL Editor** in the left sidebar.
2. Click **+ New Query**.
3. Copy the entire contents of [`supabase/schema.sql`](./supabase/schema.sql) (also printed below) and paste it into the editor:

```sql
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
  "createdAt" BIGINT NOT NULL,
  "updatedAt" BIGINT NOT NULL,
  "apiCost" DOUBLE PRECISION DEFAULT 0,
  "modelUsed" TEXT
);

-- Migration for existing tables:
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
```

4. Click **Run** (or press Cmd+Enter / Ctrl+Enter).
5. You should see `Success. No rows returned`.

---

### Step 5: Test & Verify Backend Connection

In your terminal, run the automated diagnostic script:

```bash
npm run setup:backend
```

Expected output:
```
==============================================
🚀 NEXORA SUPABASE BACKEND DIAGNOSTIC & SETUP
==============================================
Target Project URL : https://your-project.supabase.co
Anon Key Present   : ✅ YES (208 chars)
Service Key Present: ✅ YES (219 chars)

1. Testing Supabase Storage Bucket ("stall-photos")...
✅ Storage bucket "stall-photos" exists and is ready!

2. Testing Database Table ("nexora_photos")...
✅ Table "nexora_photos" exists and is reachable!

==============================================
🎉 Verification Finished!
==============================================
```

---

## 🧪 Testing Your Live Flow

1. **Start the local server**:
   ```bash
   npm run dev
   ```
   > The dev server binds to `0.0.0.0:3000`, so phones on the same Wi-Fi can open `http://<your-laptop-ip>:3000/capture`.

2. **Open the Operator Desk**:
   Navigate to `http://localhost:3000/operator` on your computer.

3. **Open in Incognito Mode**:
   Open a separate Incognito / Private window at `http://localhost:3000/operator`.

4. **Add a Photo**:
   Click **+ Desk Capture** in the regular browser window, or open `http://localhost:3000/capture` on your phone, choose an era, and submit.

5. **Verify Realtime Sync**:
   - The photo should immediately appear in **both** the regular browser window and the Incognito window!
   - Delete a photo from one window — it will instantly vanish from both!

---

## 🛠️ Database Schema Reference (`nexora_photos`)

| Column Name | Type | Description |
|---|---|---|
| `id` | `TEXT PRIMARY KEY` | Unique ID (e.g. `photo_1789644320_a1b2c`) |
| `ticketNumber` | `TEXT NOT NULL` | Human-friendly ticket number (e.g. `NEX-101`) |
| `guestName` | `TEXT NOT NULL` | Guest name or nickname |
| `styleId` | `TEXT NOT NULL` | Selected era ID (e.g. `1980s`, `1920s`, `cyberpunk2077`) |
| `rawPhotoUrl` | `TEXT NOT NULL` | Public Supabase Storage URL or compressed data URL |
| `transformedPhotoUrl`| `TEXT` | Public CDN URL of AI transformed portrait from ChatGPT |
| `status` | `TEXT NOT NULL` | Status (`queued`, `processing`, `ready`, `displayed`) |
| `progress` | `INTEGER` | Percentage integer (0 to 100) |
| `statusMessage` | `TEXT` | Display message (e.g. `Transforming to 1980s Disco...`) |
| `createdAt` | `BIGINT NOT NULL` | Epoch timestamp in milliseconds |
| `updatedAt` | `BIGINT NOT NULL` | Epoch timestamp in milliseconds |

---

## ❓ Troubleshooting

#### 1. Photos show in one window but not in Incognito or Phone
- Run `npm run setup:backend` to ensure the table and bucket are reachable.
- Verify that step 4 (SQL script) was executed so `ALTER PUBLICATION supabase_realtime ADD TABLE public.nexora_photos;` is active.

#### 2. Storage upload fails with `403 AccessDenied` or `RLS violation`
- Make sure queries in **Step 6** of `supabase/schema.sql` were run. They grant public insert/select permissions to `storage.objects` for bucket `'stall-photos'`.

#### 3. Phone camera does not turn on
- Modern mobile browsers (iOS Safari, Android Chrome) block camera access on non-HTTPS origins (except `localhost`).
- Use the **"Choose from Gallery"** button on HTTP connections, or deploy to Vercel/Cloudflare with HTTPS for live camera viewfinder access.
