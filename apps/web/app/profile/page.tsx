'use client';

import { useEffect, useState } from 'react';
import { Footer } from '../../components/layout/Footer';
import { Navbar } from '../../components/layout/Navbar';
import { getApiBaseUrl } from '../../lib/api-base-url';
import { clearAuthSession, readAuthSession, readFreshAuthSession } from '../../lib/auth-session';

const profileStorageKey = 'kendronics.customer.profile';
const avatarStorageKey = 'kendronics.customer.avatar';

type ProfileForm = {
  name: string;
  email: string;
  phone: string;
  company: string;
  country: string;
};

type DeleteReason =
  | 'unused'
  | 'not_found'
  | 'price_high'
  | 'shipping_customs_high'
  | 'delivery_slow'
  | 'process_complex'
  | 'bug'
  | 'quote_mismatch'
  | 'support_unsatisfied'
  | 'new_account'
  | 'privacy_security'
  | 'other';

type DeleteFeedback = {
  reason: DeleteReason | '';
  priceIssue: string;
  fairPrice: string;
  expectedDelivery: string;
  processIssue: string;
  bugDescription: string;
  device: string;
  browser: string;
  supportRating: string;
  supportImprovement: string;
  orderedBefore: string;
  improvementPriority: string;
  keepReason: string;
};

type DeleteModalStep = 'feedback' | 'alternative' | 'code' | 'alternative_done';
type DeleteAlternative = 'pause' | 'unsubscribe' | 'continue';

type QuickProduct = {
  title: string;
  subtitle: string;
  href: string;
  image: string;
  color: string;
};

type ProfileOrderStatus =
  | 'draft'
  | 'quoted'
  | 'awaiting_payment'
  | 'paid'
  | 'supplier_order_pending'
  | 'supplier_ordered'
  | 'supplier_in_production'
  | 'china_3pl_received'
  | 'shipped_to_africa'
  | 'customs_processing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

type ProfileOrder = {
  id: string;
  orderNumber: string;
  status: ProfileOrderStatus;
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  totalPrice?: number;
  currency?: 'EUR';
  carrierName?: string;
  trackingNumber?: string;
  createdAt: string;
  quoteSnapshot?: {
    productType: string;
    gerberFileId: string;
    quantity: number;
    finalTotal: number;
    currency: 'EUR';
  };
};

type ProfileNotification = {
  id: string;
  type: string;
  title: string;
  body?: string;
  readAt?: string;
  createdAt: string;
};

type ProfileUser = {
  id: string;
  email: string;
  fullName: string;
  companyName?: string;
  emailVerifiedAt?: string;
  createdAt: string;
};

type ProfileView =
  | 'quotes'
  | 'all-orders'
  | 'verification'
  | 'payment-pending'
  | 'production'
  | 'delivery'
  | 'completed'
  | 'comments'
  | 'services'
  | 'support'
  | 'benefits'
  | 'notifications'
  | 'shipping-address'
  | 'invite'
  | 'billing'
  | 'settings'
  | null;

const quickProducts: QuickProduct[] = [
  { title: 'Prototype PCB', subtitle: 'Commander maintenant', href: '/quote', image: '/images/quote-product-standard-pcb.png', color: '#22c55e' },
  { title: 'FPC/Rigid-Flex', subtitle: 'Commander maintenant', href: '/quote', image: '/images/quote-product-fpc-rigid-flex.png', color: '#ff7a1a' },
  { title: 'Assemblage PCB', subtitle: 'Commander maintenant', href: '/quote', image: '/images/quote-product-assembly.png', color: '#3b82f6' },
  { title: 'SMD-Stencil', subtitle: 'Commander maintenant', href: '/quote', image: '/images/quote-product-smd-stencil.png', color: '#a855f7' },
  { title: 'CNC | Impression 3D', subtitle: 'Commander maintenant', href: '/services', image: '', color: '#06b6d4' },
  { title: 'Conception PCB', subtitle: 'Commander maintenant', href: '/services', image: '', color: '#facc15' },
];

type SidebarItem = {
  label: string;
  view: ProfileView;
  count?: number;
};

type SidebarGroup = {
  title: string;
  items: SidebarItem[];
};

const serviceTiles = [
  { title: 'Prototype PCB', body: 'Devis rapide pour valider une carte, une revision ou une petite quantite.', href: '/quote' },
  { title: 'Assemblage PCBA', body: 'Centralisez PCB, composants et assemblage pour avancer vers un prototype testable.', href: '/quote' },
  { title: 'CNC / Impression 3D', body: 'Pieces mecaniques, boitiers et supports pour accompagner vos cartes.', href: '/services' },
  { title: 'Conception PCB', body: 'Accompagnement conception, reprise de schema ou preparation production.', href: '/services' },
  { title: 'Assistance Gerber', body: 'Verification de fichiers avant commande pour reduire les erreurs de fabrication.', href: '/contact' },
  { title: 'Petites series', body: 'Passage du prototype a une quantite pilote avec suivi plus structure.', href: '/quote' },
];

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileForm>({ name: '', email: '', phone: '', company: '', country: '' });
  const [accountId, setAccountId] = useState('');
  const [avatarDataUrl, setAvatarDataUrl] = useState('');
  const [activeProfileView, setActiveProfileView] = useState<ProfileView>(null);
  const [orders, setOrders] = useState<ProfileOrder[]>([]);
  const [notifications, setNotifications] = useState<ProfileNotification[]>([]);
  const [dataStatus, setDataStatus] = useState<'loading' | 'ready' | 'signed-out' | 'error'>('loading');
  useEffect(() => {
    const storedProfile = readStoredProfile();
    const sessionProfile = readSessionProfile();

    setProfile({
      name: storedProfile.name || emailName(sessionProfile.email) || '',
      email: sessionProfile.email || storedProfile.email || '',
      phone: storedProfile.phone || '',
      company: storedProfile.company || '',
      country: storedProfile.country || '',
    });
    setAccountId(sessionProfile.id || storedProfile.email || sessionProfile.email || 'kendronics');
    setAvatarDataUrl(window.localStorage.getItem(avatarStorageKey) ?? '');
    setActiveProfileView(viewFromSearchParam(new URLSearchParams(window.location.search).get('view')));

    let cancelled = false;
    async function loadProductionProfileData() {
      const session = await readFreshAuthSession();
      if (!session) {
        if (!cancelled) setDataStatus('signed-out');
        return;
      }

      try {
        const [userResponse, ordersResponse, notificationsResponse] = await Promise.all([
          authenticatedFetch<ProfileUser>('/api/users/me', session.accessToken),
          authenticatedFetch<ProfileOrder[]>('/api/orders', session.accessToken),
          authenticatedFetch<ProfileNotification[]>('/api/notifications', session.accessToken),
        ]);

        if (cancelled) return;

        setProfile((current) => ({
          name: userResponse.fullName || current.name,
          email: userResponse.email || current.email,
          phone: current.phone,
          company: userResponse.companyName || current.company,
          country: current.country,
        }));
        setAccountId(userResponse.id || sessionProfile.id || storedProfile.email || sessionProfile.email || 'kendronics');
        setOrders(ordersResponse);
        setNotifications(notificationsResponse);
        setDataStatus('ready');
      } catch {
        if (!cancelled) setDataStatus('error');
      }
    }

    void loadProductionProfileData();

    return () => {
      cancelled = true;
    };
  }, []);

  const firstName = firstNameOf(profile.name || emailName(profile.email) || 'Rafale');
  const userId = formatUserId(accountId);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f3f6fa] text-[#1f2f43]">
      <Navbar />
      <div className="w-full pt-[70px]">
        <div className="mx-auto grid min-w-[1328px] max-w-[1368px] grid-cols-[250px_minmax(0,1fr)] gap-4 px-5 py-4">
          <ProfileSidebar activeProfileView={activeProfileView} onSelectView={setActiveProfileView} counts={orderCounts(orders)} unreadNotifications={unreadNotifications(notifications)} />

          <section className="min-w-0">
            {activeProfileView ? (
              <ProfileViewContent view={activeProfileView} profile={profile} userId={userId} avatarDataUrl={avatarDataUrl} orders={orders} notifications={notifications} dataStatus={dataStatus} onNotificationsChange={setNotifications} />
            ) : (
              <>
                <ProductQuickGrid />

                <div className="mt-4 grid min-w-0 grid-cols-[minmax(0,1fr)_330px] gap-4">
                  <div className="min-w-0">
                    <DashboardPanel firstName={firstName} userId={userId} avatarDataUrl={avatarDataUrl} orders={orders} notifications={notifications} dataStatus={dataStatus} />
                    <ClientCommandPanel orders={orders} profile={profile} />
                    <StatusStrip counts={orderCounts(orders)} />
                    <OrdersTable orders={orders} dataStatus={dataStatus} />
                    <GiftExchange />
                    <ReviewsPanel />
                  </div>

                  <RightRail orders={orders} notifications={notifications} dataStatus={dataStatus} />
                </div>
              </>
            )}
          </section>
        </div>

        <Footer forceDesktop />
      </div>
    </main>
  );
}

function ProfileNavbar({ firstName, avatarDataUrl }: { firstName: string; avatarDataUrl: string }) {
  return (
    <header className="sticky top-0 z-40 min-w-[1328px] border-b border-[#d7d7d7] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.16)]">
      <div className="mx-auto flex h-[70px] max-w-[1368px] items-center gap-3 px-5">
        <a href="/" className="shrink-0 lg:mr-3" aria-label="Kendronics accueil">
          <img src="/images/kendronics-logo.png" alt="Kendronics" className="h-12 w-auto" />
        </a>
        <nav className="flex min-w-0 flex-1 snap-x items-center justify-between gap-2 text-[15px] text-[#111827]">
          <ProfileNavLink href="/profile" label="Mon compte" />
          <ProfileNavLink href="/quote" label="Devis immediat" />
          <ProfileNavLink href="/quote" label="Assemblage PCB" />
          <ProfileNavLink href="/services" label="Impression 3D" />
          <ProfileNavLink href="/services" label="Conception PCB" />
          <ProfileNavLink href="/profile?view=orders" label="Mes commandes" />
          <ProfileNavLink href="/profile" label="Parametres" />
        </nav>
        <a href="/cart" className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center text-[#0f8f6b] transition hover:text-[#0b7558]" aria-label="Panier">
          <CartIcon />
          <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-none bg-[#14c469] px-1 text-[11px] font-black leading-none text-white">0</span>
        </a>
        <a href="/profile" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-none border border-[#d1d5db] bg-[#f4f4f4]">
            {avatarDataUrl ? <img src={avatarDataUrl} alt="Avatar client" className="h-full w-full object-cover" /> : null}
          </span>
          <span className="text-xs leading-5 text-[#64748b]">
            Bonjour, {firstName}
            <strong className="block text-sm font-black text-[#00a651]">Mon Espace</strong>
          </span>
        </a>
      </div>
    </header>
  );
}

function ProfileNavLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} className="grid min-h-[54px] min-w-[92px] snap-start place-items-center px-2 text-center leading-6 hover:text-[#00a651]">
      {label}
    </a>
  );
}

