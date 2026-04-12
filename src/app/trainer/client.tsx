'use client';

import React, { useState, useEffect } from 'react';
import '../member/member.css'; // Leverage existing mobile app aesthetics
import { verifyAccessCode, getGymSettings, getMembers, getTrainers } from '@/app/actions';

export default function TrainerDashboardClient() {
  const [activeTab, setActiveTab] = useState('Schedule');
  const [showMemberAction, setShowMemberAction] = useState<any>(null);
  
  // Authentication State
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [gymId, setGymId] = useState<string | null>(null);
  const [accessCode, setAccessCode] = useState('');
  const [authError, setAuthError] = useState('');

  // Data State
  const [gymSettings, setGymSettings] = useState<any>(null);
  const [trainer, setTrainer] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    const savedTid = localStorage.getItem('gymflow_trainer_id');
    const savedGid = localStorage.getItem('gymflow_trainer_gymid');
    if (savedTid && savedGid) {
      setTrainerId(savedTid);
      setGymId(savedGid);
    }
  }, []);

  useEffect(() => {
    if (gymId && trainerId) {
      const load = async () => {
        const [sets, mems, trns] = await Promise.all([
          getGymSettings(gymId), getMembers(gymId), getTrainers(gymId)
        ]);
        if (sets) setGymSettings(sets);
        if (trns) setTrainer(trns.find((t:any) => t.id === trainerId));
        if (mems) setMembers(mems);
      };
      load();
    }
  }, [gymId, trainerId]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const res = await verifyAccessCode(accessCode);
    if (res && res.type === 'trainer') {
      localStorage.setItem('gymflow_trainer_id', res.id);
      localStorage.setItem('gymflow_trainer_gymid', res.gymId);
      setTrainerId(res.id);
      setGymId(res.gymId);
    } else {
      setAuthError('Invalid Trainer configuration or Code');
    }
  };

  const handleAttendance = (id: string) => {
    alert("Attendance logged for " + id + "!");
    setShowMemberAction(null);
  };

  if (!trainerId || !trainer) {
    return (
      <div className="phone-container">
        <div className="phone" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', color: 'var(--brand)', marginBottom: '20px' }}>📋</div>
          <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Trainer Portal</h2>
          <p style={{ color: 'var(--t-tertiary)', fontSize: '13px', marginTop: '10px', marginBottom: '30px' }}>
            Enter the 4-digit trainer clearance code assigned by the Gym Admin.
          </p>
          <form style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '15px' }} onSubmit={handleLogin}>
            <input 
              type="text"
              maxLength={4}
              placeholder="0000"
              style={{ padding: '16px', fontSize: '24px', textAlign: 'center', letterSpacing: '8px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
              value={accessCode}
              onChange={e => setAccessCode(e.target.value)}
            />
            {authError && <div style={{ color: '#e94560', fontSize: '12px' }}>{authError}</div>}
            <button className="btn btn-acc" style={{ width: '100%', borderRadius: '12px', padding: '16px', background: 'var(--brand)', borderColor: 'var(--brand)' }}>
              Authorize Device
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Mock schedule based on current data constraints
  const schedule = [
    { time: '08:00 AM', name: 'Morning Intensity', capacity: 15, booked: 12 },
    { time: '11:30 AM', name: trainer.specialty + ' Workshop', capacity: 10, booked: 8 },
    { time: '02:00 PM', name: 'Personal Session', capacity: 1, booked: 1, type: 'private' },
  ];

  return (
    <div className="phone-container">
      <div className="phone">
        {/* Notch */}
        <div className="phone-notch">
          <span className="notch-time">10:24</span>
          <div className="notch-icons">
            <div className="notch-dot"></div>
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><rect x="0" y="5" width="2" height="5" rx="1" fill="#fff"/><rect x="3" y="3" width="2" height="7" rx="1" fill="#fff"/><rect x="6" y="1" width="2" height="9" rx="1" fill="#fff"/></svg>
          </div>
        </div>

        <div className="screen">
          <div className="s-header">
            <div>
              <div className="s-greet" style={{ color: 'var(--brand)' }}>STAFF CLEARANCE</div>
              <div className="s-name">Coach {trainer.name.split(' ')[0]}</div>
            </div>
            <div className="s-av" style={{ background: 'var(--brand)', border: 'none', color: '#fff' }}>{trainer.initials}</div>
          </div>

          {activeTab === 'Schedule' && (
            <>
              <div className="hero-card" style={{ background: 'linear-gradient(135deg, var(--sur-2), #1e1e1e)', borderColor: 'var(--brand)' }}>
                <div className="hero-plan" style={{ color: 'var(--brand)' }}>{gymSettings?.name || 'Network'}</div>
                <div className="hero-title">Your Next Session</div>
                <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '8px' }}>11:30 AM</div>
                <div style={{ color: 'var(--t-tertiary)' }}>{trainer.specialty} Workshop · Studio B</div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                  <button className="hero-btn" style={{ flex: 1, background: 'var(--brand)', border: 'none', color: '#fff' }}>Start Class</button>
                  <button className="hero-btn" style={{ flex: 1 }}>Roster</button>
                </div>
              </div>

              <div className="sec-title">Today's Queue</div>
              <div className="class-list">
                {schedule.map((cls, idx) => (
                  <div key={idx} className="cl-item">
                    <div style={{ minWidth: 65 }}>
                      <div className="cl-time" style={{ fontSize: '13px' }}>{cls.time.split(' ')[0]}</div>
                      <div className="cl-ampm">{cls.time.split(' ')[1]}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="cl-name" style={{ fontSize: '15px' }}>{cls.name}</div>
                      <div className="cl-trainer" style={{ color: cls.type === 'private' ? '#BA7517' : 'var(--t-secondary)' }}>
                        {cls.booked}/{cls.capacity} Participants
                      </div>
                    </div>
                    {cls.type === 'private' ? (
                      <div style={{ height: 10, width: 10, borderRadius: '50%', background: '#BA7517' }} />
                    ) : (
                      <div style={{ height: 10, width: 10, borderRadius: '50%', background: 'var(--t-tertiary)' }} />
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'Members' && (
            <>
              <div className="sec-title">Member Roster ({members.length})</div>
              <input 
                type="text" 
                placeholder="Search member name..." 
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', marginBottom: '16px' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {members.map(m => (
                  <div key={m.id} className="cl-item" onClick={() => setShowMemberAction(m)}>
                    <div className="s-av" style={{ height: 40, width: 40, fontSize: 13, marginRight: 12 }}>{m.name.substring(0,2).toUpperCase()}</div>
                    <div style={{ flex: 1 }}>
                      <div className="cl-name" style={{ fontSize: '15px' }}>{m.name}</div>
                      <div className="cl-trainer">{m.plan} Plan</div>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--t-tertiary)', fontWeight: 600 }}>{m.attendance}%</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Bottom Nav */}
        <div className="bottom-nav">
          {['Schedule', 'Members', 'Tasks', 'Profile'].map(tab => (
            <div 
              key={tab} 
              className={`bn-item ${activeTab === tab ? 'on' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              <div className="bn-lbl" style={{ color: activeTab === tab ? 'var(--brand)' : '' }}>{tab}</div>
            </div>
          ))}
        </div>
      </div>

      {showMemberAction && (
        <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div className="modal" style={{ maxWidth: '320px', margin: '0 20px', borderRadius: '32px' }}>
            <div className="ct">Client Action <span className="close" onClick={() => setShowMemberAction(null)}>×</span></div>
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>🏃</div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '8px 0' }}>{showMemberAction.name}</h2>
              <p style={{ color: 'var(--t-tertiary)', fontSize: '13px', marginBottom: '20px' }}>Log attendance or evaluate form.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button className="btn btn-acc" style={{ width: '100%', borderRadius: '16px', background: 'var(--teal)', borderColor: 'var(--teal)' }} onClick={() => handleAttendance(showMemberAction.id)}>
                  Mark Present (Class)
                </button>
                <button className="btn" style={{ width: '100%', borderRadius: '16px' }} onClick={() => setShowMemberAction(null)}>
                  Flag for Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
