import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { UserRole } from '../../common/types/user-role.enum';
import { UploadRepository } from '../uploads/repositories/upload.repository';
import { CreateExplorerCommentDto } from './dto/create-explorer-comment.dto';
import {
  AttachExplorerProjectAssetDto,
  CreateExplorerProjectDraftDto,
  UpdateExplorerProjectDto,
} from './dto/create-explorer-project.dto';
import { ExplorerProject } from './entities/explorer-project.entity';

@Injectable()
export class ExplorerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadRepository: UploadRepository,
  ) {}

  async listProjects(): Promise<ExplorerProject[]> {
    const projects = await this.prisma.explorerProject.findMany({
      where: { status: 'published' },
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      take: 80,
      include: {
        _count: { select: { favorites: true } },
        comments: { where: { status: 'visible' }, orderBy: { createdAt: 'desc' }, take: 3 },
      },
    });

    return projects.map(toExplorerProject);
  }

  async createProjectDraft(user: AuthenticatedUser, dto: CreateExplorerProjectDraftDto) {
    const author = await this.prisma.user.findUnique({ where: { id: user.id } });
    return this.prisma.explorerProject.create({
      data: {
        userId: user.id,
        authorName: author?.fullName || emailName(user.email) || 'Client Kendronics',
        authorAvatarUrl: author?.avatarDataUrl,
        title: 'Projet sans titre',
        category: 'Prototype',
        summary: 'Brouillon en cours de preparation.',
        projectType: dto.projectType,
        priceCents: dto.projectType === 'paid' ? 1000 : null,
        licenseCode: dto.projectType === 'paid' ? 'PROPRIETARY' : 'CC-BY-SA-4.0',
        allowedUses: dto.projectType === 'paid' ? ['manufacture'] : ['download', 'modify', 'manufacture', 'republish'],
        status: 'draft',
      },
      include: { assets: true },
    });
  }

  async getProjectEditor(user: AuthenticatedUser, projectId: string) {
    return this.ownedProject(user.id, projectId);
  }

  async getProjectMarketplaceState(userId: string, projectId: string) {
    const project = await this.prisma.explorerProject.findFirst({
      where: { id: projectId, status: 'published' },
      include: {
        assets: { select: { id: true, visibility: true } },
      },
    });
    if (!project) throw new NotFoundException('Explorer project not found.');

    const [licenseGrant, pendingPurchase] = await Promise.all([
      this.prisma.projectLicenseGrant.findUnique({
        where: { projectId_userId: { projectId, userId } },
      }),
      this.prisma.projectPurchase.findFirst({
        where: { projectId, buyerId: userId, status: 'pending' },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const isOwner = project.userId === userId;
    const activeLicense = licenseGrant?.status === 'active' && (!licenseGrant.expiresAt || licenseGrant.expiresAt > new Date());
    const isCommercial = project.projectType === 'paid';
    const hasProtectedAssets = project.assets.some((asset) => asset.visibility === 'protected');

    return {
      projectId: project.id,
      projectType: project.projectType,
      sellerId: project.userId,
      priceCents: project.priceCents,
      currency: project.currency,
      licenseCode: project.licenseCode,
      allowedUses: project.allowedUses,
      protectedAssetsCount: project.assets.filter((asset) => asset.visibility === 'protected').length,
      isOwner,
      hasProtectedAssets,
      hasActiveLicense: isOwner || activeLicense,
      pendingPurchaseId: pendingPurchase?.id,
      canStartPurchase: isCommercial && hasProtectedAssets && !isOwner && !activeLicense,
      nextStep: !isCommercial
        ? 'open-project'
        : isOwner || activeLicense
          ? 'access-granted'
          : pendingPurchase
            ? 'complete-pending-payment'
            : hasProtectedAssets
              ? 'create-checkout'
              : 'missing-protected-assets',
    };
  }

  async updateProject(user: AuthenticatedUser, projectId: string, dto: UpdateExplorerProjectDto) {
    await this.ownedProject(user.id, projectId);
    return this.prisma.explorerProject.update({
      where: { id: projectId },
      data: {
        title: dto.title === undefined ? undefined : clean(dto.title),
        category: dto.category === undefined ? undefined : clean(dto.category),
        summary: dto.summary === undefined ? undefined : clean(dto.summary),
        description: dto.description === undefined ? undefined : dto.description.trim(),
        tags: dto.tags === undefined ? undefined : dto.tags.map(clean).filter(Boolean).slice(0, 12),
        imageUrl: dto.imageUrl === undefined ? undefined : clean(dto.imageUrl),
        repositoryUrl: dto.repositoryUrl === undefined ? undefined : clean(dto.repositoryUrl),
        projectType: dto.projectType,
        priceCents: dto.projectType === 'free' ? null : dto.priceCents,
        currency: dto.currency,
        licenseCode: dto.licenseCode,
        allowedUses: dto.allowedUses,
        visibility: dto.visibility,
        technicalDetails: dto.technicalDetails as Prisma.InputJsonValue | undefined,
        documentation: dto.documentation as Prisma.InputJsonValue | undefined,
      },
      include: { assets: true },
    });
  }

  async attachAsset(user: AuthenticatedUser, projectId: string, dto: AttachExplorerProjectAssetDto) {
    await this.ownedProject(user.id, projectId);
    const upload = await this.prisma.gerberUpload.findFirst({
      where: { id: dto.uploadId, userId: user.id, status: { in: ['uploaded', 'analyzed'] } },
    });
    if (!upload) throw new BadRequestException('Uploaded file was not found or is not ready.');
    return this.prisma.explorerProjectAsset.upsert({
      where: { projectId_uploadId: { projectId, uploadId: upload.id } },
      create: {
        projectId,
        userId: user.id,
        uploadId: upload.id,
        kind: dto.kind,
        visibility: dto.visibility,
        originalName: clean(dto.originalName),
        mimeType: dto.mimeType,
        sizeBytes: dto.sizeBytes,
      },
      update: {
        kind: dto.kind,
        visibility: dto.visibility,
        originalName: clean(dto.originalName),
        mimeType: dto.mimeType,
        sizeBytes: dto.sizeBytes,
      },
    });
  }

  async removeAsset(user: AuthenticatedUser, projectId: string, assetId: string) {
    await this.ownedProject(user.id, projectId);
    const asset = await this.prisma.explorerProjectAsset.findFirst({
      where: { id: assetId, projectId, userId: user.id },
    });
    if (!asset) throw new NotFoundException('Project file not found.');
    await this.prisma.explorerProjectAsset.delete({ where: { id: asset.id } });
    return { removed: true };
  }

  async publishProject(user: AuthenticatedUser, projectId: string): Promise<ExplorerProject> {
    const project = await this.ownedProject(user.id, projectId);
    const errors: string[] = [];
    if (project.title.length < 4 || project.title === 'Projet sans titre') errors.push('Ajoutez un titre explicite.');
    if (project.summary.length < 24 || project.summary === 'Brouillon en cours de preparation.') errors.push('Ajoutez un resume public.');
    if (!project.description || project.description.trim().length < 80) errors.push('La documentation principale doit contenir au moins 80 caracteres.');
    if (!project.technicalDetails) errors.push('Completez les caracteristiques techniques.');
    const technicalDetails = objectRecord(project.technicalDetails);
    if (!stringValue(technicalDetails.dimensions)) errors.push('Ajoutez les dimensions.');
    if (!stringValue(technicalDetails.mainComponents)) errors.push('Ajoutez les composants principaux.');
    if (!stringValue(technicalDetails.power)) errors.push("Ajoutez l'alimentation.");
    if (!stringValue(technicalDetails.interfaces)) errors.push('Ajoutez les interfaces.');
    if (!stringValue(technicalDetails.software)) errors.push('Ajoutez les logiciels et outils.');
    if (!stringValue(technicalDetails.maturity)) errors.push('Ajoutez le niveau de maturite.');
    if (!project.documentation) errors.push('Completez les instructions et la documentation.');
    if (project.assets.length === 0) errors.push('Ajoutez au moins un fichier ou media au projet.');
    if (!project.imageUrl && !project.assets.some((asset) => asset.kind === 'cover')) errors.push('Ajoutez une image de couverture.');
    if (project.projectType === 'paid' && (!project.priceCents || project.priceCents < 100)) errors.push('Definissez un prix valide.');
    if (project.projectType === 'paid' && !project.assets.some((asset) => asset.visibility === 'protected')) {
      errors.push('Un projet payant doit contenir au moins un fichier protege.');
    }
    if (errors.length) throw new BadRequestException(errors);

    const updated = await this.prisma.explorerProject.update({
      where: { id: projectId },
      data: { status: 'published', publishedAt: new Date() },
      include: {
        _count: { select: { favorites: true } },
        comments: true,
      },
    });
    return toExplorerProject(updated);
  }

  async listUserProjects(userId: string): Promise<ExplorerProject[]> {
    const projects = await this.prisma.explorerProject.findMany({
      where: { userId, status: 'published' },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { favorites: true } },
        comments: { where: { status: 'visible' }, orderBy: { createdAt: 'desc' }, take: 3 },
      },
    });
    return projects.map(toExplorerProject);
  }

  async listUserDrafts(userId: string) {
    return this.prisma.explorerProject.findMany({
      where: { userId, status: 'draft' },
      orderBy: { updatedAt: 'desc' },
      include: { assets: true },
    });
  }

  async listUserFavorites(userId: string): Promise<ExplorerProject[]> {
    const favorites = await this.prisma.explorerProjectFavorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        project: {
          include: {
            _count: { select: { favorites: true } },
            comments: { where: { status: 'visible' }, orderBy: { createdAt: 'desc' }, take: 3 },
          },
        },
      },
    });
    return favorites.filter((favorite) => favorite.project.status === 'published').map((favorite) => toExplorerProject(favorite.project));
  }

  async listFollowingProjects(userId: string): Promise<ExplorerProject[]> {
    const projects = await this.prisma.explorerProject.findMany({
      where: {
        status: 'published',
        user: {
          followers: {
            some: { followerId: userId },
          },
        },
      },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: 80,
      include: {
        _count: { select: { favorites: true } },
        comments: { where: { status: 'visible' }, orderBy: { createdAt: 'desc' }, take: 3 },
      },
    });
    return projects.map(toExplorerProject);
  }

  async listProjectPurchases(userId: string) {
    return this.prisma.projectPurchase.findMany({
      where: { buyerId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            category: true,
            projectType: true,
            status: true,
          },
        },
        licenseGrant: true,
      },
    });
  }

  async listProjectLicenseGrants(userId: string) {
    return this.prisma.projectLicenseGrant.findMany({
      where: { userId },
      orderBy: { grantedAt: 'desc' },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            category: true,
            projectType: true,
            status: true,
          },
        },
        purchase: true,
      },
    });
  }

  async listProjectAssetDownloads(user: AuthenticatedUser, projectId: string) {
    const project = await this.prisma.explorerProject.findUnique({
      where: { id: projectId },
      include: {
        assets: {
          orderBy: { createdAt: 'asc' },
          include: {
            upload: {
              select: {
                storageKey: true,
                status: true,
              },
            },
          },
        },
      },
    });
    if (!project) throw new NotFoundException('Explorer project not found.');

    const isOwner = project.userId === user.id;
    const isAdmin = user.roles.includes(UserRole.Admin);
    if (project.status !== 'published' && !isOwner && !isAdmin) {
      throw new NotFoundException('Explorer project not found.');
    }

    const activeGrant = await this.prisma.projectLicenseGrant.findUnique({
      where: { projectId_userId: { projectId, userId: user.id } },
    });
    const hasActiveLicense = activeGrant?.status === 'active' && (!activeGrant.expiresAt || activeGrant.expiresAt > new Date());
    const canAccessProtected = isOwner || isAdmin || hasActiveLicense || project.projectType === 'free';

    const downloadableAssets = project.assets.filter((asset) => {
      if (!['uploaded', 'analyzed'].includes(asset.upload.status)) return false;
      return asset.visibility !== 'protected' || canAccessProtected;
    });

    if (!downloadableAssets.length && project.assets.length > 0) {
      throw new ForbiddenException('Aucune licence active ne permet de telecharger les fichiers proteges de ce projet.');
    }

    return downloadableAssets.map((asset) => ({
      id: asset.id,
      projectId: project.id,
      kind: asset.kind,
      visibility: asset.visibility,
      originalName: asset.originalName,
      mimeType: asset.mimeType,
      sizeBytes: asset.sizeBytes,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      downloadUrl: this.uploadRepository.createDownloadUrl(asset.upload.storageKey),
    }));
  }

  async createProjectPurchaseIntent(userId: string, projectId: string) {
    const project = await this.prisma.explorerProject.findFirst({
      where: { id: projectId, status: 'published' },
      include: {
        assets: { select: { visibility: true } },
      },
    });
    if (!project) throw new NotFoundException('Explorer project not found.');
    if (project.projectType !== 'paid') throw new BadRequestException('Ce projet ne necessite pas d achat marketplace.');
    if (project.userId === userId) throw new BadRequestException('Vous possedez deja ce projet.');
    if (!project.priceCents || project.priceCents < 100) throw new BadRequestException('Ce projet n a pas encore de prix valide.');
    if (!project.assets.some((asset) => asset.visibility === 'protected')) {
      throw new BadRequestException('Ce projet ne contient pas encore de fichier protege a licencier.');
    }

    const activeGrant = await this.prisma.projectLicenseGrant.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (activeGrant?.status === 'active' && (!activeGrant.expiresAt || activeGrant.expiresAt > new Date())) {
      throw new BadRequestException('Vous disposez deja d une licence active pour ce projet.');
    }

    const pendingPurchase = await this.prisma.projectPurchase.findFirst({
      where: { projectId, buyerId: userId, status: 'pending' },
      orderBy: { createdAt: 'desc' },
    });
    if (pendingPurchase) return pendingPurchase;

    return this.prisma.projectPurchase.create({
      data: {
        projectId,
        buyerId: userId,
        sellerId: project.userId,
        status: 'pending',
        amountCents: project.priceCents,
        currency: project.currency,
        priceSnapshot: {
          projectId: project.id,
          title: project.title,
          projectType: project.projectType,
          amountCents: project.priceCents,
          currency: project.currency,
          licenseCode: project.licenseCode,
          allowedUses: project.allowedUses,
          sellerId: project.userId,
          capturedAt: new Date().toISOString(),
          version: 'project-marketplace-v1',
        },
      },
    });
  }

  async toggleFavorite(projectId: string, userId: string): Promise<{ favorited: boolean; favoritesCount: number }> {
    await this.ensureProject(projectId);
    const existing = await this.prisma.explorerProjectFavorite.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (existing) {
      await this.prisma.explorerProjectFavorite.delete({ where: { id: existing.id } });
    } else {
      await this.prisma.explorerProjectFavorite.create({ data: { projectId, userId } });
    }
    const favoritesCount = await this.prisma.explorerProjectFavorite.count({ where: { projectId } });
    return { favorited: !existing, favoritesCount };
  }

  async likeProject(projectId: string, actorKey: string, user?: AuthenticatedUser): Promise<{ liked: boolean; likesCount: number }> {
    await this.ensureProject(projectId);
    const resolvedActorKey = user ? `user:${user.id}` : clean(actorKey) || 'anonymous';
    const existing = await this.prisma.explorerProjectLike.findUnique({
      where: { projectId_actorKey: { projectId, actorKey: resolvedActorKey } },
    });

    if (existing) {
      const likesCount = await this.prisma.$transaction(async (tx) => {
        await tx.explorerProjectLike.delete({ where: { id: existing.id } });
        const count = await tx.explorerProjectLike.count({ where: { projectId } });
        await tx.explorerProject.update({ where: { id: projectId }, data: { likesCount: count } });
        return count;
      });
      return { liked: false, likesCount };
    }

    const likesCount = await this.prisma.$transaction(async (tx) => {
      await tx.explorerProjectLike.create({
        data: { projectId, userId: user?.id, actorKey: resolvedActorKey },
      });
      const count = await tx.explorerProjectLike.count({ where: { projectId } });
      await tx.explorerProject.update({ where: { id: projectId }, data: { likesCount: count } });
      return count;
    });
    return { liked: true, likesCount };
  }

  async commentProject(projectId: string, dto: CreateExplorerCommentDto, user?: AuthenticatedUser): Promise<ExplorerProject> {
    await this.ensureProject(projectId);
    const author = user ? await this.prisma.user.findUnique({ where: { id: user.id } }) : null;
    const authorName = author?.fullName || clean(dto.authorName) || (user?.email ? emailName(user.email) : '') || 'Visiteur Kendronics';

    const project = await this.prisma.$transaction(async (tx) => {
      await tx.explorerComment.create({
        data: {
          projectId,
          userId: user?.id,
          authorName,
          body: clean(dto.body) || '',
        },
      });
      return tx.explorerProject.update({
        where: { id: projectId },
        data: { commentsCount: { increment: 1 } },
        include: {
          _count: { select: { favorites: true } },
          comments: { where: { status: 'visible' }, orderBy: { createdAt: 'desc' }, take: 3 },
        },
      });
    });

    return toExplorerProject(project);
  }

  private async ensureProject(projectId: string) {
    const project = await this.prisma.explorerProject.findFirst({ where: { id: projectId, status: 'published' } });
    if (!project) throw new NotFoundException('Explorer project not found.');
  }

  private async ownedProject(userId: string, projectId: string) {
    const project = await this.prisma.explorerProject.findUnique({
      where: { id: projectId },
      include: { assets: true },
    });
    if (!project) throw new NotFoundException('Explorer project not found.');
    if (project.userId !== userId) throw new ForbiddenException('You cannot edit this project.');
    return project;
  }

}

