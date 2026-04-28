import type { Metadata } from 'next';
import { Footer } from '../../components/layout/Footer';
import { Navbar } from '../../components/layout/Navbar';
import { Card } from '../../components/ui/Card';
import { Section } from '../../components/ui/Section';

export const metadata: Metadata = {
  title: "Centre d'aide | Kendronics",
  description: "Point d'entree vers le suivi, la FAQ, le guide technique, les capacites PCB et le support Kendronics.",
};

const helpLinks = [
  ['Guide technique', '/guide-technique', 'Gerber, logiciels PCB, erreurs frequentes et bases pour debuter.'],
  ['Capacite', '/capabilities', 'Materiaux, finitions, couches, vias et options techniques disponibles.'],
  ['Comment ca marche', '/how-it-works', 'Etapes entre upload, devis, paiement, coordination et livraison.'],
  ['Suivi de commande', '/tracking', 'Consulter les informations publiques de progression et de livraison.'],
  ['FAQ', '/faq', 'Reponses aux questions courantes sur Kendronics et les commandes PCB.'],
  ['Contacter le support', '/contact', 'Envoyer une demande avec le contexte de votre commande ou fichier.'],
];

export default function HelpCenterPage() {
  return (
    <main className="min-h-screen bg-cloud">
      <Navbar />

      <section className="border-b border-line bg-white pt-36">
        <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          <p className="label-caps text-deepblue">Support Kendronics</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight text-ink sm:text-5xl">Centre d'aide</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
            Retrouvez rapidement les pages utiles pour preparer vos fichiers, comprendre le service, suivre une commande
            ou contacter l'equipe support.
          </p>
        </div>
      </section>

      <Section title="Trouver une reponse" description="Choisissez la rubrique la plus proche de votre probleme.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {helpLinks.map(([title, href, body]) => (
            <Card key={href} className="p-5">
              <h2 className="text-lg font-black text-ink">{title}</h2>
              <p className="mt-3 min-h-16 text-sm leading-6 text-slate-600">{body}</p>
              <a href={href} className="mt-5 inline-flex h-10 items-center bg-deepblue px-4 text-sm font-black text-white">
                Ouvrir
              </a>
            </Card>
          ))}
        </div>
      </Section>

      <Footer />
    </main>
  );
}
