import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function AdminReviewPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(null);
  const [error, setError] = useState('');
  const [adminMessage, setAdminMessage] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing token');
      setLoading(false);
      return;
    }
    
    fetchRequestDetails();
  }, [token]);

  const fetchRequestDetails = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${apiUrl}/onboarding/admin/review/${token}`);
      const data = await response.json();
      
      if (response.ok && data.valid) {
        setRequest(data.request);
      } else {
        setError(data.error || 'Failed to load request details');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!adminMessage.trim()) {
      alert('Please provide a message for the applicant');
      return;
    }
    
    setProcessing(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${apiUrl}/onboarding/admin/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, adminMessage })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess(true);
        setTimeout(() => navigate('/admin/dashboard'), 2000);
      } else {
        alert(data.error || 'Failed to approve request');
      }
    } catch (err) {
      alert('Failed to connect to server');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!adminMessage.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    
    if (!confirm('Are you sure you want to reject this request?')) {
      return;
    }
    
    setProcessing(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${apiUrl}/onboarding/admin/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, adminMessage })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess(true);
        setTimeout(() => navigate('/admin/dashboard'), 2000);
      } else {
        alert(data.error || 'Failed to reject request');
      }
    } catch (err) {
      alert('Failed to connect to server');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#A5A6F6] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading request details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1e] rounded-2xl p-8 border border-white/5 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1e] rounded-2xl p-8 border border-white/5 text-center">
          <div className="w-16 h-16 bg-[#A5A6F6]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#A5A6F6]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Success!</h2>
          <p className="text-gray-400">Request processed and email sent.</p>
        </div>
      </div>
    );
  }

  if (request?.status !== 'pending') {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1e] rounded-2xl p-8 border border-white/5 text-center">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Already Processed</h2>
          <p className="text-gray-400">This request has already been {request.status}.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-6">
      <div className="max-w-3xl mx-auto py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Review Demo Request</h1>
          <p className="text-gray-400">Review the details and approve or reject this request</p>
        </div>

        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1e] rounded-2xl p-8 border border-white/5 mb-6">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                Institution Name
              </label>
              <p className="text-white text-lg font-medium">{request.institutionName}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                Contact Name
              </label>
              <p className="text-white text-lg font-medium">{request.contactName}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                Email
              </label>
              <p className="text-white">{request.email}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                Phone
              </label>
              <p className="text-white">{request.phone}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                Student Count
              </label>
              <p className="text-white">{request.studentCount || 'Not provided'}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                Submitted On
              </label>
              <p className="text-white">{new Date(request.createdAt).toLocaleString()}</p>
            </div>
          </div>
          
          {request.message && (
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                Additional Information
              </label>
              <p className="text-white bg-[#0A0A0A] p-4 rounded-lg border border-white/5">{request.message}</p>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1e] rounded-2xl p-8 border border-white/5">
          <h2 className="text-2xl font-bold mb-4">Your Response</h2>
          <div className="mb-6">
            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
              Message to Applicant *
            </label>
            <textarea
              value={adminMessage}
              onChange={(e) => setAdminMessage(e.target.value)}
              rows="5"
              className="w-full px-4 py-3 bg-[#0A0A0A] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#A5A6F6] transition-colors resize-none"
              placeholder="Provide feedback, next steps, or reason for your decision..."
              required
            ></textarea>
            <p className="text-xs text-gray-500 mt-2">This message will be included in the email sent to the applicant</p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleReject}
              disabled={processing}
              className="flex-1 px-6 py-3.5 border border-red-500/50 text-red-500 rounded-lg hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {processing ? 'Processing...' : 'Reject Request'}
            </button>
            <button
              onClick={handleApprove}
              disabled={processing}
              className="flex-1 px-6 py-3.5 bg-[#A5A6F6] text-black rounded-lg hover:bg-[#9394E8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {processing ? 'Processing...' : 'Approve & Send Link'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
