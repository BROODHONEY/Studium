import { useState } from 'react';
import Modal from './ui/Modal';

export default function DemoRequestModal({ onClose }) {
  const [formData, setFormData] = useState({
    institutionName: '',
    contactName: '',
    email: '',
    phone: '',
    studentCount: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${apiUrl}/demo-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => onClose(), 2000);
      }
    } catch (error) {
      console.error('Error submitting demo request:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (submitted) {
    return (
      <Modal onClose={onClose}>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-[#A5A6F6]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#A5A6F6]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Request Submitted!</h3>
          <p className="text-gray-400">We'll contact you within 24 hours.</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose}>
      <h2 className="text-2xl font-bold mb-2 text-white">Request a Demo</h2>
      <p className="text-gray-400 text-sm mb-6">Fill out the form below and our team will reach out shortly.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
            Institution Name *
          </label>
          <input
            type="text"
            name="institutionName"
            required
            value={formData.institutionName}
            onChange={handleChange}
            className="w-full px-4 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#A5A6F6] transition-colors"
            placeholder="Enter institution name"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
            Contact Name *
          </label>
          <input
            type="text"
            name="contactName"
            required
            value={formData.contactName}
            onChange={handleChange}
            className="w-full px-4 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#A5A6F6] transition-colors"
            placeholder="Your full name"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
            Email *
          </label>
          <input
            type="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#A5A6F6] transition-colors"
            placeholder="admin@institution.edu"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
            Phone *
          </label>
          <input
            type="tel"
            name="phone"
            required
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-4 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#A5A6F6] transition-colors"
            placeholder="+1 (555) 000-0000"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
            Approximate Student Count
          </label>
          <input
            type="number"
            name="studentCount"
            value={formData.studentCount}
            onChange={handleChange}
            className="w-full px-4 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#A5A6F6] transition-colors"
            placeholder="e.g., 5000"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
            Additional Information
          </label>
          <textarea
            name="message"
            rows="3"
            value={formData.message}
            onChange={handleChange}
            className="w-full px-4 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#A5A6F6] transition-colors resize-none"
            placeholder="Tell us about your needs..."
          ></textarea>
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
            type="submit"
            className="flex-1 px-4 py-2.5 bg-[#A5A6F6] text-black rounded-lg hover:bg-[#9394E8] transition-colors font-medium"
          >
            Submit Request
          </button>
        </div>
      </form>
    </Modal>
  );
}
