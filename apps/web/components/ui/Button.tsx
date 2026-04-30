import type { AnchorHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'light';

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[#0f8f6b] text-white hover:bg-[#0b7558]',
  secondary: 'border border-slate-200 bg-white text-[#0f8f6b] hover:border-[#0f8f6b] hover:bg-[#eefbf6]',
  ghost: 'border border-transparent bg-transparent text-slate-600 hover:border-[#0f8f6b]/30 hover:bg-[#eefbf6] hover:text-[#0f8f6b]',
  light: 'bg-white text-[#0f8f6b] hover:bg-[#eefbf6]',
};

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
}) {
  return (
    <a
      className={`inline-flex h-11 items-center justify-center rounded-sm px-6 text-sm font-black transition duration-300 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </a>
  );
}
