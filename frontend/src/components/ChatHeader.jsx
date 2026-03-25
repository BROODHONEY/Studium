import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ChatHeader({ group, activeTab, onTabChange }) {
  const { user } = useAuth();
  const tabs = ['Overview', 'Chat', 'Dues', 'Files', 'Members'];
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  const handleSelect = (tab) => { onTabChange(tab); setDropdownOpen(false); };

  return (
    <div className="px-4 py-3 border-b dark:border-brand-900/40 border-gray-200 flex items-center justify-between flex-shrink-0 dark:bg-surface-1 bg-white gap-3">
      {/* Group info */}
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-semibold dark:text-white text-gray-900 truncate">{group.name}</h2>
        <p className="text-xs dark:text-gray-500 text-gray-500 mt-0.5 truncate">
          {group.subject}
          {user?.role === 'teacher' && (
            <span className="ml-2 dark:text-gray-600 text-gray-400">
              · code: <span className="font-mono text-brand-500">{group.invite_code}</span>
            </span>
          )}
        </p>
      </div>

      {/* Desktop tabs */}
      <div className="hidden sm:flex gap-1 flex-shrink-0">
        {tabs.map(tab => (
          <button key={tab} onClick={() => onTabChange(tab)}
            className={activeTab === tab ? 'tab-btn-active' : 'tab-btn-inactive'}>
            {tab}
          </button>
        ))}
      </div>

      {/* Mobile dropdown */}
      <div className="sm:hidden relative flex-shrink-0" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition
            bg-gradient-to-r from-brand-700 to-brand-600 border-brand-500 text-white shadow-neon-purple">
          {activeTab}
          <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"
            className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}>
            <path d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
          </svg>
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-1 w-36 z-50
            dark:bg-gray-900 bg-white border dark:border-gray-700 border-gray-200
            rounded-xl shadow-2xl overflow-hidden">
            {tabs.map(tab => (
              <button key={tab} onClick={() => handleSelect(tab)}
                className={`w-full text-left px-4 py-2.5 text-sm transition
                  ${activeTab === tab
                    ? 'bg-brand-600/20 text-brand-300 font-medium'
                    : 'dark:text-gray-300 text-gray-700 dark:hover:bg-gray-800 hover:bg-gray-50'}`}>
                {tab}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
