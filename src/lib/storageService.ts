import { GuestPhoto, PhotoStatus, RealtimeEvent } from './types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const STORAGE_KEY = 'nexora_stall_photos_v1';
const BROADCAST_CHANNEL_NAME = 'nexora_stall_sync_channel';

// In-memory cache for ultra-responsive local UI
let localCache: GuestPhoto[] = [];

// Initialize BroadcastChannel if in browser
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  } catch (e) {
    console.warn('BroadcastChannel not supported in this environment', e);
  }
}

// Generate human-friendly sequential ticket code
let ticketSequence = 100;

export const StorageService = {
  // Load all photos from Supabase, Server API, or LocalStorage
  async getAllPhotos(): Promise<GuestPhoto[]> {
    // 1. Try direct Supabase client if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('nexora_photos')
          .select('*')
          .order('createdAt', { ascending: false });

        if (!error && data) {
          localCache = data as GuestPhoto[];
          return localCache;
        }
      } catch (err) {
        console.warn('Failed to query direct Supabase, trying /api/photos', err);
      }
    }

    // 2. Try server API endpoint (uses service role key on server)
    try {
      const res = await fetch('/api/photos', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.photos && Array.isArray(json.photos)) {
          localCache = json.photos;
          return localCache;
        }
      }
    } catch {
      // offline fallback
    }

    // 3. Fallback to localStorage
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          localCache = JSON.parse(stored);
          return localCache;
        }
      } catch (err) {
        console.error('Error reading from localStorage', err);
      }
    }

    return localCache;
  },

  // Auto-sync any orphaned local photos to Supabase so Incognito and other devices see them
  async syncLocalToCloud(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const localList: GuestPhoto[] = JSON.parse(stored);
      if (!localList || localList.length === 0) return;

      // 1. Check what is currently in Supabase
      let cloudPhotos: GuestPhoto[] = [];
      if (supabase) {
        const { data } = await supabase.from('nexora_photos').select('id');
        if (data) cloudPhotos = data as GuestPhoto[];
      }
      const cloudIds = new Set(cloudPhotos.map((p) => p.id));

      // 2. Upload any photos that only exist in localStorage
      for (const photo of localList) {
        if (!cloudIds.has(photo.id)) {
          console.log('[NEXORA] Migrating local photo to Supabase:', photo.ticketNumber, photo.guestName);
          try {
            await fetch('/api/photos', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(photo),
            });
          } catch {
            if (supabase) {
              await supabase.from('nexora_photos').upsert([photo]);
            }
          }
        }
      }
    } catch (e) {
      console.warn('Sync local to cloud warning', e);
    }
  },

  // Save new incoming photo from guest mobile
  async createPhoto(entry: {
    guestName: string;
    styleId: GuestPhoto['styleId'];
    rawPhotoUrl: string;
  }): Promise<GuestPhoto> {
    ticketSequence += 1;
    const ticketNumber = `NEX-${ticketSequence}`;
    const id = `photo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newPhoto: GuestPhoto = {
      id,
      ticketNumber,
      guestName: entry.guestName.trim() || `Guest #${ticketSequence}`,
      styleId: entry.styleId,
      rawPhotoUrl: entry.rawPhotoUrl,
      status: 'queued',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    let savedPhoto = newPhoto;

    // 1. Send to server API route which uploads to Supabase Storage & inserts into DB
    try {
      const res = await fetch('/api/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPhoto),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.photo) {
          savedPhoto = json.photo;
        }
      } else {
        console.warn('/api/photos returned status', res.status);
      }
    } catch (apiErr) {
      console.warn('Could not reach /api/photos, trying direct Supabase', apiErr);
    }

    // 2. Direct Supabase fallback if API route was not reachable
    if (savedPhoto.rawPhotoUrl.startsWith('data:') && isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('nexora_photos').upsert([savedPhoto]);
        if (error) {
          console.error('Direct Supabase insert error:', error.message);
        }
      } catch (err) {
        console.warn('Direct Supabase insert failed', err);
      }
    }

    // 3. Save locally as immediate responsive cache
    if (typeof window !== 'undefined') {
      try {
        const current = await this.getAllPhotos();
        const updated = [savedPhoto, ...current.filter(p => p.id !== savedPhoto.id)];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        localCache = updated;
      } catch (err) {
        console.error('LocalStorage write error', err);
      }
    }

    // 4. Broadcast event across browser tabs / windows
    this.broadcastEvent({
      type: 'PHOTO_QUEUED',
      payload: savedPhoto,
    });

    return savedPhoto;
  },

  // Update photo status (e.g. processing, or transformed output attached)
  async updatePhoto(id: string, updates: Partial<GuestPhoto>): Promise<GuestPhoto | null> {
    const photos = await this.getAllPhotos();
    const index = photos.findIndex(p => p.id === id);
    if (index === -1) return null;

    const updatedPhoto: GuestPhoto = {
      ...photos[index],
      ...updates,
      updatedAt: Date.now(),
    };

    photos[index] = updatedPhoto;

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('nexora_photos')
          .update(updates)
          .eq('id', id);
        if (error) {
          // If custom column is missing in Supabase schema, retry with core fields only
          const { apiCost, modelUsed, ...coreUpdates } = updates as any;
          await supabase
            .from('nexora_photos')
            .update(coreUpdates)
            .eq('id', id);
        }
      } catch (err) {
        console.warn('Supabase update failed', err);
      }
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
        localCache = photos;
      } catch (err) {
        console.error('LocalStorage update error', err);
      }
    }

    // Also notify server endpoint
    try {
      fetch(`/api/photos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      }).catch(() => {});
    } catch {
      // safe ignore
    }

    // Broadcast the updated state
    if (updates.status === 'processing') {
      this.broadcastEvent({
        type: 'PHOTO_PROCESSING',
        payload: {
          id,
          progress: updates.progress || 20,
          message: updates.statusMessage || 'Analyzing portrait...',
        },
      });
    } else if (updates.status === 'ready' && updatedPhoto.transformedPhotoUrl) {
      this.broadcastEvent({
        type: 'PHOTO_TRANSFORMED',
        payload: updatedPhoto,
      });
    }

    return updatedPhoto;
  },

  // Delete photo from Supabase, LocalStorage, and Server memory
  async deletePhoto(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('nexora_photos')
          .delete()
          .eq('id', id);
      } catch (err) {
        console.warn('Supabase delete error', err);
      }
    }

    if (typeof window !== 'undefined') {
      try {
        const current = await this.getAllPhotos();
        const filtered = current.filter(p => p.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        localCache = filtered;
      } catch (err) {
        console.error('LocalStorage delete error', err);
      }
    }

    // Notify server endpoint
    try {
      fetch(`/api/photos/${id}`, {
        method: 'DELETE',
      }).catch(() => {});
    } catch {
      // safe ignore
    }

    this.broadcastEvent({
      type: 'PHOTO_DELETED',
      payload: { id },
    });

    return true;
  },

  // Send an event across all open windows (Operator <-> TV Display)
  broadcastEvent(event: RealtimeEvent) {
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage(event);
      } catch (e) {
        console.warn('BroadcastChannel error', e);
      }
    }

    // Storage event trigger for safari / older browsers
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nexora_sync_event', { detail: event }));
    }
  },

  // Listen to realtime updates across tabs, LAN, and Supabase cloud
  subscribe(callback: (event: RealtimeEvent) => void): () => void {
    const handleBroadcast = (e: MessageEvent) => {
      callback(e.data);
    };

    const handleCustom = (e: Event) => {
      const customEvent = e as CustomEvent<RealtimeEvent>;
      if (customEvent.detail) {
        callback(customEvent.detail);
      }
    };

    if (broadcastChannel) {
      broadcastChannel.addEventListener('message', handleBroadcast);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('nexora_sync_event', handleCustom);
    }

    // Cloud Realtime via Supabase WebSockets
    let supabaseChannel: any = null;
    if (isSupabaseConfigured && supabase) {
      try {
        supabaseChannel = supabase
          .channel('nexora_db_changes')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'nexora_photos' },
            (payload: any) => {
              if (payload.eventType === 'INSERT' && payload.new) {
                callback({
                  type: 'PHOTO_QUEUED',
                  payload: payload.new as GuestPhoto,
                });
              } else if (payload.eventType === 'UPDATE' && payload.new) {
                const updated = payload.new as GuestPhoto;
                if (updated.status === 'processing') {
                  callback({
                    type: 'PHOTO_PROCESSING',
                    payload: {
                      id: updated.id,
                      progress: updated.progress || 50,
                      message: updated.statusMessage || 'Processing...',
                    },
                  });
                } else if (updated.status === 'ready' && updated.transformedPhotoUrl) {
                  callback({
                    type: 'PHOTO_TRANSFORMED',
                    payload: updated,
                  });
                }
              } else if (payload.eventType === 'DELETE' && payload.old) {
                callback({
                  type: 'PHOTO_DELETED',
                  payload: { id: payload.old.id },
                });
              }
            }
          )
          .subscribe();
      } catch (err) {
        console.warn('Supabase Realtime subscription error', err);
      }
    }

    // Return cleanup function
    return () => {
      if (broadcastChannel) {
        broadcastChannel.removeEventListener('message', handleBroadcast);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('nexora_sync_event', handleCustom);
      }
      if (supabaseChannel && supabase) {
        supabase.removeChannel(supabaseChannel);
      }
    };
  },

  // Add the official NEXORA branded watermark onto a canvas / base64 image
  async applyWatermark(imageDataUrl: string, eraName: string): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imageDataUrl);
          return;
        }

        // Draw original
        ctx.drawImage(img, 0, 0);

        // Calculate proportional watermark bar at bottom
        const barHeight = Math.max(60, Math.floor(img.height * 0.1));
        const y = img.height - barHeight;

        // Dark translucent glass banner
        ctx.fillStyle = 'rgba(12, 12, 12, 0.88)';
        ctx.fillRect(0, y, img.width, barHeight);

        // Thin accent border on top of bar
        ctx.fillStyle = '#D96E3D';
        ctx.fillRect(0, y, img.width, 3);

        // Text branding
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `900 ${Math.floor(barHeight * 0.32)}px system-ui, sans-serif`;
        ctx.letterSpacing = '3px';
        ctx.fillText('NEXORA', 24, y + barHeight * 0.45);

        ctx.fillStyle = '#9CA3AF';
        ctx.font = `500 ${Math.floor(barHeight * 0.2)}px system-ui, sans-serif`;
        ctx.fillText('SAME YOU. DIFFERENT ERA.', 24, y + barHeight * 0.78);

        // Right side era badge
        ctx.fillStyle = '#D96E3D';
        ctx.font = `700 ${Math.floor(barHeight * 0.25)}px system-ui, sans-serif`;
        ctx.textAlign = 'right';
        ctx.fillText(eraName.toUpperCase(), img.width - 24, y + barHeight * 0.6);

        resolve(canvas.toDataURL('image/jpeg', 0.95));
      };
      img.onerror = () => resolve(imageDataUrl);
      img.src = imageDataUrl;
    });
  }
};
