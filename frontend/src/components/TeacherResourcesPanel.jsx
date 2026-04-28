import { useState, useEffect } from 'react';
import axios from 'axios';

const C = {
  surface: '#1A1A1A',
  raised: '#222222',
  border: '#2A2A2A',
  borderHi: '#383838',
  primary: '#FF6B35',
  primaryLo: 'rgba(255,107,53,0.10)',
  text1: '#F0F0F0',
  text2: '#9E9E9E',
  text3: '#555555',
};

export default function TeacherResourcesPanel({ user }) {
  const [activeTab, setActiveTab] = useState('files');
  const [resources, setResources] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [curriculum, setCurriculum] = useState([]);
  const [departmentInfo, setDepartmentInfo] = useState([]);
  const [departmentMembers, setDepartmentMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    if (activeTab === 'files') {
      fetchResources();
      fetchFolders();
    } else if (activeTab === 'templates') {
      fetchTemplates();
    } else if (activeTab === 'curriculum') {
      fetchCurriculum();
    } else if (activeTab === 'info') {
      fetchDepartmentInfo();
      fetchDepartmentMembers();
    }
  }, [activeTab, currentFolder]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const params = {};
      if (user.department_id) params.departmentId = user.department_id;
      if (currentFolder) params.folderId = currentFolder;
      
      const res = await axios.get('/api/teacher-resources/resources', { params });
      setResources(res.data);
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFolders = async () => {
    try {
      const params = {};
      if (user.department_id) params.departmentId = user.department_id;
      const res = await axios.get('/api/teacher-resources/folders', { params });
      setFolders(res.data);
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const params = {};
      if (user.department_id) params.departmentId = user.department_id;
      const res = await axios.get('/api/teacher-resources/templates', { params });
      setTemplates(res.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurriculum = async () => {
    try {
      setLoading(true);
      if (!user.department_id) return;
      const res = await axios.get('/api/teacher-resources/curriculum', {
        params: { departmentId: user.department_id }
      });
      setCurriculum(res.data);
    } catch (error) {
      console.error('Error fetching curriculum:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentInfo = async () => {
    try {
      if (!user.department_id) return;
      const res = await axios.get('/api/teacher-resources/department-info', {
        params: { departmentId: user.department_id }
      });
      setDepartmentInfo(res.data);
    } catch (error) {
      console.error('Error fetching department info:', error);
    }
  };

  const fetchDepartmentMembers = async () => {
    try {
      if (!user.department_id) return;
      const res = await axios.get('/api/teacher-resources/department-members', {
        params: { departmentId: user.department_id }
      });
      setDepartmentMembers(res.data);
    } catch (error) {
      console.error('Error fetching department members:', error);
    }
  };

  const handleUpload = async (formData) => {
    try {
      await axios.post('/api/teacher-resources/resources', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowUploadModal(false);
      fetchResources();
    } catch (error) {
      console.error('Error uploading resource:', error);
      alert('Failed to upload resource');
    }
  };

  const handleDownload = async (resourceId) => {
    try {
      const res = await axios.get(`/api/teacher-resources/resources/${resourceId}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'resource');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading resource:', error);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.surface }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}` }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px', color: C.text1 }}>
          Resources & Files
        </h2>
        <p style={{ fontSize: 12, color: C.text2, margin: 0 }}>
          Manage department resources, templates, and curriculum
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: '12px 24px', borderBottom: `1px solid ${C.border}`, background: C.raised }}>
        {[
          { id: 'files', label: 'Files & Resources', icon: '📁' },
          { id: 'templates', label: 'Templates', icon: '📄' },
          { id: 'curriculum', label: 'Curriculum', icon: '📚' },
          { id: 'info', label: 'Department Info', icon: 'ℹ️' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: 'none',
              background: activeTab === tab.id ? C.primaryLo : 'transparent',
              color: activeTab === tab.id ? C.primary : C.text2,
              fontSize: 12,
              fontWeight: activeTab === tab.id ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        {activeTab === 'files' && <FilesTab resources={resources} folders={folders} onUpload={() => setShowUploadModal(true)} onDownload={handleDownload} loading={loading} />}
        {activeTab === 'templates' && <TemplatesTab templates={templates} loading={loading} />}
        {activeTab === 'curriculum' && <CurriculumTab curriculum={curriculum} loading={loading} />}
        {activeTab === 'info' && <DepartmentInfoTab info={departmentInfo} members={departmentMembers} />}
      </div>

      {showUploadModal && <UploadModal onClose={() => setShowUploadModal(false)} onUpload={handleUpload} user={user} />}
    </div>
  );
}

function FilesTab({ resources, folders, onUpload, onDownload, loading }) {
  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: C.text2 }}>Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: C.text1 }}>Shared Files</h3>
        <button
          onClick={onUpload}
          style={{
            padding: '8px 16px',
            borderRadius: 6,
            border: 'none',
            background: C.primary,
            color: '#000',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          + Upload File
        </button>
      </div>

      {folders.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ fontSize: 12, fontWeight: 600, color: C.text2, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Folders</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {folders.map(folder => (
              <div key={folder.id} style={{ padding: 16, background: C.raised, border: `1px solid ${C.border}`, borderRadius: 8, cursor: 'pointer' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>📁</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text1 }}>{folder.name}</div>
                <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>{folder.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 style={{ fontSize: 12, fontWeight: 600, color: C.text2, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Files</h4>
        {resources.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: C.text3 }}>No files uploaded yet</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {resources.map(resource => (
              <div key={resource.id} style={{ padding: 16, background: C.raised, border: `1px solid ${C.border}`, borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text1, marginBottom: 4 }}>{resource.title}</div>
                  <div style={{ fontSize: 11, color: C.text3 }}>
                    {resource.uploader_name} • {new Date(resource.created_at).toLocaleDateString()} • {(resource.file_size / 1024).toFixed(1)} KB
                  </div>
                  {resource.description && <div style={{ fontSize: 12, color: C.text2, marginTop: 8 }}>{resource.description}</div>}
                </div>
                <button
                  onClick={() => onDownload(resource.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: `1px solid ${C.border}`,
                    background: 'transparent',
                    color: C.primary,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TemplatesTab({ templates, loading }) {
  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: C.text2 }}>Loading...</div>;

  const templateTypes = {
    student_report: '📊 Student Report',
    progress_report: '📈 Progress Report',
    assessment: '✍️ Assessment',
    attendance: '📅 Attendance',
    custom: '📄 Custom'
  };

  return (
    <div>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: C.text1 }}>Report Templates</h3>
      {templates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: C.text3 }}>No templates available</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
          {templates.map(template => (
            <div key={template.id} style={{ padding: 20, background: C.raised, border: `1px solid ${C.border}`, borderRadius: 8 }}>
              <div style={{ fontSize: 24, marginBottom: 12 }}>{templateTypes[template.template_type]?.split(' ')[0] || '📄'}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text1, marginBottom: 8 }}>{template.name}</div>
              <div style={{ fontSize: 11, color: C.text3, marginBottom: 12 }}>{template.description}</div>
              <div style={{ fontSize: 10, color: C.text2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {templateTypes[template.template_type]}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CurriculumTab({ curriculum, loading }) {
  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: C.text2 }}>Loading...</div>;

  return (
    <div>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: C.text1 }}>Department Curriculum</h3>
      {curriculum.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: C.text3 }}>No curriculum data available</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {curriculum.map(course => (
            <div key={course.id} style={{ padding: 20, background: C.raised, border: `1px solid ${C.border}`, borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text1, marginBottom: 4 }}>
                    {course.course_code} - {course.course_name}
                  </div>
                  <div style={{ fontSize: 11, color: C.text3 }}>
                    {course.academic_year} • {course.semester} • {course.credits} Credits
                  </div>
                </div>
              </div>
              {course.syllabus && (
                <div style={{ fontSize: 12, color: C.text2, marginTop: 12, lineHeight: 1.6 }}>
                  {course.syllabus}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DepartmentInfoTab({ info, members }) {
  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: C.text1 }}>Department Members</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {members.map(member => (
            <div key={member.id} style={{ padding: 16, background: C.raised, border: `1px solid ${C.border}`, borderRadius: 8 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>👤</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text1, marginBottom: 4 }}>{member.name}</div>
              <div style={{ fontSize: 11, color: C.text3 }}>{member.email}</div>
              <div style={{ fontSize: 10, color: C.text2, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 8 }}>
                {member.role}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: C.text1 }}>Department Information</h3>
        {info.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: C.text3 }}>No information available</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {info.map(item => (
              <div key={item.id} style={{ padding: 20, background: C.raised, border: `1px solid ${C.border}`, borderRadius: 8 }}>
                {item.is_pinned && (
                  <div style={{ display: 'inline-block', padding: '4px 8px', background: C.primaryLo, color: C.primary, fontSize: 10, fontWeight: 600, borderRadius: 4, marginBottom: 8 }}>
                    📌 PINNED
                  </div>
                )}
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text1, marginBottom: 8 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.6, marginBottom: 12 }}>{item.content}</div>
                <div style={{ fontSize: 10, color: C.text3 }}>
                  Posted by {item.creator_name} • {new Date(item.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UploadModal({ onClose, onUpload, user }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    resourceType: 'material',
    category: '',
    isPublic: false
  });
  const [file, setFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('file', file);
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('resourceType', formData.resourceType);
    data.append('category', formData.category);
    data.append('isPublic', formData.isPublic);
    if (user.department_id) data.append('departmentId', user.department_id);
    onUpload(data);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 32, width: '100%', maxWidth: 500 }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: C.text1 }}>Upload Resource</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.text2, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', background: C.raised, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text1, fontSize: 13 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.text2, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              style={{ width: '100%', padding: '10px 12px', background: C.raised, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text1, fontSize: 13, resize: 'vertical' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.text2, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>File</label>
            <input
              type="file"
              required
              onChange={e => setFile(e.target.files[0])}
              style={{ width: '100%', padding: '10px 12px', background: C.raised, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text1, fontSize: 13 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'transparent', color: C.text1, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" style={{ flex: 1, padding: '10px', borderRadius: 6, border: 'none', background: C.primary, color: '#000', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Upload
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

