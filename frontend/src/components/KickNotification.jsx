export default function KickNotification({ notice, onDismiss }) {
  if (!notice) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-sm text-center">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 2L18 16H2L10 2Z" stroke="#f87171" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M10 8V11" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="10" cy="14" r="0.75" fill="#f87171"/>
          </svg>
        </div>
        <h3 className="text-white font-semibold text-base mb-2">You were removed</h3>
        <p className="text-gray-400 text-sm leading-relaxed">
          You have been removed from{' '}
          <span className="text-white font-medium">{notice.groupName}</span>.
          Contact your teacher if you think this was a mistake.
        </p>
        <button
          onClick={onDismiss}
          className="mt-5 w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition">
          Dismiss
        </button>
      </div>
    </div>
  );
}
