'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, Sparkles, Copy, Check, ArrowRight, Play, RefreshCw, 
  Tv, MonitorPlay, Image as ImageIcon, Upload, FileText, CheckCircle2,
  Clock, Flame, Layers, ExternalLink, Sliders, AlertCircle, Settings,
  Palette, Camera, X, Clipboard, Plus, Trash2
} from 'lucide-react';
import { getAllThemes, getStyleById, saveCustomTheme, deleteCustomTheme } from '@/lib/stylesConfig';
import { GuestPhoto, PhotoStatus, EraStyleId, StyleEra } from '@/lib/types';
import { StorageService } from '@/lib/storageService';
import Link from 'next/link';

export default function OperatorDashboard() {
  const [activeTab, setActiveTab] = useState<'queue' | 'prompts' | 'settings'>('queue');
  const [photos, setPhotos] = useState<GuestPhoto[]>([]);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  const [copiedPhotoId, setCopiedPhotoId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [themes, setThemes] = useState<StyleEra[]>([]);

  // Add New Theme Form State
  const [newThemeName, setNewThemeName] = useState('');
  const [newThemeTagline, setNewThemeTagline] = useState('');
  const [newThemePrompt, setNewThemePrompt] = useState('');
  const [showAddThemeModal, setShowAddThemeModal] = useState(false);

  // Direct Desk Capture Modal
  const [showDirectUploadModal, setShowDirectUploadModal] = useState(false);
  const [directPhotoImg, setDirectPhotoImg] = useState<string | null>(null);
  const [directGuestName, setDirectGuestName] = useState('');
  const [directSelectedStyle, setDirectSelectedStyle] = useState<string>('1980s');
  const [isDirectSubmitting, setIsDirectSubmitting] = useState(false);

  const dropZoneRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const directFileInputRef = useRef<HTMLInputElement>(null);

  // Load themes & photos
  const loadThemesList = () => {
    setThemes(getAllThemes());
  };

  const refreshPhotos = async () => {
    const list = await StorageService.getAllPhotos();
    setPhotos(list);
    if (!selectedPhotoId && list.length > 0) {
      setSelectedPhotoId(list[0].id);
    }
  };

  useEffect(() => {
    loadThemesList();
    refreshPhotos();

    window.addEventListener('nexora_themes_updated', loadThemesList);

    const unsubscribe = StorageService.subscribe((event) => {
      if (event.type === 'PHOTO_QUEUED') {
        showNotification(`New guest arrived: ${event.payload.guestName} (${event.payload.ticketNumber})`);
        refreshPhotos();
        setSelectedPhotoId(event.payload.id);
      } else if (event.type === 'PHOTO_DELETED') {
        setPhotos((prev) => {
          const nextList = prev.filter((p) => p.id !== event.payload.id);
          setSelectedPhotoId((curr) => (curr === event.payload.id ? (nextList.length > 0 ? nextList[0].id : null) : curr));
          return nextList;
        });
      } else {
        refreshPhotos();
      }
    });

    return () => {
      window.removeEventListener('nexora_themes_updated', loadThemesList);
      unsubscribe();
    };
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const selectedPhoto = photos.find(p => p.id === selectedPhotoId) || photos[0];
  const selectedEra = selectedPhoto ? getStyleById(selectedPhoto.styleId) : (themes[0] || getAllThemes()[0]);

  // Delete photo from queue
  const handleDeletePhoto = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const target = photos.find(p => p.id === id);
    const label = target ? `${target.ticketNumber} (${target.guestName})` : 'this photo';
    if (!confirm(`Are you sure you want to delete ${label} from the queue?`)) {
      return;
    }

    try {
      await StorageService.deletePhoto(id);
      setPhotos((prev) => {
        const nextList = prev.filter((p) => p.id !== id);
        if (selectedPhotoId === id) {
          setSelectedPhotoId(nextList.length > 0 ? nextList[0].id : null);
        }
        return nextList;
      });
      showNotification(`Deleted ${label} from queue.`);
    } catch (err) {
      console.error('Error deleting photo', err);
      showNotification('Failed to delete photo.');
    }
  };

  // Volunteer changes theme on the fly
  const handleChangeEra = async (newStyleId: string) => {
    if (!selectedPhoto) return;
    try {
      const updated = await StorageService.updatePhoto(selectedPhoto.id, {
        styleId: newStyleId as any,
        statusMessage: `Theme set to ${getStyleById(newStyleId).name}`
      });
      if (updated) {
        refreshPhotos();
        showNotification(`Theme updated to ${getStyleById(newStyleId).name}! Matching prompt loaded.`);
      }
    } catch (err) {
      console.error('Error changing theme', err);
    }
  };

  // 1-Click Copy Prompt for ChatGPT
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

  // 1-Click Copy Raw Photo to OS Clipboard for Cmd+V in ChatGPT
  const handleCopyPhoto = async (photoUrl: string, id: string) => {
    try {
      const res = await fetch(photoUrl);
      const blob = await res.blob();
      
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
        new ClipboardItem({ 'image/png': pngBlob }),
      ]);
      setCopiedPhotoId(id);
      showNotification('Photo copied to clipboard! Switch to ChatGPT & press Cmd+V');
      setTimeout(() => setCopiedPhotoId(null), 2500);
    } catch (err) {
      console.warn('ClipboardItem write failed, fallback download', err);
      const a = document.createElement('a');
      a.href = photoUrl;
      a.download = `nexora-${selectedPhoto?.ticketNumber || 'guest'}.jpg`;
      a.click();
      showNotification('Downloaded photo file for ChatGPT.');
    }
  };

  // Handle image from ChatGPT (Drop, File, or Paste)
  const processOutputImage = async (dataUrl: string) => {
    if (!selectedPhoto) return;
    setIsProcessing(true);

    try {
      const watermarked = await StorageService.applyWatermark(dataUrl, selectedEra.name);

      await StorageService.updatePhoto(selectedPhoto.id, {
        transformedPhotoUrl: watermarked,
        status: 'ready',
        statusMessage: 'Transformed image ready'
      });

      showNotification(`New image linked! Click "Show Transition on TV" below.`);
      refreshPhotos();
    } catch (err) {
      console.error('Error processing output image', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Dedicated "Paste from Clipboard" button
  const handlePasteFromClipboardButton = async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.read) {
        showNotification('Please press Cmd+V / Ctrl+V to paste the image.');
        return;
      }

      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find(type => type.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUri = e.target?.result as string;
            if (dataUri) {
              processOutputImage(dataUri);
            }
          };
          reader.readAsDataURL(blob);
          return;
        }
      }
      showNotification('No image found on clipboard. Copy image in ChatGPT first.');
    } catch (err) {
      console.warn('Clipboard read error:', err);
      showNotification('Press Cmd+V / Ctrl+V to paste the image directly.');
    }
  };

  // Listen for Cmd+V anywhere on window
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
              if (result) {
                showNotification('Pasted image captured from ChatGPT!');
                processOutputImage(result);
              }
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

  // Trigger Falling Pixel Breakdown Transition on TV Screen!
  const handleTriggerTransition = () => {
    if (!selectedPhoto || !selectedPhoto.transformedPhotoUrl) {
      showNotification('Please paste the new transformed image first!');
      return;
    }

    StorageService.broadcastEvent({
      type: 'PHOTO_TRANSFORMED',
      payload: selectedPhoto,
    });

    showNotification('✨ Transition triggered! Watch the pixels fall on the TV screen!');
  };

  // Fast prototype mock simulation
  const handleSimulateTransform = async () => {
    if (!selectedPhoto) return;
    setIsProcessing(true);

    const demoImg = selectedEra.demoTransformed;
    await processOutputImage(demoImg);
    setIsProcessing(false);
  };

  // Reset TV to idle
  const handleResetTv = () => {
    StorageService.broadcastEvent({ type: 'DISPLAY_RESET' });
    showNotification('TV Display returned to standby frame.');
  };

  // Focus current photo on TV
  const handleFocusTv = () => {
    if (!selectedPhoto) return;
    StorageService.broadcastEvent({
      type: 'PHOTO_QUEUED',
      payload: selectedPhoto,
    });
    showNotification('Sent current photo to TV display frame.');
  };

  // Save new custom theme
  const handleSaveNewTheme = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThemeName.trim() || !newThemePrompt.trim()) {
      alert('Please provide a Theme Title and ChatGPT Prompt.');
      return;
    }

    saveCustomTheme({
      name: newThemeName,
      tagline: newThemeTagline || 'Custom prompt style',
      promptTemplate: newThemePrompt,
    });

    setNewThemeName('');
    setNewThemeTagline('');
    setNewThemePrompt('');
    setShowAddThemeModal(false);
    showNotification('Theme added! It is now selectable on mobile.');
  };

  // Direct Desk Photo Submission
  const handleDirectSubmit = async () => {
    if (!directPhotoImg) return;
    setIsDirectSubmitting(true);
    try {
      const created = await StorageService.createPhoto({
        guestName: directGuestName.trim() || 'Counter Guest',
        styleId: directSelectedStyle as any,
        rawPhotoUrl: directPhotoImg,
      });

      showNotification(`Added ${created.ticketNumber} to queue!`);
      setSelectedPhotoId(created.id);
      setShowDirectUploadModal(false);
      setDirectPhotoImg(null);
      setDirectGuestName('');
      refreshPhotos();
    } catch (err) {
      console.error('Error creating photo', err);
    } finally {
      setIsDirectSubmitting(false);
    }
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

      {/* MODAL: ADD NEW THEME & PROMPT */}
      {showAddThemeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="localflow-card max-w-lg w-full p-6 space-y-4 bg-white relative">
            <button
              onClick={() => setShowAddThemeModal(false)}
              className="absolute top-4 right-4 p-1 text-ink-500 hover:text-ink-900"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="localflow-badge-orange text-[10px] font-mono uppercase font-bold">
                Theme Creator
              </span>
              <h3 className="font-serif text-xl font-bold mt-1 text-ink-900">
                Add New Theme & Prompt
              </h3>
              <p className="text-xs text-ink-500 font-mono">
                This theme title will appear on the visitor mobile upload page automatically!
              </p>
            </div>

            <form onSubmit={handleSaveNewTheme} className="space-y-3">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-ink-600 mb-1">
                  Theme Title (e.g. "Cyberpunk 2077", "Anime Ninja", "1980s Disco")
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vintage Polaroid"
                  value={newThemeName}
                  onChange={(e) => setNewThemeName(e.target.value)}
                  className="w-full text-sm font-semibold bg-canvas border border-ink-900/30 rounded-lg p-2.5 focus:outline-none focus:border-terracotta"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-ink-600 mb-1">
                  Short Tagline (e.g. "Warm film grain and faded pastel borders")
                </label>
                <input
                  type="text"
                  placeholder="e.g. Authentic 70s analog snapshot"
                  value={newThemeTagline}
                  onChange={(e) => setNewThemeTagline(e.target.value)}
                  className="w-full text-sm font-semibold bg-canvas border border-ink-900/30 rounded-lg p-2.5 focus:outline-none focus:border-terracotta"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-ink-600 mb-1">
                  ChatGPT Prompt Template
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Transform this portrait into an authentic... Keep facial features intact..."
                  value={newThemePrompt}
                  onChange={(e) => setNewThemePrompt(e.target.value)}
                  className="w-full text-xs font-mono bg-canvas border border-ink-900/30 rounded-lg p-2.5 focus:outline-none focus:border-terracotta leading-relaxed"
                />
              </div>

              <button
                type="submit"
                className="w-full localflow-btn-primary py-3 text-sm flex items-center justify-center gap-2 font-mono"
              >
                <Check className="w-4 h-4" />
                <span>Save Theme & Add to Mobile Menu</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DIRECT DESK PHOTO INGESTION */}
      {showDirectUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="localflow-card max-w-lg w-full p-6 space-y-4 bg-white relative">
            <button
              onClick={() => setShowDirectUploadModal(false)}
              className="absolute top-4 right-4 p-1 text-ink-500 hover:text-ink-900"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="localflow-badge-orange text-[10px] font-mono uppercase font-bold">
                Counter Station
              </span>
              <h3 className="font-serif text-xl font-bold mt-1 text-ink-900">
                Snap or Upload Guest at Desk
              </h3>
              <p className="text-xs text-ink-500 font-mono">
                Add an attendee portrait directly from the laptop and pick their era.
              </p>
            </div>

            {directPhotoImg ? (
              <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden border-2 border-ink-900 bg-ink-900">
                <img src={directPhotoImg} alt="Preview" className="w-full h-full object-cover" />
                <button
                  onClick={() => setDirectPhotoImg(null)}
                  className="absolute bottom-2 right-2 localflow-btn-secondary px-2.5 py-1 text-xs"
                >
                  Change Photo
                </button>
              </div>
            ) : (
              <div
                onClick={() => directFileInputRef.current?.click()}
                className="aspect-[4/3] w-full rounded-xl border-2 border-dashed border-ink-900/30 hover:border-terracotta bg-canvas/60 flex flex-col items-center justify-center cursor-pointer p-4"
              >
                <Camera className="w-8 h-8 text-terracotta mb-2" />
                <p className="font-serif font-bold text-sm text-ink-900">Select or Capture Guest Photo</p>
                <p className="text-xs text-ink-500 font-mono mt-1">Supports JPG, PNG, WEBP</p>
              </div>
            )}

            <input
              type="file"
              ref={directFileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (loadEvt) => setDirectPhotoImg(loadEvt.target?.result as string);
                  reader.readAsDataURL(file);
                }
              }}
            />

            <div>
              <label className="block text-xs font-mono font-bold uppercase text-ink-600 mb-1">
                Guest Name / Nickname
              </label>
              <input
                type="text"
                placeholder="e.g. Maya"
                value={directGuestName}
                onChange={(e) => setDirectGuestName(e.target.value)}
                className="w-full text-sm font-semibold bg-canvas border border-ink-900/30 rounded-lg p-2.5 focus:outline-none focus:border-terracotta"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase text-ink-600 mb-1.5 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-terracotta" />
                Select Transformation Theme:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {themes.map((era) => {
                  const isSel = directSelectedStyle === era.id;
                  return (
                    <button
                      key={era.id}
                      type="button"
                      onClick={() => setDirectSelectedStyle(era.id)}
                      className={`p-2 rounded-lg border text-left text-xs font-mono transition-all ${
                        isSel
                          ? 'border-ink-900 bg-terracotta text-white font-bold shadow-brutal-sm'
                          : 'border-ink-900/20 bg-canvas hover:border-ink-900/50 text-ink-800'
                      }`}
                    >
                      {era.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleDirectSubmit}
              disabled={!directPhotoImg || isDirectSubmitting}
              className="w-full localflow-btn-primary py-3 text-sm flex items-center justify-center gap-2"
            >
              {isDirectSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>Add to Queue & Select</span>
            </button>
          </div>
        </div>
      )}

      {/* LEFT SIDEBAR */}
      <aside className="w-full md:w-64 bg-canvas border-r-2 border-ink-900 flex flex-col justify-between p-4 flex-shrink-0">
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b-2 border-ink-900/10">
            <div className="w-9 h-9 rounded-xl bg-terracotta text-white font-serif font-black flex items-center justify-center border-2 border-ink-900 shadow-brutal-sm text-lg">
              N
            </div>
            <div>
              <h1 className="font-serif text-lg font-extrabold tracking-tight text-ink-900 leading-tight">
                NEXORA
              </h1>
              <p className="text-[10px] font-mono uppercase tracking-widest text-ink-500 font-bold">
                Operator Station
              </p>
            </div>
          </div>

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
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border-2 transition-all ${
                activeTab === 'prompts'
                  ? 'bg-terracotta text-white border-ink-900 shadow-brutal-sm'
                  : 'bg-transparent text-ink-700 border-transparent hover:bg-canvas-hover'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Palette className="w-4 h-4" />
                <span className="font-semibold">Themes & Prompts</span>
              </div>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-ink-900/10 text-ink-700">
                {themes.length}
              </span>
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

        <div className="space-y-2.5 pt-4 border-t-2 border-ink-900/10">
          <button
            onClick={() => setShowDirectUploadModal(true)}
            className="w-full localflow-btn-primary py-2.5 px-3 text-xs flex items-center justify-center gap-2 font-mono"
          >
            <Camera className="w-3.5 h-3.5" />
            + Desk Capture
          </button>

          <Link
            href="/display"
            target="_blank"
            className="w-full localflow-btn-secondary py-2 px-3 text-xs flex items-center justify-center gap-2 font-mono"
          >
            <Tv className="w-3.5 h-3.5 text-terracotta" />
            Open TV Screen ↗
          </Link>

          <div className="localflow-card-flat p-2 bg-canvas-card flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-mono text-[11px] text-ink-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Fast Paste Ready
            </span>
            <span className="localflow-key text-[10px]">Cmd+V</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6 max-w-7xl">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-ink-900/10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono uppercase text-ink-500 font-bold">
                GLC Stall Operator Station
              </span>
              <span className="localflow-badge-green text-[10px]">Connected</span>
            </div>
            <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-ink-900">
              Transformation Dispatch Desk
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleFocusTv}
              className="localflow-btn-secondary px-3 py-2 text-xs flex items-center gap-1.5 font-mono"
              title="Show current photo in the frame on the TV"
            >
              <MonitorPlay className="w-3.5 h-3.5 text-terracotta" />
              Focus on TV
            </button>
            <button
              onClick={handleResetTv}
              className="localflow-btn-secondary px-3 py-2 text-xs flex items-center gap-1.5 font-mono"
              title="Return TV to standby frame"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Screen
            </button>
          </div>
        </header>

        {/* WORKFLOW QUEUE TAB */}
        {activeTab === 'queue' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* INCOMING QUEUE (4 COLS) */}
            <div className="lg:col-span-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-base font-bold text-ink-900 flex items-center gap-2">
                  <span>Guest Queue</span>
                  <span className="localflow-badge-neutral text-[10px] font-mono">
                    {photos.length}
                  </span>
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowDirectUploadModal(true)}
                    className="text-xs font-mono text-terracotta font-bold hover:underline"
                  >
                    + Desk Capture
                  </button>
                  <button
                    onClick={refreshPhotos}
                    className="text-xs font-mono text-ink-500 hover:text-ink-900"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>
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
                        Scan the QR code on a mobile phone to add a photo.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowDirectUploadModal(true)}
                      className="localflow-btn-primary px-3 py-1.5 text-xs font-mono"
                    >
                      Capture at Desk
                    </button>
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
                            {photo.transformedPhotoUrl ? (
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

                        {/* Delete Button on Queue Card */}
                        <button
                          type="button"
                          onClick={(e) => handleDeletePhoto(photo.id, e)}
                          className="p-1.5 rounded-lg text-ink-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex-shrink-0"
                          title={`Delete ${photo.ticketNumber}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* ACTIVE WORKSTATION: SIDE-BY-SIDE OLD & NEW IMAGE (8 COLS) */}
            <div className="lg:col-span-8 space-y-4">
              {selectedPhoto ? (
                <div className="localflow-card p-5 space-y-5 bg-white">
                  {/* Header Bar */}
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
                          Selected Theme: <strong className="text-terracotta">{selectedEra.name}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleDeletePhoto(selectedPhoto.id, e)}
                        className="localflow-btn-secondary text-xs px-2.5 py-1.5 flex items-center gap-1.5 font-mono text-rose-700 border-rose-300 hover:bg-rose-50 hover:border-rose-500 transition-colors"
                        title="Delete this photo from the queue"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Delete</span>
                      </button>

                      <button
                        onClick={handleSimulateTransform}
                        disabled={isProcessing}
                        className="localflow-btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 font-mono text-terracotta border-terracotta hover:bg-terracotta-light"
                        title="Simulate transformation in 2 seconds"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-terracotta" />
                        {isProcessing ? 'Simulating...' : '1-Click Demo'}
                      </button>
                    </div>
                  </div>

                  {/* THEME SELECTOR PILLS */}
                  <div className="bg-canvas p-3 rounded-xl border border-ink-900/20">
                    <span className="text-[10px] font-mono uppercase font-bold text-ink-600 block mb-1.5 flex items-center gap-1">
                      <Palette className="w-3 h-3 text-terracotta" />
                      Switch Theme Title (Updates ChatGPT prompt instantly):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {themes.map((era) => {
                        const isActive = selectedPhoto.styleId === era.id;
                        return (
                          <button
                            key={era.id}
                            onClick={() => handleChangeEra(era.id)}
                            className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                              isActive
                                ? 'bg-terracotta text-white border-ink-900 font-bold shadow-brutal-sm ring-1 ring-ink-900'
                                : 'bg-white border-ink-900/30 text-ink-800 hover:border-terracotta'
                            }`}
                          >
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: isActive ? '#FFFFFF' : era.badgeColor }}
                            />
                            {era.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* SIDE-BY-SIDE: OLD IMAGE (LEFT), PROMPT (CENTER), NEW IMAGE (RIGHT) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* LEFT: OLD IMAGE */}
                    <div className="localflow-card-flat p-3.5 bg-canvas space-y-3 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="localflow-badge-neutral text-[10px] font-mono font-bold">
                            Old Image
                          </span>
                          <span className="text-[11px] font-mono text-ink-500">Original</span>
                        </div>
                        <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden border border-ink-900 bg-ink-900">
                          <img
                            src={selectedPhoto.rawPhotoUrl}
                            alt="Original"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => handleCopyPhoto(selectedPhoto.rawPhotoUrl, selectedPhoto.id)}
                        className="w-full localflow-btn-primary py-2.5 px-2 text-xs flex items-center justify-center gap-1.5 font-mono"
                      >
                        {copiedPhotoId === selectedPhoto.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-white" />
                            Copied! Press Cmd+V in ChatGPT
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            1. Copy Photo
                          </>
                        )}
                      </button>
                    </div>

                    {/* CENTER: MATCHING PROMPT */}
                    <div className="localflow-card-flat p-3.5 bg-canvas space-y-3 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="localflow-badge-orange text-[10px] font-mono font-bold">
                            Matching Prompt
                          </span>
                          <span className="text-[11px] font-mono text-ink-500 truncate max-w-[90px]">
                            {selectedEra.name}
                          </span>
                        </div>

                        <div className="bg-white p-2.5 rounded-lg border border-ink-900/20 text-[11px] font-mono text-ink-800 h-44 overflow-y-auto leading-relaxed select-all">
                          {selectedEra.promptTemplate}
                        </div>
                      </div>

                      <button
                        onClick={() => handleCopyPrompt(selectedEra.promptTemplate, selectedPhoto.id)}
                        className="w-full localflow-btn-secondary py-2.5 px-2 text-xs flex items-center justify-center gap-1.5 font-mono"
                      >
                        {copiedPromptId === selectedPhoto.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            Prompt Copied!
                          </>
                        ) : (
                          <>
                            <FileText className="w-3.5 h-3.5" />
                            2. Copy Prompt
                          </>
                        )}
                      </button>
                    </div>

                    {/* RIGHT: NEW IMAGE & PASTE CLIPBOARD */}
                    <div className="localflow-card-flat p-3.5 bg-canvas space-y-3 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="localflow-badge-green text-[10px] font-mono font-bold">
                            New Image
                          </span>
                          <span className="text-[11px] font-mono text-ink-500">Transformed</span>
                        </div>

                        {selectedPhoto.transformedPhotoUrl ? (
                          <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden border-2 border-emerald-600 bg-ink-900">
                            <img
                              src={selectedPhoto.transformedPhotoUrl}
                              alt="Transformed Branded"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">
                              ✓ Ready
                            </div>
                          </div>
                        ) : (
                          <div
                            ref={dropZoneRef}
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                            onClick={handlePasteFromClipboardButton}
                            className={`aspect-[3/4] w-full rounded-lg border-2 border-dashed flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-all ${
                              dragOver
                                ? 'border-terracotta bg-terracotta-light/30 scale-102'
                                : 'border-ink-900/30 hover:border-terracotta bg-white'
                            }`}
                          >
                            <div className="w-10 h-10 rounded-full bg-canvas border-2 border-ink-900 flex items-center justify-center mb-2 shadow-brutal-sm">
                              <Clipboard className="w-5 h-5 text-terracotta" />
                            </div>
                            <p className="font-serif font-bold text-xs text-ink-900">
                              Click or Press <strong className="text-terracotta">Cmd+V</strong>
                            </p>
                            <p className="text-[10px] font-mono text-ink-500 mt-1 leading-tight">
                              Copy image in ChatGPT, then paste right here!
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={handlePasteFromClipboardButton}
                          className="flex-1 localflow-btn-secondary py-2.5 px-2 text-xs flex items-center justify-center gap-1.5 font-mono"
                          title="Paste image directly from clipboard"
                        >
                          <Clipboard className="w-3.5 h-3.5 text-terracotta" />
                          Paste Clipboard
                        </button>

                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="localflow-btn-secondary p-2 text-xs flex items-center justify-center"
                          title="Upload file from computer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                        </button>
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
                    </div>
                  </div>

                  {/* GIANT PRIMARY BUTTON: SHOW TRANSITION ON TV */}
                  <div className="pt-2">
                    <button
                      onClick={handleTriggerTransition}
                      disabled={!selectedPhoto.transformedPhotoUrl}
                      className={`w-full py-3.5 px-4 rounded-xl border-2 border-ink-900 font-bold font-mono text-sm flex items-center justify-center gap-2 shadow-brutal transition-all ${
                        selectedPhoto.transformedPhotoUrl
                          ? 'bg-terracotta text-white hover:bg-terracotta-hover cursor-pointer active:translate-x-0.5 active:translate-y-0.5'
                          : 'bg-canvas text-ink-400 border-ink-900/30 cursor-not-allowed'
                      }`}
                    >
                      <Sparkles className="w-5 h-5 text-amber-300" />
                      <span>✨ Show Transition on TV Screen</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                    <p className="text-center text-[11px] font-mono text-ink-500 mt-2">
                      Breaks original photo into falling pixel bits and reveals the new transformed image on the TV screen
                    </p>
                  </div>
                </div>
              ) : (
                <div className="localflow-card p-12 text-center bg-white">
                  <p className="font-serif text-lg font-bold">Select a photo from the queue to start</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* THEMES & PROMPTS MANAGER TAB */}
        {activeTab === 'prompts' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-2xl font-bold">Themes & Custom Prompts Manager</h3>
                <p className="text-xs text-ink-500 font-mono">
                  All active themes appear dynamically on the mobile upload screen for visitors to choose.
                </p>
              </div>

              <button
                onClick={() => setShowAddThemeModal(true)}
                className="localflow-btn-primary px-4 py-2 text-xs flex items-center gap-1.5 font-mono shadow-brutal-sm"
              >
                <Plus className="w-4 h-4" />
                Add New Theme & Prompt
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {themes.map((era) => (
                <div key={era.id} className="localflow-card p-4 space-y-3 flex flex-col justify-between bg-white">
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
                      {era.id.startsWith('custom_') && (
                        <button
                          onClick={() => deleteCustomTheme(era.id)}
                          className="text-ink-400 hover:text-rose-600 p-1"
                          title="Delete this custom theme"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-ink-700 font-medium mb-3">
                      {era.tagline}
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

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="space-y-5 max-w-3xl">
            <div>
              <h3 className="font-serif text-xl font-bold">Stall Preferences & Backend</h3>
              <p className="text-xs text-ink-500 font-mono">
                Supabase database is connected on project <code className="localflow-key text-[10px]">hjwgcfqwjsalpimggtbk</code>.
              </p>
            </div>

            <div className="localflow-card p-5 space-y-3 bg-white">
              <h4 className="font-serif text-base font-bold text-ink-900 border-b border-ink-900/10 pb-2">
                Data Management
              </h4>
              <p className="text-xs text-ink-600">
                Clear local queue storage for testing a fresh stall session.
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
