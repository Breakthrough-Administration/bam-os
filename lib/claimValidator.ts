/**
 * Breakthrough Manager OS - NDIS Claim Validator
 * Validates bulk billing batches, PACE claim submissions, service agreements,
 * and individual claim line compliance against the NDIS Commission guidelines.
 */

import { ClaimLineCalculation } from '../types';
import { calculateNDISClaim, ClaimInput, OFFICIAL_PAPL_CATALOGUE } from './ndisPricingService';

export interface ValidationIssue {
  field: string;
  severity: 'ERROR' | 'WARNING';
  message: string;
}

export interface ClaimValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  calculation: ClaimLineCalculation;
}

export function validateClaimInput(input: ClaimInput, serviceAgreementBudgetRemaining?: number): ClaimValidationResult {
  const issues: ValidationIssue[] = [];

  // Validate line item existence
  const item = OFFICIAL_PAPL_CATALOGUE.find((c) => c.code === input.lineItemCode);
  if (!item) {
    issues.push({
      field: 'lineItemCode',
      severity: 'WARNING',
      message: `Line item ${input.lineItemCode} is not in standard PAPL catalogue; manual verification required.`,
    });
  }

  // Validate service hours
  if (input.serviceHours <= 0) {
    issues.push({
      field: 'serviceHours',
      severity: 'ERROR',
      message: 'Service hours must be greater than 0.',
    });
  } else if (input.serviceHours > 24) {
    issues.push({
      field: 'serviceHours',
      severity: 'ERROR',
      message: 'Single shift duration cannot exceed 24 hours.',
    });
  }

  // Validate MMM zone
  if (input.mmmZone < 1 || input.mmmZone > 7) {
    issues.push({
      field: 'mmmZone',
      severity: 'ERROR',
      message: 'Modified Monash Model zone must be between 1 and 7.',
    });
  }

  // Run calculation
  const calculation = calculateNDISClaim(input);

  // Check budget headroom
  if (serviceAgreementBudgetRemaining !== undefined) {
    if (calculation.totalClaimAmount > serviceAgreementBudgetRemaining) {
      issues.push({
        field: 'totalClaimAmount',
        severity: 'ERROR',
        message: `Claim amount ($${calculation.totalClaimAmount.toFixed(2)}) exceeds remaining service agreement budget ($${serviceAgreementBudgetRemaining.toFixed(2)}).`,
      });
    }
  }

  const isValid = !issues.some((i) => i.severity === 'ERROR');

  return {
    isValid,
    issues,
    calculation,
  };
}
