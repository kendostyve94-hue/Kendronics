import type { Metadata } from 'next';
import { Footer } from '../../../components/layout/Footer';
import { Navbar } from '../../../components/layout/Navbar';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';

export const metadata: Metadata = {
  title: 'Conditions Generales de Vente | Kendronics',
  description:
    'Conditions Generales de Vente Kendronics applicables aux commandes PCB, au paiement, a la fabrication par partenaires externes et a la livraison internationale.',
};

const heroImage =
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=2400&q=85';

const introduction = [
  'Les presentes Conditions Generales de Vente (ci-apres les « CGV ») ont pour objet de definir les droits et obligations contractuels applicables a toute commande passee sur la plateforme Kendronics, accessible via le site internet exploite par l’editeur.',
  'Kendronics est une plateforme digitale specialisee dans la mise en relation entre des utilisateurs souhaitant faire fabriquer des circuits imprimes (PCB) et des partenaires industriels tiers disposant des capacites techniques necessaires a leur production.',
  'Le service propose repose sur une infrastructure logicielle permettant notamment : la configuration technique de circuits imprimes a partir de fichiers fournis par l’utilisateur, la generation automatisee de devis, la gestion de la commande, la coordination logistique internationale.',
  'Il est expressement precise que Kendronics n’intervient pas en qualite de fabricant, mais exclusivement en qualite d’intermediaire technique et commercial.',
  'Toute commande implique l’acceptation sans reserve des presentes CGV.',
];

