import { StyleEra } from './types';

// Helper to create distinctive SVG graphics for each era's prototype demo
function createEraSvg(title: string, subtitle: string, bgGradient: string, accentGlow: string, iconType: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750" width="600" height="750">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        ${bgGradient}
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="40%" r="50%">
        ${accentGlow}
      </radialGradient>
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
        <feColorMatrix type="matrix" values="0 0 0 0 0.8  0 0 0 0 0.8  0 0 0 0 0.8  0 0 0 0.15 0" />
      </filter>
    </defs>
    <rect width="600" height="750" fill="url(#bg)" />
    <circle cx="300" cy="320" r="280" fill="url(#glow)" />
    
    <!-- Stylized silhouette & character backdrop -->
    <g transform="translate(300, 360)">
      <!-- Head and shoulders silhouette -->
      <path d="M-90,120 C-90,40 -60,0 0,0 C60,0 90,40 90,120 C90,170 140,240 180,320 L-180,320 C-140,240 -90,170 -90,120 Z" fill="#151515" opacity="0.85" />
      <circle cx="0" cy="-50" r="85" fill="#222222" />
      <!-- Sunglasses / visor / features according to type -->
      ${iconType === 'cyberpunk' ? `
        <rect x="-65" y="-60" width="130" height="24" rx="6" fill="#00F0FF" opacity="0.9" />
        <line x1="-150" y1="-50" x2="150" y2="-50" stroke="#FF007A" stroke-width="3" opacity="0.6" />
        <circle cx="0" cy="-48" r="4" fill="#FFFFFF" />
      ` : iconType === '1980s' ? `
        <!-- Aviator sunglasses -->
        <path d="M-55,-55 C-35,-55 -30,-40 -20,-40 C-10,-40 -5,-55 15,-55 C35,-55 55,-40 55,-25 C55,-10 35, -5 15,-5 C-5,-5 -15,-20 -20,-20 C-25,-20 -35,-5 -55,-5 C-75,-5 -95,-20 -95,-35 Z" fill="#F59E0B" opacity="0.9" transform="translate(20, -10)" />
        <path d="M-300,180 L300,180" stroke="#EC4899" stroke-width="4" opacity="0.5" />
        <path d="M-300,210 L300,210" stroke="#EC4899" stroke-width="3" opacity="0.4" />
      ` : iconType === 'ghibli' ? `
        <!-- Anime soft eyes -->
        <ellipse cx="-30" cy="-50" rx="14" ry="18" fill="#FFFFFF" />
        <circle cx="-28" cy="-48" r="9" fill="#1E3A8A" />
        <circle cx="-25" cy="-52" r="3" fill="#FFFFFF" />
        <ellipse cx="30" cy="-50" rx="14" ry="18" fill="#FFFFFF" />
        <circle cx="28" cy="-48" r="9" fill="#1E3A8A" />
        <circle cx="25" cy="-52" r="3" fill="#FFFFFF" />
        <path d="M-15,-20 Q0,-10 15,-20" stroke="#D97706" stroke-width="3" fill="none" stroke-linecap="round" />
      ` : `
        <!-- Classic portrait visor -->
        <rect x="-50" y="-55" width="100" height="20" rx="10" fill="#E2E8F0" opacity="0.7" />
      `}
    </g>

    <!-- Overlay texture -->
    <rect width="600" height="750" filter="url(#grain)" />

    <!-- Nexora Watermark Brand Card -->
    <g transform="translate(40, 640)">
      <rect width="520" height="75" rx="14" fill="#0A0A0A" opacity="0.88" stroke="#333333" stroke-width="1.5" />
      <text x="24" y="36" font-family="system-ui, sans-serif" font-weight="900" font-size="20" letter-spacing="3" fill="#FFFFFF">NEXORA</text>
      <text x="24" y="56" font-family="system-ui, sans-serif" font-weight="500" font-size="12" letter-spacing="1" fill="#A1A1AA">SAME YOU. DIFFERENT ERA.</text>
      <text x="496" y="44" text-anchor="end" font-family="system-ui, sans-serif" font-weight="700" font-size="14" letter-spacing="2" fill="#D96E3D">${title.toUpperCase()}</text>
    </g>
    
    <!-- Top badge -->
    <g transform="translate(40, 40)">
      <rect width="180" height="34" rx="17" fill="#18181B" opacity="0.85" stroke="#3F3F46" stroke-width="1" />
      <circle cx="20" cy="17" r="5" fill="#10B981" />
      <text x="36" y="22" font-family="system-ui, sans-serif" font-weight="600" font-size="12" fill="#F4F4F5">${subtitle}</text>
    </g>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const STYLE_ERAS: StyleEra[] = [
  {
    id: '1980s',
    name: '1980s Retro',
    eraLabel: 'Retro Neon Synthwave',
    tagline: 'Warm analog hues, neon sunset glow & vintage film grain',
    badgeColor: '#F59E0B',
    accentColor: '#D96E3D',
    borderColor: '#F59E0B',
    promptTemplate: `Turn this portrait photo into an authentic 1980s retro styled photo. Keep the person's exact facial likeness, expression, and identity intact. Apply 1980s synthwave sunset lighting with warm golden hour tones and subtle pink/cyan neon highlights. Style hair with voluminous 1980s texture, 80s bomber jacket or denim attire. Add subtle 35mm film grain, analog color bleed, and a slight warm chromatic lens flare. Ultra-high aesthetic quality, clean portrait framing.`,
    description: 'Brimming with 35mm Kodachrome grain, synthwave neon reflections, aviators and 80s arcade nostalgia.',
    samplePlaceholder: createEraSvg('Original Photo', 'Guest Input', '<stop offset="0%" stop-color="#2D3748" /><stop offset="100%" stop-color="#1A202C" />', '<stop offset="0%" stop-color="#4A5568" stop-opacity="0.8" /><stop offset="100%" stop-color="#2D3748" stop-opacity="0" />', 'default'),
    demoTransformed: createEraSvg('1980s Synthwave', '1980s Collection', '<stop offset="0%" stop-color="#3B0764" /><stop offset="50%" stop-color="#831843" /><stop offset="100%" stop-color="#F59E0B" />', '<stop offset="0%" stop-color="#F43F5E" stop-opacity="0.9" /><stop offset="100%" stop-color="#FB923C" stop-opacity="0" />', '1980s')
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk 2077',
    eraLabel: 'Neon Dystopian Future',
    tagline: 'High-tech neon reflections, subtle cybernetics & rain-slicked city',
    badgeColor: '#00F0FF',
    accentColor: '#00D8F6',
    borderColor: '#00F0FF',
    promptTemplate: `Transform this photo into a gritty Cyberpunk 2077 cinematic portrait. Maintain 100% facial likeness and identity of the person. Add high-tech cyberpunk elements: glowing cyan and hot-magenta neon ambient lighting reflecting on wet skin and dark tactical streetwear. Add subtle cyberware / neural port seams on cheek or temple, glowing holographic HUD reflections, rain mist, and a neon-lit Night City high-rise background out of focus. Cinematic blade-runner atmosphere.`,
    description: 'Night City aesthetic with rain mist, glowing neon glyphs, high-tech streetwear, and optic cyberware.',
    samplePlaceholder: createEraSvg('Original Photo', 'Guest Input', '<stop offset="0%" stop-color="#1E293B" /><stop offset="100%" stop-color="#0F172A" />', '<stop offset="0%" stop-color="#334155" stop-opacity="0.8" /><stop offset="100%" stop-color="#0F172A" stop-opacity="0" />', 'default'),
    demoTransformed: createEraSvg('Cyberpunk 2077', 'Neo-Tokyo Edition', '<stop offset="0%" stop-color="#0F172A" /><stop offset="50%" stop-color="#1E1B4B" /><stop offset="100%" stop-color="#0284C7" />', '<stop offset="0%" stop-color="#EC4899" stop-opacity="0.85" /><stop offset="100%" stop-color="#06B6D4" stop-opacity="0" />', 'cyberpunk')
  },
  {
    id: 'ghibli',
    name: 'Studio Ghibli',
    eraLabel: 'Hand-Painted Anime',
    tagline: 'Soft watercolor lighting, lush vibrant skies & wholesome whimsy',
    badgeColor: '#10B981',
    accentColor: '#059669',
    borderColor: '#10B981',
    promptTemplate: `Reimagine this portrait as a hand-drawn Studio Ghibli anime character. Retain the person's distinct facial structure, hairstyle silhouette, and friendly expression. Render in Hayao Miyazaki aesthetic: hand-painted watercolor textures, soft luminous afternoon sunlight, delicate linework, warm earthy skin tones, whimsical wind blowing hair strands slightly, and a lush green meadow with puffy cumulus clouds in a blue sky background. Wholesome and enchanting.`,
    description: 'Warm watercolor landscapes, hand-drawn anime line art, and the magical charm of classic Miyazaki films.',
    samplePlaceholder: createEraSvg('Original Photo', 'Guest Input', '<stop offset="0%" stop-color="#1F2937" /><stop offset="100%" stop-color="#111827" />', '<stop offset="0%" stop-color="#374151" stop-opacity="0.8" /><stop offset="100%" stop-color="#111827" stop-opacity="0" />', 'default'),
    demoTransformed: createEraSvg('Studio Ghibli', 'Miyazaki Canvas', '<stop offset="0%" stop-color="#0284C7" /><stop offset="60%" stop-color="#34D399" /><stop offset="100%" stop-color="#FBBF24" />', '<stop offset="0%" stop-color="#FDE047" stop-opacity="0.8" /><stop offset="100%" stop-color="#34D399" stop-opacity="0" />', 'ghibli')
  },
  {
    id: 'y2k',
    name: 'Early 2000s Y2K',
    eraLabel: 'Millennium Pop & Chrome',
    tagline: 'Fisheye lens flair, metallic gloss, frosted tips & iridescent sheen',
    badgeColor: '#EC4899',
    accentColor: '#DB2777',
    borderColor: '#EC4899',
    promptTemplate: `Transform this portrait into an iconic early 2000s (Y2K) pop culture aesthetic photo. Maintain the person's face and identity. Add Y2K millennium style: metallic puff jacket or silver chrome accessories, frosted highlights, MTV music video camera angle with subtle wide-angle barrel distortion, glossy gel highlights, translucent pastel pink and ice-blue studio lighting, and early digital aesthetic CD-ROM glare.`,
    description: 'Frosted millennium metallic sheen, shiny chrome, MTV music video lighting and nostalgic pop energy.',
    samplePlaceholder: createEraSvg('Original Photo', 'Guest Input', '<stop offset="0%" stop-color="#1E1B4B" /><stop offset="100%" stop-color="#0F172A" />', '<stop offset="0%" stop-color="#312E81" stop-opacity="0.8" /><stop offset="100%" stop-color="#0F172A" stop-opacity="0" />', 'default'),
    demoTransformed: createEraSvg('Early 2000s', 'Y2K Pop Edition', '<stop offset="0%" stop-color="#4C1D95" /><stop offset="50%" stop-color="#BE185D" /><stop offset="100%" stop-color="#38BDF8" />', '<stop offset="0%" stop-color="#F472B6" stop-opacity="0.9" /><stop offset="100%" stop-color="#67E8F9" stop-opacity="0" />', '1980s')
  },
  {
    id: 'vintage-noir',
    name: '1920s Noir',
    eraLabel: 'Classic Hollywood Film',
    tagline: 'Dramatic Venetian blinds shadow, rich silver halide contrast',
    badgeColor: '#A1A1AA',
    accentColor: '#71717A',
    borderColor: '#71717A',
    promptTemplate: `Transform this portrait into a masterclass 1920s-1940s Hollywood Film Noir black-and-white photograph. Retain the person's facial features and recognizable identity. Use dramatic high-contrast chiaroscuro lighting, Venetian blind shadow stripes slanting across the background, vintage trench coat or tailored 1920s fedora attire, cigarette smoke haze in soft light beam, deep velvety blacks, and fine silver-halide film grain. Iconic cinematic mystery.`,
    description: 'Black-and-white silver halide portraiture with deep chiaroscuro shadows and classic cinematic intrigue.',
    samplePlaceholder: createEraSvg('Original Photo', 'Guest Input', '<stop offset="0%" stop-color="#27272A" /><stop offset="100%" stop-color="#18181B" />', '<stop offset="0%" stop-color="#3F3F46" stop-opacity="0.8" /><stop offset="100%" stop-color="#18181B" stop-opacity="0" />', 'default'),
    demoTransformed: createEraSvg('1920s Noir', 'Silver Halide Film', '<stop offset="0%" stop-color="#09090B" /><stop offset="50%" stop-color="#27272A" /><stop offset="100%" stop-color="#71717A" />', '<stop offset="0%" stop-color="#E4E4E7" stop-opacity="0.75" /><stop offset="100%" stop-color="#09090B" stop-opacity="0" />', 'default')
  },
  {
    id: 'renaissance',
    name: 'Renaissance Oil',
    eraLabel: 'Classical Masterpiece',
    tagline: 'Rich oil paint brushstrokes on linen, Rembrandt chiaroscuro',
    badgeColor: '#D97706',
    accentColor: '#B45309',
    borderColor: '#D97706',
    promptTemplate: `Paint this portrait in the style of a 17th-century Renaissance classical oil painting by Rembrandt and Caravaggio. Preserve the person's true face and gaze. Render with visible impasto oil brushwork, cracked antique canvas texture, rich velvety dark umber shadows, dramatic golden directional window candlelight on the cheek and forehead, ornate velvet period collar, and warm museum oil finish.`,
    description: 'Fine art gallery oil painting with textured impasto brushstrokes and timeless master lighting.',
    samplePlaceholder: createEraSvg('Original Photo', 'Guest Input', '<stop offset="0%" stop-color="#292524" /><stop offset="100%" stop-color="#1C1917" />', '<stop offset="0%" stop-color="#44403C" stop-opacity="0.8" /><stop offset="100%" stop-color="#1C1917" stop-opacity="0" />', 'default'),
    demoTransformed: createEraSvg('Renaissance', 'Master Oil Painting', '<stop offset="0%" stop-color="#1C1917" /><stop offset="50%" stop-color="#451A03" /><stop offset="100%" stop-color="#78350F" />', '<stop offset="0%" stop-color="#F59E0B" stop-opacity="0.8" /><stop offset="100%" stop-color="#451A03" stop-opacity="0" />', 'default')
  }
];

export function getStyleById(id: string): StyleEra {
  return STYLE_ERAS.find(s => s.id === id) || STYLE_ERAS[0];
}
