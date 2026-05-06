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

export const termsDocument: LegalDocument = {
  title: 'CADRE LEGAL',
  eyebrow: 'Cadre légal',
  description:
    'Documents de référence pour utiliser Kendronics, commander des PCB, gérer les fichiers, le paiement, la confidentialité et les cookies.',
  lastUpdated: 'April 25, 2026',
  reviewNote:
    'Kendronics may update these terms as operations, partners, payment methods, and logistics flows evolve.',
  sections: [
    {
      id: 'conditions-generales-de-vente',
      title: 'Conditions Générales de Vente',
      body: [
        'Kendronics is an intermediary platform. Kendronics helps customers configure PCB-related orders, upload files, request quotes, facilitate payment, coordinate logistics, track orders, and manage support.',
        'Kendronics is not a PCB manufacturer and does not represent itself as the factory producing customer boards. Manufacturing is performed by external manufacturing partners.',
      ],
    },
    {
      id: 'conditions-generales-utilisation',
      title: 'Conditions Générales d’Utilisation',
      body: [
        'External manufacturing partners are responsible for producing PCBs, PCBA work, SMT stencils, and related manufacturing services according to accepted production files and confirmed specifications.',
        'Manufacturing availability, lead time, material options, advanced features, testing, assembly, and final production acceptance may depend on partner review.',
      ],
    },
    {
      id: 'politique-confidentialite',
      title: 'Politique de Confidentialité',
      body: [
        'Customers are responsible for the correctness, completeness, revision control, and production-readiness of uploaded Gerber, BOM, CPL, drill, outline, and related files.',
        'Kendronics may provide file review assistance, but review assistance does not transfer design responsibility from the customer to Kendronics or to a manufacturing partner.',
      ],
    },
    {
      id: 'politique-cookies',
      title: 'Politique de Cookies',
      body: [
        'Quotes may include partner manufacturing cost, partner handling, China to France logistics where applicable, France processing and logistics, France to Africa delivery, payment processing, Kendronics service fee, and customs or delivery risk buffer where applicable.',
        'Pricing may change based on country, quantity, dimensions, material, surface finish, copper weight, assembly needs, file review, partner availability, carrier availability, customs assumptions, or other order-specific factors.',
      ],
    },
    {
      id: 'mentions-legales',
      title: 'Mentions légales',
      body: [
        'Payments may be processed through Stripe, Mobile Money providers, or other supported payment providers. Kendronics does not require customers to send card details by email or support ticket.',
        'An order may not proceed to partner fulfillment until payment is confirmed or otherwise approved by Kendronics.',
      ],
    },
  ],
};

