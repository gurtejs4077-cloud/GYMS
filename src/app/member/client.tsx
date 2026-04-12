'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import './member.css';
import { getGymSettings, getMembers, getClasses } from '@/app/actions';

export default function MemberDashboardClient() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Home');
  const [isClassesVisible, setIsClassesVisible] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [showProgressDetail, setShowProgressDetail] = useState(false);
  
  // Authentication State
  const [memberId, setMemberId] = useState<string | null>(null);
  const [gymId, setGymId] = useState<string | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Data State
  const [gymSettings, setGymSettings] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);

  useEffect(() => {
    const savedMid = localStorage.getItem('gymflow_member_id');
    const savedGid = localStorage.getItem('gymflow_member_gymid');
    if (savedMid && savedGid) {
      setMemberId(savedMid);
      setGymId(savedGid);
    } else {
      router.push('/portal');
    }
  }, [router]);

  useEffect(() => {
    if (gymId && memberId) {
      const load = async () => {
        const [sets, mems, clss] = await Promise.all([
          getGymSettings(gymId), getMembers(gymId), getClasses()
        ]);
        if (sets) {
          setGymSettings(sets);
          setIsClassesVisible(sets.classesVisible);
        }
        if (mems) {
          setUser(mems.find((m:any) => m.id === memberId));
        }
        if (clss) setClasses(clss);
        setIsAuthChecking(false);
      };
      load();
    }
  }, [gymId, memberId]);

  if (isAuthChecking || !user || !memberId) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: 'var(--teal)' }}>Authenticating with GymFlow...</div>;
  }

  return (
    <div className="phone-container">
      <div className="phone">
        <div className="phone-notch">
          <span className="notch-time">9:41</span>
          <div className="notch-icons">
            <div className="notch-dot"></div>
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><rect x="0" y="5" width="2" height="5" rx="1" fill="#5DCAA5"/><rect x="3" y="3" width="2" height="7" rx="1" fill="#5DCAA5"/><rect x="6" y="1" width="2" height="9" rx="1" fill="#5DCAA5"/></svg>
          </div>
        </div>

        <div className="screen">
          <div className="s-header">
            <div>
              <div className="s-greet">Good morning</div>
              <div className="s-name">{user.name}</div>
            </div>
            <div className="s-av">PR</div>
          </div>

          <div className="notif-banner">
            <div className="nb-dot"></div>
            <div className="nb-text">Your trainer <span>Marcus K.</span> posted a new workout plan</div>
          </div>

          <div className="hero-card">
            <div className="hero-plan">{user.plan.toUpperCase()} PLAN · ACTIVE</div>
            <div className="hero-title">IronHaus Fitness, Berlin</div>
            <div className="hero-row">
              <div className="hero-stat">
                <div className="hero-stat-v">22</div>
                <div className="hero-stat-l">days left</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-v">{user.attendance}%</div>
                <div className="hero-stat-l">attendance</div>
              </div>
              <button className="hero-btn">Renew</button>
            </div>
          </div>

          {isClassesVisible && (
            <>
              <div className="sec-title">Today's classes</div>
              <div className="class-list">
                {classes.slice(0, 3).map(cls => (
                  <div key={cls.id} className="cl-item" onClick={() => setSelectedClass(cls)} style={{ cursor: 'pointer' }}>
                    <div style={{ minWidth: 50 }}>
                      <div className="cl-time">{cls.time}</div>
                      <div className="cl-ampm">AM</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="cl-name">{cls.name}</div>
                      <div className="cl-trainer">{cls.trainerName}</div>
                    </div>
                    <button className={`cl-book ${cls.id === 'c1' ? 'cl-booked' : ''}`}>
                      {cls.id === 'c1' ? 'Booked' : 'Book'}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="sec-title">Goal progress</div>
          <div className="prog-card" onClick={() => setShowProgressDetail(true)} style={{ cursor: 'pointer' }}>
            <div className="prog-pct">{user.goalProgress}%</div>
            <div className="prog-metrics">
              <div className="pm"><div className="pm-v">47</div><div className="pm-l">Sessions</div></div>
              <div className="pm"><div className="pm-v">6.2</div><div className="pm-l">kg lost</div></div>
            </div>
            <div className="prog-bar-wrap">
              <div className="prog-bar-fill" style={{ width: `${user.goalProgress}%` }}></div>
            </div>
          </div>
        </div>

        <div className="bottom-nav">
          {['Home', 'Classes', 'Progress', 'Alerts', 'Profile'].map(tab => (
            <div 
              key={tab} 
              className={`bn-item ${activeTab === tab ? 'on' : ''}`}
              onClick={() => {
                setActiveTab(tab);
                if (tab !== 'Home') {
                    // Simulation
                    alert(tab + " details coming soon in full release!");
                }
              }}
            >
              <div className="bn-icon"></div>
              <div className="bn-lbl">{tab}</div>
            </div>
          ))}
        </div>
      </div>

      {selectedClass && (
        <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div className="modal" style={{ maxWidth: '320px', margin: '0 20px', borderRadius: '32px' }}>
            <div className="ct">Class Details <span className="close" onClick={() => setSelectedClass(null)}>×</span></div>
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ fontSize: '48px', color: 'var(--teal)' }}>💪</div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '8px 0' }}>{selectedClass.name}</h2>
              <p style={{ color: 'var(--t-tertiary)', fontSize: '13px' }}>With {selectedClass.trainerName} · {selectedClass.time} AM</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '20px' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '16px' }}>
                    <div style={{ fontSize: '18px', fontWeight: 800 }}>{selectedClass.booked}</div>
                    <div style={{ fontSize: '10px', color: 'var(--t-tertiary)' }}>Booked</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '16px' }}>
                    <div style={{ fontSize: '18px', fontWeight: 800 }}>{selectedClass.capacity - selectedClass.booked}</div>
                    <div style={{ fontSize: '10px', color: 'var(--t-tertiary)' }}>Available</div>
                </div>
              </div>

              <button className="btn btn-acc" style={{ width: '100%', marginTop: '20px', borderRadius: '16px' }} onClick={() => setSelectedClass(null)}>
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {showProgressDetail && (
        <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div className="modal" style={{ maxWidth: '320px', margin: '0 20px', borderRadius: '32px' }}>
            <div className="ct">Goal Analytics <span className="close" onClick={() => setShowProgressDetail(false)}>×</span></div>
            <div style={{ padding: '10px 0' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>Weight Loss Journey</h3>
              <div style={{ height: '120px', background: 'linear-gradient(to right, transparent, rgba(93, 202, 165, 0.1))', borderRadius: '16px', display: 'flex', alignItems: 'flex-end', padding: '10px', gap: '8px' }}>
                {[4, 7, 5, 8, 6, 9, 7].map((h, i) => (
                    <div key={i} style={{ flex: 1, background: 'var(--teal)', height: h * 10, borderRadius: '4px', opacity: 0.5 + (i * 0.07) }}></div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--t-tertiary)', marginTop: '8px' }}>
                <span>Mon</span><span>Wed</span><span>Fri</span><span>Sun</span>
              </div>
              <p style={{ marginTop: '20px', fontSize: '12px', color: 'var(--t-secondary)', lineHeight: '1.5' }}>
                You've completed <strong>12 workout sessions</strong> this week. You are only 3.8kg away from your target!
              </p>
              <button className="btn btn-acc" style={{ width: '100%', marginTop: '20px', borderRadius: '16px' }} onClick={() => setShowProgressDetail(false)}>
                Export Progress Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
