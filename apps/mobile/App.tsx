import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  createProjectComment,
  createProjectDraft,
  followUser,
  loadExplorerProjects,
  loadMe,
  loadMyFavorites,
  loadMyProjects,
  loadMyPurchases,
  loadNotifications,
  loadOrderDetail,
  loadOrders,
  loadProjectDetail,
  loadPublicAuthorProfile,
  loadRecentProduction,
  login,
  lookupTracking,
  previewQuote,
  publishProject,
  registerAccount,
  requestPasswordReset,
  resetPassword,
  sendPublicContact,
  toggleProjectFavorite,
  toggleProjectLike,
  updateProject,
} from './src/api';
import { mediaUrl } from './src/config';
import { clearSession, readSession } from './src/session';
import {
  ExplorerProject,
  Order,
  ProjectDetail,
  PublicAuthorProfile,
  QuotePreview,
  RecentProductionItem,
  TrackingTimeline,
  UserProfile,
} from './src/types';

type RouteKey =
  | 'home'
  | 'quote'
  | 'orders'
  | 'orderDetail'
  | 'tracking'
  | 'explorer'
  | 'projectDetail'
  | 'projectNew'
  | 'profile'
  | 'publicProfile'
  | 'login'
  | 'register'
  | 'resetPassword'
  | 'admin'
  | 'contact'
  | 'services'
  | 'capabilities'
  | 'pricing'
  | 'howItWorks'
  | 'technicalGuide'
  | 'faq'
  | 'help'
  | 'blog'
  | 'terms'
  | 'cgv'
  | 'cgu'
  | 'legalNotice'
  | 'privacyPolicy'
  | 'cookiePolicy'
  | 'privacy'
  | 'oldCookiePolicy'
  | 'refundPolicy'
  | 'menu';

type NavigationState = {
  route: RouteKey;
  projectId?: string;
  userId?: string;
  orderId?: string;
};

type Navigate = (next: NavigationState) => void;

const visiblePages: Array<{ route: RouteKey; title: string; body: string; icon: keyof typeof Ionicons.glyphMap; auth?: boolean }> = [
  { route: 'home', title: 'Accueil', body: 'Presentation, production recente et actions rapides.', icon: 'home' },
  { route: 'quote', title: 'Devis PCB', body: 'Configuration PCB et prix reel via API.', icon: 'receipt' },
  { route: 'orders', title: 'Commandes', body: 'Panier et commandes du compte connecte.', icon: 'cart' },
  { route: 'tracking', title: 'Suivi', body: 'Recherche publique de suivi par reference.', icon: 'navigate' },
  { route: 'explorer', title: 'Explorer', body: 'Feed social marketplace, likes, favoris, profils.', icon: 'compass' },
  { route: 'projectNew', title: 'Creer un projet', body: 'Brouillon, description, publication gratuite ou payante.', icon: 'add-circle', auth: true },
  { route: 'profile', title: 'Mon profil', body: 'Compte, projets, favoris, achats, notifications.', icon: 'person', auth: true },
  { route: 'login', title: 'Connexion', body: 'Connexion au meme compte que le site.', icon: 'log-in' },
  { route: 'register', title: 'Inscription', body: 'Creation de compte Kendronics.', icon: 'person-add' },
  { route: 'resetPassword', title: 'Mot de passe', body: 'Demande et confirmation de reset.', icon: 'key' },
  { route: 'admin', title: 'Admin', body: 'Back-office production, prix, commandes, support.', icon: 'shield-checkmark', auth: true },
  { route: 'contact', title: 'Contact', body: 'Ticket support public reel.', icon: 'mail' },
  { route: 'services', title: 'Services', body: 'PCB, PCBA, sourcing, fabrication et accompagnement.', icon: 'construct' },
  { route: 'capabilities', title: 'Capacites', body: 'Capacites techniques PCB/PCBA.', icon: 'hardware-chip' },
  { route: 'pricing', title: 'Tarifs', body: 'Logique de prix et couts principaux.', icon: 'cash' },
  { route: 'howItWorks', title: 'Fonctionnement', body: 'Parcours de commande complet.', icon: 'git-branch' },
  { route: 'technicalGuide', title: 'Guide technique', body: 'Regles de conception et fichiers attendus.', icon: 'book' },
  { route: 'faq', title: 'FAQ', body: 'Questions frequentes.', icon: 'help-circle' },
  { route: 'help', title: 'Centre aide', body: 'Raccourcis support et ressources.', icon: 'help-buoy' },
  { route: 'blog', title: 'Blog', body: 'Contenus editoriaux Kendronics.', icon: 'newspaper' },
  { route: 'terms', title: 'Documents legaux', body: 'Index des documents legaux.', icon: 'document-text' },
  { route: 'cgv', title: 'CGV', body: 'Conditions generales de vente.', icon: 'document-lock' },
  { route: 'cgu', title: 'CGU', body: 'Conditions generales utilisation.', icon: 'reader' },
  { route: 'legalNotice', title: 'Mentions legales', body: 'Identification et responsabilites.', icon: 'business' },
  { route: 'privacyPolicy', title: 'Confidentialite', body: 'Politique de confidentialite.', icon: 'lock-closed' },
  { route: 'cookiePolicy', title: 'Cookies', body: 'Politique cookies.', icon: 'options' },
  { route: 'privacy', title: 'Privacy', body: 'Page courte historique confidentialite.', icon: 'lock-closed' },
  { route: 'oldCookiePolicy', title: 'Cookie policy', body: 'Page courte historique cookies.', icon: 'options' },
  { route: 'refundPolicy', title: 'Remboursement', body: 'Politique remboursement.', icon: 'return-down-back' },
];

