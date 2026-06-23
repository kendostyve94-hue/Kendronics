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
import { clearSession, readSession } from './src/session';
import { loadExplorerProjects, loadMe, login, toggleProjectLike } from './src/api';
import { mediaUrl } from './src/config';
import { ExplorerProject, UserProfile } from './src/types';

type Tab = 'home' | 'cart' | 'quote' | 'explorer' | 'profile';

export default function App() {
  const [tab, setTab] = useState<Tab>('explorer');
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

  if (!sessionReady) {
    return <CenteredLoader label="Ouverture de Kendronics" />;
  }

  return (
    <SafeAreaView style={styles.shell}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.logo}>Kendronics</Text>
        <View style={styles.headerActions}>
          <Ionicons name="notifications" size={21} color="#0f8f6b" />
          <View style={styles.avatar}>{profile?.avatarDataUrl ? <Image source={{ uri: profile.avatarDataUrl }} style={styles.avatarImage} /> : <Text style={styles.avatarText}>{initials(profile?.fullName)}</Text>}</View>
        </View>
      </View>

      <View style={styles.content}>
        {tab === 'home' ? <PlaceholderScreen title="Accueil" body="Le tableau de bord mobile Kendronics arrive ici." /> : null}
        {tab === 'cart' ? <PlaceholderScreen title="Panier" body="Les commandes et achats marketplace seront branches sur le meme compte." /> : null}
        {tab === 'quote' ? <PlaceholderScreen title="Devis" body="La demande de devis PCB sera reprise depuis le moteur du site." /> : null}
        {tab === 'explorer' ? <ExplorerScreen signedIn={signedIn} /> : null}
        {tab === 'profile' ? signedIn ? <ProfileScreen profile={profile} onLogout={async () => { await clearSession(); await refreshProfile(); setTab('explorer'); }} /> : <LoginScreen onSignedIn={async () => { await refreshProfile(); setTab('profile'); }} /> : null}
      </View>

      <MobileDock active={tab} onChange={setTab} />
    </SafeAreaView>
  );
}

function LoginScreen({ onSignedIn }: { onSignedIn: () => void }) {
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setStatus('');
    try {
      await login(contact.trim(), password);
      onSignedIn();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Connexion impossible.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.authPanel} keyboardShouldPersistTaps="handled">
      <Text style={styles.authTitle}>Connexion</Text>
      <Text style={styles.authText}>Utilisez le meme compte que sur kendronics.com.</Text>
      <TextInput value={contact} onChangeText={setContact} placeholder="Email ou telephone" autoCapitalize="none" keyboardType="email-address" style={styles.input} />
      <TextInput value={password} onChangeText={setPassword} placeholder="Mot de passe" secureTextEntry style={styles.input} />
      {status ? <Text style={styles.errorText}>{status}</Text> : null}
      <Pressable disabled={loading || !contact || !password} onPress={submit} style={({ pressed }) => [styles.primaryButton, (pressed || loading) && styles.pressed, (!contact || !password) && styles.disabled]}>
        <Text style={styles.primaryButtonText}>{loading ? 'Connexion...' : 'Se connecter'}</Text>
      </Pressable>
    </ScrollView>
  );
}

function ExplorerScreen({ signedIn }: { signedIn: boolean }) {
  const [projects, setProjects] = useState<ExplorerProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    const payload = await loadExplorerProjects();
    setProjects(payload);
  }, []);

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
      renderItem={({ item }) => <ProjectCard project={item} liked={likedIds.has(item.id)} onLike={() => void like(item)} />}
      ListEmptyComponent={<PlaceholderScreen title="Explorer" body="Aucune publication publique disponible pour le moment." />}
    />
  );
}

