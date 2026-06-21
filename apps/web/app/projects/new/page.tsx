'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Navbar } from '../../../components/layout/Navbar';
import { getApiBaseUrl } from '../../../lib/api-base-url';
import { readFreshAuthSession } from '../../../lib/auth-session';

type ProjectType = 'free' | 'paid';
type AssetVisibility = 'public' | 'protected';

type ProjectAsset = {
  id: string;
  uploadId: string;
  kind: string;
  visibility: AssetVisibility;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
};

type ProjectDraft = {
  id: string;
  title: string;
  category: string;
  summary: string;
  description?: string;
  tags: string[];
  imageUrl?: string;
  repositoryUrl?: string;
  projectType: ProjectType;
  priceCents?: number | null;
  currency: string;
  licenseCode: string;
  allowedUses: string[];
  visibility: string;
  technicalDetails?: Record<string, unknown>;
  documentation?: Record<string, unknown>;
  assets: ProjectAsset[];
};

type EditorForm = {
  title: string;
  category: string;
  tags: string;
  summary: string;
  description: string;
  imageUrl: string;
  coverPreviewUrl: string;
  videoPreviewUrl: string;
  repositoryUrl: string;
  boardType: string;
  dimensions: string;
  layers: string;
  mainComponents: string;
  power: string;
  interfaces: string;
  software: string;
  maturity: string;
  tested: string;
  buildInstructions: string;
  softwareInstructions: string;
  safetyNotes: string;
  changelog: string;
  licenseCode: string;
  allowedUses: string[];
  visibility: string;
  price: string;
  currency: string;
  rightsConfirmed: boolean;
};

const initialForm: EditorForm = {
  title: '',
  category: 'Prototype',
  tags: '',
  summary: '',
  description: '',
  imageUrl: '',
  coverPreviewUrl: '',
  videoPreviewUrl: '',
  repositoryUrl: '',
  boardType: 'PCB rigide',
  dimensions: '',
  layers: '2',
  mainComponents: '',
  power: '',
  interfaces: '',
  software: '',
  maturity: 'Prototype valide',
  tested: '',
  buildInstructions: '',
  softwareInstructions: '',
  safetyNotes: '',
  changelog: 'Version 1.0 - publication initiale',
  licenseCode: 'CC-BY-SA-4.0',
  allowedUses: ['download', 'modify', 'manufacture', 'republish'],
  visibility: 'public',
  price: '10.00',
  currency: 'EUR',
  rightsConfirmed: false,
};

