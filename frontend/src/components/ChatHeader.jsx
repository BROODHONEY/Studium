import { useAuth } from '../context/AuthContext';

export default function ChatHeader({ group, activeTab, onTabChange }) {
  const { user } = useAuth();
  const tabs = ['Chat', 'Files', 'Members'];

  return (
    <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-white truncate">{group.name}</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          {group.subject}
          {user?.role === 'teacher' && (
            <span className="ml-2 text-gray-600">· code: <span className="font-mono text-indigo-400">{group.invite_code}</span></span>
          )}
        </p>
      </div>

      <div className="flex gap-1 ml-4 flex-shrink-0">
        {tabs.map(tab => (
          <button key={tab} onClick={() => onTabChange(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition
              ${activeTab === tab
                ? 'bg-gray-800 text-white'
                : 'text-gray-500 hover:text-gray-300'}`}>
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}