import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { groupsAPI } from '../services/api';
import GroupList   from '../components/GroupList';
import ChatPanel   from '../components/ChatPanel';
import ChatHeader  from '../components/ChatHeader';
import GroupModal  from '../components/GroupModal';
import FilesPanel   from '../components/FilesPanel';
import MembersPanel from '../components/MembersPanel';
import KickNotification from '../components/KickNotification';

export default function DashboardPage() {
  const { logout, user } = useAuth();
  const { socket } = useSocket();
  const [groups, setGroups]           = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [activeTab, setActiveTab]     = useState('Chat');
  const [showModal, setShowModal]     = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [kickNotice, setKickNotice]   = useState(null); // { groupName }

  // Track joined rooms to prevent duplicate join events
  const joinedRoomsRef = useRef(new Set());
  const previousGroupRef = useRef(null);

  useEffect(() => {
    groupsAPI.list()
      .then(res => {
        setGroups(res.data);
        if (res.data.length > 0) setActiveGroup(res.data[0]);
      })
      .catch(console.error)
      .finally(() => setLoadingGroups(false));
  }, []);

  // Handle socket room joining/leaving when active group changes
  useEffect(() => {
    if (!activeGroup || !socket) return;

    // Join the new group room if not already joined
    if (!joinedRoomsRef.current.has(activeGroup.id)) {
      socket.emit('join_group', activeGroup.id);
      joinedRoomsRef.current.add(activeGroup.id);
    }
  }, [activeGroup?.id, socket]);

  // Handle leaving rooms when switching groups or unmounting
  useEffect(() => {
    const prevId = previousGroupRef.current;
    previousGroupRef.current = activeGroup?.id;

    // Leave the previous room when switching groups
    if (prevId && socket && prevId !== activeGroup?.id) {
      socket.emit('leave_group', prevId);
      joinedRoomsRef.current.delete(prevId);
    }

    // Cleanup function to leave all rooms when component unmounts
    return () => {
      if (socket) {
        joinedRoomsRef.current.forEach(groupId => {
          socket.emit('leave_group', groupId);
        });
        joinedRoomsRef.current.clear();
      }
    };
  }, [activeGroup?.id, socket]);

  const handleGroupAdded = (group) => {
    setGroups(prev => {
      const exists = prev.find(g => g.id === group.id);
      if (exists) return prev;
      return [group, ...prev];
    });
    setActiveGroup(group);
  };

  const handleKicked = (groupId, groupName) => {
    setGroups(prev => prev.filter(g => g.id !== groupId));
    setActiveGroup(prev => prev?.id === groupId ? null : prev);
    setKickNotice({ groupName });
  };

  const handleLeft = (groupId) => {
    setGroups(prev => prev.filter(g => g.id !== groupId));
    setActiveGroup(prev => prev?.id === groupId ? null : prev);
  };

  // Keep a stable ref to handleKicked so the socket listener never goes stale
  const handleKickedRef = useRef(handleKicked);
  useEffect(() => { handleKickedRef.current = handleKicked; });

  // Listen for kick events at the top level so it works regardless of active tab
  useEffect(() => {
    if (!socket) return;
    const onKicked = ({ kickedUserId, groupId, groupName }) => {
      if (kickedUserId === user?.id) {
        handleKickedRef.current(groupId, groupName);
      }
    };
    socket.on('member_kicked', onKicked);
    return () => socket.off('member_kicked', onKicked);
  }, [socket, user?.id]);

  return (
    <div className="h-screen flex flex-col bg-gray-950">

      {/* Top nav */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800 flex-shrink-0">
        <span className="text-sm font-semibold text-white">Studium</span>
        <button onClick={logout}
          className="text-xs text-gray-600 hover:text-red-400 transition">
          Sign out
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0">

        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <GroupList
            groups={groups}
            activeGroupId={activeGroup?.id}
            onSelect={g => { setActiveGroup(g); setActiveTab('Chat'); }}
            onOpenModal={() => setShowModal(true)}
            loading={loadingGroups}
          />
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {activeGroup ? (
            <>
              <ChatHeader
                group={activeGroup}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
                {activeTab === 'Chat' && (
                  <ChatPanel group={activeGroup} />
                )}
                {activeTab === 'Files' && <FilesPanel group={activeGroup} />}
                {activeTab === 'Members' && (
                    <MembersPanel
                        group={activeGroup}
                        onGroupUpdate={(updated) => {
                            setActiveGroup(updated);
                            setGroups(prev => prev.map(g => g.id === updated.id ? updated : g));
                            }}
                        onLeft={handleLeft}
                        />
                    )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-500 text-sm mb-3">No groups yet</p>
                <button onClick={() => setShowModal(true)}
                  className="text-indigo-400 hover:text-indigo-300 text-sm transition">
                  Create or join your first group →
                </button>
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
  );
}


