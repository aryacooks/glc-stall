import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: 'NEXORA 🪄 Same You. Way Cooler Era. | GLC Stall Experience',
    template: '%s · NEXORA Time Machine',
  },
  description:
    'Upload your face, pick an era, and let unhinged AI + caffeinated volunteers blast you into the 1920s, 80s, or 2077. Delorean not included.',
  applicationName: 'NEXORA Photo Booth',
  authors: [{ name: 'GLC Stall Crew & Overworked AI' }],
  generator: 'Next.js, Supabase & Caffeine',
  keywords: [
    'GLC Stall',
    'NEXORA',
    'AI Photo Booth',
    'Time Travel On A Budget',
    'Historical Glow-Up Generator',
    '1980s Retro Disco Legend',
    '1920s Noir Detective',
    'Cyberpunk 2077 Hacker',
    'Volunteers Fuelled By Red Bull',
    'Accidental Royalty',
    'Delorean Not Included',
    'Existential Dread But Make It Aesthetic',
  ],
  creator: 'GLC Stall Team',
  publisher: 'NEXORA Interactive',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' },
    ],
    apple: [{ url: '/icon.svg' }],
  },
  openGraph: {
    title: 'NEXORA 🪄 Same You. Way Cooler Era.',
    description:
      'What if you were born in 1920? Or 1984? Step up to the GLC stall, scan the QR, and prepare to question your current fashion choices.',
    siteName: 'NEXORA Photo Booth',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NEXORA 🚀 Stop Being In 2026 For 5 Minutes',
    description:
      'Interactive AI portrait time machine live at the GLC Stall. Warning: High risk of becoming historically hot.',
    creator: '@GLCStall',
  },
  other: {
    'stall-vibe': 'Chaotic good, heavily caffeinated, 100% artisanal pixel transitions.',
    'safety-warning': 'Looking too dashing in 1920s attire may cause a sudden urge to solve vintage murder mysteries.',
    'fun-fact': 'No flux capacitors were harmed in the making of this booth.',
    'volunteers-on-duty': 'Operating on 3 hours of sleep and pure enthusiasm.',
    'refund-policy': 'If the AI makes you look like a Victorian ghost, that is strictly between you and your ancestors.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-canvas text-ink-900 selection:bg-terracotta selection:text-white">
        {children}
      </body>
    </html>
  );
}
