import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { groupsAPI } from '../services/api';
import { NotificationProvider } from '../context/NotificationContext';

import logo from '../assets/logo.png';
import GroupList from '../components/GroupList';
import GroupModal from '../components/GroupModal';
import ChatHeader from '../components/ChatHeader';
import ChatPanel from '../components/ChatPanel';
import GroupOverview from '../components/GroupOverview';
import DuesPanel from '../components/DuesPanel';
import FilesPanel from '../components/FilesPanel';
import MembersPanel from '../components/MembersPanel';
import DMList from '../components/DMList';
import DMPanel from '../components/DMPanel';
import SettingsPanel, { SettingsSidebar } from '../components/SettingsPanel';
import NotificationBell from '../components/NotificationBell';
import ProfileModal from '../components/ProfileModal';
import KickNotification from '../components/KickNotification';
import { SearchSidebar, useSearch } from '../components/SearchPanel';

const NAV = ['groups', 'dms', 'search', 'notifications', 'settings'];

const NAV_ICONS = {
  groups:        'M1 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7 6s1 0 1-1-1-4-6-4c-.34 0-.66.02-.98.06A5.97 5.97 0 0 1 14 14h-1zm-1-9.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z',
  dms:           'M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4.414a1 1 0 0 0-.707.293L.854 15.146A.5.5 0 0 1 0 14.793V2z',
  search:        'M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.099zm-5.242 1.656a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z',
  notifications: 'M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z',
  settings:      'M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.892 3.433-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.892-1.64-.901-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319z',
};

