import { Footer } from '../../components/layout/Footer';
import { Navbar } from '../../components/layout/Navbar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Section } from '../../components/ui/Section';

const heroImage =
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=2400&q=85';

const capabilityRows = [
  ['Matériaux', 'FR4, flex, aluminium, copper core, Rogers, PTFE Teflon', 'Disponibles via partenaires pour demandes PCB standards, flexibles, thermiques ou orientées RF.'],
  ['Couches', '1-2, 4, 6, 8 et plus sur demande', 'Le nombre de couches dépend de la complexité, du matériau, de l’empilage et de la revue partenaire.'],
  ['Épaisseurs', 'Plages courantes de 0,4 mm à 2,0 mm, avec revue sur mesure', 'Utile pour cartes compactes, FR4 standards, panneaux rigides ou contraintes mécaniques.'],
  ['Finitions', 'HASL sans plomb, ENIG, immersion silver, OSP, hard gold sur demande', 'La disponibilité dépend du matériau, de l’usage, du délai et de la capacité partenaire.'],
  ['Cuivre', '1 oz, 2 oz et cuivre plus épais sur revue', 'Les poids de cuivre élevés aident courant et thermique, sous réserve de contrôle DFM.'],
  ['Couleurs de masque', 'Vert, noir, blanc, bleu, rouge, jaune, variantes mates selon disponibilité', 'Les couleurs varient selon matériau et ligne de fabrication partenaire.'],
  ['Sérigraphie', 'Blanc, noir et autres options selon couleur PCB et support partenaire', 'Utilisée pour références, polarités, logos et lisibilité assemblage.'],
  ['Options de vias', 'Vias standards, tented, filled, via-in-pad sur revue', 'Les structures avancées exigent une revue fichier et fabricabilité.'],
  ['Tests électriques', 'Flying probe ou test fixture selon disponibilité', 'Aide à détecter ouvertures et courts-circuits avant expédition, surtout sur cartes denses.'],
  ['Disponibilité PCBA', 'Demandes SMT et mixtes sur revue BOM/CPL', 'L’assemblage dépend d’une revue partenaire, pas d’une garantie automatique.'],
  ['Disponibilite pochoir', 'Pochoirs avec ou sans cadre sur demande', 'Utile pour assemblage local, prototypes et application de pate a braser en petit lot.'],
];

const materialRows = [
  ['FR4', 'PCB rigides polyvalents', 'Meilleur choix par défaut pour prototypes et petites séries.', 'Large disponibilité'],
  ['Flex', 'Circuits flexibles et zones pliées', 'Utile quand le PCB doit se plier ou entrer dans un boîtier contraint.', 'Revue partenaire'],
  ['Aluminium', 'LED et cartes thermiques', 'Améliore la dissipation pour puissance et éclairage.', 'Revue partenaire'],
  ['Copper Core', 'Designs à fort transfert thermique', 'Supporte des chemins thermiques exigeants en électronique de puissance.', 'Revue avancée'],
  ['Rogers', 'RF et hautes fréquences', 'Choisi quand le contrôle diélectrique compte plus que le coût FR4.', 'Revue avancée'],
  ['PTFE Teflon', 'RF spécialisé ou faible perte', 'Utilisé pour exigences haute fréquence ou faible perte avec contraintes serrées.', 'Revue avancée'],
];

const finishRows = [
  ['HASL lead-free', 'Prototypes économiques et FR4 courants', 'Abordable et très connu, avec moins de planéité que l’ENIG.'],
  ['ENIG', 'Fine pitch, assemblage et prototypes premium', 'Plat, soudable et adapté à de nombreux designs orientés assemblage.'],
  ['OSP', 'Production courte durée et assemblage simple', 'À planifier soigneusement car stockage et manipulation comptent.'],
  ['Immersion silver', 'Cartes sensibles au signal ou orientées assemblage', 'Bonne soudabilité, avec précautions de stockage et manipulation.'],
  ['Hard gold', 'Gold fingers et surfaces d’usure', 'Utilisé quand la durabilité des connecteurs compte.'],
];

