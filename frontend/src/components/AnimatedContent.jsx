import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// React Bits — AnimatedContent
// Scroll-triggered (or immediate) fade + slide animation
export default function AnimatedContent({
  children,
  distance = 40,
  direction = 'vertical',
  reverse = false,
  duration = 0.6,
  ease = 'power3.out',
  initialOpacity = 0,
  animateOpacity = true,
  scale = 1,
  threshold = 0.1,
  delay = 0,
  className = '',
  style = {},
  // when true, animates immediately (no scroll trigger) — used for modals
  immediate = false,
  onComplete,
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const axis = direction === 'horizontal' ? 'x' : 'y';
    const fromVal = reverse ? -distance : distance;

    const fromVars = {
      opacity: animateOpacity ? initialOpacity : 1,
      scale,
      [axis]: fromVal,
    };
    const toVars = {
      opacity: 1,
      scale: 1,
      [axis]: 0,
      duration,
      ease,
      delay,
      onComplete,
    };

    if (immediate) {
      gsap.fromTo(el, fromVars, toVars);
      return;
    }

    gsap.fromTo(el, fromVars, {
      ...toVars,
      scrollTrigger: {
        trigger: el,
        start: `top ${Math.round((1 - threshold) * 100)}%`,
        toggleActions: 'play none none none',
      },
    });

    return () => {
      ScrollTrigger.getAll()
        .filter(t => t.trigger === el)
        .forEach(t => t.kill());
    };
  }, [distance, direction, reverse, duration, ease, initialOpacity, animateOpacity, scale, threshold, delay, immediate, onComplete]);

  return (
    <div ref={ref} className={className} style={{ willChange: 'transform, opacity', ...style }}>
      {children}
    </div>
  );
}
