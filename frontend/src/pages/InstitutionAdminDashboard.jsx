import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import logo from '../assets/logo.png';

// Design tokens matching TeacherDashboard
const C = {
  shell:      '#0E0E0E',
  sidebar:    '#141414',
  surface:    '#1A1A1A',
  raised:     '#222222',
  border:     '#2A2A2A',
  borderHi:   '#383838',
  primary:    '#FF6B35',
  primaryLo:  'rgba(255,107,53,0.10)',
  primaryMid: 'rgba(255,107,53,0.20)',
  secondary: '#C0C1FF',
  secondaryLo: 'rgba(192,193,255,0.12)',
  text1:      '#F0F0F0',
  text2:      '#9E9E9E',
  text3:      '#555555',
  danger:     '#EF4444',
  success:    '#22C55E',
};

// Avatar helper
const AVATAR_COLORS = ['#4f46e5','#0d9488','#7c3aed','#db2777','#d97706','#16a34a'];
const avatarBg = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
const ini = (n) => n?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

function Avatar({ name, size = 32 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: avatarBg(name), flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.33, fontWeight: 700, color: '#fff',
    }}>{ini(name)}</div>
  );
}

// Sidebar nav item
function NavItem({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
      background: active ? C.primaryLo : 'none',
      color: active ? C.primary : C.text2,
      borderLeft: `2px solid ${active ? C.primary : 'transparent'}`,
      fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: active ? 600 : 400,
      letterSpacing: '0.06em', textTransform: 'uppercase',
      transition: 'all 0.15s', textAlign: 'left',
    }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = C.primaryLo; e.currentTarget.style.color = C.text1; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = C.text2; } }}
    >
      <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>{icon}</span>
      {label}
    </button>
  );
}

