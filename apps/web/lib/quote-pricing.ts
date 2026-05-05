import { calculatePCBQuote } from './pricing';
import type { PricingBreakdown, QuoteConfig } from './quote-types';

export function calculateLocalQuote(config: QuoteConfig): PricingBreakdown {
  return calculatePCBQuote(config);
}

export function validateQuoteConfig(config: QuoteConfig): string[] {
  const errors: string[] = [];

  if (!config.gerberFileName) errors.push('Téléversez un fichier Gerber ZIP avant de sauvegarder le devis.');
  if (config.productType === 'standard_pcb' && config.layers > 6) errors.push('Le PCB standard prend en charge jusqu’à 6 couches. Utilisez PCB avancé pour un nombre de couches supérieur.');
  if ((config.baseMaterial === 'Rogers' || config.baseMaterial === 'PTFE Teflon') && config.productType === 'standard_pcb') errors.push('Rogers and PTFE Teflon require Advanced PCB.');
  if (config.baseMaterial !== 'Flex' && (config.coverlayThickness || config.stiffenerType || config.emiShieldingFilm)) errors.push('Flex options are only available when base material is Flex.');
  if (config.blindBuriedVias && config.layers < 4) errors.push('Blind/buried vias require at least 4 layers.');
  if (config.assemblyRequired && (!config.bomFileName || !config.cplFileName)) errors.push('PCB assembly requires BOM and CPL uploads.');
  if (config.assemblyRequired && !config.confirmPartsPlacement) errors.push('Confirm parts placement before continuing with assembly.');
  if (config.stencilRequired && !config.stencilType) errors.push('Select a stencil type when stencil is required.');

  return errors;
}
