const nodes = [
  { name: 'North', x: 177, y: 77 },
  { name: 'West', x: 101, y: 175 },
  { name: 'Central', x: 190, y: 213 },
  { name: 'East', x: 273, y: 187 },
  { name: 'Southern', x: 232, y: 326 },
  { name: 'Islands', x: 342, y: 274 },
];

export function AfricaMap() {
  return (
    <div className="glass-light overflow-hidden rounded-2xl p-5 sm:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-signal">Africa logistics network</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-ink sm:text-4xl lg:text-5xl">
            Region-aware delivery logic across the continent.
          </h2>
        </div>
        <p className="max-w-md text-sm leading-6 text-slate-600">
          Countries are grouped by logistics zones while keeping country-level pricing and delivery overrides.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-center">
        <svg viewBox="0 0 420 420" role="img" aria-label="Animated Africa logistics map" className="h-auto w-full">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            d="M158 33 114 54 87 101 55 125 58 171 83 207 92 256 122 280 142 322 181 342 206 385 244 379 257 330 287 300 294 250 326 212 314 170 337 132 307 89 259 72 218 35Z"
            fill="#EAF6FF"
            stroke="#8CC7E8"
            strokeWidth="2"
          />
          <path
            d="M177 77 C134 114 116 141 101 175 C145 181 164 194 190 213 C229 198 248 190 273 187 C263 235 247 280 232 326"
            fill="none"
            stroke="#0EA5E9"
            strokeWidth="3"
            className="route-line animate-route"
            filter="url(#glow)"
          />
          <path
            d="M273 187 C304 209 326 240 342 274"
            fill="none"
            stroke="#0F3B66"
            strokeWidth="3"
            className="route-line animate-route"
            filter="url(#glow)"
          />
          {nodes.map((node, index) => (
            <g key={node.name} style={{ transformOrigin: `${node.x}px ${node.y}px`, animationDelay: `${index * 180}ms` }} className="animate-pulseNode">
              <circle cx={node.x} cy={node.y} r="11" fill="#0EA5E9" opacity="0.2" />
              <circle cx={node.x} cy={node.y} r="5" fill="#0F3B66" />
            </g>
          ))}
        </svg>

        <div className="grid gap-3">
          {['North Africa', 'West Africa', 'Central Africa', 'East Africa', 'Southern Africa', 'African island markets'].map(
            (zone) => (
              <div key={zone} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <span className="text-sm font-bold text-slate-700">{zone}</span>
                <span className="h-2.5 w-2.5 rounded-full bg-signal shadow-[0_0_18px_rgba(14,165,233,0.75)]" />
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
