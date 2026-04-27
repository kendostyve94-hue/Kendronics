import type { ReactNode } from 'react';

export function Section({
  id,
  eyebrow,
  title,
  description,
  children,
  className = '',
}: {
  id?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8 ${className}`}>
      {(eyebrow || title || description) && (
        <div className="mb-9 max-w-3xl">
          {eyebrow && <p className="label-caps text-[#0f8f6b]">{eyebrow}</p>}
          {title && <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{title}</h2>}
          {description && <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">{description}</p>}
        </div>
      )}
      {children}
    </section>
  );
}
