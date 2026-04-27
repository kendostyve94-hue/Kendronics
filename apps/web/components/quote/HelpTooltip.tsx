'use client';

import { useState } from 'react';

export function HelpTooltip({
  title,
  children,
  visual,
}: {
  title: string;
  children: string;
  visual?: 'via' | 'stack' | 'barcode';
}) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="grid h-5 w-5 place-items-center rounded-full border border-signal/35 bg-signal/10 text-[11px] font-black text-deepblue transition hover:bg-signal/20"
        aria-label={`Help: ${title}`}
      >
        ?
      </button>
      {open && (
        <span className="absolute right-0 top-7 z-30 w-72 rounded-lg border border-line bg-white p-4 text-left shadow-glass">
          <span className="block text-sm font-black text-ink">{title}</span>
          <span className="mt-2 block text-xs leading-5 text-slate-600">{children}</span>
          {visual && <TooltipVisual visual={visual} />}
        </span>
      )}
    </span>
  );
}

function TooltipVisual({ visual }: { visual: 'via' | 'stack' | 'barcode' }) {
  if (visual === 'via') {
    return (
      <span className="mt-3 grid h-20 place-items-center rounded bg-cloud">
        <span className="h-12 w-12 rounded-full border-8 border-signal bg-white shadow-inner" />
      </span>
    );
  }

  if (visual === 'barcode') {
    return (
      <span className="mt-3 grid h-20 grid-cols-6 gap-1 rounded bg-cloud p-4">
        {Array.from({ length: 12 }).map((_, index) => (
          <span key={index} className="bg-signal" style={{ opacity: index % 3 === 0 ? 0.45 : 1 }} />
        ))}
      </span>
    );
  }

  return (
    <span className="mt-3 block h-20 rounded bg-cloud p-3">
      <span className="block h-3 rounded bg-signal" />
      <span className="mt-3 block h-3 rounded bg-mint" />
      <span className="mt-3 block h-3 rounded bg-slate-200" />
    </span>
  );
}