Object.assign(termsDocument, {
  eyebrow: 'Cadre legal',
  description:
    'Documents de reference pour utiliser Kendronics, commander des PCB, gerer les fichiers, le paiement, la confidentialite et les cookies.',
  sections: [
    {
      id: 'conditions-generales-de-vente',
      title: 'Conditions Generales de Vente',
      body: [
        'Les presentes Conditions Generales de Vente (ci-apres les « CGV ») ont pour objet de definir les droits et obligations contractuels applicables a toute commande passee sur la plateforme Kendronics, accessible via le site internet exploite par l’editeur.',
        'Kendronics est une plateforme digitale specialisee dans la mise en relation entre des utilisateurs souhaitant faire fabriquer des circuits imprimes (PCB) et des partenaires industriels tiers disposant des capacites techniques necessaires a leur production.',
        'Le service propose repose sur une infrastructure logicielle permettant notamment : la configuration technique de circuits imprimes a partir de fichiers fournis par l’utilisateur, la generation automatisee de devis, la gestion de la commande, la coordination logistique internationale.',
        'Il est expressement precise que Kendronics n’intervient pas en qualite de fabricant, mais exclusivement en qualite d’intermediaire technique et commercial.',
        'Toute commande implique l’acceptation sans reserve des presentes CGV. voir plus...',
      ],
    },
    {
      id: 'conditions-generales-utilisation',
      title: 'Conditions Generales d’Utilisation',
      body: [
        'Les presentes Conditions Generales d’Utilisation (ci-apres les « CGU ») ont pour objet de definir les modalites d’acces et d’utilisation de la plateforme Kendronics, ainsi que les droits et obligations des utilisateurs.',
        'La plateforme Kendronics constitue un service numerique permettant la configuration, la commande et le suivi de circuits imprimes (PCB), via une interface connectant les utilisateurs a des partenaires industriels.',
        'Toute utilisation du site implique l’acceptation pleine, entiere et sans reserve des presentes CGU.voir plus...',
      ],
    },
    {
      id: 'politique-confidentialite',
      title: 'Politique de Confidentialite',
      body: [
        'La presente politique de confidentialite a pour objet d’informer les utilisateurs de la plateforme Kendronics sur les modalites de collecte, de traitement, de stockage et de protection de leurs donnees personnelles.',
        'Kendronics attache une importance particuliere au respect de la vie privee et s’engage a traiter les donnees personnelles dans le respect des dispositions du Reglement General sur la Protection des Donnees (RGPD) ainsi que de la legislation nationale applicable.',
        'L’utilisateur est invite a lire attentivement le present document afin de comprendre la maniere dont ses donnees sont utilisees. voir plus...',
      ],
    },
    {
      id: 'politique-cookies',
      title: 'Politique de Cookies',
      body: [
        'La presente politique de cookies a pour objectif d’informer les utilisateurs de la plateforme Kendronics sur l’utilisation des cookies et technologies similaires lors de la navigation sur le site.',
        'Elle precise notamment : les types de cookies utilises, les finalites de ces cookies, les modalites de gestion et de consentement, les droits des utilisateurs.',
        'Cette politique s’inscrit dans le respect des exigences du Reglement General sur la Protection des Donnees (RGPD) et des recommandations de la CNIL. voir plus...',
      ],
    },
    {
      id: 'mentions-legales',
      title: 'Mentions legales',
      body: [
        'Le present site internet, accessible a l’adresse kendronics.com (ci-apres le « Site »), est edite par : Kendronics, [Nom complet ou raison sociale a completer], [Statut juridique : SAS / SARL / Auto-entrepreneur], [Numero d’immatriculation : RCS ou equivalent], [Numero SIRET le cas echeant], [Numero de TVA intracommunautaire si applicable], Adresse du siege social : [adresse complete].',
        'Adresse electronique : contact.kendronics@gmail.com.',
        'Le directeur de la publication est : Loic NIANZE KENDONG.',
        'Kendronics est une entreprise specialisee dans la mise en relation entre des utilisateurs souhaitant faire fabriquer des circuits imprimes (PCB) et des partenaires de fabrication industriels certifie.',
        'Le service propose comprend notamment : la configuration de circuits imprimes, la transmission de fichiers techniques, la generation de devis automatises, la coordination de la fabrication, l’organisation de la livraison internationale.',
        'Kendronics agit exclusivement en qualite d’intermediaire technique et commercial et ne realise pas directement la fabrication des produits. voir plus...',
      ],
    },
  ],
} satisfies Pick<LegalDocument, 'eyebrow' | 'description' | 'sections'>);