const articles: Array<{
  title: string;
  paragraphs: string[];
  bullets?: string[];
}> = [
  {
    title: 'Article 1 — Champ d’application',
    paragraphs: [
      'Les presentes CGV s’appliquent a l’ensemble des ventes realisees via la plateforme Kendronics, a destination de tout client, qu’il soit une personne physique ou morale, agissant a titre professionnel ou non.',
      'Elles prevalent sur tout autre document, sauf accord expres ecrit.',
    ],
  },
  {
    title: 'Article 2 — Description du service',
    paragraphs: [
      'Le service fourni par Kendronics consiste a proposer une interface permettant au client :',
    ],
    bullets: [
      'de transmettre des fichiers de conception electronique, notamment au format Gerber,',
      'de parametrer les caracteristiques techniques des circuits imprimes,',
      'd’obtenir une estimation tarifaire automatisee,',
      'de passer commande,',
      'd’organiser la livraison internationale.',
      'Kendronics agit en tant qu’intermediaire et ne garantit pas un resultat specifique en termes de fabrication.',
    ],
  },
  {
    title: 'Article 3 — Processus de commande',
    paragraphs: [
      'Le processus de commande comprend plusieurs etapes successives, que le client reconnait et accepte :',
    ],
    bullets: [
      'telechargement des fichiers techniques,',
      'configuration des parametres de fabrication,',
      'generation d’un devis,',
      'validation de la commande,',
      'paiement.',
      'Une fois validee, la commande est reputee ferme, definitive et irrevocable.',
      'Aucune modification ne peut etre effectuee apres validation, en raison du caractere personnalise du produit.',
    ],
  },
  {
    title: 'Article 4 — Prix et conditions financieres',
    paragraphs: [
      'Les prix affiches sur la plateforme sont calcules de maniere automatisee a partir des parametres fournis par le client.',
      'Ils sont exprimes dans la devise indiquee lors de la commande et peuvent inclure :',
    ],
    bullets: [
      'le cout de fabrication,',
      'les frais de traitement,',
      'les frais logistiques estimes.',
      'Les frais de douane, taxes d’importation et autres couts annexes ne sont pas inclus, sauf mention contraire.',
      'Kendronics se reserve le droit de modifier ses tarifs a tout moment.',
    ],
  },
  {
    title: 'Article 5 — Modalites de paiement',
    paragraphs: [
      'Le paiement est exigible en totalite au moment de la commande.',
      'Les transactions sont traitees via des prestataires de paiement securises, notamment Stripe.',
      'Kendronics ne conserve aucune donnee bancaire.',
      'En cas d’echec du paiement, la commande est automatiquement annulee.',
    ],
  },
  {
    title: 'Article 6 — Nature des produits',
    paragraphs: [
      'Les produits proposes sont des circuits imprimes fabriques sur mesure, selon les specifications fournies par le client.',
      'En consequence :',
    ],
    bullets: [
      'chaque produit est unique,',
      'aucune revente standardisee n’est possible,',
      'aucun echange n’est applicable.',
    ],
  },
  {
    title: 'Article 7 — Responsabilite du client',
    paragraphs: ['Le client reconnait etre seul responsable :'],
    bullets: [
      'de la qualite et de la validite des fichiers fournis,',
      'de la conformite technique des specifications,',
      'de l’usage final du produit.',
      'Kendronics n’effectue aucun controle approfondi des fichiers transmis.',
      'Toute erreur de conception ne pourra engager la responsabilite de Kendronics.',
    ],
  },
  {
    title: 'Article 8 — Fabrication par des tiers',
    paragraphs: [
      'La fabrication des produits est assuree par des partenaires industriels externes.',
      'Kendronics ne saurait etre tenu responsable :',
    ],
    bullets: [
      'des defauts de fabrication,',
      'des variations techniques,',
      'des limitations industrielles.',
    ],
  },
  {
    title: 'Article 9 — Livraison internationale',
    paragraphs: [
      'Les produits sont expedies depuis l’etranger vers le pays du client.',
      'Les delais sont donnes a titre indicatif.',
      'Kendronics ne peut etre tenu responsable des retards lies :',
    ],
    bullets: [
      'aux transporteurs,',
      'aux autorites douanieres,',
      'a des evenements exterieurs.',
    ],
  },
  {
    title: 'Article 10 — Douanes et importation',
    paragraphs: [
      'Le client est considere comme l’importateur officiel des produits.',
      'Il lui appartient de :',
    ],
    bullets: [
      's’acquitter des droits de douane,',
      'payer les taxes locales,',
      'respecter la reglementation de son pays.',
      'En cas de refus de paiement des frais douaniers, aucun remboursement ne pourra etre exige.',
    ],
  },
  {
    title: 'Article 11 — Transfert des risques',
    paragraphs: [
      'Il est expressement convenu que les risques afferents aux produits, notamment les risques de perte, de deterioration ou de retard, sont transferes au client des la remise des marchandises au transporteur.',
      'Ce transfert intervient independamment du transfert de propriete et s’applique quel que soit le mode de transport choisi.',
      'En consequence, toute reclamation relative a la perte ou a l’endommagement survenu pendant le transport devra etre adressee directement au transporteur concerne, dans les delais legaux applicables.',
      'Kendronics ne saurait etre tenu responsable des dommages survenus posterieurement a la prise en charge par le transporteur.',
    ],
  },
  {
    title: 'Article 12 — Delais de livraison',
    paragraphs: [
      'Les delais de livraison communiques lors de la commande sont donnes a titre purement indicatif.',
      'Ces delais peuvent varier en fonction de plusieurs facteurs independants de la volonte de Kendronics, notamment :',
    ],
    bullets: [
      'la charge de production des partenaires industriels,',
      'les contraintes logistiques internationales,',
      'les delais de traitement douanier,',
      'les conditions geopolitiques ou sanitaires.',
      'Aucun retard de livraison ne pourra donner lieu a annulation de la commande, remboursement, indemnisation ou penalites.',
      'Le client reconnait expressement accepter ces aleas inherents a la nature du service.',
    ],
  },
  {
    title: 'Article 13 — Droit de retractation',
    paragraphs: [
      'Conformement aux dispositions de l’article L221-28 du Code de la consommation, le droit de retractation ne s’applique pas aux contrats portant sur la fourniture de biens confectionnes selon les specifications du consommateur ou nettement personnalises.',
      'Les produits proposes par Kendronics etant fabriques sur mesure a partir des fichiers fournis par le client, aucune faculte de retractation ne peut etre exercee apres validation de la commande.',
      'Le client renonce expressement a ce droit des la validation de la commande.',
    ],
  },
  {
    title: 'Article 14 — Service apres-vente et reclamations',
    paragraphs: [
      'Toute reclamation relative a une commande doit etre formulee dans un delai de sept (7) jours calendaires a compter de la reception des produits.',
      'La reclamation devra etre accompagnee d’elements probants, incluant notamment :',
    ],
    bullets: [
      'des photographies detaillees,',
      'une description precise du defaut constate,',
      'toute information utile a l’analyse technique.',
      'Kendronics procedera a une analyse preliminaire du dossier avant transmission au partenaire industriel concerne.',
      'En fonction des conclusions, les solutions suivantes pourront etre proposees, a titre discretionnaire : refabrication totale ou partielle, remboursement partiel ou rejet de la demande.',
      'Aucune prise en charge ne sera accordee en cas d’erreur de conception du client, de fichiers incorrects ou incomplets, de mauvaise utilisation du produit ou de defaut lie a une mauvaise interpretation des specifications.',
    ],
  },
  {
    title: 'Article 15 — Limitation de responsabilite',
    paragraphs: [
      'Kendronics est tenu a une obligation de moyens dans l’execution de ses prestations.',
      'En aucun cas, Kendronics ne pourra etre tenu responsable de pertes indirectes, pertes de chiffre d’affaires, pertes d’exploitation, pertes de donnees, atteinte a l’image ou a la reputation.',
      'La responsabilite totale de Kendronics, toutes causes confondues, est strictement limitee au montant effectivement paye par le client au titre de la commande concernee.',
    ],
  },
  {
    title: 'Article 16 — Force majeure',
    paragraphs: [
      'Kendronics ne pourra etre tenu responsable de l’inexecution totale ou partielle de ses obligations en cas de survenance d’un evenement de force majeure.',
      'Sont notamment consideres comme cas de force majeure :',
    ],
    bullets: [
      'catastrophes naturelles,',
      'conflits armes,',
      'pandemies,',
      'greves,',
      'blocages logistiques,',
      'decisions gouvernementales.',
      'Dans une telle situation, l’execution du contrat est suspendue pendant la duree de l’evenement.',
    ],
  },
  {
    title: 'Article 17 — Propriete intellectuelle',
    paragraphs: [
      'Le client demeure titulaire de l’ensemble des droits de propriete intellectuelle attaches aux fichiers transmis.',
      'Toutefois, le client autorise expressement Kendronics a utiliser ces fichiers dans le cadre strict de la commande, a les transmettre aux partenaires industriels et a les conserver temporairement a des fins de traitement.',
      'Kendronics s’engage a ne pas exploiter ces fichiers a des fins commerciales propres.',
    ],
  },
  {
    title: 'Article 18 — Confidentialite',
    paragraphs: [
      'Kendronics met en oeuvre des mesures raisonnables visant a assurer la confidentialite des donnees et fichiers transmis.',
      'Toutefois, le client reconnait que les donnees peuvent transiter par des systemes tiers et qu’une transmission internationale comporte des risques inherents.',
      'Kendronics ne saurait garantir une securite absolue.',
    ],
  },
  {
    title: 'Article 19 — Donnees personnelles',
    paragraphs: [
      'Les donnees personnelles collectees dans le cadre de l’utilisation de la plateforme sont traitees conformement a la reglementation en vigueur.',
      'Le client dispose notamment des droits suivants :',
    ],
    bullets: [
      'droit d’acces,',
      'droit de rectification,',
      'droit de suppression,',
      'droit d’opposition.',
      'Pour toute demande, le client peut contacter : contact@kendronics.com.',
      'En cas de litige, une reclamation peut etre adressee aupres de la CNIL.',
    ],
  },
  {
    title: 'Article 20 — Suspension du service',
    paragraphs: [
      'Kendronics se reserve le droit de suspendre ou restreindre l’acces au service en cas de violation des presentes CGV, de comportement frauduleux ou d’utilisation abusive de la plateforme.',
      'Cette suspension peut intervenir sans preavis.',
    ],
  },
  {
    title: 'Article 21 — Modification des CGV',
    paragraphs: [
      'Kendronics se reserve le droit de modifier a tout moment les presentes CGV afin de les adapter aux evolutions legales, aux evolutions techniques et aux evolutions du service.',
      'Les CGV applicables sont celles en vigueur au moment de la commande.',
    ],
  },
  {
    title: 'Article 22 — Droit applicable',
    paragraphs: ['Les presentes CGV sont regies par le droit francais.'],
  },
  {
    title: 'Article 23 — Litiges et juridiction competente',
    paragraphs: [
      'Tout litige relatif a l’interpretation ou a l’execution des presentes CGV fera l’objet d’une tentative de resolution amiable.',
      'A defaut d’accord amiable, le litige sera soumis a la competence exclusive des tribunaux francais.',
    ],
  },
  {
    title: 'Article 24 — Nullite partielle',
    paragraphs: [
      'Si une clause des presentes CGV devait etre declaree nulle ou inapplicable, les autres dispositions demeureront pleinement en vigueur.',
    ],
  },
  {
    title: 'Article 25 — Integralite du contrat',
    paragraphs: [
      'Les presentes CGV constituent l’integralite de l’accord entre les parties.',
      'Elles remplacent tout accord ou document anterieur.',
    ],
  },
];

