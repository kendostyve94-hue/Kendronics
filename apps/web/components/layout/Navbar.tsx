'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [orders, setOrders] = useState<string[]>([]);
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const lastScrollY = useRef(0);

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
      setLanguage(storedLanguage === 'en' ? 'en' : 'fr');
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

  function switchLanguage() {
    const nextLanguage = language === 'fr' ? 'en' : 'fr';
    setLanguage(nextLanguage);
    window.localStorage.setItem('kendronics.language', nextLanguage);
    document.documentElement.lang = nextLanguage;
    window.dispatchEvent(new CustomEvent('kendronics:language-changed', { detail: { language: nextLanguage } }));
  }

  return (
    <>
    <header className={`fixed left-0 right-0 top-0 z-50 text-white transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
      <div className="border-b border-white/15 bg-[#07324a]/90 px-3 py-1 text-[11px] font-medium backdrop-blur-sm sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4">
          <p className="min-w-0 truncate font-semibold tracking-wide text-white">Accelere ta creativite</p>
          <div className="flex shrink-0 items-center gap-2 text-white sm:gap-3">
            <AccountLink />
            <LanguageButton language={language} onClick={switchLanguage} />
            <a href="/centre-aide" className="hidden text-xs font-semibold transition hover:text-[#ffd22e] sm:inline">
              Centre d'aide
            </a>
          </div>
        </div>
      </div>

      <div className="border-b border-white/10 bg-[#07324a]/80 px-3 py-2 backdrop-blur-md sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-3">
          <a href="/" className="inline-flex min-w-0 items-center gap-2 text-lg font-black tracking-tight sm:gap-3 sm:text-xl" aria-label="Accueil Kendronics">
            <span className="grid h-8 w-8 shrink-0 place-items-center border-2 border-[#ffd22e] text-[8px] font-black leading-none text-[#ffd22e] sm:h-9 sm:w-9 sm:text-[9px]">
              PCB
            </span>
            <span className="truncate">
              <span className="text-[#ffd22e]">K</span>endronics
            </span>
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
            <CartLink href={cartHref} count={orders.length} />
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center border border-white/25 bg-white/10 text-white backdrop-blur transition hover:border-[#ffd22e]"
              aria-label={isMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setIsMenuOpen((open) => !open)}
            >
              <span className="flex w-5 flex-col gap-1.5">
                <span className={`h-0.5 bg-current transition ${isMenuOpen ? 'translate-y-2 rotate-45' : ''}`} />
                <span className={`h-0.5 bg-current transition ${isMenuOpen ? 'opacity-0' : ''}`} />
                <span className={`h-0.5 bg-current transition ${isMenuOpen ? '-translate-y-2 -rotate-45' : ''}`} />
              </span>
            </button>
          </div>
        </div>

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
    <MobileDock cartHref={cartHref} orderCount={orders.length} />
    </>
  );
}

function MobileDock({ cartHref, orderCount }: { cartHref: string; orderCount: number }) {
  const items = [
    { label: 'Accueil', href: '/', icon: <HomeIcon /> },
    { label: 'Devis', href: '/quote', icon: <PlusIcon />, featured: true },
    { label: 'Suivi', href: '/tracking', icon: <RouteIcon /> },
    { label: 'Compte', href: '/profile', icon: <UserIcon /> },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-[#f4f7fa]/96 px-2 pb-[calc(env(safe-area-inset-bottom)+0.4rem)] pt-1.5 shadow-[0_-12px_32px_rgba(8,20,32,0.16)] backdrop-blur lg:hidden"
      aria-label="Navigation mobile principale"
    >
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
        {items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={`relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-sm text-[11px] font-black ${
              item.featured ? 'bg-[#0f8f6b] text-white shadow-sm' : 'text-slate-700 hover:bg-white'
            }`}
          >
            <span className="grid h-5 w-5 place-items-center">{item.icon}</span>
            <span>{item.label}</span>
          </a>
        ))}
        <a href={cartHref} className="sr-only">
          Panier {orderCount}
        </a>
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

function AccountLink() {
  return (
    <a href="/profile" className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/30 bg-white/10 transition hover:border-[#ffd22e]" aria-label="Repertoire utilisateur">
      <UserIcon />
    </a>
  );
}

function LanguageButton({ language, onClick }: { language: 'fr' | 'en'; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/30 bg-white/10 transition hover:border-[#ffd22e]"
      aria-label={`Basculer en ${language === 'fr' ? 'anglais' : 'francais'}`}
      title={language === 'fr' ? 'Passer en anglais' : 'Passer en francais'}
    >
      <GlobeIcon />
    </button>
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

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="7.5" r="3.5" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3.5 12h17" />
      <path d="M12 3a15 15 0 0 1 0 18" />
      <path d="M12 3a15 15 0 0 0 0 18" />
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
