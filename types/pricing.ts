/**
 * Breakthrough Manager OS - NDIS Pricing & PAPL Types
 * Defined in accordance with the NDIS Pricing Arrangements and Price Limits (PAPL).
 */

export type DayType =
  | 'weekday_day'
  | 'weekday_evening'
  | 'weekday_night'
  | 'saturday'
  | 'sunday'
  | 'public_holiday';

export type MMMZone = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type SupportCategory = 'Core' | 'Capacity Building' | 'Capital';

export type VehicleType = 'standard' | 'modified';

export interface PAPLLineItem {
  code: string;
  name: string;
  category: SupportCategory;
  supportItemNumber: string;
  unit: 'Hour' | 'Each' | 'Kilometre' | 'Day' | 'Week';
  nationalBaseRate: number;
  dayType: DayType;
  providerTravelPermitted: boolean;
  description?: string;
  registrationGroup?: string;
  quotationRequired?: boolean;
}

export interface TravelCalculation {
  claimedMinutes: number;
  capMinutes: number;
  billableMinutes: number;
  isCapped: boolean;
  ratePerHour: number;
  travelLaborCost: number;
  complianceRule: string;
}

export interface ActivityBasedTransport {
  distanceKm: number;
  vehicleType: VehicleType;
  ratePerKm: number;
  transportCost: number;
}

export interface NonLabourTravelCosts {
  parkingCost: number;
  tollsCost: number;
  publicTransportCost: number;
  otherTravelCost: number;
  notes?: string;
  totalNonLabourCost: number;
}

export interface PricingCalculationRequest {
  lineItemCode: string;
  serviceHours: number;
  mmmZone: MMMZone;
  dayTypeOverride?: DayType;
  claimedTravelMinutes?: number;
  travelDistanceKm?: number;
  vehicleType?: VehicleType;
  nonLaborTravelCost?: number;
  parkingCost?: number;
  tollsCost?: number;
  publicTransportCost?: number;
  travelNotes?: string;
  participantId?: string;
  sessionDate?: string;
}

export interface PriceLimitAudit {
  isCompliant: boolean;
  maximumPermissibleRate: number;
  appliedHourlyRate: number;
  exceedsPriceLimit: boolean;
  geographicLoadingApplied: number; // percentage
  travelCapAppliedMinutes: number;
  auditFlags: string[];
}

export interface ClaimLineCalculation {
  lineItemCode: string;
  lineItemName: string;
  supportItemNumber: string;
  category: SupportCategory;
  unit: string;
  baseRatePerHour: number;
  dayType: DayType | string;
  mmmZone: MMMZone;
  geographicLoadingPercent: number;
  geographicMultiplier: number;
  loadedRatePerHour: number;
  serviceHours: number;
  directServiceCost: number;
  travelMinutes: number;
  billableTravelMinutes: number;
  travelLaborCost: number;
  travelDistanceKm: number;
  nonLaborTravelCost: number;
  totalClaimAmount: number;
  isWithinPriceLimit: boolean;
  priceLimitAudit?: PriceLimitAudit;
  complianceNotes: string[];
  calculatedAt: string;
  travelDetails?: TravelCalculation;
  activityTransportDetails?: ActivityBasedTransport;
  nonLabourDetails?: NonLabourTravelCosts;
}

export interface PricingCalculationResponse {
  success: boolean;
  calculation: ClaimLineCalculation;
  disclaimer: string;
  message?: string;
}

export interface BatchPricingRequest {
  items: PricingCalculationRequest[];
  tenantId?: string;
}

export interface BatchPricingResponse {
  success: boolean;
  items: ClaimLineCalculation[];
  totalBatchClaimAmount: number;
  compliantCount: number;
  disclaimer: string;
}
