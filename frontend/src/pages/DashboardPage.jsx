import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { groupsAPI } from '../services/api';
import GroupList        from '../components/GroupList';
import DMList           from '../components/DMList';
import ChatPanel        from '../components/ChatPanel';
import DMPanel          from '../components/DMPanel';
import ChatHeader       from '../components/ChatHeader';
import GroupModal       from '../components/GroupModal';
import FilesPanel       from '../components/FilesPanel';
import MembersPanel     from '../components/MembersPanel';
import GroupOverview    from '../components/GroupOverview';
import DuesPanel        from '../components/DuesPanel';
import KickNotification from '../components/KickNotification';
import ProfileModal     from '../components/ProfileModal';
import SettingsPanel    from '../components/SettingsPanel';
import NotificationBell from '../components/NotificationBell';
import { NotificationProvider } from '../context/NotificationContext';

function NavIcon({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-4 py-2 flex-1 transition relative
        ${active ? 'text-brand-400' : 'dark:text-gray-500 text-gray-400 hover:text-brand-400'}`}>
      <span className="text-xl leading-none">{icon}</span>
      <span className="text-[10px] font-medium">{label}</span>
      {active && (
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-brand-400"/>
      )}
    </button>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [sidebarTab, setSidebarTab]       = useState('groups');
  const [groups, setGroups]               = useState([]);
  const [activeGroup, setActiveGroup]     = useState(null);
  const [activeTab, setActiveTab]         = useState('Overview');
  const [highlightFileId, setHighlightFileId] = useState(null);
  const [showModal, setShowModal]         = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [kickNotice, setKickNotice]       = useState(null);
  const [activeConvo, setActiveConvo]     = useState(null);
  const [profileUserId, setProfileUserId] = useState(null);
  const [mobileView, setMobileView]       = useState('sidebar');
  useEffect(() => {
    groupsAPI.list()
      .then(res => setGroups(res.data))
      .catch(console.error)
      .finally(() => setLoadingGroups(false));
  }, []);

  const handleSelectGroup = (group) => {
    setActiveGroup(group); setActiveConvo(null);
    setActiveTab('Overview'); setMobileView('main');
  };

  const handleSelectConvo = (convo) => {
    setActiveConvo(convo); setActiveGroup(null); setMobileView('main');
  };

  const handleGroupAdded = async (group) => {
    let fullGroup = group;
    try {
      const res = await groupsAPI.get(group.id);
      fullGroup = { ...res.data, my_role: res.data.my_role ?? group.my_role };
    } catch { /* fallback */ }
    setGroups(prev => prev.find(g => g.id === fullGroup.id) ? prev : [fullGroup, ...prev]);
    setActiveGroup(fullGroup); setActiveConvo(null);
    setActiveTab('Overview'); setSidebarTab('groups'); setMobileView('main');
  };

  const handleLeft = (groupId) => {
    setGroups(prev => prev.filter(g => g.id !== groupId));
    setActiveGroup(prev => prev?.id === groupId ? null : prev);
    setMobileView('sidebar');
  };

  const handleKicked = (groupId, groupName) => {
    setGroups(prev => prev.filter(g => g.id !== groupId));
    setActiveGroup(prev => prev?.id === groupId ? null : prev);
    setKickNotice({ groupName }); setMobileView('sidebar');
  };

  const handleKickedRef = useRef(handleKicked);
  useEffect(() => { handleKickedRef.current = handleKicked; });

  useEffect(() => {
    if (!socket || !user?.id) return;
    const onKicked = ({ kickedUserId, groupId, groupName }) => {
      if (kickedUserId === user.id) handleKickedRef.current(groupId, groupName);
    };
    socket.on('member_kicked', onKicked);
    return () => socket.off('member_kicked', onKicked);
  }, [socket, user?.id]);

  const showGroup = activeGroup && !activeConvo;
  const showDM    = activeConvo && !activeGroup;

  return (
    <NotificationProvider activeGroupId={activeGroup?.id} activeConvoId={activeConvo?.id} groups={groups}>
    <div className="h-screen flex flex-col dark:bg-surface bg-gray-50 transition-colors duration-300">

      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-2.5 flex-shrink-0 border-b
        dark:bg-surface-1 dark:border-brand-900/40 bg-white border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          {mobileView === 'main' && (
            <button onClick={() => setMobileView('sidebar')}
              className="md:hidden p-1.5 rounded-lg dark:text-gray-400 text-gray-500 transition">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center">
              <span className="text-white text-xs font-bold">S</span>
            </div>
            <span className="text-sm font-bold dark:text-white text-gray-900">Studi+</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell onNavigate={n => {
            if (n.groupId) {
              const g = groups.find(gr => gr.id === n.groupId);
              if (g) {
                handleSelectGroup(g);
                if (n.type === 'message') setActiveTab('Chat');
                else if (n.type === 'due') setActiveTab('Dues');
                else setActiveTab('Overview');
              }
            }
          }}/>
          <button
            onClick={() => { setSidebarTab('settings'); setMobileView('main'); }}
          className={`p-1.5 rounded-lg border transition
            ${sidebarTab === 'settings'
              ? 'bg-brand-600 border-brand-500 text-white'
              : 'dark:bg-surface-2 dark:border-brand-900/40 dark:text-gray-400 dark:hover:text-brand-300 bg-gray-100 border-gray-200 text-gray-500 hover:text-brand-600'}`}
          title="Settings">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
            <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.474l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z"/>
          </svg>
        </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 min-h-0">

        {/* Sidebar */}
        <aside className={`flex-shrink-0 flex flex-col border-r
          dark:bg-surface-1 dark:border-brand-900/40 bg-white border-gray-200
          w-full md:w-72
          ${mobileView === 'sidebar' ? 'flex' : 'hidden md:flex'}`}>

          <div className="flex p-2 gap-1.5 border-b flex-shrink-0
            dark:border-brand-900/40 border-gray-200">
            {[['groups','Groups'],['dms','Messages']].map(([key, label]) => (
              <button key={key} onClick={() => setSidebarTab(key)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition
                  ${sidebarTab === key
                    ? 'bg-gradient-to-r from-brand-700 to-brand-600 text-white shadow-neon-purple'
                    : 'dark:text-gray-500 dark:hover:bg-surface-3 text-gray-500 hover:bg-gray-100'}`}>
                {label}
              </button>
            ))}
          </div>

          <div className="flex-1 min-h-0 overflow-hidden">
            {sidebarTab === 'groups'
              ? <GroupList groups={groups} activeGroupId={activeGroup?.id}
                  onSelect={handleSelectGroup} onOpenModal={() => setShowModal(true)}
                  loading={loadingGroups} />
              : <DMList activeConvoId={activeConvo?.id} onSelect={handleSelectConvo} />
            }
          </div>
        </aside>

        {/* Main */}
        <main className={`flex-1 flex flex-col min-w-0
          ${mobileView === 'main' ? 'flex' : 'hidden md:flex'}`}>

          {showGroup && sidebarTab !== 'settings' && (
            <>
              <ChatHeader group={activeGroup} activeTab={activeTab} onTabChange={setActiveTab} />
              {activeTab === 'Overview' && <GroupOverview group={activeGroup} onFileRef={id => { setHighlightFileId(id); setActiveTab('Files'); }} />}
              {activeTab === 'Chat' && (
                <div className="flex-1 min-h-0">
                  <ChatPanel group={activeGroup} onViewProfile={setProfileUserId} onFileRef={id => { setHighlightFileId(id); setActiveTab('Files'); }} />
                </div>
              )}
              {activeTab === 'Dues'  && <DuesPanel group={activeGroup} />}
              {activeTab === 'Files' && <FilesPanel group={activeGroup} highlightFileId={highlightFileId} onHighlightClear={() => setHighlightFileId(null)} />}
              {activeTab === 'Members' && (
                <div className="flex-1 flex flex-col min-h-0">
                  <MembersPanel group={activeGroup}
                    onGroupUpdate={(u) => { setActiveGroup(u); setGroups(prev => prev.map(g => g.id === u.id ? u : g)); }}
                    onLeft={handleLeft} onGroupDeleted={handleLeft}
                    onViewProfile={setProfileUserId} />
                </div>
              )}
            </>
          )}

          {showDM && sidebarTab !== 'settings' && (
            <DMPanel conversation={activeConvo} onNewMessage={() => {}} onViewProfile={setProfileUserId} />
          )}

          {sidebarTab === 'settings' && (
            <SettingsPanel />
          )}

          {!showGroup && !showDM && sidebarTab !== 'settings' && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center space-y-4 max-w-xs">
                <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center
                  bg-gradient-to-br from-brand-900/60 to-brand-800/30 border border-brand-700/30">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                    className="text-brand-400">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                  </svg>
                </div>
                <p className="dark:text-gray-300 text-gray-700 font-medium">
                  {sidebarTab === 'groups' ? 'Select a group' : 'Select a conversation'}
                </p>
                <p className="dark:text-gray-600 text-gray-400 text-sm">
                  {sidebarTab === 'groups'
                    ? 'Choose a group from the sidebar to start chatting'
                    : 'Search for someone by email to message them'}
                </p>
                {sidebarTab === 'groups' && groups.length === 0 && !loadingGroups && (
                  <button onClick={() => setShowModal(true)}
                    className="text-brand-400 hover:text-brand-300 text-sm transition font-medium">
                    Create or join your first group →
                  </button>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden flex-shrink-0 border-t
        dark:bg-surface-1 dark:border-brand-900/40 bg-white border-gray-200">
        <div className="flex pb-safe">
          <NavIcon icon="👥" label="Groups"
            active={sidebarTab === 'groups' && mobileView === 'sidebar'}
            onClick={() => { setSidebarTab('groups'); setMobileView('sidebar'); }} />
          <NavIcon icon="💬" label="Messages"
            active={sidebarTab === 'dms' && mobileView === 'sidebar'}
            onClick={() => { setSidebarTab('dms'); setMobileView('sidebar'); }} />
          {(showGroup || showDM) && (
            <NavIcon icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>} label="Open" active={mobileView === 'main'}
              onClick={() => setMobileView('main')} />
          )}
        </div>
      </nav>

      {showModal && <GroupModal onClose={() => setShowModal(false)} onSuccess={handleGroupAdded} />}
      {profileUserId && <ProfileModal userId={profileUserId} onClose={() => setProfileUserId(null)} />}
      <KickNotification notice={kickNotice} onDismiss={() => setKickNotice(null)} />
    </div>
    </NotificationProvider>
  );
}
