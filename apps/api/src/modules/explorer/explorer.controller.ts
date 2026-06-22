import { Body, Controller, Delete, Get, Param, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthTokenService } from '../auth/auth-token.service';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { CreateExplorerCommentDto } from './dto/create-explorer-comment.dto';
import {
  AttachExplorerProjectAssetDto,
  CreateExplorerProjectDraftDto,
  UpdateExplorerProjectDto,
} from './dto/create-explorer-project.dto';
import { LikeExplorerProjectDto } from './dto/like-explorer-project.dto';
import { ExplorerService } from './explorer.service';

@Controller('explorer')
export class ExplorerController {
  constructor(
    private readonly explorerService: ExplorerService,
    private readonly authTokenService: AuthTokenService,
  ) {}

  @Get('projects')
  listProjects() {
    return this.explorerService.listProjects();
  }

  @Get('projects/:projectId')
  getProjectDetail(@Param('projectId') projectId: string, @Req() request: { headers: Record<string, string> }) {
    return this.explorerService.getProjectDetail(projectId, this.readOptionalUser(request));
  }

  @Get('users/:userId/profile')
  getPublicAuthorProfile(@Param('userId') userId: string, @Req() request: { headers: Record<string, string> }) {
    return this.explorerService.getPublicAuthorProfile(userId, this.readOptionalUser(request));
  }

  @Post('projects/drafts')
  @UseGuards(JwtAuthGuard)
  createProjectDraft(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateExplorerProjectDraftDto) {
    return this.explorerService.createProjectDraft(user, dto);
  }

