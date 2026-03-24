import { useAuth } from '../context/AuthContext';

export default function GroupList({ groups, activeGroupId, onSelect, onOpenModal, loading }) {
  const { user } = useAuth();
  const initials = (name) => name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  const roleColor = (role) => {
    if (role === 'admin')   return 'text-neon-yellow';
    if (role === 'teacher') return 'text-neon-cyan';
    return 'dark:text-gray-500 text-gray-400';
  };

  return (
    <div className="flex flex-col h-full">
      {/* User info */}
      <div className="px-4 py-3 border-b dark:border-brand-900/30 border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800
            flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-neon-purple">
            {initials(user?.name)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold dark:text-white text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs dark:text-gray-500 text-gray-400 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {loading ? (
          Array.from({length: 4}).map((_, i) => (
            <div key={i} className="h-14 rounded-xl animate-pulse dark:bg-surface-3 bg-gray-100"/>
          ))
        ) : groups.length === 0 ? (
          <div className="text-center dark:text-gray-600 text-gray-400 text-sm p-8">
            No groups yet
          </div>
        ) : (
          groups.map(group => {
            const active = activeGroupId === group.id;
            return (
              <button key={group.id} onClick={() => onSelect(group)}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition
                  ${active
                    ? 'dark:bg-brand-900/60 dark:border dark:border-brand-700/40 bg-brand-50 border border-brand-200'
                    : 'dark:hover:bg-surface-3 hover:bg-gray-50'}`}>
                <p className={`text-sm font-medium truncate ${active ? 'dark:text-brand-300 text-brand-700' : 'dark:text-gray-200 text-gray-800'}`}>
                  {group.name}
                </p>
                <p className={`text-xs mt-0.5 truncate ${roleColor(group.my_role)}`}>
                  {group.subject} · {group.my_role}
                </p>
              </button>
            );
          })
        )}
      </div>

      {/* Create/join */}
      <div className="p-3 border-t dark:border-brand-900/30 border-gray-100 flex-shrink-0">
        <button onClick={onOpenModal}
          className="w-full py-2.5 rounded-xl border border-dashed text-sm font-medium transition
            dark:border-brand-800/60 dark:text-brand-400/70 dark:hover:border-brand-600 dark:hover:text-brand-300
            border-brand-200 text-brand-500 hover:border-brand-400 hover:text-brand-600">
          + Create or join a group
        </button>
      </div>
    </div>
  );
}
