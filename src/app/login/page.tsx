'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import './login.css';
import { loginGym, registerGym } from '@/app/actions';

export default function LoginScreen() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  
  // Form fields
  const [gymName, setGymName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    if (!isLogin) formData.append('gymName', gymName);

    const res = isLogin ? await loginGym(formData) : await registerGym(formData);

    if (res.error) {
      setErrorMsg(res.error);
      setIsSubmitting(false);
    } else if (res.success && res.gymId) {
      localStorage.setItem('gymflow_auth', res.gymId);
      router.push('/owner');
    }
  };

  return (
    <div className="login-container">
      <div className="login-mesh"></div>
      
      <div className="login-box">
        <div className="lb-header">
          <div className="lb-icon">
            <svg width="32" height="32" viewBox="0 0 18 18" fill="none"><rect x="1" y="7" width="4" height="4" rx="1" fill="currentColor"/><rect x="13" y="7" width="4" height="4" rx="1" fill="currentColor"/><rect x="5" y="5" width="8" height="8" rx="2" fill="#fff"/><rect x="7" y="2" width="4" height="14" rx="1" fill="#fff" opacity=".5"/></svg>
          </div>
          <h1>GymFlow <span>Pro</span></h1>
          <p>{isLogin ? 'Owner Command Protocol' : 'Create New Gym Tenant'}</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {!isLogin && (
            <div className="lf-field">
              <label>Gym Name</label>
              <input 
                type="text" 
                required 
                placeholder="IronHaus Fitness"
                value={gymName}
                onChange={(e) => setGymName(e.target.value)}
              />
            </div>
          )}

          <div className="lf-field">
            <label>Work Email</label>
            <input 
              type="email" 
              required 
              placeholder="owner@ironhaus.de"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="lf-field">
            <label>Admin Password</label>
            <input 
              type="password" 
              required 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {errorMsg && <div style={{ color: '#e94560', fontSize: '13px', textAlign: 'center' }}>{errorMsg}</div>}

          <button type="submit" className={`lb-btn ${isSubmitting ? 'loading' : ''}`} disabled={isSubmitting}>
            {isSubmitting ? 'Authenticating...' : isLogin ? 'Enter Command Centre' : 'Launch Setup Sequence'}
          </button>
        </form>

        <div className="lb-footer" style={{ cursor: 'pointer' }} onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); setIsSubmitting(false) }}>
          <a style={{ margin: '0 auto', fontSize: '13px', fontWeight: 600 }}>
            {isLogin ? "Don't have an account? Launch a new Gym." : "Already have a Gym? Log in here."}
          </a>
        </div>
      </div>
    </div>
  );
}
