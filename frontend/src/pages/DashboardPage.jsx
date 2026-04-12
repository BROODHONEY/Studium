import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { groupsAPI } from '../services/api';
import { NotificationProvider } from '../context/NotificationContext';
import { useNotifications } from '../context/NotificationContext';

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
import ProfilePage from '../components/ProfilePage';
import KickNotification from '../components/KickNotification';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import GlobalDuesPanel from '../components/GlobalDuesPanel';
import { useSearch } from '../components/SearchPanel';
import SupportPanel from '../components/SupportPanel';
import SubmissionsPanel from '../components/SubmissionsPanel';

const NAV_MAIN = ['groups', 'dms', 'dues'];
const NAV_ALL  = ['groups', 'dms', 'dues', 'notifications', 'settings'];

const NAV_META = {
  groups:        { label: 'Groups',        icon: 'M1 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7 6s1 0 1-1-1-4-6-4c-.34 0-.66.02-.98.06A5.97 5.97 0 0 1 14 14h-1zm-1-9.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z' },
  dms:           { label: 'Messages',      icon: 'M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4.414a1 1 0 0 0-.707.293L.854 15.146A.5.5 0 0 1 0 14.793V2z' },
  dues:          { label: 'Due Dates',     icon: 'M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z' },
  search:        { label: 'Search',        icon: 'M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.099zm-5.242 1.656a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z' },
  notifications: { label: 'Notifications', icon: 'M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z' },
  settings:      { label: 'Settings',      icon: 'M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.892 3.433-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.892-1.64-.901-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319z' },
  archive:       { label: 'Archive',       icon: 'M0 2a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1v7.5a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 1 12.5V5a1 1 0 0 1-1-1V2zm2 3v7.5A1.5 1.5 0 0 0 3.5 14h9a1.5 1.5 0 0 0 1.5-1.5V5H2zm13-3H1v2h14V2zM5 7.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z' },
};

const AVATAR_COLORS = ['#4f46e5','#0d9488','#C0C1FF','#db2777','#d97706','#16a34a'];
const avatarBg = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
const ini = (n) => n?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

