'use client';

import { useEffect, useMemo, useState } from 'react';
import { Footer } from '../../components/layout/Footer';
import { Navbar } from '../../components/layout/Navbar';
import { getApiBaseUrl } from '../../lib/api-base-url';
import { readAuthSession } from '../../lib/auth-session';

type ExplorerComment = {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
};

type ExplorerProject = {
  id: string;
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

type MobileExplorerFeed = 'reels' | 'forks' | 'following';

const apiBaseUrl = getApiBaseUrl();
const actorKeyStorageKey = 'kendronics.explorer.actor';
const heroBackgroundImage = '/images/explorer-hero-community.webp';
const categoryNav = ['Tous', 'Stars', 'MakerLab', 'Arduino', 'STM32', 'IoT', 'Energie', 'Robotique', 'Education', 'Prototype'];

const fallbackProjects: ExplorerProject[] = [
  {
    id: 'fallback-power-monitor',
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
    favoritesCount: 0,
    commentsCount: 7,
    forksCount: 18,
    createdAt: '2026-01-12T09:00:00.000Z',
    comments: [{ id: 'c1', authorName: 'MakerLab', body: 'Tres utile pour un kit energie terrain.', createdAt: '2026-01-13T10:00:00.000Z' }],
  },
  {
    id: 'fallback-iot-node',
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
    favoritesCount: 0,
    commentsCount: 5,
    forksCount: 11,
    createdAt: '2026-02-04T14:30:00.000Z',
    comments: [],
  },
  {
    id: 'fallback-solder-kit',
    authorName: 'MakerLab',
    title: 'Kit soudure pedagogique',
    category: 'Education',
    summary: 'Carte simple pour atelier scolaire avec LED, buzzer, connecteurs traversants et zones de test multimetre.',
    tags: ['Education', 'THT', 'Atelier'],
    imageUrl: '/images/quote-product-standard-pcb.png',
    attachmentName: 'solder-kit-v1.zip',
    attachmentType: 'Gerber',
    featured: false,
    viewsCount: 980,
    likesCount: 32,
    favoritesCount: 0,
    commentsCount: 3,
    forksCount: 9,
    createdAt: '2026-03-11T08:20:00.000Z',
    comments: [],
  },
];

export default function ExplorerPage() {
  const [projects, setProjects] = useState<ExplorerProject[]>(fallbackProjects);
  const [activeCategory, setActiveCategory] = useState('Tous');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(fallbackProjects[0]?.id ?? null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [favoriteProjectIds, setFavoriteProjectIds] = useState<Set<string>>(new Set());
  const [followingProjectIds, setFollowingProjectIds] = useState<Set<string>>(new Set());
  const [followingProjects, setFollowingProjects] = useState<ExplorerProject[]>([]);
  const [mobileFeed, setMobileFeed] = useState<MobileExplorerFeed>('reels');
  const isSignedIn = Boolean(readAuthSession());

  useEffect(() => {
    let cancelled = false;

    async function loadProjects() {
      try {
        const response = await fetch(`${apiBaseUrl}/api/explorer/projects`, { cache: 'no-store' });
        if (!response.ok) throw new Error(`Explorer failed: ${response.status}`);
        const payload = (await response.json()) as ExplorerProject[];
        if (cancelled) return;
        const nextProjects = payload.length > 0 ? payload : fallbackProjects;
        setProjects(nextProjects);
        setSelectedProjectId((current) => current ?? nextProjects[0]?.id ?? null);
      } catch {
        if (!cancelled) setProjects(fallbackProjects);
      }
    }

    void loadProjects();
    return () => {
      cancelled = true;
    };
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
      })
      .catch(() => undefined);
  }, []);

  const categories = useMemo(() => {
    const projectCategories = Array.from(new Set(projects.map((project) => project.category))).filter(Boolean);
    return Array.from(new Set([...categoryNav, ...projectCategories]));
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const sourceProjects = mobileFeed === 'following' && followingProjects.length > 0 ? followingProjects : projects;
    const categoryFiltered = sourceProjects
      .filter((project) => {
        if (activeCategory === 'Tous') return true;
        if (activeCategory === 'Stars') return project.featured;
        if (activeCategory === 'MakerLab') return project.authorName.toLowerCase().includes('maker');
        return project.category === activeCategory || project.tags.includes(activeCategory);
      })
      .sort((left, right) => Number(right.featured) - Number(left.featured) || new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

    if (mobileFeed === 'forks') return categoryFiltered.filter((project) => project.projectType === 'paid');
    if (mobileFeed === 'following') return categoryFiltered.filter((project) => followingProjectIds.has(project.id));
    return categoryFiltered;
  }, [activeCategory, followingProjectIds, followingProjects, mobileFeed, projects]);

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

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-[#172033]">
      <div className="hidden lg:block">
        <Navbar />
      </div>

      <MobileExplorerTopNav
        activeFeed={mobileFeed}
        isSignedIn={isSignedIn}
        onFeedChange={setMobileFeed}
      />

      <section className="relative overflow-hidden border-b border-[#d8e1ea] bg-ink pt-[70px] text-white">
        <img src={heroBackgroundImage} alt="" className="absolute inset-0 h-full w-full object-cover object-center opacity-100" />
        <div className="absolute inset-0 bg-gradient-to-br from-ink/[0.46] via-ink/[0.30] to-deepblue/[0.18]" aria-hidden="true" />
        <div className="relative mx-auto max-w-[1368px] px-4 py-8 sm:px-6 sm:py-10 lg:px-5 lg:py-12">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              Plateforme pour creer et partager des projets hardware.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-200 sm:text-base sm:leading-7">
              Publiez PCB, prototypes, fichiers, notes de fabrication et retours terrain. Les visiteurs peuvent consulter, aimer, commenter et transformer un projet en devis.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 sm:gap-3">
              <a href={isSignedIn ? '/profile?view=benefits&create=1' : '#create'} onClick={(event) => { if (!isSignedIn) { event.preventDefault(); openAuthRequired('login'); } }} className="inline-flex h-10 items-center justify-center bg-[#0f8f6b] px-4 text-sm font-black text-white transition hover:bg-[#0b7558] sm:h-11 sm:px-5">Creer un projet</a>
              <a href="#feed" className="inline-flex h-10 items-center justify-center border border-white/25 bg-white/10 px-4 text-sm font-black text-white transition hover:bg-white/15 sm:h-11 sm:px-5">Voir les projets</a>
            </div>
          </div>
        </div>
      </section>

      <section className="sticky top-0 z-40 hidden border-b border-[#d8e1ea] bg-white lg:block">
        <div className="mx-auto flex max-w-[1368px] gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-5">
          {categories.map((item) => (
            <button key={item} type="button" onClick={() => setActiveCategory(item)} className={`h-9 shrink-0 px-3 text-sm font-black transition ${activeCategory === item ? 'bg-[#0f8f6b] text-white' : 'text-[#334155] hover:bg-[#edf3f8]'}`}>
              {item}
            </button>
          ))}
        </div>
      </section>

      <section id="feed" className="mx-auto grid max-w-[1368px] gap-6 px-4 py-8 sm:px-6 lg:px-5">
        <div className="min-w-0">
          <div className="grid gap-x-7 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProjects.length > 0 ? filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                selected={selectedProject?.id === project.id}
                favorited={favoriteProjectIds.has(project.id)}
                onSelect={() => setSelectedProjectId(project.id)}
                onLike={() => void likeProject(project)}
                onFavorite={() => void favoriteProject(project)}
              />
            )) : (
              <div className="col-span-full grid min-h-[220px] place-items-center bg-white px-5 py-10 text-center ring-1 ring-[#d8e1ea]">
                <div>
                  <p className="text-base font-black text-[#0b1724]">Aucun projet dans cette vue.</p>
                  <p className="mt-2 text-sm leading-6 text-[#64748b]">
                    {mobileFeed === 'following' ? 'Les nouvelles publications des profils suivis apparaitront ici.' : 'Les projets correspondants apparaitront ici des leur publication.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="hidden lg:block">
        <Footer />
      </div>
    </main>
  );
}

function MobileExplorerTopNav({ activeFeed, isSignedIn, onFeedChange }: { activeFeed: MobileExplorerFeed; isSignedIn: boolean; onFeedChange: (feed: MobileExplorerFeed) => void }) {
  const feeds: Array<{ id: MobileExplorerFeed; label: string }> = [
    { id: 'reels', label: 'Reels' },
    { id: 'forks', label: 'Forks' },
    { id: 'following', label: 'Suivis' },
  ];

  return (
    <nav className="sticky top-0 z-50 flex h-14 items-center gap-1 overflow-x-auto border-b border-[#d8e1ea] bg-white px-3 lg:hidden" aria-label="Navigation Explorer mobile">
      <a
        href={isSignedIn ? '/profile?view=benefits&create=1' : '#create'}
        onClick={(event) => {
          if (!isSignedIn) {
            event.preventDefault();
            openAuthRequired('login');
          }
        }}
        className="grid h-9 shrink-0 place-items-center bg-[#0f8f6b] px-4 text-sm font-black text-white"
      >
        Creer
      </a>
      {feeds.map((feed) => (
        <button
          key={feed.id}
          type="button"
          onClick={() => onFeedChange(feed.id)}
          className={`h-9 shrink-0 px-4 text-sm font-black transition ${
            activeFeed === feed.id ? 'bg-[#102033] text-white' : 'text-[#102033] hover:bg-[#edf3f8]'
          }`}
        >
          {feed.label}
        </button>
      ))}
    </nav>
  );
}

function ProjectCard({
  project,
  selected,
  favorited,
  onSelect,
  onLike,
  onFavorite,
}: {
  project: ExplorerProject;
  selected: boolean;
  favorited: boolean;
  onSelect: () => void;
  onLike: () => void;
  onFavorite: () => void;
}) {
  return (
    <article className={`min-w-0 bg-transparent transition ${selected ? 'opacity-100' : 'opacity-95 hover:opacity-100'}`}>
      <button type="button" onClick={onSelect} className="block w-full text-left">
        <div className="aspect-[1.45] overflow-hidden bg-[#e8eef5]">
          <img src={project.imageUrl || '/images/quote-product-standard-pcb.png'} alt="" className="h-full w-full object-cover transition duration-300 hover:scale-[1.02]" />
        </div>
        <div className="mt-3 flex min-w-0 items-center gap-2">
          <span className={`shrink-0 px-2 py-1 text-xs font-bold leading-none ${project.projectType === 'paid' ? 'bg-[#fff1e6] text-[#c45100]' : 'bg-[#e7f5f0] text-[#0f8f6b]'}`}>
            {project.projectType === 'paid' ? formatProjectPrice(project.priceCents, project.currency) : 'GRATUIT'}
          </span>
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
      <div className="mt-4 flex items-center gap-2 text-sm text-[#0b1724]">
        <span className="grid h-5 w-5 shrink-0 place-items-center overflow-hidden rounded-full bg-[#0b1724] text-[10px] font-black text-white">
          {project.authorAvatarUrl ? <img src={project.authorAvatarUrl} alt="" className="h-full w-full object-cover" /> : project.authorName.slice(0, 1).toUpperCase()}
        </span>
        <span className="min-w-0 truncate">{project.authorName}</span>
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
        <span className={project.projectType === 'paid' ? 'bg-[#fff1e6] px-2 py-1 text-[#c45100]' : 'bg-[#e7f5f0] px-2 py-1 text-[#0f8f6b]'}>
          {project.projectType === 'paid' ? formatProjectPrice(project.priceCents, project.currency) : 'Projet gratuit'}
        </span>
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
  if (!priceCents) return 'PAYANT';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 2 }).format(priceCents / 100);
}
