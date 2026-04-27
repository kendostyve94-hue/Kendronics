export interface CustomerComment {
  id: string;
  name: string;
  role: string;
  rating: number;
  body: string;
  createdAt: string;
}

export const approvedCustomerComments: CustomerComment[] = [
  {
    id: 'avis-001',
    name: 'A. Diallo',
    role: 'Ingenieur hardware',
    rating: 5,
    body: "Le devis etait clair, les options PCB etaient faciles a comparer et le suivi m'a evite beaucoup d'allers-retours.",
    createdAt: '2026-04-01T08:00:00.000Z',
  },
  {
    id: 'avis-002',
    name: 'M. Kouame',
    role: 'Startup IoT',
    rating: 5,
    body: "J'ai apprecie la lisibilite du prix total, surtout pour la livraison vers l'Afrique.",
    createdAt: '2026-04-02T08:00:00.000Z',
  },
  {
    id: 'avis-003',
    name: 'S. Benali',
    role: 'Responsable prototype',
    rating: 4,
    body: "L'interface permet de preparer une commande PCB sans perdre les details techniques importants.",
    createdAt: '2026-04-03T08:00:00.000Z',
  },
  {
    id: 'avis-004',
    name: 'C. Mensah',
    role: 'Etudiant electronique',
    rating: 5,
    body: 'Le parcours est simple et rassurant pour envoyer des fichiers Gerber et comprendre les prochaines etapes.',
    createdAt: '2026-04-04T08:00:00.000Z',
  },
  {
    id: 'avis-005',
    name: 'N. Traore',
    role: 'Atelier embarque',
    rating: 4,
    body: 'Bon equilibre entre configuration technique, paiement et suivi. On sent que le flux est pense pour les projets reels.',
    createdAt: '2026-04-05T08:00:00.000Z',
  },
  {
    id: 'avis-006',
    name: 'J. Mbaye',
    role: "Bureau d'etudes",
    rating: 5,
    body: 'La partie logistique donne enfin une vision plus nette entre production, transit et reception.',
    createdAt: '2026-04-06T08:00:00.000Z',
  },
  {
    id: 'avis-007',
    name: 'R. Nguessan',
    role: 'Developpeur produit',
    rating: 5,
    body: "Tres utile pour transformer un prototype electronique en commande suivie, avec moins d'incertitude.",
    createdAt: '2026-04-07T08:00:00.000Z',
  },
  {
    id: 'avis-008',
    name: 'F. Toure',
    role: 'Fab lab',
    rating: 4,
    body: 'Les informations sont structurees et les choix de fabrication restent comprehensibles.',
    createdAt: '2026-04-08T08:00:00.000Z',
  },
  {
    id: 'avis-009',
    name: 'L. Kone',
    role: 'Integration industrielle',
    rating: 5,
    body: 'Le suivi centralise aide beaucoup quand plusieurs personnes suivent le meme projet PCB.',
    createdAt: '2026-04-09T08:00:00.000Z',
  },
  {
    id: 'avis-010',
    name: 'P. Sarr',
    role: 'Prototype medical',
    rating: 4,
    body: 'Le service donne une impression professionnelle et claire, surtout pour preparer une demande precise.',
    createdAt: '2026-04-10T08:00:00.000Z',
  },
  {
    id: 'avis-011',
    name: 'D. Kamga',
    role: 'Robotique',
    rating: 5,
    body: 'Le formulaire de devis couvre les points essentiels sans rendre la commande lourde.',
    createdAt: '2026-04-11T08:00:00.000Z',
  },
  {
    id: 'avis-012',
    name: 'E. Bamba',
    role: 'PME electronique',
    rating: 5,
    body: "J'aime le fait que le cout, la livraison et le support soient regroupes dans le meme parcours.",
    createdAt: '2026-04-12T08:00:00.000Z',
  },
  {
    id: 'avis-013',
    name: 'H. Ouedraogo',
    role: 'Ingenieur RF',
    rating: 4,
    body: "Les options avancees restent visibles sans noyer l'utilisateur. C'est pratique pour discuter avec une equipe.",
    createdAt: '2026-04-13T08:00:00.000Z',
  },
  {
    id: 'avis-014',
    name: 'T. Diop',
    role: 'Maintenance industrielle',
    rating: 5,
    body: 'Le positionnement France-Afrique est clair et repond a un vrai besoin de suivi.',
    createdAt: '2026-04-14T08:00:00.000Z',
  },
  {
    id: 'avis-015',
    name: 'I. Zongo',
    role: 'Concepteur PCB',
    rating: 5,
    body: 'La plateforme inspire confiance pour centraliser fichiers, devis et questions techniques.',
    createdAt: '2026-04-15T08:00:00.000Z',
  },
  {
    id: 'avis-016',
    name: 'B. Fall',
    role: 'Electronique embarquee',
    rating: 3,
    body: 'Bon debut pour suivre une commande et clarifier les informations avant production.',
    createdAt: '2026-04-16T08:00:00.000Z',
  },
];
