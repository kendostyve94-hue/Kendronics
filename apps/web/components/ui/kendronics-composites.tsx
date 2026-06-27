'use client';

import type { ChangeEvent, ReactNode } from 'react';

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function KTag({ children, removable, onRemove }: { children: ReactNode; removable?: boolean; onRemove?: () => void }) {
  return <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-[var(--kd-border)] bg-[var(--kd-surface-muted)] px-2.5 text-xs text-[var(--kd-text-secondary)]">{children}{removable ? <button type="button" onClick={onRemove} className="text-[var(--kd-muted)] hover:text-[var(--kd-danger)]" aria-label="Retirer">x</button> : null}</span>;
}

export function KUpload({ label = 'Ajouter des fichiers', accept, multiple, disabled, onFiles }: { label?: string; accept?: string; multiple?: boolean; disabled?: boolean; onFiles: (files: File[]) => void }) {
  function change(event: ChangeEvent<HTMLInputElement>) {
    onFiles(Array.from(event.target.files ?? []));
    event.target.value = '';
  }
  return (
    <label className={cx('grid min-h-32 cursor-pointer place-items-center rounded-[var(--kd-radius-3)] border border-dashed border-[var(--kd-border)] bg-[var(--kd-surface-muted)] p-5 text-center transition hover:border-[var(--kd-green-500)]', disabled && 'pointer-events-none opacity-55')}>
      <span><span className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-[var(--kd-green-50)] text-xl text-[var(--kd-green-600)]">+</span><span className="mt-2 block text-sm font-semibold text-[var(--kd-text)]">{label}</span><span className="mt-1 block text-xs text-[var(--kd-muted)]">Selection ou glisser-deposer</span></span>
      <input type="file" accept={accept} multiple={multiple} disabled={disabled} onChange={change} className="sr-only" />
    </label>
  );
}

export function KAutocomplete({ id, label, value, options, placeholder, onChange }: { id: string; label: string; value: string; options: string[]; placeholder?: string; onChange: (value: string) => void }) {
  return <label className="grid gap-1.5"><span className="text-sm font-semibold text-[var(--kd-text)]">{label}</span><input list={`${id}-options`} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-[var(--kd-radius-2)] border border-[var(--kd-border)] bg-[var(--kd-surface)] px-3 text-sm text-[var(--kd-text)] outline-none focus:border-[var(--kd-green-500)]"/><datalist id={`${id}-options`}>{options.map((option) => <option key={option} value={option} />)}</datalist></label>;
}

export function KOtp({ value, length = 6, onChange }: { value: string; length?: number; onChange: (value: string) => void }) {
  return <input inputMode="numeric" autoComplete="one-time-code" maxLength={length} value={value} onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, length))} aria-label="Code de verification" className="h-12 w-full rounded-[var(--kd-radius-2)] border border-[var(--kd-border)] bg-[var(--kd-surface)] px-3 text-center font-mono text-xl tracking-[0.45em] text-[var(--kd-text)] outline-none focus:border-[var(--kd-green-500)]" />;
}