const contentPages: Partial<Record<RouteKey, { title: string; kicker: string; paragraphs: string[]; bullets: string[] }>> = {
  services: {
    title: 'Services Kendronics',
    kicker: 'Fabrication electronique',
    paragraphs: ['Kendronics accompagne les createurs, etudiants, startups et entreprises sur la fabrication PCB, PCBA, sourcing et preparation de dossier technique.'],
    bullets: ['Fabrication PCB standard et avancee', 'Assemblage PCBA et sourcing composants', 'Revue de fichiers avant production', 'Support projet et marketplace'],
  },
  capabilities: {
    title: 'Capacites techniques',
    kicker: 'PCB / PCBA',
    paragraphs: ['Les capacites regroupent les choix de couches, dimensions, materiaux, finitions, tolerances et controles necessaires pour passer un prototype en production.'],
    bullets: ['PCB rigide, flex et options avancees', 'Controle Gerber et contraintes DFM', 'Delais et options de livraison', 'Preparation fabrication et suivi'],
  },
  pricing: {
    title: 'Tarifs',
    kicker: 'Prix transparent',
    paragraphs: ['Le prix depend des dimensions, couches, quantite, finition, delai, livraison et marge de securite. Le calcul detaille reste branche au moteur de devis.'],
    bullets: ['Prix estime depuis /api/pricing/preview', 'Commande reelle depuis le devis', 'Options fournisseurs et livraison', 'Historique via commandes'],
  },
  howItWorks: {
    title: 'Comment ca marche',
    kicker: 'Parcours commande',
    paragraphs: ['Le parcours mobile suit le site : configurer le PCB, joindre les fichiers, verifier le devis, commander, suivre la production et recevoir la livraison.'],
    bullets: ['Configurer', 'Televerser', 'Verifier', 'Payer', 'Suivre', 'Recevoir'],
  },
  technicalGuide: {
    title: 'Guide technique',
    kicker: 'Preparation fichiers',
    paragraphs: ['Ce guide resume les points importants avant production : Gerber, percages, dimensions, masque, silkscreen, panelisation et contraintes de fabrication.'],
    bullets: ['Exporter un ZIP Gerber complet', 'Verifier dimensions et couches', 'Nommer clairement les fichiers', 'Ajouter BOM/CPL pour PCBA'],
  },
  faq: {
    title: 'FAQ',
    kicker: 'Questions frequentes',
    paragraphs: ['Les reponses couvrent les devis, fichiers, delais, paiements, production, livraison et support.'],
    bullets: ['Comment obtenir un devis ?', 'Quels fichiers fournir ?', 'Comment suivre une commande ?', 'Comment publier un projet ?'],
  },
  help: {
    title: 'Centre aide',
    kicker: 'Support',
    paragraphs: ['Le centre aide dirige vers le contact, le suivi, la FAQ et les documents essentiels.'],
    bullets: ['Contacter le support', 'Suivre une commande', 'Lire la FAQ', 'Consulter les conditions'],
  },
  blog: {
    title: 'Blog',
    kicker: 'Ressources',
    paragraphs: ['Le blog regroupe les contenus editoriaux et guides Kendronics. La recuperation dynamique des articles sera la prochaine etape native.'],
    bullets: ['PCB', 'Prototypage', 'Design hardware', 'Production'],
  },
  terms: {
    title: 'Documents legaux',
    kicker: 'Conformite',
    paragraphs: ['Index natif des documents juridiques disponibles sur le site.'],
    bullets: ['CGV', 'CGU', 'Mentions legales', 'Confidentialite', 'Cookies'],
  },
  cgv: {
    title: 'Conditions generales de vente',
    kicker: 'Vente',
    paragraphs: ['Les CGV encadrent les devis, commandes, paiements, fabrication, livraison, annulations et responsabilites.'],
    bullets: ['Commande', 'Paiement', 'Production', 'Livraison', 'Reclamation'],
  },
  cgu: {
    title: 'Conditions generales utilisation',
    kicker: 'Utilisation',
    paragraphs: ['Les CGU encadrent les comptes, publications, marketplace, droits utilisateurs et usages interdits.'],
    bullets: ['Compte', 'Explorer', 'Marketplace', 'Droits et devoirs', 'Suspension'],
  },
  legalNotice: {
    title: 'Mentions legales',
    kicker: 'Identification',
    paragraphs: ['Cette page presente les informations legales, responsabilites, hebergement et moyens de contact.'],
    bullets: ['Editeur', 'Hebergement', 'Contact', 'Responsabilite'],
  },
  privacyPolicy: {
    title: 'Politique confidentialite',
    kicker: 'Donnees personnelles',
    paragraphs: ['La politique explique les donnees collectees, finalites, durees, droits et securite.'],
    bullets: ['Compte', 'Commandes', 'Paiements', 'Support', 'Droits utilisateur'],
  },
  cookiePolicy: {
    title: 'Politique cookies',
    kicker: 'Consentement',
    paragraphs: ['La politique cookies decrit les cookies necessaires, mesure, preferences et choix utilisateur.'],
    bullets: ['Necessaires', 'Preferences', 'Mesure', 'Gestion du consentement'],
  },
  privacy: {
    title: 'Privacy',
    kicker: 'Page historique',
    paragraphs: ['Version courte historique de la confidentialite. La politique principale reste la page confidentialite complete.'],
    bullets: ['Donnees', 'Securite', 'Droits'],
  },
  oldCookiePolicy: {
    title: 'Cookie policy',
    kicker: 'Page historique',
    paragraphs: ['Version courte historique de la politique cookies. La politique principale reste la page cookies complete.'],
    bullets: ['Cookies essentiels', 'Consentement', 'Preferences'],
  },
  refundPolicy: {
    title: 'Politique remboursement',
    kicker: 'Remboursements',
    paragraphs: ['Cette politique encadre les remboursements, erreurs de commande, annulations et cas de production deja lancee.'],
    bullets: ['Avant production', 'Apres production', 'Erreur fichier', 'Support et delais'],
  },
};

