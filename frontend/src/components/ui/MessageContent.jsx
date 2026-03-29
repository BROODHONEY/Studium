import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const FILE_ICONS = {
  'pdf': '📄', 'ppt': '📊', 'pptx': '📊',
  'doc': '📝', 'docx': '📝', 'xls': '📊', 'xlsx': '📊',
  'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️',
};
const fileIcon = (name = '') => {
  const ext = name.split('.').pop()?.toLowerCase();
  return FILE_ICONS[ext] || '📎';
};

// File ref format stored in content: {{file:id:filename:url}}
const FILE_REF_RE = /\{\{file:([^:]+):([^:]+):([^}]+)\}\}/g;

// Mention format: @[Name](userId)
const MENTION_RE = /@\[([^\]]+)\]\(([^)]+)\)/g;

function FileChip({ filename, fileUrl, fileId, isOwn, onFileRef }) {
  const handleClick = (e) => {
    if (onFileRef) { e.preventDefault(); onFileRef(fileId); }
  };
  const ext = filename?.split('.').pop()?.toLowerCase() || '';
  const iconColors = { pdf: '#ef4444', ppt: '#f97316', pptx: '#f97316', doc: '#3b82f6', docx: '#3b82f6', jpg: '#10b981', jpeg: '#10b981', png: '#10b981' };
  const iconColor = iconColors[ext] || 'rgba(255,255,255,0.4)';
  return (
    <a href={fileUrl} target="_blank" rel="noreferrer noopener" onClick={handleClick}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', textDecoration: 'none', transition: 'background 0.15s', cursor: 'pointer' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}>
      {/* File type icon */}
      <div style={{ width: 36, height: 36, borderRadius: 8, background: `${iconColor}18`, border: `1px solid ${iconColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill={iconColor}>
          <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/>
        </svg>
      </div>
      {/* File info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.8)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{filename}</p>
        <p style={{ fontSize: 11, fontWeight: 300, color: 'rgba(255,255,255,0.3)', margin: '2px 0 0', textTransform: 'uppercase' }}>{ext} Document</p>
      </div>
      {/* Download icon */}
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
        <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
        <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
      </svg>
    </a>
  );
}

/**
 * Splits content into text, file-ref, and mention segments.
 */
function parseContent(content) {
  // Combine both patterns, process left-to-right
  const combined = /\{\{file:([^:]+):([^:]+):([^}]+)\}\}|@\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let last = 0;
  let match;
  combined.lastIndex = 0;
  while ((match = combined.exec(content)) !== null) {
    if (match.index > last) parts.push({ type: 'text', value: content.slice(last, match.index) });
    if (match[1]) {
      parts.push({ type: 'file', id: match[1], filename: match[2], fileUrl: match[3] });
    } else {
      parts.push({ type: 'mention', name: match[4], userId: match[5] });
    }
    last = match.index + match[0].length;
  }
  if (last < content.length) parts.push({ type: 'text', value: content.slice(last) });
  return parts;
}

export default function MessageContent({ content, isOwn, onFileRef }) {
  const linkClass = isOwn
    ? 'underline text-brand-200 hover:text-white'
    : 'underline text-brand-400 hover:text-brand-300';

  const mdComponents = {
    a: ({ href, children }) => (
      <a href={href} target="_blank" rel="noreferrer noopener" className={linkClass}>{children}</a>
    ),
    ul: ({ children }) => <ul className="list-disc list-inside space-y-0.5 my-1">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal list-inside space-y-0.5 my-1">{children}</ol>,
    li: ({ children }) => <li className="leading-snug">{children}</li>,
    em: ({ children }) => <em className="italic">{children}</em>,
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    del: ({ children }) => <u className="underline">{children}</u>,
    p: ({ children }) => <span className="block leading-relaxed">{children}</span>,
    code: ({ children }) => (
      <code className={`px-1 py-0.5 rounded text-xs font-mono ${isOwn ? 'bg-brand-800/60' : 'dark:bg-surface-4 bg-gray-300/60'}`}>
        {children}
      </code>
    ),
  };

  const hasMention = MENTION_RE.test(content);
  MENTION_RE.lastIndex = 0;
  const hasFile = FILE_REF_RE.test(content);
  FILE_REF_RE.lastIndex = 0;

  if (!hasMention && !hasFile) {
    return <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{content}</ReactMarkdown>;
  }

  const parts = parseContent(content);
  const textParts = parts.filter(p => p.type !== 'file');
  const fileParts = parts.filter(p => p.type === 'file');

  return (
    <span className="leading-relaxed">
      <span>
        {textParts.map((part, i) => {
          if (part.type === 'mention') {
            return (
              <span key={i} className={`inline font-semibold rounded px-0.5
                ${isOwn ? 'text-brand-200 bg-white/10' : 'text-brand-400 dark:bg-brand-900/40 bg-brand-100'}`}>
                @{part.name}
              </span>
            );
          }
          return part.value
            ? <span key={i} style={{ whiteSpace: 'pre-wrap' }}>{part.value}</span>
            : null;
        })}
      </span>
      {fileParts.length > 0 && (
        <span className="flex flex-col gap-1 mt-1.5">
          {fileParts.map((part, i) => (
            <FileChip key={i} filename={part.filename} fileUrl={part.fileUrl} fileId={part.id} isOwn={isOwn} onFileRef={onFileRef} />
          ))}
        </span>
      )}
    </span>
  );
}
