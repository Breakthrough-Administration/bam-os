import { StateCreator } from 'zustand';
import { RosterShift } from '../../types';
import { INITIAL_SHIFTS } from '../../lib/seedData';
import { auditShiftCompliance } from '../../lib/schadsAwardService';

export interface HRSlice {
  shifts: RosterShift[];
  addShift: (shift: Omit<RosterShift, 'complianceAudit'>) => RosterShift;
  removeShift: (shiftId: string) => void;
  getWorkerShifts: (workerId: string) => RosterShift[];
}

export const createHRSlice: StateCreator<HRSlice> = (set, get) => ({
  shifts: INITIAL_SHIFTS,
  addShift: (shiftInput) => {
    // Find prior shift of worker to audit rest break
    const workerShifts = get()
      .shifts.filter((s) => s.workerId === shiftInput.workerId)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    const inputStart = new Date(shiftInput.startTime).getTime();
    const priorShift = workerShifts
      .filter((s) => new Date(s.endTime).getTime() <= inputStart)
      .pop();

    const partialShift: RosterShift = {
      ...shiftInput,
      complianceAudit: {
        minimumEngagementMet: true,
        engagementHours: 0,
        restBreakBetweenShiftsHours: 24,
        restBreakCompliant: true,
        overtimeHours: 0,
        brokenShiftAllowanceApplicable: false,
        violations: [],
      },
    };

    const audit = auditShiftCompliance(partialShift, priorShift);
    const completeShift: RosterShift = {
      ...partialShift,
      complianceAudit: audit,
    };

    set((state) => ({
      shifts: [completeShift, ...state.shifts],
    }));

    return completeShift;
  },
  removeShift: (shiftId: string) =>
    set((state) => ({
      shifts: state.shifts.filter((s) => s.id !== shiftId),
    })),
  getWorkerShifts: (workerId: string) => {
    return get().shifts.filter((s) => s.workerId === workerId);
  },
});
