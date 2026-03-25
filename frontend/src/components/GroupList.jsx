import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

// ── Persistence ────────────────────────────────────────
const storageKey = (uid) => `group_folders_${uid}`;
const loadFolders = (uid) => { try { return JSON.parse(localStorage.getItem(storageKey(uid))) || []; } catch { return []; } };
const saveFolders = (uid, f) => localStorage.setItem(storageKey(uid), JSON.stringify(f));

// ── Helpers ────────────────────────────────────────────
const initials = (n) => n?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
const roleColor = (r) => r === 'admin' ? 'text-neon-yellow' : r === 'teacher' ? 'text-neon-cyan' : 'dark:text-gray-500 text-gray-400';

// ── GroupItem — supports both drag (desktop) and long-press (mobile) ──
function GroupItem({ group, active, onSelect, onLongPress, onDragStart, onDragOver, onDrop, dragging }) {
  const pressTimer = useRef(null);

  const handleTouchStart = (e) => {
    pressTimer.current = setTimeout(() => {
      const touch = e.touches[0];
      onLongPress(group.id, touch.clientX, touch.clientY);
    }, 500);
  };
  const cancelPress = () => clearTimeout(pressTimer.current);

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
      className={`w-full text-left px-3 py-2.5 rounded-xl transition select-none
        ${dragging ? 'opacity-40' : ''}
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
}

// ── Main ───────────────────────────────────────────────
export default function GroupList({ groups, activeGroupId, onSelect, onOpenModal, loading }) {
  const { user } = useAuth();

  const [folders, setFolders]         = useState([]);
  const [collapsed, setCollapsed]     = useState({});
  const [dragGroupId, setDragGroupId] = useState(null);
  const [dragFolderId, setDragFolderId] = useState(null);
  const [contextMenu, setContextMenu] = useState(null); // { groupId, x, y }
  const [fabOpen, setFabOpen]         = useState(false);
  const [folderModal, setFolderModal] = useState(false);
  const [folderName, setFolderName]   = useState('');
  const [folderPickTarget, setFolderPickTarget] = useState(null); // groupId awaiting folder pick
  const [folderMenu, setFolderMenu]   = useState(null);  // folderId with open menu
  const [deleteConfirm, setDeleteConfirm] = useState(null); // folderId to confirm delete
  const [renamingId, setRenamingId]   = useState(null);
  const [renameVal, setRenameVal]     = useState('');

  const contextRef  = useRef(null);
  const folderInput = useRef(null);

  useEffect(() => { if (user?.id) setFolders(loadFolders(user.id)); }, [user?.id]);
  const persist = useCallback((next) => { setFolders(next); saveFolders(user.id, next); }, [user?.id]);

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return;
    const h = (e) => { if (contextRef.current && !contextRef.current.contains(e.target)) setContextMenu(null); };
    document.addEventListener('mousedown', h);
    document.addEventListener('touchstart', h);
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('touchstart', h); };
  }, [contextMenu]);

  useEffect(() => { if (folderModal) setTimeout(() => folderInput.current?.focus(), 50); }, [folderModal]);

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
  const ungrouped   = groups.filter(g => !folderedIds.has(g.id));

  const handleLongPress = (groupId, x, y) => {
    // Clamp to viewport
    const menuW = 180, menuH = 44 + folders.length * 40;
    setContextMenu({
      groupId,
      x: Math.min(x, window.innerWidth  - menuW - 8),
      y: Math.min(y, window.innerHeight - menuH - 8),
    });
  };

  return (
    <div className="flex flex-col h-full relative" onClick={() => { setContextMenu(null); setFabOpen(false); setFolderMenu(null); }}>

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

      {/* Group list */}
      <div className="flex-1 overflow-y-auto p-2 pb-20 space-y-1">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl animate-pulse dark:bg-surface-3 bg-gray-100"/>
          ))
        ) : (
          <>
            {/* Folders */}
            {folders.map(folder => {
              const folderGroups = folder.groupIds.map(id => groupMap[id]).filter(Boolean);
              const isCollapsed  = collapsed[folder.id];
              const menuOpen     = folderMenu === folder.id;
              return (
                <div key={folder.id}
                  onDragOver={e => { e.preventDefault(); setDragFolderId(folder.id); }}
                  onDragLeave={() => setDragFolderId(p => p === folder.id ? null : p)}
                  onDrop={e => { e.preventDefault(); handleDropOnFolder(folder.id); }}
                  className={`rounded-xl transition-colors ${dragFolderId === folder.id ? 'ring-1 ring-brand-500/50 dark:bg-brand-900/20 bg-brand-50' : ''}`}>

                  {/* Folder header */}
                  <div className="flex items-center gap-1 px-2 py-2">
                    {/* Collapse toggle + label */}
                    <button onClick={() => setCollapsed(p => ({ ...p, [folder.id]: !p[folder.id] }))}
                      className="flex items-center gap-2 flex-1 min-w-0 group/fhdr">
                      {/* Folder icon — open/closed */}
                      <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor"
                        className="flex-shrink-0 dark:text-brand-400/70 text-brand-500/70">
                        {isCollapsed
                          ? <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h2.764c.958 0 1.76.56 2.311 1.184C7.985 3.648 8.48 4 9 4h4.5A1.5 1.5 0 0 1 15 5.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5v-9z"/>
                          : <><path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h2.764c.958 0 1.76.56 2.311 1.184C7.985 3.648 8.48 4 9 4h4.5A1.5 1.5 0 0 1 15 5.5v.64c.57.265.94.876.856 1.546l-.64 5.124A2.5 2.5 0 0 1 12.733 15H3.266a2.5 2.5 0 0 1-2.481-2.19l-.64-5.124A1.5 1.5 0 0 1 1 6.14V3.5zm1.5-.5a.5.5 0 0 0-.5.5v2.5h13V5.5a.5.5 0 0 0-.5-.5H9c-.964 0-1.71-.629-2.174-1.154C6.374 3.334 5.82 3 5.264 3H2.5z"/></>
                        }
                      </svg>
                      {renamingId === folder.id ? (
                        <input
                          autoFocus
                          value={renameVal}
                          onChange={e => setRenameVal(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') { if (renameVal.trim()) { persist(folders.map(f => f.id === folder.id ? { ...f, name: renameVal.trim() } : f)); } setRenamingId(null); }
                            if (e.key === 'Escape') setRenamingId(null);
                          }}
                          onBlur={() => { if (renameVal.trim()) persist(folders.map(f => f.id === folder.id ? { ...f, name: renameVal.trim() } : f)); setRenamingId(null); }}
                          onClick={e => e.stopPropagation()}
                          className="flex-1 min-w-0 bg-transparent text-xs font-semibold dark:text-white text-gray-900 outline-none border-b dark:border-brand-500 border-brand-400"
                        />
                      ) : (
                        <span className="text-sm font-semibold dark:text-gray-300 text-gray-600 truncate group-hover/fhdr:dark:text-white group-hover/fhdr:text-gray-900 transition">
                          {folder.name}
                        </span>
                      )}
                      <span className="text-xs dark:text-gray-600 text-gray-400 flex-shrink-0 tabular-nums">{folderGroups.length}</span>
                      <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"
                        className={`flex-shrink-0 dark:text-gray-600 text-gray-400 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}>
                        <path d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
                      </svg>
                    </button>

                    {/* Three-dot menu */}
                    <div className="relative flex-shrink-0">
                      <button
                        onClick={e => { e.stopPropagation(); setFolderMenu(menuOpen ? null : folder.id); }}
                        className="p-1 rounded-lg dark:text-gray-600 text-gray-400 dark:hover:text-gray-300 hover:text-gray-600 dark:hover:bg-surface-3 hover:bg-gray-100 transition">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
                        </svg>
                      </button>
                      {menuOpen && (
                        <div className="absolute right-0 top-full mt-1 z-30 dark:bg-gray-900 bg-white border dark:border-gray-700 border-gray-200 rounded-xl shadow-xl py-1 min-w-[130px]"
                          onClick={e => e.stopPropagation()}>
                          <button onClick={() => { setRenameVal(folder.name); setRenamingId(folder.id); setFolderMenu(null); }}
                            className="w-full text-left px-3 py-2 text-xs dark:text-gray-300 text-gray-700 dark:hover:bg-gray-800 hover:bg-gray-50 transition flex items-center gap-2">
                            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" className="dark:text-gray-400 text-gray-500">
                              <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/>
                            </svg>
                            Rename
                          </button>
                          <button onClick={() => { setDeleteConfirm(folder.id); setFolderMenu(null); }}
                            className="w-full text-left px-3 py-2 text-xs text-red-400 dark:hover:bg-gray-800 hover:bg-gray-50 transition flex items-center gap-2">
                            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66H14.5a.5.5 0 0 0 0-1h-.996a.59.59 0 0 0-.01 0zM3.04 3.5h9.92l-.845 10.56a1 1 0 0 1-.997.94h-6.23a1 1 0 0 1-.997-.94z"/>
                            </svg>
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Folder contents */}
                  {!isCollapsed && (
                    <div className="pl-3 pb-1 space-y-0.5">
                      {folderGroups.length === 0
                        ? <p className="text-xs dark:text-gray-600 text-gray-400 px-3 py-2 italic">Empty — drag or move groups here</p>
                        : folderGroups.map(group => (
                          <GroupItem key={group.id} group={group}
                            active={activeGroupId === group.id}
                            onSelect={onSelect}
                            dragging={dragGroupId === group.id}
                            onLongPress={handleLongPress}
                            onDragStart={() => setDragGroupId(group.id)}
                            onDragOver={() => {}}
                            onDrop={() => handleDropOnGroup(group.id, folder.id)}
                          />
                        ))
                      }
                    </div>
                  )}
                </div>
              );
            })}

            {/* Ungrouped / drop-to-remove zone */}
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
                  />
                ))}
              </div>
            </div>

            {groups.length === 0 && !loading && (
              <div className="text-center dark:text-gray-600 text-gray-400 text-sm p-8">No groups yet</div>
            )}
          </>
        )}
      </div>

      {/* FAB */}
      <div className="absolute bottom-4 right-3 flex flex-col items-end gap-2 z-20"
        onClick={e => e.stopPropagation()}>

        {/* Sub-actions */}
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

        {/* Main FAB */}
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
      {contextMenu && (
        <div ref={contextRef}
          style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, zIndex: 9999 }}
          className="dark:bg-gray-900 bg-white border dark:border-gray-700 border-gray-200 rounded-xl shadow-2xl py-1 min-w-[170px]"
          onClick={e => e.stopPropagation()}>
          <button onClick={() => {
              setFolderPickTarget(contextMenu.groupId);
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-2.5 text-sm dark:text-gray-300 text-gray-700 dark:hover:bg-gray-800 hover:bg-gray-50 transition flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="dark:text-gray-400 text-gray-500">
              <path d="M.54 3.87.5 3a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3h3.982a2 2 0 0 1 1.992 2.181l-.637 7A2 2 0 0 1 13.174 14H2.826a2 2 0 0 1-1.991-1.819l-.637-7a1.99 1.99 0 0 1 .342-1.31zM2.19 4a1 1 0 0 0-.996 1.09l.637 7a1 1 0 0 0 .995.91h10.348a1 1 0 0 0 .995-.91l.637-7A1 1 0 0 0 13.81 4H2.19zm4.69-1.707A1 1 0 0 0 6.172 2H2.5a1 1 0 0 0-1 .981l.006.139C1.72 3.042 1.95 3 2.19 3h5.396l-.707-.707z"/>
            </svg>
            Move to folder
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
    </div>
  );
}
