export type StyleCategory = 'theme' | 'character';

export type EraStyleId = 
  | 'cyberpunk'
  | '1980s'
  | 'ghibli'
  | 'y2k'
  | 'vintage-noir'
  | 'renaissance'
  | 'char_corporate_overlord'
  | 'char_secret_agent'
  | 'char_red_carpet_vip'
  | 'char_pirate_captain'
  | 'char_grand_maharaja'
  | 'char_living_room_genie'
  | 'char_don_ogre'
  | 'char_saint_heisenberg'
  | 'char_panicked_ceo'
  | 'char_mad_scientist'
  | (string & {});

export interface StyleEra {
  id: string;
  name: string;
  category?: StyleCategory;
  eraLabel: string;
  tagline: string;
  badgeColor: string;
  accentColor: string;
  borderColor: string;
  promptTemplate: string;
  description: string;
  samplePlaceholder: string;
  demoTransformed: string;
}

export type PhotoStatus = 'queued' | 'processing' | 'ready' | 'archived';

export interface GuestPhoto {
  id: string;
  ticketNumber: string;
  guestName: string;
  styleId: EraStyleId;
  rawPhotoUrl: string;
  transformedPhotoUrl?: string;
  status: PhotoStatus;
  progress?: number;
  statusMessage?: string;
  createdAt: number;
  updatedAt: number;
  apiCost?: number;
  modelUsed?: string;
}

export type RealtimeEvent = 
  | { type: 'PHOTO_QUEUED'; payload: GuestPhoto }
  | { type: 'PHOTO_PROCESSING'; payload: { id: string; progress: number; message: string } }
  | { type: 'PHOTO_TRANSFORMED'; payload: GuestPhoto }
  | { type: 'PHOTO_DELETED'; payload: { id: string } }
  | { type: 'DISPLAY_RESET' }
  | { type: 'DISPLAY_FORCE_VIEW'; payload: { photoId: string; step: 'loading' | 'reveal'; photo?: GuestPhoto } };