function ProjectCard({ project, liked, onLike }: { project: ExplorerProject; liked: boolean; onLike: () => void }) {
  const image = mediaUrl(project.thumbnailUrl || project.imageUrl);
  const isVideo = project.mediaKind === 'video' || project.mediaMimeType?.startsWith('video/');
  return (
    <View style={styles.projectCard}>
      <View style={styles.authorRow}>
        <View style={styles.authorAvatar}>{project.authorAvatarUrl ? <Image source={{ uri: project.authorAvatarUrl }} style={styles.avatarImage} /> : <Text style={styles.avatarText}>{initials(project.authorName)}</Text>}</View>
        <View style={styles.authorText}>
          <View style={styles.nameLine}>
            <Text numberOfLines={1} style={styles.authorName}>{project.authorName}</Text>
            <Ionicons name="checkmark-circle" size={16} color="#94a3b8" />
          </View>
          <Text style={styles.badge}>{project.authorBadgeLabel || 'Nouveau compte'}</Text>
        </View>
      </View>
      <View style={styles.mediaFrame}>
        {image && !isVideo ? <Image source={{ uri: image }} style={styles.media} /> : null}
        {image && isVideo ? <Image source={{ uri: image }} style={styles.media} /> : null}
        {!image ? <View style={styles.mediaFallback}><Ionicons name={isVideo ? 'play-circle' : 'image'} size={40} color="#8aa0b5" /></View> : null}
      </View>
      <Text style={styles.projectTitle}>{project.title}</Text>
      <Text numberOfLines={2} style={styles.projectSummary}>{project.summary}</Text>
      <View style={styles.metrics}>
        <Metric icon="eye-outline" value={project.viewsCount} />
        <Pressable onPress={onLike} style={styles.metricButton}><Ionicons name={liked ? 'thumbs-up' : 'thumbs-up-outline'} size={16} color={liked ? '#0f8f6b' : '#8091a7'} /><Text style={styles.metricText}>{project.likesCount}</Text></Pressable>
        <Metric icon="star-outline" value={project.favoritesCount} />
        <Metric icon="chatbubble-outline" value={project.commentsCount} />
      </View>
    </View>
  );
}

function ProfileScreen({ profile, onLogout }: { profile: UserProfile | null; onLogout: () => void }) {
  const badge = badgeLabel(profile?.verificationLevel ?? 0);
  return (
    <ScrollView contentContainerStyle={styles.profileScreen}>
      <View style={styles.profileHero}>
        <View style={styles.profileAvatar}>{profile?.avatarDataUrl ? <Image source={{ uri: profile.avatarDataUrl }} style={styles.avatarImage} /> : <Text style={styles.profileInitials}>{initials(profile?.fullName)}</Text>}</View>
        <View style={styles.profileInfo}>
          <View style={styles.nameLine}>
            <Text style={styles.profileName}>{profile?.fullName || 'Compte Kendronics'}</Text>
            <Ionicons name="checkmark-circle" size={18} color="#94a3b8" />
          </View>
          <Text style={styles.badge}>{badge}</Text>
          <Text style={styles.profileEmail}>{profile?.email}</Text>
        </View>
      </View>
      <View style={styles.statsRow}>
        <Stat label="Suivi" value="-" />
        <Stat label="Abonnes" value="-" />
        <Stat label="Likes" value="-" />
        <Stat label="Note" value="4,3" />
      </View>
      <Pressable onPress={onLogout} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Se deconnecter</Text></Pressable>
    </ScrollView>
  );
}

