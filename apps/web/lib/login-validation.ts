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

  if (!values.email.trim()) errors.email = 'Email is required.';
  if (values.email && !emailPattern.test(values.email)) errors.email = 'Enter a valid email address.';
  if (!values.password) errors.password = 'Password is required.';

  return errors;
}

export function validateForgotPasswordForm(values: ForgotPasswordFormState): ForgotPasswordErrors {
  const errors: ForgotPasswordErrors = {};

  if (!values.email.trim()) errors.email = 'Email is required.';
  if (values.email && !emailPattern.test(values.email)) errors.email = 'Enter a valid email address.';

  return errors;
}
