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
  return (
    <a href={fileUrl} target="_blank" rel="noreferrer noopener"
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition no-underline cursor-pointer
        ${isOwn
          ? 'bg-white/10 border-white/20 text-white hover:bg-white/20'
          : 'dark:bg-surface-3 bg-gray-100 dark:border-surface-4 border-gray-200 dark:text-gray-200 text-gray-700 dark:hover:bg-surface-4 hover:bg-gray-200'}`}>
      <span className="text-sm leading-none">{fileIcon(filename)}</span>
      <span className="truncate max-w-[160px]">{filename}</span>
      <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" className="flex-shrink-0 opacity-50">
        <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5v-2z"/>
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
