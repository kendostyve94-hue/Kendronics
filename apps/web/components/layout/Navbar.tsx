'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
const ORDER_STORAGE_KEY = 'kendronics.customer.orders';

const productItems = [
  { label: 'PCB standard', href: '/services#pcb-standard' },
  { label: 'PCB petit lot', href: '/services#pcb-petit-lot' },
  { label: 'PCB avance', href: '/services#pcb-avance' },
  { label: 'Assistance technique', href: '/services#assistance-technique' },
];

const supportItems = [
  { label: 'Capacite', href: '/capabilities' },
  { label: 'Comment ca marche', href: '/how-it-works' },
  { label: 'Guide technique', href: '/guide-technique' },
];

const aboutItems = [
  { label: 'Qui sommes-nous', href: '/how-it-works' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Remboursement', href: '/refund-policy' },
  { label: 'Termes et conditions', href: '/terms' },
  { label: 'Cookies', href: '/cookie-policy' },
];

const mobileActionItems = [
  { label: 'Suivi', href: '/tracking' },
  { label: 'Commande', href: '/quote' },
  { label: 'Connexion', href: '/login' },
  { label: 'Creer mon compte', href: '/register' },
];

const searchItems = [
  { label: 'Accueil', href: '/', keywords: 'home accueil kendronics' },
  { label: 'Devis PCB', href: '/quote', keywords: 'devis commande pcb pcba gerber prix' },
  { label: 'Panier', href: '/orders/demo', keywords: 'panier commande order' },
  { label: 'Suivi', href: '/tracking', keywords: 'suivi tracking livraison commande' },
  { label: 'Services', href: '/services', keywords: 'services pcb pcba stencil assemblage' },
  { label: 'Guide technique', href: '/guide-technique', keywords: 'guide technique gerber kicad easyeda' },
  { label: 'Centre aide', href: '/centre-aide', keywords: 'aide support faq contact' },
  { label: 'Compte', href: '/profile', keywords: 'compte profil utilisateur' },
];

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [orders, setOrders] = useState<string[]>([]);
  const lastScrollY = useRef(0);
  const pathname = usePathname();

  useEffect(() => {
    function handleScroll() {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 8) {
        setIsVisible(true);
      } else if (currentScrollY < lastScrollY.current) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY.current) {
        setIsVisible(false);
      }

      lastScrollY.current = currentScrollY;
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    function refreshClientState() {
      const storedLanguage = window.localStorage.getItem('kendronics.language');
      document.documentElement.lang = storedLanguage === 'en' ? 'en' : 'fr';

      try {
        const parsedOrders = JSON.parse(window.localStorage.getItem(ORDER_STORAGE_KEY) ?? '[]') as string[];
        setOrders(Array.isArray(parsedOrders) ? parsedOrders.filter(Boolean) : []);
      } catch {
        setOrders([]);
      }

    }

    refreshClientState();
    window.addEventListener('storage', refreshClientState);
    window.addEventListener('kendronics:orders-updated', refreshClientState);
    return () => {
      window.removeEventListener('storage', refreshClientState);
      window.removeEventListener('kendronics:orders-updated', refreshClientState);
    };
  }, []);

  const cartHref = useMemo(() => {
    const lastOrderId = orders[0];
    return lastOrderId ? `/orders/${lastOrderId}` : '/orders/demo';
  }, [orders]);

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const items = searchItems.map((item) => (item.label === 'Panier' ? { ...item, href: cartHref } : item));
    if (!query) return items.slice(0, 5);
    return items.filter((item) => `${item.label} ${item.keywords}`.toLowerCase().includes(query)).slice(0, 6);
  }, [cartHref, searchQuery]);

  return (
    <>
    <header className={`fixed left-0 right-0 top-0 z-50 text-white transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
      <div className="border-b border-white/10 bg-[#07324a] px-3 py-2 shadow-[0_10px_28px_rgba(8,20,32,0.18)] sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-3">
          <a href="/" className="inline-flex min-w-0 items-center" aria-label="Accueil Kendronics">
            <img
              src="/images/kendronics-logo.png"
              alt="Kendronics"
              className="h-16 w-auto max-w-[18rem] object-contain sm:h-20 sm:max-w-[22rem]"
            />
          </a>

          <nav className="hidden items-center gap-4 text-sm font-medium lg:flex">
            <Dropdown label="Produit" items={productItems} />
            <Dropdown label="Support" items={supportItems} />
            <Dropdown label="A propos" items={aboutItems} />
            <a href="/tracking" className="text-white transition hover:text-[#ffd22e]">
              Suivi
            </a>
            <CartLink href={cartHref} count={orders.length} />
            <a href="/quote" className="inline-flex h-9 items-center rounded-full border border-[#0f8f6b] px-5 font-medium text-white transition hover:border-[#12a87c] hover:text-[#ffd22e]">
              Commande
            </a>
            <LoginMenu />
          </nav>

          <div className="flex shrink-0 items-center gap-2 lg:hidden">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center text-white transition hover:text-[#ffd22e]"
              aria-label="Rechercher"
              aria-expanded={isSearchOpen}
              onClick={() => {
                setIsSearchOpen((open) => !open);
                setIsMenuOpen(false);
              }}
            >
              <SearchIcon />
            </button>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center text-white transition hover:text-[#ffd22e]"
              aria-label={isMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-navigation"
              onClick={() => {
                setIsMenuOpen((open) => !open);
                setIsSearchOpen(false);
              }}
            >
              <span className="flex w-5 flex-col gap-1.5">
                <span className={`h-0.5 bg-current transition ${isMenuOpen ? 'translate-y-2 rotate-45' : ''}`} />
                <span className={`h-0.5 bg-current transition ${isMenuOpen ? 'opacity-0' : ''}`} />
                <span className={`h-0.5 bg-current transition ${isMenuOpen ? '-translate-y-2 -rotate-45' : ''}`} />
              </span>
            </button>
          </div>
        </div>

        {isSearchOpen ? (
          <div className="mx-auto mt-3 max-w-[1180px] border-t border-white/15 pt-3 lg:hidden">
            <form
              role="search"
              onSubmit={(event) => {
                event.preventDefault();
                const firstResult = searchResults[0];
                if (firstResult) window.location.href = firstResult.href;
              }}
            >
              <label className="flex h-11 items-center gap-2 border border-white/20 bg-white px-3 text-ink">
                <SearchIcon small />
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Rechercher une page, un service..."
                  className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-slate-500"
                />
              </label>
            </form>
            <div className="mt-2 grid gap-1">
              {searchResults.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex min-h-10 items-center border border-white/10 bg-white/10 px-3 text-sm font-semibold text-white transition hover:border-[#ffd22e] hover:text-[#ffd22e]"
                  onClick={() => setIsSearchOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              {searchResults.length === 0 ? (
                <p className="border border-white/10 bg-white/10 px-3 py-3 text-sm font-semibold text-white">Aucun resultat trouve.</p>
              ) : null}
            </div>
          </div>
        ) : null}

        {isMenuOpen ? (
          <nav id="mobile-navigation" className="mx-auto mt-3 max-h-[calc(100vh-6.5rem)] max-w-[1180px] overflow-y-auto border-t border-white/15 pt-3 lg:hidden">
            <div className="grid gap-2">
              <MobileSection title="Produit" items={productItems} onNavigate={() => setIsMenuOpen(false)} defaultOpen />
              <MobileSection title="Support" items={supportItems} onNavigate={() => setIsMenuOpen(false)} />
              <MobileSection title="A propos" items={aboutItems} onNavigate={() => setIsMenuOpen(false)} />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/15 pt-3">
              {mobileActionItems.map((item) => (
                <a
                  key={`${item.label}-${item.href}`}
                  href={item.href}
                  className={`flex min-h-10 items-center justify-center border px-3 text-center text-xs font-semibold text-white transition hover:border-[#ffd22e] hover:text-[#ffd22e] ${
                    item.label === 'Commande' || item.label === 'Suivi'
                      ? 'rounded-full border-[#0f8f6b] bg-[#07324a]/40'
                      : item.label === 'Connexion' || item.label === 'Creer mon compte'
                        ? 'rounded-full border-[#0f8f6b] bg-[#0f8f6b]'
                        : 'border-white/15 bg-white/10'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </nav>
        ) : null}
      </div>
    </header>
    <MobileDock cartHref={cartHref} orderCount={orders.length} pathname={pathname} />
    </>
  );
}