export function KAccordion({ items }: { items: Array<{ id: string; title: string; content: ReactNode }> }) {
  return <div className="divide-y divide-[var(--kd-divider)] overflow-hidden rounded-[var(--kd-radius-3)] border border-[var(--kd-border)] bg-[var(--kd-surface)]">{items.map((item) => <details key={item.id} className="group"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-sm font-semibold text-[var(--kd-text)]"><span>{item.title}</span><span className="text-[var(--kd-muted)] transition group-open:rotate-45">+</span></summary><div className="px-4 pb-4 text-sm leading-6 text-[var(--kd-text-secondary)]">{item.content}</div></details>)}</div>;
}

export function KDropdown({ label, children }: { label: ReactNode; children: ReactNode }) {
  return <details className="group relative"><summary className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-[var(--kd-radius-2)] border border-[var(--kd-border)] bg-[var(--kd-surface)] px-3 text-sm font-semibold text-[var(--kd-text)]">{label}<span aria-hidden="true">v</span></summary><div className="absolute right-0 z-40 mt-2 min-w-52 rounded-[var(--kd-radius-3)] border border-[var(--kd-border)] bg-[var(--kd-surface-elevated)] p-1 shadow-[var(--kd-shadow-md)]">{children}</div></details>;
}

export function KPopover({ trigger, children }: { trigger: ReactNode; children: ReactNode }) {
  return <details className="group relative inline-block"><summary className="list-none cursor-pointer">{trigger}</summary><div className="absolute left-0 z-40 mt-2 w-72 rounded-[var(--kd-radius-3)] border border-[var(--kd-border)] bg-[var(--kd-surface-elevated)] p-4 text-sm text-[var(--kd-text-secondary)] shadow-[var(--kd-shadow-md)]">{children}</div></details>;
}

export function KTimeline({ items }: { items: Array<{ id: string; title: string; body?: string; date?: string; complete?: boolean }> }) {
  return <ol className="grid">{items.map((item, index) => <li key={item.id} className="relative grid grid-cols-[1.25rem_1fr] gap-3 pb-5 last:pb-0"><span className={cx('relative z-10 mt-1 h-3 w-3 rounded-full border-2', item.complete ? 'border-[var(--kd-green-500)] bg-[var(--kd-green-500)]' : 'border-[var(--kd-border)] bg-[var(--kd-surface)]')}/>{index < items.length - 1 ? <span className="absolute left-[5px] top-4 h-full w-px bg-[var(--kd-divider)]"/> : null}<div><div className="flex flex-wrap justify-between gap-2"><p className="text-sm font-semibold text-[var(--kd-text)]">{item.title}</p>{item.date ? <time className="text-xs text-[var(--kd-muted)]">{item.date}</time> : null}</div>{item.body ? <p className="mt-1 text-sm leading-6 text-[var(--kd-text-secondary)]">{item.body}</p> : null}</div></li>)}</ol>;
}

export function KToast({ tone = 'neutral', title, body, onClose }: { tone?: 'neutral' | 'success' | 'warning' | 'danger'; title: string; body?: string; onClose?: () => void }) {
  const accent = { neutral: 'var(--kd-border)', success: 'var(--kd-success)', warning: 'var(--kd-warning)', danger: 'var(--kd-danger)' }[tone];
  return <div role="status" className="flex w-full max-w-sm items-start gap-3 rounded-[var(--kd-radius-3)] border border-[var(--kd-border)] bg-[var(--kd-surface-elevated)] p-4 shadow-[var(--kd-shadow-md)]" style={{ borderLeftColor: accent, borderLeftWidth: 3 }}><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[var(--kd-text)]">{title}</p>{body ? <p className="mt-1 text-sm text-[var(--kd-text-secondary)]">{body}</p> : null}</div>{onClose ? <button type="button" onClick={onClose} className="text-[var(--kd-muted)]" aria-label="Fermer">x</button> : null}</div>;
}

export function KDrawer({ open, title, side = 'right', children, onClose }: { open: boolean; title: string; side?: 'left' | 'right'; children: ReactNode; onClose: () => void }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-[100] bg-black/50" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><aside role="dialog" aria-modal="true" className={cx('absolute inset-y-0 w-full max-w-md overflow-auto border-[var(--kd-border)] bg-[var(--kd-surface-elevated)] p-5 shadow-[var(--kd-shadow-lg)]', side === 'right' ? 'right-0 border-l' : 'left-0 border-r')}><div className="flex items-center justify-between gap-4"><h2 className="text-lg font-semibold text-[var(--kd-text)]">{title}</h2><button type="button" onClick={onClose} aria-label="Fermer">x</button></div><div className="mt-5">{children}</div></aside></div>;
}

export function KBottomSheet({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose: () => void }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-[100] flex items-end bg-black/50" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section role="dialog" aria-modal="true" className="max-h-[88vh] w-full overflow-auto rounded-t-[var(--kd-radius-6)] border border-[var(--kd-border)] bg-[var(--kd-surface-elevated)] p-5 shadow-[var(--kd-shadow-lg)]"><span className="mx-auto mb-4 block h-1 w-10 rounded-full bg-[var(--kd-border)]"/><div className="flex items-center justify-between gap-4"><h2 className="text-lg font-semibold text-[var(--kd-text)]">{title}</h2><button type="button" onClick={onClose} aria-label="Fermer">x</button></div><div className="mt-5">{children}</div></section></div>;
}

export function KFab({ label, children, onClick }: { label: string; children: ReactNode; onClick: () => void }) {
  return <button type="button" onClick={onClick} aria-label={label} title={label} className="fixed bottom-24 right-5 z-40 grid h-12 w-12 place-items-center rounded-full bg-[var(--kd-green-500)] text-white shadow-[var(--kd-shadow-md)] transition hover:bg-[var(--kd-green-600)]">{children}</button>;
}

export function KEntityCard({ eyebrow, title, description, media, meta, actions, href }: { eyebrow?: string; title: string; description?: string; media?: ReactNode; meta?: ReactNode; actions?: ReactNode; href?: string }) {
  const content = <>{media ? <div className="aspect-video overflow-hidden bg-[var(--kd-surface-muted)]">{media}</div> : null}<div className="p-4">{eyebrow ? <p className="text-xs font-semibold uppercase text-[var(--kd-green-500)]">{eyebrow}</p> : null}<h3 className="mt-1 text-base font-semibold text-[var(--kd-text)]">{title}</h3>{description ? <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--kd-text-secondary)]">{description}</p> : null}{meta ? <div className="mt-3 text-xs text-[var(--kd-muted)]">{meta}</div> : null}{actions ? <div className="mt-4 flex items-center gap-2 border-t border-[var(--kd-divider)] pt-3">{actions}</div> : null}</div></>;
  const className = 'block overflow-hidden rounded-[var(--kd-radius-3)] border border-[var(--kd-border)] bg-[var(--kd-surface)] transition hover:border-[var(--kd-green-500)]';
  return href ? <a href={href} className={className}>{content}</a> : <article className={className}>{content}</article>;
}

export const KProductCard = KEntityCard;
export const KCommunityCard = KEntityCard;
export const KArticleCard = KEntityCard;
export const KDocumentationCard = KEntityCard;
export const KTutorialCard = KEntityCard;
export const KCompanyCard = KEntityCard;
export const KManufacturerCard = KEntityCard;
export const KSupplierCard = KEntityCard;
export const KProjectCard = KEntityCard;
export const KQuoteCard = KEntityCard;
