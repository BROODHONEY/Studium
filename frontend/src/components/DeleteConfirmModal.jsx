import { useState } from 'react';
import Modal from './ui/Modal';

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, title, itemName, warningItems = [] }) {
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (confirmText !== itemName) return;
    setLoading(true);
    try { await onConfirm(); onClose(); }
    catch (error) { console.error('Delete error:', error); }
    finally { setLoading(false); }
  };

  if (!isOpen) return null;

  const matched = confirmText === itemName;

  return (
    <Modal onClose={onClose}>
      {/* eyebrow */}
      <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(239,68,68,0.7)', textTransform: 'uppercase', letterSpacing: '0.14em', margin: '0 0 10px' }}>Destructive Action</p>

      <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 8px', fontFamily: "'Manrope', Inter, sans-serif", letterSpacing: '-0.02em' }}>
        {title}
      </h2>
      <p style={{ fontSize: 13, color: '#666', margin: '0 0 24px', lineHeight: 1.65 }}>
        This action cannot be undone. Everything will be permanently removed.
      </p>

      {warningItems.length > 0 && (
        <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 10, padding: '14px 16px', marginBottom: 24 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(239,68,68,0.8)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 10px' }}>This will permanently delete:</p>
          <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 13, color: '#888', lineHeight: 1.8 }}>
            {warningItems.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </div>
      )}

      <div style={{ marginBottom: 28 }}>
        <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10 }}>
          Type <span style={{ color: 'rgba(239,68,68,0.8)' }}>{itemName}</span> to confirm
        </label>
        <input
          type="text"
          value={confirmText}
          onChange={e => setConfirmText(e.target.value)}
          placeholder={itemName}
          style={{ width: '100%', background: '#0d0d10', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '13px 16px', fontSize: 13, color: '#fff', outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
          onFocus={e => e.target.style.borderColor = 'rgba(239,68,68,0.4)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
        />
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={onClose}
          disabled={loading}
          style={{ flex: 1, padding: '14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: '#666', fontSize: 14, fontWeight: 400, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.2s' }}
          onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; } }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = '#666'; }}
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={!matched || loading}
          style={{ flex: 1, padding: '14px', borderRadius: 10, border: 'none', background: matched && !loading ? 'rgba(239,68,68,0.75)' : 'rgba(255,255,255,0.04)', color: matched && !loading ? '#fff' : '#444', fontSize: 14, fontWeight: 500, cursor: matched && !loading ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', transition: 'all 0.2s' }}
          onMouseEnter={e => { if (matched && !loading) e.currentTarget.style.background = 'rgba(239,68,68,0.9)'; }}
          onMouseLeave={e => { if (matched && !loading) e.currentTarget.style.background = 'rgba(239,68,68,0.75)'; }}
        >
          {loading ? 'Deleting...' : 'Delete Permanently'}
        </button>
      </div>
    </Modal>
  );
}
