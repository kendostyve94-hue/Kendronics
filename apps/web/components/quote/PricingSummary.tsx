'use client';

import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import type { AfricanCountry } from '../../lib/african-countries';
import type { PricingBreakdown, QuoteConfig } from '../../lib/quote-types';

type ShippingRate = {
  id: string;
  carrier: string;
  service: string;
  amount?: number;
  currency: string;
  transitTime?: string;
  live: boolean;
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

export function PricingSummary({
  pricing,
  errors,
  onSave,
  saveState = 'idle',
  productionSpeed,
  onProductionSpeedChange,
  countries,
  destinationCountry,
  onDestinationCountryChange,
  shippingMode,
  onShippingModeChange,
  selectedLiveShippingRateId,
  onLiveShippingRateSelect,
}: {
  pricing: PricingBreakdown;
  errors: string[];
  onSave: () => void;
  saveState?: 'idle' | 'saving' | 'saved' | 'error';
  productionSpeed: 'standard' | 'express_24h' | 'pcba_24h';
  onProductionSpeedChange: (value: 'standard' | 'express_24h' | 'pcba_24h') => void;
  countries: AfricanCountry[];
  destinationCountry: string;
  onDestinationCountryChange: (value: string) => void;
  shippingMode: QuoteConfig['shippingMode'];
  onShippingModeChange: (value: QuoteConfig['shippingMode']) => void;
  selectedLiveShippingRateId?: string;
  onLiveShippingRateSelect: (rate: ShippingRateSelection) => void;
}) {
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [countryQuery, setCountryQuery] = useState('');
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [ratesState, setRatesState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [priceDetailsOpen, setPriceDetailsOpen] = useState(false);
  const countryMenuRef = useRef<HTMLDivElement>(null);
  const canSave = errors.length === 0 && saveState !== 'saving';

  const selectedCountry = countries.find((country) => country.iso2 === destinationCountry) ?? countries[0];
  const isSupplierPrice = pricing.pricingSource === 'supplier_api';
  const filteredCountries = useMemo(() => {
    const query = countryQuery.trim().toLowerCase();
    if (!query) return countries;
    return countries.filter((country) => `${country.name} ${country.iso2}`.toLowerCase().includes(query));
  }, [countries, countryQuery]);

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
    if (!deliveryOpen) return;
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

        if (!response.ok) throw new Error('Shipping rates unavailable');
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
  }, [deliveryOpen, destinationCountry, pricing.deliveryWeightKg]);

  return (
    <aside className="space-y-3">
      <div className="hidden rounded-sm border border-slate-200 bg-[#f4f7fa] p-3 sm:p-5 lg:block">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-950 sm:text-base">Details des frais</h2>
          <span className="text-lg font-black text-slate-950">^</span>
        </div>

        <div className="mt-3 space-y-2 border-b border-slate-200 pb-3 text-xs sm:mt-5 sm:space-y-3 sm:pb-4 sm:text-sm">
          <FeeRow label="Recouvrement des vias" value={pricing.viaCoveringFee} />
          <FeeRow label="Finition de surface" value={pricing.surfaceFinishFee} />
          <FeeRow label="Livraison Afrique" value={pricing.franceToAfricaDelivery} highlight />
        </div>

        <div className="border-b border-slate-200 py-3 sm:py-4">
          <div className="mb-2 flex items-center gap-2 sm:mb-3">
            <h3 className="text-sm font-black text-slate-950">PCB Delais prod</h3>
            <span className="grid h-4 w-4 place-items-center rounded-full bg-slate-300 text-[10px] font-black text-white">?</span>
          </div>
          <ProductionSpeedRow label="2 jours" value="standard" price={0} active={productionSpeed === 'standard'} onChange={onProductionSpeedChange} />
          <ProductionSpeedRow label="24 heures" value="express_24h" price={pricing.productionSpeedFee || 7.5} active={productionSpeed === 'express_24h'} onChange={onProductionSpeedChange} />
        </div>

        <div className="py-3 sm:py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-slate-950 sm:text-lg">{isSupplierPrice ? 'Prix fournisseur live' : 'Prix indicatif'}</h3>
            </div>
            <div className="text-right text-base font-black sm:text-lg">
              <span className="mr-1 text-slate-400 line-through sm:mr-2">${pricing.displayTotalBeforeAdjustment.toFixed(2)}</span>
              <span className="block text-[#ff7a00] sm:inline">${pricing.finalTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {errors.length > 0 ? (
          <div className="rounded-sm border border-red-200 bg-red-50 p-3">
            <p className="text-sm font-black text-red-700">Configuration a verifier</p>
            <ul className="mt-2 space-y-2 text-xs leading-5 text-red-700">
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
          className={`mt-2 h-11 w-full rounded-full text-xs font-black uppercase text-white transition sm:mt-3 sm:h-12 sm:text-sm ${
            canSave
              ? 'bg-[#0877ff] hover:bg-[#0068e8] active:translate-y-px'
              : 'cursor-not-allowed bg-slate-300 opacity-70'
          }`}
        >
          {saveState === 'saving' ? 'Sauvegarde...' : saveState === 'saved' ? 'Devis sauvegarde' : 'Sauvegarder dans le panier'}
        </button>
      </div>

      <div className="fixed inset-x-0 bottom-[4.9rem] z-[60] border-t border-slate-200 bg-[#f4f7fa]/96 px-3 py-2.5 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setPriceDetailsOpen(true)} aria-label="Afficher le detail du prix">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Total estime</p>
            <p className="mt-0.5 text-lg font-black text-[#ff7a00]">${pricing.finalTotal.toFixed(2)}</p>
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={!canSave}
            className={`h-11 shrink-0 rounded-sm px-5 text-xs font-black uppercase text-white transition ${
              canSave ? 'bg-[#0f8f6b] hover:bg-[#0b7558]' : 'cursor-not-allowed bg-slate-300 opacity-70'
            }`}
          >
            {saveState === 'saving' ? 'Sauvegarde...' : 'Panier'}
          </button>
        </div>
      </div>

      {priceDetailsOpen ? (
        <div className="fixed inset-x-0 bottom-[9.7rem] top-0 z-[45] bg-slate-950/25 lg:hidden" role="dialog" aria-modal="true" aria-label="Details prix" onClick={() => setPriceDetailsOpen(false)}>
          <div className="absolute inset-x-0 bottom-0 max-h-[58vh] overflow-y-auto rounded-t-2xl bg-[#f4f7fa] p-3" onClick={(event) => event.stopPropagation()}>
            <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-slate-300" />
            <div className="mb-2 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-black text-slate-950">Details du prix</h2>
                <p className="mt-0.5 text-[11px] leading-4 text-slate-500">{isSupplierPrice ? 'Prix fournisseur live' : 'Prix indicatif avant validation.'}</p>
              </div>
              <button type="button" className="grid h-8 w-8 place-items-center rounded-full bg-white text-base font-black text-slate-700" onClick={() => setPriceDetailsOpen(false)} aria-label="Fermer">
                x
              </button>
            </div>

            <div className="rounded-sm border border-slate-200 bg-white p-2.5">
              <div className="space-y-2 border-b border-slate-200 pb-2 text-xs">
                <FeeRow label="Recouvrement des vias" value={pricing.viaCoveringFee} />
                <FeeRow label="Finition de surface" value={pricing.surfaceFinishFee} />
                <FeeRow label="Livraison Afrique" value={pricing.franceToAfricaDelivery} highlight />
              </div>

              <div className="border-b border-slate-200 py-2">
                <h3 className="mb-1 text-xs font-black text-slate-950">Delais production</h3>
                <ProductionSpeedRow label="2 jours" value="standard" price={0} active={productionSpeed === 'standard'} onChange={onProductionSpeedChange} />
                <ProductionSpeedRow label="24 heures" value="express_24h" price={pricing.productionSpeedFee || 7.5} active={productionSpeed === 'express_24h'} onChange={onProductionSpeedChange} />
              </div>

              <div className="flex items-end justify-between gap-4 pt-2">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{isSupplierPrice ? 'Prix fournisseur live' : 'Prix indicatif'}</p>
                  <p className="mt-1 text-xs text-slate-500 line-through">${pricing.displayTotalBeforeAdjustment.toFixed(2)}</p>
                </div>
                <p className="text-xl font-black text-[#ff7a00]">${pricing.finalTotal.toFixed(2)}</p>
              </div>
            </div>

            {errors.length > 0 ? (
              <div className="mt-2 rounded-sm border border-red-200 bg-red-50 p-2.5">
                <p className="text-xs font-black text-red-700">Configuration a verifier</p>
                <ul className="mt-1 space-y-1 text-xs leading-4 text-red-700">
                  {errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="border-t border-slate-200 bg-white py-3 sm:rounded-sm sm:border sm:bg-[#f4f7fa] sm:p-5">
        <button type="button" onClick={() => setDeliveryOpen((open) => !open)} className="flex w-full items-center justify-between text-left">
          <h2 className="text-sm font-semibold text-slate-950 sm:text-base">Estimation de la livraison</h2>
          <span className={`text-lg font-black transition ${deliveryOpen ? 'rotate-180' : ''}`}>v</span>
        </button>

        <div className="mt-2 grid grid-cols-3 gap-2 text-xs sm:mt-4 sm:text-sm">
          <div>
            <span className="block text-[10px] font-medium uppercase tracking-[0.08em] text-slate-500">Agence</span>
            <span className="mt-0.5 block truncate text-slate-800">{pricing.shippingCarrier}</span>
          </div>
          <div>
            <span className="block text-[10px] font-medium uppercase tracking-[0.08em] text-slate-500">Delai</span>
            <span className="mt-0.5 block truncate text-slate-800">{pricing.estimatedShippingTime}</span>
          </div>
          <div className="text-right">
            <span className="block text-[10px] font-medium uppercase tracking-[0.08em] text-slate-500">Poids</span>
            <span className="mt-0.5 block text-slate-800">{pricing.deliveryWeightKg.toFixed(2)}kg</span>
          </div>
        </div>

        {deliveryOpen ? (
          <div className="mt-3 space-y-3 border-t border-slate-200 pt-3 sm:mt-5 sm:space-y-4 sm:pt-4">
            <CountryDropdown
              countries={countries}
              filteredCountries={filteredCountries}
              selectedCountry={selectedCountry}
              query={countryQuery}
              open={countryOpen}
              menuRef={countryMenuRef}
              onOpenChange={setCountryOpen}
              onQueryChange={setCountryQuery}
              onSelect={(country) => {
                onDestinationCountryChange(country.iso2);
                setCountryQuery('');
                setCountryOpen(false);
              }}
            />

            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 sm:text-xs">Agences de livraison vers l'Afrique</p>
              <div className="space-y-2">
                <CarrierOption
                  label="DHL Express (DDP)"
                  description="Express international avec droits et taxes traites."
                  price={pricing.franceToAfricaDelivery}
                  time="2-4 business days"
                  active={!selectedLiveShippingRateId && shippingMode === 'express'}
                  onClick={() => onShippingModeChange('express')}
                />
                <CarrierOption
                  label="Standard Express (DDP)"
                  description="Transport express standard avec consolidation Kendronics."
                  price={pricing.franceToAfricaDelivery}
                  time="4-7 business days"
                  active={!selectedLiveShippingRateId && shippingMode === 'standard'}
                  onClick={() => onShippingModeChange('standard')}
                />
                <CarrierOption
                  label="Economy Consolidated (DDP)"
                  description="Option economique pour les envois moins urgents."
                  price={pricing.franceToAfricaDelivery}
                  time="7-12 business days"
                  active={!selectedLiveShippingRateId && shippingMode === 'economy'}
                  onClick={() => onShippingModeChange('economy')}
                />
              </div>
            </div>

            <div className="rounded-sm border border-slate-200 bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Tarifs transporteurs live</p>
              {ratesState === 'loading' ? <p className="mt-2 text-sm text-slate-600">Chargement des tarifs officiels...</p> : null}
              {ratesState === 'error' ? <p className="mt-2 text-sm text-red-700">Impossible de recuperer les tarifs live.</p> : null}
              {ratesState === 'ready' && rates.length === 0 ? (
                <p className="mt-2 text-sm leading-5 text-slate-600">
                  Aucune API transporteur n'est configuree. Ajoutez les identifiants DHL/FedEx cote serveur pour afficher des prix officiels toujours a jour.
                </p>
              ) : null}
              {rates.map((rate) => (
                <LiveCarrierOption
                  key={rate.id}
                  rate={rate}
                  active={selectedLiveShippingRateId === rate.id}
                  onSelect={() => {
                    if (typeof rate.amount !== 'number') return;
                    onLiveShippingRateSelect({
                      id: rate.id,
                      carrier: rate.carrier,
                      service: rate.service,
                      amount: rate.amount,
                      currency: rate.currency,
                      transitTime: rate.transitTime,
                    });
                  }}
                />
              ))}
            </div>
          </div>
        ) : null}

        <p className="mt-3 border-t border-slate-200 pt-3 text-xs leading-5 text-slate-500 sm:mt-4">
          {isSupplierPrice
            ? pricing.transparencyNote
            : 'Le montant affiche sert de previsualisation pendant la configuration. Kendronics travaille a connecter les tarifs fournisseur en temps reel avant validation commerciale finale.'}
        </p>
      </div>
    </aside>
  );
}

function CountryDropdown({
  countries,
  filteredCountries,
  selectedCountry,
  query,
  open,
  menuRef,
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
  onOpenChange: (open: boolean) => void;
  onQueryChange: (query: string) => void;
  onSelect: (country: AfricanCountry) => void;
}) {
  return (
    <div ref={menuRef} className="relative">
      <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">Pays de destination</label>
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className="flex h-11 w-full items-center justify-between rounded-sm border border-slate-200 bg-white px-3 text-left text-sm font-bold text-slate-950 transition hover:border-[#0877ff]/50"
      >
        <span className="flex items-center gap-2">
          <span className="text-lg leading-none">{countryFlag(selectedCountry.iso2)}</span>
          <span>{selectedCountry.name}</span>
        </span>
        <span className="text-xs text-slate-700">v</span>
      </button>

      {open ? (
        <div className="absolute z-30 mt-1 w-full rounded-sm border border-slate-200 bg-white p-2">
          <label className="flex h-9 items-center gap-2 rounded-sm bg-slate-100 px-3">
            <input
              autoFocus
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Rechercher"
              className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400"
            />
            <span className="text-base font-black text-slate-950">Q</span>
          </label>

          <div className="mt-2 max-h-72 overflow-y-auto">
            {filteredCountries.length === 0 ? (
              <p className="px-3 py-3 text-sm text-slate-500">Aucun pays trouve sur {countries.length} pays africains.</p>
            ) : null}
            {filteredCountries.map((country) => (
              <button
                key={country.iso2}
                type="button"
                onClick={() => onSelect(country)}
                className={`flex h-10 w-full items-center gap-3 px-3 text-left text-sm transition ${
                  country.iso2 === selectedCountry.iso2 ? 'bg-[#eaf2fb] font-black text-[#0877ff]' : 'text-slate-800 hover:bg-slate-100'
                }`}
              >
                <span className="text-lg leading-none">{countryFlag(country.iso2)}</span>
                <span className="min-w-0 flex-1 truncate">{country.name}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FeeRow({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={highlight ? 'font-black text-slate-950' : undefined}>{label}</span>
      <span className={highlight ? 'font-black text-[#ff7a00]' : undefined}>${value.toFixed(2)}</span>
    </div>
  );
}

function CarrierOption({
  label,
  description,
  price,
  time,
  active,
  onClick,
}: {
  label: string;
  description: string;
  price: number;
  time: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
        className={`w-full rounded-sm border p-2.5 text-left text-xs transition sm:p-3 sm:text-sm ${
        active ? 'border-[#0877ff] bg-[#eaf2fb]' : 'border-slate-200 bg-white hover:border-[#0877ff]/50'
      }`}
    >
      <span className="flex items-center justify-between gap-3">
        <span className="font-semibold">{label}</span>
        <span className="font-semibold text-[#ff7a00]">${price.toFixed(2)}</span>
      </span>
      <span className="mt-1 hidden text-xs leading-5 text-slate-500 sm:block">{description} - {time}</span>
    </button>
  );
}

function LiveCarrierOption({ rate, active, onSelect }: { rate: ShippingRate; active: boolean; onSelect: () => void }) {
  const disabled = typeof rate.amount !== 'number';

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={`mt-2 w-full rounded-sm border p-2.5 text-left text-xs transition sm:mt-3 sm:p-3 sm:text-sm ${
        active ? 'border-[#0877ff] bg-[#eaf2fb]' : 'border-slate-200 bg-white hover:border-[#0877ff]/50'
      } ${disabled ? 'cursor-not-allowed opacity-70' : ''}`}
    >
      <span className="flex items-center justify-between gap-3">
        <span className="font-semibold">{rate.carrier} - {rate.service}</span>
        <span className="font-semibold text-[#ff7a00]">
          {rate.amount == null ? 'Non disponible' : `${rate.amount.toFixed(2)} ${rate.currency}`}
        </span>
      </span>
      <span className="mt-1 hidden text-xs leading-5 text-slate-500 sm:block">
        {rate.transitTime ?? 'Transit non communique'} - {rate.note ?? 'Tarif recu depuis le transporteur'}
      </span>
    </button>
  );
}

function ProductionSpeedRow({
  label,
  value,
  price,
  badge,
  active,
  onChange,
}: {
  label: string;
  value: 'standard' | 'express_24h' | 'pcba_24h';
  price: number;
  badge?: string;
  active: boolean;
  onChange: (value: 'standard' | 'express_24h' | 'pcba_24h') => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-1.5 text-xs sm:py-2 sm:text-sm">
      <span className="flex items-center gap-2">
        <input type="radio" checked={active} onChange={() => onChange(value)} className="h-4 w-4 accent-[#0877ff]" />
        <span>{label}</span>
        {badge ? <span className="bg-orange-100 px-2 py-1 text-xs text-orange-500">{badge}</span> : null}
      </span>
      <span>${price.toFixed(2)}</span>
    </label>
  );
}

function countryFlag(iso2: string): string {
  return iso2
    .toUpperCase()
    .replace(/./g, (character) => String.fromCodePoint(127397 + character.charCodeAt(0)));
}
