const groups = [
  {
    title: 'PRODUIT',
    links: [
      ['PCB Prototype', '/services#pcb-standard'],
      ['Petites séries', '/services#pcb-petit-lot'],
      ['PCB avancé', '/services#pcb-avance'],
      ['Assistance fichiers Gerber', '/services#assistance-technique'],
      ['Comment ça marche', '/how-it-works'],
    ],
  },
  {
    title: 'SUPPORT',
    links: [
      ['Centre d’aide', '/centre-aide'],
      ['FAQ', '/faq'],
      ['Capacités', '/capabilities'],
      ['Guide technique', '/guide-technique'],
      ['Support client', '/contact'],
    ],
  },
  {
    title: 'CADRE LÉGAL',
    links: [
      ['Conditions Générales de Vente', '/terms'],
      ['Conditions Générales d’Utilisation', '/terms'],
      ['Politique de confidentialité', '/privacy'],
      ['Politique de cookies', '/cookie-policy'],
      ['Mentions légales', '/terms'],
    ],
  },
  {
    title: 'CONFIANCE',
    links: [
      ['Rôle de la plateforme', '/how-it-works'],
      ['Paiement sécurisé', '/pricing'],
      ['Fichiers confidentiels', '/privacy'],
      ['Livraison internationale', '/how-it-works#delivery-explanation'],
      ['Produits sur mesure', '/services#pcb-avance'],
    ],
  },
];

export function Footer() {
  return (
    <footer id="support" className="border-t border-[#243447] bg-[#132234]">
      <div className="mx-auto grid max-w-[1120px] gap-6 px-4 py-8 sm:grid-cols-2 sm:px-5 lg:grid-cols-4 lg:px-6">
        {groups.map((group) => (
          <div key={group.title}>
            <h3 className="text-sm font-black tracking-[0.12em] text-white">{group.title}</h3>
            <ul className="mt-3 space-y-2 text-sm leading-5 text-slate-300">
              {group.links.map(([label, href]) => (
                <li key={label}>
                  <a href={href} className="transition hover:text-white">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-[#243447] px-4 py-3 text-xs text-slate-400 sm:px-5 lg:px-6">
        <div className="mx-auto max-w-[1120px]">&copy; 2024 Kendronics Industrial. Tous droits réservés.</div>
      </div>
    </footer>
  );
}
