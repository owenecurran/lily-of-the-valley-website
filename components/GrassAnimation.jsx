'use client';

import { useEffect, useRef, useState } from 'react';

// ─── AUDIO ───────────────────────────────────────────────────────────────────

const AUDIO_SRC = '/lotv.mp3';
// ─────────────────────────────────────────────────────────────────────────────

const WORDS = ['Lily', 'of', 'the', 'Valley'];
const WORD_DELAYS_MS = [200, 1000, 3400, 4600];

export default function GrassAnimation() {
  const stageRef   = useRef(null);
  const canvasRef  = useRef(null);
  const overlayRef = useRef(null);
  const animRef    = useRef(null);
  const phaseRef   = useRef('idle');
  const startTsRef = useRef(null);
  const bladesRef  = useRef([]);
  const audioRef   = useRef(null);
  const wordTimers = useRef([]);
  const hintTimer  = useRef(null);
  const audioStarted = useRef(false);
  const startAnimationRef = useRef(null);

  const [isStarted,   setIsStarted]   = useState(false);
  const [startFading, setStartFading] = useState(false);
  const [visibleWords, setVisibleWords] = useState([false, false, false, false]);
  const [hintVisible,  setHintVisible]  = useState(true);

  // ── Audio ──────────────────────────────────────────────────────────────────
  function startAudio() {
    if (audioStarted.current) return;
    audioStarted.current = true;
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio(AUDIO_SRC);
        audioRef.current.loop = true;
        audioRef.current.volume = 0;
      }
      audioRef.current.play().catch(() => {});
      const fadeInInterval = setInterval(() => {
        if (audioRef.current) {
          if (audioRef.current.volume < 0.9) {
            audioRef.current.volume += 0.01;
          } else {
            audioRef.current.volume = 1;
            clearInterval(fadeInInterval);
          }
        } else {
          clearInterval(fadeInInterval);
        }
      }, 10);
    } catch (_) {}
  }

  // ── Skip ───────────────────────────────────────────────────────────────────
  function skipToEnd() {
    wordTimers.current.forEach(clearTimeout);
    clearTimeout(hintTimer.current);
    cancelAnimationFrame(animRef.current);
    phaseRef.current = 'done';

    const overlay = overlayRef.current;
    if (overlay) {
      overlay.style.transition = 'opacity 0.7s ease';
      overlay.style.opacity = '1';
    }
    setVisibleWords([true, true, true, true]);
    setHintVisible(false);
  }

  // ── Begin (start screen tap) ───────────────────────────────────────────────
  function handleBegin() {
    if (isStarted || startFading) return;
    startAudio();
    setStartFading(true);
    setTimeout(() => setIsStarted(true), 900);
    startAnimationRef.current?.();
  }

  // ── Skip (click during animation) ─────────────────────────────────────────
  function handleSkip() {
    if (phaseRef.current === 'growing' || phaseRef.current === 'transitioning') {
      skipToEnd();
    }
  }

  // ── Canvas animation ───────────────────────────────────────────────────────
  useEffect(() => {
    const stage   = stageRef.current;
    const canvas  = canvasRef.current;
    const overlay = overlayRef.current;
    const ctx     = canvas.getContext('2d');
    let W, H;

    function resize() {
      const r = stage.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = r.width * dpr;
      canvas.height = r.height * dpr;

      canvas.style.width = r.width + 'px';
      canvas.style.height = r.height + 'px';

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      W = r.width;
      H = r.height;
    }
    resize();
    window.addEventListener('resize', resize);

    function makeBlade(depthT) {
      const x       = (Math.random() * 1.3 - 0.15) * W;
      const rootY   = H * (0.55 + depthT * 0.45);
      const diag    = Math.sqrt(W * W + H * H);
      const targetH = diag * (0.38 + depthT * 0.3 + Math.random() * 0.25);
      const width   = (diag / 200 + depthT * diag / 100) + Math.random() * (diag / 180);
      const lean    = Math.random() - 0.5;
      const curveX  = lean * W * (0.45 + Math.random() * 0.45);
      const curveY  = -(targetH * (0.18 + Math.random() * 0.28));
      const hue       = 100 + Math.random() * 36;
      const lightness = 14 + depthT * 14 + Math.random() * 10;
      const delay = Math.max(0, depthT * 2200 + (Math.random() - 0.5) * 400);
      const speed = 0.003 + Math.random() * 0.0025;
      return { x, rootY, targetH, curveX, curveY, width, hue, lightness, delay, speed, progress: 0, born: false };
    }

    function initBlades() {
      const blades = [];
      const isMobile = window.innerWidth < 768;
      const bladeCount = isMobile ? 220 : 600;

      for (let i = 0; i < bladeCount; i++) {
        blades.push(makeBlade(Math.pow(Math.random(), 0.7)));
      }
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

    function doFadeToGreen() {
      cancelAnimationFrame(animRef.current);
      overlay.style.transition = 'opacity 1.8s cubic-bezier(0.4, 0, 0.2, 1)';
      overlay.style.opacity    = '1';
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
        setTimeout(doFadeToGreen, 150);
      }
      if (phaseRef.current === 'growing' || phaseRef.current === 'transitioning') {
        animRef.current = requestAnimationFrame(animate);
      }
    }

    function startAnimation() {
      cancelAnimationFrame(animRef.current);
      wordTimers.current.forEach(clearTimeout);
      clearTimeout(hintTimer.current);

      phaseRef.current  = 'growing';
      startTsRef.current = null;
      overlay.style.transition = 'none';
      overlay.style.opacity    = '0';
      ctx.clearRect(0, 0, W, H);
      setVisibleWords([false, false, false, false]);
      setHintVisible(true);
      initBlades();
      animRef.current = requestAnimationFrame(animate);

      // Staggered word reveals
      wordTimers.current = WORD_DELAYS_MS.map((delay, i) =>
        setTimeout(() => {
          setVisibleWords(prev => {
            const next = [...prev];
            next[i] = true;
            return next;
          });
        }, delay)
      );

      // Fade out the hint after 500 ms
      hintTimer.current = setTimeout(() => setHintVisible(false), 500);
    }

    startAnimationRef.current = startAnimation;
    // animation begins only when the user taps the start screen

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      wordTimers.current.forEach(clearTimeout);
      clearTimeout(hintTimer.current);
      audioRef.current?.pause();
    };
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Google Font + layout-only styles (no animated props here) */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&display=swap');
        .lily-words-row {
          display: flex;
          flex-direction: row;
          align-items: baseline;
          gap: 0.55em;
        }
        @media (max-width: 560px) {
          .lily-words-row { flex-direction: column; align-items: center; gap: 0.15em; }
        }
      `}</style>

      {/* Start screen — fades out on first tap, satisfying browser autoplay policy */}
      {!isStarted && (
        <div
          onClick={handleBegin}
          onTouchStart={handleBegin}
          onPointerDown={handleBegin}
          style={{
            position: 'fixed',
            inset: 0,
            background: '#473E1E',
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            userSelect: 'none',
            transition: 'opacity 0.9s ease',
            opacity: startFading ? 0 : 1,
          }}
        >
          <span style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: 'clamp(0.8rem, 2vw, 1rem)',
            color: 'rgba(255,255,255,0.5)',
            letterSpacing: '0.25em',
          }}>
          tap to begin
          </span>
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
        {/* Grass canvas */}
        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%',}}
        />

        {/* Green fade overlay */}
        <div
          ref={overlayRef}
          style={{
            position: 'absolute',
            inset: 0,
            background: '#638545',
            opacity: 0,
            pointerEvents: 'none',
            transition: 'none',
          }}
        />

        {/* Text layer */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            gap: '2.5rem',
          }}
        >
          <div className="lily-words-row">
            {WORDS.map((word, i) => (
              <span
                key={word}
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontWeight: 300,
                  fontSize: 'clamp(2.8rem, 20vw, 10.8rem)',
                  color: 'rgba(255, 255, 255, 0.96)',
                  letterSpacing: '0.17em',
                  whiteSpace: 'nowrap',
                  textShadow: '0 1px 24px rgba(0,0,0,0.25)',
                  transition: 'opacity 1.4s cubic-bezier(0.25,0.46,0.45,0.94), transform 1.4s cubic-bezier(0.25,0.46,0.45,0.94)',
                  opacity: visibleWords[i] ? 1 : 0,
                  transform: visibleWords[i] ? 'translateY(0)' : 'translateY(10px)',
                }}
              >
                {word}
              </span>
            ))}
          </div>

          <span
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: 'clamp(0.75rem, 1.8vw, 5.5rem)',
              color: 'rgba(255, 255, 255, 0.55)',
              letterSpacing: '0.22em',
              transition: 'opacity 1.8s ease',
              opacity: hintVisible ? 1 : 0,
            }}
          >
            volume up
          </span>
        </div>
      </div>
    </>
  );
}