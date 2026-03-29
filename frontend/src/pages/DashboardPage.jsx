import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { groupsAPI } from '../services/api';
import GroupList     from '../components/GroupList';
import DMList        from '../components/DMList';
import ChatPanel     from '../components/ChatPanel';
import DMPanel       from '../components/DMPanel';
import ChatHeader    from '../components/ChatHeader';
import GroupModal    from '../components/GroupModal';
import FilesPanel    from '../components/FilesPanel';
import MembersPanel  from '../components/MembersPanel';
import GroupOverview from '../components/GroupOverview';
import DuesPanel     from '../components/DuesPanel';
import KickNotification from '../components/KickNotification';
import ProfileModal  from '../components/ProfileModal';
import SettingsPanel from '../components/SettingsPanel';
import { NotificationProvider, useNotifications } from '../context/NotificationContext';
import logo from '../assets/logo.png';

const ini = (n) => n?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

function Ic({ d, s = 18 }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'block', flexShrink: 0, overflow: 'visible' }}>
      {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
}

function RailBtn({ icon, active, dot, onClick, title }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} title={title}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: active ? 'rgba(255,255,255,0.85)' : hov ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.25)',
        background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
        border: 'none', cursor: 'pointer', position: 'relative', transition: 'color 0.15s, background 0.15s',
      }}>
      {icon}
      {dot && (
        <span style={{
          position: 'absolute', top: 5, right: 5, width: 6, height: 6,
          borderRadius: '50%', background: '#7c3aed', border: '1.5px solid #000000',
        }} />
      )}
    </button>
  );
}

