import { useAuth } from '../context/AuthContext';

export default function ChatHeader({ group, activeTab, onTabChange }) {
  const { user } = useAuth();
  const tabs = ['Overview', 'Chat', 'Files', 'Members'];

  return (
    <div className="px-5 py-3 border-b dark:border-brand-900/40 border-gray-200 flex items-center justify-between flex-shrink-0 dark:bg-surface-1 bg-white">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold dark:text-white text-gray-900 truncate">{group.name}</h2>
        <p className="text-xs dark:text-gray-500 text-gray-500 mt-0.5">
          {group.subject}
          {user?.role === 'teacher' && (
            <span className="ml-2 dark:text-gray-600 text-gray-400">
              · code: <span className="font-mono text-brand-500">{group.invite_code}</span>
            </span>
          )}
        </p>
      </div>

      <div className="flex gap-1 ml-4 flex-shrink-0">
        {tabs.map(tab => (
          <button key={tab} onClick={() => onTabChange(tab)}
            className={activeTab === tab ? 'tab-btn-active' : 'tab-btn-inactive'}>
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}
