import { NextResponse } from 'next/server';

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

const originCountryCode = process.env.SHIPPING_ORIGIN_COUNTRY ?? 'FR';
const originPostalCode = process.env.SHIPPING_ORIGIN_POSTAL_CODE ?? '75001';
const originCity = process.env.SHIPPING_ORIGIN_CITY ?? 'Paris';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const destinationCountry = url.searchParams.get('destinationCountry') ?? '';
  const weightKg = Number(url.searchParams.get('weightKg') ?? '0.3');

  if (!destinationCountry) {
    return NextResponse.json({ rates: [] satisfies ShippingRate[] }, { status: 400 });
  }

  const rates = await Promise.allSettled([
    getDhlRates(destinationCountry, weightKg),
    getFedExRates(destinationCountry, weightKg),
  ]);

  return NextResponse.json({
    rates: rates
      .flatMap((result) => (result.status === 'fulfilled' ? result.value : []))
      .filter(Boolean),
  });
}

async function getDhlRates(destinationCountry: string, weightKg: number): Promise<ShippingRate[]> {
  const apiKey = process.env.DHL_API_KEY;
  const apiSecret = process.env.DHL_API_SECRET;
  const accountNumber = process.env.DHL_ACCOUNT_NUMBER;

  if (!apiKey || !apiSecret || !accountNumber) return [];

  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
  const response = await fetch('https://express.api.dhl.com/mydhlapi/rates', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customerDetails: {
        shipperDetails: {
          postalCode: originPostalCode,
          cityName: originCity,
          countryCode: originCountryCode,
        },
        receiverDetails: {
          countryCode: destinationCountry,
        },
      },
      accounts: [{ typeCode: 'shipper', number: accountNumber }],
      productCode: 'P',
      localProductCode: 'P',
      unitOfMeasurement: 'metric',
      isCustomsDeclarable: true,
      plannedShippingDateAndTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      monetaryAmount: [{ typeCode: 'declaredValue', value: 100, currency: 'EUR' }],
      packages: [
        {
          weight: Math.max(0.1, weightKg),
          dimensions: {
            length: 22,
            width: 16,
            height: 6,
          },
        },
      ],
    }),
    cache: 'no-store',
  });

  if (!response.ok) return [];

  const data = await response.json();
  const products = Array.isArray(data.products) ? data.products : [];

  return products.map((product: any, index: number) => {
    const totalPrice = product.totalPrice?.find((price: any) => price.currencyType === 'BILLC');
    return {
      id: `dhl-${product.productCode ?? index}`,
      carrier: 'DHL Express',
      service: product.productName ?? product.localProductName ?? 'Express Worldwide',
      amount: Number(totalPrice?.price ?? product.totalPrice?.[0]?.price),
      currency: totalPrice?.priceCurrency ?? product.totalPrice?.[0]?.priceCurrency ?? 'EUR',
      transitTime: product.deliveryCapabilities?.estimatedDeliveryDateAndTime,
      live: true,
      note: 'Tarif retourne par MyDHL API pour le compte configure.',
    };
  });
}

async function getFedExRates(destinationCountry: string, weightKg: number): Promise<ShippingRate[]> {
  const clientId = process.env.FEDEX_CLIENT_ID;
  const clientSecret = process.env.FEDEX_CLIENT_SECRET;
  const accountNumber = process.env.FEDEX_ACCOUNT_NUMBER;

  if (!clientId || !clientSecret || !accountNumber) return [];

  const tokenResponse = await fetch('https://apis.fedex.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
    cache: 'no-store',
  });

  if (!tokenResponse.ok) return [];

  const token = await tokenResponse.json();
  const rateResponse = await fetch('https://apis.fedex.com/rate/v1/rates/quotes', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      accountNumber: { value: accountNumber },
      requestedShipment: {
        shipper: { address: { postalCode: originPostalCode, countryCode: originCountryCode } },
        recipient: { address: { countryCode: destinationCountry } },
        pickupType: 'USE_SCHEDULED_PICKUP',
        rateRequestType: ['ACCOUNT', 'LIST'],
        requestedPackageLineItems: [
          {
            weight: { units: 'KG', value: Math.max(0.1, weightKg) },
            dimensions: { length: 22, width: 16, height: 6, units: 'CM' },
          },
        ],
      },
    }),
    cache: 'no-store',
  });

  if (!rateResponse.ok) return [];

  const data = await rateResponse.json();
  const details = data.output?.rateReplyDetails ?? [];

  return details.map((detail: any, index: number) => {
    const rated = detail.ratedShipmentDetails?.[0];
    return {
      id: `fedex-${detail.serviceType ?? index}`,
      carrier: 'FedEx',
      service: detail.serviceName ?? detail.serviceType ?? 'FedEx service',
      amount: Number(rated?.totalNetCharge),
      currency: rated?.currency ?? 'EUR',
      transitTime: detail.commit?.dateDetail?.dayOfWeek,
      live: true,
      note: 'Tarif retourne par FedEx Rates API pour le compte configure.',
    };
  });
}
