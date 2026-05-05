'use client';

import { useMemo, useState } from 'react';
import { Footer } from '../../components/layout/Footer';
import { Navbar } from '../../components/layout/Navbar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

type FaqItem = {
  question: string;
  answer: string;
};

type FaqCategory = {
  id: string;
  title: string;
  description: string;
  items: FaqItem[];
};

const heroImage =
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=2400&q=85';

const faqCategories: FaqCategory[] = [
  {
    id: 'platform-role',
    title: 'Rôle de la plateforme',
    description: 'Comment Kendronics relie clients, partenaires de fabrication, paiement, logistique et support.',
    items: [
      {
        question: 'Kendronics est-il un fabricant ?',
        answer:
          'Non. Kendronics est une plateforme intermédiaire pour commande PCB, paiement, coordination logistique, suivi et support. Les cartes sont fabriquées par des partenaires externes.',
      },
      {
        question: 'Qui fabrique les PCB ?',
        answer:
          'Les PCB sont fabriqués par des partenaires externes. Kendronics coordonne la demande client, le flux partenaire, la logistique, le paiement et le support.',
      },
      {
        question: 'Pourquoi passer par Kendronics plutôt que commander directement ?',
        answer:
          'Kendronics donne aux clients africains une couche opérationnelle claire : configuration devis, paiement, coordination partenaire, logistique France, livraison Afrique, suivi client et tickets support au même endroit.',
      },
    ],
  },
  {
    id: 'pcb-files',
    title: 'Fichiers PCB',
    description: 'Ce que le client doit téléverser avant de faire avancer un devis ou une demande de fabrication.',
    items: [
      {
        question: 'Qu’est-ce qu’un fichier Gerber ?',
        answer:
          'Un fichier Gerber est un export de production issu de votre outil PCB. Il décrit couches cuivre, masque, sérigraphie, contour et informations utilisées par les partenaires de fabrication.',
      },
      {
        question: 'Quels fichiers faut-il préparer ?',
        answer:
          'Pour un PCB nu, préparez un ZIP Gerber avec cuivre, masque, sérigraphie, contour et perçages. Pour une demande PCBA, BOM et CPL peuvent aussi être nécessaires.',
      },
      {
        question: 'Que se passe-t-il si mes fichiers sont incorrects ?',
        answer:
          'Si les fichiers sont incomplets ou ambigus, la commande peut nécessiter une revue. Le support peut aider à identifier les problèmes, mais les fichiers corrigés doivent venir du client ou de son équipe design.',
      },
    ],
  },
  {
    id: 'pricing',
    title: 'Prix',
    description: 'Comment fonctionne le prix dynamique et pourquoi les grilles fixes peuvent induire en erreur.',
    items: [
      {
        question: 'Comment le prix est-il calculé ?',
        answer:
          'Le prix combine fabrication partenaire, traitement partenaire, logistique Chine vers France quand applicable, traitement France, livraison Afrique, frais de paiement, service Kendronics et marge de risque éventuelle.',
      },
      {
        question: 'Pourquoi le pays de livraison influence-t-il le prix ?',
        answer:
          'Le pays influence transporteurs, douane, routage, délai et dernier kilomètre. Le même PCB peut donc avoir un total différent selon la destination.',
      },
      {
        question: 'Les prix sont-ils définitifs ?',
        answer:
          'Les prix du configurateur reflètent le scénario choisi, mais matériaux avancés, PCBA, fichiers inhabituels ou changements logistiques peuvent demander revue partenaire avant confirmation finale.',
      },
    ],
  },
  {
    id: 'payment',
    title: 'Paiement',
    description: 'Comment les clients paient et comment les questions de paiement sont traitées.',
    items: [
      {
        question: 'Comment fonctionnent les paiements carte ?',
        answer:
          'Les paiements carte passent par Stripe Checkout quand disponible. Kendronics ne demande pas d’envoyer des informations carte par e-mail ou ticket support.',
      },
      {
        question: 'Kendronics prend-il en charge Mobile Money ?',
        answer:
          'La plateforme inclut une architecture prête pour Mobile Money. La disponibilité dépend des prestataires, marchés et réglages actifs du parcours de commande.',
      },
      {
        question: 'Comment fonctionnent les remboursements ?',
        answer:
          'Le remboursement dépend de l’état de commande, du paiement, de l’avancement partenaire et des coûts déjà engagés. Le support analyse la demande dans le contexte de la commande.',
      },
    ],
  },
  {
    id: 'delivery',
    title: 'Livraison',
    description: 'Ce que les clients doivent savoir sur livraison Afrique, délais, douane et suivi.',
    items: [
      {
        question: 'Quels pays africains sont pris en charge ?',
        answer:
          'Kendronics est conçu pour coordonner des livraisons orientées Afrique. Les pays pris en charge dépendent de la couverture logistique, des transporteurs, de la douane et du devis.',
      },
      {
        question: 'Combien de temps prend la livraison ?',
        answer:
          'Le délai dépend de la fabrication, de la logistique entrante, du traitement France, du pays de destination, de la douane, du transporteur et des conditions locales.',
      },
      {
        question: 'La douane peut-elle créer des retards ?',
        answer:
          'Oui. Contrôles, documents, droits, processus transporteur et conditions locales peuvent créer des retards. Quand applicable, le devis peut inclure une marge de risque.',
      },
      {
        question: 'Comment fonctionne le suivi ?',
        answer:
          'Le suivi public affiche statut, timeline, estimation, pays et transporteur quand disponibles. Il n’expose pas les données fournisseur, admin ou prix sensibles.',
      },
    ],
  },
  {
    id: 'support',
    title: 'Support',
    description: 'Comment obtenir de l’aide avant, pendant et après une commande.',
    items: [
      {
        question: 'Comment contacter le support ?',
        answer:
          'Utilisez le parcours support ou le contexte commande quand disponible. Numéro de commande, fichiers, pays et paiement aident à répondre plus vite.',
      },
      {
        question: 'Comment ouvrir un ticket ?',
        answer:
          'Ouvrez un ticket depuis le parcours client ou la page commande quand disponible. Le ticket garde la question attachée à la commande, aux fichiers et au suivi.',
      },
    ],
  },
];

