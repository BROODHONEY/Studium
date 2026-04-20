import { useNavigate } from 'react-router-dom';
import Modal from './ui/Modal';

export default function InstitutionLoginModal({ onClose }) {
  const navigate = useNavigate();

  const handleContinue = () => {
    onClose();
    navigate('/institution-select');
  };

  return (
    <Modal onClose={onClose}>
      <h2 className="text-2xl font-bold mb-2 text-white">Login to Your Institution</h2>
      <p className="text-gray-400 text-sm mb-6">
        You'll be asked to enter your institution code to continue.
      </p>
      
      <div className="space-y-4">
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <p className="text-sm text-gray-300 mb-2">
            <span className="font-medium text-white">Step 1:</span> Enter your institution code
          </p>
          <p className="text-sm text-gray-300">
            <span className="font-medium text-white">Step 2:</span> Sign in with your credentials
          </p>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-white/10 rounded-lg hover:bg-white/5 transition-colors text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleContinue}
            className="flex-1 px-4 py-2.5 bg-[#A5A6F6] text-black rounded-lg hover:bg-[#9394E8] transition-colors font-medium"
          >
            Continue
          </button>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-white/5">
        <p className="text-sm text-gray-400 text-center">
          Don't have an account? <a href="#contact" onClick={onClose} className="text-[#A5A6F6] hover:underline">Contact us</a> to get started.
        </p>
      </div>
    </Modal>
  );
}
