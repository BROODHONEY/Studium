import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { groupsAPI } from '../services/api';
import QRCode from 'qrcode';

const initials = (name) =>
  name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

const COLORS = [
  'bg-indigo-600','bg-teal-600','bg-purple-600',
  'bg-pink-600','bg-amber-600','bg-green-600'
];
const avatarColor = (name) => COLORS[name?.charCodeAt(0) % COLORS.length];

export default function MembersPanel({ group, onGroupUpdate, onLeft, onGroupDeleted }) {
  const { user }  = useAuth();
  const myRole    = group?.my_role;
  const isAdmin   = myRole === 'admin';
  const isCreator = group?.created_by?.id
    ? group.created_by.id === user?.id
    : group?.created_by === user?.id;

  const [members, setMembers]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [copied, setCopied]         = useState(false);
  const [adminsOnly, setAdminsOnly] = useState(group?.admins_only || false);
  const [toggling, setToggling]     = useState(false);
  const [error, setError]           = useState('');

  // Edit description state
  const [editingDesc, setEditingDesc] = useState(false);
  const [descValue, setDescValue]     = useState(group?.description || '');
  const [savingDesc, setSavingDesc]   = useState(false);

  // Leave confirmation
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [leaving, setLeaving]           = useState(false);

  // Delete group confirmation
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting]           = useState(false);

  // QR code modal
  const [showQR, setShowQR]   = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const qrCanvasRef = useRef(null);

  useEffect(() => {
    if (!group) return;
    setDescValue(group.description || '');
    setLoading(true);
    groupsAPI.get(group.id)
      .then(res => {
        setMembers(res.data.members || []);
        setAdminsOnly(res.data.admins_only || false);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [group?.id]);

  // Generate QR whenever modal opens
  useEffect(() => {
    if (!showQR || !group?.invite_code) return;
    QRCode.toDataURL(group.invite_code, { width: 240, margin: 2, color: { dark: '#ffffff', light: '#111827' } })
      .then(url => setQrDataUrl(url))
      .catch(console.error);
  }, [showQR, group?.invite_code]);

  const copyCode = () => {
    navigator.clipboard.writeText(group.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleAdminsOnly = async () => {
    setToggling(true);
    try {
      await groupsAPI.toggleAdminsOnly(group.id, !adminsOnly);
      setAdminsOnly(prev => !prev);
      onGroupUpdate?.({ ...group, admins_only: !adminsOnly });
    } catch {
      setError('Could not update setting');
    } finally {
      setToggling(false);
    }
  };

  const handleSaveDescription = async () => {
    setSavingDesc(true);
    try {
      const res = await groupsAPI.update(group.id, { description: descValue });
      setEditingDesc(false);
      onGroupUpdate?.({ ...group, description: res.data.description });
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update description');
    } finally {
      setSavingDesc(false);
    }
  };

  const handleKick = async (userId, name) => {
    if (!confirm(`Remove ${name} from the group?`)) return;
    try {
      await groupsAPI.kickMember(group.id, userId);
      setMembers(prev => prev.filter(m => m.users?.id !== userId));
    } catch (err) {
      setError(err.response?.data?.error || 'Could not remove member');
    }
  };

  const handlePromote = async (userId, name) => {
    if (!confirm(`Grant admin access to ${name}?`)) return;
    try {
      await groupsAPI.promoteMember(group.id, userId);
      setMembers(prev => prev.map(m =>
        m.users?.id === userId ? { ...m, role: 'admin' } : m
      ));
    } catch (err) {
      setError(err.response?.data?.error || 'Could not promote member');
    }
  };

  const handleDemote = async (userId, name) => {
    if (!confirm(`Revoke admin access from ${name}?`)) return;
    try {
      await groupsAPI.demoteMember(group.id, userId);
      setMembers(prev => prev.map(m =>
        m.users?.id === userId ? { ...m, role: 'teacher' } : m
      ));
    } catch (err) {
      setError(err.response?.data?.error || 'Could not revoke admin access');
    }
  };

  const handleLeave = async () => {
    setLeaving(true);
    try {
      await groupsAPI.leave(group.id);
      onLeft?.(group.id);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not leave group');
      setConfirmLeave(false);
    } finally {
      setLeaving(false);
    }
  };

  const handleDeleteGroup = async () => {
    setDeleting(true);
    try {
      await groupsAPI.delete(group.id);
      onGroupDeleted?.(group.id);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not delete group');
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  const admins   = members.filter(m => m.role === 'admin');
  const teachers = members.filter(m => m.role === 'teacher');
  const students = members.filter(m => m.role === 'student');

  return (
    <>
    <div className="flex-1 flex flex-col min-h-0 bg-gray-950 overflow-y-auto">
      <div className="p-5 space-y-6">

        {error && (
          <div className="px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs flex items-center justify-between">
            {error}
            <button onClick={() => setError('')} className="ml-2 text-red-400/60 hover:text-red-400">✕</button>
          </div>
        )}

        {/* Admin panel */}
        {isAdmin && (
          <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl space-y-4">

            {/* Invite code */}
            <div className="space-y-1">
              <p className="text-xs text-gray-500">Invite code</p>
              <div className="flex items-center gap-3">
                <span className="font-mono text-2xl font-semibold text-indigo-400 tracking-widest">
                  {group.invite_code}
                </span>
                <button onClick={copyCode}
                  className="ml-auto text-xs px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition">
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button onClick={() => setShowQR(true)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition">
                  QR
                </button>
              </div>
            </div>

            {/* Edit description */}
            <div className="pt-3 border-t border-gray-800 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-300 font-medium">Description</p>
                {!editingDesc && (
                  <button onClick={() => setEditingDesc(true)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition">
                    Edit
                  </button>
                )}
              </div>
              {editingDesc ? (
                <div className="space-y-2">
                  <textarea
                    value={descValue}
                    onChange={e => setDescValue(e.target.value)}
                    rows={3}
                    placeholder="Add a description..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleSaveDescription} disabled={savingDesc}
                      className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition">
                      {savingDesc ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={() => { setEditingDesc(false); setDescValue(group.description || ''); }}
                      className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 transition">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500">
                  {group.description || <span className="italic">No description</span>}
                </p>
              )}
            </div>

            {/* Admins only toggle */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-800">
              <div>
                <p className="text-xs text-gray-300 font-medium">Admins only mode</p>
                <p className="text-xs text-gray-600 mt-0.5">Only admins can send messages</p>
              </div>
              <button onClick={handleToggleAdminsOnly} disabled={toggling}
                className={`relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0
                  ${adminsOnly ? 'bg-indigo-600' : 'bg-gray-700'}`}>
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200
                  ${adminsOnly ? 'translate-x-5' : 'translate-x-0'}`}/>
              </button>
            </div>
          </div>
        )}

        {/* Members list */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-800 animate-pulse"/>
                <div className="h-4 bg-gray-800 rounded animate-pulse w-32"/>
              </div>
            ))}
          </div>
        ) : (
          <>
            {admins.length > 0 && (
              <MemberSection title="Admins" members={admins}
                currentUserId={user?.id} isAdmin={isAdmin}
                canKick={false} canPromote={false} canDemote={true}
                onKick={handleKick} onPromote={handlePromote} onDemote={handleDemote}/>
            )}
            {teachers.length > 0 && (
              <MemberSection title="Teachers" members={teachers}
                currentUserId={user?.id} isAdmin={isAdmin}
                canKick={true} canPromote={true} canDemote={false}
                onKick={handleKick} onPromote={handlePromote} onDemote={handleDemote}/>
            )}
            {students.length > 0 && (
              <MemberSection title="Students" members={students}
                currentUserId={user?.id} isAdmin={isAdmin}
                canKick={true} canPromote={false} canDemote={false}
                onKick={handleKick} onPromote={handlePromote} onDemote={handleDemote}/>
            )}
          </>
        )}

        {/* Leave group — not shown to the group creator */}
        {!isCreator && (
          <div className="pt-4 border-t border-gray-800">
            {confirmLeave ? (
              <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl space-y-3">
                <p className="text-sm text-red-400">Are you sure you want to leave this group?</p>
                <div className="flex gap-2">
                  <button onClick={handleLeave} disabled={leaving}
                    className="text-xs px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white transition">
                    {leaving ? 'Leaving...' : 'Yes, leave'}
                  </button>
                  <button onClick={() => setConfirmLeave(false)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 transition">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setConfirmLeave(true)}
                className="text-xs text-red-400/70 hover:text-red-400 transition">
                Leave group
              </button>
            )}
          </div>
        )}

        {/* Delete group — only for the creator */}
        {isCreator && (
          <div className="pt-4 border-t border-gray-800">
            {confirmDelete ? (
              <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl space-y-3">
                <p className="text-sm text-red-400 font-medium">Delete "{group.name}"?</p>
                <p className="text-xs text-gray-500">This will permanently delete the group, all messages, and all files. This cannot be undone.</p>
                <div className="flex gap-2">
                  <button onClick={handleDeleteGroup} disabled={deleting}
                    className="text-xs px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white transition">
                    {deleting ? 'Deleting...' : 'Yes, delete'}
                  </button>
                  <button onClick={() => setConfirmDelete(false)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 transition">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)}
                className="text-xs text-red-400/70 hover:text-red-400 transition">
                Delete group
              </button>
            )}
          </div>
        )}
      </div>
    </div>

    {/* QR Code Modal */}
    {showQR && (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4"
        onClick={() => setShowQR(false)}>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center space-y-4"
          onClick={e => e.stopPropagation()}>
          <p className="text-sm font-semibold text-white">Scan to join</p>
          {qrDataUrl
            ? <img src={qrDataUrl} alt="QR code" className="w-48 h-48 mx-auto rounded-xl"/>
            : <div className="w-48 h-48 mx-auto rounded-xl bg-gray-800 animate-pulse"/>
          }
          <p className="font-mono text-xl font-bold text-indigo-400 tracking-widest">
            {group.invite_code}
          </p>
          <button onClick={() => setShowQR(false)}
            className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition">
            Close
          </button>
        </div>
      </div>
    )}
    </>
  );
}

function MemberSection({ title, members, currentUserId, isAdmin, canKick, canPromote, canDemote, onKick, onPromote, onDemote }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">
        {title} · {members.length}
      </p>
      <div className="space-y-1">
        {members.map(m => {
          const u = m.users;
          if (!u) return null;
          const isMe = u.id === currentUserId;
          return (
            <div key={u.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-900 transition group">
              <div className={`w-9 h-9 rounded-full ${avatarColor(u.name)} flex items-center justify-center text-xs font-semibold text-white flex-shrink-0`}>
                {initials(u.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">
                  {u.name}
                  {isMe && <span className="ml-1.5 text-xs text-gray-600">(you)</span>}
                </p>
                <p className="text-xs text-gray-600 truncate">{u.email || u.phone}</p>
              </div>
              {isAdmin && !isMe && (
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition">
                  {canDemote && (
                    <button onClick={() => onDemote(u.id, u.name)}
                      className="text-xs px-2 py-1 rounded bg-gray-800 hover:bg-amber-600 text-gray-400 hover:text-white transition">
                      Revoke admin
                    </button>
                  )}
                  {canPromote && (
                    <button onClick={() => onPromote(u.id, u.name)}
                      className="text-xs px-2 py-1 rounded bg-gray-800 hover:bg-indigo-600 text-gray-400 hover:text-white transition">
                      Make admin
                    </button>
                  )}
                  {canKick && (
                    <button onClick={() => onKick(u.id, u.name)}
                      className="text-xs px-2 py-1 rounded bg-gray-800 hover:bg-red-600 text-gray-400 hover:text-white transition">
                      Remove
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
