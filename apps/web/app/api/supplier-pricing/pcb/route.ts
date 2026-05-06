import { NextResponse } from 'next/server';

const PCBWAY_QUOTE_ENDPOINT =
  process.env.PCBWAY_QUOTE_ENDPOINT ?? 'https://api-partner.pcbway.com/api/Pcb/PcbQuotation';

export async function POST(request: Request) {
  const apiKey = process.env.PCBWAY_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error: 'Supplier live pricing is not available yet. Kendronics is completing supplier API configuration.',
      },
      { status: 501 },
    );
  }

  const payload = await request.json();
  const supplierResponse = await fetch(PCBWAY_QUOTE_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  const data = await supplierResponse.json();

  if (!supplierResponse.ok || data.Status === 'error') {
    return NextResponse.json(
      {
        error: data.ErrorText || 'Supplier API quote failed.',
        supplierStatus: data.Status,
      },
      { status: supplierResponse.ok ? 502 : supplierResponse.status },
    );
  }

  const manufacturingPrice = Number(data.priceList?.[0]?.Price ?? 0);
  const shippingPrice = Number(data.Shipping?.ShipCost ?? 0);
  const smartBufferMultiplier = calculateSmartBuffer(manufacturingPrice, payload);
  const kendronicsServiceFee = getVisibleServiceFee(manufacturingPrice);
  const pcbClientPrice = manufacturingPrice * smartBufferMultiplier + kendronicsServiceFee;
  const finalTotal = pcbClientPrice + shippingPrice;

  return NextResponse.json({
    partnerManufacturingCost: round(manufacturingPrice),
    partnerHandlingCost: 0,
    chinaToFranceLogistics: 0,
    franceProcessingFee: 0,
    franceToAfricaDelivery: round(shippingPrice),
    paymentProcessingFee: 0,
    kendronicsServiceFee: round(kendronicsServiceFee),
    supplierEstimatedPrice: round(manufacturingPrice),
    pcbClientPrice: round(pcbClientPrice),
    smartBufferMultiplier: roundRatio(smartBufferMultiplier),
    smartBufferRiskScore: roundRatio((smartBufferMultiplier - 1) / 0.7),
    smartBufferConfidence: 'low',
    viaCoveringFee: 0,
    surfaceFinishFee: 0,
    productionSpeedFee: 0,
    finalTotal: round(finalTotal),
    displayTotalBeforeAdjustment: round(finalTotal),
    deliveryWeightKg: 0,
    shippingCarrier: data.Shipping?.ShipName ?? 'Supplier shipping',
    estimatedShippingTime: data.Shipping?.DeliveryTime ?? 'Supplier estimate',
    estimatedLeadTime: `${data.priceList?.[0]?.BuildDays ?? 'Supplier'} build days`,
  });
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundRatio(value: number): number {
  return Math.round(value * 10000) / 10000;
}

function calculateSmartBuffer(manufacturingPrice: number, payload: Record<string, unknown>): number {
  let buffer = 1.1;

  if (manufacturingPrice < 10) buffer += 0.25;
  else if (manufacturingPrice < 30) buffer += 0.15;
  else if (manufacturingPrice < 100) buffer += 0.08;
  else buffer += 0.04;

  const layers = Number(payload.layers ?? 2);
  if (layers >= 6) buffer += 0.15;
  else if (layers >= 4) buffer += 0.08;

  const surfaceFinish = String(payload.surfaceFinish ?? '').toLowerCase();
  if (surfaceFinish.includes('enig')) buffer += 0.06;

  if (payload.blindBuriedVias === 'Yes' || payload.viaInPad === 'Yes') buffer += 0.08;
  if (payload.castellatedHoles === 'Yes' || payload.edgePlating === 'Yes') buffer += 0.05;

  return Math.min(1.7, Math.max(1.08, buffer));
}

function getVisibleServiceFee(supplierPrice: number): number {
  if (supplierPrice < 10) return 3;
  if (supplierPrice < 50) return 4;
  return 5;
}
