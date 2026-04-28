import { cn } from '@/lib/utils';
import { cva } from 'class-variance-authority';

// Replaces the shadcn-generated button — uses only classes defined in our Tailwind config.
const buttonVariants = cva(
  'relative inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold border transition-all duration-200 select-none cursor-pointer overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // shiny black — default for institution pages
        default: 'bg-[#111] border-white/10 text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_1px_3px_rgba(0,0,0,0.6)] hover:bg-[#1a1a1a] hover:border-white/15 hover:text-white',
        // orange primary
        primary: 'bg-[#FF6B35] border-[#FF6B35]/60 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] hover:bg-[#FF8C5A]',
        // outlined ghost
        outline: 'bg-transparent border-white/10 text-white/60 hover:bg-white/5 hover:text-white/90',
        // text-only
        ghost: 'bg-transparent border-transparent text-white/50 hover:bg-white/5 hover:text-white/80',
        // danger
        destructive: 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20',
        // subtle secondary
        secondary: 'bg-white/5 border-white/8 text-white/70 hover:bg-white/10 hover:text-white',
        link: 'bg-transparent border-transparent text-[#FF6B35] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-5 py-2.5',
        sm:      'h-8 px-3 py-1.5 text-xs rounded-lg',
        lg:      'h-12 px-7 py-3 text-base',
        icon:    'size-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export function Button({ className, variant, size, children, ...props }) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {/* gloss sweep */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -translate-x-full skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent transition-transform duration-500 group-hover:translate-x-full"
      />
      {children}
    </button>
  );
}

export { buttonVariants };
export default Button;