function ProfileSidebar({
  activeProfileView,
  onSelectView,
  counts,
  unreadNotifications,
}: {
  activeProfileView: ProfileView;
  onSelectView: (view: ProfileView) => void;
  counts: ReturnType<typeof orderCounts>;
  unreadNotifications: number;
}) {
  const groups = profileSidebarGroups(counts, unreadNotifications);

  return (
    <aside className="sticky top-[86px] block self-start bg-white shadow-sm ring-1 ring-[#dbe4ee]">
      {groups.map((group) => (
        <section key={group.title} className="border-b border-[#e4ebf2] last:border-b-0">
          <h2 className="px-4 pb-2 pt-5 text-[11px] font-black uppercase tracking-[0.14em] text-[#64748b]">{group.title}</h2>
          <div className="block px-0 pb-4">
            {group.items.map((item, index) => {
              const isActive = item.view === activeProfileView;

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => onSelectView(item.view)}
                  className={`relative flex min-h-[36px] w-full items-center gap-3 rounded-none bg-transparent px-4 text-left text-[13px] transition hover:bg-[#f6faf8] hover:text-[#0f8f6b] ${
                    isActive ? 'font-black text-[#0f8f6b]' : 'text-[#334155]'
                  }`}
                >
                  <span className={`grid h-4 w-4 shrink-0 place-items-center border text-[9px] ${
                    isActive ? 'border-[#0f8f6b] text-[#0f8f6b]' : 'border-[#dbe4ee] text-[#94a3b8]'
                  }`}>{index + 1}</span>
                  <span className="min-w-0 truncate">{item.label}</span>
                  {item.count && item.count > 0 ? <span className="ml-auto bg-[#102033] px-1.5 text-[10px] font-black text-white">{item.count}</span> : null}
                  {isActive ? <span className="absolute right-0 top-0 h-full w-[4px] bg-[#0f8f6b]" /> : null}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </aside>
  );
}

function profileSidebarGroups(counts: ReturnType<typeof orderCounts>, unread: number): SidebarGroup[] {
  return [
    {
      title: 'Espace client',
      items: [
        { label: 'Tableau de bord', view: null },
        { label: 'Devis', view: 'quotes' },
        { label: 'Commandes', view: 'all-orders', count: counts.all },
        { label: 'Notifications', view: 'notifications', count: unread },
      ],
    },
    {
      title: 'Suivi commande',
      items: [
        { label: 'Verification', view: 'verification', count: counts.verification },
        { label: 'Paiement', view: 'payment-pending', count: counts.paymentPending },
        { label: 'Production', view: 'production', count: counts.production },
        { label: 'Livraison', view: 'delivery', count: counts.delivery },
        { label: 'Terminees', view: 'completed', count: counts.completed },
        { label: 'Commentaires', view: 'comments', count: counts.comments },
      ],
    },
    {
      title: 'Services',
      items: [
        { label: 'Services & demandes', view: 'services' },
        { label: 'Support', view: 'support' },
        { label: 'Avantages', view: 'benefits' },
        { label: 'Parrainage', view: 'invite' },
      ],
    },
    {
      title: 'Profil',
      items: [
        { label: 'Adresse livraison', view: 'shipping-address' },
        { label: 'Facturation', view: 'billing' },
        { label: 'Parametres', view: 'settings' },
      ],
    },
  ];
}

function viewFromSearchParam(value: string | null): ProfileView {
  if (!value) return null;
  const supported: Exclude<ProfileView, null>[] = [
    'quotes',
    'all-orders',
    'verification',
    'payment-pending',
    'production',
    'delivery',
    'completed',
    'comments',
    'services',
    'support',
    'benefits',
    'notifications',
    'shipping-address',
    'invite',
    'billing',
    'settings',
  ];
  if (value === 'orders') return 'all-orders';
  return supported.includes(value as Exclude<ProfileView, null>) ? (value as Exclude<ProfileView, null>) : null;
}

function ProfileViewContent({
  view,
  profile,
  userId,
  avatarDataUrl,
  orders,
  notifications,
  dataStatus,
  onNotificationsChange,
}: {
  view: Exclude<ProfileView, null>;
  profile: ProfileForm;
  userId: string;
  avatarDataUrl: string;
  orders: ProfileOrder[];
  notifications: ProfileNotification[];
  dataStatus: 'loading' | 'ready' | 'signed-out' | 'error';
  onNotificationsChange: (notifications: ProfileNotification[]) => void;
}) {
  if (view === 'quotes') return <QuotesHubSection orders={orders} dataStatus={dataStatus} />;
  if (view === 'all-orders') return <OrderReviewSection activeKey="all" title="Toutes commandes" mode="table" orders={orders} dataStatus={dataStatus} />;
  if (view === 'verification') return <OrderReviewSection activeKey="verification" title="Panier / Examen de votre commande" mode="review" orders={orders} dataStatus={dataStatus} />;
  if (view === 'payment-pending') return <OrderReviewSection activeKey="payment-pending" title="Panier / Examen de votre commande" mode="review" orders={orders} dataStatus={dataStatus} />;
  if (view === 'production') return <OrderReviewSection activeKey="production" title="Progres de la Fabrication" mode="table" orders={orders} dataStatus={dataStatus} />;
  if (view === 'delivery') return <OrderReviewSection activeKey="delivery" title="Livraison / Suivi de votre envoi" mode="table" orders={orders} dataStatus={dataStatus} />;
  if (view === 'completed') return <OrderReviewSection activeKey="completed" title="Commande completee" mode="table" orders={orders} dataStatus={dataStatus} />;
  if (view === 'comments') return <CommentsManagementSection orders={orders} dataStatus={dataStatus} />;
  if (view === 'services') return <ServicesHubSection />;
  if (view === 'support') return <SupportHubSection orders={orders} dataStatus={dataStatus} />;
  if (view === 'benefits') return <BenefitsHubSection />;
  if (view === 'notifications') return <NotificationsSection notifications={notifications} dataStatus={dataStatus} onNotificationsChange={onNotificationsChange} />;
  if (view === 'shipping-address') return <AddressFormSection title="Adresse de livraison" note="Veuillez entrer votre nouveau contact/adresse" />;
  if (view === 'invite') return <InviteSection />;
  if (view === 'billing') return <AddressFormSection title="Informations de facturation" billing />;
  if (view === 'settings') return <SettingsSection profile={profile} userId={userId} avatarDataUrl={avatarDataUrl} />;

  return null;
}

type OrderStatusKey = 'all' | 'verification' | 'payment-pending' | 'production' | 'delivery' | 'completed' | 'comments';

const orderStatuses: Array<{ key: OrderStatusKey | 'payment-unfinished' | 'engineering' | 'comments'; label: string; icon?: string }> = [
  { key: 'all', label: 'Toutes commandes' },
  { key: 'verification', label: 'Vérification en cours' },
  { key: 'payment-pending', label: 'Paiement en attente' },
  { key: 'payment-unfinished', label: 'Paiement inachevé' },
  { key: 'production', label: 'Statut de production' },
  { key: 'engineering', label: "Questions d'ingénierie", icon: '▣' },
  { key: 'delivery', label: 'Livraison' },
  { key: 'comments', label: 'Commentaires en attente' },
];

function OrderReviewSection({
  activeKey,
  title,
  mode,
  orders = [],
  dataStatus = 'ready',
}: {
  activeKey: OrderStatusKey;
  title: string;
  mode: 'review' | 'table';
  orders?: ProfileOrder[];
  dataStatus?: 'loading' | 'ready' | 'signed-out' | 'error';
}) {
  const visibleOrders = orders.filter((order) => orderMatchesStatus(order, activeKey));

  return (
    <section className="min-h-[690px] bg-white text-[#111827] shadow-sm ring-1 ring-slate-200">
      <OrderStatusHeader activeKey={activeKey} counts={orderCounts(orders)} />

      <div className="border-t-[16px] border-[#eef0f3] px-6 pb-24 pt-5">
        <div className={`${mode === 'review' ? 'flex h-12 items-center gap-2 border-b border-[#e5e7eb]' : 'flex h-10 items-center gap-2'}`}>
          <span className="grid h-[22px] w-[22px] place-items-center bg-[#61bd00] text-[18px] font-black leading-none text-white">{mode === 'review' ? '✓' : '⚙'}</span>
          <h2 className="text-xl font-normal text-black">{title}</h2>
        </div>

        {mode === 'review' ? <ReviewSearchPanel orders={visibleOrders} dataStatus={dataStatus} /> : <OrderTableSearchPanel orders={visibleOrders} dataStatus={dataStatus} />}
      </div>
    </section>
  );
}

function OrderStatusHeader({ activeKey, counts }: { activeKey: OrderStatusKey; counts: ReturnType<typeof orderCounts> }) {
  return (
    <div className="px-6 pt-4">
      <div className="flex h-11 items-center gap-3 border-b border-[#e5e7eb]">
        <span className="grid h-6 w-6 place-items-center text-xl text-[#b8b8b8]">▤</span>
        <h1 className="text-xl font-normal">Mes commandes</h1>
      </div>
      <div className="grid h-[112px] grid-cols-8 items-start px-1 pt-6">
        {orderStatuses.map((status) => {
          const active = status.key === activeKey;

          return (
            <div key={status.key} className="grid min-h-[72px] place-items-center border-r border-[#e5e7eb] px-3 text-center last:border-r-0">
              <span className={`text-[28px] font-black leading-7 ${active ? 'text-[#ff5a00]' : 'text-[#1f2937]'}`}>
                {countForStatus(status.key, counts)}
                {status.icon ? <span className="ml-1 align-middle text-[20px] text-[#20b99a]">{status.icon}</span> : null}
              </span>
              <span className={`mt-1 text-[14px] leading-4 ${active ? 'text-[#ff5a00]' : 'text-[#8a8f98]'}`}>{status.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReviewSearchPanel({ orders, dataStatus }: { orders: ProfileOrder[]; dataStatus: 'loading' | 'ready' | 'signed-out' | 'error' }) {
  return (
    <>
      <div className="flex items-center justify-between py-8 text-xs text-[#8a8f98]">
        <a href="/quote" className="text-sm text-[#8a8f98] hover:text-[#009a38]">&lt; Ajouter un nouvel article</a>
        <p>Fuseau horaire de Chine (GMT+8):&nbsp; 12/05/2026 00:12:46(Mise à jour dans 5 mins)</p>
      </div>
      <form className="border border-[#e1e1e1] bg-white px-4 py-3" onSubmit={(event) => event.preventDefault()}>
        <div className="flex items-center gap-5 text-[13px] text-black">
          <SearchField label="Numéro de produit:" />
          <SearchField label="Nom du fichier PCB:" />
          <SearchField label="Numéros de PO:" />
          <button type="submit" className="ml-auto h-[27px] min-w-[108px] bg-[#ff8a13] px-5 text-sm font-black text-white ring-1 ring-[#f07800] transition hover:bg-[#f07800]">
            Recherche
          </button>
        </div>
      </form>
      <OrdersListRows orders={orders} dataStatus={dataStatus} compact />
    </>
  );
}

function OrderTableSearchPanel({ orders, dataStatus }: { orders: ProfileOrder[]; dataStatus: 'loading' | 'ready' | 'signed-out' | 'error' }) {
  return (
    <>
      <form className="mt-4 max-w-[906px] border border-[#e1e1e1] bg-white px-4 py-3" onSubmit={(event) => event.preventDefault()}>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-black">
          <SearchField label="ID Commande:" />
          <SearchField label="Nom du fichier PCB:" />
          <SearchField label="Numéros de PO:" />
          <button type="submit" className="ml-4 h-[27px] min-w-[108px] bg-[#ff8a13] px-5 text-sm font-black text-white ring-1 ring-[#f07800] transition hover:bg-[#f07800]">
            Recherche
          </button>
        </div>
      </form>
      <div className="mt-3 grid max-w-[906px] grid-cols-4 bg-[#f0f0f0] px-3 py-3 text-xs text-black">
        <span>Produit</span>
        <span>Action du Produit</span>
        <span>Status de la commande</span>
        <span>Action de la commande</span>
      </div>
      <OrdersListRows orders={orders} dataStatus={dataStatus} />
      <div className="mt-20 h-10 max-w-[906px] bg-[#f7f7f7]" />
    </>
  );
}

function SearchField({ label }: { label: string }) {
  return (
    <label className="flex items-center gap-2">
      <span>{label}</span>
      <input className="h-6 w-[142px] border border-[#cfcfcf] bg-white px-2 outline-none focus:border-[#ff8a00]" />
    </label>
  );
}

function EmptyResult() {
  return <p className="pt-14 text-center text-base font-black text-[#92979d]">Votre recherche ne correspond à aucune liste.</p>;
}

function OrdersListRows({ orders, dataStatus, compact }: { orders: ProfileOrder[]; dataStatus: 'loading' | 'ready' | 'signed-out' | 'error'; compact?: boolean }) {
  if (dataStatus === 'loading') return <p className="pt-14 text-center text-base font-black text-[#92979d]">Chargement des commandes...</p>;
  if (dataStatus === 'signed-out') return <p className="pt-14 text-center text-base font-black text-[#92979d]">Connectez-vous pour afficher vos commandes.</p>;
  if (dataStatus === 'error') return <p className="pt-14 text-center text-base font-black text-red-600">Impossible de charger les commandes.</p>;
  if (orders.length === 0) return <EmptyResult />;

  return (
    <div className="max-w-[906px] divide-y divide-slate-200 border-x border-b border-[#e5e7eb] text-xs">
      {orders.map((order) => (
        <div key={order.id} className={`${compact ? 'grid-cols-[1fr_1fr_1fr_110px]' : 'grid-cols-4'} grid px-3 py-3`}>
          <span>{orderProductLabel(order)}</span>
          <span>{order.quoteSnapshot ? `${order.quoteSnapshot.quantity} pcs` : '-'}</span>
          <span className={statusColor(order.status)}>{orderStatusLabel(order.status)}</span>
          <a href={`/orders/${order.id}`} className="text-[#0877ff]">Voir</a>
        </div>
      ))}
    </div>
  );
}

function CommentsManagementSection({ orders, dataStatus }: { orders: ProfileOrder[]; dataStatus: 'loading' | 'ready' | 'signed-out' | 'error' }) {
  return (
    <section className="min-h-[690px] bg-white text-[#111827] shadow-sm ring-1 ring-slate-200">
      <OrderStatusHeader activeKey="comments" counts={orderCounts(orders)} />
      <div className="border-t-[16px] border-[#eef0f3] px-6 pb-24 pt-5">
        <h2 className="text-xl font-normal text-black">Gérer les commentaires</h2>
        <div className="mt-3 grid max-w-[906px] grid-cols-[1.2fr_1.2fr_0.6fr] bg-[#f0f0f0] px-3 py-3 text-xs text-black">
          <span>Produit</span>
          <span>Avis</span>
          <span>Action</span>
        </div>
        <OrdersListRows orders={orders.filter((order) => orderMatchesStatus(order, 'comments'))} dataStatus={dataStatus} compact />
        <div className="mt-20 h-10 max-w-[906px] bg-[#f7f7f7]" />
      </div>
    </section>
  );
}

function NotificationsSection({
  notifications,
  dataStatus,
  onNotificationsChange,
}: {
  notifications: ProfileNotification[];
  dataStatus: 'loading' | 'ready' | 'signed-out' | 'error';
  onNotificationsChange: (notifications: ProfileNotification[]) => void;
}) {
  const [markingRead, setMarkingRead] = useState(false);

  return (
    <section className="min-h-[690px] bg-[#eef0f3] p-5 text-black shadow-sm ring-1 ring-slate-200">
      <h1 className="text-xl font-normal">Notifications</h1>
      <div className="mt-5 flex h-[58px] items-center justify-between bg-white px-5 ring-1 ring-[#e5e7eb]">
        <div className="flex items-center gap-5 text-sm">
          <button className="border-r border-[#b8b8b8] pr-5 text-[#ff5a00]" type="button">Tout</button>
          <button className="border-r border-[#b8b8b8] pr-5" type="button">Not. Help center</button>
          <button type="button">Not. Product</button>
        </div>
        <button type="button" disabled={markingRead || notifications.every((notification) => notification.readAt)} onClick={() => void markAllNotificationsRead(notifications, onNotificationsChange, setMarkingRead)} className="rounded-none border border-[#b8b8b8] px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50">
          {markingRead ? 'Mise à jour...' : 'Tout marquer comme lu'}
        </button>
      </div>
      <div className="mt-5 bg-white px-5 py-4">
        <div className="grid grid-cols-[1fr_1fr_160px] bg-[#f0f0f0] px-5 py-4 text-xs font-black">
          <span>Notifications</span>
          <span>Article</span>
          <span>Heure(GMT+8)</span>
        </div>
        <NotificationsList notifications={notifications} dataStatus={dataStatus} />
      </div>
    </section>
  );
}

function NotificationsList({ notifications, dataStatus }: { notifications: ProfileNotification[]; dataStatus: 'loading' | 'ready' | 'signed-out' | 'error' }) {
  if (dataStatus === 'loading') return <div className="grid min-h-[136px] place-items-center text-sm text-[#92979d]">Chargement des notifications...</div>;
  if (dataStatus === 'signed-out') return <div className="grid min-h-[136px] place-items-center text-sm text-[#92979d]">Connectez-vous pour afficher vos notifications.</div>;
  if (dataStatus === 'error') return <div className="grid min-h-[136px] place-items-center text-sm text-red-600">Impossible de charger les notifications.</div>;
  if (notifications.length === 0) {
    return (
      <div className="grid min-h-[136px] place-items-center text-sm text-[#92979d]">
        <p><span className="mr-3 inline-grid h-6 w-6 place-items-center rounded-none bg-yellow-300 text-white">-</span>Votre liste de notifications est vide.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-200 text-xs">
      {notifications.map((notification) => (
        <div key={notification.id} className="grid grid-cols-[1fr_1fr_160px] px-5 py-4">
          <span className={notification.readAt ? 'text-[#6b7280]' : 'font-black text-black'}>{notification.title}</span>
          <span>{notification.body || notification.type}</span>
          <span>{formatDate(notification.createdAt)}</span>
        </div>
      ))}
    </div>
  );
}

function QuotesHubSection({ orders, dataStatus }: { orders: ProfileOrder[]; dataStatus: 'loading' | 'ready' | 'signed-out' | 'error' }) {
  const quoteOrders = orders.filter((order) => order.status === 'draft' || order.status === 'quoted');

  return (
    <section className="min-h-[690px] bg-white p-6 text-[#102033] shadow-sm ring-1 ring-[#dbe4ee]">
      <HubHeader eyebrow="Devis" title="Devis et projets en preparation" actionLabel="Nouveau devis" actionHref="/quote" />
      <div className="mt-5 grid grid-cols-3 gap-4">
        <HubMetric label="Devis ouverts" value={String(quoteOrders.length)} />
        <HubMetric label="Commandes a payer" value={String(orderCounts(orders).paymentPending)} />
        <HubMetric label="Derniere estimation" value={quoteOrders[0] ? formatMoney(quoteOrders[0].totalPrice ?? quoteOrders[0].quoteSnapshot?.finalTotal ?? 0) : '-'} />
      </div>
      <div className="mt-6 border border-[#e4ebf2]">
        <div className="grid grid-cols-[1fr_160px_160px_120px] bg-[#f8fafc] px-4 py-3 text-xs font-black text-[#64748b]">
          <span>Projet</span>
          <span>Quantite</span>
          <span>Montant</span>
          <span>Action</span>
        </div>
        <OrdersListRows orders={quoteOrders} dataStatus={dataStatus} />
      </div>
    </section>
  );
}

function ServicesHubSection() {
  return (
    <section className="min-h-[690px] bg-white p-6 text-[#102033] shadow-sm ring-1 ring-[#dbe4ee]">
      <HubHeader eyebrow="Services" title="Services disponibles dans votre espace" actionLabel="Devis immediat" actionHref="/quote" />
      <div className="mt-5 grid grid-cols-2 gap-4">
        {serviceTiles.map((service) => (
          <a key={service.title} href={service.href} className="min-h-[142px] border border-[#e4ebf2] bg-white p-5 transition hover:border-[#0f8f6b] hover:bg-[#f8fafc]">
            <h2 className="text-lg font-black text-[#102033]">{service.title}</h2>
            <p className="mt-3 text-sm leading-6 text-[#53657a]">{service.body}</p>
            <span className="mt-4 inline-flex text-xs font-black text-[#0f8f6b]">Ouvrir &gt;</span>
          </a>
        ))}
      </div>
    </section>
  );
}

function SupportHubSection({ orders, dataStatus }: { orders: ProfileOrder[]; dataStatus: 'loading' | 'ready' | 'signed-out' | 'error' }) {
  const activeOrders = orders.filter((order) => !['delivered', 'cancelled', 'refunded'].includes(order.status)).slice(0, 3);

  return (
    <section className="min-h-[690px] bg-white p-6 text-[#102033] shadow-sm ring-1 ring-[#dbe4ee]">
      <HubHeader eyebrow="Support" title="Aide, suivi et demandes commerciales" actionLabel="Contacter" actionHref="/contact" />
      <div className="mt-5 grid grid-cols-3 gap-4">
        <SupportTile title="Centre d'aide" body="Retrouvez les bases PCB, fichiers Gerber, livraison et paiement." href="/centre-aide" />
        <SupportTile title="Contact commercial" body="Une demande specifique, une serie ou un besoin d'accompagnement." href="/contact" />
        <SupportTile title="Suivi commande" body="Consultez les commandes actives et les prochaines etapes." href="/profile?view=orders" />
      </div>
      <div className="mt-6 border border-[#e4ebf2] p-5">
        <h2 className="text-lg font-black">Commandes a surveiller</h2>
        <div className="mt-4">
          <OrdersListRows orders={activeOrders} dataStatus={dataStatus} compact />
        </div>
      </div>
    </section>
  );
}

function BenefitsHubSection() {
  return (
    <section className="min-h-[690px] bg-white p-6 text-[#102033] shadow-sm ring-1 ring-[#dbe4ee]">
      <HubHeader eyebrow="Avantages" title="Coupons, credits et parrainage" actionLabel="Parrainage" actionHref="/profile?view=invite" />
      <div className="mt-5 grid grid-cols-3 gap-4">
        <HubMetric label="Coupons actifs" value="0" />
        <HubMetric label="Credits disponibles" value="0 EUR" />
        <HubMetric label="Points" value="0" />
      </div>
      <div className="mt-6 bg-[#f8fafc] p-5 text-sm leading-6 text-[#53657a] ring-1 ring-[#e4ebf2]">
        Les avantages client seront affiches ici lorsqu'ils seront disponibles. Cette section centralisera les coupons, credits, parrainage et recompenses.
      </div>
    </section>
  );
}

function HubHeader({ eyebrow, title, actionLabel, actionHref }: { eyebrow: string; title: string; actionLabel: string; actionHref: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#e4ebf2] pb-5">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#0f8f6b]">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-black text-[#102033]">{title}</h1>
      </div>
      <a href={actionHref} className="border border-[#0f8f6b] px-5 py-3 text-xs font-black text-[#0f8f6b] transition hover:bg-[#0f8f6b] hover:text-white">{actionLabel}</a>
    </div>
  );
}

function HubMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#e4ebf2] bg-[#f8fafc] p-5">
      <p className="text-xs text-[#64748b]">{label}</p>
      <p className="mt-2 text-2xl font-black text-[#102033]">{value}</p>
    </div>
  );
}

function SupportTile({ title, body, href }: { title: string; body: string; href: string }) {
  return (
    <a href={href} className="min-h-[132px] border border-[#e4ebf2] p-5 transition hover:border-[#0f8f6b] hover:bg-[#f8fafc]">
      <h2 className="text-base font-black">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-[#53657a]">{body}</p>
    </a>
  );
}

function AddressFormSection({ title, note, billing }: { title: string; note?: string; billing?: boolean }) {
  return (
    <section className="min-h-[690px] bg-white p-5 text-black shadow-sm ring-1 ring-slate-200">
      <div className="flex items-end gap-3">
        <h1 className="text-xl font-normal">{title}</h1>
        {note ? <span className="text-xs text-[#9ca3af]">{note}</span> : null}
      </div>
      <div className="mt-3 bg-[#fff8e8] px-3 py-2 text-xs ring-1 ring-[#f4dfb4]">
        <span className="mr-2 text-lg text-[#ff8a00]">▲</span>
        {billing
          ? "La mise à jour de l'adresse postale ne s'applique pas aux commandes confirmées (payées), cela inclus également les commandes ayant le statut « paiement incomplet »."
          : "La mise à jour des informations d'adresse ne s'applique pas aux commandes déjà générées. Veuillez contacter votre attaché commercial pour mettre à jour les informations d'adresse."}
      </div>
      {billing ? <p className="mt-5 text-xs text-[#6b7280]">Veuillez-vous assurer que tous les détails de facturation sont exacts et complets. Ils apparaîtront sur les factures officielles de vos achats.</p> : null}
      <AddressFields />
      <p className="mt-2 text-xs text-[#6b7280]">
        {billing
          ? "Si votre adresse de facturation n’est pas enregistrée, veuillez contacter fr-sales03@pcbway.com pour assistance."
          : "Si vous n’arrivez pas à enregistrer votre adresse postale, veuillez contacter fr-sales03@pcbway.com."}
      </p>
      <button type="button" className="mt-5 bg-[#1baa4f] px-6 py-2 text-sm font-black text-white">Soumettre</button>
    </section>
  );
}

function AddressFields() {
  return (
    <form className="mt-8 grid max-w-[720px] grid-cols-2 gap-x-7 gap-y-4">
      <ChoiceBox label="Société" />
      <ChoiceBox label="Particulier" active />
      {['Prénom *', 'Nom de famille *', 'Adresse de la rue *', 'Appartement, chambre, département, bâtiment, étage, etc. (facultatif)', 'Pays/Région *', 'État/Province/Région', 'Ville *', 'Zip/Code postal', "Numéro TVA/d'identification fiscale", 'Téléphone mobile *'].map((placeholder) => (
        <input key={placeholder} placeholder={placeholder} className="h-[46px] border border-[#d6d6d6] px-5 text-sm outline-none placeholder:text-[#b8bec8] focus:border-[#18b75b]" />
      ))}
    </form>
  );
}

function ChoiceBox({ label, active }: { label: string; active?: boolean }) {
  return (
    <button type="button" className={`flex h-10 items-center gap-4 border px-4 text-sm font-black ${active ? 'border-[#11b957] bg-[#eefbf4]' : 'border-[#d6d6d6]'}`}>
      <span className={`h-5 w-5 rounded-none border ${active ? 'border-[#11b957] bg-[#11b957]' : 'border-[#cfd3d8]'}`} />
      {label}
    </button>
  );
}

function InviteSection() {
  return (
    <section className="min-h-[690px] bg-[#eef0f3] text-black shadow-sm ring-1 ring-slate-200">
      <div className="bg-white">
        <h1 className="border-b border-[#e5e7eb] px-8 py-4 text-xl font-normal">Parrainer des amis et gagner de l'argent</h1>
        <div className="px-8 py-5 text-center">
          <p className="text-base leading-5">Envoyez le lien de parrainage à vos amis et ils pourront recevoir 5 $ de crédit gratuit en tant que nouvel utilisateur.<br />Vous recevrez un <strong>coupon-rabais de 10 $</strong> pour chaque ami qui a prépayé.<br />Vous pourrez gagner également <strong>5% de ce qu'ils dépensent en argent (1er ordre).</strong></p>
          <div className="mx-auto mt-12 grid max-w-[760px] grid-cols-3 gap-16 text-left text-[#92979d]">
            {['Parrainer un ami sur PCBWay', 'Des amis ont prépayé, vous gagnez un coupon de réduction de 10 $', "Lorsqu'un ami dépense de l'argent, vous gagnez 5% des dépenses"].map((text, index) => (
              <div key={text}>
                <span className={`mx-auto block h-[96px] w-[96px] rounded-none ${index === 0 ? 'bg-[#2cc9bb]' : index === 1 ? 'bg-[#53c7d8]' : 'bg-[#8d79b9]'}`} />
                <p className="mt-5 text-base leading-5">{text}</p>
              </div>
            ))}
          </div>
          <div className="mx-auto mt-12 max-w-[992px] bg-[#f5f5f5] p-6">
            <p className="font-black">Copiez le lien suivant et partagez plus, gagnez plus :</p>
            <div className="mx-auto mt-3 flex max-w-[590px] items-center justify-between border border-dashed border-[#c9c9c9] bg-white pl-8 text-xl font-black">
              <span>https://www.pcbway.fr/gt/S1t6V</span>
              <button type="button" className="bg-[#06b34f] px-6 py-4 text-sm text-white">Copiez le lien</button>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 bg-white px-8 py-5">
        <h2 className="text-xl font-normal">Statistiques de références</h2>
        <div className="mt-5 grid grid-cols-4 gap-6">
          {['0 INSCRIPTIONS', '0 PRÉPAYEMENTS', '$0.00 COUPON DE RÉDUCTION', '$0.00 GAINS'].map((item) => (
            <div key={item} className="grid h-[122px] place-items-center border border-[#e5e7eb] text-center text-[#92979d]">
              <strong className="block text-3xl text-[#1f2937]">{item.split(' ')[0]}</strong>{item.substring(item.indexOf(' ') + 1)}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SettingsSection({ profile, userId, avatarDataUrl }: { profile: ProfileForm; userId: string; avatarDataUrl: string }) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState<DeleteModalStep>('feedback');
  const [deleteCode, setDeleteCode] = useState('');
  const [deleteMessage, setDeleteMessage] = useState('');
  const [requestingDeleteCode, setRequestingDeleteCode] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [savingDeleteFeedback, setSavingDeleteFeedback] = useState(false);
  const [selectedAlternative, setSelectedAlternative] = useState<DeleteAlternative | null>(null);
  const [deleteFeedback, setDeleteFeedback] = useState<DeleteFeedback>(createEmptyDeleteFeedback());

  function closeDeleteModal() {
    if (requestingDeleteCode || deletingAccount || savingDeleteFeedback) return;
    setDeleteModalOpen(false);
    setDeleteStep('feedback');
    setDeleteCode('');
    setDeleteMessage('');
    setSelectedAlternative(null);
    setDeleteFeedback(createEmptyDeleteFeedback());
  }

  async function handleDeleteAlternative(alternative: DeleteAlternative) {
    setSelectedAlternative(alternative);
    setDeleteMessage('');
    const saved = await submitAccountDeletionFeedback(deleteFeedback, alternative, setSavingDeleteFeedback, setDeleteMessage);
    if (!saved) return;

    if (alternative === 'continue') {
      await requestDeleteAccountCode(setRequestingDeleteCode, setDeleteStep, setDeleteMessage);
      return;
    }

    setDeleteStep('alternative_done');
  }

  return (
    <section className="min-h-[690px] bg-white p-6 text-black shadow-sm ring-1 ring-slate-200">
      <h1 className="border-b border-[#e5e7eb] pb-4 text-xl font-normal">Paramètres du compte</h1>
      <div className="grid grid-cols-[140px_1fr_160px] gap-6 border-b border-[#e5e7eb] py-6">
        <Avatar avatarDataUrl={avatarDataUrl} size="medium" />
        <div className="grid gap-4 text-sm">
          <p className="text-base">{profile.name || 'Loïc NIANZE KENDONG'} <span className="rounded-none bg-[#a08d70] px-2 py-1 text-xs font-black text-white">Société</span></p>
          <p className="text-[#6b7280]">ID utilisateur: <span className="text-[#1f2937]">{userId}</span></p>
          <p className="text-[#6b7280]">Pays/Région <span className="ml-20 text-black">FRANCE</span></p>
          <p className="text-[#6b7280]">No de téléphone <span className="ml-16 text-black">{profile.phone || '+33753970427'}</span></p>
          <p className="text-[#6b7280]">Catégorie de client <span className="ml-12 text-black">Design/Research/Development - PCB Designer</span></p>
        </div>
        <a href="#" className="pt-12 text-sm text-[#00a651]">Modifier le profil</a>
      </div>
      {[
        ['E-mail', maskEmail(profile.email || 'contact@gmail.com'), 'Changer l’e-mail'],
        ['Mot de passe', '********', 'Changer le mot de passe'],
        ['Adresse de livraison', 'Ajouter une adresse de livraison pour votre commande chez PCBWay.', 'Modifier'],
        ['Détails de facturation', 'Ajouter une adresse de facturation pour votre commande chez PCBWay.', 'Modifier'],
      ].map(([label, value, action]) => (
        <div key={label} className="grid grid-cols-[160px_1fr_160px] border-b border-[#e5e7eb] py-5 text-sm">
          <h2 className="text-lg">{label}</h2>
          <p className="text-[#4b5563]">{value}</p>
          <a href="#" className="text-right text-[#00a651]">{action}</a>
        </div>
      ))}
      <div className="grid grid-cols-[160px_1fr_160px] border-b border-[#e5e7eb] py-5 text-sm">
        <h2 className="text-lg">Déconnexion</h2>
        <p className="text-[#4b5563]">Fermer la session sur cet appareil.</p>
        <button type="button" onClick={logout} className="text-right text-[#00a651]">Se déconnecter</button>
      </div>
      <div className="grid grid-cols-[160px_1fr_160px] border-b border-[#e5e7eb] py-5 text-sm">
        <h2 className="text-lg">Supprimer le compte</h2>
        <p className="text-[#4b5563]">Suppression definitive du compte et des donnees client associees, apres verification par e-mail.</p>
        <button
          type="button"
          onClick={() => setDeleteModalOpen(true)}
          className="text-right text-red-400 transition hover:text-red-600 active:text-red-700 disabled:cursor-not-allowed disabled:text-red-200"
        >
          Supprimer
        </button>
      </div>
      {deleteModalOpen ? (
        <DeleteAccountModal
          profile={profile}
          step={deleteStep}
          feedback={deleteFeedback}
          code={deleteCode}
          message={deleteMessage}
          selectedAlternative={selectedAlternative}
          requestingCode={requestingDeleteCode}
          deletingAccount={deletingAccount}
          savingFeedback={savingDeleteFeedback}
          onClose={closeDeleteModal}
          onFeedbackChange={setDeleteFeedback}
          onCodeChange={setDeleteCode}
          onStepChange={setDeleteStep}
          onSelectAlternative={(alternative) => void handleDeleteAlternative(alternative)}
          onRequestCode={() => void requestDeleteAccountCode(setRequestingDeleteCode, setDeleteStep, setDeleteMessage)}
          onDelete={() => void deleteAccount(deleteCode, setDeletingAccount)}
        />
      ) : null}
    </section>
  );
}

const deleteReasonOptions: { value: DeleteReason; label: string }[] = [
  { value: 'unused', label: "Je n'utilise plus le service" },
  { value: 'not_found', label: "Je n'ai pas trouve ce que je cherchais" },
  { value: 'price_high', label: 'Les prix sont trop eleves' },
  { value: 'shipping_customs_high', label: 'Les frais de livraison / douane sont trop eleves' },
  { value: 'delivery_slow', label: 'Les delais de livraison sont trop longs' },
  { value: 'process_complex', label: 'Le processus de commande est trop complique' },
  { value: 'bug', label: "J'ai rencontre un bug / probleme technique" },
  { value: 'quote_mismatch', label: 'Le devis automatique ne repond pas a mes besoins' },
  { value: 'support_unsatisfied', label: "Le service client ne m'a pas satisfait" },
  { value: 'new_account', label: 'Je cree un nouveau compte' },
  { value: 'privacy_security', label: 'Preoccupations liees a la confidentialite / securite' },
  { value: 'other', label: 'Autre' },
];

function DeleteAccountModal({
  profile,
  step,
  feedback,
  code,
  message,
  selectedAlternative,
  requestingCode,
  deletingAccount,
  savingFeedback,
  onClose,
  onFeedbackChange,
  onCodeChange,
  onStepChange,
  onSelectAlternative,
  onRequestCode,
  onDelete,
}: {
  profile: ProfileForm;
  step: DeleteModalStep;
  feedback: DeleteFeedback;
  code: string;
  message: string;
  selectedAlternative: DeleteAlternative | null;
  requestingCode: boolean;
  deletingAccount: boolean;
  savingFeedback: boolean;
  onClose: () => void;
  onFeedbackChange: (feedback: DeleteFeedback) => void;
  onCodeChange: (code: string) => void;
  onStepChange: (step: DeleteModalStep) => void;
  onSelectAlternative: (alternative: DeleteAlternative) => void;
  onRequestCode: () => void;
  onDelete: () => void;
}) {
  const canContinue = feedback.reason.length > 0;
  const alternativeCopy = selectedAlternative ? deleteAlternativeCopy(selectedAlternative) : null;

  function updateFeedback<K extends keyof DeleteFeedback>(key: K, value: DeleteFeedback[K]) {
    onFeedbackChange({ ...feedback, [key]: value });
  }

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/45 px-4">
      <div className="max-h-[92vh] w-full max-w-[34rem] overflow-hidden border border-slate-300 bg-white text-[#0f172a]">
        <div className="flex h-12 items-center justify-between border-b-4 border-[#009a38] px-4">
          <h2 className="text-sm font-normal">Suppression du compte</h2>
          <button type="button" onClick={onClose} disabled={requestingCode || deletingAccount || savingFeedback} className="text-2xl leading-none text-slate-500 hover:text-slate-900 disabled:cursor-not-allowed disabled:text-slate-300" aria-label="Fermer">
            x
          </button>
        </div>
        <div className="max-h-[calc(92vh-3rem)] overflow-y-auto p-5">
          {step === 'feedback' ? (
            <div className="space-y-5">
              <p className="text-sm leading-6 text-slate-600">
                Avant de supprimer votre compte, dites-nous ce qui n'a pas fonctionne. Une reponse courte suffit, et elle nous aide vraiment a ameliorer Kendronics.
              </p>
              <label className="grid gap-2 text-sm font-normal text-slate-700">
                <span>Pourquoi souhaitez-vous supprimer definitivement votre compte ? *</span>
                <select value={feedback.reason} onChange={(event) => updateFeedback('reason', event.target.value as DeleteReason)} className={profileModalFieldClassName}>
                  <option value="">Selectionner une raison</option>
                  {deleteReasonOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <DeleteConditionalQuestions feedback={feedback} onUpdate={updateFeedback} />
              <div className="grid gap-3 border-t border-slate-200 pt-4">
                <label className="grid gap-2 text-sm font-normal text-slate-700">
                  <span>Avez-vous deja passe une commande ?</span>
                  <select value={feedback.orderedBefore} onChange={(event) => updateFeedback('orderedBefore', event.target.value)} className={profileModalFieldClassName}>
                    <option value="">Facultatif</option>
                    <option value="yes">Oui</option>
                    <option value="no">Non</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-normal text-slate-700">
                  <span>Que devrions-nous ameliorer en priorite ?</span>
                  <select value={feedback.improvementPriority} onChange={(event) => updateFeedback('improvementPriority', event.target.value)} className={profileModalFieldClassName}>
                    <option value="">Facultatif</option>
                    {['Prix', 'Livraison', 'Rapidite', 'Interface', 'Devis automatique', 'Support client', 'Documentation technique'].map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-normal text-slate-700">
                  <span>Qu'aurions-nous pu faire pour vous garder ?</span>
                  <textarea value={feedback.keepReason} onChange={(event) => updateFeedback('keepReason', event.target.value)} rows={3} className={profileModalTextAreaClassName} placeholder="Facultatif" />
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={onClose} disabled={savingFeedback} className={profileModalSecondaryButtonClassName}>
                  Annuler
                </button>
                <button type="button" disabled={!canContinue || savingFeedback} onClick={() => onStepChange('alternative')} className={profileModalPrimaryButtonClassName}>
                  Continuer
                </button>
              </div>
            </div>
          ) : null}

          {step === 'alternative' ? (
            <div className="space-y-5">
              <p className="text-sm leading-6 text-slate-600">
                Avant de partir, vous pouvez garder votre espace sans recevoir de messages, ou simplement mettre votre compte en pause.
              </p>
              <div className="grid gap-3">
                {[
                  ['pause', 'Desactiver temporairement', 'Conserver votre historique et revenir plus tard.'],
                  ['unsubscribe', 'Se desabonner des emails', 'Garder le compte, sans communications marketing.'],
                  ['continue', 'Continuer la suppression', 'Recevoir le code de verification par e-mail.'],
                ].map(([value, title, description]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onSelectAlternative(value as DeleteAlternative)}
                    disabled={requestingCode || savingFeedback}
                    className="grid gap-1 border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-[#009a38] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="text-sm font-black text-slate-900">{title}</span>
                    <span className="text-xs leading-5 text-slate-500">{description}</span>
                  </button>
                ))}
              </div>
              {savingFeedback ? <p className="border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">Enregistrement de votre retour...</p> : null}
              {message ? <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{message}</p> : null}
              <div className="flex justify-between gap-3 pt-2">
                <button type="button" onClick={() => onStepChange('feedback')} disabled={savingFeedback || requestingCode} className={profileModalSecondaryButtonClassName}>
                  Retour
                </button>
                <button type="button" onClick={onClose} disabled={savingFeedback || requestingCode} className={profileModalSecondaryButtonClassName}>
                  Annuler
                </button>
              </div>
            </div>
          ) : null}

          {step === 'alternative_done' && alternativeCopy ? (
            <div className="space-y-5">
              <div className="border border-emerald-100 bg-emerald-50 p-4">
                <h3 className="text-base font-black text-slate-900">{alternativeCopy.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{alternativeCopy.body}</p>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={onClose} className={profileModalSecondaryButtonClassName}>
                  Annuler
                </button>
                <a href="/" className={profileModalPrimaryLinkClassName}>
                  Retour a l'accueil
                </a>
              </div>
            </div>
          ) : null}

          {step === 'code' ? (
            <div className="space-y-5">
              <p className="text-sm leading-6 text-slate-600">
                Merci pour votre retour. Entrez le code envoye a {maskEmail(profile.email || 'votre e-mail')} pour confirmer la suppression definitive.
              </p>
              <label className="grid gap-2 text-sm font-normal text-slate-700">
                <span>Code de verification *</span>
                <input
                  value={code}
                  onChange={(event) => onCodeChange(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="code a 6 chiffres"
                  className={profileModalFieldClassName}
                />
              </label>
              {message ? <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{message}</p> : null}
              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <button type="button" onClick={onClose} disabled={deletingAccount} className={profileModalSecondaryButtonClassName}>
                  Annuler
                </button>
                <button type="button" onClick={onRequestCode} disabled={requestingCode || deletingAccount} className={profileModalSecondaryButtonClassName}>
                  {requestingCode ? 'Envoi...' : 'Renvoyer le code'}
                </button>
                <button type="button" onClick={onDelete} disabled={deletingAccount || code.length !== 6} className="h-10 bg-red-600 px-5 text-sm font-normal text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500">
                  {deletingAccount ? 'Suppression...' : 'Supprimer definitivement'}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DeleteConditionalQuestions({
  feedback,
  onUpdate,
}: {
  feedback: DeleteFeedback;
  onUpdate: <K extends keyof DeleteFeedback>(key: K, value: DeleteFeedback[K]) => void;
}) {
  if (feedback.reason === 'price_high' || feedback.reason === 'shipping_customs_high') {
    return (
      <div className="grid gap-3">
        <label className="grid gap-2 text-sm font-normal text-slate-700">
          <span>Qu'est-ce qui vous semble trop cher ?</span>
          <select value={feedback.priceIssue} onChange={(event) => onUpdate('priceIssue', event.target.value)} className={profileModalFieldClassName}>
            <option value="">Facultatif</option>
            {['Fabrication PCB', 'Assemblage PCBA', 'Livraison', 'Frais de douane', 'Prix global'].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-normal text-slate-700">
          <span>Quel prix vous semblerait plus juste ?</span>
          <input value={feedback.fairPrice} onChange={(event) => onUpdate('fairPrice', event.target.value)} className={profileModalFieldClassName} placeholder="Facultatif" />
        </label>
      </div>
    );
  }

  if (feedback.reason === 'delivery_slow') {
    return (
      <label className="grid gap-2 text-sm font-normal text-slate-700">
        <span>Quelle duree de livraison attendiez-vous ?</span>
        <select value={feedback.expectedDelivery} onChange={(event) => onUpdate('expectedDelivery', event.target.value)} className={profileModalFieldClassName}>
          <option value="">Facultatif</option>
          {['2-5 jours', '1 semaine', '2 semaines', 'Plus flexible'].map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (feedback.reason === 'process_complex') {
    return (
      <label className="grid gap-2 text-sm font-normal text-slate-700">
        <span>Quelle etape vous a pose probleme ?</span>
        <select value={feedback.processIssue} onChange={(event) => onUpdate('processIssue', event.target.value)} className={profileModalFieldClassName}>
          <option value="">Facultatif</option>
          {['Creation du compte', 'Upload fichiers Gerber', 'Configuration PCB', 'Options techniques', 'Paiement', 'Choix de livraison', 'Suivi de commande'].map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (feedback.reason === 'bug') {
    return (
      <div className="grid gap-3">
        <label className="grid gap-2 text-sm font-normal text-slate-700">
          <span>Quel probleme avez-vous rencontre ?</span>
          <textarea value={feedback.bugDescription} onChange={(event) => onUpdate('bugDescription', event.target.value)} rows={3} className={profileModalTextAreaClassName} placeholder="Facultatif" />
        </label>
        <label className="grid gap-2 text-sm font-normal text-slate-700">
          <span>Sur quel appareil ?</span>
          <select value={feedback.device} onChange={(event) => onUpdate('device', event.target.value)} className={profileModalFieldClassName}>
            <option value="">Facultatif</option>
            {['Mobile', 'Desktop', 'Tablette'].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-normal text-slate-700">
          <span>Navigateur utilise ?</span>
          <input value={feedback.browser} onChange={(event) => onUpdate('browser', event.target.value)} className={profileModalFieldClassName} placeholder="Facultatif" />
        </label>
      </div>
    );
  }

  if (feedback.reason === 'support_unsatisfied') {
    return (
      <div className="grid gap-3">
        <label className="grid gap-2 text-sm font-normal text-slate-700">
          <span>Comment evalueriez-vous votre experience support ?</span>
          <select value={feedback.supportRating} onChange={(event) => onUpdate('supportRating', event.target.value)} className={profileModalFieldClassName}>
            <option value="">Facultatif</option>
            {[1, 2, 3, 4, 5].map((option) => (
              <option key={option} value={String(option)}>
                {option}/5
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-normal text-slate-700">
          <span>Que pouvons-nous ameliorer ?</span>
          <textarea value={feedback.supportImprovement} onChange={(event) => onUpdate('supportImprovement', event.target.value)} rows={3} className={profileModalTextAreaClassName} placeholder="Facultatif" />
        </label>
      </div>
    );
  }

  return null;
}

function createEmptyDeleteFeedback(): DeleteFeedback {
  return {
    reason: '',
    priceIssue: '',
    fairPrice: '',
    expectedDelivery: '',
    processIssue: '',
    bugDescription: '',
    device: '',
    browser: '',
    supportRating: '',
    supportImprovement: '',
    orderedBefore: '',
    improvementPriority: '',
    keepReason: '',
  };
}

function deleteAlternativeCopy(alternative: DeleteAlternative) {
  if (alternative === 'pause') {
    return {
      title: 'Votre compte peut rester en pause.',
      body: 'Votre espace reste disponible, avec votre historique conserve. Vous pourrez revenir quand vous serez pret, sans repartir de zero.',
    };
  }

  if (alternative === 'unsubscribe') {
    return {
      title: 'On reduit le bruit.',
      body: "C'est note. Vous pouvez garder votre espace Kendronics disponible, sans communications marketing inutiles.",
    };
  }

  return {
    title: 'Merci pour votre retour.',
    body: 'Votre avis nous aide a rendre Kendronics plus simple, plus rapide et plus juste pour les prochains utilisateurs.',
  };
}

const profileModalFieldClassName = 'h-11 border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#009a38]';
const profileModalTextAreaClassName = 'min-h-24 resize-y border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#009a38]';
const profileModalSecondaryButtonClassName = 'inline-flex h-10 items-center border border-slate-200 bg-white px-5 text-sm font-normal text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:text-slate-300';
const profileModalPrimaryButtonClassName = 'h-10 bg-[#0877ff] px-6 text-sm font-normal text-white transition hover:bg-[#0068e8] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500';
const profileModalPrimaryLinkClassName = 'inline-flex h-10 items-center bg-[#0877ff] px-6 text-sm font-normal text-white transition hover:bg-[#0068e8]';

function maskEmail(email: string) {
  const [name, domain] = email.split('@');
  if (!domain) return email;
  return `${name.slice(0, 4)}***********@${domain}`;
}

function VerificationOrdersSection() {
  return (
    <section className="min-h-[690px] bg-white text-[#111827] shadow-sm ring-1 ring-slate-200">
      <div className="px-6 pt-4">
        <div className="flex h-11 items-center gap-3 border-b border-[#e5e7eb]">
          <span className="grid h-6 w-6 place-items-center text-xl text-[#b8b8b8]">▤</span>
          <h1 className="text-xl font-normal">Mes commandes</h1>
        </div>
        <div className="grid h-[112px] grid-cols-8 items-start px-1 pt-6">
          {[
            ['0', 'Toutes commandes', false, ''],
            ['0', 'Vérification en cours', true, ''],
            ['0', 'Paiement en attente', false, ''],
            ['0', 'Paiement inachevé', false, ''],
            ['0', 'Statut de production', false, ''],
            ['0', "Questions d'ingénierie", false, '▣'],
            ['0', 'Livraison', false, ''],
            ['0', 'Commentaires en attente', false, ''],
          ].map(([count, label, active, icon]) => (
            <div key={String(label)} className="grid min-h-[72px] place-items-center border-r border-[#e5e7eb] px-3 text-center last:border-r-0">
              <span className={`text-[28px] font-black leading-7 ${active ? 'text-[#ff5a00]' : 'text-[#1f2937]'}`}>
                {count}
                {icon ? <span className="ml-1 align-middle text-[20px] text-[#20b99a]">{icon}</span> : null}
              </span>
              <span className={`mt-1 text-[14px] leading-4 ${active ? 'text-[#ff5a00]' : 'text-[#8a8f98]'}`}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t-[16px] border-[#eef0f3] px-6 pb-24 pt-5">
        <div className="flex h-12 items-center gap-2 border-b border-[#e5e7eb]">
          <span className="grid h-[22px] w-[22px] place-items-center bg-[#61bd00] text-[18px] font-black leading-none text-white">✓</span>
          <h2 className="text-xl font-normal text-black">Panier / Examen de votre commande</h2>
        </div>
        <div className="flex items-center justify-between py-8 text-xs text-[#8a8f98]">
          <a href="/quote" className="text-sm text-[#8a8f98] hover:text-[#009a38]">&lt; Ajouter un nouvel article</a>
          <p>Fuseau horaire de Chine (GMT+8):&nbsp; 11/05/2026 23:50:10(Mise à jour dans 5 mins)</p>
        </div>
        <form className="border border-[#e1e1e1] bg-white px-4 py-3">
          <div className="flex items-center gap-5 text-[13px] text-black">
            <label className="flex items-center gap-2">
              <span>Numéro de produit:</span>
              <input className="h-6 w-[142px] border border-[#cfcfcf] bg-white px-2 outline-none focus:border-[#ff8a00]" />
            </label>
            <label className="flex items-center gap-2">
              <span>Nom du fichier PCB:</span>
              <input className="h-6 w-[142px] border border-[#cfcfcf] bg-white px-2 outline-none focus:border-[#ff8a00]" />
            </label>
            <label className="flex items-center gap-2">
              <span>Numéros de PO:</span>
              <input className="h-6 w-[142px] border border-[#cfcfcf] bg-white px-2 outline-none focus:border-[#ff8a00]" />
            </label>
            <button type="submit" className="ml-auto h-[27px] min-w-[108px] bg-[#ff8a13] px-5 text-sm font-black text-white ring-1 ring-[#f07800] transition hover:bg-[#f07800]">
              Recherche
            </button>
          </div>
        </form>
        <p className="pt-14 text-center text-base font-black text-[#92979d]">
          Votre recherche ne correspond à aucune liste.
        </p>
      </div>
    </section>
  );
}

function ProductQuickGrid() {
  return (
    <section className="bg-white p-3 shadow-sm ring-1 ring-[#dbe4ee]">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#0f8f6b]">Demarrer</p>
          <h2 className="text-base font-black text-[#102033]">Services frequents</h2>
        </div>
        <a href="/profile?view=services" className="text-xs font-black text-[#0f8f6b]">Tout voir</a>
      </div>
      <div className="grid grid-cols-6 gap-3">
      {quickProducts.map((product) => (
        <a key={product.title} href={product.href} className="group relative block min-h-[154px] overflow-hidden bg-[#f8fafc] ring-1 ring-[#e4ebf2] transition hover:-translate-y-0.5 hover:ring-[#0f8f6b]">
          {product.image ? (
            <img src={product.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-90 transition duration-300 group-hover:scale-[1.025] group-hover:opacity-100" />
          ) : (
            <span className="absolute inset-0 grid place-items-center" style={{ backgroundColor: `${product.color}22` }}>
              <span className="h-14 w-16" style={{ border: `4px solid ${product.color}` }} />
            </span>
          )}
          <span className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white via-white/82 to-white/0" />
          <span className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white via-white/90 to-white/0" />
          <span className="relative z-10 block p-3">
            <span className="block min-h-8 text-[13px] font-black leading-4 text-[#102033]">{product.title}</span>
          </span>
          <span className="absolute inset-x-0 bottom-0 z-10 block px-3 pb-3 text-[11px] font-semibold leading-4 text-[#33506e]">
            {product.subtitle} &gt;
          </span>
        </a>
      ))}
      </div>
    </section>
  );
}

function DashboardPanel({
  firstName,
  userId,
  avatarDataUrl,
  orders,
  notifications,
}: {
  firstName: string;
  userId: string;
  avatarDataUrl: string;
  orders: ProfileOrder[];
  notifications: ProfileNotification[];
  dataStatus: 'loading' | 'ready' | 'signed-out' | 'error';
}) {
  const paidTotal = orders.filter((order) => order.paymentStatus === 'paid').reduce((total, order) => total + (order.totalPrice ?? order.quoteSnapshot?.finalTotal ?? 0), 0);
  const pendingTotal = orders.filter((order) => order.paymentStatus !== 'paid').reduce((total, order) => total + (order.totalPrice ?? order.quoteSnapshot?.finalTotal ?? 0), 0);
  const counts = orderCounts(orders);

  return (
    <section className="grid grid-cols-[190px_minmax(0,1fr)] bg-white shadow-sm ring-1 ring-[#dbe4ee]">
      <div className="grid place-items-center border-r border-[#e4ebf2] px-4 py-8 text-center">
        <Avatar avatarDataUrl={avatarDataUrl} size="medium" />
        <div>
          <h1 className="mt-4 text-lg font-black text-[#102033]">{firstName}</h1>
          <p className="mt-2 text-xs text-[#64748b]">ID Client: {userId}</p>
          <a href="/profile?view=settings" className="mt-4 inline-flex text-xs font-semibold text-[#0f8f6b]">Gerer mon compte</a>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#0f8f6b]">Espace client</p>
            <h2 className="mt-1 text-xl font-black text-[#102033]">Vue d'ensemble</h2>
          </div>
          <a href="/quote" className="border border-[#0f8f6b] px-4 py-2 text-xs font-black text-[#0f8f6b] transition hover:bg-[#0f8f6b] hover:text-white">Nouveau devis</a>
        </div>
        <div className="mt-4 grid grid-cols-[1fr_180px] gap-4">
          <div className="grid grid-cols-2 border border-[#e4ebf2]">
            <MetricCell label="Total paye (EUR)" value={formatMoney(paidTotal)} detail={`En attente: ${formatMoney(pendingTotal)}`} />
            <MetricCell label="Commandes" value={String(orders.length)} valueClass="text-[#102033]" />
            <MetricCell label="En production" value={String(counts.production)} />
            <MetricCell label="A traiter" value={String(counts.paymentPending + counts.verification)} detail="Devis ou paiement en attente" />
          </div>
          <div className="grid gap-2">
            <SmallInfo label="Coupons actifs" value="0" />
            <SmallInfo label="Points" value="0" action="Voir" />
            <SmallInfo label="Messages non lus" value={String(unreadNotifications(notifications))} danger />
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricCell({ label, value, detail, valueClass = 'text-[#1f2937]' }: { label: string; value: string; detail?: string; valueClass?: string }) {
  return (
    <div className="min-h-[84px] border-b border-r border-slate-200 p-4 last:border-r-0">
      <p className="text-xs text-[#64748b]">{label}</p>
      <p className={`mt-2 text-2xl font-black ${valueClass}`}>{value}</p>
      {detail ? <p className="mt-1 text-xs text-[#475569]">{detail}</p> : null}
    </div>
  );
}

function SmallInfo({ label, value, action, danger }: { label: string; value: string; action?: string; danger?: boolean }) {
  return (
    <div className="flex min-h-[48px] items-center justify-between bg-[#f8fafc] px-4 text-xs text-[#475569] ring-1 ring-[#edf2f7]">
      <span>{label}</span>
      <span className={danger ? 'rounded-none bg-red-500 px-1.5 py-0.5 font-black text-white' : 'font-black text-[#ff5a00]'}>{value}</span>
      {action ? <a href="#" className="text-[#475569]">{action}</a> : null}
    </div>
  );
}

function ReferralBanner() {
  return (
    <section className="mt-4 flex h-[74px] min-h-[68px] items-center justify-between gap-3 bg-[#fff8e8] px-5 py-0 text-[#1f2937] ring-1 ring-[#f4dfb4]">
      <div>
        <p className="text-xl font-black leading-none">Programme de parrainage</p>
        <p className="mt-2 text-xs">Le parrainage sera active lorsque les regles commerciales seront configurees.</p>
      </div>
      <a href="/contact" className="shrink-0 rounded-none bg-white px-6 py-3 text-xs font-black text-[#ff5a00]">Contacter</a>
    </section>
  );
}

function ClientCommandPanel({ orders, profile }: { orders: ProfileOrder[]; profile: ProfileForm }) {
  const pendingPayment = orders.find((order) => orderMatchesStatus(order, 'payment-pending'));
  const quotedOrder = orders.find((order) => orderMatchesStatus(order, 'verification'));
  const profileReady = [profile.name, profile.email, profile.country].every((value) => value.trim().length > 0);
  const primary = pendingPayment
    ? { title: 'Paiement en attente', body: `${pendingPayment.orderNumber} peut passer en production des validation du paiement.`, href: `/orders/${pendingPayment.id}`, action: 'Finaliser' }
    : quotedOrder
      ? { title: 'Devis pret a verifier', body: `${quotedOrder.orderNumber} attend votre validation avant la prochaine etape.`, href: `/orders/${quotedOrder.id}`, action: 'Verifier' }
      : { title: 'Preparer un nouveau projet', body: 'Configurez un PCB, comparez les options et gardez le controle avant commande.', href: '/quote', action: 'Commencer' };

  return (
    <section className="mt-4 grid grid-cols-[1.15fr_0.85fr] gap-4">
      <article className="bg-[#102033] p-5 text-white shadow-sm">
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#9ee6ca]">Priorite</p>
        <h2 className="mt-2 text-2xl font-black tracking-normal">{primary.title}</h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-200">{primary.body}</p>
        <a href={primary.href} className="mt-5 inline-flex border border-white/30 bg-white px-5 py-3 text-xs font-black text-[#102033] transition hover:bg-[#ecfdf5]">{primary.action}</a>
      </article>
      <article className="bg-white p-5 shadow-sm ring-1 ring-[#dbe4ee]">
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#0f8f6b]">Compte</p>
        <h2 className="mt-2 text-xl font-black text-[#102033]">{profileReady ? 'Informations essentielles pretes' : 'Informations a completer'}</h2>
        <p className="mt-3 text-sm leading-6 text-[#53657a]">
          {profileReady
            ? 'Votre espace est pret pour les devis, commandes et suivis. Gardez vos informations a jour avant paiement.'
            : 'Ajoutez les informations utiles pour eviter les blocages au moment de la livraison ou de la facturation.'}
        </p>
        <a href="/profile?view=settings" className="mt-5 inline-flex border border-[#dbe4ee] px-5 py-3 text-xs font-black text-[#102033] transition hover:border-[#0f8f6b] hover:text-[#0f8f6b]">Ouvrir les parametres</a>
      </article>
    </section>
  );
}

function StatusStrip({ counts }: { counts: ReturnType<typeof orderCounts> }) {
  const statuses = [
    [counts.verification, 'Verification en cours'],
    [counts.paymentPending, 'Paiement en attente'],
    [counts.production, 'Statut de production'],
    [0, "Questions d'ingenierie"],
    [counts.delivery, 'Livraison'],
    [counts.comments, 'Commentaires en attente'],
  ];

  return (
    <section className="mt-4 grid grid-cols-6 bg-white py-5 shadow-sm ring-1 ring-slate-200">
      {statuses.map(([value, label]) => (
        <div key={label} className="border-r border-slate-200 px-3 text-center last:border-r-0">
          <p className="text-3xl font-light text-[#111827]">{value}</p>
          <p className="mt-2 text-xs leading-4 text-[#475569]">{label}</p>
        </div>
      ))}
    </section>
  );
}

function OrdersTable({ orders, dataStatus }: { orders: ProfileOrder[]; dataStatus: 'loading' | 'ready' | 'signed-out' | 'error' }) {
  const counts = orderCounts(orders);
  const rows = orders.slice(0, 5);

  return (
    <section className="mt-4 bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-[#1f2937]">Ma commande</h2>
        <a href="/profile?view=orders" className="text-xs font-semibold text-blue-600">Plus &gt;</a>
      </div>
      <div className="mt-4 flex gap-8 border-b border-slate-200 text-xs">
        {[`Toutes (${counts.all})`, `Verification (${counts.verification})`, `Production (${counts.production})`, `Livraison (${counts.delivery})`, `Termine (${counts.completed})`].map((tab, index) => (
          <span key={tab} className={`pb-3 ${index === 0 ? 'border-b-2 border-blue-500 font-black text-blue-600' : 'text-slate-500'}`}>{tab}</span>
        ))}
      </div>
      {dataStatus !== 'ready' || rows.length === 0 ? (
        <OrdersListRows orders={rows} dataStatus={dataStatus} />
      ) : (
        <table className="mt-2 w-full text-left text-xs">
          <thead className="text-[#64748b]">
            <tr>
              {['N Commande', 'Produit', 'Date de commande', 'Quantite', 'Statut', 'Montant', 'Action'].map((head) => (
                <th key={head} className="py-3 font-black">{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((order) => (
              <tr key={order.id} className="border-t border-slate-100">
                <td className="py-3">{order.orderNumber}</td>
                <td className="py-3">{orderProductLabel(order)}</td>
                <td className="py-3">{formatDate(order.createdAt)}</td>
                <td className="py-3">{order.quoteSnapshot?.quantity ?? '-'}</td>
                <td className={`py-3 ${statusColor(order.status)}`}>{orderStatusLabel(order.status)}</td>
                <td className="py-3">{formatMoney(order.totalPrice ?? order.quoteSnapshot?.finalTotal ?? 0)}</td>
                <td className="py-3"><a href={`/orders/${order.id}`} className="rounded-none border border-blue-400 px-3 py-1 text-blue-600">Voir</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function GiftExchange() {
  return (
    <section className="mt-4 bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#0f8f6b]">Avantages</p>
          <h2 className="mt-1 text-lg font-black text-[#102033]">Coupons et credits</h2>
        </div>
        <a href="/profile?view=invite" className="text-xs font-black text-[#0f8f6b]">Parrainage</a>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <BenefitTile title="Coupons" value="0 actif" body="Les reductions disponibles apparaitront ici automatiquement." />
        <BenefitTile title="Credits" value="0 EUR" body="Les credits client seront utilisables avant paiement." />
        <BenefitTile title="Parrainage" value="Pret" body="Invitez un contact lorsque votre programme sera active." />
      </div>
    </section>
  );
}

function ReviewsPanel() {
  return (
    <section className="mt-4 bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#0877ff]">Services</p>
          <h2 className="mt-1 text-lg font-black text-[#102033]">Acces rapide projet</h2>
        </div>
        <a href="/quote" className="bg-[#0f9f6e] px-5 py-2 text-xs font-black text-white">Nouveau devis</a>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3">
        <ProjectServiceTile title="Prototype PCB" body="Pour valider rapidement une carte." href="/quote" />
        <ProjectServiceTile title="Assemblage PCBA" body="Pour avancer vers un produit testable." href="/quote" />
        <ProjectServiceTile title="Assistance Gerber" body="Pour verifier les fichiers avant production." href="/contact" />
      </div>
    </section>
  );
}

function BenefitTile({ title, value, body }: { title: string; value: string; body: string }) {
  return (
    <div className="min-h-[108px] border border-[#e4ebf2] bg-[#f8fafc] p-4">
      <p className="text-xs text-[#64748b]">{title}</p>
      <p className="mt-2 text-xl font-black text-[#102033]">{value}</p>
      <p className="mt-2 text-xs leading-5 text-[#53657a]">{body}</p>
    </div>
  );
}

function ProjectServiceTile({ title, body, href }: { title: string; body: string; href: string }) {
  return (
    <a href={href} className="min-h-[108px] border border-[#e4ebf2] bg-white p-4 transition hover:border-[#0f8f6b] hover:bg-[#f8fafc]">
      <p className="text-sm font-black text-[#102033]">{title}</p>
      <p className="mt-2 text-xs leading-5 text-[#53657a]">{body}</p>
      <span className="mt-3 inline-flex text-xs font-black text-[#0877ff]">Ouvrir &gt;</span>
    </a>
  );
}

function RightRail({ orders, notifications, dataStatus }: { orders: ProfileOrder[]; notifications: ProfileNotification[]; dataStatus: 'loading' | 'ready' | 'signed-out' | 'error' }) {
  const recentOrders = orders.slice(0, 3).map((order) => `${order.orderNumber} - ${orderStatusLabel(order.status)}`);
  const recentNotifications = notifications.slice(0, 4).map((notification) => notification.title);

  return (
    <aside className="grid content-start gap-4">
      <ProfileRailCard title="Commandes recentes" items={dataStatus === 'ready' ? recentOrders : []} emptyText={statusMessage(dataStatus, 'Aucune commande recente.')} />
      <ProfileRailCard title="Notifications" items={dataStatus === 'ready' ? recentNotifications : []} emptyText={statusMessage(dataStatus, 'Aucune notification.')} />
      <InfoList title="Support" items={['Centre d’aide', 'Contact commercial', 'Suivi commande']} />
    </aside>
  );
}

function ProfileRailCard({ title, items, emptyText }: { title: string; items: string[]; emptyText: string }) {
  return (
    <article className="min-h-[112px] overflow-hidden bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <p className="text-lg font-black text-[#1f2937]">{title}</p>
      {items.length > 0 ? (
        <ul className="mt-4 grid gap-3 text-xs text-[#475569]">
          {items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      ) : (
        <p className="mt-4 text-xs font-bold text-[#64748b]">{emptyText}</p>
      )}
    </article>
  );
}

function InfoList({ title, items, action, numbered }: { title: string; items: string[]; action?: string; numbered?: boolean }) {
  return (
    <section className="bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-black">{title}</h2>
        <a href="#" className="text-xs text-blue-600">Plus</a>
      </div>
      <ul className="mt-4 grid gap-3 text-xs text-[#475569]">
        {items.map((item, index) => (
          <li key={item} className="flex gap-2">
            <span className="shrink-0 text-slate-400">{numbered ? index + 1 : action || '-'}</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Avatar({ avatarDataUrl, size }: { avatarDataUrl: string; size: 'medium' | 'large' }) {
  const className = size === 'large' ? 'h-16 w-16 border-2 border-[#d89b2b]' : 'h-20 w-20 border border-slate-200';

  return (
    <span className={`grid shrink-0 place-items-center overflow-hidden rounded-none bg-slate-200 ${className}`}>
      {avatarDataUrl ? <img src={avatarDataUrl} alt="Avatar client" className="h-full w-full object-cover" /> : <span className="h-full w-full bg-gradient-to-br from-slate-200 to-slate-400" />}
    </span>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M3 4h2l2.3 11.2a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 1.9-1.4L21 8H6.2" />
    </svg>
  );
}

async function authenticatedFetch<T>(path: string, accessToken: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: { ...(init.headers ?? {}), Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

function orderCounts(orders: ProfileOrder[]) {
  return {
    all: orders.length,
    verification: orders.filter((order) => orderMatchesStatus(order, 'verification')).length,
    paymentPending: orders.filter((order) => orderMatchesStatus(order, 'payment-pending')).length,
    production: orders.filter((order) => orderMatchesStatus(order, 'production')).length,
    delivery: orders.filter((order) => orderMatchesStatus(order, 'delivery')).length,
    completed: orders.filter((order) => orderMatchesStatus(order, 'completed')).length,
    comments: orders.filter((order) => orderMatchesStatus(order, 'comments')).length,
  };
}

function countForStatus(key: OrderStatusKey | 'payment-unfinished' | 'engineering' | 'comments', counts: ReturnType<typeof orderCounts>) {
  if (key === 'all') return counts.all;
  if (key === 'verification') return counts.verification;
  if (key === 'payment-pending') return counts.paymentPending;
  if (key === 'production') return counts.production;
  if (key === 'delivery') return counts.delivery;
  if (key === 'completed') return counts.completed;
  if (key === 'comments') return counts.comments;
  return 0;
}

function orderMatchesStatus(order: ProfileOrder, key: OrderStatusKey) {
  if (key === 'all') return true;
  if (key === 'verification') return order.status === 'draft' || order.status === 'quoted';
  if (key === 'payment-pending') return order.status === 'awaiting_payment' || order.paymentStatus === 'pending';
  if (key === 'production') return ['paid', 'supplier_order_pending', 'supplier_ordered', 'supplier_in_production', 'china_3pl_received'].includes(order.status);
  if (key === 'delivery') return ['shipped_to_africa', 'customs_processing', 'out_for_delivery'].includes(order.status);
  if (key === 'completed') return order.status === 'delivered';
  if (key === 'comments') return order.status === 'delivered';
  return false;
}

function unreadNotifications(notifications: ProfileNotification[]) {
  return notifications.filter((notification) => !notification.readAt).length;
}

function orderProductLabel(order: ProfileOrder) {
  return order.quoteSnapshot?.productType || 'PCB Prototype';
}

function orderStatusLabel(status: ProfileOrderStatus) {
  const labels: Record<ProfileOrderStatus, string> = {
    draft: 'Brouillon',
    quoted: 'Verification',
    awaiting_payment: 'Paiement en attente',
    paid: 'Payee',
    supplier_order_pending: 'Commande fournisseur',
    supplier_ordered: 'Fournisseur confirme',
    supplier_in_production: 'Production',
    china_3pl_received: '3PL Chine',
    shipped_to_africa: 'Livraison',
    customs_processing: 'Douane',
    out_for_delivery: 'En livraison',
    delivered: 'Termine',
    cancelled: 'Annulee',
    refunded: 'Remboursee',
  };

  return labels[status];
}

function statusColor(status: string) {
  if (status === 'quoted' || status === 'draft' || status === 'Verification') return 'text-[#0f9f6e]';
  if (['paid', 'supplier_order_pending', 'supplier_ordered', 'supplier_in_production', 'china_3pl_received', 'Production'].includes(status)) return 'text-[#16a34a]';
  if (['shipped_to_africa', 'customs_processing', 'out_for_delivery', 'Livraison'].includes(status)) return 'text-[#ff7a1a]';
  if (status === 'delivered' || status === 'Termine') return 'text-[#0f9f6e]';
  if (status === 'cancelled' || status === 'refunded') return 'text-red-600';
  return 'text-[#f59e0b]';
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
}

function statusMessage(status: 'loading' | 'ready' | 'signed-out' | 'error', emptyText: string) {
  if (status === 'loading') return 'Chargement...';
  if (status === 'signed-out') return 'Connectez-vous pour afficher ces donnees.';
  if (status === 'error') return 'Impossible de charger ces donnees.';
  return emptyText;
}

function readStoredProfile(): Partial<ProfileForm> {
  try {
    return JSON.parse(window.localStorage.getItem(profileStorageKey) ?? '{}') as Partial<ProfileForm>;
  } catch {
    return {};
  }
}

function readSessionProfile(): { id: string; email: string } {
  const session = readAuthSession();
  if (!session?.accessToken) return { id: '', email: '' };

  try {
    const payload = JSON.parse(window.atob(session.accessToken.split('.')[1] ?? '')) as { sub?: string; email?: string };
    return { id: payload.sub ?? '', email: payload.email ?? '' };
  } catch {
    return { id: '', email: '' };
  }
}

function emailName(email: string) {
  return email.includes('@') ? email.split('@')[0] : '';
}

function firstNameOf(value: string) {
  return value.trim().split(/[\s._-]+/).filter(Boolean)[0] || 'Rafale';
}

function formatUserId(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return `KD-${hash.toString(16).toUpperCase().padStart(7, '0').slice(0, 7)}`;
}

function logout() {
  clearAuthSession();
  window.localStorage.removeItem('kendronics.customer.orders');
  window.dispatchEvent(new Event('kendronics:orders-updated'));
  window.location.assign('/login');
}

async function submitAccountDeletionFeedback(
  feedback: DeleteFeedback,
  alternative: DeleteAlternative,
  setSaving: (value: boolean) => void,
  setMessage: (value: string) => void,
) {
  if (!feedback.reason) return false;

  setSaving(true);
  setMessage('');
  try {
    const session = await readFreshAuthSession();
    if (!session) {
      window.location.assign('/login');
      return false;
    }

    const response = await fetch(`${getApiBaseUrl()}/api/users/me/account-deletion-feedback`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(toAccountDeletionFeedbackPayload(feedback, alternative)),
    });

    if (!response.ok) {
      throw new Error(`Account deletion feedback failed: ${response.status}`);
    }

    return true;
  } catch {
    setMessage("Impossible d'enregistrer votre retour pour le moment.");
    return false;
  } finally {
    setSaving(false);
  }
}

function toAccountDeletionFeedbackPayload(feedback: DeleteFeedback, alternative: DeleteAlternative) {
  return {
    reason: feedback.reason,
    details: compactRecord({
      priceIssue: feedback.priceIssue,
      fairPrice: feedback.fairPrice,
      expectedDelivery: feedback.expectedDelivery,
      processIssue: feedback.processIssue,
      bugDescription: feedback.bugDescription,
      device: feedback.device,
      browser: feedback.browser,
      supportRating: feedback.supportRating,
      supportImprovement: feedback.supportImprovement,
    }),
    orderedBefore: optionalValue(feedback.orderedBefore),
    improvementPriority: optionalValue(feedback.improvementPriority),
    keepReason: optionalValue(feedback.keepReason),
    alternative,
  };
}

function compactRecord(values: Record<string, string>) {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value.trim().length > 0));
}

function optionalValue(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

async function requestDeleteAccountCode(
  setRequesting: (value: boolean) => void,
  setStep: (value: DeleteModalStep) => void,
  setMessage: (value: string) => void,
) {
  setRequesting(true);
  setMessage('');
  try {
    const session = await readFreshAuthSession();
    if (!session) {
      window.location.assign('/login');
      return;
    }

    const response = await fetch(`${getApiBaseUrl()}/api/auth/profile-verification/request`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'delete' }),
    });

    if (!response.ok) {
      throw new Error(`Delete verification request failed: ${response.status}`);
    }

    setStep('code');
    setMessage('Code envoye. Il reste valide pendant 10 minutes.');
  } catch {
    setMessage("Impossible d'envoyer le code de suppression pour le moment.");
  } finally {
    setRequesting(false);
  }
}

async function deleteAccount(code: string, setDeleting: (value: boolean) => void) {
  setDeleting(true);
  try {
    const session = await readFreshAuthSession();
    if (!session) {
      window.location.assign('/login');
      return;
    }

    const response = await fetch(`${getApiBaseUrl()}/api/users/me`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      throw new Error(`Delete account failed: ${response.status}`);
    }

    clearAuthSession();
    window.localStorage.removeItem(profileStorageKey);
    window.localStorage.removeItem(avatarStorageKey);
    window.localStorage.removeItem('kendronics.customer.orders');
    window.location.assign('/');
  } catch {
    window.alert('Impossible de supprimer le compte pour le moment.');
    setDeleting(false);
  }
}

async function markAllNotificationsRead(
  notifications: ProfileNotification[],
  onNotificationsChange: (notifications: ProfileNotification[]) => void,
  setMarkingRead: (value: boolean) => void,
) {
  const unread = notifications.filter((notification) => !notification.readAt);
  if (unread.length === 0) return;

  setMarkingRead(true);
  try {
    const session = await readFreshAuthSession();
    if (!session) {
      window.location.assign('/login');
      return;
    }

    const updated = await Promise.all(
      unread.map((notification) =>
        authenticatedFetch<ProfileNotification>(`/api/notifications/${notification.id}/read`, session.accessToken, { method: 'PATCH' }),
      ),
    );
    const updatedById = new Map(updated.map((notification) => [notification.id, notification]));
    onNotificationsChange(notifications.map((notification) => updatedById.get(notification.id) ?? notification));
  } catch {
    window.alert('Impossible de mettre à jour les notifications.');
  } finally {
    setMarkingRead(false);
  }
}
