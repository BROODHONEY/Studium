import { useState, useEffect } from 'react';
import axios from 'axios';

const C = {
  shell: '#0E0E0E',
  sidebar: '#141414',
  surface: '#1A1A1A',
  raised: '#222222',
  border: '#2A2A2A',
  borderHi: '#383838',
  primary: '#FF6B35',
  primaryLo: 'rgba(255,107,53,0.10)',
  primaryMid: 'rgba(255,107,53,0.20)',
  text1: '#F0F0F0',
  text2: '#9E9E9E',
  text3: '#555555',
  danger: '#EF4444',
  success: '#22C55E',
};

export default function ReportTemplatesPanel({ onClose }) {
  const [template, setTemplate] = useState({
    college_name: '',
    show_college_name: true,
    college_name_position: 'top-center',
    logo_url: null,
    logo_position: 'top-center',
    logo_size: 'medium',
    font_size: 12,
    header_color: '#FF6B35',
    show_logo: true,
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchTemplate();
  }, []);

  const fetchTemplate = async () => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const token = localStorage.getItem('token');
      const res = await axios.get(`${apiUrl}/admin/report-template`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data) {
        setTemplate(res.data);
        setLogoPreview(res.data.logo_url);
      }
    } catch (error) {
      console.error('Error fetching template:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }
    
    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const token = localStorage.getItem('token');

      let logoUrl = template.logo_url;

      // Upload logo if changed
      if (logoFile) {
        const formData = new FormData();
        formData.append('file', logoFile);
        const uploadRes = await axios.post(`${apiUrl}/admin/upload-logo`, formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        logoUrl = uploadRes.data.url;
      }

      await axios.post(`${apiUrl}/admin/report-template`, {
        ...template,
        logo_url: logoUrl
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Template saved successfully!');
      fetchTemplate();
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: '100%',
    background: C.raised,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: '10px 14px',
    color: C.text1,
    fontSize: 13,
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    color: C.text3,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 8
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: C.text2 }}>
        <div style={{ width: 16, height: 16, border: `4px solid ${C.primary}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }}></div>
        Loading template...
      </div>
    );
  }

  return (
    <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '24px 28px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text1, margin: 0, fontFamily: 'Manrope, Inter, sans-serif' }}>Report Templates</h2>
          <p style={{ fontSize: 13, color: C.text3, margin: '4px 0 0' }}>Customize report appearance for PDF and XLSX exports</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => setShowPreview(true)}
            style={{ padding: '10px 20px', borderRadius: 10, border: `1px solid ${C.border}`, background: 'none', color: C.text2, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.color = C.primary; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.text2; }}
          >
            Preview
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: C.primary, color: '#131313', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', opacity: saving ? 0.5 : 1, transition: 'all 0.15s' }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#FF8C5A'; }}
            onMouseLeave={e => { if (!saving) e.currentTarget.style.background = C.primary; }}
          >
            {saving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 28 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          {/* Left Column - Settings */}
          <div>
            {/* College Name */}
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>College Name</label>
              <input
                type="text"
                value={template.college_name}
                onChange={(e) => setTemplate({ ...template, college_name: e.target.value })}
                style={inputStyle}
                placeholder="Enter college name"
                onFocus={e => e.target.style.borderColor = C.primary}
                onBlur={e => e.target.style.borderColor = C.border}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 12, color: C.text2, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={template.show_college_name}
                  onChange={(e) => setTemplate({ ...template, show_college_name: e.target.checked })}
                  style={{ cursor: 'pointer' }}
                />
                Show college name in reports
              </label>
            </div>

            {/* College Name Position */}
            {template.show_college_name && (
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>College Name Position</label>
                <select
                  value={template.college_name_position}
                  onChange={(e) => setTemplate({ ...template, college_name_position: e.target.value })}
                  style={inputStyle}
                >
                  <option value="top-center">Top Center</option>
                  <option value="top-left">Top Left</option>
                  <option value="top-right">Top Right</option>
                </select>
              </div>
            )}

            {/* Logo Upload */}
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>College Logo</label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <label style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: `1px dashed ${C.border}`, background: C.raised, color: C.text2, fontSize: 13, cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.color = C.primary; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.text2; }}>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                  {logoFile ? logoFile.name : 'Choose Logo Image'}
                </label>
                {logoPreview && (
                  <img src={logoPreview} alt="Logo preview" style={{ width: 60, height: 60, objectFit: 'contain', borderRadius: 8, border: `1px solid ${C.border}`, background: '#fff', padding: 4 }} />
                )}
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 12, color: C.text2, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={template.show_logo}
                  onChange={(e) => setTemplate({ ...template, show_logo: e.target.checked })}
                  style={{ cursor: 'pointer' }}
                />
                Show logo in reports
              </label>
            </div>

            {/* Logo Position */}
            {template.show_logo && (
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Logo Position</label>
                <select
                  value={template.logo_position}
                  onChange={(e) => setTemplate({ ...template, logo_position: e.target.value })}
                  style={inputStyle}
                >
                  <option value="top-center">Top Center (Below Name)</option>
                  <option value="top-left">Top Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="side-left">Side Left</option>
                  <option value="side-right">Side Right</option>
                </select>
              </div>
            )}

            {/* Logo Size */}
            {template.show_logo && (
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Logo Size</label>
                <select
                  value={template.logo_size}
                  onChange={(e) => setTemplate({ ...template, logo_size: e.target.value })}
                  style={inputStyle}
                >
                  <option value="small">Small (40px)</option>
                  <option value="medium">Medium (60px)</option>
                  <option value="large">Large (80px)</option>
                </select>
              </div>
            )}
          </div>

          {/* Right Column - More Settings */}
          <div>
            {/* Font Size */}
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Base Font Size (px)</label>
              <input
                type="number"
                min="8"
                max="20"
                value={template.font_size}
                onChange={(e) => setTemplate({ ...template, font_size: parseInt(e.target.value) || 12 })}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = C.primary}
                onBlur={e => e.target.style.borderColor = C.border}
              />
            </div>

            {/* Header Color */}
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Header Color</label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <input
                  type="color"
                  value={template.header_color}
                  onChange={(e) => setTemplate({ ...template, header_color: e.target.value })}
                  style={{ width: 60, height: 40, borderRadius: 8, border: `1px solid ${C.border}`, cursor: 'pointer', background: 'none' }}
                />
                <input
                  type="text"
                  value={template.header_color}
                  onChange={(e) => setTemplate({ ...template, header_color: e.target.value })}
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="#FF6B35"
                  onFocus={e => e.target.style.borderColor = C.primary}
                  onBlur={e => e.target.style.borderColor = C.border}
                />
              </div>
            </div>

            {/* Info Box */}
            <div style={{ background: C.primaryLo, border: `1px solid ${C.primaryMid}`, borderRadius: 12, padding: 20, marginTop: 32 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.primary, marginBottom: 8 }}>Template Usage</div>
              <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.6 }}>
                • <strong>PDF & XLSX:</strong> Uses logo and college name<br />
                • <strong>CSV:</strong> Plain text format (no logo)<br />
                • Teachers can preview before downloading
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <TemplatePreviewModal template={template} logoPreview={logoPreview} onClose={() => setShowPreview(false)} />
      )}
    </div>
  );
}

function TemplatePreviewModal({ template, logoPreview, onClose }) {
  const logoSizes = { small: 40, medium: 60, large: 80 };
  const logoSize = logoSizes[template.logo_size] || 60;

  const renderHeader = () => {
    const isTopCenter = template.college_name_position === 'top-center' && template.logo_position === 'top-center';
    const isSideBySide = template.logo_position.startsWith('side-');

    if (isSideBySide) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          {template.show_logo && template.logo_position === 'side-left' && logoPreview && (
            <img src={logoPreview} alt="Logo" style={{ width: logoSize, height: logoSize, objectFit: 'contain' }} />
          )}
          {template.show_college_name && (
            <div style={{ flex: 1 }}>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: template.header_color }}>{template.college_name || 'College Name'}</h1>
            </div>
          )}
          {template.show_logo && template.logo_position === 'side-right' && logoPreview && (
            <img src={logoPreview} alt="Logo" style={{ width: logoSize, height: logoSize, objectFit: 'contain' }} />
          )}
        </div>
      );
    }

    return (
      <div style={{ marginBottom: 24 }}>
        {template.show_college_name && (
          <h1 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 700, color: template.header_color, textAlign: template.college_name_position.includes('center') ? 'center' : template.college_name_position.includes('right') ? 'right' : 'left' }}>
            {template.college_name || 'College Name'}
          </h1>
        )}
        {template.show_logo && logoPreview && (
          <div style={{ display: 'flex', justifyContent: template.logo_position.includes('center') ? 'center' : template.logo_position.includes('right') ? 'flex-end' : 'flex-start' }}>
            <img src={logoPreview} alt="Logo" style={{ width: logoSize, height: logoSize, objectFit: 'contain' }} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 40, width: '100%', maxWidth: 800, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#333' }}>Template Preview</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 24, color: '#999' }}>✕</button>
        </div>

        {renderHeader()}

        <div style={{ borderTop: '2px solid #e5e7eb', paddingTop: 20 }}>
          <h3 style={{ fontSize: template.font_size + 4, fontWeight: 700, color: template.header_color, marginBottom: 16 }}>Student Report</h3>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: template.font_size }}>
            <thead>
              <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Name</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Roll No</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Department</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>CGPA</th>
              </tr>
            </thead>
            <tbody>
              {['John Doe', 'Jane Smith', 'Bob Johnson'].map((name, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px', color: '#1f2937' }}>{name}</td>
                  <td style={{ padding: '12px', color: '#1f2937' }}>2021{i + 1}001</td>
                  <td style={{ padding: '12px', color: '#1f2937' }}>Computer Science</td>
                  <td style={{ padding: '12px', color: '#1f2937' }}>{(8.5 + i * 0.3).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 24, padding: 16, background: '#f9fafb', borderRadius: 8, fontSize: template.font_size - 1, color: '#6b7280' }}>
            Generated on {new Date().toLocaleDateString()} • Total Students: 3
          </div>
        </div>
      </div>
    </div>
  );
}
