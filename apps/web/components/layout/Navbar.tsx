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
type MenuLink = { label: string; href: string; description?: string; image?: string; external?: boolean };
type MenuGroup = { title: string; items: MenuLink[] };
type MainNavItem =
  | { type: 'link'; label: string; href: string }
  | { type: 'products'; label: string; groups: MenuGroup[] }
  | { type: 'support'; label: string; groups: MenuGroup[] };
type MobileMenuIconName =
  | 'pcb'
  | 'layers'
  | 'flex'
  | 'engineering'
  | 'assembly'
  | 'stencil'
  | 'manufacturing'
  | 'quote'
  | 'capabilities'
  | 'discover'
  | 'explorer'
  | 'blog'
  | 'about'
  | 'contact'
  | 'whatsapp'
  | 'channel'
  | 'youtube'
  | 'faq'
  | 'verified'
  | 'payment'
  | 'production'
  | 'delivery'
  | 'comments'
  | 'services'
  | 'profile'
  | 'invite'
  | 'dashboard'
  | 'orders'
  | 'notifications'
  | 'location'
  | 'history'
  | 'settings'
  | 'admin';
type MobileProfileMenuItem = { label: string; href: string; count?: number; icon: MobileMenuIconName };
type MobileProfileMenuGroup = { title: string; items: MobileProfileMenuItem[] };

const whatsAppHref = 'https://wa.me/3307970427';
const whatsAppChannelHref = process.env.NEXT_PUBLIC_WHATSAPP_CHANNEL_URL ?? whatsAppHref;
const youtubeChannelHref = process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_URL ?? 'https://www.youtube.com';

const searchItems = [
  { labelKey: 'nav.home', href: '/', keywords: 'home accueil kendronics' },
  { labelKey: 'nav.quote', href: '/quote', keywords: 'devis quote commande pcb pcba gerber prix' },
  { labelKey: 'nav.cart', href: '/orders', keywords: 'panier cart commande order' },
  { labelKey: 'nav.tracking', href: '/tracking', keywords: 'suivi tracking livraison commande' },
  { labelKey: 'nav.item.services', href: '/services', keywords: 'services pcb pcba stencil assemblage' },
  { labelKey: 'nav.item.technicalGuide', href: '/guide-technique', keywords: 'guide technical technique gerber kicad easyeda' },
  { labelKey: 'nav.item.helpCenter', href: '/centre-aide', keywords: 'aide help support faq contact' },
  { labelKey: 'nav.item.explorer', href: '/explorer', keywords: 'explorer projets partage community oshwlab' },
  { labelKey: 'nav.item.blog', href: '/blog', keywords: 'blog articles guides actualites pcb' },
  { labelKey: 'nav.item.profile', href: '/profile', keywords: 'compte account profil utilisateur' },
] satisfies SearchItem[];

const productMenuGroups: MenuGroup[] = [
  {
    title: 'Service PCB',
    items: [
      { label: 'PCB prototype', href: '/services#pcb-standard', image: '/images/quote-product-standard-pcb.png' },
      { label: 'Petites séries', href: '/services#pcb-petit-lot', image: '/images/product-pcb-small-batch.png' },
      { label: 'PCB Flexible & Rigide-flex', href: '/quote?product=fpc_rigid_flex', image: '/images/quote-product-fpc-rigid-flex.png' },
      { label: 'Assistance Technique', href: '/services#assistance-technique', image: '/images/product-pcb-advanced.png' },
    ],
  },
  {
    title: 'Service PCBA',
    items: [
      { label: 'PCB Assemblage', href: '/services#pcba', image: '/images/quote-product-assembly.png' },
      { label: 'Pochoir CMS', href: '/services#stencil', image: '/images/quote-product-smd-stencil.png' },
      { label: 'Impression 3D & CNC', href: '/quote?product=cnc_3d', image: '/images/quote-product-advanced-pcba.png' },
    ],
  },
];

const supportMenuGroups: MenuGroup[] = [
  {
    title: 'Contactez-nous',
    items: [
      { label: 'Contact', href: '/contact', description: 'Ticket support et demande commerciale' },
      { label: 'Contact WhatsApp', href: whatsAppHref, description: 'Message direct selon disponibilité', external: true },
      { label: 'Chaîne WhatsApp', href: whatsAppChannelHref, description: 'Actualités et nouveautés Kendronics', external: true },
      { label: 'Chaîne Youtube', href: youtubeChannelHref, description: 'Guides, fabrication et suivi', external: true },
    ],
  },
  {
    title: 'Support',
    items: [
      { label: "Centre d'aide", href: '/centre-aide', description: 'Réponses rapides, paiement, livraison et compte' },
      { label: 'FAQ', href: '/faq', description: 'Questions fréquentes avant commande' },
    ],
  },
];

