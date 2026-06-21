export type ExplorerProjectComment = {
  id: string;
  authorName: string;
  body: string;
  createdAt: Date;
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
  description?: string;
  tags: string[];
  imageUrl?: string;
  mediaKind?: string;
  mediaMimeType?: string;
  attachmentName?: string;
  attachmentType?: string;
  repositoryUrl?: string;
  projectType: 'free' | 'paid';
  priceCents?: number;
  currency: string;
  licenseCode: string;
  allowedUses: string[];
  featured: boolean;
  viewsCount: number;
  likesCount: number;
  favoritesCount: number;
  commentsCount: number;
  forksCount: number;
  createdAt: Date;
  comments: ExplorerProjectComment[];
};
