'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Navbar } from '../../../components/layout/Navbar';
import { getApiBaseUrl } from '../../../lib/api-base-url';

type PublicAuthorProject = {
  id: string;
  title: string;
  summary: string;
  imageUrl?: string;
  viewsCount: number;
  likesCount: number;
  favoritesCount: number;
  commentsCount: number;
};

type PublicAuthorProfile = {
  id: string;
  name: string;
  avatarDataUrl?: string;
  bannerDataUrl?: string;
  description: string;
  badgeLabel: string;
  followersCount: number;
  followingCount: number;
  projectsCount: number;
  links: Array<{ type: string; label: string; href: string }>;
  projects: PublicAuthorProject[];
};

const defaultBannerUrl = '/images/kendronics-profile-banner.jpg';

export default function PublicAuthorProfilePage() {
  const params = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<PublicAuthorProfile | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const response = await fetch(`${getApiBaseUrl()}/api/explorer/users/${params.userId}/profile`, { cache: 'no-store' });
        if (!response.ok) throw new Error(`Public profile failed: ${response.status}`);
        const payload = await response.json() as PublicAuthorProfile;
        if (cancelled) return;
        setProfile(payload);
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    }

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [params.userId]);

  return (
    <main className="min-h-screen bg-white text-[#0b1724]">
      <Navbar />
      <div className="mx-auto w-full max-w-[1180px] px-4 pb-20 pt-[86px] sm:px-6 lg:px-5">
        {status === 'loading' ? (
          <ProfileState title="Chargement du profil" body="Kendronics recupere les informations publiques de l'auteur." />
        ) : status === 'error' || !profile ? (
          <ProfileState title="Profil introuvable" body="Ce profil public n'est pas disponible." />
        ) : (
          <>
            <div className="aspect-[6.2/1] min-h-[128px] overflow-hidden rounded-[8px] bg-[#edf3f8]">
              <img src={profile.bannerDataUrl || defaultBannerUrl} alt="" className="h-full w-full object-cover object-center" />
            </div>
            <header className="mt-[-34px] flex flex-wrap items-end justify-between gap-4 px-2">
              <div className="flex min-w-0 items-end gap-4">
                <span className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-[#102033] text-2xl font-black text-white ring-4 ring-white">
                  {profile.avatarDataUrl ? <img src={profile.avatarDataUrl} alt="" className="h-full w-full object-cover" /> : profile.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 pb-1">
                  <h1 className="truncate text-2xl font-black text-[#0b1724]">{profile.name}</h1>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs font-semibold">
                    <span className="text-[#0f8f6b]">{profile.badgeLabel}</span>
                    <button type="button" className="text-[#334155] transition hover:text-[#0f8f6b]">Follow</button>
                  </div>
                </div>
              </div>
              <div className="flex gap-5 text-sm font-semibold text-[#64748b]">
                <span>{formatCompact(profile.followersCount)} abonnes</span>
                <span>{formatCompact(profile.projectsCount)} projets</span>
              </div>
            </header>

            {profile.links.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-4 text-sm font-semibold text-[#334155]">
                {profile.links.map((link) => (
                  <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className="transition hover:text-[#0f8f6b]">{link.label}</a>
                ))}
              </div>
            ) : null}
            {profile.description ? <p className="mt-6 max-w-3xl whitespace-pre-line text-sm leading-7 text-[#334155]">{profile.description}</p> : null}

            <section className="mt-10">
              <h2 className="border-b border-[#dbe4ee] pb-3 text-lg font-black text-[#0b1724]">Projets publics</h2>
              <div className="mt-5 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
                {profile.projects.map((project) => (
                  <a key={project.id} href={`/explorer/${project.id}`} className="group block">
                    <div className="aspect-[4/3] overflow-hidden bg-[#edf3f8]">
                      <img src={project.imageUrl || '/images/quote-product-standard-pcb.png'} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                    </div>
                    <h3 className="mt-3 line-clamp-2 text-base font-black text-[#0b1724] group-hover:text-[#0f8f6b]">{project.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#64748b]">{project.summary}</p>
                    <div className="mt-2 flex gap-3 text-xs font-semibold text-[#94a3b8]">
                      <span>{formatCompact(project.viewsCount)} vues</span>
                      <span>{formatCompact(project.likesCount)} likes</span>
                      <span>{formatCompact(project.commentsCount)} com.</span>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function ProfileState({ title, body }: { title: string; body: string }) {
  return (
    <section className="grid min-h-[360px] place-items-center text-center">
      <div>
        <h1 className="text-xl font-black text-[#0b1724]">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-[#64748b]">{body}</p>
      </div>
    </section>
  );
}

function formatCompact(value: number) {
  return new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}
