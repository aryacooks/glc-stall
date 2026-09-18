import { StyleEra, StyleCategory } from './types';

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
    
    <g transform="translate(300, 360)">
      <path d="M-90,120 C-90,40 -60,0 0,0 C60,0 90,40 90,120 C90,170 140,240 180,320 L-180,320 C-140,240 -90,170 -90,120 Z" fill="#151515" opacity="0.85" />
      <circle cx="0" cy="-50" r="85" fill="#222222" />
      ${iconType === 'cyberpunk' ? `
        <rect x="-65" y="-60" width="130" height="24" rx="6" fill="#00F0FF" opacity="0.9" />
        <line x1="-150" y1="-50" x2="150" y2="-50" stroke="#FF007A" stroke-width="3" opacity="0.6" />
        <circle cx="0" cy="-48" r="4" fill="#FFFFFF" />
      ` : iconType === '1980s' ? `
        <path d="M-55,-55 C-35,-55 -30,-40 -20,-40 C-10,-40 -5,-55 15,-55 C35,-55 55,-40 55,-25 C55,-10 35, -5 15,-5 C-5,-5 -15,-20 -20,-20 C-25,-20 -35,-5 -55,-5 C-75,-5 -95,-20 -95,-35 Z" fill="#F59E0B" opacity="0.9" transform="translate(20, -10)" />
        <path d="M-300,180 L300,180" stroke="#EC4899" stroke-width="4" opacity="0.5" />
      ` : iconType === 'ghibli' ? `
        <ellipse cx="-30" cy="-50" rx="14" ry="18" fill="#FFFFFF" />
        <circle cx="-28" cy="-48" r="9" fill="#1E3A8A" />
        <ellipse cx="30" cy="-50" rx="14" ry="18" fill="#FFFFFF" />
        <circle cx="28" cy="-48" r="9" fill="#1E3A8A" />
      ` : `
        <rect x="-50" y="-55" width="100" height="20" rx="10" fill="#E2E8F0" opacity="0.7" />
      `}
    </g>

    <rect width="600" height="750" filter="url(#grain)" />

    <g transform="translate(40, 640)">
      <rect width="520" height="75" rx="14" fill="#0A0A0A" opacity="0.88" stroke="#333333" stroke-width="1.5" />
      <text x="24" y="36" font-family="system-ui, sans-serif" font-weight="900" font-size="20" letter-spacing="3" fill="#FFFFFF">NEXORA</text>
      <text x="24" y="56" font-family="system-ui, sans-serif" font-weight="500" font-size="12" letter-spacing="1" fill="#A1A1AA">SAME YOU. DIFFERENT ERA.</text>
      <text x="496" y="44" text-anchor="end" font-family="system-ui, sans-serif" font-weight="700" font-size="14" letter-spacing="2" fill="#D96E3D">${title.toUpperCase()}</text>
    </g>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// -------------------------------------------------------------
