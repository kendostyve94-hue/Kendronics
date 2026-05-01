export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export type LoginResponse = AuthTokens;

export interface RefreshSessionRequest {
  refreshToken: string;
}

export type RefreshSessionResponse = AuthTokens;

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  ok: true;
  message: string;
}

export const authApiContract = {
  login: {
    method: 'POST',
    path: '/api/auth/login',
    request: 'LoginRequest',
    response: 'LoginResponse',
    failureMessage: 'E-mail ou mot de passe invalide.',
  },
  refresh: {
    method: 'POST',
    path: '/api/auth/refresh',
    request: 'RefreshSessionRequest',
    response: 'RefreshSessionResponse',
  },
  forgotPassword: {
    method: 'POST',
    path: '/api/auth/forgot-password',
    request: 'ForgotPasswordRequest',
    response: 'ForgotPasswordResponse',
    privacyRule: 'Always return a neutral success response when the request is accepted.',
  },
} as const;
