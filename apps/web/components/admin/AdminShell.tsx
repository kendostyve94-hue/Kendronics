import type { ReactNode } from 'react';

export function AdminShell({ children }: { children: ReactNode }) {
  return <main className="min-h-screen bg-[#eaf2f7] text-ink">{children}</main>;
}
