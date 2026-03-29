import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export default function ChatHeader({ group, activeTab, onTabChange }) {
  const { user } = useAuth();
  const { groupTabUnreads } = useNotifications();
  const tabs = ['Overview', 'Chat', 'Dues', 'Files', 'Members'];
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    const h = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [dropdownOpen]);

  const tabUnreads = groupTabUnreads?.[group?.id] || new Set();

  return (
    <div style={{
      padding: '10px 16px',
      borderBottom: '1px solid #1c1c1c',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexShrink: 0, background: '#000000', gap: 12,
      fontFamily: 'Inter, sans-serif',
    }}>
      {/* Group info */}
      <div style={{ minWidth: 0, flex: 1 }}>
        <h2 style={{ fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.85)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {group.name}
        </h2>
        <p style={{ fontSize: 12, fontWeight: 300, color: 'rgba(255,255,255,0.3)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {group.subject}
          {user?.role === 'teacher' && (
            <span style={{ marginLeft: 8, color: 'rgba(255,255,255,0.2)' }}>
              · <span style={{ fontFamily: 'monospace', color: 'rgba(124,58,237,0.8)' }}>{group.invite_code}</span>
            </span>
          )}
        </p>
      </div>

      {/* Desktop tabs */}
      <div className="hidden sm:flex" style={{ gap: 2, flexShrink: 0 }}>
        {tabs.map(tab => (
          <button key={tab} onClick={() => onTabChange(tab)}
            className={activeTab === tab ? 'tab-btn-active' : 'tab-btn-inactive'}>
            <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              {tab}
              {tabUnreads.has(tab) && (
                <span style={{ position: 'absolute', top: -6, right: -10, width: 6, height: 6, borderRadius: '50%', background: '#7c3aed' }} />
              )}
            </span>
          </button>
        ))}
      </div>

      {/* Mobile dropdown */}
      <div className="sm:hidden" style={{ position: 'relative', flexShrink: 0 }} ref={dropdownRef}>
        <button onClick={() => setDropdownOpen(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 400, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)', cursor: 'pointer' }}>
          {activeTab}
          <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
            <path d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
          </svg>
        </button>
        {dropdownOpen && (
          <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, width: 140, zIndex: 50, background: '#111111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
            {tabs.map(tab => (
              <button key={tab} onClick={() => { onTabChange(tab); setDropdownOpen(false); }}
                style={{ width: '100%', textAlign: 'left', padding: '10px 14px', fontSize: 13, fontWeight: activeTab === tab ? 400 : 300, color: activeTab === tab ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.4)', background: activeTab === tab ? 'rgba(255,255,255,0.06)' : 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {tab}
                {tabUnreads.has(tab) && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c3aed', flexShrink: 0 }} />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
