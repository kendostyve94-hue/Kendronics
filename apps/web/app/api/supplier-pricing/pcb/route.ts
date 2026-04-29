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
  const subtotal = manufacturingPrice + shippingPrice;
  const kendronicsServiceFee = Math.max(10, subtotal * 0.145);
  const paymentProcessingFee = (subtotal + kendronicsServiceFee) * 0.029 + 0.3;

  return NextResponse.json({
    partnerManufacturingCost: round(manufacturingPrice),
    partnerHandlingCost: 0,
    chinaToFranceLogistics: round(shippingPrice),
    franceProcessingFee: 0,
    franceToAfricaDelivery: 0,
    paymentProcessingFee: round(paymentProcessingFee),
    kendronicsServiceFee: round(kendronicsServiceFee),
    viaCoveringFee: 0,
    surfaceFinishFee: 0,
    productionSpeedFee: 0,
    finalTotal: round(subtotal + kendronicsServiceFee + paymentProcessingFee),
    displayTotalBeforeAdjustment: round(subtotal + kendronicsServiceFee + paymentProcessingFee),
    deliveryWeightKg: 0,
    shippingCarrier: data.Shipping?.ShipName ?? 'Supplier shipping',
    estimatedShippingTime: data.Shipping?.DeliveryTime ?? 'Supplier estimate',
    estimatedLeadTime: `${data.priceList?.[0]?.BuildDays ?? 'Supplier'} build days`,
  });
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
