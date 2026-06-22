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

const defaultProjectSocialState = {
  liked: false,
  favorited: false,
  followingAuthor: false,
  isOwner: false,
};

@Injectable()
export class ExplorerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadRepository: UploadRepository,
  ) {}

  async listProjects(): Promise<ExplorerProject[]> {
    const projects = await this.prisma.explorerProject.findMany({
      where: { status: 'published', visibility: 'public', userId: { not: null } },
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      take: 80,
      include: {
        _count: { select: { favorites: true } },
        comments: { where: { status: 'visible' }, orderBy: { createdAt: 'desc' }, take: 3 },
        assets: {
          where: { kind: { in: ['cover', 'video', 'gallery'] }, visibility: 'public' },
          orderBy: { createdAt: 'asc' },
          take: 1,
          select: { id: true, kind: true, mimeType: true },
        },
        user: { select: { verificationLevel: true } },
      },
    });

    return projects.map(toExplorerProject);
  }

  async getProjectDetail(projectId: string, viewer?: AuthenticatedUser) {
    const project = await this.prisma.explorerProject.findFirst({
      where: {
        id: projectId,
        status: 'published',
        userId: { not: null },
        OR: [{ visibility: 'public' }, ...(viewer ? [{ userId: viewer.id }] : [])],
      },
      include: {
        _count: { select: { favorites: true } },
        comments: { where: { status: 'visible' }, orderBy: { createdAt: 'desc' }, take: 12 },
        assets: {
          where: { visibility: 'public' },
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            kind: true,
            originalName: true,
            mimeType: true,
            sizeBytes: true,
          },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            avatarDataUrl: true,
            profileBannerDataUrl: true,
            publicDescription: true,
            profileDetails: true,
            verificationLevel: true,
            verificationStatus: true,
            _count: {
              select: {
                followers: true,
                following: true,
                explorerProjects: { where: { status: 'published' } },
              },
            },
          },
        },
      },
    });
    if (!project) throw new NotFoundException('Explorer project not found.');

    const publicDescription = project.user?.publicDescription ?? '';
    const explorerProject = toExplorerProject(project);
    const socialState = viewer ? await this.projectSocialState(project.id, project.user?.id, viewer.id) : defaultProjectSocialState;

    return {
      ...explorerProject,
      socialState,
      technicalDetails: project.technicalDetails,
      documentation: project.documentation,
      publicAssets: project.assets,
      author: {
        id: project.user?.id ?? project.userId ?? undefined,
        name: project.user?.fullName || project.authorName,
        avatarDataUrl: project.user?.avatarDataUrl ?? project.authorAvatarUrl ?? undefined,
        bannerDataUrl: project.user?.profileBannerDataUrl ?? undefined,
        description: publicDescription,
        badgeLabel: accountBadgeLabel(project.user?.verificationLevel ?? 0),
        verificationLevel: project.user?.verificationLevel ?? 0,
        verificationStatus: project.user?.verificationStatus ?? 'unverified',
        followersCount: project.user?._count.followers ?? 0,
        followingCount: project.user?._count.following ?? 0,
        projectsCount: project.user?._count.explorerProjects ?? 0,
        links: extractPublicProfileLinks(publicDescription, project.user?.profileDetails),
      },
    };
  }

  async getPublicAuthorProfile(userId: string, viewer?: AuthenticatedUser) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        avatarDataUrl: true,
        profileBannerDataUrl: true,
        publicDescription: true,
        profileDetails: true,
        verificationLevel: true,
        verificationStatus: true,
        _count: {
          select: {
            followers: true,
            following: true,
            explorerProjects: { where: { status: 'published' } },
          },
        },
      },
    });
    if (!user) throw new NotFoundException('Author profile not found.');

    const isOwner = viewer?.id === user.id;
    const projects = await this.listUserProjects(user.id);
    const isFollowing = viewer && !isOwner ? Boolean(await this.prisma.userFollow.findUnique({
      where: { followerId_followingId: { followerId: viewer.id, followingId: user.id } },
    })) : false;
    const likesCount = projects.reduce((total, project) => total + project.likesCount, 0);
    const forksCount = projects.reduce((total, project) => total + project.forksCount, 0);
    const commentsCount = projects.reduce((total, project) => total + project.commentsCount, 0);
    return {
      id: user.id,
      name: user.fullName || 'Createur Kendronics',
      avatarDataUrl: user.avatarDataUrl ?? undefined,
      bannerDataUrl: user.profileBannerDataUrl ?? undefined,
      description: user.publicDescription ?? '',
      badgeLabel: accountBadgeLabel(user.verificationLevel),
      verificationLevel: user.verificationLevel,
      verificationStatus: user.verificationStatus,
      followersCount: user._count.followers,
      followingCount: user._count.following,
      projectsCount: user._count.explorerProjects,
      isOwner,
      isFollowing,
      likesCount,
      forksCount,
      points: projects.length * 10 + likesCount * 2 + commentsCount * 3 + forksCount * 5,
      links: extractPublicProfileLinks(user.publicDescription ?? '', user.profileDetails),
      projects,
    };
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
      where: { id: projectId, status: 'published', userId: { not: null } },
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

  async deleteProject(user: AuthenticatedUser, projectId: string) {
    const project = await this.ownedProject(user.id, projectId);
    await this.prisma.explorerProject.delete({ where: { id: project.id } });
    return { deleted: true };
  }

  async toggleProjectVisibility(user: AuthenticatedUser, projectId: string): Promise<ExplorerProject> {
    const project = await this.ownedProject(user.id, projectId);
    const nextVisibility = project.visibility === 'public' ? 'unlisted' : 'public';
    const updated = await this.prisma.explorerProject.update({
      where: { id: project.id },
      data: { visibility: nextVisibility },
      include: {
        _count: { select: { favorites: true } },
        comments: { where: { status: 'visible' }, orderBy: { createdAt: 'desc' }, take: 3 },
        assets: {
          where: { kind: { in: ['cover', 'video', 'gallery'] }, visibility: 'public' },
          orderBy: { createdAt: 'asc' },
          take: 1,
          select: { id: true, kind: true, mimeType: true },
        },
        user: { select: { verificationLevel: true } },
      },
    });
    return toExplorerProject(updated);
  }

  async publishProject(user: AuthenticatedUser, projectId: string): Promise<ExplorerProject> {
    const project = await this.ownedProject(user.id, projectId);
    const errors: string[] = [];
    if (project.title.length < 4 || project.title === 'Projet sans titre') errors.push('Ajoutez un titre explicite.');
    if (project.summary.length < 24 || project.summary === 'Brouillon en cours de preparation.') errors.push('Ajoutez un resume public.');
    const hasPublicMedia = project.assets.some((asset) => asset.visibility === 'public' && ['cover', 'video', 'gallery'].includes(asset.kind));
    if (!project.imageUrl && !hasPublicMedia) errors.push('Ajoutez une image ou une video de presentation.');

    if (project.projectType === 'paid') {
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
      if (!project.priceCents || project.priceCents < 100) errors.push('Definissez un prix valide.');
      if (!project.assets.some((asset) => asset.visibility === 'protected')) {
        errors.push('Un projet payant doit contenir au moins un fichier protege.');
      }
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

  async recordProjectView(projectId: string, actorKey: string, user?: AuthenticatedUser): Promise<{ counted: boolean; viewsCount: number; userViewCount: number }> {
    await this.ensureProject(projectId);
    const resolvedActorKey = user ? `user:${user.id}` : clean(actorKey) || 'anonymous';
    const current = await this.prisma.explorerProjectView.findUnique({
      where: { projectId_actorKey: { projectId, actorKey: resolvedActorKey } },
    });
    if (current && current.count >= 5) {
      const project = await this.prisma.explorerProject.findUnique({ where: { id: projectId }, select: { viewsCount: true } });
      return { counted: false, viewsCount: project?.viewsCount ?? 0, userViewCount: current.count };
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const nextView = current
        ? await tx.explorerProjectView.update({ where: { id: current.id }, data: { count: { increment: 1 }, userId: user?.id } })
        : await tx.explorerProjectView.create({ data: { projectId, userId: user?.id, actorKey: resolvedActorKey, count: 1 } });
      const nextProject = await tx.explorerProject.update({ where: { id: projectId }, data: { viewsCount: { increment: 1 } }, select: { viewsCount: true } });
      return { nextView, nextProject };
    });
    return { counted: true, viewsCount: result.nextProject.viewsCount, userViewCount: result.nextView.count };
  }

  async listUserProjects(userId: string, options: { includeHidden?: boolean } = {}): Promise<ExplorerProject[]> {
    const projects = await this.prisma.explorerProject.findMany({
      where: { userId, status: 'published', ...(options.includeHidden ? {} : { visibility: 'public' }) },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { favorites: true } },
        comments: { where: { status: 'visible' }, orderBy: { createdAt: 'desc' }, take: 3 },
        assets: {
          where: { kind: { in: ['cover', 'video', 'gallery'] }, visibility: 'public' },
          orderBy: { createdAt: 'asc' },
          take: 1,
          select: { id: true, kind: true, mimeType: true },
        },
        user: { select: { verificationLevel: true } },
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
            assets: {
              where: { kind: { in: ['cover', 'video', 'gallery'] }, visibility: 'public' },
              orderBy: { createdAt: 'asc' },
              take: 1,
              select: { id: true, kind: true, mimeType: true },
            },
            user: { select: { verificationLevel: true } },
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
        userId: { not: null },
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
        assets: {
          where: { kind: { in: ['cover', 'video', 'gallery'] }, visibility: 'public' },
          orderBy: { createdAt: 'asc' },
          take: 1,
          select: { id: true, kind: true, mimeType: true },
        },
        user: { select: { verificationLevel: true } },
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

  async getPublicAssetUrl(projectId: string, assetId: string) {
    const asset = await this.prisma.explorerProjectAsset.findFirst({
      where: {
        id: assetId,
        projectId,
        visibility: 'public',
        project: { status: 'published', userId: { not: null } },
      },
      include: {
        upload: {
          select: {
            storageKey: true,
            status: true,
          },
        },
      },
    });
    if (!asset || !['uploaded', 'analyzed'].includes(asset.upload.status)) throw new NotFoundException('Public project file not found.');
    return { url: this.uploadRepository.createDownloadUrl(asset.upload.storageKey) };
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
    const project = await this.prisma.explorerProject.findFirst({ where: { id: projectId, status: 'published', userId: { not: null } } });
    if (!project) throw new NotFoundException('Explorer project not found.');
  }

  private async projectSocialState(projectId: string, authorId: string | undefined, viewerId: string) {
    const [like, favorite, follow] = await Promise.all([
      this.prisma.explorerProjectLike.findUnique({ where: { projectId_actorKey: { projectId, actorKey: `user:${viewerId}` } } }),
      this.prisma.explorerProjectFavorite.findUnique({ where: { projectId_userId: { projectId, userId: viewerId } } }),
      authorId && authorId !== viewerId ? this.prisma.userFollow.findUnique({ where: { followerId_followingId: { followerId: viewerId, followingId: authorId } } }) : null,
    ]);
    return {
      liked: Boolean(like),
      favorited: Boolean(favorite),
      followingAuthor: Boolean(follow),
      isOwner: authorId === viewerId,
    };
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
}> & { assets?: Array<{ id: string; kind?: string; mimeType?: string }>; user?: { verificationLevel: number } | null };

function toExplorerProject(project: ExplorerProjectRecord): ExplorerProject {
  const previewAsset = project.assets?.find((asset) => ['cover', 'video', 'gallery'].includes(asset.kind ?? ''));
  return {
    id: project.id,
    userId: project.userId ?? undefined,
    authorName: project.authorName,
    authorAvatarUrl: project.authorAvatarUrl ?? undefined,
    authorBadgeLabel: accountBadgeLabel(project.user?.verificationLevel ?? 0),
    authorVerificationLevel: project.user?.verificationLevel ?? 0,
    title: project.title,
    category: project.category,
    summary: project.summary,
    description: project.description ?? undefined,
    tags: project.tags,
    imageUrl: publicCoverUrl(project.id, previewAsset?.id) ?? safeStoredImageUrl(project.imageUrl),
    mediaKind: previewAsset?.kind,
    mediaMimeType: previewAsset?.mimeType,
    attachmentName: project.attachmentName ?? undefined,
    attachmentType: project.attachmentType ?? undefined,
    repositoryUrl: project.repositoryUrl ?? undefined,
    projectType: project.projectType as 'free' | 'paid',
    priceCents: project.priceCents ?? undefined,
    currency: project.currency,
    licenseCode: project.licenseCode,
    allowedUses: project.allowedUses,
    visibility: project.visibility,
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

function accountBadgeLabel(level: number): string {
  if (level >= 3) return 'Industriel certifie';
  if (level >= 2) return 'Professionnel certifie';
  if (level >= 1) return 'Compte verifie';
  return 'Nouveau compte';
}

function publicCoverUrl(projectId: string, assetId: string | undefined): string | undefined {
  return assetId ? `/api/explorer/projects/${projectId}/assets/${assetId}/public` : undefined;
}

function safeStoredImageUrl(value: string | null): string | undefined {
  if (!value) return undefined;
  if (value.startsWith('blob:')) return undefined;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(value)) return undefined;
  return value;
}

function extractPublicProfileLinks(description: string, profileDetails: unknown) {
  const links = new Map<string, { type: string; label: string; href: string; host?: string }>();
  const text = description || '';
  const website = stringValue(objectRecord(profileDetails).website);
  const candidates = [
    ...text.matchAll(/https?:\/\/[^\s)]+|www\.[^\s)]+/gi),
  ].map((match) => match[0]);
  if (website) candidates.push(website);

  for (const rawValue of candidates) {
    const href = rawValue.startsWith('http') ? rawValue : `https://${rawValue}`;
    try {
      const url = new URL(href);
      const host = url.hostname.replace(/^www\./, '');
      links.set(url.toString(), {
        type: linkTypeForHost(host),
        label: host,
        href: url.toString(),
        host,
      });
    } catch {
      // Ignore malformed public links.
    }
  }

  for (const match of text.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)) {
    const email = match[0].toLowerCase();
    links.set(`mailto:${email}`, {
      type: 'email',
      label: email,
      href: `mailto:${email}`,
    });
  }

  return Array.from(links.values()).slice(0, 4);
}

function linkTypeForHost(host: string): string {
  if (host.includes('youtube.com') || host.includes('youtu.be')) return 'youtube';
  if (host.includes('github.com')) return 'github';
  if (host.includes('linkedin.com')) return 'linkedin';
  if (host.includes('x.com') || host.includes('twitter.com')) return 'x';
  if (host.includes('instagram.com')) return 'instagram';
  if (host.includes('tiktok.com')) return 'tiktok';
  return 'website';
}
