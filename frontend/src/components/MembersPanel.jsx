import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { groupsAPI } from '../services/api';
import QRCode from 'qrcode';
import ConfirmDialog from './ui/ConfirmDialog';

const initials = (name) =>
  name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

const COLORS = ['bg-indigo-600','bg-teal-600','bg-purple-600','bg-pink-600','bg-amber-600','bg-green-600'];
const avatarColor = (name) => COLORS[name?.charCodeAt(0) % COLORS.length];

export default function MembersPanel({ group, onGroupUpdate, onLeft, onGroupDeleted, onViewProfile }) {
  const { user }     = useAuth();
  const { addToast } = useToast();
  const myRole    = group?.my_role;
  const isAdmin   = myRole === 'admin';
  const isCreator = group?.created_by?.id ? group.created_by.id === user?.id : group?.created_by === user?.id;

  const [members, setMembers]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [copied, setCopied]         = useState(false);
  const [adminsOnly, setAdminsOnly] = useState(group?.admins_only || false);
  const [toggling, setToggling]     = useState(false);
  const [error, setError]           = useState('');

  const [editingDesc, setEditingDesc] = useState(false);
  const [editForm, setEditForm]       = useState({ name: group?.name || '', subject: group?.subject || '', description: group?.description || '' });
  const [savingDesc, setSavingDesc]   = useState(false);

  const [confirmLeave, setConfirmLeave] = useState(false);
  const [leaving, setLeaving]           = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting]           = useState(false);

  const [memberConfirm, setMemberConfirm]       = useState(null);
  const [confirmingMember, setConfirmingMember] = useState(false);

  const [showQR, setShowQR]     = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    if (!group) return;
    setEditForm({ name: group.name || '', subject: group.subject || '', description: group.description || '' });
    setLoading(true);
    groupsAPI.get(group.id)
      .then(res => { setMembers(res.data.members || []); setAdminsOnly(res.data.admins_only || false); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [group?.id]);

  useEffect(() => {
    if (!showQR || !group?.invite_code) return;
    QRCode.toDataURL(group.invite_code, { width: 240, margin: 2, color: { dark: '#ffffff', light: '#111118' } })
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
    } catch { setError('Could not update setting'); }
    finally { setToggling(false); }
  };

  const handleSaveDescription = async () => {
    if (!editForm.name.trim() || !editForm.subject.trim()) return;
    setSavingDesc(true);
    try {
      const res = await groupsAPI.update(group.id, {
        name: editForm.name.trim(),
        subject: editForm.subject.trim(),
        description: editForm.description,
      });
      setEditingDesc(false);
      onGroupUpdate?.({ ...group, name: res.data.name, subject: res.data.subject, description: res.data.description });
    } catch (err) { setError(err.response?.data?.error || 'Could not update group'); }
    finally { setSavingDesc(false); }
  };

  const handleConfirmMemberAction = async () => {
    if (!memberConfirm || !group) return;
    const { action, userId, name } = memberConfirm;
    setMemberConfirm(null); setConfirmingMember(true); setError('');
    try {
      if (action === 'kick') {
        await groupsAPI.kickMember(group.id, userId);
        setMembers(prev => prev.filter(m => m.users?.id !== userId));
        addToast({ type: 'success', message: `Removed ${name} from the group.` });
      } else if (action === 'promote') {
        await groupsAPI.promoteMember(group.id, userId);
        setMembers(prev => prev.map(m => m.users?.id === userId ? { ...m, role: 'admin' } : m));
        addToast({ type: 'success', message: `Granted admin access to ${name}.` });
      } else if (action === 'demote') {
        await groupsAPI.demoteMember(group.id, userId);
        setMembers(prev => prev.map(m => m.users?.id === userId ? { ...m, role: 'teacher' } : m));
        addToast({ type: 'success', message: `Revoked admin access from ${name}.` });
      }
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Action failed' });
    } finally { setConfirmingMember(false); }
  };

  const handleLeave = async () => {
    setLeaving(true);
    try { await groupsAPI.leave(group.id); onLeft?.(group.id); }
    catch (err) { setError(err.response?.data?.error || 'Could not leave group'); setConfirmLeave(false); }
    finally { setLeaving(false); }
  };

  const handleDeleteGroup = async () => {
    setDeleting(true);
    try { await groupsAPI.delete(group.id); onGroupDeleted?.(group.id); }
    catch (err) { setError(err.response?.data?.error || 'Could not delete group'); setConfirmDelete(false); }
    finally { setDeleting(false); }
  };

  const admins   = members.filter(m => m.role === 'admin');
  const teachers = members.filter(m => m.role === 'teacher');
  const students = members.filter(m => m.role === 'student');

  return (
    <>
    <div className="flex-1 flex flex-col min-h-0 dark:bg-surface bg-gray-50 overflow-y-auto">
      <div className="p-5 space-y-6">

        {error && (
          <div className="px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center justify-between">
            {error}
            <button onClick={() => setError('')} className="ml-2 text-red-400/60 hover:text-red-400">✕</button>
          </div>
        )}

        {/* Admin panel */}
        {isAdmin && (
          <div className="card p-4 space-y-4">
            {/* Invite code */}
            <div className="space-y-1">
              <p className="text-xs dark:text-gray-500 text-gray-500">Invite code</p>
              <div className="flex items-center gap-3">
                <span className="font-mono text-2xl font-semibold text-brand-400 tracking-widest">
                  {group.invite_code}
                </span>
                <button onClick={copyCode}
                  className="ml-auto text-xs px-3 py-1.5 rounded-lg dark:bg-surface-3 bg-gray-100 dark:hover:bg-surface-4 hover:bg-gray-200 dark:text-gray-300 text-gray-700 transition">
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button onClick={() => setShowQR(true)}
                  className="text-xs px-3 py-1.5 rounded-lg dark:bg-surface-3 bg-gray-100 dark:hover:bg-surface-4 hover:bg-gray-200 dark:text-gray-300 text-gray-700 transition">
                  QR
                </button>
              </div>
            </div>

            {/* Edit group info */}
            <div className="pt-3 border-t dark:border-brand-900/40 border-gray-200 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs dark:text-gray-300 text-gray-700 font-medium">Group info</p>
                {!editingDesc && (
                  <button onClick={() => setEditingDesc(true)}
                    className="text-xs text-brand-400 hover:text-brand-300 transition">Edit</button>
                )}
              </div>
              {editingDesc ? (
                <div className="space-y-2">
                  <div>
                    <label className="form-label">Group name</label>
                    <input className="form-input" value={editForm.name} required
                      onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="Group name"/>
                  </div>
                  <div>
                    <label className="form-label">Subject</label>
                    <input className="form-input" value={editForm.subject} required
                      onChange={e => setEditForm(p => ({ ...p, subject: e.target.value }))}
                      placeholder="e.g. Mathematics"/>
                  </div>
                  <div>
                    <label className="form-label">Description <span className="dark:text-gray-600 text-gray-400">(optional)</span></label>
                    <textarea value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} rows={2}
                      placeholder="Add a description..." className="form-input resize-none"/>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleSaveDescription} disabled={savingDesc || !editForm.name.trim() || !editForm.subject.trim()}
                      className="text-xs px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white transition">
                      {savingDesc ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={() => { setEditingDesc(false); setEditForm({ name: group.name || '', subject: group.subject || '', description: group.description || '' }); }}
                      className="text-xs px-3 py-1.5 rounded-lg dark:bg-surface-3 bg-gray-100 dark:hover:bg-surface-4 hover:bg-gray-200 dark:text-gray-400 text-gray-600 transition">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs dark:text-gray-500 text-gray-500">{group.description || <span className="italic opacity-50">No description</span>}</p>
                </div>
              )}
            </div>

            {/* Admins only toggle */}
            <div className="flex items-center justify-between pt-3 border-t dark:border-brand-900/40 border-gray-200">
              <div>
                <p className="text-xs dark:text-gray-300 text-gray-700 font-medium">Admins only mode</p>
                <p className="text-xs dark:text-gray-600 text-gray-400 mt-0.5">Only admins can send messages</p>
              </div>
              <button onClick={handleToggleAdminsOnly} disabled={toggling}
                className={`relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0
                  ${adminsOnly ? 'bg-brand-600' : 'dark:bg-surface-4 bg-gray-300'}`}>
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
                <div className="w-9 h-9 rounded-full dark:bg-surface-3 bg-gray-200 animate-pulse"/>
                <div className="h-4 dark:bg-surface-3 bg-gray-200 rounded animate-pulse w-32"/>
              </div>
            ))}
          </div>
        ) : (
          <>
            {admins.length > 0 && (
              <MemberSection title="Admins" members={admins} currentUserId={user?.id} isAdmin={isAdmin}
                canKick={false} canPromote={false} canDemote={true}
                onKick={u => setMemberConfirm({ action: 'kick', userId: u.id, name: u.name })}
                onPromote={u => setMemberConfirm({ action: 'promote', userId: u.id, name: u.name })}
                onDemote={u => setMemberConfirm({ action: 'demote', userId: u.id, name: u.name })}
                onViewProfile={onViewProfile}/>
            )}
            {teachers.length > 0 && (
              <MemberSection title="Teachers" members={teachers} currentUserId={user?.id} isAdmin={isAdmin}
                canKick={true} canPromote={true} canDemote={false}
                onKick={u => setMemberConfirm({ action: 'kick', userId: u.id, name: u.name })}
                onPromote={u => setMemberConfirm({ action: 'promote', userId: u.id, name: u.name })}
                onDemote={u => setMemberConfirm({ action: 'demote', userId: u.id, name: u.name })}
                onViewProfile={onViewProfile}/>
            )}
            {students.length > 0 && (
              <MemberSection title="Students" members={students} currentUserId={user?.id} isAdmin={isAdmin}
                canKick={true} canPromote={false} canDemote={false}
                onKick={u => setMemberConfirm({ action: 'kick', userId: u.id, name: u.name })}
                onPromote={u => setMemberConfirm({ action: 'promote', userId: u.id, name: u.name })}
                onDemote={u => setMemberConfirm({ action: 'demote', userId: u.id, name: u.name })}
                onViewProfile={onViewProfile}/>
            )}
          </>
        )}

        {/* Leave group */}
        {!isCreator && (
          <div className="pt-4 border-t dark:border-brand-900/40 border-gray-200">
            {confirmLeave ? (
              <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl space-y-3">
                <p className="text-sm text-red-400">Are you sure you want to leave this group?</p>
                <div className="flex gap-2">
                  <button onClick={handleLeave} disabled={leaving}
                    className="text-xs px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white transition">
                    {leaving ? 'Leaving...' : 'Yes, leave'}
                  </button>
                  <button onClick={() => setConfirmLeave(false)}
                    className="text-xs px-3 py-1.5 rounded-lg dark:bg-surface-3 bg-gray-100 dark:text-gray-400 text-gray-600 transition">
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

        {/* Delete group */}
        {isCreator && (
          <div className="pt-4 border-t dark:border-brand-900/40 border-gray-200">
            {confirmDelete ? (
              <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl space-y-3">
                <p className="text-sm text-red-400 font-medium">Delete "{group.name}"?</p>
                <p className="text-xs dark:text-gray-500 text-gray-500">This will permanently delete the group, all messages, and all files. This cannot be undone.</p>
                <div className="flex gap-2">
                  <button onClick={handleDeleteGroup} disabled={deleting}
                    className="text-xs px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white transition">
                    {deleting ? 'Deleting...' : 'Yes, delete'}
                  </button>
                  <button onClick={() => setConfirmDelete(false)}
                    className="text-xs px-3 py-1.5 rounded-lg dark:bg-surface-3 bg-gray-100 dark:text-gray-400 text-gray-600 transition">
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

    <ConfirmDialog
      open={!!memberConfirm}
      danger={memberConfirm?.action === 'kick' || memberConfirm?.action === 'demote'}
      title={
        memberConfirm?.action === 'kick' ? `Remove ${memberConfirm?.name} from the group?`
          : memberConfirm?.action === 'promote' ? `Grant admin access to ${memberConfirm?.name}?`
          : `Revoke admin access from ${memberConfirm?.name}?`
      }
      description="This action will update the group membership immediately."
      confirmText={memberConfirm?.action === 'kick' ? 'Remove' : memberConfirm?.action === 'promote' ? 'Make admin' : 'Revoke admin'}
      onCancel={() => { if (!confirmingMember) setMemberConfirm(null); }}
      onConfirm={handleConfirmMemberAction}
      disabled={confirmingMember}
    />

    {showQR && (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4"
        onClick={() => setShowQR(false)}>
        <div className="card p-6 text-center space-y-4" onClick={e => e.stopPropagation()}>
          <p className="text-sm font-semibold dark:text-white text-gray-900">Scan to join</p>
          {qrDataUrl
            ? <img src={qrDataUrl} alt="QR code" className="w-48 h-48 mx-auto rounded-xl"/>
            : <div className="w-48 h-48 mx-auto rounded-xl dark:bg-surface-3 bg-gray-200 animate-pulse"/>
          }
          <p className="font-mono text-xl font-bold text-brand-400 tracking-widest">{group.invite_code}</p>
          <button onClick={() => setShowQR(false)}
            className="w-full py-2 dark:bg-surface-3 bg-gray-100 dark:hover:bg-surface-4 hover:bg-gray-200 dark:text-gray-300 text-gray-700 text-sm rounded-xl transition">
            Close
          </button>
        </div>
      </div>
    )}
    </>
  );
}

function MemberSection({ title, members, currentUserId, isAdmin, canKick, canPromote, canDemote, onKick, onPromote, onDemote, onViewProfile }) {
  return (
    <div>
      <p className="text-xs font-medium dark:text-gray-600 text-gray-400 uppercase tracking-wider mb-2">
        {title} · {members.length}
      </p>
      <div className="space-y-1">
        {members.map(m => {
          const u = m.users;
          if (!u) return null;
          const isMe = u.id === currentUserId;
          return (
            <div key={u.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl dark:hover:bg-surface-2 hover:bg-gray-100 transition group">
              <div className={`w-9 h-9 rounded-full ${avatarColor(u.name)} flex items-center justify-center text-xs font-semibold text-white flex-shrink-0`}>
                {initials(u.name)}
              </div>
              <div className="flex-1 min-w-0">
                <button onClick={() => onViewProfile?.(u.id)}
                  className="text-sm dark:text-white text-gray-900 font-medium truncate dark:hover:text-brand-300 hover:text-brand-600 transition text-left">
                  {u.name}
                  {isMe && <span className="ml-1.5 text-xs dark:text-gray-600 text-gray-400">(you)</span>}
                </button>
                <p className="text-xs dark:text-gray-600 text-gray-400 truncate">{u.email || u.phone}</p>
              </div>
              {isAdmin && !isMe && (
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition">
                  {canDemote && (
                    <button onClick={() => onDemote(u)}
                      className="text-xs px-2 py-1 rounded dark:bg-surface-3 bg-gray-100 dark:hover:bg-neon-yellow/20 hover:bg-amber-100 dark:text-gray-400 text-gray-600 dark:hover:text-neon-yellow hover:text-amber-700 transition">
                      Revoke admin
                    </button>
                  )}
                  {canPromote && (
                    <button onClick={() => onPromote(u)}
                      className="text-xs px-2 py-1 rounded dark:bg-surface-3 bg-gray-100 dark:hover:bg-brand-600 hover:bg-brand-100 dark:text-gray-400 text-gray-600 dark:hover:text-white hover:text-brand-700 transition">
                      Make admin
                    </button>
                  )}
                  {canKick && (
                    <button onClick={() => onKick(u)}
                      className="text-xs px-2 py-1 rounded dark:bg-surface-3 bg-gray-100 dark:hover:bg-red-600 hover:bg-red-100 dark:text-gray-400 text-gray-600 dark:hover:text-white hover:text-red-700 transition">
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
