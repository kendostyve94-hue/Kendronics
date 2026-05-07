import type { Metadata } from 'next';
import { LegalDetailPage } from '../../../components/legal/LegalDetailPage';

export const metadata: Metadata = {
  title: 'Politique de Cookies | Kendronics',
  description: 'Politique de cookies Kendronics pour la navigation, le consentement et les cookies tiers.',
};

const content = `
La presente politique de cookies a pour objectif d’informer les utilisateurs de la plateforme Kendronics sur l’utilisation des cookies et technologies similaires lors de la navigation sur le site.

Elle precise notamment :

les types de cookies utilises,
les finalites de ces cookies,
les modalites de gestion et de consentement,
les droits des utilisateurs.

Cette politique s’inscrit dans le respect des exigences du Reglement General sur la Protection des Donnees (RGPD) et des recommandations de la CNIL.

ARTICLE 1 — DEFINITION DES COOKIES

Un cookie est un fichier texte susceptible d’etre enregistre sur le terminal de l’utilisateur (ordinateur, smartphone, tablette) lors de la consultation d’un site internet.

Il permet au site de reconnaitre l’utilisateur, de memoriser certaines informations et d’ameliorer l’experience de navigation.

Les cookies peuvent etre :

deposes par Kendronics (cookies internes),
deposes par des partenaires tiers (cookies tiers).

ARTICLE 2 — TYPES DE COOKIES UTILISES

Kendronics utilise plusieurs categories de cookies, dont la nature et la finalite sont detaillees ci-dessous.

2.1 Cookies strictement necessaires

Ces cookies sont indispensables au fonctionnement de la plateforme.

Ils permettent notamment :

l’acces aux fonctionnalites essentielles,
la gestion des sessions utilisateur,
la securisation des connexions,
le fonctionnement du panier et du processus de commande.

Ces cookies ne peuvent pas etre desactives sans alterer le fonctionnement du site.

2.2 Cookies de mesure d’audience

Ces cookies permettent d’analyser l’utilisation de la plateforme, notamment :

le nombre de visiteurs,
les pages consultees,
la duree de navigation,
les interactions utilisateur.

Ils permettent a Kendronics d’ameliorer ses services et l’experience utilisateur.

2.3 Cookies fonctionnels

Ces cookies permettent de memoriser les preferences de l’utilisateur, notamment :

la langue,
les parametres d’affichage,
les choix de configuration.

Ils facilitent une navigation personnalisee.

2.4 Cookies de securite

Ces cookies contribuent a la securite de la plateforme, notamment :

prevention des fraudes,
protection contre les acces non autorises,
verification des sessions.

2.5 Cookies lies au paiement

Dans le cadre des transactions, des cookies peuvent etre deposes par des prestataires de paiement afin de :

securiser les transactions,
detecter les fraudes,
assurer le bon deroulement du paiement.

Ces cookies sont geres par des tiers et soumis a leurs propres politiques.

2.6 Cookies tiers

Kendronics peut utiliser des services tiers impliquant le depot de cookies, notamment pour :

l’analyse statistique,
la gestion des paiements,
l’amelioration des performances techniques.

Ces cookies sont soumis aux politiques de confidentialite des prestataires concernes.

ARTICLE 3 — CONSENTEMENT

Conformement a la reglementation en vigueur, l’utilisation de certains cookies est soumise au consentement prealable de l’utilisateur.

Lors de sa premiere visite sur la plateforme, l’utilisateur est informe de l’utilisation des cookies via un bandeau dedie.

Ce bandeau permet :

d’accepter tous les cookies,
de refuser les cookies non essentiels,
de personnaliser ses preferences.

Le consentement est libre, specifique, eclaire et univoque.

L’utilisateur peut retirer son consentement a tout moment.

ARTICLE 4 — GESTION DES COOKIES

L’utilisateur peut a tout moment gerer ses preferences en matiere de cookies :

via le bandeau de gestion des cookies,
via les parametres de son navigateur.

La configuration du navigateur permet notamment de :

bloquer certains cookies,
supprimer les cookies existants,
etre informe lors du depot de cookies.

Toutefois, le refus de certains cookies peut degrader l’experience utilisateur.

ARTICLE 5 — DUREE DE CONSERVATION

Les cookies sont conserves pour une duree limitee, conformement aux recommandations applicables.

La duree maximale de conservation des cookies est de treize (13) mois a compter de leur depot sur le terminal de l’utilisateur.

Au-dela de cette duree, le consentement est a nouveau demande.

ARTICLE 6 — DONNEES COLLECTEES VIA LES COOKIES

Les cookies peuvent collecter des donnees telles que :

adresse IP,
type de navigateur,
systeme d’exploitation,
pages consultees,
interactions avec le site.

Ces donnees sont utilisees uniquement dans le cadre des finalites definies.

ARTICLE 7 — LIENS AVEC LA POLITIQUE DE CONFIDENTIALITE

Les donnees collectees via les cookies peuvent constituer des donnees personnelles.

Leur traitement est donc egalement regi par la politique de confidentialite de Kendronics.

L’utilisateur est invite a consulter ce document pour plus d’informations.

ARTICLE 8 — RESPONSABILITE

Kendronics ne saurait etre tenu responsable du depot ou de la gestion des cookies effectues par des services tiers.

L’utilisateur est invite a consulter les politiques propres a ces prestataires.

ARTICLE 9 — MODIFICATION DE LA POLITIQUE

Kendronics se reserve le droit de modifier la presente politique de cookies afin de l’adapter aux evolutions legales ou techniques.

Toute modification prend effet des sa publication sur la plateforme.

ARTICLE 10 — ACCEPTATION

L’utilisateur reconnait avoir pris connaissance de la presente politique et l’accepter lors de la navigation sur la plateforme.
`;

export default function PolitiqueCookiesPage() {
  return (
    <LegalDetailPage
      title="Politique de Cookies"
      description="Utilisation des cookies et technologies similaires sur la plateforme Kendronics."
      content={content}
    />
  );
}
