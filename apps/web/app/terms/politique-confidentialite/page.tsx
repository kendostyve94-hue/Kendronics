import type { Metadata } from 'next';
import { LegalDetailPage } from '../../../components/legal/LegalDetailPage';

export const metadata: Metadata = {
  title: 'Politique de Confidentialite | Kendronics',
  description: 'Politique de confidentialite Kendronics relative aux donnees personnelles et fichiers techniques.',
};

const content = `
La presente politique de confidentialite a pour objet d’informer les utilisateurs de la plateforme Kendronics sur les modalites de collecte, de traitement, de stockage et de protection de leurs donnees personnelles.

Kendronics attache une importance particuliere au respect de la vie privee et s’engage a traiter les donnees personnelles dans le respect des dispositions du Reglement General sur la Protection des Donnees (RGPD) ainsi que de la legislation nationale applicable.

L’utilisateur est invite a lire attentivement le present document afin de comprendre la maniere dont ses donnees sont utilisees.

ARTICLE 1 — IDENTITE DU RESPONSABLE DE TRAITEMENT

Le responsable du traitement des donnees personnelles est :

Kendronics
[Statut juridique a completer]
[Adresse complete a completer]
Email : contact@kendronics.com

Le responsable du traitement determine les finalites et les moyens du traitement des donnees.

ARTICLE 2 — DEFINITION DES DONNEES PERSONNELLES

Une donnee personnelle designe toute information permettant d’identifier directement ou indirectement une personne physique, notamment :

nom et prenom
adresse email
adresse postale
numero de telephone
adresse IP
donnees de connexion

ARTICLE 3 — DONNEES COLLECTEES

Dans le cadre de l’utilisation de la plateforme, Kendronics est susceptible de collecter les categories de donnees suivantes :

3.1 Donnees d’identification
nom
prenom
adresse email

3.2 Donnees de contact
adresse de livraison
numero de telephone

3.3 Donnees de commande
historique des commandes
parametres techniques
informations liees aux transactions

3.4 Donnees techniques
fichiers Gerber
fichiers BOM
fichiers CPL

Ces fichiers peuvent contenir des informations sensibles d’un point de vue industriel.

3.5 Donnees de paiement

Les donnees de paiement sont traitees exclusivement par des prestataires securises.

Kendronics ne stocke pas les informations bancaires.

3.6 Donnees de navigation
adresse IP
cookies
logs techniques

ARTICLE 4 — FINALITES DU TRAITEMENT

Les donnees sont collectees pour les finalites suivantes :

gestion des comptes utilisateurs
traitement des commandes
execution contractuelle
coordination avec les partenaires industriels
gestion de la livraison
support client
amelioration des services
respect des obligations legales

ARTICLE 5 — BASE LEGALE DU TRAITEMENT

Les traitements reposent sur plusieurs bases legales :

l’execution du contrat (commande)
le respect d’obligations legales
le consentement (cookies, marketing)
l’interet legitime (amelioration du service)

ARTICLE 6 — DESTINATAIRES DES DONNEES

Les donnees peuvent etre transmises aux categories suivantes :

6.1 Partenaires industriels

Afin de permettre la fabrication des circuits imprimes.

6.2 Prestataires logistiques

Transporteurs internationaux charges de la livraison.

6.3 Prestataires de paiement

Traitement securise des transactions.

6.4 Prestataires techniques

Hebergement, analytics, services cloud.

Ces destinataires sont soumis a des obligations contractuelles de confidentialite.

ARTICLE 7 — TRANSFERTS HORS UNION EUROPEENNE

Dans le cadre de son activite, Kendronics peut etre amene a transferer des donnees personnelles en dehors de l’Union Europeenne, notamment vers des pays situes en Asie.

Ces transferts sont necessaires pour :

la fabrication des produits
la logistique internationale

Kendronics s’engage a encadrer ces transferts par des garanties appropriees, incluant notamment :

des clauses contractuelles standard
des mesures techniques de securite

ARTICLE 8 — SECURITE DES DONNEES

Kendronics met en oeuvre des mesures techniques et organisationnelles destinees a proteger les donnees personnelles, notamment :

chiffrement des communications
controle des acces
securisation des infrastructures

Toutefois, l’utilisateur reconnait que la securite absolue ne peut etre garantie sur internet.

ARTICLE 9 — GESTION DES FICHIERS TECHNIQUES

Les fichiers techniques transmis par les utilisateurs sont :

utilises exclusivement pour la fabrication
transmis uniquement aux partenaires concernes
conserves pour une duree limitee

Kendronics s’engage a ne pas exploiter ces fichiers a des fins commerciales propres.

Ces fichiers peuvent etre supprimes apres traitement pour des raisons de securite.

ARTICLE 10 — DUREE DE CONSERVATION

Les donnees sont conservees pendant une duree proportionnee aux finalites :

donnees clients : duree de la relation contractuelle + obligations legales
donnees techniques : duree necessaire au traitement
donnees de navigation : maximum 13 mois

ARTICLE 11 — DROITS DES UTILISATEURS

Conformement au RGPD, l’utilisateur dispose des droits suivants :

droit d’acces
droit de rectification
droit d’effacement
droit d’opposition
droit a la limitation
droit a la portabilite

Ces droits peuvent etre exerces en contactant : contact@kendronics.com

ARTICLE 12 — RECLAMATION

En cas de litige relatif au traitement des donnees, l’utilisateur peut adresser une reclamation aupres de :
CNIL

ARTICLE 13 — COOKIES

L’utilisation des cookies est detaillee dans une politique specifique.

ARTICLE 14 — MODIFICATION

Kendronics se reserve le droit de modifier la presente politique afin de garantir sa conformite avec la legislation en vigueur.

ARTICLE 15 — ACCEPTATION

L’utilisateur reconnait avoir pris connaissance de la presente politique et l’accepter lors de l’utilisation de la plateforme.
`;

export default function PolitiqueConfidentialitePage() {
  return (
    <LegalDetailPage
      title="Politique de Confidentialite"
      description="Collecte, traitement, stockage et protection des donnees personnelles."
      content={content}
    />
  );
}
