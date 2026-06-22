export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
};

export type UserProfile = {
  id: string;
  email: string;
  fullName: string;
  companyName?: string | null;
  avatarDataUrl?: string | null;
  country?: string | null;
  verificationLevel?: number;
  verificationStatus?: string;
};

export type ExplorerProject = {
  id: string;
  userId?: string;
  authorName: string;
  authorAvatarUrl?: string;
  authorBadgeLabel?: string;
  authorVerificationLevel?: number;
  title: string;
  category: string;
  summary: string;
  tags: string[];
  imageUrl?: string;
  thumbnailUrl?: string;
  mediaKind?: string;
  mediaMimeType?: string;
  projectType?: 'free' | 'paid';
  featured: boolean;
  viewsCount: number;
  likesCount: number;
  favoritesCount: number;
  commentsCount: number;
  forksCount: number;
  createdAt: string;
};
