'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Navbar } from '../../../components/layout/Navbar';
import { getApiBaseUrl } from '../../../lib/api-base-url';

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
  projectType?: 'free' | 'paid';
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
};

const apiBaseUrl = getApiBaseUrl();

export default function ExplorerProjectDetailPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const [projects, setProjects] = useState<ExplorerProject[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;

    async function loadProject() {
      try {
        const response = await fetch(`${apiBaseUrl}/api/explorer/projects`, { cache: 'no-store' });
        if (!response.ok) throw new Error(`Explorer project failed: ${response.status}`);
        const payload = await response.json() as ExplorerProject[];
        if (cancelled) return;
        setProjects(payload);
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    }

    void loadProject();
    return () => {
      cancelled = true;
    };
  }, []);

  const project = useMemo(() => projects.find((item) => item.id === projectId), [projectId, projects]);

  return (
    <main className="min-h-screen bg-white text-[#0b1724]">
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
                <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-[#102033] text-sm font-black text-white">
                  {project.authorAvatarUrl ? <img src={project.authorAvatarUrl} alt="" className="h-full w-full object-cover" /> : project.authorName.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <h1 className="truncate text-base font-black text-[#0b1724] sm:text-lg">{project.authorName}</h1>
                  <p className="text-xs font-semibold text-[#0f8f6b]">{project.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" className="grid h-10 w-10 place-items-center rounded-full border border-[#dbe4ee] text-[#102033] transition hover:border-[#0f8f6b] hover:text-[#0f8f6b]" aria-label="Ajouter aux favoris">
                  <DetailHeartIcon />
                </button>
                <button type="button" className="grid h-10 w-10 place-items-center rounded-full border border-[#dbe4ee] text-[#102033] transition hover:border-[#0f8f6b] hover:text-[#0f8f6b]" aria-label="Sauvegarder">
                  <DetailBookmarkIcon />
                </button>
                {project.projectType === 'paid' ? (
                  <a href={`/explorer?fork=${project.id}`} className="grid h-10 place-items-center rounded-full bg-[#08071b] px-6 text-sm font-black text-white transition hover:bg-[#0f8f6b]">
                    Forks
                  </a>
                ) : null}
              </div>
            </header>

            <div className="mt-8 overflow-hidden rounded-[8px] bg-[#edf3f8]">
              <img src={project.imageUrl || '/images/quote-product-standard-pcb.png'} alt="" className="max-h-[620px] w-full object-cover" />
            </div>

            <section className="mx-auto mt-10 max-w-3xl text-center">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0f8f6b]">#{project.category}</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-[#0b1724] sm:text-4xl">{project.title}</h2>
              <p className="mt-6 text-lg leading-8 text-[#334155]">{project.description || project.summary}</p>
              <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm font-semibold text-[#64748b]">
                <span>{formatCompact(project.viewsCount)} vues</span>
                <span>{project.likesCount} likes</span>
                <span>{project.favoritesCount} favoris</span>
                <span>{project.commentsCount} commentaires</span>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
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

function DetailHeartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.8 5.6a5.2 5.2 0 0 0-7.4 0L12 7l-1.4-1.4a5.2 5.2 0 1 0-7.4 7.4L12 21l8.8-8a5.2 5.2 0 0 0 0-7.4Z" />
    </svg>
  );
}

function DetailBookmarkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 4h12v17l-6-3-6 3V4Z" />
    </svg>
  );
}

function formatCompact(value: number) {
  return new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}
