import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export interface PageTitleProps {
  children: ReactNode;
  className?: string;
}

export function PageTitle({ children, className = '' }: PageTitleProps) {
  return (
    <h1
      className={`text-3xl font-semibold leading-tight tracking-tight text-slate-900 md:text-4xl ${className}`}
    >
      {children}
    </h1>
  );
}

export interface PageDescriptionProps {
  children: ReactNode;
  className?: string;
}

export function PageDescription({ children, className = '' }: PageDescriptionProps) {
  return (
    <p
      className={`mt-2 text-sm leading-relaxed text-slate-600 sm:text-base ${className}`}
    >
      {children}
    </p>
  );
}

export interface SectionTitleProps {
  as?: 'h2' | 'h3' | 'h4';
  children: ReactNode;
  className?: string;
  id?: string;
}

export function SectionTitle({
  as: Component = 'h2',
  children,
  className = '',
  id,
}: SectionTitleProps) {
  return (
    <Component id={id} className={`text-lg font-semibold text-slate-900 ${className}`}>
      {children}
    </Component>
  );
}

export interface SectionDescriptionProps {
  children: ReactNode;
  className?: string;
  role?: string;
}

export function SectionDescription({
  children,
  className = '',
  role,
}: SectionDescriptionProps) {
  return (
    <p role={role} className={`mt-1 text-sm leading-relaxed text-slate-500 ${className}`}>
      {children}
    </p>
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

export interface BackLinkProps {
  to?: string;
  children?: ReactNode;
  className?: string;
}

export function BackLink({
  to = '/',
  children = 'Back to activity feed',
  className = '',
}: BackLinkProps) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 transition hover:text-teal-800 hover:underline ${className}`}
    >
      <ChevronLeft size={16} />
      <span>{children}</span>
    </Link>
  );
}

export interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  kicker?: ReactNode;
  backTo?: string;
  backLabel?: string;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  kicker,
  backTo,
  backLabel = 'Back to activity feed',
  action,
  className = '',
}: PageHeaderProps) {
  return (
    <header className={`mb-6 md:mb-8 ${className}`}>
      {backTo && (
        <div className="mb-3">
          <BackLink to={backTo}>{backLabel}</BackLink>
        </div>
      )}
      {kicker && <div className="mb-2">{kicker}</div>}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 max-w-3xl flex-1">
          <PageTitle className="mt-0">{title}</PageTitle>
          {description && <PageDescription>{description}</PageDescription>}
        </div>
        {action && <div className="flex shrink-0 items-center gap-3">{action}</div>}
      </div>
    </header>
  );
}