// ── Desktop side-rail icon button ──────────────────────
function RailIcon({ id, active, onClick, badge }) {
  return (
    <button onClick={onClick} title={id}
      className={`rail-icon-btn${active ? ' active' : ''}`}
      onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--text-2)'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--nav-icon-inactive)'; }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d={NAV_ICONS[id]} /></svg>
      {badge > 0 && (
        <span style={{ position: 'absolute', top: 4, right: 4, minWidth: 14, height: 14, borderRadius: 7, background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
}

// ── Mobile bottom-tab button ───────────────────────────
function TabBtn({ id, active, onClick, badge }) {
  return (
    <button onClick={onClick} className={`tab-nav-btn${active ? ' active' : ''}`}>
      <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor"><path d={NAV_ICONS[id]} /></svg>
      <span style={{ fontSize: 9, fontWeight: active ? 500 : 300, letterSpacing: '0.03em', textTransform: 'capitalize' }}>{id}</span>
      {badge > 0 && (
        <span style={{ position: 'absolute', top: 6, right: '50%', transform: 'translateX(10px)', minWidth: 14, height: 14, borderRadius: 7, background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
}

export default function DashboardPage() {
  const { socket } = useSocket();

  const [activeNav, setActiveNav]   = useState('groups');
  const [groups, setGroups]         = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState(null);
  const [activeTab, setActiveTab]   = useState('Overview');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [activeConvo, setActiveConvo] = useState(null);
  const [settingsSection, setSettingsSection] = useState(null);
  const [fabOpen, setFabOpen] = useState(false);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [profileUserId, setProfileUserId] = useState(null);
  const [kickNotice, setKickNotice] = useState(null);
  const searchState = useSearch();
  const [highlightMessageId, setHighlightMessageId] = useState(null);
  const [highlightFileId, setHighlightFileId]       = useState(null);

  // Mobile: track whether we're showing the list or the detail panel
  // 'list' = sidebar content visible, 'detail' = main content visible
  const [mobileView, setMobileView] = useState('list');
  // Lock in which nav was active when detail panel was opened, so switching tabs
  // doesn't change the content rendered inside the (off-screen) detail panel
  const [mobileDetailNav, setMobileDetailNav] = useState('groups');

  useEffect(() => {
    groupsAPI.list()
      .then(res => setGroups(res.data))
      .catch(console.error)
      .finally(() => setGroupsLoading(false));
  }, []);

  useEffect(() => {
    if (!socket) return;
    const onKicked = ({ groupId, groupName }) => {
      setGroups(prev => prev.filter(g => g.id !== groupId));
      if (activeGroup?.id === groupId) { setActiveGroup(null); setMobileView('list'); }
      setKickNotice({ groupName });
    };
    socket.on('kicked_from_group', onKicked);
    return () => socket.off('kicked_from_group', onKicked);
  }, [socket, activeGroup?.id]);

  const handleSelectGroup = useCallback((group) => {
    setActiveGroup(group);
    setActiveTab('Overview');
    setActiveNav('groups');
    setMobileDetailNav('groups');
    setMobileView('detail');
  }, []);

  const handleSelectConvo = useCallback((convo) => {
    setActiveConvo(convo);
    setMobileDetailNav('dms');
    setMobileView('detail');
  }, []);

  const handleGroupCreated = useCallback((group) => {
    setGroups(prev => [...prev, group]);
    setActiveGroup(group);
    setActiveTab('Overview');
    setActiveNav('groups');
    setMobileDetailNav('groups');
    setMobileView('detail');
  }, []);

  const handleGroupUpdate = useCallback((updated) => {
    setGroups(prev => prev.map(g => g.id === updated.id ? { ...g, ...updated } : g));
    setActiveGroup(prev => prev?.id === updated.id ? { ...prev, ...updated } : prev);
  }, []);

  const handleGroupLeft = useCallback((groupId) => {
    setGroups(prev => prev.filter(g => g.id !== groupId));
    setActiveGroup(null);
    setMobileView('list');
  }, []);

  const handleGroupDeleted = useCallback((groupId) => {
    setGroups(prev => prev.filter(g => g.id !== groupId));
    setActiveGroup(null);
    setMobileView('list');
  }, []);

  const handleSearchNavigate = useCallback((result) => {
    const group = result.group || groups.find(g => g.id === result.groupId);
    if (!group) return;
    setActiveGroup(group);
    setActiveNav('groups');
    setMobileDetailNav('groups');
    setMobileView('detail');
    if (result.type === 'message') { setActiveTab('Chat'); setHighlightMessageId(result.messageId); }
    else if (result.type === 'file') { setActiveTab('Files'); setHighlightFileId(result.fileId); }
    else setActiveTab('Overview');
  }, [groups]);

  const handleNotificationNavigate = useCallback((n) => {
    const group = groups.find(g => g.id === n.groupId);
    if (!group) return;
    setActiveGroup(group);
    setActiveNav('groups');
    setMobileDetailNav('groups');
    setMobileView('detail');
    setActiveTab(n.type === 'message' ? 'Chat' : n.type === 'due' ? 'Dues' : 'Overview');
  }, [groups]);

  const handleFileRef = useCallback((fileId) => {
    setActiveTab('Files');
    setHighlightFileId(fileId);
  }, []);

  // When switching nav tabs on mobile, go back to list view
  const navChangedByTabRef = useRef(false);
  const wrappedHandleNavChange = (id) => {
    navChangedByTabRef.current = true;
    setActiveNav(id);
    setMobileView('list');
  };

  // ── Sidebar content ────────────────────────────────
  const renderSidebar = () => {
    if (activeNav === 'groups') return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="t-divider" style={{ height: 44, padding: '0 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="sidebar-section-label">Groups</span>
          {/* FAB with popover */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setFabOpen(v => !v)}
              style={{ width: 26, height: 26, borderRadius: 7, background: fabOpen ? 'rgba(124,58,237,0.3)' : 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)', color: 'rgba(167,139,250,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.15s' }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z"/></svg>
            </button>
            {fabOpen && (
              <>
                {/* backdrop */}
                <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={() => setFabOpen(false)} />
                <div style={{ position: 'absolute', top: 30, right: 0, zIndex: 999, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 10, overflow: 'hidden', minWidth: 180, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
                  <button
                    onClick={() => { setFabOpen(false); setNewFolderOpen(true); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', fontSize: 13, fontWeight: 300, fontFamily: 'Inter, sans-serif', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" style={{ flexShrink: 0, color: 'var(--text-3)' }}>
                      <path d="M.54 3.87.5 3a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3h3.982a2 2 0 0 1 1.992 2.181l-.637 7A2 2 0 0 1 13.174 14H2.826a2 2 0 0 1-1.991-1.819l-.637-7a1.99 1.99 0 0 1 .342-1.31zM2.19 4a1 1 0 0 0-.996 1.09l.637 7a1 1 0 0 0 .995.91h10.348a1 1 0 0 0 .995-.91l.637-7A1 1 0 0 0 13.81 4H2.19zm4.69-1.707A1 1 0 0 0 6.172 2H2.5a1 1 0 0 0-1 .981l.006.139C1.72 3.042 1.95 3 2.19 3h5.396l-.707-.707z"/>
                    </svg>
                    New folder
                  </button>
                  <div style={{ height: 1, background: 'var(--border-color)' }} />
                  <button
                    onClick={() => { setFabOpen(false); setShowGroupModal(true); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', fontSize: 13, fontWeight: 300, fontFamily: 'Inter, sans-serif', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" style={{ flexShrink: 0, color: 'var(--text-3)' }}>
                      <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z"/>
                    </svg>
                    Create or join group
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <GroupList groups={groups} activeGroupId={activeGroup?.id} onSelect={handleSelectGroup} onOpenModal={() => setShowGroupModal(true)} loading={groupsLoading} openNewFolder={newFolderOpen} onNewFolderHandled={() => setNewFolderOpen(false)} />
        </div>
      </div>
    );
    if (activeNav === 'dms') return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="t-divider" style={{ height: 44, padding: '0 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          <span className="sidebar-section-label">Messages</span>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <DMList activeConvoId={activeConvo?.id} onSelect={handleSelectConvo} />
        </div>
      </div>
    );
    if (activeNav === 'search') return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="t-divider" style={{ height: 44, padding: '0 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          <span className="sidebar-section-label">Search</span>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <SearchSidebar groups={groups} searchState={searchState} onNavigate={handleSearchNavigate} />
        </div>
      </div>
    );
    if (activeNav === 'notifications') return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="t-divider" style={{ height: 44, padding: '0 16px', borderBottomWidth: 1, borderBottomStyle: 'solid', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          <span className="sidebar-section-label">Notifications</span>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <NotificationBell inline onNavigate={handleNotificationNavigate} />
        </div>
      </div>
    );
    if (activeNav === 'settings') return <SettingsSidebar activeSection={settingsSection} onSection={(s) => { setSettingsSection(s); setMobileDetailNav('settings'); setMobileView('detail'); }} onViewProfile={setProfileUserId} />;
    return null;
  };

  // ── Main content ───────────────────────────────────
  const renderMain = () => {
    if (activeNav === 'dms') {
      return (
        <DMPanel conversation={activeConvo} onNewMessage={() => {}} onViewProfile={setProfileUserId}
          onNavigateToGroup={(groupId) => { const g = groups.find(x => x.id === groupId); if (g) { setActiveGroup(g); setActiveTab('Chat'); setActiveNav('groups'); setMobileView('detail'); } }} />
      );
    }
    if (activeNav === 'settings') return <SettingsPanel activeSection={settingsSection} />;

    if (!activeGroup) return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', backgroundColor: 'var(--bg-page)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, rgba(124,58,237,0.15) 0%, rgba(37,99,235,0.06) 35%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', textAlign: 'center', padding: '0 32px' }}>
          <svg width="40" height="40" viewBox="0 0 16 16" fill="currentColor" style={{ color: 'rgba(124,58,237,0.4)', margin: '0 auto 16px', display: 'block' }}>
            <path d="M1 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7 6s1 0 1-1-1-4-6-4c-.34 0-.66.02-.98.06A5.97 5.97 0 0 1 14 14h-1zm-1-9.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/>
          </svg>
          <p style={{ fontSize: 15, fontWeight: 400, color: 'var(--text-2)', margin: '0 0 8px' }}>Select a group</p>
          <p style={{ fontSize: 13, fontWeight: 300, color: 'var(--text-3)', margin: 0, lineHeight: 1.6 }}>Choose a group from the sidebar or create a new one.</p>
        </div>
      </div>
    );

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <ChatHeader group={activeGroup} activeTab={activeTab} onTabChange={setActiveTab} />
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {activeTab === 'Overview' && <GroupOverview group={activeGroup} onFileRef={handleFileRef} />}
          {activeTab === 'Chat' && <ChatPanel group={activeGroup} onViewProfile={setProfileUserId} onFileRef={handleFileRef} highlightMessageId={highlightMessageId} onHighlightClear={() => setHighlightMessageId(null)} />}
          {activeTab === 'Dues' && <DuesPanel group={activeGroup} />}
          {activeTab === 'Files' && <FilesPanel group={activeGroup} highlightFileId={highlightFileId} onHighlightClear={() => setHighlightFileId(null)} />}
          {activeTab === 'Members' && <MembersPanel group={activeGroup} onGroupUpdate={handleGroupUpdate} onLeft={handleGroupLeft} onGroupDeleted={handleGroupDeleted} onViewProfile={setProfileUserId} />}
        </div>
      </div>
    );
  };

  return (
    <NotificationProvider
      activeGroupId={activeNav === 'groups' ? activeGroup?.id : null}
      activeConvoId={activeNav === 'dms' ? activeConvo?.id : null}
      activeTab={activeTab}
      groups={groups}
    >
      {/* ── Desktop layout ── */}
      <div className="hidden sm:flex" style={{ height: '100dvh', fontFamily: 'Inter, sans-serif', overflow: 'hidden', backgroundColor: 'var(--bg-void)' }}>
        {/* Icon rail */}
        <div className="dash-rail" style={{ width: 56, flexShrink: 0, borderRightWidth: 1, borderRightStyle: 'solid', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: 12, gap: 4 }}>
          {/* Logo */}
          <div className="t-divider" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 0 10px', borderBottomWidth: 1, borderBottomStyle: 'solid', marginBottom: 8, flexShrink: 0 }}>
            <img src={logo} alt="logo" style={{ width: 28, height: 28, objectFit: 'contain' }} />
          </div>
          {/* Main nav — centered */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            {NAV.filter(id => id !== 'settings').map(id => <RailIcon key={id} id={id} active={activeNav === id} onClick={() => setActiveNav(id)} />)}
          </div>
          {/* Settings pinned to bottom */}
          <RailIcon id="settings" active={activeNav === 'settings'} onClick={() => setActiveNav('settings')} />
        </div>
        {/* Sidebar */}
        <div className="dash-sidebar" style={{ width: 240, flexShrink: 0, borderRightWidth: 1, borderRightStyle: 'solid', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {renderSidebar()}
        </div>
        {/* Main */}
        <div className="dash-main" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {renderMain()}
        </div>
      </div>

      {/* ── Mobile layout ── */}
      <div className="flex sm:hidden" style={{ height: '100dvh', flexDirection: 'column', fontFamily: 'Inter, sans-serif', overflow: 'hidden', backgroundColor: 'var(--bg-void)' }}>
        {/* Top bar — logo + app name */}
        <div className="dash-topbar t-divider" style={{ flexShrink: 0, borderBottomWidth: 1, borderBottomStyle: 'solid', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))' }}>
          <img src={logo} alt="logo" style={{ width: 26, height: 26, objectFit: 'contain', flexShrink: 0 }} />
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>Studi+</span>
        </div>
        {/* Content area */}
        <div style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>

          {/* List panel */}
          <div style={{
            position: 'absolute', inset: 0,
            transform: mobileView === 'list' ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.25s ease',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            backgroundColor: 'var(--bg-void)',
          }}>
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
              {renderSidebar()}
            </div>
          </div>

          {/* Detail panel */}
          <div style={{
            position: 'absolute', inset: 0,
            transform: mobileView === 'detail' ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.25s ease',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            backgroundColor: 'var(--bg-page)',
          }}>
            {/* Back button row */}
            <div className="dash-topbar t-divider" style={{ padding: '10px 12px', borderBottomWidth: 1, borderBottomStyle: 'solid', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => setMobileView('list')} className="back-btn">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
                </svg>
                Back
              </button>
            </div>
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {mobileDetailNav === 'dms'
                ? <DMPanel conversation={activeConvo} onNewMessage={() => {}} onViewProfile={setProfileUserId}
                    onNavigateToGroup={(groupId) => { const g = groups.find(x => x.id === groupId); if (g) { setActiveGroup(g); setActiveTab('Chat'); setActiveNav('groups'); setMobileDetailNav('groups'); setMobileView('detail'); } }} />
                : mobileDetailNav === 'settings'
                ? <SettingsPanel activeSection={settingsSection} />
                : renderMain()
              }
            </div>
          </div>
        </div>

        {/* Bottom tab bar */}
        <div className="dash-tabbar t-divider" style={{
          flexShrink: 0, borderTopWidth: 1, borderTopStyle: 'solid',
          display: 'flex', alignItems: 'stretch',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}>
          {NAV.map(id => <TabBtn key={id} id={id} active={activeNav === id} onClick={() => wrappedHandleNavChange(id)} />)}
        </div>
      </div>

      {/* ── Modals (shared) ── */}
      {showGroupModal && <GroupModal onClose={() => setShowGroupModal(false)} onSuccess={handleGroupCreated} />}
      {profileUserId && <ProfileModal userId={profileUserId} onClose={() => setProfileUserId(null)} />}
      <KickNotification notice={kickNotice} onDismiss={() => setKickNotice(null)} />
    </NotificationProvider>
  );
}
