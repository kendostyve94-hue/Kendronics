'use client';

import { useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
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
  const [newsletter, setNewsletter] = useState(false);

  const selectedCountry = useMemo(
    () => africanCountries.find((country) => country.iso2 === values.country),
    [values.country],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submissionValues: RegisterFormState = {
      ...values,
      lastName: values.lastName.trim() || values.firstName.trim(),
      confirmPassword: values.confirmPassword || values.password,
      city: values.city.trim() || 'Not specified',
    };
    const nextErrors = validateRegisterForm(submissionValues);
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
          email: submissionValues.email.trim().toLowerCase(),
          password: submissionValues.password,
          fullName: `${submissionValues.firstName.trim()} ${submissionValues.lastName.trim()}`,
          companyName: submissionValues.company.trim() || undefined,
          profile: {
            firstName: submissionValues.firstName.trim(),
            lastName: submissionValues.lastName.trim(),
            country: submissionValues.country,
            city: submissionValues.city.trim(),
            phone: submissionValues.phone.trim() || undefined,
            accountType: submissionValues.accountType,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Registration failed.');
      }

      window.localStorage.setItem(
        profileStorageKey,
        JSON.stringify({
          name: `${submissionValues.firstName.trim()} ${submissionValues.lastName.trim()}`.trim(),
          email: submissionValues.email.trim().toLowerCase(),
          phone: submissionValues.phone.trim(),
          company: submissionValues.company.trim(),
          country: selectedCountry?.name ?? submissionValues.country,
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
    <main className="min-h-screen bg-cloud text-ink sm:bg-ink sm:text-white">
      <div className="hidden sm:block">
        <Navbar />
      </div>
      <MobileRegisterScreen
        values={values}
        errors={errors}
        status={status}
        newsletter={newsletter}
        onNewsletter={setNewsletter}
        onSubmit={submit}
        onUpdate={update}
      />
      <section className="relative hidden min-h-screen overflow-hidden px-4 pb-10 pt-20 sm:block sm:px-6 sm:pb-12 sm:pt-28 lg:px-8">
        <img
          src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=2200&q=85"
          alt="Macro close-up of a printed circuit board"
          className="absolute inset-0 hidden h-full w-full object-cover opacity-[0.32] sm:block"
        />
        <div className="absolute inset-0 hidden bg-gradient-to-br from-ink via-ink/[0.86] to-deepblue/[0.66] sm:block" />

        <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="hidden max-w-xl sm:block">
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

          <div className="rounded-2xl border border-slate-200 bg-[#f1f5f9] p-3 text-ink sm:rounded-3xl sm:bg-white sm:p-7">
            <MobileAuthTabs active="register" />
            {status === 'account_created' ? (
              <AccountCreatedState email={values.email} />
            ) : (
              <form onSubmit={submit} className="space-y-3 sm:space-y-5" noValidate>
                <div>
                  <h2 className="text-xl font-black tracking-tight text-ink sm:text-2xl">Create your Account</h2>
                  <p className="hidden mt-2 text-sm leading-6 text-slate-600 sm:block">
                    Use a professional email when possible. Your account is created immediately after signup.
                  </p>
                </div>

                {errors.form && <ErrorBox message={errors.form} />}

                <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
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
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 sm:mb-3 sm:text-xs sm:tracking-[0.16em]">Account type</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                    {(['individual', 'student', 'startup', 'company'] satisfies AccountType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => update('accountType', type)}
                        className={`h-10 rounded-xl border px-3 text-xs font-black capitalize transition sm:h-auto sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm ${
                          values.accountType === type
                            ? 'border-sky-300 bg-sky-50 text-deepblue'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-sky-200'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedCountry && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-600 sm:p-4 sm:text-sm">
                    Logistics zone: <span className="font-black text-deepblue">{selectedCountry.logisticsZone}</span>
                  </div>
                )}

                <label className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-600 sm:p-4 sm:text-sm sm:leading-6">
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
                  className="h-10 w-full rounded-xl bg-deepblue text-xs font-black text-white transition hover:bg-deepblue-dark disabled:cursor-not-allowed disabled:opacity-60 sm:h-12 sm:text-sm"
                >
                  {status === 'submitting' ? 'Creation du compte...' : 'Creer un compte'}
                </button>

                <p className="hidden text-center text-sm text-slate-600 sm:block">
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

function MobileRegisterScreen({
  values,
  errors,
  status,
  newsletter,
  onNewsletter,
  onSubmit,
  onUpdate,
}: {
  values: RegisterFormState;
  errors: RegisterErrors;
  status: 'idle' | 'submitting' | 'account_created';
  newsletter: boolean;
  onNewsletter: (value: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUpdate: <K extends keyof RegisterFormState>(key: K, value: RegisterFormState[K]) => void;
}) {
  if (status === 'account_created') {
    return (
      <section className="auth-neumo mx-auto max-w-md px-4 pb-5 pt-6 sm:hidden">
        <AccountCreatedState email={values.email} />
      </section>
    );
  }

  return (
    <section className="auth-neumo mx-auto max-w-md px-4 pb-5 pt-6 sm:hidden">
      <h1 className="text-[30px] font-black leading-tight tracking-normal text-ink">Creer votre compte</h1>
      <form onSubmit={onSubmit} className="mt-7 space-y-3" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <AccountChoice
            label="Entreprise"
            selected={values.accountType === 'company'}
            onClick={() => onUpdate('accountType', 'company')}
          />
          <AccountChoice
            label="Personnel"
            selected={values.accountType !== 'company'}
            onClick={() => onUpdate('accountType', 'individual')}
          />
        </div>

        {errors.form && <ErrorBox message={errors.form} />}

        <MobileInput
          placeholder="Nom d'utilisateur"
          value={values.firstName}
          error={errors.firstName || errors.lastName}
          onChange={(value) => onUpdate('firstName', value)}
        />
        <MobileInput
          placeholder="Email"
          type="email"
          value={values.email}
          error={errors.email}
          onChange={(value) => onUpdate('email', value)}
        />
        <MobileInput
          placeholder="Password"
          type="password"
          value={values.password}
          error={errors.password || errors.confirmPassword}
          hasIcon
          onChange={(value) => {
            onUpdate('password', value);
            onUpdate('confirmPassword', value);
          }}
        />
        <MobileSelect
          placeholder="Country"
          value={values.country}
          error={errors.country}
          onChange={(value) => onUpdate('country', value)}
          options={[{ value: '', label: 'Country' }, ...africanCountries.map((country) => ({ value: country.iso2, label: country.name }))]}
        />

        <MobileCheck checked={values.acceptedTerms} onChange={(checked) => onUpdate('acceptedTerms', checked)}>
          J'accepte les <a href="/terms" className="font-bold text-slate-600 underline">conditions d'utilisation</a> et la{' '}
          <a href="/privacy" className="font-bold text-deepblue underline">politique de confidentialite</a>
          {errors.acceptedTerms && <span className="mt-1 block text-sm font-medium text-red-600">{errors.acceptedTerms}</span>}
        </MobileCheck>
        <MobileCheck checked={newsletter} onChange={onNewsletter}>
          Recevoir les nouveautes Kendronics. <a href="/privacy" className="font-bold text-slate-600 underline">Voir la politique newsletter</a>
        </MobileCheck>

        <button type="submit" disabled={status === 'submitting'} className="h-11 w-full rounded-xl bg-deepblue text-base font-black text-white ring-1 ring-white/60 disabled:opacity-60">
          {status === 'submitting' ? 'Creation...' : 'Creer le compte'}
        </button>
        <a href="/login" className="flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-[#f1f5f9] text-base font-bold text-slate-600 ring-1 ring-white/70">
          Deja un compte? Se connecter
        </a>
      </form>

      <Divider label="ou continuer avec" />
      <div className="grid grid-cols-2 gap-3">
        <SocialButton provider="google" label="Google" />
        <SocialButton provider="apple" label="Apple" />
      </div>
      <AuthFooter />
    </section>
  );
}

function AccountChoice({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex h-11 items-center gap-3 rounded-xl border border-slate-200 bg-[#f1f5f9] px-3 text-base font-bold text-ink ring-1 ring-white/70">
      <span className={`h-5 w-5 rounded-full border-2 ${selected ? 'border-deepblue bg-deepblue' : 'border-slate-300 bg-[#edf3f8]'}`} />
      <span>{label}</span>
    </button>
  );
}

function MobileInput({
  placeholder,
  value,
  onChange,
  error,
  type = 'text',
  hasIcon = false,
}: {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  hasIcon?: boolean;
}) {
  return (
    <label className="block">
      <span className="relative block">
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          onChange={(event) => onChange(event.target.value)}
          className={`h-11 w-full rounded-xl border bg-[#edf3f8] px-4 pr-12 text-base font-bold text-ink outline-none ring-1 ring-white/70 placeholder:text-slate-400 focus:border-deepblue ${
            error ? 'border-red-300' : 'border-[#d9d9d9]'
          }`}
        />
        {hasIcon && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl text-slate-400">/</span>}
      </span>
      {error && <span className="mt-2 block text-sm font-medium text-red-600">{error}</span>}
    </label>
  );
}

function MobileSelect({
  placeholder,
  value,
  onChange,
  options,
  error,
}: {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="relative block">
        <select
          value={value}
          aria-label={placeholder}
          aria-invalid={Boolean(error)}
          onChange={(event) => onChange(event.target.value)}
          className={`h-11 w-full appearance-none rounded-xl border bg-[#edf3f8] px-4 pr-12 text-base font-bold outline-none ring-1 ring-white/70 focus:border-deepblue ${
            value ? 'text-ink' : 'text-slate-400'
          } ${error ? 'border-red-300' : 'border-[#d9d9d9]'}`}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="absolute right-5 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border-b-2 border-r-2 border-slate-600" />
      </span>
      {error && <span className="mt-2 block text-sm font-medium text-red-600">{error}</span>}
    </label>
  );
}

function MobileCheck({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label className="flex items-start gap-3 text-sm leading-5 text-slate-600">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 rounded border-2 border-slate-300 bg-[#edf3f8]"
      />
      <span>{children}</span>
    </label>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="my-5 flex items-center justify-center gap-3 text-sm font-bold text-slate-400">
      <span className="h-px w-12 bg-slate-300/70" />
      <span>{label}</span>
      <span className="h-px w-12 bg-slate-300/70" />
    </div>
  );
}

function SocialButton({ provider, label }: { provider: 'google' | 'apple'; label: string }) {
  return (
    <button type="button" className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-[#f1f5f9] text-base font-bold text-slate-600 ring-1 ring-white/70">
      {provider === 'google' ? <GoogleLogo /> : <AppleLogo />}
      <span>{label}</span>
    </button>
  );
}

function GoogleLogo() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 shrink-0">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v2.9h3.8c2.2-2.1 3.6-5.1 3.6-8.6z" />
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-3l-3.8-2.9a7.1 7.1 0 0 1-10.6-3.7H1.6v3A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.5 14.4a7.2 7.2 0 0 1 0-4.6v-3H1.6a12 12 0 0 0 0 10.6l3.9-3z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.4.6 4.6 1.8L20 3.2A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.6 6.7l3.9 3A7.1 7.1 0 0 1 12 4.8z" />
    </svg>
  );
}

function AppleLogo() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7 shrink-0 fill-black">
      <path d="M16.5 1.5c0 1.2-.5 2.3-1.3 3.2-.9 1-2.1 1.6-3.2 1.5-.1-1.2.4-2.4 1.2-3.3.9-.9 2.2-1.5 3.3-1.4zM20.5 17.4c-.4.9-.7 1.3-1.2 2.1-.8 1.2-1.9 2.8-3.3 2.8-1.2 0-1.5-.8-3.2-.8s-2.1.8-3.2.8c-1.4 0-2.5-1.5-3.3-2.7-2.3-3.5-2.5-7.6-1.1-9.8 1-1.5 2.5-2.4 4-2.4s2.5.8 3.7.8 2-.8 3.8-.8c1.3 0 2.7.7 3.7 2a4 4 0 0 0-2.2 3.6 4.2 4.2 0 0 0 2.3 4.4z" />
    </svg>
  );
}

function AuthFooter() {
  return (
    <footer className="mt-7 text-center text-xs leading-6 text-slate-500">
      <div className="flex items-center justify-center gap-3">
        <a href="/terms">Terms &amp; Conditions</a>
        <span className="h-4 w-px bg-slate-300/70" />
        <a href="/privacy">Privacy Policy</a>
      </div>
      <p className="mt-2">&copy; 2026 Kendronics. Tous droits reserves.</p>
    </footer>
  );
}

function MobileAuthTabs({ active }: { active: 'login' | 'register' }) {
  const tabClass = (tab: 'login' | 'register') =>
    `flex h-9 items-center justify-center rounded-full text-[11px] font-black transition ${
      active === tab ? 'bg-deepblue text-white' : 'text-slate-600'
    }`;

  return (
    <div className="mb-4 rounded-full border border-slate-200 bg-white p-1 sm:hidden">
      <div className="grid grid-cols-2 gap-1">
        <a href="/login" className={tabClass('login')}>
          Sign in
        </a>
        <a href="/register" className={tabClass('register')}>
          Create Account
        </a>
      </div>
    </div>
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
      <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 sm:mb-2 sm:text-xs sm:tracking-[0.16em]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`h-10 w-full rounded-xl border bg-white px-3 text-sm font-bold text-ink outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100 sm:h-12 ${
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
      <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 sm:mb-2 sm:text-xs sm:tracking-[0.16em]">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`h-10 w-full rounded-xl border bg-white px-3 text-sm font-bold text-ink outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100 sm:h-12 ${
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
  return <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700 sm:p-4 sm:text-sm">{message}</div>;
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

