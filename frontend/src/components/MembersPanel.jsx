import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { groupsAPI } from '../services/api';
import ConfirmDialog from './ui/ConfirmDialog';

// ── Helpers ────────────────────────────────────────────
const ini = (n) => n?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
const AVATAR_COLORS = ['#C0C1FF', '#7072AC', '#FFB38E', '#22C55E', '#9E9E9E', '#db2777'];
const avatarBg = (n) => AVATAR_COLORS[(n?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

// ── Role badge config ──────────────────────────────────
const ROLE_BADGE = {
  admin:   { label: 'Admin',   bg: 'rgba(192,193,255,0.14)', color: '#C0C1FF', border: 'rgba(192,193,255,0.30)' },
  teacher: { label: 'Faculty', bg: 'rgba(255,179,142,0.14)', color: '#FFB38E', border: 'rgba(255,179,142,0.30)' },
  student: { label: 'Student', bg: 'rgba(158,158,158,0.12)', color: '#9E9E9E', border: 'rgba(158,158,158,0.25)' },
};

function RoleBadge({ role }) {
  const cfg = ROLE_BADGE[role] || ROLE_BADGE.student;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 5,
      fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
    }}>
      {cfg.label}
    </span>
  );
}

function MemberRow({ m, currentUserId, isAdmin, canKick, canPromote, canDemote, onKick, onPromote, onDemote, onViewProfile }) {
  const [hov, setHov] = useState(false);
  const u = m.users;
  if (!u) return null;
  const isMe = u.id === currentUserId;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 14px', borderRadius: 10,
        background: hov ? 'rgba(192,193,255,0.04)' : 'transparent',
        transition: 'background 0.15s',
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: avatarBg(u.name),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 600, color: '#fff', flexShrink: 0,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}>
        {ini(u.name)}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <button
          onClick={() => onViewProfile?.(u.id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)' }}>{u.name}</span>
          {isMe && (
            <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>you</span>
          )}
        </button>
        {u.email && (
          <p style={{ fontSize: 11, fontWeight: 300, color: 'var(--text-3)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {u.email}
          </p>
        )}
      </div>

      {/* Actions (hover, admin only) */}
      {isAdmin && !isMe && hov ? (
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {canDemote && (
            <button onClick={() => onDemote(u)} style={actionBtnStyle('danger')}>Revoke</button>
          )}
          {canPromote && (
            <button onClick={() => onPromote(u)} style={actionBtnStyle('accent')}>Promote</button>
          )}
          {canKick && (
            <button onClick={() => onKick(u)} style={actionBtnStyle('danger')}>Remove</button>
          )}
        </div>
      ) : (
        <RoleBadge role={m.role} />
      )}
    </div>
  );
}

function actionBtnStyle(type) {
  const isDanger = type === 'danger';
  return {
    padding: '4px 10px', borderRadius: 7, fontSize: 11, fontWeight: 500, cursor: 'pointer',
    border: `1px solid ${isDanger ? 'rgba(239,68,68,0.30)' : 'rgba(192,193,255,0.30)'}`,
    background: isDanger ? 'rgba(239,68,68,0.10)' : 'rgba(192,193,255,0.10)',
    color: isDanger ? '#EF4444' : '#C0C1FF',
    transition: 'all 0.15s',
  };
}

function MemberSection({ title, members, ...rest }) {
  if (!members.length) return null;
  return (
    <div>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-1)', textTransform: 'uppercase', letterSpacing: '0.10em' }}>
          {title}
        </span>
        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em' }}>
          {String(members.length).padStart(2, '0')} {members.length === 1 ? 'ENTRY' : 'ENTRIES'}
        </span>
      </div>
      {/* Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {members.map(m => <MemberRow key={m.users?.id} m={m} {...rest} />)}
      </div>
    </div>
  );
}

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

  const [confirmLeave, setConfirmLeave]   = useState(false);
  const [leaving, setLeaving]             = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting]           = useState(false);

  const [memberConfirm, setMemberConfirm]       = useState(null);
  const [confirmingMember, setConfirmingMember] = useState(false);

  useEffect(() => {
    if (!group) return;
    setEditForm({ name: group.name || '', subject: group.subject || '', description: group.description || '' });
    setLoading(true);
    groupsAPI.get(group.id)
      .then(res => { setMembers(res.data.members || []); setAdminsOnly(res.data.admins_only || false); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [group?.id]);

  const copyCode = () => {
    navigator.clipboard.writeText(group.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleAdminsOnly = async () => {
    setToggling(true);
    try {
      await groupsAPI.toggleAdminsOnly(group.id, !adminsOnly);
      setAdminsOnly(v => !v);
      onGroupUpdate?.({ ...group, admins_only: !adminsOnly });
    } catch { setError('Could not update setting'); }
    finally { setToggling(false); }
  };

  const handleSaveDescription = async () => {
    if (!editForm.name.trim() || !editForm.subject.trim()) return;
    setSavingDesc(true);
    try {
      const res = await groupsAPI.update(group.id, { name: editForm.name.trim(), subject: editForm.subject.trim(), description: editForm.description });
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
        addToast({ type: 'success', message: `Removed ${name}.` });
      } else if (action === 'promote') {
        await groupsAPI.promoteMember(group.id, userId);
        setMembers(prev => prev.map(m => m.users?.id === userId ? { ...m, role: 'admin' } : m));
        addToast({ type: 'success', message: `${name} is now admin.` });
      } else if (action === 'demote') {
        await groupsAPI.demoteMember(group.id, userId);
        setMembers(prev => prev.map(m => m.users?.id === userId ? { ...m, role: 'teacher' } : m));
        addToast({ type: 'success', message: `Admin access revoked from ${name}.` });
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

  const sharedMemberProps = {
    currentUserId: user?.id, isAdmin, onViewProfile,
    onKick:    u => setMemberConfirm({ action: 'kick',    userId: u.id, name: u.name }),
    onPromote: u => setMemberConfirm({ action: 'promote', userId: u.id, name: u.name }),
    onDemote:  u => setMemberConfirm({ action: 'demote',  userId: u.id, name: u.name }),
  };

  return (
    <>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflowY: 'auto', background: 'var(--void)', fontFamily: 'Inter, sans-serif', position: 'relative' }}>

        {/* Ambient glows */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: 400, height: 300, background: 'radial-gradient(ellipse at top right, rgba(192,193,255,0.07) 0%, transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'absolute', top: 0, left: 0, width: 300, height: 250, background: 'radial-gradient(ellipse at top left, rgba(255,179,142,0.04) 0%, transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />

        <div style={{ maxWidth: 720, margin: '0 auto', width: '100%', padding: '28px 24px 48px', display: 'flex', flexDirection: 'column', gap: 20, position: 'relative', zIndex: 1 }}>

          {/* Error banner */}
          {error && (
            <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)', borderRadius: 10, color: '#EF4444', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {error}
              <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(239,68,68,0.5)', fontSize: 16, lineHeight: 1 }}>×</button>
            </div>
          )}

          {/* ── Top two-column cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 14, alignItems: 'start' }}>

            {/* Group description card */}
            <div style={{ background: 'var(--raised)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-1)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  Group Description
                </span>
                {isAdmin && !editingDesc && (
                  <button
                    onClick={() => setEditingDesc(true)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 500, color: 'var(--primary)', padding: 0 }}
                  >
                    Edit
                  </button>
                )}
              </div>

              {!editingDesc && (
                <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-1)', margin: '0 0 10px', fontFamily: "'Manrope', 'Inter', sans-serif" }}>
                  {group.name}
                </p>
              )}

              {editingDesc ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <label className="form-label">Group name</label>
                    <input className="form-input" value={editForm.name} required onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} placeholder="Group name" />
                  </div>
                  <div>
                    <label className="form-label">Subject</label>
                    <input className="form-input" value={editForm.subject} required onChange={e => setEditForm(p => ({ ...p, subject: e.target.value }))} placeholder="e.g. Mathematics" />
                  </div>
                  <div>
                    <label className="form-label">Description <span style={{ color: 'var(--text-3)', fontWeight: 300 }}>(optional)</span></label>
                    <textarea value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="Add a description…" className="form-input" style={{ resize: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleSaveDescription} disabled={savingDesc || !editForm.name.trim() || !editForm.subject.trim()}
                      style={{ padding: '7px 16px', borderRadius: 8, background: 'var(--primary)', border: 'none', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: savingDesc ? 0.6 : 1 }}>
                      {savingDesc ? 'Saving…' : 'Save'}
                    </button>
                    <button onClick={() => { setEditingDesc(false); setEditForm({ name: group.name || '', subject: group.subject || '', description: group.description || '' }); }}
                      style={{ padding: '7px 16px', borderRadius: 8, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-2)', fontSize: 12, fontWeight: 400, cursor: 'pointer' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: 13, fontWeight: 300, color: group.description ? 'var(--text-2)' : 'var(--text-3)', fontStyle: group.description ? 'normal' : 'italic', margin: '0 0 16px', lineHeight: 1.6 }}>
                    {group.description || 'No description added yet.'}
                  </p>
                  {/* Stats row */}
                  <div style={{ display: 'flex', gap: 24 }}>
                    <StatItem value={members.length} label="Active Members" />
                    <StatItem value={admins.length + teachers.length} label="Admins & Teachers" />
                    <StatItem value={students.length} label="Students" />
                  </div>
                </>
              )}
            </div>

            {/* Quick invite card */}
            {isAdmin && (
              <div style={{ background: 'var(--raised)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 22px', minWidth: 180, maxWidth: 220 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-1)', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'block', marginBottom: 8 }}>
                  Quick Invite
                </span>
                <p style={{ fontSize: 11, fontWeight: 300, color: 'var(--text-3)', margin: '0 0 16px', lineHeight: 1.5 }}>
                  Share this code with peers to let them join instantly.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 14 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.15em' }}>
                    {group.invite_code}
                  </span>
                  <button onClick={copyCode}
                    style={{ padding: '4px 8px', borderRadius: 7, background: copied ? 'rgba(34,197,94,0.12)' : 'rgba(192,193,255,0.10)', border: `1px solid ${copied ? 'rgba(34,197,94,0.30)' : 'rgba(192,193,255,0.25)'}`, color: copied ? '#22C55E' : 'var(--primary)', fontSize: 11, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0 }}>
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                {/* Admins only toggle */}
                <div style={{ paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-2)', margin: 0 }}>Admins only</p>
                      <p style={{ fontSize: 10, fontWeight: 300, color: 'var(--text-3)', margin: '2px 0 0' }}>Restrict messaging</p>
                    </div>
                    <button onClick={handleToggleAdminsOnly} disabled={toggling}
                      style={{ position: 'relative', width: 36, height: 20, borderRadius: 10, background: adminsOnly ? 'var(--primary)' : 'var(--border)', border: 'none', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s', padding: 0 }}>
                      <span style={{ position: 'absolute', top: 2, left: adminsOnly ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Member sections ── */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '8px 0' }}>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--raised)' }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ height: 12, width: 140, borderRadius: 6, background: 'var(--raised)' }} />
                    <div style={{ height: 10, width: 100, borderRadius: 6, background: 'var(--raised)' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <MemberSection title="Admins" members={admins}
                canKick={false} canPromote={false} canDemote={true} {...sharedMemberProps} />
              <MemberSection title="Teachers & Faculty" members={teachers}
                canKick={true} canPromote={true} canDemote={false} {...sharedMemberProps} />
              <MemberSection title="Students" members={students}
                canKick={true} canPromote={false} canDemote={false} {...sharedMemberProps} />
            </div>
          )}

          {/* ── Danger zone ── */}
          <div style={{ paddingTop: 20, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {!isCreator && (
              confirmLeave ? (
                <DangerConfirm
                  message={`Leave "${group.name}"?`}
                  confirmLabel={leaving ? 'Leaving…' : 'Yes, leave'}
                  disabled={leaving}
                  onConfirm={handleLeave}
                  onCancel={() => setConfirmLeave(false)}
                />
              ) : (
                <GhostDangerBtn label="Leave group" onClick={() => setConfirmLeave(true)} />
              )
            )}
            {isCreator && (
              confirmDelete ? (
                <DangerConfirm
                  message={`Delete "${group.name}"? This removes all messages and files permanently.`}
                  confirmLabel={deleting ? 'Deleting…' : 'Yes, delete'}
                  disabled={deleting}
                  onConfirm={handleDeleteGroup}
                  onCancel={() => setConfirmDelete(false)}
                />
              ) : (
                <GhostDangerBtn label="Delete group" onClick={() => setConfirmDelete(true)} />
              )
            )}
          </div>

        </div>
      </div>

      <ConfirmDialog
        open={!!memberConfirm}
        danger={memberConfirm?.action === 'kick' || memberConfirm?.action === 'demote'}
        title={
          memberConfirm?.action === 'kick'    ? `Remove ${memberConfirm?.name}?`
          : memberConfirm?.action === 'promote' ? `Make ${memberConfirm?.name} admin?`
          : `Revoke admin from ${memberConfirm?.name}?`
        }
        description="This will update group membership immediately."
        confirmText={memberConfirm?.action === 'kick' ? 'Remove' : memberConfirm?.action === 'promote' ? 'Make admin' : 'Revoke admin'}
        onCancel={() => { if (!confirmingMember) setMemberConfirm(null); }}
        onConfirm={handleConfirmMemberAction}
        disabled={confirmingMember}
      />
    </>
  );
}

// ── Small helpers ──────────────────────────────────────
function StatItem({ value, label }) {
  return (
    <div>
      <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', margin: 0, lineHeight: 1, fontFamily: "'Manrope', 'Inter', sans-serif" }}>{value}</p>
      <p style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-3)', margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
    </div>
  );
}

function GhostDangerBtn({ label, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 400, color: hov ? '#EF4444' : 'rgba(239,68,68,0.45)', transition: 'color 0.15s', padding: 0, textAlign: 'left' }}
    >
      {label}
    </button>
  );
}

function DangerConfirm({ message, confirmLabel, disabled, onConfirm, onCancel }) {
  return (
    <div style={{ padding: '14px 16px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ fontSize: 13, fontWeight: 400, color: 'rgba(239,68,68,0.85)', margin: 0 }}>{message}</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onConfirm} disabled={disabled}
          style={{ padding: '7px 16px', borderRadius: 8, background: 'rgba(239,68,68,0.80)', border: 'none', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: disabled ? 0.6 : 1 }}>
          {confirmLabel}
        </button>
        <button onClick={onCancel}
          style={{ padding: '7px 16px', borderRadius: 8, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-2)', fontSize: 12, fontWeight: 400, cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
