'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// Desktop positions match your sketch (% of viewport).
// order = sequence in which the card fades in (0.5s apart).
const CATEGORIES = [
  {
    id: 'lyrics',
    label: 'Lyrics',
    href: '/lyrics',
    order: 1,
    desktop: { left: 63, top: 47, width: 30 },
    rotation: 3,
  },
  {
    id: 'socials',
    label: 'Socials',
    href: '/socials',
    order: 2,
    desktop: { left: 5, top: 3, width: 26 },
    rotation: -4,
  },
  {
    id: 'streaming',
    label: 'Streaming',
    href: '/streaming',
    order: 3,
    desktop: { left: 16, top: 26, width: 32 },
    rotation: -2,
  },
  {
    id: 'merch',
    label: 'Merch',
    href: '/merch',
    order: 4,
    desktop: { left: 53, top: 7, width: 40 },
    rotation: 2,
  },
  {
    id: 'concerts',
    label: 'Concerts',
    href: '/concerts',
    order: 5,
    desktop: { left: 37, top: 55, width: 22 },
    rotation: -1,
  },
];

// Mobile: cards stack vertically across 220vh so the user can scroll through them.
// Each entry corresponds to CATEGORIES in order (lyrics, socials, streaming, merch, concerts).
const MOBILE_TOPS_VH = [4, 48, 92, 136, 180];

export default function WindScene() {
  const [visible,  setVisible]  = useState(new Set());
  const [isMobile, setIsMobile] = useState(false);
  // Offsets are 0 on first render (SSR-safe), randomised on mount before cards appear.
  const [offsets, setOffsets] = useState(
    () => CATEGORIES.map(() => ({ dx: 0, dy: 0, dr: 0 }))
  );

  // Detect mobile (client only)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Randomise positions/rotations (client only — avoids SSR mismatch)
  useEffect(() => {
    setOffsets(CATEGORIES.map(() => ({
      dx: (Math.random() - 0.5) * 6,  // ±3 vw
      dy: (Math.random() - 0.5) * 5,  // ±2.5 vh
      dr: (Math.random() - 0.5) * 4,  // ±2 deg
    })));
  }, []);

  // Staggered appearance: 500 ms per card
  useEffect(() => {
    const sorted = [...CATEGORIES].sort((a, b) => a.order - b.order);
    const timers = sorted.map((cat, i) =>
      setTimeout(
        () => setVisible(prev => new Set([...prev, cat.id])),
        i * 500,
      )
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&display=swap');
        .wind-scene          { height: 100vh; }
        .cat-card            { display: block; text-decoration: none; cursor: pointer; }
        .cat-card:hover .cat-frame { filter: brightness(1.12); box-shadow: 0 8px 40px rgba(0,0,0,0.6); }
        @media (max-width: 767px) { .wind-scene { height: 220vh; } }
      `}</style>

      <section
        className="wind-scene"
        style={{ position: 'relative', width: '100%', overflow: 'hidden' }}
      >
        {/* Background grass video — drop grass-wind.mp4/webm into public/ */}
        <video
          autoPlay
          muted
          loop
          playsInline
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
          }}
        >
          <source src="/grass-wind.webm" type="video/webm" />
          <source src="/grass-wind.mp4"  type="video/mp4"  />
        </video>

        {/* Category cards */}
        {CATEGORIES.map((cat, i) => {
          const { dx, dy, dr } = offsets[i];
          const isVisible = visible.has(cat.id);
          const rotation  = cat.rotation + dr;

          const posStyle = isMobile
            ? {
                left:  `${4 + dx}vw`,
                top:   `${MOBILE_TOPS_VH[i]}vh`,
                width: '88vw',
              }
            : {
                left:  `${cat.desktop.left + dx}vw`,
                top:   `${cat.desktop.top  + dy}vh`,
                width: `${cat.desktop.width}vw`,
              };

          return (
            <Link
              key={cat.id}
              href={cat.href}
              className="cat-card"
              style={{
                position:   'absolute',
                ...posStyle,
                transform:  `rotate(${rotation}deg)`,
                opacity:    isVisible ? 1 : 0,
                transition: 'opacity 0.6s ease',
                zIndex:     1 + cat.order,
              }}
            >
              <div
                className="cat-frame"
                style={{
                  width:      '100%',
                  aspectRatio: '16/9',
                  border:     '2px solid rgba(255,255,255,0.22)',
                  boxShadow:  '0 4px 28px rgba(0,0,0,0.45)',
                  overflow:   'hidden',
                  transition: 'filter 0.2s ease, box-shadow 0.2s ease',
                  background: '#1a2a0e',
                }}
              >
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                >
                  <source src={`/videos/${cat.id}.mp4`} type="video/mp4" />
                </video>
              </div>

              {/* Card label below frame */}
              <p style={{
                margin:        '0.4em 0 0',
                fontFamily:    "'Cormorant Garamond', Georgia, serif",
                fontStyle:     'italic',
                fontWeight:    300,
                fontSize:      'clamp(0.75rem, 1.5vw, 1.05rem)',
                letterSpacing: '0.22em',
                color:         'rgba(255,255,255,0.88)',
                textAlign:     'center',
                textShadow:    '0 1px 10px rgba(0,0,0,0.65)',
              }}>
                {cat.label}
              </p>
            </Link>
          );
        })}
      </section>
    </>
  );
}
