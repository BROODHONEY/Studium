import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';

// ── Persistence ────────────────────────────────────────
const storageKey = (uid) => `group_folders_${uid}`;
const loadFolders = (uid) => { try { return JSON.parse(localStorage.getItem(storageKey(uid))) || []; } catch { return []; } };
const saveFolders = (uid, f) => localStorage.setItem(storageKey(uid), JSON.stringify(f));

const loadPrefs = (uid, key) => {
  try {
    return JSON.parse(localStorage.getItem(`${key}_${uid}`)) || (key.includes('color') || key.includes('label') ? {} : []);
  } catch {
    return key.includes('color') || key.includes('label') ? {} : [];
  }
};
const savePrefs = (uid, key, val) => localStorage.setItem(`${key}_${uid}`, JSON.stringify(val));

// ── Color options ──────────────────────────────────────
const COLORS = {
  purple: { label: 'Purple', border: 'border-l-purple-500', dot: 'bg-purple-500', accent: 'bg-purple-500' },
  blue:   { label: 'Blue',   border: 'border-l-blue-500',   dot: 'bg-blue-500',   accent: 'bg-blue-500' },
  green:  { label: 'Green',  border: 'border-l-green-500',  dot: 'bg-green-500',  accent: 'bg-green-500' },
  amber:  { label: 'Amber',  border: 'border-l-amber-500',  dot: 'bg-amber-500',  accent: 'bg-amber-500' },
  red:    { label: 'Red',    border: 'border-l-red-500',    dot: 'bg-red-500',    accent: 'bg-red-500' },
  teal:   { label: 'Teal',   border: 'border-l-teal-500',   dot: 'bg-teal-500',   accent: 'bg-teal-500' },
};

const DEFAULT_ACCENTS = ['bg-brand-500', 'bg-teal-500', 'bg-purple-500', 'bg-amber-500', 'bg-pink-500', 'bg-green-500'];

// ── Helpers ────────────────────────────────────────────
const initials = (n) => n?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
const roleColor = (r) => r === 'admin' ? 'text-neon-yellow' : r === 'teacher' ? 'text-neon-cyan' : 'dark:text-gray-500 text-gray-400';

// ── GroupItem ──────────────────────────────────────────
function GroupItem({ group, active, onSelect, onLongPress, onDragStart, onDragOver, onDrop, dragging, pinned, color, label, isArchived, noColorBorder }) {
  const pressTimer = useRef(null);

  const handleTouchStart = (e) => {
    pressTimer.current = setTimeout(() => {
      const touch = e.touches[0];
      onLongPress(group.id, touch.clientX, touch.clientY);
    }, 500);
  };
  const cancelPress = () => clearTimeout(pressTimer.current);

  const colorBorder = (!noColorBorder && color && COLORS[color]) ? `border-l-2 ${COLORS[color].border}` : '';

  return (
    <button
      draggable
      onDragStart={onDragStart}
      onDragOver={e => { e.preventDefault(); onDragOver(); }}
      onDrop={onDrop}
      onTouchStart={handleTouchStart}
      onTouchEnd={cancelPress}
      onTouchMove={cancelPress}
      onContextMenu={e => { e.preventDefault(); onLongPress(group.id, e.clientX, e.clientY); }}
      onClick={() => onSelect(group)}
      className={`w-full text-left px-3 py-2.5 transition select-none
        ${colorBorder}
        ${isArchived ? 'opacity-50' : ''}
        ${dragging ? 'opacity-40' : ''}
        ${noColorBorder ? 'rounded-none' : 'rounded-xl'}
        ${active
          ? 'dark:bg-brand-900/60 dark:border dark:border-brand-700/40 bg-brand-50 border border-brand-200'
          : 'dark:hover:bg-surface-3 hover:bg-gray-50'}`}>
      <div className="flex items-center gap-1.5 min-w-0">
        {pinned && (
          <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" className="flex-shrink-0 dark:text-brand-400 text-brand-500">
            <path d="M4.146.146A.5.5 0 0 1 4.5 0h7a.5.5 0 0 1 .5.5c0 .68-.342 1.174-.646 1.479-.126.125-.25.224-.354.298v4.431l.078.048c.203.127.476.314.751.555C12.36 7.775 13 8.527 13 9.5a.5.5 0 0 1-.5.5h-4v4.5c0 .276-.224 1.5-.5 1.5s-.5-1.224-.5-1.5V10h-4a.5.5 0 0 1-.5-.5c0-.973.64-1.725 1.17-2.189A5.921 5.921 0 0 1 5 6.708V2.277a2.77 2.77 0 0 1-.354-.298C4.342 1.674 4 1.179 4 .5a.5.5 0 0 1 .146-.354z"/>
          </svg>
        )}
        {isArchived && (
          <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" className="flex-shrink-0 dark:text-gray-500 text-gray-400">
            <path d="M0 2a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1v7.5a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 1 12.5V5a1 1 0 0 1-1-1V2zm2 3v7.5A1.5 1.5 0 0 0 3.5 14h9a1.5 1.5 0 0 0 1.5-1.5V5H2zm13-3H1v2h14V2zM5 7.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z"/>
          </svg>
        )}
        <p className={`text-sm font-medium truncate flex-1 ${active ? 'dark:text-brand-300 text-brand-700' : 'dark:text-gray-200 text-gray-800'}`}>
          {group.name}
        </p>
        {label && (
          <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-md dark:bg-surface-3 bg-gray-100 dark:text-gray-400 text-gray-500 font-medium">
            {label}
          </span>
        )}
      </div>
      <p className={`text-xs mt-0.5 truncate ${roleColor(group.my_role)}`}>
        {group.subject} · {group.my_role}
      </p>
    </button>
  );
}

