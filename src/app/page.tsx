'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      gap: '24px',
      padding: '20px'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontFamily: 'Bebas Neue', fontSize: '64px', letterSpacing: '2px', color: '#fff' }}>
          Gym<span>Flow</span>
        </h1>
        <p style={{ color: 'var(--t-secondary)', fontWeight: 500 }}>Next-Gen Gym Management SaaS</p>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', maxWidth: '800px', width: '100%' }}>
        <Link href="/login" className="glass-panel" style={{ padding: '40px', textDecoration: 'none', textAlign: 'center', transition: 'all 0.3s' }}>
          <h2 style={{ fontFamily: 'Bebas Neue', fontSize: '32px', color: '#fff' }}>Owner Dashboard <span style={{fontSize: '18px'}}>🔒</span></h2>
          <p style={{ color: 'var(--t-secondary)', fontSize: '14px', marginTop: '12px' }}>Secure admin login for gym management.</p>
        </Link>
        
        <Link href="/member" className="glass-panel" style={{ padding: '40px', textDecoration: 'none', textAlign: 'center', transition: 'all 0.3s' }}>
          <h2 style={{ fontFamily: 'Bebas Neue', fontSize: '32px', color: 'var(--acc)' }}>Member App</h2>
          <p style={{ color: 'var(--t-secondary)', fontSize: '14px', marginTop: '12px' }}>Personal progress, classes, and check-ins.</p>
        </Link>
      </div>

      <div style={{ marginTop: '40px', color: 'var(--t-tertiary)', fontSize: '12px' }}>
        Built with Next.js & Premium UI
      </div>
      
      <style jsx>{`
        span { color: #e94560; }
        .glass-panel:hover {
          transform: translateY(-8px);
          border-color: var(--acc);
          box-shadow: 0 20px 40px rgba(0,0,0,0.5);
        }
      `}</style>
    </div>
  );
}
