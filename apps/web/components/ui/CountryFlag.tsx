export function CountryFlag({ iso2, name, className = '' }: { iso2: string; name?: string; className?: string }) {
  const code = iso2.trim().toLowerCase();
  const label = name ? `${name} flag` : `${iso2.toUpperCase()} flag`;

  if (!code) {
    return (
      <span className={`inline-block h-[14px] w-5 shrink-0 border border-slate-300 bg-white ${className}`} aria-label={label} />
    );
  }

  return (
    <span
      role="img"
      aria-label={label}
      className={`inline-block h-[14px] w-5 shrink-0 border border-slate-300 bg-white bg-cover bg-center bg-no-repeat ${className}`}
      style={{ backgroundImage: `url("https://flagcdn.com/w40/${code}.png")` }}
    />
  );
}
