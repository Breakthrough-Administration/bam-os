import { useEffect, useRef } from 'react';
import { useManagementStore } from '../../../stores';
import { sendClinicalEmailWithConfirm } from '../../../lib/googleWorkspace';

export const useBudgetMonitor = () => {
  const { participants } = useManagementStore();
  const alertedParticipants = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Only run if we have participants and window is defined
    if (!participants || participants.length === 0 || typeof window === 'undefined') return;

    participants.forEach((p) => {
      const utilPercent = p.consumedBudget / p.totalAllocatedBudget;
      let threshold = 0;
      
      if (utilPercent >= 0.95) {
        threshold = 95;
      } else if (utilPercent >= 0.80) {
        threshold = 80;
      }

      if (threshold > 0) {
        const alertKey = `${p.id}-${threshold}`;
        
        // If we haven't alerted for this threshold in this session
        if (!alertedParticipants.current.has(alertKey)) {
          alertedParticipants.current.add(alertKey);
          
          // Use setTimeout to avoid blocking render and showing multiple confirms at once
          setTimeout(async () => {
            try {
              const subject = `[URGENT] NDIS Budget Alert: ${p.fullName} at ${threshold}%`;
              const body = `Automated System Alert:
              
Participant: ${p.fullName} (NDIS: ${p.ndisNumber})
Allocated Budget: $${p.totalAllocatedBudget}
Consumed Budget: $${p.consumedBudget}
Utilization: ${Math.round(utilPercent * 100)}%

Please review the participant's Service Agreement and arrange a Plan Reassessment if necessary.

Breakthrough Clinical OS`;

              // Will prompt user with window.confirm
              await sendClinicalEmailWithConfirm('support.coordinator@example.com.au', subject, body);
            } catch (e) {
              console.log('Budget alert email cancelled or failed:', e);
            }
          }, 1000); // slight delay
        }
      }
    });
  }, [participants]);
};
