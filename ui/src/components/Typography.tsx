import type { ReactNode } from 'react';

export interface PageTitleProps {
  children: ReactNode;
  className?: string;
}

export function PageTitle({ children, className = '' }: PageTitleProps) {
  return (
    <h1
      className={`text-3xl font-semibold leading-tight tracking-tight md:text-4xl ${className}`}
    >
      {children}
    </h1>
  );
}

export interface SectionKickerProps {
  children: ReactNode;
  className?: string;
}

export function SectionKicker({ children, className = '' }: SectionKickerProps) {
  return (
    <span
      className={`text-[10px] font-bold uppercase tracking-[0.16em] text-teal-700 ${className}`}
    >
      {children}
    </span>
  );
}
