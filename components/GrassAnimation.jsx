'use client';

import { useEffect, useRef, useState } from 'react';

const AUDIO_SRC = '/lotv.mp3';
const WORDS = ['Lily', 'of', 'the', 'Valley'];
const WORD_DELAYS_MS = [200, 1000, 3400, 4600];

const CATEGORIES = [
  { id: 'lyrics',    href: '/lyrics',    order: 1,
    desktop: { left: 63, top: 47, width: 30 }, mobile: { left: 53, top: 5,  width: 43 } },
  { id: 'socials',   href: '/socials',   order: 2,
    desktop: { left: 5,  top: 3,  width: 26 }, mobile: { left: 4,  top: 5,  width: 43 } },
  { id: 'concerts',  href: '/concerts',  order: 3,
    desktop: { left: 4,  top: 60, width: 38 }, mobile: { left: 4,  top: 63, width: 52 } },
  { id: 'merch',     href: '/merch',     order: 4,
    desktop: { left: 53, top: 7,  width: 40 }, mobile: { left: 53, top: 34, width: 43 } },
  { id: 'streaming', href: '/streaming', order: 5,
    desktop: { left: 16, top: 26, width: 32 }, mobile: { left: 4,  top: 34, width: 43 } },
];

export default function GrassAnimation() {
  const stageRef          = useRef(null);
  const canvasRef         = useRef(null);
  const animRef           = useRef(null);
  const phaseRef          = useRef('idle');
  const startTsRef        = useRef(null);
  const bladesRef         = useRef([]);
  const audioRef          = useRef(null);
  const wordTimers        = useRef([]);
  const windTimers        = useRef([]);
  const hintTimer         = useRef(null);
  const audioStarted      = useRef(false);
  const startAnimationRef = useRef(null);
  const bgVideoRef        = useRef(null);

  const [isStarted,    setIsStarted]    = useState(false);
  const [startFading,  setStartFading]  = useState(false);
  const [visibleWords, setVisibleWords] = useState([false, false, false, false]);
  const [hintVisible,  setHintVisible]  = useState(true);
  const [skyMode,      setSkyMode]      = useState(false);
  const [windCards,    setWindCards]    = useState(new Set());
  const [isMobile,     setIsMobile]     = useState(false);
  const [windOffsets,  setWindOffsets]  = useState(
    () => CATEGORIES.map(() => ({ dx: 0, dy: 0 }))
  );

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    setWindOffsets(CATEGORIES.map(() => ({
      dx: (Math.random() - 0.5) * 6,
      dy: (Math.random() - 0.5) * 5,
    })));
  }, []);

  // ── Audio ──────────────────────────────────────────────────────────────────
  function startAudio() {
    if (audioStarted.current) return;
    audioStarted.current = true;
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio(AUDIO_SRC);
        audioRef.current.loop   = true;
        audioRef.current.volume = 0;
      }
      const p = audioRef.current.play();
      if (p !== undefined) p.catch(() => { audioStarted.current = false; });
      const t = setInterval(() => {
        if (!audioRef.current) { clearInterval(t); return; }
        if (audioRef.current.volume < 0.9) audioRef.current.volume += 0.01;
        else { audioRef.current.volume = 1; clearInterval(t); }
      }, 10);
    } catch (_) {}
  }

  // ── Show video + cards (called on grass-done and skip) ────────────────────
  function showWindScene(cardDelay) {
    windTimers.current.forEach(clearTimeout);
    windTimers.current = [];

    const bgVid = bgVideoRef.current;
    if (bgVid) {
      bgVid.style.transition = 'opacity 1.8s cubic-bezier(0.4, 0, 0.2, 1)';
      bgVid.style.opacity    = '1';
    }

    // Fade out "Lily of the Valley" text as video comes in
    setTimeout(() => setVisibleWords([false, false, false, false]), 400);

    const sorted = [...CATEGORIES].sort((a, b) => a.order - b.order);
    sorted.forEach((cat, i) => {
      windTimers.current.push(
        setTimeout(() => {
          setWindCards(prev => new Set([...prev, cat.id]));
        }, cardDelay + i * 500)
      );
    });
  }

  // ── Skip ───────────────────────────────────────────────────────────────────
  function skipToEnd() {
    wordTimers.current.forEach(clearTimeout);
    windTimers.current.forEach(clearTimeout);
    clearTimeout(hintTimer.current);
    cancelAnimationFrame(animRef.current);
    phaseRef.current = 'done';
    setHintVisible(false);
    showWindScene(800);
  }

  // ── Begin ──────────────────────────────────────────────────────────────────
  function handleBegin() {
    if (isStarted || startFading) return;
    startAudio();
    setStartFading(true);
    setTimeout(() => setIsStarted(true), 900);
    requestAnimationFrame(() => { startAnimationRef.current?.(); });
  }

  function handleSkip() {
    if (phaseRef.current === 'growing' || phaseRef.current === 'transitioning') skipToEnd();
  }

  // ── Canvas animation ───────────────────────────────────────────────────────
  useEffect(() => {
    const stage  = stageRef.current;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    let W, H;
    const isMob = window.innerWidth < 768;

    function resize() {
      const r   = stage.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width  = r.width  * dpr;
      canvas.height = r.height * dpr;
      canvas.style.width  = r.width  + 'px';
      canvas.style.height = r.height + 'px';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      W = r.width; H = r.height;
    }
    resize();
    window.addEventListener('resize', resize);

    function makeBlade(depthT) {
      const x       = (Math.random() * 1.3 - 0.15) * W;
      const rootY   = H * (0.55 + depthT * 0.45);
      const diag    = Math.sqrt(W * W + H * H);
      const ms      = isMob ? 1.35 : 1;
      const targetH = diag * (0.38 + depthT * 0.3 + Math.random() * 0.25) * ms;
      const width   = (diag / 200 + depthT * diag / 100) + Math.random() * (diag / 180);
      const lean    = Math.random() - 0.5;
      const curveX  = lean * W * (0.45 + Math.random() * 0.45);
      const curveY  = -(targetH * (0.18 + Math.random() * 0.28));
      const hue       = 100 + Math.random() * 36;
      const lightness = 14 + depthT * 14 + Math.random() * 10;
      const delay     = Math.max(0, depthT * 2200 + (Math.random() - 0.5) * 400);
      const speed     = 0.003 + Math.random() * 0.0025;
      return { x, rootY, targetH, curveX, curveY, width, hue, lightness, delay, speed, progress: 0, born: false };
    }

    function initBlades() {
      const blades = [];
      for (let i = 0; i < 650; i++) blades.push(makeBlade(Math.pow(Math.random(), 0.7)));
      blades.sort((a, b) => a.rootY - b.rootY);
      bladesRef.current = blades;
    }

    function easeOut5(t) { return 1 - Math.pow(1 - t, 5); }

    function drawBlade(b) {
      if (!b.born) return;
      const ease = easeOut5(Math.min(b.progress, 1));
      const sx = b.x, sy = b.rootY;
      const tx = b.x + b.curveX * ease;
      const ty = b.rootY - b.targetH * ease;
      const cpx = b.x + b.curveX * 0.42;
      const cpy = b.rootY + b.curveY * ease;
      const steps = window.innerWidth < 768 ? 12 : 28;
      for (let i = 0; i < steps - 1; i++) {
        const ta = i / steps, tb = (i + 1) / steps;
        const ax = (1-ta)**2*sx + 2*(1-ta)*ta*cpx + ta**2*tx;
        const ay = (1-ta)**2*sy + 2*(1-ta)*ta*cpy + ta**2*ty;
        const bx = (1-tb)**2*sx + 2*(1-tb)*tb*cpx + tb**2*tx;
        const by = (1-tb)**2*sy + 2*(1-tb)*tb*cpy + tb**2*ty;
        const frac = i / steps;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.strokeStyle = `hsl(${b.hue}, 58%, ${b.lightness + frac * 12}%)`;
        ctx.lineWidth   = b.width * Math.pow(1 - frac, 0.55);
        ctx.lineCap     = 'round';
        ctx.stroke();
      }
    }

    function doFadeToVideo() {
      cancelAnimationFrame(animRef.current);
      showWindScene(2200);
      setTimeout(() => { phaseRef.current = 'done'; }, 2000);
    }

    function animate(ts) {
      if (!startTsRef.current) startTsRef.current = ts;
      const elapsed = ts - startTsRef.current;
      ctx.clearRect(0, 0, W, H);
      let allGrown = true;
      for (const b of bladesRef.current) {
        if (elapsed > b.delay) {
          b.born = true;
          b.progress += b.speed;
          if (b.progress < 1) allGrown = false;
        } else { allGrown = false; }
        drawBlade(b);
      }
      if (allGrown && phaseRef.current === 'growing') {
        phaseRef.current = 'transitioning';
        setTimeout(doFadeToVideo, 150);
      }
      if (phaseRef.current === 'growing' || phaseRef.current === 'transitioning') {
        animRef.current = requestAnimationFrame(animate);
      }
    }

    function startAnimation() {
      cancelAnimationFrame(animRef.current);
      wordTimers.current.forEach(clearTimeout);
      windTimers.current.forEach(clearTimeout);
      clearTimeout(hintTimer.current);

      phaseRef.current   = 'growing';
      startTsRef.current = null;
      const bgVid = bgVideoRef.current;
      if (bgVid) { bgVid.style.transition = 'none'; bgVid.style.opacity = '0'; }
      ctx.clearRect(0, 0, W, H);
      setVisibleWords([false, false, false, false]);
      setWindCards(new Set());
      setHintVisible(true);
      initBlades();
      animRef.current = requestAnimationFrame(animate);

      wordTimers.current = WORD_DELAYS_MS.map((delay, i) =>
        setTimeout(() => {
          setVisibleWords(prev => { const next = [...prev]; next[i] = true; return next; });
        }, delay)
      );
      setSkyMode(false);
      setTimeout(() => { setSkyMode(true); }, 4600);
      hintTimer.current = setTimeout(() => setHintVisible(false), 500);
    }

    startAnimationRef.current = startAnimation;

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      wordTimers.current.forEach(clearTimeout);
      windTimers.current.forEach(clearTimeout);
      clearTimeout(hintTimer.current);
      audioRef.current?.pause();
    };
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&display=swap');
        .lily-words-row { display: flex; flex-direction: row; align-items: baseline; gap: 0.55em; }
        @media (max-width: 560px) {
          .lily-words-row { flex-direction: column; align-items: center; gap: 0.15em; }
        }
        .wind-card { display: block; cursor: pointer; }
        .wind-card:hover video { opacity: 0.8; }
      `}</style>

      {/* Start screen */}
      {!isStarted && (
        <div
          onPointerDown={handleBegin}
          style={{
            position: 'fixed', inset: 0, background: '#473E1E', zIndex: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', userSelect: 'none',
            transition: 'opacity 0.9s ease', opacity: startFading ? 0 : 1,
          }}
        >
          <span style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontStyle: 'italic', fontWeight: 300,
            fontSize: 'clamp(0.8rem, 2vw, 1rem)',
            color: 'rgba(255,255,255,0.5)', letterSpacing: '0.25em',
          }}>tap to begin</span>
        </div>
      )}

      <div
        ref={stageRef}
        onClick={handleSkip}
        style={{
          width: '100%',
          height: '100vh',
          background: '#473E1E',
          position: 'relative',
          overflow: 'hidden',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        {/* Sky gradient (briefly visible during grass grow) */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          opacity: skyMode ? 1 : 0, transition: 'opacity 1.5s ease',
          background: 'linear-gradient(to bottom, #87c8ff 0%, #87c8ff 55%, transparent 55%)',
          zIndex: 0,
        }} />

        {/* Intro grass canvas */}
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1 }} />

        {/* Background grass-wind video — fades in when grass animation completes */}
        <video
          ref={bgVideoRef}
          autoPlay muted loop playsInline
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            opacity: 0, transition: 'none',
            zIndex: 2,
          }}
        >
          <source src="/grass-wind.webm" type="video/webm" />
          <source src="/grass-wind.mp4"  type="video/mp4"  />
        </video>

        {/* "Lily of the Valley" title */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none', gap: '2.5rem', zIndex: 3,
        }}>
          <div className="lily-words-row">
            {WORDS.map((word, i) => (
              <span key={word} style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontWeight: 300,
                fontSize: 'clamp(2.8rem, 20vw, 10.8rem)',
                color: 'rgba(255, 255, 255, 0.96)',
                letterSpacing: '0.17em', whiteSpace: 'nowrap',
                textShadow: '0 1px 24px rgba(0,0,0,0.25)',
                transition: 'opacity 1.4s cubic-bezier(0.25,0.46,0.45,0.94), transform 1.4s cubic-bezier(0.25,0.46,0.45,0.94)',
                opacity: visibleWords[i] ? 1 : 0,
                transform: visibleWords[i] ? 'translateY(0)' : 'translateY(10px)',
              }}>{word}</span>
            ))}
          </div>
          <span style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontStyle: 'italic', fontWeight: 300,
            fontSize: 'clamp(0.75rem, 1.8vw, 5.5rem)',
            color: 'rgba(255, 255, 255, 0.55)', letterSpacing: '0.22em',
            transition: 'opacity 1.8s ease', opacity: hintVisible ? 1 : 0,
          }}>volume up</span>
        </div>

        {/* Scattered category video cards */}
        {CATEGORIES.map((cat) => {
          const offset    = windOffsets[CATEGORIES.indexOf(cat)];
          const isVisible = windCards.has(cat.id);

          const posStyle = isMobile
            ? { left: `${cat.mobile.left}vw`, top: `${cat.mobile.top}vh`, width: `${cat.mobile.width}vw` }
            : { left: `${cat.desktop.left + offset.dx}vw`, top: `${cat.desktop.top + offset.dy}vh`, width: `${cat.desktop.width}vw` };

          return (
            <a
              key={cat.id}
              href={cat.href}
              className="wind-card"
              style={{
                position: 'absolute', ...posStyle,
                opacity: isVisible ? 1 : 0,
                transition: 'opacity 0.6s ease',
                zIndex: 4 + cat.order,
                textDecoration: 'none',
              }}
            >
              <video
                autoPlay muted loop playsInline
                style={{ width: '100%', aspectRatio: '16/9', display: 'block', objectFit: 'cover', transition: 'opacity 0.2s ease', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}
              >
                <source src={`/${cat.id}.mp4`} type="video/mp4" />
              </video>
            </a>
          );
        })}
      </div>
    </>
  );
}