  @Patch('projects/:projectId')
  @UseGuards(JwtAuthGuard)
  updateProject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Body() dto: UpdateExplorerProjectDto,
  ) {
    return this.explorerService.updateProject(user, projectId, dto);
  }

  @Post('projects/:projectId/assets')
  @UseGuards(JwtAuthGuard)
  attachAsset(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Body() dto: AttachExplorerProjectAssetDto,
  ) {
    return this.explorerService.attachAsset(user, projectId, dto);
  }

  @Delete('projects/:projectId/assets/:assetId')
  @UseGuards(JwtAuthGuard)
  removeAsset(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Param('assetId') assetId: string,
  ) {
    return this.explorerService.removeAsset(user, projectId, assetId);
  }

  @Post('projects/:projectId/publish')
  @UseGuards(JwtAuthGuard)
  publishProject(@CurrentUser() user: AuthenticatedUser, @Param('projectId') projectId: string) {
    return this.explorerService.publishProject(user, projectId);
  }

  @Post('projects/:projectId/views')
  recordProjectView(
    @Param('projectId') projectId: string,
    @Body() dto: LikeExplorerProjectDto,
    @Req() request: { headers: Record<string, string> },
  ) {
    return this.explorerService.recordProjectView(projectId, dto.actorKey, this.readOptionalUser(request));
  }

  @Post('projects/:projectId/visibility')
  @UseGuards(JwtAuthGuard)
  toggleProjectVisibility(@CurrentUser() user: AuthenticatedUser, @Param('projectId') projectId: string) {
    return this.explorerService.toggleProjectVisibility(user, projectId);
  }

  @Delete('projects/:projectId')
  @UseGuards(JwtAuthGuard)
  deleteProject(@CurrentUser() user: AuthenticatedUser, @Param('projectId') projectId: string) {
    return this.explorerService.deleteProject(user, projectId);
  }

  @Get('projects/:projectId/editor')
  @UseGuards(JwtAuthGuard)
  getProjectEditor(@CurrentUser() user: AuthenticatedUser, @Param('projectId') projectId: string) {
    return this.explorerService.getProjectEditor(user, projectId);
  }

  @Get('projects/:projectId/marketplace')
  @UseGuards(JwtAuthGuard)
  projectMarketplaceState(@CurrentUser() user: AuthenticatedUser, @Param('projectId') projectId: string) {
    return this.explorerService.getProjectMarketplaceState(user.id, projectId);
  }

  @Get('projects/:projectId/assets/downloads')
  @UseGuards(JwtAuthGuard)
  projectAssetDownloads(@CurrentUser() user: AuthenticatedUser, @Param('projectId') projectId: string) {
    return this.explorerService.listProjectAssetDownloads(user, projectId);
  }

  @Get('projects/:projectId/assets/:assetId/public')
  async publicProjectAsset(
    @Param('projectId') projectId: string,
    @Param('assetId') assetId: string,
    @Req() request: { headers: Record<string, string | string[] | undefined> },
    @Res() response: {
      status(code: number): {
        setHeader(name: string, value: string | number): void;
        send(body: Buffer): void;
      };
      setHeader(name: string, value: string | number): void;
      send(body: Buffer): void;
    },
  ) {
    const payload = await this.explorerService.getPublicAssetFile(projectId, assetId);
    const range = parseRangeHeader(stringHeader(request.headers.range), payload.buffer.length);
    if (range) {
      const chunk = payload.buffer.subarray(range.start, range.end + 1);
      const partial = response.status(206);
      partial.setHeader('Content-Type', payload.mimeType);
      partial.setHeader('Content-Length', chunk.length);
      partial.setHeader('Content-Range', `bytes ${range.start}-${range.end}/${payload.buffer.length}`);
      partial.setHeader('Accept-Ranges', 'bytes');
      partial.setHeader('Cache-Control', 'public, max-age=300');
      partial.setHeader('Content-Disposition', `inline; filename="${payload.originalName.replace(/"/g, '')}"`);
      return partial.send(chunk);
    }
    response.setHeader('Content-Type', payload.mimeType);
    response.setHeader('Content-Length', payload.buffer.length);
    response.setHeader('Accept-Ranges', 'bytes');
    response.setHeader('Cache-Control', 'public, max-age=300');
    response.setHeader('Content-Disposition', `inline; filename="${payload.originalName.replace(/"/g, '')}"`);
    return response.send(payload.buffer);
  }

  @Post('projects/:projectId/purchases')
  @UseGuards(JwtAuthGuard)
  createProjectPurchase(@CurrentUser() user: AuthenticatedUser, @Param('projectId') projectId: string) {
    return this.explorerService.createProjectPurchaseIntent(user.id, projectId);
  }

  @Post('projects/:projectId/likes')
  likeProject(
    @Param('projectId') projectId: string,
    @Body() dto: LikeExplorerProjectDto,
    @Req() request: { headers: Record<string, string> },
  ) {
    return this.explorerService.likeProject(projectId, dto.actorKey, this.readOptionalUser(request));
  }

  @Get('me/projects')
  @UseGuards(JwtAuthGuard)
  myProjects(@CurrentUser() user: AuthenticatedUser) {
    return this.explorerService.listUserProjects(user.id, { includeHidden: true });
  }

  @Get('me/drafts')
  @UseGuards(JwtAuthGuard)
  myDrafts(@CurrentUser() user: AuthenticatedUser) {
    return this.explorerService.listUserDrafts(user.id);
  }

  @Get('me/favorites')
  @UseGuards(JwtAuthGuard)
  myFavorites(@CurrentUser() user: AuthenticatedUser) {
    return this.explorerService.listUserFavorites(user.id);
  }

  @Get('me/following/projects')
  @UseGuards(JwtAuthGuard)
  myFollowingProjects(@CurrentUser() user: AuthenticatedUser) {
    return this.explorerService.listFollowingProjects(user.id);
  }

  @Get('me/purchases')
  @UseGuards(JwtAuthGuard)
  myProjectPurchases(@CurrentUser() user: AuthenticatedUser) {
    return this.explorerService.listProjectPurchases(user.id);
  }

  @Get('me/licenses')
  @UseGuards(JwtAuthGuard)
  myProjectLicenses(@CurrentUser() user: AuthenticatedUser) {
    return this.explorerService.listProjectLicenseGrants(user.id);
  }

  @Post('projects/:projectId/favorites')
  @UseGuards(JwtAuthGuard)
  favoriteProject(@CurrentUser() user: AuthenticatedUser, @Param('projectId') projectId: string) {
    return this.explorerService.toggleFavorite(projectId, user.id);
  }

  @Post('projects/:projectId/comments')
  commentProject(
    @Param('projectId') projectId: string,
    @Body() dto: CreateExplorerCommentDto,
    @Req() request: { headers: Record<string, string> },
  ) {
    return this.explorerService.commentProject(projectId, dto, this.readOptionalUser(request));
  }

  private readOptionalUser(request: { headers: Record<string, string> }): AuthenticatedUser | undefined {
    const authorization = request.headers.authorization;
    const token = authorization?.startsWith('Bearer ') ? authorization.slice('Bearer '.length).trim() : '';
    if (!token) return undefined;
    try {
      return this.authTokenService.verifyAccessToken(token);
    } catch {
      return undefined;
    }
  }
}

function stringHeader(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseRangeHeader(value: string | undefined, size: number): { start: number; end: number } | null {
  if (!value || !Number.isFinite(size) || size <= 0) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(value.trim());
  if (!match) return null;
  const [, rawStart, rawEnd] = match;
  if (!rawStart && !rawEnd) return null;
  if (!rawStart) {
    const suffixLength = Number(rawEnd);
    if (!Number.isFinite(suffixLength) || suffixLength <= 0) return null;
    const start = Math.max(0, size - suffixLength);
    return { start, end: size - 1 };
  }
  const start = Number(rawStart);
  const end = rawEnd ? Number(rawEnd) : Math.min(size - 1, start + 1024 * 1024 - 1);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start || start >= size) return null;
  return { start, end: Math.min(end, size - 1) };
}
