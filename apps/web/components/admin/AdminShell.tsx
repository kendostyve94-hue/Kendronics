import type { ReactNode } from 'react';
import { Navbar } from '../layout/Navbar';

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f6f7f9]">
      <Navbar />
      <section className="border-b border-slate-200 bg-white pt-24">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f8f6b]">Admin operations</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-ink sm:text-4xl">Kendronics control panel</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Commandes, validation technique, fournisseurs, logistique, support, finance, analytics et conformité.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-500">
            <span className="rounded-sm border border-slate-200 bg-slate-50 px-3 py-2">Restricted workspace</span>
            <span className="rounded-sm border border-slate-200 bg-slate-50 px-3 py-2">Live operations</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 py-5 pb-16 sm:px-6 lg:px-8">
        {children}
      </section>
    </main>
  );
}
