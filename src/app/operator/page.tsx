'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, Sparkles, Copy, Check, ArrowRight, Play, RefreshCw, 
  Tv, MonitorPlay, Image as ImageIcon, Upload, FileText, CheckCircle2,
  Clock, Flame, Layers, ExternalLink, Sliders, AlertCircle, Settings,
  Palette, Camera, X, Clipboard, Plus, Trash2, Download,
  Bot, Key, Power, CheckCircle, Eye, EyeOff, Zap
} from 'lucide-react';
import { getAllThemes, getStyleById, saveCustomTheme, deleteCustomTheme } from '@/lib/stylesConfig';
import { GuestPhoto, PhotoStatus, EraStyleId, StyleEra, StyleCategory } from '@/lib/types';
import { StorageService } from '@/lib/storageService';
import Link from 'next/link';

export default function OperatorDashboard() {
  const [activeTab, setActiveTab] = useState<'queue' | 'prompts' | 'settings'>('queue');
  const [photos, setPhotos] = useState<GuestPhoto[]>([]);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  const [copiedPhotoId, setCopiedPhotoId] = useState<string | null>(null);
  const [isCopyingPhoto, setIsCopyingPhoto] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [themes, setThemes] = useState<StyleEra[]>([]);

  // Category filters
  const [deskCategoryFilter, setDeskCategoryFilter] = useState<'all' | 'theme' | 'character'>('theme');
  const [promptFilterCategory, setPromptFilterCategory] = useState<'all' | 'theme' | 'character'>('all');
  const [newThemeCategory, setNewThemeCategory] = useState<StyleCategory>('theme');
  const [directCategoryFilter, setDirectCategoryFilter] = useState<StyleCategory>('theme');

  // OpenRouter Engine Configuration
  const [openRouterApiKey, setOpenRouterApiKey] = useState('');
  const [openRouterModel, setOpenRouterModel] = useState('openai/gpt-image-2.5-flare');
  const [autoTransformEnabled, setAutoTransformEnabled] = useState(false);
  const [isAiTransforming, setIsAiTransforming] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyTestResult, setKeyTestResult] = useState<{ valid: boolean; message: string } | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  // Synchronous refs for event listeners and background triggers
  const openRouterApiKeyRef = useRef('');
  const openRouterModelRef = useRef('openai/gpt-image-2.5-flare');
  const autoTransformEnabledRef = useRef(false);
  const processedAutoPhotoIdsRef = useRef<Set<string>>(new Set());

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
    if (typeof window !== 'undefined') {
      document.title = '⚡ Operator Deck (Do Not Spill Coffee) · NEXORA';
      const savedKey = localStorage.getItem('nexora_openrouter_api_key') || '';
      const savedModel = localStorage.getItem('nexora_openrouter_model') || 'openai/gpt-image-2.5-flare';
      const savedAuto = localStorage.getItem('nexora_openrouter_auto_transform') === 'true';
      setOpenRouterApiKey(savedKey);
      openRouterApiKeyRef.current = savedKey;
      setOpenRouterModel(savedModel);
      openRouterModelRef.current = savedModel;
      setAutoTransformEnabled(savedAuto);
      autoTransformEnabledRef.current = savedAuto;
    }
    loadThemesList();
    refreshPhotos();
    StorageService.syncLocalToCloud().then(() => refreshPhotos());

    window.addEventListener('nexora_themes_updated', loadThemesList);

    const unsubscribe = StorageService.subscribe((event) => {
      if (event.type === 'PHOTO_QUEUED') {
        showNotification(`New guest arrived: ${event.payload.guestName} (${event.payload.ticketNumber})`);
        refreshPhotos();
        setSelectedPhotoId(event.payload.id);

        // Auto-transform with OpenRouter if enabled
        if (autoTransformEnabledRef.current && openRouterApiKeyRef.current) {
          const era = getStyleById(event.payload.styleId);
          runOpenRouterTransformation(event.payload, era, true);
        }
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

    // Auto-poll fallback every 3.5s in case WebSockets are blocked on venue Wi-Fi
    const pollInterval = setInterval(refreshPhotos, 3500);

    return () => {
      window.removeEventListener('nexora_themes_updated', loadThemesList);
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, []);

  // OpenRouter Settings Helpers
  const handleUpdateApiKey = (key: string) => {
    setOpenRouterApiKey(key);
    openRouterApiKeyRef.current = key;
    setKeyTestResult(null);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexora_openrouter_api_key', key);
    }
  };

  const handleUpdateModel = (model: string) => {
    setOpenRouterModel(model);
    openRouterModelRef.current = model;
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexora_openrouter_model', model);
    }
  };

  const handleToggleAutoTransform = (enabled: boolean) => {
    setAutoTransformEnabled(enabled);
    autoTransformEnabledRef.current = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexora_openrouter_auto_transform', enabled ? 'true' : 'false');
    }
    showNotification(enabled ? '⚡ Auto-AI Transformation turned ON!' : 'Auto-AI Transformation turned OFF');
  };

  const handleTestApiKey = async () => {
    const key = openRouterApiKey.trim() || openRouterApiKeyRef.current.trim();
    if (!key) {
      alert('Please enter your OpenRouter API key first.');
      return;
    }
    setIsTestingKey(true);
    setKeyTestResult(null);
    try {
      const res = await fetch('/api/transform/openrouter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: key,
          action: 'test',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const label = data.keyInfo?.label || 'OpenRouter';
        setKeyTestResult({
          valid: true,
          message: `Connected! (${label}${data.keyInfo?.limit ? ` · Limit: $${data.keyInfo.limit}` : ''})`,
        });
        showNotification('OpenRouter API Key verified successfully!');
      } else {
        setKeyTestResult({
          valid: false,
          message: data.error || 'Invalid API Key',
        });
      }
    } catch (e: any) {
      setKeyTestResult({
        valid: false,
        message: e.message || 'Connection check failed',
      });
    } finally {
      setIsTestingKey(false);
    }
  };

  // OpenRouter Generation Function
  const runOpenRouterTransformation = async (photo: GuestPhoto, eraStyle: StyleEra, isAuto = false): Promise<boolean> => {
    const key = openRouterApiKey.trim() || openRouterApiKeyRef.current.trim();
    if (!key) {
      if (!isAuto) {
        alert('Please enter your OpenRouter API Key in the Settings tab first.');
        setActiveTab('settings');
      }
      return false;
    }

    if (processedAutoPhotoIdsRef.current.has(photo.id) && isAuto) {
      return false; // Prevent duplicate auto runs
    }
    if (isAuto) {
      processedAutoPhotoIdsRef.current.add(photo.id);
    }

    try {
      if (!isAuto) setIsAiTransforming(true);

      // Update Supabase status so TV display knows it is transforming
      await StorageService.updatePhoto(photo.id, {
        status: 'processing',
        progress: 40,
        statusMessage: `AI generating with ${openRouterModelRef.current} (${eraStyle.name})...`,
      });

      showNotification(`⚡ Synthesizing image with ${openRouterModelRef.current} for ${photo.guestName}...`);

      const res = await fetch('/api/transform/openrouter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-openrouter-key': key,
        },
        body: JSON.stringify({
          apiKey: key,
          model: openRouterModelRef.current,
          photoUrl: photo.rawPhotoUrl,
          prompt: eraStyle.promptTemplate,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.imageUrl) {
        throw new Error(data.error || 'Failed to generate image from OpenRouter');
      }

      // Apply watermark
      const watermarked = await StorageService.applyWatermark(data.imageUrl, eraStyle.name);

      // Save to Supabase and local storage
      const updated = await StorageService.updatePhoto(photo.id, {
        transformedPhotoUrl: watermarked,
        status: 'ready',
        statusMessage: `AI Transformed by ${openRouterModelRef.current} (${eraStyle.name})`,
      });

      refreshPhotos();

      if (isAuto) {
        // Automatically trigger TV breakdown transition!
        if (updated) {
          StorageService.broadcastEvent({
            type: 'PHOTO_TRANSFORMED',
            payload: updated,
          });
          showNotification(`✨ Auto-AI complete: ${photo.guestName} revealed on TV!`);
        }
      } else {
        showNotification(`✨ Flare AI transformation complete! Click "Show Transition on TV" below.`);
      }

      return true;
    } catch (err: any) {
      console.error('Error in OpenRouter transformation:', err);
      showNotification(`⚠️ OpenRouter error: ${err.message || 'Generation failed'}`);
      await StorageService.updatePhoto(photo.id, {
        status: 'queued',
        progress: 0,
        statusMessage: `AI Generation failed: ${err.message || 'Please try again'}`,
      });
      refreshPhotos();
      return false;
    } finally {
      if (!isAuto) setIsAiTransforming(false);
    }
  };

  // Manual 1-Click Transform Handler for active photo
  const handleManualAiTransform = async () => {
    if (!selectedPhoto) return;
    await runOpenRouterTransformation(selectedPhoto, selectedEra, false);
  };

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

  // Convert any image URL (data URL or Supabase remote URL) safely to a PNG Blob without canvas tainting
  const urlToPngBlob = async (photoUrl: string): Promise<Blob> => {
    let rawBlob: Blob;
    if (photoUrl.startsWith('data:')) {
      const parts = photoUrl.split(',');
      const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      rawBlob = new Blob([u8arr], { type: mime });
    } else {
      const res = await fetch(photoUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status} fetching photo`);
      rawBlob = await res.blob();
    }

    if (rawBlob.type === 'image/png') {
      return rawBlob;
    }

    // Modern browsers: createImageBitmap from in-memory blob is fast and NEVER taints the canvas
    if (typeof createImageBitmap === 'function') {
      try {
        const bitmap = await createImageBitmap(rawBlob);
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(bitmap, 0, 0);
          const pngBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
          if (pngBlob) return pngBlob;
        }
      } catch (bitmapErr) {
        console.warn('createImageBitmap conversion failed, falling back to same-origin ObjectURL:', bitmapErr);
      }
    }

    // Fallback: Object URL is local same-origin (blob:http://...) and will never taint the canvas
    return new Promise<Blob>((resolve, reject) => {
      const objectUrl = URL.createObjectURL(rawBlob);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Canvas 2D context unavailable'));
            return;
          }
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((pngBlob) => {
            URL.revokeObjectURL(objectUrl);
            if (pngBlob) {
              resolve(pngBlob);
            } else {
              reject(new Error('Failed to create PNG blob from canvas'));
            }
          }, 'image/png');
        } catch (err) {
          URL.revokeObjectURL(objectUrl);
          reject(err);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Image failed to load from Blob URL'));
      };
      img.src = objectUrl;
    });
  };

  // 1-Click Copy Raw Photo to OS Clipboard for Cmd+V in ChatGPT
  const handleCopyPhoto = async (photoUrl: string, id: string) => {
    setIsCopyingPhoto(true);
    try {
      // 1. Convert to PNG Blob safely without canvas tainting
      const pngBlob = await urlToPngBlob(photoUrl);

      // 2. Write to system clipboard using ClipboardItem
      if (typeof navigator !== 'undefined' && navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': pngBlob }),
          ]);
          setCopiedPhotoId(id);
          showNotification('Photo copied to clipboard! Switch to ChatGPT and press Cmd+V');
          setTimeout(() => setCopiedPhotoId(null), 3000);
          return;
        } catch (clipErr: any) {
          console.warn('Direct clipboard.write failed, falling back to local blob download:', clipErr);
        }
      }

      // Safe Fallback: If clipboard write is blocked by browser policy, download file locally via blob URL
      // (NEVER navigates or redirects the page to Supabase!)
      const blobUrl = URL.createObjectURL(pngBlob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `nexora-${selectedPhoto?.ticketNumber || 'guest'}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
      showNotification('Clipboard access restricted. Photo downloaded directly as PNG.');
    } catch (err: any) {
      console.error('Error copying photo:', err);
      showNotification(`Failed to copy photo: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsCopyingPhoto(false);
    }
  };

  // Dedicated direct file download helper (always uses local blob URL, never opens Supabase URL)
  const handleDownloadPhoto = async (photoUrl: string, ticketNumber?: string) => {
    try {
      const pngBlob = await urlToPngBlob(photoUrl);
      const blobUrl = URL.createObjectURL(pngBlob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `nexora-${ticketNumber || 'guest'}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
      showNotification(`Downloaded photo for ${ticketNumber || 'guest'}`);
    } catch (err) {
      console.error('Download error:', err);
      showNotification('Could not download photo file.');
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
      alert('Please provide a Title and ChatGPT Prompt.');
      return;
    }

    saveCustomTheme({
      name: newThemeName,
      category: newThemeCategory,
      tagline: newThemeTagline || (newThemeCategory === 'character' ? 'Custom character persona' : 'Custom era aesthetic'),
      promptTemplate: newThemePrompt,
    });

    setNewThemeName('');
    setNewThemeTagline('');
    setNewThemePrompt('');
    setNewThemeCategory('theme');
    setShowAddThemeModal(false);
    showNotification(`${newThemeCategory === 'character' ? 'Character' : 'Theme'} added! Selectable on mobile.`);
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
                  Type / Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewThemeCategory('theme')}
                    className={`py-2 px-3 rounded-lg border text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all ${
                      newThemeCategory === 'theme'
                        ? 'bg-terracotta text-white border-ink-900 shadow-sm'
                        : 'bg-canvas text-ink-700 border-ink-900/20 hover:border-ink-900/50'
                    }`}
                  >
                    <span>🎨</span>
                    <span>Era Theme</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewThemeCategory('character')}
                    className={`py-2 px-3 rounded-lg border text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all ${
                      newThemeCategory === 'character'
                        ? 'bg-purple-600 text-white border-ink-900 shadow-sm'
                        : 'bg-canvas text-ink-700 border-ink-900/20 hover:border-ink-900/50'
                    }`}
                  >
                    <span>🎭</span>
                    <span>Character Persona</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-ink-600 mb-1">
                  {newThemeCategory === 'character' ? 'Character Name (e.g. "Steampunk Aviator", "Space Bounty Hunter")' : 'Theme Title (e.g. "Cyberpunk 2077", "Studio Ghibli", "1980s Disco")'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={newThemeCategory === 'character' ? 'e.g. Steampunk Aviator' : 'e.g. Vintage Polaroid'}
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-mono font-bold uppercase text-ink-600 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-terracotta" />
                  Select Style:
                </label>
                <div className="flex items-center gap-1 bg-canvas p-0.5 rounded border border-ink-900/20">
                  <button
                    type="button"
                    onClick={() => {
                      setDirectCategoryFilter('theme');
                      const firstTheme = themes.find(t => t.category !== 'character');
                      if (firstTheme && getStyleById(directSelectedStyle)?.category === 'character') {
                        setDirectSelectedStyle(firstTheme.id);
                      }
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      directCategoryFilter === 'theme' ? 'bg-terracotta text-white' : 'text-ink-600'
                    }`}
                  >
                    Themes ({themes.filter(t => t.category !== 'character').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDirectCategoryFilter('character');
                      const firstChar = themes.find(t => t.category === 'character');
                      if (firstChar && getStyleById(directSelectedStyle)?.category !== 'character') {
                        setDirectSelectedStyle(firstChar.id);
                      }
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      directCategoryFilter === 'character' ? 'bg-purple-600 text-white' : 'text-ink-600'
                    }`}
                  >
                    Characters ({themes.filter(t => t.category === 'character').length})
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
                {themes
                  .filter(era => directCategoryFilter === 'character' ? era.category === 'character' : era.category !== 'character')
                  .map((era) => {
                    const isSel = directSelectedStyle === era.id;
                    return (
                      <button
                        key={era.id}
                        type="button"
                        onClick={() => setDirectSelectedStyle(era.id)}
                        className={`p-2 rounded-lg border text-left text-xs font-mono transition-all truncate ${
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
                          Selected {selectedEra.category === 'character' ? 'Character' : 'Theme'}:{' '}
                          <strong className={selectedEra.category === 'character' ? 'text-purple-700' : 'text-terracotta'}>
                            {selectedEra.name}
                          </strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Auto-AI Quick Switch Pill */}
                      <button
                        type="button"
                        onClick={() => handleToggleAutoTransform(!autoTransformEnabled)}
                        className={`text-xs font-mono px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all ${
                          autoTransformEnabled
                            ? 'bg-emerald-600 text-white border-ink-900 font-bold shadow-sm'
                            : 'bg-white border-ink-900/30 text-ink-600 hover:border-ink-900'
                        }`}
                        title="Toggle Auto-AI generation for incoming photos"
                      >
                        <Zap className={`w-3.5 h-3.5 ${autoTransformEnabled ? 'fill-current animate-pulse' : ''}`} />
                        <span>Auto-AI: {autoTransformEnabled ? 'ON' : 'OFF'}</span>
                      </button>

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

                  {/* THEME & CHARACTER SELECTOR PILLS */}
                  <div className="bg-canvas p-3 rounded-xl border border-ink-900/20 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-[10px] font-mono uppercase font-bold text-ink-600 flex items-center gap-1">
                        <Palette className="w-3 h-3 text-terracotta" />
                        Switch Style (Updates ChatGPT Prompt Instantly):
                      </span>

                      <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-ink-900/20 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setDeskCategoryFilter('theme')}
                          className={`px-2 py-0.5 rounded text-xs font-mono font-bold transition-all flex items-center gap-1 ${
                            deskCategoryFilter === 'theme'
                              ? 'bg-terracotta text-white shadow-xs'
                              : 'text-ink-600 hover:text-ink-900'
                          }`}
                        >
                          <span>🎨 Themes</span>
                          <span className="text-[10px] opacity-80">
                            ({themes.filter(t => t.category !== 'character').length})
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeskCategoryFilter('character')}
                          className={`px-2 py-0.5 rounded text-xs font-mono font-bold transition-all flex items-center gap-1 ${
                            deskCategoryFilter === 'character'
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'text-ink-600 hover:text-ink-900'
                          }`}
                        >
                          <span>🎭 Characters</span>
                          <span className="text-[10px] opacity-80">
                            ({themes.filter(t => t.category === 'character').length})
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeskCategoryFilter('all')}
                          className={`px-2 py-0.5 rounded text-xs font-mono font-bold transition-all ${
                            deskCategoryFilter === 'all'
                              ? 'bg-ink-900 text-white shadow-xs'
                              : 'text-ink-600 hover:text-ink-900'
                          }`}
                        >
                          All ({themes.length})
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {themes
                        .filter((era) => {
                          if (deskCategoryFilter === 'theme') return era.category !== 'character';
                          if (deskCategoryFilter === 'character') return era.category === 'character';
                          return true;
                        })
                        .map((era) => {
                          const isActive = selectedPhoto.styleId === era.id;
                          const isChar = era.category === 'character';
                          return (
                            <button
                              key={era.id}
                              onClick={() => handleChangeEra(era.id)}
                              className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                                isActive
                                  ? isChar
                                    ? 'bg-purple-700 text-white border-ink-900 font-bold shadow-brutal-sm ring-1 ring-ink-900'
                                    : 'bg-terracotta text-white border-ink-900 font-bold shadow-brutal-sm ring-1 ring-ink-900'
                                  : 'bg-white border-ink-900/30 text-ink-800 hover:border-terracotta'
                              }`}
                            >
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: isActive ? '#FFFFFF' : era.badgeColor }}
                              />
                              <span>{era.name}</span>
                              {isChar && <span className="text-[10px] opacity-75">🎭</span>}
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  {/* ⚡ OPENROUTER AI 1-CLICK ACTION BAR */}
                  <div className="p-3.5 rounded-xl border-2 border-purple-900/30 bg-purple-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-brutal-sm">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-sm flex-shrink-0">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-bold text-sm text-purple-950">
                            OpenRouter AI Pipeline
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-200/80 text-purple-900 font-bold border border-purple-300">
                            {openRouterModel.split('/').pop()}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-purple-800 mt-0.5">
                          Direct AI generation with photo & prompt. No manual copy-paste needed!
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleManualAiTransform}
                        disabled={isAiTransforming || !selectedPhoto}
                        className={`px-4 py-2 rounded-lg text-xs font-mono font-bold border-2 border-ink-900 flex items-center gap-2 shadow-brutal-sm transition-all ${
                          isAiTransforming
                            ? 'bg-purple-300 text-purple-900 cursor-wait'
                            : 'bg-purple-600 text-white hover:bg-purple-700 active:translate-x-0.5 active:translate-y-0.5 cursor-pointer'
                        }`}
                      >
                        {isAiTransforming ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Synthesizing Image...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                            <span>⚡ 1-Click AI Transform</span>
                          </>
                        )}
                      </button>
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

                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleCopyPhoto(selectedPhoto.rawPhotoUrl, selectedPhoto.id)}
                          disabled={isCopyingPhoto}
                          className="flex-1 localflow-btn-primary py-2.5 px-2 text-xs flex items-center justify-center gap-1.5 font-mono"
                          title="Copy photo directly to OS clipboard for Cmd+V in ChatGPT"
                        >
                          {copiedPhotoId === selectedPhoto.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-white" />
                              <span>Copied! Cmd+V in ChatGPT</span>
                            </>
                          ) : isCopyingPhoto ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Copying...</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>1. Copy Photo</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleDownloadPhoto(selectedPhoto.rawPhotoUrl, selectedPhoto.ticketNumber)}
                          className="localflow-btn-secondary p-2.5 text-xs flex items-center justify-center font-mono hover:bg-canvas-hover"
                          title="Save photo file to disk"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-2xl font-bold">Themes & Custom Prompts Manager</h3>
                <p className="text-xs text-ink-500 font-mono">
                  All active themes and characters appear dynamically on mobile upload for visitors to choose.
                </p>
              </div>

              <button
                onClick={() => setShowAddThemeModal(true)}
                className="localflow-btn-primary px-4 py-2 text-xs flex items-center gap-1.5 font-mono shadow-brutal-sm self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                Add New Style / Persona
              </button>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-canvas border border-ink-900/20 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => setPromptFilterCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  promptFilterCategory === 'all'
                    ? 'bg-ink-900 text-white shadow-xs'
                    : 'text-ink-600 hover:text-ink-900'
                }`}
              >
                All ({themes.length})
              </button>
              <button
                type="button"
                onClick={() => setPromptFilterCategory('theme')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                  promptFilterCategory === 'theme'
                    ? 'bg-terracotta text-white shadow-xs'
                    : 'text-ink-600 hover:text-ink-900'
                }`}
              >
                <span>🎨 Era Themes</span>
                <span>({themes.filter(t => t.category !== 'character').length})</span>
              </button>
              <button
                type="button"
                onClick={() => setPromptFilterCategory('character')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                  promptFilterCategory === 'character'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-ink-600 hover:text-ink-900'
                }`}
              >
                <span>🎭 Characters</span>
                <span>({themes.filter(t => t.category === 'character').length})</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {themes
                .filter((era) => {
                  if (promptFilterCategory === 'theme') return era.category !== 'character';
                  if (promptFilterCategory === 'character') return era.category === 'character';
                  return true;
                })
                .map((era) => {
                  const isChar = era.category === 'character';
                  return (
                    <div key={era.id} className="localflow-card p-4 space-y-3 flex flex-col justify-between bg-white">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
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
                            <span
                              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                                isChar
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                            >
                              {isChar ? '🎭 Persona' : '🎨 Theme'}
                            </span>
                          </div>

                          {era.id.startsWith('custom_') && (
                            <button
                              onClick={() => deleteCustomTheme(era.id)}
                              className="text-ink-400 hover:text-rose-600 p-1"
                              title="Delete this custom style"
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
                  );
                })}
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h3 className="font-serif text-2xl font-bold">Stall Preferences & API Automation</h3>
              <p className="text-xs text-ink-500 font-mono">
                Supabase database connected on project <code className="localflow-key text-[10px]">hjwgcfqwjsalpimggtbk</code>.
              </p>
            </div>

            {/* OPENROUTER AI ENGINE CARD */}
            <div className="localflow-card p-6 space-y-5 bg-white border-2 border-ink-900 shadow-brutal">
              <div className="flex items-center justify-between border-b border-ink-900/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 border-2 border-ink-900 flex items-center justify-center text-purple-700 shadow-sm">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-serif text-lg font-bold text-ink-900">
                      OpenRouter AI Transformation Engine
                    </h4>
                    <p className="text-xs text-ink-500 font-mono">
                      Powered by OpenAI’s <code className="text-purple-700 font-bold">openai/gpt-image-2.5-flare</code>
                    </p>
                  </div>
                </div>

                <span className="localflow-badge-orange text-[10px] font-mono font-bold uppercase">
                  Direct API
                </span>
              </div>

              {/* No Vercel Needed Notice */}
              <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 flex items-start gap-2.5">
                <span className="text-base leading-none">💡</span>
                <p className="leading-relaxed">
                  <strong>No Vercel deployment needed!</strong> Your OpenRouter API key is stored safely right in this browser’s memory (<code className="font-mono text-[11px] bg-amber-100 px-1 py-0.5 rounded font-bold">localStorage</code>). It is never committed to Git and will stay active across sessions.
                </p>
              </div>

              {/* API Key Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-bold uppercase text-ink-700 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-terracotta" />
                    OpenRouter API Key:
                  </label>
                  {keyTestResult && (
                    <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                      keyTestResult.valid
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-rose-50 text-rose-700 border-rose-300'
                    }`}>
                      {keyTestResult.valid ? '✅ ' : '❌ '}{keyTestResult.message}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      placeholder="sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxx..."
                      value={openRouterApiKey}
                      onChange={(e) => handleUpdateApiKey(e.target.value)}
                      className="w-full text-xs font-mono bg-canvas border-2 border-ink-900/30 rounded-xl px-3 py-2.5 pr-10 focus:outline-none focus:border-terracotta"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-2.5 top-2.5 text-ink-500 hover:text-ink-900"
                      title={showApiKey ? 'Hide key' : 'Show key'}
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleTestApiKey}
                    disabled={isTestingKey || !openRouterApiKey.trim()}
                    className="localflow-btn-secondary text-xs px-3.5 py-2 flex items-center gap-1.5 font-mono flex-shrink-0"
                  >
                    {isTestingKey ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Testing...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Test Key</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-ink-500 font-mono">
                  Get your OpenRouter API key at <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="text-terracotta underline font-bold">openrouter.ai/keys</a>
                </p>
              </div>

              {/* Model Selector */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold uppercase text-ink-700 block">
                  Model Selection:
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateModel('openai/gpt-image-2.5-flare')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all flex items-center gap-1.5 ${
                      openRouterModel === 'openai/gpt-image-2.5-flare'
                        ? 'bg-purple-600 text-white border-ink-900 shadow-sm'
                        : 'bg-canvas border-ink-900/20 text-ink-700 hover:border-ink-900'
                    }`}
                  >
                    <span>⚡ gpt-image-2.5-flare</span>
                    <span className="text-[10px] opacity-80">(Speed Tier / Recommended)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdateModel('openai/gpt-image-2.5-sunburst')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all flex items-center gap-1.5 ${
                      openRouterModel === 'openai/gpt-image-2.5-sunburst'
                        ? 'bg-purple-600 text-white border-ink-900 shadow-sm'
                        : 'bg-canvas border-ink-900/20 text-ink-700 hover:border-ink-900'
                    }`}
                  >
                    <span>🎨 gpt-image-2.5-sunburst</span>
                    <span className="text-[10px] opacity-80">(High Precision)</span>
                  </button>
                </div>

                <input
                  type="text"
                  value={openRouterModel}
                  onChange={(e) => handleUpdateModel(e.target.value)}
                  placeholder="Custom model ID (e.g. openai/gpt-image-2.5-flare)"
                  className="w-full text-xs font-mono bg-canvas border border-ink-900/30 rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-terracotta"
                />
              </div>

              {/* Auto-Transform New Arrivals Switch */}
              <div className="p-4 rounded-xl border-2 border-ink-900/20 bg-canvas space-y-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-mono font-bold uppercase text-ink-900 flex items-center gap-1.5">
                      <Zap className={`w-3.5 h-3.5 ${autoTransformEnabled ? 'text-amber-500 fill-amber-500' : 'text-ink-400'}`} />
                      Auto-Transform New Arrivals
                    </span>
                    <p className="text-xs text-ink-600 leading-tight">
                      Automatically sends every incoming mobile photo to OpenRouter and reveals it on the TV screen without manual clicking.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleAutoTransform(!autoTransformEnabled)}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold border-2 transition-all flex items-center gap-2 shadow-brutal-sm ${
                      autoTransformEnabled
                        ? 'bg-emerald-600 text-white border-ink-900'
                        : 'bg-white text-ink-700 border-ink-900/30 hover:border-ink-900'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{autoTransformEnabled ? 'AUTOMATION ACTIVE' : 'OFF (MANUAL)'}</span>
                  </button>
                </div>

                <p className="text-[11px] font-mono text-ink-500 italic">
                  * Off by default. When OFF, you can still transform any photo on demand using the <strong>"⚡ 1-Click AI Transform"</strong> button on the desk.
                </p>
              </div>
            </div>

            {/* DATA MANAGEMENT CARD */}
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
