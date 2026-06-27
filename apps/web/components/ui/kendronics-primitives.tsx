'use client';

import type {
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from 'react';

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function KAvatar({ src, name, size = 'md', className }: { src?: string | null; name: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = { sm: 'h-7 w-7 text-[10px]', md: 'h-9 w-9 text-xs', lg: 'h-12 w-12 text-sm' };
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'K';
  return (
    <span className={cx('inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--kd-green-50)] font-semibold text-[var(--kd-green-700)]', sizes[size], className)} aria-label={name}>
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : initials}
    </span>
  );
}

export function KBreadcrumb({ items }: { items: Array<{ label: string; href?: string }> }) {
  return (
    <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-2 text-sm text-[var(--kd-muted)]">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="inline-flex items-center gap-2">
          {index ? <span aria-hidden="true">/</span> : null}
          {item.href ? <a href={item.href} className="hover:text-[var(--kd-green-500)]">{item.label}</a> : <span aria-current="page" className="text-[var(--kd-text)]">{item.label}</span>}
        </span>
      ))}
    </nav>
  );
}

export function KSelect({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cx('h-10 w-full rounded-[var(--kd-radius-2)] border border-[var(--kd-border)] bg-[var(--kd-surface)] px-3 text-sm text-[var(--kd-text)] outline-none focus:border-[var(--kd-green-500)]', className)} {...props}>{children}</select>;
}

export function KSearch({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={cx('flex h-10 items-center gap-2 rounded-[var(--kd-radius-2)] border border-[var(--kd-border)] bg-[var(--kd-surface-muted)] px-3 focus-within:border-[var(--kd-green-500)]', className)}>
      <svg viewBox="0 0 24 24" className="h-4 w-4 text-[var(--kd-muted)]" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
      <input type="search" {...props} className="min-h-0 w-full border-0 bg-transparent p-0 text-sm text-[var(--kd-text)] outline-none" />
    </label>
  );
}

export function KCheckbox({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  return <label className="inline-flex items-start gap-2 text-sm text-[var(--kd-text-secondary)]"><input type="checkbox" {...props} className="mt-0.5 h-4 w-4 accent-[var(--kd-green-500)]" /><span>{label}</span></label>;
}

export function KRadio({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  return <label className="inline-flex items-start gap-2 text-sm text-[var(--kd-text-secondary)]"><input type="radio" {...props} className="mt-0.5 h-4 w-4 accent-[var(--kd-green-500)]" /><span>{label}</span></label>;
}

export function KSwitch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (checked: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-3 text-sm text-[var(--kd-text)]">
      <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)} className={cx('relative h-6 w-11 rounded-full border transition', checked ? 'border-[var(--kd-green-500)] bg-[var(--kd-green-500)]' : 'border-[var(--kd-border)] bg-[var(--kd-surface-muted)]')}>
        <span className={cx('absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white shadow-sm transition', checked ? 'left-[1.35rem]' : 'left-0.5')} />
      </button>
      <span>{label}</span>
    </label>
  );
}

export function KProgress({ value, label }: { value: number; label?: string }) {
  const safe = Math.max(0, Math.min(100, value));
  return (
    <div className="grid gap-1.5">
      {label ? <div className="flex justify-between text-xs text-[var(--kd-text-secondary)]"><span>{label}</span><span>{safe}%</span></div> : null}
      <div className="h-2 overflow-hidden rounded-full bg-[var(--kd-surface-muted)]" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={safe}>
        <div className="h-full rounded-full bg-[var(--kd-green-500)] transition-all duration-200" style={{ width: `${safe}%` }} />
      </div>
    </div>
  );
}

export function KSpinner({ label = 'Chargement' }: { label?: string }) {
  return <span className="inline-flex items-center gap-2 text-sm text-[var(--kd-text-secondary)]" role="status"><span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--kd-border)] border-t-[var(--kd-green-500)]" /><span>{label}</span></span>;
}

export function KTableShell({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('overflow-x-auto rounded-[var(--kd-radius-3)] border border-[var(--kd-border)] bg-[var(--kd-surface)]', className)} {...props}>{children}</div>;
}

export function KPagination({ page, pages, onChange }: { page: number; pages: number; onChange: (page: number) => void }) {
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-3 text-sm">
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} className="h-9 rounded-[var(--kd-radius-2)] border border-[var(--kd-border)] px-3 text-[var(--kd-text)] hover:bg-[var(--kd-surface-muted)]">Precedent</button>
      <span className="text-[var(--kd-text-secondary)]">Page {page} sur {Math.max(1, pages)}</span>
      <button type="button" disabled={page >= pages} onClick={() => onChange(page + 1)} className="h-9 rounded-[var(--kd-radius-2)] border border-[var(--kd-border)] px-3 text-[var(--kd-text)] hover:bg-[var(--kd-surface-muted)]">Suivant</button>
    </nav>
  );
}

export function KModal({ open, title, description, children, onClose }: { open: boolean; title: string; description?: string; children: ReactNode; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/55 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="kd-modal-title" className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-[var(--kd-radius-5)] border border-[var(--kd-border)] bg-[var(--kd-surface-elevated)] p-5 shadow-[var(--kd-shadow-lg)]">
        <div className="flex items-start justify-between gap-4"><div><h2 id="kd-modal-title" className="text-lg font-semibold text-[var(--kd-text)]">{title}</h2>{description ? <p className="mt-1 text-sm text-[var(--kd-text-secondary)]">{description}</p> : null}</div><button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-[var(--kd-radius-2)] text-[var(--kd-muted)] hover:bg-[var(--kd-surface-muted)]" aria-label="Fermer">x</button></div>
        <div className="mt-5">{children}</div>
      </section>
    </div>
  );
}

export function KTooltip({ label, children }: { label: string; children: ReactNode }) {
  return <span className="group relative inline-flex" tabIndex={0}>{children}<span role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-[var(--kd-radius-1)] bg-[var(--kd-text)] px-2 py-1 text-xs text-[var(--kd-surface)] group-hover:block group-focus:block">{label}</span></span>;
}
