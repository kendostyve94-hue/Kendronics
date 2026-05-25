'use client';

import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { usePathname } from 'next/navigation';
import { africanCountries } from '../../lib/african-countries';
import { getApiBaseUrl } from '../../lib/api-base-url';
import { authApiContract } from '../../lib/auth-contract';
import type { AuthTokens, LoginResponse } from '../../lib/auth-contract';
import { persistAuthSession, readFreshAuthSession } from '../../lib/auth-session';
import { validateForgotPasswordForm, validateLoginForm } from '../../lib/login-validation';
import type { ForgotPasswordErrors, ForgotPasswordFormState, LoginErrors, LoginFormState } from '../../lib/login-validation';
import { validateRegisterForm } from '../../lib/register-validation';
import type { RegisterErrors, RegisterFormState } from '../../lib/register-validation';

const apiBaseUrl = getApiBaseUrl();
const googleOAuthUrl = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_URL;
const appleOAuthUrl = process.env.NEXT_PUBLIC_APPLE_OAUTH_URL;
const neutralForgotPasswordMessage =
  'Si ce compte peut recevoir un e-mail de reinitialisation, les instructions seront envoyees sous peu.';

const publicPathPrefixes = [
  '/login',
  '/register',
  '/reset-password',
  '/terms',
  '/privacy',
  '/cookie-policy',
  '/admin',
  '/api',
];

const initialLoginValues: LoginFormState = {
  email: '',
  password: '',
};

type LoginMetaState = {
  acceptedRequiredFields: boolean;
};

type LoginMetaErrors = Partial<Record<keyof LoginMetaState, string>>;

type PendingVerification = {
  tokens: AuthTokens;
  remember: boolean;
  contact: string;
  source: 'register' | 'login';
};

const initialForgotValues: ForgotPasswordFormState = {
  email: '',
};

const initialRegisterValues: RegisterFormState = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  country: '',
  accountType: 'individual',
  acceptedTerms: false,
};

const initialLoginMetaValues: LoginMetaState = {
  acceptedRequiredFields: false,
};

