'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Maximize2, Minimize2, QrCode, RefreshCw, 
  ArrowRight, ShieldCheck, Download, ChevronRight, Zap, Image as ImageIcon,
  Smile, Flame, Eye
} from 'lucide-react';
import QRCodeLib from 'qrcode';
import confetti from 'canvas-confetti';
import { getAllThemes, getStyleById, DEFAULT_STYLE_ERAS } from '@/lib/stylesConfig';
import { GuestPhoto, RealtimeEvent, StyleEra } from '@/lib/types';
import { StorageService } from '@/lib/storageService';

type DisplayPhase = 'idle' | 'loaded' | 'transitioning' | 'reveal';

interface PixelParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  delay: number;
  alpha: number;
  rotation: number;
  vRot: number;
}

export default function DisplayPage() {
  const [phase, setPhase] = useState<DisplayPhase>('idle');
  const [activePhoto, setActivePhoto] = useState<GuestPhoto | null>(null);
  const [sliderPos, setSliderPos] = useState(100);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [themes, setThemes] = useState<StyleEra[]>([]);

  const particleCanvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Load themes & generate QR code
  useEffect(() => {
    const list = getAllThemes();
    setThemes(list);

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

  // Listen to realtime events
  useEffect(() => {
    const handleEvent = (event: RealtimeEvent) => {
      if (event.type === 'PHOTO_QUEUED') {
        setActivePhoto(event.payload);
        setPhase('loaded');
      } else if (event.type === 'PHOTO_PROCESSING') {
        // Operator working
        if (activePhoto?.id === event.payload.id || !activePhoto) {
          StorageService.getAllPhotos().then((list) => {
            const found = list.find(p => p.id === event.payload.id);
            if (found) {
              setActivePhoto(found);
              setPhase('loaded');
            }
          });
        }
      } else if (event.type === 'PHOTO_TRANSFORMED') {
        setActivePhoto(event.payload);
        startPixelBreakdownTransition(event.payload);
      } else if (event.type === 'DISPLAY_FORCE_VIEW') {
        StorageService.getAllPhotos().then((list) => {
          const found = list.find(p => p.id === event.payload.photoId);
          if (found) {
            setActivePhoto(found);
            if (event.payload.step === 'reveal' && found.transformedPhotoUrl) {
              startPixelBreakdownTransition(found);
            } else {
              setPhase('loaded');
            }
          }
        });
      } else if (event.type === 'PHOTO_DELETED') {
        if (activePhoto?.id === event.payload.id) {
          if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
          setPhase('idle');
          setActivePhoto(null);
        }
      } else if (event.type === 'DISPLAY_RESET') {
        if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
        setPhase('idle');
        setActivePhoto(null);
      }
    };

    const unsubscribe = StorageService.subscribe(handleEvent);
    return () => unsubscribe();
  }, [activePhoto]);

  // FALLING PIXEL BREAKDOWN TRANSITION
  const startPixelBreakdownTransition = (photo: GuestPhoto) => {
    if (!photo.rawPhotoUrl) {
      setPhase('reveal');
      return;
    }

    setPhase('transitioning');
    const canvas = particleCanvasRef.current;
    if (!canvas) {
      setPhase('reveal');
      return;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      setPhase('reveal');
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Draw original image onto canvas to sample pixel colors
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Extract image pixels
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;

      // Create grid of pixel blocks
      const blockSize = 10; // 10x10 pixel blocks
      const particles: PixelParticle[] = [];

      for (let y = 0; y < height; y += blockSize) {
        for (let x = 0; x < width; x += blockSize) {
          const index = (y * width + x) * 4;
          const r = data[index];
          const g = data[index + 1];
          const b = data[index + 2];
          const a = data[index + 3];

          if (a > 20) {
            // Ripple delay from top to bottom with slight radial wave
            const distFromTop = y / height;
            const distFromCenter = Math.abs(x - width / 2) / (width / 2);
            const delay = distFromTop * 30 + distFromCenter * 15;

            particles.push({
              x,
              y,
              vx: (Math.random() - 0.5) * 4.5,
              vy: -Math.random() * 2.5, // slight initial pop upward
              size: blockSize + 0.5,
              color: `rgb(${r},${g},${b})`,
              delay,
              alpha: 1,
              rotation: 0,
              vRot: (Math.random() - 0.5) * 0.15,
            });
          }
        }
      }

      // Physics loop
      let frameCount = 0;
      const gravity = 0.42;

      const animate = () => {
        frameCount++;
        ctx.clearRect(0, 0, width, height);

        let activeCount = 0;

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];

          if (frameCount > p.delay) {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += gravity; // Gravity pull
            p.rotation += p.vRot;
            p.alpha -= 0.012; // Gradual dissolution fade
          }

          if (p.alpha > 0.01 && p.y < height + 80) {
            activeCount++;
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.translate(p.x + p.size / 2, p.y + p.size / 2);
            ctx.rotate(p.rotation);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            ctx.restore();
          }
        }

        // When 85% of particles have fallen off, trigger reveal
        if (activeCount > 30 && frameCount < 180) {
          animFrameIdRef.current = requestAnimationFrame(animate);
        } else {
          ctx.clearRect(0, 0, width, height);
          setPhase('reveal');
          setSliderPos(100);

          try {
            confetti({
              particleCount: 75,
              spread: 80,
              origin: { y: 0.65 },
              colors: ['#D96E3D', '#E06D3B', '#1E1E1E', '#10B981', '#F59E0B']
            });
          } catch {
            // safe ignore
          }
        }
      };

      animate();
    };

    img.src = photo.rawPhotoUrl;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error);
    }
  };

  const currentEra = activePhoto ? getStyleById(activePhoto.styleId) : (themes[0] || DEFAULT_STYLE_ERAS[0]);

  // Prototype fast test
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
    startPixelBreakdownTransition(mockGuest);
  };

  return (
    <div className="h-screen w-screen bg-[#F4F0E6] text-[#1E1E1E] flex flex-col justify-between overflow-hidden select-none font-sans relative">
      {/* SOFT GALLERY WALLPAPER TEXTURE */}
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

      {/* TOP HEADER */}
      <header className="relative z-20 flex items-center justify-between px-8 py-5 border-b-2 border-[#1E1E1E]/10 bg-[#FAF8F4]/85 backdrop-blur-md">
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

        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-full border-2 border-[#1E1E1E] bg-[#FAF8F4] text-xs font-mono font-bold flex items-center gap-2 shadow-brutal-sm">
            <span className={`w-2 h-2 rounded-full ${
              phase === 'idle' ? 'bg-emerald-500 animate-pulse' : phase === 'transitioning' ? 'bg-terracotta animate-ping' : 'bg-terracotta'
            }`} />
            <span>
              {phase === 'idle' ? 'WAITING FOR GUEST' : phase === 'loaded' ? 'PHOTO QUEUED' : phase === 'transitioning' ? 'TRANSFORMING REALITY...' : 'TRANSFORMATION REVEAL'}
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

      {/* CENTER EXHIBITION AREA */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-6 max-h-[82vh]">
        {/* PHASE 1: IDLE / NO PHOTO LOADED */}
        {phase === 'idle' && (
          <div className="w-full max-w-5xl flex flex-col md:flex-row items-center justify-center gap-10 md:gap-14 animate-fadeIn">
            {/* Hanging Picture Frame */}
            <div className="relative flex flex-col items-center">
              <div className="w-4 h-4 rounded-full bg-[#3D3D3D] border-2 border-[#1E1E1E] shadow-sm mb-1 z-10" />
              <div 
                className="w-40 h-8 border-t-2 border-r-2 border-l-2 border-[#1E1E1E]/40 pointer-events-none -mb-3 rotate-180" 
                style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
              />

              <div className="w-72 md:w-80 aspect-[3/4] bg-[#FAF8F4] rounded-3xl border-4 border-[#1E1E1E] p-4 shadow-[8px_12px_0px_#1E1E1E] flex flex-col justify-between relative overflow-hidden group">
                <div className="w-full h-full rounded-2xl border-2 border-dashed border-[#1E1E1E]/20 bg-[#F5F2EB] flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <div className="w-24 h-28 rounded-2xl bg-white border-2 border-[#1E1E1E] shadow-brutal-sm flex flex-col items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform">
                    <div className="w-10 h-10 rounded-full bg-[#EFECE5] border-2 border-[#1E1E1E] flex items-center justify-center mb-1">
                      <div className="flex gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1E1E1E]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1E1E1E]" />
                      </div>
                    </div>
                    <div className="w-14 h-8 rounded-t-xl bg-terracotta/20 border-t-2 border-r-2 border-l-2 border-[#1E1E1E]" />
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

                <div className="mt-2 text-center">
                  <span className="text-[9px] font-mono uppercase font-bold tracking-widest text-[#8A8780]">
                    NEXORA PORTRAIT STUDIO • NO. 01
                  </span>
                </div>
              </div>
            </div>

            {/* Right Side: Invitation and QR Code */}
            <div className="max-w-md space-y-6">
              <div className="space-y-3">
                <span className="localflow-badge-orange text-xs font-mono font-bold uppercase">
                  ✨ Interactive Photo Booth
                </span>
                <h2 className="font-serif text-4xl md:text-5xl font-black text-[#1E1E1E] leading-tight tracking-tight">
                  Step Into Another <span className="text-terracotta italic font-normal">Era</span>.
                </h2>
                <p className="text-sm text-[#4A4A4A] leading-relaxed">
                  Take a portrait on your phone, choose a style, and watch your photo transform inside the gallery frame.
                </p>
              </div>

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
                    Instant upload • Choose your theme
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {themes.map((era) => (
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

        {/* PHASE 2 & 3: PHOTO LOADED, PIXEL DISSOLVING, OR REVEALED */}
        {(phase === 'loaded' || phase === 'transitioning' || phase === 'reveal') && activePhoto && (
          <div className="w-full max-w-xl flex flex-col items-center text-center space-y-5 animate-fadeIn">
            {/* Header Badge */}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 localflow-badge-orange text-xs font-mono font-bold uppercase">
                <span className="w-2 h-2 rounded-full bg-terracotta animate-ping" />
                {activePhoto.ticketNumber} • {activePhoto.guestName}
              </div>
              <h2 className="font-serif text-3xl md:text-4xl font-black text-[#1E1E1E] tracking-tight">
                {phase === 'reveal' ? `${activePhoto.guestName} in the ${currentEra.name}` : `Target Era: ${currentEra.name}`}
              </h2>
              <p className="text-xs font-mono text-[#6B6B6B]">
                {currentEra.eraLabel} • {currentEra.tagline}
              </p>
            </div>

            {/* ART FRAME */}
            <div className="relative flex flex-col items-center">
              <div className="w-4 h-4 rounded-full bg-[#3D3D3D] border-2 border-[#1E1E1E] shadow-sm mb-1 z-10" />
              <div 
                className="w-40 h-8 border-t-2 border-r-2 border-l-2 border-[#1E1E1E]/40 pointer-events-none -mb-3 rotate-180" 
                style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
              />

              <div className="w-72 md:w-80 aspect-[3/4] bg-[#FAF8F4] rounded-3xl border-4 border-[#1E1E1E] p-4 shadow-[8px_12px_0px_#1E1E1E] relative flex flex-col justify-between overflow-hidden">
                <div className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-[#1E1E1E] bg-black">
                  {/* UNDERNEATH LAYER: TRANSFORMED IMAGE (Revealed as pixels fall) */}
                  {activePhoto.transformedPhotoUrl && (
                    <img
                      src={activePhoto.transformedPhotoUrl}
                      alt="Transformed final"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}

                  {/* STATIC RAW PHOTO WHEN JUST LOADED */}
                  {phase === 'loaded' && (
                    <div className="relative w-full h-full">
                      <img
                        src={activePhoto.rawPhotoUrl}
                        alt="Original portrait"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 bg-white text-[#1E1E1E] text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border border-[#1E1E1E] shadow-brutal-sm">
                        Original Photo
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 bg-white/95 border-2 border-[#1E1E1E] rounded-xl p-2.5 shadow-brutal-sm text-center">
                        <span className="text-xs font-serif font-bold text-[#1E1E1E] block">
                          Ready for Transformation
                        </span>
                        <span className="text-[10px] font-mono text-terracotta font-bold">
                          Awaiting Operator Command...
                        </span>
                      </div>
                    </div>
                  )}

                  {/* FALLING PIXEL CANVAS LAYER (Active during transition) */}
                  <canvas
                    ref={particleCanvasRef}
                    width={320}
                    height={420}
                    className={`absolute inset-0 w-full h-full object-cover pointer-events-none ${
                      phase === 'transitioning' ? 'block' : 'hidden'
                    }`}
                  />

                  {/* SLIDER REVEAL LAYER (When in reveal mode) */}
                  {phase === 'reveal' && (
                    <>
                      {/* Left side slider clip showing original */}
                      <div 
                        className="absolute inset-0 overflow-hidden"
                        style={{ width: `${100 - sliderPos}%` }}
                      >
                        <img
                          src={activePhoto.rawPhotoUrl}
                          alt="Original"
                          className="w-full h-full object-cover max-w-none"
                          style={{ width: '100%' }}
                        />
                        <div className="absolute top-2 left-2 bg-white text-[#1E1E1E] text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border border-[#1E1E1E] shadow-brutal-sm">
                          Original
                        </div>
                      </div>

                      {/* Divider line */}
                      <div 
                        className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_12px_#D96E3D] pointer-events-none"
                        style={{ left: `${100 - sliderPos}%` }}
                      >
                        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-white border-2 border-[#1E1E1E] shadow-brutal flex items-center justify-center text-[#1E1E1E]">
                          <span className="text-[10px] font-bold">⇄</span>
                        </div>
                      </div>

                      {/* Nexora Brand Stamp */}
                      <div className="absolute bottom-2 right-2 bg-white/95 border-2 border-[#1E1E1E] px-2.5 py-1 rounded-lg shadow-brutal-sm flex items-center gap-1.5">
                        <span className="font-serif font-bold text-xs tracking-wider text-[#1E1E1E]">NEXORA</span>
                        <span className="text-[9px] font-mono text-terracotta font-bold">• {currentEra.name}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Exhibition Plaque */}
                <div className="mt-2 text-center flex items-center justify-between px-1 text-[10px] font-mono text-[#6B6B6B]">
                  <span>{activePhoto.ticketNumber}</span>
                  <span className="font-bold text-[#1E1E1E]">{activePhoto.guestName}</span>
                  <span>{currentEra.name}</span>
                </div>
              </div>
            </div>

            {/* Slider bar if in reveal phase */}
            {phase === 'reveal' && (
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
            )}
          </div>
        )}
      </main>

      {/* FOOTER BAR */}
      <footer className="relative z-20 px-8 py-3.5 border-t-2 border-[#1E1E1E]/10 bg-[#FAF8F4]/85 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-[#6B6B6B]">
        <div className="flex items-center gap-3">
          <span className="text-terracotta font-bold">NEXORA DISPLAY ENGINE</span>
          <span>•</span>
          <span>Turn Moments Into New Worlds</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#8A8780] hidden sm:inline">Instant Demos:</span>
          {themes.slice(0, 3).map((era) => (
            <button
              key={era.id}
              onClick={() => runPrototypeDemo(era.id)}
              className="px-2.5 py-1 rounded-md bg-white hover:bg-[#FAF8F4] border border-[#1E1E1E]/30 text-[#1E1E1E] text-[11px] font-mono shadow-sm transition-all"
            >
              {era.name}
            </button>
          ))}
          <button
            onClick={() => {
              if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
              setPhase('idle');
              setActivePhoto(null);
            }}
            className="px-2.5 py-1 rounded-md bg-terracotta text-white border border-[#1E1E1E] text-[11px] font-mono shadow-brutal-sm ml-2"
          >
            Reset Standby
          </button>
        </div>
      </footer>
    </div>
  );
}
