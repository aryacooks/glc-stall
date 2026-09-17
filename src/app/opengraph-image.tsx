import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'NEXORA — Same You. Different Era. GLC Stall Experience';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FAF8F4',
          border: '14px solid #1E1E1E',
          padding: 40,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#D96E3D',
            color: '#FFFFFF',
            padding: '10px 24px',
            borderRadius: 999,
            fontSize: 22,
            fontWeight: 800,
            marginBottom: 20,
            border: '3px solid #1E1E1E',
          }}
        >
          GLC STALL · TIME MACHINE BOOTH
        </div>
        <div
          style={{
            fontSize: 76,
            fontWeight: 900,
            color: '#1E1E1E',
            letterSpacing: -2,
            textAlign: 'center',
            lineHeight: 1.1,
          }}
        >
          NEXORA
        </div>
        <div
          style={{
            fontSize: 36,
            fontWeight: 700,
            color: '#D96E3D',
            marginTop: 10,
            textAlign: 'center',
          }}
        >
          Same You. Way Cooler Era.
        </div>
        <div
          style={{
            fontSize: 22,
            color: '#6B6862',
            marginTop: 20,
            textAlign: 'center',
            maxWidth: 850,
            lineHeight: 1.4,
          }}
        >
          Upload your face, pick an era, and let unhinged AI + caffeinated volunteers blast you into the 1920s, 80s, or 2077. Delorean not included.
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
