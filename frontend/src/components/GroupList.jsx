import { useAuth } from '../context/AuthContext';

export default function GroupList({ groups, activeGroupId, onSelect, onOpenModal, loading }) {
  const { user } = useAuth();

  const initials = (name) => name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="flex flex-col h-full bg-gray-950 border-r border-gray-800">

      {/* User info */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
            {initials(user?.name)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Group list */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex flex-col gap-2 p-2">
            {[1,2,3].map(i => (
              <div key={i} className="h-14 bg-gray-800 rounded-lg animate-pulse"/>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center text-gray-600 text-sm p-6">
            No groups yet
          </div>
        ) : (
          groups.map(group => (
            <button key={group.id}
              onClick={() => onSelect(group)}
              className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 transition
                ${activeGroupId === group.id
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:bg-gray-900 hover:text-white'}`}>
              <p className="text-sm font-medium truncate">{group.name}</p>
              <p className="text-xs text-gray-600 mt-0.5 truncate">
                {group.subject} · {group.my_role}
              </p>
            </button>
          ))
        )}
      </div>

      {/* Create / Join button */}
      <div className="p-3 border-t border-gray-800">
        <button onClick={onOpenModal}
          className="w-full py-2 rounded-lg border border-dashed border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300 text-sm transition">
          + Create or join a group
        </button>
      </div>
    </div>
  );
}