'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Camera, Tv, Users, Sparkles, ArrowUpRight, Copy, Check, 
  ExternalLink, Layers, QrCode, Monitor, Smartphone, Cpu, ShieldCheck
} from 'lucide-react';
import QRCodeLib from 'qrcode';

export default function StallHub() {
  const [qrUrl, setQrUrl] = useState<string>('');
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.title = 'NEXORA 🎪 Stall Hub & Visitor Portal';
      const captureUrl = `${window.location.origin}/capture`;
      QRCodeLib.toDataURL(captureUrl, {
        width: 200,
        margin: 1,
        color: {
          dark: '#1E1E1E',
          light: '#FAF8F4',
        },
      }).then(setQrUrl).catch(console.error);
    }
  }, []);

  const copyMobileLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(`${window.location.origin}/capture`);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-ink-900 flex flex-col justify-between p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* TOP NAV BAR */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-2 border-ink-900/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-terracotta text-white font-serif font-black text-xl flex items-center justify-center border-2 border-ink-900 shadow-brutal-sm">
            N
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl font-extrabold tracking-tight text-ink-900">
                NEXORA
              </h1>
              <span className="localflow-badge-orange text-[10px] font-mono">
                GLC Stall Portal
              </span>
            </div>
            <p className="text-xs font-mono uppercase tracking-widest text-ink-500 font-bold">
              Turn Moments Into New Worlds • Same You. Different Era.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="localflow-badge-green flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
            System Online
          </span>
          <span className="localflow-badge-neutral">v1.0 Ready</span>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="localflow-card p-6 md:p-10 relative overflow-hidden bg-white">
        <div className="max-w-2xl space-y-4">
          <span className="localflow-badge-orange text-xs font-mono font-bold uppercase tracking-wider">
            GLC Stall Live Command Center
          </span>
          <h2 className="font-serif text-3xl md:text-5xl font-black tracking-tight text-ink-900 leading-tight">
            The Interactive AI Photo Booth Experience
          </h2>
          <p className="text-sm md:text-base text-ink-700 leading-relaxed font-normal">
            Welcome to the Nexora stall station. Below are the three interfaces that drive the booth experience: the <strong>Guest Mobile Camera</strong>, the <strong>Volunteer Operator Station</strong> (with 1-click ChatGPT clipboard flow), and the <strong>Live TV Display</strong> (with kinetic scanlines & dramatic before/after reveal).
          </p>
        </div>
      </section>

      {/* 3 PRIMARY STALL INTERFACES (CARD GRID) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* INTERFACE 1: MOBILE CAMERA */}
        <div className="localflow-card p-6 flex flex-col justify-between space-y-6 hover:-translate-y-0.5 transition-transform bg-[#FAF8F4]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 border-2 border-ink-900 flex items-center justify-center shadow-brutal-sm">
                <Smartphone className="w-5 h-5" />
              </div>
              <span className="localflow-badge-neutral text-[10px] font-mono font-bold">
                Guest Facing
              </span>
            </div>

            <div>
              <h3 className="font-serif text-xl font-bold text-ink-900">
                1. Mobile Camera
              </h3>
              <p className="text-xs font-mono text-terracotta font-bold mt-0.5">
                /capture
              </p>
              <p className="text-xs text-ink-600 mt-2 leading-relaxed">
                Scan with any phone to open the camera, capture a portrait, select an era (Cyberpunk, 1980s, Ghibli, Noir), and push directly to the stall screen.
              </p>
            </div>

            {/* QR Code Preview */}
            <div className="p-3 bg-white rounded-xl border border-ink-900/20 flex items-center gap-3">
              <div className="w-20 h-20 bg-canvas rounded-lg border border-ink-900/30 flex-shrink-0 flex items-center justify-center p-1">
                {qrUrl ? (
                  <img src={qrUrl} alt="QR Code for mobile" className="w-full h-full object-contain" />
                ) : (
                  <QrCode className="w-8 h-8 text-ink-400 animate-pulse" />
                )}
              </div>
              <div className="text-[11px] font-mono space-y-1">
                <span className="font-bold text-ink-800 block">Scan to Test on Phone</span>
                <button
                  onClick={copyMobileLink}
                  className="text-terracotta hover:underline font-bold flex items-center gap-1"
                >
                  {copiedUrl ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedUrl ? 'Copied Link!' : 'Copy Mobile URL'}
                </button>
              </div>
            </div>
          </div>

          <Link
            href="/capture"
            className="localflow-btn-primary w-full py-2.5 text-center text-xs flex items-center justify-center gap-1.5 font-mono"
          >
            <span>Open Mobile Viewfinder</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* INTERFACE 2: OPERATOR BACKSTAGE */}
        <div className="localflow-card p-6 flex flex-col justify-between space-y-6 hover:-translate-y-0.5 transition-transform bg-[#FAF8F4]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-900 border-2 border-ink-900 flex items-center justify-center shadow-brutal-sm">
                <Users className="w-5 h-5" />
              </div>
              <span className="localflow-badge-orange text-[10px] font-mono font-bold">
                Operator Station
              </span>
            </div>

            <div>
              <h3 className="font-serif text-xl font-bold text-ink-900">
                2. Volunteer Backstage
              </h3>
              <p className="text-xs font-mono text-terracotta font-bold mt-0.5">
                /operator
              </p>
              <p className="text-xs text-ink-600 mt-2 leading-relaxed">
                Stall attendants monitor incoming guest photos, click <strong>Copy Photo</strong> (Cmd+V into ChatGPT), click <strong>Copy Prompt</strong>, and drag/paste the AI output back to trigger the reveal.
              </p>
            </div>

            <div className="space-y-1.5 text-xs font-mono bg-white p-3 rounded-xl border border-ink-900/20 text-ink-700">
              <div className="flex items-center justify-between">
                <span>• 1-Click Clipboard Copy:</span>
                <span className="text-emerald-700 font-bold">Ready</span>
              </div>
              <div className="flex items-center justify-between">
                <span>• Drag & Drop / Cmd+V:</span>
                <span className="text-emerald-700 font-bold">Supported</span>
              </div>
              <div className="flex items-center justify-between">
                <span>• Auto Nexora Watermarking:</span>
                <span className="text-emerald-700 font-bold">Active</span>
              </div>
            </div>
          </div>

          <Link
            href="/operator"
            className="localflow-btn-primary w-full py-2.5 text-center text-xs flex items-center justify-center gap-1.5 font-mono"
          >
            <span>Open Operator Desk</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* INTERFACE 3: GUEST TV DISPLAY */}
        <div className="localflow-card p-6 flex flex-col justify-between space-y-6 hover:-translate-y-0.5 transition-transform bg-[#FAF8F4]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-900 border-2 border-ink-900 flex items-center justify-center shadow-brutal-sm">
                <Tv className="w-5 h-5" />
              </div>
              <span className="localflow-badge-green text-[10px] font-mono font-bold">
                TV Monitor View
              </span>
            </div>

            <div>
              <h3 className="font-serif text-xl font-bold text-ink-900">
                3. Live TV Presentation
              </h3>
              <p className="text-xs font-mono text-terracotta font-bold mt-0.5">
                /display
              </p>
              <p className="text-xs text-ink-600 mt-2 leading-relaxed">
                Connect your laptop to the stall TV screen via HDMI. Features idle attract mode with QR code, kinetic loading radar, and dramatic before/after reveal animations.
              </p>
            </div>

            <div className="space-y-1.5 text-xs font-mono bg-white p-3 rounded-xl border border-ink-900/20 text-ink-700">
              <div className="flex items-center justify-between">
                <span>• Cinematic Dark Theme:</span>
                <span className="text-purple-700 font-bold">Nexora Noir</span>
              </div>
              <div className="flex items-center justify-between">
                <span>• Radar Scanline FX:</span>
                <span className="text-purple-700 font-bold">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span>• Before/After Split Wipe:</span>
                <span className="text-purple-700 font-bold">Smooth 60fps</span>
              </div>
            </div>
          </div>

          <Link
            href="/display"
            target="_blank"
            className="localflow-btn-primary w-full py-2.5 text-center text-xs flex items-center justify-center gap-1.5 font-mono"
          >
            <span>Launch TV Screen (Fullscreen)</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* HOW TO RUN THE STALL (QUICK GUIDE) */}
      <section className="localflow-card p-6 bg-white space-y-4">
        <h3 className="font-serif text-lg font-bold flex items-center gap-2 text-ink-900">
          <Sparkles className="w-4 h-4 text-terracotta" />
          GLC Stall Operator Cheat-Sheet
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-canvas border border-ink-900/15 space-y-1">
            <span className="font-mono font-bold text-terracotta block">Step 1: TV Screen</span>
            <p className="text-ink-700">Open <strong className="text-ink-900">/display</strong> on your monitor or TV and press the fullscreen icon in the top right.</p>
          </div>

          <div className="p-3 rounded-xl bg-canvas border border-ink-900/15 space-y-1">
            <span className="font-mono font-bold text-terracotta block">Step 2: Guest Capture</span>
            <p className="text-ink-700">Attendee scans the QR code or visits <strong className="text-ink-900">/capture</strong>, picks a style (e.g. 1980s), and submits.</p>
          </div>

          <div className="p-3 rounded-xl bg-canvas border border-ink-900/15 space-y-1">
            <span className="font-mono font-bold text-terracotta block">Step 3: ChatGPT Pass</span>
            <p className="text-ink-700">On <strong className="text-ink-900">/operator</strong>, click Copy Photo & Copy Prompt, paste into ChatGPT Plus.</p>
          </div>

          <div className="p-3 rounded-xl bg-canvas border border-ink-900/15 space-y-1">
            <span className="font-mono font-bold text-terracotta block">Step 4: Reveal & WOW</span>
            <p className="text-ink-700">Drag or paste (Cmd+V) the generated image back into the operator card. The TV screen plays the animated transformation reveal!</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="pt-4 border-t-2 border-ink-900/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-ink-500">
        <p>© 2026 NEXORA • GLC Stall Interactive Experience</p>
        <p>Built with Next.js, Tailwind CSS & Supabase Ready Architecture</p>
      </footer>
    </div>
  );
}
