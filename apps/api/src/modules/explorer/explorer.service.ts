import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { CreateExplorerCommentDto } from './dto/create-explorer-comment.dto';
import {
  AttachExplorerProjectAssetDto,
  CreateExplorerProjectDraftDto,
  UpdateExplorerProjectDto,
} from './dto/create-explorer-project.dto';
import { ExplorerProject } from './entities/explorer-project.entity';

const defaultProjects: Prisma.ExplorerProjectCreateManyInput[] = [
  {
    id: 'kendronics-open-power-monitor',
    authorName: 'Kendronics Lab',
    title: 'Moniteur energie modulaire',
    category: 'Energie',
    summary: 'Carte de mesure courant et tension pour prototypes terrain, avec bornier, zone capteur et format pret pour revue fabrication.',
    description: 'Projet de reference pour suivre consommation, tension et etat de charge dans une installation basse tension.',
    tags: ['FR-4', 'Capteur', 'Prototype', 'Open hardware'],
    imageUrl: '/images/hero-controller-board.png',
    attachmentName: 'power-monitor-gerber.zip',
    attachmentType: 'Gerber',
    status: 'published',
    publishedAt: new Date(),
    featured: true,
    viewsCount: 2400,
    likesCount: 84,
    commentsCount: 7,
    forksCount: 18,
  },
  {
    id: 'kendronics-iot-node-low-power',
    authorName: 'Community',
    title: 'Noeud IoT basse consommation',
    category: 'IoT',
    summary: 'Design compact pour collecte de donnees, alimentation batterie, antenne externe et connecteur de programmation.',
    tags: ['IoT', 'Batterie', 'RF', 'ESP32'],
    imageUrl: '/images/hero-pcb-color-variants.png',
    attachmentName: 'iot-node-docs.pdf',
    attachmentType: 'Documentation',
    status: 'published',
    publishedAt: new Date(),
    featured: true,
    viewsCount: 1600,
    likesCount: 61,
    commentsCount: 5,
    forksCount: 11,
  },
  {
    id: 'kendronics-education-solder-kit',
    authorName: 'MakerLab',
    title: 'Kit soudure pedagogique',
    category: 'Education',
    summary: 'Carte simple pour atelier scolaire avec LED, buzzer, connecteurs traversants et zones de test multimetre.',
    tags: ['Education', 'THT', 'Atelier'],
    imageUrl: '/images/quote-product-standard-pcb.png',
    attachmentName: 'solder-kit-v1.zip',
    attachmentType: 'Gerber',
    status: 'published',
    publishedAt: new Date(),
    viewsCount: 980,
    likesCount: 32,
    commentsCount: 3,
    forksCount: 9,
  },
];

@Injectable()
export class ExplorerService {
  constructor(private readonly prisma: PrismaService) {}

  async listProjects(): Promise<ExplorerProject[]> {
    await this.ensureSeedProjects();
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

  private async ensureSeedProjects() {
    const count = await this.prisma.explorerProject.count();
    if (count === 0) {
      await this.prisma.explorerProject.createMany({ data: defaultProjects, skipDuplicates: true });
    }
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
