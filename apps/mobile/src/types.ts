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

export type ProjectAsset = {
  id: string;
  kind: string;
  visibility: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  publicUrl?: string;
};

export type ProjectComment = {
  id: string;
  body: string;
  authorName?: string;
  createdAt?: string;
};

export type ProjectDetail = ExplorerProject & {
  description?: string;
  repositoryUrl?: string;
  priceCents?: number;
  currency?: string;
  licenseCode?: string;
  assets?: ProjectAsset[];
  comments?: ProjectComment[];
  technicalDetails?: Record<string, unknown>;
  documentation?: Record<string, unknown>;
};

export type PublicAuthorProfile = {
  id: string;
  fullName: string;
  avatarDataUrl?: string | null;
  bannerDataUrl?: string | null;
  publicBio?: string | null;
  country?: string | null;
  verificationLevel?: number;
  badgeLabel?: string;
  isFollowing?: boolean;
  followersCount?: number;
  followingCount?: number;
  likesCount?: number;
  projects?: ExplorerProject[];
  links?: Array<{ href: string; label: string; kind?: string }>;
};

export type RecentProductionItem = {
  date: string;
  region: string;
  reference: string;
  service: string;
  leadTime: string;
  progress: number;
};

export type Order = {
  id: string;
  orderNumber: string;
  status: string;
  totalPrice?: number;
  currency?: string;
  destinationCountryIso2: string;
  createdAt: string;
  quoteSnapshot?: {
    productType: string;
    layers: number;
    lengthMm: number;
    widthMm: number;
    quantity: number;
    finalTotal: number;
    currency: string;
  };
};

export type TrackingTimeline = {
  orderId?: string;
  orderNumber?: string;
  status?: string;
  events?: Array<{ id?: string; label?: string; status?: string; description?: string; createdAt?: string }>;
};

export type QuotePreview = {
  productType: string;
  layers: number;
  lengthMm: number;
  widthMm: number;
  quantity: number;
  destinationCountryIso2: string;
  shippingMode: string;
  currency: 'EUR';
  finalTotal: number;
  breakdown: Record<string, number>;
};