export default function App() {
  const [nav, setNav] = useState<NavigationState>({ route: 'explorer' });
  const [sessionReady, setSessionReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const refreshProfile = useCallback(async () => {
    const session = await readSession();
    setSignedIn(Boolean(session));
    if (!session) {
      setProfile(null);
      return;
    }
    try {
      setProfile(await loadMe());
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    void refreshProfile().finally(() => setSessionReady(true));
  }, [refreshProfile]);

  const navigate: Navigate = (next) => setNav(next);

  if (!sessionReady) return <CenteredLoader label="Ouverture de Kendronics" />;

  return (
    <SafeAreaView style={styles.shell}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable onPress={() => navigate({ route: 'menu' })} style={styles.iconButton}>
          <Ionicons name="menu" size={24} color="#0b1724" />
        </Pressable>
        <Pressable onPress={() => navigate({ route: 'home' })}>
          <Text style={styles.logo}>Kendronics</Text>
        </Pressable>
        <View style={styles.headerActions}>
          <Pressable onPress={() => navigate({ route: signedIn ? 'profile' : 'login' })}>
            <Ionicons name="notifications" size={21} color="#0f8f6b" />
          </Pressable>
          <Pressable onPress={() => navigate({ route: signedIn ? 'profile' : 'login' })} style={styles.avatar}>
            {profile?.avatarDataUrl ? <Image source={{ uri: profile.avatarDataUrl }} style={styles.avatarImage} /> : <Text style={styles.avatarText}>{initials(profile?.fullName)}</Text>}
          </Pressable>
        </View>
      </View>

      <View style={styles.content}>
        <CurrentScreen nav={nav} navigate={navigate} signedIn={signedIn} profile={profile} refreshProfile={refreshProfile} />
      </View>

      <MobileDock active={nav.route} onChange={(route) => navigate({ route })} />
    </SafeAreaView>
  );
}

function CurrentScreen({ nav, navigate, signedIn, profile, refreshProfile }: { nav: NavigationState; navigate: Navigate; signedIn: boolean; profile: UserProfile | null; refreshProfile: () => Promise<void> }) {
  if (nav.route === 'home') return <HomeScreen signedIn={signedIn} navigate={navigate} />;
  if (nav.route === 'quote') return <QuoteScreen />;
  if (nav.route === 'orders') return signedIn ? <OrdersScreen navigate={navigate} /> : <LoginScreen mode="login" onSignedIn={async () => { await refreshProfile(); navigate({ route: 'orders' }); }} navigate={navigate} />;
  if (nav.route === 'orderDetail') return signedIn && nav.orderId ? <OrderDetailScreen orderId={nav.orderId} /> : <AuthGate navigate={navigate} />;
  if (nav.route === 'tracking') return <TrackingScreen />;
  if (nav.route === 'explorer') return <ExplorerScreen signedIn={signedIn} navigate={navigate} />;
  if (nav.route === 'projectDetail') return nav.projectId ? <ProjectDetailScreen projectId={nav.projectId} signedIn={signedIn} navigate={navigate} /> : <EmptyState title="Projet introuvable" body="Aucun identifiant projet fourni." />;
  if (nav.route === 'projectNew') return signedIn ? <ProjectEditorScreen /> : <LoginScreen mode="login" onSignedIn={async () => { await refreshProfile(); navigate({ route: 'projectNew' }); }} navigate={navigate} />;
  if (nav.route === 'profile') return signedIn ? <ProfileScreen profile={profile} navigate={navigate} onLogout={async () => { await clearSession(); await refreshProfile(); navigate({ route: 'explorer' }); }} /> : <LoginScreen mode="login" onSignedIn={async () => { await refreshProfile(); navigate({ route: 'profile' }); }} navigate={navigate} />;
  if (nav.route === 'publicProfile') return nav.userId ? <PublicProfileScreen userId={nav.userId} signedIn={signedIn} navigate={navigate} /> : <EmptyState title="Profil introuvable" body="Aucun auteur selectionne." />;
  if (nav.route === 'login') return <LoginScreen mode="login" onSignedIn={async () => { await refreshProfile(); navigate({ route: 'profile' }); }} navigate={navigate} />;
  if (nav.route === 'register') return <LoginScreen mode="register" onSignedIn={async () => { await refreshProfile(); navigate({ route: 'profile' }); }} navigate={navigate} />;
  if (nav.route === 'resetPassword') return <ResetPasswordScreen />;
  if (nav.route === 'admin') return <AdminScreen />;
  if (nav.route === 'contact') return <ContactScreen />;
  if (nav.route === 'menu') return <AllPagesScreen navigate={navigate} signedIn={signedIn} />;
  return <ContentPage route={nav.route} navigate={navigate} />;
}

function HomeScreen({ signedIn, navigate }: { signedIn: boolean; navigate: Navigate }) {
  const [recent, setRecent] = useState<RecentProductionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadRecentProduction().then(setRecent).catch(() => setRecent([])).finally(() => setLoading(false));
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.heroBlock}>
        <Text style={styles.heroKicker}>PCB, PCBA et projets electroniques</Text>
        <Text style={styles.heroTitle}>Tout le parcours Kendronics dans l'app native.</Text>
        <Text style={styles.heroText}>Compte, devis, commandes, Explorer, support et suivi utilisent les memes API que le site.</Text>
        <View style={styles.actionRow}>
          <PrimaryAction label="Devis PCB" onPress={() => navigate({ route: 'quote' })} />
          <SecondaryAction label="Explorer" onPress={() => navigate({ route: 'explorer' })} />
        </View>
      </View>
      <View style={styles.section}>
        <SectionTitle title="Parcours rapide" />
        {[
          ['quote', 'Configurer un devis reel'],
          ['projectNew', 'Publier un projet ou un post'],
          ['orders', 'Suivre mes commandes'],
          [signedIn ? 'profile' : 'login', signedIn ? 'Ouvrir mon compte' : 'Se connecter'],
        ].map(([route, label]) => (
          <Pressable key={label} onPress={() => navigate({ route: route as RouteKey })} style={styles.linkRow}>
            <Text style={styles.rowTitle}>{label}</Text>
            <Ionicons name="chevron-forward" size={18} color="#8091a7" />
          </Pressable>
        ))}
      </View>
      <View style={styles.section}>
        <SectionTitle title="Activite production" />
        {loading ? <ActivityIndicator color="#0f8f6b" /> : recent.length === 0 ? <Text style={styles.mutedText}>Aucune activite recente disponible.</Text> : recent.map((item) => (
          <View key={`${item.reference}-${item.date}`} style={styles.productionRow}>
            <View><Text style={styles.rowTitle}>{item.reference}</Text><Text style={styles.mutedText}>{item.service} - {item.region}</Text></View>
            <Text style={styles.badge}>{item.progress}%</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function ExplorerScreen({ signedIn, navigate }: { signedIn: boolean; navigate: Navigate }) {
  const [projects, setProjects] = useState<ExplorerProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => setProjects(await loadExplorerProjects()), []);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  async function refresh() {
    setRefreshing(true);
    await load().catch(() => undefined);
    setRefreshing(false);
  }

  async function like(project: ExplorerProject) {
    if (!signedIn) return;
    const result = await toggleProjectLike(project.id);
    setLikedIds((current) => {
      const next = new Set(current);
      result.liked ? next.add(project.id) : next.delete(project.id);
      return next;
    });
    setProjects((current) => current.map((item) => item.id === project.id ? { ...item, likesCount: result.likesCount } : item));
  }

  if (loading) return <CenteredLoader label="Chargement Explorer" />;

  return (
    <FlatList
      data={projects}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#0f8f6b" />}
      contentContainerStyle={styles.feed}
      ListHeaderComponent={<ExplorerToolbar navigate={navigate} />}
      renderItem={({ item }) => (
        <ProjectCard
          project={item}
          liked={likedIds.has(item.id)}
          onLike={() => void like(item)}
          onOpen={() => navigate({ route: 'projectDetail', projectId: item.id })}
          onAuthor={() => item.userId ? navigate({ route: 'publicProfile', userId: item.userId }) : undefined}
        />
      )}
      ListEmptyComponent={<EmptyState title="Explorer" body="Aucune publication publique disponible pour le moment." />}
    />
  );
}

function ExplorerToolbar({ navigate }: { navigate: Navigate }) {
  return (
    <View style={styles.toolbar}>
      <Pressable onPress={() => navigate({ route: 'projectNew' })} style={styles.toolbarButtonActive}><Ionicons name="add" size={22} color="#fff" /></Pressable>
      <Pressable onPress={() => navigate({ route: 'explorer' })} style={styles.toolbarButton}><Ionicons name="play-circle-outline" size={22} color="#0b1724" /></Pressable>
      <Pressable onPress={() => navigate({ route: 'explorer' })} style={styles.toolbarButton}><Ionicons name="git-branch-outline" size={22} color="#0b1724" /></Pressable>
      <Pressable onPress={() => navigate({ route: 'explorer' })} style={styles.toolbarButton}><Ionicons name="people-outline" size={22} color="#0b1724" /></Pressable>
    </View>
  );
}

function ProjectCard({ project, liked, onLike, onOpen, onAuthor }: { project: ExplorerProject; liked: boolean; onLike: () => void; onOpen: () => void; onAuthor?: () => void }) {
  const image = mediaUrl(project.thumbnailUrl || project.imageUrl);
  const isVideo = project.mediaKind === 'video' || project.mediaMimeType?.startsWith('video/');
  return (
    <View style={styles.projectCard}>
      <Pressable onPress={onAuthor} style={styles.authorRow}>
        <Avatar uri={project.authorAvatarUrl} label={project.authorName} size={36} />
        <View style={styles.authorText}>
          <View style={styles.nameLine}>
            <Text numberOfLines={1} style={styles.authorName}>{project.authorName}</Text>
            <Ionicons name="checkmark-circle" size={16} color="#94a3b8" />
          </View>
          <Text style={styles.badge}>{project.authorBadgeLabel || badgeLabel(project.authorVerificationLevel ?? 0)}</Text>
        </View>
      </Pressable>
      <Pressable onPress={onOpen}>
        <View style={styles.mediaFrame}>
          {image ? <Image source={{ uri: image }} style={styles.media} /> : <View style={styles.mediaFallback}><Ionicons name={isVideo ? 'play-circle' : 'image'} size={40} color="#8aa0b5" /></View>}
        </View>
        <Text style={styles.projectTitle}>{project.title}</Text>
        <Text numberOfLines={2} style={styles.projectSummary}>{project.summary}</Text>
      </Pressable>
      <View style={styles.metrics}>
        <Metric icon="eye-outline" value={project.viewsCount} />
        <Pressable onPress={onLike} style={styles.metricButton}><Ionicons name={liked ? 'thumbs-up' : 'thumbs-up-outline'} size={16} color={liked ? '#0f8f6b' : '#8091a7'} /><Text style={styles.metricText}>{project.likesCount}</Text></Pressable>
        <Metric icon="star-outline" value={project.favoritesCount} />
        <Metric icon="chatbubble-outline" value={project.commentsCount} />
      </View>
    </View>
  );
}

function ProjectDetailScreen({ projectId, signedIn, navigate }: { projectId: string; signedIn: boolean; navigate: Navigate }) {
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    void loadProjectDetail(projectId).then(setProject).catch((error) => setStatus(messageOf(error))).finally(() => setLoading(false));
  }, [projectId]);

  async function favorite() {
    if (!signedIn) return setStatus('Connectez-vous pour ajouter aux favoris.');
    const result = await toggleProjectFavorite(projectId);
    setProject((current) => current ? { ...current, favoritesCount: result.favoritesCount } : current);
  }

  async function sendComment() {
    if (!comment.trim()) return;
    await createProjectComment(projectId, comment.trim());
    setComment('');
    setStatus('Commentaire publie.');
  }

  if (loading) return <CenteredLoader label="Ouverture projet" />;
  if (!project) return <EmptyState title="Projet indisponible" body={status || 'Le projet est introuvable.'} />;

  const image = mediaUrl(project.thumbnailUrl || project.imageUrl);
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Pressable onPress={() => project.userId && navigate({ route: 'publicProfile', userId: project.userId })} style={styles.authorRowPlain}>
        <Avatar uri={project.authorAvatarUrl} label={project.authorName} size={42} />
        <View style={styles.authorText}>
          <View style={styles.nameLine}>
            <Text style={styles.authorName}>{project.authorName}</Text>
            <Ionicons name="checkmark-circle" size={17} color="#94a3b8" />
          </View>
          <Text style={styles.badge}>{project.authorBadgeLabel || badgeLabel(project.authorVerificationLevel ?? 0)}</Text>
        </View>
      </Pressable>
      <View style={styles.mediaFrame}>{image ? <Image source={{ uri: image }} style={styles.media} /> : <View style={styles.mediaFallback}><Ionicons name="image" size={42} color="#8aa0b5" /></View>}</View>
      <Text style={styles.detailTitle}>{project.title}</Text>
      <Text style={styles.detailBody}>{project.description || project.summary}</Text>
      <View style={styles.metrics}>
        <Metric icon="eye-outline" value={project.viewsCount} />
        <Metric icon="thumbs-up-outline" value={project.likesCount} />
        <Pressable onPress={favorite} style={styles.metricButton}><Ionicons name="star-outline" size={16} color="#8091a7" /><Text style={styles.metricText}>{project.favoritesCount}</Text></Pressable>
        <Metric icon="chatbubble-outline" value={project.commentsCount} />
      </View>
      {project.projectType === 'paid' ? <PrimaryAction label="Fork / acheter l'acces" onPress={() => setStatus('Paiement projet: branchement checkout natif a finaliser.')} /> : null}
      <View style={styles.section}>
        <SectionTitle title="Fichiers publics" />
        {project.assets?.length ? project.assets.map((asset) => <Text key={asset.id} style={styles.rowText}>{asset.originalName} - {asset.kind}</Text>) : <Text style={styles.mutedText}>Aucun fichier public disponible.</Text>}
      </View>
      <View style={styles.section}>
        <SectionTitle title="Commenter" />
        <TextInput value={comment} onChangeText={setComment} placeholder="Votre commentaire" style={styles.input} />
        <PrimaryAction label="Publier" onPress={() => void sendComment()} />
      </View>
      {status ? <Text style={styles.statusText}>{status}</Text> : null}
    </ScrollView>
  );
}

function PublicProfileScreen({ userId, signedIn, navigate }: { userId: string; signedIn: boolean; navigate: Navigate }) {
  const [profile, setProfile] = useState<PublicAuthorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => {
    void loadPublicAuthorProfile(userId).then(setProfile).catch((error) => setStatus(messageOf(error))).finally(() => setLoading(false));
  }, [userId]);

  async function follow() {
    if (!signedIn) return setStatus('Connectez-vous pour suivre cet auteur.');
    const result = await followUser(userId);
    setProfile((current) => current ? { ...current, isFollowing: result.following, followersCount: result.followersCount ?? current.followersCount } : current);
  }

  if (loading) return <CenteredLoader label="Ouverture profil" />;
  if (!profile) return <EmptyState title="Profil indisponible" body={status || 'Auteur introuvable.'} />;

  return (
    <ScrollView contentContainerStyle={styles.page}>
      {profile.bannerDataUrl ? <Image source={{ uri: profile.bannerDataUrl }} style={styles.banner} /> : <View style={styles.bannerFallback} />}
      <View style={styles.publicProfileHead}>
        <Avatar uri={profile.avatarDataUrl || undefined} label={profile.fullName} size={74} />
        <View style={styles.authorText}>
          <View style={styles.nameLine}>
            <Text style={styles.profileName}>{profile.fullName}</Text>
            <Ionicons name="checkmark-circle" size={18} color="#94a3b8" />
          </View>
          <Text style={styles.badge}>{profile.badgeLabel || badgeLabel(profile.verificationLevel ?? 0)}</Text>
          <Pressable onPress={follow}><Text style={styles.followText}>{profile.isFollowing ? 'Unfollow' : 'Follow'}</Text></Pressable>
        </View>
      </View>
      <Stats values={[['Suivi', profile.followingCount ?? 0], ['Abonnes', profile.followersCount ?? 0], ['Likes', profile.likesCount ?? 0], ['Note', '4,3']]} />
      {profile.publicBio ? <Text style={styles.detailBody}>{profile.publicBio}</Text> : null}
      <View style={styles.section}>
        <SectionTitle title="Reels et forks" />
        {profile.projects?.length ? profile.projects.map((project) => <CompactProject key={project.id} project={project} onPress={() => navigate({ route: 'projectDetail', projectId: project.id })} />) : <Text style={styles.mutedText}>Aucun projet public.</Text>}
      </View>
      {status ? <Text style={styles.statusText}>{status}</Text> : null}
    </ScrollView>
  );
}

