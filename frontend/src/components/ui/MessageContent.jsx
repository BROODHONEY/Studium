import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Renders message text with markdown support:
 * bullets, bold, italic, underline (via __text__), links, emoji
 */
export default function MessageContent({ content, isOwn }) {
  const linkClass = isOwn
    ? 'underline text-brand-200 hover:text-white'
    : 'underline text-brand-400 hover:text-brand-300';

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Open links in new tab safely
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noreferrer noopener" className={linkClass}>
            {children}
          </a>
        ),
        // Bullet / ordered lists
        ul: ({ children }) => <ul className="list-disc list-inside space-y-0.5 my-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside space-y-0.5 my-1">{children}</ol>,
        li: ({ children }) => <li className="leading-snug">{children}</li>,
        // Inline styles
        em: ({ children }) => <em className="italic">{children}</em>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        // __text__ → underline (GFM del repurposed via custom handling below)
        del: ({ children }) => <u className="underline">{children}</u>,
        // Strip wrapping <p> to keep inline feel
        p: ({ children }) => <span className="block leading-relaxed">{children}</span>,
        // Inline code
        code: ({ children }) => (
          <code className={`px-1 py-0.5 rounded text-xs font-mono
            ${isOwn ? 'bg-brand-800/60' : 'dark:bg-surface-4 bg-gray-300/60'}`}>
            {children}
          </code>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
