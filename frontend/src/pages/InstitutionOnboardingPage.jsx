import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import AuthLayout from '../components/AuthLayout';

export default function InstitutionOnboardingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [institutionData, setInstitutionData] = useState({
    name: '',
    code: '',
    adminEmail: searchParams.get('email') || '',
    adminName: '',
    adminPassword: '',
    phone: '',
    address: '',
    studentCount: '',
    allowedEmailDomain: ''
  });

  const [packageData, setPackageData] = useState({
    plan: 'basic',
    billingCycle: 'monthly'
  });

  const handleInstitutionChange = (e) => {
    setInstitutionData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 6);
    setInstitutionData(prev => ({ ...prev, code: value }));
  };

  const validateStep1 = () => {
    if (!institutionData.name.trim()) {
      setError('Institution name is required');
      return false;
    }
    if (institutionData.code.length !== 6) {
      setError('Institution code must be exactly 6 characters');
      return false;
    }
    if (!institutionData.adminEmail.trim()) {
      setError('Admin email is required');
      return false;
    }
    if (!institutionData.adminName.trim()) {
      setError('Admin name is required');
      return false;
    }
    if (!institutionData.adminPassword || institutionData.adminPassword.length < 8) {
      setError('Admin password must be at least 8 characters');
      return false;
    }
    return true;
  };

  const handleStep1Continue = async () => {
    setError('');
    if (!validateStep1()) return;

    setLoading(true);
    try {
      // Check if code is available
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      await axios.post(`${apiUrl}/institutions/check-code`, { code: institutionData.code });
      
      setStep(2);
    } catch (err) {
      if (err.response?.status === 409) {
        setError('This institution code is already taken. Please choose another.');
      } else {
        setError(err.response?.data?.error || 'Failed to verify code');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePackageSelect = (plan) => {
    setPackageData(prev => ({ ...prev, plan }));
  };

  const handleBillingCycleSelect = (cycle) => {
    setPackageData(prev => ({ ...prev, billingCycle: cycle }));
  };

  const handlePayment = async () => {
    setLoading(true);
    setError('');

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      
      // Create institution with payment info
      const response = await axios.post(`${apiUrl}/institutions/onboard`, {
        ...institutionData,
        ...packageData
      });

      // Show success and redirect
      setStep(4);
      setTimeout(() => {
        navigate('/institution-select');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create institution');
      setLoading(false);
    }
  };

  const inp = {
    width: '100%', background: '#1E1E1E', border: '1px solid #2E2E2E',
    borderRadius: 12, padding: '11px 14px', fontSize: 13, fontWeight: 300,
    color: '#F0F0F0', outline: 'none', fontFamily: 'Inter, sans-serif',
    boxSizing: 'border-box', transition: 'border-color 0.15s',
  };
  const lbl = {
    fontSize: 11, fontWeight: 500, color: '#666', textTransform: 'uppercase',
    letterSpacing: '0.08em', display: 'block', marginBottom: 6,
  };

  // Step 1: Institution Details
  if (step === 1) {
    return (
      <AuthLayout
        tagline="Welcome to Studi+"
        sub="Set up your institution account"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#F0F0F0', margin: '0 0 6px', letterSpacing: '-0.02em', fontFamily: "'Manrope','Inter',sans-serif" }}>
              Institution Details
            </h2>
            <p style={{ fontSize: 13, fontWeight: 300, color: '#666', margin: 0 }}>
              Step 1 of 3: Set up your institution and create master admin account
            </p>
          </div>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 13, fontWeight: 300 }}>
              {error}
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleStep1Continue(); }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={lbl}>Institution Name</label>
              <input 
                style={inp}
                type="text" 
                name="name"
                value={institutionData.name}
                onChange={handleInstitutionChange}
                placeholder="e.g., Rajiv Gandhi University"
                required
                onFocus={e => e.target.style.borderColor = '#6366F1'}
                onBlur={e => e.target.style.borderColor = '#2E2E2E'}
              />
            </div>

            <div>
              <label style={lbl}>Institution Code (6 characters)</label>
              <input 
                style={{ ...inp, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 15, fontWeight: 500 }}
                type="text" 
                name="code"
                value={institutionData.code}
                onChange={handleCodeChange}
                placeholder="RGUKTN"
                maxLength={6}
                required
                onFocus={e => e.target.style.borderColor = '#6366F1'}
                onBlur={e => e.target.style.borderColor = '#2E2E2E'}
              />
              <p style={{ fontSize: 11, color: '#555', margin: '6px 0 0', fontWeight: 300 }}>
                This will be your unique login code. Choose carefully - it cannot be changed later.
              </p>
            </div>

            <div>
              <label style={lbl}>Master Admin Name</label>
              <input 
                style={inp}
                type="text" 
                name="adminName"
                value={institutionData.adminName}
                onChange={handleInstitutionChange}
                placeholder="Full Name"
                required
                onFocus={e => e.target.style.borderColor = '#6366F1'}
                onBlur={e => e.target.style.borderColor = '#2E2E2E'}
              />
            </div>

            <div>
              <label style={lbl}>Master Admin Email</label>
              <input 
                style={inp}
                type="email" 
                name="adminEmail"
                value={institutionData.adminEmail}
                onChange={handleInstitutionChange}
                placeholder="admin@institution.edu"
                required
                onFocus={e => e.target.style.borderColor = '#6366F1'}
                onBlur={e => e.target.style.borderColor = '#2E2E2E'}
              />
              <p style={{ fontSize: 11, color: '#555', margin: '6px 0 0', fontWeight: 300 }}>
                This will be your master admin account for managing the institution
              </p>
            </div>

            <div>
              <label style={lbl}>Allowed Email Domain</label>
              <input
                style={inp}
                type="text"
                name="allowedEmailDomain"
                value={institutionData.allowedEmailDomain}
                onChange={handleInstitutionChange}
                placeholder="@xyz.edu.in"
                onFocus={e => e.target.style.borderColor = '#6366F1'}
                onBlur={e => e.target.style.borderColor = '#2E2E2E'}
              />
              <p style={{ fontSize: 11, color: '#555', margin: '6px 0 0', fontWeight: 300 }}>
                Only emails ending with this domain can register. Leave blank to allow any email. Each domain can only be used by one institution.
              </p>
            </div>

            <div>
              <label style={lbl}>Master Admin Password</label>
              <input 
                style={inp}
                type="password" 
                name="adminPassword"
                value={institutionData.adminPassword}
                onChange={handleInstitutionChange}
                placeholder="At least 8 characters"
                required
                minLength={8}
                onFocus={e => e.target.style.borderColor = '#6366F1'}
                onBlur={e => e.target.style.borderColor = '#2E2E2E'}
              />
            </div>

            <div>
              <label style={lbl}>Phone Number</label>
              <input 
                style={inp}
                type="tel" 
                name="phone"
                value={institutionData.phone}
                onChange={handleInstitutionChange}
                placeholder="+91 98765 43210"
                onFocus={e => e.target.style.borderColor = '#6366F1'}
                onBlur={e => e.target.style.borderColor = '#2E2E2E'}
              />
            </div>

            <div>
              <label style={lbl}>Address (Optional)</label>
              <textarea 
                style={{ ...inp, minHeight: 60, resize: 'vertical' }}
                name="address"
                value={institutionData.address}
                onChange={handleInstitutionChange}
                placeholder="Institution address"
                onFocus={e => e.target.style.borderColor = '#6366F1'}
                onBlur={e => e.target.style.borderColor = '#2E2E2E'}
              />
            </div>

            <div>
              <label style={lbl}>Approximate Student Count</label>
              <input 
                style={inp}
                type="number" 
                name="studentCount"
                value={institutionData.studentCount}
                onChange={handleInstitutionChange}
                placeholder="e.g., 5000"
                onFocus={e => e.target.style.borderColor = '#6366F1'}
                onBlur={e => e.target.style.borderColor = '#2E2E2E'}
              />
            </div>

            <button type="submit" disabled={loading} className="btn-auth" style={{ marginTop: 8 }}>
              {loading ? 'Verifying…' : 'Continue to Package Selection'}
            </button>
          </form>
        </div>
      </AuthLayout>
    );
  }

  // Step 2: Package Selection
  if (step === 2) {
    const packages = [
      { id: 'basic', name: 'Basic', monthlyPrice: 4999, yearlyPrice: 49999, features: ['Up to 1000 students', 'Basic features', 'Email support'] },
      { id: 'premium', name: 'Premium', monthlyPrice: 9999, yearlyPrice: 99999, features: ['Up to 5000 students', 'All features', 'Priority support', 'Custom branding'] },
      { id: 'enterprise', name: 'Enterprise', monthlyPrice: 19999, yearlyPrice: 199999, features: ['Unlimited students', 'All features', '24/7 support', 'Custom integrations', 'Dedicated account manager'] }
    ];

    const selectedPackage = packages.find(p => p.id === packageData.plan);
    const price = packageData.billingCycle === 'monthly' ? selectedPackage.monthlyPrice : selectedPackage.yearlyPrice;

    return (
      <AuthLayout
        tagline="Choose your plan"
        sub="Select the package that fits your institution"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#F0F0F0', margin: '0 0 6px', letterSpacing: '-0.02em', fontFamily: "'Manrope','Inter',sans-serif" }}>
              Select Package
            </h2>
            <p style={{ fontSize: 13, fontWeight: 300, color: '#666', margin: 0 }}>
              Step 2 of 3: Choose your subscription plan
            </p>
          </div>

          {/* Billing Cycle Toggle */}
          <div style={{ display: 'flex', gap: 8, background: '#1E1E1E', padding: 4, borderRadius: 10 }}>
            <button
              type="button"
              onClick={() => handleBillingCycleSelect('monthly')}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: 8,
                border: 'none',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
                fontFamily: 'Inter, sans-serif',
                ...(packageData.billingCycle === 'monthly'
                  ? { background: '#6366F1', color: '#fff' }
                  : { background: 'transparent', color: '#888' })
              }}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => handleBillingCycleSelect('yearly')}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: 8,
                border: 'none',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
                fontFamily: 'Inter, sans-serif',
                ...(packageData.billingCycle === 'yearly'
                  ? { background: '#6366F1', color: '#fff' }
                  : { background: 'transparent', color: '#888' })
              }}
            >
              Yearly <span style={{ fontSize: 11, opacity: 0.8 }}>(Save 17%)</span>
            </button>
          </div>

          {/* Package Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {packages.map(pkg => (
              <div
                key={pkg.id}
                onClick={() => handlePackageSelect(pkg.id)}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  border: packageData.plan === pkg.id ? '2px solid #6366F1' : '1px solid #2E2E2E',
                  background: packageData.plan === pkg.id ? 'rgba(99,102,241,0.05)' : '#1E1E1E',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: '#F0F0F0', margin: 0 }}>{pkg.name}</h3>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#F0F0F0' }}>
                      ₹{(packageData.billingCycle === 'monthly' ? pkg.monthlyPrice : pkg.yearlyPrice).toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: 11, color: '#666' }}>
                      per {packageData.billingCycle === 'monthly' ? 'month' : 'year'}
                    </div>
                  </div>
                </div>
                <ul style={{ margin: 0, padding: '0 0 0 20px', fontSize: 12, color: '#888', lineHeight: 1.8 }}>
                  {pkg.features.map((feature, i) => (
                    <li key={i}>{feature}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => setStep(1)}
              style={{
                flex: 1,
                padding: '11px 14px',
                borderRadius: 12,
                border: '1px solid #2E2E2E',
                background: 'transparent',
                color: '#F0F0F0',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="btn-auth"
              style={{ flex: 2 }}
            >
              Continue to Payment
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // Step 3: Mock Payment
  if (step === 3) {
    const packages = [
      { id: 'basic', name: 'Basic', monthlyPrice: 4999, yearlyPrice: 49999 },
      { id: 'premium', name: 'Premium', monthlyPrice: 9999, yearlyPrice: 99999 },
      { id: 'enterprise', name: 'Enterprise', monthlyPrice: 19999, yearlyPrice: 199999 }
    ];

    const selectedPackage = packages.find(p => p.id === packageData.plan);
    const price = packageData.billingCycle === 'monthly' ? selectedPackage.monthlyPrice : selectedPackage.yearlyPrice;

    return (
      <AuthLayout
        tagline="Complete your purchase"
        sub="Mock payment for demonstration"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#F0F0F0', margin: '0 0 6px', letterSpacing: '-0.02em', fontFamily: "'Manrope','Inter',sans-serif" }}>
              Payment
            </h2>
            <p style={{ fontSize: 13, fontWeight: 300, color: '#666', margin: 0 }}>
              Step 3 of 3: Complete your subscription
            </p>
          </div>

          {/* Order Summary */}
          <div style={{ background: '#1E1E1E', padding: 16, borderRadius: 12, border: '1px solid #2E2E2E' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#F0F0F0', margin: '0 0 12px' }}>Order Summary</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
              <span style={{ color: '#888' }}>Institution:</span>
              <span style={{ color: '#F0F0F0', fontWeight: 500 }}>{institutionData.name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
              <span style={{ color: '#888' }}>Code:</span>
              <span style={{ color: '#F0F0F0', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{institutionData.code}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
              <span style={{ color: '#888' }}>Plan:</span>
              <span style={{ color: '#F0F0F0', fontWeight: 500 }}>{selectedPackage.name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 13 }}>
              <span style={{ color: '#888' }}>Billing:</span>
              <span style={{ color: '#F0F0F0', fontWeight: 500, textTransform: 'capitalize' }}>{packageData.billingCycle}</span>
            </div>
            <div style={{ borderTop: '1px solid #2E2E2E', paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 16 }}>
              <span style={{ color: '#F0F0F0', fontWeight: 600 }}>Total:</span>
              <span style={{ color: '#6366F1', fontWeight: 700 }}>₹{price.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Mock Payment Form */}
          <div style={{ background: 'rgba(99,102,241,0.05)', padding: 16, borderRadius: 12, border: '1px solid rgba(99,102,241,0.2)' }}>
            <p style={{ fontSize: 12, color: '#FF6B35', margin: 0, textAlign: 'center' }}>
              🎭 This is a mock payment screen for demonstration purposes
            </p>
          </div>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 13, fontWeight: 300 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => setStep(2)}
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
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              Back
            </button>
            <button
              onClick={handlePayment}
              disabled={loading}
              className="btn-auth"
              style={{ flex: 2 }}
            >
              {loading ? 'Processing…' : 'Complete Payment'}
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // Step 4: Success
  return (
    <AuthLayout
      tagline="Welcome aboard!"
      sub="Your institution is now active"
    >
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#F0F0F0', margin: '0 0 8px' }}>
          Setup Complete!
        </h2>
        <p style={{ fontSize: 13, color: '#666', margin: '0 0 16px' }}>
          Your institution <span style={{ color: '#6366F1', fontWeight: 600 }}>{institutionData.name}</span> is now active.
        </p>
        <div style={{ background: '#1E1E1E', padding: 16, borderRadius: 12, border: '1px solid #2E2E2E', marginBottom: 16 }}>
          <p style={{ fontSize: 12, color: '#888', margin: '0 0 8px' }}>Your institution code:</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: '#6366F1', margin: 0, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            {institutionData.code}
          </p>
        </div>
        <p style={{ fontSize: 12, color: '#666', margin: 0 }}>
          Redirecting to login...
        </p>
      </div>
    </AuthLayout>
  );
}

