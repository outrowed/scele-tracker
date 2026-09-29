import type { ReactNode } from 'react';
import { X, type LucideIcon } from 'lucide-react';

export type MessageBoxVariant = 'info' | 'warning' | 'error';

export interface MessageBoxProps {
  icon?: LucideIcon;
  iconClassName?: string;
  title?: string;
  children: ReactNode;
  variant?: MessageBoxVariant;
  onDismiss?: () => void;
  dismissLabel?: string;
  className?: string;
  role?: string;
}

export function MessageBox({
  icon: Icon,
  iconClassName = '',
  title,
  children,
  variant = 'info',
  onDismiss,
  dismissLabel = 'Dismiss notice',
  className = '',
  role,
}: MessageBoxProps) {
  const variantStyles = {
    info: 'border-teal-200/90 dark:border-teal-800/90 bg-teal-50/70 dark:bg-teal-950/70 text-slate-800 dark:text-slate-100',
    warning:
      'border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/80 text-amber-950 dark:text-amber-100',
    error:
      'border-rose-200 dark:border-rose-800 bg-rose-50/80 dark:bg-rose-950/80 text-rose-950 dark:text-rose-100',
  };

  const iconStyles = {
    info: 'text-teal-700 dark:text-teal-300',
    warning: 'text-amber-700 dark:text-amber-300',
    error: 'text-rose-700 dark:text-rose-300',
  };

  const buttonStyles = {
    info: 'text-teal-700/60 dark:text-teal-300/60 hover:bg-teal-100 dark:hover:bg-teal-900 hover:text-teal-900 dark:hover:text-teal-100',
    warning:
      'text-amber-700/60 dark:text-amber-300/60 hover:bg-amber-100 dark:hover:bg-amber-900 hover:text-amber-900 dark:hover:text-amber-100',
    error:
      'text-rose-700/60 dark:text-rose-300/60 hover:bg-rose-100 dark:hover:bg-rose-900 hover:text-rose-900 dark:hover:text-rose-100',
  };

  return (
    <div
      role={role}
      className={`relative flex items-start gap-3.5 rounded-xl border p-4 text-sm transition sm:px-5 sm:py-3.5 ${variantStyles[variant]} ${className}`}
    >
      {Icon && (
        <div className={`mt-0.5 shrink-0 ${iconStyles[variant]} ${iconClassName}`}>
          <Icon size={18} aria-hidden="true" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        {title && <h3 className="font-semibold leading-snug">{title}</h3>}
        <div className={`text-xs sm:text-sm leading-relaxed ${title ? 'mt-0.5' : ''}`}>
          {children}
        </div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className={`shrink-0 rounded-lg p-1 transition ${buttonStyles[variant]}`}
          aria-label={dismissLabel}
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
