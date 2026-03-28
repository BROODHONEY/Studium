import { useState, useRef } from 'react';
import FilePickerPopover from './FilePickerPopover';

function wrap(textareaRef, setText, before, after = before) {
  const el = textareaRef.current;
  if (!el) return;
  const start = el.selectionStart;
  const end   = el.selectionEnd;
  const selected = el.value.slice(start, end) || 'text';
  const newVal = el.value.slice(0, start) + before + selected + after + el.value.slice(end);
  setText(newVal);
  requestAnimationFrame(() => {
    el.focus();
    el.setSelectionRange(start + before.length, start + before.length + selected.length);
  });
}

function insertAtCursor(textareaRef, setText, insertion) {
  const el = textareaRef.current;
  if (!el) return;
  const start = el.selectionStart;
  const newVal = el.value.slice(0, start) + insertion + el.value.slice(start);
  setText(newVal);
  requestAnimationFrame(() => {
    el.focus();
    el.setSelectionRange(start + insertion.length, start + insertion.length);
  });
}

const FORMAT_TOOLS = [
  { title: 'Bold',      action: (r, s) => wrap(r, s, '**'),        icon: <strong>B</strong> },
  { title: 'Italic',    action: (r, s) => wrap(r, s, '_'),          icon: <em>I</em> },
  { title: 'Underline', action: (r, s) => wrap(r, s, '~~'),         icon: <u>U</u> },
  { title: 'Bullet',    action: (r, s) => wrap(r, s, '\n- ', ''),   icon: '•' },
  { title: 'Link',      action: (r, s) => wrap(r, s, '[', '](url)'), icon: '🔗' },
];

export default function FormatToolbar({ textareaRef, setText, groupId }) {
  const [showFilePicker, setShowFilePicker] = useState(false);
  const fileButtonRef = useRef(null);

  return (
    <div className="flex items-center gap-0.5 mb-1.5 relative">
      {FORMAT_TOOLS.map(({ title, action, icon }) => (
        <button key={title} type="button" title={title}
          onMouseDown={e => { e.preventDefault(); action(textareaRef, setText); }}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-xs
            dark:text-gray-400 text-gray-500 dark:hover:bg-surface-3 hover:bg-gray-200
            dark:hover:text-gray-200 hover:text-gray-700 transition select-none">
          {icon}
        </button>
      ))}

      {/* File reference button — only shown when groupId is provided */}
      {groupId && (
        <button ref={fileButtonRef} type="button" title="Attach file reference"
          onMouseDown={e => { e.preventDefault(); setShowFilePicker(v => !v); }}
          className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs transition select-none
            ${showFilePicker
              ? 'bg-brand-600 text-white'
              : 'dark:text-gray-400 text-gray-500 dark:hover:bg-surface-3 hover:bg-gray-200 dark:hover:text-gray-200 hover:text-gray-700'}`}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4.5 3a2.5 2.5 0 0 1 5 0v9a1.5 1.5 0 0 1-3 0V5a.5.5 0 0 1 1 0v7a.5.5 0 0 0 1 0V3a1.5 1.5 0 1 0-3 0v9a2.5 2.5 0 0 0 5 0V5a.5.5 0 0 1 1 0v7a3.5 3.5 0 1 1-7 0V3z"/>
          </svg>
        </button>
      )}

      {showFilePicker && groupId && (
        <FilePickerPopover
          groupId={groupId}
          triggerRef={fileButtonRef}
          onPick={ref => insertAtCursor(textareaRef, setText, ref)}
          onClose={() => setShowFilePicker(false)}
        />
      )}
    </div>
  );
}
