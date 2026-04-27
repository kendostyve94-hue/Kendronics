import type { ReactNode } from 'react';
import { Navbar } from '../layout/Navbar';

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-cloud">
      <Navbar />
      <section className="relative overflow-hidden bg-ink pb-24 pt-32 text-white">
        <img
          src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=2200&q=85"
          alt="Macro view of a printed circuit board"
          className="absolute inset-0 h-full w-full object-cover opacity-[0.3]"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink/[0.86] to-deepblue/[0.62]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-100">Admin operations</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
            Kendronics control panel.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
            Manage orders, fulfillment milestones, pricing margins, support, and audit trails from one restricted workspace.
          </p>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-12 max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        {children}
      </section>
    </main>
  );
}
