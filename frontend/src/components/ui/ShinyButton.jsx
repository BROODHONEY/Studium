import { cn } from '@/lib/utils';

/**
 * ShinyButton — greyscale shiny black button with a subtle gloss sweep.
 * Drop-in replacement for plain <button> on the institution pages.
 */
export default function ShinyButton({ children, className, variant = 'default', ...props }) {
  const base = [
    'relative inline-flex items-center justify-center gap-2',
    'rounded-xl px-6 py-3 text-sm font-semibold',
    'border transition-all duration-200 select-none cursor-pointer',
    'overflow-hidden group',
    // focus ring
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30',
    'disabled:opacity-40 disabled:cursor-not-allowed',
  ];

  const variants = {
    default: [
      'bg-[#111] border-white/10 text-white/90',
      'shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_1px_3px_rgba(0,0,0,0.6)]',
      'hover:bg-[#1a1a1a] hover:border-white/15 hover:text-white',
      'active:scale-[0.98]',
    ],
    ghost: [
      'bg-transparent border-white/10 text-white/50',
      'hover:bg-white/5 hover:text-white/80',
      'active:scale-[0.98]',
    ],
    primary: [
      'bg-[#FF6B35] border-[#FF6B35]/60 text-white',
      'shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_1px_3px_rgba(0,0,0,0.4)]',
      'hover:bg-[#FF8C5A] hover:border-[#FF8C5A]/60',
      'active:scale-[0.98]',
    ],
  };

  return (
    <button
      className={cn(base, variants[variant] ?? variants.default, className)}
      {...props}
    >
      {/* gloss sweep overlay */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -translate-x-full skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/[0.07] to-transparent transition-transform duration-500 group-hover:translate-x-full"
      />
      {children}
    </button>
  );
}