export function AuthRequiredModal() {
  const pathname = usePathname() || '/';
  const [authStatus, setAuthStatus] = useState<'checking' | 'signed_in' | 'signed_out'>('checking');
  const [authStep, setAuthStep] = useState<'choice' | 'form'>('choice');
  const [activePanel, setActivePanel] = useState<'register' | 'login'>('register');
  const [loginValues, setLoginValues] = useState<LoginFormState>(initialLoginValues);
  const [loginMetaValues, setLoginMetaValues] = useState<LoginMetaState>(initialLoginMetaValues);
  const [forgotValues, setForgotValues] = useState<ForgotPasswordFormState>(initialForgotValues);
  const [registerValues, setRegisterValues] = useState<RegisterFormState>(initialRegisterValues);
  const [loginErrors, setLoginErrors] = useState<LoginErrors>({});
  const [loginMetaErrors, setLoginMetaErrors] = useState<LoginMetaErrors>({});
  const [forgotErrors, setForgotErrors] = useState<ForgotPasswordErrors>({});
  const [registerErrors, setRegisterErrors] = useState<RegisterErrors>({});
  const [loginMode, setLoginMode] = useState<'login' | 'forgot'>('login');
  const [loginStatus, setLoginStatus] = useState<'idle' | 'submitting'>('idle');
  const [forgotStatus, setForgotStatus] = useState<'idle' | 'submitting' | 'sent'>('idle');
  const [registerStatus, setRegisterStatus] = useState<'idle' | 'submitting'>('idle');
  const [rememberMe, setRememberMe] = useState(true);
  const [pendingVerification, setPendingVerification] = useState<PendingVerification | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'sending' | 'checking'>('idle');
  const [verificationMessage, setVerificationMessage] = useState('');

  const isPublicPath = useMemo(
    () => publicPathPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)),
    [pathname],
  );
  const shouldShow = !isPublicPath && (authStatus === 'signed_out' || pendingVerification !== null);

  useEffect(() => {
    let cancelled = false;

    async function refreshSession() {
      if (isPublicPath) {
        setAuthStatus('signed_in');
        return;
      }

      setAuthStatus('checking');
      const session = await readFreshAuthSession();
      if (!cancelled) {
        setAuthStatus(session ? 'signed_in' : 'signed_out');
      }
    }

    void refreshSession();
    window.addEventListener('kendronics:auth-updated', refreshSession);
    window.addEventListener('storage', refreshSession);

    return () => {
      cancelled = true;
      window.removeEventListener('kendronics:auth-updated', refreshSession);
      window.removeEventListener('storage', refreshSession);
    };
  }, [isPublicPath]);

  useEffect(() => {
    if (!shouldShow) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [shouldShow]);

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loginValues.email.trim() && !isEmail(loginValues.email)) {
      setLoginErrors({ email: 'Utilisez une adresse e-mail valide.' });
      setLoginMetaErrors(validateLoginMeta(loginMetaValues));
      return;
    }

    const nextErrors = validateLoginForm(loginValues);
    const nextMetaErrors = validateLoginMeta(loginMetaValues);
    setLoginErrors(nextErrors);
    setLoginMetaErrors(nextMetaErrors);

    if (Object.keys(nextErrors).length > 0 || Object.keys(nextMetaErrors).length > 0) return;

    setLoginStatus('submitting');

    try {
      const response = await fetch(`${apiBaseUrl}${authApiContract.login.path}`, {
        method: authApiContract.login.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginValues.email.trim().toLowerCase(),
          password: loginValues.password,
        }),
      });

      if (!response.ok) throw new Error('Login failed.');

      const tokens = (await response.json()) as LoginResponse;
      await startAccountVerification({
        tokens,
        remember: rememberMe,
        contact: loginValues.email.trim().toLowerCase(),
        source: 'login',
      });
    } catch {
      setLoginErrors({ form: authApiContract.login.failureMessage });
      setLoginStatus('idle');
    }
  }

  async function submitRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (registerValues.email.trim() && !isEmail(registerValues.email)) {
      setRegisterErrors({ email: 'Utilisez une adresse e-mail valide.' });
      return;
    }

    const nextErrors = validateRegisterForm(registerValues);
    setRegisterErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setRegisterStatus('submitting');

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: registerValues.email.trim().toLowerCase(),
          password: registerValues.password,
          fullName: registerValues.username.trim(),
          profile: {
            username: registerValues.username.trim(),
            country: registerValues.country,
            accountType: registerValues.accountType,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(registerErrorMessage(response.status, error));
      }

      const tokens = (await response.json()) as AuthTokens;
      await startAccountVerification({
        tokens,
        remember: true,
        contact: registerValues.email.trim().toLowerCase(),
        source: 'register',
      });
    } catch (error) {
      setRegisterErrors({ form: error instanceof Error ? error.message : 'Impossible de creer votre compte pour le moment. Reessayez.' });
      setRegisterStatus('idle');
    }
  }

  async function submitForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateForgotPasswordForm(forgotValues);
    setForgotErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setForgotStatus('submitting');

    try {
      const response = await fetch(`${apiBaseUrl}${authApiContract.forgotPassword.path}`, {
        method: authApiContract.forgotPassword.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotValues.email.trim().toLowerCase() }),
      });

      if (!response.ok) throw new Error('Forgot password request failed.');

      const result = (await response.json()) as { message?: string };
      setForgotErrors({ form: result.message || neutralForgotPasswordMessage });
      setForgotStatus('sent');
    } catch {
      setForgotErrors({ form: 'Impossible de traiter la demande pour le moment. Reessayez.' });
      setForgotStatus('idle');
    }
  }

  async function startAccountVerification(input: PendingVerification) {
    setVerificationStatus('sending');
    setVerificationMessage('');
    setPendingVerification(input);
    setAuthStep('form');
    persistAuthSession(input.tokens, { remember: input.remember });

    try {
      await requestVerificationCode(input.tokens);
      setVerificationCode('');
      setVerificationMessage('Code envoye. Verifiez vos notifications ou votre e-mail. Il reste valide pendant 10 minutes.');
    } catch (error) {
      setVerificationMessage(error instanceof Error ? error.message : "Impossible d'envoyer le code de verification.");
    } finally {
      setLoginStatus('idle');
      setRegisterStatus('idle');
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

      completeAuth(pendingVerification.tokens, { remember: pendingVerification.remember });
      setPendingVerification(null);
      setVerificationCode('');
      setVerificationMessage('');
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

  function completeAuth(tokens: AuthTokens, options: { remember: boolean }) {
    persistAuthSession(tokens, options);
    setAuthStatus('signed_in');
    setLoginStatus('idle');
    setRegisterStatus('idle');
  }

  function updateLogin<K extends keyof LoginFormState>(key: K, value: LoginFormState[K]) {
    setLoginValues((current) => ({ ...current, [key]: value }));
    setLoginErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
  }

  function updateLoginMeta<K extends keyof LoginMetaState>(key: K, value: LoginMetaState[K]) {
    setLoginMetaValues((current) => ({ ...current, [key]: value }));
    setLoginMetaErrors((current) => ({ ...current, [key]: undefined }));
  }

  function updateRegister<K extends keyof RegisterFormState>(key: K, value: RegisterFormState[K]) {
    setRegisterValues((current) => ({ ...current, [key]: value }));
    setRegisterErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
  }

  function updateForgot<K extends keyof ForgotPasswordFormState>(key: K, value: ForgotPasswordFormState[K]) {
    setForgotValues((current) => ({ ...current, [key]: value }));
    setForgotErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
  }

  function showForgotPassword() {
    setLoginMode('forgot');
    setForgotStatus('idle');
    setForgotErrors({});
    setForgotValues({ email: loginValues.email });
  }

  function showLogin() {
    setLoginMode('login');
    setForgotStatus('idle');
    setForgotErrors({});
  }

  function chooseRegister() {
    setActivePanel('register');
    setPendingVerification(null);
    setAuthStep('form');
  }

  function chooseLogin() {
    setActivePanel('login');
    setLoginMode('login');
    setPendingVerification(null);
    setAuthStep('form');
  }

  function backToChoice() {
    setAuthStep('choice');
    setLoginMode('login');
    setPendingVerification(null);
    setForgotStatus('idle');
    setForgotErrors({});
  }

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] grid min-h-screen place-items-center bg-[#06101f]/70 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="auth-required-title">
      {authStep === 'choice' ? (
        <ChoicePanel onRegister={chooseRegister} onLogin={chooseLogin} />
      ) : (
        <div className="max-h-[calc(100vh-3rem)] w-full max-w-3xl overflow-y-auto border border-slate-200 bg-white text-ink">
          <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
            <button type="button" onClick={backToChoice} className="mb-3 text-xs font-semibold text-[#0f8f6b] underline">
              Retour au choix
            </button>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0f8f6b]">Compte requis</p>
          <h1 id="auth-required-title" className="mt-2 text-2xl font-bold tracking-normal text-ink sm:text-[28px]">
            Rejoindre ou se connecter
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Creez votre compte ou connectez-vous ici pour acceder aux fonctionnalites Kendronics.
          </p>
        </div>

        {pendingVerification ? (
          <VerificationPanel
            pending={pendingVerification}
            code={verificationCode}
            status={verificationStatus}
            message={verificationMessage}
            onCodeChange={setVerificationCode}
            onSubmit={submitVerification}
            onResend={() => void resendVerificationCode()}
          />
        ) : (
        <div className="grid gap-0 lg:grid-cols-2">
          <div className={activePanel === 'register' ? 'block' : 'hidden lg:block'}>
            <RegisterPanel
              values={registerValues}
              errors={registerErrors}
              status={registerStatus}
              onSubmit={submitRegister}
              onUpdate={updateRegister}
              onSwitch={() => setActivePanel('login')}
            />
          </div>

          <div className={`border-slate-200 lg:border-l ${activePanel === 'login' ? 'block' : 'hidden lg:block'}`}>
            <LoginPanel
              values={loginValues}
              metaValues={loginMetaValues}
              forgotValues={forgotValues}
              errors={loginErrors}
              metaErrors={loginMetaErrors}
              forgotErrors={forgotErrors}
              mode={loginMode}
              status={loginStatus}
              forgotStatus={forgotStatus}
              rememberMe={rememberMe}
              onRememberMe={setRememberMe}
              onSubmit={submitLogin}
              onForgotSubmit={submitForgotPassword}
              onUpdate={updateLogin}
              onMetaUpdate={updateLoginMeta}
              onForgotUpdate={updateForgot}
              onForgotPassword={showForgotPassword}
              onBackToLogin={showLogin}
              onSwitch={() => setActivePanel('register')}
            />
          </div>
        </div>
        )}

        <div className="border-t border-slate-200 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3 text-xs font-medium text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            <span>ou continuer avec</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <SocialProviderLink provider="google" label="Continuer avec Google" href={googleOAuthUrl} />
            <SocialProviderLink provider="apple" label="Continuer avec Apple" href={appleOAuthUrl} />
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

function ChoicePanel({ onRegister, onLogin }: { onRegister: () => void; onLogin: () => void }) {
  return (
    <div className="grid max-h-[calc(100vh-3rem)] w-full max-w-4xl overflow-y-auto border border-slate-200 bg-white text-ink sm:grid-cols-[0.9fr_1.1fr]">
      <div className="relative hidden min-h-[460px] overflow-hidden bg-[#10233a] sm:block">
        <video className="absolute inset-0 h-full w-full object-cover opacity-80" autoPlay muted loop playsInline preload="metadata" aria-label="Video Kendronics">
          <source src="/videos/auth-required-background.mov" type="video/quicktime" />
        </video>
        <div className="absolute inset-0 bg-[#071526]/62" />
        <div className="relative flex h-full flex-col justify-between p-8 text-white">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">Kendronics</p>
            <h2 className="mt-5 max-w-xs text-3xl font-bold leading-tight tracking-normal" id="auth-required-title">
              Creez votre compte pour acceder a la plateforme.
            </h2>
          </div>
          <div className="grid gap-3 text-sm font-medium leading-6">
            <FeatureLine text="Devis PCB et suivi de commande" />
            <FeatureLine text="Paiement, livraison et historique securises" />
            <FeatureLine text="Support lie a votre compte client" />
          </div>
        </div>
      </div>

      <div className="flex min-h-[460px] flex-col justify-center px-5 py-7 sm:px-9">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0f8f6b]">Compte requis</p>
        <h1 className="mt-3 text-2xl font-bold tracking-normal text-ink sm:text-[28px]">Bienvenue sur Kendronics</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Pour utiliser les fonctionnalites du site, creez d'abord votre compte ou connectez-vous si vous en avez deja un.
        </p>

        <div className="mt-6 grid gap-3">
          <button type="button" onClick={onRegister} className="flex h-11 items-center justify-center border border-[#0f8f6b] bg-[#0f8f6b] px-5 text-sm font-semibold text-white transition hover:bg-[#0b7558]">
            Creer un nouveau compte
          </button>
          <button type="button" onClick={onLogin} className="flex h-11 items-center justify-center border border-slate-300 bg-white px-5 text-sm font-semibold text-ink transition hover:border-[#0f8f6b] hover:text-[#0f8f6b]">
            Se connecter
          </button>
        </div>

        <div className="my-6 flex items-center gap-3 text-xs font-medium text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          <span>ou continuer avec</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <div className="grid gap-3">
          <SocialProviderLink provider="google" label="Continuer avec Google" href={googleOAuthUrl} />
          <SocialProviderLink provider="apple" label="Continuer avec Apple" href={appleOAuthUrl} />
        </div>

        <p className="mt-6 text-xs leading-5 text-slate-500">
          En creant un compte, vous acceptez nos <a href="/terms" className="font-semibold text-[#0f8f6b] underline">conditions d'utilisation</a> et notre{' '}
          <a href="/privacy" className="font-semibold text-[#0f8f6b] underline">politique de confidentialite</a>.
        </p>
      </div>
    </div>
  );
}

function FeatureLine({ text }: { text: string }) {
  return (
    <p className="flex items-start gap-3">
      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-white/70 text-[9px] font-semibold">OK</span>
      <span>{text}</span>
    </p>
  );
}

function RegisterPanel({
  values,
  errors,
  status,
  onSubmit,
  onUpdate,
  onSwitch,
}: {
  values: RegisterFormState;
  errors: RegisterErrors;
  status: 'idle' | 'submitting';
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUpdate: <K extends keyof RegisterFormState>(key: K, value: RegisterFormState[K]) => void;
  onSwitch: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-2.5 px-5 py-4 sm:px-6" noValidate>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-ink">Creer un compte</h2>
        <button type="button" onClick={onSwitch} className="text-xs font-semibold text-[#0f8f6b] lg:hidden">
          Se connecter
        </button>
      </div>

      {errors.form && <AlertBox message={errors.form} tone="error" />}

      <TextInput label="Nom d'utilisateur" value={values.username} error={errors.username} onChange={(value) => onUpdate('username', value)} />
      <TextInput label="E-mail" type="email" value={values.email} error={errors.email} autoComplete="email" onChange={(value) => onUpdate('email', value)} />
      <PasswordInput label="Mot de passe" value={values.password} error={errors.password} autoComplete="new-password" onChange={(value) => onUpdate('password', value)} />
      <PasswordInput label="Confirmer le mot de passe" value={values.confirmPassword} error={errors.confirmPassword} autoComplete="new-password" onChange={(value) => onUpdate('confirmPassword', value)} />

      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold text-slate-600">Pays</span>
        <select
          value={values.country}
          onChange={(event) => onUpdate('country', event.target.value)}
          className={`h-9 w-full border bg-white px-3 text-sm text-ink outline-none focus:border-[#0f8f6b] ${errors.country ? 'border-red-300' : 'border-slate-300'}`}
        >
          <option value="">Selectionner un pays</option>
          {africanCountries.map((country) => (
            <option key={country.iso2} value={country.iso2}>
              {country.name}
            </option>
          ))}
        </select>
        {errors.country && <span className="mt-1 block text-xs font-medium text-red-600">{errors.country}</span>}
      </label>

      <div>
        <span className="mb-1 block text-[11px] font-semibold text-slate-600">Type de compte</span>
        <div className="grid grid-cols-2 gap-2">
          {[
            ['individual', 'Personnel'],
            ['student', 'Etudiant'],
            ['startup', 'Startup'],
            ['company', 'Entreprise'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => onUpdate('accountType', value as RegisterFormState['accountType'])}
              className={`h-8 border px-3 text-xs font-semibold transition ${
                values.accountType === value ? 'border-[#0f8f6b] bg-[#ecfdf5] text-[#0b7558]' : 'border-slate-300 bg-white text-slate-600 hover:border-[#0f8f6b]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <label className="flex gap-3 text-xs leading-5 text-slate-600">
        <input
          type="checkbox"
          checked={values.acceptedTerms}
          onChange={(event) => onUpdate('acceptedTerms', event.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0"
        />
        <span>
          J'accepte les <a href="/terms" className="font-semibold text-[#0f8f6b] underline">conditions</a> et la{' '}
          <a href="/privacy" className="font-semibold text-[#0f8f6b] underline">politique de confidentialite</a>.
          {errors.acceptedTerms && <span className="mt-1 block font-medium text-red-600">{errors.acceptedTerms}</span>}
        </span>
      </label>

      <button type="submit" disabled={status === 'submitting'} className="h-9 w-full bg-[#0f8f6b] px-4 text-sm font-semibold text-white transition hover:bg-[#0b7558] disabled:opacity-60">
        {status === 'submitting' ? 'Envoi du code...' : 'Creer mon compte'}
      </button>
    </form>
  );
}

function LoginPanel({
  values,
  metaValues,
  forgotValues,
  errors,
  metaErrors,
  forgotErrors,
  mode,
  status,
  forgotStatus,
  rememberMe,
  onRememberMe,
  onSubmit,
  onForgotSubmit,
  onUpdate,
  onMetaUpdate,
  onForgotUpdate,
  onForgotPassword,
  onBackToLogin,
  onSwitch,
}: {
  values: LoginFormState;
  metaValues: LoginMetaState;
  forgotValues: ForgotPasswordFormState;
  errors: LoginErrors;
  metaErrors: LoginMetaErrors;
  forgotErrors: ForgotPasswordErrors;
  mode: 'login' | 'forgot';
  status: 'idle' | 'submitting';
  forgotStatus: 'idle' | 'submitting' | 'sent';
  rememberMe: boolean;
  onRememberMe: (value: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onForgotSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUpdate: <K extends keyof LoginFormState>(key: K, value: LoginFormState[K]) => void;
  onMetaUpdate: <K extends keyof LoginMetaState>(key: K, value: LoginMetaState[K]) => void;
  onForgotUpdate: <K extends keyof ForgotPasswordFormState>(key: K, value: ForgotPasswordFormState[K]) => void;
  onForgotPassword: () => void;
  onBackToLogin: () => void;
  onSwitch: () => void;
}) {
  if (mode === 'forgot') {
    return (
      <form onSubmit={onForgotSubmit} className="space-y-3 px-5 py-5 sm:px-8" noValidate>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-ink">Mot de passe oublie</h2>
          <button type="button" onClick={onBackToLogin} className="text-xs font-semibold text-[#0f8f6b]">
            Retour
          </button>
        </div>

        <p className="text-xs leading-5 text-slate-600">
          Entrez votre e-mail. Si un compte existe, vous recevrez les instructions.
        </p>

        {forgotErrors.form && <AlertBox message={forgotErrors.form} tone={forgotStatus === 'sent' ? 'success' : 'error'} />}

        <TextInput label="E-mail" type="email" value={forgotValues.email} error={forgotErrors.email} autoComplete="email" onChange={(value) => onForgotUpdate('email', value)} />

        <button type="submit" disabled={forgotStatus === 'submitting'} className="h-10 w-full bg-[#0f8f6b] px-4 text-sm font-semibold text-white transition hover:bg-[#0b7558] disabled:opacity-60">
          {forgotStatus === 'submitting' ? 'Envoi...' : 'Envoyer les instructions'}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2.5 px-5 py-4 sm:px-6" noValidate>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-ink">Se connecter</h2>
        <button type="button" onClick={onSwitch} className="text-xs font-semibold text-[#0f8f6b] lg:hidden">
          Creer un compte
        </button>
      </div>

      {errors.form && <AlertBox message={errors.form} tone="error" />}

      <TextInput label="E-mail" type="email" value={values.email} error={errors.email} autoComplete="email" onChange={(value) => onUpdate('email', value)} />
      <PasswordInput label="Mot de passe" value={values.password} error={errors.password} autoComplete="current-password" onChange={(value) => onUpdate('password', value)} />

      <div className="flex items-center justify-between gap-3 text-xs text-slate-600">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={rememberMe} onChange={(event) => onRememberMe(event.target.checked)} className="h-4 w-4" />
          <span>Se souvenir de moi</span>
        </label>
        <button type="button" onClick={onForgotPassword} className="font-semibold text-[#0f8f6b] underline">
          Mot de passe oublie?
        </button>
      </div>

      <label className="flex gap-3 text-xs leading-5 text-slate-600">
        <input
          type="checkbox"
          checked={metaValues.acceptedRequiredFields}
          onChange={(event) => onMetaUpdate('acceptedRequiredFields', event.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0"
        />
        <span>
          Je confirme que les informations obligatoires de mon compte sont a jour.
          {metaErrors.acceptedRequiredFields && <span className="mt-1 block font-medium text-red-600">{metaErrors.acceptedRequiredFields}</span>}
        </span>
      </label>

      <button type="submit" disabled={status === 'submitting'} className="h-9 w-full bg-[#0f8f6b] px-4 text-sm font-semibold text-white transition hover:bg-[#0b7558] disabled:opacity-60">
        {status === 'submitting' ? 'Envoi du code...' : 'Se connecter'}
      </button>

      <p className="hidden text-xs leading-5 text-slate-500 lg:block">
        Nouveau sur Kendronics? Utilisez le formulaire de creation a gauche.
      </p>
    </form>
  );
}

function VerificationPanel({
  pending,
  code,
  status,
  message,
  onCodeChange,
  onSubmit,
  onResend,
}: {
  pending: PendingVerification;
  code: string;
  status: 'idle' | 'sending' | 'checking';
  message: string;
  onCodeChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onResend: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-3 px-5 py-6 sm:px-6" noValidate>
      <div>
        <h2 className="text-lg font-bold text-ink">Verifier votre compte</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Entrez le code a 6 chiffres envoye a <span className="font-semibold text-ink">{pending.contact}</span>.
        </p>
      </div>

      {message && <AlertBox message={message} tone={isSuccessVerificationMessage(message) ? 'success' : 'error'} />}

      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold text-slate-600">Code de verification</span>
        <input
          value={code}
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="123456"
          onChange={(event) => onCodeChange(event.target.value.replace(/\D/g, '').slice(0, 6))}
          className="h-10 w-full border border-slate-300 bg-white px-3 text-center text-lg font-semibold tracking-[0.35em] text-ink outline-none focus:border-[#0f8f6b]"
        />
      </label>

      <button type="submit" disabled={status === 'checking' || code.length !== 6} className="h-9 w-full bg-[#0f8f6b] px-4 text-sm font-semibold text-white transition hover:bg-[#0b7558] disabled:opacity-60">
        {status === 'checking' ? 'Verification...' : 'Valider le code'}
      </button>
      <button type="button" onClick={onResend} disabled={status === 'sending'} className="h-9 w-full border border-slate-300 bg-white px-4 text-sm font-semibold text-ink transition hover:border-[#0f8f6b] hover:text-[#0f8f6b] disabled:opacity-60">
        {status === 'sending' ? 'Envoi...' : 'Renvoyer le code'}
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
      <span className="mb-1 block text-[11px] font-semibold text-slate-600">{label}</span>
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(event.target.value)}
        className={`h-9 w-full border bg-white px-3 text-sm text-ink outline-none focus:border-[#0f8f6b] ${error ? 'border-red-300' : 'border-slate-300'}`}
      />
      {error && <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>}
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
        className="absolute right-3 top-8 text-xs font-semibold text-[#0f8f6b]"
      >
        {isPasswordVisible ? 'Cacher' : 'Voir'}
      </button>
    </span>
  );
}

function AlertBox({ message, tone }: { message: string; tone: 'error' | 'success' }) {
  const classes = tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700';

  return <div className={`border p-3 text-xs font-medium leading-5 ${classes}`}>{message}</div>;
}

function isSuccessVerificationMessage(message: string): boolean {
  const normalized = message.toLowerCase();
  return normalized.includes('envoye') || normalized.includes('envoyé');
}

function SocialProviderLink({ provider, label, href }: { provider: 'google' | 'apple'; label: string; href?: string }) {
  const content = (
    <>
      {provider === 'google' ? <GoogleLogo /> : <AppleLogo />}
      <span>{label}</span>
    </>
  );

  if (href) {
    return (
      <a href={href} className="flex h-10 items-center justify-center gap-3 border border-slate-300 bg-white px-4 text-sm font-semibold text-ink transition hover:border-[#0f8f6b] hover:text-[#0f8f6b]">
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      disabled
      className="flex h-10 cursor-not-allowed items-center justify-center gap-3 border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-400"
    >
      {content}
    </button>
  );
}

function GoogleLogo() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v2.9h3.8c2.2-2.1 3.6-5.1 3.6-8.6z" />
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-3l-3.8-2.9a7.1 7.1 0 0 1-10.6-3.7H1.6v3A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.5 14.4a7.2 7.2 0 0 1 0-4.6v-3H1.6a12 12 0 0 0 0 10.6l3.9-3z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.4.6 4.6 1.8L20 3.2A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.6 6.7l3.9 3A7.1 7.1 0 0 1 12 4.8z" />
    </svg>
  );
}

function AppleLogo() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-current">
      <path d="M16.5 1.5c0 1.2-.5 2.3-1.3 3.2-.9 1-2.1 1.6-3.2 1.5-.1-1.2.4-2.4 1.2-3.3.9-.9 2.2-1.5 3.3-1.4zM20.5 17.4c-.4.9-.7 1.3-1.2 2.1-.8 1.2-1.9 2.8-3.3 2.8-1.2 0-1.5-.8-3.2-.8s-2.1.8-3.2.8c-1.4 0-2.5-1.5-3.3-2.7-2.3-3.5-2.5-7.6-1.1-9.8 1-1.5 2.5-2.4 4-2.4s2.5.8 3.7.8 2-.8 3.8-.8c1.3 0 2.7.7 3.7 2a4 4 0 0 0-2.2 3.6 4.2 4.2 0 0 0 2.3 4.4z" />
    </svg>
  );
}

function registerErrorMessage(status: number, error: unknown) {
  const message = apiErrorMessage(error);
  if (status === 409) return 'Un compte existe deja avec cette adresse e-mail. Connectez-vous ou utilisez une autre adresse.';
  if (status === 400 && message) return message;
  return 'Impossible de creer votre compte pour le moment. Reessayez.';
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

function validateLoginMeta(values: LoginMetaState): LoginMetaErrors {
  const errors: LoginMetaErrors = {};

  if (!values.acceptedRequiredFields) {
    errors.acceptedRequiredFields = 'Confirmez que les informations obligatoires de votre compte sont a jour.';
  }

  return errors;
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function apiErrorMessage(error: unknown) {
  if (!error || typeof error !== 'object') return '';
  const message = (error as { message?: unknown }).message;
  if (Array.isArray(message)) return message.join(' ');
  return typeof message === 'string' ? message : '';
}