// -- Desktop icon rail button ---------------------------
function RailBtn({ id, active, onClick, badge }) {
  const { icon } = NAV_META[id];
  return (
    <button onClick={onClick} title={NAV_META[id].label}
      style={{
        width: 40, height: 40, borderRadius: 10, border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s', position: 'relative',
        background: active ? 'rgba(192,193,255,0.14)' : 'none',
        color: active ? '#C0C1FF' : '#555555',
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(192,193,255,0.08)'; e.currentTarget.style.color = '#9E9E9E'; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#555555'; } }}
    >
      {active && <div style={{ position: 'absolute', left: 0, top: '22%', bottom: '22%', width: 3, borderRadius: '0 3px 3px 0', background: '#C0C1FF' }}/>}
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d={icon}/></svg>
      {badge > 0 && (
        <span style={{ position: 'absolute', top: 4, right: 4, minWidth: 14, height: 14, borderRadius: 7, background: '#FFB38E', color: '#131313', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
}

// -- Mobile bottom-tab button ---------------------------
function TabBtn({ id, active, onClick, badge }) {
  return (
    <button onClick={onClick} className={`tab-nav-btn${active ? ' active' : ''}`}>
      <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor"><path d={NAV_META[id].icon} /></svg>
      <span style={{ fontSize: 9, fontWeight: active ? 500 : 300, letterSpacing: '0.03em', textTransform: 'capitalize' }}>{NAV_META[id].label}</span>
      {badge > 0 && (
        <span style={{ position: 'absolute', top: 6, right: '50%', transform: 'translateX(10px)', minWidth: 14, height: 14, borderRadius: 7, background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
}

// -- Mobile tab bar with live notification badge --------
function MobileTabBar({ activeNav, onNav }) {
  const { notifications, dmUnreads } = useNotifications();
  const notifCount = notifications.length;
  const dmCount = dmUnreads?.size || 0;
  const badges = { notifications: notifCount, dms: dmCount };
  return (
    <div className="dash-tabbar t-divider" style={{ flexShrink: 0, borderTopWidth: 1, borderTopStyle: 'solid', display: 'flex', alignItems: 'stretch', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      {NAV_ALL.map(id => <TabBtn key={id} id={id} active={activeNav === id} badge={badges[id] || 0} onClick={() => onNav(id)} />)}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [activeNav, setActiveNav]   = useState('groups');
  const [settingsOpen, setSettingsOpen] = useState(false); // desktop settings overlay
  const [supportOpen, setSupportOpen]   = useState(false); // support panel
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
  const [fullProfileUserId, setFullProfileUserId] = useState(null);
  const [kickNotice, setKickNotice] = useState(null);
  const searchState = useSearch(); void searchState;
  const [highlightMessageId, setHighlightMessageId] = useState(null);
  const [highlightFileId, setHighlightFileId]       = useState(null);

  // Unsaved-edit guard for SettingsPanel
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [pendingNav, setPendingNav]       = useState(null); // { type, payload }
  const [showDirtyConfirm, setShowDirtyConfirm] = useState(false);

  const handleDirtyChange = useCallback((dirty) => setSettingsDirty(dirty), []);

  // Per-group chat drafts (unsent text)
  const [chatDrafts, setChatDrafts] = useState({});

  const [mobileView, setMobileView] = useState('list');
  const [mobileDetailNav, setMobileDetailNav] = useState('groups');
  // Desktop: whether the sliding panel is open
  const [panelOpen, setPanelOpen] = useState(true);

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
    setActiveGroup(group); setActiveTab('Overview');
    setActiveNav('groups'); setMobileDetailNav('groups'); setMobileView('detail');
  }, []);

  const handleSelectConvo = useCallback((convo) => {
    setActiveConvo(convo); setMobileDetailNav('dms'); setMobileView('detail');
  }, []);

  const handleGroupCreated = useCallback((group) => {
    setGroups(prev => [...prev, group]);
    setActiveGroup(group); setActiveTab('Overview');
    setActiveNav('groups'); setMobileDetailNav('groups'); setMobileView('detail');
  }, []);

  const handleGroupUpdate = useCallback((updated) => {
    setGroups(prev => prev.map(g => g.id === updated.id ? { ...g, ...updated } : g));
    setActiveGroup(prev => prev?.id === updated.id ? { ...prev, ...updated } : prev);
  }, []);

  const handleGroupLeft    = useCallback((groupId) => { setGroups(prev => prev.filter(g => g.id !== groupId)); setActiveGroup(null); setMobileView('list'); }, []);
  const handleGroupDeleted = useCallback((groupId) => { setGroups(prev => prev.filter(g => g.id !== groupId)); setActiveGroup(null); setMobileView('list'); }, []);

  const handleSearchNavigate = useCallback((result) => {
    const group = result.group || groups.find(g => g.id === result.groupId);
    if (!group) return;
    setActiveGroup(group); setActiveNav('groups'); setMobileDetailNav('groups'); setMobileView('detail');
    if (result.type === 'message') { setActiveTab('Chat'); setHighlightMessageId(result.messageId); }
    else if (result.type === 'file') { setActiveTab('Files'); setHighlightFileId(result.fileId); }
    else setActiveTab('Overview');
  }, [groups]); void handleSearchNavigate;

  const handleNotificationNavigate = useCallback((n) => {
    const group = groups.find(g => g.id === n.groupId);
    if (!group) return;
    setActiveGroup(group); setActiveNav('groups'); setMobileDetailNav('groups'); setMobileView('detail');
    setActiveTab(n.type === 'message' ? 'Chat' : n.type === 'due' ? 'Dues' : 'Overview');
  }, [groups]);

  const handleFileRef = useCallback((fileId) => { setActiveTab('Files'); setHighlightFileId(fileId); }, []);

  // Guard navigation away from settings when there are unsaved edits
  const guardedNav = useCallback((action) => {
    if (settingsDirty) {
      setPendingNav(action);
      setShowDirtyConfirm(true);
    } else {
      action();
    }
  }, [settingsDirty]);

  const confirmLeave = () => {
    setShowDirtyConfirm(false);
    setSettingsDirty(false);
    pendingNav?.();
    setPendingNav(null);
  };

  const cancelLeave = () => {
    setShowDirtyConfirm(false);
    setPendingNav(null);
  };

  const wrappedHandleNavChange = (id) => {
    const doNav = () => {
      if (id === 'settings') {
        setMobileDetailNav('settings');
        setMobileView('list');
      } else {
        setMobileDetailNav(id);
        setActiveNav(id);
        setMobileView('list');
        setSettingsOpen(false);
        setSupportOpen(false);
      }
    };
    guardedNav(doNav);
  };

  // -- Sidebar panel content (below nav) -----------------
  const renderSideContent = (isMobile = false) => {
    // Mobile settings: show SettingsSidebar in the list panel
    if (isMobile && mobileDetailNav === 'settings') return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <SettingsSidebar activeSection={settingsSection}
            onSection={(s) => { setSettingsSection(s); setMobileView('detail'); }}
            onViewProfile={setProfileUserId}
            onViewFullProfile={(id) => { setFullProfileUserId(id); setMobileView('detail'); }} />
        </div>
        {/* Support button */}
        <div className="t-divider" style={{ borderTopWidth: 1, borderTopStyle: 'solid', padding: '8px 8px', flexShrink: 0 }}>
          <button onClick={() => { setSupportOpen(true); setMobileDetailNav('support'); setMobileView('detail'); }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'none', fontFamily: 'Inter, sans-serif', color: 'var(--text-3)', transition: 'background 0.15s' }}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" style={{ flexShrink: 0 }}>
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
              <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286zm1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z"/>
            </svg>
            <span style={{ fontSize: 13, fontWeight: 300 }}>Support</span>
          </button>
        </div>
      </div>
    );
    // Desktop settings: show SettingsSidebar
    if (!isMobile && settingsOpen) return (
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <SettingsSidebar activeSection={settingsSection}
          onSection={(s) => { setSettingsSection(s); }}
          onViewProfile={setProfileUserId}
          onViewFullProfile={setFullProfileUserId} />
      </div>
    );
    if (activeNav === 'groups') return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Mobile FAB header */}
        {isMobile && (
          <div className="t-divider" style={{ height: 44, padding: '0 12px', borderBottomWidth: 1, borderBottomStyle: 'solid', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Groups</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setNewFolderOpen(true)}
                style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid var(--border-color)', background: 'none', color: 'var(--text-2)', fontSize: 11, fontWeight: 300, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                + Folder
              </button>
              <button onClick={() => setShowGroupModal(true)}
                style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid rgba(192,193,255,0.28)', background: 'rgba(192,193,255,0.08)', color: '#C0C1FF', fontSize: 11, fontWeight: 400, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                + Group
              </button>
            </div>
          </div>
        )}
        <div style={{ flex: 1, minHeight: 0 }}>
          <GroupList groups={groups} activeGroupId={activeGroup?.id} onSelect={handleSelectGroup}
            onOpenModal={() => setShowGroupModal(true)} loading={groupsLoading}
            openNewFolder={newFolderOpen} onNewFolderHandled={() => setNewFolderOpen(false)} />
        </div>
      </div>
    );
    if (activeNav === 'dms') return (
      <div style={{ flex: 1, minHeight: 0 }}>
        <DMList activeConvoId={activeConvo?.id} onSelect={handleSelectConvo} />
      </div>
    );
    if (activeNav === 'dues') return null; // no sidebar for global dues
    if (activeNav === 'notifications') return (
      <div style={{ flex: 1, minHeight: 0 }}>
        <NotificationBell inline onNavigate={handleNotificationNavigate} />
      </div>
    );
    return null;
  };

  // -- Main content ---------------------------------------
  const renderMain = () => {
    if (supportOpen) return <SupportPanel />;
    if (settingsOpen) return <SettingsPanel activeSection={settingsSection} onDirtyChange={handleDirtyChange} />;
    if (activeNav === 'dms') return (
      <DMPanel conversation={activeConvo} onNewMessage={() => {}} onViewProfile={setProfileUserId}
        onNavigateToGroup={(groupId) => { const g = groups.find(x => x.id === groupId); if (g) { setActiveGroup(g); setActiveTab('Chat'); setActiveNav('groups'); setMobileView('detail'); } }} />
    );
    if (activeNav === 'dues') return <GlobalDuesPanel onNavigateToGroup={(groupId) => { const g = groups.find(x => x.id === groupId); if (g) { setActiveGroup(g); setActiveTab('Dues'); setActiveNav('groups'); setMobileView('detail'); } }} />;
    if (!activeGroup) return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', backgroundColor: 'var(--bg-page)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, rgba(192,193,255,0.12) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', textAlign: 'center', padding: '0 32px' }}>
          <svg width="40" height="40" viewBox="0 0 16 16" fill="currentColor" style={{ color: 'rgba(99,102,241,0.4)', margin: '0 auto 16px', display: 'block' }}>
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
          {activeTab === 'Overview' && <GroupOverview group={activeGroup} onFileRef={handleFileRef} onOpenCalendar={() => setActiveNav('dues')} />}
          {activeTab === 'Chat'     && <ChatPanel group={activeGroup} onViewProfile={setProfileUserId} onFileRef={handleFileRef} highlightMessageId={highlightMessageId} onHighlightClear={() => setHighlightMessageId(null)} draft={chatDrafts[activeGroup?.id] || ''} onDraftChange={(val) => setChatDrafts(prev => ({ ...prev, [activeGroup.id]: val }))} />}
          {activeTab === 'Dues'     && <DuesPanel group={activeGroup} />}
          {activeTab === 'Files'    && <FilesPanel group={activeGroup} highlightFileId={highlightFileId} onHighlightClear={() => setHighlightFileId(null)} />}
          {activeTab === 'Members'     && <MembersPanel group={activeGroup} onGroupUpdate={handleGroupUpdate} onLeft={handleGroupLeft} onGroupDeleted={handleGroupDeleted} onViewProfile={setProfileUserId} />}
          {activeTab === 'Submissions' && <SubmissionsPanel group={activeGroup} />}
        </div>
      </div>
    );
  };

  return (
    <NotificationProvider
      activeGroupId={activeGroup?.id}
      activeConvoId={activeConvo?.id}
      activeTab={activeTab}
      groups={groups}
    >
      {/* ── Desktop layout ── */}
      <div className="hidden sm:flex" style={{ height: '100dvh', fontFamily: 'Inter, sans-serif', overflow: 'hidden', backgroundColor: 'var(--void)', flexDirection: 'row' }}>

        {/* ── Icon rail — full height, no top header ── */}
        <div style={{ width: 56, flexShrink: 0, borderRight: '1px solid #2A2A3A', background: '#131313', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 10, paddingBottom: 12, gap: 4 }}>

          {/* Logo at top */}
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(192,193,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, flexShrink: 0 }}>
            <img src={logo} alt="logo" style={{ width: 22, height: 22, objectFit: 'contain' }} />
          </div>

          {/* Nav buttons */}
          {NAV_MAIN.map(id => (
            <RailBtn key={id} id={id} active={activeNav === id && panelOpen && !settingsOpen && !supportOpen}
              onClick={() => {
                const doNav = () => {
                  if (activeNav === id && !settingsOpen && !supportOpen) { setPanelOpen(v => !v); }
                  else { setActiveNav(id); setPanelOpen(true); setSettingsOpen(false); setSupportOpen(false); }
                };
                guardedNav(doNav);
              }} />
          ))}

          {/* Bottom: support + settings + notifications + avatar */}
          <div style={{ flex: 1 }} />

          <NotificationBell
            onNavigate={handleNotificationNavigate}
            onOpenPanel={() => { setActiveNav('notifications'); setPanelOpen(true); setSettingsOpen(false); setSupportOpen(false); }}
          />

          <button title="Support"
            onClick={() => guardedNav(() => { setSupportOpen(true); setSettingsOpen(false); setPanelOpen(true); })}
            style={{ width: 40, height: 40, borderRadius: 10, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', color: '#555555', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(192,193,255,0.10)'; e.currentTarget.style.color = '#9E9E9E'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#555555'; }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
              <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286zm1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z"/>
            </svg>
          </button>

          <button onClick={() => guardedNav(() => { setSettingsOpen(true); setPanelOpen(true); setSupportOpen(false); })}
            title="Settings"
            style={{ width: 40, height: 40, borderRadius: 10, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: settingsOpen ? 'rgba(192,193,255,0.12)' : 'none', color: settingsOpen ? '#C0C1FF' : '#555555', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(192,193,255,0.10)'; e.currentTarget.style.color = '#D4D5FF'; }}
            onMouseLeave={e => { e.currentTarget.style.background = settingsOpen ? 'rgba(192,193,255,0.12)' : 'none'; e.currentTarget.style.color = settingsOpen ? '#C0C1FF' : '#555555'; }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d={NAV_META.settings.icon}/></svg>
          </button>

          {/* User avatar */}
          <button onClick={() => guardedNav(() => setFullProfileUserId(user?.id))} title={user?.name}
            style={{ width: 34, height: 34, borderRadius: '50%', background: avatarBg(user?.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', border: 'none', cursor: 'pointer', flexShrink: 0, marginTop: 4 }}>
            {ini(user?.name)}
          </button>
        </div>

        {/* ── Body: sliding panel + main ── */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>
          <div style={{
            width: panelOpen && (settingsOpen || activeNav !== 'dues') && !supportOpen ? 220 : 0,
            flexShrink: 0, overflow: 'hidden',
            borderRight: (panelOpen && (settingsOpen || activeNav !== 'dues') && !supportOpen) ? '1px solid #2A2A3A' : 'none',
            transition: 'width 0.22s ease, border-width 0.22s ease',
            display: 'flex', flexDirection: 'column',
            background: '#1E1E1E',
          }}>
            <div style={{ width: 220, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

              {/* Panel content */}
              <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {/* Panel title — big white heading with FAB for groups */}
                <div style={{ padding: '20px 16px 0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h2 style={{ fontSize: 22, fontWeight: 700, color: '#F0F0F0', margin: 0, fontFamily: "'Manrope', 'Inter', sans-serif", letterSpacing: '-0.01em' }}>
                    {settingsOpen ? 'Settings' : NAV_META[activeNav]?.label}
                  </h2>
                  {activeNav === 'groups' && !settingsOpen && (
                    <div style={{ position: 'relative' }}>
                      <button onClick={() => setFabOpen(v => !v)}
                        style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(192,193,255,0.28)', background: fabOpen ? 'rgba(192,193,255,0.18)' : 'rgba(192,193,255,0.08)', color: '#C0C1FF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}>
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z"/></svg>
                      </button>
                      {fabOpen && (
                        <>
                          <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={() => setFabOpen(false)} />
                          <div style={{ position: 'absolute', top: 32, right: 0, zIndex: 999, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 10, overflow: 'hidden', minWidth: 180, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
                            <button onClick={() => { setFabOpen(false); setNewFolderOpen(true); }}
                              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', fontSize: 13, fontWeight: 300, fontFamily: 'Inter, sans-serif' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(192,193,255,0.08)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" style={{ color: 'var(--text-3)' }}>
                                <path d="M.54 3.87.5 3a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3h3.982a2 2 0 0 1 1.992 2.181l-.637 7A2 2 0 0 1 13.174 14H2.826a2 2 0 0 1-1.991-1.819l-.637-7a1.99 1.99 0 0 1 .342-1.31zM2.19 4a1 1 0 0 0-.996 1.09l.637 7a1 1 0 0 0 .995.91h10.348a1 1 0 0 0 .995-.91l.637-7A1 1 0 0 0 13.81 4H2.19zm4.69-1.707A1 1 0 0 0 6.172 2H2.5a1 1 0 0 0-1 .981l.006.139C1.72 3.042 1.95 3 2.19 3h5.396l-.707-.707z"/>
                              </svg>
                              New folder
                            </button>
                            <div style={{ height: 1, background: 'var(--border-color)' }} />
                            <button onClick={() => { setFabOpen(false); setShowGroupModal(true); }}
                              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', fontSize: 13, fontWeight: 300, fontFamily: 'Inter, sans-serif' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(192,193,255,0.08)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" style={{ color: 'var(--text-3)' }}>
                                <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z"/>
                              </svg>
                              Create or join group
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
                {renderSideContent(false)}
              </div>
            </div>
          </div>

          {/* ── Main area ── */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: 'var(--void)' }}>
            {renderMain()}
          </div>
        </div>
      </div>

      {/* -- Mobile layout -- */}
      <div className="flex sm:hidden" style={{ height: '100dvh', flexDirection: 'column', fontFamily: 'Inter, sans-serif', overflow: 'hidden', backgroundColor: 'var(--bg-void)' }}>
        {/* Top bar */}
        <div className="dash-topbar t-divider" style={{ flexShrink: 0, borderBottomWidth: 1, borderBottomStyle: 'solid', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))' }}>
          <img src={logo} alt="logo" style={{ width: 26, height: 26, objectFit: 'contain', flexShrink: 0 }} />
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em', flex: 1 }}>Studi+</span>
          <button onClick={() => setFullProfileUserId(user?.id)} style={{ width: 28, height: 28, borderRadius: '50%', background: avatarBg(user?.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: '#fff', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
            {ini(user?.name)}
          </button>
        </div>

        {/* Content area */}
        <div style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
          {/* List panel */}
          <div style={{ position: 'absolute', inset: 0, transform: mobileView === 'list' ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.25s ease', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: 'var(--bg-void)' }}>
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
              {renderSideContent(true)}
            </div>
          </div>
          {/* Detail panel */}
          <div style={{ position: 'absolute', inset: 0, transform: mobileView === 'detail' ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.25s ease', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: 'var(--bg-page)' }}>
            <div className="dash-topbar t-divider" style={{ padding: '10px 12px', borderBottomWidth: 1, borderBottomStyle: 'solid', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => setMobileView('list')} className="back-btn">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/></svg>
                Back
              </button>
            </div>
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {mobileDetailNav === 'dms'
                ? <DMPanel conversation={activeConvo} onNewMessage={() => {}} onViewProfile={setProfileUserId}
                    onNavigateToGroup={(groupId) => { const g = groups.find(x => x.id === groupId); if (g) { setActiveGroup(g); setActiveTab('Chat'); setActiveNav('groups'); setMobileDetailNav('groups'); setMobileView('detail'); } }} />
                : mobileDetailNav === 'dues'
                ? <GlobalDuesPanel onNavigateToGroup={(groupId) => { const g = groups.find(x => x.id === groupId); if (g) { setActiveGroup(g); setActiveTab('Dues'); setActiveNav('groups'); setMobileDetailNav('groups'); setMobileView('detail'); } }} />
                : mobileDetailNav === 'settings'
                ? <SettingsPanel activeSection={settingsSection} onDirtyChange={handleDirtyChange} />
                : mobileDetailNav === 'support'
                ? <SupportPanel />
                : renderMain()
              }
            </div>
          </div>
        </div>

        {/* Bottom tab bar */}
        <MobileTabBar activeNav={activeNav} onNav={wrappedHandleNavChange} />
      </div>

      {/* -- Modals -- */}
      {showGroupModal && <GroupModal onClose={() => setShowGroupModal(false)} onSuccess={handleGroupCreated} />}
      {profileUserId && (
        <ProfileModal
          userId={profileUserId}
          onClose={() => setProfileUserId(null)}
          onViewFull={(id) => setFullProfileUserId(id)}
        />
      )}
      {fullProfileUserId && (
        <ProfilePage
          userId={fullProfileUserId}
          onClose={() => setFullProfileUserId(null)}
        />
      )}
      <KickNotification notice={kickNotice} onDismiss={() => setKickNotice(null)} />
      <ConfirmDialog
        open={showDirtyConfirm}
        title="Unsaved changes"
        description="You have unsaved changes. Leave anyway and discard them?"
        confirmText="Leave"
        cancelText="Stay"
        danger
        onConfirm={confirmLeave}
        onCancel={cancelLeave}
      />
    </NotificationProvider>
  );
}
