'use client';

import { useEffect, useRef, useState } from 'react';

const oneStopVideos = [
  {
    id: 'pcb-flow',
    title: 'Parcours PCB et assemblage Kendronics',
    label: 'Parcours PCB',
    description: 'Commande, production et suivi client.',
    src: '/videos/one-stop-solution.mp4',
    type: 'video/mp4',
  },
  {
    id: 'kicad-gerber',
    title: 'Creer un fichier Gerber sur KiCad',
    label: 'Gerber KiCad',
    description: 'Tutoriel de preparation avant devis.',
    src: '/videos/kicad-gerber-tutorial.mov',
    type: 'video/quicktime',
  },
];

export function OneStopVideoPanel({ paymentMethodCount }: { paymentMethodCount: number }) {
  const [activeVideoId, setActiveVideoId] = useState(oneStopVideos[0].id);
  const activeVideo = oneStopVideos.find((video) => video.id === activeVideoId) ?? oneStopVideos[0];
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.load();
    void video.play().catch(() => undefined);
  }, [activeVideo.src]);

  return (
    <div className="min-w-0">
      <div className="relative h-[13rem] overflow-hidden bg-slate-950 sm:h-[16rem] lg:min-h-[21rem]">
        <video
          key={activeVideo.src}
          ref={videoRef}
          className="h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={activeVideo.title}
        >
          <source src={activeVideo.src} type={activeVideo.type} />
        </video>
        <div className="absolute bottom-0 left-0 right-0 bg-slate-950/45 px-4 py-2.5 text-white">
          <p className="text-base font-normal">{activeVideo.title}</p>
        </div>
      </div>

      <div className="grid bg-white md:grid-cols-[minmax(11rem,1fr)_minmax(11rem,1fr)_minmax(9rem,0.82fr)]">
        <VideoPreviewTile video={oneStopVideos[1]} active={activeVideo.id === oneStopVideos[1].id} onSelect={() => setActiveVideoId(oneStopVideos[1].id)} />
        <VideoPreviewTile video={oneStopVideos[0]} active={activeVideo.id === oneStopVideos[0].id} onSelect={() => setActiveVideoId(oneStopVideos[0].id)} />
        <PaymentStat value={`${paymentMethodCount}`} label="Moyens de paiement" />
      </div>
    </div>
  );
}

function VideoPreviewTile({ video, active, onSelect }: { video: (typeof oneStopVideos)[number]; active: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group flex min-h-[4.5rem] items-center gap-3 border-b border-slate-200 bg-white px-3 py-3 text-left transition md:border-b-0 md:border-r ${
        active ? 'bg-[#f8fffc] shadow-[inset_0_0_0_1px_#008b6d]' : 'hover:bg-slate-50'
      }`}
      aria-pressed={active}
    >
      <span className="relative h-8 w-12 flex-none overflow-hidden border border-slate-200 bg-slate-950">
        <video className="h-full w-full object-cover" autoPlay muted loop playsInline preload="metadata">
          <source src={video.src} type={video.type} />
        </video>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block break-words text-sm font-semibold leading-5 text-ink">{video.label}</span>
        <span className="mt-0.5 block break-words text-xs leading-4 text-slate-500">{video.description}</span>
      </span>
    </button>
  );
}

function PaymentStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex min-h-[4.5rem] items-center gap-3 border-b border-slate-200 px-5 py-3.5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-9 w-9 flex-none text-[#008b6d]" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 7.5h14.5A2.5 2.5 0 0 1 21 10v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5a2 2 0 0 1 2-2Z" />
        <path d="M4.5 7.5 16 4.4a2 2 0 0 1 2.5 1.9v1.2" />
        <path d="M17 13h4v4h-4a2 2 0 0 1 0-4Z" />
        <path d="M18.5 15h.01" />
      </svg>
      <span>
        <span className="block text-sm font-semibold text-[#ff5a00]">{value}</span>
        <span className="block text-sm leading-4 text-slate-700">{label}</span>
      </span>
    </div>
  );
}
