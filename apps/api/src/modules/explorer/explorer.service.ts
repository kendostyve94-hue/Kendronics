import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { CreateExplorerCommentDto } from './dto/create-explorer-comment.dto';
import { CreateExplorerProjectDto } from './dto/create-explorer-project.dto';
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
      include: { comments: { where: { status: 'visible' }, orderBy: { createdAt: 'desc' }, take: 3 } },
    });

    return projects.map(toExplorerProject);
  }

  async createProject(user: AuthenticatedUser, dto: CreateExplorerProjectDto): Promise<ExplorerProject> {
    const author = await this.prisma.user.findUnique({ where: { id: user.id } });
    const project = await this.prisma.explorerProject.create({
      data: {
        userId: user.id,
        authorName: author?.fullName || emailName(user.email) || 'Client Kendronics',
        authorAvatarUrl: author?.avatarDataUrl,
        title: clean(dto.title),
        category: clean(dto.category),
        summary: clean(dto.summary),
        description: clean(dto.description),
        tags: (dto.tags ?? []).map(clean).filter(Boolean).slice(0, 8),
        attachmentName: clean(dto.attachmentName),
        attachmentType: clean(dto.attachmentType),
        imageUrl: clean(dto.imageUrl),
        repositoryUrl: clean(dto.repositoryUrl),
      },
      include: { comments: true },
    });

    return toExplorerProject(project);
  }

  async listUserProjects(userId: string): Promise<ExplorerProject[]> {
    const projects = await this.prisma.explorerProject.findMany({
      where: { userId, status: 'published' },
      orderBy: { createdAt: 'desc' },
      include: { comments: { where: { status: 'visible' }, orderBy: { createdAt: 'desc' }, take: 3 } },
    });
    return projects.map(toExplorerProject);
  }

  async listUserFavorites(userId: string): Promise<ExplorerProject[]> {
    const likes = await this.prisma.explorerProjectLike.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        project: {
          include: { comments: { where: { status: 'visible' }, orderBy: { createdAt: 'desc' }, take: 3 } },
        },
      },
    });
    return likes.filter((like) => like.project.status === 'published').map((like) => toExplorerProject(like.project));
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
        include: { comments: { where: { status: 'visible' }, orderBy: { createdAt: 'desc' }, take: 3 } },
      });
    });

    return toExplorerProject(project);
  }

  private async ensureProject(projectId: string) {
    const project = await this.prisma.explorerProject.findFirst({ where: { id: projectId, status: 'published' } });
    if (!project) throw new NotFoundException('Explorer project not found.');
  }

  private async ensureSeedProjects() {
    const count = await this.prisma.explorerProject.count();
    if (count === 0) {
      await this.prisma.explorerProject.createMany({ data: defaultProjects, skipDuplicates: true });
    }
  }
}

type ExplorerProjectRecord = Prisma.ExplorerProjectGetPayload<{ include: { comments: true } }>;

function toExplorerProject(project: ExplorerProjectRecord): ExplorerProject {
  return {
    id: project.id,
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
    featured: project.featured,
    viewsCount: project.viewsCount,
    likesCount: project.likesCount,
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
