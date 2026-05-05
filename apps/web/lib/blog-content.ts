export const blogCategories = [
  'pcb_design_guides',
  'gerber_export_tutorials',
  'kicad_tutorials',
  'easyeda_tutorials',
  'pcb_ordering_tips',
  'hardware_startup_africa',
  'logistics_import_guides',
  'electronics_manufacturing_basics',
] as const;

export type BlogCategory = (typeof blogCategories)[number];

export interface BlogArticle {
  slug: string;
  title: string;
  excerpt: string;
  category: BlogCategory;
  readTime: string;
  publishLabel: string;
  image: string;
  featured?: boolean;
}

export const blogCategoryLabels: Record<BlogCategory, string> = {
  pcb_design_guides: 'Guides de conception PCB',
  gerber_export_tutorials: 'Exports Gerber',
  kicad_tutorials: 'Tutoriels KiCad',
  easyeda_tutorials: 'Tutoriels EasyEDA',
  pcb_ordering_tips: 'Conseils de commande PCB',
  hardware_startup_africa: 'Hardware startup Africa',
  logistics_import_guides: 'Logistique et import',
  electronics_manufacturing_basics: 'Bases de fabrication électronique',
};

export const blogArticles: BlogArticle[] = [
  {
    slug: 'gerber-checklist-before-ordering-pcb-africa',
    title: 'Checklist Gerber avant de commander des PCB livrés en Afrique',
    excerpt:
      'Un guide pratique pour vérifier couches cuivre, masque, sérigraphie, perçages, contour et nom de révision avant le devis.',
    category: 'gerber_export_tutorials',
    readTime: '7 min de lecture',
    publishLabel: 'Guide',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=85',
    featured: true,
  },
  {
    slug: 'kicad-export-gerber-zip-for-pcb-manufacturing',
    title: 'Exporter un ZIP Gerber propre depuis KiCad',
    excerpt:
      'Un guide KiCad pour tracer les Gerbers, générer les perçages, vérifier les couches et préparer un ZIP prêt fabrication.',
    category: 'kicad_tutorials',
    readTime: '8 min de lecture',
    publishLabel: 'Tutoriel',
    image: 'https://cdn.pixabay.com/photo/2022/02/02/10/09/printed-circuit-board-6979572_1280.jpg',
  },
  {
    slug: 'easyeda-gerber-export-common-mistakes',
    title: 'Erreurs d’export Gerber EasyEDA qui retardent les commandes PCB',
    excerpt:
      'Problèmes d’export EasyEDA, perçages manquants, contour ambigu et noms de fichiers qui ralentissent la revue partenaire.',
    category: 'easyeda_tutorials',
    readTime: '6 min de lecture',
    publishLabel: 'Tutoriel',
    image: 'https://images.pexels.com/photos/7285976/pexels-photo-7285976.jpeg?auto=compress&cs=tinysrgb&w=1200',
  },
  {
    slug: 'pcb-stackup-basics-for-hardware-founders',
    title: 'Bases d’empilage PCB pour fondateurs hardware',
    excerpt:
      'Une introduction simple aux couches, épaisseurs, poids de cuivre et cas où demander une revue partenaire.',
    category: 'pcb_design_guides',
    readTime: '9 min de lecture',
    publishLabel: 'Guide design',
    image: 'https://images.pexels.com/photos/7174650/pexels-photo-7174650.jpeg?auto=compress&cs=tinysrgb&w=1200',
  },
  {
    slug: 'why-pcb-price-changes-by-country-and-quantity',
    title: 'Pourquoi le prix PCB change selon pays, quantité et dimensions',
    excerpt:
      'Un regard transparent sur fabrication, logistique, paiement, frais de service, destination et marge de risque douane.',
    category: 'pcb_ordering_tips',
    readTime: '7 min de lecture',
    publishLabel: 'Conseil de commande',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=85',
  },
  {
    slug: 'hardware-startup-africa-prototype-to-pilot',
    title: 'Du prototype au pilote : planifier un PCB pour startup hardware africaine',
    excerpt:
      'Comment anticiper révisions, petites séries, délais, tickets support et suivi avant un pilote hardware.',
    category: 'hardware_startup_africa',
    readTime: '10 min de lecture',
    publishLabel: 'Guide startup',
    image: 'https://images.pexels.com/photos/7285976/pexels-photo-7285976.jpeg?auto=compress&cs=tinysrgb&w=1200',
  },
  {
    slug: 'france-to-africa-pcb-logistics-explained',
    title: 'Comprendre la logistique PCB France vers Afrique',
    excerpt:
      'Ce qui se passe entre fabrication externe, traitement France, routage Afrique, douane et suivi client.',
    category: 'logistics_import_guides',
    readTime: '8 min de lecture',
    publishLabel: 'Logistique',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=85',
  },
  {
    slug: 'electronics-manufacturing-terms-for-first-pcb-order',
    title: 'Termes de fabrication électronique pour une première commande PCB',
    excerpt:
      'Glossaire accessible : FR4, ENIG, HASL, vias, sérigraphie, masque, PCBA, stencils SMT et test électrique.',
    category: 'electronics_manufacturing_basics',
    readTime: '6 min de lecture',
    publishLabel: 'Bases',
    image: 'https://cdn.pixabay.com/photo/2022/02/02/10/09/printed-circuit-board-6979572_1280.jpg',
  },
];
