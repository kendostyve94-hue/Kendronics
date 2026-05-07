import type { Metadata } from 'next';
import { LegalDetailPage } from '../../../components/legal/LegalDetailPage';

export const metadata: Metadata = {
  title: 'Mentions legales | Kendronics',
  description: 'Mentions legales Kendronics relatives a l’editeur, l’hebergement, l’activite et le contact.',
};

const content = `
Le present site internet, accessible a l’adresse kendronics.com (ci-apres le « Site »), est edite par : Kendronics, [Nom complet ou raison sociale a completer], [Statut juridique : SAS / SARL / Auto-entrepreneur], [Numero d’immatriculation : RCS ou equivalent], [Numero SIRET le cas echeant], [Numero de TVA intracommunautaire si applicable], Adresse du siege social : [adresse complete].

Adresse electronique : contact.kendronics@gmail.com.

Le directeur de la publication est : Loic NIANZE KENDONG.

Kendronics est une entreprise specialisee dans la mise en relation entre des utilisateurs souhaitant faire fabriquer des circuits imprimes (PCB) et des partenaires de fabrication industriels certifie.

Le service propose comprend notamment : la configuration de circuits imprimes, la transmission de fichiers techniques, la generation de devis automatises, la coordination de la fabrication, l’organisation de la livraison internationale.

Kendronics agit exclusivement en qualite d’intermediaire technique et commercial et ne realise pas directement la fabrication des produits.

ARTICLE 2 — HEBERGEMENT

Le Site est heberge par :

Vercel Inc
440 N Barranca Ave #4133
Covina, CA 91723
Etats-Unis
Site web : https://vercel.com

L’hebergeur assure le stockage des donnees et le maintien de l’infrastructure technique.

ARTICLE 3 — ACTIVITE

Kendronics est une plateforme numerique specialisee dans la mise en relation entre des utilisateurs souhaitant faire fabriquer des circuits imprimes (PCB) et des partenaires industriels.

Le service propose comprend notamment :

la configuration de circuits imprimes,
la transmission de fichiers techniques,
la generation de devis automatises,
la coordination de la fabrication,
l’organisation de la livraison internationale.

Kendronics agit exclusivement en qualite d’intermediaire technique et commercial et ne realise pas directement la fabrication des produits.

ARTICLE 4 — CONDITIONS D’UTILISATION

L’acces et l’utilisation du Site sont soumis au respect des presentes mentions legales, ainsi que des Conditions Generales d’Utilisation (CGU) et des Conditions Generales de Vente (CGV).

Tout utilisateur s’engage a utiliser le Site de maniere conforme a la reglementation en vigueur et a ne pas porter atteinte a son bon fonctionnement.

ARTICLE 5 — PROPRIETE INTELLECTUELLE

L’ensemble des elements composant le Site, notamment :

textes,
images,
graphismes,
logos,
structure,
code source,

sont proteges par le droit de la propriete intellectuelle.

Toute reproduction, representation, modification ou exploitation, totale ou partielle, sans autorisation prealable, est strictement interdite.

ARTICLE 6 — RESPONSABILITE

Kendronics met en oeuvre tous les moyens raisonnables pour assurer l’exactitude des informations diffusees sur le Site.

Toutefois, Kendronics ne peut garantir :

l’exactitude,
la completude,
l’actualite des informations.

Kendronics ne saurait etre tenu responsable :

des erreurs ou omissions,
des dommages resultant de l’utilisation du Site,
des interruptions de service,
des defaillances techniques.

ARTICLE 7 — LIENS HYPERTEXTES

Le Site peut contenir des liens vers des sites externes.

Kendronics ne peut etre tenu responsable :

du contenu de ces sites,
de leur politique de confidentialite,
de leur fonctionnement.

ARTICLE 8 — DONNEES PERSONNELLES

Les donnees personnelles collectees sur le Site sont traitees conformement a la reglementation applicable.

L’utilisateur est invite a consulter la politique de confidentialite pour plus d’informations.

ARTICLE 9 — COOKIES

Le Site utilise des cookies afin d’ameliorer l’experience utilisateur.

Les modalites d’utilisation des cookies sont detaillees dans la politique de cookies.

ARTICLE 10 — DROIT APPLICABLE

Le present Site est soumis au droit francais.

ARTICLE 11 — CONTACT

Pour toute question relative aux presentes mentions legales ou au fonctionnement du Site, l’utilisateur peut contacter :

contact.kendronics@gmail.com

ARTICLE 12 — MISE A JOUR

Kendronics se reserve le droit de modifier les presentes mentions legales a tout moment.

Les modifications prennent effet des leur publication sur le Site.
`;

export default function MentionsLegalesPage() {
  return (
    <LegalDetailPage
      title="Mentions legales"
      description="Informations relatives a l’editeur, l’hebergement, l’activite et le contact Kendronics."
      content={content}
    />
  );
}
