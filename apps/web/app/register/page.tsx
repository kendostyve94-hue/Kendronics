'use client';

import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Button } from '../../components/ui/Button';
import { africanCountries } from '../../lib/african-countries';
import { getApiBaseUrl } from '../../lib/api-base-url';
import { validateRegisterForm } from '../../lib/register-validation';
import type { AccountType, RegisterErrors, RegisterFormState } from '../../lib/register-validation';

const initialValues: RegisterFormState = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  country: '',
  city: '',
  phone: '',
  company: '',
  accountType: 'individual',
  acceptedTerms: false,
};
const apiBaseUrl = getApiBaseUrl();
const profileStorageKey = 'kendronics.customer.profile';

export default function RegisterPage() {
  const [values, setValues] = useState<RegisterFormState>(initialValues);
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'account_created'>('idle');

  const selectedCountry = useMemo(
    () => africanCountries.find((country) => country.iso2 === values.country),
    [values.country],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateRegisterForm(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setStatus('submitting');

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: values.email.trim().toLowerCase(),
          password: values.password,
          fullName: `${values.firstName.trim()} ${values.lastName.trim()}`,
          companyName: values.company.trim() || undefined,
          profile: {
            firstName: values.firstName.trim(),
            lastName: values.lastName.trim(),
            country: values.country,
            city: values.city.trim(),
            phone: values.phone.trim() || undefined,
            accountType: values.accountType,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Registration failed.');
      }

      window.localStorage.setItem(
        profileStorageKey,
        JSON.stringify({
          name: `${values.firstName.trim()} ${values.lastName.trim()}`.trim(),
          email: values.email.trim().toLowerCase(),
          phone: values.phone.trim(),
          company: values.company.trim(),
          country: selectedCountry?.name ?? values.country,
        }),
      );
      setStatus('account_created');
    } catch {
      setErrors({ form: 'Impossible de creer votre compte pour le moment. Reessayez.' });
      setStatus('idle');
    }
  }

  function update<K extends keyof RegisterFormState>(key: K, value: RegisterFormState[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
  }

  return (
    <main className="min-h-screen bg-ink text-white">
      <Navbar />
      <section className="relative min-h-screen overflow-hidden px-4 pb-12 pt-28 sm:px-6 lg:px-8">
        <img
          src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=2200&q=85"
          alt="Macro close-up of a printed circuit board"
          className="absolute inset-0 h-full w-full object-cover opacity-[0.32]"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink/[0.86] to-deepblue/[0.66]" />

        <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="max-w-xl">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-100">Creez votre compte Kendronics</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              Commencez a demander des devis PCB pour une livraison en Afrique.
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-200">
              Register in under a minute. Payment setup happens only when you place an order.
            </p>
            <div className="mt-8 grid gap-3 text-sm font-bold text-sky-100 sm:grid-cols-3">
              <div className="glass rounded-2xl p-4">No card required</div>
              <div className="glass rounded-2xl p-4">Secure account</div>
              <div className="glass rounded-2xl p-4">All African countries</div>
            </div>
          </div>

          <div className="glass-light rounded-3xl p-5 text-ink sm:p-7">
            {status === 'account_created' ? (
              <AccountCreatedState email={values.email} />
            ) : (
              <form onSubmit={submit} className="space-y-5" noValidate>
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-ink">Creer un compte</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Use a professional email when possible. Your account is created immediately after signup.
                  </p>
                </div>

                {errors.form && <ErrorBox message={errors.form} />}

                <div className="grid gap-4 sm:grid-cols-2">
                  <TextInput label="First name" value={values.firstName} error={errors.firstName} onChange={(value) => update('firstName', value)} />
                  <TextInput label="Last name" value={values.lastName} error={errors.lastName} onChange={(value) => update('lastName', value)} />
                  <TextInput label="Email" type="email" value={values.email} error={errors.email} onChange={(value) => update('email', value)} />
                  <TextInput label="Phone optional" value={values.phone} onChange={(value) => update('phone', value)} />
                  <PasswordInput label="Password" value={values.password} error={errors.password} onChange={(value) => update('password', value)} />
                  <PasswordInput label="Confirm password" value={values.confirmPassword} error={errors.confirmPassword} onChange={(value) => update('confirmPassword', value)} />
                  <SelectInput
                    label="Country"
                    value={values.country}
                    error={errors.country}
                    onChange={(value) => update('country', value)}
                    options={[{ value: '', label: 'Select country' }, ...africanCountries.map((country) => ({ value: country.iso2, label: country.name }))]}
                  />
                  <TextInput label="City" value={values.city} error={errors.city} onChange={(value) => update('city', value)} />
                  <TextInput label="Company optional" value={values.company} onChange={(value) => update('company', value)} className="sm:col-span-2" />
                </div>

                <div>
                  <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500">Account type</p>
                  <div className="grid gap-3 sm:grid-cols-4">
                    {(['individual', 'student', 'startup', 'company'] satisfies AccountType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => update('accountType', type)}
                        className={`rounded-2xl border px-4 py-3 text-sm font-black capitalize transition ${
                          values.accountType === type
                            ? 'border-sky-300 bg-sky-50 text-deepblue shadow-sm'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-sky-200'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedCountry && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                    Logistics zone: <span className="font-black text-deepblue">{selectedCountry.logisticsZone}</span>
                  </div>
                )}

                <label className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
                  <input
                    type="checkbox"
                    checked={values.acceptedTerms}
                    onChange={(event) => update('acceptedTerms', event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-signal"
                  />
                  <span>
                    I accept the <a href="/terms" className="font-black text-deepblue">terms</a> and{' '}
                    <a href="/privacy" className="font-black text-deepblue">privacy policy</a>.
                    {errors.acceptedTerms && <span className="mt-1 block text-xs font-bold text-red-600">{errors.acceptedTerms}</span>}
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="h-12 w-full rounded-xl bg-deepblue text-sm font-black text-white shadow-lg shadow-sky-950/20 transition hover:bg-deepblue-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {status === 'submitting' ? 'Creation du compte...' : 'Creer un compte'}
                </button>

                <p className="text-center text-sm text-slate-600">
                  Already registered? <a href="/login" className="font-black text-deepblue">Log in</a>
                </p>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function TextInput({
  label,
  value,
  onChange,
  error,
  type = 'text',
  className = '',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`h-12 w-full rounded-xl border bg-white px-3 text-sm font-bold text-ink outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100 ${
          error ? 'border-red-300' : 'border-slate-200'
        }`}
      />
      {error && <span className="mt-1 block text-xs font-bold text-red-600">{error}</span>}
    </label>
  );
}

function PasswordInput(props: Omit<Parameters<typeof TextInput>[0], 'type'>) {
  return <TextInput {...props} type="password" />;
}

function SelectInput({
  label,
  value,
  onChange,
  options,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`h-12 w-full rounded-xl border bg-white px-3 text-sm font-bold text-ink outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100 ${
          error ? 'border-red-300' : 'border-slate-200'
        }`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className="mt-1 block text-xs font-bold text-red-600">{error}</span>}
    </label>
  );
}

function ErrorBox({ message }: { message: string }) {
  return <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{message}</div>;
}

function AccountCreatedState({ email }: { email: string }) {
  return (
    <div className="py-8 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-2xl font-black text-emerald-700">
        ✓
      </div>
      <h2 className="mt-5 text-2xl font-black tracking-tight text-ink">Account created</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
        We created your account for <span className="font-black text-deepblue">{email}</span>.
        You can now log in and continue your order setup.
      </p>
      <Button href="/login" className="mt-6">
        Continue to login
      </Button>
    </div>
  );
}
