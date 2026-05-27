import { officialContactEmail } from './official-contact';

export interface LegalSection {
  id?: string;
  title: string;
  body: string[];
}

export interface LegalDocument {
  title: string;
  eyebrow: string;
  description: string;
  lastUpdated: string;
  reviewNote: string;
  sections: LegalSection[];
}

const updatedAt = '25 avril 2026';
const reviewNote = 'Kendronics peut mettre a jour ce document si les operations, partenaires, moyens de paiement, obligations legales ou parcours logistiques evoluent.';

export const termsDocument: LegalDocument = {
  title: 'Cadre legal',
  eyebrow: 'Conditions',
  description: 'Documents de reference pour utiliser Kendronics, commander des PCB, gerer les fichiers, le paiement, la confidentialite et les cookies.',
  lastUpdated: updatedAt,
  reviewNote,
  sections: [
    {
      id: 'conditions-generales-de-vente',
      title: 'Conditions generales de vente',
      body: [
        'Kendronics est une plateforme intermediaire qui aide les clients a configurer des commandes PCB, transmettre des fichiers, obtenir un devis, suivre le paiement, coordonner la logistique et gerer le support.',
        'Kendronics ne se presente pas comme une usine de fabrication. La production est assuree par des partenaires de fabrication externes, selon les fichiers acceptes et les specifications confirmees.',
        'Toute commande implique l acceptation des conditions applicables au moment de la validation.',
      ],
    },
    {
      id: 'conditions-generales-utilisation',
      title: 'Conditions generales d utilisation',
      body: [
        'L utilisateur doit fournir des informations exactes, des fichiers exploitables et des donnees de livraison completes.',
        'Les delais, options techniques, materiaux, tests, assemblages et validations finales peuvent dependre de la revue partenaire.',
        'Kendronics peut refuser ou suspendre une demande si les fichiers, le paiement, la destination ou les informations client ne permettent pas un traitement fiable.',
      ],
    },
    {
      id: 'paiement',
      title: 'Paiement et commande',
      body: [
        'Les paiements peuvent etre traites par Stripe, Mobile Money, virement, PayPal ou tout autre moyen active par Kendronics.',
        'Kendronics ne demande jamais d envoyer des donnees de carte bancaire par e-mail, message ou ticket support.',
        'Une commande peut etre bloquee tant que le paiement, la revue fichier ou la validation fournisseur n est pas confirme.',
      ],
    },
    {
      id: 'responsabilite-fichiers',
      title: 'Responsabilite des fichiers',
      body: [
        'Le client reste responsable de la justesse, de la coherence et de la version de ses fichiers Gerber, BOM, CPL, percage, contour et pieces jointes.',
        'L assistance Kendronics peut aider a identifier des points de vigilance, mais elle ne remplace pas la responsabilite de conception du client.',
      ],
    },
  ],
};

export const privacyDocument: LegalDocument = {
  title: 'Politique de confidentialite',
  eyebrow: 'Confidentialite',
  description: 'Comment Kendronics collecte, utilise, stocke, partage et protege les donnees de compte, commande, fichier, paiement, suivi et support.',
  lastUpdated: updatedAt,
  reviewNote,
  sections: [
    {
      title: '1. Identite et contact',
      body: [
        `Les demandes relatives aux donnees personnelles peuvent etre envoyees a ${officialContactEmail}.`,
        'Kendronics traite les donnees necessaires au fonctionnement du service, a la securite, au support et aux obligations legales.',
      ],
    },
    {
      title: '2. Donnees de compte',
      body: [
        'Kendronics peut collecter le nom, l adresse e-mail, le telephone, le pays, le type de compte, la societe, les preferences et les traces de session utiles au service.',
        'Ces donnees servent a creer le compte, securiser la connexion, gerer les devis, les commandes, les notifications et les demandes support.',
      ],
    },
    {
      title: '3. Fichiers et commandes',
      body: [
        'Les fichiers Gerber, BOM, CPL et pieces jointes sont utilises pour preparer les devis, permettre la revue technique, coordonner la production partenaire et conserver l historique client.',
        'Les donnees de commande comprennent notamment le numero de commande, les specifications PCB, la destination, les jalons de paiement, production, livraison et support.',
      ],
    },
    {
      title: '4. Partage limite',
      body: [
        'Kendronics peut partager les donnees strictement utiles avec des partenaires de fabrication, logistique, paiement, hebergement, notification ou support.',
        'Les fichiers de production ne sont pas vendus. Les donnees sensibles fournisseur, administrateur ou prix interne ne sont pas publiees.',
      ],
    },
    {
      title: '5. Droits utilisateur',
      body: [
        'Selon le droit applicable, l utilisateur peut demander l acces, la rectification, l effacement, la limitation, la portabilite ou l opposition au traitement de ses donnees.',
        'Kendronics peut verifier l identite du demandeur avant de traiter une demande sensible.',
      ],
    },
  ],
};

export const refundDocument: LegalDocument = {
  title: 'Politique de remboursement',
  eyebrow: 'Remboursements',
  description: 'Comment Kendronics analyse les demandes de remboursement liees au devis, au paiement, aux fichiers, a la production, a la livraison et au support.',
  lastUpdated: updatedAt,
  reviewNote,
  sections: [
    {
      title: '1. Conditions d analyse',
      body: [
        'Chaque demande est analysee selon l etat du paiement, la revue fichier, la validation partenaire, la production engagee, les frais logistiques et les obligations deja declenchees.',
        'Un paiement autorise mais non capture peut etre annule si la commande ne peut pas etre validee.',
      ],
    },
    {
      title: '2. Fichiers refuses',
      body: [
        'Si les fichiers sont refuses avant production, Kendronics peut demander une correction, proposer une seconde verification ou annuler l autorisation de paiement selon le parcours applicable.',
        'Si le client abandonne avant lancement production, les montants non captures sont liberes selon les delais du prestataire de paiement.',
      ],
    },
    {
      title: '3. Production et livraison',
      body: [
        'Une fois la production ou la logistique engagee, le remboursement peut etre limite par les couts deja supportes et par les conditions du partenaire.',
        'Les retards lies a la douane, au transporteur ou a une information client incomplete sont traites au cas par cas.',
      ],
    },
  ],
};

export const cookieDocument: LegalDocument = {
  title: 'Politique de cookies',
  eyebrow: 'Cookies',
  description: 'Comment Kendronics utilise les cookies necessaires, les preferences, la mesure d audience et les choix de consentement.',
  lastUpdated: updatedAt,
  reviewNote,
  sections: [
    {
      title: '1. Cookies necessaires',
      body: [
        'Les cookies necessaires permettent la connexion, la securite, la conservation du panier, le devis, le support et le fonctionnement general du site.',
        'Ils ne peuvent pas toujours etre desactives sans degrader fortement le service.',
      ],
    },
    {
      title: '2. Preferences et audience',
      body: [
        'Les cookies de preferences peuvent retenir certains choix utilisateur, comme la langue, les options d affichage ou les choix de consentement.',
        'Les cookies de mesure d audience ne sont actives que selon les choix de l utilisateur lorsque la loi l exige.',
      ],
    },
    {
      title: '3. Gestion du consentement',
      body: [
        'L utilisateur peut accepter, refuser ou personnaliser les cookies non essentiels depuis la barre de consentement.',
        'Le navigateur peut aussi proposer ses propres controles pour supprimer ou bloquer les cookies.',
      ],
    },
  ],
};

export const legalDocuments = {
  terms: termsDocument,
  privacy: privacyDocument,
  refund: refundDocument,
  cookies: cookieDocument,
};
