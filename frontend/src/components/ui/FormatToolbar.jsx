/**
 * Wraps selected text in the textarea with markdown syntax.
 * textareaRef — ref to the textarea element
 * setText      — state setter
 */
function wrap(textareaRef, setText, before, after = before) {
  const el = textareaRef.current;
  if (!el) return;
  const start = el.selectionStart;
  const end   = el.selectionEnd;
  const selected = el.value.slice(start, end) || 'text';
  const newVal =
    el.value.slice(0, start) + before + selected + after + el.value.slice(end);
  setText(newVal);
  // Restore focus + selection after React re-render
  requestAnimationFrame(() => {
    el.focus();
    el.setSelectionRange(start + before.length, start + before.length + selected.length);
  });
}

const TOOLS = [
  { title: 'Bold',      action: (r, s) => wrap(r, s, '**'),       icon: <strong>B</strong> },
  { title: 'Italic',    action: (r, s) => wrap(r, s, '_'),         icon: <em>I</em> },
  { title: 'Underline', action: (r, s) => wrap(r, s, '~~'),        icon: <u>U</u> },
  { title: 'Bullet',    action: (r, s) => wrap(r, s, '\n- ', ''),  icon: '•' },
  { title: 'Link',      action: (r, s) => wrap(r, s, '[', '](url)'), icon: '🔗' },
];

export default function FormatToolbar({ textareaRef, setText }) {
  return (
    <div className="flex items-center gap-0.5 mb-1.5">
      {TOOLS.map(({ title, action, icon }) => (
        <button
          key={title}
          type="button"
          title={title}
          onMouseDown={e => {
            e.preventDefault(); // keep textarea focus
            action(textareaRef, setText);
          }}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-xs
            dark:text-gray-400 text-gray-500
            dark:hover:bg-surface-3 hover:bg-gray-200
            dark:hover:text-gray-200 hover:text-gray-700
            transition select-none"
        >
          {icon}
        </button>
      ))}
    </div>
  );
}
