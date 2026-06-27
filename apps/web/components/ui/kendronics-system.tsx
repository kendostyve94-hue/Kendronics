import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

const buttonVariants = {
  primary: 'border-transparent bg-[var(--kd-green-500)] text-white hover:bg-[var(--kd-green-600)]',
  secondary: 'border-[var(--kd-border)] bg-[var(--kd-surface)] text-[var(--kd-text)] hover:border-[var(--kd-green-500)] hover:text-[var(--kd-green-600)]',
  outline: 'border-[var(--kd-green-500)] bg-transparent text-[var(--kd-green-600)] hover:bg-[var(--kd-green-50)]',
  ghost: 'border-transparent bg-transparent text-[var(--kd-text-secondary)] hover:bg-[var(--kd-surface-muted)] hover:text-[var(--kd-text)]',
  danger: 'border-transparent bg-[var(--kd-danger)] text-white hover:brightness-95',
  success: 'border-transparent bg-[var(--kd-success)] text-white hover:brightness-95',
};

const buttonSizes = {
  sm: 'h-9 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-sm',
};

export function KButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
  loading?: boolean;
}) {
  return (
    <button
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-[var(--kd-radius-2)] border font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-55',
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      style={{ boxShadow: 'none' }}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : null}
      {children}
    </button>
  );
}

export function KCard({ children, className, elevated = false, ...props }: HTMLAttributes<HTMLDivElement> & { elevated?: boolean }) {
  return (
    <div
      className={cx('border border-[var(--kd-border)] bg-[var(--kd-surface)] text-[var(--kd-text)]', elevated && 'shadow-[var(--kd-shadow-sm)]', className)}
      style={{ borderRadius: 'var(--kd-radius-3)' }}
      {...props}
    >
      {children}
    </div>
  );
}

export function KField({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-semibold text-[var(--kd-text)]">{label}</span>
      {children}
      {hint ? <span className="text-xs leading-5 text-[var(--kd-muted)]">{hint}</span> : null}
    </label>
  );
}

export function KInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cx('h-10 w-full border border-[var(--kd-border)] bg-[var(--kd-surface)] px-3 text-sm text-[var(--kd-text)] outline-none transition placeholder:text-[var(--kd-muted)] focus:border-[var(--kd-green-500)]', props.className)}
      style={{ borderRadius: 'var(--kd-radius-2)' }}
    />
  );
}

export function KTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cx('min-h-28 w-full border border-[var(--kd-border)] bg-[var(--kd-surface)] px-3 py-2 text-sm leading-6 text-[var(--kd-text)] outline-none transition placeholder:text-[var(--kd-muted)] focus:border-[var(--kd-green-500)]', props.className)}
      style={{ borderRadius: 'var(--kd-radius-2)' }}
    />
  );
}

export function KBadge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  const tones: Record<Tone, string> = {
    neutral: 'bg-[var(--kd-surface-muted)] text-[var(--kd-text-secondary)]',
    success: 'bg-[var(--kd-green-50)] text-[var(--kd-green-700)]',
    warning: 'bg-[#fff7e6] text-[var(--kd-warning)]',
    danger: 'bg-[#fff0f0] text-[var(--kd-danger)]',
    info: 'bg-[#edf4ff] text-[var(--kd-info)]',
  };
  return <span className={cx('inline-flex h-6 items-center rounded-full px-2 text-xs font-semibold', tones[tone])}>{children}</span>;
}

export function KTabs({ items, active, onChange }: { items: Array<{ id: string; label: string }>; active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-1 border-b border-[var(--kd-divider)]">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={cx('h-10 border-b-2 px-3 text-sm font-semibold transition', active === item.id ? 'border-[var(--kd-green-500)] text-[var(--kd-green-600)]' : 'border-transparent text-[var(--kd-text-secondary)] hover:text-[var(--kd-text)]')}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function KAlert({ tone = 'info', title, children }: { tone?: Tone; title: string; children?: ReactNode }) {
  const tones: Record<Tone, string> = {
    neutral: 'border-[var(--kd-border)] bg-[var(--kd-surface-muted)]',
    success: 'border-[var(--kd-green-200)] bg-[var(--kd-green-50)]',
    warning: 'border-[#f2d49b] bg-[#fffaf0]',
    danger: 'border-[#f3b7b7] bg-[#fff5f5]',
    info: 'border-[#bdd3ff] bg-[#f4f8ff]',
  };
  return (
    <div className={cx('border px-4 py-3', tones[tone])} style={{ borderRadius: 'var(--kd-radius-3)' }}>
      <p className="text-sm font-semibold text-[var(--kd-text)]">{title}</p>
      {children ? <div className="mt-1 text-sm leading-6 text-[var(--kd-text-secondary)]">{children}</div> : null}
    </div>
  );
}

export function KSkeleton({ className }: { className?: string }) {
  return <div className={cx('animate-pulse bg-[var(--kd-surface-muted)]', className)} style={{ borderRadius: 'var(--kd-radius-2)' }} />;
}

export function KEmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="grid min-h-60 place-items-center border border-[var(--kd-border)] bg-[var(--kd-surface)] px-6 py-10 text-center" style={{ borderRadius: 'var(--kd-radius-3)' }}>
      <div className="max-w-sm">
        <h3 className="text-lg font-semibold text-[var(--kd-text)]">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-[var(--kd-text-secondary)]">{body}</p>
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </div>
  );
}
