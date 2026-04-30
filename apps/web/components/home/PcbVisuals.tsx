import { Card } from '../ui/Card';

const images = [
  {
    src: 'https://images.pexels.com/photos/6755059/pexels-photo-6755059.jpeg?auto=compress&cs=tinysrgb&w=1600',
    alt: 'Close-up photograph of an assembled printed circuit board',
    source: 'Pexels',
  },
  {
    src: 'https://cdn.pixabay.com/photo/2022/02/02/10/09/printed-circuit-board-6979572_1280.jpg',
    alt: 'High-resolution photograph of a printed circuit board',
    source: 'Pixabay',
  },
];

export function PcbVisuals() {
  return (
    <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
      <div>
        <p className="text-sm font-black uppercase tracking-wide text-signal">PCB visuals</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-ink sm:text-4xl lg:text-5xl">
          Real board imagery, no fabricated production claims.
        </h2>
        <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
          The product experience focuses on your files, board specifications, partner manufacturing handoff, and Africa-bound logistics.
        </p>
        <div className="mt-7 grid max-w-md gap-3">
          {['Gerber validation ready', 'Quote breakdown by cost line', 'External partner order reference', 'Delivery tracking to destination'].map(
            (item) => (
              <div key={item} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700">
                {item}
              </div>
            ),
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {images.map((image) => (
          <div key={image.src} className="image-reflection group relative overflow-hidden rounded-2xl">
            <img
              src={image.src}
              alt={image.alt}
              className="aspect-[4/3] w-full object-cover transition duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent p-4">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-white/80">{image.source}</span>
            </div>
          </div>
        ))}
        <Card glass className="relative col-span-full min-h-64 overflow-hidden p-6">
          <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/7174650/pexels-photo-7174650.jpeg?auto=compress&cs=tinysrgb&w=1600')] bg-cover bg-center opacity-20" />
          <div className="absolute left-8 right-8 top-14 h-24 rounded-2xl border border-sky-300 bg-sky-100/80 animate-layerLift" />
          <div className="absolute left-12 right-12 top-24 h-24 rounded-2xl border border-emerald-300 bg-emerald-100/80 animate-layerLift [animation-delay:240ms]" />
          <div className="absolute left-16 right-16 top-32 h-24 rounded-2xl border border-slate-300 bg-white/80 animate-layerLift [animation-delay:480ms]" />
          <div className="relative z-10">
            <p className="text-sm font-black uppercase tracking-wide text-deepblue">Structure multicouche</p>
            <p className="mt-2 max-w-xs text-sm leading-6 text-slate-600">A subtle layer animation for fabrication decisions.</p>
          </div>
        </Card>
      </div>
    </section>
  );
}
