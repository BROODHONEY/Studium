import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export default function ChatHeader({ group, activeTab, onTabChange }) {
  const { user } = useAuth();
  const { groupTabUnreads } = useNotifications();
  const tabs = ['Overview', 'Chat', 'Dues', 'Files', 'Members'];
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownPos, setDropdownPos]   = useState({ top: 0, right: 0 });
  const triggerRef = useRef(null);
  const menuRef    = useRef(null);

  const openDropdown = () => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setDropdownPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
    setDropdownOpen(true);
  };

  useEffect(() => {
    if (!dropdownOpen) return;
    const h = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) &&
          triggerRef.current && !triggerRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', h);
    document.addEventListener('touchstart', h);
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('touchstart', h); };
  }, [dropdownOpen]);

  const tabUnreads = groupTabUnreads?.[group?.id] || new Set();

  return (
    <div style={{
      padding: '12px 20px',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexShrink: 0,
      background: 'rgba(8,8,8,0.75)',
      backdropFilter: 'blur(20px) saturate(150%)',
      WebkitBackdropFilter: 'blur(20px) saturate(150%)',
      gap: 16, fontFamily: 'Inter, sans-serif', position: 'relative',
    }}>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.2), transparent)', pointerEvents: 'none' }}/>

      {/* Title */}
      <div style={{ minWidth: 0, flex: 1 }}>
        <h2 style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.88)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {group.name}
        </h2>
        <p style={{ fontSize: 11, fontWeight: 300, color: 'rgba(255,255,255,0.3)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {group.subject}
          {user?.role === 'teacher' && group.invite_code && (
            <span style={{ marginLeft: 8, color: 'rgba(255,255,255,0.18)' }}>
              · <span style={{ fontFamily: 'monospace', color: 'rgba(124,58,237,0.65)' }}>{group.invite_code}</span>
            </span>
          )}
        </p>
      </div>

      {/* Desktop tabs */}
      <div className="hidden sm:flex" style={{ gap: 1, flexShrink: 0, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '3px', border: '1px solid rgba(255,255,255,0.06)' }}>
        {tabs.map(tab => {
          const isActive = activeTab === tab;
          return (
            <button key={tab} onClick={() => onTabChange(tab)}
              style={{
                padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: isActive ? 400 : 300,
                border: 'none', cursor: 'pointer', transition: 'all 0.15s', position: 'relative',
                background: isActive ? 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(76,29,149,0.2))' : 'transparent',
                color: isActive ? 'rgba(196,181,253,0.95)' : 'rgba(255,255,255,0.35)',
                boxShadow: isActive ? '0 0 10px rgba(124,58,237,0.12)' : 'none',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}>
              {tab}
              {tabUnreads.has(tab) && (
                <span style={{ position: 'absolute', top: 3, right: 3, width: 5, height: 5, borderRadius: '50%', background: '#7c3aed', boxShadow: '0 0 5px rgba(124,58,237,0.8)' }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Mobile trigger */}
      <button ref={triggerRef}
        className="sm:hidden"
        onClick={() => dropdownOpen ? setDropdownOpen(false) : openDropdown()}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 400, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', flexShrink: 0 }}>
        {activeTab}
        <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
          <path d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
        </svg>
      </button>

      {/* Mobile dropdown — portal so it's never clipped */}
      {dropdownOpen && createPortal(
        <div ref={menuRef}
          style={{ position: 'fixed', top: dropdownPos.top, right: dropdownPos.right, width: 160, zIndex: 9999, background: 'rgba(14,14,14,0.97)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.7)' }}>
          {tabs.map(tab => (
            <button key={tab}
              onClick={() => { onTabChange(tab); setDropdownOpen(false); }}
              style={{ width: '100%', textAlign: 'left', padding: '12px 16px', fontSize: 13, fontWeight: activeTab === tab ? 400 : 300, color: activeTab === tab ? 'rgba(196,181,253,0.9)' : 'rgba(255,255,255,0.5)', background: activeTab === tab ? 'rgba(124,58,237,0.1)' : 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.1s', fontFamily: 'Inter, sans-serif' }}
              onMouseEnter={e => { if (activeTab !== tab) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={e => { if (activeTab !== tab) e.currentTarget.style.background = 'none'; }}>
              {tab}
              {tabUnreads.has(tab) && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#7c3aed', flexShrink: 0 }} />}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
