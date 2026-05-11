'use client';

import { useEffect, useState } from 'react';
import { Footer } from '../../components/layout/Footer';
import { Navbar } from '../../components/layout/Navbar';
import { clearAuthSession, readAuthSession } from '../../lib/auth-session';

const profileStorageKey = 'kendronics.customer.profile';
const avatarStorageKey = 'kendronics.customer.avatar';

type ProfileForm = {
  name: string;
  email: string;
  phone: string;
  company: string;
  country: string;
};

type QuickProduct = {
  title: string;
  subtitle: string;
  href: string;
  image: string;
  color: string;
};

type ProfileView =
  | 'all-orders'
  | 'verification'
  | 'payment-pending'
  | 'production'
  | 'delivery'
  | 'completed'
  | 'comments'
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

const sidebarGroups = [
  {
    title: 'Commandes',
    items: ['Mon Espace', 'Verification en cours (2)', 'Paiement en attente (1)', 'Paiement inacheve (0)', 'Statut de production (3)', 'Livraison (1)', 'Termine (8)', 'Gerer les commentaires', 'Remboursements & Litiges (0)', 'Liste des souhaits (3)'],
  },
  {
    title: 'Services',
    items: ['Prototype PCB', 'Petites series', 'PCB avance', 'Assemblage PCB', 'CNC | Impression 3D', 'Conception PCB', 'Assistance Gerber'],
  },
  {
    title: 'Promotions',
    items: ['Centre de Message', 'Notifications', 'Boutique cadeaux', 'Mes coupons', 'Recompenses de Kendronics', 'Connexion', 'Inviter', 'Projets partages'],
  },
  {
    title: 'Mon profil',
    items: ['Adresse de livraison', 'Compte de collecte', 'Informations de facturation', 'Solde du compte', 'Reclamations des employes', 'Parametres'],
  },
];

