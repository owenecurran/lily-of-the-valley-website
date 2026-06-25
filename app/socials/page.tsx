import Link from 'next/link';

export const metadata = { title: 'Socials — Owen Valentine' };

export default function SocialsPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&display=swap');
      `}</style>
      <main style={{
        minHeight: '100vh',
        background: '#1c2c10',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        color: 'rgba(255,255,255,0.88)',
        position: 'relative',
      }}>
        <Link href="/" style={{
          position: 'absolute', top: '2rem', left: '2rem',
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontStyle: 'italic', fontWeight: 300,
          fontSize: '0.9rem', letterSpacing: '0.2em',
          color: 'rgba(255,255,255,0.45)', textDecoration: 'none',
        }}>← home</Link>

        <h1 style={{
          fontWeight: 300, margin: 0,
          fontSize: 'clamp(3.5rem, 10vw, 8rem)',
          letterSpacing: '0.2em',
        }}>Socials</h1>

        <p style={{
          fontStyle: 'italic', fontWeight: 300, margin: '1.5rem 0 0',
          fontSize: 'clamp(0.8rem, 1.5vw, 1rem)',
          letterSpacing: '0.25em', color: 'rgba(255,255,255,0.3)',
        }}>coming soon</p>
      </main>
    </>
  );
}
