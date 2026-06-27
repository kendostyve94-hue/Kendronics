import type { HTMLAttributes, ReactNode } from 'react';

type CardVariant = 'surface' | 'muted' | 'elevated' | 'interactive';

const variantClasses: Record<CardVariant, string> = {
  surface: 'border border-[var(--kd-border)] bg-[var(--kd-surface)]',
  muted: 'border border-[var(--kd-border)] bg-[var(--kd-surface-muted)]',
  elevated: 'border border-[var(--kd-border)] bg-[var(--kd-surface-elevated)] shadow-[var(--kd-shadow-sm)]',
  interactive: 'border border-[var(--kd-border)] bg-[var(--kd-surface)] transition duration-200 hover:border-[var(--kd-green-500)] hover:shadow-[var(--kd-shadow-sm)]',
};

export function Card({
  children,
  className = '',
  glass = false,
  variant = 'surface',
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  glass?: boolean;
  variant?: CardVariant;
}) {
  return (
    <div
      className={`${glass ? 'glass-light' : variantClasses[variant]} rounded-[var(--kd-radius-3)] text-[var(--kd-text)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
