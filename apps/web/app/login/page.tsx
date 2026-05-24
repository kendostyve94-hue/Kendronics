'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { getApiBaseUrl } from '../../lib/api-base-url';
import { authApiContract } from '../../lib/auth-contract';
import type { ForgotPasswordResponse, LoginResponse } from '../../lib/auth-contract';
import type { AuthTokens } from '../../lib/auth-contract';
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

type PendingVerification = {
  tokens: AuthTokens;
  remember: boolean;
  contact: string;
};

const initialLoginValues: LoginFormState = {
  email: '',
  password: '',
};

const neutralForgotPasswordMessage =
  'Si ce compte peut recevoir un e-mail de reinitialisation, les instructions seront envoyees sous peu.';
const apiBaseUrl = getApiBaseUrl();
const googleOAuthUrl = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_URL;
const appleOAuthUrl = process.env.NEXT_PUBLIC_APPLE_OAUTH_URL;
const postAuthRedirectPath = '/';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'forgot_password'>('login');
  const [loginValues, setLoginValues] = useState<LoginFormState>(initialLoginValues);
  const [forgotValues, setForgotValues] = useState<ForgotPasswordFormState>({ email: '' });
  const [loginErrors, setLoginErrors] = useState<LoginErrors>({});
  const [forgotErrors, setForgotErrors] = useState<ForgotPasswordErrors>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'authenticated' | 'reset_sent'>('idle');
  const [rememberMe, setRememberMe] = useState(true);
  const [pendingVerification, setPendingVerification] = useState<PendingVerification | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'sending' | 'checking'>('idle');
  const [verificationMessage, setVerificationMessage] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined' || !window.location.hash) return;

    const params = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    const tokenType = params.get('tokenType');
    const expiresIn = Number(params.get('expiresIn'));

    if (!accessToken || !refreshToken || tokenType !== 'Bearer' || !Number.isFinite(expiresIn)) {
      return;
    }

    const tokens: AuthTokens = {
      accessToken,
      refreshToken,
      tokenType,
      expiresIn,
    };
    persistAuthSession(tokens, { remember: true });
    window.location.replace(postAuthRedirectPath);
  }, []);

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
      await startVerification({
        tokens,
        remember: rememberMe,
        contact: loginValues.email.trim().toLowerCase(),
      });
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

  async function startVerification(input: PendingVerification) {
    setPendingVerification(input);
    setVerificationCode('');
    setVerificationMessage('');
    setVerificationStatus('sending');
    persistAuthSession(input.tokens, { remember: input.remember });

    try {
      await requestVerificationCode(input.tokens);
      setVerificationMessage('Code envoye. Verifiez vos notifications ou votre e-mail.');
    } catch (error) {
      setVerificationMessage(error instanceof Error ? error.message : "Impossible d'envoyer le code de verification.");
    } finally {
      setStatus('idle');
      setVerificationStatus('idle');
    }
  }

  async function submitVerification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pendingVerification) return;
    if (!/^\d{6}$/.test(verificationCode)) {
      setVerificationMessage('Entrez le code a 6 chiffres recu.');
      return;
    }

    setVerificationStatus('checking');
    setVerificationMessage('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/profile-verification/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `${pendingVerification.tokens.tokenType} ${pendingVerification.tokens.accessToken}`,
        },
        body: JSON.stringify({ action: 'account', code: verificationCode }),
      });

      if (!response.ok) throw new Error('Code invalide ou expire.');

      persistAuthSession(pendingVerification.tokens, { remember: pendingVerification.remember });
      window.location.assign(postAuthRedirectPath);
    } catch (error) {
      setVerificationMessage(error instanceof Error ? error.message : 'Verification impossible pour le moment.');
    } finally {
      setVerificationStatus('idle');
    }
  }

  async function resendVerificationCode() {
    if (!pendingVerification) return;
    setVerificationStatus('sending');
    setVerificationMessage('');

    try {
      await requestVerificationCode(pendingVerification.tokens);
      setVerificationCode('');
      setVerificationMessage('Nouveau code envoye.');
    } catch (error) {
      setVerificationMessage(error instanceof Error ? error.message : "Impossible d'envoyer un nouveau code.");
    } finally {
      setVerificationStatus('idle');
    }
  }

  function cancelVerification() {
    setPendingVerification(null);
    setVerificationCode('');
    setVerificationMessage('');
    setVerificationStatus('idle');
    setStatus('idle');
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
      <MobileLoginScreen
        mode={mode}
        values={loginValues}
        forgotValues={forgotValues}
        errors={loginErrors}
        forgotErrors={forgotErrors}
        status={status}
        rememberMe={rememberMe}
        pendingVerification={pendingVerification}
        verificationCode={verificationCode}
        verificationStatus={verificationStatus}
        verificationMessage={verificationMessage}
        googleOAuthUrl={googleOAuthUrl}
        appleOAuthUrl={appleOAuthUrl}
        onRememberMe={setRememberMe}
        onSubmit={submitLogin}
        onVerificationSubmit={submitVerification}
        onVerificationCodeChange={setVerificationCode}
        onVerificationResend={() => void resendVerificationCode()}
        onVerificationCancel={cancelVerification}
        onForgotSubmit={submitForgotPassword}
        onForgotPassword={showForgotPassword}
        onBack={showLogin}
        onUpdate={updateLogin}
        onForgotUpdate={updateForgotPassword}
      />
      <section className="relative hidden overflow-hidden bg-ink pb-28 pt-32 text-white">
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

      <section className="relative z-10 mx-auto hidden max-w-7xl gap-6 px-4 pb-10 pt-20 sm:-mt-16 sm:px-6 sm:pb-16 sm:pt-0 lg:grid-cols-[1fr_27rem] lg:px-8">
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
                La connexion débloque les demandes de prix authentifiées, l’historique protégé et la session utilisée par les espaces Kendronics.
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
  pendingVerification,
  verificationCode,
  verificationStatus,
  verificationMessage,
  googleOAuthUrl,
  appleOAuthUrl,
  onRememberMe,
  onSubmit,
  onVerificationSubmit,
  onVerificationCodeChange,
  onVerificationResend,
  onVerificationCancel,
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
  pendingVerification: PendingVerification | null;
  verificationCode: string;
  verificationStatus: 'idle' | 'sending' | 'checking';
  verificationMessage: string;
  googleOAuthUrl?: string;
  appleOAuthUrl?: string;
  onRememberMe: (value: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onVerificationSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onVerificationCodeChange: (value: string) => void;
  onVerificationResend: () => void;
  onVerificationCancel: () => void;
  onForgotSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onForgotPassword: () => void;
  onBack: () => void;
  onUpdate: <K extends keyof LoginFormState>(key: K, value: LoginFormState[K]) => void;
  onForgotUpdate: <K extends keyof ForgotPasswordFormState>(key: K, value: ForgotPasswordFormState[K]) => void;
}) {
  if (status === 'authenticated') {
    return (
      <section className="auth-neumo mx-auto max-w-md px-4 pb-8 pt-28 sm:px-0 sm:pt-32">
        <AuthenticatedState />
      </section>
    );
  }

  if (pendingVerification) {
    return (
      <section className="auth-neumo mx-auto max-w-md px-4 pb-8 pt-28 sm:px-0 sm:pt-32">
        <VerificationForm
          contact={pendingVerification.contact}
          code={verificationCode}
          status={verificationStatus}
          message={verificationMessage}
          onSubmit={onVerificationSubmit}
          onCodeChange={onVerificationCodeChange}
          onResend={onVerificationResend}
          onCancel={onVerificationCancel}
        />
      </section>
    );
  }

  if (mode === 'forgot_password') {
    return (
      <section className="auth-neumo mx-auto max-w-md px-4 pb-8 pt-28 sm:px-0 sm:pt-32">
        <h1 className="text-[30px] font-black leading-none tracking-normal text-ink">Mot de passe oublie</h1>
        <form onSubmit={onForgotSubmit} className="mt-7 space-y-3" noValidate>
          {forgotErrors.form && <AlertBox tone={status === 'reset_sent' ? 'success' : 'error'} message={forgotErrors.form} />}
          <MobileInput
            placeholder="Nom d'utilisateur ou e-mail"
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
    <section className="auth-neumo mx-auto max-w-md px-4 pb-8 pt-28 sm:px-0 sm:pt-32">
      <h1 className="text-[30px] font-black leading-none tracking-normal text-ink">Connexion Kendronics</h1>
      <form onSubmit={onSubmit} className="mt-7 space-y-3" noValidate>
        {errors.form && <AlertBox tone="error" message={errors.form} />}
        <MobileInput
          placeholder="Nom d'utilisateur ou e-mail"
          type="email"
          value={values.email}
          error={errors.email}
          onChange={(value) => onUpdate('email', value)}
        />
        <MobileInput
          placeholder="Mot de passe"
          type="password"
          value={values.password}
          error={errors.password}
          hasIcon
          onChange={(value) => onUpdate('password', value)}
        />
        <div className="flex items-center justify-between gap-3 text-sm leading-none">
          <label className="flex items-center gap-2 text-slate-600">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => onRememberMe(event.target.checked)}
              className="h-5 w-5 rounded border-2 border-slate-300 bg-[#edf3f8]"
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
      <Divider label="ou continuer avec" />
      <div className="space-y-3">
        <SocialButton provider="google" label="Continuer avec Google" href={googleOAuthUrl} />
        <SocialButton provider="apple" label="Continuer avec Apple" href={appleOAuthUrl} />
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
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const inputType = hasIcon ? (isPasswordVisible ? 'text' : 'password') : type;

  return (
    <label className="block">
      <span className="relative block">
        <input
          type={inputType}
          value={value}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          onChange={(event) => onChange(event.target.value)}
          className={`h-11 w-full rounded-xl border bg-[#edf3f8] px-4 ${hasIcon ? 'pr-20' : 'pr-12'} text-base font-bold text-ink outline-none ring-1 ring-white/70 placeholder:text-slate-400 focus:border-deepblue ${
            error ? 'border-red-300' : 'border-[#d9d9d9]'
          }`}
        />
        {hasIcon && (
          <button
            type="button"
            aria-label={isPasswordVisible ? 'Cacher le mot de passe' : 'Voir le mot de passe'}
            onClick={() => setIsPasswordVisible((current) => !current)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-deepblue"
          >
            {isPasswordVisible ? 'Cacher' : 'Voir'}
          </button>
        )}
      </span>
      {error && <span className="mt-2 block text-sm font-medium text-red-600">{error}</span>}
    </label>
  );
}

function VerificationForm({
  contact,
  code,
  status,
  message,
  onSubmit,
  onCodeChange,
  onResend,
  onCancel,
}: {
  contact: string;
  code: string;
  status: 'idle' | 'sending' | 'checking';
  message: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCodeChange: (value: string) => void;
  onResend: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <h1 className="text-[30px] font-black leading-none tracking-normal text-ink">Verification du compte</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Entrez le code a 6 chiffres envoye a <span className="font-black text-ink">{contact}</span>.
      </p>
      <form onSubmit={onSubmit} className="mt-7 space-y-3" noValidate>
        {message ? <AlertBox tone={isSuccessVerificationMessage(message) ? 'success' : 'error'} message={message} /> : null}
        <label className="block">
          <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">Code de verification</span>
          <input
            value={code}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            onChange={(event) => onCodeChange(event.target.value.replace(/\D/g, '').slice(0, 6))}
            className="h-12 w-full rounded-xl border border-slate-200 bg-[#edf3f8] px-4 text-center text-lg font-black tracking-[0.35em] text-ink outline-none ring-1 ring-white/70 focus:border-deepblue"
          />
        </label>
        <button type="submit" disabled={status === 'checking' || code.length !== 6} className="h-11 w-full rounded-xl bg-deepblue text-base font-black text-white ring-1 ring-white/60 disabled:opacity-60">
          {status === 'checking' ? 'Verification...' : 'Valider le code'}
        </button>
        <button type="button" onClick={onResend} disabled={status === 'sending'} className="h-11 w-full rounded-xl border border-slate-200 bg-[#f1f5f9] text-base font-bold text-slate-600 ring-1 ring-white/70 disabled:opacity-60">
          {status === 'sending' ? 'Envoi...' : 'Renvoyer le code'}
        </button>
        <button type="button" onClick={onCancel} className="h-11 w-full text-sm font-black text-deepblue">
          Retour a la connexion
        </button>
      </form>
      <AuthFooter />
    </>
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

function SocialButton({ provider, label, href }: { provider: 'google' | 'apple'; label: string; href?: string }) {
  const content = (
    <>
      {provider === 'google' ? <GoogleLogo /> : <AppleLogo />}
      <span>{label}</span>
    </>
  );

  if (href) {
    return (
      <a href={href} className="flex h-11 w-full items-center justify-center gap-4 rounded-xl border border-slate-200 bg-[#f1f5f9] text-base font-bold text-slate-600 ring-1 ring-white/70">
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      disabled
      title="Connexion sociale non configurée : ajoutez l’URL fournisseur dans les variables d’environnement."
      className="flex h-11 w-full cursor-not-allowed items-center justify-center gap-4 rounded-xl border border-slate-200 bg-[#f1f5f9] text-base font-bold text-slate-400 opacity-70 ring-1 ring-white/70"
    >
      {content}
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
        <a href="/terms">Conditions generales</a>
        <span className="h-4 w-px bg-slate-300/70" />
        <a href="/privacy">Politique de confidentialité</a>
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
    <div className="mb-4 rounded-full border border-slate-200 bg-white p-1">
      <div className="grid grid-cols-2 gap-1">
        <a href="/login" className={tabClass('login')}>
          Connexion
        </a>
        <a href="/register" className={tabClass('register')}>
          Créer un compte
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
        <h2 className="text-xl font-black tracking-tight text-ink sm:text-2xl">Connexion</h2>
        <p className="hidden mt-1 text-xs leading-5 text-slate-600 sm:mt-2 sm:block sm:text-sm sm:leading-6">
          Utilisez l'e-mail et le mot de passe lies a votre compte Kendronics.
        </p>
      </div>

      {errors.form && <AlertBox tone="error" message={errors.form} />}

      <TextInput
        label="E-mail"
        type="email"
        value={values.email}
        error={errors.email}
        autoComplete="email"
        onChange={(value) => onUpdate('email', value)}
      />
      <PasswordInput
        label="Mot de passe"
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
          Mot de passe oublie?
        </button>
        <a href="/register" className="hidden font-black text-deepblue transition hover:text-signal-dark sm:inline">
          Créer un compte
        </a>
      </div>

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="h-10 w-full rounded-xl bg-deepblue text-xs font-black text-white transition hover:bg-deepblue-dark disabled:cursor-not-allowed disabled:opacity-60 sm:h-12 sm:text-sm"
      >
        {status === 'submitting' ? 'Connexion...' : 'Se connecter'}
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
        <h2 className="text-xl font-black tracking-tight text-ink sm:text-2xl">Reinitialiser le mot de passe</h2>
        <p className="hidden mt-1 text-xs leading-5 text-slate-600 sm:mt-2 sm:block sm:text-sm sm:leading-6">
          Entrez votre e-mail. La demande reste neutre et ne revele pas si un compte existe.
        </p>
      </div>

      {errors.form && <AlertBox tone={messageTone} message={errors.form} />}

      <TextInput
        label="E-mail"
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
        {status === 'submitting' ? 'Envoi...' : 'Envoyer les instructions'}
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
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <span className="relative block">
      <TextInput {...props} type={isPasswordVisible ? 'text' : 'password'} />
      <button
        type="button"
        aria-label={isPasswordVisible ? 'Cacher le mot de passe' : 'Voir le mot de passe'}
        onClick={() => setIsPasswordVisible((current) => !current)}
        className="absolute right-3 top-8 text-[11px] font-black text-deepblue sm:top-9"
      >
        {isPasswordVisible ? 'Cacher' : 'Voir'}
      </button>
    </span>
  );
}

function AlertBox({ message, tone }: { message: string; tone: 'error' | 'success' }) {
  const classes =
    tone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : 'border-red-200 bg-red-50 text-red-700';

  return <div className={`rounded-2xl border p-3 text-xs font-bold sm:p-4 sm:text-sm ${classes}`}>{message}</div>;
}

function isSuccessVerificationMessage(message: string): boolean {
  const normalized = message.toLowerCase();
  return normalized.includes('envoye') || normalized.includes('envoyé');
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
        Continuer vers le devis
      </a>
    </div>
  );
}

async function requestVerificationCode(tokens: AuthTokens) {
  const response = await fetch(`${apiBaseUrl}/api/auth/profile-verification/request`, {
    method: 'POST',
    signal: requestTimeoutSignal(15000),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `${tokens.tokenType} ${tokens.accessToken}`,
    },
    body: JSON.stringify({ action: 'account' }),
  });

  if (!response.ok) {
    throw new Error("Impossible d'envoyer le code de verification.");
  }
}

function requestTimeoutSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  window.setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