function Inner({
  user, groups, setGroups, loadingGroups,
  activeGroup, setActiveGroup,
  activeConvo, setActiveConvo,
  activeTab, setActiveTab,
  highlightFileId, setHighlightFileId,
  showModal, setShowModal,
  kickNotice, setKickNotice,
  profileUserId, setProfileUserId,
  handleSelectGroup, handleSelectConvo, handleGroupAdded, handleLeft,
}) {
  const { groupUnreads, dmUnreads, notifications, dismiss } = useNotifications();
  const hasGU = groupUnreads?.size > 0;
  const hasDU = dmUnreads?.size > 0;
  const hasN  = notifications?.length > 0;

  const [rail, setRail] = useState('groups');
  const [mob, setMob]   = useState('sidebar');

  const showGroup = activeGroup && !activeConvo;
  const showDM    = activeConvo && !activeGroup;

  const pickGroup = (g) => { handleSelectGroup(g); setMob('main'); };
  const pickConvo = (c) => { handleSelectConvo(c); setMob('main'); };

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', background: '#000000', fontFamily: 'Inter, sans-serif' }}>

      {/* Icon rail */}
      <div
        className={`${mob === 'sidebar' ? '' : 'hidden md:flex'} mobile-rail`}
        style={{ width: 48, flexShrink: 0, background: '#080808', borderRight: '1px solid #1c1c1c', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 12, paddingBottom: 12, gap: 4 }}>
        <img src={logo} alt="Studi+" style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'contain', marginBottom: 12, flexShrink: 0 }} />
        <RailBtn title="Groups"   active={rail==='groups'}   dot={hasGU && rail!=='groups'} onClick={() => setRail('groups')}
          icon={<Ic d="M16 11c1.5 0 3-1 3-2.5S17.5 6 16 6c-1.5 0-3 1-3 2.5S14.5 11 16 11zM8 11c1.5 0 3-1 3-2.5S9.5 6 8 6C6.5 6 5 7 5 8.5S6.5 11 8 11zM8 13c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zM16 13c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5C23 14.17 18.33 13 16 13z"/>} />
        <RailBtn title="Messages" active={rail==='dms'}      dot={hasDU && rail!=='dms'}   onClick={() => setRail('dms')}
          icon={<Ic d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>} />
        <RailBtn title="Settings" active={rail==='settings'}                               onClick={() => setRail('settings')}
          icon={<Ic d={['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z','M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z']}/>} />
        <div style={{ flex: 1 }} />
        <RailBtn title="Notifications" active={rail==='notifications'} dot={hasN && rail!=='notifications'} onClick={() => setRail('notifications')}
          icon={<Ic d={['M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9','M13.73 21a2 2 0 0 1-3.46 0']}/>} />
        {/* Profile — below bell, initials only, clickable */}
        <button onClick={() => setProfileUserId(user?.id)} title={user?.name}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          style={{
            width: 36, height: 36, borderRadius: 8, marginTop: 2, flexShrink: 0,
            background: 'transparent', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s',
          }}>
          <div style={{
            width: 26, height: 26, borderRadius: '50%',
            background: '#181818', border: '1.5px solid rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: 400,
          }}>
            {ini(user?.name)}
          </div>
        </button>
      </div>

      {/* List panel */}
      <div
        className={`${mob === 'sidebar' ? 'mobile-list' : 'hidden md:flex'}`}
        style={{ width: 240, flexShrink: 0, background: '#080808', borderRight: '1px solid #1c1c1c', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {/* Mobile-only logo bar — hidden on desktop where the icon rail shows it */}
        <div className="md:hidden" style={{ alignItems: 'center', gap: 8, padding: '14px 16px 10px', flexShrink: 0, borderBottom: '1px solid #1c1c1c' }}>
          <img src={logo} alt="Studi+" style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'contain', flexShrink: 0 }} />
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 400, fontFamily: 'Inter, sans-serif' }}>Studi+</span>
        </div>
        {rail === 'groups' && <GroupList groups={groups} activeGroupId={activeGroup?.id} onSelect={pickGroup} onOpenModal={() => setShowModal(true)} loading={loadingGroups} />}
        {rail === 'dms'    && <DMList activeConvoId={activeConvo?.id} onSelect={pickConvo} />}
        {rail === 'notifications' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '16px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Notifications</span>
              {notifications.length > 0 && <button onClick={() => notifications.forEach(n => dismiss(n.id))} style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, fontWeight: 300, background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 8px' }}>
              {notifications.length === 0
                ? <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: 12, fontWeight: 300, textAlign: 'center', paddingTop: 32 }}>No notifications.</p>
                : notifications.map(n => (
                  <button key={n.id} onClick={() => { if (n.groupId) { const g = groups.find(gr => gr.id === n.groupId); if (g) { pickGroup(g); setActiveTab(n.type === 'message' ? 'Chat' : n.type === 'due' ? 'Dues' : 'Overview'); setRail('groups'); } } dismiss(n.id); }}
                    style={{ width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 8, background: 'none', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', marginBottom: 4, display: 'block' }}>
                    <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</p>
                    <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, fontWeight: 300, marginTop: 2 }}>{n.body}</p>
                  </button>
                ))
              }
            </div>
          </div>
        )}
        {rail === 'settings' && <div style={{ flex: 1 }} />}
      </div>

      {/* Main */}
      <main
        className={`${mob === 'main' ? 'mobile-main' : 'hidden md:flex'}`}
        style={{ flex: 1, minWidth: 0, flexDirection: 'column', background: '#000000' }}>
        {/* Mobile top bar — logo + back button, only on mobile when main is visible */}
        <div className="md:hidden" style={{ alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #1c1c1c', flexShrink: 0, background: '#000000' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src={logo} alt="Studi+" style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'contain', flexShrink: 0 }} />
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 400, fontFamily: 'Inter, sans-serif' }}>Studi+</span>
          </div>
          <button onClick={() => setMob('sidebar')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', lineHeight: 0, padding: 4 }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>
            <Ic d="M19 12H5M12 5l-7 7 7 7" s={18}/>
          </button>
        </div>
        {rail === 'settings' && <SettingsPanel />}
        {rail !== 'settings' && showGroup && (
          <>
            <ChatHeader group={activeGroup} activeTab={activeTab} onTabChange={setActiveTab} />
            {activeTab === 'Overview' && <GroupOverview group={activeGroup} onFileRef={id => { setHighlightFileId(id); setActiveTab('Files'); }} />}
            {activeTab === 'Chat'    && <div style={{ flex: 1, minHeight: 0 }}><ChatPanel group={activeGroup} onViewProfile={setProfileUserId} onFileRef={id => { setHighlightFileId(id); setActiveTab('Files'); }} /></div>}
            {activeTab === 'Dues'    && <DuesPanel group={activeGroup} />}
            {activeTab === 'Files'   && <FilesPanel group={activeGroup} highlightFileId={highlightFileId} onHighlightClear={() => setHighlightFileId(null)} />}
            {activeTab === 'Members' && <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}><MembersPanel group={activeGroup} onGroupUpdate={u => { setActiveGroup(u); setGroups(prev => prev.map(g => g.id === u.id ? u : g)); }} onLeft={handleLeft} onGroupDeleted={handleLeft} onViewProfile={setProfileUserId} /></div>}
          </>
        )}
        {rail !== 'settings' && showDM && (
          <DMPanel conversation={activeConvo} onNewMessage={() => {}} onViewProfile={setProfileUserId}
            onNavigateToGroup={gid => { const g = groups.find(gr => gr.id === gid); if (g) { pickGroup(g); setRail('groups'); } }} />
        )}
        {rail !== 'settings' && !showGroup && !showDM && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
            {/* Radial gradient like login page */}
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, rgba(124,58,237,0.45) 0%, rgba(76,29,149,0.2) 35%, transparent 65%)', pointerEvents: 'none' }} />
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, fontWeight: 300, position: 'relative' }}>
              {rail === 'groups' ? 'Select a group to start.' : rail === 'dms' ? 'Select a conversation.' : ''}
            </p>
          </div>
        )}
      </main>

      {/* ── Mobile bottom nav — hidden on md+ via CSS, not inline style ── */}
      <nav className="md:hidden" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#080808', borderTop: '1px solid #1c1c1c',
        alignItems: 'center', zIndex: 100,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      /* display is controlled by md:hidden — do NOT set display:flex inline */
      >
        {[
          { key: 'groups',        label: 'Groups',   dot: hasGU, icon: <Ic d="M16 11c1.5 0 3-1 3-2.5S17.5 6 16 6c-1.5 0-3 1-3 2.5S14.5 11 16 11zM8 11c1.5 0 3-1 3-2.5S9.5 6 8 6C6.5 6 5 7 5 8.5S6.5 11 8 11zM8 13c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zM16 13c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5C23 14.17 18.33 13 16 13z" s={20}/> },
          { key: 'dms',           label: 'Messages', dot: hasDU, icon: <Ic d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" s={20}/> },
          { key: 'notifications', label: 'Alerts',   dot: hasN,  icon: <Ic d={['M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9','M13.73 21a2 2 0 0 1-3.46 0']} s={20}/> },
          { key: 'settings',      label: 'Settings', dot: false, icon: <Ic d={['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z','M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z']} s={20}/> },
        ].map(item => (
          <button key={item.key}
            onClick={() => { setRail(item.key); setMob(item.key === 'settings' ? 'main' : 'sidebar'); }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer', position: 'relative', color: rail === item.key && (item.key === 'settings' ? mob === 'main' : mob === 'sidebar') ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.25)', minHeight: 56 }}>
            {item.icon}
            <span style={{ fontSize: 9, fontWeight: 300, fontFamily: 'Inter, sans-serif' }}>{item.label}</span>
            {item.dot && !(rail === item.key && mob === 'sidebar') && (
              <span style={{ position: 'absolute', top: 8, right: 'calc(50% - 14px)', width: 6, height: 6, borderRadius: '50%', background: '#7c3aed' }} />
            )}
          </button>
        ))}
        {(showGroup || showDM) && (
          <button onClick={() => setMob('main')}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer', color: mob === 'main' ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.25)', minHeight: 56 }}>
            <Ic d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" s={20}/>
            <span style={{ fontSize: 9, fontWeight: 300, fontFamily: 'Inter, sans-serif' }}>Open</span>
          </button>
        )}
      </nav>

      {showModal     && <GroupModal onClose={() => setShowModal(false)} onSuccess={handleGroupAdded} />}
      {profileUserId && <ProfileModal userId={profileUserId} onClose={() => setProfileUserId(null)} />}
      <KickNotification notice={kickNotice} onDismiss={() => setKickNotice(null)} />
    </div>
  );
}

