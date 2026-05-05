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

export default function ReportGeneratorModal({ students, reportType = 'student', onClose }) {
  const [step, setStep] = useState('format'); // 'format' or 'preview'
  const [format, setFormat] = useState('csv');
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchTemplate();
  }, []);

  const fetchTemplate = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const token = localStorage.getItem('token');
      const res = await axios.get(`${apiUrl}/report-templates/public`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTemplate(res.data);
    } catch (error) {
      console.error('Error fetching template:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCSV = (data) => {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(val => 
        typeof val === 'string' && val.includes(',') ? `"${val}"` : val
      ).join(',')
    );
    
    return [headers, ...rows].join('\n');
  };

  const handleDownload = async () => {
    setGenerating(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const token = localStorage.getItem('token');

      if (format === 'csv') {
        const csvContent = generateCSV(students);
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report_${Date.now()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const res = await axios.post(
          `${apiUrl}/reports/generate`,
          { students, format, template, reportType },
          {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'blob'
          }
        );

        const blob = new Blob([res.data], {
          type: format === 'xlsx' 
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'application/pdf'
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report_${Date.now()}.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
      }

      onClose();
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: C.surface, borderRadius: 16, padding: 48, textAlign: 'center' }}>
          <div style={{ width: 24, height: 24, border: `3px solid ${C.primary}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 16px' }}/>
          <p style={{ color: C.text2, fontSize: 13 }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={onClose}>
      <div style={{ background: C.surface, borderRadius: 16, width: '100%', maxWidth: step === 'preview' ? 900 : 500, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: `1px solid ${C.border}` }}
        onClick={e => e.stopPropagation()}>
        
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.10em', fontWeight: 600, marginBottom: 4 }}>
              {step === 'format' ? 'Step 1: Select Format' : 'Step 2: Preview & Download'}
            </div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.text1, fontFamily: 'Manrope, Inter, sans-serif' }}>
              Generate Report
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text3, fontSize: 20, lineHeight: 1, padding: 4 }}
            onMouseEnter={e => e.currentTarget.style.color = C.text1}
            onMouseLeave={e => e.currentTarget.style.color = C.text3}>
            ✕
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {step === 'format' ? (
            <div>
              <p style={{ fontSize: 14, color: C.text2, marginBottom: 24, lineHeight: 1.6 }}>
                Select the format for your report. {students?.length || 0} students will be included.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <FormatOption
                  icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>}
                  title="CSV"
                  description="Comma-separated values, compatible with Excel and spreadsheet apps"
                  selected={format === 'csv'}
                  onClick={() => setFormat('csv')}
                />
                <FormatOption
                  icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="M9 15h6"/></svg>}
                  title="Excel (XLSX)"
                  description="Formatted spreadsheet with college branding and styling"
                  selected={format === 'xlsx'}
                  onClick={() => setFormat('xlsx')}
                  badge="Styled"
                />
                <FormatOption
                  icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
                  title="PDF"
                  description="Professional document with college logo and custom formatting"
                  selected={format === 'pdf'}
                  onClick={() => setFormat('pdf')}
                  badge="Styled"
                />
              </div>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 8, background: C.primaryLo, border: `1px solid ${C.primaryMid}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                <span style={{ fontSize: 13, color: C.text1 }}>
                  Preview of your {format.toUpperCase()} report
                </span>
              </div>

              <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '24px', border: `1px solid ${C.border}`, maxHeight: 500, overflowY: 'auto' }}>
                <ReportPreview format={format} students={students} template={template} />
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {step === 'preview' && (
            <button
              onClick={() => setStep('format')}
              style={{ padding: '10px 20px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'none', color: C.text2, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = C.raised; e.currentTarget.style.color = C.text1; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = C.text2; }}
            >
              ← Back
            </button>
          )}
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={onClose}
              style={{ padding: '10px 20px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'none', color: C.text2, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = C.raised; e.currentTarget.style.color = C.text1; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = C.text2; }}
            >
              Cancel
            </button>
            {step === 'format' ? (
              <button
                onClick={() => setStep('preview')}
                style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: C.primary, color: '#131313', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#FF8C5A'}
                onMouseLeave={e => e.currentTarget.style.background = C.primary}
              >
                Preview →
              </button>
            ) : (
              <button
                onClick={handleDownload}
                disabled={generating}
                style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: C.primary, color: '#131313', fontSize: 13, fontWeight: 700, cursor: generating ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif', opacity: generating ? 0.6 : 1, transition: 'all 0.15s' }}
                onMouseEnter={e => { if (!generating) e.currentTarget.style.background = '#FF8C5A'; }}
                onMouseLeave={e => { if (!generating) e.currentTarget.style.background = C.primary; }}
              >
                {generating ? 'Generating...' : 'Download'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FormatOption({ icon, title, description, selected, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '16px 20px',
        borderRadius: 12,
        border: `2px solid ${selected ? C.primary : C.border}`,
        background: selected ? C.primaryLo : C.raised,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.15s',
        fontFamily: 'Inter, sans-serif',
        position: 'relative',
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.borderColor = C.borderHi; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.borderColor = C.border; }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ color: selected ? C.primary : C.text3, flexShrink: 0 }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: selected ? C.primary : C.text1 }}>
              {title}
            </h4>
            {badge && (
              <span style={{ padding: '2px 8px', borderRadius: 4, background: C.primaryMid, color: C.primary, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {badge}
              </span>
            )}
          </div>
          <p style={{ margin: 0, fontSize: 13, color: C.text2, lineHeight: 1.5 }}>
            {description}
          </p>
        </div>
        {selected && (
          <div style={{ flexShrink: 0, color: C.primary }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
        )}
      </div>
    </button>
  );
}

function ReportPreview({ format, students, template }) {
  if (format === 'csv') {
    const headers = students && students.length > 0 ? Object.keys(students[0]) : [];
    return (
      <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#000' }}>
        <div style={{ marginBottom: 12, padding: '8px 12px', background: '#F5F5F5', borderRadius: 6, fontWeight: 600 }}>
          {headers.join(', ')}
        </div>
        {students?.slice(0, 5).map((student, idx) => (
          <div key={idx} style={{ padding: '6px 12px', borderBottom: '1px solid #E5E5E5' }}>
            {Object.values(student).join(', ')}
          </div>
        ))}
        {students?.length > 5 && (
          <div style={{ padding: '12px', textAlign: 'center', color: '#666', fontSize: 11 }}>
            ... and {students.length - 5} more rows
          </div>
        )}
      </div>
    );
  }

  const logoSizes = { small: 40, medium: 60, large: 80 };
  const logoSize = logoSizes[template?.logo_size] || 60;

  const renderHeader = () => {
    const isTopPosition = template?.logo_position?.startsWith('top');
    const isSidePosition = template?.logo_position?.startsWith('side');

    if (isSidePosition && template?.show_logo && template?.logo_url) {
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
        {isTopPosition && template?.show_logo && template?.logo_url && (
          <div style={{ display: 'flex', justifyContent: template.logo_position === 'top-left' ? 'flex-start' : template.logo_position === 'top-right' ? 'flex-end' : 'center', marginBottom: 12 }}>
            <img src={template.logo_url} alt="Logo" style={{ width: logoSize, height: logoSize, objectFit: 'contain' }} />
          </div>
        )}
        {template?.show_college_name && template?.college_name && (
          <h1 style={{ fontSize: 18, fontWeight: 700, color: template.header_color, margin: '0 0 8px', fontFamily: 'Inter, sans-serif', textAlign: template.college_name_position === 'top-left' ? 'left' : template.college_name_position === 'top-right' ? 'right' : 'center' }}>
            {template.college_name}
          </h1>
        )}
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#333', margin: 0, fontFamily: 'Inter, sans-serif', textAlign: 'center' }}>
          Student Report
        </h2>
      </div>
    );
  };

  const headers = students && students.length > 0 ? Object.keys(students[0]) : [];

  return (
    <div style={{ fontSize: template?.font_size || 12, color: '#000', fontFamily: 'Inter, sans-serif' }}>
      {renderHeader()}
      
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: template?.font_size || 12 }}>
        <thead>
          <tr style={{ background: `${template?.header_color || '#FF6B35'}15`, borderBottom: `2px solid ${template?.header_color || '#FF6B35'}` }}>
            {headers.map((header, idx) => (
              <th key={idx} style={{ padding: '8px', textAlign: 'left', fontWeight: 600, color: template?.header_color || '#FF6B35', textTransform: 'capitalize' }}>
                {header.replace(/_/g, ' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {students?.slice(0, 5).map((student, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid #E5E5E5' }}>
              {headers.map((header, hidx) => (
                <td key={hidx} style={{ padding: '8px', color: '#333' }}>
                  {student[header]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {students?.length > 5 && (
        <div style={{ marginTop: 16, padding: '12px', background: '#F5F5F5', borderRadius: 6, textAlign: 'center', fontSize: (template?.font_size || 12) - 1, color: '#666' }}>
          ... and {students.length - 5} more students
        </div>
      )}

      <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #E5E5E5', fontSize: (template?.font_size || 12) - 2, color: '#666', textAlign: 'center' }}>
        Generated on {new Date().toLocaleDateString()}
      </div>
    </div>
  );
}
