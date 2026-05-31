'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Footer } from '../../components/layout/Footer';
import { InternationalPhoneInput } from '../../components/account/InternationalPhoneInput';
import { Navbar } from '../../components/layout/Navbar';
import { africanCountries } from '../../lib/african-countries';
import { getApiBaseUrl } from '../../lib/api-base-url';
import type { AuthTokens } from '../../lib/auth-contract';
import { clearAuthSession, persistAuthSession, readAuthSession, readFreshAuthSession, revokeAuthSession } from '../../lib/auth-session';
import { purgeLegacySensitiveStorage, readScopedLocalStorage, removeScopedLocalStorage, writeScopedLocalStorage } from '../../lib/user-scoped-storage';

const profileStorageKey = 'kendronics.customer.profile';
const avatarStorageKey = 'kendronics.customer.avatar';
const siteGreen = '#0f8f6b';
const googleOAuthUrl = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_URL;
const appleOAuthUrl = process.env.NEXT_PUBLIC_APPLE_OAUTH_URL;

type ProfileForm = {
  name: string;
  email: string;
  phone: string;
  company: string;
  country: string;
  avatarDataUrl?: string;
  profileDetails?: ProfileDetails;
  shippingAddress?: AccountAddress;
  billingAddress?: AccountAddress;
  emailVerifiedAt?: string;
  phoneVerifiedAt?: string;
};

type ProfileDetails = {
  accountType: string;
  customerType: string;
  industry: string;
  orderPreference: string[];
  productInterests: string[];
  hearAboutUs: string;
  firstName: string;
  lastName: string;
  gender: string;
  website: string;
  birthday: string;
};