export default function DashboardPage() {
  const { user }   = useAuth();
  const { socket } = useSocket();
  const [groups, setGroups]           = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [activeTab, setActiveTab]     = useState('Overview');
  const [highlightFileId, setHighlightFileId] = useState(null);
  const [showModal, setShowModal]     = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [kickNotice, setKickNotice]   = useState(null);
  const [activeConvo, setActiveConvo] = useState(null);
  const [profileUserId, setProfileUserId] = useState(null);

  useEffect(() => {
    groupsAPI.list().then(r => setGroups(r.data)).catch(console.error).finally(() => setLoadingGroups(false));
  }, []);

  const handleSelectGroup = (g) => { setActiveGroup(g); setActiveConvo(null); setActiveTab('Overview'); };
  const handleSelectConvo = (c) => { setActiveConvo(c); setActiveGroup(null); };
  const handleGroupAdded  = async (group) => {
    let full = group;
    try { const r = await groupsAPI.get(group.id); full = { ...r.data, my_role: r.data.my_role ?? group.my_role }; } catch {}
    setGroups(prev => prev.find(g => g.id === full.id) ? prev : [full, ...prev]);
    setActiveGroup(full); setActiveConvo(null); setActiveTab('Overview');
  };
  const handleLeft = (gid) => { setGroups(prev => prev.filter(g => g.id !== gid)); setActiveGroup(prev => prev?.id === gid ? null : prev); };
  const handleKicked = (gid, gname) => { setGroups(prev => prev.filter(g => g.id !== gid)); setActiveGroup(prev => prev?.id === gid ? null : prev); setKickNotice({ groupName: gname }); };
  const kickRef = useRef(handleKicked);
  useEffect(() => { kickRef.current = handleKicked; });
  useEffect(() => {
    if (!socket || !user?.id) return;
    const h = ({ kickedUserId, groupId, groupName }) => { if (kickedUserId === user.id) kickRef.current(groupId, groupName); };
    socket.on('member_kicked', h); return () => socket.off('member_kicked', h);
  }, [socket, user?.id]);
  useEffect(() => {
    if (!socket) return;
    const bump = ({ group_id }) => { if (!group_id) return; setGroups(prev => { const i = prev.findIndex(g => g.id === group_id); return i <= 0 ? prev : [prev[i], ...prev.filter(g => g.id !== group_id)]; }); };
    ['new_message','new_announcement','new_due','new_file'].forEach(e => socket.on(e, bump));
    return () => ['new_message','new_announcement','new_due','new_file'].forEach(e => socket.off(e, bump));
  }, [socket]);

  return (
    <NotificationProvider activeGroupId={activeGroup?.id} activeConvoId={activeConvo?.id} activeTab={activeTab} groups={groups}>
      <Inner user={user} groups={groups} setGroups={setGroups} loadingGroups={loadingGroups}
        activeGroup={activeGroup} setActiveGroup={setActiveGroup}
        activeConvo={activeConvo} setActiveConvo={setActiveConvo}
        activeTab={activeTab} setActiveTab={setActiveTab}
        highlightFileId={highlightFileId} setHighlightFileId={setHighlightFileId}
        showModal={showModal} setShowModal={setShowModal}
        kickNotice={kickNotice} setKickNotice={setKickNotice}
        profileUserId={profileUserId} setProfileUserId={setProfileUserId}
        handleSelectGroup={handleSelectGroup} handleSelectConvo={handleSelectConvo}
        handleGroupAdded={handleGroupAdded} handleLeft={handleLeft} />
    </NotificationProvider>
  );
}
