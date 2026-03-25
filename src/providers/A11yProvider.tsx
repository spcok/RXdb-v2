import React, { useEffect, useRef } from 'react';
import { useA11yStore } from '../store/useA11yStore';

export const A11yProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { dyslexicFont, reducedMotion, readingRuler } = useA11yStore();
  const rulerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (dyslexicFont) root.classList.add('font-dyslexic');
    else root.classList.remove('font-dyslexic');

    if (reducedMotion) root.classList.add('reduce-motion');
    else root.classList.remove('reduce-motion');
  }, [dyslexicFont, reducedMotion]);

  useEffect(() => {
    if (!readingRuler) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (rulerRef.current) {
        // Center the 2rem (32px) high ruler on the cursor
        rulerRef.current.style.transform = `translateY(${e.clientY - 16}px)`;
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [readingRuler]);

  return (
    <>
      {readingRuler && (
        <div 
          ref={rulerRef}
          className="fixed top-0 left-0 w-full h-8 bg-emerald-500/10 pointer-events-none z-[9999] border-y border-emerald-500/20 transition-opacity duration-150"
          style={{ willChange: 'transform' }}
        />
      )}
      {children}
    </>
  );
};
