'use client';

import { useState } from 'react';

export function CountryFlag({ iso2, name, className = '' }: { iso2: string; name?: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const code = iso2.trim().toLowerCase();
  const label = name ? `${name} flag` : `${iso2.toUpperCase()} flag`;

  if (!code || failed) {
    return (
      <span className={`inline-flex h-[14px] w-5 shrink-0 items-center justify-center border border-slate-300 bg-white text-[7px] font-semibold text-slate-600 ${className}`}>
        {iso2.slice(0, 2).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={`https://flagcdn.com/w40/${code}.png`}
      srcSet={`https://flagcdn.com/w40/${code}.png 1x, https://flagcdn.com/w80/${code}.png 2x`}
      width={20}
      height={14}
      alt={label}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={`inline-block h-[14px] w-5 shrink-0 border border-slate-300 object-cover ${className}`}
    />
  );
}