const allCategoryId = 'all';

export default function FaqPage() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(allCategoryId);

  const filteredCategories = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return faqCategories
      .filter((category) => activeCategory === allCategoryId || category.id === activeCategory)
      .map((category) => ({
        ...category,
        items: category.items.filter((item) => {
          if (!normalizedQuery) return true;
          return `${category.title} ${category.description} ${item.question} ${item.answer}`
            .toLowerCase()
            .includes(normalizedQuery);
        }),
      }))
      .filter((category) => category.items.length > 0);
  }, [activeCategory, query]);

  const resultCount = filteredCategories.reduce((total, category) => total + category.items.length, 0);

  return (
    <main className="overflow-hidden bg-cloud">
      <Navbar />
      <FaqHero />

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <Card glass className="p-5 sm:p-6">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-600">Rechercher dans la FAQ</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher fabrication, Gerber, prix, livraison, remboursement..."
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-ink outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
              />
            </label>
            <div className="text-sm font-bold text-slate-600">
              {resultCount} {resultCount === 1 ? 'réponse' : 'réponses'} affichées
            </div>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            <CategoryButton
              label="Tout"
              active={activeCategory === allCategoryId}
              onClick={() => setActiveCategory(allCategoryId)}
            />
            {faqCategories.map((category) => (
              <CategoryButton
                key={category.id}
                label={category.title}
                active={activeCategory === category.id}
                onClick={() => setActiveCategory(category.id)}
              />
            ))}
          </div>
        </Card>

        <div className="mt-8 space-y-8">
          {filteredCategories.map((category) => (
            <section key={category.id} id={category.id}>
              <div className="mb-4 max-w-3xl">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-signal">{category.title}</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-ink sm:text-3xl">{category.description}</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {category.items.map((item) => (
                  <FaqCard key={item.question} item={item} />
                ))}
              </div>
            </section>
          ))}

          {resultCount === 0 && (
            <Card className="p-8 text-center">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-signal">Aucun résultat</p>
              <h2 className="mt-2 text-2xl font-black text-ink">Essayez un autre mot clé.</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
                Recherchez par sujet, par exemple Gerber, paiement, douane, fabrication, suivi, livraison ou remboursement.
              </p>
            </Card>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-deepblue p-8 text-white sm:p-10 lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-10">
          <img
            src="https://images.pexels.com/photos/7174650/pexels-photo-7174650.jpeg?auto=compress&cs=tinysrgb&w=1800"
            alt="Close-up of PCB components"
            className="absolute inset-0 h-full w-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-deepblue via-deepblue/[0.9] to-ink/[0.72]" />
          <div className="relative">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-sky-100">Encore une question ?</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Commencez par un devis ou consultez le parcours complet.
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-sky-100 sm:text-base">
              Le configurateur et le suivi gardent les informations client séparées des données partenaire, admin et fournisseur.
            </p>
          </div>
          <div className="relative mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0 lg:flex-col">
            <Button href="/quote" variant="light">
              Demander un devis
            </Button>
            <Button href="/how-it-works" variant="secondary">
              Parcours client
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function FaqHero() {
  return (
    <section className="relative min-h-[68vh] overflow-hidden bg-ink text-white">
      <img src={heroImage} alt="Macro close-up of a printed circuit board" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink/[0.84] to-deepblue/[0.56]" />
      <div className="relative mx-auto flex min-h-[68vh] max-w-7xl items-end px-4 pb-20 pt-36 sm:px-6 lg:px-8">
        <div>
          <p className="inline-flex rounded-xl border border-white/[0.18] bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-sky-100 backdrop-blur-xl">
            FAQ
          </p>
          <h1 className="mt-7 max-w-5xl text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">
            Des réponses claires pour commander, payer, livrer et suivre vos PCB.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
            Kendronics est une plateforme intermédiaire, pas un fabricant PCB. Ces réponses expliquent comment les clients travaillent avec Kendronics et les partenaires externes.
          </p>
        </div>
      </div>
    </section>
  );
}

function CategoryButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-11 shrink-0 rounded-xl px-4 text-sm font-black transition ${
        active ? 'bg-deepblue text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:text-deepblue'
      }`}
    >
      {label}
    </button>
  );
}

function FaqCard({ item }: { item: FaqItem }) {
  return (
    <Card className="p-6 transition duration-300 hover:-translate-y-1">
      <h3 className="text-lg font-black text-ink">{item.question}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{item.answer}</p>
    </Card>
  );
}
