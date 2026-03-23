import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { groupsAPI } from '../services/api';
import GroupList     from '../components/GroupList';
import ChatPanel     from '../components/ChatPanel';
import ChatHeader    from '../components/ChatHeader';
import GroupModal    from '../components/GroupModal';
import FilesPanel    from '../components/FilesPanel';
import MembersPanel  from '../components/MembersPanel';
import GroupOverview from '../components/GroupOverview';
import KickNotification from '../components/KickNotification';

export default function DashboardPage() {
  const { logout } = useAuth();
  const [groups, setGroups]           = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);  // ← null by default
  const [activeTab, setActiveTab]     = useState('Overview');
  const [showModal, setShowModal]     = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(true);

  useEffect(() => {
    groupsAPI.list()
      .then(res => {
        setGroups(res.data);
        // ← no auto-select here
      })
      .catch(console.error)
      .finally(() => setLoadingGroups(false));
  }, []);

  const handleSelectGroup = (group) => {
    setActiveGroup(group);
    setActiveTab('Overview'); // always land on Overview when clicking a group
  };

  const handleGroupAdded = (group) => {
    setGroups(prev => {
      if (prev.find(g => g.id === group.id)) return prev;
      return [group, ...prev];
    });
    setActiveGroup(group);
    setActiveTab('Overview');
  };

  const handleKicked = (groupId) => {
    setGroups(prev => prev.filter(g => g.id !== groupId));
    setActiveGroup(prev => prev?.id === groupId ? null : prev);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-950">

      {/* Top nav */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800 flex-shrink-0">
        <span className="text-sm font-semibold text-white">Acadex</span>
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
            onSelect={handleSelectGroup}
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
              {activeTab === 'Overview' && <GroupOverview group={activeGroup} />}
              {activeTab === 'Chat'     && <ChatPanel group={activeGroup} onKicked={handleKicked} />}
              {activeTab === 'Files'    && <FilesPanel group={activeGroup} />}
              {activeTab === 'Members'  && (
                <MembersPanel
                  group={activeGroup}
                  onGroupUpdate={(updated) => {
                    setActiveGroup(updated);
                    setGroups(prev => prev.map(g => g.id === updated.id ? updated : g));
                  }}
                />
              )}
            </>
          ) : (
            /* Empty state when no group is selected */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-gray-900 border border-gray-800
                  flex items-center justify-center mx-auto">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                    stroke="#4b5563" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">Select a group to get started</p>
                {groups.length === 0 && !loadingGroups && (
                  <button onClick={() => setShowModal(true)}
                    className="text-indigo-400 hover:text-indigo-300 text-sm transition">
                    Create or join your first group →
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

      <KickNotification />
    </div>
  );
}