export default function ConditionsGeneralesDeVentePage() {
  return (
    <main className="overflow-hidden bg-cloud">
      <Navbar />
      <section className="relative min-h-[52vh] overflow-hidden bg-ink text-white">
        <img src={heroImage} alt="Macro close-up of a printed circuit board" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink/[0.88] to-deepblue/[0.62]" />
        <div className="relative mx-auto flex min-h-[52vh] max-w-[1440px] items-end px-4 pb-14 pt-32 sm:px-6 lg:px-8">
          <div>
            <p className="inline-flex rounded-sm border border-white/[0.18] bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-sky-100 backdrop-blur-xl">
              Cadre legal
            </p>
            <h1 className="mt-7 max-w-5xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Conditions Generales de Vente
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
              Conditions applicables aux commandes PCB passees sur la plateforme Kendronics.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1120px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Button href="/terms" variant="secondary">
            Retour au cadre legal
          </Button>
          <span className="text-sm font-semibold text-slate-500">Derniere mise a jour : April 25, 2026</span>
        </div>

        <Card className="p-6 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-signal">Kendronics</p>
          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600 sm:text-base">
            {introduction.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </Card>

        <div className="mt-5 grid gap-4">
          {articles.map((article) => (
            <Card key={article.title} className="p-6 sm:p-7">
              <h2 className="text-xl font-black tracking-tight text-ink sm:text-2xl">{article.title}</h2>
              <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600 sm:text-base">
                {article.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {article.bullets ? (
                  <ul className="list-disc space-y-2 pl-5">
                    {article.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
