import { useState } from 'react';
import Modal from './ui/Modal';

export default function DeleteConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  itemName,
  warningItems = []
}) {
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (confirmText !== itemName) {
      return;
    }

    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal onClose={onClose}>
      <div style={{ maxWidth: 500 }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#EF4444', margin: '0 0 8px' }}>
            {title}
          </h2>
          <p style={{ fontSize: 14, color: '#888', margin: 0 }}>
            This action cannot be undone. This will permanently delete everything.
          </p>
        </div>

        {warningItems.length > 0 && (
          <div style={{ 
            background: 'rgba(239,68,68,0.1)', 
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 12,
            padding: 16,
            marginBottom: 24
          }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#EF4444', margin: '0 0 12px' }}>
              This will permanently delete:
            </p>
            <ul style={{ margin: 0, padding: '0 0 0 20px', fontSize: 13, color: '#FCA5A5', lineHeight: 1.8 }}>
              {warningItems.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ marginBottom: 24 }}>
          <label style={{ 
            display: 'block', 
            fontSize: 13, 
            fontWeight: 500, 
            color: '#888', 
            marginBottom: 8 
          }}>
            Type <span style={{ color: '#EF4444', fontWeight: 700 }}>{itemName}</span> to confirm:
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={itemName}
            style={{
              width: '100%',
              background: '#1E1E1E',
              border: '1px solid #2E2E2E',
              borderRadius: 12,
              padding: '11px 14px',
              fontSize: 13,
              color: '#F0F0F0',
              outline: 'none',
              fontFamily: 'Inter, sans-serif',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => e.target.style.borderColor = '#EF4444'}
            onBlur={(e) => e.target.style.borderColor = '#2E2E2E'}
          />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1,
              padding: '11px 14px',
              borderRadius: 12,
              border: '1px solid #2E2E2E',
              background: 'transparent',
              color: '#F0F0F0',
              fontSize: 13,
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'Inter, sans-serif',
              opacity: loading ? 0.5 : 1
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirmText !== itemName || loading}
            style={{
              flex: 1,
              padding: '11px 14px',
              borderRadius: 12,
              border: 'none',
              background: confirmText === itemName && !loading ? '#EF4444' : '#2E2E2E',
              color: confirmText === itemName && !loading ? '#fff' : '#666',
              fontSize: 13,
              fontWeight: 600,
              cursor: confirmText === itemName && !loading ? 'pointer' : 'not-allowed',
              fontFamily: 'Inter, sans-serif',
              transition: 'all 0.15s'
            }}
          >
            {loading ? 'Deleting...' : 'Delete Permanently'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
