export interface LoginFormState {
  email: string;
  password: string;
}

export interface ForgotPasswordFormState {
  email: string;
}

export type LoginErrors = Partial<Record<keyof LoginFormState | 'form', string>>;
export type ForgotPasswordErrors = Partial<Record<keyof ForgotPasswordFormState | 'form', string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLoginForm(values: LoginFormState): LoginErrors {
  const errors: LoginErrors = {};

  if (!values.email.trim()) errors.email = "L'e-mail ou le telephone est requis.";
  if (values.email && values.email.includes('@') && !emailPattern.test(values.email)) errors.email = 'Entrez une adresse e-mail valide.';
  if (!values.password) errors.password = 'Le mot de passe est requis.';

  return errors;
}

export function validateForgotPasswordForm(values: ForgotPasswordFormState): ForgotPasswordErrors {
  const errors: ForgotPasswordErrors = {};

  if (!values.email.trim()) errors.email = "L'e-mail est requis.";
  if (values.email && !emailPattern.test(values.email)) errors.email = 'Entrez une adresse e-mail valide.';

  return errors;
}
