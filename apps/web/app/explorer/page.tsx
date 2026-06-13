'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
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
  featured: boolean;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  forksCount: number;
  createdAt: string;
  comments: ExplorerComment[];
};

type FeedMode = 'recommended' | 'latest' | 'likes';
type SubmitState = 'idle' | 'submitting' | 'published' | 'error';

const apiBaseUrl = getApiBaseUrl();
const actorKeyStorageKey = 'kendronics.explorer.actor';
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
    commentsCount: 3,
    forksCount: 9,
    createdAt: '2026-03-11T08:20:00.000Z',
    comments: [],
  },
];

const categoryNav = ['Tous', 'Stars', 'MakerLab', 'Arduino', 'STM32', 'IoT', 'Energie', 'Robotique', 'Education', 'Prototype'];
const collections = [
  ['Stars 2026', 'Selection annuelle de projets publics Kendronics.', '128 projets'],
  ['MakerLab', 'Prototypes reproductibles pour ateliers et laboratoires.', '214 projets'],
  ['Education', 'Kits, supports de cours et cartes pedagogiques.', '32 projets'],
  ['Multi-couleur', 'PCB artistiques et finitions visuelles avancees.', '76 projets'],
];

export default function ExplorerPage() {
  const [projects, setProjects] = useState<ExplorerProject[]>(fallbackProjects);
  const [status, setStatus] = useState<'loading' | 'ready' | 'offline'>('loading');
  const [activeCategory, setActiveCategory] = useState('Tous');
  const [feedMode, setFeedMode] = useState<FeedMode>('recommended');
  const [query, setQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(fallbackProjects[0]?.id ?? null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [draft, setDraft] = useState({
    title: '',
    category: 'Prototype',
    summary: '',
    description: '',
    tags: '',
    imageUrl: '',
    attachmentName: '',
    attachmentType: 'Gerber',
    repositoryUrl: '',
  });

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
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('offline');
      }
    }

    void loadProjects();
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    const projectCategories = Array.from(new Set(projects.map((project) => project.category))).filter(Boolean);
    return Array.from(new Set([...categoryNav, ...projectCategories]));
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const scoped = projects.filter((project) => {
      const categoryMatch = activeCategory === 'Tous'
        ? true
        : activeCategory === 'Stars'
        ? project.featured
        : activeCategory === 'MakerLab'
          ? project.authorName.toLowerCase().includes('maker')
          : project.category === activeCategory || project.tags.includes(activeCategory);
      const searchable = `${project.title} ${project.authorName} ${project.summary} ${project.tags.join(' ')}`.toLowerCase();
      return categoryMatch && (!normalizedQuery || searchable.includes(normalizedQuery));
    });

    return scoped.sort((left, right) => {
      if (feedMode === 'latest') return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      if (feedMode === 'likes') return right.likesCount - left.likesCount;
      return Number(right.featured) - Number(left.featured) || right.likesCount - left.likesCount;
    });
  }, [activeCategory, feedMode, projects, query]);

  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? filteredProjects[0] ?? projects[0];
  const featured = projects.filter((project) => project.featured).slice(0, 4);
  const latest = [...projects].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()).slice(0, 5);
  const totals = {
    projects: projects.length,
    likes: projects.reduce((sum, project) => sum + project.likesCount, 0),
    comments: projects.reduce((sum, project) => sum + project.commentsCount, 0),
    forks: projects.reduce((sum, project) => sum + project.forksCount, 0),
  };

  async function publishProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const session = readAuthSession();
    if (!session) {
      openAuthRequired('login');
      return;
    }

    setSubmitState('submitting');
    try {
      const response = await fetch(`${apiBaseUrl}/api/explorer/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `${session.tokenType} ${session.accessToken}`,
        },
        body: JSON.stringify({
          title: draft.title,
          category: draft.category,
          summary: draft.summary,
          description: draft.description || undefined,
          tags: draft.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
          imageUrl: draft.imageUrl || undefined,
          attachmentName: draft.attachmentName || undefined,
          attachmentType: draft.attachmentType || undefined,
          repositoryUrl: draft.repositoryUrl || undefined,
        }),
      });
      if (!response.ok) throw new Error(`Publish failed: ${response.status}`);
      const project = (await response.json()) as ExplorerProject;
      setProjects((current) => [project, ...current]);
      setSelectedProjectId(project.id);
      setDraft({ title: '', category: 'Prototype', summary: '', description: '', tags: '', imageUrl: '', attachmentName: '', attachmentType: 'Gerber', repositoryUrl: '' });
      setSubmitState('published');
    } catch {
      setSubmitState('error');
    }
  }

  async function likeProject(project: ExplorerProject) {
    const actorKey = readActorKey();
    try {
      const response = await fetch(`${apiBaseUrl}/api/explorer/projects/${project.id}/likes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorKey }),
      });
      if (!response.ok) throw new Error('Like failed');
      const payload = (await response.json()) as { likesCount: number };
      setProjects((current) => current.map((item) => (item.id === project.id ? { ...item, likesCount: payload.likesCount } : item)));
    } catch {
      setProjects((current) => current.map((item) => (item.id === project.id ? { ...item, likesCount: item.likesCount + 1 } : item)));
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

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-[#172033]">
      <Navbar />

      <section className="border-b border-[#d8e1ea] bg-[#0b1220] pt-[70px] text-white">
        <div className="mx-auto grid max-w-[1368px] gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-white/70">
              {['Home', 'Explore', 'Activity', 'Article', 'Post', 'Forum'].map((item) => (
                <a key={item} href={item === 'Home' ? '/' : '#feed'} className="px-2 py-1 transition hover:text-white">{item}</a>
              ))}
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
              <div className="flex min-h-[280px] flex-col justify-end">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#16c784]">Kendronics Explorer</p>
                <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                  Plateforme pour creer et partager des projets hardware.
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#cbd5e1] sm:text-base">
                  Publiez PCB, prototypes, fichiers, notes de fabrication et retours terrain. Les visiteurs explorent, aiment, commentent et transforment un projet en devis.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a href="#create" className="inline-flex h-11 items-center justify-center bg-[#16c784] px-5 text-sm font-black text-[#061014] transition hover:bg-[#11b374]">+ Creer</a>
                  <a href="#feed" className="inline-flex h-11 items-center justify-center border border-white/20 px-5 text-sm font-black text-white transition hover:border-white">Explorer</a>
                </div>
              </div>
              <div className="grid gap-3">
                {featured.map((project) => (
                  <button key={project.id} type="button" onClick={() => setSelectedProjectId(project.id)} className="grid grid-cols-[84px_1fr] gap-3 bg-white/8 p-2 text-left ring-1 ring-white/10 transition hover:bg-white/12">
                    <img src={project.imageUrl || '/images/quote-product-standard-pcb.png'} alt="" className="h-20 w-full object-cover" />
                    <span className="min-w-0">
                      <span className="block text-xs font-black uppercase text-[#16c784]">{project.category}</span>
                      <span className="mt-1 block line-clamp-2 text-sm font-black">{project.title}</span>
                      <span className="mt-2 block text-xs text-white/55">{formatCompact(project.viewsCount)} vues · {project.likesCount} likes</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <aside className="grid content-start gap-3">
            <div className="grid grid-cols-2 gap-2">
              <Metric label="Projets" value={formatCompact(totals.projects)} />
              <Metric label="Likes" value={formatCompact(totals.likes)} />
              <Metric label="Commentaires" value={formatCompact(totals.comments)} />
              <Metric label="Forks" value={formatCompact(totals.forks)} />
            </div>
            <div className="bg-white p-4 text-[#172033]">
              <h2 className="text-sm font-black">Annonce</h2>
              <div className="mt-3 grid gap-2 text-sm text-[#526173]">
                <a href="#rules" className="hover:text-[#0f8f6b]">Regles de publication Kendronics</a>
                <a href="/guide-technique" className="hover:text-[#0f8f6b]">Preparer des fichiers Gerber propres</a>
                <a href="/quote" className="hover:text-[#0f8f6b]">Transformer un projet en commande PCB</a>
              </div>
            </div>
            <div className="bg-white p-4 text-[#172033]">
              <h2 className="text-sm font-black">Statut</h2>
              <p className={`mt-2 text-xs font-bold ${status === 'offline' ? 'text-[#b45309]' : 'text-[#0f8f6b]'}`}>
                {status === 'offline' ? 'Mode lecture de secours actif' : status === 'loading' ? 'Chargement du feed public...' : 'Feed public connecte a l API'}
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section className="border-b border-[#d8e1ea] bg-white">
        <div className="mx-auto flex max-w-[1368px] gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-5">
          {categories.map((item) => (
            <button key={item} type="button" onClick={() => setActiveCategory(item)} className={`h-9 shrink-0 px-3 text-sm font-black transition ${activeCategory === item ? 'bg-[#0f8f6b] text-white' : 'text-[#334155] hover:bg-[#edf3f8]'}`}>
              {item}
            </button>
          ))}
        </div>
      </section>

      <section id="feed" className="mx-auto grid max-w-[1368px] gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)_320px] lg:px-5">
        <aside className="hidden self-start bg-white p-4 ring-1 ring-[#d8e1ea] lg:block">
          <h2 className="text-sm font-black">Navigation</h2>
          <div className="mt-4 grid gap-2 text-sm">
            {categories.slice(1, 10).map((item) => (
              <button key={item} type="button" onClick={() => setActiveCategory(item)} className="flex h-9 items-center justify-between px-2 text-left text-[#334155] hover:bg-[#edf3f8] hover:text-[#0f8f6b]">
                <span>{item}</span>
                <span className="text-xs text-[#94a3b8]">{projects.filter((project) => project.category === item || project.tags.includes(item)).length}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-4 grid gap-3 bg-white p-3 ring-1 ring-[#d8e1ea] md:grid-cols-[1fr_auto]">
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="h-10 border border-[#d8e1ea] px-3 text-sm font-semibold outline-none focus:border-[#0f8f6b]" placeholder="Rechercher projets, auteurs, tags..." />
            <div className="grid grid-cols-3 gap-1">
              {[
                ['recommended', 'Featured'],
                ['latest', 'Latest'],
                ['likes', 'Most Likes'],
              ].map(([mode, label]) => (
                <button key={mode} type="button" onClick={() => setFeedMode(mode as FeedMode)} className={`h-10 px-3 text-xs font-black ${feedMode === mode ? 'bg-[#0b1220] text-white' : 'bg-[#edf3f8] text-[#334155]'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} selected={selectedProject?.id === project.id} onSelect={() => setSelectedProjectId(project.id)} onLike={() => void likeProject(project)} />
            ))}
          </div>
        </div>

        <aside className="grid content-start gap-4">
          {selectedProject ? (
            <ProjectDetailPanel
              project={selectedProject}
              commentValue={commentDrafts[selectedProject.id] ?? ''}
              onCommentChange={(value) => setCommentDrafts((current) => ({ ...current, [selectedProject.id]: value }))}
              onComment={() => void postComment(selectedProject)}
              onLike={() => void likeProject(selectedProject)}
            />
          ) : null}
          <CollectionsPanel />
        </aside>
      </section>

      <section id="create" className="border-y border-[#d8e1ea] bg-white">
        <div className="mx-auto grid max-w-[1368px] gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_440px] lg:px-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#0f8f6b]">Create</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-[#07111f]">Publier un projet public Kendronics.</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#526173]">
              La publication est liee au compte client. Les champs sont moderables, limites et persistants dans l API. Ajoutez un lien image public ou une reference de fichier technique.
            </p>
            <div id="rules" className="mt-6 grid gap-3 md:grid-cols-3">
              {['Pas de donnees sensibles', 'Fichiers propres et descriptifs', 'Commentaires publics moderables'].map((item) => (
                <div key={item} className="border border-[#d8e1ea] p-4 text-sm font-black text-[#334155]">{item}</div>
              ))}
            </div>
          </div>
          <form onSubmit={publishProject} className="grid gap-3 bg-[#f7fafc] p-4 ring-1 ring-[#d8e1ea]">
            <input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} className="h-11 border border-[#cfd8e3] px-3 text-sm font-semibold outline-none focus:border-[#0f8f6b]" placeholder="Titre du projet" maxLength={90} required />
            <div className="grid gap-3 sm:grid-cols-2">
              <select value={draft.category} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))} className="h-11 border border-[#cfd8e3] bg-white px-3 text-sm font-semibold outline-none focus:border-[#0f8f6b]">
                {['Prototype', 'PCB', 'IoT', 'Energie', 'Robotique', 'Education', 'Audio', 'Medical'].map((item) => <option key={item}>{item}</option>)}
              </select>
              <input value={draft.tags} onChange={(event) => setDraft((current) => ({ ...current, tags: event.target.value }))} className="h-11 border border-[#cfd8e3] px-3 text-sm font-semibold outline-none focus:border-[#0f8f6b]" placeholder="Tags separes par virgule" maxLength={120} />
            </div>
            <textarea value={draft.summary} onChange={(event) => setDraft((current) => ({ ...current, summary: event.target.value }))} className="min-h-[92px] resize-y border border-[#cfd8e3] px-3 py-2 text-sm font-semibold outline-none focus:border-[#0f8f6b]" placeholder="Resume public du projet" maxLength={360} required />
            <textarea value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} className="min-h-[120px] resize-y border border-[#cfd8e3] px-3 py-2 text-sm font-semibold outline-none focus:border-[#0f8f6b]" placeholder="Details techniques, composants, contraintes, instructions..." maxLength={2200} />
            <input value={draft.imageUrl} onChange={(event) => setDraft((current) => ({ ...current, imageUrl: event.target.value }))} className="h-11 border border-[#cfd8e3] px-3 text-sm font-semibold outline-none focus:border-[#0f8f6b]" placeholder="URL image publique optionnelle" />
            <div className="grid gap-3 sm:grid-cols-2">
              <input value={draft.attachmentName} onChange={(event) => setDraft((current) => ({ ...current, attachmentName: event.target.value }))} className="h-11 border border-[#cfd8e3] px-3 text-sm font-semibold outline-none focus:border-[#0f8f6b]" placeholder="Nom fichier Gerber/PDF" maxLength={120} />
              <input value={draft.repositoryUrl} onChange={(event) => setDraft((current) => ({ ...current, repositoryUrl: event.target.value }))} className="h-11 border border-[#cfd8e3] px-3 text-sm font-semibold outline-none focus:border-[#0f8f6b]" placeholder="Lien GitHub/EasyEDA optionnel" />
            </div>
            <button type="submit" disabled={submitState === 'submitting'} className="h-11 bg-[#0f8f6b] px-5 text-sm font-black text-white transition hover:bg-[#0b7558] disabled:bg-slate-300">
              {submitState === 'submitting' ? 'Publication...' : 'Publier'}
            </button>
            {submitState === 'published' ? <p className="text-xs font-bold text-[#0f8f6b]">Projet publie dans le feed public.</p> : null}
            {submitState === 'error' ? <p className="text-xs font-bold text-red-600">Publication impossible. Verifiez la connexion et les champs.</p> : null}
          </form>
        </div>
      </section>

      <ActivitySection latest={latest} />
      <Footer />
    </main>
  );
}

function ProjectCard({ project, selected, onSelect, onLike }: { project: ExplorerProject; selected: boolean; onSelect: () => void; onLike: () => void }) {
  return (
    <article className={`overflow-hidden bg-white ring-1 transition ${selected ? 'ring-[#0f8f6b]' : 'ring-[#d8e1ea] hover:ring-[#9fb3c8]'}`}>
      <button type="button" onClick={onSelect} className="block w-full text-left">
        <div className="relative aspect-[4/3] bg-[#edf3f8]">
          <img src={project.imageUrl || '/images/quote-product-standard-pcb.png'} alt="" className="h-full w-full object-cover" />
          <span className="absolute left-2 top-2 bg-white px-2 py-1 text-[10px] font-black text-[#0f8f6b]">{project.featured ? 'PRO' : 'STD'}</span>
        </div>
        <div className="p-4">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[#0f8f6b]">{project.category}</p>
          <h3 className="mt-2 line-clamp-2 min-h-[48px] text-lg font-black text-[#07111f]">{project.title}</h3>
          <p className="mt-2 line-clamp-2 min-h-[40px] text-sm leading-5 text-[#526173]">{project.summary}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {project.tags.slice(0, 3).map((tag) => <span key={tag} className="bg-[#edf3f8] px-2 py-1 text-[11px] font-bold text-[#526173]">{tag}</span>)}
          </div>
        </div>
      </button>
      <div className="grid grid-cols-4 border-t border-[#edf2f7] text-center text-xs font-black text-[#64748b]">
        <span className="py-2">{formatCompact(project.viewsCount)}</span>
        <button type="button" onClick={onLike} className="py-2 hover:text-[#0f8f6b]">{project.likesCount}</button>
        <span className="py-2">{project.forksCount}</span>
        <span className="py-2">{project.commentsCount}</span>
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
          <p className="mt-1 text-xs font-bold text-[#64748b]">{project.authorName} · {formatDate(project.createdAt)}</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-[#526173]">{project.description || project.summary}</p>
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

function CollectionsPanel() {
  return (
    <section className="bg-white p-4 ring-1 ring-[#d8e1ea]">
      <h2 className="text-sm font-black">Collections</h2>
      <div className="mt-3 grid gap-3">
        {collections.map(([title, body, count]) => (
          <a key={title} href="#feed" className="block border border-[#edf2f7] p-3 transition hover:border-[#0f8f6b]">
            <span className="block text-sm font-black text-[#07111f]">{title}</span>
            <span className="mt-1 block text-xs leading-5 text-[#64748b]">{body}</span>
            <span className="mt-2 block text-xs font-black text-[#0f8f6b]">{count}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

function ActivitySection({ latest }: { latest: ExplorerProject[] }) {
  return (
    <section className="mx-auto grid max-w-[1368px] gap-5 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:px-5">
      <div className="bg-white p-5 ring-1 ring-[#d8e1ea]">
        <h2 className="text-xl font-black text-[#07111f]">Activity</h2>
        <div className="mt-4 grid gap-3">
          {latest.map((project) => (
            <div key={project.id} className="flex items-center justify-between gap-4 border-b border-[#edf2f7] pb-3 last:border-b-0 last:pb-0">
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-[#172033]">{project.title}</p>
                <p className="mt-1 text-xs text-[#64748b]">{project.authorName} a publie dans {project.category}</p>
              </div>
              <time className="shrink-0 text-xs font-bold text-[#94a3b8]" dateTime={project.createdAt}>{formatDate(project.createdAt)}</time>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white p-5 ring-1 ring-[#d8e1ea]">
        <h2 className="text-xl font-black text-[#07111f]">Forums</h2>
        <div className="mt-4 grid gap-3 text-sm text-[#526173]">
          <a href="/contact" className="border-b border-[#edf2f7] pb-3 hover:text-[#0f8f6b]">Besoin d aide sur un schema ou un Gerber ? Ouvrir une discussion support.</a>
          <a href="/blog" className="border-b border-[#edf2f7] pb-3 hover:text-[#0f8f6b]">Lire les guides avant de publier un projet public.</a>
          <a href="/guide-technique" className="hover:text-[#0f8f6b]">Verifier les regles de fabrication PCB.</a>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/8 p-3 ring-1 ring-white/10">
      <p className="text-xl font-black">{value}</p>
      <p className="mt-1 text-xs text-white/60">{label}</p>
    </div>
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
