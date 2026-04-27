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
  pcb_design_guides: 'PCB design guides',
  gerber_export_tutorials: 'Gerber export tutorials',
  kicad_tutorials: 'KiCad tutorials',
  easyeda_tutorials: 'EasyEDA tutorials',
  pcb_ordering_tips: 'PCB ordering tips',
  hardware_startup_africa: 'Hardware startup Africa',
  logistics_import_guides: 'Logistics/import guides',
  electronics_manufacturing_basics: 'Electronics manufacturing basics',
};

export const blogArticles: BlogArticle[] = [
  {
    slug: 'gerber-checklist-before-ordering-pcb-africa',
    title: 'Gerber checklist before ordering PCBs for delivery to Africa',
    excerpt:
      'A practical file-readiness guide for copper layers, solder mask, silkscreen, drill files, board outline, and revision naming before quote submission.',
    category: 'gerber_export_tutorials',
    readTime: '7 min read',
    publishLabel: 'Guide',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=85',
    featured: true,
  },
  {
    slug: 'kicad-export-gerber-zip-for-pcb-manufacturing',
    title: 'How to export a clean Gerber ZIP from KiCad',
    excerpt:
      'A KiCad-oriented walkthrough for plotting Gerbers, generating drill files, checking layers, and packaging a manufacturing-ready ZIP.',
    category: 'kicad_tutorials',
    readTime: '8 min read',
    publishLabel: 'Tutorial',
    image: 'https://cdn.pixabay.com/photo/2022/02/02/10/09/printed-circuit-board-6979572_1280.jpg',
  },
  {
    slug: 'easyeda-gerber-export-common-mistakes',
    title: 'EasyEDA Gerber export mistakes that delay PCB orders',
    excerpt:
      'Common EasyEDA export issues, missing drill data, board outline confusion, and naming problems that can slow down partner manufacturing review.',
    category: 'easyeda_tutorials',
    readTime: '6 min read',
    publishLabel: 'Tutorial',
    image: 'https://images.pexels.com/photos/7285976/pexels-photo-7285976.jpeg?auto=compress&cs=tinysrgb&w=1200',
  },
  {
    slug: 'pcb-stackup-basics-for-hardware-founders',
    title: 'PCB stackup basics for hardware founders',
    excerpt:
      'A plain-language primer on layers, board thickness, copper weight, and when to request partner review for more advanced requirements.',
    category: 'pcb_design_guides',
    readTime: '9 min read',
    publishLabel: 'Design guide',
    image: 'https://images.pexels.com/photos/7174650/pexels-photo-7174650.jpeg?auto=compress&cs=tinysrgb&w=1200',
  },
  {
    slug: 'why-pcb-price-changes-by-country-and-quantity',
    title: 'Why PCB price changes by country, quantity, and dimensions',
    excerpt:
      'A transparent look at manufacturing cost, logistics, payment processing, service fees, destination routing, and customs risk buffers.',
    category: 'pcb_ordering_tips',
    readTime: '7 min read',
    publishLabel: 'Ordering tip',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=85',
  },
  {
    slug: 'hardware-startup-africa-prototype-to-pilot',
    title: 'From prototype to pilot: PCB planning for African hardware startups',
    excerpt:
      'How to think about revisions, small batches, delivery timing, support tickets, and order tracking while preparing a hardware pilot.',
    category: 'hardware_startup_africa',
    readTime: '10 min read',
    publishLabel: 'Startup guide',
    image: 'https://images.pexels.com/photos/7285976/pexels-photo-7285976.jpeg?auto=compress&cs=tinysrgb&w=1200',
  },
  {
    slug: 'france-to-africa-pcb-logistics-explained',
    title: 'France to Africa PCB logistics explained',
    excerpt:
      'What happens between external manufacturing, France processing, African destination routing, customs milestones, and customer-safe tracking.',
    category: 'logistics_import_guides',
    readTime: '8 min read',
    publishLabel: 'Logistics',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=85',
  },
  {
    slug: 'electronics-manufacturing-terms-for-first-pcb-order',
    title: 'Electronics manufacturing terms for your first PCB order',
    excerpt:
      'A beginner-friendly glossary for FR4, ENIG, HASL, vias, silkscreen, solder mask, PCBA, SMT stencils, and electrical testing.',
    category: 'electronics_manufacturing_basics',
    readTime: '6 min read',
    publishLabel: 'Basics',
    image: 'https://cdn.pixabay.com/photo/2022/02/02/10/09/printed-circuit-board-6979572_1280.jpg',
  },
];