export default function InstitutionAdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('messages');
  const [loading, setLoading] = useState(true);
  
  // Departments
  const [departments, setDepartments] = useState([]);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  
  // Users
  const [users, setUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userFilter, setUserFilter] = useState('all'); // all, student, teacher

  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalDepartments: 0,
    activeGroups: 0
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const token = localStorage.getItem('token');
      
      // Fetch departments
      const deptRes = await axios.get(`${apiUrl}/admin/departments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDepartments(deptRes.data || []);
      
      // Fetch users
      const usersRes = await axios.get(`${apiUrl}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(usersRes.data || []);
      
      // Calculate stats
      const students = usersRes.data?.filter(u => u.role === 'student').length || 0;
      const teachers = usersRes.data?.filter(u => u.role === 'teacher').length || 0;
      
      setStats({
        totalStudents: students,
        totalTeachers: teachers,
        totalDepartments: deptRes.data?.length || 0,
        activeGroups: 0 // TODO: fetch from groups API
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.shell, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text1, fontFamily: 'Inter, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 16, height: 16, border: `4px solid ${C.primary}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }}></div>
          <p style={{ color: C.text2, fontSize: 13 }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const NAV = [
    { id: 'messages', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, label: 'Messages' },
    { id: 'faculty', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, label: 'Faculty Manager' },
    { id: 'departments', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, label: 'Departments' },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Inter, sans-serif', background: C.shell, color: C.text1, overflow: 'hidden' }}>

      {/* Left Sidebar */}
      <div style={{ width: 210, flexShrink: 0, background: C.sidebar, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', padding: '0 0 16px' }}>
        {/* Brand */}
        <div style={{ padding: '24px 20px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: C.primaryLo, border: `1px solid ${C.primaryMid}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={logo} alt="logo" style={{ width: 20, height: 20, objectFit: 'contain' }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.text1, fontFamily: 'Manrope, Inter, sans-serif', letterSpacing: '-0.01em', lineHeight: 1.1 }}>Studi+</div>
              <div style={{ fontSize: 9, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.10em', fontWeight: 600 }}>Institution Admin</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, padding: '0 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(n => <NavItem key={n.id} icon={n.icon} label={n.label} active={activeTab === n.id} onClick={() => setActiveTab(n.id)} />)}
        </div>

        {/* Go Back Button */}
        <div style={{ padding: '0 10px', marginBottom: 12 }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px 16px',
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: C.raised,
              color: C.text2,
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = C.primaryLo;
              e.currentTarget.style.borderColor = C.primary;
              e.currentTarget.style.color = C.primary;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = C.raised;
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.color = C.text2;
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Main
          </button>
        </div>

        {/* User card at bottom */}
        <div style={{ margin: '0 10px', padding: '12px', borderRadius: 10, background: C.raised, border: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Avatar name={user?.name} size={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
              <div style={{ fontSize: 10, color: C.text3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{ width: '100%', padding: '6px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'none', color: C.text2, fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = C.raised; e.currentTarget.style.borderColor = C.borderHi; e.currentTarget.style.color = C.text1; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.text2; }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Stats Grid */}
        <div style={{ padding: '24px 32px', borderBottom: `1px solid ${C.border}`, background: C.surface }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <StatCard title="Total Students" value={stats.totalStudents} icon={<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>} color="blue" />
            <StatCard title="Total Teachers" value={stats.totalTeachers} icon={<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>} color="green" />
            <StatCard title="Departments" value={stats.totalDepartments} icon={<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>} color="purple" />
            <StatCard title="Active Groups" value={stats.activeGroups} icon={<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>} color="yellow" />
          </div>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '32px' }}>
          {activeTab === 'messages' && <MessagesTab />}
          {activeTab === 'faculty' && <FacultyTab users={users.filter(u => u.role === 'teacher')} departments={departments} onRefresh={fetchData} />}
          {activeTab === 'departments' && <DepartmentsTab departments={departments} users={users} onAdd={() => { setEditingDept(null); setShowDeptModal(true); }} onEdit={(dept) => { setEditingDept(dept); setShowDeptModal(true); }} onRefresh={fetchData} />}
        </div>
      </div>

      {/* Modals */}
      {showDeptModal && (
        <DepartmentModal
          department={editingDept}
          onClose={() => { setShowDeptModal(false); setEditingDept(null); }}
          onSuccess={() => { setShowDeptModal(false); setEditingDept(null); fetchData(); }}
        />
      )}

      {showUserModal && (
        <UserModal
          user={editingUser}
          departments={departments}
          onClose={() => { setShowUserModal(false); setEditingUser(null); }}
          onSuccess={() => { setShowUserModal(false); setEditingUser(null); fetchData(); }}
        />
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  const colorClasses = {
    blue: { from: '#3b82f6', to: '#2563eb', bg: 'rgba(59,130,246,0.10)' },
    green: { from: '#22c55e', to: '#16a34a', bg: 'rgba(34,197,94,0.10)' },
    yellow: { from: '#eab308', to: '#ca8a04', bg: 'rgba(234,179,8,0.10)' },
    purple: { from: C.primary, to: '#9394E8', bg: C.primaryLo }
  };
  const colors = colorClasses[color];

  return (
    <div style={{ background: colors.bg, borderRadius: 12, padding: '20px', border: `1px solid ${C.border}`, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -10, right: -10, fontSize: 60, opacity: 0.1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
      <div style={{ position: 'relative' }}>
        <div style={{ fontSize: 11, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: colors.from, fontFamily: 'Manrope, Inter, sans-serif', lineHeight: 1 }}>{value}</div>
      </div>
    </div>
  );
}

function MessagesTab() {
  return (
    <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: '48px', textAlign: 'center' }}>
      <div style={{ maxWidth: 400, margin: '0 auto' }}>
        <div style={{ fontSize: 64, marginBottom: 20, display: 'flex', justifyContent: 'center' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="1.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <h3 style={{ fontSize: 20, fontWeight: 700, color: C.text1, marginBottom: 12, fontFamily: 'Manrope, Inter, sans-serif' }}>Direct Messages</h3>
        <p style={{ fontSize: 14, color: C.text2, marginBottom: 24, lineHeight: 1.6 }}>Message faculty and students directly through the messaging system</p>
        <button
          onClick={() => window.location.href = '/dashboard'}
          style={{ padding: '12px 32px', borderRadius: 10, border: 'none', background: C.primary, color: '#131313', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background = '#FF8C5A'}
          onMouseLeave={e => e.currentTarget.style.background = C.primary}
        >
          Go to Messages
        </button>
      </div>
    </div>
  );
}

function DeptCell({ user, departments, onAssign }) {
  const [editing, setEditing] = useState(false);
  // Match by FK first, fall back to matching the legacy text `department` field
  const dept = departments.find(d => d.id === user.department_id)
    || departments.find(d => d.name === user.department);
  const resolvedDeptId = dept?.id || user.department_id || '';

  if (editing) {
    return (
      <select
        autoFocus
        value={resolvedDeptId}
        onChange={e => { onAssign(user.id, e.target.value); setEditing(false); }}
        onBlur={() => setEditing(false)}
        style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${C.primary}`, background: C.raised, color: C.text1, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif', outline: 'none', maxWidth: 180 }}
      >
        <option value="">No Department</option>
        {departments.map(d => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </select>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      title="Click to change department"
      style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 6, transition: 'background 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.background = C.raised}
      onMouseLeave={e => e.currentTarget.style.background = 'none'}
    >
      <span style={{ fontSize: 13, color: dept ? C.text1 : C.text3 }}>{dept ? dept.name : '—'}</span>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={C.text3} strokeWidth="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    </button>
  );
}

function FacultyTab({ users, departments, onRefresh }) {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  const filteredUsers = users.filter(u => {
    const matchesSearch = !searchQuery || u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = !deptFilter || u.department_id === deptFilter;
    return matchesSearch && matchesDept;
  });

  const handleAssignRole = async (userId, role) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const token = localStorage.getItem('token');
      await axios.put(
        `${apiUrl}/admin/users/${userId}`,
        { faculty_role: role },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onRefresh();
    } catch (error) {
      console.error('Error assigning role:', error);
      alert('Failed to assign role');
    }
  };

  const handleAssignDepartment = async (userId, departmentId) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const token = localStorage.getItem('token');
      await axios.put(
        `${apiUrl}/admin/users/${userId}`,
        { department_id: departmentId || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onRefresh();
    } catch (error) {
      console.error('Error assigning department:', error);
      alert('Failed to assign department');
    }
  };

  const handleSendEmail = () => {
    const emails = selectedEmails.join(',');
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emails)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(gmailUrl, '_blank');
    setShowEmailModal(false);
    setSelectedEmails([]);
    setEmailSubject('');
    setEmailBody('');
  };

  const FACULTY_ROLES = ['HOD', 'Academic Head', 'DC', 'Professor', 'Assistant Professor', 'Associate Professor'];

  return (
    <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '24px 28px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text1, margin: 0, fontFamily: 'Manrope, Inter, sans-serif' }}>Faculty Management</h2>
          <p style={{ fontSize: 13, color: C.text3, margin: '4px 0 0' }}>Manage faculty roles and send communications</p>
        </div>
        <button
          onClick={() => {
            setSelectedEmails(users.map(u => u.email));
            setShowEmailModal(true);
          }}
          style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: C.primary, color: '#131313', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background = '#FF8C5A'}
          onMouseLeave={e => e.currentTarget.style.background = C.primary}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
          Email All Faculty
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div style={{ padding: '16px 28px', borderBottom: `1px solid ${C.border}`, display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.text3} strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.raised, color: C.text1, fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = C.primary}
            onBlur={e => e.target.style.borderColor = C.border}
          />
        </div>
        <select
          value={deptFilter}
          onChange={e => setDeptFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.raised, color: deptFilter ? C.text1 : C.text3, fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none', cursor: 'pointer', minWidth: 180 }}
        >
          <option value="">All Departments</option>
          {departments.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        {(searchQuery || deptFilter) && (
          <button
            onClick={() => { setSearchQuery(''); setDeptFilter(''); }}
            style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'none', color: C.text2, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}
          >
            Clear
          </button>
        )}
        <span style={{ fontSize: 12, color: C.text3, whiteSpace: 'nowrap' }}>{filteredUsers.length} of {users.length}</span>
      </div>

      {/* Content */}
      <div style={{ padding: '28px' }}>
        {filteredUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: C.text3, fontSize: 14 }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5, display: 'flex', justifyContent: 'center' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <p>{users.length === 0 ? 'No faculty members yet. Add teachers to get started.' : 'No results match your search.'}</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Name</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Email</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Department</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Faculty Role</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, idx) => (
                  <tr key={user.id} style={{ borderBottom: idx < filteredUsers.length - 1 ? `1px solid ${C.border}` : 'none', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = C.raised}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar name={user.name} size={32} />
                        <span style={{ fontSize: 13, fontWeight: 500, color: C.text1 }}>{user.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px', fontSize: 13, color: C.text2 }}>{user.email}</td>
                    <td style={{ padding: '16px' }}>
                      <DeptCell user={user} departments={departments} onAssign={handleAssignDepartment} />
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: user.faculty_role ? 'rgba(34,197,94,0.15)' : 'rgba(100,100,100,0.15)', color: user.faculty_role ? '#22c55e' : C.text3, border: `1px solid ${user.faculty_role ? 'rgba(34,197,94,0.25)' : 'rgba(100,100,100,0.25)'}` }}>
                        {user.faculty_role || 'No Role'}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <select
                          value={user.faculty_role || ''}
                          onChange={(e) => handleAssignRole(user.id, e.target.value)}
                          style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.raised, color: C.text1, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif', outline: 'none' }}
                        >
                          <option value="">Assign Role</option>
                          {FACULTY_ROLES.map((role) => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => {
                            setSelectedEmails([user.email]);
                            setShowEmailModal(true);
                          }}
                          style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'none', color: C.text2, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = C.raised; e.currentTarget.style.color = C.text1; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = C.text2; }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                            <polyline points="22,6 12,13 2,6"/>
                          </svg>
                          Email
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }} onClick={() => setShowEmailModal(false)}>
          <div style={{ background: C.surface, borderRadius: 16, padding: 32, maxWidth: 600, width: '100%', border: `1px solid ${C.border}`, animation: 'popIn 0.2s ease' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: C.text1, margin: '0 0 20px', fontFamily: 'Manrope, Inter, sans-serif' }}>Compose Email</h3>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>To:</label>
              <div style={{ fontSize: 13, color: C.text2, padding: '10px 14px', background: C.raised, borderRadius: 8, border: `1px solid ${C.border}` }}>{selectedEmails.join(', ')}</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Subject</label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.raised, color: C.text1, fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' }}
                placeholder="Email subject"
                onFocus={e => e.target.style.borderColor = C.primary}
                onBlur={e => e.target.style.borderColor = C.border}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Message</label>
              <textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.raised, color: C.text1, fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none', resize: 'vertical', minHeight: 120, boxSizing: 'border-box' }}
                placeholder="Write your message..."
                onFocus={e => e.target.style.borderColor = C.primary}
                onBlur={e => e.target.style.borderColor = C.border}
              />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowEmailModal(false)}
                style={{ flex: 1, padding: '10px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'none', color: C.text2, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = C.raised; e.currentTarget.style.color = C.text1; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = C.text2; }}
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={!emailSubject || !emailBody}
                style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: C.primary, color: '#131313', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', opacity: (!emailSubject || !emailBody) ? 0.5 : 1, transition: 'all 0.15s' }}
                onMouseEnter={e => { if (emailSubject && emailBody) e.currentTarget.style.background = '#FF8C5A'; }}
                onMouseLeave={e => { if (emailSubject && emailBody) e.currentTarget.style.background = C.primary; }}
              >
                Open in Gmail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DepartmentsTab({ departments, users, onAdd, onEdit, onRefresh }) {
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this department?')) return;
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const token = localStorage.getItem('token');
      await axios.delete(`${apiUrl}/admin/departments/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onRefresh();
    } catch (error) {
      console.error('Error deleting department:', error);
      alert('Failed to delete department');
    }
  };

  // Calculate department statistics
  const getDepartmentStats = (deptId) => {
    const deptUsers = users.filter(u => u.department_id === deptId);
    const students = deptUsers.filter(u => u.role === 'student').length;
    const teachers = deptUsers.filter(u => u.role === 'teacher').length;
    return { students, teachers, total: students + teachers };
  };

  return (
    <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '24px 28px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text1, margin: 0, fontFamily: 'Manrope, Inter, sans-serif' }}>Departments</h2>
          <p style={{ fontSize: 13, color: C.text3, margin: '4px 0 0' }}>Manage institution departments and view statistics</p>
        </div>
        <button
          onClick={onAdd}
          style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: C.primary, color: '#131313', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background = '#FF8C5A'}
          onMouseLeave={e => e.currentTarget.style.background = C.primary}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Department
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '28px' }}>
        {departments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: C.text3, fontSize: 14 }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5, display: 'flex', justifyContent: 'center' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <p>No departments yet. Create your first department to get started.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {departments.map((dept) => {
              const stats = getDepartmentStats(dept.id);
              return (
                <div
                  key={dept.id}
                  style={{ background: C.raised, borderRadius: 12, padding: 20, border: `1px solid ${C.border}`, transition: 'all 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = C.borderHi}
                  onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
                >
                  <div style={{ marginBottom: 16 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text1, margin: '0 0 4px', fontFamily: 'Manrope, Inter, sans-serif' }}>{dept.name}</h3>
                    {dept.code && (
                      <p style={{ fontSize: 11, color: C.text3, margin: 0, fontFamily: 'monospace', letterSpacing: '0.05em' }}>CODE: {dept.code}</p>
                    )}
                    {dept.description && (
                      <p style={{ fontSize: 12, color: C.text2, margin: '8px 0 0', lineHeight: 1.5 }}>{dept.description}</p>
                    )}
                  </div>

                  {/* Statistics */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16, padding: 12, background: C.surface, borderRadius: 8, border: `1px solid ${C.border}` }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#3b82f6', fontFamily: 'Manrope, Inter, sans-serif' }}>{stats.students}</div>
                      <div style={{ fontSize: 9, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginTop: 2 }}>Students</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#22c55e', fontFamily: 'Manrope, Inter, sans-serif' }}>{stats.teachers}</div>
                      <div style={{ fontSize: 9, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginTop: 2 }}>Teachers</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: C.primary, fontFamily: 'Manrope, Inter, sans-serif' }}>{stats.total}</div>
                      <div style={{ fontSize: 9, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginTop: 2 }}>Total</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => onEdit(dept)}
                      style={{ flex: 1, padding: '8px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'none', color: C.text2, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = C.primaryLo; e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.color = C.primary; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.text2; }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(dept.id)}
                      style={{ flex: 1, padding: '8px', borderRadius: 8, border: `1px solid rgba(239,68,68,0.3)`, background: 'rgba(239,68,68,0.1)', color: C.danger, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function DepartmentModal({ department, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: department?.name || '',
    code: department?.code || '',
    description: department?.description || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const token = localStorage.getItem('token');

      if (department) {
        await axios.put(`${apiUrl}/admin/departments/${department.id}`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${apiUrl}/admin/departments`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving department:', error);
      alert('Failed to save department');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', background: C.raised, border: `1px solid ${C.border}`,
    borderRadius: 8, padding: '10px 14px', color: C.text1, fontSize: 13,
    fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }} onClick={onClose}>
      <div style={{ background: C.surface, borderRadius: 16, padding: 32, maxWidth: 480, width: '100%', border: `1px solid ${C.border}`, animation: 'popIn 0.2s ease' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize: 20, fontWeight: 700, color: C.text1, margin: '0 0 24px', fontFamily: 'Manrope, Inter, sans-serif' }}>
          {department ? 'Edit' : 'Add'} Department
        </h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Department Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={inputStyle}
              placeholder="e.g., Computer Science"
              required
              onFocus={e => e.target.style.borderColor = C.primary}
              onBlur={e => e.target.style.borderColor = C.border}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Department Code</label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              style={inputStyle}
              placeholder="e.g., CSE, ECE"
              onFocus={e => e.target.style.borderColor = C.primary}
              onBlur={e => e.target.style.borderColor = C.border}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Description (Optional)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
              placeholder="Brief description of the department..."
              onFocus={e => e.target.style.borderColor = C.primary}
              onBlur={e => e.target.style.borderColor = C.border}
            />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, padding: '10px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'none', color: C.text2, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = C.raised; e.currentTarget.style.color = C.text1; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = C.text2; }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: C.primary, color: '#131313', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', opacity: loading ? 0.5 : 1, transition: 'all 0.15s' }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#FF8C5A'; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = C.primary; }}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UserModal({ user, departments, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'student',
    department_id: user?.department_id || '',
    faculty_role: user?.faculty_role || '',
    roll_no: user?.roll_no || '',
    year: user?.year || '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const FACULTY_ROLES = ['HOD', 'Academic Head', 'DC', 'Professor', 'Assistant Professor', 'Associate Professor'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const token = localStorage.getItem('token');

      const payload = { ...form };
      if (!payload.password) delete payload.password; // Don't send empty password on edit

      if (user) {
        await axios.put(`${apiUrl}/admin/users/${user.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${apiUrl}/admin/users`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving user:', error);
      alert(error.response?.data?.error || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', background: C.raised, border: `1px solid ${C.border}`,
    borderRadius: 8, padding: '10px 14px', color: C.text1, fontSize: 13,
    fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20, overflowY: 'auto' }} onClick={onClose}>
      <div style={{ background: C.surface, borderRadius: 16, padding: 32, maxWidth: 480, width: '100%', border: `1px solid ${C.border}`, animation: 'popIn 0.2s ease', margin: '32px 0' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize: 20, fontWeight: 700, color: C.text1, margin: '0 0 24px', fontFamily: 'Manrope, Inter, sans-serif' }}>
          {user ? 'Edit' : 'Add'} User
        </h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={inputStyle}
              required
              onFocus={e => e.target.style.borderColor = C.primary}
              onBlur={e => e.target.style.borderColor = C.border}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              style={inputStyle}
              required
              onFocus={e => e.target.style.borderColor = C.primary}
              onBlur={e => e.target.style.borderColor = C.border}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              style={inputStyle}
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Department</label>
            <select
              value={form.department_id}
              onChange={(e) => setForm({ ...form, department_id: e.target.value })}
              style={inputStyle}
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>
          {form.role === 'teacher' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Faculty Role</label>
              <select
                value={form.faculty_role}
                onChange={(e) => setForm({ ...form, faculty_role: e.target.value })}
                style={inputStyle}
              >
                <option value="">Select Role</option>
                {FACULTY_ROLES.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
          )}
          {form.role === 'student' && (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Roll Number</label>
                <input
                  type="text"
                  value={form.roll_no}
                  onChange={(e) => setForm({ ...form, roll_no: e.target.value })}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = C.primary}
                  onBlur={e => e.target.style.borderColor = C.border}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Year</label>
                <select
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                  style={inputStyle}
                >
                  <option value="">Select Year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>
            </>
          )}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Password {user && '(leave blank to keep current)'}
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              style={inputStyle}
              required={!user}
              minLength={8}
              placeholder={user ? 'Leave blank to keep current' : 'Minimum 8 characters'}
              onFocus={e => e.target.style.borderColor = C.primary}
              onBlur={e => e.target.style.borderColor = C.border}
            />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, padding: '10px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'none', color: C.text2, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = C.raised; e.currentTarget.style.color = C.text1; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = C.text2; }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: C.primary, color: '#131313', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', opacity: loading ? 0.5 : 1, transition: 'all 0.15s' }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#FF8C5A'; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = C.primary; }}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}




