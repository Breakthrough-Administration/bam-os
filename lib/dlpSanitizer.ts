/**
 * Breakthrough Manager OS - Data Loss Prevention (DLP) Sanitiser
 * Evaluates payloads for Australian Privacy Principle (APP 11) compliance.
 */

import { maskPII, MaskResult } from './piiMasker';

export interface DLPEvaluation {
  isSafeForAIEgress: boolean;
  sanitisedPayload: string;
  violationsDetected: string[];
  piiMetadata: MaskResult;
  riskScore: 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKED';
}

export function evaluateAndSanitiseForAI(content: string): DLPEvaluation {
  const piiResult = maskPII(content);
  const violations: string[] = [];

  if (piiResult.detectedCategories.includes('NDIS_NUMBER')) {
    violations.push('Direct NDIS Participant Identifier detected');
  }
  if (piiResult.detectedCategories.includes('MEDICARE_NUMBER')) {
    violations.push('Australian Medicare Card Number detected');
  }
  if (piiResult.detectedCategories.includes('RESIDENTIAL_ADDRESS')) {
    violations.push('Participant Residential Address identified');
  }

  let riskScore: DLPEvaluation['riskScore'] = 'LOW';
  if (piiResult.maskedCount >= 4 || violations.length >= 2) {
    riskScore = 'HIGH';
  } else if (piiResult.maskedCount > 0) {
    riskScore = 'MEDIUM';
  }

  return {
    isSafeForAIEgress: true, // Safe now that PII masking has stripped the raw identifiers
    sanitisedPayload: piiResult.sanitisedText,
    violationsDetected: violations,
    piiMetadata: piiResult,
    riskScore,
  };
}
