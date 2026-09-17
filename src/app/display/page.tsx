'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Maximize2, Minimize2, QrCode, RefreshCw, 
  ArrowRight, ShieldCheck, Download, ChevronRight, Zap, Image as ImageIcon,
  Smile, Flame, Eye
} from 'lucide-react';
import QRCodeLib from 'qrcode';
import confetti from 'canvas-confetti';
import { STYLE_ERAS, getStyleById } from '@/lib/stylesConfig';
import { GuestPhoto, RealtimeEvent } from '@/lib/types';
import { StorageService } from '@/lib/storageService';

type DisplayPhase = 'idle' | 'loading' | 'reveal';

export default function DisplayPage() {
  const [phase, setPhase] = useState<DisplayPhase>('idle');
  const [activePhoto, setActivePhoto] = useState<GuestPhoto | null>(null);
  const [progress, setProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Transforming portrait...');
  const [sliderPos, setSliderPos] = useState(100); // 100 = full transformed
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pixelScale, setPixelScale] = useState(16); // Lower = more pixelated

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);

  // Generate QR code for mobile capture
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const captureUrl = `${window.location.origin}/capture`;
      QRCodeLib.toDataURL(captureUrl, {
        width: 320,
        margin: 1.5,
        color: {
          dark: '#1A1A1A',
          light: '#FAF8F4',
        },
      }).then(setQrDataUrl).catch(console.error);
    }
  }, []);

  // Listen to realtime sync events
  useEffect(() => {
    const handleEvent = (event: RealtimeEvent) => {
      if (event.type === 'PHOTO_QUEUED') {
        setActivePhoto(event.payload);
        setPhase('loading');
        setProgress(20);
        setLoadingMessage(`New portrait received! Synthesizing ${getStyleById(event.payload.styleId).name}...`);
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
              setProgress(55);
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

  // Pixelation animation during loading phase
  useEffect(() => {
    if (phase !== 'loading' || !activePhoto?.rawPhotoUrl) return;

    let currentProgress = progress || 25;
    const interval = setInterval(() => {
      currentProgress = (currentProgress + 1) % 100;
      // Oscillate pixelation blockiness between 8 and 32 pixels
      const blockiness = Math.floor(12 + Math.sin(Date.now() / 350) * 10);
      setPixelScale(blockiness);
      renderPixelatedImage(blockiness);
    }, 80);

    return () => clearInterval(interval);
  }, [phase, activePhoto]);

  // Render pixelated preview onto canvas
  const renderPixelatedImage = (blockSize: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !activePhoto?.rawPhotoUrl) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const w = canvas.width;
      const h = canvas.height;

      // Draw small offscreen
      const smallW = Math.max(12, Math.floor(w / blockSize));
      const smallH = Math.max(16, Math.floor(h / blockSize));

      const offscreen = document.createElement('canvas');
      offscreen.width = smallW;
      offscreen.height = smallH;
      const offCtx = offscreen.getContext('2d');
      if (!offCtx) return;

      offCtx.drawImage(img, 0, 0, smallW, smallH);

      // Scale back up without smoothing for chunky retro pixelation
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(offscreen, 0, 0, smallW, smallH, 0, 0, w, h);

      // Overlay slight scanlines and tint
      ctx.fillStyle = 'rgba(217, 110, 61, 0.12)';
      ctx.fillRect(0, 0, w, h);
    };
    img.src = activePhoto.rawPhotoUrl;
  };

  // Reveal Sequence with before/after wipe & confetti
  const triggerRevealSequence = (photo: GuestPhoto) => {
    setPhase('reveal');
    setProgress(100);
    setSliderPos(0);

    try {
      confetti({
        particleCount: 65,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#D96E3D', '#E06D3B', '#1E1E1E', '#10B981', '#F59E0B']
      });
    } catch {
      // safe ignore
    }

    // Animate split wipe from 0% to 100%
    let current = 0;
    const interval = setInterval(() => {
      current += 2.5;
      if (current >= 100) {
        setSliderPos(100);
        clearInterval(interval);
      } else {
        setSliderPos(current);
      }
    }, 25);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error);
    }
  };

  // Prototype Demo for Testing
  const runPrototypeDemo = (eraId: string) => {
    const era = getStyleById(eraId);
    const mockGuest: GuestPhoto = {
      id: `demo_${Date.now()}`,
      ticketNumber: 'NEX-888',
      guestName: 'Stall Traveler',
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
    setLoadingMessage(`Converting into ${era.name} era...`);

    let p = 15;
    const loadTimer = setInterval(() => {
      p += 25;
      if (p >= 95) {
        clearInterval(loadTimer);
        setTimeout(() => {
          triggerRevealSequence(mockGuest);
        }, 500);
      } else {
        setProgress(p);
      }
    }, 450);
  };

  const currentEra = activePhoto ? getStyleById(activePhoto.styleId) : STYLE_ERAS[0];

  return (
    <div className="h-screen w-screen bg-[#F4F0E6] text-[#1E1E1E] flex flex-col justify-between overflow-hidden select-none font-sans relative">
      {/* SOFT TEXTURED WALLPAPER / GALLERY BACKDROP */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `
            radial-gradient(#D9D5CC 1.2px, transparent 1.2px),
            linear-gradient(to right, rgba(0,0,0,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px, 120px 100%',
        }}
      />

      {/* TOP CLEAN GALLERY BAR */}
      <header className="relative z-20 flex items-center justify-between px-8 py-5 border-b-2 border-[#1E1E1E]/10 bg-[#FAF8F4]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-terracotta text-white font-serif font-black text-lg flex items-center justify-center border-2 border-[#1E1E1E] shadow-brutal-sm">
            N
          </div>
          <div>
            <h1 className="font-serif text-xl font-extrabold tracking-tight text-[#1E1E1E] leading-none flex items-center gap-2">
              NEXORA
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#E1EFEA] text-[#1E523E] border border-[#2F6B55]">
                STALL DISPLAY
              </span>
            </h1>
            <p className="text-[11px] font-mono text-[#6B6B6B] font-semibold mt-0.5">
              Same You. Different Era.
            </p>
          </div>
        </div>

        {/* Status Badge & Fullscreen */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-full border-2 border-[#1E1E1E] bg-[#FAF8F4] text-xs font-mono font-bold flex items-center gap-2 shadow-brutal-sm">
            <span className={`w-2 h-2 rounded-full ${
              phase === 'idle' ? 'bg-emerald-500 animate-pulse' : 'bg-terracotta animate-ping'
            }`} />
            <span>
              {phase === 'idle' ? 'STANDBY: WAITING FOR GUEST' : phase === 'loading' ? 'CONVERTING PHOTO' : 'PORTRAIT REVEAL'}
            </span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-white hover:bg-[#FAF8F4] border-2 border-[#1E1E1E] shadow-brutal-sm transition-all"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* CENTER VIEWPORT: THE WALL-HANGING ART GALLERY FRAME */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-6 max-h-[82vh]">
        {/* PHASE 1: IDLE / CUTE EMPTY HANGING FRAME */}
        {phase === 'idle' && (
          <div className="w-full max-w-5xl flex flex-col md:flex-row items-center justify-center gap-10 md:gap-14 animate-fadeIn">
            {/* THE WALL-HANGING PICTURE FRAME */}
            <div className="relative flex flex-col items-center">
              {/* Hanging Wire and Peg */}
              <div className="w-4 h-4 rounded-full bg-[#3D3D3D] border-2 border-[#1E1E1E] shadow-sm mb-1 z-10" />
              <div 
                className="w-40 h-8 border-t-2 border-r-2 border-l-2 border-[#1E1E1E]/40 pointer-events-none -mb-3 rotate-180" 
                style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
              />

              {/* The Art Frame */}
              <div className="w-72 md:w-80 aspect-[3/4] bg-[#FAF8F4] rounded-3xl border-4 border-[#1E1E1E] p-4 shadow-[8px_12px_0px_#1E1E1E] flex flex-col justify-between relative overflow-hidden group">
                {/* Inner Mat Border */}
                <div className="w-full h-full rounded-2xl border-2 border-dashed border-[#1E1E1E]/20 bg-[#F5F2EB] flex flex-col items-center justify-center p-6 text-center space-y-4">
                  {/* Cute empty portrait avatar illustration */}
                  <div className="w-24 h-28 rounded-2xl bg-white border-2 border-[#1E1E1E] shadow-brutal-sm flex flex-col items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform">
                    {/* Cute smiling silhouette face */}
                    <div className="w-10 h-10 rounded-full bg-[#EFECE5] border-2 border-[#1E1E1E] flex items-center justify-center mb-1">
                      <div className="flex gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1E1E1E]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1E1E1E]" />
                      </div>
                    </div>
                    <div className="w-14 h-8 rounded-t-xl bg-terracotta/20 border-t-2 border-r-2 border-l-2 border-[#1E1E1E]" />
                    {/* Sparkle badge */}
                    <div className="absolute top-1 right-1">
                      <Sparkles className="w-3.5 h-3.5 text-terracotta animate-spin" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="localflow-badge-neutral text-[10px] font-mono font-bold uppercase">
                      No Photo Loaded
                    </span>
                    <h3 className="font-serif text-lg font-bold text-[#1E1E1E] leading-tight">
                      This Frame Awaits You
                    </h3>
                    <p className="text-xs text-[#6B6B6B] font-mono leading-relaxed">
                      Scan the QR on your phone to step inside.
                    </p>
                  </div>
                </div>

                {/* Brass Exhibition Plaque on bottom of frame */}
                <div className="mt-2 text-center">
                  <span className="text-[9px] font-mono uppercase font-bold tracking-widest text-[#8A8780]">
                    NEXORA PORTRAIT STUDIO • NO. 01
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE: CLEAN INVITATION & QR CODE STANDEE */}
            <div className="max-w-md space-y-6">
              <div className="space-y-3">
                <span className="localflow-badge-orange text-xs font-mono font-bold uppercase">
                  ✨ Interactive Photo Booth
                </span>
                <h2 className="font-serif text-4xl md:text-5xl font-black text-[#1E1E1E] leading-tight tracking-tight">
                  Step Into Another <span className="text-terracotta italic font-normal">Era</span>.
                </h2>
                <p className="text-sm text-[#4A4A4A] leading-relaxed">
                  Take a quick selfie on your phone, choose a style, and watch your photo transform inside the gallery frame above.
                </p>
              </div>

              {/* QR Code Card */}
              <div className="localflow-card p-5 bg-white flex items-center gap-5">
                <div className="w-28 h-28 rounded-xl border-2 border-[#1E1E1E] bg-[#FAF8F4] p-1 flex-shrink-0 shadow-brutal-sm">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="Scan QR code" className="w-full h-full object-contain" />
                  ) : (
                    <QrCode className="w-full h-full text-ink-500 animate-pulse" />
                  )}
                </div>

                <div className="space-y-1.5 text-left">
                  <span className="localflow-badge-green text-[10px] font-mono uppercase">
                    Scan with camera
                  </span>
                  <p className="font-serif font-bold text-sm text-[#1E1E1E]">
                    Open Camera on Phone
                  </p>
                  <p className="text-xs text-[#6B6B6B] font-mono leading-tight">
                    Instant web capture • No app download required
                  </p>
                </div>
              </div>

              {/* Aesthetic eras preview pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {STYLE_ERAS.map((era) => (
                  <button
                    key={era.id}
                    onClick={() => runPrototypeDemo(era.id)}
                    className="px-2.5 py-1 rounded-lg border border-[#1E1E1E]/20 bg-white hover:border-terracotta text-xs font-mono transition-all text-[#3D3D3D] shadow-sm flex items-center gap-1.5"
                    title="Test demo transform"
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: era.badgeColor }} />
                    {era.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PHASE 2: IMAGE RECEIVED & PIXELATED CONVERTING ANIMATION */}
        {phase === 'loading' && activePhoto && (
          <div className="w-full max-w-xl flex flex-col items-center text-center space-y-6 animate-fadeIn">
            {/* Header Ticket Pill */}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 localflow-badge-orange text-xs font-mono font-bold uppercase">
                <span className="w-2 h-2 rounded-full bg-terracotta animate-ping" />
                {activePhoto.ticketNumber} • {activePhoto.guestName}
              </div>
              <h2 className="font-serif text-3xl md:text-4xl font-black text-[#1E1E1E] tracking-tight">
                Synthesizing {currentEra.name}
              </h2>
              <p className="text-xs font-mono text-[#6B6B6B]">
                {currentEra.eraLabel}
              </p>
            </div>

            {/* ART GALLERY FRAME WITH PIXELATED CANVAS & CONVERTING LOGO */}
            <div className="relative flex flex-col items-center">
              {/* Hanging Wire */}
              <div className="w-4 h-4 rounded-full bg-[#3D3D3D] border-2 border-[#1E1E1E] shadow-sm mb-1 z-10" />
              <div 
                className="w-40 h-8 border-t-2 border-r-2 border-l-2 border-[#1E1E1E]/40 pointer-events-none -mb-3 rotate-180" 
                style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
              />

              {/* Picture Frame */}
              <div className="w-72 md:w-80 aspect-[3/4] bg-[#FAF8F4] rounded-3xl border-4 border-[#1E1E1E] p-4 shadow-[8px_12px_0px_#1E1E1E] relative flex flex-col justify-between overflow-hidden">
                <div className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-[#1E1E1E] bg-black flex items-center justify-center">
                  {/* The Live Pixelating Canvas */}
                  <canvas
                    ref={canvasRef}
                    width={320}
                    height={420}
                    className="w-full h-full object-cover"
                  />

                  {/* Converting Shimmer & Scanline */}
                  <div className="animate-scanline" />

                  {/* Center Converting Badge / Spinner */}
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[1.5px] flex flex-col items-center justify-center p-4 text-center">
                    {/* Cute Converting Icon */}
                    <div className="w-16 h-16 rounded-2xl bg-white border-2 border-[#1E1E1E] shadow-brutal flex items-center justify-center mb-3 animate-spin">
                      <Sparkles className="w-8 h-8 text-terracotta" />
                    </div>

                    <span className="font-serif font-bold text-white text-base drop-shadow-md">
                      Converting Portrait...
                    </span>
                    <span className="text-[11px] font-mono text-terracotta font-bold bg-white/90 px-2 py-0.5 rounded border border-[#1E1E1E] mt-1 shadow-sm">
                      {currentEra.name}
                    </span>
                  </div>

                  {/* Bottom Progress Bar */}
                  <div className="absolute bottom-3 left-3 right-3 bg-white/95 border-2 border-[#1E1E1E] rounded-xl p-2 shadow-brutal-sm text-left">
                    <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[#1E1E1E] mb-1">
                      <span className="truncate pr-1">{loadingMessage}</span>
                      <span className="text-terracotta">{progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-[#EFECE5] rounded-full overflow-hidden border border-[#1E1E1E]/20">
                      <div 
                        className="h-full bg-terracotta transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs font-mono text-[#6B6B6B] max-w-sm">
              Applying authentic era textures, palette, and styling... Look at the screen for the grand reveal!
            </p>
          </div>
        )}

        {/* PHASE 3: DRAMATIC REVEAL WITH SMOOTH COMPARISON SLIDER */}
        {phase === 'reveal' && activePhoto && (
          <div className="w-full max-w-xl flex flex-col items-center text-center space-y-5 animate-fadeIn">
            {/* Reveal Header */}
            <div className="space-y-1">
              <span className="localflow-badge-green text-xs font-mono font-bold uppercase">
                ✓ Transformation Complete
              </span>
              <h2 className="font-serif text-3xl md:text-4xl font-black text-[#1E1E1E] tracking-tight">
                {activePhoto.guestName} in the {currentEra.name}
              </h2>
              <p className="text-xs font-mono text-[#6B6B6B]">
                {activePhoto.ticketNumber} • {currentEra.tagline}
              </p>
            </div>

            {/* ART GALLERY HANGING FRAME WITH REVEALED PORTRAIT */}
            <div className="relative flex flex-col items-center">
              {/* Hanging Wire */}
              <div className="w-4 h-4 rounded-full bg-[#3D3D3D] border-2 border-[#1E1E1E] shadow-sm mb-1 z-10" />
              <div 
                className="w-40 h-8 border-t-2 border-r-2 border-l-2 border-[#1E1E1E]/40 pointer-events-none -mb-3 rotate-180" 
                style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
              />

              {/* Picture Frame */}
              <div className="w-72 md:w-80 aspect-[3/4] bg-[#FAF8F4] rounded-3xl border-4 border-[#1E1E1E] p-4 shadow-[8px_12px_0px_#1E1E1E] relative flex flex-col justify-between overflow-hidden">
                <div className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-[#1E1E1E] bg-black">
                  {/* Transformed Branded Image */}
                  <img
                    src={activePhoto.transformedPhotoUrl || activePhoto.rawPhotoUrl}
                    alt="Transformed final portrait"
                    className="absolute inset-0 w-full h-full object-cover"
                  />

                  {/* Foreground: Original Photo clipped by slider position */}
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
                    <div className="absolute top-2 left-2 bg-white text-[#1E1E1E] text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border border-[#1E1E1E] shadow-brutal-sm">
                      Original
                    </div>
                  </div>

                  {/* Slider divider line */}
                  <div 
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_12px_#D96E3D] pointer-events-none"
                    style={{ left: `${100 - sliderPos}%` }}
                  >
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-white border-2 border-[#1E1E1E] shadow-brutal flex items-center justify-center text-[#1E1E1E]">
                      <span className="text-[10px] font-bold">⇄</span>
                    </div>
                  </div>

                  {/* Nexora Plaque Badge on bottom right */}
                  <div className="absolute bottom-2 right-2 bg-white/95 border-2 border-[#1E1E1E] px-2.5 py-1 rounded-lg shadow-brutal-sm flex items-center gap-1.5">
                    <span className="font-serif font-bold text-xs tracking-wider text-[#1E1E1E]">NEXORA</span>
                    <span className="text-[9px] font-mono text-terracotta font-bold">• {currentEra.name}</span>
                  </div>
                </div>

                {/* Brass Exhibition Plate */}
                <div className="mt-2 text-center flex items-center justify-between px-1 text-[10px] font-mono text-[#6B6B6B]">
                  <span>{activePhoto.ticketNumber}</span>
                  <span className="font-bold text-[#1E1E1E]">{activePhoto.guestName}</span>
                  <span>{currentEra.name}</span>
                </div>
              </div>
            </div>

            {/* Comparison Slider Bar */}
            <div className="w-72 md:w-80 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-[#6B6B6B]">
                <span>Original</span>
                <span className="text-terracotta font-bold">← Slide to compare →</span>
                <span>{currentEra.name}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPos}
                onChange={(e) => setSliderPos(Number(e.target.value))}
                className="w-full accent-terracotta h-2 bg-white rounded-lg border border-[#1E1E1E]/30 cursor-pointer"
              />
            </div>
          </div>
        )}
      </main>

      {/* FOOTER BAR */}
      <footer className="relative z-20 px-8 py-3.5 border-t-2 border-[#1E1E1E]/10 bg-[#FAF8F4]/80 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-[#6B6B6B]">
        <div className="flex items-center gap-3">
          <span className="text-terracotta font-bold">NEXORA DISPLAY ENGINE</span>
          <span>•</span>
          <span>Turn Moments Into New Worlds</span>
        </div>

        {/* Prototype Demo Buttons */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#8A8780] hidden sm:inline">Instant Demos:</span>
          <button
            onClick={() => runPrototypeDemo('1980s')}
            className="px-2.5 py-1 rounded-md bg-white hover:bg-[#FAF8F4] border border-[#1E1E1E]/30 text-[#1E1E1E] text-[11px] font-mono shadow-sm transition-all"
          >
            1980s Retro
          </button>
          <button
            onClick={() => runPrototypeDemo('cyberpunk')}
            className="px-2.5 py-1 rounded-md bg-white hover:bg-[#FAF8F4] border border-[#1E1E1E]/30 text-[#1E1E1E] text-[11px] font-mono shadow-sm transition-all"
          >
            Cyberpunk
          </button>
          <button
            onClick={() => runPrototypeDemo('ghibli')}
            className="px-2.5 py-1 rounded-md bg-white hover:bg-[#FAF8F4] border border-[#1E1E1E]/30 text-[#1E1E1E] text-[11px] font-mono shadow-sm transition-all"
          >
            Ghibli
          </button>
          <button
            onClick={() => setPhase('idle')}
            className="px-2.5 py-1 rounded-md bg-terracotta text-white border border-[#1E1E1E] text-[11px] font-mono shadow-brutal-sm ml-2"
          >
            Reset Standby
          </button>
        </div>
      </footer>
    </div>
  );
}
