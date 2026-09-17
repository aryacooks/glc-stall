'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Maximize2, Minimize2, QrCode, RefreshCw, 
  ArrowRight, ShieldCheck, Download, ChevronRight, Zap
} from 'lucide-react';
import QRCodeLib from 'qrcode';
import confetti from 'canvas-confetti';
import { STYLE_ERAS, getStyleById } from '@/lib/stylesConfig';
import { GuestPhoto, RealtimeEvent } from '@/lib/types';
import { StorageService } from '@/lib/storageService';
import Link from 'next/link';

type DisplayPhase = 'idle' | 'loading' | 'reveal';

export default function DisplayPage() {
  const [phase, setPhase] = useState<DisplayPhase>('idle');
  const [activePhoto, setActivePhoto] = useState<GuestPhoto | null>(null);
  const [progress, setProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Analyzing portrait geometry...');
  const [sliderPos, setSliderPos] = useState(50); // For before/after wipe
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showWatermarkNotice, setShowWatermarkNotice] = useState(false);

  // Generate QR code for mobile capture
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const captureUrl = `${window.location.origin}/capture`;
      QRCodeLib.toDataURL(captureUrl, {
        width: 280,
        margin: 1.5,
        color: {
          dark: '#151515',
          light: '#FAF8F4',
        },
      }).then(setQrDataUrl).catch(console.error);
    }
  }, []);

  // Listen to realtime sync events from Mobile Capture & Operator Station
  useEffect(() => {
    const handleEvent = (event: RealtimeEvent) => {
      if (event.type === 'PHOTO_QUEUED') {
        // Automatically bring incoming photo to display if idle
        setActivePhoto(event.payload);
        setPhase('loading');
        setProgress(25);
        setLoadingMessage(`Preparing ${getStyleById(event.payload.styleId).name} transformation...`);
      } else if (event.type === 'PHOTO_PROCESSING') {
        setProgress(event.payload.progress);
        setLoadingMessage(event.payload.message);
        setPhase('loading');
      } else if (event.type === 'PHOTO_TRANSFORMED') {
        setActivePhoto(event.payload);
        triggerRevealSequence(event.payload);
      } else if (event.type === 'DISPLAY_FORCE_VIEW') {
        StorageService.getAllPhotos().then((list) => {
          const found = list.find(p => p.id === event.payload.photoId);
          if (found) {
            setActivePhoto(found);
            if (event.payload.step === 'reveal' && found.transformedPhotoUrl) {
              triggerRevealSequence(found);
            } else {
              setPhase('loading');
              setProgress(65);
              setLoadingMessage(`Synthesizing ${getStyleById(found.styleId).name}...`);
            }
          }
        });
      } else if (event.type === 'DISPLAY_RESET') {
        setPhase('idle');
      }
    };

    const unsubscribe = StorageService.subscribe(handleEvent);
    return () => unsubscribe();
  }, []);

  // Animated Reveal Sequence with Before/After Sweep and Confetti
  const triggerRevealSequence = (photo: GuestPhoto) => {
    setPhase('reveal');
    setProgress(100);
    setSliderPos(0); // Start showing original

    // Trigger subtle celebratory confetti
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#D96E3D', '#F59E0B', '#00F0FF', '#10B981']
      });
    } catch {
      // safe ignore
    }

    // Animate the split slider from left (0) to reveal full transformed image (100)
    let current = 0;
    const interval = setInterval(() => {
      current += 2;
      if (current >= 100) {
        setSliderPos(100);
        clearInterval(interval);
      } else {
        setSliderPos(current);
      }
    }, 30);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error);
    }
  };

  // Prototype fast-demo trigger right from screen for convenience
  const runPrototypeDemo = (eraId: string) => {
    const era = getStyleById(eraId);
    const mockGuest: GuestPhoto = {
      id: `demo_${Date.now()}`,
      ticketNumber: 'NEX-777',
      guestName: 'Alex Parker',
      styleId: era.id,
      rawPhotoUrl: era.samplePlaceholder,
      transformedPhotoUrl: era.demoTransformed,
      status: 'ready',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setActivePhoto(mockGuest);
    setPhase('loading');
    setProgress(15);
    setLoadingMessage(`Initializing ${era.name} neural pipeline...`);

    let p = 15;
    const loadTimer = setInterval(() => {
      p += 22;
      if (p >= 95) {
        clearInterval(loadTimer);
        setTimeout(() => {
          triggerRevealSequence(mockGuest);
        }, 600);
      } else {
        setProgress(p);
        if (p > 50) {
          setLoadingMessage(`Synthesizing ${era.name} textures & lighting...`);
        }
      }
    }, 400);
  };

  const currentEra = activePhoto ? getStyleById(activePhoto.styleId) : STYLE_ERAS[0];

  return (
    <div className="h-screen w-screen bg-[#0C0C0C] text-white flex flex-col justify-between overflow-hidden select-none font-sans relative">
      {/* BACKGROUND AMBIENT GLOW */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20 transition-all duration-1000"
        style={{
          background: phase === 'reveal' 
            ? `radial-gradient(circle at 50% 50%, ${currentEra.badgeColor} 0%, transparent 65%)` 
            : 'radial-gradient(circle at 50% 50%, #D96E3D 0%, transparent 70%)'
        }}
      />

      {/* SUBTLE SCANLINE GRID OVERLAY */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-10" 
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      {/* TOP HEADER BAR */}
      <header className="relative z-20 flex items-center justify-between px-8 py-6 border-b border-white/10 backdrop-blur-md bg-black/40">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-terracotta text-white font-serif font-black text-xl flex items-center justify-center border-2 border-white/20 shadow-lg shadow-terracotta/30">
            N
          </div>
          <div>
            <h1 className="font-serif text-2xl font-black tracking-widest text-white flex items-center gap-2">
              NEXORA
              <span className="text-[11px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded bg-white/10 text-terracotta border border-terracotta/40">
                GLC LIVE
              </span>
            </h1>
            <p className="text-xs font-mono uppercase tracking-widest text-neutral-400">
              Same You. Different Era.
            </p>
          </div>
        </div>

        {/* Phase Indicator & Screen Controls */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-neutral-300">
              {phase === 'idle' ? 'ATTRACT MODE' : phase === 'loading' ? 'TRANSFORMATION IN PROGRESS' : 'REVEAL READY'}
            </span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* CENTER VIEWPORT: DYNAMIC PHASES */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-6 md:p-10 max-h-[82vh]">
        {/* PHASE 1: IDLE / ATTRACT MODE */}
        {phase === 'idle' && (
          <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Hero Text (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-terracotta/20 border border-terracotta text-terracotta text-xs font-mono font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                Interactive AI Photo Experience
              </div>

              <h2 className="font-serif text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.08] text-white">
                Turn Moments Into <span className="text-terracotta italic font-normal">New Worlds</span>.
              </h2>

              <p className="text-base md:text-xl text-neutral-300 font-light max-w-xl leading-relaxed">
                Step up to the stall. Take a portrait on your phone, choose an iconic era, and watch yourself get transported in real time on this screen.
              </p>

              {/* Era Style Chips */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-mono uppercase text-neutral-400 font-bold tracking-widest block">
                  Available Aesthetic Eras:
                </span>
                <div className="flex flex-wrap gap-2">
                  {STYLE_ERAS.map((era) => (
                    <button
                      key={era.id}
                      onClick={() => runPrototypeDemo(era.id)}
                      className="px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/15 hover:border-terracotta transition-all text-xs font-mono flex items-center gap-1.5 text-neutral-200"
                      title="Click to test this era demo"
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: era.badgeColor }} />
                      {era.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right QR Code Standee Card (5 cols) */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="localflow-card bg-[#FAF8F4] text-ink-900 p-8 rounded-3xl border-4 border-white/90 shadow-2xl flex flex-col items-center text-center max-w-sm w-full">
                <span className="localflow-badge-orange text-xs font-mono font-bold uppercase mb-4 tracking-wider">
                  Scan With Your Phone
                </span>

                {/* QR Code Container */}
                <div className="w-56 h-56 rounded-2xl border-2 border-ink-900 p-2 bg-white flex items-center justify-center shadow-brutal">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="Scan QR Code to enter" className="w-full h-full object-contain" />
                  ) : (
                    <QrCode className="w-32 h-32 text-ink-900 animate-pulse" />
                  )}
                </div>

                <div className="mt-5 space-y-1">
                  <h3 className="font-serif text-2xl font-bold text-ink-900">
                    Snap & Transform
                  </h3>
                  <p className="text-xs text-ink-600 font-mono">
                    Point your camera at this QR code to begin
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-ink-900/10 w-full flex items-center justify-center gap-2 text-[11px] font-mono text-ink-500">
                  <span>No App Download Needed</span>
                  <span>•</span>
                  <span>Free Instant Result</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PHASE 2: PROCESSING & LOADING ANIMATION */}
        {phase === 'loading' && activePhoto && (
          <div className="w-full max-w-4xl flex flex-col items-center justify-center text-center space-y-8 animate-fadeIn">
            {/* Status Header */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-terracotta/20 border border-terracotta text-terracotta text-xs font-mono font-bold uppercase">
                <span className="w-2 h-2 rounded-full bg-terracotta animate-ping" />
                Ticket {activePhoto.ticketNumber} • {activePhoto.guestName}
              </div>
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-white tracking-tight">
                Synthesizing {currentEra.name}...
              </h2>
              <p className="text-sm font-mono text-neutral-400">
                {currentEra.eraLabel}
              </p>
            </div>

            {/* Center Visual: Photo with Futuristic Scanline & Progress Dial */}
            <div className="relative w-72 md:w-80 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-white/30 shadow-2xl bg-black">
              {/* Scanline effect */}
              <div className="animate-scanline" />

              {/* Guest Original Photo */}
              <img
                src={activePhoto.rawPhotoUrl}
                alt="Transforming portrait"
                className="w-full h-full object-cover opacity-80 filter contrast-110"
              />

              {/* Hologram Grid Tint */}
              <div 
                className="absolute inset-0 pointer-events-none opacity-30 mix-blend-overlay"
                style={{ backgroundColor: currentEra.badgeColor }}
              />

              {/* Bottom Progress Pill */}
              <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-md p-3 rounded-xl border border-white/20 text-center">
                <div className="flex items-center justify-between text-xs font-mono mb-1.5 text-neutral-300">
                  <span className="truncate pr-2">{loadingMessage}</span>
                  <span className="font-bold text-terracotta">{progress}%</span>
                </div>
                <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-terracotta transition-all duration-300 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            <p className="text-xs font-mono text-neutral-400 max-w-md">
              Please wait while the stall neural engine transforms your photo into the {currentEra.name} era...
            </p>
          </div>
        )}

        {/* PHASE 3: DRAMATIC REVEAL & BEFORE/AFTER TRANSFORMATION */}
        {phase === 'reveal' && activePhoto && (
          <div className="w-full max-w-5xl flex flex-col items-center justify-center text-center space-y-6 animate-fadeIn">
            {/* Reveal Header */}
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full inline-block">
                ✓ Transformation Complete
              </span>
              <h2 className="font-serif text-3xl md:text-5xl font-black text-white tracking-tight">
                {activePhoto.guestName} in the {currentEra.name}
              </h2>
              <p className="text-xs font-mono text-neutral-400">
                Ticket: {activePhoto.ticketNumber} • {currentEra.tagline}
              </p>
            </div>

            {/* Interactive Before & After Wiping Showcase */}
            <div className="relative w-full max-w-lg aspect-[3/4] rounded-3xl overflow-hidden border-4 border-white/20 shadow-2xl bg-black">
              {/* Background: Transformed Image */}
              <img
                src={activePhoto.transformedPhotoUrl || activePhoto.rawPhotoUrl}
                alt="Transformed final portrait"
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Foreground: Original Image clipped by slider position */}
              <div 
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${100 - sliderPos}%` }}
              >
                <img
                  src={activePhoto.rawPhotoUrl}
                  alt="Original portrait"
                  className="w-full h-full object-cover max-w-none"
                  style={{ width: '100%' }}
                />
                <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm text-white text-[10px] font-mono uppercase px-2.5 py-1 rounded-md border border-white/20">
                  Original
                </div>
              </div>

              {/* Slider Split Divider Line */}
              <div 
                className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_15px_#D96E3D] pointer-events-none"
                style={{ left: `${100 - sliderPos}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white border-2 border-ink-900 shadow-brutal flex items-center justify-center text-ink-900">
                  <span className="text-xs font-bold">⇄</span>
                </div>
              </div>

              {/* Watermark Branding overlay in corner */}
              <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20 flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-terracotta text-white font-serif font-black text-[9px] flex items-center justify-center">
                  N
                </div>
                <span className="font-serif font-bold text-xs tracking-wider text-white">NEXORA</span>
                <span className="text-[9px] font-mono text-neutral-400">• {currentEra.name}</span>
              </div>
            </div>

            {/* Slider Manual Scrub Bar & Actions */}
            <div className="w-full max-w-lg space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-neutral-400 px-2">
                <span>Original Photo</span>
                <span className="text-terracotta font-bold">Slide to compare</span>
                <span>{currentEra.name}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPos}
                onChange={(e) => setSliderPos(Number(e.target.value))}
                className="w-full accent-terracotta h-2 bg-white/20 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        )}
      </main>

      {/* FOOTER BAR */}
      <footer className="relative z-20 px-8 py-4 border-t border-white/10 backdrop-blur-md bg-black/40 flex items-center justify-between text-xs font-mono text-neutral-400">
        <div className="flex items-center gap-3">
          <span className="text-terracotta font-bold">NEXORA DISPLAY ENGINE</span>
          <span className="text-neutral-600">|</span>
          <span>Same You. Different Era.</span>
        </div>

        {/* Quick Demo Selector for operator testing */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-neutral-500 hidden sm:inline">Instant Prototype Demos:</span>
          <button
            onClick={() => runPrototypeDemo('1980s')}
            className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-neutral-200 text-[11px] transition-all"
          >
            1980s Retro
          </button>
          <button
            onClick={() => runPrototypeDemo('cyberpunk')}
            className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-neutral-200 text-[11px] transition-all"
          >
            Cyberpunk
          </button>
          <button
            onClick={() => runPrototypeDemo('ghibli')}
            className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-neutral-200 text-[11px] transition-all"
          >
            Ghibli
          </button>
          <button
            onClick={() => setPhase('idle')}
            className="px-2 py-1 rounded bg-terracotta/20 hover:bg-terracotta/40 text-terracotta text-[11px] transition-all border border-terracotta/40 ml-2"
          >
            Reset Screen
          </button>
        </div>
      </footer>
    </div>
  );
}
