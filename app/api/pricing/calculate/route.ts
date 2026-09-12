/**
 * Server-Side Route Handler: NDIS PAPL Pricing Calculator
 * Endpoint: /app/api/pricing/calculate & /api/pricing/calculate
 */

import { Request, Response } from 'express';
import {
  handlePricingCalculation,
  calculateBatchNDISClaims,
  OFFICIAL_PAPL_CATALOGUE,
} from '../../../../lib/ndisPricingService';
import { PricingCalculationRequest, BatchPricingRequest } from '../../../../types/pricing';

/**
 * Handle POST request for on-demand PAPL calculations or batch processing.
 */
export async function POST(req: Request, res: Response) {
  try {
    const body = req.body;

    // Check if this is a batch calculation request
    if (body.items && Array.isArray(body.items)) {
      const batchResponse = calculateBatchNDISClaims(body as BatchPricingRequest);
      return res.status(200).json(batchResponse);
    }

    // Single item calculation request
    const calculationInput: PricingCalculationRequest = {
      lineItemCode: body.lineItemCode,
      serviceHours: Number(body.serviceHours) || 0,
      mmmZone: (Number(body.mmmZone) as 1 | 2 | 3 | 4 | 5 | 6 | 7) || 1,
      dayTypeOverride: body.dayTypeOverride,
      claimedTravelMinutes: Number(body.claimedTravelMinutes) || 0,
      travelDistanceKm: Number(body.travelDistanceKm) || 0,
      vehicleType: body.vehicleType || 'standard',
      nonLaborTravelCost: Number(body.nonLaborTravelCost) || 0,
      parkingCost: Number(body.parkingCost) || 0,
      tollsCost: Number(body.tollsCost) || 0,
      publicTransportCost: Number(body.publicTransportCost) || 0,
      travelNotes: body.travelNotes,
      participantId: body.participantId,
      sessionDate: body.sessionDate,
    };

    const result = handlePricingCalculation(calculationInput);
    return res.status(200).json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal calculation error';
    return res.status(400).json({
      success: false,
      error: message,
    });
  }
}

/**
 * Handle GET request for catalogue and pricing parameters.
 */
export async function GET(req: Request, res: Response) {
  const { code, mmmZone } = req.query;

  if (code && typeof code === 'string') {
    const item = OFFICIAL_PAPL_CATALOGUE.find((i) => i.code === code);
    if (!item) {
      return res.status(404).json({ success: false, error: `Line item ${code} not found in PAPL catalogue` });
    }
    return res.status(200).json({ success: true, item });
  }

  return res.status(200).json({
    success: true,
    totalItems: OFFICIAL_PAPL_CATALOGUE.length,
    catalogue: OFFICIAL_PAPL_CATALOGUE,
    travelCaps: {
      metroMMM1to3: 30,
      regionalMMM4to5: 60,
      remoteMMM6to7: 90,
    },
    transportKmRates: {
      standardVehicle: 0.99,
      modifiedVehicle: 1.30,
    },
  });
}
