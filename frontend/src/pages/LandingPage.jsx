import { useState, useEffect } from 'react';
import DemoRequestModal from '../components/DemoRequestModal';
import InstitutionLoginModal from '../components/InstitutionLoginModal';

export default function LandingPage() {
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-white/10' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-12">
              <span className="text-xl font-bold tracking-tight">Studi+</span>
              <div className="hidden md:flex items-center gap-8 text-sm">
                <a href="#home" className="text-gray-400 hover:text-white transition-colors duration-200">Home</a>
                <a href="#about" className="text-gray-400 hover:text-white transition-colors duration-200">About Us</a>
                <a href="#features" className="text-gray-400 hover:text-white transition-colors duration-200">Features</a>
                <a href="#contact" className="text-gray-400 hover:text-white transition-colors duration-200">Contact</a>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-400 hidden sm:block tracking-wider">LOOKING FOR A BETTER SOLUTION?</span>
              <button
                onClick={() => setShowLoginModal(true)}
                className="bg-[#A5A6F6] text-black px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#9394E8] transition-all duration-200 hover:shadow-lg hover:shadow-[#A5A6F6]/20"
              >
                Login to Institution
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#A5A6F6]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#A5A6F6]/5 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <p className="text-xs tracking-[0.3em] text-gray-400 mb-6 uppercase animate-fade-in">The Academic Sanctuary</p>
            <h1 className="text-6xl lg:text-7xl font-bold mb-6 leading-[1.1] animate-fade-in-up">
              The Future of<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A5A6F6] via-[#C0C1FF] to-white animate-gradient">Academic</span><br />
              Communication.
            </h1>
            <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              A Pro-Level, Go-To-File workspace for students and teachers to network, share, and learn. 24/7 real-time collaboration.
            </p>
            <div className="flex gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <button
                onClick={() => setShowDemoModal(true)}
                className="bg-[#A5A6F6] text-black px-8 py-3.5 rounded-lg font-medium hover:bg-[#9394E8] transition-all duration-200 hover:shadow-lg hover:shadow-[#A5A6F6]/30 hover:scale-105"
              >
                Request a Demo
              </button>
              <button
                onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                className="border border-white/10 px-8 py-3.5 rounded-lg font-medium hover:bg-white/5 hover:border-white/20 transition-all duration-200"
              >
                View Examples
              </button>
            </div>
          </div>

          {/* Hero Image */}
          <div className="mt-20 relative animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/50 to-transparent z-10 pointer-events-none"></div>
            <div className="bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1e] rounded-2xl p-8 border border-white/5 shadow-2xl">
              <div className="grid grid-cols-3 gap-4 opacity-50">
                <div className="bg-[#0A0A0A] rounded-lg p-6 h-48 border border-white/5 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#A5A6F6]/10 to-transparent"></div>
                </div>
                <div className="bg-[#0A0A0A] rounded-lg p-6 h-48 border border-white/5 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#A5A6F6]/5 to-transparent"></div>
                </div>
                <div className="bg-[#0A0A0A] rounded-lg p-6 h-48 border border-white/5 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#A5A6F6]/10 to-transparent"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Unified Workspace */}
            <div className="group bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1e] rounded-2xl p-8 border border-white/5 hover:border-white/10 transition-all duration-300 hover:shadow-xl hover:shadow-[#A5A6F6]/5">
              <div className="mb-6">
                <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#A5A6F6]/10 transition-colors duration-300">
                  <svg className="w-5 h-5 group-hover:text-[#A5A6F6] transition-colors duration-300" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3 group-hover:text-[#A5A6F6] transition-colors duration-300">Unified Workspace</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Everything you need in one collaborative space. No more switching between apps.
                </p>
              </div>
            </div>

            {/* Verified Only */}
            <div className="group bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1e] rounded-2xl p-8 border border-white/5 hover:border-white/10 transition-all duration-300 hover:shadow-xl hover:shadow-[#A5A6F6]/5 relative overflow-hidden">
              <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-12 h-12 bg-[#A5A6F6]/10 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#A5A6F6]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="mb-6">
                <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#A5A6F6]/10 transition-colors duration-300">
                  <svg className="w-5 h-5 group-hover:text-[#A5A6F6] transition-colors duration-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3 group-hover:text-[#A5A6F6] transition-colors duration-300">Verified Only</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Secure, institution-verified access ensures only real students and educators participate.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section id="about" className="py-20 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs tracking-[0.3em] text-gray-400 mb-4 uppercase">Built For Academia</p>
              <h2 className="text-5xl font-bold mb-6 leading-[1.15]">
                Replacing Noise with Academic Sanctuary.
              </h2>
              <p className="text-gray-400 mb-6 leading-relaxed">
                No Noise. For students and educators who want to network, share, and learn. This is the sanctuary for serious academic work.
              </p>
              <p className="text-gray-400 mb-8 leading-relaxed">
                Studi+ is a modern communication platform with real-time support & discussion forums. Collaborate with peers, share resources, and stay organized.
              </p>
              <div className="bg-gradient-to-br from-[#A5A6F6] to-[#9394E8] rounded-2xl p-8 text-black relative overflow-hidden group hover:shadow-2xl hover:shadow-[#A5A6F6]/20 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="text-6xl font-bold mb-2">99%</div>
                  <div className="text-sm font-medium uppercase tracking-wider">Student Satisfaction</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-[#A5A6F6]/10 to-transparent rounded-3xl blur-2xl"></div>
              <div className="relative bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1e] rounded-2xl p-8 border border-white/5 h-96 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <svg className="w-24 h-24 mx-auto mb-4 opacity-20" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm">Platform Preview</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs tracking-[0.3em] text-gray-400 mb-4 uppercase text-center">The Essentials</p>
          <h2 className="text-5xl font-bold mb-16 text-center">Engineered for Excellence.</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/></svg>}
              title="Student Groups"
              description="Create specialized groups for each course, project, or study session with granular controls."
            />
            <FeatureCard
              icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/></svg>}
              title="Real-Time Chat"
              description="Lightning-fast, reliable messaging with file sharing and rich media support."
            />
            <FeatureCard
              icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/></svg>}
              title="File Repository"
              description="Centralized file storage with version control and easy sharing capabilities."
            />
            <FeatureCard
              icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/></svg>}
              title="Assignment Tracking"
              description="Comprehensive task and due date management with automated reminders."
            />
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact" className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1e] rounded-2xl p-12 border border-white/5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#A5A6F6]/5 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <h2 className="text-3xl font-bold mb-3">Institutional Inquiries</h2>
              <p className="text-gray-400 mb-8 text-sm">
                Get in touch with us to set up a custom solution. Our team will reach out within 24 hours.
              </p>
              
              <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setShowDemoModal(true); }}>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                    Institution Name
                  </label>
                  <input
                    type="text"
                    className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#A5A6F6] transition-colors"
                    placeholder="Enter your institution name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#A5A6F6] transition-colors"
                    placeholder="admin@institution.edu"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#A5A6F6] text-black px-6 py-3.5 rounded-lg font-medium hover:bg-[#9394E8] transition-all duration-200 hover:shadow-lg hover:shadow-[#A5A6F6]/30"
                >
                  Submit Inquiry
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-8">
              <span className="text-xl font-bold">Studi+</span>
              <span className="text-xs text-gray-500">© 2026 Studi+. All rights reserved.</span>
            </div>
            <div className="flex gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors duration-200">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors duration-200">Terms of Service</a>
              <a href="#contact" className="hover:text-white transition-colors duration-200">Contact</a>
              <a href="#" className="hover:text-white transition-colors duration-200">Community</a>
            </div>
            <div className="flex gap-4">
              <a href="#" className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors duration-200">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
              </a>
              <a href="#" className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors duration-200">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </a>
              <a href="#" className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors duration-200">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {showDemoModal && <DemoRequestModal onClose={() => setShowDemoModal(false)} />}
      {showLoginModal && <InstitutionLoginModal onClose={() => setShowLoginModal(false)} />}
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="group cursor-default">
      <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#A5A6F6]/10 transition-all duration-300 group-hover:scale-110">
        {icon}
      </div>
      <h3 className="text-lg font-bold mb-2 group-hover:text-[#A5A6F6] transition-colors duration-300">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
