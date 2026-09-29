import type { ElementType, ComponentPropsWithoutRef, ReactNode } from 'react';

export interface CardProps<T extends ElementType = 'div'> {
  as?: T;
  className?: string;
  children: ReactNode;
}

export function Card<T extends ElementType = 'div'>({
  as,
  className = '',
  children,
  ...props
}: CardProps<T> & Omit<ComponentPropsWithoutRef<T>, keyof CardProps<T>>) {
  const Component = as || 'div';
  return (
    <Component
      className={`rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
