import type { ElementType, ComponentPropsWithoutRef, ReactNode } from 'react';

export interface ContainerProps<T extends ElementType = 'div'> {
  as?: T;
  className?: string;
  children: ReactNode;
}

export function Container<T extends ElementType = 'div'>({
  as,
  className = '',
  children,
  ...props
}: ContainerProps<T> & Omit<ComponentPropsWithoutRef<T>, keyof ContainerProps<T>>) {
  const Component = as || 'div';
  return (
    <Component
      className={`mx-auto w-full max-w-[1280px] px-5 md:px-10 ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
