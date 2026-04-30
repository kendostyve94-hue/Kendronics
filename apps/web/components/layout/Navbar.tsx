'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getApiBaseUrl } from '../../lib/api-base-url';
import { readAuthSession } from '../../lib/auth-session';
const ORDER_STORAGE_KEY = 'kendronics.customer.orders';
const apiBaseUrl = getApiBaseUrl();

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
  { label: 'Connexion', href: '/login' },
  { label: 'Creer mon compte', href: '/register' },
];

const searchItems = [
  { label: 'Accueil', href: '/', keywords: 'home accueil kendronics' },
  { label: 'Devis PCB', href: '/quote', keywords: 'devis commande pcb pcba gerber prix' },
  { label: 'Panier', href: '/orders', keywords: 'panier commande order' },
  { label: 'Suivi', href: '/tracking', keywords: 'suivi tracking livraison commande' },
  { label: 'Services', href: '/services', keywords: 'services pcb pcba stencil assemblage' },
  { label: 'Guide technique', href: '/guide-technique', keywords: 'guide technique gerber kicad easyeda' },
  { label: 'Centre aide', href: '/centre-aide', keywords: 'aide support faq contact' },
  { label: 'Compte', href: '/profile', keywords: 'compte profil utilisateur' },
];

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [openMobileSection, setOpenMobileSection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [orders, setOrders] = useState<string[]>([]);
  const headerRef = useRef<HTMLElement | null>(null);
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

    async function refreshServerOrders() {
      const session = readAuthSession();
      if (!session) return;

      try {
        const response = await fetch(`${apiBaseUrl}/api/orders`, {
          headers: { Authorization: `${session.tokenType} ${session.accessToken}` },
          cache: 'no-store',
        });
        if (!response.ok) return;
        const payload = (await response.json()) as Array<{ id?: string }>;
        const ids = payload.map((order) => order.id).filter((id): id is string => Boolean(id));
        window.localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(ids.slice(0, 20)));
        setOrders(ids);
      } catch {
        // The dock keeps the last local cart state if the API is temporarily unavailable.
      }
    }

    void refreshServerOrders();
    window.addEventListener('storage', refreshClientState);
    window.addEventListener('kendronics:orders-updated', refreshClientState);
    return () => {
      window.removeEventListener('storage', refreshClientState);
      window.removeEventListener('kendronics:orders-updated', refreshClientState);
    };
  }, []);

  useEffect(() => {
    function closeMobilePanels(event: PointerEvent) {
      if (!headerRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
        setIsSearchOpen(false);
        setOpenMobileSection(null);
      }
    }

    if (isMenuOpen || isSearchOpen) {
      document.addEventListener('pointerdown', closeMobilePanels);
    }

    return () => document.removeEventListener('pointerdown', closeMobilePanels);
  }, [isMenuOpen, isSearchOpen]);

  const cartHref = useMemo(() => {
    return '/orders';
  }, [orders]);

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const items = searchItems.map((item) => (item.label === 'Panier' ? { ...item, href: cartHref } : item));
    if (!query) return [];
    return items.filter((item) => `${item.label} ${item.keywords}`.toLowerCase().includes(query)).slice(0, 6);
  }, [cartHref, searchQuery]);

  return (
    <>
    <header ref={headerRef} className={`fixed left-0 right-0 top-0 z-50 text-slate-800 transition-transform duration-300 lg:text-white ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
      <div className="border-b border-slate-200 bg-[#e9eff5] px-3 py-1 sm:px-6 sm:py-2 lg:border-white/10 lg:px-8 lg:[background:#07324a]">
        <div className="mx-auto flex max-w-[21.5rem] items-center justify-between gap-3 sm:max-w-[1180px]">
          <a href="/" className="-ml-3 inline-flex min-w-0 items-center sm:ml-0" aria-label="Accueil Kendronics">
            <img
              src="/images/kendronics-logo.png"
              alt="Kendronics"
              className="h-[4.5rem] w-auto max-w-[20.5rem] object-contain sm:h-14 sm:max-w-[14rem] lg:h-28 lg:max-w-[28rem]"
            />
          </a>

          <nav className="hidden max-w-[590px] items-center justify-end gap-4 text-sm font-medium lg:flex">
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
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-[#edf3f8] text-[#0f8f6b] transition hover:text-[#0b7558] lg:text-white lg:hover:text-[#ffd22e]"
              aria-label="Rechercher"
              aria-expanded={isSearchOpen}
              onClick={() => {
                setIsSearchOpen((open) => !open);
                setIsMenuOpen(false);
                setOpenMobileSection(null);
              }}
            >
              <SearchIcon />
            </button>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-[#edf3f8] text-[#0f8f6b] transition hover:text-[#0b7558] lg:text-white lg:hover:text-[#ffd22e]"
              aria-label={isMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-navigation"
              onClick={() => {
                setIsMenuOpen((open) => !open);
                setIsSearchOpen(false);
                setOpenMobileSection(null);
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
          <div className="mx-auto mt-2 max-w-[21.5rem] border-t border-slate-200 pt-2 sm:max-w-[1180px] lg:hidden">
            <form
              role="search"
              onSubmit={(event) => {
                event.preventDefault();
                const firstResult = searchResults[0];
                if (firstResult) window.location.href = firstResult.href;
              }}
            >
              <label className="flex h-10 items-center gap-2 rounded-sm border border-slate-200 bg-[#edf3f8] px-3 text-ink">
                <SearchIcon small />
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Rechercher une page, un service..."
                  className="min-w-0 flex-1 bg-transparent text-[16px] font-bold outline-none placeholder:text-slate-500"
                />
              </label>
            </form>
            {searchQuery.trim() ? (
            <div className="mt-2 grid gap-1">
              {searchResults.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex min-h-10 items-center rounded-sm border border-slate-200 bg-[#edf3f8] px-3 text-sm font-semibold text-slate-700 transition hover:border-[#0f8f6b] hover:text-[#0f8f6b]"
                  onClick={() => setIsSearchOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              {searchResults.length === 0 ? (
                <p className="rounded-sm border border-slate-200 bg-[#edf3f8] px-3 py-3 text-sm font-semibold text-slate-700">Aucun resultat trouve.</p>
              ) : null}
            </div>
            ) : null}
          </div>
        ) : null}

        {isMenuOpen ? (
          <nav id="mobile-navigation" className="mx-auto mt-2 max-h-[calc(100vh-6.5rem)] max-w-[21.5rem] overflow-y-auto border-t border-slate-200 pt-2 sm:max-w-[1180px] lg:hidden">
            <div className="grid gap-2">
              <MobileSection title="Produit" items={productItems} isOpen={openMobileSection === 'Produit'} onToggle={() => setOpenMobileSection((current) => (current === 'Produit' ? null : 'Produit'))} onNavigate={() => setIsMenuOpen(false)} />
              <MobileSection title="Support" items={supportItems} isOpen={openMobileSection === 'Support'} onToggle={() => setOpenMobileSection((current) => (current === 'Support' ? null : 'Support'))} onNavigate={() => setIsMenuOpen(false)} />
              <MobileSection title="A propos" items={aboutItems} isOpen={openMobileSection === 'A propos'} onToggle={() => setOpenMobileSection((current) => (current === 'A propos' ? null : 'A propos'))} onNavigate={() => setIsMenuOpen(false)} />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-200 pt-3">
              {mobileActionItems.map((item) => (
                <a
                  key={`${item.label}-${item.href}`}
                  href={item.href}
                  className={`flex min-h-10 items-center justify-center rounded-full border px-3 text-center text-xs font-semibold transition hover:border-[#0f8f6b] hover:text-[#0f8f6b] ${
                    item.label === 'Commande' || item.label === 'Suivi'
                      ? 'border-[#0f8f6b] bg-[#edf3f8] text-[#0f8f6b]'
                      : item.label === 'Connexion' || item.label === 'Creer mon compte'
                        ? 'border-[#0f8f6b] bg-[#0f8f6b] text-white'
                        : 'border-slate-200 bg-[#edf3f8] text-slate-700'
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
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-[#e9eff5] px-2 pb-[calc(env(safe-area-inset-bottom)+0.4rem)] pt-1.5 lg:hidden"
      aria-label="Navigation mobile principale"
    >
      <div className="mx-auto grid max-w-[21.5rem] grid-cols-5 gap-1">
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
              className={`relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-sm border text-[11px] font-black transition ${
                isActive
                  ? 'border-[#0f8f6b]/45 bg-[#edf3f8] text-[#0f8f6b]'
                  : 'border-transparent text-slate-700 hover:bg-[#edf3f8]'
              }`}
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
  isOpen,
  onToggle,
  onNavigate,
}: {
  title: string;
  items: Array<{ label: string; href: string }>;
  isOpen: boolean;
  onToggle: () => void;
  onNavigate: () => void;
}) {
  return (
    <div className="rounded-sm border border-slate-200 bg-[#edf3f8]">
      <button type="button" className="flex min-h-11 w-full items-center px-4 text-left text-base font-semibold text-slate-800" aria-expanded={isOpen} onClick={onToggle}>
        {title}
      </button>
      {isOpen ? (
      <div className="grid border-t border-slate-200 bg-[#e5edf4] p-1.5">
        {items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="flex min-h-10 items-center rounded-sm px-3 text-sm font-medium text-slate-700 transition hover:bg-[#edf3f8] hover:text-[#0f8f6b]"
            onClick={onNavigate}
          >
            {item.label}
          </a>
        ))}
      </div>
      ) : null}
    </div>
  );
}

function Dropdown({ label, items }: { label: string; items: Array<{ label: string; href: string }> }) {
  return (
    <div className="group relative">
      <button type="button" className="inline-flex h-10 items-center gap-1 text-white transition hover:text-[#ffd22e]" aria-haspopup="true">
        {label}
        <span className="text-[10px]">v</span>
      </button>
      <div className="invisible absolute right-0 top-full min-w-44 translate-y-2 border border-slate-200 bg-white p-1.5 text-slate-950 opacity-0 transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
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
      <div className="invisible absolute right-0 top-full min-w-60 translate-y-2 border border-slate-200 bg-white p-4 text-slate-950 opacity-0 transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
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
