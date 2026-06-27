import type { AnchorHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'light';
type ButtonSize = 'sm' | 'md' | 'lg';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'border border-transparent bg-[var(--kd-green-500)] text-white hover:bg-[var(--kd-green-600)]',
  secondary: 'border border-[var(--kd-border)] bg-[var(--kd-surface)] text-[var(--kd-text)] hover:border-[var(--kd-green-500)] hover:text-[var(--kd-green-600)]',
  outline: 'border border-[var(--kd-green-500)] bg-transparent text-[var(--kd-green-600)] hover:bg-[var(--kd-green-50)]',
  ghost: 'border border-transparent bg-transparent text-[var(--kd-text-secondary)] hover:bg-[var(--kd-surface-muted)] hover:text-[var(--kd-text)]',
  danger: 'border border-transparent bg-[var(--kd-danger)] text-white hover:brightness-95',
  success: 'border border-transparent bg-[var(--kd-success)] text-white hover:brightness-95',
  light: 'border border-transparent bg-white text-[var(--kd-green-600)] hover:bg-[var(--kd-green-50)]',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-6 text-sm',
};

export function Button({
  children,
  variant = 'primary',
  size = 'lg',
  className = '',
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <a
      className={`inline-flex items-center justify-center rounded-[var(--kd-radius-2)] font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-0 ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </a>
  );
}
