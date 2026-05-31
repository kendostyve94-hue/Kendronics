'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getApiBaseUrl } from '../../lib/api-base-url';
import { readAuthSession } from '../../lib/auth-session';
import { purgeLegacySensitiveStorage, readScopedLocalStorage, writeScopedLocalStorage } from '../../lib/user-scoped-storage';
import { useI18n, type TranslationKey } from './LanguageRuntime';
const ORDER_STORAGE_KEY = 'kendronics.customer.orders';
const AVATAR_STORAGE_KEY = 'kendronics.customer.avatar';
const PROFILE_STORAGE_KEY = 'kendronics.customer.profile';
const apiBaseUrl = getApiBaseUrl();

type NavLabelKey = TranslationKey;
type NavItem = { labelKey: NavLabelKey; href: string };
type SearchItem = NavItem & { keywords: string };
type MobileProfileMenuItem = { label: string; href: string; count?: number };
type MobileProfileMenuGroup = { title: string; items: MobileProfileMenuItem[] };

const searchItems = [
  { labelKey: 'nav.home', href: '/', keywords: 'home accueil kendronics' },
  { labelKey: 'nav.quote', href: '/quote', keywords: 'devis quote commande pcb pcba gerber prix' },
  { labelKey: 'nav.cart', href: '/orders', keywords: 'panier cart commande order' },
  { labelKey: 'nav.tracking', href: '/tracking', keywords: 'suivi tracking livraison commande' },
  { labelKey: 'nav.item.services', href: '/services', keywords: 'services pcb pcba stencil assemblage' },
  { labelKey: 'nav.item.technicalGuide', href: '/guide-technique', keywords: 'guide technical technique gerber kicad easyeda' },
  { labelKey: 'nav.item.helpCenter', href: '/centre-aide', keywords: 'aide help support faq contact' },
  { labelKey: 'nav.item.profile', href: '/profile', keywords: 'compte account profil utilisateur' },
] satisfies SearchItem[];

const profileNavItems = [
  { label: 'Devis immediat', href: '/quote' },
  { label: 'PCB prototype', href: '/services#pcb-standard' },
  { label: 'Petites series', href: '/services#pcb-petit-lot' },
  { label: 'PCB avance', href: '/services#pcb-avance' },
  { label: 'Assistance Gerber', href: '/services#assistance-technique' },
  { label: 'Comment ca marche', href: '/how-it-works' },
  { label: 'Admin', href: '/admin' },
] satisfies Array<{ label: string; href: string }>;

function mobileProfileMenuGroups(unreadNotifications: number): MobileProfileMenuGroup[] {
  return [
    {
      title: 'Espace client',
      items: [
        { label: 'Tableau de bord', href: '/profile' },
        { label: 'Mes commandes', href: '/profile?view=orders' },
        { label: 'Notifications', href: '/profile?view=notifications', count: unreadNotifications },
      ],
    },
    {
      title: 'Suivi commande',
      items: [
        { label: 'Verification', href: '/profile?view=verification' },
        { label: 'Paiement', href: '/profile?view=payment-pending' },
        { label: 'Production', href: '/profile?view=production' },
        { label: 'Livraison', href: '/profile?view=delivery' },
        { label: 'Commentaires', href: '/profile?view=comments' },
      ],
    },
    {
      title: 'Services',
      items: [
        { label: 'Services et demandes', href: '/profile?view=services' },
        { label: 'Support', href: '/profile?view=support' },
        { label: 'Parrainage', href: '/profile?view=invite' },
        { label: 'Centre aide', href: '/centre-aide' },
      ],
    },
    {
      title: 'Profil',
      items: [
        { label: 'Adresse livraison', href: '/profile?view=shipping-address' },
        { label: 'Historique des commandes', href: '/profile?view=all-orders' },
        { label: 'Parametres', href: '/profile?view=settings' },
        { label: 'Deconnexion et securite', href: '/profile?view=settings' },
      ],
    },
  ];
}

