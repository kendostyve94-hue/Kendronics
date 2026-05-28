'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { getCountryCallingCode, parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js/min';
import { africanCountries } from '../../lib/african-countries';

type PhoneValue = {
  phoneE164: string;
  countryIso2: string;
  callingCode: string;
  isValid: boolean;
};

type Props = {
  label?: string;
  value: string;
  error?: string;
  placeholder?: string;
  onChange: (value: string, meta: PhoneValue) => void;
};

const supportedCountries = africanCountries
  .map((country) => {
    try {
      return {
        iso2: country.iso2 as CountryCode,
        name: country.name,
        callingCode: `+${getCountryCallingCode(country.iso2 as CountryCode)}`,
      };
    } catch {
      return null;
    }
  })
  .filter((country): country is { iso2: CountryCode; name: string; callingCode: string } => Boolean(country));

const defaultCountry = supportedCountries.find((country) => country.iso2 === 'CM') ?? supportedCountries[0]!;

export function InternationalPhoneInput({ label, value, error, placeholder = 'Numero de telephone', onChange }: Props) {
  const initialCountry = countryFromPhone(value) ?? defaultCountry;
  const [country, setCountry] = useState(initialCountry);
  const [localValue, setLocalValue] = useState(() => localPhoneValue(value, initialCountry.iso2));
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function close(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);

  useEffect(() => {
    const parsedCountry = countryFromPhone(value);
    if (parsedCountry && parsedCountry.iso2 !== country.iso2) {
      setCountry(parsedCountry);
      setLocalValue(localPhoneValue(value, parsedCountry.iso2));
    }
  }, [value]);

  const countries = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return supportedCountries;
    return supportedCountries.filter((item) => `${item.name} ${item.callingCode} ${item.iso2}`.toLowerCase().includes(needle));
  }, [search]);

  function emit(nextLocalValue: string, nextCountry = country) {
    setLocalValue(nextLocalValue);
    const raw = nextLocalValue.trim();
    const parsed = raw.startsWith('+')
      ? parsePhoneNumberFromString(raw)
      : parsePhoneNumberFromString(raw, nextCountry.iso2);
    const phoneE164 = parsed?.number ?? '';
    onChange(phoneE164 || raw, {
      phoneE164,
      countryIso2: nextCountry.iso2,
      callingCode: nextCountry.callingCode,
      isValid: Boolean(parsed?.isValid() && supportedCountries.some((item) => item.iso2 === parsed.country)),
    });
  }

  function selectCountry(nextCountry: typeof country) {
    setCountry(nextCountry);
    setOpen(false);
    setSearch('');
    emit(localValue, nextCountry);
  }

  return (
    <div ref={rootRef} className="relative">
      {label ? <label className="mb-1 block text-[11px] font-semibold text-slate-600">{label}</label> : null}
      <div className={`flex h-11 items-center border bg-white ${error ? 'border-red-300' : 'border-slate-300'}`}>
        <button type="button" onClick={() => setOpen((current) => !current)} className="flex h-full shrink-0 items-center gap-2 border-r border-slate-200 px-3 text-sm text-slate-900">
          <span>{flagEmoji(country.iso2)}</span>
          <span>{country.callingCode}</span>
          <span className="text-[10px]">v</span>
        </button>
        <input
          value={localValue}
          onChange={(event) => emit(event.target.value)}
          inputMode="tel"
          autoComplete="tel"
          placeholder={placeholder}
          className="min-w-0 flex-1 px-3 text-sm text-slate-900 outline-none"
        />
      </div>
      {error ? <span className="mt-1 block text-xs font-medium text-red-600">{error}</span> : null}
      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.25rem)] z-50 max-h-72 overflow-hidden border border-slate-300 bg-white shadow-lg">
          <div className="border-b border-slate-200 p-2">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search"
              className="h-10 w-full border border-slate-200 px-3 text-sm outline-none focus:border-[#0f8f6b]"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {countries.map((item) => (
              <button
                key={item.iso2}
                type="button"
                onClick={() => selectCountry(item)}
                className={`flex h-9 w-full items-center gap-2 px-3 text-left text-sm hover:bg-slate-100 ${item.iso2 === country.iso2 ? 'bg-slate-100' : ''}`}
              >
                <span>{flagEmoji(item.iso2)}</span>
                <span className="min-w-0 flex-1 truncate text-slate-900">{item.name}</span>
                <span className="text-slate-500">{item.callingCode}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function countryFromPhone(value: string) {
  const parsed = parsePhoneNumberFromString(value || '');
  return parsed?.country ? supportedCountries.find((country) => country.iso2 === parsed.country) : undefined;
}

function localPhoneValue(value: string, country: CountryCode) {
  if (!value) return '';
  const parsed = parsePhoneNumberFromString(value);
  if (!parsed) return value;
  if (parsed.country === country) return parsed.nationalNumber;
  return value;
}

function flagEmoji(countryCode: string) {
  return countryCode
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}
