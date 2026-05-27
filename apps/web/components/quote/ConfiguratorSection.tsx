import type { ReactNode } from 'react';
import { Card } from '../ui/Card';

export function ConfiguratorSection({
  index,
  title,
  description,
  children,
}: {
  index: number;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className="overflow-hidden bg-white">
      <div className="flex items-start gap-4 border-b border-line bg-cloud px-5 py-4 sm:px-6">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-gradient-to-r from-signal to-electric font-mono text-xs font-semibold text-white">
          {String(index).padStart(2, '0')}
        </span>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
        </div>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </Card>
  );
}
