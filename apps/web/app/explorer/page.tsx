'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { Footer } from '../../components/layout/Footer';
import { Navbar } from '../../components/layout/Navbar';

type ExplorerProject = {
  id: string;
  title: string;
  author: string;
  category: string;
  summary: string;
  tags: string[];
  imageDataUrl: string;
  fileName: string;
  createdAt: string;
  likes: number;
};

const storageKey = 'kendronics.explorer.projects';
const categories = ['PCB', 'IoT', 'Robotique', 'Energie', 'Education', 'Prototype'];

const seedProjects: ExplorerProject[] = [
  {
    id: 'seed-power-monitor',
    title: 'Moniteur energie modulaire',
    author: 'Kendronics Lab',
    category: 'Energie',
    summary: 'Carte de mesure courant/tension avec borniers, capteur isolé et format prêt pour prototype terrain.',
    tags: ['FR-4', 'Capteur', 'Prototype'],
    imageDataUrl: '/images/hero-controller-board.png',
    fileName: 'power-monitor-gerber.zip',
    createdAt: '2026-01-12T09:00:00.000Z',
    likes: 18,
  },
  {
    id: 'seed-iot-node',
    title: 'Noeud IoT basse consommation',
    author: 'Community',
    category: 'IoT',
    summary: 'Design compact pour collecte de données, alimentation batterie et connecteur de programmation.',
    tags: ['IoT', 'Batterie', 'RF'],
    imageDataUrl: '/images/hero-pcb-color-variants.png',
    fileName: 'iot-node-docs.pdf',
    createdAt: '2026-02-04T14:30:00.000Z',
    likes: 12,
  },
];

