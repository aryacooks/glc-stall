# NEXORA — Same You. Different Era.
### Interactive AI Photo Booth Experience for the GLC Stall

> Turn Moments Into New Worlds.

Nexora is a web-based AI photo transformation platform built for live booth stalls and events. It features a tactile, warm neo-editorial design (modeled after LocalFlow), zero-lag live synchronization, and a volunteer-driven pipeline that enables realistic AI portrait transformations with zero per-generation API overhead.

---

## 🏗️ System Architecture

```
                               ┌────────────────────────────────┐
                               │   Visitor's Mobile (/capture)  │
                               │  - Live HTML5 Camera           │
                               │  - Era Selector (1980s, Cyber) │
                               └───────────────┬────────────────┘
                                               │
                                               ▼
┌───────────────────────────────┐     ┌────────────────────────────────┐
│  Live TV Display (/display)   │     │  Supabase / Local Sync Engine  │
│  - QR Code Attract Screen     │◄────┤  - Storage Bucket (Photos)     │
│  - Scanline Radar Progress    │     │  - Realtime Event Channel      │
│  - Before/After Split Curtain │     └────────────────┬───────────────┘
└───────────────────────────────┘                      │
                                               ▲       ▼
                               ┌───────────────┴────────────────┐
                               │  Operator Station (/operator)  │
                               │  - 1-Click Copy Photo (Cmd+V)  │
                               │  - 1-Click Copy Prompt         │
                               │  - Dropzone for ChatGPT Output │
                               │  - Auto Nexora Watermarking    │
                               └────────────────────────────────┘
```

---

## 🌟 Key Features

1. **📱 Visitor Mobile Web App (`/capture`)**
   - Fullscreen camera viewfinder with front/back camera toggling.
   - Six aesthetic eras: **1980s Retro Synthwave**, **Cyberpunk 2077**, **Studio Ghibli**, **Early 2000s Y2K Pop**, **1920s Noir**, and **Renaissance Master Oil**.
   - Generates sequential ticket numbers (`#NEX-101`) and sends photos to the stall queue instantly.

2. **💻 Volunteer / Operator Station (`/operator`)**
   - Live incoming queue of attendee photos.
   - **Theme Selector & Override**: The volunteer can view the chosen style and switch the aesthetic era on the fly (Cyberpunk, 1980s Retro, Studio Ghibli, 2000s Y2K, 1920s Noir, Renaissance) before sending to AI.
   - **Direct Counter Capture**: Volunteers can take photos or upload files directly from the desk and assign a theme immediately.
   - **n8n Automation Station**: One-click **"⚡ Send to n8n"** button or toggle **"Auto-Dispatch"** to automatically send every incoming photo to your n8n workflow.
   - **One-Click Copy Photo & Prompt**: Fallback manual mode to copy straight to OS clipboard for `Cmd+V` in ChatGPT.
   - **Auto-Watermarking**: Automatically attaches the official Nexora translucent brand bar and era badge.
   - **1-Click Prototype Demo**: Test the full transformation loop in 2 seconds without opening ChatGPT.

4. **🤖 n8n Automated Pipeline (`/n8n`)**
   - Ready-to-import template: `n8n/nexora-chatgpt-workflow.json`.
   - Listens on `POST /webhook/nexora-transform`, feeds image and prompt into ChatGPT OAuth, and posts result back to `POST /api/webhook/n8n`.
   - The TV display automatically transitions to the reveal screen when n8n finishes!

3. **📺 Live TV Presentation Screen (`/display`)**
   - Fullscreen mode for stall TV/monitors.
   - Attract mode with live QR code for visitors to scan.
   - Kinetic scanline radar loading sequence (`Synthesizing 1980s Retro Era... 68%`).
   - Dramatic before-and-after split-curtain wipe animation revealing the transformed portrait.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the Stall Command Hub.

---

## 🗄️ Database Schema (Supabase SQL)

Run the following in your Supabase project's SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS nexora_photos (
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
  "updatedAt" BIGINT NOT NULL
);

ALTER TABLE nexora_photos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public all access" ON nexora_photos;
CREATE POLICY "Allow public all access" ON nexora_photos FOR ALL USING (true) WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE nexora_photos;
```

---

## 🛠️ Tech Stack
- **Framework**: Next.js 14 (App Router)
- **UI & Styling**: Tailwind CSS, Lucide React, Custom LocalFlow Design Tokens
- **Animations**: CSS Scanlines, Framer Motion, Canvas Confetti
- **Backend & Storage**: Supabase Database & Storage, LocalStorage / BroadcastChannel Realtime Bus
