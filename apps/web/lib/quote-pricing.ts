import { calculatePCBQuote } from './pricing';
import type { PricingBreakdown, QuoteConfig } from './quote-types';

export function calculateLocalQuote(config: QuoteConfig): PricingBreakdown {
  return calculatePCBQuote(config);
}

export function validateQuoteConfig(config: QuoteConfig): string[] {
  const errors: string[] = [];

  if (!config.gerberFileName) errors.push('Téléversez un fichier Gerber ZIP avant de sauvegarder le devis.');
  if (config.productType === 'standard_pcb' && config.layers > 6) errors.push('Le PCB standard prend en charge jusqu’à 6 couches. Utilisez PCB avancé pour un nombre de couches supérieur.');
  if ((config.baseMaterial === 'Rogers' || config.baseMaterial === 'PTFE Teflon') && config.productType === 'standard_pcb') errors.push('Rogers et PTFE Teflon necessitent un PCB avance.');
  if (config.productType === 'fpc_rigid_flex' && config.baseMaterial !== 'Flex') errors.push('FPC / rigide-flex necessite un materiau de base flexible.');
  if (config.productType !== 'fpc_rigid_flex' && config.baseMaterial !== 'Flex' && (config.coverlayThickness || config.stiffenerType || config.emiShieldingFilm)) errors.push('Les options flex sont reservees au FPC / rigide-flex ou au materiau flexible.');
  if (config.productType === 'advanced_pcb' && config.layers < 4 && !config.impedanceControl && config.baseMaterial === 'FR4') errors.push('Le PCB avance necessite au moins une option avancee : 4 couches ou plus, impedance controlee ou materiau avance.');
  if (config.productType === 'cnc_3d' && config.cuttingMethod !== 'CNC') errors.push('CNC | 3D necessite la methode de decoupe CNC.');
  if (config.blindBuriedVias && config.layers < 4) errors.push('Les vias borgnes ou enterres necessitent au moins 4 couches.');
  if ((config.assemblyRequired || config.productType === 'pcb_assembly') && (!config.bomFileName || !config.cplFileName)) errors.push('L assemblage PCB necessite les fichiers BOM et CPL.');
  if ((config.assemblyRequired || config.productType === 'pcb_assembly') && !config.confirmPartsPlacement) errors.push('Confirmez le placement des composants avant de poursuivre l assemblage.');
  if ((config.stencilRequired || config.productType === 'smt_stencil') && !config.stencilType) errors.push('Selectionnez un type de pochoir lorsque le pochoir est requis.');

  return errors;
}
