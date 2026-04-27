import { HelpTooltip } from './HelpTooltip';

export function FieldLabel({
  label,
  help,
  visual,
}: {
  label: string;
  help: string;
  visual?: 'via' | 'stack' | 'barcode';
}) {
  return (
    <span className="mb-2 flex items-center justify-between gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
      {label}
      <HelpTooltip title={label} visual={visual}>
        {help}
      </HelpTooltip>
    </span>
  );
}

export function SelectField({
  label,
  help,
  value,
  options,
  onChange,
  visual,
}: {
  label: string;
  help: string;
  value: string | number;
  options: Array<string | number | { value: string | number; label: string }>;
  onChange: (value: string) => void;
  visual?: 'via' | 'stack' | 'barcode';
}) {
  return (
    <label className="block">
      <FieldLabel label={label} help={help} visual={visual} />
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-[10px] border border-line bg-white px-3 text-sm font-bold text-ink outline-none transition focus:border-signal focus:ring-2 focus:ring-signal/20"
      >
        {options.map((option) => {
          const value = typeof option === 'object' ? option.value : option;
          const label = typeof option === 'object' ? option.label : option;
          return (
            <option key={String(value)} value={value}>
              {label}
            </option>
          );
        })}
      </select>
    </label>
  );
}

export function NumberField({
  label,
  help,
  value,
  onChange,
  min = 0,
}: {
  label: string;
  help: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
}) {
  return (
    <label className="block">
      <FieldLabel label={label} help={help} />
      <input
        type="number"
        min={min}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-12 w-full rounded-[10px] border border-line bg-white px-3 text-sm font-bold text-ink outline-none transition focus:border-signal focus:ring-2 focus:ring-signal/20"
      />
    </label>
  );
}

export function ToggleField({
  label,
  help,
  checked,
  onChange,
  visual,
}: {
  label: string;
  help: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  visual?: 'via' | 'stack' | 'barcode';
}) {
  return (
    <label className="flex min-h-16 items-center justify-between gap-3 rounded-[10px] border border-line bg-white px-4 py-3 shadow-sm transition hover:border-signal/60">
      <span>
        <FieldLabel label={label} help={help} visual={visual} />
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 rounded border-line bg-white text-signal accent-[#5FA8D3]"
      />
    </label>
  );
}