export const privacyDocument: LegalDocument = {
  title: 'Privacy Policy',
  eyebrow: 'Privacy',
  description:
    'How Kendronics collects, uses, stores, shares, and protects account, order, upload, payment, tracking, and support data.',
  lastUpdated: 'April 25, 2026',
  reviewNote:
    'Kendronics may update this policy when data flows, processors, retention rules, or legal requirements change.',
  sections: [
    {
      title: '1. Who we are',
      body: [
        'Kendronics is a France-based PCB ordering, payment, logistics, tracking, and support platform for customers ordering through external manufacturing partners.',
        `Privacy requests may be sent to ${officialContactEmail}. Kendronics may also provide additional company or data protection contacts where required.`,
      ],
    },
    {
      title: '2. Account data',
      body: [
        'We may collect account data such as name, email address, company name, account type, password authentication data, session records, and account activity needed to provide the service.',
        'We use account data to register users, authenticate sessions, secure accounts, manage dashboards, provide notifications, and respond to support requests.',
      ],
    },
    {
      title: '3. Uploaded files',
      body: [
        'We may process uploaded Gerber ZIP files, BOM files, CPL files, design-related attachments, filenames, file validation data, and support attachments.',
        'Uploaded files are used to prepare quotes, coordinate partner manufacturing review, support customer requests, and maintain order history. Customers should avoid uploading unnecessary personal data inside production files.',
      ],
    },
    {
      title: '4. Order and tracking data',
      body: [
        'We may process order IDs, order numbers, quote selections, PCB specifications, destination country, logistics milestones, carrier information, support ticket status, and customer-safe tracking records.',
        'Order data is used for quote generation, payment workflow, partner coordination, delivery coordination, tracking, support, fraud prevention, and operational records.',
      ],
    },
    {
      title: '5. Payment data',
      body: [
        'Payment data may be handled by Stripe, Mobile Money providers, banks, card networks, or other payment processors. Kendronics should not store full card numbers in its own systems.',
        'We may store payment status, provider references, transaction state, order association, refund state, and limited billing metadata needed for accounting, support, and dispute handling.',
      ],
    },
    {
      title: '6. Cookies and device data',
      body: [
        'We may use necessary cookies or similar technologies for authentication, security, preferences, analytics, and platform performance.',
        'Where required, non-essential cookies should be controlled through a consent mechanism. See the Cookie Policy for more detail.',
      ],
    },
    {
      title: '7. Sharing and processors',
      body: [
        'We may share relevant data with external manufacturing partners, logistics providers, payment providers, hosting providers, analytics tools, support tools, and professional advisors where necessary to provide the service.',
        'We do not sell customer production files. Supplier, admin, and sensitive pricing data are not exposed in public tracking views.',
      ],
    },
    {
      title: '8. International transfers',
      body: [
        'Because Kendronics coordinates international manufacturing and logistics, data may be processed in or transferred to countries outside the European Economic Area where partners, providers, or infrastructure are located.',
        'Kendronics applies appropriate safeguards and processor arrangements where transfer rules require them.',
      ],
    },
    {
      title: '9. Data retention',
      body: [
        'We keep data only as long as needed for service delivery, customer support, legal compliance, accounting, security, dispute handling, and legitimate operational records.',
        'Retention periods may vary by data category, including account data, uploaded files, order records, support tickets, payment references, analytics data, and backups.',
      ],
    },
    {
      title: '10. User rights',
      body: [
        'Depending on applicable law, users may have rights to access, correct, delete, restrict, port, or object to processing of personal data, and to withdraw consent where processing is based on consent.',
        `Users may contact ${officialContactEmail} for privacy requests. We may need to verify identity before responding. EU users may also have the right to lodge a complaint with a supervisory authority.`,
      ],
    },
  ],
};

