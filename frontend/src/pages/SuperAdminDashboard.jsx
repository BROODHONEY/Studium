import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('institutions');
  const [institutions, setInstitutions] = useState([]);
  const [demoRequests, setDemoRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: null, item: null });
  const [stats, setStats] = useState({
    totalInstitutions: 0,
    activeInstitutions: 0,
    pendingRequests: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      
      // Fetch institutions
      const instResponse = await fetch(`${apiUrl}/institutions`);
      const instData = await instResponse.json();
      setInstitutions(instData || []);
      
      // Fetch demo requests
      const demoResponse = await fetch(`${apiUrl}/demo-requests/all`);
      const demoData = await demoResponse.json();
      setDemoRequests(demoData || []);
      
      // Calculate stats
      const activeCount = instData?.filter(i => i.status === 'active').length || 0;
      const pendingCount = demoData?.filter(d => d.status === 'pending').length || 0;
      
      setStats({
        totalInstitutions: instData?.length || 0,
        activeInstitutions: activeCount,
        pendingRequests: pendingCount,
        totalRevenue: 0 // Calculate based on plans
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (institutionId, newStatus) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${apiUrl}/institutions/${institutionId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDeleteInstitution = (institution) => {
    setDeleteModal({
      isOpen: true,
      type: 'institution',
      item: institution
    });
  };

  const handleDeleteDemoRequest = (request) => {
    setDeleteModal({
      isOpen: true,
      type: 'demoRequest',
      item: request
    });
  };

  const confirmDelete = async () => {
    const { type, item } = deleteModal;
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    try {
      if (type === 'institution') {
        const response = await fetch(`${apiUrl}/institutions/${item.id}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to delete');
        }
      } else if (type === 'demoRequest') {
        const response = await fetch(`${apiUrl}/institutions/demo-requests/${item.id}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to delete');
        }
      }

      await fetchData();
      setDeleteModal({ isOpen: false, type: null, item: null });
    } catch (error) {
      console.error('Delete error:', error);
      alert(`Failed to delete: ${error.message}`);
      throw error;
    }
  };

  const handlePlanChange = async (institutionId, newPlan) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${apiUrl}/institutions/${institutionId}/plan`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: newPlan })
      });
      
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error updating plan:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#A5A6F6] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1e]">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-1">Super Admin Dashboard</h1>
              <p className="text-gray-400 text-sm">Manage institutions and monitor platform activity</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 border border-white/10 rounded-lg hover:bg-white/5 transition-colors text-sm"
            >
              Back to Home
            </button>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Institutions"
            value={stats.totalInstitutions}
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>}
            color="blue"
          />
          <StatCard
            title="Active Institutions"
            value={stats.activeInstitutions}
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>}
            color="green"
          />
          <StatCard
            title="Pending Requests"
            value={stats.pendingRequests}
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/></svg>}
            color="yellow"
          />
          <StatCard
            title="Total Revenue"
            value={`$${stats.totalRevenue.toLocaleString()}`}
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/></svg>}
            color="purple"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-white/5">
          <button
            onClick={() => setActiveTab('institutions')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'institutions'
                ? 'text-[#A5A6F6] border-b-2 border-[#A5A6F6]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Institutions
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 font-medium transition-colors relative ${
              activeTab === 'requests'
                ? 'text-[#A5A6F6] border-b-2 border-[#A5A6F6]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Demo Requests
            {stats.pendingRequests > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                {stats.pendingRequests}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        {activeTab === 'institutions' && (
          <InstitutionsTable
            institutions={institutions}
            onStatusChange={handleStatusChange}
            onPlanChange={handlePlanChange}
            onDelete={handleDeleteInstitution}
          />
        )}
        
        {activeTab === 'requests' && (
          <DemoRequestsTable
            requests={demoRequests}
            onRefresh={fetchData}
            onDelete={handleDeleteDemoRequest}
          />
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, type: null, item: null })}
        onConfirm={confirmDelete}
        title={
          deleteModal.type === 'institution' 
            ? `Delete Institution "${deleteModal.item?.name}"?`
            : `Delete Demo Request from "${deleteModal.item?.institution_name}"?`
        }
        itemName={
          deleteModal.type === 'institution'
            ? deleteModal.item?.name || ''
            : deleteModal.item?.institution_name || ''
        }
        warningItems={
          deleteModal.type === 'institution'
            ? [
                'All users and admin accounts',
                'All groups and channels',
                'All messages and files',
                'All assignments and submissions',
                'All quizzes and attempts',
                'All departments and resources',
                'All institution data'
              ]
            : [
                'This demo request',
                'Contact information',
                'Request history'
              ]
        }
      />
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  const colorClasses = {
    blue: 'from-blue-500/10 to-blue-600/5 text-blue-400',
    green: 'from-green-500/10 to-green-600/5 text-green-400',
    yellow: 'from-yellow-500/10 to-yellow-600/5 text-yellow-400',
    purple: 'from-[#A5A6F6]/10 to-[#9394E8]/5 text-[#A5A6F6]'
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-2xl p-6 border border-white/5`}>
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm text-gray-400">{title}</div>
    </div>
  );
}

function InstitutionsTable({ institutions, onStatusChange, onPlanChange, onDelete }) {
  return (
    <div className="bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1e] rounded-2xl border border-white/5 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#0A0A0A] border-b border-white/5">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Institution</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Code</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email Domain</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Plan</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Created</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {institutions.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                  No institutions yet
                </td>
              </tr>
            ) : (
              institutions.map((inst) => (
                <tr key={inst.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{inst.name}</div>
                    <div className="text-sm text-gray-400">{inst.contact_email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm text-[#A5A6F6] tracking-widest uppercase">{inst.subdomain}</span>
                  </td>
                  <td className="px-6 py-4">
                    {inst.allowed_email_domain
                      ? <span className="text-sm text-green-400 font-mono">{inst.allowed_email_domain}</span>
                      : <span className="text-sm text-gray-600 italic">any</span>
                    }
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={inst.plan}
                      onChange={(e) => onPlanChange(inst.id, e.target.value)}
                      className="bg-[#0A0A0A] border border-white/10 rounded px-3 py-1 text-sm text-white focus:outline-none focus:border-[#A5A6F6]"
                    >
                      <option value="basic">Basic</option>
                      <option value="premium">Premium</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={inst.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {new Date(inst.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <select
                        value={inst.status}
                        onChange={(e) => onStatusChange(inst.id, e.target.value)}
                        className="bg-[#0A0A0A] border border-white/10 rounded px-3 py-1 text-sm text-white focus:outline-none focus:border-[#A5A6F6]"
                      >
                        <option value="active">Active</option>
                        <option value="suspended">Suspend</option>
                        <option value="inactive">Deactivate</option>
                      </select>
                      <button
                        onClick={() => onDelete(inst)}
                        className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-sm font-medium hover:bg-red-500/30 transition-colors border border-red-500/30"
                        title="Delete institution"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DemoRequestsTable({ requests, onRefresh, onDelete }) {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1e] rounded-2xl border border-white/5 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#0A0A0A] border-b border-white/5">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Institution</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Students</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {requests.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                  No demo requests yet
                </td>
              </tr>
            ) : (
              requests.map((req) => (
                <tr key={req.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{req.institution_name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-white">{req.contact_name}</div>
                    <div className="text-sm text-gray-400">{req.email}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{req.phone}</td>
                  <td className="px-6 py-4 text-gray-300">{req.student_count || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={req.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {new Date(req.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {req.status === 'pending' && (
                        <button
                          onClick={() => {
                            // Generate token and navigate
                            const token = btoa(JSON.stringify({ demoRequestId: req.id }));
                            navigate(`/admin/review?token=${token}`);
                          }}
                          className="px-3 py-1 bg-[#A5A6F6] text-black rounded text-sm font-medium hover:bg-[#9394E8] transition-colors"
                        >
                          Review
                        </button>
                      )}
                      <button
                        onClick={() => onDelete(req)}
                        className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-sm font-medium hover:bg-red-500/30 transition-colors border border-red-500/30"
                        title="Delete request"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const statusConfig = {
    active: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Active' },
    suspended: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Suspended' },
    inactive: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Inactive' },
    pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Pending' },
    approved: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Approved' },
    rejected: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Rejected' },
    contacted: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Contacted' },
    converted: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Converted' }
  };

  const config = statusConfig[status] || statusConfig.inactive;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}
