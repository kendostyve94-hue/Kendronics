import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthTokenService } from '../auth/auth-token.service';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { CreateExplorerCommentDto } from './dto/create-explorer-comment.dto';
import { CreateExplorerProjectDto } from './dto/create-explorer-project.dto';
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

  @Post('projects')
  @UseGuards(JwtAuthGuard)
  createProject(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateExplorerProjectDto) {
    return this.explorerService.createProject(user, dto);
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

  @Get('me/favorites')
  @UseGuards(JwtAuthGuard)
  myFavorites(@CurrentUser() user: AuthenticatedUser) {
    return this.explorerService.listUserFavorites(user.id);
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
