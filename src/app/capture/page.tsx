'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, SwitchCamera, Upload, Sparkles, Check, ArrowRight, RefreshCw, Zap, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { STYLE_ERAS, getStyleById } from '@/lib/stylesConfig';
import { EraStyleId, GuestPhoto } from '@/lib/types';
import { StorageService } from '@/lib/storageService';
import Link from 'next/link';

export default function CapturePage() {
  const [step, setStep] = useState<'camera' | 'review' | 'style' | 'success'>('camera');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [selectedStyle, setSelectedStyle] = useState<EraStyleId>('1980s');
  const [guestName, setGuestName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<GuestPhoto | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isShutterFlash, setIsShutterFlash] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera
  const startCamera = async () => {
    setCameraError(null);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not available on this browser. Use file upload.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.warn('Camera permission denied or unavailable:', err);
      setCameraError(err.message || 'Camera access not permitted. Please upload a photo instead.');
    }
  };

  useEffect(() => {
    if (step === 'camera') {
      startCamera();
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode, step]);

  const toggleFacingMode = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  // Capture frame from video
  const takePhoto = () => {
    if (!videoRef.current) return;
    
    // Shutter flash effect
    setIsShutterFlash(true);
    setTimeout(() => setIsShutterFlash(false), 150);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 1280;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip horizontally if front-facing camera for natural mirror feel
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(dataUrl);
    setStep('style');
  };

  // Fallback file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        setCapturedImage(result);
        setStep('style');
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit to stall queue
  const handleSubmit = async () => {
    if (!capturedImage) return;
    setIsSubmitting(true);

    try {
      const created = await StorageService.createPhoto({
        guestName: guestName.trim() || 'GLC Guest',
        styleId: selectedStyle,
        rawPhotoUrl: capturedImage,
      });

      setSubmittedTicket(created);
      setStep('success');
    } catch (err) {
      console.error('Error submitting photo', err);
      alert('Failed to send photo. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setStep('camera');
  };

  const selectedEraObj = getStyleById(selectedStyle);

  return (
    <div className="min-h-screen bg-canvas text-ink-900 flex flex-col justify-between max-w-md mx-auto relative px-4 py-4 pb-8 select-none">
      {/* Header */}
      <header className="flex items-center justify-between py-2 border-b-2 border-ink-900/10 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-terracotta text-white font-bold flex items-center justify-center border-2 border-ink-900 shadow-brutal-sm">
            N
          </div>
          <div>
            <h1 className="font-serif text-lg font-bold tracking-tight text-ink-900 leading-none">
              NEXORA
            </h1>
            <p className="text-[10px] uppercase font-mono tracking-widest text-ink-500 font-semibold">
              Same You. Different Era.
            </p>
          </div>
        </div>
        <span className="localflow-badge-green text-xs flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
          Stall Live
        </span>
      </header>

      {/* STEP 1: CAMERA VIEW */}
      {step === 'camera' && (
        <div className="flex-1 flex flex-col justify-between space-y-4">
          <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden border-2 border-ink-900 bg-ink-900 shadow-brutal flex items-center justify-center">
            {/* Shutter Flash Overlay */}
            {isShutterFlash && (
              <div className="absolute inset-0 bg-white z-40 transition-opacity" />
            )}

            {/* Video Viewfinder */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />

            {/* Camera Guides */}
            <div className="absolute inset-0 pointer-events-none border-[12px] border-black/20 flex flex-col justify-between p-4">
              <div className="flex justify-between items-start">
                <span className="bg-black/60 backdrop-blur-sm text-white font-mono text-[11px] px-2.5 py-1 rounded-md border border-white/20">
                  PORTRAIT MODE
                </span>
                <span className="bg-terracotta text-white font-mono text-[11px] px-2 py-1 rounded-md font-bold">
                  STEP 1 / 2
                </span>
              </div>
              <div className="flex justify-center">
                <div className="w-36 h-48 rounded-full border-2 border-dashed border-white/60 flex items-center justify-center">
                  <span className="text-white/70 text-xs font-medium px-2 py-1 bg-black/40 rounded">
                    Position Face Here
                  </span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-white/80 text-xs font-medium drop-shadow">
                  Hold steady and smile!
                </p>
              </div>
            </div>

            {/* Camera Error Fallback Message */}
            {cameraError && (
              <div className="absolute inset-0 bg-canvas-card p-6 flex flex-col items-center justify-center text-center z-20">
                <div className="w-12 h-12 rounded-full bg-terracotta/20 text-terracotta flex items-center justify-center mb-3 border-2 border-terracotta">
                  <Camera className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg font-bold mb-1">Camera Access</h3>
                <p className="text-xs text-ink-500 mb-4">{cameraError}</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="localflow-btn-primary px-4 py-2.5 text-sm flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Choose Photo from Gallery
                </button>
              </div>
            )}
          </div>

          {/* Camera Controls */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4 px-2">
              {/* Switch Camera Button */}
              <button
                type="button"
                onClick={toggleFacingMode}
                className="w-12 h-12 rounded-full bg-white border-2 border-ink-900 shadow-brutal-sm flex items-center justify-center text-ink-800 hover:bg-canvas-hover active:translate-y-0.5"
                title="Flip Camera"
              >
                <SwitchCamera className="w-5 h-5" />
              </button>

              {/* Main Shutter Button */}
              <button
                type="button"
                onClick={takePhoto}
                className="w-20 h-20 rounded-full bg-white border-4 border-ink-900 shadow-brutal flex items-center justify-center p-1 group active:scale-95 transition-all"
              >
                <div className="w-full h-full rounded-full bg-terracotta group-hover:bg-terracotta-hover border-2 border-ink-900 flex items-center justify-center">
                  <Camera className="w-7 h-7 text-white" />
                </div>
              </button>

              {/* Upload fallback */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-12 h-12 rounded-full bg-white border-2 border-ink-900 shadow-brutal-sm flex items-center justify-center text-ink-800 hover:bg-canvas-hover active:translate-y-0.5"
                title="Upload Photo"
              >
                <Upload className="w-5 h-5" />
              </button>
            </div>

            <p className="text-center text-xs text-ink-500 font-mono">
              Tap the orange shutter or choose from camera roll
            </p>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      )}

      {/* STEP 2: SELECT ERA STYLE & NAME */}
      {step === 'style' && capturedImage && (
        <div className="flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            {/* Top Bar with Retake & Preview Thumbnail */}
            <div className="flex items-center justify-between">
              <div>
                <span className="localflow-badge-orange text-[10px] font-mono uppercase font-bold tracking-wider">
                  Step 2 of 2
                </span>
                <h2 className="font-serif text-xl font-bold mt-1 text-ink-900">
                  Pick Your New Era
                </h2>
              </div>
              <button
                onClick={handleRetake}
                className="localflow-btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Retake
              </button>
            </div>

            {/* Guest Name input */}
            <div className="localflow-card p-3 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg border border-ink-900 overflow-hidden flex-shrink-0">
                <img src={capturedImage} alt="Captured preview" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <label className="block text-[11px] font-mono text-ink-500 font-bold uppercase mb-0.5">
                  Your Name / Nickname (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full text-sm font-semibold bg-white border border-ink-900/30 rounded-md px-2.5 py-1 focus:outline-none focus:border-terracotta"
                  maxLength={24}
                />
              </div>
            </div>

            {/* Era Styles Carousel / Grid */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-ink-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-terracotta" />
                Choose Transformation Style:
              </label>

              <div className="grid grid-cols-2 gap-2.5 max-h-[38vh] overflow-y-auto pr-1 pb-1">
                {STYLE_ERAS.map((era) => {
                  const isSelected = selectedStyle === era.id;
                  return (
                    <button
                      key={era.id}
                      type="button"
                      onClick={() => setSelectedStyle(era.id)}
                      className={`relative text-left rounded-xl p-2.5 border-2 transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-ink-900 bg-white shadow-brutal-sm ring-2 ring-terracotta'
                          : 'border-ink-900/20 bg-canvas-card hover:border-ink-900/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border"
                          style={{
                            backgroundColor: `${era.badgeColor}20`,
                            color: era.id === 'cyberpunk' ? '#007A87' : era.accentColor,
                            borderColor: `${era.badgeColor}60`,
                          }}
                        >
                          {era.name}
                        </span>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-terracotta text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border border-ink-900/10 mb-1.5 bg-ink-900">
                        <img
                          src={era.demoTransformed}
                          alt={era.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <p className="text-[11px] text-ink-700 line-clamp-2 leading-tight">
                        {era.tagline}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full localflow-btn-primary py-3 px-4 text-base flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Sending to Stall Screen...
                </>
              ) : (
                <>
                  <span>Send to Stall Display</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
            <p className="text-center text-[11px] text-ink-500 font-mono mt-2">
              Photo will appear on the big screen instantly
            </p>
          </div>
        </div>
      )}

      {/* STEP 3: SUCCESS TICKET SCREEN */}
      {step === 'success' && submittedTicket && (
        <div className="flex-1 flex flex-col justify-between py-2 text-center space-y-4">
          <div className="localflow-card p-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-600 text-emerald-700 mx-auto flex items-center justify-center shadow-brutal-sm">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div>
              <span className="localflow-badge-green font-mono uppercase text-xs">
                Ticket Confirmed
              </span>
              <h2 className="font-serif text-3xl font-black text-ink-900 mt-2">
                {submittedTicket.ticketNumber}
              </h2>
              <p className="text-xs text-ink-500 font-mono mt-0.5">
                Guest: {submittedTicket.guestName}
              </p>
            </div>

            {/* Ticket Card Details */}
            <div className="border-t-2 border-b-2 border-dashed border-ink-900/20 py-4 flex items-center justify-around">
              <div className="text-center">
                <span className="text-[10px] font-mono text-ink-500 uppercase block">Selected Era</span>
                <span className="font-serif font-bold text-sm text-terracotta">
                  {selectedEraObj.name}
                </span>
              </div>
              <div className="h-8 w-px bg-ink-900/20" />
              <div className="text-center">
                <span className="text-[10px] font-mono text-ink-500 uppercase block">Status</span>
                <span className="localflow-badge-orange text-[10px] uppercase font-mono animate-pulse">
                  On Queue
                </span>
              </div>
            </div>

            <div className="bg-canvas p-3.5 rounded-xl border-2 border-ink-900 text-left flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-terracotta text-white flex items-center justify-center flex-shrink-0 font-bold font-mono text-sm">
                📺
              </div>
              <p className="text-xs font-medium text-ink-800 leading-snug">
                Look up at the <strong className="text-terracotta">Big TV Screen</strong> at the stall! Your transformation will play shortly.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => {
                setCapturedImage(null);
                setSubmittedTicket(null);
                setStep('camera');
              }}
              className="w-full localflow-btn-secondary py-3 text-sm flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4" />
              Capture Another Photo
            </button>
            <Link
              href="/"
              className="block text-center text-xs text-ink-500 underline font-mono py-1"
            >
              ← Return to Stall Main Portal
            </Link>
          </div>
        </div>
      )}

      {/* Stall Footer Branding */}
      <footer className="mt-4 pt-2 border-t border-ink-900/10 text-center">
        <p className="text-[10px] font-mono text-ink-400">
          NEXORA GLC STALL • POWERED BY AI & SUPABASE
        </p>
      </footer>
    </div>
  );
}