const orderRows = [
  ['KD-250516-001', 'PCB Prototype', '2025-05-16', '5 pcs', 'Verification', '$23.50'],
  ['KD-250515-008', 'PCB Assembly', '2025-05-15', '10 pcs', 'Production', '$129.00'],
  ['KD-250514-002', 'FPC Flexible PCB', '2025-05-14', '5 pcs', 'Production', '$85.40'],
  ['KD-250513-011', 'PCB Prototype', '2025-05-13', '5 pcs', 'Livraison', '$23.50'],
  ['KD-250511-007', 'CNC Machining', '2025-05-11', '1 pcs', 'Termine', '$56.00'],
];

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileForm>({ name: '', email: '', phone: '', company: '', country: '' });
  const [accountId, setAccountId] = useState('');
  const [avatarDataUrl, setAvatarDataUrl] = useState('');
  const [activeProfileView, setActiveProfileView] = useState<ProfileView>(null);
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
    if (new URLSearchParams(window.location.search).get('view') === 'orders') {
      setActiveProfileView('all-orders');
    }
  }, []);

  const firstName = firstNameOf(profile.name || emailName(profile.email) || 'Rafale');
  const userId = formatUserId(accountId);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f3f6fa] text-[#1f2f43]">
      <Navbar />
      <div className="w-full pt-[70px]">
        <div className="mx-auto grid min-w-[1328px] max-w-[1368px] grid-cols-[250px_minmax(0,1fr)] gap-4 px-5 py-4">
          <ProfileSidebar activeProfileView={activeProfileView} onSelectView={setActiveProfileView} />

          <section className="min-w-0">
            {activeProfileView ? (
              <ProfileViewContent view={activeProfileView} profile={profile} userId={userId} avatarDataUrl={avatarDataUrl} />
            ) : (
              <>
                <ProductQuickGrid />

                <div className="mt-4 grid min-w-0 grid-cols-[minmax(0,1fr)_330px] gap-4">
                  <div className="min-w-0">
                    <DashboardPanel firstName={firstName} userId={userId} avatarDataUrl={avatarDataUrl} />
                    <ReferralBanner />
                    <StatusStrip />
                    <OrdersTable />
                    <GiftExchange />
                    <ReviewsPanel />
                  </div>

                  <RightRail />
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
}: {
  activeProfileView: ProfileView;
  onSelectView: (view: ProfileView) => void;
}) {
  return (
    <aside className="sticky top-[86px] block self-start bg-white shadow-sm ring-1 ring-slate-200">
      {sidebarGroups.map((group) => (
        <section key={group.title} className="border-b border-slate-200 last:border-b-0">
          <h2 className="px-4 pb-2 pt-5 text-[12px] font-black uppercase text-[#1f2f43]">{group.title}</h2>
          <div className="block px-0 pb-4">
            {group.items.map((item, index) => {
              const view = viewForSidebarItem(group.title, item);
              const isActive = view !== null && view === activeProfileView;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => onSelectView(view)}
                  className={`relative flex min-h-[34px] w-full items-center gap-3 rounded-none bg-transparent px-4 text-left text-[13px] hover:bg-[#f1f8f4] hover:text-[#0f9f6e] ${
                    isActive ? 'font-black text-[#009a38]' : 'text-[#475569]'
                  }`}
                >
                  <span className={`grid h-4 w-4 shrink-0 place-items-center rounded-none border text-[9px] ${
                    isActive ? 'border-[#24ad5d] text-[#24ad5d]' : 'border-slate-300 text-slate-400'
                  }`}>{index + 1}</span>
                  <span className="min-w-0 truncate">{item}</span>
                  {index === 0 && group.title === 'Promotions' ? <span className="ml-auto rounded-none bg-red-500 px-1.5 text-[10px] font-black text-white">2</span> : null}
                  {isActive ? <span className="absolute right-0 top-0 h-full w-[5px] bg-[#27a35a]" /> : null}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </aside>
  );
}

function viewForSidebarItem(groupTitle: string, item: string): ProfileView {
  if (groupTitle === 'Commandes') {
    if (item === 'Mon Espace') return null;
    if (item.startsWith('Verification')) return 'verification';
    if (item.startsWith('Paiement en attente')) return 'payment-pending';
    if (item.startsWith('Statut de production')) return 'production';
    if (item.startsWith('Livraison')) return 'delivery';
    if (item.startsWith('Termine')) return 'completed';
    if (item === 'Gerer les commentaires') return 'comments';
  }

  if (groupTitle === 'Promotions') {
    if (item === 'Notifications') return 'notifications';
    if (item === 'Inviter') return 'invite';
  }

  if (groupTitle === 'Mon profil') {
    if (item === 'Adresse de livraison') return 'shipping-address';
    if (item === 'Informations de facturation') return 'billing';
    if (item === 'Parametres') return 'settings';
  }

  return null;
}

function ProfileViewContent({
  view,
  profile,
  userId,
  avatarDataUrl,
}: {
  view: Exclude<ProfileView, null>;
  profile: ProfileForm;
  userId: string;
  avatarDataUrl: string;
}) {
  if (view === 'all-orders') return <OrderReviewSection activeKey="all" title="Toutes commandes" mode="table" />;
  if (view === 'verification') return <OrderReviewSection activeKey="verification" title="Panier / Examen de votre commande" mode="review" />;
  if (view === 'payment-pending') return <OrderReviewSection activeKey="payment-pending" title="Panier / Examen de votre commande" mode="review" />;
  if (view === 'production') return <OrderReviewSection activeKey="production" title="Progrès de la Fabrication" mode="table" />;
  if (view === 'delivery') return <OrderReviewSection activeKey="delivery" title="Livraison / Suivi de votre envoi" mode="table" />;
  if (view === 'completed') return <OrderReviewSection activeKey="completed" title="Commande complétée" mode="table" />;
  if (view === 'comments') return <CommentsManagementSection />;
  if (view === 'notifications') return <NotificationsSection />;
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

function OrderReviewSection({ activeKey, title, mode }: { activeKey: OrderStatusKey; title: string; mode: 'review' | 'table' }) {
  return (
    <section className="min-h-[690px] bg-white text-[#111827] shadow-sm ring-1 ring-slate-200">
      <OrderStatusHeader activeKey={activeKey} />

      <div className="border-t-[16px] border-[#eef0f3] px-6 pb-24 pt-5">
        <div className={`${mode === 'review' ? 'flex h-12 items-center gap-2 border-b border-[#e5e7eb]' : 'flex h-10 items-center gap-2'}`}>
          <span className="grid h-[22px] w-[22px] place-items-center bg-[#61bd00] text-[18px] font-black leading-none text-white">{mode === 'review' ? '✓' : '⚙'}</span>
          <h2 className="text-xl font-normal text-black">{title}</h2>
        </div>

        {mode === 'review' ? <ReviewSearchPanel /> : <OrderTableSearchPanel />}
      </div>
    </section>
  );
}

function OrderStatusHeader({ activeKey }: { activeKey: OrderStatusKey }) {
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
                0
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

function ReviewSearchPanel() {
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
      <EmptyResult />
    </>
  );
}

function OrderTableSearchPanel() {
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
      <EmptyResult />
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

function CommentsManagementSection() {
  return (
    <section className="min-h-[690px] bg-white text-[#111827] shadow-sm ring-1 ring-slate-200">
      <OrderStatusHeader activeKey="comments" />
      <div className="border-t-[16px] border-[#eef0f3] px-6 pb-24 pt-5">
        <h2 className="text-xl font-normal text-black">Gérer les commentaires</h2>
        <div className="mt-3 grid max-w-[906px] grid-cols-[1.2fr_1.2fr_0.6fr] bg-[#f0f0f0] px-3 py-3 text-xs text-black">
          <span>Produit</span>
          <span>Avis</span>
          <span>Action</span>
        </div>
        <EmptyResult />
        <div className="mt-20 h-10 max-w-[906px] bg-[#f7f7f7]" />
      </div>
    </section>
  );
}

function NotificationsSection() {
  return (
    <section className="min-h-[690px] bg-[#eef0f3] p-5 text-black shadow-sm ring-1 ring-slate-200">
      <h1 className="text-xl font-normal">Notifications</h1>
      <div className="mt-5 flex h-[58px] items-center justify-between bg-white px-5 ring-1 ring-[#e5e7eb]">
        <div className="flex items-center gap-5 text-sm">
          <button className="border-r border-[#b8b8b8] pr-5 text-[#ff5a00]" type="button">Tout</button>
          <button className="border-r border-[#b8b8b8] pr-5" type="button">Not. Help center</button>
          <button type="button">Not. Product</button>
        </div>
        <button type="button" className="rounded-none border border-[#b8b8b8] px-3 py-2 text-xs">Tout marquer comme lu</button>
      </div>
      <div className="mt-5 bg-white px-5 py-4">
        <div className="grid grid-cols-[1fr_1fr_160px] bg-[#f0f0f0] px-5 py-4 text-xs font-black">
          <span>Notifications</span>
          <span>Article</span>
          <span>Heure(GMT+8)</span>
        </div>
        <div className="grid min-h-[136px] place-items-center text-sm text-[#92979d]">
          <p><span className="mr-3 inline-grid h-6 w-6 place-items-center rounded-none bg-yellow-300 text-white">−</span>Votre liste de notifications est vide.</p>
        </div>
      </div>
    </section>
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
      <div className="grid grid-cols-[160px_1fr_160px] border-b border-[#e5e7eb] py-5 text-sm opacity-35 blur-[1px]">
        <h2 className="text-lg">Supprimer le compte</h2>
        <p className="text-[#4b5563]">Suppression définitive du compte et des données associées.</p>
        <button type="button" disabled className="cursor-not-allowed text-right text-red-600">Supprimer</button>
      </div>
    </section>
  );
}

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
    <div className="grid grid-cols-6 gap-4">
      {quickProducts.map((product) => (
        <a key={product.title} href={product.href} className="grid min-h-[180px] grid-rows-[auto_minmax(0,1fr)_auto] bg-white p-3 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md">
          <h3 className="min-h-10 text-[15px] font-black leading-5 text-[#111827]">{product.title}</h3>
          <div className="grid min-h-0 place-items-center py-1">
            {product.image ? (
              <img src={product.image} alt="" className="h-full max-h-[96px] w-full object-contain" />
            ) : (
              <span className="grid h-full max-h-[96px] min-h-[82px] w-full place-items-center rounded-none" style={{ backgroundColor: `${product.color}22` }}>
                <span className="h-14 w-16 rounded-none" style={{ border: `4px solid ${product.color}` }} />
              </span>
            )}
          </div>
          <p className="pt-2 text-xs leading-5 text-[#64748b]">{product.subtitle} &gt;</p>
        </a>
      ))}
    </div>
  );
}

function DashboardPanel({ firstName, userId, avatarDataUrl }: { firstName: string; userId: string; avatarDataUrl: string }) {
  return (
    <section className="grid grid-cols-[170px_minmax(0,1fr)] bg-white shadow-sm ring-1 ring-slate-200">
      <div className="grid place-items-center border-r border-slate-200 px-4 py-8 text-center">
        <Avatar avatarDataUrl={avatarDataUrl} size="medium" />
        <div>
          <h1 className="mt-4 text-lg font-black text-[#475569]">{firstName}</h1>
          <p className="mt-2 text-xs text-slate-500">ID Client: {userId}</p>
          <a href="#" className="mt-4 inline-flex text-xs font-semibold text-blue-600">Ma communaute</a>
        </div>
      </div>

      <div className="p-4">
        <h2 className="text-sm font-black text-[#1f2f43]">Tableau de bord</h2>
        <div className="mt-4 grid grid-cols-[1fr_180px] gap-4">
          <div className="grid grid-cols-2 border border-slate-200">
            <MetricCell label="Solde (USD)" value="$ 0.00" detail="(Non Retirable: $0.00)" />
            <MetricCell label="Recemment ajoute" value="+0.00" valueClass="text-[#ff5a00]" />
            <MetricCell label="Commission pour les circuits imprimes (PCBs) partages" value="$0.00" detail="(+0.00)" />
            <MetricCell label="Total des remises" value="$0.00" detail="(+0.00)" />
          </div>
          <div className="grid gap-2">
            <SmallInfo label="Mes coupons" value="5" />
            <SmallInfo label="Mes Points" value="320" action="Echanger" />
            <SmallInfo label="Messages non lus" value="2" danger />
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
    <div className="flex min-h-[48px] items-center justify-between bg-[#f8fafc] px-4 text-xs text-[#475569]">
      <span>{label}</span>
      <span className={danger ? 'rounded-none bg-red-500 px-1.5 py-0.5 font-black text-white' : 'font-black text-[#ff5a00]'}>{value}</span>
      {action ? <a href="#" className="text-[#475569]">{action}</a> : null}
    </div>
  );
}

function ReferralBanner() {
  return (
    <section className="mt-4 flex h-[74px] min-h-[68px] items-center justify-between gap-3 bg-gradient-to-r from-[#ff6233] via-[#ff8a18] to-[#ffb000] px-5 py-0 text-white">
      <div>
        <p className="text-2xl font-black italic leading-none">Looking For New Referral Opportunities?</p>
        <p className="mt-2 text-xs">Refer others and explore the benefits of sharing our services.</p>
      </div>
      <a href="#" className="shrink-0 rounded-none bg-white px-6 py-3 text-xs font-black text-[#ff5a00]">Sign Up Now</a>
    </section>
  );
}

function StatusStrip() {
  const statuses = [
    ['2', 'Verification en cours'],
    ['1', 'Paiement en attente'],
    ['3', 'Statut de production'],
    ['0', "Questions d'ingenierie"],
    ['1', 'Livraison'],
    ['2', 'Commentaires en attente'],
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

function OrdersTable() {
  return (
    <section className="mt-4 bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-[#1f2937]">Ma commande</h2>
        <a href="/orders" className="text-xs font-semibold text-blue-600">Plus &gt;</a>
      </div>
      <div className="mt-4 flex gap-8 border-b border-slate-200 text-xs">
        {['Toutes (8)', 'Verification (2)', 'Production (3)', 'Livraison (1)', 'Termine (8)'].map((tab, index) => (
          <span key={tab} className={`pb-3 ${index === 0 ? 'border-b-2 border-blue-500 font-black text-blue-600' : 'text-slate-500'}`}>{tab}</span>
        ))}
      </div>
      <table className="mt-2 w-full text-left text-xs">
        <thead className="text-[#64748b]">
          <tr>
            {['N Commande', 'Produit', 'Date de commande', 'Quantite', 'Statut', 'Montant', 'Action'].map((head) => (
              <th key={head} className="py-3 font-black">{head}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orderRows.map((row) => (
            <tr key={row[0]} className="border-t border-slate-100">
              {row.map((cell, index) => (
                <td key={`${row[0]}-${cell}`} className={`py-3 ${index === 4 ? statusColor(cell) : ''}`}>{cell}</td>
              ))}
              <td className="py-3"><a href="/orders" className="rounded-none border border-blue-400 px-3 py-1 text-blue-600">Voir</a></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function GiftExchange() {
  const gifts = ['Points: 2800', 'Points: 3200', 'Points: 1800', 'Points: 900', 'Points: 1200'];

  return (
    <section className="mt-4 bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black">Echanger des cadeaux</h2>
        <a href="#" className="text-xs font-semibold text-blue-600">Afficher plus &gt;</a>
      </div>
      <div className="mt-4 grid grid-cols-5 gap-4">
        {gifts.map((gift, index) => (
          <div key={gift} className="text-center">
            <div className="mx-auto h-16 w-24 rounded-none bg-gradient-to-br from-[#0f9f6e] to-[#07182c]" />
            <p className="mt-2 text-xs text-[#475569]">{gift}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ReviewsPanel() {
  return (
    <section className="mt-4 bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <div className="flex gap-8 text-sm font-black">
          <span className="border-b-2 border-[#22c55e] pb-2 text-[#16a34a]">Show client</span>
          <span>Programme Partenaire</span>
        </div>
        <a href="#" className="rounded-none bg-[#0f9f6e] px-5 py-2 text-xs font-black text-white">Laisser un commentaire</a>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-4">
        {['Engineer', 'Kain', 'COSTA'].map((name) => (
          <article key={name} className="min-h-[150px] rounded-none bg-[#f8fafc] p-4">
            <p className="text-xs font-black">{name}</p>
            <p className="mt-2 text-[#0f9f6e]">★★★★★</p>
            <p className="mt-3 text-xs leading-5 text-[#475569]">Tres bon suivi, devis clair et progression de commande facile a comprendre.</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function RightRail() {
  return (
    <aside className="grid content-start gap-4">
      <PromoBanner title="PCB Assembly for 1-20 pcs" price="$29" dark />
      <PromoBanner title="PCB Prototype Only" price="$5" />
      <InfoList title="Dernieres nouvelles" items={['Mise a jour des options expedition', 'Impact du nouveau tarif douanier', 'Bonne fete du travail !']} />
      <InfoList title="Projets partages" items={['Carte mere industrielle v2.1', 'Alimentation 24V - 10A', 'Controleur moteur BLDC']} action="Partager" />
      <InfoList title="Nouvelles questions" items={["Comment modifier l'epaisseur du cuivre ?", "Quelle finition de surface pour l'ENIG ?", 'Quels fichiers Gerber sont necessaires ?']} action="Theme" />
      <InfoList title="Nouvelles solutions" items={['How to generate Gerber files from Eagle', 'How to Use Payoneer to Pay for Orders', 'How to Place an OEM Order?', 'Payoneer Payment Instructions']} numbered />
    </aside>
  );
}

function PromoBanner({ title, price, dark }: { title: string; price: string; dark?: boolean }) {
  return (
    <article className={`${dark ? 'bg-[#07184a] text-white' : 'bg-white text-[#1f2937]'} min-h-[112px] overflow-hidden p-4 shadow-sm ring-1 ring-slate-200`}>
      <p className="text-lg font-black">{title}</p>
      <p className="mt-2 text-sm">ONLY <span className="text-3xl font-black text-[#ff9f00]">{price}</span> IN TOTAL</p>
      <div className="mt-3 h-8 rounded-none bg-gradient-to-r from-[#0fe36f] to-[#03b7e8]" />
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

function statusColor(status: string) {
  if (status === 'Verification') return 'text-[#0f9f6e]';
  if (status === 'Production') return 'text-[#16a34a]';
  if (status === 'Livraison') return 'text-[#ff7a1a]';
  return 'text-[#f59e0b]';
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