const mainNavItems: MainNavItem[] = [
  { type: 'products', label: 'Produits', groups: productMenuGroups },
  { type: 'link', label: 'Devis Immédiat', href: '/quote' },
  { type: 'link', label: 'Capacité', href: '/capabilities' },
  { type: 'link', label: 'Découvrir', href: '/how-it-works' },
  { type: 'link', label: 'Explorer', href: '/explorer' },
  { type: 'link', label: 'Blog', href: '/blog' },
  { type: 'support', label: 'Support', groups: supportMenuGroups },
  { type: 'link', label: 'Apropos', href: '/terms/mentions-legales' },
];

function mobileNavGroups(unreadNotifications: number, isAdmin: boolean, isSignedIn: boolean): MobileProfileMenuGroup[] {
  const groups: MobileProfileMenuGroup[] = [
    {
      title: 'Produits',
      items: [
        { label: 'PCB prototype', href: '/services#pcb-standard', icon: 'pcb' },
        { label: 'Petites séries', href: '/services#pcb-petit-lot', icon: 'layers' },
        { label: 'PCB Flexible & Rigide-flex', href: '/quote?product=fpc_rigid_flex', icon: 'flex' },
        { label: 'Assistance Technique', href: '/services#assistance-technique', icon: 'engineering' },
        { label: 'PCB Assemblage', href: '/services#pcba', icon: 'assembly' },
        { label: 'Pochoir CMS', href: '/services#stencil', icon: 'stencil' },
        { label: 'Impression 3D & CNC', href: '/quote?product=cnc_3d', icon: 'manufacturing' },
      ],
    },
    {
      title: 'Navigation',
      items: [
        { label: 'Devis Immédiat', href: '/quote', icon: 'quote' },
        { label: 'Capacité', href: '/capabilities', icon: 'capabilities' },
        { label: 'Découvrir', href: '/how-it-works', icon: 'discover' },
        { label: 'Explorer', href: '/explorer', icon: 'explorer' },
        { label: 'Blog', href: '/blog', icon: 'blog' },
        { label: 'Apropos', href: '/terms/mentions-legales', icon: 'about' },
      ],
    },
    {
      title: 'Support',
      items: [
        { label: 'Contact', href: '/contact', icon: 'contact' },
        { label: 'Contact WhatsApp', href: whatsAppHref, icon: 'whatsapp' },
        { label: 'Chaîne WhatsApp', href: whatsAppChannelHref, icon: 'channel' },
        { label: 'Chaîne Youtube', href: youtubeChannelHref, icon: 'youtube' },
        { label: 'FAQ', href: '/faq', icon: 'faq' },
      ],
    },
  ];

  if (isSignedIn) {
    groups.push(...mobileProfileMenuGroups(unreadNotifications));
  }

  if (isAdmin) {
    groups.push({ title: 'Administration', items: [{ label: 'Admin', href: '/admin', icon: 'admin' }] });
  }

  return groups;
}

