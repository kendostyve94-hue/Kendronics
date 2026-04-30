'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { getApiBaseUrl } from '../../lib/api-base-url';
import { authApiContract } from '../../lib/auth-contract';
import type { ForgotPasswordResponse, LoginResponse } from '../../lib/auth-contract';
import { persistAuthSession } from '../../lib/auth-session';
import {
  validateForgotPasswordForm,
  validateLoginForm,
} from '../../lib/login-validation';
import type {
  ForgotPasswordErrors,
  ForgotPasswordFormState,
  LoginErrors,
  LoginFormState,
} from '../../lib/login-validation';

const initialLoginValues: LoginFormState = {
  email: '',
  password: '',
};

const neutralForgotPasswordMessage =
  'If an account can receive password reset email, we will send instructions shortly.';
const apiBaseUrl = getApiBaseUrl();

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'forgot_password'>('login');
  const [loginValues, setLoginValues] = useState<LoginFormState>(initialLoginValues);
  const [forgotValues, setForgotValues] = useState<ForgotPasswordFormState>({ email: '' });
  const [loginErrors, setLoginErrors] = useState<LoginErrors>({});
  const [forgotErrors, setForgotErrors] = useState<ForgotPasswordErrors>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'authenticated' | 'reset_sent'>('idle');
  const [rememberMe, setRememberMe] = useState(false);

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateLoginForm(loginValues);
    setLoginErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setStatus('submitting');

    try {
      const response = await fetch(`${apiBaseUrl}${authApiContract.login.path}`, {
        method: authApiContract.login.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginValues.email.trim().toLowerCase(),
          password: loginValues.password,
        }),
      });

      if (!response.ok) {
        throw new Error('Login failed.');
      }

      const tokens = (await response.json()) as LoginResponse;
      persistAuthSession(tokens);
      setStatus('authenticated');
    } catch {
      setLoginErrors({ form: authApiContract.login.failureMessage });
      setStatus('idle');
    }
  }

  async function submitForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateForgotPasswordForm(forgotValues);
    setForgotErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setStatus('submitting');

    try {
      const response = await fetch(`${apiBaseUrl}${authApiContract.forgotPassword.path}`, {
        method: authApiContract.forgotPassword.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotValues.email.trim().toLowerCase() }),
      });

      if (!response.ok) {
        throw new Error('Forgot password request failed.');
      }

      const result = (await response.json()) as ForgotPasswordResponse;
      setForgotErrors({ form: result.message || neutralForgotPasswordMessage });
      setStatus('reset_sent');
    } catch {
      setForgotErrors({ form: 'Impossible de traiter la demande pour le moment. Reessayez.' });
      setStatus('idle');
    }
  }

  function updateLogin<K extends keyof LoginFormState>(key: K, value: LoginFormState[K]) {
    setLoginValues((current) => ({ ...current, [key]: value }));
    setLoginErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
  }

  function updateForgotPassword<K extends keyof ForgotPasswordFormState>(
    key: K,
    value: ForgotPasswordFormState[K],
  ) {
    setForgotValues((current) => ({ ...current, [key]: value }));
    setForgotErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
  }

  function showForgotPassword() {
    setMode('forgot_password');
    setStatus('idle');
    setForgotValues({ email: loginValues.email });
    setForgotErrors({});
  }

  function showLogin() {
    setMode('login');
    setStatus('idle');
    setLoginErrors({});
  }

  return (
    <main className="min-h-screen bg-cloud sm:bg-cloud">
      <div className="hidden sm:block">
        <Navbar />
      </div>
      <MobileLoginScreen
        mode={mode}
        values={loginValues}
        forgotValues={forgotValues}
        errors={loginErrors}
        forgotErrors={forgotErrors}
        status={status}
        rememberMe={rememberMe}
        onRememberMe={setRememberMe}
        onSubmit={submitLogin}
        onForgotSubmit={submitForgotPassword}
        onForgotPassword={showForgotPassword}
        onBack={showLogin}
        onUpdate={updateLogin}
        onForgotUpdate={updateForgotPassword}
      />
      <section className="relative hidden overflow-hidden bg-ink pb-28 pt-32 text-white sm:block">
        <img
          src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=2200&q=85"
          alt="Macro view of a printed circuit board"
          className="absolute inset-0 h-full w-full object-cover opacity-[0.36]"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink/[0.82] to-deepblue/[0.62]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-100">Kendronics workspace</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
            Connectez-vous pour gerer vos devis, commandes et livraisons.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
            Continue from quote to checkout with secure token sessions, shipment updates, and support in one account.
          </p>
        </div>
      </section>

      <section className="relative z-10 mx-auto hidden max-w-7xl gap-6 px-4 pb-10 pt-20 sm:-mt-16 sm:grid sm:px-6 sm:pb-16 sm:pt-0 lg:grid-cols-[1fr_27rem] lg:px-8">
        <div className="hidden space-y-6 sm:block">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ['Secure session', 'Refresh-token based access after login.'],
              ['Order continuity', 'Return to saved quote, payment, and tracking flows.'],
              ['Private recovery', 'Password reset never reveals whether an email exists.'],
            ].map(([title, body]) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-4 h-10 w-10 rounded-xl bg-sky-50 ring-1 ring-sky-100" />
                <h2 className="text-base font-black text-ink">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
              </div>
            ))}
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-deepblue p-6 text-white sm:p-8">
            <img
              src="https://images.pexels.com/photos/7285976/pexels-photo-7285976.jpeg?auto=compress&cs=tinysrgb&w=1400"
              alt="Hands inspecting a printed circuit board"
              className="absolute inset-0 h-full w-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-deepblue via-deepblue/[0.9] to-deepblue/[0.72]" />
            <div className="relative">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-100">Account access</p>
              <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
                Pick up exactly where your PCB workflow left off.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-sky-100">
                La connexion debloque les demandes de prix authentifiees, l historique protege et la session utilisee par les espaces Kendronics.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-[#f1f5f9] p-3 text-ink sm:bg-white sm:p-7 lg:sticky lg:top-28 lg:self-start">
          <MobileAuthTabs active="login" />
          {status === 'authenticated' ? (
            <AuthenticatedState />
          ) : mode === 'forgot_password' ? (
            <ForgotPasswordForm
              values={forgotValues}
              errors={forgotErrors}
              status={status}
              onSubmit={submitForgotPassword}
              onBack={showLogin}
              onUpdate={updateForgotPassword}
            />
          ) : (
            <LoginForm
              values={loginValues}
              errors={loginErrors}
              status={status}
              onSubmit={submitLogin}
              onForgotPassword={showForgotPassword}
              onUpdate={updateLogin}
            />
          )}
        </div>
      </section>
    </main>
  );
}

