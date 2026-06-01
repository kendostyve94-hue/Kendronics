'use client';

import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import type { AfricanCountry } from '../../lib/african-countries';
import type { PricingBreakdown, QuoteConfig } from '../../lib/quote-types';
import { CountryFlag } from '../ui/CountryFlag';

type ShippingRate = {
  id: string;
  carrier: string;
  service: string;
  amount?: number;
  currency: string;
  transitTime?: string;
  direct: boolean;
  note?: string;
};

type ShippingRateSelection = {
  id: string;
  carrier: string;
  service: string;
  amount: number;
  currency: string;
  transitTime?: string;
};

type PricingPreviewState = {
  status: 'local' | 'loading' | 'direct' | 'error';
  message: string;
};

type ShippingMethod = {
  id: string;
  logo: string;
  carrier: string;
  service: string;
  amount: number;
  currency: string;
  transitTime: string;
  mode?: QuoteConfig['shippingMode'];
  direct?: boolean;
};

export function PricingSummary({
  pricing,
  errors,
  onSave,
  saveState = 'idle',
  productionSpeed,
  onProductionSpeedChange,
  selectedBuildTimeOptionId,
  onBuildTimeOptionSelect,
  quantity,
  countries,
  destinationCountry,
  onDestinationCountryChange,
  shippingMode,
  onShippingModeChange,
  selectedLiveShippingRateId,
  onLiveShippingRateSelect,
  pricingPreview,
}: {
  pricing: PricingBreakdown;
  errors: string[];
  onSave: () => void;
  saveState?: 'idle' | 'saving' | 'saved' | 'error';
  productionSpeed: 'standard' | 'express_24h' | 'pcba_24h';
  onProductionSpeedChange: (value: 'standard' | 'express_24h' | 'pcba_24h') => void;
  selectedBuildTimeOptionId?: string;
  onBuildTimeOptionSelect: (option: NonNullable<PricingBreakdown['buildOptions']>[number]) => void;
  quantity: number;
  countries: AfricanCountry[];
  destinationCountry: string;
  onDestinationCountryChange: (value: string) => void;
  shippingMode: QuoteConfig['shippingMode'];
  onShippingModeChange: (value: QuoteConfig['shippingMode']) => void;
  selectedLiveShippingRateId?: string;
  onLiveShippingRateSelect: (rate: ShippingRateSelection) => void;
  pricingPreview: PricingPreviewState;
}) {
  const [shippingDialogOpen, setShippingDialogOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [countryQuery, setCountryQuery] = useState('');
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [ratesState, setRatesState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [priceDetailsOpen, setPriceDetailsOpen] = useState(false);
  const countryMenuRef = useRef<HTMLDivElement>(null);
  const hasProductionPricing = pricingPreview.status === 'direct' || pricingPreview.status === 'local';
  const hasPreviewPrice = pricingPreview.status !== 'loading' && pricingPreview.status !== 'error';
  const canSave = errors.length === 0 && saveState !== 'saving' && hasProductionPricing;

  const selectedCountry = countries.find((country) => country.iso2 === destinationCountry) ?? countries[0];
  const supplierEstimatedPrice = pricing.supplierEstimatedPrice ?? pricing.partnerManufacturingCost;
  const pcbClientPrice = pricing.pcbClientPrice ?? supplierEstimatedPrice + pricing.kendronicsServiceFee;
  const standardBuildPrice = Math.max(5, supplierEstimatedPrice);
  const urgentBuildPrice = Math.max(standardBuildPrice + pricing.productionSpeedFee + 7.5, standardBuildPrice * 1.65);
  const buildOptions = pricing.buildOptions?.length
    ? pricing.buildOptions
    : [
        {
          id: 'standard',
          label: 'Fabrication standard',
          buildDays: Math.max(1, pricing.productionBuildDays ?? extractLastNumber(pricing.estimatedLeadTime) ?? 2),
          price: standardBuildPrice,
          currency: 'EUR' as const,
          speed: 'standard' as const,
          source: pricing.pricingSource,
        },
        {
          id: 'express',
          label: 'Fabrication express',
          buildDays: 1,
          price: urgentBuildPrice,
          currency: 'EUR' as const,
          speed: 'express_24h' as const,
          source: pricing.pricingSource,
        },
      ];

  const filteredCountries = useMemo(() => {
    const query = countryQuery.trim().toLowerCase();
    if (!query) return countries;
    return countries.filter((country) => `${country.name} ${country.iso2}`.toLowerCase().includes(query));
  }, [countries, countryQuery]);

  const shippingMethods = useMemo<ShippingMethod[]>(() => {
    const defaults: ShippingMethod[] = [
      {
        id: 'express',
        logo: 'DHL',
        carrier: 'DHL',
        service: 'DHL',
        amount: pricing.franceToAfricaDelivery,
        currency: 'USD',
        transitTime: '2-4 jours ouvres',
        mode: 'express',
      },
      {
        id: 'standard',
        logo: 'DHL',
        carrier: 'DHL',
        service: 'DHL(DTP)',
        amount: pricing.franceToAfricaDelivery,
        currency: 'USD',
        transitTime: '2-4 jours ouvres',
        mode: 'standard',
      },
      {
        id: 'economy',
        logo: 'Global',
        carrier: 'Global',
        service: 'Livraison standard internationale',
        amount: Math.max(0, pricing.franceToAfricaDelivery * 0.72),
        currency: 'USD',
        transitTime: '7-12 jours ouvres',
        mode: 'economy',
      },
    ];

    const directMethods = rates
      .filter((rate) => typeof rate.amount === 'number')
      .map((rate) => ({
        id: rate.id,
        logo: rate.carrier,
        carrier: rate.carrier,
        service: rate.service,
        amount: rate.amount ?? 0,
        currency: rate.currency,
        transitTime: rate.transitTime ?? 'Delai en attente',
        direct: true,
      }));

    return [...defaults, ...directMethods];
  }, [pricing.franceToAfricaDelivery, rates]);

  const activeShippingMethod =
    shippingMethods.find((method) => (method.direct ? selectedLiveShippingRateId === method.id : !selectedLiveShippingRateId && method.mode === shippingMode)) ?? shippingMethods[0];
  const activeBuildOption = buildOptions.find((option) => option.id === selectedBuildTimeOptionId) ?? buildOptions.find((option) => option.speed === productionSpeed) ?? buildOptions[0];
  const shipmentAt = addBusinessDays(new Date(), Math.max(1, activeBuildOption.buildDays || pricing.productionBuildDays || pricing.supplierLeadTimeDays || 1));
  const deliveryAt = addBusinessDays(shipmentAt, Math.max(1, extractLastNumber(activeShippingMethod.transitTime) || 4));
  const shipmentDate = formatBusinessDate(shipmentAt);
  const deliveryDate = formatBusinessDate(deliveryAt);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!countryMenuRef.current?.contains(event.target as Node)) {
        setCountryOpen(false);
      }
    }

    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  useEffect(() => {
    if (!shippingDialogOpen) return;
    const controller = new AbortController();

    async function loadRates() {
      setRatesState('loading');
      try {
        const params = new URLSearchParams({
          destinationCountry,
          weightKg: String(pricing.deliveryWeightKg),
        });
        const response = await fetch(`/api/shipping-rates?${params.toString()}`, {
          signal: controller.signal,
          cache: 'no-store',
        });

        if (!response.ok) throw new Error('Tarifs de livraison indisponibles');
        const payload = await response.json();
        setRates(payload.rates ?? []);
        setRatesState('ready');
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
        setRatesState('error');
      }
    }

    loadRates();
    return () => controller.abort();
  }, [shippingDialogOpen, destinationCountry, pricing.deliveryWeightKg]);

  function chooseShippingMethod(method: ShippingMethod) {
    if (method.direct) {
      onLiveShippingRateSelect({
        id: method.id,
        carrier: method.carrier,
        service: method.service,
        amount: method.amount,
        currency: method.currency,
        transitTime: method.transitTime,
      });
      return;
    }

    if (method.mode) onShippingModeChange(method.mode);
  }

  return (
    <aside className="space-y-3">
      <div className="hidden border border-slate-300 bg-white lg:block">
        <div className="border-b border-slate-300 bg-slate-100 px-3 py-2">
          <h2 className="text-sm font-semibold text-slate-900">Prix et delai de fabrication</h2>
        </div>

        <div className="p-3">
          <div className="mb-3">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-slate-700">Prix PCB</span>
              <button type="button" onClick={() => setPriceDetailsOpen(true)} className="inline-flex items-center gap-1 border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-700">
                <span className="text-sm leading-none text-slate-500">i</span>
                Details du prix
              </button>
            </div>

            <div className="bg-slate-100 p-1">
              <div className="grid grid-cols-[1fr_3rem_4.5rem] px-2 pb-1 text-center text-xs font-medium text-slate-500">
                <span>Delai fabrication</span>
                <span>Qte</span>
                <span>Total</span>
              </div>
              {buildOptions.map((option) => (
                <BuildTimeOption
                  key={option.id}
                  label={option.label}
                  days={option.buildDays}
                  qty={quantity}
                  price={option.price}
                  active={activeBuildOption.id === option.id}
                  muted={activeBuildOption.id !== option.id}
                  onClick={() => {
                    onProductionSpeedChange(option.speed);
                    onBuildTimeOptionSelect(option);
                  }}
                />
              ))}
            </div>

            <p className="mt-3 text-[11px] font-medium text-[#ff7a00]">
              {hasProductionPricing
                ? pricing.pricingSource === 'supplier_api'
                  ? 'Les delais viennent du calcul de fabrication.'
                  : pricingPreview.message
                : pricingPreview.message}
            </p>
          </div>

          <div className="mb-3">
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-700">Frais de livraison :</span>
              <span className="text-slate-700">{hasPreviewPrice ? `$${pricing.franceToAfricaDelivery.toFixed(2)}` : 'Calcul...'}</span>
            </div>
            <div className="grid grid-cols-[1fr_5rem] gap-2">
              <CountryDropdown
                countries={countries}
                filteredCountries={filteredCountries}
                selectedCountry={selectedCountry}
                query={countryQuery}
                open={countryOpen}
                menuRef={countryMenuRef}
                compact
                onOpenChange={setCountryOpen}
                onQueryChange={setCountryQuery}
                onSelect={(country) => {
                  onDestinationCountryChange(country.iso2);
                  setCountryQuery('');
                  setCountryOpen(false);
                }}
              />
              <button
                type="button"
                onClick={() => setShippingDialogOpen(true)}
                className="flex h-7 items-center justify-between border border-slate-300 bg-white px-1.5 text-left text-xs font-medium text-slate-800"
              >
                <CarrierLogo label={activeShippingMethod.logo} />
                <span className="text-slate-500">v</span>
              </button>
            </div>
            <button type="button" onClick={() => setShippingDialogOpen(true)} className="mt-1 text-left text-xs text-slate-500">
              {activeShippingMethod.carrier} &nbsp; {activeShippingMethod.transitTime}, wt:{pricing.deliveryWeightKg.toFixed(2)}kg
            </button>
          </div>

          <div className="mb-3 grid grid-cols-2 border border-[#d7efcf] bg-[#e4f6de] text-[11px] font-medium text-slate-600">
            <DateBox title="Date expedition" value={shipmentDate} />
            <DateBox title="Date livraison" value={deliveryDate} />
          </div>

          <div className="space-y-1 border-b border-slate-200 pb-3 text-sm">
            {hasPreviewPrice ? (
              <>
                <FeeLine label="Cout PCB :" value={pcbClientPrice} />
                <FeeLine label="Livraison :" value={pricing.franceToAfricaDelivery} />
              </>
            ) : (
              <div className="border border-slate-200 bg-slate-50 p-2 text-xs font-medium text-slate-600">{pricingPreview.message}</div>
            )}
            <div className="flex items-center justify-between pt-1 font-semibold">
              <span className="text-slate-700">Total :</span>
              <span className="text-lg font-semibold text-black">{hasPreviewPrice ? `$${pricing.finalTotal.toFixed(2)}` : 'Calcul...'}</span>
            </div>
            <p className="pt-2 text-right text-[10px] text-slate-500">Note : droits de douane et TVA non inclus.</p>
          </div>

          {errors.length > 0 ? (
            <div className="mt-3 border border-red-200 bg-red-50 p-2">
              <p className="text-xs font-semibold text-red-700">Configuration a verifier</p>
              <ul className="mt-1 space-y-1 text-xs leading-4 text-red-700">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <button
            type="button"
            onClick={onSave}
            disabled={!canSave}
            className={`mt-3 h-9 w-full rounded-sm text-sm font-semibold text-white transition ${
              canSave ? 'bg-[#29ad62] hover:bg-[#198c4b]' : 'cursor-not-allowed bg-[#29ad62]/35 text-white/80'
            }`}
          >
            <span>{saveState === 'saving' ? 'Enregistrement...' : saveState === 'saved' ? 'Enregistre' : 'Enregistrer ma commande'}</span>
          </button>
        </div>
      </div>

      {priceDetailsOpen ? (
        <div className="sheet-backdrop-in fixed inset-x-0 bottom-[calc(4.7rem+env(safe-area-inset-bottom))] top-0 z-[45] bg-slate-950/25 lg:hidden" onClick={() => setPriceDetailsOpen(false)} />
      ) : null}

      <div
        className={`fixed inset-x-0 bottom-[calc(4.7rem+env(safe-area-inset-bottom))] z-[60] border-t border-slate-200 bg-white px-3 py-2.5 lg:hidden ${
          priceDetailsOpen ? 'sheet-panel-in rounded-t-2xl' : ''
        }`}
        role={priceDetailsOpen ? 'dialog' : undefined}
        aria-modal={priceDetailsOpen ? 'true' : undefined}
        aria-label={priceDetailsOpen ? 'Details du prix' : undefined}
      >
        <div className="mx-auto max-w-md">
          <div className="flex items-center gap-3">
            <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setPriceDetailsOpen((open) => !open)} aria-label="Afficher le detail du prix" aria-expanded={priceDetailsOpen}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Cout PCB</p>
              <p className={`mt-0.5 text-[10px] font-medium uppercase tracking-[0.1em] ${
                pricingPreview.status === 'direct' ? 'text-[#0f8f6b]' : pricingPreview.status === 'error' ? 'text-[#c45100]' : 'text-slate-500'
              }`}>
                {pricingPreview.status === 'direct' ? 'Prix direct' : pricingPreview.status === 'loading' ? 'Calcul...' : pricingPreview.status === 'error' ? 'A verifier' : 'Estime'}
              </p>
              <p className="mt-0.5 flex items-baseline gap-1.5 text-lg font-semibold text-[#ff7a00]">
                <span>{hasPreviewPrice ? `$${pcbClientPrice.toFixed(2)}` : 'Calcul...'}</span>
                <span className="text-[10px] font-medium text-[#c45100]">voir total</span>
              </p>
            </button>
            <button type="button" className="h-11 w-[4.85rem] shrink-0 border border-slate-200 bg-white px-2 py-1 text-left" onClick={() => setPriceDetailsOpen((open) => !open)} aria-label="Changer le delai de fabrication">
              <span className="block text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-500">Delai</span>
              <span className="mt-0.5 flex items-baseline gap-1.5">
                <span className="text-xs font-semibold text-slate-900">{activeBuildOption.buildDays}j</span>
                {buildOptions.length > 1 ? <span className="text-[10px] text-[#0f8f6b]">Changer</span> : null}
              </span>
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={!canSave}
              className={`h-11 shrink-0 rounded-sm px-5 text-xs font-semibold uppercase text-white transition ${
                canSave ? 'bg-[#0f8f6b] hover:bg-[#0b7558]' : 'cursor-not-allowed bg-[#0f8f6b]/25 text-white/80 blur-[0.35px]'
              }`}
            >
              {saveState === 'saving' ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>

          {priceDetailsOpen ? (
            <div className="mt-3 max-h-[54vh] overflow-y-auto border-t border-slate-200 pt-3">
              <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-slate-300" />
              <div className="mb-2 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-950">Prix et delai de fabrication</h2>
                  {pricingPreview.status === 'error' ? <p className="mt-0.5 text-[11px] leading-4 text-slate-500">{pricingPreview.message}</p> : null}
                </div>
                <button type="button" className="grid h-8 w-8 place-items-center rounded-full bg-white text-base font-medium text-slate-700" onClick={() => setPriceDetailsOpen(false)} aria-label="Fermer">
                  x
                </button>
              </div>

              <div className="rounded-sm border border-slate-200 bg-white p-2.5">
                {buildOptions.length > 1 ? (
                  <div className="mb-3 border-b border-slate-200 pb-2">
                    <p className="mb-2 text-xs font-semibold text-slate-700">Delai de fabrication</p>
                    <div className="grid gap-1.5">
                      {buildOptions.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => {
                            onProductionSpeedChange(option.speed);
                            onBuildTimeOptionSelect(option);
                          }}
                          className={`flex items-center justify-between border px-2.5 py-2 text-left text-xs ${
                            activeBuildOption.id === option.id ? 'border-[#0f8f6b] bg-[#eefbf6] text-[#0f6f54]' : 'border-slate-200 bg-white text-slate-700'
                          }`}
                        >
                          <span>{option.label}</span>
                          <span>{option.buildDays}j / ${option.price.toFixed(2)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div className="mb-3 border-b border-slate-200 pb-2">
                  <p className="mb-2 text-xs font-semibold text-slate-700">Pays et livraison</p>
                  <div className="grid gap-2">
                    <CountryDropdown
                      countries={countries}
                      filteredCountries={filteredCountries}
                      selectedCountry={selectedCountry}
                      query={countryQuery}
                      open={countryOpen}
                      menuRef={countryMenuRef}
                      compact
                      onOpenChange={setCountryOpen}
                      onQueryChange={setCountryQuery}
                      onSelect={(country) => {
                        onDestinationCountryChange(country.iso2);
                        setCountryQuery('');
                        setCountryOpen(false);
                      }}
                    />
                    <button type="button" onClick={() => setShippingDialogOpen(true)} className="flex w-full items-center justify-between border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-medium">
                      <span>{activeShippingMethod.carrier} / {activeShippingMethod.transitTime}</span>
                      <span>${pricing.franceToAfricaDelivery.toFixed(2)}</span>
                    </button>
                  </div>
                </div>
                <div className="space-y-2 border-b border-slate-200 pb-2 text-xs">
                  {hasPreviewPrice ? (
                    <>
                      <FeeLine label="Cout PCB :" value={pcbClientPrice} />
                      <FeeLine label="Livraison :" value={pricing.franceToAfricaDelivery} />
                      <div className="flex items-center justify-between font-semibold">
                        <span>Total :</span>
                        <span>${pricing.finalTotal.toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs font-medium text-slate-600">{pricingPreview.message}</p>
                  )}
                </div>

              </div>

              {errors.length > 0 ? (
                <div className="mt-2 rounded-sm border border-red-200 bg-red-50 p-2.5">
                  <p className="text-xs font-semibold text-red-700">Configuration a verifier</p>
                  <ul className="mt-1 space-y-1 text-xs leading-4 text-red-700">
                    {errors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

            </div>
          ) : null}
        </div>
      </div>

      {priceDetailsOpen ? (
      <div className="fixed inset-0 z-[75] hidden items-center justify-center bg-black/35 px-4 lg:flex" role="dialog" aria-modal="true" aria-label="Details du prix">
          <div className="w-full max-w-sm border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between gap-4">
              <h3 className="text-sm font-semibold text-slate-950">Details du prix</h3>
              <button type="button" onClick={() => setPriceDetailsOpen(false)} className="grid h-8 w-8 place-items-center text-xl font-light text-slate-500" aria-label="Fermer les details du prix">
                x
              </button>
            </div>
            <div className="space-y-2 text-sm">
              {hasPreviewPrice ? (
                <>
                  <FeeLine label="Cout PCB :" value={pcbClientPrice} />
                  <FeeLine label="Livraison :" value={pricing.franceToAfricaDelivery} />
                  <FeeLine label="Service:" value={pricing.kendronicsServiceFee} />
                  <div className="flex items-center justify-between border-t border-slate-200 pt-2 font-semibold">
                    <span>Total :</span>
                    <span>${pricing.finalTotal.toFixed(2)}</span>
                  </div>
                </>
              ) : (
                <p className="text-sm font-medium text-slate-600">{pricingPreview.message}</p>
              )}
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">{pricingPreview.message}</p>
          </div>
        </div>
      ) : null}

      {shippingDialogOpen ? (
        <ShippingMethodDialog
          countries={countries}
          filteredCountries={filteredCountries}
          selectedCountry={selectedCountry}
          query={countryQuery}
          countryOpen={countryOpen}
          menuRef={countryMenuRef}
          ratesState={ratesState}
          shippingMethods={shippingMethods}
          activeMethod={activeShippingMethod}
          onCountryOpenChange={setCountryOpen}
          onQueryChange={setCountryQuery}
          onCountrySelect={(country) => {
            onDestinationCountryChange(country.iso2);
            setCountryQuery('');
            setCountryOpen(false);
          }}
          onSelect={chooseShippingMethod}
          onFermer={() => setShippingDialogOpen(false)}
        />
      ) : null}
    </aside>
  );
}

function BuildTimeOption({
  label,
  days,
  qty,
  price,
  active,
  muted = false,
  onClick,
}: {
  label: string;
  days: number;
  qty: number;
  price: number;
  active: boolean;
  muted?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`grid w-full grid-cols-[1fr_3rem_4.5rem] items-center gap-2 px-2 py-2 text-left text-sm ${
        active ? 'bg-white text-slate-900' : muted ? 'bg-[#e9ecef] text-slate-500' : 'bg-white text-slate-700'
      }`}
    >
      <span className="flex items-center gap-2 font-medium">
        <span className={`grid h-6 w-6 place-items-center rounded-full border ${active ? 'border-[#43bf4d] bg-[#43bf4d]' : 'border-slate-300 bg-white'}`} aria-hidden="true">
          {active ? <span className="h-2.5 w-2.5 rounded-full bg-white" /> : null}
        </span>
        <span>
          <span className="block leading-4">{label}</span>
          <span className="block text-[11px] leading-4 text-slate-500">{days} jour{days > 1 ? 's' : ''} ouvre{days > 1 ? 's' : ''}</span>
        </span>
      </span>
      <span className="text-center">{qty}</span>
      <span className="text-right font-semibold">${price.toFixed(2)}</span>
    </button>
  );
}

function ShippingMethodDialog({
  countries,
  filteredCountries,
  selectedCountry,
  query,
  countryOpen,
  menuRef,
  ratesState,
  shippingMethods,
  activeMethod,
  onCountryOpenChange,
  onQueryChange,
  onCountrySelect,
  onSelect,
  onFermer,
}: {
  countries: AfricanCountry[];
  filteredCountries: AfricanCountry[];
  selectedCountry: AfricanCountry;
  query: string;
  countryOpen: boolean;
  menuRef: RefObject<HTMLDivElement | null>;
  ratesState: 'idle' | 'loading' | 'ready' | 'error';
  shippingMethods: ShippingMethod[];
  activeMethod: ShippingMethod;
  onCountryOpenChange: (open: boolean) => void;
  onQueryChange: (query: string) => void;
  onCountrySelect: (country: AfricanCountry) => void;
  onSelect: (method: ShippingMethod) => void;
  onFermer: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[80] bg-black/55 px-3 py-8" role="dialog" aria-modal="true" aria-label="Mode de livraisons">
      <div className="mx-auto max-h-[82vh] max-w-[700px] overflow-y-auto rounded-lg bg-white p-5 shadow-2xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="grid flex-1 grid-cols-[3.5rem_1fr] items-center gap-3">
            <span className="text-sm font-semibold text-slate-900">Livrer vers</span>
            <CountryDropdown
              countries={countries}
              filteredCountries={filteredCountries}
              selectedCountry={selectedCountry}
              query={query}
              open={countryOpen}
              menuRef={menuRef}
              compact
              onOpenChange={onCountryOpenChange}
              onQueryChange={onQueryChange}
              onSelect={onCountrySelect}
            />
          </div>
          <button type="button" onClick={onFermer} className="grid h-9 w-9 place-items-center text-3xl font-light text-slate-500" aria-label="Fermer">
            x
          </button>
        </div>

        <div className="grid grid-cols-[1fr_9rem_10rem] bg-slate-100 px-7 py-3 text-sm font-semibold text-slate-700">
          <span>Mode de livraison</span>
          <span>Couts</span>
          <span>Delai de livraison</span>
        </div>

        <div className="divide-y divide-transparent">
          {shippingMethods.map((method) => (
            <button
              key={method.id}
              type="button"
              onClick={() => onSelect(method)}
              className="grid w-full grid-cols-[1.5rem_1fr_9rem_10rem] items-center gap-2 px-0 py-3 text-left text-sm text-slate-900"
            >
              <span className={`h-4 w-4 rounded-full border ${activeMethod.id === method.id ? 'border-[#27b45c] bg-[#27b45c] ring-4 ring-white' : 'border-slate-300 bg-white'}`} />
              <span className="flex min-w-0 items-center gap-2">
                <CarrierLogo label={method.logo} />
                <span className="truncate">{method.service}</span>
                {method.direct ? <span className="rounded-full bg-[#a7cf8c] px-1 text-[10px] font-semibold text-white">direct</span> : null}
              </span>
              <span className="font-medium">${method.amount.toFixed(2)}</span>
              <span className="font-medium">{method.transitTime}</span>
            </button>
          ))}
        </div>

        {ratesState === 'loading' ? <p className="mt-2 text-center text-xs font-medium text-slate-500">Chargement des tarifs transporteur...</p> : null}
        {ratesState === 'error' ? <p className="mt-2 text-center text-xs font-medium text-red-600">Tarifs transporteur en direct indisponibles. Les modes par defaut restent selectionnables.</p> : null}

        <div className="mt-5 flex justify-center">
          <button type="button" onClick={onFermer} className="h-9 min-w-28 rounded bg-[#29ad62] px-8 text-sm font-semibold text-white hover:bg-[#198c4b]">
            Appliquer
          </button>
        </div>
      </div>
    </div>
  );
}

function CountryDropdown({
  countries,
  filteredCountries,
  selectedCountry,
  query,
  open,
  menuRef,
  compact = false,
  onOpenChange,
  onQueryChange,
  onSelect,
}: {
  countries: AfricanCountry[];
  filteredCountries: AfricanCountry[];
  selectedCountry: AfricanCountry;
  query: string;
  open: boolean;
  menuRef: RefObject<HTMLDivElement | null>;
  compact?: boolean;
  onOpenChange: (open: boolean) => void;
  onQueryChange: (query: string) => void;
  onSelect: (country: AfricanCountry) => void;
}) {
  return (
    <div ref={menuRef} className="relative">
      {!compact ? <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Pays de destination</label> : null}
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className="flex h-7 w-full items-center justify-between border border-slate-300 bg-white px-2 text-left text-xs font-medium text-slate-700"
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <CountryFlag iso2={selectedCountry.iso2} name={selectedCountry.name} />
          <span className="truncate">{selectedCountry.name}</span>
        </span>
        <span className="text-xs text-slate-500">v</span>
      </button>

      {open ? (
        <div className="absolute z-[90] mt-1 w-full min-w-72 border border-slate-300 bg-white">
          <label className="flex h-9 items-center gap-2 border-b border-slate-200 px-3">
            <input
              autoFocus
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Rechercher"
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
            <span className="text-base text-slate-400">Q</span>
          </label>

          <div className="max-h-72 overflow-y-auto">
            {filteredCountries.length === 0 ? (
              <p className="px-3 py-3 text-sm text-slate-500">Aucun pays trouve sur {countries.length} pays.</p>
            ) : null}
            {filteredCountries.map((country) => (
              <button
                key={country.iso2}
                type="button"
                onClick={() => onSelect(country)}
                className={`flex h-9 w-full items-center gap-2 px-3 text-left text-xs transition ${
                  country.iso2 === selectedCountry.iso2 ? 'bg-[#eaf2fb] font-semibold text-slate-950' : 'text-slate-800 hover:bg-slate-100'
                }`}
              >
                <CountryFlag iso2={country.iso2} name={country.name} />
                <span className="min-w-0 flex-1 truncate">{country.name}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DateBox({ title, value }: { title: string; value: string }) {
  return (
    <div className="flex min-h-12 items-center gap-2 border-r border-[#b8d9ae] px-3 last:border-r-0">
      <span className="h-7 w-1.5 rounded-full bg-[#9ac58c]" aria-hidden="true" />
      <span>
        <span className="block leading-3">{title}</span>
        <span className="block leading-3">{value}</span>
      </span>
    </div>
  );
}

function FeeLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-700">{label}</span>
      <span className="text-black">${value.toFixed(2)}</span>
    </div>
  );
}

function CarrierLogo({ label }: { label: string }) {
  const normalized = label.toLowerCase();
  const isDhl = normalized.includes('dhl');
  const isFedex = normalized.includes('fedex');

  return (
    <span
      className={`inline-flex h-5 min-w-16 shrink-0 items-center justify-center border px-1 text-[11px] font-semibold italic leading-none ${
        isDhl
          ? 'border-[#f2c300] bg-[#ffd51d] text-[#d71920]'
          : isFedex
            ? 'border-slate-200 bg-white text-[#4d148c]'
            : 'border-slate-300 bg-white text-slate-700'
      }`}
    >
      {isDhl ? 'DHL' : isFedex ? 'FedEx' : label.slice(0, 10)}
    </span>
  );
}

function addBusinessDays(startDate: Date, days: number): Date {
  const date = new Date(startDate);
  let remaining = days;
  while (remaining > 0) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) remaining -= 1;
  }

  return date;
}

function extractLastNumber(value: string): number | null {
  const matches = value.match(/\d+/g);
  if (!matches || matches.length === 0) return null;
  return Number(matches[matches.length - 1]);
}

function formatBusinessDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}
