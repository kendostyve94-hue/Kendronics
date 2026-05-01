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

  if (!values.username.trim()) errors.username = "Le nom d'utilisateur est requis.";
  if (!values.email.trim()) errors.email = "L'e-mail est requis.";
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = 'Entrez une adresse e-mail valide.';
  if (values.password.length < 10) errors.password = 'Le mot de passe doit contenir au moins 10 caracteres.';
  if (values.confirmPassword !== values.password) errors.confirmPassword = 'Les mots de passe ne correspondent pas.';
  if (!values.country) errors.country = 'Selectionnez votre pays.';
  if (!values.acceptedTerms) errors.acceptedTerms = 'Acceptez les conditions et la politique de confidentialite pour continuer.';

  return errors;
}
