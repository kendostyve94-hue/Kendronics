import type { HTMLAttributes, ReactNode } from 'react';

export function Card({
  children,
  className = '',
  glass = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  glass?: boolean;
}) {
  return (
    <div
      className={`${glass ? 'glass-light' : 'border border-line bg-white'} rounded-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