function mobileProfileMenuGroups(unreadNotifications: number): MobileProfileMenuGroup[] {
  return [
    {
      title: 'Suivi commande',
      items: [
        { label: 'Verification', href: '/profile?view=verification', icon: 'verified' },
        { label: 'Paiement', href: '/profile?view=payment-pending', icon: 'payment' },
        { label: 'Production', href: '/profile?view=production', icon: 'production' },
        { label: 'Livraison', href: '/profile?view=delivery', icon: 'delivery' },
      ],
    },
    {
      title: 'Espace professionnel',
      items: [
        { label: 'Services et demandes', href: '/profile?view=services', icon: 'services' },
        { label: 'Mon profil', href: '/profile?view=benefits', icon: 'profile' },
        { label: 'Parrainage', href: '/profile?view=invite', icon: 'invite' },
      ],
    },
    {
      title: 'Espace client',
      items: [
        { label: 'Tableau de bord', href: '/profile', icon: 'dashboard' },
        { label: 'Notifications', href: '/profile?view=notifications', count: unreadNotifications, icon: 'notifications' },
        { label: 'Adresse livraison', href: '/profile?view=shipping-address', icon: 'location' },
        { label: 'Historique des commandes', href: '/profile?view=all-orders', icon: 'history' },
        { label: 'Parametres', href: '/profile?view=settings', icon: 'settings' },
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
        <div className="mx-auto flex h-[70px] w-full max-w-none items-center justify-between gap-3 sm:max-w-[1180px] lg:max-w-[1368px]">
          <div className="flex min-w-0 flex-1 items-center gap-3 lg:gap-5">
            <a href="/" className="-ml-3 inline-flex shrink-0 items-center sm:ml-0 lg:mr-2" aria-label="Accueil Kendronics">
              <img
                src="/images/kendronics-logo.png"
                alt="Kendronics"
                className="h-12 w-auto max-w-[12.5rem] object-contain"
              />
            </a>

            <nav className="hidden min-w-0 flex-1 snap-x items-center justify-between gap-1 text-[14px] font-normal text-[#111827] xl:gap-2 xl:text-[15px] lg:flex">
              {mainNavItems.map((item) => (
                item.type === 'link' ? (
                  <a key={item.label} href={item.href} className="grid min-h-[54px] min-w-[76px] snap-start place-items-center px-1 text-center leading-6 transition hover:text-[#00a651] xl:min-w-[86px] xl:px-2">
                    {item.label}
                  </a>
                ) : item.type === 'products' ? (
                  <ProductsMegaMenu key={item.label} label={item.label} groups={item.groups} />
                ) : (
                  <SupportMegaMenu key={item.label} label={item.label} groups={item.groups} />
                )
              ))}
            </nav>
          </div>

          <nav className="hidden shrink-0 items-center justify-end gap-3 text-[15px] font-normal text-slate-800 xl:gap-4 lg:flex">
            <LanguageToggle language={language} label={t('nav.language')} onToggle={toggleLanguage} switchLabel={language === 'fr' ? t('nav.switchToEnglish') : t('nav.switchToFrench')} />
            {isSignedIn ? <NotificationBell count={unreadNotifications} /> : null}
            <CartLink href={cartHref} count={orders.length} requireAuth={!isSignedIn} />
            <LoginMenu isSignedIn={isSignedIn} avatarDataUrl={avatarDataUrl} firstName={firstName} t={t} />
          </nav>

          <div className="flex shrink-0 items-center gap-2 lg:hidden">
            {isSignedIn ? (
              <>
                <NotificationBell count={unreadNotifications} compact />
                <a href="/profile" className="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-transparent text-xs font-black text-white" aria-label={t('nav.openAccount')}>
                  <img src={avatarDataUrl || '/images/kendronics-icon.jpeg'} alt="Avatar client" className="h-full w-full rounded-full object-cover" />
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
              className="inline-flex h-9 w-9 items-center justify-center text-[#0f8f6b] transition hover:text-[#0b7558]"
              aria-label={isMenuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
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
          <div className="mx-auto w-full max-w-none border-t border-slate-200 py-2 sm:max-w-[1180px] lg:max-w-[1368px]">
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
          <nav id="mobile-navigation" className="mx-auto mt-2 max-h-[calc(100vh-6rem)] w-full max-w-none overflow-y-auto border-t border-slate-200 bg-white px-1 pb-4 pt-2 sm:max-w-[40rem] lg:hidden">
            <div className="grid">
              {mobileNavGroups(unreadNotifications, isAdmin, isSignedIn).map((group) => (
                <MobileProfileSection
                  key={group.title}
                  group={group}
                  isOpen={openMobileSection === group.title}
                  pathname={pathname}
                  profileView={profileView}
                  onToggle={() => setOpenMobileSection((current) => (current === group.title ? null : group.title))}
                  onNavigate={() => setIsMenuOpen(false)}
                />
              ))}
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
        <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#f59e0b] px-1 text-[10px] font-semibold leading-none text-white">
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
    { labelKey: 'nav.item.explorer' as const, href: '/explorer', icon: <ExplorerIcon /> },
    { labelKey: 'nav.account' as const, href: '/profile', icon: <UserIcon /> },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+0.4rem)] pt-0 lg:hidden"
      aria-label="Navigation mobile principale"
    >
      <div className="mx-auto grid w-full max-w-none grid-cols-5 gap-1 sm:max-w-[40rem]">
        {items.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : item.labelKey === 'nav.cart'
                ? pathname.startsWith('/orders') || (pathname === '/profile' && profileView === 'orders')
                : item.labelKey === 'nav.account'
                  ? pathname === '/profile' && profileView !== 'orders'
                  : item.labelKey === 'nav.item.explorer'
                    ? pathname === '/explorer'
                    : pathname.startsWith(item.href);

          return (
            <a
              key={item.labelKey}
              href={item.href}
              className={`relative flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-black transition ${
                isActive
                  ? 'text-[#0f8f6b]'
                  : 'text-[#7c8ca0] hover:text-[#0f8f6b]'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className={`relative grid h-5 w-5 place-items-center [&>svg]:h-5 [&>svg]:w-5 ${isActive ? 'text-[#0f8f6b]' : ''}`}>
                {item.icon}
                {item.count != null && item.count > 0 ? (
                <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-[#ec3b91] px-1 text-[10px] font-semibold leading-none text-white">
                    {item.count > 9 ? '9+' : item.count}
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

function MobileProfileSection({
  group,
  isOpen,
  pathname,
  profileView,
  onToggle,
  onNavigate,
}: {
  group: MobileProfileMenuGroup;
  isOpen: boolean;
  pathname: string;
  profileView: string;
  onToggle: () => void;
  onNavigate: () => void;
}) {
  return (
    <div className="border-b border-dashed border-slate-200 last:border-b-0">
      <button type="button" className="flex min-h-[2.9rem] w-full items-center justify-between text-left text-[1.08rem] font-semibold leading-none text-[#0b1724]" aria-expanded={isOpen} onClick={onToggle}>
        <span>{group.title}</span>
        <span className={`grid h-6 w-6 place-items-center text-[#0f8f6b] transition ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true">
          <ChevronDownIcon />
        </span>
      </button>
      {isOpen ? (
      <div className="grid gap-1 pb-2">
        {group.items.map((item) => {
          const isActive = isMobileMenuItemActive(item.href, pathname, profileView);
          return (
            <a
              key={`${item.label}-${item.href}`}
              href={item.href}
              className={`relative flex min-h-10 items-center gap-3 px-3 text-xs font-medium transition hover:bg-[#f6faf8] hover:text-[#0f8f6b] ${
                isActive ? 'bg-[#f2faf7] font-black text-[#0f8f6b]' : 'text-[#334155]'
              }`}
              onClick={onNavigate}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className={`grid h-5 w-5 shrink-0 place-items-center ${isActive ? 'text-[#0f8f6b]' : 'text-[#7c8ca0]'}`}>
                <MobileMaterialIcon name={item.icon} />
              </span>
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {item.count && item.count > 0 ? <span className="grid min-h-5 min-w-5 place-items-center rounded-full bg-[#102033] px-1 text-[10px] font-semibold text-white">{item.count > 9 ? '9+' : item.count}</span> : null}
              {isActive ? <span className="absolute right-0 top-0 h-full w-[3px] bg-[#0f8f6b]" /> : null}
            </a>
          );
        })}
      </div>
      ) : null}
    </div>
  );
}

function isMobileMenuItemActive(href: string, pathname: string, profileView: string): boolean {
  if (href.startsWith('http')) return false;
  const [path, query = ''] = href.split('?');
  if (path !== pathname) return false;
  const targetView = new URLSearchParams(query).get('view') ?? '';
  return path === '/profile' ? targetView === profileView || (!targetView && !profileView) : true;
}

function MobileMaterialIcon({ name }: { name: MobileMenuIconName }) {
  const paths: Record<MobileMenuIconName, string> = {
    pcb: 'M3 3h18v18H3V3Zm2 2v14h14V5H5Zm2 2h4v4H7V7Zm6 0h4v2h-4V7Zm0 4h4v6h-4v-6Zm-6 2h4v4H7v-4Z',
    layers: 'm12 2-10 5 10 5 10-5-10-5Zm-8.8 9L12 15.4l8.8-4.4L22 12l-10 5-10-5 1.2-1Zm0 4L12 19.4l8.8-4.4L22 16l-10 5-10-5 1.2-1Z',
    flex: 'M3 6h10a5 5 0 0 1 0 10H8v3l-5-4 5-4v3h5a3 3 0 0 0 0-6H3V6Z',
    engineering: 'M14.7 6.3a4 4 0 0 0-5-5l2.2 2.2-2.4 2.4-2.2-2.2a4 4 0 0 0 5 5L20 16.4l-3.6 3.6-7.7-7.7a4 4 0 0 0-5 5l2.2-2.2 2.4 2.4-2.2 2.2a4 4 0 0 0 5-5L14.7 6.3Z',
    assembly: 'M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Zm-3-9h2v4h-2V5Zm0 10h2v4h-2v-4ZM5 11h4v2H5v-2Zm10 0h4v2h-4v-2Z',
    stencil: 'M3 4h18v16H3V4Zm3 3v2h2V7H6Zm5 0v2h2V7h-2Zm5 0v2h2V7h-2ZM6 12v2h2v-2H6Zm5 0v2h2v-2h-2Zm5 0v2h2v-2h-2Z',
    manufacturing: 'M3 21V9l5 3V9l5 3V3h8v18H3Zm12-2h4V5h-4v14ZM5 19h8v-3l-3-1.8V16l-5-3v6Z',
    quote: 'M4 3h16v18H4V3Zm2 2v14h12V5H6Zm2 3h8v2H8V8Zm0 4h5v2H8v-2Zm0 4h8v2H8v-2Z',
    capabilities: 'M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z',
    discover: 'M9 21h6v-1H9v1Zm3-19a7 7 0 0 0-4 12.74V17a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.26A7 7 0 0 0 12 2Zm2 11.6V17h-4v-3.4a5 5 0 1 1 4 0Z',
    explorer: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm3.5 6.5-2 5-5 2 2-5 5-2ZM12 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z',
    blog: 'M4 3h16v18H4V3Zm3 4v2h10V7H7Zm0 4v2h10v-2H7Zm0 4v2h7v-2H7Z',
    about: 'M11 17h2v-6h-2v6Zm1-15a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm-1-11h2V7h-2v2Z',
    contact: 'M20 4H4a2 2 0 0 0-2 2v12h4v4l4-4h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2ZM6 9h12v2H6V9Zm0 4h8v2H6v-2Z',
    whatsapp: 'M16.04 3.2A12.75 12.75 0 0 0 5.2 22.64L3.6 28.8l6.3-1.65a12.72 12.72 0 1 0 6.14-23.95Zm0 23.34a10.58 10.58 0 0 1-5.4-1.48l-.39-.23-3.74.98 1-3.65-.25-.38a10.59 10.59 0 1 1 8.79 4.76Z',
    channel: 'M4 6h16v12H4V6Zm2 2v8h12V8H6Zm3 2 6 2-6 2v-4Z',
    youtube: 'M21.6 7.2a3 3 0 0 0-2.1-2.1C17.6 4.6 12 4.6 12 4.6s-5.6 0-7.5.5a3 3 0 0 0-2.1 2.1C2 9.1 2 12 2 12s0 2.9.4 4.8a3 3 0 0 0 2.1 2.1c1.9.5 7.5.5 7.5.5s5.6 0 7.5-.5a3 3 0 0 0 2.1-2.1c.4-1.9.4-4.8.4-4.8s0-2.9-.4-4.8ZM10 15.5v-7l6 3.5-6 3.5Z',
    faq: 'M11 18h2v-2h-2v2Zm1-16A10 10 0 1 0 12 22 10 10 0 0 0 12 2Zm0 14h-2c0-3 3-2.75 3-5a1 1 0 0 0-2 0H9a3 3 0 0 1 6 0c0 3.25-3 3.5-3 5Z',
    verified: 'm23 12-2.44-2.79.34-3.69-3.61-.82L15.4 1.5 12 2.96 8.6 1.5 6.71 4.69l-3.61.82.34 3.69L1 12l2.44 2.79-.34 3.7 3.61.81 1.89 3.2 3.4-1.47 3.4 1.47 1.89-3.19 3.61-.82-.34-3.69L23 12Zm-12.91 4.72-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35Z',
    payment: 'M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 14H3v-6h18v6Zm0-10H3V6h18v2Z',
    production: 'M3 21V9l5 3V9l5 3V3h8v18H3Zm12-2h4V5h-4v14ZM5 19h8v-3l-3-1.8V16l-5-3v6Z',
    delivery: 'M20 8h-3V4H3a2 2 0 0 0-2 2v11h2a3 3 0 0 0 6 0h6a3 3 0 0 0 6 0h2v-5l-3-4ZM6 18.5A1.5 1.5 0 1 1 6 15a1.5 1.5 0 0 1 0 3.5ZM17 12V9.5h2.5l1.96 2.5H17Z',
    comments: 'M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1Zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1Z',
    services: 'M22.7 19 13.6 9.9c.9-2.3.4-5-1.5-6.9A6 6 0 0 0 5 2l4.3 4.3-3 3L2 5a6 6 0 0 0 1 7.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1 3.7-3.7Z',
    profile: 'M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.42 0-8 2.24-8 5v3h16v-3c0-2.76-3.58-5-8-5Z',
    invite: 'M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4ZM6 10V7H4v3H1v2h3v3h2v-3h3v-2H6Zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z',
    dashboard: 'M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z',
    orders: 'M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2ZM1 2v2h2l3.6 7.59-1.35 2.45A2 2 0 0 0 7 17h12v-2H7.42l.9-2h7.23a2 2 0 0 0 1.75-1.03L20.88 5H5.21l-.94-2H1Zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2Z',
    notifications: 'M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2Zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4a1.5 1.5 0 0 0-3 0v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2Z',
    location: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z',
    history: 'M13 3a9 9 0 0 0-8.95 8H1l4 4 4-4H6.05A7 7 0 1 1 13 19a6.9 6.9 0 0 1-4.9-2.1l-1.42 1.42A8.9 8.9 0 0 0 13 21a9 9 0 0 0 0-18Zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12Z',
    settings: 'M19.43 12.98c.04-.32.07-.65.07-.98s-.03-.66-.08-.98l2.11-1.65-2-3.46-2.49 1a7.3 7.3 0 0 0-1.69-.98L15 3.28h-4l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1-2 3.46 2.11 1.65c-.04.32-.08.66-.08.98s.03.66.08.98l-2.11 1.65 2 3.46 2.49-1c.52.4 1.08.73 1.69.98l.38 2.65h4l.38-2.65c.61-.25 1.17-.58 1.69-.98l2.49 1 2-3.46-2.13-1.65ZM13 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z',
    admin: 'M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4Zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8Z',
  };

  return (
    <svg viewBox={name === 'whatsapp' ? '0 0 32 32' : '0 0 24 24'} className="h-[18px] w-[18px]" fill="currentColor" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}

function ProductsMegaMenu({ label, groups }: { label: string; groups: MenuGroup[] }) {
  return (
    <div className="group relative grid min-h-[54px] min-w-[76px] place-items-center xl:min-w-[86px]">
      <button type="button" className="inline-flex h-full items-center gap-1.5 text-center leading-6 text-slate-900 transition hover:text-[#0f8f6b]" aria-haspopup="true">
        {label}
        <ChevronDownIcon />
      </button>
      <div className="invisible absolute left-0 top-full w-[560px] translate-y-2 border border-[#e2e8f0] bg-white p-7 text-left text-slate-950 opacity-0 transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
        <div className="grid gap-7">
          {groups.map((group) => (
            <section key={group.title}>
              <h3 className="text-sm font-black text-[#111827]">{group.title}</h3>
              <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-4">
                {group.items.map((item) => (
                  <MenuTile key={item.label} item={item} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function SupportMegaMenu({ label, groups }: { label: string; groups: MenuGroup[] }) {
  return (
    <div className="group relative grid min-h-[54px] min-w-[76px] place-items-center xl:min-w-[86px]">
      <button type="button" className="inline-flex h-full items-center gap-1.5 text-center leading-6 text-slate-900 transition hover:text-[#0f8f6b]" aria-haspopup="true">
        {label}
        <ChevronDownIcon />
      </button>
      <div className="invisible absolute right-0 top-full w-[760px] translate-y-2 border border-[#e2e8f0] bg-white p-8 text-left text-slate-950 opacity-0 transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
        <div className="grid grid-cols-[1fr_1px_0.85fr] gap-8">
          <section>
            <h3 className="text-sm font-black text-[#111827]">{groups[0]?.title}</h3>
            <div className="mt-4 grid gap-4">
              {groups[0]?.items.map((item) => (
                <SupportMenuLink key={item.label} item={item} />
              ))}
            </div>
          </section>
          <div className="bg-[#e2e8f0]" aria-hidden="true" />
          <section>
            <h3 className="text-sm font-black text-[#111827]">{groups[1]?.title}</h3>
            <div className="mt-4 grid gap-5">
              {groups[1]?.items.map((item) => (
                <SupportMenuLink key={item.label} item={item} compact />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function MenuTile({ item }: { item: MenuLink }) {
  return (
    <a href={item.href} className="grid grid-cols-[52px_1fr] items-center gap-4 text-sm text-[#1f2937] transition hover:text-[#0f8f6b]">
      <span className="grid h-12 w-12 place-items-center overflow-hidden bg-[#f6f8fa]">
        {item.image ? <img src={item.image} alt="" className="max-h-10 max-w-10 object-contain" /> : <span className="h-6 w-6 bg-[#0f8f6b]" />}
      </span>
      <span className="leading-5">{item.label}</span>
    </a>
  );
}

function SupportMenuLink({ item, compact = false }: { item: MenuLink; compact?: boolean }) {
  return (
    <a
      href={item.href}
      target={item.external ? '_blank' : undefined}
      rel={item.external ? 'noreferrer' : undefined}
      className={`block text-sm text-[#1f2937] transition hover:text-[#0f8f6b] ${compact ? 'py-1' : ''}`}
    >
      <span className="block font-medium">{item.label}</span>
      {item.description ? <span className="mt-1 block text-xs leading-5 text-[#8a8f98]">{item.description}</span> : null}
    </a>
  );
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 7.5 5 5 5-5" />
    </svg>
  );
}

function openAuthRequired(panel: 'register' | 'login' = 'register', step: 'choice' | 'form' = 'choice') {
  window.dispatchEvent(new CustomEvent('kendronics:open-auth-required', { detail: { panel, step } }));
}
function LoginMenu({ isSignedIn, avatarDataUrl, firstName, t }: { isSignedIn: boolean; avatarDataUrl: string; firstName: string; t: (key: NavLabelKey) => string }) {
  if (isSignedIn) {
    return (
      <div className="flex min-w-0 items-center gap-2.5">
        <a href="/profile" className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-transparent" aria-label={t('nav.openAccount')}>
          <img src={avatarDataUrl || '/images/kendronics-icon.jpeg'} alt="Avatar client" className="h-full w-full rounded-full object-cover" />
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

function CartLink({ href, count, requireAuth = false }: { href: string; count: number; requireAuth?: boolean }) {
  const { t } = useI18n();
  return (
    <a
      href={href}
      onClick={(event) => {
        if (!requireAuth) return;
        event.preventDefault();
        openAuthRequired('login');
      }}
      className="relative inline-flex h-9 w-9 items-center justify-center text-[#0f8f6b] transition hover:text-[#0b7558] sm:h-10 sm:w-10"
      aria-label={t('nav.cart')}
    >
      <CartIcon />
      {count > 0 ? (
        <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#ec3b91] px-1 text-[10px] font-semibold leading-none text-white">
          {count > 9 ? '9+' : count}
        </span>
      ) : null}
    </a>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
      <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2ZM1 2v2h2l3.6 7.59-1.35 2.45A2 2 0 0 0 7 17h12v-2H7.42a.25.25 0 0 1-.22-.37L8.1 13h7.45a2 2 0 0 0 1.75-1.03L20.88 5H5.21l-.94-2H1Zm16 16c-1.1 0-1.99.9-1.99 2S15.9 22 17 22s2-.9 2-2-.9-2-2-2Z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
      <path d="M12 22a2.01 2.01 0 0 0 2-2h-4a2 2 0 0 0 2 2Zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4a1.5 1.5 0 0 0-3 0v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2Z" />
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
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
      <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.42 0-8 2.24-8 5v3h16v-3c0-2.76-3.58-5-8-5Z" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="m12 3-10 9h3v9h6v-6h2v6h6v-9h3L12 3Z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M4 3h16v18H4V3Zm3 4v2h10V7H7Zm0 4v2h6v-2H7Zm0 4v2h10v-2H7Zm9-4h-2v2h2v2h2v-2h2v-2h-2V9h-2v2Z" />
    </svg>
  );
}

function ExplorerIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm3.5 6.5-2 5-5 2 2-5 5-2ZM12 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" />
    </svg>
  );
}
