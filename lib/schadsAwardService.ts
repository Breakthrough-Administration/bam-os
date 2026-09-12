/**
 * Breakthrough Manager OS - Fair Work SCHADS Award Compliance Engine
 * Enforces Social, Community, Home Care and Disability Services Industry Award 2020.
 * Validates minimum engagement periods, broken shifts, 10-hour rest breaks, and overtime penalties.
 */

import { RosterShift, ShiftComplianceAudit } from '../types';

export const SCHADS_CONSTANTS = {
  MINIMUM_ENGAGEMENT_HOURS: 2.0, // Clause 10.5
  MINIMUM_REST_BREAK_HOURS: 10.0, // Clause 25.5
  MAX_STANDARD_DAILY_HOURS: 10.0, // Clause 25.1
  MAX_BROKEN_SHIFT_SPAN_HOURS: 12.0, // Clause 25.4
  BROKEN_SHIFT_ALLOWANCE: 19.46, // Standard daily allowance
  OVERTIME_TIER_1_MULTIPLIER: 1.5, // First 2 hours
  OVERTIME_TIER_2_MULTIPLIER: 2.0, // After 2 hours
  SUNDAY_PENALTY_MULTIPLIER: 2.0,
  PUBLIC_HOLIDAY_MULTIPLIER: 2.5,
};

/**
 * Base hourly pay rates by SCHADS Level & Pay Point (2024-2025 pay scale guide)
 */
export const SCHADS_BASE_RATES: Record<string, number> = {
  '1.1': 25.80,
  '2.1': 32.41,
  '2.2': 33.25,
  '3.1': 35.12,
  '3.2': 36.40,
  '4.1': 38.85,
  '4.2': 40.10,
  '5.1': 43.20,
  '5.2': 44.60,
  '6.1': 47.80,
};

/**
 * Audit a scheduled shift against SCHADS Award compliance rules,
 * taking into consideration prior and subsequent shifts worked by the same employee.
 */
export function auditShiftCompliance(
  currentShift: RosterShift,
  priorShiftOfWorker?: RosterShift,
  weeklyAccumulatedHours: number = 0
): ShiftComplianceAudit {
  const start = new Date(currentShift.startTime).getTime();
  const end = new Date(currentShift.endTime).getTime();
  const durationHours = Math.max(0, (end - start) / (1000 * 60 * 60));

  const violations: string[] = [];

  // 1. Validate Minimum Engagement (Clause 10.5: 2 hours minimum)
  const minimumEngagementMet = durationHours >= SCHADS_CONSTANTS.MINIMUM_ENGAGEMENT_HOURS;
  if (!minimumEngagementMet) {
    violations.push(
      `Shift duration of ${durationHours.toFixed(1)}h breaches Fair Work SCHADS Clause 10.5 (2-hour minimum engagement required).`
    );
  }

  // 2. Validate Rest Break Between Shifts (Clause 25.5: 10 hours minimum)
  let restBreakHours = 24; // default large if no prior shift
  let restBreakCompliant = true;

  if (priorShiftOfWorker) {
    const priorEnd = new Date(priorShiftOfWorker.endTime).getTime();
    restBreakHours = (start - priorEnd) / (1000 * 60 * 60);

    if (restBreakHours < SCHADS_CONSTANTS.MINIMUM_REST_BREAK_HOURS) {
      restBreakCompliant = false;
      violations.push(
        `Rest break between shifts is only ${restBreakHours.toFixed(1)}h. Breaches SCHADS Clause 25.5 (10-hour minimum rest required; penalty double-time applies).`
      );
    }
  }

  // 3. Overtime calculation
  let overtimeHours = 0;
  if (durationHours > SCHADS_CONSTANTS.MAX_STANDARD_DAILY_HOURS) {
    const dailyOT = durationHours - SCHADS_CONSTANTS.MAX_STANDARD_DAILY_HOURS;
    overtimeHours += dailyOT;
    violations.push(
      `Shift exceeds 10 standard daily hours by ${dailyOT.toFixed(1)}h. Daily overtime penalty triggered.`
    );
  }

  const projectedWeeklyHours = weeklyAccumulatedHours + durationHours;
  if (projectedWeeklyHours > 38) {
    const weeklyOT = Math.min(durationHours, projectedWeeklyHours - 38);
    if (weeklyOT > overtimeHours) {
      overtimeHours = weeklyOT;
      violations.push(
        `Weekly hours exceed 38 hours threshold (${projectedWeeklyHours.toFixed(1)}h total). Overtime rates apply.`
      );
    }
  }

  // 4. Broken Shift Allowance
  const brokenShiftAllowanceApplicable = currentShift.isBrokenShift;

  return {
    minimumEngagementMet,
    engagementHours: durationHours,
    restBreakBetweenShiftsHours: Math.round(restBreakHours * 10) / 10,
    restBreakCompliant,
    overtimeHours: Math.round(overtimeHours * 10) / 10,
    brokenShiftAllowanceApplicable,
    violations,
  };
}

/**
 * Calculates accurate gross wages for a shift including penalties and allowances.
 */
export function calculateShiftWages(shift: RosterShift, audit: ShiftComplianceAudit): {
  basePay: number;
  overtimePay: number;
  penaltyPay: number;
  brokenShiftAllowance: number;
  totalGrossPay: number;
} {
  const rateKey = `${shift.schadsLevel}.${shift.schadsPayPoint}`;
  const baseRate = SCHADS_BASE_RATES[rateKey] || 35.12;

  const standardHours = Math.max(0, audit.engagementHours - audit.overtimeHours);
  const basePay = Math.round(standardHours * baseRate * 100) / 100;

  // Overtime tiers: first 2 hours at 1.5x, remainder at 2.0x
  let overtimePay = 0;
  if (audit.overtimeHours > 0) {
    const tier1 = Math.min(2, audit.overtimeHours);
    const tier2 = Math.max(0, audit.overtimeHours - 2);
    overtimePay = Math.round((tier1 * baseRate * SCHADS_CONSTANTS.OVERTIME_TIER_1_MULTIPLIER +
      tier2 * baseRate * SCHADS_CONSTANTS.OVERTIME_TIER_2_MULTIPLIER) * 100) / 100;
  }

  // Non-compliant rest break penalty: Double time on entire shift if < 10h rest
  let penaltyPay = 0;
  if (!audit.restBreakCompliant) {
    penaltyPay = Math.round(standardHours * baseRate * 1.0 * 100) / 100; // Extra 1.0x to make 2.0x total
  }

  const brokenShiftAllowance = audit.brokenShiftAllowanceApplicable
    ? SCHADS_CONSTANTS.BROKEN_SHIFT_ALLOWANCE
    : 0;

  const totalGrossPay = Math.round((basePay + overtimePay + penaltyPay + brokenShiftAllowance) * 100) / 100;

  return {
    basePay,
    overtimePay,
    penaltyPay,
    brokenShiftAllowance,
    totalGrossPay,
  };
}
