import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Decidere — Decide Where to Live'
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default async function Image() {
  const countryCount = 27

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#030712', // slate-950
          backgroundImage: 'radial-gradient(circle at 50% 50%, #1e1b4b 0%, #030712 100%)', // indigo-950 to slate-950
          fontFamily: 'sans-serif',
        }}
      >
        {/* Abstract Logo Shape */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '120px',
            height: '120px',
            borderRadius: '30px',
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            marginBottom: '40px',
            boxShadow: '0 20px 50px rgba(99, 102, 241, 0.3)',
          }}
        >
          <div
            style={{
              fontSize: '72px',
              fontWeight: 'bold',
              color: 'white',
            }}
          >
            D
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '80px',
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '10px',
              letterSpacing: '-0.02em',
            }}
          >
            Decidere
          </div>
          <div
            style={{
              fontSize: '36px',
              color: '#94a3b8', // slate-400
              marginBottom: '40px',
              fontWeight: '500',
            }}
          >
            Decide Where to Live
          </div>
        </div>

        {/* Info Cards */}
        <div
          style={{
            display: 'flex',
            gap: '20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              padding: '20px 40px',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              alignItems: 'center',
            }}
          >
            <div style={{ color: '#818cf8', fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>{countryCount}+</div>
            <div style={{ color: 'white', fontSize: '18px' }}>Countries</div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              padding: '20px 40px',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              alignItems: 'center',
            }}
          >
            <div style={{ color: '#818cf8', fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>Free</div>
            <div style={{ color: 'white', fontSize: '18px' }}>Open Source</div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              padding: '20px 40px',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              alignItems: 'center',
            }}
          >
            <div style={{ color: '#818cf8', fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>Tax</div>
            <div style={{ color: 'white', fontSize: '18px' }}>Accuracy</div>
          </div>
        </div>

        {/* Footer URL */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            color: '#475569', // slate-600
            fontSize: '24px',
            fontWeight: '600',
          }}
        >
          decidere.app
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
