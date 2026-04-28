import type { Metadata } from 'next';
import { Footer } from '../../components/layout/Footer';
import { Navbar } from '../../components/layout/Navbar';
import { Card } from '../../components/ui/Card';
import { Section } from '../../components/ui/Section';

export const metadata: Metadata = {
  title: 'Guide technique | Kendronics',
  description:
    'Solutions pratiques pour preparer un fichier Gerber, installer les logiciels de conception PCB, verifier les bases et eviter les erreurs de fabrication.',
};

const guideSections = [
  {
    title: 'Creer un fichier Gerber propre',
    items: [
      'Exporter toutes les couches utiles: cuivre, solder mask, silkscreen, contour carte et fichiers de percage Excellon.',
      'Verifier que le contour de carte est ferme et place sur une couche claire, souvent Edge.Cuts ou Board Outline.',
      'Regrouper les fichiers dans un ZIP sans dossier inutile afin que la verification soit plus rapide.',
    ],
  },
  {
    title: 'Installer les logiciels de conception',
    items: [
      'KiCad convient bien aux debutants comme aux projets professionnels, avec schema, routage PCB et visualiseur Gerber.',
      'EasyEDA est pratique pour demarrer rapidement dans le navigateur et exporter des Gerber standards.',
      'Avant de commander, ouvrir le ZIP dans un visualiseur Gerber pour confirmer les dimensions, les trous et les textes.',
    ],
  },
  {
    title: 'Problemes frequents avant commande',
    items: [
      'Dimensions incorrectes: comparer la taille exportee avec la taille attendue dans votre outil de CAO.',
      'Trous manquants: verifier que le fichier drill est bien inclus et utilise les memes unites que le Gerber.',
      'Textes inverses ou trop petits: controler la couche silkscreen et garder une taille lisible apres fabrication.',
    ],
  },
  {
    title: 'Bases PCB pour debuter',
    items: [
      'Commencer avec FR-4, 2 couches, epaisseur 1.6 mm, masque vert et finition HASL lead-free pour reduire les risques.',
      'Respecter les largeurs de pistes, espacements et diametres de vias recommandes par le fabricant.',
      'Lancer un DRC avant export pour detecter les courts-circuits, pistes trop fines et erreurs de placement.',
    ],
  },
];

const checklists = [
  ['Avant export', 'Schema annote, empreintes associees, DRC propre, dimensions confirmees.'],
  ['Avant upload', 'ZIP Gerber complet, fichier drill present, visualisation 2D confirmee.'],
  ['Avant paiement', 'Quantite, pays de livraison, delai, assemblage et fichiers BOM/CPL verifies.'],
];

export default function TechnicalGuidePage() {
  return (
    <main className="min-h-screen bg-cloud">
      <Navbar />

      <section className="border-b border-line bg-white pt-36">
        <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          <p className="label-caps text-deepblue">Rubrique technique</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight text-ink sm:text-5xl">
            Guide technique pour preparer vos fichiers PCB sans blocage.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
            Cette page rassemble les solutions les plus utiles dans la vraie vie: creation de fichiers Gerber,
            installation des logiciels, verification avant commande et bases essentielles pour debuter.
          </p>
        </div>
      </section>

      <Section title="Solutions rapides" description="Utilisez ces rubriques comme point de controle avant de lancer une commande Kendronics.">
        <div className="grid gap-5 md:grid-cols-2">
          {guideSections.map((section) => (
            <Card key={section.title} className="p-6">
              <h2 className="text-xl font-black text-ink">{section.title}</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                {section.items.map((item) => (
                  <li key={item} className="border-l-4 border-deepblue pl-3">
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Checklist de commande" description="Un controle simple evite la plupart des retards de production.">
        <div className="grid gap-4 md:grid-cols-3">
          {checklists.map(([title, body]) => (
            <Card key={title} className="p-5">
              <h2 className="text-lg font-black text-ink">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section className="pt-0">
        <div className="grid gap-4 md:grid-cols-3">
          <a href="/quote" className="border border-line bg-deepblue p-5 text-sm font-black text-white shadow-sm">
            Configurer une commande
          </a>
          <a href="/capabilities" className="border border-line bg-white p-5 text-sm font-black text-deepblue shadow-sm">
            Voir les capacites PCB
          </a>
          <a href="/contact" className="border border-line bg-white p-5 text-sm font-black text-deepblue shadow-sm">
            Contacter le support
          </a>
        </div>
      </Section>

      <Footer />
    </main>
  );
}
