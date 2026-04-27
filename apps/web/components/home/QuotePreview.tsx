'use client';

import { useMemo, useState } from 'react';
import { Button } from '../ui/Button';

const destinations = [
  { code: 'SN', label: 'Senegal', zoneFee: 22 },
  { code: 'NG', label: 'Nigeria', zoneFee: 27 },
  { code: 'KE', label: 'Kenya', zoneFee: 29 },
  { code: 'ZA', label: 'South Africa', zoneFee: 31 },
  { code: 'MA', label: 'Morocco', zoneFee: 19 },
];

export function QuotePreview() {
  const [layers, setLayers] = useState(2);
  const [length, setLength] = useState(80);
  const [width, setWidth] = useState(60);
  const [quantity, setQuantity] = useState(10);
  const [countryCode, setCountryCode] = useState('SN');

  const price = useMemo(() => {
    const destination = destinations.find((item) => item.code === countryCode) ?? destinations[0];
    const areaCm2 = (length * width) / 100;
    const layerMultiplier = { 2: 1, 4: 1.8, 6: 2.7 }[layers] ?? 1;
    const manufacturing = areaCm2 * quantity * 0.025 * layerMultiplier;
    const service = Math.max(12, manufacturing * 0.22);
    const processing = 21;
    const payment = (manufacturing + destination.zoneFee + service + processing) * 0.029 + 0.3;
    return manufacturing + destination.zoneFee + service + processing + payment;
  }, [countryCode, layers, length, quantity, width]);

  return (
    <section className="glass-light relative z-10 mx-auto max-w-6xl rounded-2xl p-4 sm:p-6" aria-label="Quote preview">
      <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-signal">Instant quote preview</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-ink">Configure the essentials in seconds.</h2>
        </div>
        <p className="max-w-sm text-sm leading-6 text-slate-600">Interactive layout ready for the production pricing API.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Layers</span>
            <select
              value={layers}
              onChange={(event) => setLayers(Number(event.target.value))}
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-ink outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
            >
              <option value={2}>2 layers</option>
              <option value={4}>4 layers</option>
              <option value={6}>6 layers</option>
            </select>
          </label>
          <NumberField label="Length mm" value={length} onChange={setLength} />
          <NumberField label="Width mm" value={width} onChange={setWidth} />
          <NumberField label="Quantity" value={quantity} onChange={setQuantity} />
          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Destination</span>
            <select
              value={countryCode}
              onChange={(event) => setCountryCode(event.target.value)}
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-ink outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
            >
              {destinations.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:min-w-64">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">Live quote preview</p>
            <p className="mt-1 text-3xl font-black tracking-tight text-deepblue">€{price.toFixed(2)}</p>
          </div>
          <Button href="/quote" className="h-11 px-4">
            Continue to quote
          </Button>
        </div>
      </div>
    </section>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>
      <input
        type="number"
        min={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-ink outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
      />
    </label>
  );
}
