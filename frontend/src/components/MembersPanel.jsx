import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { groupsAPI } from '../services/api';
import QRCode from 'qrcode';
import ConfirmDialog from './ui/ConfirmDialog';

const ini = (name) => name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
const AVATAR_COLORS = ['#4f46e5','#0d9488','#7c3aed','#db2777','#d97706','#16a34a'];
const avatarBg = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const S = {
  label: { fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  card:  { borderRadius: 12, border: '1px solid #1c1c1c', background: '#0d0d0d', padding: '16px 18px' },
  row:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
};

function ActionBtn({ label, onClick, danger, accent }) {
  const [hov, setHov] = useState(false);
  const base = { padding: '4px 10px', borderRadius: 7, fontSize: 11, fontWeight: 300, border: 'none', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'Inter, sans-serif' };
  let bg = hov
    ? danger ? 'rgba(239,68,68,0.15)' : accent ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.08)'
    : 'rgba(255,255,255,0.05)';
  let color = hov
    ? danger ? 'rgba(239,68,68,0.9)' : accent ? 'rgba(167,139,250,0.9)' : 'rgba(255,255,255,0.7)'
    : 'rgba(255,255,255,0.3)';
  return (
    <button onClick={onClick} style={{ ...base, background: bg, color }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      {label}
    </button>
  );
}

function MemberRow({ m, currentUserId, isAdmin, canKick, canPromote, canDemote, onKick, onPromote, onDemote, onViewProfile }) {
  const [hov, setHov] = useState(false);
  const u = m.users;
  if (!u) return null;
  const isMe = u.id === currentUserId;
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: hov ? 'rgba(255,255,255,0.03)' : 'none', transition: 'background 0.1s' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: avatarBg(u.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500, color: '#fff', flexShrink: 0 }}>
        {ini(u.name)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <button onClick={() => onViewProfile?.(u.id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.75)' }}>{u.name}</span>
          {isMe && <span style={{ fontSize: 10, fontWeight: 300, color: 'rgba(255,255,255,0.2)' }}>you</span>}
        </button>
        {u.email && <p style={{ fontSize: 11, fontWeight: 300, color: 'rgba(255,255,255,0.2)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</p>}
      </div>
      {isAdmin && !isMe && hov && (
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {canDemote  && <ActionBtn label="Revoke admin" onClick={() => onDemote(u)} danger />}
          {canPromote && <ActionBtn label="Make admin"   onClick={() => onPromote(u)} accent />}
          {canKick    && <ActionBtn label="Remove"       onClick={() => onKick(u)} danger />}
        </div>
      )}
    </div>
  );
}

function MemberSection({ title, members, ...rest }) {
  if (!members.length) return null;
  return (
    <section>
      <p style={{ ...S.label, marginBottom: 8 }}>{title} · {members.length}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {members.map(m => <MemberRow key={m.users?.id} m={m} {...rest} />)}
      </div>
    </section>
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

  const [showQR, setShowQR]       = useState(false);
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
    QRCode.toDataURL(group.invite_code, { width: 240, margin: 2, color: { dark: '#ffffff', light: '#0d0d0d' } })
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

  const sharedMemberProps = { currentUserId: user?.id, isAdmin, onViewProfile,
    onKick:    u => setMemberConfirm({ action: 'kick',    userId: u.id, name: u.name }),
    onPromote: u => setMemberConfirm({ action: 'promote', userId: u.id, name: u.name }),
    onDemote:  u => setMemberConfirm({ action: 'demote',  userId: u.id, name: u.name }),
  };

  return (
    <>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflowY: 'auto', background: 'transparent', position: 'relative', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: 300, height: 300, background: 'radial-gradient(ellipse at top right, rgba(124,58,237,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

        <div style={{ maxWidth: 640, margin: '0 auto', width: '100%', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 24, position: 'relative', zIndex: 1 }}>

          {/* Error */}
          {error && (
            <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: 'rgba(239,68,68,0.8)', fontSize: 12, fontWeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {error}
              <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(239,68,68,0.5)', fontSize: 14, lineHeight: 1 }}>×</button>
            </div>
          )}

          {/* Admin panel */}
          {isAdmin && (
            <div style={S.card}>
              {/* Invite code */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ ...S.label, marginBottom: 8 }}>Invite code</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 600, color: 'rgba(167,139,250,0.9)', letterSpacing: '0.15em' }}>{group.invite_code}</span>
                  <button onClick={copyCode}
                    style={{ marginLeft: 'auto', padding: '5px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid #1c1c1c', color: copied ? 'rgba(48,209,88,0.8)' : 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 300, cursor: 'pointer', transition: 'all 0.15s' }}>
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button onClick={() => setShowQR(true)}
                    style={{ padding: '5px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid #1c1c1c', color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 300, cursor: 'pointer' }}>
                    QR
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: '#1c1c1c', margin: '16px 0' }}/>

              {/* Group info */}
              <div>
                <div style={{ ...S.row, marginBottom: 8 }}>
                  <p style={S.label}>Group info</p>
                  {!editingDesc && (
                    <button onClick={() => setEditingDesc(true)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 300, color: 'rgba(124,58,237,0.8)' }}>Edit</button>
                  )}
                </div>
                {editingDesc ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      <label className="form-label">Group name</label>
                      <input className="form-input" value={editForm.name} required onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} placeholder="Group name"/>
                    </div>
                    <div>
                      <label className="form-label">Subject</label>
                      <input className="form-input" value={editForm.subject} required onChange={e => setEditForm(p => ({ ...p, subject: e.target.value }))} placeholder="e.g. Mathematics"/>
                    </div>
                    <div>
                      <label className="form-label">Description <span style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 300 }}>(optional)</span></label>
                      <textarea value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="Add a description…" className="form-input" style={{ resize: 'none' }}/>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={handleSaveDescription} disabled={savingDesc || !editForm.name.trim() || !editForm.subject.trim()}
                        style={{ padding: '6px 14px', borderRadius: 8, background: '#7c3aed', border: 'none', color: '#fff', fontSize: 12, fontWeight: 400, cursor: 'pointer', opacity: savingDesc ? 0.6 : 1 }}>
                        {savingDesc ? 'Saving…' : 'Save'}
                      </button>
                      <button onClick={() => { setEditingDesc(false); setEditForm({ name: group.name || '', subject: group.subject || '', description: group.description || '' }); }}
                        style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid #1c1c1c', color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 300, cursor: 'pointer' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: 12, fontWeight: 300, color: group.description ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.15)', fontStyle: group.description ? 'normal' : 'italic' }}>
                    {group.description || 'No description'}
                  </p>
                )}
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: '#1c1c1c', margin: '16px 0' }}/>

              {/* Admins only toggle */}
              <div style={S.row}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.7)', margin: 0 }}>Admins only mode</p>
                  <p style={{ fontSize: 11, fontWeight: 300, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>Only admins can send messages</p>
                </div>
                <button onClick={handleToggleAdminsOnly} disabled={toggling}
                  style={{ position: 'relative', width: 40, height: 22, borderRadius: 11, background: adminsOnly ? '#7c3aed' : '#2a2a2a', border: 'none', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s' }}>
                  <span style={{ position: 'absolute', top: 3, left: adminsOnly ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }}/>
                </button>
              </div>
            </div>
          )}

          {/* Members */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#111111' }}/>
                  <div style={{ height: 12, width: 120, borderRadius: 6, background: '#111111' }}/>
                </div>
              ))}
            </div>
          ) : (
            <>
              <MemberSection title="Admins"   members={admins}   canKick={false} canPromote={false} canDemote={true}  {...sharedMemberProps}/>
              <MemberSection title="Teachers" members={teachers} canKick={true}  canPromote={true}  canDemote={false} {...sharedMemberProps}/>
              <MemberSection title="Students" members={students} canKick={true}  canPromote={false} canDemote={false} {...sharedMemberProps}/>
            </>
          )}

          {/* Leave group */}
          {!isCreator && (
            <div style={{ paddingTop: 16, borderTop: '1px solid #1c1c1c' }}>
              {confirmLeave ? (
                <div style={{ padding: '14px 16px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <p style={{ fontSize: 13, fontWeight: 300, color: 'rgba(239,68,68,0.8)', margin: 0 }}>Leave this group?</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleLeave} disabled={leaving}
                      style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.8)', border: 'none', color: '#fff', fontSize: 12, fontWeight: 400, cursor: 'pointer' }}>
                      {leaving ? 'Leaving…' : 'Yes, leave'}
                    </button>
                    <button onClick={() => setConfirmLeave(false)}
                      style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid #1c1c1c', color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 300, cursor: 'pointer' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setConfirmLeave(true)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 300, color: 'rgba(239,68,68,0.5)', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'rgba(239,68,68,0.8)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(239,68,68,0.5)'}>
                  Leave group
                </button>
              )}
            </div>
          )}

          {/* Delete group */}
          {isCreator && (
            <div style={{ paddingTop: 16, borderTop: '1px solid #1c1c1c' }}>
              {confirmDelete ? (
                <div style={{ padding: '14px 16px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <p style={{ fontSize: 13, fontWeight: 400, color: 'rgba(239,68,68,0.8)', margin: 0 }}>Delete "{group.name}"?</p>
                  <p style={{ fontSize: 11, fontWeight: 300, color: 'rgba(255,255,255,0.25)', margin: 0 }}>This permanently removes the group, all messages, and all files.</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleDeleteGroup} disabled={deleting}
                      style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.8)', border: 'none', color: '#fff', fontSize: 12, fontWeight: 400, cursor: 'pointer' }}>
                      {deleting ? 'Deleting…' : 'Yes, delete'}
                    </button>
                    <button onClick={() => setConfirmDelete(false)}
                      style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid #1c1c1c', color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 300, cursor: 'pointer' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(true)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 300, color: 'rgba(239,68,68,0.5)', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'rgba(239,68,68,0.8)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(239,68,68,0.5)'}>
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

      {/* QR modal */}
      {showQR && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}
          onClick={() => setShowQR(false)}>
          <div style={{ background: '#0d0d0d', border: '1px solid #1c1c1c', borderRadius: 16, padding: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16 }}
            onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.7)', margin: 0 }}>Scan to join</p>
            {qrDataUrl
              ? <img src={qrDataUrl} alt="QR code" style={{ width: 200, height: 200, borderRadius: 12, margin: '0 auto', display: 'block' }}/>
              : <div style={{ width: 200, height: 200, borderRadius: 12, background: '#111111', margin: '0 auto' }}/>
            }
            <p style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 600, color: 'rgba(167,139,250,0.9)', letterSpacing: '0.15em', margin: 0 }}>{group.invite_code}</p>
            <button onClick={() => setShowQR(false)}
              style={{ padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid #1c1c1c', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 300, cursor: 'pointer' }}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
