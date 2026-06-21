'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { getApiBaseUrl } from '../../lib/api-base-url';
import { readAuthSession } from '../../lib/auth-session';
import { readScopedLocalStorage } from '../../lib/user-scoped-storage';

type ExplorerComment = {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
};

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
  attachmentName?: string;
  attachmentType?: string;
  repositoryUrl?: string;
  projectType?: 'free' | 'paid';
  priceCents?: number;
  currency?: string;
  licenseCode?: string;
  allowedUses?: string[];
  featured: boolean;
  viewsCount: number;
  likesCount: number;
  favoritesCount: number;
  commentsCount: number;
  forksCount: number;
  createdAt: string;
  comments: ExplorerComment[];
};

type ProjectAssetDownload = {
  id: string;
  originalName: string;
  downloadUrl: string;
};

type MobileExplorerFeed = 'reels' | 'forks' | 'following';

const apiBaseUrl = getApiBaseUrl();
const actorKeyStorageKey = 'kendronics.explorer.actor';
const avatarStorageKey = 'kendronics.customer.avatar';
const heroBackgroundImage = '/images/explorer-hero-community.webp';
export default function ExplorerPage() {
  const [projects, setProjects] = useState<ExplorerProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [favoriteProjectIds, setFavoriteProjectIds] = useState<Set<string>>(new Set());
  const [followingProjectIds, setFollowingProjectIds] = useState<Set<string>>(new Set());
  const [followingProjects, setFollowingProjects] = useState<ExplorerProject[]>([]);
  const [followedUserIds, setFollowedUserIds] = useState<Set<string>>(new Set());
  const [followPulseUserIds, setFollowPulseUserIds] = useState<Set<string>>(new Set());
  const [mobileFeed, setMobileFeed] = useState<MobileExplorerFeed>('reels');
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [projectLoadStatus, setProjectLoadStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [avatarDataUrl, setAvatarDataUrl] = useState('');
  const [isFeedNavVisible, setIsFeedNavVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const isSignedIn = Boolean(readAuthSession());

  useEffect(() => {
    let cancelled = false;

    async function loadProjects() {
      try {
        const response = await fetch(`${apiBaseUrl}/api/explorer/projects`, { cache: 'no-store' });
        if (!response.ok) throw new Error(`Explorer failed: ${response.status}`);
        const payload = (await response.json()) as ExplorerProject[];
        if (cancelled) return;
        setProjects(payload);
        setSelectedProjectId((current) => current ?? payload[0]?.id ?? null);
        setProjectLoadStatus('ready');
      } catch {
        if (!cancelled) {
          setProjects([]);
          setProjectLoadStatus('error');
        }
      }
    }

    void loadProjects();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setAvatarDataUrl(readScopedLocalStorage(avatarStorageKey) || '');

    function updateAvatar() {
      setAvatarDataUrl(readScopedLocalStorage(avatarStorageKey) || '');
    }

    window.addEventListener('kendronics:avatar-updated', updateAvatar);
    window.addEventListener('kendronics:auth-updated', updateAvatar);
    return () => {
      window.removeEventListener('kendronics:avatar-updated', updateAvatar);
      window.removeEventListener('kendronics:auth-updated', updateAvatar);
    };
  }, []);

  useEffect(() => {
    function handleScroll() {
      const currentY = window.scrollY;
      const lastY = lastScrollYRef.current;
      if (currentY < 12 || currentY < lastY - 8) {
        setIsFeedNavVisible(true);
      } else if (currentY > lastY + 8 && currentY > 72) {
        setIsFeedNavVisible(false);
      }
      lastScrollYRef.current = currentY;
    }

    lastScrollYRef.current = window.scrollY;
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const session = readAuthSession();
    if (!session) return;
    fetch(`${apiBaseUrl}/api/explorer/me/favorites`, {
      headers: { Authorization: `${session.tokenType} ${session.accessToken}` },
      cache: 'no-store',
    })
      .then((response) => response.ok ? response.json() : [])
      .then((payload: ExplorerProject[]) => setFavoriteProjectIds(new Set(payload.map((project) => project.id))))
      .catch(() => undefined);

    fetch(`${apiBaseUrl}/api/explorer/me/following/projects`, {
      headers: { Authorization: `${session.tokenType} ${session.accessToken}` },
      cache: 'no-store',
    })
      .then((response) => response.ok ? response.json() : [])
      .then((payload: ExplorerProject[]) => {
        setFollowingProjectIds(new Set(payload.map((project) => project.id)));
        setFollowingProjects(payload);
        setFollowedUserIds(new Set(payload.map((project) => project.userId).filter((userId): userId is string => Boolean(userId))));
      })
      .catch(() => undefined);
  }, []);

  const filteredProjects = useMemo(() => {
    const sourceProjects = mobileFeed === 'following' && followingProjects.length > 0 ? followingProjects : projects;
    const categoryFiltered = [...sourceProjects]
      .sort((left, right) => Number(right.featured) - Number(left.featured) || new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

    if (mobileFeed === 'forks') return categoryFiltered.filter((project) => project.projectType === 'paid');
    if (mobileFeed === 'following') return categoryFiltered.filter((project) => followingProjectIds.has(project.id));
    return categoryFiltered;
  }, [followingProjectIds, followingProjects, mobileFeed, projects]);

  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? filteredProjects[0] ?? projects[0];

  async function likeProject(project: ExplorerProject) {
    const actorKey = readActorKey();
    const session = readAuthSession();
    try {
      const response = await fetch(`${apiBaseUrl}/api/explorer/projects/${project.id}/likes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session ? { Authorization: `${session.tokenType} ${session.accessToken}` } : {}),
        },
        body: JSON.stringify({ actorKey }),
      });
      if (!response.ok) throw new Error('Like failed');
      const payload = (await response.json()) as { liked: boolean; likesCount: number };
      setProjects((current) => current.map((item) => (item.id === project.id ? { ...item, likesCount: payload.likesCount } : item)));
    } catch {
      // Keep the persisted server state if the request fails.
    }
  }

  async function postComment(project: ExplorerProject) {
    const body = (commentDrafts[project.id] ?? '').trim();
    if (!body) return;
    const session = readAuthSession();

    try {
      const response = await fetch(`${apiBaseUrl}/api/explorer/projects/${project.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session ? { Authorization: `${session.tokenType} ${session.accessToken}` } : {}),
        },
        body: JSON.stringify({ body }),
      });
      if (!response.ok) throw new Error('Comment failed');
      const updated = (await response.json()) as ExplorerProject;
      setProjects((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setCommentDrafts((current) => ({ ...current, [project.id]: '' }));
    } catch {
      setCommentDrafts((current) => ({ ...current, [project.id]: '' }));
    }
  }

  async function favoriteProject(project: ExplorerProject) {
    const session = readAuthSession();
    if (!session) {
      openAuthRequired('login');
      return;
    }
    try {
      const response = await fetch(`${apiBaseUrl}/api/explorer/projects/${project.id}/favorites`, {
        method: 'POST',
        headers: { Authorization: `${session.tokenType} ${session.accessToken}` },
      });
      if (!response.ok) throw new Error('Favorite failed');
      const payload = await response.json() as { favorited: boolean; favoritesCount: number };
      setFavoriteProjectIds((current) => {
        const next = new Set(current);
        if (payload.favorited) next.add(project.id);
        else next.delete(project.id);
        return next;
      });
      setProjects((current) => current.map((item) => item.id === project.id ? { ...item, favoritesCount: payload.favoritesCount } : item));
    } catch {
      // The visible state remains synchronized with the persisted API response.
    }
  }

  async function followAuthor(project: ExplorerProject) {
    const session = readAuthSession();
    if (!session) {
      openAuthRequired('login');
      return;
    }
    if (!project.userId) return;

    try {
      const response = await fetch(`${apiBaseUrl}/api/users/${project.userId}/follow`, {
        method: 'POST',
        headers: { Authorization: `${session.tokenType} ${session.accessToken}` },
      });
      if (!response.ok) throw new Error('Follow failed');
      const payload = await response.json() as { following: boolean };
      setFollowedUserIds((current) => {
        const next = new Set(current);
        if (payload.following) next.add(project.userId as string);
        else next.delete(project.userId as string);
        return next;
      });
      if (payload.following) {
        setFollowPulseUserIds((current) => new Set(current).add(project.userId as string));
        window.setTimeout(() => {
          setFollowPulseUserIds((current) => {
            const next = new Set(current);
            next.delete(project.userId as string);
            return next;
          });
        }, 900);
      }
    } catch {
      // Keep the visible follow state unchanged if the API rejects the action.
    }
  }

  async function buyProject(project: ExplorerProject) {
    const session = readAuthSession();
    if (!session) {
      openAuthRequired('login');
      return;
    }
    if (project.projectType !== 'paid') return;

    try {
      const purchaseResponse = await fetch(`${apiBaseUrl}/api/explorer/projects/${project.id}/purchases`, {
        method: 'POST',
        headers: { Authorization: `${session.tokenType} ${session.accessToken}` },
      });
      if (!purchaseResponse.ok) throw new Error('Purchase intent failed');
      const purchase = await purchaseResponse.json() as { id: string };
      const checkoutResponse = await fetch(`${apiBaseUrl}/api/payments/project-checkout`, {
        method: 'POST',
        headers: {
          Authorization: `${session.tokenType} ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          purchaseId: purchase.id,
          successUrl: `${window.location.origin}/explorer?purchase=success`,
          cancelUrl: `${window.location.origin}/explorer?purchase=cancelled`,
        }),
      });
      if (!checkoutResponse.ok) throw new Error('Checkout failed');
      const checkout = await checkoutResponse.json() as { checkoutUrl?: string };
      if (checkout.checkoutUrl) window.location.href = checkout.checkoutUrl;
    } catch {
      // The marketplace state remains unchanged if checkout cannot be created.
    }
  }

  async function downloadProjectAssets(project: ExplorerProject) {
    const session = readAuthSession();
    if (!session) {
      openAuthRequired('login');
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/explorer/projects/${project.id}/assets/downloads`, {
        headers: { Authorization: `${session.tokenType} ${session.accessToken}` },
        cache: 'no-store',
      });
      if (response.status === 403 && project.projectType === 'paid') {
        await buyProject(project);
        return;
      }
      if (!response.ok) throw new Error('Downloads unavailable');
      const downloads = await response.json() as ProjectAssetDownload[];
      downloads.slice(0, 4).forEach((asset, index) => {
        window.setTimeout(() => window.open(asset.downloadUrl, '_blank', 'noopener,noreferrer'), index * 120);
      });
    } catch {
      // Keep the user on the current page if protected assets cannot be opened.
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-[#172033]">
      <div className="hidden lg:block">
        <Navbar />
      </div>
      <div className="lg:hidden">
        <Navbar hideHeader />
      </div>

      <section className="relative hidden overflow-hidden border-b border-[#d8e1ea] bg-ink pt-[70px] text-white lg:block">
        <img src={heroBackgroundImage} alt="" className="absolute inset-0 h-full w-full object-cover object-center opacity-100" />
        <div className="absolute inset-0 bg-gradient-to-br from-ink/[0.46] via-ink/[0.30] to-deepblue/[0.18]" aria-hidden="true" />
        <div className="relative mx-auto max-w-[1368px] px-4 py-8 sm:px-6 sm:py-10 lg:px-5 lg:pb-12 lg:pt-24">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              Plateforme pour creer et partager des projets hardware.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-200 sm:text-base sm:leading-7">
              Publiez PCB, prototypes, fichiers, notes de fabrication et retours terrain. Les visiteurs peuvent consulter, aimer, commenter et transformer un projet en devis.
            </p>
          </div>
        </div>
      </section>

      <ExplorerFeedNav
        activeFeed={mobileFeed}
        avatarDataUrl={avatarDataUrl}
        visible={isFeedNavVisible}
        onCreate={() => {
          if (!isSignedIn) {
            openAuthRequired('login');
            return;
          }
          setIsCreateProjectOpen(true);
        }}
        onFeedChange={setMobileFeed}
      />

      <div className="h-14 lg:hidden" aria-hidden="true" />

      <section id="feed" className="mx-auto grid max-w-[1368px] gap-6 px-4 py-8 sm:px-6 lg:px-5">
        <div className="min-w-0">
          <div className="grid gap-x-7 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {projectLoadStatus === 'loading' ? (
              <ExplorerStateCard title="Chargement des projets" body="Explorer recupere les publications disponibles." />
            ) : projectLoadStatus === 'error' ? (
              <ExplorerStateCard title="Explorer est momentanement indisponible" body="Les projets publics n'ont pas pu etre charges. Reessayez dans quelques instants." />
            ) : filteredProjects.length > 0 ? filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                selected={selectedProject?.id === project.id}
                favorited={favoriteProjectIds.has(project.id)}
                onSelect={() => setSelectedProjectId(project.id)}
                onLike={() => void likeProject(project)}
                onFavorite={() => void favoriteProject(project)}
                onFollow={() => void followAuthor(project)}
                onBuy={() => void buyProject(project)}
                onDownload={() => void downloadProjectAssets(project)}
                followed={project.userId ? followedUserIds.has(project.userId) : false}
                followAnimating={project.userId ? followPulseUserIds.has(project.userId) : false}
                followable={Boolean(project.userId)}
              />
            )) : (
              <ExplorerStateCard
                title="Aucun projet dans cette vue"
                body={mobileFeed === 'following' ? 'Les nouvelles publications des profils suivis apparaitront ici.' : 'Les projets publies apparaitront ici des qu ils seront disponibles.'}
              />
            )}
          </div>
        </div>
      </section>

      {isCreateProjectOpen ? <CreateProjectModal onClose={() => setIsCreateProjectOpen(false)} /> : null}
    </main>
  );
}

function ExplorerFeedNav({ activeFeed, avatarDataUrl, visible, onCreate, onFeedChange }: { activeFeed: MobileExplorerFeed; avatarDataUrl: string; visible: boolean; onCreate: () => void; onFeedChange: (feed: MobileExplorerFeed) => void }) {
  const feeds: Array<{ id: MobileExplorerFeed; label: string; icon: ReactNode }> = [
    { id: 'reels', label: 'Reels', icon: <ReelsNavIcon /> },
    { id: 'forks', label: 'Forks', icon: <ForksNavIcon /> },
    { id: 'following', label: 'Suivis', icon: <FollowingNavIcon /> },
  ];

  return (
    <nav className={`fixed left-0 right-0 top-0 z-[60] flex h-14 items-center gap-1 overflow-x-auto border-b border-[#d8e1ea] bg-white px-3 shadow-[0_1px_2px_rgba(11,23,36,0.04),0_12px_34px_rgba(11,23,36,0.035)] transition-transform duration-300 lg:sticky lg:top-[70px] lg:z-40 lg:h-auto lg:translate-y-0 lg:px-5 lg:py-3 ${visible ? 'translate-y-0' : '-translate-y-full'}`} aria-label="Navigation Explorer">
      <button
        type="button"
        onClick={onCreate}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#0f8f6b] text-white transition hover:bg-[#0b7558]"
        aria-label="Créer un projet"
        title="Créer"
      >
        <CreateNavIcon />
      </button>
      {feeds.map((feed) => (
        <button
          key={feed.id}
          type="button"
          onClick={() => onFeedChange(feed.id)}
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition ${
            activeFeed === feed.id ? 'bg-[#102033] text-white' : 'text-[#102033] hover:bg-[#edf3f8]'
          }`}
          aria-label={feed.label}
          title={feed.label}
        >
          {feed.icon}
        </button>
      ))}
      <a href="/projects/new" className="ml-auto grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-[#eaf3f7]" aria-label="Ouvrir la page projets" title="Projets">
        <img src={avatarDataUrl || '/images/kendronics-icon.jpeg'} alt="" className="h-full w-full rounded-full object-cover" />
      </a>
    </nav>
  );
}

function CreateNavIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function ReelsNavIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="5" width="16" height="14" rx="3" />
      <path d="m9 5 2 4M15 5l2 4M4.5 9h15" />
      <path d="m10.5 12 4 2.5-4 2.5v-5Z" />
    </svg>
  );
}

function ForksNavIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="12" cy="18" r="2.5" />
      <path d="M6 8.5v2.2A3.3 3.3 0 0 0 9.3 14H12M18 8.5v2.2a3.3 3.3 0 0 1-3.3 3.3H12M12 14v1.5" />
    </svg>
  );
}

function FollowingNavIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z" />
      <path d="M4.5 20c.8-3.2 3.5-5 7.5-5 1.3 0 2.5.2 3.5.7" />
      <path d="m17 18 2 2 3.5-4" />
    </svg>
  );
}

function ExplorerStateCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="col-span-full grid min-h-[220px] place-items-center bg-white px-5 py-10 text-center ring-1 ring-[#d8e1ea]">
      <div>
        <p className="text-base font-black text-[#0b1724]">{title}</p>
        <p className="mt-2 max-w-md text-sm leading-6 text-[#64748b]">{body}</p>
      </div>
    </div>
  );
}

function CreateProjectModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-[#07172a]/45 px-4" role="dialog" aria-modal="true" aria-labelledby="explorer-project-type-title">
      <div className="w-full max-w-[548px] rounded-[18px] bg-white p-5 shadow-[0_24px_70px_rgba(7,23,42,0.24)] ring-1 ring-white/70 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#0f8f6b]">Nouveau projet</p>
            <h2 id="explorer-project-type-title" className="mt-2 text-2xl font-black text-[#102033]">Choisissez le type de publication</h2>
            <p className="mt-2 text-sm leading-6 text-[#64748b]">Vous pourrez enregistrer un brouillon et verifier chaque parametre avant la publication.</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#dbe4ee] text-xl text-[#64748b]" aria-label="Fermer">×</button>
        </div>
        <div className="mt-6 grid gap-3">
          <a href="/projects/new?type=paid" className="group flex min-h-[96px] items-center gap-4 rounded-[14px] border border-[#cfd8e3] bg-white p-4 shadow-[0_8px_22px_rgba(15,35,52,0.06)] transition hover:border-[#0f8f6b] hover:bg-[#f4fbf8] sm:p-5">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#e5f6f0] text-[#0f8f6b]"><PaidProjectIcon /></span>
            <span>
              <strong className="block text-lg text-[#102033]">Creer un nouveau projet</strong>
              <span className="mt-1 block text-sm leading-5 text-[#64748b]">Publication commerciale avec fichiers proteges, prix, licence et droits d'utilisation.</span>
            </span>
          </a>
          <a href="/projects/new?type=free" className="group flex min-h-[96px] items-center gap-4 rounded-[14px] border border-[#cfd8e3] bg-white p-4 shadow-[0_8px_22px_rgba(15,35,52,0.06)] transition hover:border-[#0877ff] hover:bg-[#f4f8ff] sm:p-5">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#eaf2ff] text-[#0877ff]"><OpenProjectIcon /></span>
            <span>
              <strong className="block text-lg text-[#102033]">Publier un projet</strong>
              <span className="mt-1 block text-sm leading-5 text-[#64748b]">Publication ouverte partagee avec la communaute sous une licence libre.</span>
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}

function ProjectCard({
  project,
  selected,
  favorited,
  followed,
  followAnimating,
  followable,
  onSelect,
  onLike,
  onFavorite,
  onFollow,
  onBuy,
  onDownload,
}: {
  project: ExplorerProject;
  selected: boolean;
  favorited: boolean;
  followed: boolean;
  followAnimating: boolean;
  followable: boolean;
  onSelect: () => void;
  onLike: () => void;
  onFavorite: () => void;
  onFollow: () => void;
  onBuy: () => void;
  onDownload: () => void;
}) {
  return (
    <article className={`min-w-0 bg-transparent transition ${selected ? 'opacity-100' : 'opacity-95 hover:opacity-100'}`}>
      <button type="button" onClick={onSelect} className="block w-full text-left">
        <div className="aspect-[1.45] overflow-hidden bg-[#e8eef5]">
          <img src={project.imageUrl || '/images/quote-product-standard-pcb.png'} alt="" className="h-full w-full object-cover transition duration-300 hover:scale-[1.02]" />
        </div>
        <div className="mt-3 flex min-w-0 items-center">
          <h3 className="min-w-0 truncate text-base font-medium text-[#0b1724]">{project.title}</h3>
        </div>
      </button>
      <div className="mt-3 flex items-center gap-4 text-sm text-[#9aa6b2]">
        <span className="inline-flex items-center gap-1"><EyeIcon />{formatCompact(project.viewsCount)}</span>
        <button type="button" onClick={onLike} className="inline-flex items-center gap-1 transition hover:text-[#0f8f6b]"><ThumbIcon />{project.likesCount}</button>
        <button type="button" onClick={onFavorite} className={`inline-flex items-center gap-1 transition hover:text-[#0f8f6b] ${favorited ? 'text-[#0f8f6b]' : ''}`} aria-label={favorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}>
          <StarIcon filled={favorited} />{project.favoritesCount}
        </button>
        <span className="inline-flex items-center gap-1"><CommentIcon />{project.commentsCount}</span>
      </div>
      {project.projectType === 'paid' ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" onClick={onBuy} className="h-9 bg-[#102033] px-3 text-sm font-black text-white transition hover:bg-[#0f8f6b]">
            Acheter
          </button>
          <button type="button" onClick={onDownload} className="h-9 border border-[#102033] bg-white px-3 text-sm font-black text-[#102033] transition hover:border-[#0f8f6b] hover:text-[#0f8f6b]">
            Fichiers
          </button>
        </div>
      ) : null}
      <div className="mt-4 flex items-center gap-2 text-sm text-[#0b1724]">
        <span className="grid h-5 w-5 shrink-0 place-items-center overflow-hidden rounded-full bg-[#0b1724] text-[10px] font-black text-white">
          {project.authorAvatarUrl ? <img src={project.authorAvatarUrl} alt="" className="h-full w-full object-cover" /> : project.authorName.slice(0, 1).toUpperCase()}
        </span>
        <span className="min-w-0 max-w-[calc(100%-3.25rem)] truncate">{project.authorName}</span>
        <button
          type="button"
          onClick={onFollow}
          disabled={!followable}
          className={`explorer-follow-action grid h-6 w-6 shrink-0 place-items-center bg-transparent transition ${
            followed ? 'text-[#0f8f6b]' : 'text-[#9aa6b2] hover:text-[#0f8f6b]'
          } ${followAnimating ? 'explorer-follow-action--done' : ''} ${followable ? '' : 'cursor-not-allowed opacity-55'}`}
          aria-label={followed ? `Ne plus suivre ${project.authorName}` : `Suivre ${project.authorName}`}
          title={followable ? undefined : 'Auteur non connecte au suivi'}
        >
          {followed ? <MaterialArrowForwardIcon /> : <MaterialAddIcon />}
        </button>
      </div>
    </article>
  );
}

function ProjectDetailPanel({ project, commentValue, onCommentChange, onComment, onLike }: { project: ExplorerProject; commentValue: string; onCommentChange: (value: string) => void; onComment: () => void; onLike: () => void }) {
  return (
    <section className="bg-white p-4 ring-1 ring-[#d8e1ea]">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center bg-[#0b1220] text-sm font-black text-white">{project.authorName.slice(0, 1).toUpperCase()}</span>
        <div className="min-w-0">
          <h2 className="text-base font-black text-[#07111f]">{project.title}</h2>
          <p className="mt-1 text-xs font-bold text-[#64748b]">{project.authorName} - {formatDate(project.createdAt)}</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-[#526173]">{project.description || project.summary}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
        {project.projectType === 'paid' ? <span className="bg-[#fff1e6] px-2 py-1 text-[#c45100]">{formatProjectPrice(project.priceCents, project.currency)}</span> : null}
        {project.licenseCode ? <span className="bg-[#eef3f8] px-2 py-1 text-[#526173]">{project.licenseCode}</span> : null}
      </div>
      <div className="mt-4 grid grid-cols-4 border border-[#edf2f7] text-center text-xs">
        <PanelMetric label="Vues" value={formatCompact(project.viewsCount)} />
        <PanelMetric label="Likes" value={String(project.likesCount)} />
        <PanelMetric label="Forks" value={String(project.forksCount)} />
        <PanelMetric label="Avis" value={String(project.commentsCount)} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={onLike} className="h-10 bg-[#0f8f6b] text-sm font-black text-white">Like</button>
        <a href="/quote" className="grid h-10 place-items-center border border-[#0f8f6b] text-sm font-black text-[#0f8f6b]">Commander PCB</a>
      </div>
      {project.attachmentName ? <p className="mt-4 truncate bg-[#f7fafc] px-3 py-2 text-xs font-bold text-[#526173]">{project.attachmentType || 'Fichier'} : {project.attachmentName}</p> : null}
      <div className="mt-4 border-t border-[#edf2f7] pt-4">
        <h3 className="text-sm font-black">Commentaires</h3>
        <div className="mt-3 grid gap-2">
          {project.comments.length > 0 ? project.comments.map((comment) => (
            <div key={comment.id} className="bg-[#f7fafc] p-2 text-xs leading-5 text-[#526173]">
              <strong className="text-[#172033]">{comment.authorName}</strong> {comment.body}
            </div>
          )) : <p className="text-xs text-[#94a3b8]">Aucun commentaire recent.</p>}
        </div>
        <div className="mt-3 grid grid-cols-[1fr_70px] gap-2">
          <input value={commentValue} onChange={(event) => onCommentChange(event.target.value)} className="h-9 border border-[#d8e1ea] px-2 text-xs font-semibold outline-none focus:border-[#0f8f6b]" placeholder="Commenter..." />
          <button type="button" onClick={onComment} className="h-9 bg-[#0b1220] text-xs font-black text-white">OK</button>
        </div>
      </div>
    </section>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function ThumbIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 10v10" />
      <path d="M7 10 11 3a2 2 0 0 1 3 2l-1 4h5a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 16.8 20H7" />
      <path d="M3 10h4v10H3z" />
    </svg>
  );
}

function StarIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 5h14v10H8l-3 3V5Z" />
      <path d="M8 9h8" />
      <path d="M8 12h5" />
    </svg>
  );
}

function PanelMetric({ label, value }: { label: string; value: string }) {
  return (
    <span className="grid gap-1 border-r border-[#edf2f7] py-2 last:border-r-0">
      <strong className="text-sm text-[#07111f]">{value}</strong>
      <span className="text-[10px] uppercase tracking-[0.12em] text-[#94a3b8]">{label}</span>
    </span>
  );
}

function PaidProjectIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M12 2 4 5v6c0 5.1 3.4 9.4 8 11 4.6-1.6 8-5.9 8-11V5l-8-3Zm1 14h-2v-1.2a4.4 4.4 0 0 1-2.4-1.1l1.1-1.5c.8.6 1.5.9 2.3.9.9 0 1.4-.3 1.4-.9 0-.7-.7-.9-1.9-1.2-1.5-.4-2.6-1-2.6-2.5 0-1.3.9-2.3 2.1-2.6V4.7h2V6c.8.2 1.5.5 2.1 1l-1 1.5c-.6-.4-1.2-.7-1.9-.7-.8 0-1.2.3-1.2.8 0 .6.6.8 1.8 1.1 1.6.4 2.7 1 2.7 2.6 0 1.4-1 2.4-2.5 2.7V16Z" />
    </svg>
  );
}

function OpenProjectIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M19.4 10.04A7.5 7.5 0 0 0 4.9 8.5 5.5 5.5 0 0 0 5.5 19H11v-2H5.5a3.5 3.5 0 0 1-.38-6.98l1.24-.13.29-1.22A5.5 5.5 0 0 1 17.5 10.5v1.5H19a2.5 2.5 0 0 1 0 5h-4v2h4a4.5 4.5 0 0 0 .4-8.96ZM13 13.83V22h-2v-8.17l-2.59 2.58L7 15l5-5 5 5-1.41 1.41L13 13.83Z" />
    </svg>
  );
}

function MaterialAddIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden="true">
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2Z" />
    </svg>
  );
}

function MaterialArrowForwardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden="true">
      <path d="m12 4-1.41 1.41L15.17 10H4v2h11.17l-4.58 4.59L12 18l7-7-7-7Z" />
    </svg>
  );
}

function readActorKey() {
  try {
    const current = window.localStorage.getItem(actorKeyStorageKey);
    if (current) return current;
    const next = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    window.localStorage.setItem(actorKeyStorageKey, next);
    return next;
  } catch {
    return 'anonymous-reader';
  }
}

function openAuthRequired(panel: 'register' | 'login' = 'login') {
  window.dispatchEvent(new CustomEvent('kendronics:open-auth-required', { detail: { panel, step: 'choice' } }));
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
  } catch {
    return '';
  }
}

function formatCompact(value: number) {
  return new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

function formatProjectPrice(priceCents?: number, currency = 'EUR') {
  if (!priceCents) return 'Commercial';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 2 }).format(priceCents / 100);
}
