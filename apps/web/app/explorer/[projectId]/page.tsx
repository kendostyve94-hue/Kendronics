'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Navbar } from '../../../components/layout/Navbar';
import { getApiBaseUrl } from '../../../lib/api-base-url';
import { readAuthSession } from '../../../lib/auth-session';

type ExplorerProject = {
  id: string;
  userId?: string;
  authorName: string;
  authorAvatarUrl?: string;
  title: string;
  category: string;
  summary: string;
  description?: string;
  tags: string[];
  imageUrl?: string;
  thumbnailUrl?: string;
  mediaKind?: string;
  mediaMimeType?: string;
  projectType?: 'free' | 'paid';
  visibility?: string;
  priceCents?: number;
  currency?: string;
  licenseCode?: string;
  allowedUses?: string[];
  viewsCount: number;
  likesCount: number;
  favoritesCount: number;
  commentsCount: number;
  forksCount: number;
  createdAt: string;
  comments: Array<{
    id: string;
    parentId?: string;
    authorName: string;
    authorAvatarUrl?: string;
    authorBadgeLabel?: string;
    authorVerificationLevel?: number;
    body: string;
    createdAt: string;
  }>;
  technicalDetails?: Record<string, unknown>;
  documentation?: Record<string, unknown>;
  publicAssets?: Array<{
    id: string;
    kind: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
  }>;
  author: {
    id?: string;
    name: string;
    avatarDataUrl?: string;
    description?: string;
    badgeLabel: string;
    verificationLevel: number;
    verificationStatus?: string;
    followersCount: number;
    followingCount: number;
    projectsCount: number;
    links: Array<{
      type: string;
      label: string;
      href: string;
      host?: string;
    }>;
  };
  socialState?: {
    liked: boolean;
    favorited: boolean;
    followingAuthor: boolean;
    isOwner: boolean;
  };
};

const apiBaseUrl = getApiBaseUrl();
const defaultSocialState = { liked: false, favorited: false, followingAuthor: false, isOwner: false };

