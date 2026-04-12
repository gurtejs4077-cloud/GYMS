'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import '../member/member.css'; // Inheriting the mobile interface CSS
import { verifyAccessCode } from '@/app/actions';

export default function PortalClient() {
  const router = useRouter();
  const [accessCode, setAccessCode] = useState('');
  const [authError, setAuthError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // If already logged in, redirect them seamlessly
  useEffect(() => {
    if (localStorage.getItem('gymflow_member_id')) {
      router.push('/member');
    } else if (localStorage.getItem('gymflow_trainer_id')) {
      router.push('/trainer');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsVerifying(true);
    
    // Simulate slight secure delay for cool UI effect
    await new Promise(r => setTimeout(r, 600));

    const res = await verifyAccessCode(accessCode);
    
    if (res && res.type === 'member') {
      localStorage.setItem('gymflow_member_id', res.id);
      localStorage.setItem('gymflow_member_gymid', res.gymId);
      router.push('/member');
    } else if (res && res.type === 'trainer') {
      localStorage.setItem('gymflow_trainer_id', res.id);
      localStorage.setItem('gymflow_trainer_gymid', res.gymId);
      router.push('/trainer');
    } else {
      setAuthError('Access Code not recognized in the system.');
      setIsVerifying(false);
    }
  };

  return (
    <div className="phone-container">
      <div className="phone" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center', background: 'var(--sur-1)' }}>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%' }}>
          <div style={{ fontSize: '56px', color: 'var(--teal)', marginBottom: '24px' }}>⌘</div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'Bebas Neue', letterSpacing: '1px' }}>GymFlow ID</h2>
          <p style={{ color: 'var(--t-tertiary)', fontSize: '14px', marginTop: '12px', marginBottom: '40px', lineHeight: '1.6' }}>
            Universal access portal. Please enter your 4-digit facility clearance code.
          </p>
          
          <form style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }} onSubmit={handleLogin}>
            <input 
              type="text"
              maxLength={4}
              placeholder="••••"
              style={{ padding: '20px', fontSize: '32px', fontWeight: '800', textAlign: 'center', letterSpacing: '14px', borderRadius: '20px', background: 'var(--sur-2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none' }}
              value={accessCode}
              onChange={e => setAccessCode(e.target.value.replace(/\D/g, ''))} // only allow numbers visually
            />
            
            {authError && <div style={{ color: '#e94560', fontSize: '14px', fontWeight: 'bold' }}>{authError}</div>}
            
            <button className="btn btn-acc" style={{ width: '100%', borderRadius: '16px', padding: '20px', fontSize: '18px' }} disabled={isVerifying || accessCode.length < 4}>
              {isVerifying ? 'Verifying Identity...' : 'Access Terminal'}
            </button>
          </form>
        </div>

        <div style={{ fontSize: '11px', color: 'var(--t-tertiary)', opacity: 0.5 }}>
          Secure Authentication System. Property of GymFlow SaaS.
        </div>
      </div>
    </div>
  );
}
