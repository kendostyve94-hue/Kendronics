'use client';

import { useEffect, useState } from 'react';
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
  author: {
    id?: string;
    name: string;
    avatarDataUrl?: string;
    description?: string;
    badgeLabel: string;
    verificationLevel: number;
    links: Array<{
      type: string;
      label: string;
      href: string;
      host?: string;
    }>;
  };
};

const apiBaseUrl = getApiBaseUrl();

export default function ExplorerProjectDetailPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const [project, setProject] = useState<ExplorerProject | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;

    async function loadProject() {
      try {
        const response = await fetch(`${apiBaseUrl}/api/explorer/projects/${projectId}`, { cache: 'no-store' });
        if (!response.ok) throw new Error(`Explorer project failed: ${response.status}`);
        const payload = await response.json() as ExplorerProject;
        if (cancelled) return;
        setProject(payload);
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    }

    void loadProject();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

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
                  {project.author.avatarDataUrl ? <img src={project.author.avatarDataUrl} alt="" className="h-full w-full object-cover" /> : project.author.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <h1 className="truncate text-base font-black text-[#0b1724] sm:text-lg">{project.author.name}</h1>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs font-semibold">
                    <span className="text-[#0f8f6b]">{project.author.badgeLabel}</span>
                    <button type="button" className="inline-flex items-center gap-1 text-[#334155] transition hover:text-[#0f8f6b]">
                      <FollowTinyIcon />
                      Follow
                    </button>
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
                <button type="button" className="inline-flex items-center gap-1.5 transition hover:text-[#0f8f6b]" aria-label="Aimer">
                  <DetailThumbIcon />
                  {formatCompact(project.likesCount)}
                </button>
                <button type="button" className="inline-flex items-center gap-1.5 transition hover:text-[#0f8f6b]" aria-label="Ajouter aux favoris">
                  <DetailStarIcon />
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

function DetailEyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function DetailThumbIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 10v11H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3Z" />
      <path d="M7 10 11 2a3 3 0 0 1 3 3v3h5a2 2 0 0 1 2 2l-1 8a3 3 0 0 1-3 3H7" />
    </svg>
  );
}

function DetailStarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />
    </svg>
  );
}

function DetailCommentIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" />
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
