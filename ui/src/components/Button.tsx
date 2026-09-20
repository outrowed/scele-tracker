import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

export type ButtonVariant = 'primary' | 'secondary';

export const buttonVariantStyles: Record<ButtonVariant, string> = {
  primary:
    'inline-flex min-h-11 items-center justify-center gap-3 rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-wait disabled:opacity-60',
  secondary:
    'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-teal-500 disabled:cursor-wait disabled:opacity-60',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

export function Button({
  variant = 'secondary',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={`${buttonVariantStyles[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export type ButtonLinkProps =
  | ({
      href: string;
      to?: never;
      variant?: ButtonVariant;
      children: ReactNode;
    } & AnchorHTMLAttributes<HTMLAnchorElement>)
  | ({
      to: LinkProps['to'];
      href?: never;
      variant?: ButtonVariant;
      children: ReactNode;
    } & Omit<LinkProps, 'to'>);

export function ButtonLink({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonLinkProps) {
  if ('href' in props && props.href) {
    const { href, ...rest } = props;
    return (
      <a href={href} className={`${buttonVariantStyles[variant]} ${className}`} {...rest}>
        {children}
      </a>
    );
  }

  const { to, ...rest } = props as { to: LinkProps['to'] } & Omit<LinkProps, 'to'>;
  return (
    <Link to={to} className={`${buttonVariantStyles[variant]} ${className}`} {...rest}>
      {children}
    </Link>
  );
}
