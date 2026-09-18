export interface AIModelTier {
  level: number;
  id: string;
  name: string;
  shortName: string;
  tierLabel: string;
  costPerImage: number; // in USD
  costDisplay: string;
  accuracyRating: string;
  accuracyScore: number; // percentage (0-100)
  speedDisplay: string;
  latencySeconds: string;
  recommendedBadge?: string;
  description: string;
  bestFor: string;
  accentColor: string;
}

export const OPENROUTER_MODEL_TIERS: AIModelTier[] = [
  {
    level: 1,
    id: 'openai/gpt-5-image-mini',
    name: 'OpenAI GPT-5 Image Mini',
    shortName: 'gpt-5-image-mini',
    tierLabel: 'Level 1: Ultra Budget (Lowest Cost)',
    costPerImage: 0.008,
    costDisplay: '$0.008 / img',
    accuracyRating: '⭐⭐⭐ Good Likeness',
    accuracyScore: 82,
    speedDisplay: '⚡ Ultra Fast',
    latencySeconds: '~2 - 4 sec',
    description: 'The cheapest AI image model on OpenRouter (~0.8 cents per generation). Extremely fast synthesis time with minimal latency.',
    bestFor: 'High-volume stall rushes, pop-culture/cartoon characters, and maximum economy. 100 guest photos cost only $0.80!',
    accentColor: '#10B981', // Emerald
  },
  {
    level: 2,
    id: 'openai/gpt-image-2.5-flare',
    name: 'OpenAI GPT-Image-2.5 Flare',
    shortName: 'gpt-image-2.5-flare',
    tierLabel: 'Level 2: Balanced (Recommended)',
    costPerImage: 0.015,
    costDisplay: '$0.015 / img',
    accuracyRating: '⭐⭐⭐⭐ High Fidelity',
    accuracyScore: 92,
    speedDisplay: '⚡ Fast & Crisp',
    latencySeconds: '~4 - 6 sec',
    recommendedBadge: 'RECOMMENDED STALL SWEET SPOT',
    description: 'Engineered specifically for image-to-image styling and face identity preservation. Exceptional balance of realism and cost.',
    bestFor: 'The festival kiosk sweet spot! Preserves guest facial identity and likeness while heavily transforming background and attire.',
    accentColor: '#8B5CF6', // Purple
  },
  {
    level: 3,
    id: 'meta/muse-image',
    name: 'Meta Muse Image',
    shortName: 'muse-image',
    tierLabel: 'Level 3: Meta Muse (Agentic Reasoning)',
    costPerImage: 0.010,
    costDisplay: '$0.010 / img',
    accuracyRating: '⭐⭐⭐⭐ Smart Composition',
    accuracyScore: 94,
    speedDisplay: '⚡ Agentic Refinement',
    latencySeconds: '~3 - 5 sec',
    description: 'Meta Superintelligence Labs agentic image model. Reasons before rendering with multi-step chain-of-thought and intelligent reference styling.',
    bestFor: 'Creative guest transformations, intelligent prompt comprehension, and multi-element scene adaptation (~1.0 cent per photo).',
    accentColor: '#EC4899', // Pink / Magenta
  },
];

export function getModelTierByLevel(level: number): AIModelTier {
  return OPENROUTER_MODEL_TIERS.find(t => t.level === level) || OPENROUTER_MODEL_TIERS[0];
}

export function getModelTierById(id: string): AIModelTier | undefined {
  return OPENROUTER_MODEL_TIERS.find(t => t.id === id);
}

export function estimateCostForModel(modelId: string): number {
  const tier = getModelTierById(modelId);
  if (tier) return tier.costPerImage;
  if (modelId.includes('mini') || modelId.includes('lite')) return 0.008;
  if (modelId.includes('muse')) return 0.010;
  if (modelId.includes('pro') || modelId.includes('plus')) return 0.040;
  return 0.015;
}

export interface GenerationUsageRecord {
  id: string;
  photoId: string;
  ticketNumber: string;
  guestName: string;
  styleName: string;
  model: string;
  cost: number;
  timestamp: number;
  method?: string;
}