const advancedOptions = [
  ['Gold fingers', 'Placage de connecteur de bord disponible pour contacts, bancs de test ou insertions répétées.'],
  ['Castellated holes', 'Demi-trous en bord de carte pour modules et cartes filles, sous réserve de panelisation.'],
  ['Via-in-pad et vias remplis', 'Structures avancées pour routages denses, BGA et besoins haute performance.'],
  ['Revue impédance contrôlée', 'Disponible quand empilage, matériau et géométrie de pistes exigent une coordination serrée.'],
  ['Parcours PCBA', 'La disponibilité assemblage dépend de la qualité BOM, précision CPL, sourcing composants et revue partenaire.'],
  ['Parcours stencil SMT', 'Les options stencil peuvent être coordonnées avec les commandes PCB nu ou assemblage.'],
];

const visualCards = [
  ['Devis d’abord', 'Sélectionnez les specs principales, puis faites revoir les options avancées si nécessaire.'],
  ['Revue partenaire', 'Matériaux, vias, finitions et assemblage spéciaux passent par contrôle de capacité.'],
  ['Logistique intégrée', 'Les choix techniques restent connectés au paiement, à la livraison et au pays de destination.'],
];

export default function CapabilitiesPage() {
  return (
    <main className="overflow-hidden bg-cloud">
      <Navbar />
      <CapabilitiesHero />

      <Section
        id="technical-capabilities"
        eyebrow="Capacités techniques"
        title="Options PCB disponibles via nos partenaires de fabrication."
        description="Ces capacités décrivent ce que Kendronics peut aider à demander et coordonner. La disponibilité finale dépend de la revue fichier, du matériau, du délai et de la confirmation partenaire."
      >
        <CapabilityTable
          headers={['Capacité', 'Options', 'Note client']}
          rows={capabilityRows}
        />
      </Section>

      <Section
        id="material-comparison"
        eyebrow="Comparatif matériaux"
        title="Choisissez le matériau adapté à l’usage de la carte."
        description="Le FR4 couvre la plupart des prototypes et petites séries. Flex, aluminium, copper core, Rogers et PTFE Teflon sont disponibles via partenaires quand le design l’exige."
      >
        <CapabilityTable
          headers={['Matériau', 'Usage typique', 'Pourquoi le choisir', 'Disponibilité']}
          rows={materialRows}
        />
      </Section>

      <Section
        id="finish-comparison"
        eyebrow="Comparatif finitions"
        title="La finition influence soudabilité, coût, stockage et connecteurs."
        description="Kendronics aide à choisir une finition cohérente avant de coordonner la demande avec la capacité partenaire."
      >
        <CapabilityTable
          headers={['Finition', 'Usage typique', 'Note pratique']}
          rows={finishRows}
        />
      </Section>

      <Section
        id="advanced-options"
        eyebrow="Options avancées"
        title="Fonctions spéciales pour cartes au-delà du devis standard."
        description="Les options avancées sont revues dans le contexte de la demande, car la fabricabilité dépend des fichiers, de l’empilage, des tolérances et du partenaire."
      >
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {advancedOptions.map(([title, body]) => (
            <Card key={title} glass className="p-6 transition duration-300 hover:-translate-y-1">
              <h3 className="text-lg font-black text-ink">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        id="partner-note"
        eyebrow="Fabrication partenaire"
        title="Kendronics coordonne l’accès aux capacités. Les partenaires fabriquent les cartes."
        description="Kendronics est une plateforme de commande, paiement, logistique, suivi et support. Elle ne prétend pas posséder les usines ou lignes de production associées."
      >
        <div className="grid gap-5 lg:grid-cols-[1fr_24rem]">
          <Card className="p-6">
            <h2 className="text-2xl font-black tracking-tight text-ink">Comment les demandes de capacité sont traitées</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Les options standards peuvent avancer rapidement dans le devis. Matériaux spécialisés, cuivre épais, gold fingers,
              castellated holes, via-in-pad, impédance contrôlée, PCBA et stencils peuvent demander une revue partenaire avant
              confirmation du prix, du délai ou de la fabricabilité.
            </p>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Cette approche garde l’expérience client claire tout en protégeant les informations fournisseur, prix et admin sensibles.
              Le client voit un statut adapté, les mises à jour support et les jalons de suivi.
            </p>
          </Card>
          <Card className="overflow-hidden">
            <div className="image-reflection relative overflow-hidden">
              <img
                src="https://images.pexels.com/photos/7285976/pexels-photo-7285976.jpeg?auto=compress&cs=tinysrgb&w=1200"
                alt="Engineer inspecting a printed circuit board"
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
            </div>
            <div className="p-6">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-signal">Lecture technique</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Les tableaux aident à cadrer les possibilités techniques sans sous-entendre que Kendronics possède les lignes de fabrication.
              </p>
            </div>
          </Card>
        </div>
      </Section>

      <Section id="cta" className="pt-4">
        <div className="relative overflow-hidden rounded-3xl bg-deepblue p-8 text-white sm:p-10 lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-10">
          <img
            src="https://images.pexels.com/photos/7174650/pexels-photo-7174650.jpeg?auto=compress&cs=tinysrgb&w=1800"
            alt="Close-up of PCB components"
            className="absolute inset-0 h-full w-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-deepblue via-deepblue/[0.9] to-ink/[0.72]" />
          <div className="relative">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-sky-100">Prêt à configurer ?</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Commencez par un devis, puis demandez une revue partenaire si nécessaire.
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-sky-100 sm:text-base">
              Téléversez les Gerbers, choisissez les specs principales, sélectionnez le pays de destination et utilisez le dossier pour les options avancées.
            </p>
          </div>
          <div className="relative mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0 lg:flex-col">
            <Button href="/quote" variant="light">
              Demander un devis
            </Button>
            <Button href="/services" variant="secondary">
              Voir les services
            </Button>
          </div>
        </div>
      </Section>

      <Footer />
    </main>
  );
}

function CapabilitiesHero() {
  return (
    <section className="relative min-h-[78vh] overflow-hidden bg-ink text-white">
      <img src={heroImage} alt="Macro close-up of a printed circuit board" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink/[0.82] to-deepblue/[0.56]" />
      <div className="relative mx-auto grid min-h-[78vh] max-w-7xl gap-10 px-4 pb-24 pt-36 sm:px-6 lg:grid-cols-[1fr_26rem] lg:items-center lg:px-8">
        <div>
          <p className="inline-flex rounded-xl border border-white/[0.18] bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-sky-100 backdrop-blur-xl">
            Capacités techniques
          </p>
          <h1 className="mt-7 max-w-5xl text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">
            Options de fabrication disponibles via nos partenaires PCB.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
            Explorez matériaux, empilages, finitions, cuivre, vias, PCBA et stencils que Kendronics peut aider à coordonner via des partenaires externes.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button href="/quote">Demander un devis</Button>
            <Button href="#technical-capabilities" variant="secondary">
              Voir les tableaux
            </Button>
          </div>
        </div>

        <Card glass className="hidden p-5 text-white lg:block">
          <div className="image-reflection relative overflow-hidden rounded-2xl">
            <img
              src="https://cdn.pixabay.com/photo/2022/02/02/10/09/printed-circuit-board-6979572_1280.jpg"
              alt="Printed circuit board detail"
              className="aspect-[4/5] w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/[0.72] via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/[0.18] bg-white/[0.12] p-4 backdrop-blur-xl">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-100">Parcours capacité</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm font-black">
                {['Specs', 'Revue', 'Devis'].map((item) => (
                  <span key={item} className="rounded-xl bg-white/12 px-3 py-3">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}

function CapabilityTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
          <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-5 py-4">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map((row) => (
              <tr key={row.join(':')} className="align-top">
                {row.map((cell, index) => (
                  <td key={`${cell}-${index}`} className={`px-5 py-4 ${index === 0 ? 'font-black text-deepblue' : 'leading-6 text-slate-600'}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