function MobileDock({ cartHref, orderCount, pathname }: { cartHref: string; orderCount: number; pathname: string }) {
  const items = [
    { label: 'Accueil', href: '/', icon: <HomeIcon /> },
    { label: 'Panier', href: cartHref, icon: <CartIcon />, count: orderCount },
    { label: 'Devis', href: '/quote', icon: <PlusIcon /> },
    { label: 'Suivi', href: '/tracking', icon: <RouteIcon /> },
    { label: 'Compte', href: '/profile', icon: <UserIcon /> },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-[#f4f7fa] px-2 pb-[calc(env(safe-area-inset-bottom)+0.4rem)] pt-1.5 shadow-[0_-12px_32px_rgba(8,20,32,0.16)] lg:hidden"
      aria-label="Navigation mobile principale"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {items.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : item.label === 'Panier'
                ? pathname.startsWith('/orders')
                : pathname.startsWith(item.href);

          return (
            <a
              key={item.label}
              href={item.href}
              className="relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-sm text-[11px] font-black text-slate-700 transition hover:bg-white"
              aria-current={isActive ? 'page' : undefined}
            >
              <span className={`relative grid h-5 w-5 place-items-center ${isActive ? 'text-[#0f8f6b]' : ''}`}>
                {item.icon}
                {item.count != null ? (
                  <span className="absolute -right-2 -top-2 grid min-h-4 min-w-4 place-items-center rounded-full bg-pink-500 px-1 text-[10px] font-black leading-none text-white">
                    {item.count}
                  </span>
                ) : null}
              </span>
              <span className={isActive ? 'text-[#0f8f6b]' : ''}>{item.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}

function MobileSection({
  title,
  items,
  onNavigate,
  defaultOpen = false,
}: {
  title: string;
  items: Array<{ label: string; href: string }>;
  onNavigate: () => void;
  defaultOpen?: boolean;
}) {
  return (
    <details className="group border border-[#0f8f6b]/70 bg-[#0f8f6b]/18 shadow-[inset_3px_0_#0f8f6b]" open={defaultOpen}>
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-4 text-base font-semibold text-white">
        <span>{title}</span>
        <span className="text-xs text-[#ffd22e] transition group-open:rotate-180">v</span>
      </summary>
      <div className="grid border-t border-[#0f8f6b]/40 bg-[#07324a]/75 p-1.5">
        {items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="flex min-h-10 items-center px-3 text-sm font-medium text-white transition hover:bg-white/10 hover:text-[#ffd22e]"
            onClick={onNavigate}
          >
            {item.label}
          </a>
        ))}
      </div>
    </details>
  );
}

function Dropdown({ label, items }: { label: string; items: Array<{ label: string; href: string }> }) {
  return (
    <div className="group relative">
      <button type="button" className="inline-flex h-10 items-center gap-1 text-white transition hover:text-[#ffd22e]" aria-haspopup="true">
        {label}
        <span className="text-[10px]">v</span>
      </button>
      <div className="invisible absolute right-0 top-full min-w-44 translate-y-2 border border-slate-200 bg-white p-1.5 text-slate-950 opacity-0 shadow-[0_16px_38px_rgba(15,23,42,0.22)] transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
        {items.map((item) => (
          <a key={item.href} href={item.href} className="block px-3 py-1.5 text-xs font-medium text-slate-800 transition hover:bg-[#eaf2fb] hover:text-[#0877ff]">
            {item.label}
          </a>
        ))}
      </div>
    </div>
  );
}

function LoginMenu() {
  return (
    <div className="group relative">
      <a href="/login" className="inline-flex h-9 items-center rounded-full bg-[#0f8f6b] px-5 font-medium text-white transition hover:bg-[#0b7558]">
        Connexion
      </a>
      <div className="invisible absolute right-0 top-full min-w-60 translate-y-2 border border-slate-200 bg-white p-4 text-slate-950 opacity-0 shadow-[0_18px_44px_rgba(15,23,42,0.22)] transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
        <span className="absolute -top-2 right-8 h-4 w-4 rotate-45 border-l border-t border-slate-200 bg-white" />
        <a href="/login" className="flex h-10 items-center justify-center rounded-full bg-[#0f8f6b] text-sm font-semibold text-white hover:bg-[#0b7558]">
          Connexion
        </a>
        <p className="mt-3 text-sm text-slate-600">
          Nouveau client ?{' '}
          <a href="/register" className="font-semibold text-[#0f8f6b] hover:text-[#0b7558]">
            Creer mon compte
          </a>
        </p>
      </div>
    </div>
  );
}

function CartLink({ href, count }: { href: string; count: number }) {
  return (
    <a href={href} className="relative inline-flex h-9 w-9 items-center justify-center text-white transition hover:text-[#ffd22e] sm:h-10 sm:w-10" aria-label="Panier">
      <CartIcon />
      <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-pink-500 px-1 text-[11px] font-semibold leading-none text-white">
        {count}
      </span>
    </a>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M3 4h2l2.3 11.2a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 1.9-1.4L21 8H6.2" />
    </svg>
  );
}

function SearchIcon({ small = false }: { small?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={small ? 'h-4 w-4 shrink-0' : 'h-6 w-6'}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="7.5" r="3.5" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 10.8 12 3l9 7.8" />
      <path d="M5.5 9.5V21h13V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function RouteIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="6" r="2" />
      <path d="M8 18h4a4 4 0 0 0 0-8h-1a4 4 0 0 1 0-8h5" />
    </svg>
  );
}