export const refundDocument: LegalDocument = {
  title: 'Refund Policy',
  eyebrow: 'Refunds',
  description:
    'How Kendronics reviews refund requests for quote, payment, manufacturing, file, delivery, and support issues.',
  lastUpdated: 'April 25, 2026',
  reviewNote:
    'Kendronics may update this refund policy as payment providers, order flows, and logistics operations evolve.',
  sections: [
    {
      title: '1. Refund eligibility',
      body: [
        'Refund eligibility is reviewed case by case based on payment status, order status, partner manufacturing status, logistics progress, customer file correctness, and applicable law.',
        'A refund may be possible when payment failed but funds were captured, duplicate payment occurred, Kendronics cannot process the order, or the order is cancelled before costs are committed.',
      ],
    },
    {
      title: '2. Manufacturing already ordered',
      body: [
        'Once Kendronics has placed the order with an external manufacturing partner, refund options may be limited because partner production, handling, materials, or logistics costs may already be committed.',
        'If production has started or finished, refunds may be unavailable except where required by law or approved after case-by-case review.',
      ],
    },
    {
      title: '3. File errors',
      body: [
        'Customers are responsible for uploaded Gerber, BOM, CPL, drill, outline, and related file correctness. File errors caused by customer-provided files may not qualify for refund after partner review or manufacturing begins.',
        'Kendronics may assist with file review, but assistance does not guarantee that customer design files are correct or suitable for the intended use.',
      ],
    },
    {
      title: '4. Failed payments',
      body: [
        'If a payment fails and no funds are captured, no refund is required. If a failed or duplicate payment results in captured funds, Kendronics will review provider records and coordinate reversal or refund where appropriate.',
        'Payment-provider timelines may affect when funds appear back in the customer account.',
      ],
    },
    {
      title: '5. Lost or damaged deliveries',
      body: [
        'Lost or damaged delivery claims are reviewed using carrier records, tracking events, delivery confirmation, package evidence, customer reports, and logistics provider feedback.',
        'Possible outcomes may include replacement coordination, partial refund, carrier claim support, store credit, or no refund, depending on evidence and responsibility.',
      ],
    },
    {
      title: '6. Customs and delays',
      body: [
        'Delays caused by customs, documentation requests, destination-country processing, duties, local delivery conditions, or carrier operations do not automatically create refund eligibility.',
        'Kendronics will review delay-related cases and provide support, but delivery estimates are not guarantees unless explicitly stated in writing.',
      ],
    },
    {
      title: '7. How to request a refund review',
      body: [
        `Open a support ticket or email ${officialContactEmail} with the order ID, payment reference, issue summary, files where relevant, photos for delivery damage, and any carrier or customs communication.`,
        'Kendronics will review the case and respond with the available options based on order status, partner status, payment records, and logistics evidence.',
      ],
    },
  ],
};

export const cookieDocument: LegalDocument = {
  title: 'Cookie Policy',
  eyebrow: 'Cookies',
  description:
    'How Kendronics may use cookies and similar technologies for security, authentication, preferences, analytics, and performance.',
  lastUpdated: 'April 25, 2026',
  reviewNote:
    'Kendronics may update this cookie policy when cookies, vendors, retention periods, or consent tooling change.',
  sections: [
    {
      title: '1. What cookies are',
      body: [
        'Cookies are small files or similar technologies stored on a browser or device. They can help websites remember sessions, preferences, security checks, analytics events, and performance information.',
        'Similar technologies may include local storage, session storage, pixels, tags, SDK identifiers, or server-side analytics identifiers.',
      ],
    },
    {
      title: '2. Necessary cookies',
      body: [
        'Necessary cookies may be used for login sessions, security, fraud prevention, quote flow continuity, cart or order context, form protection, and basic platform operation.',
        'These cookies are required for core service functionality and may not be disabled through platform controls.',
      ],
    },
    {
      title: '3. Preference cookies',
      body: [
        'Preference cookies may remember language, region, interface settings, or other choices that make the platform easier to use.',
        'If disabled, some preferences may need to be selected again on future visits.',
      ],
    },
    {
      title: '4. Analytics and performance cookies',
      body: [
        'Analytics cookies may help Kendronics understand page usage, quote funnel performance, errors, device types, and content effectiveness.',
        'Where required by law, analytics cookies should be used only with consent or configured in a privacy-preserving way.',
      ],
    },
    {
      title: '5. Payment and third-party cookies',
      body: [
        'Stripe, Mobile Money providers, fraud prevention providers, analytics tools, hosting providers, or support tools may use their own cookies or similar technologies when their services are loaded or used.',
        'Third-party cookie behavior is governed by those providers as well as Kendronics configuration and applicable law.',
      ],
    },
    {
      title: '6. Managing cookies',
      body: [
        'Users can control cookies through browser settings. Blocking some cookies may affect login, quote flow, checkout, file upload, tracking, or support functionality.',
        'If a cookie consent banner is implemented, users should be able to manage non-essential cookie choices through that interface where required.',
      ],
    },
    {
      title: '7. Updates',
      body: [
        'Kendronics may update this Cookie Policy when cookies, analytics tools, payment providers, support tools, or legal requirements change.',
        'Kendronics may provide more detailed cookie information, including cookie name, provider, purpose, category, and retention period, when applicable.',
      ],
    },
  ],
};

export const legalDocuments = {
  terms: termsDocument,
  privacy: privacyDocument,
  refund: refundDocument,
  cookies: cookieDocument,
} as const;
