import { useState, useEffect } from 'react';
import api from '../services/api';

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

export default function ReportTemplatePanel() {
  const [template, setTemplate] = useState({
    college_name: '',
    show_college_name: true,
    college_name_position: 'top-center',
    subtitle: '',
    show_subtitle: false,
    logo_url: null,
    logo_position: 'top-center',
    logo_size: 'medium',
    font_size: 12,
    header_color: '#FF6B35',
    show_logo: true,
    header_text: '',
    show_header_text: false,
    footer_text: '',
    show_footer_text: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchTemplate();
  }, []);

  const fetchTemplate = async () => {
    try {
      const res = await api.get('/report-templates');
      setTemplate(res.data);
    } catch (error) {
      console.error('Error fetching template:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await api.post('/report-templates', template);
      setMessage({ type: 'success', text: 'Template saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving template:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to save template';
      
      if (error.response?.status === 500) {
        setMessage({
          type: 'error',
          text: 'Server error while saving the template. Please ensure the report_templates table migration has been run.'
        });
      } else {
        setMessage({ type: 'error', text: errorMsg });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please upload an image file' });
      return;
    }

    setUploading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/report-templates/upload-logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setTemplate(prev => ({ ...prev, logo_url: res.data.url }));
      setMessage({ type: 'success', text: 'Logo uploaded successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error uploading logo:', error);
      setMessage({ type: 'error', text: 'Failed to upload logo' });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
        <div style={{ width: 24, height: 24, border: `3px solid ${C.primary}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/>
      </div>
    );
  }

  return (
    <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '24px 28px', borderBottom: `1px solid ${C.border}` }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text1, margin: 0, fontFamily: 'Manrope, Inter, sans-serif' }}>Report Template Settings</h2>
        <p style={{ fontSize: 13, color: C.text3, margin: '4px 0 0' }}>Customize how reports appear for your institution</p>
      </div>

      {/* Message */}
      {message && (
        <div style={{ margin: '16px 28px', padding: '12px 16px', borderRadius: 8, background: message.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${message.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, color: message.type === 'success' ? C.success : C.danger, fontSize: 13 }}>
          {message.text}
        </div>
      )}

      <div style={{ padding: '28px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        {/* Left Column - Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* College Name */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text2, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              College Name
            </label>
            <input
              type="text"
              value={template.college_name}
              onChange={e => setTemplate(prev => ({ ...prev, college_name: e.target.value }))}
              placeholder="Enter college name"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.raised, color: C.text1, fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = C.primary}
              onBlur={e => e.target.style.borderColor = C.border}
            />
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                id="show-college-name"
                checked={template.show_college_name}
                onChange={e => setTemplate(prev => ({ ...prev, show_college_name: e.target.checked }))}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <label htmlFor="show-college-name" style={{ fontSize: 13, color: C.text2, cursor: 'pointer' }}>
                Show college name in reports
              </label>
            </div>
          </div>

          {/* College Name Position */}
          {template.show_college_name && (
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text2, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                College Name Position
              </label>
              <select
                value={template.college_name_position}
                onChange={e => setTemplate(prev => ({ ...prev, college_name_position: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.raised, color: C.text1, fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}
              >
                <option value="top-center">Top Center</option>
                <option value="top-left">Top Left</option>
                <option value="top-right">Top Right</option>
              </select>
            </div>
          )}

          {/* Subtitle */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text2, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Subtitle / Tagline
            </label>
            <input
              type="text"
              value={template.subtitle}
              onChange={e => setTemplate(prev => ({ ...prev, subtitle: e.target.value }))}
              placeholder="e.g., Excellence in Education"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.raised, color: C.text1, fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = C.primary}
              onBlur={e => e.target.style.borderColor = C.border}
            />
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                id="show-subtitle"
                checked={template.show_subtitle}
                onChange={e => setTemplate(prev => ({ ...prev, show_subtitle: e.target.checked }))}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <label htmlFor="show-subtitle" style={{ fontSize: 13, color: C.text2, cursor: 'pointer' }}>
                Show subtitle in reports
              </label>
            </div>
          </div>

          {/* Logo Upload */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text2, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              College Logo
            </label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <label style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: `1px dashed ${C.border}`, background: C.raised, color: C.text2, fontSize: 13, fontFamily: 'Inter, sans-serif', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.color = C.primary; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.text2; }}>
                <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                {uploading ? 'Uploading...' : template.logo_url ? 'Change Logo' : 'Upload Logo'}
              </label>
              {template.logo_url && (
                <button
                  onClick={() => setTemplate(prev => ({ ...prev, logo_url: null }))}
                  style={{ padding: '10px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'none', color: C.danger, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                >
                  Remove
                </button>
              )}
            </div>
            {template.logo_url && (
              <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: C.raised, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                <img src={template.logo_url} alt="Logo" style={{ width: 60, height: 60, objectFit: 'contain', borderRadius: 6 }} />
                <span style={{ fontSize: 12, color: C.text3 }}>Current logo</span>
              </div>
            )}
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                id="show-logo"
                checked={template.show_logo}
                onChange={e => setTemplate(prev => ({ ...prev, show_logo: e.target.checked }))}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <label htmlFor="show-logo" style={{ fontSize: 13, color: C.text2, cursor: 'pointer' }}>
                Show logo in reports
              </label>
            </div>
          </div>

          {/* Logo Position */}
          {template.show_logo && template.logo_url && (
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text2, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Logo Position
              </label>
              <select
                value={template.logo_position}
                onChange={e => setTemplate(prev => ({ ...prev, logo_position: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.raised, color: C.text1, fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}
              >
                <option value="top-center">Top Center</option>
                <option value="top-left">Top Left</option>
                <option value="top-right">Top Right</option>
                <option value="side-left">Side Left</option>
                <option value="side-right">Side Right</option>
              </select>
            </div>
          )}

          {/* Logo Size */}
          {template.show_logo && template.logo_url && (
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text2, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Logo Size
              </label>
              <select
                value={template.logo_size}
                onChange={e => setTemplate(prev => ({ ...prev, logo_size: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.raised, color: C.text1, fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
          )}

          {/* Font Size */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text2, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Font Size (pt)
            </label>
            <input
              type="number"
              min="8"
              max="20"
              value={template.font_size}
              onChange={e => setTemplate(prev => ({ ...prev, font_size: parseInt(e.target.value) || 12 }))}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.raised, color: C.text1, fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = C.primary}
              onBlur={e => e.target.style.borderColor = C.border}
            />
          </div>

          {/* Header Color */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text2, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Header Color
            </label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <input
                type="color"
                value={template.header_color}
                onChange={e => setTemplate(prev => ({ ...prev, header_color: e.target.value }))}
                style={{ width: 60, height: 40, borderRadius: 8, border: `1px solid ${C.border}`, background: C.raised, cursor: 'pointer' }}
              />
              <input
                type="text"
                value={template.header_color}
                onChange={e => setTemplate(prev => ({ ...prev, header_color: e.target.value }))}
                style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.raised, color: C.text1, fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = C.primary}
                onBlur={e => e.target.style.borderColor = C.border}
              />
            </div>
          </div>

          {/* Header Text */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text2, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Header Text (Optional)
            </label>
            <textarea
              value={template.header_text}
              onChange={e => setTemplate(prev => ({ ...prev, header_text: e.target.value }))}
              placeholder="Additional text to show at the top of reports"
              rows={2}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.raised, color: C.text1, fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
              onFocus={e => e.target.style.borderColor = C.primary}
              onBlur={e => e.target.style.borderColor = C.border}
            />
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                id="show-header-text"
                checked={template.show_header_text}
                onChange={e => setTemplate(prev => ({ ...prev, show_header_text: e.target.checked }))}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <label htmlFor="show-header-text" style={{ fontSize: 13, color: C.text2, cursor: 'pointer' }}>
                Show header text in reports
              </label>
            </div>
          </div>

          {/* Footer Text */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text2, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Footer Text (Optional)
            </label>
            <textarea
              value={template.footer_text}
              onChange={e => setTemplate(prev => ({ ...prev, footer_text: e.target.value }))}
              placeholder="Additional text to show at the bottom of reports"
              rows={2}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.raised, color: C.text1, fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
              onFocus={e => e.target.style.borderColor = C.primary}
              onBlur={e => e.target.style.borderColor = C.border}
            />
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                id="show-footer-text"
                checked={template.show_footer_text}
                onChange={e => setTemplate(prev => ({ ...prev, show_footer_text: e.target.checked }))}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <label htmlFor="show-footer-text" style={{ fontSize: 13, color: C.text2, cursor: 'pointer' }}>
                Show footer text in reports
              </label>
            </div>
          </div>
        </div>

        {/* Right Column - Preview */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text2, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Preview
          </label>
          <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '32px 24px', border: `1px solid ${C.border}`, minHeight: 500 }}>
            <ReportPreview template={template} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '20px 28px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: C.primary, color: '#131313', fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif', opacity: saving ? 0.6 : 1, transition: 'all 0.15s' }}
          onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#FF8C5A'; }}
          onMouseLeave={e => { if (!saving) e.currentTarget.style.background = C.primary; }}
        >
          {saving ? 'Saving...' : 'Save Template'}
        </button>
      </div>
    </div>
  );
}

function ReportPreview({ template }) {
  const logoSizes = { small: 40, medium: 60, large: 80 };
  const logoSize = logoSizes[template.logo_size] || 60;

  const renderHeader = () => {
    const isTopPosition = template.logo_position?.startsWith('top');
    const isSidePosition = template.logo_position?.startsWith('side');

    if (isSidePosition && template.show_logo && template.logo_url) {
      return (
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 24 }}>
          {template.logo_position === 'side-left' && (
            <img src={template.logo_url} alt="Logo" style={{ width: logoSize, height: logoSize, objectFit: 'contain' }} />
          )}
          <div style={{ flex: 1 }}>
            {template.show_college_name && template.college_name && (
              <h1 style={{ fontSize: 18, fontWeight: 700, color: template.header_color, margin: '0 0 8px', fontFamily: 'Inter, sans-serif' }}>
                {template.college_name}
              </h1>
            )}
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#333', margin: 0, fontFamily: 'Inter, sans-serif' }}>
              Student Report
            </h2>
          </div>
          {template.logo_position === 'side-right' && (
            <img src={template.logo_url} alt="Logo" style={{ width: logoSize, height: logoSize, objectFit: 'contain' }} />
          )}
        </div>
      );
    }

    return (
      <div style={{ marginBottom: 24 }}>
        {isTopPosition && template.show_logo && template.logo_url && (
          <div style={{ display: 'flex', justifyContent: template.logo_position === 'top-left' ? 'flex-start' : template.logo_position === 'top-right' ? 'flex-end' : 'center', marginBottom: 12 }}>
            <img src={template.logo_url} alt="Logo" style={{ width: logoSize, height: logoSize, objectFit: 'contain' }} />
          </div>
        )}
        {template.show_college_name && template.college_name && (
          <h1 style={{ fontSize: 18, fontWeight: 700, color: template.header_color, margin: '0 0 8px', fontFamily: 'Inter, sans-serif', textAlign: template.college_name_position === 'top-left' ? 'left' : template.college_name_position === 'top-right' ? 'right' : 'center' }}>
            {template.college_name}
          </h1>
        )}
        {template.show_subtitle && template.subtitle && (
          <p style={{ fontSize: 13, fontWeight: 400, color: '#666', margin: '0 0 12px', fontFamily: 'Inter, sans-serif', textAlign: 'center', fontStyle: 'italic' }}>
            {template.subtitle}
          </p>
        )}
        {template.show_header_text && template.header_text && (
          <p style={{ fontSize: 11, color: '#666', margin: '0 0 16px', fontFamily: 'Inter, sans-serif', textAlign: 'center', lineHeight: 1.5, padding: '8px 12px', background: '#F5F5F5', borderRadius: 6 }}>
            {template.header_text}
          </p>
        )}
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#333', margin: 0, fontFamily: 'Inter, sans-serif', textAlign: 'center' }}>
          Student Report
        </h2>
      </div>
    );
  };

  return (
    <div style={{ fontSize: template.font_size, color: '#000', fontFamily: 'Inter, sans-serif' }}>
      {renderHeader()}
      
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: template.font_size }}>
        <thead>
          <tr style={{ background: `${template.header_color}15`, borderBottom: `2px solid ${template.header_color}` }}>
            <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600, color: template.header_color }}>Name</th>
            <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600, color: template.header_color }}>Roll No</th>
            <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600, color: template.header_color }}>Email</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #E5E5E5' }}>
            <td style={{ padding: '8px', color: '#333' }}>John Doe</td>
            <td style={{ padding: '8px', color: '#333' }}>2021001</td>
            <td style={{ padding: '8px', color: '#333' }}>john@example.com</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #E5E5E5' }}>
            <td style={{ padding: '8px', color: '#333' }}>Jane Smith</td>
            <td style={{ padding: '8px', color: '#333' }}>2021002</td>
            <td style={{ padding: '8px', color: '#333' }}>jane@example.com</td>
          </tr>
          <tr>
            <td style={{ padding: '8px', color: '#333' }}>Bob Johnson</td>
            <td style={{ padding: '8px', color: '#333' }}>2021003</td>
            <td style={{ padding: '8px', color: '#333' }}>bob@example.com</td>
          </tr>
        </tbody>
      </table>

      <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #E5E5E5', fontSize: template.font_size - 2, color: '#666', textAlign: 'center' }}>
        {template?.show_footer_text && template?.footer_text && (
          <p style={{ margin: '0 0 8px', lineHeight: 1.5 }}>{template.footer_text}</p>
        )}
        Generated on {new Date().toLocaleDateString()}
      </div>
    </div>
  );
}