export function Navbar({ hideHeader = false }: { hideHeader?: boolean }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [openMobileSection, setOpenMobileSection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [orders, setOrders] = useState<string[]>([]);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [avatarDataUrl, setAvatarDataUrl] = useState('');
  const [firstName, setFirstName] = useState('Rafale');
  const [profileView, setProfileView] = useState('');
  const headerRef = useRef<HTMLElement | null>(null);
  const lastScrollY = useRef(0);
  const pathname = usePathname();
  const { language, t, toggleLanguage } = useI18n();

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
      purgeLegacySensitiveStorage();
      try {
        const parsedOrders = JSON.parse(readScopedLocalStorage(ORDER_STORAGE_KEY) ?? '[]') as string[];
        setOrders(Array.isArray(parsedOrders) ? parsedOrders.filter(Boolean) : []);
      } catch {
        setOrders([]);
      }

      const session = readAuthSession();
      const storedProfile = readStoredProfile();
      const sessionEmail = readSessionEmail(session?.accessToken ?? '');
      setIsSignedIn(Boolean(session));
      if (!session) setIsAdmin(false);
      setAvatarDataUrl(readScopedLocalStorage(AVATAR_STORAGE_KEY) ?? '');
      setFirstName(firstNameOf(storedProfile.name || emailName(sessionEmail || storedProfile.email || '') || 'Rafale'));
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
        writeScopedLocalStorage(ORDER_STORAGE_KEY, JSON.stringify(ids.slice(0, 20)));
        setOrders(ids);
      } catch {
        // The dock keeps the last local cart state if the API is temporarily unavailable.
      }
    }

    async function refreshAdminRole() {
      const session = readAuthSession();
      if (!session) {
        setIsAdmin(false);
        return;
      }

      try {
        const response = await fetch(`${apiBaseUrl}/api/users/me`, {
          headers: { Authorization: `${session.tokenType} ${session.accessToken}` },
          cache: 'no-store',
        });
        if (!response.ok) {
          setIsAdmin(false);
          return;
        }

        const user = (await response.json()) as { roles?: string[] } | null;
        setIsAdmin(Array.isArray(user?.roles) && user.roles.includes('admin'));
      } catch {
        setIsAdmin(false);
      }
    }

    async function refreshNotifications() {
      const session = readAuthSession();
      if (!session) {
        setUnreadNotifications(0);
        return;
      }

      try {
        const response = await fetch(`${apiBaseUrl}/api/notifications`, {
          headers: { Authorization: `${session.tokenType} ${session.accessToken}` },
          cache: 'no-store',
        });
        if (!response.ok) return;
        const payload = (await response.json()) as Array<{ readAt?: string | null }>;
        setUnreadNotifications(payload.filter((notification) => !notification.readAt).length);
      } catch {
        setUnreadNotifications(0);
      }
    }

    function refreshSessionState() {
      refreshClientState();
      void refreshServerOrders();
      void refreshAdminRole();
      void refreshNotifications();
    }

    void refreshServerOrders();
    void refreshAdminRole();
    void refreshNotifications();
    window.addEventListener('storage', refreshSessionState);
    window.addEventListener('kendronics:auth-updated', refreshSessionState);
    window.addEventListener('kendronics:orders-updated', refreshSessionState);
    window.addEventListener('kendronics:avatar-updated', refreshSessionState);
    return () => {
      window.removeEventListener('storage', refreshSessionState);
      window.removeEventListener('kendronics:auth-updated', refreshSessionState);
      window.removeEventListener('kendronics:orders-updated', refreshSessionState);
      window.removeEventListener('kendronics:avatar-updated', refreshSessionState);
    };
  }, []);

  useEffect(() => {
    function refreshProfileView() {
      setProfileView(new URLSearchParams(window.location.search).get('view') ?? '');
    }

    refreshProfileView();
    window.addEventListener('popstate', refreshProfileView);
    return () => window.removeEventListener('popstate', refreshProfileView);
  }, [pathname]);

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

  const cartHref = '/profile?view=orders';

  const visibleProfileNavItems = useMemo(() => {
    return profileNavItems.filter((item) => item.href !== '/admin' || isAdmin);
  }, [isAdmin]);

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const items = searchItems.map((item) => (item.labelKey === 'nav.cart' ? { ...item, href: cartHref } : item));
    if (!query) return [];
    return items.filter((item) => `${t(item.labelKey)} ${item.keywords}`.toLowerCase().includes(query)).slice(0, 6);
  }, [cartHref, searchQuery, t]);
  return (
    <>
    {hideHeader ? null : <header ref={headerRef} className={`fixed left-0 right-0 top-0 z-50 text-slate-800 transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
      <div className="border-b border-[#d7d7d7] bg-white px-3 py-0 sm:px-6 lg:px-5">
        <div className="mx-auto flex h-[70px] max-w-[21.5rem] items-center justify-between gap-3 sm:max-w-[1180px] lg:max-w-[1368px]">
          <div className="flex min-w-0 flex-1 items-center gap-3 lg:gap-5">
            <a href="/" className="-ml-3 inline-flex shrink-0 items-center sm:ml-0 lg:mr-2" aria-label="Accueil Kendronics">
              <img
                src="/images/kendronics-logo.png"
                alt="Kendronics"
                className="h-12 w-auto max-w-[12.5rem] object-contain"
              />
            </a>

            <nav className="hidden min-w-0 flex-1 snap-x items-center justify-between gap-1 text-[14px] font-normal text-[#111827] xl:gap-2 xl:text-[15px] lg:flex">
              {visibleProfileNavItems.map((item) => (
                <a key={`${item.href}-${item.label}`} href={item.href} className="grid min-h-[54px] min-w-[84px] snap-start place-items-center px-1 text-center leading-6 transition hover:text-[#00a651] xl:min-w-[92px] xl:px-2">
                  {item.label}
                </a>
              ))}
            </nav>
          </div>

          <nav className="hidden shrink-0 items-center justify-end gap-3 text-[15px] font-normal text-slate-800 xl:gap-4 lg:flex">
            <LanguageToggle language={language} label={t('nav.language')} onToggle={toggleLanguage} switchLabel={language === 'fr' ? t('nav.switchToEnglish') : t('nav.switchToFrench')} />
            {isSignedIn ? <NotificationBell count={unreadNotifications} /> : null}
            <CartLink href={cartHref} count={orders.length} />
            <LoginMenu isSignedIn={isSignedIn} avatarDataUrl={avatarDataUrl} firstName={firstName} t={t} />
          </nav>

          <div className="flex shrink-0 items-center gap-2 lg:hidden">
            {isSignedIn ? (
              <>
                <NotificationBell count={unreadNotifications} compact />
                <a href="/profile" className="grid h-8 w-8 place-items-center overflow-hidden rounded-sm border border-[#d1d5db] bg-[#0b1724] text-xs font-black text-white" aria-label={t('nav.openAccount')}>
                  <img src={avatarDataUrl || '/images/kendronics-icon.jpeg'} alt="Avatar client" className="h-full w-full object-cover" />
                </a>
              </>
            ) : (
              <a href="/login" onClick={(event) => { event.preventDefault(); openAuthRequired('login'); }} className="inline-flex h-9 items-center gap-1.5 px-1 text-xs font-semibold text-[#111827] transition hover:text-[#0f8f6b]" aria-label={t('nav.login')}>
                <UserIcon />
                <span>Connexion</span>
              </a>
            )}
            <button
              type="button"
              disabled={!isSignedIn}
              className={`inline-flex h-9 w-9 items-center justify-center transition ${
                isSignedIn
                  ? 'text-[#0f8f6b] hover:text-[#0b7558]'
                  : 'cursor-not-allowed text-[#9aa6b2] opacity-60'
              }`}
              aria-label={isMenuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-navigation"
              onClick={() => {
                if (!isSignedIn) return;
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
          <div className="mx-auto max-w-[21.5rem] border-t border-slate-200 py-2 sm:max-w-[1180px] lg:max-w-[1368px]">
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
                  placeholder={t('nav.searchPlaceholder')}
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
                  {t(item.labelKey)}
                </a>
              ))}
              {searchResults.length === 0 ? (
                <p className="rounded-sm border border-slate-200 bg-[#edf3f8] px-3 py-3 text-sm font-semibold text-slate-700">{t('nav.noSearchResults')}</p>
              ) : null}
            </div>
            ) : null}
          </div>
        ) : null}

        {isMenuOpen ? (
          <nav id="mobile-navigation" className="mx-auto mt-2 max-h-[calc(100vh-6rem)] max-w-[21.5rem] overflow-y-auto border-t border-slate-200 bg-white px-1 pb-4 pt-2 sm:max-w-[40rem] lg:hidden">
            <div className="grid">
              {mobileProfileMenuGroups(unreadNotifications).map((group) => (
                <MobileProfileSection
                  key={group.title}
                  group={group}
                  isOpen={openMobileSection === group.title}
                  onToggle={() => setOpenMobileSection((current) => (current === group.title ? null : group.title))}
                  onNavigate={() => setIsMenuOpen(false)}
                />
              ))}
            </div>
            <div className="mt-5 grid gap-2.5">
              <a href="/quote" onClick={() => setIsMenuOpen(false)} className="flex min-h-12 items-center justify-center gap-2 rounded-sm bg-[#0f8f6b] px-4 text-sm font-semibold text-white transition hover:bg-[#0b7558]">
                Demarrer maintenant <span aria-hidden="true">›</span>
              </a>
              <a href="/contact" onClick={() => setIsMenuOpen(false)} className="flex min-h-12 items-center justify-center rounded-sm border border-[#0f8f6b]/35 bg-white px-4 text-sm font-semibold text-[#0f8f6b] transition hover:border-[#0f8f6b] hover:bg-[#eefbf6]">
                Contacter notre equipe
              </a>
            </div>
          </nav>
        ) : null}
      </div>
    </header>}
    <MobileDock cartHref={cartHref} orderCount={orders.length} pathname={pathname} profileView={profileView} />
    </>
  );
}

function NotificationBell({ count, compact = false }: { count: number; compact?: boolean }) {
  return (
    <a href="/profile?view=notifications" className={`relative inline-flex items-center justify-center text-[#0f8f6b] transition hover:text-[#0b7558] ${compact ? 'h-9 w-9' : 'h-10 w-10'}`} aria-label="Notifications">
      <BellIcon />
      {count > 0 ? (
        <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#f59e0b] px-1 text-[10px] font-medium leading-none text-white">
          {count > 9 ? '9+' : count}
        </span>
      ) : null}
    </a>
  );
}

function MobileDock({ cartHref, orderCount, pathname, profileView }: { cartHref: string; orderCount: number; pathname: string; profileView: string }) {
  const { t } = useI18n();
  const items = [
    { labelKey: 'nav.home' as const, href: '/', icon: <HomeIcon /> },
    { labelKey: 'nav.cart' as const, href: cartHref, icon: <CartIcon />, count: orderCount },
    { labelKey: 'nav.quote' as const, href: '/quote', icon: <PlusIcon /> },
    { labelKey: 'nav.tracking' as const, href: '/tracking', icon: <RouteIcon /> },
    { labelKey: 'nav.account' as const, href: '/profile', icon: <UserIcon /> },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 bg-[#e9eff5] px-2 pb-[calc(env(safe-area-inset-bottom)+0.4rem)] pt-0 lg:hidden"
      aria-label="Navigation mobile principale"
    >
      <div className="mx-auto grid max-w-[21.5rem] grid-cols-5 gap-1">
        {items.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : item.labelKey === 'nav.cart'
                ? pathname.startsWith('/orders') || (pathname === '/profile' && profileView === 'orders')
                : item.labelKey === 'nav.account'
                  ? pathname === '/profile' && profileView !== 'orders'
                  : pathname.startsWith(item.href);

          return (
            <a
              key={item.labelKey}
              href={item.href}
              className={`relative flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-black transition ${
                isActive
                  ? 'text-[#0f8f6b]'
                  : 'text-slate-700 hover:text-[#0f8f6b]'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className={`relative grid h-5 w-5 place-items-center ${isActive ? 'text-[#0f8f6b]' : ''}`}>
                {item.icon}
                {item.count != null ? (
                <span className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-[#ec3b91] text-[10px] font-medium leading-none text-white">
                    {item.count}
                  </span>
                ) : null}
              </span>
              <span className={isActive ? 'text-[#0f8f6b]' : ''}>{t(item.labelKey)}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}

function MobileProfileSection({ group, isOpen, onToggle, onNavigate }: { group: MobileProfileMenuGroup; isOpen: boolean; onToggle: () => void; onNavigate: () => void }) {
  return (
    <div className="border-b border-dashed border-slate-200 last:border-b-0">
      <button type="button" className="flex min-h-[2.9rem] w-full items-center justify-between text-left text-[1.08rem] font-semibold leading-none text-[#0b1724]" aria-expanded={isOpen} onClick={onToggle}>
        <span>{group.title}</span>
        <span className={`text-xl leading-none text-[#0f8f6b] transition ${isOpen ? 'rotate-90' : ''}`} aria-hidden="true">›</span>
      </button>
      {isOpen ? (
      <div className="grid gap-1 pb-2">
        {group.items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="flex min-h-9 items-center justify-between rounded-sm bg-[#eef6fb] px-3 text-xs font-medium text-[#243447] transition hover:bg-[#e4f7f0] hover:text-[#0f8f6b]"
            onClick={onNavigate}
          >
            <span>{item.label}</span>
            {item.count && item.count > 0 ? <span className="grid min-h-5 min-w-5 place-items-center rounded-full bg-[#f59e0b] px-1 text-[10px] font-semibold text-white">{item.count > 9 ? '9+' : item.count}</span> : null}
          </a>
        ))}
      </div>
      ) : null}
    </div>
  );
}

function Dropdown({ label, items, t }: { label: string; items: NavItem[]; t: (key: NavLabelKey) => string }) {
  return (
    <div className="group relative">
      <button type="button" className="inline-flex h-14 items-center gap-1 text-slate-900 transition hover:text-[#0f8f6b]" aria-haspopup="true">
        {label}
        <span className="text-[10px]">v</span>
      </button>
      <div className="invisible absolute right-0 top-full min-w-44 translate-y-2 border border-slate-200 bg-[#edf3f8] p-1.5 text-slate-950 opacity-0 transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
        {items.map((item) => (
          <a key={item.href} href={item.href} className="block px-3 py-1.5 text-sm font-normal text-slate-800 transition hover:bg-[#f1f5f9] hover:text-[#0f8f6b]">
            {t(item.labelKey)}
          </a>
        ))}
      </div>
    </div>
  );
}

function openAuthRequired(panel: 'register' | 'login' = 'register', step: 'choice' | 'form' = 'choice') {
  window.dispatchEvent(new CustomEvent('kendronics:open-auth-required', { detail: { panel, step } }));
}
function LoginMenu({ isSignedIn, avatarDataUrl, firstName, t }: { isSignedIn: boolean; avatarDataUrl: string; firstName: string; t: (key: NavLabelKey) => string }) {
  if (isSignedIn) {
    return (
      <div className="flex min-w-0 items-center gap-2.5">
        <a href="/profile" className="grid h-10 w-10 place-items-center overflow-hidden rounded-sm border border-[#d1d5db] bg-[#0b1724]" aria-label={t('nav.openAccount')}>
          <img src={avatarDataUrl || '/images/kendronics-icon.jpeg'} alt="Avatar client" className="h-full w-full object-cover" />
        </a>
        <a href="/profile" className="min-w-0 max-w-[8.5rem] text-xs leading-5 text-[#64748b] transition hover:text-[#0f8f6b] xl:max-w-[9.5rem]" aria-label={t('nav.openAccount')}>
          <span className="block truncate">Bonjour, {firstName}</span>
          <strong className="block truncate text-sm font-black text-[#00a651]">Mon Espace</strong>
        </a>
      </div>
    );
  }

  return (
    <div className="group relative">
      <div className="flex min-w-[170px] items-center gap-2 text-[#111827]">
        <a href="/login" onClick={(event) => { event.preventDefault(); openAuthRequired('login'); }} className="grid h-9 w-9 place-items-center text-[#111827] transition hover:text-[#0f8f6b]" aria-label={t('nav.login')}>
          <UserIcon />
        </a>
        <div className="min-w-0 text-[13px] leading-5">
          <p className="whitespace-nowrap font-semibold">
            <a href="/login" onClick={(event) => { event.preventDefault(); openAuthRequired('login'); }} className="transition hover:text-[#0f8f6b]">Se connecter</a>
            <span className="px-1 text-[#6b7280]">|</span>
            <a href="/register" onClick={(event) => { event.preventDefault(); openAuthRequired('register'); }} className="transition hover:text-[#0f8f6b]">S'inscrire</a>
          </p>
          <a href="/login" onClick={(event) => { event.preventDefault(); openAuthRequired('register'); }} className="block whitespace-nowrap font-black text-[#00a651] transition hover:text-[#0f8f6b]">
            Mon Espace
          </a>
        </div>
      </div>
      <div className="hidden">
        <span className="absolute -top-2 right-8 h-4 w-4 rotate-45 border-l border-t border-slate-200 bg-[#edf3f8]" />
        <a href="/login" className="flex h-10 items-center justify-center rounded-sm bg-[#0877ff] text-sm font-semibold text-white hover:bg-[#0068e8]">
          {t('nav.login')}
        </a>
        <p className="mt-3 text-sm text-slate-600">
          {t('nav.newCustomer')}{' '}
          <a href="/register" className="font-semibold text-[#0f8f6b] hover:text-[#0b7558]">
            {t('nav.createAccount')}
          </a>
        </p>
      </div>
    </div>
  );
}

function LanguageToggle({
  language,
  label,
  switchLabel,
  compact = false,
  onToggle,
}: {
  language: 'fr' | 'en';
  label: string;
  switchLabel: string;
  compact?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className={`inline-flex h-9 items-center justify-center bg-transparent text-[#0f8f6b] transition hover:text-[#0b7558] ${
        compact ? 'w-9 gap-0' : 'gap-1.5 px-1'
      }`}
      aria-label={switchLabel}
      title={switchLabel}
      onClick={onToggle}
      data-i18n-skip="true"
    >
      <GlobeIcon />
      <span className="text-[10px] font-semibold uppercase tracking-[0.04em]">{language}</span>
      <span className="sr-only">{label}</span>
    </button>
  );
}

function CartLink({ href, count }: { href: string; count: number }) {
  const { t } = useI18n();
  return (
    <a href={href} className="relative inline-flex h-9 w-9 items-center justify-center text-[#0f8f6b] transition hover:text-[#0b7558] sm:h-10 sm:w-10" aria-label={t('nav.cart')}>
      <CartIcon />
      <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-[#ec3b91] text-[10px] font-medium leading-none text-white">
        {count}
      </span>
    </a>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M3 4h2l2.3 11.2a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 1.9-1.4L21 8H6.2" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  );
}

function readStoredProfile(): { name?: string; email?: string } {
  try {
    return JSON.parse(readScopedLocalStorage(PROFILE_STORAGE_KEY) ?? '{}') as { name?: string; email?: string };
  } catch {
    return {};
  }
}

function readSessionEmail(accessToken: string) {
  if (!accessToken) return '';

  try {
    const payload = JSON.parse(window.atob(accessToken.split('.')[1] ?? '')) as { email?: string };
    return payload.email ?? '';
  } catch {
    return '';
  }
}

function emailName(email: string) {
  return email.includes('@') ? email.split('@')[0] : '';
}

function firstNameOf(value: string) {
  return value.trim().split(/[\s._-]+/).filter(Boolean)[0] || 'Rafale';
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

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a13.5 13.5 0 0 1 0 18" />
      <path d="M12 3a13.5 13.5 0 0 0 0 18" />
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
