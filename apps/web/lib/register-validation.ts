export type AccountType = 'individual' | 'student' | 'startup' | 'company';

export interface RegisterFormState {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  country: string;
  accountType: AccountType;
  acceptedTerms: boolean;
}

export type RegisterErrors = Partial<Record<keyof RegisterFormState | 'form', string>>;

export function validateRegisterForm(values: RegisterFormState): RegisterErrors {
  const errors: RegisterErrors = {};

  if (!values.username.trim()) errors.username = 'Username is required.';
  if (!values.email.trim()) errors.email = 'Email is required.';
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = 'Enter a valid email address.';
  if (values.password.length < 10) errors.password = 'Password must be at least 10 characters.';
  if (values.confirmPassword !== values.password) errors.confirmPassword = 'Passwords do not match.';
  if (!values.country) errors.country = 'Select your country.';
  if (!values.acceptedTerms) errors.acceptedTerms = 'Accept the terms and privacy policy to continue.';

  return errors;
}