function MobileLoginScreen({
  mode,
  values,
  forgotValues,
  errors,
  forgotErrors,
  status,
  rememberMe,
  onRememberMe,
  onSubmit,
  onForgotSubmit,
  onForgotPassword,
  onBack,
  onUpdate,
  onForgotUpdate,
}: {
  mode: 'login' | 'forgot_password';
  values: LoginFormState;
  forgotValues: ForgotPasswordFormState;
  errors: LoginErrors;
  forgotErrors: ForgotPasswordErrors;
  status: 'idle' | 'submitting' | 'authenticated' | 'reset_sent';
  rememberMe: boolean;
  onRememberMe: (value: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onForgotSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onForgotPassword: () => void;
  onBack: () => void;
  onUpdate: <K extends keyof LoginFormState>(key: K, value: LoginFormState[K]) => void;
  onForgotUpdate: <K extends keyof ForgotPasswordFormState>(key: K, value: ForgotPasswordFormState[K]) => void;
}) {
  if (status === 'authenticated') {
    return (
      <section className="auth-neumo mx-auto max-w-md px-4 pb-5 pt-6 sm:hidden">
        <AuthenticatedState />
      </section>
    );
  }

  if (mode === 'forgot_password') {
    return (
      <section className="auth-neumo mx-auto max-w-md px-4 pb-5 pt-6 sm:hidden">
        <h1 className="text-[30px] font-black leading-none tracking-normal text-ink">Mot de passe oublie</h1>
        <form onSubmit={onForgotSubmit} className="mt-7 space-y-3" noValidate>
          {forgotErrors.form && <AlertBox tone={status === 'reset_sent' ? 'success' : 'error'} message={forgotErrors.form} />}
          <MobileInput
            placeholder="Username or Email"
            type="email"
            value={forgotValues.email}
            error={forgotErrors.email}
            onChange={(value) => onForgotUpdate('email', value)}
          />
          <button type="submit" disabled={status === 'submitting'} className="h-11 w-full rounded-xl bg-deepblue text-base font-black text-white ring-1 ring-white/60 disabled:opacity-60">
            {status === 'submitting' ? 'Envoi...' : 'Recevoir les instructions'}
          </button>
          <button type="button" onClick={onBack} className="h-11 w-full rounded-xl border border-slate-200 bg-[#f1f5f9] text-base font-bold text-slate-600 ring-1 ring-white/70">
            Retour a la connexion
          </button>
        </form>
        <AuthFooter />
      </section>
    );
  }

  return (
    <section className="auth-neumo mx-auto max-w-md px-4 pb-5 pt-6 sm:hidden">
      <h1 className="text-[30px] font-black leading-none tracking-normal text-ink">Connexion Kendronics</h1>
      <form onSubmit={onSubmit} className="mt-7 space-y-3" noValidate>
        {errors.form && <AlertBox tone="error" message={errors.form} />}
        <MobileInput
          placeholder="Username or Email"
          type="email"
          value={values.email}
          error={errors.email}
          onChange={(value) => onUpdate('email', value)}
        />
        <MobileInput
          placeholder="Password"
          type="password"
          value={values.password}
          error={errors.password}
          hasIcon
          onChange={(value) => onUpdate('password', value)}
        />
        <div className="flex items-center justify-between gap-3 text-sm leading-none">
          <label className="flex items-center gap-3 text-[#8a8a8a]">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => onRememberMe(event.target.checked)}
              className="h-5 w-5 rounded border-2 border-slate-300 bg-[#f1f5f9]"
            />
            <span>Se souvenir de moi</span>
          </label>
          <button type="button" onClick={onForgotPassword} className="font-bold text-deepblue">
            Mot de passe oublie?
          </button>
        </div>
        <button type="submit" disabled={status === 'submitting'} className="h-11 w-full rounded-xl bg-deepblue text-base font-black text-white ring-1 ring-white/60 disabled:opacity-60">
          {status === 'submitting' ? 'Connexion...' : 'Se connecter'}
        </button>
        <a href="/register" className="flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-[#f1f5f9] text-base font-bold text-slate-600 ring-1 ring-white/70">
          Nouveau compte? S'inscrire
        </a>
      </form>
      <Divider label="OR" />
      <div className="space-y-3">
        <SocialButton provider="google" label="Continuer avec Google" />
        <SocialButton provider="apple" label="Continuer avec Apple" />
      </div>
      <AuthFooter />
    </section>
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
    <button type="button" className="flex h-11 w-full items-center justify-center gap-4 rounded-xl border border-slate-200 bg-[#f1f5f9] text-base font-bold text-slate-600 ring-1 ring-white/70">
      <span className={provider === 'google' ? 'text-2xl font-black text-[#4285f4]' : 'text-2xl font-black text-black'}>
        {provider === 'google' ? 'G' : 'A'}
      </span>
      <span>{label}</span>
    </button>
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

function LoginForm({
  values,
  errors,
  status,
  onSubmit,
  onForgotPassword,
  onUpdate,
}: {
  values: LoginFormState;
  errors: LoginErrors;
  status: 'idle' | 'submitting' | 'authenticated' | 'reset_sent';
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onForgotPassword: () => void;
  onUpdate: <K extends keyof LoginFormState>(key: K, value: LoginFormState[K]) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-3 sm:space-y-5" noValidate>
      <div>
        <h2 className="text-xl font-black tracking-tight text-ink sm:text-2xl">Log in</h2>
        <p className="hidden mt-1 text-xs leading-5 text-slate-600 sm:mt-2 sm:block sm:text-sm sm:leading-6">
          Use the email and password connected to your Kendronics account.
        </p>
      </div>

      {errors.form && <AlertBox tone="error" message={errors.form} />}

      <TextInput
        label="Email"
        type="email"
        value={values.email}
        error={errors.email}
        autoComplete="email"
        onChange={(value) => onUpdate('email', value)}
      />
      <PasswordInput
        label="Password"
        value={values.password}
        error={errors.password}
        autoComplete="current-password"
        onChange={(value) => onUpdate('password', value)}
      />

      <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-left font-black text-deepblue transition hover:text-signal-dark"
        >
          Forgot password?
        </button>
        <a href="/register" className="hidden font-black text-deepblue transition hover:text-signal-dark sm:inline">
          Creer un compte
        </a>
      </div>

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="h-10 w-full rounded-xl bg-deepblue text-xs font-black text-white transition hover:bg-deepblue-dark disabled:cursor-not-allowed disabled:opacity-60 sm:h-12 sm:text-sm"
      >
        {status === 'submitting' ? 'Signing in...' : 'Log in'}
      </button>
    </form>
  );
}

function ForgotPasswordForm({
  values,
  errors,
  status,
  onSubmit,
  onBack,
  onUpdate,
}: {
  values: ForgotPasswordFormState;
  errors: ForgotPasswordErrors;
  status: 'idle' | 'submitting' | 'authenticated' | 'reset_sent';
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onBack: () => void;
  onUpdate: <K extends keyof ForgotPasswordFormState>(key: K, value: ForgotPasswordFormState[K]) => void;
}) {
  const messageTone = status === 'reset_sent' ? 'success' : 'error';

  return (
    <form onSubmit={onSubmit} className="space-y-3 sm:space-y-5" noValidate>
      <div>
        <h2 className="text-xl font-black tracking-tight text-ink sm:text-2xl">Reset password</h2>
        <p className="hidden mt-1 text-xs leading-5 text-slate-600 sm:mt-2 sm:block sm:text-sm sm:leading-6">
          Enter your email and we will handle the request without revealing whether an account exists.
        </p>
      </div>

      {errors.form && <AlertBox tone={messageTone} message={errors.form} />}

      <TextInput
        label="Email"
        type="email"
        value={values.email}
        error={errors.email}
        autoComplete="email"
        onChange={(value) => onUpdate('email', value)}
      />

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="h-10 w-full rounded-xl bg-deepblue text-xs font-black text-white transition hover:bg-deepblue-dark disabled:cursor-not-allowed disabled:opacity-60 sm:h-12 sm:text-sm"
      >
        {status === 'submitting' ? 'Sending request...' : 'Send reset instructions'}
      </button>

      <button
        type="button"
        onClick={onBack}
        className="h-10 w-full rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-700 transition hover:border-sky-200 hover:text-deepblue sm:h-12 sm:text-sm"
      >
        Back to login
      </button>
    </form>
  );
}

function TextInput({
  label,
  value,
  onChange,
  error,
  type = 'text',
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 sm:mb-2 sm:text-xs sm:tracking-[0.16em]">{label}</span>
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(event.target.value)}
        className={`h-10 w-full rounded-xl border bg-white px-3 text-sm font-bold text-ink outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100 sm:h-12 ${
          error ? 'border-red-300' : 'border-slate-200'
        }`}
      />
      {error && <span className="mt-1 block text-[11px] font-bold text-red-600 sm:text-xs">{error}</span>}
    </label>
  );
}

function PasswordInput(props: Omit<Parameters<typeof TextInput>[0], 'type'>) {
  return <TextInput {...props} type="password" />;
}

function AlertBox({ message, tone }: { message: string; tone: 'error' | 'success' }) {
  const classes =
    tone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : 'border-red-200 bg-red-50 text-red-700';

  return <div className={`rounded-2xl border p-3 text-xs font-bold sm:p-4 sm:text-sm ${classes}`}>{message}</div>;
}

function AuthenticatedState() {
  return (
    <div className="py-8 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-sm font-black text-emerald-700">
        OK
      </div>
      <h2 className="mt-5 text-2xl font-black tracking-tight text-ink">You are signed in</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
        Your access token and refresh token session are stored for authenticated Kendronics requests.
      </p>
      <a
        href="/quote"
        className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-deepblue px-6 text-sm font-black text-white transition hover:bg-deepblue-dark"
      >
        Continue to quote
      </a>
    </div>
  );
}

