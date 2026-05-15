import type { ReactNode } from 'react';
import { Navbar } from '../layout/Navbar';

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#eaf2f7] pt-[71px] text-ink">
      <Navbar />
      {children}
    </main>
  );
}
