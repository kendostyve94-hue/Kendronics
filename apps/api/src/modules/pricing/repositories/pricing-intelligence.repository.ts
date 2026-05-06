import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class PricingIntelligenceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const [snapshots, buckets] = await Promise.all([
      this.prisma.pricingSnapshot.findMany({
        orderBy: { createdAt: 'desc' },
        take: 25,
        include: {
          quote: {
            select: {
              id: true,
              productType: true,
              layers: true,
              quantity: true,
              destinationCountryIso2: true,
              createdAt: true,
            },
          },
        },
      }),
      this.prisma.bufferBucket.findMany({
        orderBy: [{ riskFlag: 'desc' }, { updatedAt: 'desc' }],
        take: 25,
      }),
    ]);

    const totals = snapshots.reduce(
      (acc, snapshot) => {
        acc.supplierEstimatedPrice += snapshot.supplierEstimatedPrice.toNumber();
        acc.pcbClientPrice += snapshot.pcbClientPrice.toNumber();
        acc.shippingPrice += snapshot.shippingPrice.toNumber();
        acc.totalClientPrice += snapshot.totalClientPrice.toNumber();
        return acc;
      },
      { supplierEstimatedPrice: 0, pcbClientPrice: 0, shippingPrice: 0, totalClientPrice: 0 },
    );

    return {
      metrics: {
        snapshotCount: snapshots.length,
        bucketCount: buckets.length,
        flaggedBucketCount: buckets.filter((bucket) => bucket.riskFlag).length,
        averageBuffer:
          snapshots.length > 0
            ? round(snapshots.reduce((total, snapshot) => total + snapshot.bufferUsed.toNumber(), 0) / snapshots.length)
            : 0,
        totals: {
          supplierEstimatedPrice: round(totals.supplierEstimatedPrice),
          pcbClientPrice: round(totals.pcbClientPrice),
          shippingPrice: round(totals.shippingPrice),
          totalClientPrice: round(totals.totalClientPrice),
        },
      },
      snapshots: snapshots.map((snapshot) => ({
        id: snapshot.id,
        quoteId: snapshot.quoteId,
        supplier: snapshot.supplier,
        supplierEstimatedPrice: snapshot.supplierEstimatedPrice.toNumber(),
        supplierRealPrice: snapshot.supplierRealPrice?.toNumber(),
        bufferUsed: snapshot.bufferUsed.toNumber(),
        serviceFee: snapshot.serviceFee.toNumber(),
        pcbClientPrice: snapshot.pcbClientPrice.toNumber(),
        shippingPrice: snapshot.shippingPrice.toNumber(),
        totalClientPrice: snapshot.totalClientPrice.toNumber(),
        bucketKey: snapshot.bucketKey,
        riskScore: snapshot.riskScore.toNumber(),
        confidence: snapshot.confidence,
        formulaVersion: snapshot.formulaVersion,
        reasons: snapshot.reasons,
        inputSnapshot: snapshot.inputSnapshot,
        createdAt: snapshot.createdAt,
        quote: snapshot.quote,
      })),
      buckets: buckets.map((bucket) => ({
        id: bucket.id,
        bucketKey: bucket.bucketKey,
        layersRange: bucket.layersRange,
        priceRange: bucket.priceRange,
        finish: bucket.finish,
        complexity: bucket.complexity,
        quantityRange: bucket.quantityRange,
        currentBuffer: bucket.currentBuffer.toNumber(),
        averageErrorRate: bucket.averageErrorRate.toNumber(),
        sampleCount: bucket.sampleCount,
        confidence: bucket.confidence,
        riskFlag: bucket.riskFlag,
        lastErrorRate: bucket.lastErrorRate?.toNumber(),
        lastAdjustedAt: bucket.lastAdjustedAt,
        updatedAt: bucket.updatedAt,
      })),
    };
  }
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
