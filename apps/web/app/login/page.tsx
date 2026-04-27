'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navbar } from '../../components/layout/Navbar';
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

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'forgot_password'>('login');
  const [loginValues, setLoginValues] = useState<LoginFormState>(initialLoginValues);
  const [forgotValues, setForgotValues] = useState<ForgotPasswordFormState>({ email: '' });
  const [loginErrors, setLoginErrors] = useState<LoginErrors>({});
  const [forgotErrors, setForgotErrors] = useState<ForgotPasswordErrors>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'authenticated' | 'reset_sent'>('idle');

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateLoginForm(loginValues);
    setLoginErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setStatus('submitting');

    try {
      const response = await fetch(authApiContract.login.path, {
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
      const response = await fetch(authApiContract.forgotPassword.path, {
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
      setForgotErrors({ form: 'We could not process the request right now. Please try again.' });
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
    <main className="min-h-screen bg-cloud">
      <Navbar />
      <section className="relative overflow-hidden bg-ink pb-28 pt-32 text-white">
        <img
          src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=2200&q=85"
          alt="Macro view of a printed circuit board"
          className="absolute inset-0 h-full w-full object-cover opacity-[0.36]"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink/[0.82] to-deepblue/[0.62]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-100">Kendronics workspace</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
            Sign in to manage quotes, orders, and shipments.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
            Continue from quote to checkout with secure token sessions, shipment updates, and support in one account.
          </p>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-16 grid max-w-7xl gap-6 px-4 pb-16 sm:px-6 lg:grid-cols-[1fr_27rem] lg:px-8">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ['Secure session', 'Refresh-token based access after login.'],
              ['Order continuity', 'Return to saved quote, payment, and tracking flows.'],
              ['Private recovery', 'Password reset never reveals whether an email exists.'],
            ].map(([title, body]) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 h-10 w-10 rounded-xl bg-sky-50 ring-1 ring-sky-100" />
                <h2 className="text-base font-black text-ink">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
              </div>
            ))}
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-deepblue p-6 text-white shadow-2xl shadow-sky-950/20 sm:p-8">
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
                Login unlocks authenticated pricing requests, protected order history, and the refresh-token session used by the Kendronics dashboard surfaces.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-ink shadow-sm sm:p-7 lg:sticky lg:top-28 lg:self-start">
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
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div>
        <h2 className="text-2xl font-black tracking-tight text-ink">Log in</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
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

      <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-left font-black text-deepblue transition hover:text-signal-dark"
        >
          Forgot password?
        </button>
        <a href="/register" className="font-black text-deepblue transition hover:text-signal-dark">
          Create account
        </a>
      </div>

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="h-12 w-full rounded-xl bg-deepblue text-sm font-black text-white shadow-lg shadow-sky-950/20 transition hover:bg-deepblue-dark disabled:cursor-not-allowed disabled:opacity-60"
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
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div>
        <h2 className="text-2xl font-black tracking-tight text-ink">Reset password</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
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
        className="h-12 w-full rounded-xl bg-deepblue text-sm font-black text-white shadow-lg shadow-sky-950/20 transition hover:bg-deepblue-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === 'submitting' ? 'Sending request...' : 'Send reset instructions'}
      </button>

      <button
        type="button"
        onClick={onBack}
        className="h-12 w-full rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-700 transition hover:border-sky-200 hover:text-deepblue"
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
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</span>
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
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

function AlertBox({ message, tone }: { message: string; tone: 'error' | 'success' }) {
  const classes =
    tone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : 'border-red-200 bg-red-50 text-red-700';

  return <div className={`rounded-2xl border p-4 text-sm font-bold ${classes}`}>{message}</div>;
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
        className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-deepblue px-6 text-sm font-black text-white shadow-lg shadow-sky-950/20 transition hover:bg-deepblue-dark"
      >
        Continue to quote
      </a>
    </div>
  );
}