export default function ExplorerProjectDetailPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const [project, setProject] = useState<ExplorerProject | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [favorited, setFavorited] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');
  const [replyTarget, setReplyTarget] = useState<ExplorerProject['comments'][number] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProject() {
      try {
        const session = readAuthSession();
        const response = await fetch(`${apiBaseUrl}/api/explorer/projects/${projectId}`, {
          headers: session ? { Authorization: `${session.tokenType} ${session.accessToken}` } : undefined,
          cache: 'no-store',
        });
        if (!response.ok) throw new Error(`Explorer project failed: ${response.status}`);
        const payload = await response.json() as ExplorerProject;
        if (cancelled) return;
        setProject(payload);
        setFavorited(Boolean(payload.socialState?.favorited));
        setFollowed(Boolean(payload.socialState?.followingAuthor));
        setStatus('ready');
        void recordView(payload.id);
      } catch {
        if (!cancelled) setStatus('error');
      }
    }

    void loadProject();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  async function likeProject() {
    if (!project) return;
    const session = readAuthSession();
    const response = await fetch(`${apiBaseUrl}/api/explorer/projects/${project.id}/likes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `${session.tokenType} ${session.accessToken}` } : {}),
      },
      body: JSON.stringify({ actorKey: session ? `user:${currentSessionUserId()}` : readAnonymousActorKey() }),
    });
    if (!response.ok) return;
    const payload = await response.json() as { liked: boolean; likesCount: number };
    setProject((current) => current ? { ...current, likesCount: payload.likesCount, socialState: { ...(current.socialState ?? defaultSocialState), liked: payload.liked } } : current);
  }

  async function recordView(nextProjectId: string) {
    const session = readAuthSession();
    const response = await fetch(`${apiBaseUrl}/api/explorer/projects/${nextProjectId}/views`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `${session.tokenType} ${session.accessToken}` } : {}),
      },
      body: JSON.stringify({ actorKey: session ? `user:${currentSessionUserId()}` : readAnonymousActorKey() }),
    });
    if (!response.ok) return;
    const payload = await response.json() as { viewsCount: number };
    setProject((current) => current ? { ...current, viewsCount: payload.viewsCount } : current);
  }

  async function favoriteProject() {
    if (!project) return;
    const session = readAuthSession();
    if (!session) return openAuthRequired();
    const response = await fetch(`${apiBaseUrl}/api/explorer/projects/${project.id}/favorites`, {
      method: 'POST',
      headers: { Authorization: `${session.tokenType} ${session.accessToken}` },
    });
    if (!response.ok) return;
    const payload = await response.json() as { favorited: boolean; favoritesCount: number };
    setFavorited(payload.favorited);
    setProject((current) => current ? { ...current, favoritesCount: payload.favoritesCount, socialState: { ...(current.socialState ?? defaultSocialState), favorited: payload.favorited } } : current);
  }

  async function followAuthor() {
    if (!project?.author.id) return;
    const session = readAuthSession();
    if (!session) return openAuthRequired();
    const response = await fetch(`${apiBaseUrl}/api/users/${project.author.id}/follow`, {
      method: 'POST',
      headers: { Authorization: `${session.tokenType} ${session.accessToken}` },
    });
    if (!response.ok) return;
    const payload = await response.json() as { following: boolean; followersCount: number };
    setFollowed(payload.following);
    setProject((current) => current ? { ...current, author: { ...current.author, followersCount: payload.followersCount }, socialState: { ...(current.socialState ?? defaultSocialState), followingAuthor: payload.following } } : current);
  }

  async function postComment() {
    if (!project || !commentDraft.trim()) return;
    const session = readAuthSession();
    const response = await fetch(`${apiBaseUrl}/api/explorer/projects/${project.id}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `${session.tokenType} ${session.accessToken}` } : {}),
      },
      body: JSON.stringify({ body: commentDraft.trim(), parentId: replyTarget?.id }),
    });
    if (!response.ok) return;
    const updated = await response.json() as ExplorerProject;
    setProject((current) => current ? { ...current, comments: updated.comments, commentsCount: updated.commentsCount } : current);
    setCommentDraft('');
    setReplyTarget(null);
  }

  return (
    <main className="project-detail-page min-h-screen bg-white text-[#0b1724]">
      <Navbar />
      <div className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-[92px] sm:px-6 lg:px-5">
        {status === 'loading' ? (
          <ProjectDetailState title="Chargement du projet" body="Explorer recupere les details de la publication." />
        ) : status === 'error' || !project ? (
          <ProjectDetailState title="Projet introuvable" body="Cette publication n'est pas disponible ou a ete retiree." />
        ) : (
          <>
            <header className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <a href={project.socialState?.isOwner ? '/profile?view=benefits' : project.author.id ? `/profile/${project.author.id}` : '/explorer'} className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-[#102033] text-sm font-black text-white" aria-label={`Voir le profil de ${project.author.name}`}>
                  {project.author.avatarDataUrl ? <img src={project.author.avatarDataUrl} alt="" className="h-full w-full object-cover" /> : project.author.name.slice(0, 1).toUpperCase()}
                </a>
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <a href={project.socialState?.isOwner ? '/profile?view=benefits' : project.author.id ? `/profile/${project.author.id}` : '/explorer'} className="block truncate text-base font-black text-[#0b1724] transition hover:text-[#0f8f6b] sm:text-lg">{project.author.name}</a>
                    <CertificationBadge level={project.author.verificationLevel} status={project.author.verificationStatus} />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs font-semibold">
                    <span className="rounded-full bg-[#eefbf6] px-1.5 py-0.5 text-[10px] font-black leading-none text-[#0f8f6b]">{project.author.badgeLabel}</span>
                    {!project.socialState?.isOwner ? <button type="button" onClick={() => void followAuthor()} className={`inline-flex items-center gap-1 text-[#334155] transition hover:text-[#0f8f6b] ${followed ? 'text-[#0f8f6b]' : ''}`}>
                      <FollowTinyIcon />
                      {followed ? 'Unfollow' : 'Follow'}
                    </button> : null}
                  </div>
                  {project.author.links.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-[#334155]">
                      {project.author.links.map((link) => (
                        <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 transition hover:text-[#0f8f6b]">
                          <PublicLinkIcon type={link.type} />
                          {link.label}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-4 text-sm font-semibold text-[#94a3b8]">
                <span className="inline-flex items-center gap-1.5" title="Vues">
                  <DetailEyeIcon />
                  {formatCompact(project.viewsCount)}
                </span>
                <button type="button" onClick={() => void likeProject()} className={`inline-flex items-center gap-1.5 transition hover:text-[#0f8f6b] ${project.socialState?.liked ? 'text-[#0f8f6b]' : ''}`} aria-label="Aimer">
                  <DetailThumbIcon filled={Boolean(project.socialState?.liked)} />
                  {formatCompact(project.likesCount)}
                </button>
                <button type="button" onClick={() => void favoriteProject()} className={`inline-flex items-center gap-1.5 transition hover:text-[#0f8f6b] ${favorited ? 'text-[#0f8f6b]' : ''}`} aria-label="Ajouter aux favoris">
                  <DetailStarIcon filled={favorited} />
                  {formatCompact(project.favoritesCount)}
                </button>
                <span className="inline-flex items-center gap-1.5" title="Commentaires">
                  <DetailCommentIcon />
                  {formatCompact(project.commentsCount)}
                </span>
                {project.projectType === 'paid' ? (
                  <a href={`/explorer?fork=${project.id}`} className="grid h-10 place-items-center rounded-full bg-[#08071b] px-6 text-sm font-black text-white transition hover:bg-[#0f8f6b]">
                    Forks
                  </a>
                ) : null}
              </div>
            </header>

            <div className="mt-8 h-[calc((100vw-2rem)*9/16)] w-full overflow-hidden bg-[#edf3f8] sm:aspect-video sm:h-auto">
              {project.imageUrl ? (
                <ProjectMedia project={project} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center text-sm font-black uppercase tracking-[0.16em] text-[#64748b]">{project.category}</div>
              )}
            </div>

            <section className="mt-10 max-w-4xl text-left">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0f8f6b]">#{project.category}</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-[#0b1724] sm:text-4xl">{project.title}</h2>
              <p className="mt-6 whitespace-pre-line text-base leading-8 text-[#334155] sm:text-lg">{project.description || project.summary}</p>
            </section>

            {project.projectType === 'paid' ? <section className="mx-auto mt-12 grid max-w-5xl gap-8 lg:grid-cols-2">
              <ProjectInfoBlock
                title="Caracteristiques techniques"
                items={[
                  ['Type', detailValue(project.technicalDetails, 'boardType')],
                  ['Dimensions', detailValue(project.technicalDetails, 'dimensions')],
                  ['Couches', detailValue(project.technicalDetails, 'layers')],
                  ['Composants', detailValue(project.technicalDetails, 'mainComponents')],
                  ['Alimentation', detailValue(project.technicalDetails, 'power')],
                  ['Interfaces', detailValue(project.technicalDetails, 'interfaces')],
                  ['Logiciels', detailValue(project.technicalDetails, 'software')],
                  ['Maturite', detailValue(project.technicalDetails, 'maturity')],
                  ['Tests', detailValue(project.technicalDetails, 'tested')],
                ]}
              />
              <ProjectInfoBlock
                title="Documentation"
                items={[
                  ['Fabrication', detailValue(project.documentation, 'buildInstructions')],
                  ['Programmation', detailValue(project.documentation, 'softwareInstructions')],
                  ['Securite', detailValue(project.documentation, 'safetyNotes')],
                  ['Version', detailValue(project.documentation, 'changelog')],
                ]}
              />
            </section> : null}

            {project.projectType === 'paid' ? <section className="mx-auto mt-10 max-w-5xl">
              <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#dbe4ee] pb-3">
                <h2 className="text-lg font-black text-[#0b1724]">Fichiers publics</h2>
                <span className="text-sm font-semibold text-[#64748b]">{project.publicAssets?.length ?? 0} fichier(s)</span>
              </div>
              <div className="divide-y divide-[#e4ebf2]">
                {project.publicAssets && project.publicAssets.length > 0 ? project.publicAssets.map((asset) => (
                  <div key={asset.id} className="grid gap-2 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                    <p className="min-w-0 truncate text-sm font-black text-[#102033]">{asset.originalName}</p>
                    <span className="text-xs font-bold uppercase text-[#64748b]">{asset.kind}</span>
                    <span className="text-xs font-semibold text-[#94a3b8]">{formatBytes(asset.sizeBytes)}</span>
                  </div>
                )) : (
                  <p className="py-4 text-sm text-[#64748b]">Aucun fichier public. Les fichiers proteges sont disponibles uniquement apres licence ou achat.</p>
                )}
              </div>
            </section> : null}

            <ProjectComments
              comments={project.comments}
              draft={commentDraft}
              replyTarget={replyTarget}
              onDraftChange={setCommentDraft}
              onReply={setReplyTarget}
              onCancelReply={() => setReplyTarget(null)}
              onSubmit={() => void postComment()}
            />
          </>
        )}
      </div>
    </main>
  );
}

function ProjectInfoBlock({ title, items }: { title: string; items: Array<[string, string]> }) {
  const visibleItems = items.filter(([, value]) => value);
  return (
    <div>
      <h2 className="border-b border-[#dbe4ee] pb-3 text-lg font-black text-[#0b1724]">{title}</h2>
      {visibleItems.length > 0 ? (
        <dl className="divide-y divide-[#e4ebf2]">
          {visibleItems.map(([label, value]) => (
            <div key={label} className="grid gap-1 py-3 text-sm sm:grid-cols-[130px_1fr]">
              <dt className="font-black text-[#64748b]">{label}</dt>
              <dd className="leading-6 text-[#102033]">{value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="py-4 text-sm text-[#64748b]">Non renseigne.</p>
      )}
    </div>
  );
}

function ProjectComments({
  comments,
  draft,
  replyTarget,
  onDraftChange,
  onReply,
  onCancelReply,
  onSubmit,
}: {
  comments: ExplorerProject['comments'];
  draft: string;
  replyTarget: ExplorerProject['comments'][number] | null;
  onDraftChange: (value: string) => void;
  onReply: (comment: ExplorerProject['comments'][number]) => void;
  onCancelReply: () => void;
  onSubmit: () => void;
}) {
  const rootComments = comments
    .filter((comment) => !comment.parentId)
    .sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
  const repliesByParent = comments.reduce<Record<string, ExplorerProject['comments']>>((grouped, comment) => {
    if (!comment.parentId) return grouped;
    grouped[comment.parentId] = grouped[comment.parentId] ?? [];
    grouped[comment.parentId].push(comment);
    return grouped;
  }, {});

  for (const replies of Object.values(repliesByParent)) {
    replies.sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
  }

  return (
    <section className="mx-auto mt-10 max-w-5xl" id="comments">
      <div className="border-b border-[#dbe4ee] pb-3">
        <h2 className="text-lg font-black text-[#0b1724]">Commentaires</h2>
      </div>

      <div className="sticky top-[72px] z-30 mt-0 border-b border-[#dbe4ee] bg-white/95 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/85">
        {replyTarget ? (
          <div className="mb-2 flex items-center justify-between gap-3 bg-[#f4f8fb] px-3 py-2 text-xs font-semibold text-[#52627a]">
            <span className="truncate">Reponse a <strong className="text-[#0b1724]">{replyTarget.authorName}</strong></span>
            <button type="button" onClick={onCancelReply} className="shrink-0 text-[#0f8f6b] transition hover:text-[#0b7558]">Annuler</button>
          </div>
        ) : null}
        <div className="grid gap-2 sm:grid-cols-[1fr_110px]">
          <input
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            className="h-11 border border-[#cfd8e3] bg-white px-3 text-sm outline-none transition focus:border-[#0f8f6b]"
            placeholder={replyTarget ? `Repondre a ${replyTarget.authorName}...` : 'Ajouter un commentaire...'}
          />
          <button type="button" onClick={onSubmit} disabled={!draft.trim()} className="h-11 bg-[#102033] px-4 text-sm font-black text-white transition hover:bg-[#0f8f6b] disabled:cursor-not-allowed disabled:bg-[#a8b4c2]">
            Publier
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        {rootComments.length > 0 ? rootComments.map((comment) => (
          <CommentThread
            key={comment.id}
            comment={comment}
            replies={repliesByParent[comment.id] ?? []}
            onReply={onReply}
          />
        )) : <p className="text-sm text-[#64748b]">Aucun commentaire pour le moment.</p>}
      </div>
    </section>
  );
}

function CommentThread({ comment, replies, onReply }: { comment: ExplorerProject['comments'][number]; replies: ExplorerProject['comments']; onReply: (comment: ExplorerProject['comments'][number]) => void }) {
  return (
    <article className="grid gap-3">
      <CommentCard comment={comment} onReply={onReply} />
      {replies.length > 0 ? (
        <div className="ml-8 grid gap-3 border-l border-[#dbe4ee] pl-4 sm:ml-12">
          {replies.map((reply) => <CommentCard key={reply.id} comment={reply} onReply={onReply} compact />)}
        </div>
      ) : null}
    </article>
  );
}

function CommentCard({ comment, onReply, compact = false }: { comment: ExplorerProject['comments'][number]; onReply: (comment: ExplorerProject['comments'][number]) => void; compact?: boolean }) {
  return (
    <div className="flex gap-3 bg-[#f7fafc] px-3 py-3 text-sm leading-6 text-[#334155]">
      <div className={`${compact ? 'h-8 w-8' : 'h-10 w-10'} grid shrink-0 place-items-center overflow-hidden rounded-full bg-[#102033] text-xs font-black text-white`}>
        {comment.authorAvatarUrl ? <img src={comment.authorAvatarUrl} alt="" className="h-full w-full object-cover" /> : comment.authorName.slice(0, 1).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <strong className="truncate text-sm font-black text-[#0b1724]">{comment.authorName}</strong>
          <CertificationBadge level={comment.authorVerificationLevel ?? 0} />
          <span className="rounded-full bg-[#eefbf6] px-1.5 py-0.5 text-[10px] font-black leading-none text-[#0f8f6b]">{comment.authorBadgeLabel || accountBadgeLabel(comment.authorVerificationLevel ?? 0)}</span>
          <time className="text-xs font-semibold text-[#94a3b8]">{formatCommentDate(comment.createdAt)}</time>
        </div>
        <p className="mt-1 whitespace-pre-line break-words text-[#334155]">{comment.body}</p>
        <button type="button" onClick={() => onReply(comment)} className="mt-1 text-xs font-black text-[#64748b] transition hover:text-[#0f8f6b]">
          Repondre
        </button>
      </div>
    </div>
  );
}

function ProjectDetailState({ title, body }: { title: string; body: string }) {
  return (
    <section className="grid min-h-[360px] place-items-center text-center">
      <div>
        <h1 className="text-xl font-black text-[#0b1724]">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-[#64748b]">{body}</p>
      </div>
    </section>
  );
}

function FollowTinyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M19 8v6" />
      <path d="M22 11h-6" />
    </svg>
  );
}

function CertificationBadge({ level, status }: { level: number; status?: string }) {
  const certified = status === 'verified' || level > 0;
  return (
    <span className={`inline-grid h-5 w-5 shrink-0 place-items-center ${certified ? 'text-[#91a0af]' : 'text-[#a8b4c2]'}`} title={certified ? 'Compte certifie' : 'Nouveau compte'} aria-label={certified ? 'Compte certifie' : 'Nouveau compte'}>
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
        <path d="m23 12-2.44-2.79.34-3.69-3.61-.82L15.4 1.5 12 2.96 8.6 1.5 6.71 4.69l-3.61.82.34 3.69L1 12l2.44 2.79-.34 3.7 3.61.81 1.89 3.2 3.4-1.47 3.4 1.47 1.89-3.19 3.61-.82-.34-3.69L23 12Zm-12.91 4.72-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35Z" />
      </svg>
    </span>
  );
}

function ProjectMedia({ project, className }: { project: ExplorerProject; className: string }) {
  const src = project.imageUrl ? mediaUrl(project.imageUrl) : '';
  const poster = project.thumbnailUrl ? mediaUrl(project.thumbnailUrl) : undefined;
  const isVideo = project.mediaMimeType?.startsWith('video/') || project.mediaKind === 'video';
  return isVideo ? <video src={src} poster={poster} className={className} autoPlay playsInline controls preload="metadata" /> : <img src={src} alt="" className={className} />;
}

function DetailEyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function DetailThumbIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 10v11H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3Z" />
      <path d="M7 10 11 2a3 3 0 0 1 3 3v3h5a2 2 0 0 1 2 2l-1 8a3 3 0 0 1-3 3H7" />
    </svg>
  );
}

function DetailStarIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />
    </svg>
  );
}

function DetailCommentIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 5h14v10H8l-3 3V5Z" />
      <path d="M8 9h8" />
      <path d="M8 12h5" />
    </svg>
  );
}

function PublicLinkIcon({ type }: { type: string }) {
  if (type === 'email') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 6h16v12H4z" />
        <path d="m4 7 8 6 8-6" />
      </svg>
    );
  }

  if (type === 'github') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
        <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.18-3.37-1.18-.45-1.16-1.1-1.47-1.1-1.47-.9-.62.07-.61.07-.61 1 .07 1.53 1.04 1.53 1.04.9 1.52 2.34 1.08 2.91.82.09-.64.35-1.08.64-1.33-2.22-.25-4.56-1.11-4.56-4.94 0-1.1.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.03A9.5 9.5 0 0 1 12 6c.85 0 1.7.11 2.5.34 1.9-1.3 2.74-1.03 2.74-1.03.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
      </svg>
    );
  }

  if (type === 'youtube') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
        <path d="M21.6 7.2s-.2-1.5-.8-2.1c-.8-.8-1.6-.8-2-.9C16 4 12 4 12 4s-4 0-6.8.2c-.4.1-1.3.1-2 .9-.6.6-.8 2.1-.8 2.1S2 9 2 10.8v1.7c0 1.8.4 3.6.4 3.6s.2 1.5.8 2.1c.8.8 1.8.8 2.3.9 1.7.2 6.5.2 6.5.2s4 0 6.8-.2c.4-.1 1.3-.1 2-.9.6-.6.8-2.1.8-2.1s.4-1.8.4-3.6v-1.7c0-1.8-.4-3.6-.4-3.6ZM10 14.8V8.7l5.4 3-5.4 3.1Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" />
      <path d="M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20.1l1.1-1.1" />
    </svg>
  );
}

function formatCompact(value: number) {
  return new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

function accountBadgeLabel(level: number) {
  if (level >= 3) return 'Industriel certifie';
  if (level >= 2) return 'Professionnel certifie';
  if (level >= 1) return 'Compte verifie';
  return 'Nouveau compte';
}

function formatCommentDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
}

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '0 o';
  const units = ['o', 'Ko', 'Mo', 'Go'];
  const index = Math.min(units.length - 1, Math.floor(Math.log(value) / Math.log(1024)));
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: index === 0 ? 0 : 1 }).format(value / 1024 ** index)} ${units[index]}`;
}

function detailValue(record: Record<string, unknown> | undefined, key: string) {
  const value = record?.[key];
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).join(', ');
  return '';
}

function mediaUrl(value: string) {
  return value.startsWith('/api/') ? `${apiBaseUrl}${value}` : value;
}

function readAnonymousActorKey() {
  try {
    const key = 'kendronics.explorer.actor';
    const current = window.localStorage.getItem(key);
    if (current) return current;
    const next = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    window.localStorage.setItem(key, next);
    return next;
  } catch {
    return 'anonymous-reader';
  }
}

function openAuthRequired() {
  window.dispatchEvent(new CustomEvent('kendronics:open-auth-required', { detail: { panel: 'login', step: 'choice' } }));
}

function currentSessionUserId() {
  const session = readAuthSession();
  if (!session?.accessToken) return '';
  try {
    const payload = JSON.parse(window.atob(session.accessToken.split('.')[1] ?? '')) as { sub?: string; userId?: string };
    return payload.sub ?? payload.userId ?? '';
  } catch {
    return '';
  }
}
