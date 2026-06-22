'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Navbar } from '../../../components/layout/Navbar';
import { getApiBaseUrl } from '../../../lib/api-base-url';
import { readAuthSession } from '../../../lib/auth-session';

type PublicAuthorProject = {
  id: string;
  projectType?: 'free' | 'paid';
  title: string;
  summary: string;
  imageUrl?: string;
  mediaKind?: string;
  mediaMimeType?: string;
  visibility?: string;
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
  likesCount: number;
  forksCount: number;
  points: number;
  projectsCount: number;
  isOwner?: boolean;
  isFollowing?: boolean;
  links: Array<{ type: string; label: string; href: string }>;
  projects: PublicAuthorProject[];
};

const defaultBannerUrl = '/images/kendronics-profile-banner.jpg';

export default function PublicAuthorProfilePage() {
  const params = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<PublicAuthorProfile | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [activeTab, setActiveTab] = useState<'reels' | 'forks'>('reels');
  const [followed, setFollowed] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'delete' | 'visibility'; project: PublicAuthorProject } | null>(null);
  const isOwnProfile = Boolean(profile?.isOwner || (profile?.id && profile.id === currentSessionUserId()));

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const session = readAuthSession();
        const response = await fetch(`${getApiBaseUrl()}/api/explorer/users/${params.userId}/profile`, {
          headers: session ? { Authorization: `${session.tokenType} ${session.accessToken}` } : undefined,
          cache: 'no-store',
        });
        if (!response.ok) throw new Error(`Public profile failed: ${response.status}`);
        const payload = await response.json() as PublicAuthorProfile;
        if (cancelled) return;
        setProfile(payload);
        setFollowed(Boolean(payload.isFollowing));
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

  async function followAuthor() {
    if (!profile) return;
    const session = readAuthSession();
    if (!session) {
      window.dispatchEvent(new CustomEvent('kendronics:open-auth-required', { detail: { panel: 'login', step: 'choice' } }));
      return;
    }
    const response = await fetch(`${getApiBaseUrl()}/api/users/${profile.id}/follow`, {
      method: 'POST',
      headers: { Authorization: `${session.tokenType} ${session.accessToken}` },
    });
    if (!response.ok) return;
    const payload = await response.json() as { following: boolean; followersCount: number };
    setFollowed(payload.following);
    setProfile((current) => current ? { ...current, followersCount: payload.followersCount } : current);
  }

  async function confirmProjectAction() {
    if (!confirmAction || !isOwnProfile) return;
    const session = readAuthSession();
    if (!session) return;
    const { project, type } = confirmAction;
    const response = await fetch(`${getApiBaseUrl()}/api/explorer/projects/${project.id}${type === 'visibility' ? '/visibility' : ''}`, {
      method: type === 'delete' ? 'DELETE' : 'POST',
      headers: { Authorization: `${session.tokenType} ${session.accessToken}` },
    });
    if (!response.ok) return;
    if (type === 'delete') {
      setProfile((current) => current ? { ...current, projects: current.projects.filter((item) => item.id !== project.id), projectsCount: Math.max(0, current.projectsCount - 1) } : current);
    } else {
      const updated = await response.json() as PublicAuthorProject;
      setProfile((current) => current ? { ...current, projects: current.projects.map((item) => item.id === updated.id ? { ...item, visibility: updated.visibility } : item) } : current);
    }
    setConfirmAction(null);
  }

  return (
    <main className="min-h-screen bg-white text-[#0b1724]">
      <Navbar />
      <div className="mx-auto w-full max-w-[1180px] overflow-x-hidden px-0 pb-20 pt-[86px] sm:px-6 lg:px-5">
        {status === 'loading' ? (
          <ProfileState title="Chargement du profil" body="Kendronics recupere les informations publiques de l'auteur." />
        ) : status === 'error' || !profile ? (
          <ProfileState title="Profil introuvable" body="Ce profil public n'est pas disponible." />
        ) : (
          <>
            <div className="aspect-[16/5] max-h-[220px] min-h-[128px] overflow-hidden bg-[#edf3f8] sm:aspect-[6/1]">
              <img src={profile.bannerDataUrl || defaultBannerUrl} alt="" className="h-full w-full object-cover object-center" />
            </div>
            <header className="-mt-10 grid grid-cols-[5.75rem_minmax(0,1fr)] items-end gap-3 px-4 sm:-mt-16 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-5 sm:px-2">
              <span className="relative z-10 grid h-[88px] w-[88px] shrink-0 place-items-center overflow-hidden rounded-full bg-[#102033] text-2xl font-black text-white sm:h-32 sm:w-32">
                  {profile.avatarDataUrl ? <img src={profile.avatarDataUrl} alt="" className="h-full w-full object-cover" /> : profile.name.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0 pb-1 pt-12 sm:pt-16">
                <h1 className="flex min-w-0 flex-wrap items-center gap-2 bg-transparent text-xl font-black leading-tight text-[#1f2f43] shadow-none ring-0 sm:text-2xl">
                  <span className="min-w-0 truncate">{profile.name}</span>
                  <AuthorBadge label={profile.badgeLabel} />
                  {!isOwnProfile ? <button type="button" onClick={() => void followAuthor()} className={`text-xs font-semibold transition hover:text-[#0f8f6b] ${followed ? 'text-[#0f8f6b]' : 'text-[#334155]'}`}>
                    {followed ? 'Unfollow' : 'Follow'}
                  </button> : null}
                </h1>
                <div className="mt-4 hidden max-w-[34rem] grid-cols-4 text-center sm:grid sm:divide-x sm:divide-[#dbe4ee]">
                  <ProfileMetric label="Suivi" value={formatCompact(profile.followingCount)} />
                  <ProfileMetric label="Abonnés" value={formatCompact(profile.followersCount)} />
                  <ProfileMetric label="Likes" value={formatCompact(profile.likesCount)} />
                  <RatingMetric rating={ratingFromPoints(profile.points)} />
                </div>
              </div>
            </header>
            <div className="mt-4 grid grid-cols-4 px-4 text-center sm:hidden">
              <ProfileMetric label="Suivi" value={formatCompact(profile.followingCount)} />
              <ProfileMetric label="Abonnés" value={formatCompact(profile.followersCount)} />
              <ProfileMetric label="Likes" value={formatCompact(profile.likesCount)} />
              <RatingMetric rating={ratingFromPoints(profile.points)} />
            </div>

            <div className="px-4 sm:px-2">
            {profile.links.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-4 text-sm font-semibold text-[#334155]">
                {profile.links.map((link) => (
                  <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className="transition hover:text-[#0f8f6b]">{link.label}</a>
                ))}
              </div>
            ) : null}
            {profile.description ? <p className="mt-6 max-w-[48rem] whitespace-pre-line text-left text-sm leading-7 text-[#334155]">{profile.description}</p> : null}
            </div>

            <section className="mt-10">
              <nav className="mx-4 inline-flex w-fit gap-5 border-b border-[#dbe4ee] text-sm font-semibold text-[#64748b] sm:mx-0" aria-label="Publications">
                <button type="button" onClick={() => setActiveTab('reels')} className={`inline-flex items-center gap-2 border-b-2 pb-3 ${activeTab === 'reels' ? 'border-[#0f8f6b] text-[#0f8f6b]' : 'border-transparent'}`}>
                  <ReelsIcon />
                  Reels
                </button>
                <button type="button" onClick={() => setActiveTab('forks')} className={`inline-flex items-center gap-2 border-b-2 pb-3 ${activeTab === 'forks' ? 'border-[#0f8f6b] text-[#0f8f6b]' : 'border-transparent'}`}>
                  <ForksIcon />
                  Forks
                </button>
              </nav>
              <div className="mt-5 grid gap-7 px-4 sm:grid-cols-2 sm:px-0 lg:grid-cols-3">
                {profile.projects.filter((project) => activeTab === 'forks' ? project.projectType === 'paid' : true).map((project) => (
                  <a key={project.id} href={`/explorer/${project.id}`} className="group block">
                    <div className="aspect-[4/3] overflow-hidden bg-[#edf3f8]">
                      {project.imageUrl ? (
                        <ProjectMedia project={project} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                      ) : (
                        <div className="grid h-full w-full place-items-center bg-[#edf3f8] px-4 text-center text-xs font-black uppercase tracking-[0.14em] text-[#64748b]">Projet</div>
                      )}
                    </div>
                    <h3 className="mt-3 line-clamp-2 text-base font-black text-[#0b1724] group-hover:text-[#0f8f6b]">{project.title}</h3>
                    {isOwnProfile && project.visibility !== 'public' ? <p className="mt-1 text-xs font-black text-[#b45309]">Cache du grand public</p> : null}
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#64748b]">{project.summary}</p>
                    <div className="mt-2 flex items-center gap-4 text-sm text-[#91a0af]">
                      <button type="button" onClick={(event) => { event.preventDefault(); if (isOwnProfile) setConfirmAction({ type: 'visibility', project }); }} className={`inline-flex items-center gap-1 ${isOwnProfile ? 'hover:text-[#0f8f6b]' : ''}`} title={isOwnProfile ? (project.visibility === 'public' ? 'Cacher du grand public' : 'Reactiver publiquement') : undefined}><EyeIcon />{formatCompact(project.viewsCount)}</button>
                      <span className="inline-flex items-center gap-1"><ThumbIcon />{formatCompact(project.likesCount)}</span>
                      <span className="inline-flex items-center gap-1"><StarIcon />{formatCompact(project.favoritesCount)}</span>
                      <span className="inline-flex items-center gap-1"><CommentIcon />{formatCompact(project.commentsCount)}</span>
                    </div>
                    {isOwnProfile ? (
                      <div className="mt-3 flex items-center gap-3 text-sm text-[#64748b]">
                        <button type="button" onClick={(event) => { event.preventDefault(); window.location.href = `/projects/new?type=${project.projectType ?? 'free'}&id=${project.id}`; }} className="inline-flex items-center gap-1 transition hover:text-[#0f8f6b]" aria-label="Modifier ce poste">
                          <EditIcon />
                          Modifier
                        </button>
                        <button type="button" onClick={(event) => { event.preventDefault(); setConfirmAction({ type: 'delete', project }); }} className="inline-flex items-center gap-1 transition hover:text-red-600" aria-label="Supprimer ce poste">
                          <DeleteIcon />
                          Supprimer
                        </button>
                      </div>
                    ) : null}
                  </a>
                ))}
              </div>
            </section>
            {confirmAction ? (
              <div className="fixed inset-0 z-[90] grid place-items-center bg-[#07172a]/45 px-4">
                <div className="w-full max-w-sm bg-white p-5 text-[#102033] shadow-[0_24px_70px_rgba(7,23,42,0.22)]">
                  <h2 className="text-lg font-black">{confirmAction.type === 'delete' ? 'Supprimer ce poste ?' : confirmAction.project.visibility === 'public' ? 'Cacher ce poste ?' : 'Reactiver ce poste ?'}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#64748b]">{confirmAction.type === 'delete' ? 'Cette action supprimera definitivement la publication.' : 'Le poste reste visible dans votre profil, mais son affichage grand public change.'}</p>
                  <div className="mt-5 flex justify-end gap-2">
                    <button type="button" onClick={() => setConfirmAction(null)} className="h-10 border border-[#dbe4ee] px-4 text-sm font-black">Annuler</button>
                    <button type="button" onClick={() => void confirmProjectAction()} className="h-10 bg-[#102033] px-4 text-sm font-black text-white">Confirmer</button>
                  </div>
                </div>
              </div>
            ) : null}
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

function AuthorBadge({ label }: { label: string }) {
  return <span className="rounded-full bg-[#eefbf6] px-1.5 py-0.5 text-[10px] font-black leading-none text-[#0f8f6b]">{label}</span>;
}

function ProfileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 px-2 sm:px-3">
      <p className="text-lg font-black text-[#1f2f43] sm:text-xl">{value}</p>
      <p className="mt-1 text-[11px] leading-4 text-[#7c8795] sm:text-sm">{label}</p>
    </div>
  );
}

function RatingMetric({ rating }: { rating: number }) {
  return (
    <div className="min-w-0 px-2 sm:px-3">
      <p className="text-lg font-black text-[#1f2f43] sm:text-xl">{rating.toFixed(1).replace('.', ',')}</p>
      <div className="mt-1 flex justify-center gap-0.5 text-[#0f8f6b]">
        {[0, 1, 2, 3, 4].map((index) => <StarIcon key={index} filled={rating >= index + 0.75} />)}
      </div>
    </div>
  );
}

function ratingFromPoints(points: number) {
  if (points <= 0) return 0;
  return Math.min(5, 3.8 + Math.log10(points + 1) * 0.42);
}

function ReelsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="5" width="16" height="14" rx="3" />
      <path d="m9 5 2 4M15 5l2 4M4.5 9h15" />
      <path d="m10.5 12 4 2.5-4 2.5v-5Z" />
    </svg>
  );
}

function ForksIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="12" cy="18" r="2.5" />
      <path d="M6 8.5v2.2A3.3 3.3 0 0 0 9.3 14H12M18 8.5v2.2a3.3 3.3 0 0 1-3.3 3.3H12M12 14v1.5" />
    </svg>
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

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
      <path d="m14 7 3 3" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 7h16" />
      <path d="M10 11v6M14 11v6" />
      <path d="M6 7l1 14h10l1-14" />
      <path d="M9 7V4h6v3" />
    </svg>
  );
}

function ProjectMedia({ project, className }: { project: PublicAuthorProject; className: string }) {
  const src = project.imageUrl ? mediaUrl(project.imageUrl) : '';
  const isVideo = project.mediaMimeType?.startsWith('video/') || project.mediaKind === 'video';
  return isVideo ? <video src={src} className={className} controls playsInline /> : <img src={src} alt="" className={className} />;
}

function formatCompact(value: number) {
  return new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

function mediaUrl(value: string) {
  return value.startsWith('/api/') ? `${getApiBaseUrl()}${value}` : value;
}

function currentSessionUserId() {
  const session = readAuthSession();
  if (!session?.accessToken || typeof window === 'undefined') return '';
  try {
    const payload = JSON.parse(window.atob(session.accessToken.split('.')[1] ?? '')) as { sub?: string; userId?: string };
    return payload.sub ?? payload.userId ?? '';
  } catch {
    return '';
  }
}
