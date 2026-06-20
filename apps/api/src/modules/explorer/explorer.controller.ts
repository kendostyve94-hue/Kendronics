import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
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

  @Get('projects/:projectId/editor')
  @UseGuards(JwtAuthGuard)
  getProjectEditor(@CurrentUser() user: AuthenticatedUser, @Param('projectId') projectId: string) {
    return this.explorerService.getProjectEditor(user, projectId);
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
    return this.explorerService.listUserProjects(user.id);
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
