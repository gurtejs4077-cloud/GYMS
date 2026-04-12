'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import './owner.css';
import { addMember, addTrainer, updateGymSettings, removeMember, onboardGym, getGymSettings, getMembers, getTrainers, getClasses } from '@/app/actions';

export default function OwnerDashboardClient() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Overview');
  const [gymId, setGymId] = useState<string | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  
  // Auth & Onboarding State
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [hasOnboarded, setHasOnboarded] = useState(true);
  
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddTrainer, setShowAddTrainer] = useState(false);
  
  // Detail Modal States
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [selectedTrainer, setSelectedTrainer] = useState<any>(null);
  const [showFeatureNotice, setShowFeatureNotice] = useState<string | null>(null);

  // Gym Settings State
  const [gymSettings, setGymSettings] = useState({
    name: '', location: '', brandColor: '#e94560', classesVisible: false
  });

  useEffect(() => {
    const auth = localStorage.getItem('gymflow_auth');
    if (!auth) {
      router.push('/login');
    } else {
      setGymId(auth);
    }
  }, [router]);

  useEffect(() => {
    if (gymId) {
      const load = async () => {
        const [sets, mems, trns, clss] = await Promise.all([
          getGymSettings(gymId), getMembers(gymId), getTrainers(gymId), getClasses()
        ]);
        if (!sets) {
          setHasOnboarded(false);
        } else {
          setGymSettings(sets);
          setHasOnboarded(true);
        }
        setMembers(mems || []);
        setTrainers(trns || []);
        setClasses(clss || []);
        setIsAuthChecking(false);
      };
      load();
    }
  }, [gymId]);

  const toggleClassesVisibility = async () => {
    const newVal = !gymSettings.classesVisible;
    setGymSettings({ ...gymSettings, classesVisible: newVal });
    await updateGymSettings(gymId!, { classesVisible: newVal });
    // Keep local storage for instantaneous client sync if desired, or let Server render fix it
    localStorage.setItem('gym_classes_visible', String(newVal));
  };

  const handleSaveSettings = async () => {
    await updateGymSettings(gymId!, { 
      name: gymSettings.name, 
      location: gymSettings.location, 
      brandColor: gymSettings.brandColor 
    });
    alert('Settings Saved to Database!');
  };

  const handleAddMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const code = await addMember(gymId!, formData);
    // Realistically you might refetch or rely on Next.js revalidation. 
    // We'll manually update temp state to look fast:
    const newMember = {
      id: `m-temp-${Date.now()}`,
      name: formData.get('name') as string,
      plan: formData.get('plan') as string,
      attendance: 0, goalProgress: 0, trainerId: 't1', status: 'active' as const,
      joinedDate: 'Just now',
      accessCode: code
    };
    setMembers([newMember, ...members]);
    setShowAddMember(false);
  };

  const handleRemoveMember = async (id: string) => {
    if (confirm("Are you sure you want to offboard this member?")) {
      await removeMember(gymId!, id);
      setMembers(members.filter((m) => m.id !== id));
      setSelectedMember(null);
    }
  };

  const handleAddTrainer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const code = await addTrainer(gymId!, formData);
    const name = formData.get('name') as string;
    const newTrainer = {
      id: `t-temp-${Date.now()}`,
      name: name,
      specialty: formData.get('specialty') as string,
      memberCount: 0, classesPerDay: 0, status: 'online' as const,
      initials: name.split(' ').map((n:string)=>n[0]).join('').substring(0, 2).toUpperCase(),
      accessCode: code
    };
    setTrainers([newTrainer, ...trainers]);
    setShowAddTrainer(false);
  };

  const handleOnboardSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await onboardGym(gymId!, formData);
    
    // Update local state to skip reload
    setGymSettings({
      ...gymSettings,
      name: formData.get('gymName') as string,
      location: formData.get('location') as string,
    });
    setHasOnboarded(true);
  };

  if (isAuthChecking) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--acc)' }}>Verifying access...</div>;
  }

  // ONBOARDING WIZARD
  if (!hasOnboarded) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'var(--bg)' }}>
        <div style={{ background: 'var(--sur-1)', padding: '50px', borderRadius: '24px', maxWidth: '500px', width: '100%', border: '1px solid var(--sur-2)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h1 style={{ fontSize: '32px', fontFamily: 'Bebas Neue', letterSpacing: '1px' }}>Welcome to GymFlow</h1>
            <p style={{ color: 'var(--t-secondary)', fontSize: '14px', marginTop: '10px' }}>Let's set up your command center.</p>
          </div>
          
          <form onSubmit={handleOnboardSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', color: 'var(--t-secondary)', fontWeight: 600 }}>Gym Name</label>
              <input name="gymName" required placeholder="e.g. IronHaus Fitness" style={{ padding: '16px', background: 'var(--sur-2)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '15px' }} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', color: 'var(--t-secondary)', fontWeight: 600 }}>Your Name (Owner)</label>
              <input name="ownerName" required placeholder="e.g. Gurtej Singh" style={{ padding: '16px', background: 'var(--sur-2)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '15px' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', color: 'var(--t-secondary)', fontWeight: 600 }}>Contact Phone</label>
              <input name="phone" required placeholder="+1 234 567 8900" style={{ padding: '16px', background: 'var(--sur-2)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '15px' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', color: 'var(--t-secondary)', fontWeight: 600 }}>Location</label>
              <input name="location" required placeholder="City, Country" style={{ padding: '16px', background: 'var(--sur-2)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '15px' }} />
            </div>

            <button type="submit" className="btn btn-acc" style={{ padding: '18px', marginTop: '16px', fontSize: '16px' }}>Complete Setup</button>
          </form>
        </div>
      </div>
    );
  }

  const renderTrainers = () => (
    <div className="card">
      <div className="ct">Active Trainer Staff <span className="ct-action" onClick={() => setShowAddTrainer(true)}>+ Recruit Trainer</span></div>
      <div className="trainer-roster-full">
        {trainers.map(t => (
          <div key={t.id} className="tr-row">
            <div className="tr-av" style={{ background: t.status === 'online' ? 'var(--teal-glow)' : 'var(--g-border)', color: t.status === 'online' ? 'var(--teal)' : 'var(--t-secondary)' }}>
              {t.initials}
            </div>
            <div style={{ flex: 1 }}>
              <div className="tr-name">{t.name}</div>
              <div className="tr-spec">{t.specialty}</div>
            </div>
            <div className="tr-stats-mini">
              <div><strong>{t.memberCount}</strong> members</div>
              <div><strong>{t.classesPerDay}</strong> daily classes</div>
            </div>
            <div className={`tr-badge ${t.status}`}>{t.status}</div>
            <button className="asgn-btn">Manage</button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderOverview = () => (
    <>
      <div className="kpis">
        <div className="kpi">
          <div className="kpi-l">Active members</div>
          <div className="kpi-v">{members.length}</div>
          <div className="kpi-d up">↑ 23 this month</div>
        </div>
        <div className="kpi">
          <div className="kpi-l">MRR (EUR)</div>
          <div className="kpi-v">€41.2K</div>
          <div className="kpi-d up">↑ 4.2%</div>
        </div>
        <div className="kpi">
          <div className="kpi-l">Classes today</div>
          <div className="kpi-v">9</div>
          <div className="kpi-d fl">3 upcoming</div>
        </div>
        <div className="kpi">
          <div className="kpi-l">Failed payments</div>
          <div className="kpi-v">3</div>
          <div className="kpi-d dn">↑ 1 new</div>
        </div>
        <div className="kpi">
          <div className="kpi-l">At-risk members</div>
          <div className="kpi-v">{members.filter(m => m.status === 'at-risk').length}</div>
          <div className="kpi-d dn">↑ 3 flagged</div>
        </div>
      </div>

      <div className="row2">
        <div className="card">
          <div className="ct">Trainer roster — active today <span className="ct-action">Manage all</span></div>
          <div className="trainer-grid">
            {trainers.map(trainer => (
              <div key={trainer.id} className="tr-card">
                <div className="tr-head">
                  <div className="tr-av" style={{ background: trainer.status === 'online' ? 'var(--teal-glow)' : 'var(--g-border)', color: trainer.status === 'online' ? 'var(--teal)' : 'var(--t-secondary)' }}>
                    {trainer.initials}
                  </div>
                  <div>
                    <div className="tr-name">{trainer.name}</div>
                    <div className="tr-spec">{trainer.specialty}</div>
                  </div>
                </div>
                <div className="tr-stats">
                  <div className="tr-stat"><div className="tr-stat-v">{trainer.memberCount}</div><div className="tr-stat-l">members</div></div>
                  <div className="tr-stat"><div className="tr-stat-v">{trainer.classesPerDay}</div><div className="tr-stat-l">classes</div></div>
                </div>
                <div className={`tr-badge ${trainer.status}`}>{trainer.status === 'online' ? 'Online now' : trainer.status === 'away' ? 'Break' : 'Day off'}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="ct">Today's class schedule <span className="ct-action">Full calendar</span></div>
          <div className="sched-grid">
            {classes.map(cls => (
              <div key={cls.id} className="sc-item">
                <div className="sc-time">{cls.time}</div>
                <div style={{ flex: 1 }}>
                  <div className="sc-name">{cls.name}</div>
                  <div className="sc-trainer">{cls.trainerName}</div>
                </div>
                <div style={{ width: 80 }}>
                  <div className="sc-fill-wrap">
                    <div className="sc-fill" style={{ width: `${(cls.booked / cls.capacity) * 100}%`, background: cls.color }}></div>
                  </div>
                  <div className="sc-cap">{cls.booked}/{cls.capacity}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <div className="ct">Recent Member Onboarding <span className="ct-action" onClick={() => setShowAddMember(true)}>+ Add New</span></div>
        <div className="member-mini-list">
          {members.slice(0, 5).map(m => (
            <div key={m.id} className="m-mini-item" onClick={() => setSelectedMember(m)} style={{ cursor: 'pointer' }}>
              <div className="m-av">{m.name.split(' ').map((n:string)=>n[0]).join('')}</div>
              <div style={{ flex: 1 }}>
                <div className="m-name">{m.name}</div>
                <div className="m-sub">{m.plan} Plan · Joined {m.joinedDate}</div>
              </div>
              <div className={`m-stat-tag ${m.status}`}>{m.status}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  const renderSettings = () => (
    <div className="card" style={{ maxWidth: '600px' }}>
      <div className="ct">Gym Identity & Branding</div>
      <div className="settings-form">
        <div className="field">
          <label>Gym Name</label>
          <input 
            type="text" 
            value={gymSettings.name} 
            onChange={e => setGymSettings({...gymSettings, name: e.target.value})} 
          />
        </div>
        <div className="field">
          <label>Location</label>
          <input 
            type="text" 
            value={gymSettings.location} 
            onChange={e => setGymSettings({...gymSettings, location: e.target.value})} 
          />
        </div>
        <div className="field">
          <label>Primary Brand Color</label>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input 
              type="color" 
              value={gymSettings.brandColor} 
              onChange={e => setGymSettings({...gymSettings, brandColor: e.target.value})} 
            />
            <code>{gymSettings.brandColor}</code>
          </div>
        </div>
        
        <div className="field" style={{ marginTop: '20px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--g-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700 }}>Publish Today's Classes</div>
              <div style={{ fontSize: '11px', color: 'var(--t-tertiary)' }}>Hide or show the daily schedule on member apps</div>
            </div>
            <div 
              className={`toggle-btn ${gymSettings.classesVisible ? 'on' : ''}`} 
              onClick={toggleClassesVisibility}
              style={{
                width: '48px', height: '24px', background: gymSettings.classesVisible ? 'var(--teal)' : 'var(--g-border)', 
                borderRadius: '100px', cursor: 'pointer', position: 'relative', transition: '0.3s'
              }}
            >
              <div style={{
                position: 'absolute', top: '2px', left: gymSettings.classesVisible ? '26px' : '2px',
                width: '20px', height: '20px', background: '#fff', borderRadius: '50%', transition: '0.3s'
              }} />
            </div>
          </div>
        </div>

        <button className="btn btn-acc" style={{ marginTop: '20px' }} onClick={handleSaveSettings}>Save Changes</button>
      </div>
    </div>
  );

  return (
    <div className="shell-wrapper">
      <div className="shell">
        <div className="topbar">
          <div className="tb-brand">
            <div className="brand-icon" style={{ background: gymSettings.brandColor }}>
              <svg width="24" height="24" viewBox="0 0 18 18" fill="none"><rect x="1" y="7" width="4" height="4" rx="1" fill="currentColor"/><rect x="13" y="7" width="4" height="4" rx="1" fill="currentColor"/><rect x="5" y="5" width="8" height="8" rx="2" fill="#fff" opacity=".9"/><rect x="7" y="2" width="4" height="14" rx="1" fill="#fff" opacity=".4"/></svg>
            </div>
            <span className="brand-name">{gymSettings.name.split(' ')[0]}<span>{gymSettings.name.split(' ')[1] || 'Flow'}</span></span>
          </div>
          <div className="tb-nav">
            {['Overview', 'Trainers', 'Members', 'Settings'].map(tab => (
              <div 
                key={tab} 
                className={`tb-tab ${activeTab === tab ? 'on' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </div>
            ))}
          </div>
          <div className="tb-right">
            <span className="gym-tag">{gymSettings.location}</span>
            <div className="notif">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M8 1a5 5 0 0 1 5 5v2.5l1 2H2l1-2V6a5 5 0 0 1 5-5Zm0 14a2 2 0 0 1-2-2h4a2 2 0 0 1-2 2Z" stroke="currentColor" strokeWidth="1.2"/></svg>
              <span className="notif-dot"></span>
            </div>
            <div className="av">KM</div>
          </div>
        </div>

        <div className="body">
          <div className="sidebar">
            <div className="sg">
              <div className="sg-lbl">Main</div>
              <div className={`si ${activeTab === 'Overview' ? 'on' : ''}`} onClick={() => setActiveTab('Overview')}>Dashboard</div>
              <div className={`si ${activeTab === 'Trainers' ? 'on' : ''}`} onClick={() => setActiveTab('Trainers')}>Trainers <span className="sb sb-g">{trainers.length}</span></div>
              <div className={`si ${activeTab === 'Members' ? 'on' : ''}`} onClick={() => setActiveTab('Members')}>Members <span className="sb sb-g">{members.length}</span></div>
              <div className="si" onClick={() => setShowFeatureNotice('Class Scheduler')}>Classes</div>
              <div className="si" onClick={() => setShowFeatureNotice('Global Schedule')}>Schedule</div>
            </div>
            <div className="sg">
              <div className="sg-lbl">Finance</div>
              <div className="si" onClick={() => setShowFeatureNotice('Payment Processing')}>Payments <span className="sb sb-r">3</span></div>
              <div className="si" onClick={() => setShowFeatureNotice('Revenue Analytics')}>Revenue</div>
            </div>
            <div className="sg">
              <div className="sg-lbl">Retention</div>
              <div className="si" onClick={() => setShowFeatureNotice('At-risk Campaigns')}>At-risk <span className="sb sb-r">12</span></div>
              <div className="si" onClick={() => setShowFeatureNotice('Marketing Campaigns')}>Campaigns <span className="sb sb-a">2</span></div>
              <div className="si" onClick={() => setShowFeatureNotice('Member Progress tracking')}>Progress tracking</div>
            </div>
          </div>

          <div className="content">
            <div className="pg-head">
              <div>
                <div className="pg-title">{activeTab === 'Settings' ? 'Gym Configuration' : 'Owner Command Centre'}</div>
                <div className="pg-sub">Sunday 12 Apr 2026 · {gymSettings.name}</div>
              </div>
              <div className="act-row">
                <button className="btn btn-p" onClick={() => setActiveTab('Trainers')}>+ Add trainer</button>
                <button className="btn btn-acc" onClick={() => setShowAddMember(true)}>+ Add member</button>
              </div>
            </div>

            {activeTab === 'Overview' && renderOverview()}
            {activeTab === 'Settings' && renderSettings()}
            {activeTab === 'Trainers' && renderTrainers()}
            {activeTab === 'Members' && (
              <div className="card">
                <div className="ct">Full Member Directory <span className="ct-action" onClick={() => setShowAddMember(true)}>+ Onboard New</span></div>
                <div className="member-full-list">
                  {members.map(m => (
                    <div key={m.id} className="m-row" onClick={() => setSelectedMember(m)} style={{ cursor: 'pointer' }}>
                      <div className="m-av">{m.name.split(' ').map((n:string)=>n[0]).join('')}</div>
                      <div style={{ flex: 1 }}>
                        <div>{m.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--teal)', fontWeight: 600 }}>Code: {m.accessCode || 'N/A'}</div>
                      </div>
                      <div style={{ flex: 1, color: 'var(--t-tertiary)' }}>{m.plan}</div>
                      <div style={{ width: '100px' }}>{m.attendance}% Att.</div>
                      <div className={`m-stat-tag ${m.status}`}>{m.status}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddMember && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="ct">Add New Member <span className="close" onClick={() => setShowAddMember(false)}>×</span></div>
            <form onSubmit={handleAddMember} className="settings-form">
              <div className="field">
                <label>Full Name</label>
                <input name="name" type="text" required placeholder="e.g. John Doe" />
              </div>
              <div className="field">
                <label>Membership Plan</label>
                <select name="plan">
                  <option>Pro</option>
                  <option>Basic</option>
                  <option>Elite</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="submit" className="btn btn-acc">Confirm Onboarding</button>
                <button type="button" className="btn" onClick={() => setShowAddMember(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddTrainer && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="ct">Recruit Staff Member <span className="close" onClick={() => setShowAddTrainer(false)}>×</span></div>
            <form onSubmit={handleAddTrainer} className="settings-form">
              <div className="field">
                <label>Trainer Name</label>
                <input name="name" type="text" required placeholder="Full Name" />
              </div>
              <div className="field">
                <label>Specialty</label>
                <input name="specialty" type="text" required placeholder="e.g. Crossfit, Yoga" />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="submit" className="btn btn-p">Confirm Recruitment</button>
                <button type="button" className="btn" onClick={() => setShowAddTrainer(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedMember && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '500px' }}>
            <div className="ct">Member Profile: {selectedMember.name} <span className="close" onClick={() => setSelectedMember(null)}>×</span></div>
            <div className="detail-view">
              <div className="dv-header">
                <div className="dv-av" style={{ width: 64, height: 64, fontSize: 24 }}>{selectedMember.name.split(' ').map((n:any)=>n[0]).join('')}</div>
                <div>
                  <div className="dv-name" style={{ fontSize: 24, fontWeight: 800 }}>{selectedMember.name}</div>
                  <div className="dv-sub" style={{ color: 'var(--t-tertiary)' }}>{selectedMember.plan} Member · Joined {selectedMember.joinedDate}</div>
                </div>
              </div>
              <div className="dv-stats" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '24px' }}>
                <div className="kpi" style={{ padding: 16 }}><div className="kpi-l">Login Code</div><div className="kpi-v" style={{ fontSize: 24, letterSpacing: '2px', color: 'var(--teal)' }}>{selectedMember.accessCode || 'N/A'}</div></div>
                <div className="kpi" style={{ padding: 16 }}><div className="kpi-l">Attendance</div><div className="kpi-v" style={{ fontSize: 24 }}>{selectedMember.attendance}%</div></div>
              </div>
              <div className="dv-section" style={{ marginTop: 24 }}>
                <div className="dv-sec-lbl" style={{ fontSize: 11, fontWeight: 800, color: 'var(--t-tertiary)', marginBottom: 12 }}>RECENT ACTIVITY</div>
                <div style={{ fontSize: 13, color: 'var(--t-secondary)' }}>
                  • Attended morning HIIT (2 days ago)<br/>
                  • Processed {selectedMember.plan} plan payment (12 days ago)<br/>
                  • Completed body composition scan (1 month ago)
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: 24 }}>
                <button className="btn btn-acc" style={{ flex: 1 }}>Send Message</button>
                <button 
                  className="btn" 
                  style={{ flex: 1, borderColor: '#e94560', color: '#e94560' }} 
                  onClick={() => handleRemoveMember(selectedMember.id)}
                >
                  Offboard Member
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTrainer && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '500px' }}>
            <div className="ct">Trainer File: {selectedTrainer.name} <span className="close" onClick={() => setSelectedTrainer(null)}>×</span></div>
            <div className="detail-view">
              <div className="dv-header">
                <div className="dv-av" style={{ width: 64, height: 64, fontSize: 24, background: 'var(--teal-glow)', color: 'var(--teal)' }}>{selectedTrainer.initials}</div>
                <div>
                  <div className="dv-name" style={{ fontSize: 24, fontWeight: 800 }}>{selectedTrainer.name}</div>
                  <div className="dv-sub" style={{ color: 'var(--t-tertiary)' }}>{selectedTrainer.specialty} Specialist</div>
                </div>
              </div>
              <div className="dv-stats" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '24px' }}>
                <div className="kpi" style={{ padding: 16 }}><div className="kpi-l">Login Code</div><div className="kpi-v" style={{ fontSize: 24, letterSpacing: '2px', color: 'var(--teal)' }}>{selectedTrainer.accessCode || 'N/A'}</div></div>
                <div className="kpi" style={{ padding: 16 }}><div className="kpi-l">Schedule</div><div className="kpi-v" style={{ fontSize: 24 }}>{selectedTrainer.classesPerDay} Classes</div></div>
              </div>
              <div className="dv-section" style={{ marginTop: 24 }}>
                <div className="dv-sec-lbl" style={{ fontSize: 11, fontWeight: 800, color: 'var(--t-tertiary)', marginBottom: 12 }}>UPCOMING SESSIONS</div>
                <div style={{ fontSize: 13, color: 'var(--t-secondary)' }}>
                  • 08:30 — Strength Circuit (Active)<br/>
                  • 12:00 — Functional Flow<br/>
                  • 14:30 — Personal Training (Priya R.)
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: 24 }}>
                <button className="btn" style={{ flex: 1 }}>Edit Schedule</button>
                <button className="btn btn-acc" style={{ flex: 1 }}>Performance Review</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showFeatureNotice && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div className="ct">Module Setup: {showFeatureNotice} <span className="close" onClick={() => setShowFeatureNotice(null)}>×</span></div>
            <div style={{ padding: '20px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🛠️</div>
              <div style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>Coming to GymFlow Pro</div>
              <p style={{ color: 'var(--t-tertiary)', fontSize: '13px' }}>The <strong>{showFeatureNotice}</strong> module is currently in the setup phase. Full integration with your gym hardware will be available soon.</p>
              <button className="btn btn-acc" style={{ marginTop: '24px', width: '100%' }} onClick={() => setShowFeatureNotice(null)}>Notify me on launch</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
