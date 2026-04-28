'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { readAuthSession } from '../../lib/auth-session';
import { Button } from '../ui/Button';

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

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [orders, setOrders] = useState<string[]>([]);
  const [userLabel, setUserLabel] = useState('Mon compte');
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

      const session = readAuthSession();
      setUserLabel(session?.accessToken ? extractSessionLabel(session.accessToken) : 'Invite');
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
  }

  return (
    <header className={`fixed left-0 right-0 top-0 z-50 text-white transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
      <div className="border-b border-white/15 bg-[#07324a]/90 px-4 py-2 text-[11px] font-medium backdrop-blur-sm sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4">
          <p className="font-semibold tracking-wide text-white">Accelere ta creativite</p>
          <div className="flex items-center gap-3 text-white">
            <AccountMenu userLabel={userLabel} />
            <LanguageButton language={language} onClick={switchLanguage} />
            <a href="/centre-aide" className="hidden text-xs font-semibold transition hover:text-[#ffd22e] sm:inline">
              Centre d'aide
            </a>
          </div>
        </div>
      </div>

      <div className="border-b border-white/10 bg-[#07324a]/80 px-4 py-4 backdrop-blur-md sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4">
          <a href="/" className="inline-flex items-center gap-3 text-2xl font-black tracking-tight" aria-label="Accueil Kendronics">
            <span className="grid h-10 w-10 place-items-center border-2 border-[#ffd22e] text-[10px] font-black leading-none text-[#ffd22e]">
              PCB
            </span>
            <span>
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
            <a href="/quote" className="inline-flex h-10 items-center border border-[#0f8f6b] px-4 font-medium text-white transition hover:border-[#12a87c] hover:text-[#ffd22e]">
              Commande
            </a>
            <LoginMenu />
          </nav>

          <div className="flex items-center gap-3 lg:hidden">
            <CartLink href={cartHref} count={orders.length} />
            <Button href="/quote" className="hidden h-10 px-5 text-xs sm:inline-flex">
              Commande
            </Button>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center border border-white/25 bg-white/10 text-white backdrop-blur transition hover:border-[#ffd22e]"
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
          <nav id="mobile-navigation" className="mx-auto mt-5 grid max-w-[1180px] gap-2 border-t border-white/15 pt-4 lg:hidden">
            {[...productItems, ...supportItems, ...aboutItems, { label: 'Suivi', href: '/tracking' }, { label: 'Commande', href: '/quote' }, { label: 'Connexion', href: '/login' }, { label: 'Creer mon compte', href: '/register' }, { label: "Centre d'aide", href: '/centre-aide' }].map((item) => (
              <a
                key={`${item.label}-${item.href}`}
                href={item.href}
                className="flex min-h-11 items-center border border-white/15 bg-white/10 px-4 text-sm font-medium text-white transition hover:border-[#ffd22e] hover:text-[#ffd22e]"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </nav>
        ) : null}
      </div>
    </header>
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
      <a href="/login" className="inline-flex h-10 items-center rounded-full bg-[#0f8f6b] px-5 font-medium text-white transition hover:bg-[#0b7558]">
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
    <a href={href} className="relative inline-flex h-10 w-10 items-center justify-center text-white transition hover:text-[#ffd22e]" aria-label="Panier">
      <CartIcon />
      <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-pink-500 px-1 text-[11px] font-semibold leading-none text-white">
        {count}
      </span>
    </a>
  );
}

function AccountMenu({ userLabel }: { userLabel: string }) {
  return (
    <div className="group relative">
      <a href="/profile" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/10 transition hover:border-[#ffd22e]" aria-label="Repertoire utilisateur">
        <UserIcon />
      </a>
      <div className="invisible absolute right-full top-0 z-[80] mr-3 flex h-9 min-w-72 items-center gap-3 border border-slate-200 bg-white px-3 text-slate-950 opacity-0 shadow-[0_12px_28px_rgba(15,23,42,0.18)] transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        <span className="truncate text-xs font-medium text-slate-600">{userLabel}</span>
        <a href="/profile" className="shrink-0 text-xs font-semibold text-[#0f8f6b] hover:text-[#0b7558]">
          Modifier mes informations
        </a>
      </div>
    </div>
  );
}

function LanguageButton({ language, onClick }: { language: 'fr' | 'en'; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/10 transition hover:border-[#ffd22e]"
      aria-label={`Basculer en ${language === 'fr' ? 'anglais' : 'francais'}`}
      title={language === 'fr' ? 'Passer en anglais' : 'Passer en francais'}
    >
      <GlobeIcon />
    </button>
  );
}

function extractSessionLabel(accessToken: string): string {
  try {
    const payload = JSON.parse(window.atob(accessToken.split('.')[1] ?? '')) as { email?: string; sub?: string };
    return payload.email ?? payload.sub ?? 'Mon compte';
  } catch {
    return 'Mon compte';
  }
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