export default function ExplorerPage() {
  const [projects, setProjects] = useState<ExplorerProject[]>(seedProjects);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Tous');
  const [draft, setDraft] = useState({
    title: '',
    author: '',
    category: categories[0],
    summary: '',
    tags: '',
    fileName: '',
    imageDataUrl: '',
  });

  useEffect(() => {
    setProjects(readProjects());
  }, []);

  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesCategory = category === 'Tous' || project.category === category;
      const searchable = `${project.title} ${project.author} ${project.summary} ${project.tags.join(' ')}`.toLowerCase();
      return matchesCategory && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [category, projects, query]);

  function publishProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.title.trim() || !draft.summary.trim()) return;

    const nextProject: ExplorerProject = {
      id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}`,
      title: draft.title.trim(),
      author: draft.author.trim() || 'Client Kendronics',
      category: draft.category,
      summary: draft.summary.trim(),
      tags: draft.tags.split(',').map((tag) => tag.trim()).filter(Boolean).slice(0, 5),
      imageDataUrl: draft.imageDataUrl || '/images/quote-product-standard-pcb.png',
      fileName: draft.fileName || 'Projet sans fichier joint',
      createdAt: new Date().toISOString(),
      likes: 0,
    };

    const nextProjects = [nextProject, ...projects].slice(0, 60);
    setProjects(nextProjects);
    persistProjects(nextProjects);
    setDraft({ title: '', author: '', category: categories[0], summary: '', tags: '', fileName: '', imageDataUrl: '' });
  }

  function updateImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setDraft((current) => ({ ...current, fileName: file.name }));

    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => setDraft((current) => ({ ...current, imageDataUrl: typeof reader.result === 'string' ? reader.result : current.imageDataUrl }));
    reader.readAsDataURL(file);
  }

  function likeProject(id: string) {
    const nextProjects = projects.map((project) => (project.id === id ? { ...project, likes: project.likes + 1 } : project));
    setProjects(nextProjects);
    persistProjects(nextProjects);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-white text-[#102033]">
      <Navbar />
      <section className="border-b border-[#dbe4ee] bg-[#f7fafc] pt-[70px]">
        <div className="mx-auto grid max-w-[1368px] gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-5">
          <div className="flex min-h-[360px] flex-col justify-end">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0f8f6b]">Explorer Kendronics</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight text-[#07111f] sm:text-5xl lg:text-6xl">
              Créez, publiez et partagez vos projets électroniques.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#526173]">
              Un espace projet pour présenter PCB, prototypes, documents techniques et fichiers de fabrication avant devis ou discussion support.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a href="#publish" className="inline-flex h-11 items-center justify-center bg-[#0f8f6b] px-5 text-sm font-black text-white transition hover:bg-[#0b7558]">
                Publier un projet
              </a>
              <a href="/quote" className="inline-flex h-11 items-center justify-center border border-[#0f8f6b] bg-white px-5 text-sm font-black text-[#0f8f6b] transition hover:bg-[#eefbf6]">
                Transformer en devis
              </a>
            </div>
          </div>
          <form id="publish" onSubmit={publishProject} className="grid gap-3 border border-[#dbe4ee] bg-white p-5">
            <h2 className="text-lg font-black text-[#07111f]">Nouveau projet</h2>
            <input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} className="h-11 border border-[#cfd8e3] px-3 text-sm font-semibold outline-none focus:border-[#0f8f6b]" placeholder="Nom du projet" maxLength={80} />
            <div className="grid gap-3 sm:grid-cols-2">
              <input value={draft.author} onChange={(event) => setDraft((current) => ({ ...current, author: event.target.value }))} className="h-11 border border-[#cfd8e3] px-3 text-sm font-semibold outline-none focus:border-[#0f8f6b]" placeholder="Auteur ou équipe" maxLength={48} />
              <select value={draft.category} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))} className="h-11 border border-[#cfd8e3] bg-white px-3 text-sm font-semibold outline-none focus:border-[#0f8f6b]">
                {categories.map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
            <textarea value={draft.summary} onChange={(event) => setDraft((current) => ({ ...current, summary: event.target.value }))} className="min-h-[96px] resize-y border border-[#cfd8e3] px-3 py-2 text-sm font-semibold outline-none focus:border-[#0f8f6b]" placeholder="Résumé technique, usage, composants, contraintes..." maxLength={320} />
            <input value={draft.tags} onChange={(event) => setDraft((current) => ({ ...current, tags: event.target.value }))} className="h-11 border border-[#cfd8e3] px-3 text-sm font-semibold outline-none focus:border-[#0f8f6b]" placeholder="Tags séparés par virgule" maxLength={90} />
            <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 border border-dashed border-[#9fb3c8] bg-[#f8fafc] px-3 text-sm font-semibold text-[#526173] transition hover:border-[#0f8f6b] hover:text-[#0f8f6b]">
              <span className="truncate">{draft.fileName || 'Ajouter image, Gerber ZIP, PDF ou document technique'}</span>
              <input type="file" accept="image/*,.zip,.rar,.7z,.pdf,.doc,.docx" className="hidden" onChange={updateImage} />
            </label>
            <button type="submit" className="h-11 bg-[#102033] px-5 text-sm font-black text-white transition hover:bg-[#0f8f6b]">
              Partager
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-[1368px] px-4 py-8 sm:px-6 lg:px-5">
        <div className="flex flex-col gap-3 border-b border-[#dbe4ee] pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2 overflow-x-auto">
            {['Tous', ...categories].map((item) => (
              <button key={item} type="button" onClick={() => setCategory(item)} className={`h-10 shrink-0 border px-4 text-sm font-black transition ${category === item ? 'border-[#0f8f6b] bg-[#0f8f6b] text-white' : 'border-[#dbe4ee] bg-white text-[#334155] hover:border-[#0f8f6b]'}`}>
                {item}
              </button>
            ))}
          </div>
          <input value={query} onChange={(event) => setQuery(event.target.value)} className="h-10 w-full border border-[#dbe4ee] px-3 text-sm font-semibold outline-none focus:border-[#0f8f6b] lg:w-80" placeholder="Rechercher un projet..." />
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project) => (
            <article key={project.id} className="overflow-hidden border border-[#dbe4ee] bg-white">
              <div className="aspect-[16/10] bg-[#f6f8fa]">
                <img src={project.imageDataUrl} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.12em] text-[#0f8f6b]">
                  <span>{project.category}</span>
                  <time dateTime={project.createdAt}>{formatDate(project.createdAt)}</time>
                </div>
                <h2 className="mt-3 text-xl font-black text-[#07111f]">{project.title}</h2>
                <p className="mt-2 text-sm font-semibold text-[#526173]">{project.author}</p>
                <p className="mt-3 min-h-[72px] text-sm leading-6 text-[#526173]">{project.summary}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {project.tags.map((tag) => <span key={tag} className="bg-[#eef6fb] px-2 py-1 text-xs font-bold text-[#334155]">{tag}</span>)}
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-[#edf2f7] pt-4 text-sm">
                  <span className="min-w-0 truncate text-[#64748b]">{project.fileName}</span>
                  <button type="button" onClick={() => likeProject(project.id)} className="shrink-0 font-black text-[#0f8f6b]">
                    {project.likes} likes
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
      <Footer />
    </main>
  );
}

function readProjects() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) ?? '[]') as ExplorerProject[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : seedProjects;
  } catch {
    return seedProjects;
  }
}

function persistProjects(projects: ExplorerProject[]) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(projects));
  } catch {
    // Explorer remains usable even when local storage is blocked.
  }
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
  } catch {
    return '';
  }
}