function MobileDock({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  const items: Array<{ tab: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
    { tab: 'home', label: 'Accueil', icon: 'home' },
    { tab: 'cart', label: 'Panier', icon: 'cart' },
    { tab: 'quote', label: 'Devis', icon: 'receipt' },
    { tab: 'explorer', label: 'Explorer', icon: 'compass' },
    { tab: 'profile', label: 'Compte', icon: 'person' },
  ];
  return (
    <View style={styles.dock}>
      {items.map((item) => {
        const selected = item.tab === active;
        return (
          <Pressable key={item.tab} onPress={() => onChange(item.tab)} style={styles.dockItem}>
            <Ionicons name={item.icon} size={22} color={selected ? '#0f8f6b' : '#7a8aa0'} />
            <Text style={[styles.dockLabel, selected && styles.dockLabelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function PlaceholderScreen({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderTitle}>{title}</Text>
      <Text style={styles.placeholderText}>{body}</Text>
    </View>
  );
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

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: '#f6f8fb' },
  header: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, backgroundColor: '#ffffff', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#d9e2ec' },
  logo: { color: '#0f8f6b', fontSize: 24, fontWeight: '900' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#e7f5f0', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { color: '#0f8f6b', fontWeight: '900' },
  content: { flex: 1 },
  feed: { padding: 12, gap: 18, paddingBottom: 96 },
  projectCard: { backgroundColor: '#ffffff', borderRadius: 0, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: '#dbe4ee' },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  authorAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#0b1724', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  authorText: { flex: 1 },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  authorName: { maxWidth: '88%', color: '#0b1724', fontSize: 15, fontWeight: '800' },
  badge: { color: '#0f8f6b', fontSize: 11, fontWeight: '700', marginTop: 2 },
  mediaFrame: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#e6edf5' },
  media: { width: '100%', height: '100%', resizeMode: 'cover' },
  mediaFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  projectTitle: { color: '#0b1724', fontSize: 18, fontWeight: '800', paddingHorizontal: 12, paddingTop: 12 },
  projectSummary: { color: '#52627a', fontSize: 14, lineHeight: 21, paddingHorizontal: 12, paddingTop: 6 },
  metrics: { flexDirection: 'row', alignItems: 'center', gap: 18, padding: 12 },
  metricButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metricText: { color: '#8091a7', fontSize: 13, fontWeight: '700' },
  authPanel: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 14 },
  authTitle: { fontSize: 30, fontWeight: '900', color: '#0b1724' },
  authText: { color: '#52627a', fontSize: 14, lineHeight: 22 },
  input: { height: 48, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#d6e0eb', paddingHorizontal: 14, color: '#0b1724', fontSize: 15 },
  primaryButton: { height: 48, backgroundColor: '#0f8f6b', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  primaryButtonText: { color: '#ffffff', fontWeight: '900' },
  secondaryButton: { height: 46, borderWidth: 1, borderColor: '#cbd6e2', alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  secondaryButtonText: { color: '#0b1724', fontWeight: '800' },
  pressed: { opacity: 0.78 },
  disabled: { backgroundColor: '#a9c9bf' },
  errorText: { color: '#c2413a', fontWeight: '700' },
  profileScreen: { padding: 16, paddingBottom: 96 },
  profileHero: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16 },
  profileAvatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: '#e7f5f0', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  profileInitials: { color: '#0f8f6b', fontSize: 24, fontWeight: '900' },
  profileInfo: { flex: 1 },
  profileName: { color: '#0b1724', fontSize: 21, fontWeight: '900', maxWidth: '88%' },
  profileEmail: { color: '#64748b', fontSize: 13, marginTop: 6 },
  statsRow: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#dbe4ee', paddingVertical: 14 },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, color: '#0b1724', fontWeight: '800' },
  statLabel: { color: '#64748b', fontSize: 12, marginTop: 4 },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  placeholderTitle: { fontSize: 24, fontWeight: '900', color: '#0b1724' },
  placeholderText: { marginTop: 8, color: '#64748b', textAlign: 'center', lineHeight: 22 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#f6f8fb' },
  loaderText: { color: '#64748b', fontWeight: '700' },
  dock: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 74, flexDirection: 'row', backgroundColor: '#ffffff', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#d9e2ec', paddingTop: 8 },
  dockItem: { flex: 1, alignItems: 'center', gap: 4 },
  dockLabel: { color: '#7a8aa0', fontSize: 11, fontWeight: '700' },
  dockLabelActive: { color: '#0f8f6b' },
});
