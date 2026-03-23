import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { groupsAPI } from '../services/api';
import GroupList   from '../components/GroupList';
import ChatPanel   from '../components/ChatPanel';
import ChatHeader  from '../components/ChatHeader';
import GroupModal  from '../components/GroupModal';
import FilesPanel   from '../components/FilesPanel';
import MembersPanel from '../components/MembersPanel';

export default function DashboardPage() {
  const { logout } = useAuth();
  const [groups, setGroups]           = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [activeTab, setActiveTab]     = useState('Chat');
  const [showModal, setShowModal]     = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(true);

  useEffect(() => {
    groupsAPI.list()
      .then(res => {
        setGroups(res.data);
        if (res.data.length > 0) setActiveGroup(res.data[0]);
      })
      .catch(console.error)
      .finally(() => setLoadingGroups(false));
  }, []);

  const handleGroupAdded = (group) => {
    setGroups(prev => {
      const exists = prev.find(g => g.id === group.id);
      if (exists) return prev;
      return [group, ...prev];
    });
    setActiveGroup(group);
  };

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
              {activeTab === 'Chat' && <ChatPanel group={activeGroup} />}
                {activeTab === 'Files' && <FilesPanel group={activeGroup} />}
                {activeTab === 'Members' && (
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
    </div>
  );
}


