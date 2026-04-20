import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

export default function OnboardingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [step, setStep] = useState(1); // 1: Package, 2: Payment, 3: Subdomain
  const [loading, setLoading] = useState(true);
  const [tokenData, setTokenData] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('premium');
  const [subdomain, setSubdomain] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      const res = await axios.get(`/api/onboarding/verify-token/${token}`);
      setTokenData(res.data.data);
      setLoading(false);
    } catch (error) {
      setError(error.response?.data?.error || 'Invalid or expired link');
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setProcessing(true);
    setError('');
    
    try {
      // Process mock payment
      const paymentRes = await axios.post('/api/onboarding/process-payment', {
        plan: selectedPlan,
        token
      });

      if (paymentRes.data.success) {
        setStep(3);
      }
    } catch (error) {
      setError('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateInstitution = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setError('');

    try {
      const res = await axios.post('/api/onboarding/create-institution', {
        token,
        subdomain,
        plan: selectedPlan,
        paymentId: 'MOCK_PAYMENT_ID'
      });

      if (res.data.success) {
        // Redirect to login with institution
        navigate(`/login?institution=${subdomain}&new=true`);
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create institution');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (error && !tokenData) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="max-w-md w-full bg-[#1a1a2e] border border-white/10 rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-4">Invalid Link</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-[#A5A6F6] text-black px-6 py-3 rounded-lg font-medium hover:bg-[#9394E8] transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Welcome to Studi+</h1>
          <p className="text-gray-400">
            Hi {tokenData?.contactName}, let's set up {tokenData?.institutionName}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center gap-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step >= s ? 'bg-[#A5A6F6] text-black' : 'bg-white/10 text-gray-500'
                }`}>
                  {s}
                </div>
                {s < 3 && <div className={`w-16 h-1 mx-2 ${step > s ? 'bg-[#A5A6F6]' : 'bg-white/10'}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Package Selection */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold mb-8 text-center">Choose Your Package</h2>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <PackageCard
                name="Basic"
                price="₹999"
                features={[
                  'Up to 500 users',
                  '10GB storage',
                  'Basic features',
                  'Email support'
                ]}
                selected={selectedPlan === 'basic'}
                onSelect={() => setSelectedPlan('basic')}
              />
              <PackageCard
                name="Premium"
                price="₹2,999"
                features={[
                  'Up to 2000 users',
                  '50GB storage',
                  'All features',
                  'Priority support',
                  'Custom branding'
                ]}
                selected={selectedPlan === 'premium'}
                onSelect={() => setSelectedPlan('premium')}
                recommended
              />
              <PackageCard
                name="Enterprise"
                price="₹9,999"
                features={[
                  'Unlimited users',
                  '500GB storage',
                  'All features',
                  '24/7 support',
                  'Custom branding',
                  'API access'
                ]}
                selected={selectedPlan === 'enterprise'}
                onSelect={() => setSelectedPlan('enterprise')}
              />
            </div>
            <div className="text-center">
              <button
                onClick={() => setStep(2)}
                className="bg-[#A5A6F6] text-black px-8 py-3 rounded-lg font-medium hover:bg-[#9394E8] transition-colors"
              >
                Continue to Payment
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Payment */}
        {step === 2 && (
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-8 text-center">Payment</h2>
            <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-8 mb-6">
              <div className="flex justify-between items-center mb-6">
                <span className="text-gray-400">Selected Plan:</span>
                <span className="text-xl font-bold capitalize">{selectedPlan}</span>
              </div>
              <div className="flex justify-between items-center mb-6 pb-6 border-b border-white/10">
                <span className="text-gray-400">Amount:</span>
                <span className="text-2xl font-bold">
                  {selectedPlan === 'basic' && '₹999'}
                  {selectedPlan === 'premium' && '₹2,999'}
                  {selectedPlan === 'enterprise' && '₹9,999'}
                </span>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
                <p className="text-yellow-500 text-sm">
                  <strong>Note:</strong> This is a mock payment for testing purposes.
                </p>
              </div>
            </div>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}
            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border border-white/10 px-6 py-3 rounded-lg font-medium hover:bg-white/5 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handlePayment}
                disabled={processing}
                className="flex-1 bg-[#A5A6F6] text-black px-6 py-3 rounded-lg font-medium hover:bg-[#9394E8] transition-colors disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Complete Payment'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Subdomain */}
        {step === 3 && (
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-8 text-center">Choose Your Subdomain</h2>
            <form onSubmit={handleCreateInstitution}>
              <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-8 mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Institution Subdomain
                </label>
                <div className="flex items-center mb-4">
                  <input
                    type="text"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="myinstitution"
                    required
                    pattern="[a-z0-9-]+"
                    className="flex-1 px-4 py-3 bg-[#0A0A0A] border border-white/10 rounded-l-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#A5A6F6]"
                  />
                  <span className="px-4 py-3 bg-white/5 border border-l-0 border-white/10 rounded-r-lg text-gray-400">
                    .studiplus.com
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  Your institution will be accessible at: <strong>{subdomain || 'yourname'}.studiplus.com</strong>
                </p>
              </div>
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={processing || !subdomain}
                className="w-full bg-[#A5A6F6] text-black px-6 py-3 rounded-lg font-medium hover:bg-[#9394E8] transition-colors disabled:opacity-50"
              >
                {processing ? 'Creating Institution...' : 'Create Institution'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function PackageCard({ name, price, features, selected, onSelect, recommended }) {
  return (
    <div
      onClick={onSelect}
      className={`relative bg-[#1a1a2e] border rounded-2xl p-6 cursor-pointer transition-all ${
        selected ? 'border-[#A5A6F6] shadow-lg shadow-[#A5A6F6]/20' : 'border-white/10 hover:border-white/20'
      }`}
    >
      {recommended && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#A5A6F6] text-black px-4 py-1 rounded-full text-xs font-bold">
          RECOMMENDED
        </div>
      )}
      <h3 className="text-2xl font-bold mb-2">{name}</h3>
      <div className="text-3xl font-bold mb-6">{price}<span className="text-sm text-gray-400">/month</span></div>
      <ul className="space-y-3">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <span className="text-[#A5A6F6] mt-1">✓</span>
            <span className="text-gray-300">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
