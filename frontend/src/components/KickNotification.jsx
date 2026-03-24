export default function KickNotification({ notice, onDismiss }) {
  if (!notice) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="card w-full max-w-sm text-center p-6">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 2L18 16H2L10 2Z" stroke="#f87171" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M10 8V11" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="10" cy="14" r="0.75" fill="#f87171"/>
          </svg>
        </div>
        <h3 className="dark:text-white text-gray-900 font-semibold text-base mb-2">You were removed</h3>
        <p className="dark:text-gray-400 text-gray-600 text-sm leading-relaxed">
          You have been removed from{' '}
          <span className="dark:text-white text-gray-900 font-medium">{notice.groupName}</span>.
          Contact your teacher if you think this was a mistake.
        </p>
        <button
          onClick={onDismiss}
          className="mt-5 w-full py-2.5 dark:bg-surface-3 dark:hover:bg-surface-4 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 text-gray-700 text-sm rounded-xl transition">
          Dismiss
        </button>
      </div>
    </div>
  );
}
