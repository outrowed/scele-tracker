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
    info: 'border-teal-200/90 bg-teal-50/70 text-slate-800',
    warning: 'border-amber-200 bg-amber-50/80 text-amber-950',
    error: 'border-rose-200 bg-rose-50/80 text-rose-950',
  };

  const iconStyles = {
    info: 'text-teal-700',
    warning: 'text-amber-700',
    error: 'text-rose-700',
  };

  const buttonStyles = {
    info: 'text-teal-700/60 hover:bg-teal-100 hover:text-teal-900',
    warning: 'text-amber-700/60 hover:bg-amber-100 hover:text-amber-900',
    error: 'text-rose-700/60 hover:bg-rose-100 hover:text-rose-900',
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