type AccountAddress = {
  accountType: string;
  firstName: string;
  lastName: string;
  company: string;
  street: string;
  apartment: string;
  country: string;
  region: string;
  city: string;
  postalCode: string;
  taxId: string;
  phone: string;
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
  | 'payment_authorized'
  | 'supplier_review_pending'
  | 'supplier_files_rejected'
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
  paymentStatus?: 'pending' | 'authorized' | 'paid' | 'failed' | 'canceled' | 'expired' | 'refunded';
  totalPrice?: number;
  currency?: 'EUR';
  externalManufacturingPartner?: string;
  externalSupplierOrderId?: string;
  carrierName?: string;
  trackingNumber?: string;
  paidAt?: string;
  createdAt: string;
  quoteSnapshot?: {
    productType: string;
    gerberFileId: string;
    layers?: number;
    lengthMm?: number;
    widthMm?: number;
    quantity: number;
    finalTotal: number;
    currency: 'EUR';
    shippingMode?: string;
    breakdown?: Record<string, number>;
    configSnapshot?: Record<string, unknown> | null;
    createdAt?: string;
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

type DiscoverNewsItem = {
  title: string;
  link: string;
  source: string;
  summary: string;
  publishedAt: string;
  imageUrl?: string;
};

type CommunityPost = {
  id: string;
  authorId: string;
  author: string;
  avatarDataUrl: string;
  title: string;
  description: string;
  kind: 'video' | 'image' | 'document' | 'tutorial';
  mediaName: string;
  mediaDataUrl?: string;
  mediaType?: string;
  createdAt: string;
  views: number;
  likes: number;
  saves: number;
  comments: number;
  commentList?: string[];
};

type ProfileUser = {
  id: string;
  email: string;
  fullName: string;
  companyName?: string;
  phone?: string;
  country?: string;
  avatarDataUrl?: string;
  profileDetails?: ProfileDetails;
  shippingAddress?: AccountAddress;
  billingAddress?: AccountAddress;
  emailVerifiedAt?: string;
  phoneVerifiedAt?: string;
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
  { title: 'Prototype PCB', subtitle: '', href: '/quote', image: '/images/quote-product-standard-pcb.png', color: '#22c55e' },
  { title: 'PCB avance / PCBA', subtitle: '', href: '/quote', image: '/images/quote-product-advanced-pcba.png', color: '#0ea5e9' },
  { title: 'Assemblage PCB', subtitle: '', href: '/quote', image: '/images/quote-product-assembly.png', color: '#3b82f6' },
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

const customerTypeOptions = [
  'Conception / recherche / developpement',
  'Fabrication electronique',
  'Education / universite / laboratoire',
  'Reparation / maintenance',
  'Startup / developpement produit',
  'Achats / approvisionnement',
];

const industryOptions = [
  'Produits industriels / technologie agricole',
  'Electronique grand public',
  'Communication / IoT',
  'Electronique medicale',
  'Electronique automobile',
  'Aerospatial / defense',
  'Energie / electronique de puissance',
  'Education / recherche',
];

const orderPreferenceOptions = ['Prototype', 'Petite serie', 'Commande en volume'];

const productInterestOptions = [
  'Standard FR4 PCB',
  'HDI PCB',
  'Aluminum PCB',
  'Rogers PCB',
  'Flex PCB',
  'Rigid-flex PCB',
  'Stencil',
  'Assemblage',
  'CNC machining/Sheet metal/3D printing/Injection molding',
  'Autre',
];

const hearAboutOptions = [
  'Moteur de recherche',
  'Reseaux sociaux',
  'Recommandation',
  'Publicite en ligne',
  'Salon / evenement',
  'Client existant',
  'Autre',
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
    purgeLegacySensitiveStorage();
    const storedProfile = readStoredProfile();
    const sessionProfile = readSessionProfile();

    setProfile({
      name: storedProfile.name || emailName(sessionProfile.email) || '',
      email: sessionProfile.email || storedProfile.email || '',
      phone: storedProfile.phone || '',
      company: storedProfile.company || '',
      country: normalizeProfileCountry(storedProfile.country),
      avatarDataUrl: storedProfile.avatarDataUrl || '',
      profileDetails: normalizeProfileDetails(storedProfile.profileDetails, storedProfile.name, storedProfile.company),
      shippingAddress: normalizeAddress(storedProfile.shippingAddress),
      billingAddress: normalizeAddress(storedProfile.billingAddress),
      emailVerifiedAt: storedProfile.emailVerifiedAt || '',
    });
    setAccountId(sessionProfile.id || storedProfile.email || sessionProfile.email || 'kendronics');
    setAvatarDataUrl(storedProfile.avatarDataUrl || readScopedLocalStorage(avatarStorageKey) || '');
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
          email: isInternalAccountEmail(userResponse.email) ? current.email : userResponse.email || current.email,
          phone: userResponse.phone || current.phone,
          company: userResponse.companyName || current.company,
          country: normalizeProfileCountry(userResponse.country || current.country),
          avatarDataUrl: userResponse.avatarDataUrl || current.avatarDataUrl,
          profileDetails: normalizeProfileDetails(userResponse.profileDetails ?? current.profileDetails, userResponse.fullName || current.name, userResponse.companyName || current.company),
          shippingAddress: normalizeAddress(userResponse.shippingAddress ?? current.shippingAddress),
          billingAddress: normalizeAddress(userResponse.billingAddress ?? current.billingAddress),
          emailVerifiedAt: userResponse.emailVerifiedAt || '',
          phoneVerifiedAt: userResponse.phoneVerifiedAt || '',
        }));
        if (userResponse.avatarDataUrl) {
          setAvatarDataUrl(userResponse.avatarDataUrl);
          writeScopedLocalStorage(avatarStorageKey, userResponse.avatarDataUrl);
          window.dispatchEvent(new Event('kendronics:avatar-updated'));
        }
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
    <main className="mobile-free-page min-h-screen overflow-x-hidden bg-[#f3f6fa] text-[#1f2f43]">
      <Navbar />
      <div className="w-full pt-[70px]">
        <div className="mx-auto grid w-full max-w-none gap-4 px-4 py-3 sm:max-w-[40rem] lg:min-w-[1328px] lg:max-w-[1368px] lg:grid-cols-[250px_minmax(0,1fr)] lg:px-5 lg:py-4">
          <ProfileSidebar activeProfileView={activeProfileView} onSelectView={setActiveProfileView} counts={orderCounts(orders)} unreadNotifications={unreadNotifications(notifications)} profile={profile} />

          <section className="min-w-0">
            {activeProfileView ? (
              <ProfileViewContent view={activeProfileView} profile={profile} userId={userId} avatarDataUrl={avatarDataUrl} orders={orders} notifications={notifications} dataStatus={dataStatus} onProfileChange={setProfile} onAvatarChange={setAvatarDataUrl} onOrdersChange={setOrders} onNotificationsChange={setNotifications} />
            ) : (
              <>
                <div className="grid min-w-0 gap-4">
                  <div className="lg:hidden">
                    <LivePromoFlash />
                  </div>
                  <ProductQuickGrid />
                  <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
                    <div className="grid min-w-0 gap-4">
                      <DashboardPanel firstName={firstName} profile={profile} userId={userId} avatarDataUrl={avatarDataUrl} orders={orders} dataStatus={dataStatus} />
                      <div className="hidden lg:block">
                        <StatusStrip counts={orderCounts(orders)} />
                      </div>
                      <div className="hidden lg:block">
                        <CommunityPublishPanel firstName={firstName} avatarDataUrl={avatarDataUrl} />
                      </div>
                    </div>
                    <div className="hidden lg:block">
                      <DiscoverNewsRail />
                    </div>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>

        <div className="hidden lg:block">
          <Footer forceDesktop />
        </div>
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
          <ProfileNavLink href="/quote" label="Devis immédiat" />
          <ProfileNavLink href="/quote" label="Assemblage PCB" />
          <ProfileNavLink href="/services" label="Impression 3D" />
          <ProfileNavLink href="/services" label="Conception PCB" />
          <ProfileNavLink href="/profile?view=orders" label="Mes commandes" />
          <ProfileNavLink href="/profile" label="Paramètres" />
        </nav>
        <a href="/profile?view=orders" className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center text-[#0f8f6b] transition hover:text-[#0b7558]" aria-label="Panier">
          <CartIcon />
          <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-none bg-[#14c469] px-1 text-[11px] font-black leading-none text-white">0</span>
        </a>
        <a href="/profile" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-none border border-[#d1d5db] bg-[#f4f4f4]">
            {avatarDataUrl ? <img src={avatarDataUrl} alt="Avatar client" className="h-full w-full object-cover" /> : null}
          </span>
          <span className="text-xs leading-5 text-[#64748b]">
            Bonjour, {firstName}
            <strong className="block text-sm font-black text-[#0f8f6b]">Mon Espace</strong>
          </span>
        </a>
      </div>
    </header>
  );
}

function ProfileNavLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} className="grid min-h-[54px] min-w-[92px] snap-start place-items-center px-2 text-center leading-6 hover:text-[#0f8f6b]">
      {label}
    </a>
  );
}

function ProfileSidebar({
  activeProfileView,
  onSelectView,
  counts,
  unreadNotifications,
  profile,
}: {
  activeProfileView: ProfileView;
  onSelectView: (view: ProfileView) => void;
  counts: ReturnType<typeof orderCounts>;
  unreadNotifications: number;
  profile: ProfileForm;
}) {
  const groups = profileSidebarGroups(counts, unreadNotifications);

  return (
    <aside className="sticky top-[86px] hidden self-start bg-white shadow-sm ring-1 ring-[#dbe4ee] lg:block">
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
                  <span className={`min-w-0 truncate ${item.view === 'shipping-address' && !isCompleteProfileAddress(profile.shippingAddress) ? 'text-[#d97706]' : ''}`}>{item.label}</span>
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
        { label: 'Commandes', view: 'all-orders', count: counts.all },
        { label: 'Notifications', view: 'notifications', count: unread },
      ],
    },
    {
      title: 'Suivi commande',
      items: [
        { label: 'Vérification', view: 'verification', count: counts.verification },
        { label: 'Paiement', view: 'payment-pending', count: counts.paymentPending },
        { label: 'Production', view: 'production', count: counts.production },
        { label: 'Livraison', view: 'delivery', count: counts.delivery },
        { label: 'Commentaires', view: 'comments', count: counts.comments },
      ],
    },
    {
      title: 'Services',
      items: [
        { label: 'Services et demandes', view: 'services' },
        { label: 'Support', view: 'support' },
        { label: 'Publier', view: 'benefits' },
        { label: 'Parrainage', view: 'invite' },
      ],
    },
    {
      title: 'Profil',
      items: [
        { label: 'Adresse livraison', view: 'shipping-address' },
        { label: 'Historique des commandes', view: 'all-orders' },
        { label: "Centre d'aide", view: 'support' },
        { label: 'Paramètres', view: 'settings' },
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
  onProfileChange,
  onAvatarChange,
  onOrdersChange,
  onNotificationsChange,
}: {
  view: Exclude<ProfileView, null>;
  profile: ProfileForm;
  userId: string;
  avatarDataUrl: string;
  orders: ProfileOrder[];
  notifications: ProfileNotification[];
  dataStatus: 'loading' | 'ready' | 'signed-out' | 'error';
  onProfileChange: (profile: ProfileForm | ((current: ProfileForm) => ProfileForm)) => void;
  onAvatarChange: (avatarDataUrl: string) => void;
  onOrdersChange: (orders: ProfileOrder[] | ((current: ProfileOrder[]) => ProfileOrder[])) => void;
  onNotificationsChange: (notifications: ProfileNotification[]) => void;
}) {
  if (view === 'quotes') return <QuotesHubSection orders={orders} dataStatus={dataStatus} />;
  if (view === 'all-orders') return <OrderReviewSection activeKey="all" title="Toutes commandes" mode="table" orders={orders} dataStatus={dataStatus} onOrdersChange={onOrdersChange} />;
  if (view === 'verification') return <OrderReviewSection activeKey="verification" title="Verification des fichiers" mode="review" orders={orders} dataStatus={dataStatus} onOrdersChange={onOrdersChange} />;
  if (view === 'payment-pending') return <OrderReviewSection activeKey="payment-pending" title="Paiements effectues" mode="payment" orders={orders} dataStatus={dataStatus} onOrdersChange={onOrdersChange} />;
  if (view === 'production') return <OrderReviewSection activeKey="production" title="Progres de la fabrication" mode="production" orders={orders} dataStatus={dataStatus} onOrdersChange={onOrdersChange} />;
  if (view === 'delivery') return <OrderReviewSection activeKey="delivery" title="Livraison / Suivi de votre envoi" mode="delivery" orders={orders} dataStatus={dataStatus} onOrdersChange={onOrdersChange} />;
  if (view === 'completed') return <OrderReviewSection activeKey="completed" title="Commande completee" mode="table" orders={orders} dataStatus={dataStatus} onOrdersChange={onOrdersChange} />;
  if (view === 'comments') return <CommentsManagementSection orders={orders} dataStatus={dataStatus} />;
  if (view === 'services') return <ServicesHubSection />;
  if (view === 'support') return <SupportHubSection orders={orders} dataStatus={dataStatus} />;
  if (view === 'benefits') return <BenefitsHubSection />;
  if (view === 'notifications') return <NotificationsSection notifications={notifications} dataStatus={dataStatus} onNotificationsChange={onNotificationsChange} />;
  if (view === 'shipping-address') return <AddressFormSection title="Adresse de livraison" note="Veuillez entrer votre nouveau contact/adresse" kind="shippingAddress" initialAddress={profile.shippingAddress} onSaved={(address) => onProfileChange((current) => ({ ...current, shippingAddress: address }))} />;
  if (view === 'invite') return <InviteSection />;
  if (view === 'billing') return <AddressFormSection title="Informations de facturation" kind="billingAddress" initialAddress={profile.billingAddress} onSaved={(address) => onProfileChange((current) => ({ ...current, billingAddress: address }))} billing />;
  if (view === 'settings') return <SettingsSection profile={profile} userId={userId} avatarDataUrl={avatarDataUrl} onProfileChange={onProfileChange} onAvatarChange={onAvatarChange} />;

  return null;
}

type OrderStatusKey = 'all' | 'verification' | 'payment-pending' | 'production' | 'delivery' | 'completed' | 'comments';
type OrderProductFilter = 'standard_pcb' | 'advanced_pcb' | 'fpc_rigid_flex' | 'pcb_assembly' | 'smt_stencil';
type OrderServiceFilter = OrderProductFilter | 'all';

const orderStatuses: Array<{ key: Extract<OrderStatusKey, 'verification' | 'payment-pending' | 'production' | 'delivery' | 'comments'>; label: string }> = [
  { key: 'verification', label: 'Verification fichiers' },
  { key: 'payment-pending', label: 'Paiement effectue' },
  { key: 'production', label: 'Production' },
  { key: 'delivery', label: 'Livraison' },
  { key: 'comments', label: 'Commentaires' },
];

const orderServiceFilters: Array<{ key: OrderServiceFilter; label: string }> = [
  { key: 'all', label: 'Tout' },
  { key: 'standard_pcb', label: 'PCB standard' },
  { key: 'advanced_pcb', label: 'PCB avance' },
  { key: 'fpc_rigid_flex', label: 'FPC flex' },
  { key: 'pcb_assembly', label: 'Assemblage' },
  { key: 'smt_stencil', label: 'Pochoir CMS' },
];

function OrderReviewSection({
  activeKey,
  title,
  mode,
  orders = [],
  dataStatus = 'ready',
  onOrdersChange,
}: {
  activeKey: OrderStatusKey;
  title: string;
  mode: 'review' | 'payment' | 'production' | 'delivery' | 'table';
  orders?: ProfileOrder[];
  dataStatus?: 'loading' | 'ready' | 'signed-out' | 'error';
  onOrdersChange: (orders: ProfileOrder[] | ((current: ProfileOrder[]) => ProfileOrder[])) => void;
}) {
  const visibleOrders = orders.filter((order) => orderMatchesStatus(order, activeKey));

  return (
    <section className="min-h-[690px] bg-white text-[#111827] lg:shadow-sm lg:ring-1 lg:ring-slate-200">
      <OrderStatusHeader activeKey={activeKey} counts={orderCounts(orders)} />

      <div className="border-t-[10px] border-[#eef0f3] px-3 pb-24 pt-5 sm:px-6 lg:border-t-[16px]">
        <div className={`${mode !== 'table' ? 'flex h-12 items-center border-b border-[#e5e7eb]' : 'flex h-10 items-center'}`}>
          <h2 className="text-xl font-normal text-black">{title}</h2>
        </div>

        {mode === 'review' ? (
          <VerificationReviewPanel orders={visibleOrders} dataStatus={dataStatus} />
        ) : mode === 'payment' ? (
          <PaymentReviewPanel orders={visibleOrders} dataStatus={dataStatus} />
        ) : mode === 'production' ? (
          <ProductionReviewPanel orders={visibleOrders} dataStatus={dataStatus} />
        ) : mode === 'delivery' ? (
          <DeliveryReviewPanel orders={visibleOrders} dataStatus={dataStatus} />
        ) : (
          <OrderTableSearchPanel orders={visibleOrders} dataStatus={dataStatus} onOrdersChange={onOrdersChange} />
        )}
      </div>
    </section>
  );
}

function OrderStatusHeader({ activeKey, counts }: { activeKey: OrderStatusKey; counts: ReturnType<typeof orderCounts> }) {
  return (
    <div className="px-3 pt-4 sm:px-6">
      <div className="flex h-11 items-center gap-3 border-b border-[#e5e7eb]">
        <span className="grid h-6 w-6 place-items-center text-xl text-[#b8b8b8]">▤</span>
        <h1 className="text-xl font-normal">Mes commandes</h1>
      </div>
      <div className="grid h-auto grid-cols-5 items-start overflow-hidden px-0 pt-4 sm:h-[112px] sm:px-1 sm:pt-6">
        {orderStatuses.map((status) => {
          const active = status.key === activeKey;

          return (
            <div key={status.key} className="grid min-h-[64px] place-items-center border-r border-[#e5e7eb] px-1 text-center last:border-r-0 sm:min-h-[72px] sm:px-3">
              <span className={`text-[22px] font-black leading-6 sm:text-[28px] sm:leading-7 ${active ? 'text-[#ff5a00]' : 'text-[#1f2937]'}`}>
                {countForStatus(status.key, counts)}
              </span>
              <span className={`mt-1 text-[10px] leading-3 sm:text-[14px] sm:leading-4 ${active ? 'text-[#ff5a00]' : 'text-[#8a8f98]'}`}>{status.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VerificationReviewPanel({ orders, dataStatus }: { orders: ProfileOrder[]; dataStatus: 'loading' | 'ready' | 'signed-out' | 'error' }) {
  const [detailOrder, setDetailOrder] = useState<ProfileOrder | null>(null);

  return (
    <>
      <div className="mt-4 border border-[#e5e7eb] bg-white">
        <div className="overflow-x-auto">
          <div className="grid min-w-[1120px] grid-cols-[minmax(330px,1fr)_130px_120px_150px_140px_220px] items-center bg-[#f4f5f7] px-5 py-3 text-sm text-black">
            <span>Article</span>
            <span>Date d'autorisation</span>
            <span>Tentative</span>
            <span>Montant autorise</span>
            <span>Statut de verification</span>
            <span>Correction du fichier</span>
          </div>
          {dataStatus === 'loading' ? (
            <p className="min-w-[1120px] px-5 py-14 text-center text-base font-black text-[#92979d]">Chargement des commandes...</p>
          ) : dataStatus === 'signed-out' ? (
            <p className="min-w-[1120px] px-5 py-14 text-center text-base font-black text-[#92979d]">Connectez-vous pour afficher vos commandes.</p>
          ) : dataStatus === 'error' ? (
            <p className="min-w-[1120px] px-5 py-14 text-center text-base font-black text-red-600">Impossible de charger les commandes.</p>
          ) : orders.length === 0 ? (
            <p className="min-w-[1120px] px-5 py-14 text-center text-base text-[#92979d]">Aucun fichier en verification pour le moment.</p>
          ) : (
            <div className="min-w-[1120px] divide-y divide-[#e5e7eb]">
              {orders.map((order) => (
                <div key={order.id} className="grid grid-cols-[minmax(330px,1fr)_130px_120px_150px_140px_220px] items-start px-5 py-5 text-sm text-[#1f2f43]">
                  <VerificationArticleCell order={order} onDetail={() => setDetailOrder(order)} />
                  <span className="pt-2 text-black">{verificationSubmittedDate(order)}</span>
                  <span className="pt-2 text-black">{verificationAttemptLabel(order)}</span>
                  <span className="pt-2 text-black">{formatMoney(orderTotal(order))}</span>
                  <span className="pt-2 text-black">{verificationStatusLabel(order)}</span>
                  <VerificationModificationCell order={order} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {detailOrder ? <ProductDetailModal order={detailOrder} onClose={() => setDetailOrder(null)} /> : null}
    </>
  );
}

function PaymentReviewPanel({ orders, dataStatus }: { orders: ProfileOrder[]; dataStatus: 'loading' | 'ready' | 'signed-out' | 'error' }) {
  const [detailOrder, setDetailOrder] = useState<ProfileOrder | null>(null);

  return (
    <>
      <div className="mt-4 border border-[#e5e7eb] bg-white">
        <div className="overflow-x-auto">
          <div className="grid min-w-[1120px] grid-cols-[minmax(330px,1fr)_140px_140px_140px_150px_110px] items-center bg-[#f4f5f7] px-5 py-3 text-sm text-black">
            <span>Article</span>
            <span>Montant autorise</span>
            <span>Date autorisation</span>
            <span>Date capture</span>
            <span>Facture</span>
            <span>Etat du paiement</span>
          </div>
          {dataStatus === 'loading' ? (
            <p className="min-w-[1120px] px-5 py-14 text-center text-base font-black text-[#92979d]">Chargement des paiements...</p>
          ) : dataStatus === 'signed-out' ? (
            <p className="min-w-[1120px] px-5 py-14 text-center text-base font-black text-[#92979d]">Connectez-vous pour afficher vos paiements.</p>
          ) : dataStatus === 'error' ? (
            <p className="min-w-[1120px] px-5 py-14 text-center text-base font-black text-red-600">Impossible de charger les paiements.</p>
          ) : orders.length === 0 ? (
            <p className="min-w-[1120px] px-5 py-14 text-center text-base text-[#92979d]">Aucune commande payee pour le moment.</p>
          ) : (
            <div className="min-w-[1120px] divide-y divide-[#e5e7eb]">
              {orders.map((order) => (
                <div key={order.id} className="grid grid-cols-[minmax(330px,1fr)_140px_140px_140px_150px_110px] items-start px-5 py-5 text-sm text-[#1f2f43]">
                  <VerificationArticleCell order={order} onDetail={() => setDetailOrder(order)} />
                  <span className="pt-2 text-black">{formatMoney(orderTotal(order))}</span>
                  <span className="pt-2 text-black">{paymentAuthorizationDate(order)}</span>
                  <span className="pt-2 text-black">{paymentPaidDate(order)}</span>
                  <span className="pt-2 text-black">{orderInvoiceAvailability(order)}</span>
                  <span className="pt-2 text-black">{orderPaymentStatusLabel(order)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {detailOrder ? <ProductDetailModal order={detailOrder} onClose={() => setDetailOrder(null)} /> : null}
    </>
  );
}

function ProductionReviewPanel({ orders, dataStatus }: { orders: ProfileOrder[]; dataStatus: 'loading' | 'ready' | 'signed-out' | 'error' }) {
  const [detailOrder, setDetailOrder] = useState<ProfileOrder | null>(null);

  return (
    <>
      <div className="mt-4 border border-[#e5e7eb] bg-white">
        <div className="overflow-x-auto">
          <div className="grid min-w-[1240px] grid-cols-[minmax(330px,1fr)_140px_150px_130px_150px_150px_140px_90px] items-center bg-[#f4f5f7] px-5 py-3 text-sm text-black">
            <span>Article</span>
            <span>Lancement</span>
            <span>Etat production</span>
            <span>Delai prod</span>
            <span>Fin estimee</span>
            <span>Reference interne</span>
            <span>Controle qualite</span>
            <span>Action</span>
          </div>
          {dataStatus === 'loading' ? (
            <p className="min-w-[1240px] px-5 py-14 text-center text-base font-black text-[#92979d]">Chargement de la production...</p>
          ) : dataStatus === 'signed-out' ? (
            <p className="min-w-[1240px] px-5 py-14 text-center text-base font-black text-[#92979d]">Connectez-vous pour afficher la production.</p>
          ) : dataStatus === 'error' ? (
            <p className="min-w-[1240px] px-5 py-14 text-center text-base font-black text-red-600">Impossible de charger la production.</p>
          ) : orders.length === 0 ? (
            <p className="min-w-[1240px] px-5 py-14 text-center text-base text-[#92979d]">Aucune commande en production reelle pour le moment.</p>
          ) : (
            <div className="min-w-[1240px] divide-y divide-[#e5e7eb]">
              {orders.map((order) => (
                <div key={order.id} className="grid grid-cols-[minmax(330px,1fr)_140px_150px_130px_150px_150px_140px_90px] items-start px-5 py-5 text-sm text-[#1f2f43]">
                  <VerificationArticleCell order={order} onDetail={() => setDetailOrder(order)} />
                  <span className="pt-2 text-black">{productionStartedDate(order)}</span>
                  <span className="pt-2 text-black">{productionStatusLabel(order)}</span>
                  <span className="pt-2 text-black">{orderProductionDelay(order)}</span>
                  <span className="pt-2 text-black">{productionEndDate(order)}</span>
                  <span className="pt-2 text-black">{productionReference(order)}</span>
                  <span className="pt-2 text-black">{qualityStatusLabel(order)}</span>
                  <a href={`/orders/${order.id}`} className="pt-2 text-[#0877ff] hover:text-[#0068e8]">Voir</a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {detailOrder ? <ProductDetailModal order={detailOrder} onClose={() => setDetailOrder(null)} /> : null}
    </>
  );
}

function DeliveryReviewPanel({ orders, dataStatus }: { orders: ProfileOrder[]; dataStatus: 'loading' | 'ready' | 'signed-out' | 'error' }) {
  const [detailOrder, setDetailOrder] = useState<ProfileOrder | null>(null);

  return (
    <>
      <div className="mt-4 border border-[#e5e7eb] bg-white">
        <div className="overflow-x-auto">
          <div className="grid min-w-[1160px] grid-cols-[minmax(330px,1fr)_150px_150px_150px_160px_150px] items-center bg-[#f4f5f7] px-5 py-3 text-sm text-black">
            <span>Article</span>
            <span>Etat livraison</span>
            <span>Transporteur</span>
            <span>Destination</span>
            <span>Reference suivi</span>
            <span>Estimation</span>
          </div>
          {dataStatus === 'loading' ? (
            <p className="min-w-[1160px] px-5 py-14 text-center text-base font-black text-[#92979d]">Chargement de la livraison...</p>
          ) : dataStatus === 'signed-out' ? (
            <p className="min-w-[1160px] px-5 py-14 text-center text-base font-black text-[#92979d]">Connectez-vous pour afficher vos livraisons.</p>
          ) : dataStatus === 'error' ? (
            <p className="min-w-[1160px] px-5 py-14 text-center text-base font-black text-red-600">Impossible de charger les livraisons.</p>
          ) : orders.length === 0 ? (
            <p className="min-w-[1160px] px-5 py-14 text-center text-base text-[#92979d]">Aucun envoi en cours pour le moment.</p>
          ) : (
            <div className="min-w-[1160px] divide-y divide-[#e5e7eb]">
              {orders.map((order) => (
                <div key={order.id} className="grid grid-cols-[minmax(330px,1fr)_150px_150px_150px_160px_150px] items-start px-5 py-5 text-sm text-[#1f2f43]">
                  <VerificationArticleCell order={order} onDetail={() => setDetailOrder(order)} />
                  <span className="pt-2 text-black">{deliveryStatusLabel(order)}</span>
                  <span className="pt-2 text-black">{order.carrierName || shippingModeLabel(order)}</span>
                  <span className="pt-2 text-black">{deliveryDestinationLabel(order)}</span>
                  <span className="pt-2 text-black">{order.trackingNumber || 'En attente'}</span>
                  <span className="pt-2 text-black">{deliveryEstimateLabel(order)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {detailOrder ? <ProductDetailModal order={detailOrder} onClose={() => setDetailOrder(null)} /> : null}
    </>
  );
}

function VerificationArticleCell({ order, onDetail }: { order: ProfileOrder; onDetail: () => void }) {
  return (
    <div className="flex min-w-0 gap-5">
      <div className="grid h-[84px] w-[84px] shrink-0 place-items-center bg-[#f1f4f7] text-center text-xs text-[#cbd5e1]">Kendronics</div>
      <div className="min-w-0 py-0.5">
        <p className="truncate text-black">{orderGerberLabel(order)}</p>
        <p className="mt-1 text-sm text-[#44546a]">{orderProductOrderLine(order)}</p>
        <p className="mt-1 text-sm text-[#44546a]">{orderSummaryLine(order)}</p>
        <button type="button" onClick={onDetail} className="mt-2 text-sm text-[#44546a] hover:text-[#0877ff]">
          Details du produit
        </button>
      </div>
    </div>
  );
}

function VerificationModificationCell({ order }: { order: ProfileOrder }) {
  if (order.status === 'supplier_files_rejected') {
    return (
      <div className="space-y-2 pt-1 text-sm">
        <a href={rejectionReportHref(order)} download={`motif-rejet-${order.orderNumber}.txt`} className="block text-[#0877ff] hover:text-[#0068e8]">
          Telecharger le motif du rejet
        </a>
        <a href={`/quote?orderId=${encodeURIComponent(order.id)}`} className="block text-[#0f8f6b] hover:text-[#0b7558]">
          Modifier et resoumettre le fichier
        </a>
      </div>
    );
  }

  if (order.status === 'payment_authorized') return <span className="block pt-2 text-[#8a8f98]">Controle technique en attente.</span>;
  if (order.status === 'supplier_review_pending') return <span className="block pt-2 text-[#8a8f98]">Controle technique en cours.</span>;
  if (order.status === 'awaiting_payment') return <span className="block pt-2 text-[#8a8f98]">Le controle demarre apres autorisation.</span>;
  return <span className="block pt-2 text-[#0f8f6b]">Aucune correction demandee.</span>;
}

function verificationSubmittedDate(order: ProfileOrder) {
  if (order.status === 'awaiting_payment') return 'Apres autorisation';
  return formatDate(order.paidAt ?? order.quoteSnapshot?.createdAt ?? order.createdAt);
}

function verificationStatusLabel(order: ProfileOrder) {
  if (order.status === 'supplier_files_rejected') return 'Fichier rejete';
  if (order.status === 'payment_authorized') return 'Autorisation recue';
  if (order.status === 'supplier_review_pending') return 'Controle en cours';
  if (order.status === 'awaiting_payment') return 'Non envoye';
  if (['paid', 'supplier_order_pending', 'supplier_ordered', 'supplier_in_production', 'china_3pl_received'].includes(order.status)) return 'Fichier accepte';
  return orderStatusLabel(order.status);
}

function verificationAttemptLabel(order: ProfileOrder) {
  return order.status === 'supplier_files_rejected' ? '1 / 2' : '1 / 2 active';
}

function paymentAuthorizationDate(order: ProfileOrder) {
  if (order.paymentStatus === 'authorized') return formatDate(order.quoteSnapshot?.createdAt ?? order.createdAt);
  return formatDate(order.paidAt ?? order.quoteSnapshot?.createdAt ?? order.createdAt);
}

function paymentPaidDate(order: ProfileOrder) {
  return order.paidAt ? formatDate(order.paidAt) : '-';
}

function orderInvoiceAvailability(order: ProfileOrder) {
  return isPaidOrder(order) ? 'Disponible' : 'Non disponible';
}

function orderPaymentStatusLabel(order: ProfileOrder) {
  const status = order.paymentStatus ?? (isPaidOrder(order) ? 'paid' : 'pending');
  const labels: Record<NonNullable<ProfileOrder['paymentStatus']>, string> = {
    pending: 'En attente',
    authorized: 'Autorise',
    paid: 'Paye',
    failed: 'Refuse',
    canceled: 'Annule',
    expired: 'Expire',
    refunded: 'Rembourse',
  };

  return labels[status];
}

function productionStartedDate(order: ProfileOrder) {
  return order.paidAt ? formatDate(order.paidAt) : formatDate(order.createdAt);
}

function productionStatusLabel(order: ProfileOrder) {
  if (order.status === 'paid') return 'Preparation';
  if (order.status === 'supplier_order_pending') return 'Commande transmise';
  if (order.status === 'supplier_ordered') return 'Lancement confirme';
  if (order.status === 'supplier_in_production') return 'Production en cours';
  if (order.status === 'china_3pl_received') return 'Reception plateforme';
  return orderStatusLabel(order.status);
}

function productionEndDate(order: ProfileOrder) {
  const start = new Date(order.paidAt ?? order.createdAt);
  if (Number.isNaN(start.getTime())) return '-';
  const days = productionDelayDays(order);
  if (!days) return 'A confirmer';
  const end = addCalendarDays(start, days);
  return formatDate(end.toISOString());
}

function productionDelayDays(order: ProfileOrder) {
  const config = order.quoteSnapshot?.configSnapshot ?? {};
  return numberConfig(config.productionBuildDays)
    ?? numberConfig(config.supplierLeadTimeDays)
    ?? numberConfig(config.buildTimeDays)
    ?? numberConfig(order.quoteSnapshot?.breakdown?.productionBuildDays)
    ?? numberConfig(order.quoteSnapshot?.breakdown?.supplierLeadTimeDays)
    ?? extractFirstNumber(orderProductionDelay(order));
}

function productionReference(order: ProfileOrder) {
  return `KPR-${order.orderNumber.replace(/[^a-zA-Z0-9]/g, '').slice(-8) || order.id.slice(0, 8)}`;
}

function qualityStatusLabel(order: ProfileOrder) {
  if (order.status === 'china_3pl_received') return 'Controle reception';
  if (order.status === 'supplier_in_production') return 'En attente';
  if (order.status === 'supplier_ordered' || order.status === 'supplier_order_pending') return 'Planifie';
  return 'Preparation';
}

function rejectionReportHref(order: ProfileOrder) {
  const config = order.quoteSnapshot?.configSnapshot ?? {};
  const warnings = Array.isArray(config.gerberWarnings) ? config.gerberWarnings.map(String) : [];
  const body = [
    `Commande: ${order.orderNumber}`,
    `Fichier: ${orderGerberLabel(order)}`,
    `Statut: ${verificationStatusLabel(order)}`,
    '',
    'Motif du rejet:',
    ...(warnings.length ? warnings.map((warning) => `- ${warning}`) : ['- Fichier refuse pendant la verification technique. Corrigez le fichier Gerber, puis resoumettez la meme commande depuis le bouton de modification.']),
  ].join('\n');

  return `data:text/plain;charset=utf-8,${encodeURIComponent(body)}`;
}

function OrderTableSearchPanel({
  orders,
  dataStatus,
  onOrdersChange,
}: {
  orders: ProfileOrder[];
  dataStatus: 'loading' | 'ready' | 'signed-out' | 'error';
  onOrdersChange: (orders: ProfileOrder[] | ((current: ProfileOrder[]) => ProfileOrder[])) => void;
}) {
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [serviceFilter, setServiceFilter] = useState<OrderServiceFilter>('all');
  const [deletingOrderId, setDeletingOrderId] = useState('');
  const [quantityUpdatingOrderId, setQuantityUpdatingOrderId] = useState('');
  const [detailOrder, setDetailOrder] = useState<ProfileOrder | null>(null);
  const [cartTermsAccepted, setCartTermsAccepted] = useState(false);
  const [cartSummaryOpen, setCartSummaryOpen] = useState(false);
  const filteredOrders = orders.filter((order) => serviceFilter === 'all' || orderProductFilterKey(order) === serviceFilter);
  const visibleOrders = filteredOrders;
  const selectedOrders = orders.filter((order) => selectedOrderIds.includes(order.id) && isSelectableCartOrder(order));
  const allVisibleSelected = visibleOrders.filter(isSelectableCartOrder).every((order) => selectedOrderIds.includes(order.id));
  const merchandiseTotal = selectedOrders.reduce((total, order) => total + orderProductionTotal(order), 0);
  const shippingTotal = selectedOrders.reduce((total, order) => total + orderShippingTotal(order), 0);
  const taxesTotal = selectedOrders.reduce((total, order) => total + orderTaxesTotal(order), 0);
  const payableTotal = merchandiseTotal + shippingTotal + taxesTotal;
  const totalWeightKg = selectedOrders.reduce((total, order) => total + orderWeightKg(order), 0);
  const canProceedToPayment = selectedOrders.length === 1 && cartTermsAccepted;

  useEffect(() => {
    setCartTermsAccepted(false);
  }, [selectedOrderIds.join('|')]);

  function toggleOrderSelection(orderId: string) {
    setSelectedOrderIds((current) => (current.includes(orderId) ? current.filter((id) => id !== orderId) : [...current, orderId]));
  }

  function toggleVisibleSelection() {
    const visibleSelectableIds = visibleOrders.filter(isSelectableCartOrder).map((order) => order.id);
    if (visibleSelectableIds.length === 0) return;

    setSelectedOrderIds((current) => {
      const shouldClear = visibleSelectableIds.every((id) => current.includes(id));
      if (shouldClear) return current.filter((id) => !visibleSelectableIds.includes(id));
      return Array.from(new Set([...current, ...visibleSelectableIds]));
    });
  }

  async function deleteOrder(orderId: string) {
    if (deletingOrderId) return;
    const confirmed = window.confirm('Supprimer cette commande de votre panier ?');
    if (!confirmed) return;

    setDeletingOrderId(orderId);
    try {
      const session = await readFreshAuthSession();
      if (!session) throw new Error('Session expiree.');

      const response = await fetch(`${getApiBaseUrl()}/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: { Authorization: `${session.tokenType} ${session.accessToken}` },
      });

      if (!response.ok) throw new Error('Suppression impossible.');

      onOrdersChange((current) => current.filter((order) => order.id !== orderId));
      setSelectedOrderIds((current) => current.filter((id) => id !== orderId));
      window.dispatchEvent(new Event('kendronics:orders-updated'));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Suppression impossible.');
    } finally {
      setDeletingOrderId('');
    }
  }

  async function updateOrderQuantity(order: ProfileOrder, quantity: number) {
    if (quantity === orderQuantity(order) || quantityUpdatingOrderId) return;
    setQuantityUpdatingOrderId(order.id);
    try {
      const session = await readFreshAuthSession();
      if (!session) throw new Error('Session expiree.');

      const response = await fetch(`${getApiBaseUrl()}/api/orders/${order.id}/quantity`, {
        method: 'PATCH',
        headers: {
          Authorization: `${session.tokenType} ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(Array.isArray(error?.message) ? error.message.join(' ') : error?.message ?? 'Impossible de mettre a jour la quantite.');
      }

      const updatedOrder = (await response.json()) as ProfileOrder;
      onOrdersChange((current) => current.map((item) => (item.id === updatedOrder.id ? updatedOrder : item)));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Impossible de mettre a jour la quantite.');
    } finally {
      setQuantityUpdatingOrderId('');
    }
  }

  return (
    <div className="mt-4 grid gap-5 pb-24 sm:pb-0 xl:grid-cols-[minmax(0,1fr)_290px]">
      <div className="min-w-0">
        <div className="bg-white">
          <div className="border-b border-[#e5e7eb] py-3 text-sm text-black sm:flex sm:flex-wrap sm:items-center sm:gap-5 sm:py-4">
            <div className="flex snap-x gap-2 overflow-x-auto pb-1 text-sm text-black sm:w-auto sm:flex-wrap sm:items-center sm:gap-5 sm:overflow-visible sm:pb-0">
              {orderServiceFilters.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setServiceFilter(filter.key)}
                  className={`min-w-max snap-start px-3 py-2 sm:px-0 sm:py-0 ${serviceFilter === filter.key ? 'bg-[#eefbf6] text-[#0f8f6b] sm:bg-transparent' : 'text-black hover:text-[#0f8f6b]'}`}
                >
                  {filter.label} ({orders.filter((order) => filter.key === 'all' || orderProductFilterKey(order) === filter.key).length})
                </button>
              ))}
            </div>
          </div>

          <div className="sm:hidden">
            {dataStatus === 'loading' ? (
              <p className="px-2 py-12 text-center text-sm font-semibold text-[#92979d]">Chargement des commandes...</p>
            ) : dataStatus === 'signed-out' ? (
              <p className="px-2 py-12 text-center text-sm font-semibold text-[#92979d]">Connectez-vous pour afficher vos commandes.</p>
            ) : dataStatus === 'error' ? (
              <p className="px-2 py-12 text-center text-sm font-semibold text-red-600">Impossible de charger les commandes.</p>
            ) : orders.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm font-semibold text-[#92979d]">Votre panier est vide.</p>
                <a href="/quote" className="mt-4 inline-flex h-10 items-center justify-center bg-[#0f8f6b] px-5 text-sm font-semibold text-white hover:bg-[#0b7558]">Ajouter un nouvel article</a>
              </div>
            ) : visibleOrders.length === 0 ? (
              <p className="px-2 py-12 text-center text-sm font-semibold text-[#92979d]">Aucune commande pour ce service.</p>
            ) : (
              <div className="grid gap-3 py-3">
                {visibleOrders.map((order) => (
                  <MobileOrderCard
                    key={order.id}
                    order={order}
                    selected={selectedOrderIds.includes(order.id)}
                    deleting={deletingOrderId === order.id}
                    quantityUpdating={quantityUpdatingOrderId === order.id}
                    onToggle={() => toggleOrderSelection(order.id)}
                    onDetail={() => setDetailOrder(order)}
                    onDelete={() => void deleteOrder(order.id)}
                    onQuantityChange={(quantity) => void updateOrderQuantity(order, quantity)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="hidden overflow-x-auto sm:block">
            <div className="grid min-w-[760px] grid-cols-[32px_minmax(360px,1fr)_100px_130px_100px_46px] items-center bg-[#f4f5f7] py-3 text-sm text-black">
              <input type="checkbox" checked={visibleOrders.length > 0 && allVisibleSelected} onChange={toggleVisibleSelection} className="h-4 w-4 accent-[#0877ff]" aria-label="Selectionner toutes les commandes visibles" />
              <span>Article</span>
              <span>Qte</span>
              <span>Delais prod</span>
              <span>Prix</span>
              <span className="text-center text-[#9ca3af]">Action</span>
            </div>

            {dataStatus === 'loading' ? (
              <p className="min-w-[760px] px-5 py-14 text-center text-base font-black text-[#92979d]">Chargement des commandes...</p>
            ) : dataStatus === 'signed-out' ? (
              <p className="min-w-[760px] px-5 py-14 text-center text-base font-black text-[#92979d]">Connectez-vous pour afficher vos commandes.</p>
            ) : dataStatus === 'error' ? (
              <p className="min-w-[760px] px-5 py-14 text-center text-base font-black text-red-600">Impossible de charger les commandes.</p>
            ) : orders.length === 0 ? (
              <div className="min-w-[760px] py-12 text-center">
                <p className="text-base font-semibold text-[#92979d]">Votre panier est vide.</p>
                <a href="/quote" className="mt-4 inline-flex h-10 items-center justify-center bg-[#0f8f6b] px-5 text-sm font-semibold text-white hover:bg-[#0b7558]">Ajouter un nouvel article</a>
              </div>
            ) : visibleOrders.length === 0 ? (
              <div className="min-w-[760px] py-12 text-center">
                <p className="text-base font-semibold text-[#92979d]">Aucune commande pour ce service.</p>
              </div>
            ) : (
              <div className="min-w-[760px] divide-y divide-[#e5e7eb]">
                {visibleOrders.map((order) => (
                  <div key={order.id} className="grid grid-cols-[32px_minmax(360px,1fr)_100px_130px_100px_46px] items-start py-5 text-sm text-[#1f2f43]">
                    <input type="checkbox" checked={selectedOrderIds.includes(order.id)} disabled={!isSelectableCartOrder(order)} onChange={() => toggleOrderSelection(order.id)} className="mt-8 h-4 w-4 accent-[#0877ff]" aria-label={`Selectionner ${order.orderNumber}`} />
                    <div className="flex min-w-0 gap-5">
                      <div className="grid h-[84px] w-[84px] shrink-0 place-items-center bg-[#f1f4f7] text-center text-xs text-[#cbd5e1]">Kendronics</div>
                      <div className="min-w-0 py-0.5">
                        <p className="truncate text-black">{orderGerberLabel(order)}</p>
                        <p className="mt-1 text-sm text-[#44546a]">{orderProductOrderLine(order)}</p>
                        <p className="mt-1 text-sm text-[#44546a]">{orderSummaryLine(order)}</p>
                        <div className="mt-2 grid justify-items-start gap-1 text-sm">
                          <button type="button" onClick={() => setDetailOrder(order)} className="text-left text-[#44546a] hover:text-[#0877ff]">Details du produit</button>
                          <a href={`/quote?orderId=${encodeURIComponent(order.id)}`} className="text-[#44546a] hover:text-[#0877ff]">Modifier la commande</a>
                        </div>
                      </div>
                    </div>
                    <div className="pt-4">
                      <select
                        value={orderQuantity(order)}
                        onChange={(event) => void updateOrderQuantity(order, Number(event.target.value))}
                        disabled={quantityUpdatingOrderId === order.id || !canUpdateOrderQuantity(order)}
                        className="h-9 w-[82px] border border-[#d1d5db] bg-white px-3 text-sm outline-none disabled:cursor-not-allowed disabled:bg-[#f1f5f9]"
                      >
                        {quantityOptions(orderQuantity(order)).map((quantity) => (
                          <option key={quantity} value={quantity}>{quantity}</option>
                        ))}
                      </select>
                    </div>
                    <span className="pt-5 text-sm text-black">{orderProductionDelay(order)}</span>
                    <div className="pt-5">
                      <p className="text-[#ff7a00]">{formatMoney(orderProductionTotal(order))}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteOrder(order.id)}
                      disabled={deletingOrderId === order.id || !isSelectableCartOrder(order)}
                      className="pt-5 text-center text-[#9ca3af] hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Supprimer ${order.orderNumber}`}
                    >
                      {deletingOrderId === order.id ? '...' : 'x'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <aside className={`${dataStatus === 'ready' && orders.length > 0 ? 'fixed inset-x-0 bottom-[calc(3.9rem+env(safe-area-inset-bottom))] z-[60] border-t border-slate-200 bg-[#f4f7fa]/96 px-3 py-2.5 backdrop-blur' : 'hidden'} text-black sm:static sm:block sm:border sm:border-[#e5e7eb] sm:bg-white sm:p-5 sm:backdrop-blur-0`}>
        <div className="mx-auto flex max-w-md items-center gap-3 sm:hidden">
          <button type="button" onClick={() => setCartSummaryOpen((open) => !open)} className="min-w-0 flex-1 text-left" aria-expanded={cartSummaryOpen} aria-label="Afficher le detail du resume">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Total</p>
            <p className="mt-0.5 flex items-baseline gap-1.5 text-lg font-semibold text-[#ff7a00]">
              <span>{formatMoney(payableTotal)}</span>
              <span className="text-[10px] font-medium text-[#c45100]">details</span>
            </p>
            <p className="text-[10px] text-[#0877ff]">{selectedOrders.length} Article&gt;</p>
          </button>
          {selectedOrders.length > 0 ? (
            <label className="flex max-w-[4.8rem] items-center gap-1 text-[10px] leading-3 text-[#0f4f3f]">
              <input type="checkbox" checked={cartTermsAccepted} onChange={(event) => setCartTermsAccepted(event.target.checked)} className="h-3.5 w-3.5 shrink-0 accent-[#0f8f6b]" />
              Regle
            </label>
          ) : null}
          {canProceedToPayment ? (
            <a href={`/orders/${selectedOrders[0].id}`} className="inline-flex h-11 min-w-[7.4rem] items-center justify-center bg-[#0f8f6b] px-4 text-xs font-semibold uppercase text-white">
              Continuer
            </a>
          ) : (
            <span className="inline-flex h-11 min-w-[7.4rem] items-center justify-center bg-[#0f8f6b]/25 px-4 text-xs font-semibold uppercase text-white">
              Continuer
            </span>
          )}
        </div>
        {cartSummaryOpen ? (
          <div className="sheet-panel-in mx-auto mt-2 max-w-md border-t border-slate-200 pt-2 text-xs sm:hidden">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-semibold text-slate-900">Details du resume</span>
              <button type="button" onClick={() => setCartSummaryOpen(false)} className="text-slate-500">x</button>
            </div>
            <div className="grid gap-2">
              <SummaryRow label="Total marchandises" value={formatMoney(merchandiseTotal)} />
              <SummaryRow label="Estimation des frais de port" value={selectedOrders.length ? formatMoney(shippingTotal) : '--'} />
              <SummaryRow label="Droits de douane et taxes" value={selectedOrders.length ? formatMoney(taxesTotal) : '--'} />
              <SummaryRow label="Poids" value={selectedOrders.length ? `${formatWeight(totalWeightKg)}kg` : '--'} />
            </div>
            {selectedOrders.length > 0 ? (
              <div className="mt-3">
                <PaymentAuthorizationSummary checked={cartTermsAccepted} onChange={setCartTermsAccepted} />
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="hidden sm:block">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Cout PCB</p>
            <p className="mt-1 text-xl font-semibold text-[#ff7a00]">{formatMoney(merchandiseTotal)}</p>
          </div>
          <span className="text-xs text-[#0877ff]">{selectedOrders.length} Article&gt;</span>
        </div>
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <span>Estimation des frais de port</span>
            <span>{selectedOrders.length ? formatMoney(shippingTotal) : '--'}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Droits de douane et taxes</span>
            <span>{selectedOrders.length ? formatMoney(taxesTotal) : '--'}</span>
          </div>
          <div className="flex justify-between gap-4 border-t border-[#e5e7eb] pt-3 text-base font-semibold">
            <span>Total</span>
            <span className="text-[#ff7a00]">{formatMoney(payableTotal)}</span>
          </div>
          <div className="border-t border-[#e5e7eb] pt-3">
            <div className="flex justify-between gap-4">
              <span>Paiement</span>
              <span>{selectedOrders.length === 1 ? 'Pret' : 'Un article a la fois'}</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-[#8a8f98]">Le paiement et le detail logistique se font sur la page de chaque commande.</p>
          </div>
          <div className="flex justify-between gap-4">
            <span>Poids</span>
            <span>{selectedOrders.length ? `${formatWeight(totalWeightKg)}kg` : '--'}</span>
          </div>
          {selectedOrders.length > 0 ? <PaymentAuthorizationSummary checked={cartTermsAccepted} onChange={setCartTermsAccepted} /> : null}
        </div>
        {canProceedToPayment ? (
          <a href={`/orders/${selectedOrders[0].id}`} className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-sm bg-[#0877ff] px-5 text-base font-semibold text-white hover:bg-[#0068e8]">
            Paiement securise
          </a>
        ) : (
          <span className="mt-5 inline-flex h-12 w-full cursor-not-allowed items-center justify-center rounded-sm bg-[#cbd5e1] px-5 text-base font-semibold text-white">
            {selectedOrders.length === 1 ? 'Acceptez la regle' : 'Selectionnez un article'}
          </span>
        )}
        <a href="/quote" className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-sm border border-[#0877ff] px-5 text-base text-[#0877ff] hover:bg-[#eef6ff]">
          +Ajouter un nouvel article
        </a>
        </div>
      </aside>
      {detailOrder ? <ProductDetailModal order={detailOrder} onClose={() => setDetailOrder(null)} /> : null}
    </div>
  );
}

function PaymentAuthorizationSummary({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="block cursor-pointer border border-[#b9ebda] bg-[#eefbf6] p-3 text-xs leading-5 text-[#0f4f3f]">
      <div className="flex gap-2">
        <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#0f8f6b]" />
        <span>
          Le montant est d'abord autorise, sans capture immediate. Les fichiers sont controles avant lancement. Si les fichiers sont acceptes, le paiement est capture et la production demarre. Si les fichiers sont refuses, vous pouvez corriger une fois ou abandonner; apres un second refus, l'autorisation est annulee et le montant est libere.
        </span>
      </div>
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-600">{label}</span>
      <span className="font-semibold text-slate-950">{value}</span>
    </div>
  );
}

function MobileOrderCard({
  order,
  selected,
  deleting,
  quantityUpdating,
  onToggle,
  onDetail,
  onDelete,
  onQuantityChange,
}: {
  order: ProfileOrder;
  selected: boolean;
  deleting: boolean;
  quantityUpdating: boolean;
  onToggle: () => void;
  onDetail: () => void;
  onDelete: () => void;
  onQuantityChange: (quantity: number) => void;
}) {
  const selectable = isSelectableCartOrder(order);

  return (
    <article className="border border-[#e5e7eb] bg-white p-3 text-sm text-[#1f2f43]">
      <div className="flex gap-3">
        <input type="checkbox" checked={selected} disabled={!selectable} onChange={onToggle} className="mt-8 h-5 w-5 shrink-0 accent-[#0f8f6b]" aria-label={`Selectionner ${order.orderNumber}`} />
        <div className="grid h-[76px] w-[76px] shrink-0 place-items-center bg-[#f1f4f7] text-center text-[10px] text-[#94a3b8]">Kendronics</div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-black">{orderGerberLabel(order)}</p>
          <p className="mt-1 text-xs text-[#44546a]">{orderProductOrderLine(order)}</p>
          <p className="mt-1 text-xs text-[#44546a]">{orderSummaryLine(order)}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <button type="button" onClick={onDetail} className="text-[#44546a] hover:text-[#0877ff]">Details du produit</button>
            <a href={`/quote?orderId=${encodeURIComponent(order.id)}`} className="text-[#44546a] hover:text-[#0877ff]">Modifier la commande</a>
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-[1fr_1fr_auto] items-end gap-3 border-t border-[#eef0f3] pt-3">
        <label className="grid gap-1 text-xs text-[#64748b]">
          Qte
          <select
            value={orderQuantity(order)}
            onChange={(event) => onQuantityChange(Number(event.target.value))}
            disabled={quantityUpdating || !canUpdateOrderQuantity(order)}
            className="h-9 border border-[#d1d5db] bg-white px-2 text-sm text-black outline-none disabled:cursor-not-allowed disabled:bg-[#f1f5f9]"
          >
            {quantityOptions(orderQuantity(order)).map((quantity) => (
              <option key={quantity} value={quantity}>{quantity}</option>
            ))}
          </select>
        </label>
        <div>
          <p className="text-xs text-[#64748b]">Cout PCB</p>
          <p className="text-base font-semibold text-[#ff7a00]">{formatMoney(orderProductionTotal(order))}</p>
        </div>
        <button type="button" onClick={onDelete} disabled={deleting || !selectable} className="h-9 px-2 text-[#9ca3af] hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40" aria-label={`Supprimer ${order.orderNumber}`}>
          {deleting ? '...' : 'x'}
        </button>
      </div>
    </article>
  );
}

function orderTotal(order: ProfileOrder) {
  return order.totalPrice ?? order.quoteSnapshot?.finalTotal ?? 0;
}

function orderProductionTotal(order: ProfileOrder) {
  return Math.max(0, orderTotal(order) - orderShippingTotal(order) - orderTaxesTotal(order));
}

function orderShippingTotal(order: ProfileOrder) {
  return lineAmount(order.quoteSnapshot?.breakdown, ['FranceToAfricaDelivery', 'franceToAfricaDelivery']);
}

function orderTaxesTotal(order: ProfileOrder) {
  return lineAmount(order.quoteSnapshot?.breakdown, ['taxesIfApplicable', 'customsRiskBuffer']);
}

function lineAmount(breakdown: Record<string, number> | undefined, keys: string[]) {
  if (!breakdown) return 0;
  return keys.reduce((total, key) => total + Number(breakdown[key] ?? 0), 0);
}

function orderProductFilterKey(order: ProfileOrder): OrderProductFilter {
  const type = order.quoteSnapshot?.productType;
  if (type === 'advanced_pcb' || type === 'pcb_assembly' || type === 'fpc_rigid_flex' || type === 'smt_stencil') return type;
  return 'standard_pcb';
}

function productFilterGroupLabel(filter: OrderProductFilter) {
  return {
    standard_pcb: 'Kendronics (PCB standard)',
    advanced_pcb: 'Kendronics (PCB avance / PCBA)',
    fpc_rigid_flex: 'Kendronics (FPC / rigide-flex)',
    pcb_assembly: 'Kendronics (Assemblage)',
    smt_stencil: 'Kendronics (Pochoir CMS)',
  }[filter];
}

function shortOrderStatusLabel(key: OrderStatusKey) {
  if (key === 'payment-pending') return 'Paiement';
  if (key === 'production') return 'Production';
  if (key === 'delivery') return 'Livraison';
  if (key === 'completed') return 'Terminees';
  return 'Tout';
}

function orderSummaryLine(order: ProfileOrder) {
  const config = order.quoteSnapshot?.configSnapshot ?? {};
  const color = stringConfig(config.solderMaskColor) || 'Couleur a confirmer';
  const thickness = stringConfig(config.thickness) || 'Epaisseur a confirmer';
  const finish = stringConfig(config.surfaceFinish) || 'Finition a confirmer';
  return `${color}, ${thickness}, ${finish}`;
}

function orderProductOrderLine(order: ProfileOrder) {
  const product = orderProductLabel(order);
  return `${product}:${order.orderNumber}`;
}

function orderProductionDelay(order: ProfileOrder) {
  const config = order.quoteSnapshot?.configSnapshot ?? {};
  const explicitLabel = stringConfig(config.buildTimeLabel) || stringConfig(config.productionLeadTimeLabel) || stringConfig(config.supplierLeadTimeLabel);
  if (explicitLabel) return explicitLabel;

  const days = numberConfig(config.productionBuildDays)
    ?? numberConfig(config.supplierLeadTimeDays)
    ?? numberConfig(config.buildTimeDays)
    ?? numberConfig(order.quoteSnapshot?.breakdown?.productionBuildDays)
    ?? numberConfig(order.quoteSnapshot?.breakdown?.supplierLeadTimeDays);
  if (days && days > 0) return `${days} jour${days > 1 ? 's' : ''}`;
  return orderLeadTime(order);
}

function orderWeightKg(order: ProfileOrder) {
  const config = order.quoteSnapshot?.configSnapshot ?? {};
  const explicitWeight = numberConfig(config.weightKg) ?? numberConfig(config.estimatedWeightKg) ?? numberConfig(config.shippingWeightKg);
  if (explicitWeight && explicitWeight > 0) return explicitWeight;

  const lengthMm = order.quoteSnapshot?.lengthMm ?? numberConfig(config.lengthMm) ?? numberConfig(config.length) ?? 100;
  const widthMm = order.quoteSnapshot?.widthMm ?? numberConfig(config.widthMm) ?? numberConfig(config.width) ?? 100;
  const quantity = order.quoteSnapshot?.quantity ?? numberConfig(config.quantity) ?? 1;
  const layers = order.quoteSnapshot?.layers ?? numberConfig(config.layers) ?? 2;
  const thickness = parseFloat(String(config.thickness ?? '1.6').replace(',', '.')) || 1.6;
  const pcbVolumeCm3 = (lengthMm / 10) * (widthMm / 10) * (thickness / 10);
  const materialKg = pcbVolumeCm3 * 1.85 / 1000 * quantity;
  const layerFactor = Math.max(1, layers / 2);
  return Math.max(0.08, materialKg * layerFactor + 0.06);
}

function deliveryStatusLabel(order: ProfileOrder) {
  if (order.status === 'shipped_to_africa') return 'Expedie';
  if (order.status === 'customs_processing') return 'Douane';
  if (order.status === 'out_for_delivery') return 'Dernier kilometre';
  if (order.status === 'delivered') return 'Livre';
  return 'Preparation logistique';
}

function deliveryDestinationLabel(order: ProfileOrder) {
  const config = order.quoteSnapshot?.configSnapshot ?? {};
  const country = stringConfig(config.destinationCountry) || stringConfig(config.shippingCountry) || stringConfig(config.country);
  return country ? countryDisplayName(country) : 'A confirmer';
}

function deliveryEstimateLabel(order: ProfileOrder) {
  if (order.status === 'delivered') return 'Terminee';
  const config = order.quoteSnapshot?.configSnapshot ?? {};
  const deliveryDate = stringConfig(config.deliveryDate) || stringConfig(config.estimatedDeliveryDate) || stringConfig(config.deliveryEta);
  if (deliveryDate) return deliveryDate;
  return orderLeadTime(order);
}

function shippingModeLabel(order: ProfileOrder) {
  const mode = order.quoteSnapshot?.shippingMode || stringConfig(order.quoteSnapshot?.configSnapshot?.shippingMode);
  if (mode === 'express') return 'Livraison express';
  if (mode === 'economy') return 'Livraison economique';
  if (mode === 'standard') return 'Livraison standard';
  return 'Transporteur a confirmer';
}

function defaultMaterialType(order: ProfileOrder) {
  const config = order.quoteSnapshot?.configSnapshot ?? {};
  const material = stringConfig(config.baseMaterial).toUpperCase();
  if (material.includes('FR-4') || material.includes('FR4')) return 'FR-4 TG135';
  if (material.includes('ALUMIN')) return 'Aluminium';
  if (material.includes('ROGERS')) return 'Rogers';
  return 'Selon materiau du devis';
}

function formatWeight(value: number) {
  return value.toFixed(value >= 1 ? 2 : 3).replace('.', ',');
}

function stringConfig(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function numberConfig(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function extractFirstNumber(value: string) {
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : undefined;
}

function addCalendarDays(startDate: Date, days: number) {
  const date = new Date(startDate);
  date.setDate(date.getDate() + days);
  return date;
}

function ProductDetailModal({ order, onClose }: { order: ProfileOrder; onClose: () => void }) {
  const rows = productDetailRows(order);

  return (
    <div className="fixed inset-0 z-[90] bg-black/55 px-0 py-0 sm:px-4 sm:py-10">
      <div className="sheet-panel-in absolute inset-x-0 bottom-0 max-h-[72vh] overflow-hidden rounded-t-2xl bg-white text-black shadow-xl sm:relative sm:mx-auto sm:max-h-[86vh] sm:max-w-[1100px] sm:rounded-none">
        <div className="sticky top-0 z-10 mb-3 flex items-center justify-between gap-4 border-b border-[#dfe5ec] bg-white px-4 py-3 sm:static sm:mb-4 sm:border-b-0 sm:px-7 sm:py-5">
          <h2 className="text-lg font-semibold">Detail du produit</h2>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center bg-[#f1f5f9] text-2xl text-[#6b7280] hover:text-black sm:bg-transparent" aria-label="Fermer">
            x
          </button>
        </div>
        <div className="max-h-[calc(72vh-3.8rem)] overflow-y-auto overscroll-contain px-4 pb-4 sm:max-h-[calc(86vh-4rem)] sm:px-7 sm:pb-7">
          <div className="grid border border-[#dfe5ec] text-sm md:grid-cols-2">
            {rows.map((row) => (
              <div key={row.label} className="grid border-b border-[#dfe5ec] md:grid-cols-[200px_minmax(0,1fr)] md:border-r md:even:border-r-0">
                <span className="bg-[#f0f3f7] px-3 py-2 text-xs font-semibold uppercase tracking-[0.04em] text-[#1f2f43] md:py-3 md:text-sm md:normal-case md:tracking-normal">{row.label}</span>
                <span className="min-w-0 break-words px-3 py-2 md:py-3">{row.value || 'A confirmer'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function productDetailRows(order: ProfileOrder) {
  const quote = order.quoteSnapshot;
  const config = quote?.configSnapshot ?? {};
  const dimensions = `${quote?.lengthMm ?? numberConfig(config.lengthMm) ?? numberConfig(config.length) ?? 'A confirmer'} mm * ${quote?.widthMm ?? numberConfig(config.widthMm) ?? numberConfig(config.width) ?? 'A confirmer'} mm`;

  return [
    { label: 'Fichier Gerber:', value: orderGerberLabel(order) },
    { label: 'Delais prod:', value: orderProductionDelay(order) },
    { label: 'Materiau de base:', value: stringConfig(config.baseMaterial) || 'FR-4' },
    { label: 'Couches:', value: String(quote?.layers ?? numberConfig(config.layers) ?? 'A confirmer') },
    { label: 'Dimension:', value: dimensions },
    { label: 'Quantite de PCB:', value: String(quote?.quantity ?? numberConfig(config.quantity) ?? 'A confirmer') },
    { label: 'Type de produit:', value: orderProductLabel(order) },
    { label: 'Conception differente:', value: String(numberConfig(config.designCount) ?? numberConfig(config.differentDesigns) ?? 1) },
    { label: 'Format de livraison:', value: stringConfig(config.deliveryFormat) || 'Single PCB' },
    { label: 'Epaisseur de PCB:', value: stringConfig(config.thickness) },
    { label: "Specifier l'empilement:", value: stringConfig(config.stackup) || 'Non' },
    { label: 'Couleur de PCB:', value: stringConfig(config.solderMaskColor) },
    { label: 'Serigraphie:', value: stringConfig(config.silkscreenColor) },
    { label: 'Type de materiel:', value: stringConfig(config.materialType) || stringConfig(config.fr4Tg) || defaultMaterialType(order) },
    { label: 'Recouvrement des vias:', value: stringConfig(config.viaCovering) },
    { label: 'Finition de surface:', value: stringConfig(config.surfaceFinish) },
    { label: 'Ebavurage/Arrondissement des bords:', value: booleanText(config.edgePlating) },
    { label: 'Poids du cuivre externe:', value: stringConfig(config.outerCopperWeight) || stringConfig(config.copperWeight) },
    { label: 'Doigts dores:', value: booleanText(config.goldFingers) },
    { label: 'Test electrique:', value: stringConfig(config.electricalTest) || 'Test selon revue' },
    { label: 'Trous metallises:', value: booleanText(config.platedHoles) },
    { label: 'Placage des bords:', value: booleanText(config.edgePlating) },
    { label: 'Marquage sur PCB:', value: stringConfig(config.markOnPcb) || stringConfig(config.removeMark) },
    { label: 'Trou aveugle:', value: booleanText(config.blindVia) },
    { label: 'Min via hole size/diameter:', value: stringConfig(config.minViaHole) || stringConfig(config.minHoleSize) },
    { label: 'Via Plating Method:', value: stringConfig(config.viaPlatingMethod) },
    { label: '4-Wire Kelvin Test:', value: booleanText(config.fourWireKelvinTest) },
    { label: 'Paper between PCBs:', value: booleanText(config.paperBetweenPcbs) },
    { label: 'Appearance Quality:', value: stringConfig(config.appearanceQuality) },
    { label: 'Confirm Production file:', value: booleanText(config.confirmProductionFile) },
    { label: 'Silkscreen Technology:', value: stringConfig(config.silkscreenTechnology) },
    { label: 'Package Box:', value: stringConfig(config.packageBox) },
    { label: 'Inspection Report:', value: booleanText(config.inspectionReport) },
    { label: 'Board Outline Tolerance:', value: stringConfig(config.boardOutlineTolerance) },
    { label: 'UL Marking:', value: booleanText(config.ulMarking) },
    { label: 'Countersink Hole:', value: booleanText(config.countersinkHole) },
    { label: 'Humidity Indicator Card:', value: booleanText(config.humidityIndicatorCard) },
    { label: 'Poids brut:', value: `${formatWeight(orderWeightKg(order))} kg` },
  ];
}

function booleanText(value: unknown) {
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  if (typeof value === 'string' && value.trim()) return value;
  return 'Non';
}

function isSelectableCartOrder(order: ProfileOrder) {
  return ['draft', 'quoted', 'awaiting_payment'].includes(order.status) && order.status !== 'cancelled' && order.status !== 'refunded';
}

function orderMatchesQuery(order: ProfileOrder, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  return [order.orderNumber, order.id, order.quoteSnapshot?.gerberFileId, orderProductLabel(order), orderStatusLabel(order.status)]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalizedQuery));
}

function orderQuantity(order: ProfileOrder) {
  return order.quoteSnapshot?.quantity ?? 1;
}

function quantityOptions(current: number) {
  return Array.from(new Set([current, 5, 10, 20, 30, 50, 100, 200, 500].filter((value) => value > 0))).sort((a, b) => a - b);
}

function canUpdateOrderQuantity(order: ProfileOrder) {
  return ['draft', 'quoted', 'awaiting_payment'].includes(order.status);
}

function orderLeadTime(order: ProfileOrder) {
  if (order.status === 'delivered') return 'Termine';
  if (order.status === 'cancelled' || order.status === 'refunded') return '-';
  if (order.status === 'awaiting_payment' || order.paymentStatus === 'pending') return 'Apres autorisation';
  if (order.status === 'supplier_in_production') return 'En production';
  if (order.status === 'shipped_to_africa' || order.status === 'customs_processing' || order.status === 'out_for_delivery') return 'En transit';
  return 'Selon revue';
}

function orderProviderLabel(order: ProfileOrder) {
  return order.externalManufacturingPartner || order.carrierName || 'Kendronics';
}

function orderGerberLabel(order: ProfileOrder) {
  const gerberId = order.quoteSnapshot?.gerberFileId?.trim();
  if (gerberId) return `pcb-gbr-files_${gerberId.slice(0, 10)}`;
  return `pcb-gbr-files_${order.orderNumber}`;
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
  return <p className="pt-14 text-center text-base font-black text-[#92979d]">Votre recherche ne correspond a aucune liste.</p>;
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
        <h2 className="text-xl font-normal text-black">Gerer les commentaires</h2>
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
    <section className="min-h-[690px] bg-white p-0 text-black sm:p-5 lg:bg-[#eef0f3] lg:shadow-sm lg:ring-1 lg:ring-slate-200">
      <h1 className="text-xl font-normal">Notifications</h1>
      <div className="mt-4 grid gap-3 bg-white px-3 py-3 sm:mt-5 sm:flex sm:h-[58px] sm:items-center sm:justify-between sm:px-5 sm:ring-1 sm:ring-[#e5e7eb]">
        <div className="flex gap-2 overflow-x-auto text-sm sm:items-center sm:gap-5 sm:overflow-visible">
          <button className="min-w-max bg-[#eefbf6] px-3 py-2 text-[#0f8f6b] sm:border-r sm:border-[#b8b8b8] sm:bg-transparent sm:py-0 sm:pr-5 sm:text-[#ff5a00]" type="button">Tout</button>
          <button className="min-w-max px-3 py-2 sm:border-r sm:border-[#b8b8b8] sm:py-0 sm:pr-5" type="button">Centre aide</button>
          <button className="min-w-max px-3 py-2 sm:py-0" type="button">Produit</button>
        </div>
        <button type="button" disabled={markingRead || notifications.every((notification) => notification.readAt)} onClick={() => void markAllNotificationsRead(notifications, onNotificationsChange, setMarkingRead)} className="h-10 border border-[#b8b8b8] px-3 text-xs disabled:cursor-not-allowed disabled:opacity-50 sm:h-auto sm:py-2">
          {markingRead ? 'Mise a jour...' : 'Tout marquer comme lu'}
        </button>
      </div>
      <div className="mt-4 bg-white px-3 py-3 sm:mt-5 sm:px-5 sm:py-4">
        <div className="hidden grid-cols-[1fr_1fr_160px] bg-[#f0f0f0] px-5 py-4 text-xs font-black sm:grid">
          <span>Notifications</span>
          <span>Article</span>
          <span>Date</span>
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
    <div className="grid gap-2 text-xs sm:block sm:divide-y sm:divide-slate-200">
      {notifications.map((notification) => (
        <div key={notification.id} className="grid gap-2 border border-[#e5e7eb] bg-white px-3 py-3 sm:border-0 sm:bg-transparent sm:grid-cols-[1fr_1fr_160px] sm:px-5 sm:py-4">
          <span className={notification.readAt ? 'text-[#6b7280]' : 'font-black text-black'}>{notification.title}</span>
          <span>{notification.body || notification.type}</span>
          <span className="text-[#64748b]">{formatDate(notification.createdAt)}</span>
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
      <HubHeader eyebrow="Services" title="Services disponibles dans votre espace" actionLabel="Devis immédiat" actionHref="/quote" />
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

function AddressFormSection({
  title,
  note,
  billing,
  kind,
  initialAddress,
  onSaved,
}: {
  title: string;
  note?: string;
  billing?: boolean;
  kind: 'shippingAddress' | 'billingAddress';
  initialAddress?: AccountAddress;
  onSaved: (address: AccountAddress) => void;
}) {
  const [address, setAddress] = useState<AccountAddress>(() => normalizeAddress(initialAddress));
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  function update<K extends keyof AccountAddress>(key: K, value: AccountAddress[K]) {
    setAddress((current) => ({ ...current, [key]: value }));
    setStatus('idle');
  }

  async function submitAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('saving');
    try {
      const session = await readFreshAuthSession();
      if (!session) {
        window.location.assign('/login');
        return;
      }

      const response = await fetch(`${getApiBaseUrl()}/api/users/me/${kind === 'shippingAddress' ? 'shipping-address' : 'billing-address'}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      });

      if (!response.ok) throw new Error(`Address update failed: ${response.status}`);
      const user = (await response.json()) as ProfileUser;
      const savedAddress = normalizeAddress(kind === 'shippingAddress' ? user.shippingAddress : user.billingAddress);
      setAddress(savedAddress);
      onSaved(savedAddress);
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  }

  return (
    <section className="min-h-[690px] bg-white p-5 text-black shadow-sm ring-1 ring-slate-200">
      <div className="flex items-end gap-3">
        <h1 className="text-xl font-normal">{title}</h1>
        {note ? <span className="text-xs text-[#9ca3af]">{note}</span> : null}
      </div>
      <div className="mt-3 bg-[#fff8e8] px-3 py-2 text-xs ring-1 ring-[#f4dfb4]">
        <span className="mr-2 text-lg text-[#ff8a00]">!</span>
        {billing
          ? "La mise a jour de l'adresse de facturation ne modifie pas les commandes deja confirmees ou payees."
          : "La mise a jour d'adresse ne modifie pas les commandes deja generees. Contactez Kendronics si une commande active doit etre corrigee."}
      </div>
      {billing ? <p className="mt-5 text-xs text-[#6b7280]">Assurez-vous que les informations de facturation sont exactes. Elles seront utilisees pour les documents commerciaux Kendronics.</p> : null}
      <AddressFields formId={`${kind}-form`} address={address} onUpdate={update} onSubmit={submitAddress} />
      <p className="mt-2 text-xs text-[#6b7280]">
        {billing
          ? "Si l'adresse de facturation ne peut pas etre enregistree, contactez le support Kendronics."
          : "Si l'adresse de livraison ne peut pas etre enregistree, contactez le support Kendronics."}
      </p>
      {status === 'saved' ? <p className="mt-3 text-sm font-semibold text-[#0f8f6b]">Adresse enregistree.</p> : null}
      {status === 'error' ? <p className="mt-3 text-sm font-semibold text-red-600">Impossible d'enregistrer cette adresse.</p> : null}
      <button form={`${kind}-form`} type="submit" disabled={status === 'saving'} className="mt-5 bg-[#0f8f6b] px-6 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300">
        {status === 'saving' ? 'Enregistrement...' : 'Soumettre'}
      </button>
    </section>
  );
}

function AddressFields({
  address,
  formId,
  onUpdate,
  onSubmit,
}: {
  address: AccountAddress;
  formId: string;
  onUpdate: <K extends keyof AccountAddress>(key: K, value: AccountAddress[K]) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const fields: Array<[keyof AccountAddress, string, boolean?]> = [
    ['firstName', 'Prenom *', true],
    ['lastName', 'Nom de famille *', true],
    ['street', 'Adresse de la rue *', true],
    ['apartment', 'Appartement, chambre, batiment, etage, etc. (facultatif)'],
    ['country', 'Pays/Region *', true],
    ['region', 'Etat/Province/Region'],
    ['city', 'Ville *', true],
    ['postalCode', 'Zip/Code postal'],
    ['taxId', 'Numero TVA/identification fiscale'],
    ['phone', 'Telephone mobile *', true],
  ];

  return (
    <form id={formId} onSubmit={onSubmit} className="mt-8 grid max-w-[720px] grid-cols-2 gap-x-7 gap-y-4">
      <ChoiceBox label="Societe" active={address.accountType === 'company'} onClick={() => onUpdate('accountType', 'company')} />
      <ChoiceBox label="Particulier" active={address.accountType !== 'company'} onClick={() => onUpdate('accountType', 'individual')} />
      {fields.map(([key, placeholder, required]) => (
        <input
          key={key}
          required={required}
          value={address[key]}
          onChange={(event) => onUpdate(key, event.target.value)}
          placeholder={placeholder}
          className="h-[46px] border border-[#d6d6d6] px-5 text-sm outline-none placeholder:text-[#b8bec8] focus:border-[#18b75b]"
        />
      ))}
    </form>
  );
}

function ChoiceBox({ label, active, onClick }: { label: string; active?: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`flex h-10 items-center gap-4 border px-4 text-sm font-black ${active ? 'border-[#11b957] bg-[#eefbf4]' : 'border-[#d6d6d6]'}`}>
      <span className={`h-5 w-5 rounded-none border ${active ? 'border-[#11b957] bg-[#11b957]' : 'border-[#cfd3d8]'}`} />
      {label}
    </button>
  );
}

function InviteSection() {
  const [referralUrl, setReferralUrl] = useState('/register');

  useEffect(() => {
    const sessionProfile = readSessionProfile();
    setReferralUrl(`${window.location.origin}/register?ref=${encodeURIComponent(sessionProfile.id || sessionProfile.email || 'client')}`);
  }, []);

  return (
    <section className="min-h-[690px] bg-[#eef0f3] text-black shadow-sm ring-1 ring-slate-200">
      <div className="bg-white">
        <h1 className="border-b border-[#e5e7eb] px-8 py-4 text-xl font-normal">Parrainer des amis et gagner de l'argent</h1>
        <div className="px-8 py-5 text-center">
          <p className="text-base leading-5">Partagez votre lien Kendronics avec vos contacts professionnels.<br />Les avantages de parrainage seront appliques selon les regles commerciales actives de votre compte.</p>
          <div className="mx-auto mt-12 grid max-w-[760px] grid-cols-3 gap-16 text-left text-[#92979d]">
            {['Partager votre lien Kendronics', 'Suivre les inscriptions associees', "Recevoir les avantages valides par l'equipe commerciale"].map((text, index) => (
              <div key={text}>
                <span className={`mx-auto block h-[96px] w-[96px] rounded-none ${index === 0 ? 'bg-[#2cc9bb]' : index === 1 ? 'bg-[#53c7d8]' : 'bg-[#8d79b9]'}`} />
                <p className="mt-5 text-base leading-5">{text}</p>
              </div>
            ))}
          </div>
          <div className="mx-auto mt-12 max-w-[992px] bg-[#f5f5f5] p-6">
            <p className="font-black">Copiez le lien suivant et partagez plus, gagnez plus :</p>
            <div className="mx-auto mt-3 flex max-w-[590px] items-center justify-between border border-dashed border-[#c9c9c9] bg-white pl-8 text-xl font-black">
              <span className="truncate pr-4">{referralUrl}</span>
              <button type="button" onClick={() => void navigator.clipboard?.writeText(referralUrl)} className="bg-[#06b34f] px-6 py-4 text-sm text-white">Copier le lien</button>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 bg-white px-8 py-5">
        <h2 className="text-xl font-normal">Statistiques de références</h2>
        <div className="mt-5 grid grid-cols-4 gap-6">
          {['0 INSCRIPTIONS', '0 COMMANDES', '0 EUR CREDITS', '0 EUR GAINS'].map((item) => (
            <div key={item} className="grid h-[122px] place-items-center border border-[#e5e7eb] text-center text-[#92979d]">
              <strong className="block text-3xl text-[#1f2937]">{item.split(' ')[0]}</strong>{item.substring(item.indexOf(' ') + 1)}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SettingsSection({
  profile,
  userId,
  avatarDataUrl,
  onProfileChange,
  onAvatarChange,
}: {
  profile: ProfileForm;
  userId: string;
  avatarDataUrl: string;
  onProfileChange: (profile: ProfileForm | ((current: ProfileForm) => ProfileForm)) => void;
  onAvatarChange: (avatarDataUrl: string) => void;
}) {
  const [editingProfile, setEditingProfile] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
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

  if (editingProfile) {
    return (
      <AccountProfileEditForm
        profile={profile}
        userId={userId}
        avatarDataUrl={avatarDataUrl}
        onCancel={() => setEditingProfile(false)}
        onSaved={(nextProfile) => {
          onProfileChange(nextProfile);
          onAvatarChange(nextProfile.avatarDataUrl || '');
          setEditingProfile(false);
        }}
      />
    );
  }

  return (
    <section className="min-h-[690px] bg-white p-6 text-black shadow-sm ring-1 ring-slate-200">
      <h1 className="border-b border-[#e5e7eb] pb-4 text-xl font-normal">Paramètres du compte</h1>
      <div className="grid grid-cols-[108px_minmax(0,1fr)] gap-4 border-b border-[#e5e7eb] py-6 sm:grid-cols-[140px_1fr_160px] sm:gap-6">
        <Avatar avatarDataUrl={avatarDataUrl} size="medium" />
        <div className="grid min-w-0 gap-3 text-sm">
          <p className="break-words text-base">
            {profile.name || 'Client Kendronics'} <AccountTypeBadge profile={profile} />
          </p>
          <p className="text-[#6b7280]">ID utilisateur: <span className="text-[#1f2937]">{userId}</span></p>
          <p className="grid gap-1 text-[#6b7280] sm:block">Pays/region <span className="text-black sm:ml-20">{profile.country ? countryDisplayName(profile.country) : 'Non renseigne'}</span></p>
          <p className="grid gap-1 text-[#6b7280] sm:block">Telephone <span className="text-black sm:ml-20">{profile.phone || 'Non renseigne'}</span></p>
          {profile.profileDetails?.accountType === 'company' ? <p className="grid gap-1 text-[#6b7280] sm:block">Societe <span className="text-black sm:ml-24">{profile.company || 'Non renseignee'}</span></p> : null}
        </div>
        <button type="button" onClick={() => setEditingProfile(true)} className="col-span-2 justify-self-start text-sm text-[#0f8f6b] sm:col-span-1 sm:self-start sm:justify-self-auto sm:pt-12 sm:text-right">
          {isAccountLevelOne(profile) ? 'Modifier le profil' : 'Completer le profil'}
        </button>
      </div>
      <div className="grid grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] gap-3 border-b border-[#e5e7eb] py-5 text-sm sm:grid-cols-[160px_1fr_160px] sm:gap-0">
        <h2 className="min-w-0 break-words text-lg">Statut compte</h2>
        <p className={`min-w-0 break-words ${isAccountLevelOne(profile) ? 'text-[#0f8f6b]' : 'text-[#d97706]'}`}>
          {isAccountLevelOne(profile)
            ? 'Votre compte est verifie et peut soumettre des commandes.'
            : 'Votre compte doit etre complete avant de soumettre une commande.'}
        </p>
        <a href={isAccountLevelOne(profile) ? '/terms' : '/profile?view=settings'} className={`col-start-2 min-w-0 justify-self-start break-words text-left sm:col-start-auto sm:justify-self-auto sm:text-right ${isAccountLevelOne(profile) ? 'text-[#0f8f6b]' : 'text-[#d97706]'}`}>
          {isAccountLevelOne(profile) ? 'Verifie' : 'A completer'}
        </a>
      </div>
      {[
        ['E-mail', profile.email ? `${maskEmail(profile.email)} ${profile.emailVerifiedAt ? '✓' : ''}` : 'Enregistrer un mail', 'Modifier', '/profile?view=settings'],
        ['Téléphone', profile.phone ? `${maskPhone(profile.phone)} ${profile.phoneVerifiedAt ? '✓' : ''}` : 'Enregistrer un telephone', profile.phoneVerifiedAt ? 'Modifier' : 'Verifier', '/profile?view=settings'],
        ['Mot de passe', '********', 'Modifier', '/reset-password'],
        ['Adresse de livraison', isCompleteProfileAddress(profile.shippingAddress) ? 'Adresse de livraison configuree.' : 'Ajouter une adresse de livraison pour vos commandes Kendronics.', 'Modifier', '/profile?view=shipping-address'],
        ['Conditions utilisation', 'Regles de compte, verification, commande et paiement.', 'Decouvrir', '/terms'],
        ['A propos', 'Comprendre Kendronics et le fonctionnement de la plateforme.', 'Decouvrir', '/how-it-works'],
        ["Besoin d'aide", 'Ouvrir un ticket support pour une question de compte ou commande.', 'Ticket support', '/contact'],
      ].map(([label, value, action, href]) => (
        <div key={label} className="grid grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] gap-3 border-b border-[#e5e7eb] py-5 text-sm sm:grid-cols-[160px_1fr_160px] sm:gap-0">
          <h2 className="min-w-0 break-words text-lg">{label}</h2>
          <p className={`min-w-0 break-words ${!profile.email && label === 'E-mail' || label === 'Téléphone' && !profile.phoneVerifiedAt || label === 'Adresse de livraison' && !isCompleteProfileAddress(profile.shippingAddress) ? 'text-[#d97706]' : 'text-[#4b5563]'}`}>{value}</p>
          {label === 'E-mail' ? (
            <button type="button" onClick={() => setEmailModalOpen(true)} className="col-start-2 min-w-0 justify-self-start break-words text-left text-[#0f8f6b] sm:col-start-auto sm:justify-self-auto sm:text-right">{action}</button>
          ) : label === 'Téléphone' ? (
            <button type="button" onClick={() => setPhoneModalOpen(true)} className="col-start-2 min-w-0 justify-self-start break-words text-left text-[#0f8f6b] sm:col-start-auto sm:justify-self-auto sm:text-right">{action}</button>
          ) : label === 'Mot de passe' ? (
            <button type="button" onClick={() => setPasswordModalOpen(true)} className="col-start-2 min-w-0 justify-self-start break-words text-left text-[#0f8f6b] sm:col-start-auto sm:justify-self-auto sm:text-right">{action}</button>
          ) : (
            <a href={href} className="col-start-2 min-w-0 justify-self-start break-words text-left text-[#0f8f6b] sm:col-start-auto sm:justify-self-auto sm:text-right">{action}</a>
          )}
        </div>
      ))}
      <div className="grid grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] gap-3 border-b border-[#e5e7eb] py-5 text-sm sm:grid-cols-[160px_1fr_160px] sm:gap-0">
        <h2 className="min-w-0 break-words text-lg">Déconnexion</h2>
        <p className="min-w-0 break-words text-[#4b5563]">Fermer la session sur cet appareil.</p>
        <button type="button" onClick={logout} className="col-start-2 min-w-0 justify-self-start break-words text-left text-[#0f8f6b] sm:col-start-auto sm:justify-self-auto sm:text-right">Se déconnecter</button>
      </div>
      <div className="grid grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] gap-3 border-b border-[#e5e7eb] py-5 text-sm sm:grid-cols-[160px_1fr_160px] sm:gap-0">
        <h2 className="min-w-0 break-words text-lg">Supprimer le compte</h2>
        <p className="min-w-0 break-words text-[#4b5563]">Suppression definitive du compte et des donnees client associees, apres verification par e-mail.</p>
        <button
          type="button"
          onClick={() => setDeleteModalOpen(true)}
          className="col-start-2 min-w-0 justify-self-start break-words text-left text-red-400 transition hover:text-red-600 active:text-red-700 disabled:cursor-not-allowed disabled:text-red-200 sm:col-start-auto sm:justify-self-auto sm:text-right"
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
      {emailModalOpen ? (
        <EmailChangeModal
          currentEmail={profile.email}
          onClose={() => setEmailModalOpen(false)}
          onChanged={(email) => {
            const verifiedAt = new Date().toISOString();
            onProfileChange((current) => ({ ...current, email, emailVerifiedAt: verifiedAt }));
            setEmailModalOpen(false);
          }}
        />
      ) : null}
      {phoneModalOpen ? (
        <PhoneChangeModal
          currentPhone={profile.phone}
          onClose={() => setPhoneModalOpen(false)}
          onChanged={(phone) => {
            const verifiedAt = new Date().toISOString();
            onProfileChange((current) => ({ ...current, phone, phoneVerifiedAt: verifiedAt }));
            setPhoneModalOpen(false);
          }}
        />
      ) : null}
      {passwordModalOpen ? <PasswordChangeModal onClose={() => setPasswordModalOpen(false)} /> : null}
    </section>
  );
}

function AccountProfileEditForm({
  profile,
  userId,
  avatarDataUrl,
  onCancel,
  onSaved,
}: {
  profile: ProfileForm;
  userId: string;
  avatarDataUrl: string;
  onCancel: () => void;
  onSaved: (profile: ProfileForm) => void;
}) {
  const initialDetails = normalizeProfileDetails(profile.profileDetails, profile.name, profile.company);
  const [email, setEmail] = useState(profile.email);
  const [company, setCompany] = useState(profile.company);
  const [phone, setPhone] = useState(profile.phone);
  const [country, setCountry] = useState(normalizeProfileCountry(profile.country));
  const [details, setDetails] = useState<ProfileDetails>(initialDetails);
  const [picture, setPicture] = useState(profile.avatarDataUrl || avatarDataUrl);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  function updateDetails<K extends keyof ProfileDetails>(key: K, value: ProfileDetails[K]) {
    setDetails((current) => ({ ...current, [key]: value }));
    setMessage('');
  }

  function toggleListValue(key: 'orderPreference' | 'productInterests', value: string) {
    setDetails((current) => {
      const values = current[key].includes(value) ? current[key].filter((item) => item !== value) : [...current[key], value];
      return { ...current, [key]: values };
    });
    setMessage('');
  }

  async function handlePictureUpload(file: File | undefined) {
    setMessage('');
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setMessage('Format image accepte: PNG, JPG ou WEBP.');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setMessage('Image trop lourde. Maximum 4 Mo.');
      return;
    }

    try {
      setPicture(await resizeProfileImage(file));
    } catch {
      setMessage("Impossible de charger la photo. Essayez une autre image PNG, JPG ou WEBP.");
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    if (!details.accountType) {
      setSaving(false);
      setMessage('Selectionnez un type de compte.');
      return;
    }

    if (!phone.trim()) {
      setSaving(false);
      setMessage('Renseignez puis verifiez votre numero de telephone avant d enregistrer le profil.');
      return;
    }

    if (details.accountType === 'company' && !company.trim()) {
      setSaving(false);
      setMessage('Renseignez le nom de la societe.');
      return;
    }

    if (details.accountType === 'company' && (!details.customerType || !details.industry)) {
      setSaving(false);
      setMessage("Selectionnez l'activite client et le secteur de la societe.");
      return;
    }

    const fullName = [details.firstName, details.lastName].map((value) => value.trim()).filter(Boolean).join(' ') || profile.name;
    const payloadDetails = {
      ...details,
      companyName: details.accountType === 'company' ? company.trim() : '',
      customerType: details.accountType === 'company' ? details.customerType : '',
      industry: details.accountType === 'company' ? details.industry : '',
    };

    try {
      const session = await readFreshAuthSession();
      if (!session) {
        window.location.assign('/login');
        return;
      }

      const response = await fetch(`${getApiBaseUrl()}/api/users/me/profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          companyName: details.accountType === 'company' ? company : '',
          country: normalizeProfileCountry(country),
          avatarDataUrl: picture,
          profileDetails: payloadDetails,
        }),
      });

      if (!response.ok) throw new Error(`Profile update failed: ${response.status}`);
      const user = (await response.json()) as ProfileUser;
      const nextProfile: ProfileForm = {
        ...profile,
        name: user.fullName || fullName,
        email: isInternalAccountEmail(user.email) ? email : user.email || email,
        phone: user.phone || phone,
        company: user.companyName || (details.accountType === 'company' ? company : ''),
        country: normalizeProfileCountry(user.country || country),
        avatarDataUrl: user.avatarDataUrl || picture,
        profileDetails: normalizeProfileDetails(user.profileDetails ?? payloadDetails, user.fullName || fullName, user.companyName || company),
        shippingAddress: normalizeAddress(user.shippingAddress ?? profile.shippingAddress),
        billingAddress: normalizeAddress(user.billingAddress ?? profile.billingAddress),
        emailVerifiedAt: user.emailVerifiedAt || profile.emailVerifiedAt || '',
        phoneVerifiedAt: user.phoneVerifiedAt || (user.phone === profile.phone ? profile.phoneVerifiedAt : ''),
      };

      writeScopedLocalStorage(profileStorageKey, JSON.stringify(nextProfile));
      if (nextProfile.avatarDataUrl) writeScopedLocalStorage(avatarStorageKey, nextProfile.avatarDataUrl);
      window.dispatchEvent(new Event('kendronics:avatar-updated'));
      onSaved(nextProfile);
    } catch {
      setMessage("Impossible d'enregistrer le profil pour le moment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="min-h-[690px] overflow-hidden bg-white p-4 text-black shadow-sm ring-1 ring-slate-200 sm:p-6">
      <form onSubmit={saveProfile} className="grid gap-7">
        <div>
          <h1 className="border-l-4 border-[#0f8f6b] pl-3 text-lg font-semibold">Informations de base</h1>
          <div className="mt-5 grid grid-cols-[170px_1fr] items-center gap-x-8 gap-y-4 border-b border-[#e5e7eb] pb-7">
            <div className="flex justify-end">
              <Avatar avatarDataUrl={picture} size="large" />
            </div>
            <div>
              <label className="inline-flex h-9 cursor-pointer items-center bg-[#0f8f6b] px-6 text-sm font-semibold text-white transition hover:bg-[#0b7558]">
                Importer une photo
                <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => handlePictureUpload(event.target.files?.[0])} />
              </label>
              <p className="mt-4 text-xs text-[#8b949e]">Maximum 4 Mo. L'image est optimisee automatiquement.</p>
            </div>

            <ProfileReadonlyRow label="User ID" value={userId} />
            <div className="col-span-2 grid grid-cols-[170px_minmax(0,320px)_1fr] items-center gap-4 text-sm">
              <span className="text-right text-[#8b949e]">Email</span>
              <input value={email} onChange={(event) => setEmail(event.target.value)} className={profileEditInputClassName} type="email" required />
              <span className={profile.emailVerifiedAt ? 'text-[#0f8f6b]' : 'text-[#d97706]'}>
                {profile.emailVerifiedAt ? 'E-mail verifie' : 'E-mail a verifier apres enregistrement'}
              </span>
            </div>

            <div className="col-span-2 grid grid-cols-[170px_1fr] items-center gap-4 text-sm">
              <span className="text-right text-[#8b949e]"><span className="text-red-500">*</span>Type de compte</span>
              <div className="flex gap-8">
                {[
                  ['individual', 'Compte individuel', '#2563eb'],
                  ['company', 'Societe / professionnel', siteGreen],
                ].map(([value, label]) => (
                  <ProfileRadio key={value} checked={details.accountType === value} label={label} color={value === 'individual' ? '#2563eb' : siteGreen} onChange={() => updateDetails('accountType', value)} />
                ))}
              </div>
            </div>

            {details.accountType === 'company' ? (
              <>
                <ProfileTextField label="* Societe" value={company} onChange={setCompany} required />
                <ProfileSelectField label="* Activite client" value={details.customerType} options={customerTypeOptions} placeholder="Selectionner une activite" onChange={(value) => updateDetails('customerType', value)} />
                <ProfileSelectField label="* Secteur" value={details.industry} options={industryOptions} placeholder="Selectionner un secteur" onChange={(value) => updateDetails('industry', value)} />
              </>
            ) : null}

            <div className="col-span-2 grid grid-cols-[170px_1fr] items-start gap-4 text-sm">
              <span className="pt-2 text-right text-[#8b949e]">Preference de commande</span>
              <div className="flex flex-wrap gap-3">
                {orderPreferenceOptions.map((option) => (
                  <ProfileCheckbox key={option} checked={details.orderPreference.includes(option)} label={option} onChange={() => toggleListValue('orderPreference', option)} compact />
                ))}
                <span className="px-2 py-2 text-xs text-[#a0a7af]">Choix multiples</span>
              </div>
            </div>

            <ProfileSelectField
              label="Produits interesses"
              value={details.productInterests[0] ?? ''}
              options={productInterestOptions}
              placeholder="Selectionner un produit"
              onChange={(value) => updateDetails('productInterests', value ? [value] : [])}
            />

            <ProfileSelectField label="Comment nous avez-vous connus ?" value={details.hearAboutUs} options={hearAboutOptions} placeholder="Selectionner une source" onChange={(value) => updateDetails('hearAboutUs', value)} />
          </div>
        </div>

        <div>
          <h2 className="border-l-4 border-[#0f8f6b] pl-3 text-lg font-semibold">Coordonnees</h2>
          <div className="mt-7 grid grid-cols-[170px_minmax(0,1fr)_170px_minmax(0,1fr)] items-center gap-x-6 gap-y-4 text-sm">
            <span className="text-right text-[#8b949e]">Prenom</span>
            <input value={details.firstName} onChange={(event) => updateDetails('firstName', event.target.value)} className={profileEditInputClassName} />
            <span className="text-right text-[#8b949e]">Nom</span>
            <input value={details.lastName} onChange={(event) => updateDetails('lastName', event.target.value)} className={profileEditInputClassName} />

            <span className="text-right text-[#8b949e]"><span className="text-red-500">*</span> Pays/region</span>
            <select value={country} onChange={(event) => setCountry(event.target.value)} required className={`${profileEditInputClassName} col-span-3 max-w-[420px]`}>
              <option value="">Selectionner un pays</option>
              {africanCountries.map((option) => (
                <option key={option.iso2} value={option.iso2}>{option.name}</option>
              ))}
            </select>

            <span className="text-right text-[#8b949e]">Genre</span>
            <div className="col-span-3 flex gap-8">
              {['Homme', 'Femme', 'Non precise'].map((option) => (
                <ProfileRadio key={option} checked={details.gender === option} label={option} onChange={() => updateDetails('gender', option)} />
              ))}
            </div>

            <div className="col-span-2 grid grid-cols-[170px_minmax(0,320px)] items-center gap-4 text-sm">
              <span className="text-right text-[#8b949e]">Telephone</span>
              <InternationalPhoneInput value={phone} onChange={(value) => setPhone(value)} />
            </div>
            <ProfileTextField label="Site web" value={details.website} onChange={(value) => updateDetails('website', value)} />
            <ProfileTextField label="Date de naissance" value={details.birthday} type="date" onChange={(value) => updateDetails('birthday', value)} />
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 border-t border-[#e5e7eb] pt-5">
          <button type="button" onClick={onCancel} disabled={saving} className="h-10 border border-[#cbd5e1] bg-white px-8 text-sm text-[#475569] transition hover:border-[#94a3b8] disabled:opacity-60">
            Annuler
          </button>
          <button type="submit" disabled={saving} className="h-10 min-w-[168px] bg-[#0f8f6b] px-8 text-sm font-semibold text-white transition hover:bg-[#0b7558] disabled:cursor-not-allowed disabled:bg-slate-300">
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
        {message ? <p className="text-center text-sm text-red-600">{message}</p> : null}
      </form>
    </section>
  );
}

const profileEditInputClassName = 'h-9 border border-[#c9c9c9] bg-white px-3 text-sm text-black outline-none transition focus:border-[#0f8f6b]';

function ProfileReadonlyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="col-span-2 grid grid-cols-[170px_1fr] items-center gap-4 text-sm">
      <span className="text-right text-[#8b949e]">{label}</span>
      <span className="text-[#4b5563]">{value}</span>
    </div>
  );
}

function AccountTypeBadge({ profile }: { profile: ProfileForm }) {
  const badge = accountBadge(profile);
  return <span className="ml-2 rounded-none px-2 py-1 text-xs font-black text-white" style={{ backgroundColor: badge.color }}>{badge.label}</span>;
}

function ProfileTextField({
  label,
  value,
  type = 'text',
  required = false,
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="col-span-2 grid grid-cols-[170px_minmax(0,320px)] items-center gap-4 text-sm">
      <span className="text-right text-[#8b949e]">{label.startsWith('*') ? <><span className="text-red-500">*</span>{label.slice(1)}</> : label}</span>
      <input type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} className={profileEditInputClassName} />
    </div>
  );
}

function ProfileSelectField({
  label,
  value,
  options,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="col-span-2 grid grid-cols-[170px_minmax(0,320px)] items-center gap-4 text-sm">
      <span className="text-right text-[#8b949e]">{label.startsWith('*') ? <><span className="text-red-500">*</span>{label.slice(1)}</> : label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={profileEditInputClassName}>
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}

function ProfileRadio({ checked, label, color = siteGreen, onChange }: { checked: boolean; label: string; color?: string; onChange: () => void }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
      <input type="radio" checked={checked} onChange={onChange} className="h-5 w-5" style={{ accentColor: color }} />
      <span>{label}</span>
    </label>
  );
}

function ProfileCheckbox({ checked, label, compact = false, onChange }: { checked: boolean; label: string; compact?: boolean; onChange: () => void }) {
  return (
    <label className={`inline-flex cursor-pointer items-center gap-2 text-sm ${compact ? `border px-3 py-2 ${checked ? 'border-[#0f8f6b] bg-[#eefbf6]' : 'border-[#cbd5e1] bg-white'}` : ''}`}>
      <input type="checkbox" checked={checked} onChange={onChange} className="h-5 w-5 accent-[#0f8f6b]" />
      <span>{label}</span>
    </label>
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

const orderProductFilters: Array<{ key: OrderProductFilter; label: string; image: string; badge?: string }> = [
  { key: 'standard_pcb', label: 'PCB standard', image: '/images/quote-product-standard-pcb.png' },
  { key: 'advanced_pcb', label: 'PCB avance / PCBA', image: '/images/quote-product-advanced-pcba.png' },
  { key: 'fpc_rigid_flex', label: 'FPC / rigide-flex', image: '/images/quote-product-fpc-rigid-flex.png', badge: 'NOUVEAU' },
  { key: 'pcb_assembly', label: 'Assemblage', image: '/images/quote-product-assembly.png' },
  { key: 'smt_stencil', label: 'Pochoir CMS', image: '/images/quote-product-smd-stencil.png' },
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

function EmailChangeModal({ currentEmail, onClose, onChanged }: { currentEmail: string; onClose: () => void; onChanged: (email: string) => void }) {
  const [newEmail, setNewEmail] = useState('');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'saving' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function requestCode() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) {
      setStatus('error');
      setMessage('Entrez une adresse e-mail valide.');
      return;
    }
    setStatus('sending');
    setMessage('');
    try {
      const session = await readFreshAuthSession();
      if (!session) {
        window.location.assign('/login');
        return;
      }
      const response = await fetch(`${getApiBaseUrl()}/api/auth/email-change/request`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail: newEmail.trim().toLowerCase() }),
      });
      if (!response.ok) throw new Error(`Email change request failed: ${response.status}`);
      setStatus('sent');
      setMessage('Code envoye au nouveau mail. Il reste valide 10 minutes.');
    } catch {
      setStatus('error');
      setMessage("Impossible d'envoyer le code pour le moment.");
    }
  }

  async function confirmChange() {
    if (code.trim().length !== 6) {
      setStatus('error');
      setMessage('Entrez le code a 6 chiffres.');
      return;
    }
    setStatus('saving');
    setMessage('');
    try {
      const session = await readFreshAuthSession();
      if (!session) {
        window.location.assign('/login');
        return;
      }
      const email = newEmail.trim().toLowerCase();
      const response = await fetch(`${getApiBaseUrl()}/api/auth/email-change/confirm`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail: email, code: code.trim() }),
      });
      if (!response.ok) throw new Error(`Email change confirm failed: ${response.status}`);
      onChanged(email);
    } catch {
      setStatus('error');
      setMessage('Code invalide, expire ou e-mail deja utilise.');
    }
  }

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/45 px-4">
      <div className="w-full max-w-lg border border-slate-300 bg-white p-6 text-black">
        <h2 className="text-xl font-black">Modifier l'e-mail</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Adresse actuelle: {currentEmail ? maskEmail(currentEmail) : 'aucune adresse enregistree'}</p>
        <div className="mt-5 grid gap-3">
          <input value={newEmail} onChange={(event) => setNewEmail(event.target.value)} className={profileModalFieldClassName} placeholder="Nouveau mail" type="email" />
          {status === 'sent' || status === 'saving' || code ? (
            <input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} className={profileModalFieldClassName} placeholder="Code a 6 chiffres" inputMode="numeric" />
          ) : null}
          {message ? <p className={status === 'error' ? 'text-sm font-semibold text-red-600' : 'text-sm font-semibold text-[#0f8f6b]'}>{message}</p> : null}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={status === 'saving' || status === 'sending'} className={profileModalSecondaryButtonClassName}>Annuler</button>
          <button type="button" onClick={() => void requestCode()} disabled={status === 'sending' || status === 'saving'} className={profileModalSecondaryButtonClassName}>{status === 'sending' ? 'Envoi...' : 'Envoyer le code'}</button>
          <button type="button" onClick={() => void confirmChange()} disabled={status === 'saving'} className={profileModalPrimaryButtonClassName}>{status === 'saving' ? 'Validation...' : 'Valider'}</button>
        </div>
      </div>
    </div>
  );
}

function PhoneChangeModal({ currentPhone, onClose, onChanged }: { currentPhone: string; onClose: () => void; onChanged: (phone: string) => void }) {
  const [phone, setPhone] = useState(currentPhone);
  const [phoneValid, setPhoneValid] = useState(Boolean(currentPhone));
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'saving' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function requestCode() {
    if (!phone.trim() || !phoneValid) {
      setStatus('error');
      setMessage('Entrez un numero international valide.');
      return;
    }
    setStatus('sending');
    setMessage('');
    try {
      const session = await readFreshAuthSession();
      if (!session) {
        window.location.assign('/login');
        return;
      }
      const response = await fetch(`${getApiBaseUrl()}/api/users/me/phone-verification/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      if (!response.ok) throw new Error(`Phone verification request failed: ${response.status}`);
      setStatus('sent');
      setMessage('Code envoye par SMS. Il reste valide 10 minutes.');
    } catch {
      setStatus('error');
      setMessage("Impossible d'envoyer le code SMS pour le moment.");
    }
  }

  async function confirmChange() {
    if (code.trim().length !== 6) {
      setStatus('error');
      setMessage('Entrez le code a 6 chiffres.');
      return;
    }
    setStatus('saving');
    setMessage('');
    try {
      const session = await readFreshAuthSession();
      if (!session) {
        window.location.assign('/login');
        return;
      }
      const response = await fetch(`${getApiBaseUrl()}/api/users/me/phone-verification/check`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: code.trim() }),
      });
      if (!response.ok) throw new Error(`Phone verification confirm failed: ${response.status}`);
      onChanged(phone);
    } catch {
      setStatus('error');
      setMessage('Code SMS invalide ou expire.');
    }
  }

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/45 px-4">
      <div className="w-full max-w-lg border border-slate-300 bg-white p-6 text-black">
        <h2 className="text-xl font-black">Modifier le telephone</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Numero actuel: {currentPhone ? maskPhone(currentPhone) : 'aucun numero enregistre'}</p>
        <div className="mt-5 grid gap-3">
          <InternationalPhoneInput
            value={phone}
            error={status === 'error' && !phoneValid ? message : undefined}
            onChange={(value, meta) => {
              setPhone(value);
              setPhoneValid(meta.isValid);
              if (status === 'error') setMessage('');
            }}
          />
          {status === 'sent' || status === 'saving' || code ? (
            <input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} className={profileModalFieldClassName} placeholder="Code SMS a 6 chiffres" inputMode="numeric" />
          ) : null}
          {message && (phoneValid || status !== 'error') ? <p className={status === 'error' ? 'text-sm font-semibold text-red-600' : 'text-sm font-semibold text-[#0f8f6b]'}>{message}</p> : null}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={status === 'saving' || status === 'sending'} className={profileModalSecondaryButtonClassName}>Annuler</button>
          <button type="button" onClick={() => void requestCode()} disabled={status === 'sending' || status === 'saving'} className={profileModalSecondaryButtonClassName}>{status === 'sending' ? 'Envoi...' : 'Envoyer le code'}</button>
          <button type="button" onClick={() => void confirmChange()} disabled={status === 'saving'} className={profileModalPrimaryButtonClassName}>{status === 'saving' ? 'Validation...' : 'Valider'}</button>
        </div>
      </div>
    </div>
  );
}

function PasswordChangeModal({ onClose }: { onClose: () => void }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'saving' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function requestCode() {
    setStatus('sending');
    setMessage('');
    try {
      const session = await readFreshAuthSession();
      if (!session) {
        window.location.assign('/login');
        return;
      }
      const response = await fetch(`${getApiBaseUrl()}/api/auth/password-change/request`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!response.ok) throw new Error(`Password change request failed: ${response.status}`);
      setStatus('sent');
      setMessage('Code envoye par e-mail. Il reste valide 10 minutes.');
    } catch {
      setStatus('error');
      setMessage("Impossible d'envoyer le code. Verifiez qu'un e-mail est enregistre et verifie.");
    }
  }

  async function confirmChange() {
    if (password.length < 10 || password !== confirmPassword) {
      setStatus('error');
      setMessage('Le mot de passe doit contenir au moins 10 caracteres et correspondre a la confirmation.');
      return;
    }
    if (code.trim().length !== 6) {
      setStatus('error');
      setMessage('Entrez le code a 6 chiffres.');
      return;
    }
    setStatus('saving');
    setMessage('');
    try {
      const session = await readFreshAuthSession();
      if (!session) {
        window.location.assign('/login');
        return;
      }
      const response = await fetch(`${getApiBaseUrl()}/api/auth/password-change/confirm`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: password, code: code.trim() }),
      });
      if (!response.ok) throw new Error(`Password change confirm failed: ${response.status}`);
      setStatus('done');
      setMessage('Mot de passe modifie. Les autres sessions ont ete deconnectees.');
    } catch {
      setStatus('error');
      setMessage('Code invalide ou expire.');
    }
  }

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/45 px-4">
      <div className="w-full max-w-lg border border-slate-300 bg-white p-6 text-black">
        <h2 className="text-xl font-black">Modifier le mot de passe</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Un code de securite est requis avant modification.</p>
        <div className="mt-5 grid gap-3">
          <input value={password} onChange={(event) => setPassword(event.target.value)} className={profileModalFieldClassName} placeholder="Nouveau mot de passe" type="password" />
          <input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className={profileModalFieldClassName} placeholder="Confirmer le mot de passe" type="password" />
          {status === 'sent' || status === 'saving' || code ? (
            <input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} className={profileModalFieldClassName} placeholder="Code a 6 chiffres" inputMode="numeric" />
          ) : null}
          {message ? <p className={status === 'error' ? 'text-sm font-semibold text-red-600' : 'text-sm font-semibold text-[#0f8f6b]'}>{message}</p> : null}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={status === 'saving' || status === 'sending'} className={profileModalSecondaryButtonClassName}>Fermer</button>
          <button type="button" onClick={() => void requestCode()} disabled={status === 'sending' || status === 'saving'} className={profileModalSecondaryButtonClassName}>{status === 'sending' ? 'Envoi...' : 'Envoyer le code'}</button>
          <button type="button" onClick={() => void confirmChange()} disabled={status === 'saving'} className={profileModalPrimaryButtonClassName}>{status === 'saving' ? 'Validation...' : 'Modifier'}</button>
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

function isInternalAccountEmail(email: string | undefined): boolean {
  return Boolean(email?.endsWith('@kendronics.local'));
}

function isCompleteProfileAddress(address?: AccountAddress): boolean {
  return Boolean(address?.street?.trim() && address.city?.trim() && address.country?.trim() && address.phone?.trim());
}

function isAccountLevelOne(profile: ProfileForm): boolean {
  return Boolean(profile.email && profile.emailVerifiedAt && profile.phone && profile.phoneVerifiedAt && profile.name && profile.country && isCompleteProfileAddress(profile.shippingAddress));
}

function accountBadge(profile: ProfileForm): { label: string; color: string } {
  if (!isAccountLevelOne(profile)) return { label: 'Individuel', color: '#94a3b8' };
  if (profile.profileDetails?.accountType === 'company' || profile.company) return { label: 'Industriel certifie', color: '#0f8f6b' };
  return { label: 'Individuel verifie', color: '#f59e0b' };
}

function maskPhone(phone: string): string {
  const compact = phone.replace(/\s+/g, '');
  if (!compact) return '';
  if (compact.length <= 7) return compact;
  return `${compact.slice(0, 4)}********${compact.slice(-2)}`;
}

function ProductQuickGrid() {
  return (
    <div className="hidden grid-cols-[minmax(0,1fr)_302px] gap-3 lg:grid">
      <section className="bg-white p-3 shadow-sm ring-1 ring-[#dbe4ee]">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-[#0f8f6b]">Demarrer</p>
            <h2 className="text-base text-[#102033]">Services frequents</h2>
          </div>
          <a href="/profile?view=services" className="text-xs text-[#0f8f6b]">Tout voir</a>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {quickProducts.map((product) => (
            <a key={product.title} href={product.href} className="group relative block min-h-[174px] overflow-hidden bg-[#f8fafc] ring-1 ring-[#d4e2ee] transition hover:-translate-y-0.5 hover:ring-[#0f8f6b]">
              {product.image ? (
                <img src={product.image} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.015]" />
              ) : (
                <span className="absolute inset-0 grid place-items-center" style={{ backgroundColor: `${product.color}22` }}>
                  <span className="h-14 w-16" style={{ border: `4px solid ${product.color}` }} />
                </span>
              )}
              <span className="relative z-10 block p-4">
                <span className="inline-block bg-white/88 px-2 py-1 text-sm leading-5 text-[#102033]">{product.title}</span>
              </span>
            </a>
          ))}
        </div>
      </section>
      <LivePromoFlash />
    </div>
  );
}
function LivePromoFlash() {
  return (
    <aside className="grid min-h-[154px] overflow-hidden bg-white shadow-sm ring-1 ring-[#dbe4ee]" aria-label="Promotions Kendronics">
      <a href="/quote" className="relative min-h-[76px] overflow-hidden bg-[#07143a] px-3 py-3 text-white">
        <img src="/images/quote-product-assembly.png" alt="" className="absolute -right-4 bottom-0 h-[88px] w-[138px] object-cover" />
        <span className="relative z-10 block text-[16px] leading-5">Assemblage PCB pour 1-20 pieces</span>
        <span className="relative z-10 mt-1 block text-[11px] uppercase tracking-wide">Seulement <strong className="text-[25px] leading-none text-[#ff9b00]">$29</strong> au total</span>
        <span className="relative z-10 mt-1 block text-[12px] text-slate-100">Jusqu a $30 de remise transport</span>
      </a>
      <a href="/quote" className="relative min-h-[78px] overflow-hidden bg-[#f8fbf5] px-3 py-3 text-[#102033]">
        <img src="/images/quote-product-standard-pcb.png" alt="" className="absolute -right-4 bottom-0 h-[84px] w-[128px] object-cover" />
        <span className="relative z-10 block text-[18px] leading-5">Prototype PCB <strong className="text-[24px] text-[#ff6a00]">$5</strong></span>
        <span className="relative z-10 mt-2 inline-flex bg-[#dff7e5] px-2 py-1 text-[11px] text-[#0f8f6b]">1-2 couches</span>
        <span className="relative z-10 ml-1 mt-2 inline-flex bg-[#dff7e5] px-2 py-1 text-[11px] text-[#0f8f6b]">Taille &lt;=100x100mm</span>
        <span className="relative z-10 mt-1 block text-[12px] text-[#53657a]">Nouveau client : coupon de $5.</span>
      </a>
    </aside>
  );
}

function DashboardPanel({
  firstName,
  profile,
  userId,
  avatarDataUrl,
  orders,
  dataStatus,
}: {
  firstName: string;
  profile: ProfileForm;
  userId: string;
  avatarDataUrl: string;
  orders: ProfileOrder[];
  dataStatus: 'loading' | 'ready' | 'signed-out' | 'error';
}) {
  const paidTotal = orders.filter((order) => order.paymentStatus === 'paid').reduce((total, order) => total + (order.totalPrice ?? order.quoteSnapshot?.finalTotal ?? 0), 0);
  const pendingTotal = orders.filter((order) => order.paymentStatus !== 'paid').reduce((total, order) => total + (order.totalPrice ?? order.quoteSnapshot?.finalTotal ?? 0), 0);
  const counts = orderCounts(orders);
  const displayName = profile.name || firstName || 'Client Kendronics';
  const companyOrType = profile.company || 'Compte client';
  const location = profile.country || 'Pays non renseigné';

  return (
    <section className="grid bg-white lg:grid-cols-[190px_minmax(0,1fr)] lg:shadow-sm lg:ring-1 lg:ring-[#dbe4ee]">
      {dataStatus === 'signed-out' ? (
        <SignedOutMobileAccount />
      ) : (
        <MobileAccountCard firstName={firstName} profile={profile} userId={userId} avatarDataUrl={avatarDataUrl} />
      )}
      <div className="hidden place-items-center border-r border-[#e4ebf2] px-4 py-8 text-center lg:grid">
        <Avatar avatarDataUrl={avatarDataUrl} size="medium" />
        <div>
          <h1 className="mt-4 text-lg font-semibold text-[#102033]">{displayName}</h1>
          <p className="mt-1 text-xs font-semibold text-[#0f8f6b]">{companyOrType}</p>
          <p className="mt-2 text-xs text-[#64748b]">ID Client: {userId}</p>
          <p className="mt-1 truncate text-xs text-[#64748b]">{profile.email ? maskEmail(profile.email) : location}</p>
          <p className="mt-1 text-xs text-[#64748b]">{location}</p>
          <a href="/profile?view=settings" className="mt-4 inline-flex text-xs font-semibold text-[#0f8f6b]">Gérer mon compte</a>
        </div>
      </div>

      <div className="p-0 sm:p-5 lg:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0f8f6b]">Espace client</p>
            <h2 className="mt-1 text-xl font-semibold text-[#102033]">Vue d'ensemble</h2>
          </div>
          <div className="grid gap-2">
            <a href="/quote" className="inline-flex min-h-10 items-center justify-center border border-[#0f8f6b] px-4 py-2 text-xs font-semibold text-[#0f8f6b] transition hover:bg-[#0f8f6b] hover:text-white">Nouveau devis</a>
            <div className="lg:hidden">
              <SmallInfo label="Coupons actifs" value="0" />
            </div>
          </div>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_180px]">
          <div className="grid grid-cols-2 border border-[#b8c9d9]">
            <MetricCell label="Total payé (EUR)" value={formatMoney(paidTotal)} detail={`En attente : ${formatMoney(pendingTotal)}`} />
            <MetricCell label="Commandes" value={String(orders.length)} valueClass="text-[#102033]" />
            <MetricCell label="En production" value={String(counts.production)} />
            <MetricCell label="À traiter" value={String(counts.paymentPending + counts.verification)} detail="Dossier à corriger" />
          </div>
          <div className="hidden gap-2 lg:grid">
            <SmallInfo label="Coupons actifs" value="0" />
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricCell({ label, value, detail, valueClass = 'text-[#1f2937]' }: { label: string; value: string; detail?: string; valueClass?: string }) {
  return (
    <div className="min-h-[84px] border-b border-r border-slate-200 p-4 even:border-r-0 odd:border-r sm:even:border-r sm:[&:nth-child(2n)]:border-r-0">
      <p className="text-xs text-[#64748b]">{label}</p>
      <p className={`mt-2 text-2xl font-black ${valueClass}`}>{value}</p>
      {detail ? <p className="mt-1 text-xs text-[#475569]">{detail}</p> : null}
    </div>
  );
}

function MobileAccountCard({ firstName, profile, userId, avatarDataUrl }: { firstName: string; profile: ProfileForm; userId: string; avatarDataUrl: string }) {
  const displayName = profile.name || firstName || 'Client Kendronics';
  const companyOrType = profile.company || 'Compte client';
  const location = profile.country || 'Pays non renseigne';
  const badge = accountBadge(profile);

  return (
    <div className="mb-4 flex items-center gap-4 bg-white py-4 text-left lg:hidden">
      <div className="shrink-0">
        <Avatar avatarDataUrl={avatarDataUrl} size="medium" />
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold text-[#102033]">{displayName}</h1>
        <p className="mt-0.5 truncate text-sm text-[#102033]">{companyOrType}</p>
        <p className="mt-1 text-xs font-semibold" style={{ color: badge.color }}>{badge.label}</p>
        <p className="mt-1 text-xs text-[#64748b]">ID Client: {userId}</p>
        <p className="mt-1 truncate text-xs text-[#64748b]">{profile.email ? maskEmail(profile.email) : location}</p>
        <p className="mt-1 text-xs text-[#64748b]">{location}</p>
        <a href="/profile?view=settings" className="mt-2 inline-flex text-xs font-semibold text-[#0f8f6b]">Gerer mon compte</a>
      </div>
    </div>
  );
}

function SignedOutMobileAccount() {
  const [mode, setMode] = useState<'choice' | 'register' | 'login'>('choice');
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerMethod, setRegisterMethod] = useState<'email' | 'phone'>('email');
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [registerCountry, setRegisterCountry] = useState('');
  const [registerAccountType, setRegisterAccountType] = useState<'individual' | 'company'>('individual');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [authStatus, setAuthStatus] = useState<'idle' | 'submitting' | 'error'>('idle');
  const [authMessage, setAuthMessage] = useState('');

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthStatus('submitting');
    setAuthMessage('');

    if (loginMethod === 'phone' && !loginPhone.trim()) {
      setAuthStatus('error');
      setAuthMessage('Veuillez entrer votre numero de telephone.');
      return;
    }

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginMethod === 'email' ? { email: loginEmail, password: loginPassword } : { contact: loginPhone, password: loginPassword }),
      });

      if (!response.ok) throw new Error('Connexion impossible. Verifiez vos identifiants.');
      const tokens = (await response.json()) as AuthTokens;
      persistAuthSession(tokens, { remember: true });
      window.dispatchEvent(new Event('kendronics:auth-updated'));
      window.location.reload();
    } catch (error) {
      setAuthStatus('error');
      setAuthMessage(error instanceof Error ? error.message : 'Connexion impossible.');
    }
  }

  async function submitRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthStatus('submitting');
    setAuthMessage('');

    if (registerPassword !== registerConfirmPassword) {
      setAuthStatus('error');
      setAuthMessage('Les mots de passe ne correspondent pas.');
      return;
    }

    if (!acceptedTerms) {
      setAuthStatus('error');
      setAuthMessage("Veuillez accepter les conditions d'utilisation.");
      return;
    }

    if (registerMethod === 'phone' && !registerPhone.trim()) {
      setAuthStatus('error');
      setAuthMessage('Veuillez entrer votre numero de telephone.');
      return;
    }

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: registerName,
          email: registerMethod === 'email' ? registerEmail : undefined,
          phone: registerMethod === 'phone' ? registerPhone : undefined,
          contactMethod: registerMethod,
          password: registerPassword,
          fullName: registerName,
          profile: {
            username: registerName,
            country: registerCountry,
            accountType: registerAccountType,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(Array.isArray(error?.message) ? error.message.join(' ') : error?.message ?? 'Creation du compte impossible.');
      }

      const tokens = (await response.json()) as AuthTokens;
      persistAuthSession(tokens, { remember: true });
      window.dispatchEvent(new Event('kendronics:auth-updated'));
      window.location.reload();
    } catch (error) {
      setAuthStatus('error');
      setAuthMessage(error instanceof Error ? error.message : 'Creation du compte impossible.');
    }
  }

  return (
    <div className="grid gap-3 bg-white py-4 text-[#102033] lg:hidden">
      {mode === 'choice' ? (
      <section className="bg-white px-0 py-2 text-ink">
        <h1 className="text-lg font-bold tracking-normal text-ink">Bienvenue sur Kendronics</h1>
        <p className="mt-2 text-xs leading-5 text-slate-600">
          Pour utiliser les fonctionnalites du site, creez d'abord votre compte ou connectez-vous si vous en avez deja un.
        </p>
        <div className="mt-3 grid gap-2">
          <button type="button" onClick={() => setMode('register')} className="flex h-9 items-center justify-center border border-[#0f8f6b] bg-[#0f8f6b] px-4 text-xs font-semibold text-white">
            Creer un nouveau compte
          </button>
          <button type="button" onClick={() => setMode('login')} className="flex h-9 items-center justify-center border border-slate-300 bg-white px-4 text-xs font-semibold text-ink">
            Se connecter
          </button>
        </div>
        <div className="my-3 flex items-center gap-2 text-[11px] font-medium text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          <span>ou continuer avec</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>
        <div className="grid gap-2">
          <SocialAuthLink label="Continuer avec Google" href={googleOAuthUrl} provider="google" />
          <SocialAuthLink label="Continuer avec Apple" href={appleOAuthUrl} provider="apple" />
        </div>
        <p className="mt-3 text-[11px] leading-5 text-slate-500">
          En creant un compte, vous acceptez nos <a href="/terms" className="font-semibold text-[#0f8f6b] underline">conditions d'utilisation</a> et notre{' '}
          <a href="/privacy" className="font-semibold text-[#0f8f6b] underline">politique de confidentialite</a>.
        </p>
      </section>
      ) : null}

      {mode === 'register' ? (
      <section className="bg-white text-ink">
        <div className="px-0 py-2.5">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-lg font-bold tracking-normal text-ink">Rejoindre ou se connecter</h1>
            <button type="button" onClick={() => setMode('choice')} className="shrink-0 text-xs font-medium text-slate-400">Retour</button>
          </div>
        </div>
        <div className="space-y-2 px-0 py-3">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-base font-bold text-ink">Creer un compte</h2>
            <button type="button" onClick={() => setMode('login')} className="text-xs font-semibold text-[#0f8f6b]">Se connecter</button>
          </div>
          <p className="text-xs leading-5 text-slate-600">Utilisez votre e-mail ou votre telephone pour recevoir un code de verification et completer votre espace client.</p>
          <form onSubmit={submitRegister} className="grid gap-2">
            <ProfileAuthInput label="Nom d'utilisateur" value={registerName} onChange={setRegisterName} required />
            <ProfileAuthMethodTabs active={registerMethod} onChange={setRegisterMethod} />
            {registerMethod === 'email' ? (
              <ProfileAuthInput label="E-mail" type="email" value={registerEmail} onChange={setRegisterEmail} required hideLabel />
            ) : (
              <InternationalPhoneInput value={registerPhone} onChange={(value) => setRegisterPhone(value)} />
            )}
            <ProfileAuthInput label="Mot de passe" type="password" value={registerPassword} onChange={setRegisterPassword} required />
            <ProfileAuthInput label="Confirmer le mot de passe" type="password" value={registerConfirmPassword} onChange={setRegisterConfirmPassword} required />
            <label className="grid gap-1 text-xs font-semibold text-slate-600">
              Pays
              <select value={registerCountry} onChange={(event) => setRegisterCountry(event.target.value)} className="h-9 border border-slate-300 bg-white px-3 text-sm text-ink" required>
                <option value="">Selectionner un pays</option>
                {africanCountries.map((country) => (
                  <option key={country.iso2} value={country.iso2}>{country.name}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-xs font-semibold text-slate-600">
              Type de compte
              <select value={registerAccountType} onChange={(event) => setRegisterAccountType(event.target.value as 'individual' | 'company')} className="h-9 border border-slate-300 bg-white px-3 text-sm text-ink">
                <option value="individual">Compte individuel</option>
                <option value="company">Societe / professionnel</option>
              </select>
            </label>
            <label className="flex gap-2 text-xs leading-5 text-slate-600">
              <input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0" />
              <span>J'accepte les <a href="/terms" className="font-semibold text-[#0f8f6b] underline">conditions</a> et la <a href="/privacy" className="font-semibold text-[#0f8f6b] underline">politique de confidentialite</a>.</span>
            </label>
            {authStatus === 'error' && authMessage ? <p className="text-xs font-semibold text-red-600">{authMessage}</p> : null}
            <button type="submit" disabled={authStatus === 'submitting'} className="flex h-9 w-full items-center justify-center bg-[#0f8f6b] px-4 text-sm font-semibold text-white disabled:opacity-60">
              {authStatus === 'submitting' ? 'Creation...' : 'Creer mon compte'}
            </button>
            <SocialAuthLink label="Continuer avec Google" href={googleOAuthUrl} provider="google" />
            <SocialAuthLink label="Continuer avec Apple" href={appleOAuthUrl} provider="apple" />
          </form>
        </div>
      </section>
      ) : null}

      {mode === 'login' ? (
      <section className="bg-white text-ink">
        <div className="px-0 py-2.5">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-lg font-bold tracking-normal text-ink">Rejoindre ou se connecter</h1>
            <button type="button" onClick={() => setMode('choice')} className="shrink-0 text-xs font-medium text-slate-400">Retour</button>
          </div>
        </div>
        <div className="space-y-2 px-0 py-3">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-base font-bold text-ink">Se connecter</h2>
            <button type="button" onClick={() => setMode('register')} className="text-xs font-semibold text-[#0f8f6b]">Creer un compte</button>
          </div>
          <p className="text-xs leading-5 text-slate-600">Connectez-vous pour afficher vos commandes, notifications et adresses.</p>
          <form onSubmit={submitLogin} className="grid gap-2">
            <ProfileAuthMethodTabs active={loginMethod} onChange={setLoginMethod} />
            {loginMethod === 'email' ? (
              <ProfileAuthInput label="E-mail" type="email" value={loginEmail} onChange={setLoginEmail} required hideLabel />
            ) : (
              <InternationalPhoneInput value={loginPhone} onChange={(value) => setLoginPhone(value)} />
            )}
            <ProfileAuthInput label="Mot de passe" type="password" value={loginPassword} onChange={setLoginPassword} required />
            {authStatus === 'error' && authMessage ? <p className="text-xs font-semibold text-red-600">{authMessage}</p> : null}
            <button type="submit" disabled={authStatus === 'submitting'} className="flex h-9 w-full items-center justify-center bg-[#0f8f6b] px-4 text-sm font-semibold text-white disabled:opacity-60">
              {authStatus === 'submitting' ? 'Connexion...' : 'Se connecter'}
            </button>
            <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              <span>ou continuer avec</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>
            <SocialAuthLink label="Continuer avec Google" href={googleOAuthUrl} provider="google" />
            <SocialAuthLink label="Continuer avec Apple" href={appleOAuthUrl} provider="apple" />
          </form>
        </div>
      </section>
      ) : null}
    </div>
  );
}

function ProfileAuthInput({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  hideLabel = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  hideLabel?: boolean;
}) {
  return (
    <label className="grid gap-1 text-xs font-semibold text-slate-600">
      {hideLabel ? <span className="sr-only">{label}</span> : label}
      <input
        type={type}
        value={value}
        placeholder={hideLabel ? label : undefined}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 border border-slate-300 bg-white px-3 text-sm text-ink outline-none focus:border-[#0f8f6b]"
      />
    </label>
  );
}

function ProfileAuthMethodTabs({ active, onChange }: { active: 'email' | 'phone'; onChange: (method: 'email' | 'phone') => void }) {
  return (
    <div className="flex items-center gap-4 text-xs font-semibold">
      <button type="button" onClick={() => onChange('email')} className={active === 'email' ? 'text-[#0f8f6b] underline underline-offset-4' : 'text-slate-500'}>
        E-mail
      </button>
      <button type="button" onClick={() => onChange('phone')} className={active === 'phone' ? 'text-[#0f8f6b] underline underline-offset-4' : 'text-slate-500'}>
        Telephone
      </button>
    </div>
  );
}

function SocialAuthLink({ label, href, provider = 'google' }: { label: string; href?: string; provider?: 'google' | 'apple' }) {
  const icon = provider === 'apple' ? <AppleMark /> : <GoogleMark />;

  if (!href) {
    return (
      <span className="flex h-9 items-center justify-center gap-2 border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-400">
        {icon}
        {label}
      </span>
    );
  }

  return (
    <a href={href} className="flex h-9 items-center justify-center gap-2 border border-slate-200 bg-white px-4 text-xs font-semibold text-ink">
      {icon}
      {label}
    </a>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-current text-slate-900">
      <path d="M16.37 1.43c0 1.16-.43 2.24-1.18 3.07-.8.9-2.12 1.6-3.2 1.5-.14-1.12.45-2.32 1.17-3.1.8-.86 2.2-1.52 3.21-1.47zM20.5 17.38c-.58 1.31-.86 1.9-1.61 3.06-1.05 1.6-2.53 3.59-4.36 3.61-1.63.02-2.05-1.05-4.27-1.04-2.21.01-2.67 1.07-4.3 1.05-1.83-.02-3.23-1.81-4.28-3.42C-1.25 16.14.29 9.52 3.75 8.39c1.7-.56 3.11.93 4.68.93 1.52 0 2.45-.94 4.65-.8.84.03 3.18.34 4.68 2.54-4.12 2.26-3.45 8.06.74 9.32z" />
    </svg>
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

function StatusStrip({ counts }: { counts: ReturnType<typeof orderCounts> }) {
  const statuses = [
    [counts.verification, 'Vérification en cours'],
    [counts.paymentPending, 'Paiement en attente'],
    [counts.production, 'Production terminée'],
    [counts.delivery, 'Livraison'],
    [counts.comments, 'Commentaires'],
  ];

  return (
    <section className="grid grid-cols-5 bg-white py-5 shadow-sm ring-1 ring-slate-200">
      {statuses.map(([value, label]) => (
        <div key={label} className="border-r border-slate-200 px-3 text-center last:border-r-0">
          <p className="text-3xl font-light text-[#111827]">{value}</p>
          <p className="mt-2 text-xs leading-4 text-[#475569]">{label}</p>
        </div>
      ))}
    </section>
  );
}

const communityPostsStorageKey = 'kendronics.community.posts';
const communityLikesStorageKey = 'kendronics.community.likes';
const communityFollowsStorageKey = 'kendronics.community.follows';
type CommunityTab = 'reels' | 'following' | 'profile';

function CommunityPublishPanel({ firstName, avatarDataUrl }: { firstName: string; avatarDataUrl: string }) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [activeTab, setActiveTab] = useState<CommunityTab>('reels');
  const [likedPostIds, setLikedPostIds] = useState<string[]>([]);
  const [followedAuthorIds, setFollowedAuthorIds] = useState<string[]>([]);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [openCommentPostId, setOpenCommentPostId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [kind, setKind] = useState<CommunityPost['kind']>('image');
  const [mediaName, setMediaName] = useState('');
  const [mediaDataUrl, setMediaDataUrl] = useState('');
  const [mediaType, setMediaType] = useState('');

  useEffect(() => {
    setPosts(readCommunityPosts());
    setLikedPostIds(readCommunityIdList(communityLikesStorageKey));
    setFollowedAuthorIds(readCommunityIdList(communityFollowsStorageKey));
  }, []);

  const currentAuthorId = `profile:${firstName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'client'}`;

  function handleMediaChange(file?: File) {
    if (!file) {
      setMediaName('');
      setMediaDataUrl('');
      setMediaType('');
      return;
    }

    setMediaName(file.name);
    setMediaType(file.type);

    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      const reader = new FileReader();
      reader.onload = () => setMediaDataUrl(typeof reader.result === 'string' ? reader.result : '');
      reader.readAsDataURL(file);
    } else {
      setMediaDataUrl('');
    }
  }

  function publishPost() {
    if (!title.trim() || !mediaName) return;

    const nextPost: CommunityPost = {
      id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}`,
      authorId: currentAuthorId,
      author: firstName,
      avatarDataUrl,
      title: title.trim(),
      description: description.trim(),
      kind,
      mediaName,
      mediaDataUrl,
      mediaType,
      createdAt: new Date().toISOString(),
      views: 0,
      likes: 0,
      saves: 0,
      comments: 0,
      commentList: [],
    };

    const nextPosts = [nextPost, ...posts].slice(0, 18);
    setPosts(nextPosts);
    persistCommunityPosts(nextPosts);
    setTitle('');
    setDescription('');
    setKind('image');
    setMediaName('');
    setMediaDataUrl('');
    setMediaType('');
  }

  const canPublish = title.trim().length > 2 && mediaName.length > 0;
  const profilePosts = posts.filter((post) => post.authorId === currentAuthorId);
  const visiblePosts = activeTab === 'profile'
    ? profilePosts
    : activeTab === 'following'
      ? posts.filter((post) => followedAuthorIds.includes(post.authorId) && post.authorId !== currentAuthorId)
      : posts;

  function toggleFollow(authorId: string) {
    if (authorId === currentAuthorId) return;
    const nextIds = followedAuthorIds.includes(authorId)
      ? followedAuthorIds.filter((id) => id !== authorId)
      : [...followedAuthorIds, authorId];
    setFollowedAuthorIds(nextIds);
    persistCommunityIdList(communityFollowsStorageKey, nextIds);
  }

  function toggleLike(postId: string) {
    const alreadyLiked = likedPostIds.includes(postId);
    const nextLikedIds = alreadyLiked ? likedPostIds.filter((id) => id !== postId) : [...likedPostIds, postId];
    const nextPosts = posts.map((post) => (
      post.id === postId ? { ...post, likes: Math.max(0, post.likes + (alreadyLiked ? -1 : 1)) } : post
    ));
    setLikedPostIds(nextLikedIds);
    setPosts(nextPosts);
    persistCommunityIdList(communityLikesStorageKey, nextLikedIds);
    persistCommunityPosts(nextPosts);
  }

  function addComment(postId: string) {
    const value = (commentDrafts[postId] ?? '').trim();
    if (!value) return;

    const nextPosts = posts.map((post) => (
      post.id === postId
        ? { ...post, comments: post.comments + 1, commentList: [...(post.commentList ?? []), value] }
        : post
    ));
    setPosts(nextPosts);
    persistCommunityPosts(nextPosts);
    setCommentDrafts((drafts) => ({ ...drafts, [postId]: '' }));
    setOpenCommentPostId(postId);
  }

  async function sharePost(post: CommunityPost) {
    const shareText = `${post.title} - Kendronics`;
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, text: shareText, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(`${shareText} ${window.location.href}`);
      }
    } catch {
      // Sharing can be cancelled by the user; no UI error needed.
    }
  }

  return (
    <section className="bg-white shadow-sm ring-1 ring-[#dbe4ee]">
      <div className="border-b border-[#e4ebf2] p-5">
        <nav className="grid grid-cols-3 gap-2 bg-[#0b1220] p-3 text-white" aria-label="Rubriques publication">
          {[
            ['reels', 'Reels', 'Toutes les publications publiques'],
            ['following', 'Suivis', 'Publications des comptes suivis'],
            ['profile', 'Profil', 'Vos contenus et commentaires'],
          ].map(([key, label, detail]) => (
            <button key={key} type="button" onClick={() => setActiveTab(key as CommunityTab)} className={`flex items-center gap-3 px-3 py-3 text-left transition ${activeTab === key ? 'bg-[#0f8f6b] text-white' : 'hover:bg-white/10'}`}>
              <span className="grid h-8 w-8 place-items-center border border-white/20 text-xs font-black">{label.slice(0, 1)}</span>
              <span className="min-w-0">
                <span className="block text-sm font-black">{label}</span>
                <span className="block truncate text-[11px] text-white/60">{detail}</span>
              </span>
            </button>
          ))}
        </nav>

          {activeTab === 'profile' ? (
            <form className="mt-4 grid gap-3" onSubmit={(event) => { event.preventDefault(); publishPost(); }}>
              <div className="grid gap-3 md:grid-cols-[1fr_180px]">
                <input value={title} onChange={(event) => setTitle(event.target.value)} className="h-11 border border-[#cfd8e3] bg-white px-3 text-sm font-semibold text-[#102033] outline-none focus:border-[#0f8f6b]" placeholder="Titre du projet, tuto ou document" maxLength={72} />
                <select value={kind} onChange={(event) => setKind(event.target.value as CommunityPost['kind'])} className="h-11 border border-[#cfd8e3] bg-white px-3 text-sm font-semibold text-[#102033] outline-none focus:border-[#0f8f6b]">
                  <option value="image">Image</option>
                  <option value="video">Video short</option>
                  <option value="document">Document technique</option>
                  <option value="tutorial">Tutoriel</option>
                </select>
              </div>
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} className="min-h-[78px] resize-y border border-[#cfd8e3] bg-white px-3 py-2 text-sm font-semibold text-[#102033] outline-none focus:border-[#0f8f6b]" placeholder="Decrivez le montage, les fichiers, les composants ou l'objectif du prototype." maxLength={220} />
              <div className="grid gap-3 md:grid-cols-[1fr_150px]">
                <label className="flex h-11 cursor-pointer items-center justify-between border border-dashed border-[#9fb3c8] bg-[#f8fafc] px-3 text-sm font-semibold text-[#475569] transition hover:border-[#0f8f6b] hover:text-[#0f8f6b]">
                  <span className="truncate">{mediaName || 'Ajouter video, image, PDF, ZIP ou fichier technique'}</span>
                  <input type="file" accept="image/*,video/*,.pdf,.zip,.rar,.7z,.doc,.docx,.ppt,.pptx" className="hidden" onChange={(event) => handleMediaChange(event.target.files?.[0])} />
                </label>
                <button type="submit" disabled={!canPublish} className="h-11 bg-[#0f8f6b] px-5 text-sm font-black text-white transition hover:bg-[#0b7558] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500">
                  Publier
                </button>
              </div>
            </form>
          ) : null}
      </div>

      {visiblePosts.length > 0 ? (
        <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
          {visiblePosts.map((post) => (
            <article key={post.id} className="overflow-hidden border border-[#dbe4ee] bg-white">
              <div className="relative aspect-[4/3] overflow-hidden bg-[#eef4f8]">
                {post.mediaDataUrl && post.mediaType?.startsWith('video/') ? (
                  <video src={post.mediaDataUrl} className="h-full w-full object-cover" controls muted />
                ) : post.mediaDataUrl ? (
                  <img src={post.mediaDataUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center bg-[linear-gradient(135deg,#e9f8f3,#f8fbff)] p-6 text-center text-sm font-black text-[#0f8f6b]">
                    {post.mediaName}
                  </div>
                )}
                <span className="absolute left-2 top-2 bg-[#fff2e5] px-2 py-1 text-[10px] font-black uppercase text-[#ff6a00]">{communityKindLabel(post.kind)}</span>
                {post.authorId !== currentAuthorId ? (
                  <button type="button" onClick={() => toggleFollow(post.authorId)} className="absolute right-2 top-2 bg-black/70 px-2 py-1 text-[10px] font-black text-white transition hover:bg-[#0f8f6b]">
                    {followedAuthorIds.includes(post.authorId) ? 'Unfollow' : 'Follow'}
                  </button>
                ) : null}
              </div>
              <div className="p-3">
                <h3 className="line-clamp-1 text-base font-black text-[#102033]">{post.title}</h3>
                <p className="mt-1 line-clamp-2 min-h-[38px] text-xs leading-5 text-[#64748b]">{post.description || post.mediaName}</p>
                <div className="mt-3 flex items-center justify-between text-[11px] text-[#94a3b8]">
                  <span>{formatCompactNumber(post.views)} vues</span>
                  <button type="button" onClick={() => toggleLike(post.id)} className={likedPostIds.includes(post.id) ? 'font-black text-[#0f8f6b]' : 'hover:text-[#0f8f6b]'}>{post.likes} likes</button>
                  <button type="button" onClick={() => setOpenCommentPostId(openCommentPostId === post.id ? null : post.id)} className="hover:text-[#0f8f6b]">{post.comments} avis</button>
                  <button type="button" onClick={() => void sharePost(post)} className="hover:text-[#0f8f6b]">Partager</button>
                </div>
                <div className="mt-3 flex items-center gap-2 border-t border-[#edf2f7] pt-3">
                  <Avatar avatarDataUrl={post.avatarDataUrl} size="small" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-black text-[#102033]">{post.author}</p>
                    <p className="text-[11px] text-[#94a3b8]">{formatDate(post.createdAt)}</p>
                  </div>
                </div>
                {openCommentPostId === post.id || activeTab === 'profile' ? (
                  <div className="mt-3 border-t border-[#edf2f7] pt-3">
                    {(post.commentList ?? []).slice(-3).map((comment, index) => (
                      <p key={`${post.id}-comment-${index}`} className="mb-2 bg-[#f8fafc] px-2 py-1 text-[11px] leading-4 text-[#475569]">{comment}</p>
                    ))}
                    <div className="grid grid-cols-[1fr_64px] gap-2">
                      <input value={commentDrafts[post.id] ?? ''} onChange={(event) => setCommentDrafts((drafts) => ({ ...drafts, [post.id]: event.target.value }))} className="h-8 border border-[#dbe4ee] px-2 text-xs outline-none focus:border-[#0f8f6b]" placeholder="Commenter..." />
                      <button type="button" onClick={() => addComment(post.id)} className="h-8 bg-[#102033] text-xs font-black text-white">OK</button>
                    </div>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="grid min-h-[180px] place-items-center p-5 text-center">
          <div>
            <p className="text-base font-black text-[#102033]">{communityEmptyTitle(activeTab)}</p>
            <p className="mt-2 text-sm text-[#64748b]">{communityEmptyDescription(activeTab)}</p>
          </div>
        </div>
      )}
    </section>
  );
}

function DiscoverNewsRail() {
  const [items, setItems] = useState<DiscoverNewsItem[]>([]);
  const [updatedAt, setUpdatedAt] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;

    async function loadDiscoverNews() {
      try {
        const response = await fetch('/api/discover-news', { cache: 'no-store' });
        if (!response.ok) throw new Error(`Discover news failed: ${response.status}`);
        const payload = (await response.json()) as { updatedAt?: string; items?: DiscoverNewsItem[] };
        if (cancelled) return;
        setItems(payload.items ?? []);
        setUpdatedAt(payload.updatedAt ?? '');
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    }

    void loadDiscoverNews();
    const interval = window.setInterval(() => void loadDiscoverNews(), 15 * 60 * 1000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const featured = items[0];
  const compactStories = items.slice(1, 4);

  return (
    <aside className="sticky top-[86px] self-start overflow-hidden bg-[#111827] text-white shadow-sm ring-1 ring-[#dbe4ee]">
      <div className="flex min-h-14 items-center justify-between gap-3 border-b border-white/10 px-4">
        <div className="flex items-center gap-3">
          <span className="grid h-7 w-7 place-items-center bg-[#0f8f6b] text-xs font-black text-white">D</span>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold">Discover</h2>
            <p className="truncate text-[11px] font-semibold text-white/55">Technologie, IA, électronique</p>
          </div>
        </div>
        <button type="button" onClick={() => window.location.reload()} className="shrink-0 border border-white/20 px-2 py-2 text-[11px] font-black text-white transition hover:border-[#0f8f6b] hover:text-[#9ee6ca]">
          Actualiser
        </button>
      </div>

      {status === 'loading' ? <p className="p-5 text-sm font-semibold text-white/65">Chargement des actualités technologie...</p> : null}
      {status === 'error' ? <p className="p-5 text-sm font-semibold text-red-200">Flux temporairement indisponible.</p> : null}

      {status === 'ready' && featured ? (
        <div className="grid gap-3 p-3">
          <DiscoverHeroCard item={featured} large />

          <div className="grid gap-2">
            {compactStories.map((item) => (
              <DiscoverSmallCard key={`${item.source}-${item.link}`} item={item} />
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-3 text-[11px] text-white/55">
            <span>Sources vérifiées</span>
            <span>{updatedAt ? formatDate(updatedAt) : 'Direct'}</span>
          </div>
        </div>
      ) : null}
    </aside>
  );
}

function DiscoverHeroCard({ item, large }: { item: DiscoverNewsItem; large?: boolean }) {
  return (
    <a href={item.link} target="_blank" rel="noreferrer" className={`group relative block overflow-hidden bg-black text-white ${large ? 'min-h-[230px]' : 'min-h-[140px]'}`}>
      <img src={item.imageUrl || discoverFallbackImage(item.source)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-75 transition duration-300 group-hover:scale-[1.03]" />
      <span className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/5" />
      <span className="absolute left-4 top-4 bg-white/90 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#102033]">{item.source}</span>
      <span className="absolute inset-x-0 bottom-0 p-4">
        <span className={`block font-black leading-tight ${large ? 'text-[20px]' : 'text-lg'}`}>{item.title}</span>
        <span className={`mt-2 line-clamp-2 text-xs leading-5 text-white/85 ${large ? 'max-w-sm' : ''}`}>{item.summary}</span>
        <span className="mt-2 flex items-center gap-4 text-xs text-white/70">
          <span>{formatRelativeTime(item.publishedAt)}</span>
          <span>Voir l'article</span>
        </span>
      </span>
    </a>
  );
}

function DiscoverSmallCard({ item }: { item: DiscoverNewsItem }) {
  return (
    <a href={item.link} target="_blank" rel="noreferrer" className="group grid min-h-[82px] grid-cols-[86px_minmax(0,1fr)] overflow-hidden border border-white/10 bg-[#1f2937] transition hover:border-[#0f8f6b]">
      <div className="relative h-full min-h-[82px] overflow-hidden bg-black">
        <img src={item.imageUrl || discoverFallbackImage(item.source)} alt="" className="h-full w-full object-cover opacity-75 transition group-hover:scale-[1.04]" />
      </div>
      <div className="min-w-0 p-2">
        <p className="truncate text-[11px] font-black text-[#9ee6ca]">{item.source} - {formatRelativeTime(item.publishedAt)}</p>
        <h3 className="mt-1 line-clamp-2 text-[13px] font-black leading-4 text-white transition group-hover:text-[#9ee6ca]">{item.title}</h3>
      </div>
    </a>
  );
}

function DiscoverStoryCard({ item }: { item: DiscoverNewsItem }) {
  return (
    <a href={item.link} target="_blank" rel="noreferrer" className="group grid min-h-[136px] grid-cols-[128px_minmax(0,1fr)] overflow-hidden border border-white/10 bg-[#1f2937] transition hover:border-[#0f8f6b]">
      <span className="block h-full min-h-[136px] overflow-hidden bg-black">
        <img src={item.imageUrl || discoverFallbackImage(item.source)} alt="" className="h-full w-full object-cover opacity-85 transition group-hover:scale-[1.03]" />
      </span>
      <span className="min-w-0 p-3">
        <span className="block truncate text-[11px] font-black text-[#9ee6ca]">{item.source} - {formatRelativeTime(item.publishedAt)}</span>
        <span className="mt-1 line-clamp-2 block text-base font-black leading-5 text-white transition group-hover:text-[#9ee6ca]">{item.title}</span>
        <span className="mt-2 line-clamp-2 block text-xs leading-5 text-white/70">{item.summary}</span>
      </span>
    </a>
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

function Avatar({ avatarDataUrl, size }: { avatarDataUrl: string; size: 'small' | 'medium' | 'large' }) {
  const className = size === 'large' ? 'h-28 w-28 border-2 border-[#0f8f6b]' : size === 'small' ? 'h-7 w-7 border border-slate-200' : 'h-24 w-24 border border-slate-200';

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

function countForStatus(key: OrderStatusKey, counts: ReturnType<typeof orderCounts>) {
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
  if (key === 'verification') return ['payment_authorized', 'supplier_review_pending', 'supplier_files_rejected'].includes(order.status);
  if (key === 'payment-pending') return isPaidOrder(order);
  if (key === 'production') return ['paid', 'supplier_order_pending', 'supplier_ordered', 'supplier_in_production', 'china_3pl_received'].includes(order.status);
  if (key === 'delivery') return ['shipped_to_africa', 'customs_processing', 'out_for_delivery'].includes(order.status);
  if (key === 'completed') return order.status === 'delivered';
  if (key === 'comments') return order.status === 'delivered';
  return false;
}

function isPaidOrder(order: ProfileOrder) {
  if (order.paymentStatus === 'paid') return true;
  if (order.paidAt) return true;
  return ['paid', 'supplier_order_pending', 'supplier_ordered', 'supplier_in_production', 'china_3pl_received', 'shipped_to_africa', 'customs_processing', 'out_for_delivery', 'delivered'].includes(order.status);
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
    payment_authorized: 'Paiement autorise',
    supplier_review_pending: 'Verification des fichiers',
    supplier_files_rejected: 'Fichier rejete',
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

function formatRelativeTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'recent';

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60000));
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h`;

  const days = Math.round(hours / 24);
  return `${days} j`;
}

function sourceInitials(source: string) {
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function discoverFallbackImage(source: string) {
  if (source.toLowerCase().includes('nasa')) return 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1200&q=80';
  if (source.toLowerCase().includes('mit')) return 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80';
  if (source.toLowerCase().includes('science')) return 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80';
  return 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80';
}

function formatDateTime(value: Date) {
  if (Number.isNaN(value.getTime())) return '-';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
}

function readCommunityPosts() {
  try {
    const parsed = JSON.parse(readScopedLocalStorage(communityPostsStorageKey) ?? '[]') as Partial<CommunityPost>[];
    return parsed
      .filter((post) => post.id && post.title)
      .map((post) => ({
        id: post.id ?? `${Date.now()}`,
        authorId: post.authorId ?? `profile:${(post.author ?? 'client').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        author: post.author ?? 'Client Kendronics',
        avatarDataUrl: post.avatarDataUrl ?? '',
        title: post.title ?? 'Publication',
        description: post.description ?? '',
        kind: post.kind ?? 'image',
        mediaName: post.mediaName ?? 'Media technique',
        mediaDataUrl: post.mediaDataUrl,
        mediaType: post.mediaType,
        createdAt: post.createdAt ?? new Date().toISOString(),
        views: post.views ?? 0,
        likes: post.likes ?? 0,
        saves: post.saves ?? 0,
        comments: post.comments ?? post.commentList?.length ?? 0,
        commentList: post.commentList ?? [],
      }));
  } catch {
    return [];
  }
}

function persistCommunityPosts(posts: CommunityPost[]) {
  try {
    writeScopedLocalStorage(communityPostsStorageKey, JSON.stringify(posts));
  } catch {
    // Large media previews can exceed browser storage; keep the UI responsive even when persistence fails.
  }
}

function readCommunityIdList(storageKey: string) {
  try {
    const parsed = JSON.parse(readScopedLocalStorage(storageKey) ?? '[]') as string[];
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function persistCommunityIdList(storageKey: string, ids: string[]) {
  try {
    writeScopedLocalStorage(storageKey, JSON.stringify(Array.from(new Set(ids))));
  } catch {
    // Keep interactions usable even if browser storage is unavailable.
  }
}

function communityEmptyTitle(tab: CommunityTab) {
  if (tab === 'following') return 'Aucune publication suivie.';
  if (tab === 'profile') return 'Aucune publication sur votre profil.';
  return 'Aucune publication publique pour le moment.';
}

function communityEmptyDescription(tab: CommunityTab) {
  if (tab === 'following') return 'Suivez des createurs depuis Reels pour voir leurs prochaines publications ici.';
  if (tab === 'profile') return 'Publiez un media technique pour alimenter votre profil public.';
  return 'Les prochaines publications publiques apparaitront dans ce flux.';
}

function communityKindLabel(kind: CommunityPost['kind']) {
  const labels: Record<CommunityPost['kind'], string> = {
    image: 'Image',
    video: 'Video',
    document: 'Doc technique',
    tutorial: 'Tuto',
  };
  return labels[kind];
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

function statusMessage(status: 'loading' | 'ready' | 'signed-out' | 'error', emptyText: string) {
  if (status === 'loading') return 'Chargement...';
  if (status === 'signed-out') return 'Connectez-vous pour afficher ces donnees.';
  if (status === 'error') return 'Impossible de charger ces donnees.';
  return emptyText;
}

function readStoredProfile(): Partial<ProfileForm> {
  try {
    return JSON.parse(readScopedLocalStorage(profileStorageKey) ?? '{}') as Partial<ProfileForm>;
  } catch {
    return {};
  }
}

function normalizeProfileDetails(value: unknown, fullName = '', companyName = ''): ProfileDetails {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? (value as Partial<Record<keyof ProfileDetails, unknown>>) : {};
  const [firstName, lastName] = splitProfileName(fullName);
  const orderPreference = stringListValue(source.orderPreference);
  const productInterests = stringListValue(source.productInterests);

  return {
    accountType: stringValue(source.accountType) || (companyName ? 'company' : ''),
    customerType: stringValue(source.customerType),
    industry: stringValue(source.industry),
    orderPreference,
    productInterests,
    hearAboutUs: stringValue(source.hearAboutUs),
    firstName: stringValue(source.firstName) || firstName,
    lastName: stringValue(source.lastName) || lastName,
    gender: stringValue(source.gender),
    website: stringValue(source.website),
    birthday: stringValue(source.birthday),
  };
}

function normalizeProfileCountry(value: string | undefined): string {
  const raw = (value ?? '').trim();
  if (!raw) return '';
  const upper = raw.toUpperCase();
  const byIso = africanCountries.find((country) => country.iso2 === upper);
  if (byIso) return byIso.iso2;
  const byName = africanCountries.find((country) => country.name.toUpperCase() === upper);
  return byName?.iso2 ?? '';
}

function countryDisplayName(value: string): string {
  return africanCountries.find((country) => country.iso2 === value)?.name ?? value;
}

async function resizeProfileImage(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = objectUrl;
    });
    const maxSide = 512;
    const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas unavailable');
    context.drawImage(image, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.86));
    if (!blob) throw new Error('Image compression failed');
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => (typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Invalid image data')));
      reader.onerror = () => reject(new Error('File read failed'));
      reader.readAsDataURL(blob);
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function normalizeAddress(value: unknown): AccountAddress {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? (value as Partial<Record<keyof AccountAddress, unknown>>) : {};
  return {
    accountType: stringValue(source.accountType) || 'individual',
    firstName: stringValue(source.firstName),
    lastName: stringValue(source.lastName),
    company: stringValue(source.company),
    street: stringValue(source.street),
    apartment: stringValue(source.apartment),
    country: stringValue(source.country),
    region: stringValue(source.region),
    city: stringValue(source.city),
    postalCode: stringValue(source.postalCode),
    taxId: stringValue(source.taxId),
    phone: stringValue(source.phone),
  };
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function stringListValue(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : [];
}

function splitProfileName(value: string): [string, string] {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return ['', ''];
  if (parts.length === 1) return [parts[0], ''];
  return [parts[0], parts.slice(1).join(' ')];
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

async function logout() {
  await revokeAuthSession();
  removeScopedLocalStorage('kendronics.customer.orders');
  window.dispatchEvent(new Event('kendronics:orders-updated'));
  window.location.assign('/');
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
    removeScopedLocalStorage(profileStorageKey);
    removeScopedLocalStorage(avatarStorageKey);
    removeScopedLocalStorage('kendronics.customer.orders');
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