function OrdersScreen({ navigate }: { navigate: Navigate }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadOrders().then(setOrders).catch(() => setOrders([])).finally(() => setLoading(false));
  }, []);

  if (loading) return <CenteredLoader label="Chargement commandes" />;
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <SectionTitle title="Panier et commandes" />
      {orders.length === 0 ? <EmptyState title="Aucune commande" body="Les commandes creees depuis le site ou l'app apparaitront ici." /> : orders.map((order) => (
        <Pressable key={order.id} onPress={() => navigate({ route: 'orderDetail', orderId: order.id })} style={styles.listCard}>
          <Text style={styles.rowTitle}>Commande {order.orderNumber}</Text>
          <Text style={styles.mutedText}>{order.status} - {order.destinationCountryIso2}</Text>
          {order.quoteSnapshot ? <Text style={styles.rowText}>{order.quoteSnapshot.quantity} PCB - {order.quoteSnapshot.layers} couches - {order.quoteSnapshot.lengthMm} x {order.quoteSnapshot.widthMm} mm</Text> : null}
          <Text style={styles.priceText}>{formatMoney(order.totalPrice ?? order.quoteSnapshot?.finalTotal, order.currency ?? order.quoteSnapshot?.currency)}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function OrderDetailScreen({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => {
    void loadOrderDetail(orderId).then(setOrder).catch((error) => setStatus(messageOf(error))).finally(() => setLoading(false));
  }, [orderId]);

  if (loading) return <CenteredLoader label="Ouverture commande" />;
  if (!order) return <EmptyState title="Commande indisponible" body={status || 'Commande introuvable.'} />;

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.detailTitle}>Commande {order.orderNumber}</Text>
      <Text style={styles.badge}>{order.status}</Text>
      <Text style={styles.priceText}>{formatMoney(order.totalPrice ?? order.quoteSnapshot?.finalTotal, order.currency ?? order.quoteSnapshot?.currency)}</Text>
      {order.quoteSnapshot ? <InfoBlock title="Configuration" rows={[`${order.quoteSnapshot.quantity} PCB`, `${order.quoteSnapshot.layers} couches`, `${order.quoteSnapshot.lengthMm} x ${order.quoteSnapshot.widthMm} mm`, order.destinationCountryIso2]} /> : null}
      <InfoBlock title="Actions" rows={['Suivi production', 'Modification quantite', 'Paiement et facture restent branches par API web et seront detailles en natif.']} />
    </ScrollView>
  );
}

function QuoteScreen() {
  const [layers, setLayers] = useState('2');
  const [quantity, setQuantity] = useState('5');
  const [lengthMm, setLengthMm] = useState('100');
  const [widthMm, setWidthMm] = useState('80');
  const [preview, setPreview] = useState<QuotePreview | null>(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  async function runPreview() {
    setLoading(true);
    setStatus('');
    try {
      setPreview(await previewQuote({
        productType: 'standard_pcb',
        layers: Number(layers),
        lengthMm: Number(lengthMm),
        widthMm: Number(widthMm),
        quantity: Number(quantity),
        destinationCountryIso2: 'CM',
        shippingMode: 'standard',
      }));
    } catch (error) {
      setStatus(messageOf(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <SectionTitle title="Devis PCB" />
      <Text style={styles.mutedText}>Calcul branche sur /api/pricing/preview. L'upload Gerber natif complet sera l'etape suivante.</Text>
      <View style={styles.formGrid}>
        <LabeledInput label="Couches" value={layers} onChangeText={setLayers} keyboardType="number-pad" />
        <LabeledInput label="Quantite" value={quantity} onChangeText={setQuantity} keyboardType="number-pad" />
        <LabeledInput label="Longueur mm" value={lengthMm} onChangeText={setLengthMm} keyboardType="decimal-pad" />
        <LabeledInput label="Largeur mm" value={widthMm} onChangeText={setWidthMm} keyboardType="decimal-pad" />
      </View>
      {status ? <Text style={styles.errorText}>{status}</Text> : null}
      <PrimaryAction label={loading ? 'Calcul...' : 'Calculer le devis'} disabled={loading} onPress={() => void runPreview()} />
      {preview ? (
        <View style={styles.quoteResult}>
          <Text style={styles.resultLabel}>Prix estime</Text>
          <Text style={styles.resultPrice}>{formatMoney(preview.finalTotal, preview.currency)}</Text>
          <Text style={styles.mutedText}>{preview.quantity} PCB - {preview.layers} couches - {preview.lengthMm} x {preview.widthMm} mm</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

function TrackingScreen() {
  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [tracking, setTracking] = useState<TrackingTimeline | null>(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  async function lookup() {
    setLoading(true);
    setStatus('');
    try {
      setTracking(await lookupTracking(orderId.trim(), email.trim()));
    } catch (error) {
      setStatus(messageOf(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <SectionTitle title="Suivi commande" />
      <TextInput value={orderId} onChangeText={setOrderId} placeholder="Reference commande" style={styles.input} />
      <TextInput value={email} onChangeText={setEmail} placeholder="Email de commande" keyboardType="email-address" autoCapitalize="none" style={styles.input} />
      <PrimaryAction label={loading ? 'Recherche...' : 'Rechercher'} disabled={loading || !orderId || !email} onPress={() => void lookup()} />
      {status ? <Text style={styles.errorText}>{status}</Text> : null}
      {tracking ? <InfoBlock title={tracking.orderNumber || tracking.orderId || 'Suivi'} rows={[tracking.status || 'Statut indisponible', ...(tracking.events || []).map((event) => event.label || event.description || event.status || 'Evenement')]} /> : null}
    </ScrollView>
  );
}

function ProjectEditorScreen() {
  const [projectType, setProjectType] = useState<'free' | 'paid'>('free');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Education');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  async function publish() {
    setLoading(true);
    setStatus('');
    try {
      const draft = await createProjectDraft(projectType);
      const updated = await updateProject(draft.id, {
        title,
        category,
        summary,
        description,
        projectType,
        repositoryUrl: repositoryUrl || undefined,
        priceCents: projectType === 'paid' ? Math.max(100, Math.round(Number(price || '0') * 100)) : undefined,
        currency: projectType === 'paid' ? 'EUR' : undefined,
      });
      await publishProject(updated.id);
      setStatus('Projet publie dans Explorer.');
    } catch (error) {
      setStatus(messageOf(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <SectionTitle title="Creer un projet" />
      <View style={styles.segment}>
        <Pressable onPress={() => setProjectType('free')} style={[styles.segmentButton, projectType === 'free' && styles.segmentActive]}><Text style={styles.segmentText}>Post gratuit</Text></Pressable>
        <Pressable onPress={() => setProjectType('paid')} style={[styles.segmentButton, projectType === 'paid' && styles.segmentActive]}><Text style={styles.segmentText}>Projet payant</Text></Pressable>
      </View>
      <TextInput value={title} onChangeText={setTitle} placeholder="Titre de la publication" style={styles.input} />
      <TextInput value={category} onChangeText={setCategory} placeholder="Categorie" style={styles.input} />
      <TextInput value={summary} onChangeText={setSummary} placeholder="Resume public" style={styles.input} />
      <TextInput value={description} onChangeText={setDescription} placeholder="Description complete" multiline style={[styles.input, styles.textArea]} />
      <TextInput value={repositoryUrl} onChangeText={setRepositoryUrl} placeholder="Lien document externe" autoCapitalize="none" style={styles.input} />
      {projectType === 'paid' ? <TextInput value={price} onChangeText={setPrice} placeholder="Prix EUR" keyboardType="decimal-pad" style={styles.input} /> : null}
      <Text style={styles.mutedText}>Les medias natifs image/video et fichiers Gerber seront branches avec le module upload mobile dedie.</Text>
      <PrimaryAction label={loading ? 'Publication...' : 'Publier'} disabled={loading || title.length < 4 || summary.length < 24} onPress={() => void publish()} />
      {status ? <Text style={status.includes('publie') ? styles.statusText : styles.errorText}>{status}</Text> : null}
    </ScrollView>
  );
}

function ProfileScreen({ profile, navigate, onLogout }: { profile: UserProfile | null; navigate: Navigate; onLogout: () => void }) {
  const [projects, setProjects] = useState<ExplorerProject[]>([]);
  const [favorites, setFavorites] = useState<ExplorerProject[]>([]);
  const [purchasesCount, setPurchasesCount] = useState(0);
  const [notifications, setNotifications] = useState<Array<{ id: string; title?: string; body?: string }>>([]);

  useEffect(() => {
    void Promise.all([
      loadMyProjects().catch(() => []),
      loadMyFavorites().catch(() => []),
      loadMyPurchases().catch(() => []),
      loadNotifications().catch(() => []),
    ]).then(([nextProjects, nextFavorites, nextPurchases, nextNotifications]) => {
      setProjects(nextProjects);
      setFavorites(nextFavorites);
      setPurchasesCount(nextPurchases.length);
      setNotifications(nextNotifications);
    });
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.profileScreen}>
      <View style={styles.profileHero}>
        <Avatar uri={profile?.avatarDataUrl || undefined} label={profile?.fullName} size={76} />
        <View style={styles.profileInfo}>
          <View style={styles.nameLine}>
            <Text style={styles.profileName}>{profile?.fullName || 'Compte Kendronics'}</Text>
            <Ionicons name="checkmark-circle" size={18} color="#94a3b8" />
          </View>
          <Text style={styles.badge}>{badgeLabel(profile?.verificationLevel ?? 0)}</Text>
          <Text style={styles.profileEmail}>{profile?.email}</Text>
        </View>
      </View>
      <Stats values={[['Suivi', '-'], ['Abonnes', '-'], ['Likes', projects.reduce((total, project) => total + project.likesCount, 0)], ['Note', '4,3']]} />
      <View style={styles.section}>
        <SectionTitle title="Mon espace" />
        <View style={styles.profileGrid}>
          <MiniCounter label="Projets" value={projects.length} />
          <MiniCounter label="Favoris" value={favorites.length} />
          <MiniCounter label="Achats" value={purchasesCount} />
          <MiniCounter label="Notifs" value={notifications.length} />
        </View>
      </View>
      <View style={styles.section}>
        <SectionTitle title="Mes projets" />
        {projects.length === 0 ? <Text style={styles.mutedText}>Aucun projet public pour le moment.</Text> : projects.map((project) => <CompactProject key={project.id} project={project} onPress={() => navigate({ route: 'projectDetail', projectId: project.id })} />)}
      </View>
      <SecondaryAction label="Se deconnecter" onPress={onLogout} />
    </ScrollView>
  );
}

function LoginScreen({ mode, onSignedIn, navigate }: { mode: 'login' | 'register'; onSignedIn: () => void; navigate: Navigate }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('CM');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setStatus('');
    try {
      if (mode === 'register') await registerAccount({ fullName, email, password, country, username: username || email.split('@')[0] || fullName });
      else await login(email.trim(), password);
      onSignedIn();
    } catch (error) {
      setStatus(messageOf(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.authPanel} keyboardShouldPersistTaps="handled">
      <Text style={styles.authTitle}>{mode === 'register' ? 'Inscription' : 'Connexion'}</Text>
      <Text style={styles.authText}>Utilisez le meme compte que sur kendronics.com.</Text>
      {mode === 'register' ? <TextInput value={fullName} onChangeText={setFullName} placeholder="Nom complet" style={styles.input} /> : null}
      {mode === 'register' ? <TextInput value={username} onChangeText={setUsername} placeholder="Nom utilisateur" autoCapitalize="none" style={styles.input} /> : null}
      {mode === 'register' ? <TextInput value={country} onChangeText={setCountry} placeholder="Pays" style={styles.input} /> : null}
      <TextInput value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" keyboardType="email-address" style={styles.input} />
      <TextInput value={password} onChangeText={setPassword} placeholder="Mot de passe" secureTextEntry style={styles.input} />
      {status ? <Text style={styles.errorText}>{status}</Text> : null}
      <PrimaryAction label={loading ? 'Chargement...' : mode === 'register' ? 'Creer mon compte' : 'Se connecter'} disabled={loading || !email || !password} onPress={() => void submit()} />
      <SecondaryAction label={mode === 'register' ? 'J ai deja un compte' : 'Creer un compte'} onPress={() => navigate({ route: mode === 'register' ? 'login' : 'register' })} />
      <Pressable onPress={() => navigate({ route: 'resetPassword' })}><Text style={styles.followText}>Mot de passe oublie</Text></Pressable>
    </ScrollView>
  );
}

function ResetPasswordScreen() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');

  async function requestReset() {
    try {
      await requestPasswordReset(email.trim());
      setStatus('Si le compte existe, un lien de reset a ete envoye.');
    } catch (error) {
      setStatus(messageOf(error));
    }
  }

  async function confirmReset() {
    try {
      await resetPassword(token.trim(), password);
      setStatus('Mot de passe mis a jour.');
    } catch (error) {
      setStatus(messageOf(error));
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <SectionTitle title="Reinitialiser le mot de passe" />
      <TextInput value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" autoCapitalize="none" style={styles.input} />
      <PrimaryAction label="Demander le lien" onPress={() => void requestReset()} />
      <TextInput value={token} onChangeText={setToken} placeholder="Token recu" autoCapitalize="none" style={styles.input} />
      <TextInput value={password} onChangeText={setPassword} placeholder="Nouveau mot de passe" secureTextEntry style={styles.input} />
      <SecondaryAction label="Confirmer" onPress={() => void confirmReset()} />
      {status ? <Text style={styles.statusText}>{status}</Text> : null}
    </ScrollView>
  );
}

function ContactScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  async function submit() {
    try {
      await sendPublicContact({ name, email, message, category: 'technical_question' });
      setStatus('Message envoye au support.');
      setMessage('');
    } catch (error) {
      setStatus(messageOf(error));
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <SectionTitle title="Contact" />
      <TextInput value={name} onChangeText={setName} placeholder="Nom" style={styles.input} />
      <TextInput value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" autoCapitalize="none" style={styles.input} />
      <TextInput value={message} onChangeText={setMessage} placeholder="Message" multiline style={[styles.input, styles.textArea]} />
      <PrimaryAction label="Envoyer" onPress={() => void submit()} />
      {status ? <Text style={styles.statusText}>{status}</Text> : null}
    </ScrollView>
  );
}

function AdminScreen() {
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <SectionTitle title="Admin" />
      <Text style={styles.detailBody}>Le backend admin existe deja : commandes, prix, support, audits, admins et workflow production. L'ecran natif liste les modules et prepare le portage securise avec code admin.</Text>
      {['Dashboard', 'Commandes', 'Prix et fournisseurs', 'Support', 'Admins', 'Audit'].map((item) => <View key={item} style={styles.linkRow}><Text style={styles.rowTitle}>{item}</Text><Ionicons name="shield-checkmark" size={18} color="#0f8f6b" /></View>)}
    </ScrollView>
  );
}

function AllPagesScreen({ navigate, signedIn }: { navigate: Navigate; signedIn: boolean }) {
  return (
    <FlatList
      data={visiblePages}
      keyExtractor={(item) => item.route}
      contentContainerStyle={styles.page}
      ListHeaderComponent={<><SectionTitle title="Toutes les pages" /><Text style={styles.mutedText}>31 pages du site mappees dans l'application native.</Text></>}
      renderItem={({ item }) => (
        <Pressable onPress={() => navigate({ route: item.auth && !signedIn ? 'login' : item.route })} style={styles.pageRow}>
          <Ionicons name={item.icon} size={22} color="#0f8f6b" />
          <View style={styles.authorText}><Text style={styles.rowTitle}>{item.title}</Text><Text style={styles.mutedText}>{item.body}</Text></View>
          <Ionicons name="chevron-forward" size={18} color="#8091a7" />
        </Pressable>
      )}
    />
  );
}

function ContentPage({ route, navigate }: { route: RouteKey; navigate: Navigate }) {
  const content = contentPages[route];
  if (!content) return <AllPagesScreen navigate={navigate} signedIn={false} />;
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.heroKicker}>{content.kicker}</Text>
      <Text style={styles.detailTitle}>{content.title}</Text>
      {content.paragraphs.map((paragraph) => <Text key={paragraph} style={styles.detailBody}>{paragraph}</Text>)}
      <View style={styles.section}>{content.bullets.map((bullet) => <View key={bullet} style={styles.checkRow}><Ionicons name="checkmark-circle" size={18} color="#0f8f6b" /><Text style={styles.rowText}>{bullet}</Text></View>)}</View>
    </ScrollView>
  );
}

function AuthGate({ navigate }: { navigate: Navigate }) {
  return <LoginScreen mode="login" onSignedIn={() => navigate({ route: 'profile' })} navigate={navigate} />;
}

function InfoBlock({ title, rows }: { title: string; rows: string[] }) {
  return <View style={styles.section}><SectionTitle title={title} />{rows.map((row) => <Text key={row} style={styles.rowText}>{row}</Text>)}</View>;
}

function CompactProject({ project, onPress }: { project: ExplorerProject; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.compactProjectRow}>
      <Text numberOfLines={1} style={styles.rowTitle}>{project.title}</Text>
      <Text style={styles.mutedText}>{project.likesCount} likes - {project.commentsCount} commentaires</Text>
    </Pressable>
  );
}

function Stats({ values }: { values: Array<[string, string | number]> }) {
  return <View style={styles.statsRow}>{values.map(([label, value]) => <Stat key={label} label={label} value={String(value)} />)}</View>;
}

function MobileDock({ active, onChange }: { active: RouteKey; onChange: (tab: RouteKey) => void }) {
  const items: Array<{ route: RouteKey; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
    { route: 'home', label: 'Accueil', icon: 'home' },
    { route: 'orders', label: 'Panier', icon: 'cart' },
    { route: 'quote', label: 'Devis', icon: 'receipt' },
    { route: 'explorer', label: 'Explorer', icon: 'compass' },
    { route: 'profile', label: 'Compte', icon: 'person' },
  ];
  return (
    <View style={styles.dock}>
      {items.map((item) => {
        const selected = item.route === active;
        return (
          <Pressable key={item.route} onPress={() => onChange(item.route)} style={styles.dockItem}>
            <Ionicons name={item.icon} size={22} color={selected ? '#0f8f6b' : '#7a8aa0'} />
            <Text style={[styles.dockLabel, selected && styles.dockLabelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function PrimaryAction({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable disabled={disabled} onPress={onPress} style={[styles.primaryButton, disabled && styles.disabled]}><Text style={styles.primaryButtonText}>{label}</Text></Pressable>;
}

function SecondaryAction({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>{label}</Text></Pressable>;
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{body}</Text>
    </View>
  );
}

function LabeledInput({ label, value, onChangeText, keyboardType }: { label: string; value: string; onChangeText: (value: string) => void; keyboardType: 'number-pad' | 'decimal-pad' }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} keyboardType={keyboardType} style={styles.input} />
    </View>
  );
}

function MiniCounter({ label, value }: { label: string; value: number }) {
  return <View style={styles.miniCounter}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

function CenteredLoader({ label }: { label: string }) {
  return (
    <SafeAreaView style={styles.centered}>
      <ActivityIndicator color="#0f8f6b" />
      <Text style={styles.loaderText}>{label}</Text>
    </SafeAreaView>
  );
}

function Metric({ icon, value }: { icon: keyof typeof Ionicons.glyphMap; value: number }) {
  return <View style={styles.metricButton}><Ionicons name={icon} size={16} color="#8091a7" /><Text style={styles.metricText}>{compactNumber(value)}</Text></View>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

function Avatar({ uri, label, size }: { uri?: string | null; label?: string | null; size: number }) {
  return (
    <View style={[styles.avatarGeneric, { width: size, height: size, borderRadius: size / 2 }]}>
      {uri ? <Image source={{ uri }} style={styles.avatarImage} /> : <Text style={styles.avatarText}>{initials(label)}</Text>}
    </View>
  );
}

function initials(value?: string | null) {
  const parts = (value || 'K').trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'K';
}

function badgeLabel(level: number) {
  if (level >= 3) return 'Industriel certifie';
  if (level >= 2) return 'Professionnel certifie';
  if (level >= 1) return 'Compte verifie';
  return 'Nouveau compte';
}

function compactNumber(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)} k`;
  return String(value);
}

function formatMoney(value?: number, currency = 'EUR') {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(value);
}

function messageOf(error: unknown) {
  return error instanceof Error ? error.message : 'Action impossible.';
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: '#f6f8fb' },
  header: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, backgroundColor: '#ffffff', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#d9e2ec' },
  logo: { color: '#0f8f6b', fontSize: 23, fontWeight: '900' },
  iconButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#e7f5f0', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarGeneric: { backgroundColor: '#e7f5f0', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { color: '#0f8f6b', fontWeight: '900' },
  content: { flex: 1 },
  page: { padding: 16, paddingBottom: 96, gap: 16 },
  heroBlock: { backgroundColor: '#ffffff', borderWidth: StyleSheet.hairlineWidth, borderColor: '#dbe4ee', padding: 16 },
  heroKicker: { color: '#0f8f6b', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  heroTitle: { color: '#0b1724', fontSize: 25, lineHeight: 31, fontWeight: '900', marginTop: 8 },
  heroText: { color: '#52627a', fontSize: 14, lineHeight: 21, marginTop: 8 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  section: { backgroundColor: '#ffffff', borderWidth: StyleSheet.hairlineWidth, borderColor: '#dbe4ee', padding: 14, gap: 12 },
  sectionTitle: { color: '#0b1724', fontSize: 18, fontWeight: '900' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  linkRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#e2e8f0', paddingVertical: 8 },
  rowText: { color: '#334155', fontSize: 14, lineHeight: 21 },
  rowTitle: { color: '#0b1724', fontSize: 15, fontWeight: '900' },
  mutedText: { color: '#64748b', fontSize: 13, lineHeight: 20 },
  productionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#e2e8f0', paddingTop: 10 },
  listCard: { backgroundColor: '#ffffff', borderWidth: StyleSheet.hairlineWidth, borderColor: '#dbe4ee', padding: 14, gap: 6 },
  pageRow: { backgroundColor: '#ffffff', borderWidth: StyleSheet.hairlineWidth, borderColor: '#dbe4ee', minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  priceText: { color: '#0f8f6b', fontSize: 16, fontWeight: '900' },
  formGrid: { gap: 12 },
  inputGroup: { gap: 6 },
  inputLabel: { color: '#0b1724', fontSize: 13, fontWeight: '800' },
  input: { minHeight: 48, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#d6e0eb', paddingHorizontal: 14, paddingVertical: 10, color: '#0b1724', fontSize: 15 },
  textArea: { minHeight: 112, textAlignVertical: 'top' },
  quoteResult: { backgroundColor: '#f1faf7', borderWidth: 1, borderColor: '#cfe2dc', padding: 16, gap: 4 },
  resultLabel: { color: '#0f8f6b', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  resultPrice: { color: '#0b1724', fontSize: 28, fontWeight: '900' },
  primaryButton: { minHeight: 46, flex: 1, backgroundColor: '#0f8f6b', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  primaryButtonText: { color: '#ffffff', fontWeight: '900', textAlign: 'center' },
  secondaryButton: { minHeight: 46, flex: 1, borderWidth: 1, borderColor: '#cbd6e2', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  secondaryButtonText: { color: '#0b1724', fontWeight: '800', textAlign: 'center' },
  disabled: { backgroundColor: '#a9c9bf' },
  emptyState: { minHeight: 160, alignItems: 'center', justifyContent: 'center', padding: 18 },
  emptyTitle: { fontSize: 24, fontWeight: '900', color: '#0b1724', textAlign: 'center' },
  emptyText: { marginTop: 8, color: '#64748b', textAlign: 'center', lineHeight: 22 },
  feed: { padding: 12, gap: 18, paddingBottom: 96 },
  toolbar: { height: 54, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  toolbarButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', borderWidth: StyleSheet.hairlineWidth, borderColor: '#dbe4ee' },
  toolbarButtonActive: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f8f6b' },
  projectCard: { backgroundColor: '#ffffff', overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: '#dbe4ee' },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  authorRowPlain: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  authorText: { flex: 1 },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  authorName: { maxWidth: '88%', color: '#0b1724', fontSize: 15, fontWeight: '800' },
  badge: { color: '#0f8f6b', fontSize: 11, fontWeight: '700', marginTop: 2 },
  followText: { color: '#0f8f6b', fontSize: 13, fontWeight: '800', marginTop: 6 },
  mediaFrame: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#e6edf5' },
  media: { width: '100%', height: '100%', resizeMode: 'cover' },
  mediaFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  projectTitle: { color: '#0b1724', fontSize: 18, fontWeight: '800', paddingHorizontal: 12, paddingTop: 12 },
  projectSummary: { color: '#52627a', fontSize: 14, lineHeight: 21, paddingHorizontal: 12, paddingTop: 6 },
  detailTitle: { color: '#0b1724', fontSize: 28, lineHeight: 35, fontWeight: '900' },
  detailBody: { color: '#1f2d3d', fontSize: 16, lineHeight: 26 },
  metrics: { flexDirection: 'row', alignItems: 'center', gap: 18, padding: 12 },
  metricButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metricText: { color: '#8091a7', fontSize: 13, fontWeight: '700' },
  authPanel: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 14 },
  authTitle: { fontSize: 30, fontWeight: '900', color: '#0b1724' },
  authText: { color: '#52627a', fontSize: 14, lineHeight: 22 },
  errorText: { color: '#c2413a', fontWeight: '700' },
  statusText: { color: '#0f8f6b', fontWeight: '800' },
  profileScreen: { padding: 16, paddingBottom: 96, gap: 16 },
  profileHero: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 8 },
  profileInfo: { flex: 1 },
  profileName: { color: '#0b1724', fontSize: 21, fontWeight: '900', maxWidth: '88%' },
  profileEmail: { color: '#64748b', fontSize: 13, marginTop: 6 },
  publicProfileHead: { flexDirection: 'row', alignItems: 'flex-end', gap: 14, marginTop: -34 },
  banner: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#dbe4ee' },
  bannerFallback: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#dbe4ee' },
  statsRow: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#dbe4ee', paddingVertical: 14 },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, color: '#0b1724', fontWeight: '800' },
  statLabel: { color: '#64748b', fontSize: 12, marginTop: 4 },
  profileGrid: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  miniCounter: { minWidth: '45%', flex: 1, alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: '#dbe4ee', paddingVertical: 12 },
  compactProjectRow: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#e2e8f0', paddingTop: 10, gap: 3 },
  segment: { flexDirection: 'row', backgroundColor: '#e7eef6', padding: 3 },
  segmentButton: { flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center' },
  segmentActive: { backgroundColor: '#ffffff' },
  segmentText: { color: '#0b1724', fontWeight: '800' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#f6f8fb' },
  loaderText: { color: '#64748b', fontWeight: '700' },
  dock: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 74, flexDirection: 'row', backgroundColor: '#ffffff', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#d9e2ec', paddingTop: 8 },
  dockItem: { flex: 1, alignItems: 'center', gap: 4 },
  dockLabel: { color: '#7a8aa0', fontSize: 11, fontWeight: '700' },
  dockLabelActive: { color: '#0f8f6b' },
});
