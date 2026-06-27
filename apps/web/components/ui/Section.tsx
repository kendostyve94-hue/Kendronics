import type { ReactNode } from 'react';

export function Section({
  id,
  eyebrow,
  title,
  description,
  children,
  className = '',
  surface = 'plain',
}: {
  id?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  surface?: 'plain' | 'muted' | 'dark';
}) {
  const surfaceClass = surface === 'muted'
    ? 'bg-[var(--kd-surface-muted)]'
    : surface === 'dark'
      ? 'bg-[#071117] text-white'
      : '';

  return (
    <section id={id} className={`${surfaceClass} px-4 py-10 sm:px-6 lg:px-8 ${className}`}>
      <div className="mx-auto max-w-[1280px]">
      {(eyebrow || title || description) && (
        <div className="mb-9 max-w-3xl">
          {eyebrow && <p className="label-caps text-[var(--kd-green-500)]">{eyebrow}</p>}
          {title && <h2 className={`mt-3 text-2xl font-semibold tracking-tight sm:text-3xl ${surface === 'dark' ? 'text-white' : 'text-[var(--kd-text)]'}`}>{title}</h2>}
          {description && <p className={`mt-3 text-sm leading-6 sm:text-base ${surface === 'dark' ? 'text-white/75' : 'text-[var(--kd-text-secondary)]'}`}>{description}</p>}
        </div>
      )}
      {children}
      </div>
    </section>
  );
}
