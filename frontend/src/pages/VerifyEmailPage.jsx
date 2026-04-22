import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('No verification token found.');
      return;
    }

    const verify = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const res = await fetch(`${apiUrl}/auth/verify-email?token=${token}`);
        const data = await res.json();

        if (!res.ok) {
          setStatus('error');
          setMessage(data.error || 'Verification failed.');
          return;
        }

        login(data.token, data.user);
        setStatus('success');

        setTimeout(() => {
          if (data.user.role === 'teacher') navigate('/teacher');
          else navigate('/dashboard');
        }, 2000);
      } catch {
        setStatus('error');
        setMessage('Something went wrong. Please try again.');
      }
    };

    verify();
  }, []);

  return (
    <AuthLayout tagline="Verifying your account." sub="">
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        {status === 'verifying' && (
          <>
            <div style={{ width: 48, height: 48, border: '3px solid #6366F1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 20px' }} />
            <p style={{ color: '#888', fontSize: 14 }}>Verifying your email…</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#F0F0F0', margin: '0 0 8px' }}>Email verified!</h2>
            <p style={{ color: '#888', fontSize: 13 }}>Redirecting you to your dashboard…</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: 52, marginBottom: 16 }}>❌</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#F0F0F0', margin: '0 0 8px' }}>Verification failed</h2>
            <p style={{ color: '#EF4444', fontSize: 13, marginBottom: 24 }}>{message}</p>
            <button
              onClick={() => navigate('/institution-select')}
              style={{ background: '#6366F1', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
