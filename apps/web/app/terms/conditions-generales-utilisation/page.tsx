import type { Metadata } from 'next';
import { LegalDetailPage } from '../../../components/legal/LegalDetailPage';

export const metadata: Metadata = {
  title: 'Conditions Generales d’Utilisation | Kendronics',
  description: 'Conditions Generales d’Utilisation de la plateforme Kendronics.',
};

const content = `
Les presentes Conditions Generales d’Utilisation (ci-apres les « CGU ») ont pour objet de definir les modalites d’acces et d’utilisation de la plateforme Kendronics, ainsi que les droits et obligations des utilisateurs.

La plateforme Kendronics constitue un service numerique permettant la configuration, la commande et le suivi de circuits imprimes (PCB), via une interface connectant les utilisateurs a des partenaires industriels.

Toute utilisation du site implique l’acceptation pleine, entiere et sans reserve des presentes CGU.

ARTICLE 1 — DEFINITIONS

Aux fins des presentes CGU, les termes suivants sont definis comme suit :

Plateforme : le site internet Kendronics
Utilisateur : toute personne accedant a la plateforme
Client : utilisateur effectuant une commande
Compte : espace personnel securise
Fichiers techniques : fichiers transmis (Gerber, BOM, etc.)
Services : ensemble des fonctionnalites proposees

ARTICLE 2 — OBJET DU SERVICE

La plateforme Kendronics permet notamment :

la configuration de circuits imprimes,
le telechargement de fichiers techniques,
la generation de devis,
la gestion de commandes,
la coordination avec des partenaires industriels.

Kendronics agit exclusivement en qualite d’intermediaire technique.

La plateforme ne constitue pas un service de fabrication directe.

ARTICLE 3 — ACCES A LA PLATEFORME

L’acces a la plateforme est ouvert a tout utilisateur disposant :

d’un acces internet,
d’un equipement compatible.

Kendronics se reserve le droit de :

suspendre temporairement l’acces pour maintenance,
limiter certaines fonctionnalites,
restreindre l’acces a certains utilisateurs.

Aucune garantie n’est donnee quant a la disponibilite continue du service.

ARTICLE 4 — CREATION ET GESTION DU COMPTE

Certaines fonctionnalites necessitent la creation d’un compte.

L’utilisateur s’engage a :

fournir des informations exactes et completes,
maintenir ces informations a jour,
preserver la confidentialite de ses identifiants.

Toute action realisee via le compte est reputee effectuee par son titulaire.

En cas de suspicion d’acces frauduleux, l’utilisateur doit en informer Kendronics immediatement.

ARTICLE 5 — UTILISATION DE LA PLATEFORME

L’utilisateur s’engage a utiliser la plateforme de maniere conforme a sa destination.

Il lui est strictement interdit :

d’utiliser la plateforme a des fins illegales,
de tenter de compromettre la securite du systeme,
d’introduire des virus ou programmes malveillants,
de contourner les mecanismes techniques de la plateforme,
de collecter ou exploiter les donnees d’autres utilisateurs.

Toute violation pourra entrainer la suspension ou la suppression du compte.

ARTICLE 6 — TRANSMISSION DES FICHIERS TECHNIQUES

L’utilisateur peut transmettre des fichiers necessaires a la fabrication des circuits imprimes.

A ce titre, il garantit :

etre titulaire des droits necessaires,
que les fichiers ne violent aucun droit tiers,
que les fichiers ne contiennent aucun contenu illicite.

Kendronics ne procede a aucune verification systematique du contenu.

L’utilisateur assume l’entiere responsabilite des fichiers transmis.

ARTICLE 7 — DISPONIBILITE ET PERFORMANCES

Kendronics s’efforce d’assurer le bon fonctionnement de la plateforme.

Toutefois, l’utilisateur reconnait que :

des interruptions peuvent survenir,
des erreurs techniques peuvent exister,
des pertes de donnees sont possibles.

Kendronics ne garantit ni l’absence d’erreurs, ni une performance constante.

ARTICLE 8 — SECURITE

Kendronics met en oeuvre des mesures raisonnables de securite.

Cependant, l’utilisateur reconnait que :

aucune infrastructure n’est totalement securisee,
les transmissions sur internet comportent des risques.

Kendronics ne saurait etre tenu responsable en cas de piratage, intrusion ou perte de donnees liee a un tiers.

ARTICLE 9 — PROPRIETE INTELLECTUELLE

L’ensemble des elements de la plateforme (code, design, contenu) est protege par le droit de la propriete intellectuelle.

Toute reproduction, modification ou exploitation sans autorisation est interdite.

ARTICLE 10 — DONNEES PERSONNELLES

L’utilisation de la plateforme implique la collecte de donnees personnelles.

Ces donnees sont traitees conformement a la politique de confidentialite.

L’utilisateur dispose notamment d’un droit d’acces, d’un droit de rectification et d’un droit d’opposition.

ARTICLE 11 — RESPONSABILITE

Kendronics ne peut etre tenu responsable de l’utilisation faite par l’utilisateur, des erreurs dans les fichiers fournis, des consequences liees aux produits fabriques ou des dommages indirects.

L’utilisateur reconnait utiliser la plateforme sous sa seule responsabilite.

ARTICLE 12 — SUSPENSION ET RESILIATION

Kendronics peut suspendre ou supprimer un compte en cas de non-respect des CGU, activite frauduleuse ou comportement abusif.

Cette decision peut intervenir sans preavis.

ARTICLE 13 — LIENS EXTERNES

La plateforme peut contenir des liens vers des sites tiers.

Kendronics ne peut etre tenu responsable du contenu de ces sites ou de leur fonctionnement.

ARTICLE 14 — EVOLUTION DE LA PLATEFORME

Kendronics se reserve le droit de modifier les fonctionnalites, ajouter ou supprimer des services, faire evoluer l’interface.

Ces modifications peuvent intervenir sans preavis.

ARTICLE 15 — FORCE MAJEURE

Kendronics ne pourra etre tenu responsable de tout evenement echappant a son controle : catastrophes naturelles, pannes reseaux, conflits internationaux, decisions administratives.

ARTICLE 16 — DROIT APPLICABLE

Les presentes CGU sont soumises au droit francais.

ARTICLE 17 — LITIGES

Tout litige fera l’objet d’une tentative de resolution amiable.

A defaut, les tribunaux francais seront seuls competents.

ARTICLE 18 — VALIDITE DES CLAUSES

Si une clause est jugee invalide, les autres restent applicables.

ARTICLE 19 — ACCEPTATION

L’utilisateur reconnait avoir pris connaissance des CGU et les accepter sans reserve.
`;

export default function ConditionsGeneralesUtilisationPage() {
  return (
    <LegalDetailPage
      title="Conditions Generales d’Utilisation"
      description="Modalites d’acces et d’utilisation de la plateforme Kendronics."
      content={content}
    />
  );
}
