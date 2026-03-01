import { useEffect, useState } from 'react';

interface Props {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: Props) {
  const [phase, setPhase] = useState<'intro' | 'visible' | 'fade'>('intro');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('visible'), 400);
    const t2 = setTimeout(() => setPhase('fade'), 2200);
    const t3 = setTimeout(() => onFinish(), 2600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(135deg, #FF3347 0%, #FF5C6C 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'opacity 0.6s ease',
        opacity: phase === 'fade' ? 0 : 1,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transform: phase === 'intro' ? 'scale(0.8)' : 'scale(1)',
          opacity: phase === 'intro' ? 0 : 1,
          transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Logo Container */}
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: 24,
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
            marginBottom: 28,
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width="44"
            height="44"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"
              stroke="#FF3347"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line
              x1="3"
              y1="6"
              x2="21"
              y2="6"
              stroke="#FF3347"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M16 10a4 4 0 01-8 0"
              stroke="#FF3347"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* App Name */}
        <h1
          style={{
            color: 'white',
            fontSize: 36,
            fontWeight: 700,
            margin: 0,
            letterSpacing: 1,
          }}
        >
          Cartify
        </h1>

        {/* Tagline */}
        <p
          style={{
            marginTop: 10,
            color: 'rgba(255,255,255,0.85)',
            fontSize: 14,
            letterSpacing: 0.5,
            opacity: phase === 'visible' || phase === 'fade' ? 1 : 0,
            transition: 'opacity 0.5s ease 0.2s',
          }}
        >
          Grab N Go · Smart Shopping
        </p>

        {/* Subtle Loader */}
        <div
          style={{
            marginTop: 40,
            width: 28,
            height: 28,
            border: '3px solid rgba(255,255,255,0.3)',
            borderTop: '3px solid white',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            opacity: phase === 'visible' || phase === 'fade' ? 1 : 0,
            transition: 'opacity 0.4s ease',
          }}
        />
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}