type ExplorerProjectRecord = Prisma.ExplorerProjectGetPayload<{
  include: { _count: { select: { favorites: true } }; comments: true };
}>;

function toExplorerProject(project: ExplorerProjectRecord): ExplorerProject {
  return {
    id: project.id,
    userId: project.userId ?? undefined,
    authorName: project.authorName,
    authorAvatarUrl: project.authorAvatarUrl ?? undefined,
    title: project.title,
    category: project.category,
    summary: project.summary,
    description: project.description ?? undefined,
    tags: project.tags,
    imageUrl: project.imageUrl ?? undefined,
    attachmentName: project.attachmentName ?? undefined,
    attachmentType: project.attachmentType ?? undefined,
    repositoryUrl: project.repositoryUrl ?? undefined,
    projectType: project.projectType as 'free' | 'paid',
    priceCents: project.priceCents ?? undefined,
    currency: project.currency,
    licenseCode: project.licenseCode,
    allowedUses: project.allowedUses,
    featured: project.featured,
    viewsCount: project.viewsCount,
    likesCount: project.likesCount,
    favoritesCount: project._count.favorites,
    commentsCount: project.commentsCount,
    forksCount: project.forksCount,
    createdAt: project.createdAt,
    comments: project.comments.map((comment) => ({
      id: comment.id,
      authorName: comment.authorName,
      body: comment.body,
      createdAt: comment.createdAt,
    })),
  };
}

function clean(value?: string): string {
  return value?.trim().replace(/\s+/g, ' ') ?? '';
}

function emailName(email: string) {
  return email.includes('@') ? email.split('@')[0] : email;
}

function objectRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stringValue(recordValue: unknown): string {
  return typeof recordValue === 'string' ? recordValue.trim() : '';
}