// 1. ERA THEMES (Aesthetic & Style transformations)
// -------------------------------------------------------------
export const DEFAULT_STYLE_THEMES: StyleEra[] = [
  {
    id: '1980s',
    name: '1980s Retro',
    category: 'theme',
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
    category: 'theme',
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
    category: 'theme',
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
    category: 'theme',
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
    category: 'theme',
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
    category: 'theme',
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

// -------------------------------------------------------------
// 2. CHARACTERS (Persona & Roleplay transformations)
// -------------------------------------------------------------
export const DEFAULT_STYLE_CHARACTERS: StyleEra[] = [
  {
    id: 'char_corporate_overlord',
    name: 'Corporate Overlord',
    category: 'character',
    eraLabel: 'Futuristic Corporate Satire',
    tagline: 'Golden throne, "Strategy & Global Domination" briefcase & mini minions',
    badgeColor: '#3B82F6',
    accentColor: '#1D4ED8',
    borderColor: '#3B82F6',
    promptTemplate: `Transform this portrait photo into a colorful, humorous cartoon-style 3D illustration of an executive sitting confidently on an elaborate golden throne in a futuristic high-tech corporate office. Preserve the person's exact facial structure, recognizable identity, and features. Dress them in a sharp navy blue three-piece suit, round glasses, and a crown-like headband decorated with corporate buzzwords. They hold a brown leather briefcase labeled "Strategy & Global Domination", with vibrant folders and binders stacked behind them. The futuristic office features neon signs like "Synergy Corp" and "Success", alongside Wall Street charts displaying "Innovation Debt" and "Hype Cycles". Several comical miniature businesspeople in suits surround the throne carrying tiny documents and cups of coffee. The glowing blue platform beneath the throne is decorated with electronic circuit patterns, creating a vibrant, humorous corporate satire aesthetic.`,
    description: 'A colorful, satirical 3D illustration of an executive on a golden throne in a futuristic high-tech office.',
    samplePlaceholder: createEraSvg('Original Photo', 'Guest Input', '<stop offset="0%" stop-color="#1E293B" /><stop offset="100%" stop-color="#0F172A" />', '<stop offset="0%" stop-color="#3B82F6" stop-opacity="0.8" /><stop offset="100%" stop-color="#1E293B" stop-opacity="0" />', 'default'),
    demoTransformed: createEraSvg('Corporate Overlord', 'Executive Edition', '<stop offset="0%" stop-color="#1E3A8A" /><stop offset="50%" stop-color="#2563EB" /><stop offset="100%" stop-color="#F59E0B" />', '<stop offset="0%" stop-color="#60A5FA" stop-opacity="0.8" /><stop offset="100%" stop-color="#FBBF24" stop-opacity="0.8" />', 'default')
  },
  {
    id: 'char_secret_agent',
    name: 'Secret Agent 007',
    category: 'character',
    eraLabel: 'Cinematic Spy Parody',
    tagline: 'Black tuxedo, European cobblestone dusk, robotic duck & tuxedo bulldog',
    badgeColor: '#0F172A',
    accentColor: '#334155',
    borderColor: '#0F172A',
    promptTemplate: `Transform this portrait photo into a stylish 3D cartoon cinematic secret agent. Maintain 100% facial likeness, eye shape, and identity of the person with a confident, playful smirk. Dress them in a crisp black luxury tuxedo with a bow tie, standing beside a classic vintage sports car on an atmospheric cobblestone street in a European city at twilight. The character holds a comical futuristic yellow robotic rubber duck tucked securely under their arm. Next to them sits a small French bulldog wearing a matching tailored tuxedo. Background features an illuminated riverside promenade, historic church spires, and a glowing twilight sky. High-end cinematic spy lighting with playful luxury humor.`,
    description: 'Stylish 3D cartoon secret agent in a tuxedo with a robotic rubber duck and a tuxedo bulldog in Europe at dusk.',
    samplePlaceholder: createEraSvg('Original Photo', 'Guest Input', '<stop offset="0%" stop-color="#0F172A" /><stop offset="100%" stop-color="#020617" />', '<stop offset="0%" stop-color="#475569" stop-opacity="0.8" /><stop offset="100%" stop-color="#0F172A" stop-opacity="0" />', 'default'),
    demoTransformed: createEraSvg('Secret Agent 007', 'Spy Edition', '<stop offset="0%" stop-color="#09090B" /><stop offset="50%" stop-color="#18181B" /><stop offset="100%" stop-color="#EAB308" />', '<stop offset="0%" stop-color="#FACC15" stop-opacity="0.85" /><stop offset="100%" stop-color="#09090B" stop-opacity="0" />', 'default')
  },
  {
    id: 'char_red_carpet_vip',
    name: 'Red Carpet VIP',
    category: 'character',
    eraLabel: 'Celebrity Gala Extravaganza',
    tagline: 'White cape, "Main Character" coffee, dog bodyguard & paparazzi squirrels',
    badgeColor: '#E11D48',
    accentColor: '#BE123C',
    borderColor: '#E11D48',
    promptTemplate: `Transform this portrait into a stylish 3D animated celebrity superstar walking down a glamorous red carpet at a major film festival. Retain the person's distinct facial identity and expression. Style them in a chic designer black dress or suit with a dramatic flowing white cape, dark designer sunglasses, and trendy fresh white sneakers. They casually hold a designer coffee cup labeled "Main Character" and carry a luxury handbag. Beside them walks a faithful golden retriever wearing a tailored tuxedo and sunglasses acting as their serious bodyguard. A comical crowd of tiny paparazzi squirrels in miniature black suits surrounds the velvet ropes with flashing cameras and microphones. Background includes towering palm trees, glowing spotlights, a helicopter overhead, and luxury gala banners.`,
    description: 'VIP celebrity on a red carpet with a white cape, Main Character coffee cup, and tuxedo paparazzi squirrels.',
    samplePlaceholder: createEraSvg('Original Photo', 'Guest Input', '<stop offset="0%" stop-color="#1C1917" /><stop offset="100%" stop-color="#0C0A09" />', '<stop offset="0%" stop-color="#E11D48" stop-opacity="0.8" /><stop offset="100%" stop-color="#1C1917" stop-opacity="0" />', 'default'),
    demoTransformed: createEraSvg('Red Carpet VIP', 'Cannes Gala', '<stop offset="0%" stop-color="#881337" /><stop offset="50%" stop-color="#BE123C" /><stop offset="100%" stop-color="#F43F5E" />', '<stop offset="0%" stop-color="#FDA4AF" stop-opacity="0.9" /><stop offset="100%" stop-color="#E11D48" stop-opacity="0" />', 'default')
  },
  {
    id: 'char_pirate_captain',
    name: 'Pirate Captain',
    category: 'character',
    eraLabel: 'High Seas Adventure',
    tagline: 'Purple coat, giant hat, treasure map, shoulder parrot & chaotic crew',
    badgeColor: '#8B5CF6',
    accentColor: '#6D28D9',
    borderColor: '#8B5CF6',
    promptTemplate: `Transform this portrait into a cheerful 3D cartoon pirate captain standing on the deck of a legendary wooden galleon ship. Preserve the person's exact face, recognizable smile, and gaze. Dress them in an ornate purple captain's frock coat with gold brocade, an oversized feathered pirate hat, and braided pirate beard or locks. They hold an ancient rolled treasure map while a colorful tropical macaw parrot perches on their shoulder. On the deck in front of them, three comical tiny pirate crew members comically struggle to haul open an overflowing treasure chest packed with sparkling gold coins and gems. Background features billowing skull-and-crossbones sails, rigging, ropes, wooden rum barrels, and a turquoise ocean with a tropical treasure island under a sunny sky.`,
    description: 'Vibrant 3D cartoon pirate captain on a ship deck with a shoulder parrot, treasure map, and tiny crew.',
    samplePlaceholder: createEraSvg('Original Photo', 'Guest Input', '<stop offset="0%" stop-color="#1E1B4B" /><stop offset="100%" stop-color="#0F172A" />', '<stop offset="0%" stop-color="#8B5CF6" stop-opacity="0.8" /><stop offset="100%" stop-color="#1E1B4B" stop-opacity="0" />', 'default'),
    demoTransformed: createEraSvg('Pirate Captain', 'High Seas Gold', '<stop offset="0%" stop-color="#4C1D95" /><stop offset="50%" stop-color="#7C3AED" /><stop offset="100%" stop-color="#EAB308" />', '<stop offset="0%" stop-color="#FBBF24" stop-opacity="0.9" /><stop offset="100%" stop-color="#8B5CF6" stop-opacity="0" />', 'default')
  },
  {
    id: 'char_grand_maharaja',
    name: 'Grand Maharaja',
    category: 'character',
    eraLabel: 'Royal Indian Palace Fairytale',
    tagline: 'Ornate throne, jeweled turban, pearls, steaming chai & royal peacocks',
    badgeColor: '#D97706',
    accentColor: '#B45309',
    borderColor: '#D97706',
    promptTemplate: `Transform this portrait into a magnificent 3D animated royal Maharaja seated upon an ornate golden carved throne inside an opulent Indian palace. Preserve the person's facial structure, smile, and likeness faithfully. Adorn them in richly embroidered purple and gold royal sherwani silk with layered strings of lustrous pearl necklaces and an enormous jeweled royal turban (pagri) with an emerald sarpech feather. In one hand they hold a jeweled scepter, and in the other, a steaming traditional royal cup of tea (chai). Four magnificent iridescent peacocks stroll near the throne, while miniature royal attendants in turbans serve silver platters of traditional sweets and a tiny advisor reads from a scroll. Palace background with intricately carved marble jali arches, glowing hanging lanterns, patterned Persian carpets, and luxurious silk bolsters.`,
    description: '3D animated royal Maharaja on a palace throne with peacocks, giant turban, pearls, and steaming chai.',
    samplePlaceholder: createEraSvg('Original Photo', 'Guest Input', '<stop offset="0%" stop-color="#2D1B02" /><stop offset="100%" stop-color="#1A0E00" />', '<stop offset="0%" stop-color="#D97706" stop-opacity="0.8" /><stop offset="100%" stop-color="#2D1B02" stop-opacity="0" />', 'default'),
    demoTransformed: createEraSvg('Grand Maharaja', 'Royal Darbar', '<stop offset="0%" stop-color="#581C87" /><stop offset="50%" stop-color="#92400E" /><stop offset="100%" stop-color="#F59E0B" />', '<stop offset="0%" stop-color="#FDE047" stop-opacity="0.95" /><stop offset="100%" stop-color="#92400E" stop-opacity="0" />', 'default')
  },
  {
    id: 'char_living_room_genie',
    name: 'Living Room Genie',
    category: 'character',
    eraLabel: 'Mythical Wish Granter',
    tagline: 'Blue skin, gold jewelry, swirling glowing cloud tail in a modern living room',
    badgeColor: '#0284C7',
    accentColor: '#0369A1',
    borderColor: '#0284C7',
    promptTemplate: `Transform this portrait into a humorous fantasy genie magically appearing in the middle of an ordinary modern living room. Retain the person's facial likeness, distinct smile, and identity, but rendered with vibrant mystical blue skin, pointed ears, a small topknot hairstyle, and dark goatee. Adorn with gleaming gold bangles, thick gold collar necklaces, and an embroidered crimson sash around the waist. Instead of legs, their lower body transitions into a voluminous swirling cloud of magical purple and white smoke illuminated by bright pulsing cyan neon magic lights, floating above the living room carpet. A cozy everyday modern couch, floor lamp, and TV in the background contrast playfully with the mythical glowing genie apparition. Hilarious photo-booth magic effect.`,
    description: 'A magical blue genie with gold jewelry and a glowing cloud tail appearing in a modern living room.',
    samplePlaceholder: createEraSvg('Original Photo', 'Guest Input', '<stop offset="0%" stop-color="#082F49" /><stop offset="100%" stop-color="#02131E" />', '<stop offset="0%" stop-color="#0284C7" stop-opacity="0.8" /><stop offset="100%" stop-color="#082F49" stop-opacity="0" />', 'default'),
    demoTransformed: createEraSvg('Living Room Genie', 'Wish Granter Edition', '<stop offset="0%" stop-color="#0C4A6E" /><stop offset="50%" stop-color="#0284C7" /><stop offset="100%" stop-color="#A855F7" />', '<stop offset="0%" stop-color="#38BDF8" stop-opacity="0.9" /><stop offset="100%" stop-color="#A855F7" stop-opacity="0" />', 'default')
  },
  {
    id: 'char_don_ogre',
    name: 'The Don Ogre',
    category: 'character',
    eraLabel: 'Cinematic Mob Boss',
    tagline: 'Green ogre in tailored gangster suit, dramatic golden chiaroscuro lighting',
    badgeColor: '#15803D',
    accentColor: '#166534',
    borderColor: '#15803D',
    promptTemplate: `Transform this portrait into a humorous, cinematic 3D animated mob boss resembling a large, powerful green ogre. Keep the person's recognizable facial expression, gaze, and features seamlessly integrated into the ogre design with a subtle, confident, intimidating smirk and narrowed eyes. Dress the character in a tailored dark Italian mobster suit with a textured dress shirt underneath. The character is seated at a rustic wooden table in a dimly lit, atmospheric study, leaning forward with arms resting on the tabletop and large hands clasped together like a mafia godfather. Dramatic warm amber and golden directional rim lighting casts deep cinematic shadows across the skin, fabric, and polished wood. Polished 3D animation quality with dramatic crime-drama presence.`,
    description: 'Cinematic 3D green ogre mafia godfather in a tailored dark suit seated at a dimly lit wooden table.',
    samplePlaceholder: createEraSvg('Original Photo', 'Guest Input', '<stop offset="0%" stop-color="#14532D" /><stop offset="100%" stop-color="#052E16" />', '<stop offset="0%" stop-color="#15803D" stop-opacity="0.8" /><stop offset="100%" stop-color="#14532D" stop-opacity="0" />', 'default'),
    demoTransformed: createEraSvg('The Don Ogre', 'Godfather Edition', '<stop offset="0%" stop-color="#14532D" /><stop offset="50%" stop-color="#166534" /><stop offset="100%" stop-color="#D97706" />', '<stop offset="0%" stop-color="#F59E0B" stop-opacity="0.85" /><stop offset="100%" stop-color="#14532D" stop-opacity="0" />', 'default')
  },
  {
    id: 'char_saint_heisenberg',
    name: 'Saint Heisenberg',
    category: 'character',
    eraLabel: 'Vintage Religious Icon',
    tagline: 'Black fedora, sunglasses, golden halo, velvet cloak & blessing gesture',
    badgeColor: '#C2410C',
    accentColor: '#9A3412',
    borderColor: '#C2410C',
    promptTemplate: `Transform this portrait into a humorous vintage religious icon-style portrait titled "SAINT HEISENBERG". Retain the person's exact face and facial features under a serious expression. Dress the subject from the waist up wearing an iconic black fedora hat, dark black sunglasses, a deep blue clerical robe, and a rich crimson-and-gold ceremonial mantle cloak. The subject has one hand raised in a formal traditional apostolic blessing gesture. A large radiant golden holy halo with geometric sun rays shines behind the head. Rendered with the textured craquelure of an antique Renaissance oil painting, with warm ochre, gold leaf, deep royal blue, and crimson tones. Framed by a thick cream-and-gold filigree border, with bold traditional Roman serif lettering across the bottom reading "SAINT HEISENBERG". Serious formal art treatment with humorous modern pop-culture parody.`,
    description: 'Humorous vintage religious oil painting icon featuring black fedora, sunglasses, golden halo and blessing pose.',
    samplePlaceholder: createEraSvg('Original Photo', 'Guest Input', '<stop offset="0%" stop-color="#451A03" /><stop offset="100%" stop-color="#1C1917" />', '<stop offset="0%" stop-color="#C2410C" stop-opacity="0.8" /><stop offset="100%" stop-color="#451A03" stop-opacity="0" />', 'default'),
    demoTransformed: createEraSvg('Saint Heisenberg', 'Holy Icon Edition', '<stop offset="0%" stop-color="#1E3A8A" /><stop offset="50%" stop-color="#991B1B" /><stop offset="100%" stop-color="#D97706" />', '<stop offset="0%" stop-color="#FBBF24" stop-opacity="0.9" /><stop offset="100%" stop-color="#1E3A8A" stop-opacity="0" />', 'default')
  },
  {
    id: 'char_panicked_ceo',
    name: 'Panicked Tech CEO',
    category: 'character',
    eraLabel: 'Silicon Valley Meltdown',
    tagline: 'Black turtleneck, keynote stage, tiny gadget & red crashing error charts',
    badgeColor: '#475569',
    accentColor: '#334155',
    borderColor: '#475569',
    promptTemplate: `Transform this portrait into a humorous, hyper-detailed portrait of an exhausted Silicon Valley tech CEO having a live onstage meltdown. Retain the person's facial structure, hair, and likeness, captured with a comically stressed and wide-eyed panicked expression, with slight sweat glisten on the brow. Dressed in an iconic minimalist black turtleneck sweater, standing center-stage in front of a stadium crowd. The CEO is nervously holding up a tiny glowing prototype gadget between their fingers. Behind them on massive stadium LED screens are chaotic red flashing "FATAL ERROR 404", plummeting red stock market charts, and crash alert dialogs. Dramatic convention center stage lighting, realistic keynote photography.`,
    description: 'Exhausted tech CEO in black turtleneck on keynote stage with red crash errors and tiny glowing gadget.',
    samplePlaceholder: createEraSvg('Original Photo', 'Guest Input', '<stop offset="0%" stop-color="#1E293B" /><stop offset="100%" stop-color="#0F172A" />', '<stop offset="0%" stop-color="#475569" stop-opacity="0.8" /><stop offset="100%" stop-color="#1E293B" stop-opacity="0" />', 'default'),
    demoTransformed: createEraSvg('Panicked Tech CEO', 'Keynote Meltdown', '<stop offset="0%" stop-color="#0F172A" /><stop offset="50%" stop-color="#991B1B" /><stop offset="100%" stop-color="#DC2626" />', '<stop offset="0%" stop-color="#EF4444" stop-opacity="0.9" /><stop offset="100%" stop-color="#0F172A" stop-opacity="0" />', 'default')
  },
  {
    id: 'char_mad_scientist',
    name: 'Eccentric Mad Scientist',
    category: 'character',
    eraLabel: 'Steampunk Laboratory Mayhem',
    tagline: 'Wild static hair, brass steampunk goggles, charred coat & bubbling beaker',
    badgeColor: '#14B8A6',
    accentColor: '#0F766E',
    borderColor: '#14B8A6',
    promptTemplate: `Transform this portrait into an eccentric, genius mad scientist in the middle of a wild laboratory experiment. Retain the person's facial identity and mischievous grin. Give them wild, frizzy static hair standing out in all directions with comical soot smudges on their cheeks and nose. Brass steampunk goggles with glowing green lenses rest perched on their forehead. Dressed in a singed, charred white lab coat over vintage vest. In their hand they hold up an Erlenmeyer glass beaker filled with bubbling, luminous neon-purple liquid emitting colorful sparks and swirling green smoke. The background is a chaotic steampunk laboratory with copper vacuum tubes, Jacob's ladder electric sparks, chalkboard covered in quantum equations, and neon chemical glow. Cinematic comic book lighting.`,
    description: 'Eccentric mad scientist with wild static hair, brass goggles, charred coat and bubbling neon beaker.',
    samplePlaceholder: createEraSvg('Original Photo', 'Guest Input', '<stop offset="0%" stop-color="#134E4A" /><stop offset="100%" stop-color="#042F2E" />', '<stop offset="0%" stop-color="#14B8A6" stop-opacity="0.8" /><stop offset="100%" stop-color="#134E4A" stop-opacity="0" />', 'default'),
    demoTransformed: createEraSvg('Mad Scientist', 'Laboratory Mayhem', '<stop offset="0%" stop-color="#042F2E" /><stop offset="50%" stop-color="#0F766E" /><stop offset="100%" stop-color="#10B981" />', '<stop offset="0%" stop-color="#2DD4BF" stop-opacity="0.9" /><stop offset="100%" stop-color="#042F2E" stop-opacity="0" />', 'default')
  }
];

export const DEFAULT_STYLE_ERAS: StyleEra[] = [
  ...DEFAULT_STYLE_THEMES,
  ...DEFAULT_STYLE_CHARACTERS,
];

export const STYLE_ERAS = DEFAULT_STYLE_ERAS;

const CUSTOM_THEMES_KEY = 'nexora_custom_themes_v1';

// Get all active styles (themes + characters + user added)
export function getAllThemes(): StyleEra[] {
  if (typeof window === 'undefined') return DEFAULT_STYLE_ERAS;
  try {
    const saved = localStorage.getItem(CUSTOM_THEMES_KEY);
    if (saved) {
      const custom: StyleEra[] = JSON.parse(saved);
      return [...DEFAULT_STYLE_ERAS, ...custom];
    }
  } catch (e) {
    console.warn('Failed to load custom styles from localStorage', e);
  }
  return DEFAULT_STYLE_ERAS;
}

// Filtered helpers
export function getAllEraThemes(): StyleEra[] {
  return getAllThemes().filter(s => s.category !== 'character');
}

export function getAllCharacters(): StyleEra[] {
  return getAllThemes().filter(s => s.category === 'character');
}

// Add and save a new theme or character
export function saveCustomTheme(theme: {
  name: string;
  category?: StyleCategory;
  eraLabel?: string;
  tagline?: string;
  promptTemplate: string;
  badgeColor?: string;
}): StyleEra {
  const id = `custom_${theme.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString(36)}`;
  const badgeColor = theme.badgeColor || (theme.category === 'character' ? '#8B5CF6' : '#D96E3D');
  const newEra: StyleEra = {
    id: id,
    name: theme.name.trim(),
    category: theme.category || 'theme',
    eraLabel: theme.eraLabel?.trim() || (theme.category === 'character' ? 'Custom Character' : 'Custom Aesthetic'),
    tagline: theme.tagline?.trim() || 'Custom AI prompt transformation',
    badgeColor: badgeColor,
    accentColor: badgeColor,
    borderColor: badgeColor,
    promptTemplate: theme.promptTemplate.trim(),
    description: theme.tagline?.trim() || 'Custom community style.',
    samplePlaceholder: createEraSvg(theme.name, 'Custom Style', '<stop offset="0%" stop-color="#27272A" /><stop offset="100%" stop-color="#18181B" />', '<stop offset="0%" stop-color="#52525B" stop-opacity="0.8" /><stop offset="100%" stop-color="#18181B" stop-opacity="0" />', 'default'),
    demoTransformed: createEraSvg(theme.name, 'Custom Edition', '<stop offset="0%" stop-color="#18181B" /><stop offset="50%" stop-color="#3F3F46" /><stop offset="100%" stop-color="#D96E3D" />', '<stop offset="0%" stop-color="#D96E3D" stop-opacity="0.8" /><stop offset="100%" stop-color="#18181B" stop-opacity="0" />', 'default')
  };

  if (typeof window !== 'undefined') {
    try {
      const current = localStorage.getItem(CUSTOM_THEMES_KEY);
      const list: StyleEra[] = current ? JSON.parse(current) : [];
      list.push(newEra);
      localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('nexora_themes_updated'));
    } catch (e) {
      console.error('Error saving custom style', e);
    }
  }

  return newEra;
}

// Delete custom theme
export function deleteCustomTheme(id: string) {
  if (typeof window !== 'undefined') {
    try {
      const current = localStorage.getItem(CUSTOM_THEMES_KEY);
      if (current) {
        const list: StyleEra[] = JSON.parse(current);
        const filtered = list.filter(t => t.id !== id);
        localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(filtered));
        window.dispatchEvent(new CustomEvent('nexora_themes_updated'));
      }
    } catch (e) {
      console.error('Error deleting custom style', e);
    }
  }
}

export function getStyleById(id: string): StyleEra {
  const all = getAllThemes();
  return all.find(s => s.id === id) || all[0];
}
