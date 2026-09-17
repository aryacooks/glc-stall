import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NEXORA — Same You. Different Era. | GLC Stall Experience',
  description: 'Turn Moments Into New Worlds. Interactive AI photo transformation for the GLC Stall.',
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
