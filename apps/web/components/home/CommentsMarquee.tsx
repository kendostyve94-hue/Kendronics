'use client';

import { useEffect, useMemo, useState } from 'react';
import { approvedCustomerComments, CustomerComment } from '../../lib/customer-comments';

const minimumVisibleComments = 15;
const storageKey = 'kendronics_public_comments';

export function CommentsMarquee() {
  const [localComments, setLocalComments] = useState<CustomerComment[]>([]);
  const [daySeed, setDaySeed] = useState(() => Math.floor(Date.now() / 86_400_000));

  useEffect(() => {
    function loadLocalComments() {
      try {
        const parsed = JSON.parse(window.localStorage.getItem(storageKey) ?? '[]') as CustomerComment[];
        setLocalComments(parsed.filter(isVisibleComment));
      } catch {
        setLocalComments([]);
      }
    }

    loadLocalComments();
    window.addEventListener('kendronics:comment-submitted', loadLocalComments);

    const timer = window.setInterval(() => {
      setDaySeed(Math.floor(Date.now() / 86_400_000));
    }, 60_000);

    return () => {
      window.removeEventListener('kendronics:comment-submitted', loadLocalComments);
      window.clearInterval(timer);
    };
  }, []);

  const comments = useMemo(() => {
    const visible = [...localComments, ...approvedCustomerComments].filter(isVisibleComment);
    const shuffled = [...visible].sort((left, right) => dailyScore(left.id, daySeed) - dailyScore(right.id, daySeed));
    const selected = shuffled.slice(0, Math.max(minimumVisibleComments, Math.min(shuffled.length, 18)));
    return selected.length >= minimumVisibleComments ? selected : shuffled;
  }, [daySeed, localComments]);

  const track = [...comments, ...comments];

  return (
    <div className="mt-5 overflow-hidden border-y border-line bg-white/70 py-4 sm:mt-8">
      <div className="comments-marquee-track flex w-max gap-4">
        {track.map((comment, index) => (
          <article
            key={`${comment.id}-${index}`}
            className="h-36 w-[280px] shrink-0 rounded-sm border border-line bg-white px-4 py-4 sm:w-[340px]"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-ink">{comment.name}</h3>
                <p className="mt-1 text-xs font-bold text-slate-500">{comment.role}</p>
              </div>
              <div className="whitespace-nowrap text-sm text-[#c8951d]" aria-label={`${comment.rating} etoiles`}>
                {'★'.repeat(comment.rating)}
              </div>
            </div>
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{comment.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function isVisibleComment(comment: CustomerComment) {
  return comment.rating >= 3 && comment.rating <= 5 && comment.body.trim().length > 0;
}

function dailyScore(value: string, daySeed: number) {
  let hash = daySeed;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 1_000_003;
  }

  return hash;
}
