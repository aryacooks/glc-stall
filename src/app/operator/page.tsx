'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, Sparkles, Copy, Check, ArrowRight, Play, RefreshCw, 
  Tv, MonitorPlay, Image as ImageIcon, Upload, FileText, CheckCircle2,
  Clock, Flame, Layers, ExternalLink, Sliders, AlertCircle, Settings
} from 'lucide-react';
import { STYLE_ERAS, getStyleById } from '@/lib/stylesConfig';
import { GuestPhoto, PhotoStatus, EraStyleId } from '@/lib/types';
import { StorageService } from '@/lib/storageService';
import Link from 'next/link';

export default function OperatorDashboard() {
  const [activeTab, setActiveTab] = useState<'queue' | 'history' | 'prompts' | 'settings'>('queue');
  const [photos, setPhotos] = useState<GuestPhoto[]>([]);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  const [copiedPhotoId, setCopiedPhotoId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const dropZoneRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load photos and subscribe to live updates
  const refreshPhotos = async () => {
    const list = await StorageService.getAllPhotos();
    setPhotos(list);
    if (!selectedPhotoId && list.length > 0) {
      setSelectedPhotoId(list[0].id);
    }
  };

  useEffect(() => {
    refreshPhotos();

    const unsubscribe = StorageService.subscribe((event) => {
      if (event.type === 'PHOTO_QUEUED') {
        showNotification(`New guest arrived: ${event.payload.guestName} (${event.payload.ticketNumber})`);
        refreshPhotos();
        setSelectedPhotoId(event.payload.id);
      } else {
        refreshPhotos();
      }
    });

    return () => unsubscribe();
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const selectedPhoto = photos.find(p => p.id === selectedPhotoId) || photos[0];
  const selectedEra = selectedPhoto ? getStyleById(selectedPhoto.styleId) : STYLE_ERAS[0];

  // Helper: Copy Prompt for ChatGPT
  const handleCopyPrompt = async (promptText: string, id: string) => {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopiedPromptId(id);
      showNotification('Prompt copied to clipboard! Ready to paste into ChatGPT.');
      setTimeout(() => setCopiedPromptId(null), 2500);
    } catch (err) {
      console.error('Failed to copy prompt', err);
    }
  };

  // Helper: Copy Raw Photo to OS Clipboard so operator can Cmd+V directly into ChatGPT!
  const handleCopyPhoto = async (photoUrl: string, id: string) => {
    try {
      // Fetch image data and convert to blob
      const res = await fetch(photoUrl);
      const blob = await res.blob();
      
      // Ensure PNG format for ClipboardItem API compatibility
      let pngBlob = blob;
      if (blob.type !== 'image/png') {
        const img = new Image();
        img.src = photoUrl;
        await new Promise((resolve) => { img.onload = resolve; });
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        const dataUri = canvas.toDataURL('image/png');
        const pngRes = await fetch(dataUri);
        pngBlob = await pngRes.blob();
      }

      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': pngBlob,
        }),
      ]);
      setCopiedPhotoId(id);
      showNotification('Image copied to clipboard! Press Cmd+V in ChatGPT.');
      setTimeout(() => setCopiedPhotoId(null), 2500);
    } catch (err) {
      console.warn('ClipboardItem failed, opening fallback download', err);
      // Fallback: trigger download of the image
      const a = document.createElement('a');
      a.href = photoUrl;
      a.download = `nexora-${selectedPhoto?.ticketNumber || 'guest'}.jpg`;
      a.click();
      showNotification('Downloaded image file for ChatGPT upload.');
    }
  };

  // Handle image upload / drop / paste from ChatGPT
  const processOutputImage = async (dataUrl: string) => {
    if (!selectedPhoto) return;
    setIsProcessing(true);

    try {
      // Apply official Nexora Watermark to the transformed image
      const watermarked = await StorageService.applyWatermark(dataUrl, selectedEra.name);

      await StorageService.updatePhoto(selectedPhoto.id, {
        transformedPhotoUrl: watermarked,
        status: 'ready',
      });

      showNotification(`Transformed image linked & pushed to Live TV Display!`);
      refreshPhotos();
    } catch (err) {
      console.error('Error processing output image', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Drag & drop handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        const result = loadEvt.target?.result as string;
        if (result) processOutputImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Listen for Cmd+V / Ctrl+V clipboard paste directly in window
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (loadEvt) => {
              const result = loadEvt.target?.result as string;
              if (result) processOutputImage(result);
            };
            reader.readAsDataURL(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [selectedPhoto, selectedEra]);

  // Fast prototype mock generation (uses the pre-crafted era demonstration)
  const handleSimulateTransform = async () => {
    if (!selectedPhoto) return;
    setIsProcessing(true);

    // Step 1: Simulate loading animation on TV Display
    StorageService.broadcastEvent({
      type: 'PHOTO_PROCESSING',
      payload: {
        id: selectedPhoto.id,
        progress: 45,
        message: `Synthesizing ${selectedEra.name} era aesthetics...`,
      },
    });

    // Step 2: Push the demo transformed image after 1.8s
    setTimeout(async () => {
      const demoImg = selectedEra.demoTransformed;
      await processOutputImage(demoImg);
      setIsProcessing(false);
    }, 1800);
  };

  // Start animated TV loading without output image yet
  const handleStartTvLoading = () => {
    if (!selectedPhoto) return;
    StorageService.broadcastEvent({
      type: 'PHOTO_PROCESSING',
      payload: {
        id: selectedPhoto.id,
        progress: 30,
        message: `Analyzing facial geometry for ${selectedEra.name}...`,
      },
    });
    showNotification('TV Screen switched to Live Processing Animation!');
  };

  // Force TV Screen to show current selected photo
  const handleForceDisplay = () => {
    if (!selectedPhoto) return;
    StorageService.broadcastEvent({
      type: 'DISPLAY_FORCE_VIEW',
      payload: {
        photoId: selectedPhoto.id,
        step: selectedPhoto.transformedPhotoUrl ? 'reveal' : 'loading',
      },
    });
    showNotification('Sent current photo to TV Display view.');
  };

  // Reset TV to idle attract mode
  const handleResetTv = () => {
    StorageService.broadcastEvent({ type: 'DISPLAY_RESET' });
    showNotification('TV Display returned to idle attract mode.');
  };

  return (
    <div className="min-h-screen bg-canvas text-ink-900 flex flex-col md:flex-row">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-ink-900 text-white px-4 py-2.5 rounded-xl border-2 border-white/20 shadow-brutal flex items-center gap-2.5 text-xs font-mono animate-bounce">
          <Sparkles className="w-4 h-4 text-terracotta" />
          {notification}
        </div>
      )}

      {/* LEFT SIDEBAR (Modeled after LocalFlow screenshots) */}
      <aside className="w-full md:w-64 bg-canvas border-r-2 border-ink-900 flex flex-col justify-between p-4 flex-shrink-0">
        <div className="space-y-6">
          {/* Logo & Stall Brand */}
          <div className="flex items-center gap-3 pb-4 border-b-2 border-ink-900/10">
            <div className="w-9 h-9 rounded-xl bg-terracotta text-white font-serif font-black flex items-center justify-center border-2 border-ink-900 shadow-brutal-sm text-lg">
              N
            </div>
            <div>
              <h1 className="font-serif text-lg font-extrabold tracking-tight text-ink-900 leading-tight">
                NEXORA
              </h1>
              <p className="text-[10px] font-mono uppercase tracking-widest text-ink-500 font-bold">
                Operator Backstage
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="space-y-1.5 font-medium text-sm">
            <button
              onClick={() => setActiveTab('queue')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border-2 transition-all ${
                activeTab === 'queue'
                  ? 'bg-terracotta text-white border-ink-900 shadow-brutal-sm'
                  : 'bg-transparent text-ink-700 border-transparent hover:bg-canvas-hover'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4" />
                <span className="font-semibold">Live Queue</span>
              </div>
              <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded-md ${
                activeTab === 'queue' ? 'bg-black/20 text-white' : 'bg-ink-900/10 text-ink-700'
              }`}>
                {photos.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('prompts')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 transition-all ${
                activeTab === 'prompts'
                  ? 'bg-terracotta text-white border-ink-900 shadow-brutal-sm'
                  : 'bg-transparent text-ink-700 border-transparent hover:bg-canvas-hover'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className="font-semibold">Style Prompts</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 transition-all ${
                activeTab === 'settings'
                  ? 'bg-terracotta text-white border-ink-900 shadow-brutal-sm'
                  : 'bg-transparent text-ink-700 border-transparent hover:bg-canvas-hover'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span className="font-semibold">Stall Settings</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Bottom Controls */}
        <div className="space-y-3 pt-4 border-t-2 border-ink-900/10">
          <Link
            href="/display"
            target="_blank"
            className="w-full localflow-btn-secondary py-2.5 px-3 text-xs flex items-center justify-center gap-2 font-mono"
          >
            <Tv className="w-3.5 h-3.5 text-terracotta" />
            Open TV Display (Tab) ↗
          </Link>

          <Link
            href="/capture"
            target="_blank"
            className="w-full localflow-btn-secondary py-2 px-3 text-xs flex items-center justify-center gap-2 font-mono"
          >
            <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
            Mobile Capture Portal ↗
          </Link>

          <div className="localflow-card-flat p-2.5 bg-canvas-card flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-mono text-[11px] text-ink-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Stall Sync Ready
            </span>
            <span className="localflow-key text-[10px]">ESC</span>
          </div>
        </div>
      </aside>

      {/* MAIN WORKSPACE CONTENT */}
      <main className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6 max-w-7xl">
        {/* Header Bar */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-ink-900/10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono uppercase text-ink-500 font-bold">
                GLC Stall Operator Station
              </span>
              <span className="localflow-badge-green text-[10px]">Realtime Connected</span>
            </div>
            <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-ink-900">
              Transformation Dispatch Desk
            </h2>
          </div>

          {/* Quick TV Control Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleForceDisplay}
              className="localflow-btn-secondary px-3 py-2 text-xs flex items-center gap-1.5 font-mono"
              title="Push current photo to display screen"
            >
              <MonitorPlay className="w-3.5 h-3.5 text-terracotta" />
              Focus on TV
            </button>
            <button
              onClick={handleResetTv}
              className="localflow-btn-secondary px-3 py-2 text-xs flex items-center gap-1.5 font-mono"
              title="Return TV to QR attract screen"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Screen
            </button>
          </div>
        </header>

        {/* METRIC STRIP (Modeled after LocalFlow top cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          <div className="localflow-card p-3.5">
            <span className="text-[10px] font-mono uppercase font-bold text-ink-500 block">Total Guests</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-serif text-3xl font-extrabold text-ink-900">{photos.length}</span>
              <span className="localflow-badge-green text-[10px]">Today</span>
            </div>
          </div>

          <div className="localflow-card p-3.5">
            <span className="text-[10px] font-mono uppercase font-bold text-ink-500 block">Queue Waiting</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-serif text-3xl font-extrabold text-terracotta">
                {photos.filter(p => p.status === 'queued').length}
              </span>
              <span className="text-xs text-ink-500 font-mono">awaiting AI</span>
            </div>
          </div>

          <div className="localflow-card p-3.5">
            <span className="text-[10px] font-mono uppercase font-bold text-ink-500 block">Completed</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-serif text-3xl font-extrabold text-emerald-700">
                {photos.filter(p => p.status === 'ready').length}
              </span>
              <span className="localflow-badge-neutral text-[10px]">Watermarked</span>
            </div>
          </div>

          <div className="localflow-card p-3.5">
            <span className="text-[10px] font-mono uppercase font-bold text-ink-500 block">Active Preset</span>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="localflow-badge-orange text-xs font-mono font-bold">
                {selectedEra.name}
              </span>
            </div>
          </div>
        </div>

        {/* OPERATOR WORKFLOW SECTION */}
        {activeTab === 'queue' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* INCOMING QUEUE LIST (LEFT COLUMN, 4 COLS) */}
            <div className="lg:col-span-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-base font-bold text-ink-900 flex items-center gap-2">
                  <span>Guest Queue</span>
                  <span className="localflow-badge-neutral text-[10px] font-mono">
                    {photos.length}
                  </span>
                </h3>
                <button
                  onClick={refreshPhotos}
                  className="text-xs font-mono text-ink-500 hover:text-ink-900 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Refresh
                </button>
              </div>

              <div className="space-y-2 max-h-[68vh] overflow-y-auto pr-1">
                {photos.length === 0 ? (
                  <div className="localflow-card p-6 text-center space-y-3">
                    <div className="w-10 h-10 rounded-full bg-canvas border-2 border-ink-900 mx-auto flex items-center justify-center text-ink-400">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-serif font-bold text-sm">Queue is Empty</p>
                      <p className="text-xs text-ink-500 mt-1">
                        Scan the QR code on a mobile phone to capture the first stall portrait!
                      </p>
                    </div>
                    <Link
                      href="/capture"
                      target="_blank"
                      className="inline-block localflow-btn-primary px-3 py-1.5 text-xs font-mono"
                    >
                      Open Mobile Capture
                    </Link>
                  </div>
                ) : (
                  photos.map((photo) => {
                    const isSelected = photo.id === selectedPhotoId;
                    const era = getStyleById(photo.styleId);
                    return (
                      <div
                        key={photo.id}
                        onClick={() => setSelectedPhotoId(photo.id)}
                        className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-3 ${
                          isSelected
                            ? 'bg-white border-ink-900 shadow-brutal-sm ring-2 ring-terracotta'
                            : 'bg-canvas-card border-ink-900/20 hover:border-ink-900/50'
                        }`}
                      >
                        <div className="w-12 h-14 rounded-lg border border-ink-900 overflow-hidden flex-shrink-0 bg-ink-900">
                          <img
                            src={photo.transformedPhotoUrl || photo.rawPhotoUrl}
                            alt={photo.guestName}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-mono text-xs font-bold text-ink-900 truncate">
                              {photo.ticketNumber}
                            </span>
                            {photo.status === 'ready' ? (
                              <span className="localflow-badge-green text-[9px] font-mono">
                                Ready
                              </span>
                            ) : (
                              <span className="localflow-badge-orange text-[9px] font-mono animate-pulse">
                                Waiting AI
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-ink-800 truncate">
                            {photo.guestName}
                          </p>
                          <span
                            className="inline-block text-[10px] font-mono uppercase px-1.5 rounded border mt-0.5"
                            style={{
                              backgroundColor: `${era.badgeColor}15`,
                              color: era.accentColor,
                              borderColor: `${era.badgeColor}40`,
                            }}
                          >
                            {era.name}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* ACTIVE WORKBENCH: DISPATCH TO CHATGPT & DROPZONE (8 COLS) */}
            <div className="lg:col-span-8 space-y-4">
              {selectedPhoto ? (
                <div className="localflow-card p-5 space-y-5">
                  {/* Item Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b-2 border-ink-900/10">
                    <div className="flex items-center gap-3">
                      <span className="localflow-key text-xs font-bold font-mono">
                        {selectedPhoto.ticketNumber}
                      </span>
                      <div>
                        <h4 className="font-serif text-lg font-bold leading-tight">
                          {selectedPhoto.guestName}
                        </h4>
                        <span className="text-[11px] font-mono text-ink-500">
                          Target Style: <strong className="text-terracotta">{selectedEra.name}</strong> ({selectedEra.eraLabel})
                        </span>
                      </div>
                    </div>

                    {/* Prototype Fast Simulator */}
                    <button
                      onClick={handleSimulateTransform}
                      disabled={isProcessing}
                      className="localflow-btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 font-mono text-terracotta border-terracotta hover:bg-terracotta-light"
                      title="Test the transformation flow immediately with built-in prototype asset"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-terracotta" />
                      {isProcessing ? 'Simulating...' : '1-Click Demo Transform'}
                    </button>
                  </div>

                  {/* 3-STEP PIPELINE CARDS */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* STEP 1: COPY RAW PHOTO */}
                    <div className="localflow-card-flat p-3.5 bg-white space-y-3 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="localflow-badge-neutral text-[10px] font-mono font-bold">
                            Step 1
                          </span>
                          <span className="text-[11px] font-mono text-ink-500">Original</span>
                        </div>
                        <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden border border-ink-900 bg-ink-900">
                          <img
                            src={selectedPhoto.rawPhotoUrl}
                            alt="Guest Original"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => handleCopyPhoto(selectedPhoto.rawPhotoUrl, selectedPhoto.id)}
                        className="w-full localflow-btn-primary py-2 px-2 text-xs flex items-center justify-center gap-1.5"
                      >
                        {copiedPhotoId === selectedPhoto.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-white" />
                            Copied! Cmd+V in ChatGPT
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Copy Photo for ChatGPT
                          </>
                        )}
                      </button>
                    </div>

                    {/* STEP 2: COPY ENGINEERED PROMPT */}
                    <div className="localflow-card-flat p-3.5 bg-white space-y-3 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="localflow-badge-neutral text-[10px] font-mono font-bold">
                            Step 2
                          </span>
                          <span className="text-[11px] font-mono text-ink-500">Prompt</span>
                        </div>

                        <div className="bg-canvas p-2.5 rounded-lg border border-ink-900/20 text-[11px] font-mono text-ink-800 h-40 overflow-y-auto leading-relaxed select-all">
                          {selectedEra.promptTemplate}
                        </div>
                      </div>

                      <button
                        onClick={() => handleCopyPrompt(selectedEra.promptTemplate, selectedPhoto.id)}
                        className="w-full localflow-btn-secondary py-2 px-2 text-xs flex items-center justify-center gap-1.5"
                      >
                        {copiedPromptId === selectedPhoto.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            Prompt Copied!
                          </>
                        ) : (
                          <>
                            <FileText className="w-3.5 h-3.5" />
                            Copy Era Prompt
                          </>
                        )}
                      </button>
                    </div>

                    {/* STEP 3: DROP / PASTE CHATGPT OUTPUT */}
                    <div className="localflow-card-flat p-3.5 bg-white space-y-3 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="localflow-badge-green text-[10px] font-mono font-bold">
                            Step 3
                          </span>
                          <span className="text-[11px] font-mono text-ink-500">AI Result</span>
                        </div>

                        {selectedPhoto.transformedPhotoUrl ? (
                          <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden border-2 border-emerald-600 bg-ink-900">
                            <img
                              src={selectedPhoto.transformedPhotoUrl}
                              alt="Transformed Branded"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">
                              ✓ Watermarked
                            </div>
                          </div>
                        ) : (
                          <div
                            ref={dropZoneRef}
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`aspect-[3/4] w-full rounded-lg border-2 border-dashed flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-all ${
                              dragOver
                                ? 'border-terracotta bg-terracotta-light/30 scale-102'
                                : 'border-ink-900/30 hover:border-terracotta bg-canvas/40'
                            }`}
                          >
                            <Upload className="w-6 h-6 text-terracotta mb-2" />
                            <p className="font-serif font-bold text-xs text-ink-900">
                              Drop ChatGPT Result
                            </p>
                            <p className="text-[10px] font-mono text-ink-500 mt-1">
                              Or press <strong className="text-ink-900">Cmd+V</strong> to paste
                            </p>
                          </div>
                        )}
                      </div>

                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (loadEvt) => {
                              const result = loadEvt.target?.result as string;
                              if (result) processOutputImage(result);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />

                      <div className="flex gap-2">
                        <button
                          onClick={handleStartTvLoading}
                          className="flex-1 localflow-btn-secondary py-2 text-xs flex items-center justify-center gap-1 font-mono"
                          title="Show progress spinner on TV screen while ChatGPT generates"
                        >
                          <Play className="w-3 h-3 text-terracotta" />
                          Start TV Radar
                        </button>

                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="localflow-btn-secondary p-2 text-xs flex items-center justify-center"
                          title="Pick file from computer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Workflow Instructions Note */}
                  <div className="bg-canvas p-3 rounded-xl border border-ink-900/10 flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-terracotta flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-ink-700 leading-snug">
                      <strong>How the Stall Operator Flow works:</strong>
                      <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-ink-600 mt-1 font-mono">
                        <li>Click <strong>Copy Photo</strong> (copies to clipboard) → Switch to ChatGPT & press <strong>Cmd+V</strong>.</li>
                        <li>Click <strong>Copy Era Prompt</strong> → Paste into ChatGPT prompt input and send.</li>
                        <li>Once ChatGPT finishes generation, copy the output image and press <strong>Cmd+V</strong> here (or drag-drop).</li>
                        <li>The TV screen instantly transitions with the branded Nexora reveal animation!</li>
                      </ol>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="localflow-card p-12 text-center">
                  <p className="font-serif text-lg font-bold">Select a photo from the queue to start</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STYLE PROMPTS LIBRARY TAB */}
        {activeTab === 'prompts' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-serif text-xl font-bold">Curated Era Prompts</h3>
              <p className="text-xs text-ink-500 font-mono">
                Engineered prompts used to instruct ChatGPT Plus for each aesthetic era.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {STYLE_ERAS.map((era) => (
                <div key={era.id} className="localflow-card p-4 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded border"
                        style={{
                          backgroundColor: `${era.badgeColor}20`,
                          color: era.accentColor,
                          borderColor: `${era.badgeColor}60`,
                        }}
                      >
                        {era.name}
                      </span>
                      <span className="text-xs font-serif text-ink-500 italic">
                        {era.eraLabel}
                      </span>
                    </div>

                    <p className="text-xs text-ink-700 font-medium mb-3">
                      {era.description}
                    </p>

                    <div className="bg-canvas p-3 rounded-lg border border-ink-900/20 text-xs font-mono text-ink-800 max-h-36 overflow-y-auto leading-relaxed select-all">
                      {era.promptTemplate}
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopyPrompt(era.promptTemplate, era.id)}
                    className="localflow-btn-secondary w-full py-2 text-xs flex items-center justify-center gap-2 font-mono"
                  >
                    {copiedPromptId === era.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Copied Prompt!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy Prompt Template
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STALL SETTINGS TAB (Modeled after LocalFlow Settings Screenshot) */}
        {activeTab === 'settings' && (
          <div className="space-y-5 max-w-3xl">
            <div>
              <h3 className="font-serif text-xl font-bold">Stall Preferences & Backend</h3>
              <p className="text-xs text-ink-500 font-mono">
                Configure your Supabase connection and display preferences.
              </p>
            </div>

            <div className="localflow-card p-5 space-y-4">
              <h4 className="font-serif text-base font-bold text-ink-900 border-b border-ink-900/10 pb-2">
                Supabase Backend Configuration
              </h4>
              <p className="text-xs text-ink-600">
                When you are ready to connect your production Supabase database, provide the URL and Anon key below or in <code className="localflow-key text-[11px]">.env.local</code>. Currently running on high-speed zero-config local realtime storage.
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-mono font-bold uppercase text-[10px] text-ink-500 mb-1">
                    NEXT_PUBLIC_SUPABASE_URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://your-project.supabase.co"
                    className="w-full bg-white border border-ink-900/30 rounded-lg p-2.5 font-mono text-xs focus:outline-none focus:border-terracotta"
                    readOnly
                    value={process.env.NEXT_PUBLIC_SUPABASE_URL || 'Local Synchronizer Active (Fallback Engine)'}
                  />
                </div>

                <div>
                  <label className="block font-mono font-bold uppercase text-[10px] text-ink-500 mb-1">
                    NEXT_PUBLIC_SUPABASE_ANON_KEY
                  </label>
                  <input
                    type="password"
                    placeholder="eyJh..."
                    className="w-full bg-white border border-ink-900/30 rounded-lg p-2.5 font-mono text-xs focus:outline-none focus:border-terracotta"
                    readOnly
                    value={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '••••••••••••••••' : 'Using Local Realtime Bus'}
                  />
                </div>
              </div>
            </div>

            <div className="localflow-card p-5 space-y-3">
              <h4 className="font-serif text-base font-bold text-ink-900 border-b border-ink-900/10 pb-2">
                Data Management
              </h4>
              <p className="text-xs text-ink-600">
                Clear temporary queue and storage for testing a fresh stall session.
              </p>
              <button
                onClick={() => {
                  if (confirm('Clear local guest queue?')) {
                    localStorage.removeItem('nexora_stall_photos_v1');
                    refreshPhotos();
                    showNotification('Queue reset!');
                  }
                }}
                className="localflow-btn-secondary text-xs px-3 py-2 text-rose-700 border-rose-600 hover:bg-rose-50"
              >
                Clear Queue Storage
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
