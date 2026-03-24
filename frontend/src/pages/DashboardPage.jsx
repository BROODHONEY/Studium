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
import KickNotification from '../components/KickNotification';
import { NotificationProvider } from '../context/NotificationContext';

export default function DashboardPage() {
  const { logout, user } = useAuth();
  const { socket } = useSocket();

  // Sidebar tab
  const [sidebarTab, setSidebarTab] = useState('groups');

  // Groups state
  const [groups, setGroups]               = useState([]);
  const [activeGroup, setActiveGroup]     = useState(null);
  const [activeTab, setActiveTab]         = useState('Overview');
  const [showModal, setShowModal]         = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [kickNotice, setKickNotice]       = useState(null);

  // DMs state
  const [activeConvo, setActiveConvo] = useState(null);

  useEffect(() => {
    groupsAPI.list()
      .then(res => setGroups(res.data))
      .catch(console.error)
      .finally(() => setLoadingGroups(false));
  }, []);

  const handleSelectGroup = (group) => {
    setActiveGroup(group);
    setActiveConvo(null);
    setActiveTab('Overview');
  };

  const handleSelectConvo = (convo) => {
    setActiveConvo(convo);
    setActiveGroup(null);
  };

  const handleGroupAdded = async (group) => {
    // Fetch full group details (includes my_role, admins_only, etc.)
    let fullGroup = group;
    try {
      const res = await groupsAPI.get(group.id);
      fullGroup = { ...res.data, my_role: res.data.my_role ?? group.my_role };
    } catch {
      // fall back to the partial object if fetch fails
    }
    setGroups(prev => {
      if (prev.find(g => g.id === fullGroup.id)) return prev;
      return [fullGroup, ...prev];
    });
    setActiveGroup(fullGroup);
    setActiveConvo(null);
    setActiveTab('Overview');
    setSidebarTab('groups');
  };

  const handleLeft = (groupId) => {
    setGroups(prev => prev.filter(g => g.id !== groupId));
    setActiveGroup(prev => prev?.id === groupId ? null : prev);
  };

  const handleKicked = (groupId, groupName) => {
    setGroups(prev => prev.filter(g => g.id !== groupId));
    setActiveGroup(prev => prev?.id === groupId ? null : prev);
    setKickNotice({ groupName });
  };

  const handleNewDMMessage = () => { //conversationId, message
    // If the active convo is this one, unread stays 0
    // Otherwise the DMList handles its own unread count internally
  };

  // Stable ref so the socket listener never captures stale state
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
    <NotificationProvider activeGroupId={activeGroup?.id}>
    <div className="h-screen flex flex-col bg-gray-950">

      {/* Top nav */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800 flex-shrink-0">
        <span className="text-sm font-semibold text-white">Studi+</span>
        <button onClick={logout}
          className="text-xs text-gray-600 hover:text-red-400 transition">
          Sign out
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0">

        {/* Sidebar */}
        <div className="w-64 flex-shrink-0 min-h-0 h-full flex flex-col border-r border-gray-800">

          {/* Sidebar tab switcher */}
          <div className="flex p-2 gap-1 border-b border-gray-800 flex-shrink-0">
            <button onClick={() => setSidebarTab('groups')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition
                ${sidebarTab === 'groups'
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-500 hover:text-gray-300'}`}>
              Groups
            </button>
            <button onClick={() => setSidebarTab('dms')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition
                ${sidebarTab === 'dms'
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-500 hover:text-gray-300'}`}>
              Messages
            </button>
          </div>

          {/* Sidebar content */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {sidebarTab === 'groups' ? (
              <GroupList
                groups={groups}
                activeGroupId={activeGroup?.id}
                onSelect={handleSelectGroup}
                onOpenModal={() => setShowModal(true)}
                loading={loadingGroups}
              />
            ) : (
              <DMList
                activeConvoId={activeConvo?.id}
                onSelect={handleSelectConvo}
              />
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Group view — preserves all your existing tabs */}
          {showGroup && (
            <>
              <ChatHeader
                group={activeGroup}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
              {activeTab === 'Overview' && (
                <GroupOverview group={activeGroup} />
              )}
              {activeTab === 'Chat' && (
                <div className="flex-1 min-h-0">
                  <ChatPanel group={activeGroup} />
                </div>
              )}
              {activeTab === 'Files' && (
                <FilesPanel group={activeGroup} />
              )}
              {activeTab === 'Members' && (
                <div className="flex-1 flex flex-col min-h-0">
                  <MembersPanel
                    group={activeGroup}
                    onGroupUpdate={(updated) => {
                      setActiveGroup(updated);
                      setGroups(prev => prev.map(g => g.id === updated.id ? updated : g));
                    }}
                    onLeft={handleLeft}
                    onGroupDeleted={handleLeft}
                  />
                </div>
              )}
            </>
          )}

          {/* DM view */}
          {showDM && (
            <DMPanel
              conversation={activeConvo}
              onNewMessage={handleNewDMMessage}
            />
          )}

          {/* Empty state */}
          {!showGroup && !showDM && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-gray-900 border border-gray-800
                  flex items-center justify-center mx-auto">
                  {sidebarTab === 'groups' ? (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                      stroke="#4b5563" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                    </svg>
                  ) : (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                      stroke="#4b5563" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                      <path d="M8 10h8M8 14h5"/>
                    </svg>
                  )}
                </div>
                <p className="text-gray-500 text-sm">
                  {sidebarTab === 'groups'
                    ? 'Select a group to get started'
                    : 'Search for someone to message'}
                </p>
                {sidebarTab === 'groups' && groups.length === 0 && !loadingGroups && (
                  <button onClick={() => setShowModal(true)}
                    className="text-indigo-400 hover:text-indigo-300 text-sm transition">
                    Create or join your first group →
                  </button>
                )}
                {sidebarTab === 'dms' && (
                  <button onClick={() => setSidebarTab('dms')}
                    className="text-indigo-400 hover:text-indigo-300 text-sm transition">
                    Search by email in the sidebar →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <GroupModal
          onClose={() => setShowModal(false)}
          onSuccess={handleGroupAdded}
        />
      )}

      <KickNotification notice={kickNotice} onDismiss={() => setKickNotice(null)} />
    </div>
    </NotificationProvider>
  );
}