// ── Main ───────────────────────────────────────────────
export default function GroupList({ groups, activeGroupId, onSelect, onOpenModal, loading }) {
  const { user } = useAuth();

  const [folders, setFolders]         = useState([]);
  const [collapsed, setCollapsed]     = useState({});
  const [dragGroupId, setDragGroupId] = useState(null);
  const [dragFolderId, setDragFolderId] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [fabOpen, setFabOpen]         = useState(false);
  const [folderModal, setFolderModal] = useState(false);
  const [folderName, setFolderName]   = useState('');
  const [folderPickTarget, setFolderPickTarget] = useState(null);
  const [folderMenu, setFolderMenu]   = useState(null);
  const [folderMenuPos, setFolderMenuPos] = useState({ x: 0, y: 0 });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [renamingId, setRenamingId]   = useState(null);
  const [renameVal, setRenameVal]     = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // New prefs state
  const [pins, setPins]               = useState([]);
  const [colors, setColors]           = useState({});
  const [folderColors, setFolderColors] = useState({});
  const [labels, setLabels]           = useState({});
  const [archived, setArchived]       = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  // colorPickTarget: { id, type: 'group'|'folder' }
  const [colorPickTarget, setColorPickTarget] = useState(null);
  const [labelPickTarget, setLabelPickTarget] = useState(null);
  const [labelInput, setLabelInput]   = useState('');

  const contextRef  = useRef(null);
  const folderInput = useRef(null);

  useEffect(() => {
    if (!user?.id) return;
    setFolders(loadFolders(user.id));
    setPins(loadPrefs(user.id, 'group_pins'));
    setColors(loadPrefs(user.id, 'group_colors'));
    setFolderColors(loadPrefs(user.id, 'folder_colors'));
    setLabels(loadPrefs(user.id, 'group_labels'));
    setArchived(loadPrefs(user.id, 'group_archived'));
  }, [user?.id]);

  const persist = useCallback((next) => {
    setFolders(next);
    if (user?.id) saveFolders(user.id, next);
  }, [user?.id]);

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return;
    const h = (e) => { if (contextRef.current && !contextRef.current.contains(e.target)) setContextMenu(null); };
    document.addEventListener('mousedown', h);
    document.addEventListener('touchstart', h);
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('touchstart', h); };
  }, [contextMenu]);

  useEffect(() => { if (folderModal) setTimeout(() => folderInput.current?.focus(), 50); }, [folderModal]);

  // ── Prefs helpers ──────────────────────────────────
  const togglePin = (groupId) => {
    const next = pins.includes(groupId) ? pins.filter(id => id !== groupId) : [...pins, groupId];
    setPins(next);
    savePrefs(user.id, 'group_pins', next);
  };

  const setColor = (colorKey) => {
    if (!colorPickTarget) return;
    const { id, type } = colorPickTarget;
    if (type === 'folder') {
      const next = colorKey
        ? { ...folderColors, [id]: colorKey }
        : Object.fromEntries(Object.entries(folderColors).filter(([k]) => k !== id));
      setFolderColors(next);
      savePrefs(user.id, 'folder_colors', next);
    } else {
      const next = colorKey
        ? { ...colors, [id]: colorKey }
        : Object.fromEntries(Object.entries(colors).filter(([k]) => k !== id));
      setColors(next);
      savePrefs(user.id, 'group_colors', next);
    }
    setColorPickTarget(null);
  };

  const setLabel = (groupId, label) => {
    const next = label
      ? { ...labels, [groupId]: label }
      : Object.fromEntries(Object.entries(labels).filter(([k]) => k !== groupId));
    setLabels(next);
    savePrefs(user.id, 'group_labels', next);
    setLabelPickTarget(null);
  };

  const toggleArchive = (groupId) => {
    const next = archived.includes(groupId) ? archived.filter(id => id !== groupId) : [...archived, groupId];
    setArchived(next);
    savePrefs(user.id, 'group_archived', next);
  };

  // ── Folder ops ─────────────────────────────────────
  const createFolder = () => {
    const name = folderName.trim();
    if (!name) return;
    persist([...folders, { id: Date.now().toString(), name, groupIds: [] }]);
    setFolderName(''); setFolderModal(false);
  };

  const deleteFolder = (id) => persist(folders.filter(f => f.id !== id));

  const moveToFolder = (groupId, folderId) => {
    const next = folders.map(f => ({ ...f, groupIds: f.groupIds.filter(id => id !== groupId) }));
    if (folderId) {
      const i = next.findIndex(f => f.id === folderId);
      if (i >= 0) next[i] = { ...next[i], groupIds: [...next[i].groupIds, groupId] };
    }
    persist(next);
    setContextMenu(null);
  };

  // ── Drag ───────────────────────────────────────────
  const handleDropOnFolder = (folderId) => {
    if (!dragGroupId) return;
    moveToFolder(dragGroupId, folderId);
    setDragGroupId(null); setDragFolderId(null);
  };

  const handleDropOnGroup = (targetId, folderId) => {
    if (!dragGroupId || dragGroupId === targetId) return;
    const next = folders.map(f => {
      if (f.id !== folderId) return f;
      const ids = f.groupIds.filter(id => id !== dragGroupId);
      const idx = ids.indexOf(targetId);
      ids.splice(idx >= 0 ? idx : ids.length, 0, dragGroupId);
      return { ...f, groupIds: ids };
    });
    persist(next);
    setDragGroupId(null); setDragFolderId(null);
  };

  // ── Derived ────────────────────────────────────────
  const groupMap    = Object.fromEntries(groups.map(g => [g.id, g]));
  const folderedIds = new Set(folders.flatMap(f => f.groupIds));
  const pinnedIds   = new Set(pins);
  const archivedIds = new Set(archived);

  const q = searchQuery.trim().toLowerCase();
  const matchesSearch = (g) => !q || g.name.toLowerCase().includes(q) || g.subject?.toLowerCase().includes(q);

  const pinnedGroups   = pins.map(id => groupMap[id]).filter(g => g && matchesSearch(g));
  const archivedGroups = archived.map(id => groupMap[id]).filter(g => g && matchesSearch(g));
  const ungrouped      = groups.filter(g => !folderedIds.has(g.id) && !pinnedIds.has(g.id) && !archivedIds.has(g.id) && matchesSearch(g));

  const handleLongPress = (groupId, x, y) => {
    const menuW = 190, menuH = 220;
    setContextMenu({
      groupId,
      x: Math.min(x, window.innerWidth  - menuW - 8),
      y: Math.min(y, window.innerHeight - menuH - 8),
    });
  };

  // Shared GroupItem props helper
  const itemProps = (group, inheritColor = null) => ({
    pinned: pinnedIds.has(group.id),
    color: colors[group.id] || inheritColor || null,
    label: labels[group.id] || null,
    isArchived: archivedIds.has(group.id),
  });

  return (
    <div className="flex flex-col h-full relative" onClick={() => { setContextMenu(null); setFabOpen(false); }}>

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

      {/* Search bar */}
      <div className="px-3 pt-3 pb-1 flex-shrink-0">
        <div className="flex items-center gap-2 dark:bg-surface-3 bg-gray-100 rounded-2xl px-3 py-2.5">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" className="dark:text-gray-500 text-gray-400 flex-shrink-0">
            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.099zm-5.242 1.656a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z"/>
          </svg>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="flex-1 bg-transparent text-sm dark:text-white text-gray-900 dark:placeholder-gray-500 placeholder-gray-400 outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="dark:text-gray-500 text-gray-400 dark:hover:text-gray-300 hover:text-gray-600 transition">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Group list */}
      <div className="flex-1 overflow-y-auto p-2 pb-20 space-y-1">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl animate-pulse dark:bg-surface-3 bg-gray-100"/>
          ))
        ) : (
          <>
            {/* ── Pinned section ── */}
            {pinnedGroups.length > 0 && (
              <div>
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" className="dark:text-brand-400/70 text-brand-500/70 flex-shrink-0">
                    <path d="M4.146.146A.5.5 0 0 1 4.5 0h7a.5.5 0 0 1 .5.5c0 .68-.342 1.174-.646 1.479-.126.125-.25.224-.354.298v4.431l.078.048c.203.127.476.314.751.555C12.36 7.775 13 8.527 13 9.5a.5.5 0 0 1-.5.5h-4v4.5c0 .276-.224 1.5-.5 1.5s-.5-1.224-.5-1.5V10h-4a.5.5 0 0 1-.5-.5c0-.973.64-1.725 1.17-2.189A5.921 5.921 0 0 1 5 6.708V2.277a2.77 2.77 0 0 1-.354-.298C4.342 1.674 4 1.179 4 .5a.5.5 0 0 1 .146-.354z"/>
                  </svg>
                  <span className="text-xs font-semibold dark:text-brand-400/70 text-brand-500/70 uppercase tracking-wider">Pinned</span>
                </div>
                <div className="space-y-0.5">
                  {pinnedGroups.map(group => (
                    <GroupItem key={group.id} group={group}
                      active={activeGroupId === group.id}
                      onSelect={onSelect}
                      dragging={dragGroupId === group.id}
                      onLongPress={handleLongPress}
                      onDragStart={() => setDragGroupId(group.id)}
                      onDragOver={() => {}}
                      onDrop={() => {}}
                      {...itemProps(group)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── Folders section ── */}
            {folders.length > 0 && (
              <div className="mb-1">
                {/* Section header */}
                <div className="flex items-center justify-between px-1 mb-2">
                  <span className="text-sm font-bold dark:text-white text-gray-900">Folders</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setFolderModal(true)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg dark:bg-surface-3 bg-gray-100 dark:text-gray-400 text-gray-500 dark:hover:bg-surface-4 hover:bg-gray-200 transition">
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => setCollapsed(p => {
                        const allCollapsed = folders.every(f => p[f.id]);
                        return Object.fromEntries(folders.map(f => [f.id, !allCollapsed]));
                      })}
                      className="w-7 h-7 flex items-center justify-center rounded-lg dark:bg-surface-3 bg-gray-100 dark:text-gray-400 text-gray-500 dark:hover:bg-surface-4 hover:bg-gray-200 transition">
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Folder cards */}
                <div className="space-y-2">
                  {folders.map((folder, fi) => {
                    const folderGroups = folder.groupIds
                      .map(id => groupMap[id])
                      .filter(g => g && !pinnedIds.has(g.id) && !archivedIds.has(g.id) && matchesSearch(g));
                    const isCollapsed = collapsed[folder.id];
                    const menuOpen    = folderMenu === folder.id;
                    const fColor = folderColors[folder.id];
                    const accent = fColor && COLORS[fColor] ? COLORS[fColor].accent : DEFAULT_ACCENTS[fi % DEFAULT_ACCENTS.length];

                    return (
                      <div key={folder.id}
                        onDragOver={e => { e.preventDefault(); setDragFolderId(folder.id); }}
                        onDragLeave={() => setDragFolderId(p => p === folder.id ? null : p)}
                        onDrop={e => { e.preventDefault(); handleDropOnFolder(folder.id); }}
                        className={`rounded-xl overflow-hidden transition ${dragFolderId === folder.id ? 'ring-2 ring-brand-500/60' : ''}`}>

                        {/* Folder card header */}
                        <div className={`flex items-stretch dark:bg-surface-2 bg-white border dark:border-surface-3/60 border-gray-200 rounded-xl overflow-hidden
                          ${!isCollapsed && folderGroups.length > 0 ? 'rounded-b-none border-b-0' : ''}`}
                          onClick={e => e.stopPropagation()}>
                          {/* Colored left accent bar */}
                          <div className={`w-1.5 flex-shrink-0 ${accent}`}/>

                          {/* Content */}
                          <button
                            onClick={() => setCollapsed(p => ({ ...p, [folder.id]: !p[folder.id] }))}
                            className="flex items-center gap-3 flex-1 min-w-0 px-3 py-3.5 text-left">
                            <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor"
                              className="flex-shrink-0 dark:text-gray-400 text-gray-500">
                              <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h2.764c.958 0 1.76.56 2.311 1.184C7.985 3.648 8.48 4 9 4h4.5A1.5 1.5 0 0 1 15 5.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5v-9z"/>
                            </svg>
                            {renamingId === folder.id ? (
                              <input autoFocus value={renameVal}
                                onChange={e => setRenameVal(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') { if (renameVal.trim()) persist(folders.map(f => f.id === folder.id ? { ...f, name: renameVal.trim() } : f)); setRenamingId(null); }
                                  if (e.key === 'Escape') setRenamingId(null);
                                }}
                                onBlur={() => { if (renameVal.trim()) persist(folders.map(f => f.id === folder.id ? { ...f, name: renameVal.trim() } : f)); setRenamingId(null); }}
                                onClick={e => e.stopPropagation()}
                                className="flex-1 min-w-0 bg-transparent text-sm font-semibold dark:text-white text-gray-900 outline-none border-b dark:border-brand-500 border-brand-400"
                              />
                            ) : (
                              <span className="text-sm font-semibold dark:text-white text-gray-900 truncate flex-1">
                                {folder.name}
                              </span>
                            )}
                          </button>

                          {/* Three-dot menu */}
                          <div className="relative flex-shrink-0 flex items-center pr-2">
                            <button onClick={e => {
                                e.stopPropagation();
                                if (menuOpen) { setFolderMenu(null); return; }
                                const r = e.currentTarget.getBoundingClientRect();
                                setFolderMenuPos({ x: r.right, y: r.bottom + 4 });
                                setFolderMenu(folder.id);
                              }}
                              className="p-1.5 rounded-lg dark:text-gray-500 text-gray-400 dark:hover:text-gray-300 hover:text-gray-600 dark:hover:bg-surface-3 hover:bg-gray-100 transition">
                              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
                              </svg>
                            </button>
                            {/* dropdown rendered via portal below */}
                          </div>
                        </div>

                        {/* Folder contents */}
                        {!isCollapsed && (
                          <div className="dark:bg-surface-2 bg-white border dark:border-surface-3/60 border-gray-200 border-t-0 rounded-b-xl overflow-hidden">
                            {folderGroups.length === 0
                              ? <p className="text-xs dark:text-gray-600 text-gray-400 px-4 py-3 italic">Empty — drag or move groups here</p>
                              : folderGroups.map(group => (
                                <div key={group.id} className="border-t dark:border-surface-3/40 border-gray-100 first:border-t-0">
                                  <GroupItem group={group}
                                    active={activeGroupId === group.id}
                                    onSelect={onSelect}
                                    dragging={dragGroupId === group.id}
                                    onLongPress={handleLongPress}
                                    onDragStart={() => setDragGroupId(group.id)}
                                    onDragOver={() => {}}
                                    onDrop={() => handleDropOnGroup(group.id, folder.id)}
                                    noColorBorder
                                    {...itemProps(group, folderColors[folder.id] || null)}
                                  />
                                </div>
                              ))
                            }
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Ungrouped / drop-to-remove zone ── */}
            <div
              onDragOver={e => { e.preventDefault(); setDragFolderId('__none__'); }}
              onDragLeave={() => setDragFolderId(p => p === '__none__' ? null : p)}
              onDrop={e => { e.preventDefault(); if (dragGroupId) { moveToFolder(dragGroupId, null); setDragGroupId(null); setDragFolderId(null); } }}
              className={`rounded-xl transition min-h-[4px] ${dragFolderId === '__none__' ? 'ring-1 ring-brand-500/50 dark:bg-brand-900/20 bg-brand-50' : ''}`}>
              {folders.length > 0 && ungrouped.length > 0 && (
                <p className="text-xs dark:text-gray-600 text-gray-400 px-3 py-1 uppercase tracking-wider">Other</p>
              )}
              {dragFolderId === '__none__' && ungrouped.length === 0 && (
                <p className="text-xs dark:text-gray-500 text-gray-400 px-3 py-2 italic text-center">Drop to remove from folder</p>
              )}
              <div className="space-y-0.5">
                {ungrouped.map(group => (
                  <GroupItem key={group.id} group={group}
                    active={activeGroupId === group.id}
                    onSelect={onSelect}
                    dragging={dragGroupId === group.id}
                    onLongPress={handleLongPress}
                    onDragStart={() => setDragGroupId(group.id)}
                    onDragOver={() => {}}
                    onDrop={() => {}}
                    {...itemProps(group)}
                  />
                ))}
              </div>
            </div>

            {/* ── Archived section ── */}
            {archivedGroups.length > 0 && (
              <div>
                <button
                  onClick={() => setShowArchived(v => !v)}
                  className="flex items-center gap-2 px-2 py-1.5 w-full group/arch">
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" className="flex-shrink-0 dark:text-gray-600 text-gray-400">
                    <path d="M0 2a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1v7.5a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 1 12.5V5a1 1 0 0 1-1-1V2zm2 3v7.5A1.5 1.5 0 0 0 3.5 14h9a1.5 1.5 0 0 0 1.5-1.5V5H2zm13-3H1v2h14V2zM5 7.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z"/>
                  </svg>
                  <span className="text-xs font-semibold dark:text-gray-600 text-gray-400 uppercase tracking-wider group-hover/arch:dark:text-gray-400 group-hover/arch:text-gray-500 transition">
                    Archived
                  </span>
                  <span className="text-xs dark:text-gray-700 text-gray-400 tabular-nums">{archivedGroups.length}</span>
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"
                    className={`flex-shrink-0 dark:text-gray-600 text-gray-400 transition-transform ml-auto ${showArchived ? '' : '-rotate-90'}`}>
                    <path d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
                  </svg>
                </button>
                {showArchived && (
                  <div className="space-y-0.5">
                    {archivedGroups.map(group => (
                      <GroupItem key={group.id} group={group}
                        active={activeGroupId === group.id}
                        onSelect={onSelect}
                        dragging={dragGroupId === group.id}
                        onLongPress={handleLongPress}
                        onDragStart={() => setDragGroupId(group.id)}
                        onDragOver={() => {}}
                        onDrop={() => {}}
                        {...itemProps(group)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {groups.length === 0 && !loading && (
              <div className="text-center dark:text-gray-600 text-gray-400 text-sm p-8">No groups yet</div>
            )}
          </>
        )}
      </div>

      {/* FAB */}
      <div className="absolute bottom-4 right-3 flex flex-col items-end gap-2 z-20"
        onClick={e => e.stopPropagation()}>
        {fabOpen && (
          <div className="flex flex-col items-end gap-2">
            <button onClick={() => { setFabOpen(false); setFolderModal(true); }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg text-xs font-medium
                dark:bg-surface-2 bg-white dark:border-brand-900/40 border-gray-200 border
                dark:text-gray-300 text-gray-700 dark:hover:bg-surface-3 hover:bg-gray-50 transition whitespace-nowrap">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" className="dark:text-gray-400 text-gray-500">
                <path d="M.54 3.87.5 3a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3h3.982a2 2 0 0 1 1.992 2.181l-.637 7A2 2 0 0 1 13.174 14H2.826a2 2 0 0 1-1.991-1.819l-.637-7a1.99 1.99 0 0 1 .342-1.31zM2.19 4a1 1 0 0 0-.996 1.09l.637 7a1 1 0 0 0 .995.91h10.348a1 1 0 0 0 .995-.91l.637-7A1 1 0 0 0 13.81 4H2.19zm4.69-1.707A1 1 0 0 0 6.172 2H2.5a1 1 0 0 0-1 .981l.006.139C1.72 3.042 1.95 3 2.19 3h5.396l-.707-.707z"/>
              </svg>
              New folder
            </button>
            <button onClick={() => { setFabOpen(false); onOpenModal(); }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg text-xs font-medium
                dark:bg-surface-2 bg-white dark:border-brand-900/40 border-gray-200 border
                dark:text-gray-300 text-gray-700 dark:hover:bg-surface-3 hover:bg-gray-50 transition whitespace-nowrap">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" className="text-brand-400">
                <path d="M1 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                <path fillRule="evenodd" d="M13.5 5a.5.5 0 0 1 .5.5V7h1.5a.5.5 0 0 1 0 1H14v1.5a.5.5 0 0 1-1 0V8h-1.5a.5.5 0 0 1 0-1H13V5.5a.5.5 0 0 1 .5-.5z"/>
              </svg>
              Join / create group
            </button>
          </div>
        )}
        <button onClick={() => setFabOpen(v => !v)}
          className={`w-11 h-11 rounded-full shadow-lg flex items-center justify-center transition
            bg-gradient-to-br from-brand-600 to-brand-700 text-white shadow-neon-purple
            ${fabOpen ? 'rotate-45' : ''}`}>
          <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z"/>
          </svg>
        </button>
      </div>

      {/* New folder modal */}
      {folderModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-4 pb-6 sm:pb-0"
          onClick={() => { setFolderModal(false); setFolderName(''); }}>
          <div className="w-full max-w-sm dark:bg-surface-1 bg-white rounded-2xl shadow-2xl p-5 space-y-4"
            onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold dark:text-white text-gray-900">New folder</h3>
            <input
              ref={folderInput}
              value={folderName}
              onChange={e => setFolderName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') createFolder(); if (e.key === 'Escape') { setFolderModal(false); setFolderName(''); } }}
              placeholder="e.g. Semester 3, Electives…"
              className="w-full form-input"
            />
            <div className="flex gap-2">
              <button onClick={createFolder} disabled={!folderName.trim()}
                className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition">
                Create
              </button>
              <button onClick={() => { setFolderModal(false); setFolderName(''); }}
                className="flex-1 py-2.5 dark:bg-surface-3 bg-gray-100 dark:text-gray-300 text-gray-700 text-sm rounded-xl transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete folder confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-4 pb-6 sm:pb-0"
          onClick={() => setDeleteConfirm(null)}>
          <div className="w-full max-w-xs dark:bg-surface-1 bg-white rounded-2xl shadow-2xl p-5 space-y-4"
            onClick={e => e.stopPropagation()}>
            <div>
              <p className="text-sm font-semibold dark:text-white text-gray-900">Delete folder?</p>
              <p className="text-xs dark:text-gray-500 text-gray-500 mt-1">
                Groups inside will be moved back to the main list.
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { deleteFolder(deleteConfirm); setDeleteConfirm(null); }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-xl transition">
                Delete
              </button>
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 dark:bg-surface-3 bg-gray-100 dark:text-gray-300 text-gray-700 text-sm rounded-xl transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Folder three-dot menu — portal so it's never clipped */}
      {folderMenu && createPortal(
        <>
          {/* Backdrop to close on outside click */}
          <div className="fixed inset-0 z-[9998]" onClick={() => setFolderMenu(null)}/>
          <div
            style={{
              position: 'fixed',
              top: Math.min(folderMenuPos.y, window.innerHeight - 200),
              left: Math.max(folderMenuPos.x - 160, 8),
              zIndex: 9999,
            }}
            className="dark:bg-gray-900 bg-white border dark:border-gray-700 border-gray-200 rounded-xl shadow-2xl py-1 w-40"
            onClick={e => e.stopPropagation()}>
            {(() => {
              const folder = folders.find(f => f.id === folderMenu);
              if (!folder) return null;
              return (
                <>
                  <button onClick={() => { setRenameVal(folder.name); setRenamingId(folder.id); setFolderMenu(null); }}
                    className="w-full text-left px-3 py-2.5 text-xs dark:text-gray-300 text-gray-700 dark:hover:bg-gray-800 hover:bg-gray-50 transition flex items-center gap-2">
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" className="dark:text-gray-400 text-gray-500">
                      <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/>
                    </svg>
                    Rename
                  </button>
                  <button onClick={() => { setColorPickTarget({ id: folder.id, type: 'folder' }); setFolderMenu(null); }}
                    className="w-full text-left px-3 py-2.5 text-xs dark:text-gray-300 text-gray-700 dark:hover:bg-gray-800 hover:bg-gray-50 transition flex items-center gap-2">
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" className="dark:text-gray-400 text-gray-500">
                      <path d="M12.433 10.07C14.133 10.585 16 11.15 16 8a8 8 0 1 0-8 8c1.996 0 1.826-1.504 1.649-3.08-.124-1.101-.252-2.237.351-2.92.465-.527 1.42-.237 2.433.07zM8 5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4.5 3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM5 6.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm.5 6.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
                    </svg>
                    Set color
                  </button>
                  <button onClick={() => { setDeleteConfirm(folder.id); setFolderMenu(null); }}
                    className="w-full text-left px-3 py-2.5 text-xs text-red-400 dark:hover:bg-gray-800 hover:bg-gray-50 transition flex items-center gap-2">
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66H14.5a.5.5 0 0 0 0-1h-.996a.59.59 0 0 0-.01 0zM3.04 3.5h9.92l-.845 10.56a1 1 0 0 1-.997.94h-6.23a1 1 0 0 1-.997-.94z"/>
                    </svg>
                    Delete
                  </button>
                </>
              );
            })()}
          </div>
        </>,
        document.body
      )}

      {/* Context menu */}
      {contextMenu && (
        <div ref={contextRef}
          style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, zIndex: 9999 }}
          className="dark:bg-gray-900 bg-white border dark:border-gray-700 border-gray-200 rounded-xl shadow-2xl py-1 min-w-[180px]"
          onClick={e => e.stopPropagation()}>
          <button onClick={() => { setFolderPickTarget(contextMenu.groupId); setContextMenu(null); }}
            className="w-full text-left px-3 py-2.5 text-sm dark:text-gray-300 text-gray-700 dark:hover:bg-gray-800 hover:bg-gray-50 transition flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="dark:text-gray-400 text-gray-500">
              <path d="M.54 3.87.5 3a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3h3.982a2 2 0 0 1 1.992 2.181l-.637 7A2 2 0 0 1 13.174 14H2.826a2 2 0 0 1-1.991-1.819l-.637-7a1.99 1.99 0 0 1 .342-1.31zM2.19 4a1 1 0 0 0-.996 1.09l.637 7a1 1 0 0 0 .995.91h10.348a1 1 0 0 0 .995-.91l.637-7A1 1 0 0 0 13.81 4H2.19zm4.69-1.707A1 1 0 0 0 6.172 2H2.5a1 1 0 0 0-1 .981l.006.139C1.72 3.042 1.95 3 2.19 3h5.396l-.707-.707z"/>
            </svg>
            Move to folder
          </button>
          <button onClick={() => { togglePin(contextMenu.groupId); setContextMenu(null); }}
            className="w-full text-left px-3 py-2.5 text-sm dark:text-gray-300 text-gray-700 dark:hover:bg-gray-800 hover:bg-gray-50 transition flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="dark:text-gray-400 text-gray-500">
              <path d="M4.146.146A.5.5 0 0 1 4.5 0h7a.5.5 0 0 1 .5.5c0 .68-.342 1.174-.646 1.479-.126.125-.25.224-.354.298v4.431l.078.048c.203.127.476.314.751.555C12.36 7.775 13 8.527 13 9.5a.5.5 0 0 1-.5.5h-4v4.5c0 .276-.224 1.5-.5 1.5s-.5-1.224-.5-1.5V10h-4a.5.5 0 0 1-.5-.5c0-.973.64-1.725 1.17-2.189A5.921 5.921 0 0 1 5 6.708V2.277a2.77 2.77 0 0 1-.354-.298C4.342 1.674 4 1.179 4 .5a.5.5 0 0 1 .146-.354z"/>
            </svg>
            {pins.includes(contextMenu.groupId) ? 'Unpin' : 'Pin to top'}
          </button>
          <button onClick={() => { setColorPickTarget({ id: contextMenu.groupId, type: 'group' }); setContextMenu(null); }}
            className="w-full text-left px-3 py-2.5 text-sm dark:text-gray-300 text-gray-700 dark:hover:bg-gray-800 hover:bg-gray-50 transition flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="dark:text-gray-400 text-gray-500">
              <path d="M12.433 10.07C14.133 10.585 16 11.15 16 8a8 8 0 1 0-8 8c1.996 0 1.826-1.504 1.649-3.08-.124-1.101-.252-2.237.351-2.92.465-.527 1.42-.237 2.433.07zM8 5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4.5 3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM5 6.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm.5 6.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
            </svg>
            Set color
          </button>
          <button onClick={() => { setLabelPickTarget(contextMenu.groupId); setLabelInput(labels[contextMenu.groupId] || ''); setContextMenu(null); }}
            className="w-full text-left px-3 py-2.5 text-sm dark:text-gray-300 text-gray-700 dark:hover:bg-gray-800 hover:bg-gray-50 transition flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="dark:text-gray-400 text-gray-500">
              <path d="M2 2a1 1 0 0 1 1-1h4.586a1 1 0 0 1 .707.293l7 7a1 1 0 0 1 0 1.414l-4.586 4.586a1 1 0 0 1-1.414 0l-7-7A1 1 0 0 1 2 6.586V2zm3.5 4a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>
            </svg>
            Set label
          </button>
          <button onClick={() => { toggleArchive(contextMenu.groupId); setContextMenu(null); }}
            className="w-full text-left px-3 py-2.5 text-sm dark:text-gray-300 text-gray-700 dark:hover:bg-gray-800 hover:bg-gray-50 transition flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="dark:text-gray-400 text-gray-500">
              <path d="M0 2a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1v7.5a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 1 12.5V5a1 1 0 0 1-1-1V2zm2 3v7.5A1.5 1.5 0 0 0 3.5 14h9a1.5 1.5 0 0 0 1.5-1.5V5H2zm13-3H1v2h14V2zM5 7.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z"/>
            </svg>
            {archived.includes(contextMenu.groupId) ? 'Unarchive' : 'Archive'}
          </button>
        </div>
      )}

      {/* Folder picker modal */}
      {folderPickTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-4 pb-6 sm:pb-0"
          onClick={() => setFolderPickTarget(null)}>
          <div className="w-full max-w-xs dark:bg-surface-1 bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <p className="text-xs font-semibold uppercase tracking-wider dark:text-gray-400 text-gray-500 px-4 pt-4 pb-2">Move to folder</p>
            <div className="divide-y dark:divide-gray-800 divide-gray-100">
              <button onClick={() => { moveToFolder(folderPickTarget, null); setFolderPickTarget(null); }}
                className="w-full text-left px-4 py-3 text-sm dark:text-gray-300 text-gray-700 dark:hover:bg-gray-800 hover:bg-gray-50 transition flex items-center gap-2">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="dark:text-gray-500 text-gray-400">
                  <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/>
                </svg>
                No folder
              </button>
              {folders.map(f => (
                <button key={f.id} onClick={() => { moveToFolder(folderPickTarget, f.id); setFolderPickTarget(null); }}
                  className="w-full text-left px-4 py-3 text-sm dark:text-gray-300 text-gray-700 dark:hover:bg-gray-800 hover:bg-gray-50 transition flex items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="dark:text-gray-400 text-gray-500">
                    <path d="M.54 3.87.5 3a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3h3.982a2 2 0 0 1 1.992 2.181l-.637 7A2 2 0 0 1 13.174 14H2.826a2 2 0 0 1-1.991-1.819l-.637-7a1.99 1.99 0 0 1 .342-1.31zM2.19 4a1 1 0 0 0-.996 1.09l.637 7a1 1 0 0 0 .995.91h10.348a1 1 0 0 0 .995-.91l.637-7A1 1 0 0 0 13.81 4H2.19zm4.69-1.707A1 1 0 0 0 6.172 2H2.5a1 1 0 0 0-1 .981l.006.139C1.72 3.042 1.95 3 2.19 3h5.396l-.707-.707z"/>
                  </svg>
                  {f.name}
                </button>
              ))}
              {folders.length === 0 && (
                <p className="px-4 py-3 text-sm dark:text-gray-500 text-gray-400 italic">No folders yet — create one first</p>
              )}
            </div>
            <div className="p-3 border-t dark:border-gray-800 border-gray-100">
              <button onClick={() => setFolderPickTarget(null)}
                className="w-full py-2 rounded-xl dark:bg-surface-3 bg-gray-100 dark:text-gray-400 text-gray-600 text-sm transition dark:hover:bg-surface-4 hover:bg-gray-200">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Color picker modal */}
      {colorPickTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-4 pb-6 sm:pb-0"
          onClick={() => setColorPickTarget(null)}>
          <div className="w-full max-w-xs dark:bg-surface-1 bg-white rounded-2xl shadow-2xl p-5"
            onClick={e => { e.stopPropagation(); }}>
            <p className="text-sm font-semibold dark:text-white text-gray-900 mb-1">Set color</p>
            <p className="text-xs dark:text-gray-500 text-gray-400 mb-4">
              {colorPickTarget?.type === 'folder' ? 'All groups in this folder will inherit this color.' : 'Color for this group.'}
            </p>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(COLORS).map(([key, c]) => {
                const currentColor = colorPickTarget?.type === 'folder'
                  ? folderColors[colorPickTarget?.id]
                  : colors[colorPickTarget?.id];
                return (
                  <button key={key} onClick={() => setColor(key)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition text-xs font-medium
                      ${currentColor === key
                        ? 'border-brand-500 dark:bg-brand-900/30 bg-brand-50'
                        : 'dark:border-surface-4 border-gray-200 dark:hover:bg-surface-3 hover:bg-gray-50'}`}>
                    <span className={`w-3 h-3 rounded-full flex-shrink-0 ${c.dot}`}/>
                    {c.label}
                  </button>
                );
              })}
              <button onClick={() => setColor(null)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl border dark:border-surface-4 border-gray-200 dark:hover:bg-surface-3 hover:bg-gray-50 transition text-xs dark:text-gray-400 text-gray-500">
                None
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Label picker modal */}
      {labelPickTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-4 pb-6 sm:pb-0"
          onClick={() => setLabelPickTarget(null)}>
          <div className="w-full max-w-xs dark:bg-surface-1 bg-white rounded-2xl shadow-2xl p-5 space-y-4"
            onClick={e => e.stopPropagation()}>
            <p className="text-sm font-semibold dark:text-white text-gray-900">Set semester label</p>
            <div className="flex flex-wrap gap-2">
              {['Sem 1','Sem 2','Sem 3','Sem 4','Sem 5','Sem 6','Sem 7','Sem 8','Electives','Labs'].map(preset => (
                <button key={preset} onClick={() => setLabelInput(preset)}
                  className={`px-2.5 py-1 rounded-lg text-xs border transition
                    ${labelInput === preset
                      ? 'bg-brand-600/20 border-brand-500/50 text-brand-300'
                      : 'dark:border-surface-4 border-gray-200 dark:text-gray-400 text-gray-500 dark:hover:bg-surface-3 hover:bg-gray-50'}`}>
                  {preset}
                </button>
              ))}
            </div>
            <input value={labelInput} onChange={e => setLabelInput(e.target.value)}
              placeholder="Custom label…" className="w-full form-input"
              onKeyDown={e => { if (e.key === 'Enter') setLabel(labelPickTarget, labelInput.trim()); }}/>
            <div className="flex gap-2">
              <button onClick={() => setLabel(labelPickTarget, labelInput.trim())} disabled={!labelInput.trim()}
                className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition">
                Save
              </button>
              <button onClick={() => { setLabel(labelPickTarget, null); }}
                className="flex-1 py-2.5 dark:bg-surface-3 bg-gray-100 dark:text-gray-300 text-gray-700 text-sm rounded-xl transition">
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