export default function NewProjectPage() {
  const initialized = useRef(false);
  const [projectType, setProjectType] = useState<ProjectType>('free');
  const [projectId, setProjectId] = useState('');
  const [form, setForm] = useState<EditorForm>(initialForm);
  const [assets, setAssets] = useState<ProjectAsset[]>([]);
  const [assetKind, setAssetKind] = useState('gerber');
  const [assetVisibility, setAssetVisibility] = useState<AssetVisibility>('protected');
  const [status, setStatus] = useState('Preparation de votre espace de travail...');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    async function initialize() {
      const params = new URLSearchParams(window.location.search);
      const requestedType: ProjectType = params.get('type') === 'paid' ? 'paid' : 'free';
      const requestedId = params.get('id') ?? '';
      setProjectType(requestedType);
      setForm((current) => ({
        ...current,
        licenseCode: requestedType === 'paid' ? 'PROPRIETARY' : 'CC-BY-SA-4.0',
        allowedUses: requestedType === 'paid' ? ['manufacture'] : ['download', 'modify', 'manufacture', 'republish'],
      }));

      const session = await readFreshAuthSession();
      if (!session) {
        window.location.href = `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        return;
      }
      const headers = {
        Authorization: `${session.tokenType} ${session.accessToken}`,
        'Content-Type': 'application/json',
      };

      if (requestedId) {
        const response = await fetch(`${getApiBaseUrl()}/api/explorer/projects/${requestedId}/editor`, { headers, cache: 'no-store' });
        if (!response.ok) {
          setStatus('Ce brouillon est introuvable ou ne vous appartient pas.');
          return;
        }
        const draft = await response.json() as ProjectDraft;
        applyDraft(draft);
        setStatus('Brouillon charge.');
        return;
      }

      const response = await fetch(`${getApiBaseUrl()}/api/explorer/projects/drafts`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ projectType: requestedType }),
      });
      if (!response.ok) {
        setStatus('Impossible de creer le brouillon. Reessayez dans quelques instants.');
        return;
      }
      const draft = await response.json() as ProjectDraft;
      setProjectId(draft.id);
      setAssets(draft.assets ?? []);
      window.history.replaceState({}, '', `/projects/new?type=${requestedType}&id=${draft.id}`);
      setStatus('Brouillon securise cree automatiquement.');
    }

    void initialize();
  }, []);

  function applyDraft(draft: ProjectDraft) {
    const technical = draft.technicalDetails ?? {};
    const documentation = draft.documentation ?? {};
    setProjectId(draft.id);
    setProjectType(draft.projectType);
    setAssets(draft.assets ?? []);
    setForm({
      title: draft.title === 'Projet sans titre' ? '' : draft.title,
      category: draft.category,
      tags: draft.tags.join(', '),
      summary: draft.summary === 'Brouillon en cours de preparation.' ? '' : draft.summary,
      description: draft.description ?? '',
      imageUrl: draft.imageUrl ?? '',
      coverPreviewUrl: draft.imageUrl ?? '',
      videoPreviewUrl: '',
      repositoryUrl: draft.repositoryUrl ?? '',
      boardType: stringValue(technical.boardType, 'PCB rigide'),
      dimensions: stringValue(technical.dimensions),
      layers: stringValue(technical.layers, '2'),
      mainComponents: stringValue(technical.mainComponents),
      power: stringValue(technical.power),
      interfaces: stringValue(technical.interfaces),
      software: stringValue(technical.software),
      maturity: stringValue(technical.maturity, 'Prototype valide'),
      tested: stringValue(technical.tested),
      buildInstructions: stringValue(documentation.buildInstructions),
      softwareInstructions: stringValue(documentation.softwareInstructions),
      safetyNotes: stringValue(documentation.safetyNotes),
      changelog: stringValue(documentation.changelog, 'Version 1.0 - publication initiale'),
      licenseCode: draft.licenseCode,
      allowedUses: draft.allowedUses,
      visibility: draft.visibility,
      price: draft.priceCents ? (draft.priceCents / 100).toFixed(2) : '10.00',
      currency: draft.currency,
      rightsConfirmed: false,
    });
  }

  const validation = useMemo(() => {
    const missing: string[] = [];
    if (form.title.trim().length < 4) missing.push('Titre du projet');
    if (form.summary.trim().length < 24) missing.push('Resume public');
    if (!form.coverPreviewUrl && !form.videoPreviewUrl && !assets.some((asset) => ['cover', 'video', 'gallery'].includes(asset.kind))) missing.push('Image ou video de presentation');
    if (projectType === 'paid') {
      if (form.description.trim().length < 80) missing.push('Presentation detaillee');
      if (!form.dimensions.trim()) missing.push('Dimensions');
      if (!form.mainComponents.trim()) missing.push('Composants principaux');
      if (!form.power.trim()) missing.push('Alimentation');
      if (!form.interfaces.trim()) missing.push('Interfaces');
      if (!form.software.trim()) missing.push('Logiciels et outils');
      if (!form.maturity.trim()) missing.push('Niveau de maturite');
      if (!form.buildInstructions.trim()) missing.push('Instructions de fabrication');
      if (!form.tested.trim()) missing.push('Tests realises');
      if (assets.length === 0) missing.push('Au moins un fichier ou media');
      if (!assets.some((asset) => asset.visibility === 'protected')) missing.push('Un fichier protege');
      if (Number(form.price) < 1) missing.push('Prix valide');
      if (!form.rightsConfirmed) missing.push('Declaration de droits');
    }
    return missing;
  }, [assets, form, projectType]);

  function update<K extends keyof EditorForm>(key: K, value: EditorForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function previewMedia(event: ChangeEvent<HTMLInputElement>, kind: 'cover' | 'video') {
    const file = event.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    if (kind === 'cover') {
      update('coverPreviewUrl', objectUrl);
      setAssetKind('cover');
      setAssetVisibility('public');
    } else {
      update('videoPreviewUrl', objectUrl);
      setAssetKind('video');
      setAssetVisibility('public');
    }
    void uploadAsset(event, kind, 'public');
  }

  function toggleUse(value: string) {
    setForm((current) => ({
      ...current,
      allowedUses: current.allowedUses.includes(value)
        ? current.allowedUses.filter((item) => item !== value)
        : [...current.allowedUses, value],
    }));
  }

  async function saveDraft(showConfirmation = true) {
    if (!projectId) return false;
    setIsSaving(true);
    setStatus('Enregistrement du brouillon...');
    const session = await readFreshAuthSession();
    if (!session) {
      setStatus('Votre session a expire.');
      setIsSaving(false);
      return false;
    }
    const response = await fetch(`${getApiBaseUrl()}/api/explorer/projects/${projectId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `${session.tokenType} ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildPayload(form, projectType)),
    });
    setIsSaving(false);
    if (!response.ok) {
      const error = await response.json().catch(() => ({})) as { message?: string | string[] };
      setStatus(messageFromError(error, 'Impossible d enregistrer le brouillon.'));
      return false;
    }
    if (showConfirmation) setStatus('Brouillon enregistre dans votre compte.');
    return true;
  }

  async function uploadAsset(event: ChangeEvent<HTMLInputElement>, overrideKind?: string, overrideVisibility?: AssetVisibility) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!projectId) {
      setStatus('Le brouillon projet est encore en preparation. Reessayez dans quelques secondes.');
      return;
    }
    setIsUploading(true);
    setStatus(`Televersement securise de ${file.name}...`);
    const session = await readFreshAuthSession();
    if (!session) {
      setStatus('Votre session a expire.');
      setIsUploading(false);
      return;
    }
    const body = new FormData();
    body.append('file', file);
    const uploadResponse = await fetch(`${getApiBaseUrl()}/api/uploads/project-direct`, {
      method: 'POST',
      headers: { Authorization: `${session.tokenType} ${session.accessToken}` },
      body,
    });
    if (!uploadResponse.ok) {
      const error = await uploadResponse.json().catch(() => ({})) as { message?: string | string[] };
      setStatus(messageFromError(error, 'Le televersement a echoue.'));
      setIsUploading(false);
      return;
    }
    const upload = await uploadResponse.json() as {
      uploadId: string;
      originalName: string;
      mimeType: string;
      sizeBytes: number;
    };
    const attachResponse = await fetch(`${getApiBaseUrl()}/api/explorer/projects/${projectId}/assets`, {
      method: 'POST',
      headers: {
        Authorization: `${session.tokenType} ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uploadId: upload.uploadId,
        kind: overrideKind ?? assetKind,
        visibility: overrideVisibility ?? assetVisibility,
        originalName: upload.originalName,
        mimeType: upload.mimeType,
        sizeBytes: upload.sizeBytes,
      }),
    });
    setIsUploading(false);
    if (!attachResponse.ok) {
      const error = await attachResponse.json().catch(() => ({})) as { message?: string | string[] };
      setStatus(messageFromError(error, 'Le fichier a ete stocke, mais son rattachement au projet a echoue.'));
      return;
    }
    const attached = await attachResponse.json() as ProjectAsset;
    setAssets((current) => [...current.filter((item) => item.uploadId !== attached.uploadId), attached]);
    if ((overrideKind ?? assetKind) === 'cover') {
      const coverUrl = `${getApiBaseUrl()}/api/explorer/projects/${projectId}/assets/${attached.id}/public`;
      setForm((current) => ({ ...current, imageUrl: coverUrl, coverPreviewUrl: coverUrl }));
    }
    setStatus(`${file.name} est maintenant rattache au brouillon.`);
  }

  async function removeAsset(asset: ProjectAsset) {
    const session = await readFreshAuthSession();
    if (!session || !projectId) return;
    const response = await fetch(`${getApiBaseUrl()}/api/explorer/projects/${projectId}/assets/${asset.id}`, {
      method: 'DELETE',
      headers: { Authorization: `${session.tokenType} ${session.accessToken}` },
    });
    if (!response.ok) {
      setStatus('Impossible de retirer ce fichier du projet.');
      return;
    }
    setAssets((current) => current.filter((item) => item.id !== asset.id));
    setStatus(`${asset.originalName} a ete retire du projet.`);
  }

  async function publish() {
    if (validation.length > 0) {
      setStatus(`Publication incomplete : ${validation.join(', ')}.`);
      return;
    }
    setIsPublishing(true);
    const saved = await saveDraft(false);
    if (!saved) {
      setIsPublishing(false);
      return;
    }
    const session = await readFreshAuthSession();
    if (!session) {
      setIsPublishing(false);
      return;
    }
    const response = await fetch(`${getApiBaseUrl()}/api/explorer/projects/${projectId}/publish`, {
      method: 'POST',
      headers: { Authorization: `${session.tokenType} ${session.accessToken}` },
    });
    setIsPublishing(false);
    if (!response.ok) {
      const error = await response.json().catch(() => ({})) as { message?: string | string[] };
      setStatus(messageFromError(error, 'La publication a ete refusee.'));
      return;
    }
    window.location.href = '/profile?view=benefits';
  }

  return (
    <main className="min-h-screen bg-[#f4f7fa] text-[#102033]">
      <Navbar hideHeader />
      <section className="border-b border-[#dbe4ee] bg-white">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-4 px-4 py-7 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div>
            <h1 className="text-3xl font-black sm:text-4xl">{projectType === 'paid' ? 'Creer un nouveau projet' : 'Publier un projet'}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#64748b]">
              {projectType === 'paid'
                ? 'Preparez un dossier commercial complet avec description, fichiers proteges, licence, prix et droits d utilisation.'
                : 'Publiez un post public simple avec un titre, une categorie, une image et un resume clair pour Explorer.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/profile?view=benefits" className="inline-flex h-11 items-center border border-[#cfd8e3] bg-white px-4 text-sm font-bold">Quitter</a>
            <button type="button" onClick={() => void saveDraft()} disabled={!projectId || isSaving} className="h-11 border border-[#0f8f6b] bg-white px-5 text-sm font-black text-[#0f8f6b] disabled:opacity-50">{isSaving ? 'Enregistrement...' : 'Enregistrer le brouillon'}</button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1180px] px-2 py-6 sm:px-6 sm:py-7 lg:px-8">
        <div className="min-w-0 space-y-6">
          <EditorSection id="step-01" title="Informations publiques" description="Ce que les visiteurs verront en premier dans Explorer.">
            <Field label="Titre du projet" required>
              <input value={form.title} onChange={(event) => update('title', event.target.value)} className={inputClass} maxLength={90} placeholder="Ex. Station meteo solaire ESP32" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Categorie" required>
                <select value={form.category} onChange={(event) => update('category', event.target.value)} className={inputClass}>
                  {['Prototype', 'PCB', 'IoT', 'Energie', 'Robotique', 'Education', 'Audio', 'Medical', 'Automatisation', 'Open hardware'].map((item) => <option key={item}>{item}</option>)}
                </select>
              </Field>
              <Field label="Tags">
                <input value={form.tags} onChange={(event) => update('tags', event.target.value)} className={inputClass} maxLength={180} placeholder="ESP32, capteur, solaire, KiCad" />
              </Field>
            </div>
            <Field label="Resume public" required hint="24 a 360 caracteres" help="Texte court visible dans les cartes Explorer. Il doit expliquer le besoin, le resultat et l'interet du projet.">
              <textarea value={form.summary} onChange={(event) => update('summary', event.target.value)} className={`${inputClass} min-h-[76px] py-3`} maxLength={360} placeholder="Expliquez le besoin traite, le resultat obtenu et le public concerne." />
            </Field>
            <Field label="Presentation detaillee" required help="Redigez une description professionnelle : contexte du projet, probleme traite, fonctionnement global, choix techniques importants, limites connues et cas d'utilisation recommandes.">
              <textarea value={form.description} onChange={(event) => update('description', event.target.value)} className={`${inputClass} min-h-[125px] py-3`} maxLength={12000} placeholder="Contexte, architecture, fonctionnement, choix techniques, limites et cas d usage." />
            </Field>
            <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_290px]">
              <div className="grid gap-3">
                <div>
                  <p className="inline-flex items-center gap-1.5 text-sm font-black">Médias de présentation <span className="text-[#d9485f]">*</span></p>
                  <p className="mt-1 text-xs leading-5 text-[#64748b]">Ajoutez une couverture ou une video pour controler le rendu public avant publication.</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
                    <label className="inline-flex h-11 min-w-0 cursor-pointer items-center justify-center rounded-[10px] border border-[#0f8f6b] px-2 text-center text-[12px] font-black text-[#0f8f6b] sm:px-4 sm:text-sm">
                      Téléverser une image
                      <input type="file" className="sr-only" accept=".jpg,.jpeg,.png,.webp" onChange={(event) => previewMedia(event, 'cover')} />
                    </label>
                    <label className="inline-flex h-11 min-w-0 cursor-pointer items-center justify-center rounded-[10px] border border-[#cfd8e3] px-2 text-center text-[12px] font-black text-[#102033] sm:px-4 sm:text-sm">
                      Ajouter une vidéo
                      <input type="file" className="sr-only" accept=".mp4,.mov,.webm" onChange={(event) => previewMedia(event, 'video')} />
                    </label>
                  </div>
                </div>
                <Field label="Lien document externe">
                  <input value={form.repositoryUrl} onChange={(event) => update('repositoryUrl', event.target.value)} className={inputClass} placeholder="GitHub, GitLab, EasyEDA, Drive, documentation..." />
                </Field>
              </div>
              <ProjectPublishPreview form={form} projectType={projectType} />
            </div>
          </EditorSection>

          {projectType === 'paid' ? (
          <EditorSection id="step-02" title="Caracteristiques techniques" description="Les donnees necessaires pour comprendre et reproduire correctement le materiel.">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Type de carte" required><select value={form.boardType} onChange={(event) => update('boardType', event.target.value)} className={inputClass}>{['PCB rigide', 'PCB flexible', 'Rigide-flex', 'Module assemble', 'Systeme mecanique', 'Autre'].map((item) => <option key={item}>{item}</option>)}</select></Field>
              <Field label="Dimensions" required><input value={form.dimensions} onChange={(event) => update('dimensions', event.target.value)} className={inputClass} placeholder="100 x 80 mm" /></Field>
              <Field label="Nombre de couches" required help="Nombre de couches cuivre. Plus il augmente, plus le projet peut devenir complexe et couteux."><select value={form.layers} onChange={(event) => update('layers', event.target.value)} className={inputClass}>{['1', '2', '4', '6', '8', '10+'].map((item) => <option key={item}>{item}</option>)}</select></Field>
            </div>
            <Field label="Composants principaux" required><textarea value={form.mainComponents} onChange={(event) => update('mainComponents', event.target.value)} className={`${inputClass} min-h-[110px] py-3`} placeholder="Microcontroleur, capteurs, convertisseurs, connecteurs et references critiques." /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Alimentation" required><input value={form.power} onChange={(event) => update('power', event.target.value)} className={inputClass} placeholder="5 V USB-C, batterie 3,7 V..." /></Field>
              <Field label="Interfaces" required><input value={form.interfaces} onChange={(event) => update('interfaces', event.target.value)} className={inputClass} placeholder="USB, UART, I2C, Wi-Fi..." /></Field>
              <Field label="Logiciels et outils" required help="Outils necessaires pour ouvrir, modifier, compiler ou programmer le projet : KiCad, EasyEDA, PlatformIO, Arduino IDE, FreeCAD."><input value={form.software} onChange={(event) => update('software', event.target.value)} className={inputClass} placeholder="KiCad 8, PlatformIO, FreeCAD..." /></Field>
              <Field label="Niveau de maturite" required><select value={form.maturity} onChange={(event) => update('maturity', event.target.value)} className={inputClass}>{['Concept', 'Prototype en cours', 'Prototype valide', 'Pre-serie', 'Production'].map((item) => <option key={item}>{item}</option>)}</select></Field>
            </div>
            <Field label="Tests realises" required help="Indiquez uniquement les validations reellement effectuees : controles electriques, tests fonctionnels, contraintes thermiques, autonomie, assemblage, communication radio ou conditions de mesure."><textarea value={form.tested} onChange={(event) => update('tested', event.target.value)} className={`${inputClass} min-h-[110px] py-3`} placeholder="Tests electriques, fonctionnels, thermiques, radio, autonomie et conditions de validation." /></Field>
          </EditorSection>
          ) : null}

          {projectType === 'paid' ? (
          <EditorSection id="step-03" title="Documentation de reproduction" description="Des instructions suffisamment precises pour eviter les interpretations dangereuses ou couteuses.">
            <Field label="Fabrication et assemblage" required><textarea value={form.buildInstructions} onChange={(event) => update('buildInstructions', event.target.value)} className={`${inputClass} min-h-[150px] py-3`} placeholder="Preparation des fichiers, contraintes PCB, ordre d assemblage, composants alternatifs et controles." /></Field>
            <Field label="Programmation et mise en service"><textarea value={form.softwareInstructions} onChange={(event) => update('softwareInstructions', event.target.value)} className={`${inputClass} min-h-[130px] py-3`} placeholder="Installation, compilation, flash, configuration et premier demarrage." /></Field>
            <Field label="Securite, limites et avertissements"><textarea value={form.safetyNotes} onChange={(event) => update('safetyNotes', event.target.value)} className={`${inputClass} min-h-[110px] py-3`} placeholder="Tensions dangereuses, courant maximal, environnement, certifications et usages interdits." /></Field>
            <Field label="Historique de version"><textarea value={form.changelog} onChange={(event) => update('changelog', event.target.value)} className={`${inputClass} min-h-[90px] py-3`} /></Field>
          </EditorSection>
          ) : null}

          {projectType === 'paid' ? (
          <EditorSection id="step-04" title="Fichiers et medias" description="Chaque fichier est stocke dans l espace prive Kendronics. Vous choisissez ce qui est visible publiquement.">
            <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <Field label="Nature du fichier">
                <select value={assetKind} onChange={(event) => setAssetKind(event.target.value)} className={inputClass}>
                  <option value="cover">Image de couverture</option><option value="gallery">Galerie</option><option value="gerber">Gerber</option><option value="bom">BOM</option><option value="cpl">CPL</option><option value="schematic">Schema</option><option value="firmware">Firmware</option><option value="source">Fichiers sources</option><option value="documentation">Documentation</option><option value="video">Video</option><option value="other">Autre</option>
                </select>
              </Field>
              <Field label="Acces">
                <select value={assetVisibility} onChange={(event) => setAssetVisibility(event.target.value as AssetVisibility)} className={inputClass}>
                  <option value="public">Public et telechargeable</option>
                  <option value="protected">Protege</option>
                </select>
              </Field>
              <label className={`inline-flex h-11 items-center justify-center bg-[#0f8f6b] px-5 text-sm font-black text-white ${isUploading || !projectId ? 'pointer-events-none opacity-60' : 'cursor-pointer'}`}>
                {isUploading ? 'Televersement...' : projectId ? 'Ajouter un fichier' : 'Preparation...'}
                <input disabled={isUploading || !projectId} type="file" className="sr-only" onChange={(event) => void uploadAsset(event)} accept=".zip,.pdf,.txt,.csv,.json,.jpg,.jpeg,.png,.webp,.mp4,.mov,.bin,.hex" />
              </label>
            </div>
            <p className="text-xs leading-5 text-[#7a8899]">50 Mo maximum par fichier. Les fichiers proteges ne sont jamais exposes par une URL publique.</p>
            <div className="divide-y divide-[#e4ebf2] border border-[#dbe4ee]">
              {assets.length === 0 ? <p className="px-4 py-6 text-sm text-[#64748b]">Aucun fichier rattache au projet.</p> : assets.map((asset) => (
                <div key={asset.id} className="grid gap-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_100px_110px_36px] sm:items-center">
                  <div className="min-w-0"><p className="truncate text-sm font-bold">{asset.originalName}</p><p className="text-xs text-[#7a8899]">{formatBytes(asset.sizeBytes)} · {asset.mimeType}</p></div>
                  <span className="text-xs font-bold uppercase text-[#64748b]">{asset.kind}</span>
                  <span className={`w-fit px-2 py-1 text-xs font-black ${asset.visibility === 'protected' ? 'bg-[#fff3e8] text-[#b45309]' : 'bg-[#e7f5f0] text-[#0f8f6b]'}`}>{asset.visibility === 'protected' ? 'Protege' : 'Public'}</span>
                  <button type="button" onClick={() => void removeAsset(asset)} className="grid h-8 w-8 place-items-center rounded-full text-xl text-[#7a8899] transition hover:bg-[#fff0f2] hover:text-[#d9485f]" aria-label={`Retirer ${asset.originalName}`}>×</button>
                </div>
              ))}
            </div>
          </EditorSection>
          ) : null}

          {projectType === 'paid' ? (
          <EditorSection id="step-05" title="Licence, droits et tarification" description="Les visiteurs doivent comprendre exactement ce qu ils peuvent faire avec le projet.">
            {projectType === 'paid' ? (
              <div className="border border-[#f2d5a7] bg-[#fff8ec] px-4 py-3 text-sm leading-6 text-[#8a5a12]">
                Cette fiche prepare une publication commerciale avec prix, licence et fichiers proteges. Le paiement integre, l'attribution de licence et le telechargement securise apres achat seront finalises dans la phase marketplace.
              </div>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Licence" required>
                <select value={form.licenseCode} onChange={(event) => update('licenseCode', event.target.value)} className={inputClass}>
                  <option value="CC-BY-4.0">CC BY 4.0</option><option value="CC-BY-SA-4.0">CC BY-SA 4.0</option><option value="CERN-OHL-P-2.0">CERN OHL-P 2.0</option><option value="CERN-OHL-S-2.0">CERN OHL-S 2.0</option><option value="PROPRIETARY">Licence commerciale Kendronics</option>
                </select>
              </Field>
              <Field label="Visibilite"><select value={form.visibility} onChange={(event) => update('visibility', event.target.value)} className={inputClass}><option value="public">Public dans Explorer</option><option value="unlisted">Accessible uniquement par lien</option></select></Field>
            </div>
            {projectType === 'paid' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Prix de la licence" required><input type="number" min="1" step="0.01" value={form.price} onChange={(event) => update('price', event.target.value)} className={inputClass} /></Field>
                <Field label="Devise"><select value={form.currency} onChange={(event) => update('currency', event.target.value)} className={inputClass}><option>EUR</option><option>USD</option><option>XAF</option></select></Field>
              </div>
            ) : null}
            <fieldset>
              <legend className="text-sm font-black">Droits accordes</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {[['download', 'Telecharger les fichiers'], ['modify', 'Modifier le projet'], ['manufacture', 'Fabriquer le projet'], ['republish', 'Republier avec attribution'], ['commercial-use', 'Usage commercial']].map(([value, label]) => (
                  <label key={value} className="flex items-center gap-3 border border-[#dbe4ee] px-4 py-3 text-sm font-semibold">
                    <input type="checkbox" checked={form.allowedUses.includes(value)} onChange={() => toggleUse(value)} className="h-4 w-4 accent-[#0f8f6b]" />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
          </EditorSection>
          ) : null}

          <EditorSection id="step-06" title={projectType === 'paid' ? 'Controle et publication' : 'Publication'} description={projectType === 'paid' ? 'La publication reste impossible tant que les informations essentielles ne sont pas completes.' : 'Verifiez le rendu public avant de publier votre post dans Explorer.'}>
            {projectType === 'paid' ? (
              <label className="flex items-start gap-3 border border-[#dbe4ee] bg-[#f8fafc] p-4 text-sm leading-6">
                <input type="checkbox" checked={form.rightsConfirmed} onChange={(event) => update('rightsConfirmed', event.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[#0f8f6b]" />
                <span>Je confirme etre l auteur du projet ou disposer des droits necessaires pour publier les textes, medias, fichiers et licences associes.</span>
              </label>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="text-sm font-black">{validation.length === 0 ? 'Le dossier est pret pour publication.' : `${validation.length} element(s) restent a completer.`}</p>
                {validation.length > 0 ? <p className="mt-2 text-sm leading-6 text-[#b45309]">{validation.join(' · ')}</p> : <p className="mt-2 text-sm text-[#0f8f6b]">Le projet pourra etre consulte par le grand public selon la visibilite choisie.</p>}
              </div>
              <button type="button" onClick={() => void publish()} disabled={isPublishing || !projectId} className="h-12 bg-[#0f8f6b] px-7 text-sm font-black text-white transition hover:bg-[#0b7558] disabled:cursor-not-allowed disabled:opacity-50">{isPublishing ? 'Publication...' : 'Publier le projet'}</button>
            </div>
          </EditorSection>

          <div className="border border-[#cfe2dc] bg-[#f1faf7] px-4 py-3 text-sm font-semibold text-[#0f6f56]" aria-live="polite">{status}</div>
        </div>
      </div>
    </main>
  );
}

const inputClass = 'h-11 w-full rounded-[10px] border border-[#cfd8e3] bg-white px-3 text-sm text-[#102033] outline-none transition focus:border-[#0f8f6b]';

function EditorSection({ id, title, description, children }: { id: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <section id={id} className="project-editor-section scroll-mt-5">
      <header className="project-editor-section-title bg-white px-4 py-3 sm:px-5">
        <p className="label-caps text-[#0f8f6b]">{title}</p>
        <p className="mt-2 text-sm leading-6 text-[#64748b]">{description}</p>
      </header>
      <div className="grid gap-5 px-5 py-6 sm:px-7">{children}</div>
    </section>
  );
}

function Field({ label, required = false, hint, help, children }: { label: string; required?: boolean; hint?: string; help?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <span className="flex items-center justify-between gap-3 text-sm font-black">
        <span className="inline-flex items-center gap-1.5">
          {required ? <span className="text-[#d9485f]">*</span> : null}
          {label}
          {help ? <HelpHint text={help} /> : null}
        </span>
        {hint ? <span className="text-xs font-normal text-[#7a8899]">{hint}</span> : null}
      </span>
      {children}
    </div>
  );
}

function HelpHint({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <button type="button" className="grid h-5 w-5 place-items-center rounded-full text-[#7a8899] transition hover:text-[#0f8f6b]" aria-label="Voir l'aide">
        <ProjectHelpIcon />
      </button>
      <span className="pointer-events-none absolute left-1/2 top-7 z-20 hidden w-64 -translate-x-1/2 rounded-[10px] bg-[#102033] px-3 py-2 text-xs font-semibold leading-5 text-white group-hover:block group-focus-within:block">
        {text}
      </span>
    </span>
  );
}

function ProjectHelpIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="currentColor" d="M11 18h2v-2h-2v2Zm1-16a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm0-14a3.5 3.5 0 0 0-3.5 3.5h2A1.5 1.5 0 1 1 12 11c-1.7 0-3 1.3-3 3h2c0-.6.4-1 1-1a3.5 3.5 0 0 0 0-7Z" />
    </svg>
  );
}

function ProjectPublishPreview({ form, projectType }: { form: EditorForm; projectType: ProjectType }) {
  const cover = form.coverPreviewUrl || '/images/quote-product-standard-pcb.png';
  return (
    <aside>
      <article className="overflow-hidden rounded-[10px] bg-white ring-1 ring-[#dbe4ee]">
        <div className="relative aspect-video bg-[#dce8e3]">
          {form.videoPreviewUrl ? (
            <video src={form.videoPreviewUrl} controls className="h-full w-full bg-black object-cover" />
          ) : (
            <img src={cover} alt="" className="h-full w-full object-cover" />
          )}
          {!form.videoPreviewUrl ? <span className="absolute inset-0 grid place-items-center"><span className="grid h-12 w-12 place-items-center rounded-full bg-black/65 text-white"><ProjectEditorIcon name="play" /></span></span> : null}
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2">
            {projectType === 'paid' ? <span className="rounded bg-[#fff1e6] px-2 py-1 text-[11px] font-black text-[#c45100]">COMMERCIAL</span> : null}
            <span className="truncate text-xs font-semibold text-[#64748b]">{form.category}</span>
          </div>
          <h3 className="mt-2 line-clamp-2 text-base font-black text-[#102033]">{form.title || 'Titre du projet'}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-5 text-[#64748b]">{form.summary || 'Le resume public apparaitra ici pour aider les visiteurs a comprendre le projet.'}</p>
          <div className="mt-3 flex items-center gap-2 text-xs text-[#64748b]">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-[#102033] font-black text-white">K</span>
            <span>Kendronics Creator</span>
          </div>
        </div>
      </article>
    </aside>
  );
}

type ProjectEditorIconName = 'public' | 'memory' | 'article' | 'folder' | 'license' | 'publish' | 'play';

function ProjectEditorIcon({ name }: { name: ProjectEditorIconName }) {
  const paths: Record<ProjectEditorIconName, string> = {
    public: 'M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm0 2v10h16V7H4Zm2 8 3-4 2.2 2.9L14 10l4 5H6Zm2-6.5A1.5 1.5 0 1 1 11 8.5 1.5 1.5 0 0 1 8 8.5Z',
    memory: 'M7 3h10v2h2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h-2v2H7v-2H5v-2H3v-2h2v-2H3v-2h2V9H3V7h2V5h2V3Zm2 4v10h6V7H9Zm2 2h2v6h-2V9Z',
    article: 'M6 2h9l5 5v15H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm8 2v4h4l-4-4ZM8 12h8v2H8v-2Zm0 4h8v2H8v-2Zm0-8h4v2H8V8Z',
    folder: 'M10 4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6Zm10 6H4v8h16v-8Z',
    license: 'M12 2 4 5v6c0 5.1 3.4 9.4 8 11 4.6-1.6 8-5.9 8-11V5l-8-3Zm3.7 7.3 1.4 1.4-5.8 5.8-3.4-3.4 1.4-1.4 2 2 4.4-4.4Z',
    publish: 'M5 20h14v-2H5v2ZM13 4.83V16h-2V4.83L7.41 8.42 6 7l6-6 6 6-1.41 1.42L13 4.83Z',
    play: 'M8 5v14l11-7L8 5Z',
  };
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="currentColor" d={paths[name]} />
    </svg>
  );
}

function buildPayload(form: EditorForm, projectType: ProjectType) {
  return {
    title: form.title.trim() || 'Projet sans titre',
    category: form.category,
    tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
    summary: form.summary.trim() || 'Brouillon en cours de preparation.',
    description: form.description.trim(),
    imageUrl: form.imageUrl.trim() || undefined,
    repositoryUrl: form.repositoryUrl.trim() || undefined,
    projectType,
    priceCents: projectType === 'paid' ? Math.round(Number(form.price || 0) * 100) : undefined,
    currency: form.currency,
    licenseCode: form.licenseCode,
    allowedUses: form.allowedUses,
    visibility: form.visibility,
    technicalDetails: {
      boardType: form.boardType,
      dimensions: form.dimensions.trim(),
      layers: form.layers,
      mainComponents: form.mainComponents.trim(),
      power: form.power.trim(),
      interfaces: form.interfaces.trim(),
      software: form.software.trim(),
      maturity: form.maturity,
      tested: form.tested.trim(),
    },
    documentation: {
      buildInstructions: form.buildInstructions.trim(),
      softwareInstructions: form.softwareInstructions.trim(),
      safetyNotes: form.safetyNotes.trim(),
      changelog: form.changelog.trim(),
    },
  };
}

function messageFromError(error: { message?: string | string[] }, fallback: string) {
  return Array.isArray(error.message) ? error.message.join(' ') : error.message || fallback;
}

function stringValue(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}
