import { Participant, NDISGoal } from '../types';

export interface ParticipantParseResult {
  success: boolean;
  importedParticipants: Participant[];
  errors: string[];
  warnings: string[];
  totalRows: number;
}

/**
 * Robust CSV line splitter that respects quoted fields containing commas and linebreaks.
 */
export function parseCSVToRows(csvContent: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < csvContent.length; i++) {
    const char = csvContent[i];
    const nextChar = csvContent[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentField.trim());
      currentField = '';
      if (currentRow.some(cell => cell.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(cell => cell.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Normalizes header keys to standard participant field names
 */
function normalizeHeader(header: string): string {
  const clean = header.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (clean.includes('ndis') && (clean.includes('num') || clean.includes('no') || clean === 'ndis')) return 'ndisNumber';
  if (clean === 'fullname' || clean === 'name' || clean === 'clientname' || clean === 'participantname') return 'fullName';
  if (clean === 'preferredname' || clean === 'nickname') return 'preferredName';
  if (clean === 'dateofbirth' || clean === 'dob' || clean === 'birthdate') return 'dateOfBirth';
  if (clean === 'gender' || clean === 'sex') return 'gender';
  if (clean === 'primarydiagnosis' || clean === 'diagnosis' || clean === 'primarycondition') return 'primaryDiagnosis';
  if (clean.includes('secondarydiag') || clean === 'comorbidities') return 'secondaryDiagnoses';
  if (clean.includes('mmm') || clean === 'mmmzone' || clean === 'monash') return 'mmmZone';
  if (clean === 'suburb' || clean === 'city') return 'suburb';
  if (clean === 'postcode' || clean === 'zip' || clean === 'postalcode') return 'postcode';
  if (clean === 'state' || clean === 'territory') return 'state';
  if (clean.includes('planstart')) return 'planStartDate';
  if (clean.includes('planend')) return 'planEndDate';
  if (clean.includes('totalallocated') || clean.includes('totalbudget') || clean === 'allocatedbudget') return 'totalAllocatedBudget';
  if (clean.includes('consumed') || clean.includes('spentbudget') || clean === 'usedbudget') return 'consumedBudget';
  if (clean === 'activebsp' || clean === 'hasbsp' || clean === 'bsp') return 'activeBSP';
  if (clean.includes('bspreview') || clean.includes('bspdue')) return 'bspReviewDueDate';
  if (clean.includes('restrictive') || clean.includes('restraint') || clean.includes('rpcount')) return 'activeRestrictivePracticesCount';
  if (clean.includes('emergencyname') || clean.includes('nomineename') || clean === 'contactemergencyname') return 'contactEmergencyName';
  if (clean.includes('emergencyphone') || clean.includes('nomineephone') || clean === 'contactemergencyphone') return 'contactEmergencyPhone';
  if (clean.includes('practitioner') || clean.includes('pbslead') || clean === 'behavioursupportpractitioner') return 'behaviourSupportPractitioner';
  if (clean.includes('keyworker') || clean.includes('alliedhealth') || clean === 'alliedhealthkeyworker') return 'alliedHealthKeyWorker';
  if (clean === 'goals' || clean === 'ndisgoals' || clean === 'plangoals') return 'goals';
  if (clean === 'id') return 'id';
  return clean;
}

/**
 * Parses NDIS Goals from either JSON array or pipe/semicolon string
 * Format: Title|Description|Category|Status|TargetDate; ...
 */
function parseGoals(goalsRaw: string, participantId: string): NDISGoal[] {
  if (!goalsRaw) return [];
  
  // Attempt JSON parsing first
  if (goalsRaw.trim().startsWith('[') && goalsRaw.trim().endsWith(']')) {
    try {
      const parsed = JSON.parse(goalsRaw);
      if (Array.isArray(parsed)) {
        return parsed.map((g, idx) => ({
          id: g.id || `goal-${participantId}-${idx + 1}`,
          title: g.title || 'Goal',
          description: g.description || '',
          category: (['core', 'capacity_building', 'capital'].includes(g.category) ? g.category : 'capacity_building') as any,
          status: (['not_started', 'in_progress', 'achieved', 'abandoned'].includes(g.status) ? g.status : 'in_progress') as any,
          targetDate: g.targetDate || new Date().toISOString().slice(0, 10),
        }));
      }
    } catch {
      // Fall through to pipe format
    }
  }

  // Semicolon-separated list of piped goal details
  const goalItems = goalsRaw.split(';').map(s => s.trim()).filter(Boolean);
  return goalItems.map((itemStr, idx) => {
    const parts = itemStr.split('|').map(s => s.trim());
    const title = parts[0] || `Goal ${idx + 1}`;
    const description = parts[1] || title;
    const catRaw = (parts[2] || 'capacity_building').toLowerCase();
    const category = (catRaw.includes('core') ? 'core' : catRaw.includes('capit') ? 'capital' : 'capacity_building') as NDISGoal['category'];
    const statRaw = (parts[3] || 'in_progress').toLowerCase();
    const status = (statRaw.includes('achiev') ? 'achieved' : statRaw.includes('abandon') ? 'abandoned' : statRaw.includes('not') ? 'not_started' : 'in_progress') as NDISGoal['status'];
    const targetDate = parts[4] || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    return {
      id: `goal-${participantId}-${idx + 1}`,
      title,
      description,
      category,
      status,
      targetDate,
    };
  });
}

/**
 * Validates and converts raw CSV string to structured NDIS Participants
 */
export function parseParticipantCSV(csvContent: string, defaultTenantId = 'tenant-breakthrough-vic'): ParticipantParseResult {
  const rows = parseCSVToRows(csvContent);
  const errors: string[] = [];
  const warnings: string[] = [];
  const importedParticipants: Participant[] = [];

  if (rows.length < 2) {
    return {
      success: false,
      importedParticipants: [],
      errors: ['CSV file is empty or missing data rows.'],
      warnings: [],
      totalRows: 0,
    };
  }

  const rawHeaders = rows[0];
  const headerMap: Record<string, number> = {};
  rawHeaders.forEach((h, index) => {
    const normalized = normalizeHeader(h);
    headerMap[normalized] = index;
  });

  // Verify critical headers
  const requiredFields = ['ndisNumber', 'fullName'];
  for (const field of requiredFields) {
    if (headerMap[field] === undefined) {
      errors.push(`Required column "${field}" (or variant) was not detected in CSV header.`);
    }
  }

  if (errors.length > 0) {
    return {
      success: false,
      importedParticipants: [],
      errors,
      warnings,
      totalRows: rows.length - 1,
    };
  }

  const dataRows = rows.slice(1);
  dataRows.forEach((row, rowIndex) => {
    const rowNum = rowIndex + 2; // 1-based index in sheet
    
    // Safely get field value
    const getVal = (field: string, fallback = ''): string => {
      const idx = headerMap[field];
      return idx !== undefined && row[idx] !== undefined ? row[idx].trim() : fallback;
    };

    const fullName = getVal('fullName');
    const rawNdis = getVal('ndisNumber').replace(/[^0-9]/g, '');

    if (!fullName) {
      errors.push(`Row ${rowNum}: Participant full name is missing.`);
      return;
    }

    if (!rawNdis || rawNdis.length !== 9) {
      warnings.push(`Row ${rowNum} (${fullName}): NDIS Number "${getVal('ndisNumber')}" is not 9 digits.`);
    }

    const participantId = getVal('id') || `part-imp-${Date.now().toString(36)}-${rowIndex + 1}`;
    
    // MMM Zone validation (1 to 7)
    let mmmZone = parseInt(getVal('mmmZone', '1'), 10);
    if (isNaN(mmmZone) || mmmZone < 1 || mmmZone > 7) {
      mmmZone = 1;
      warnings.push(`Row ${rowNum} (${fullName}): Invalid MMM zone specified, defaulting to MMM 1 (Metropolitan).`);
    }

    // State validation
    const stateRaw = getVal('state', 'VIC').toUpperCase();
    const validStates = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];
    const state = (validStates.includes(stateRaw) ? stateRaw : 'VIC') as Participant['state'];

    // Secondary diagnoses
    const secRaw = getVal('secondaryDiagnoses');
    const secondaryDiagnoses = secRaw
      ? secRaw.split(/[;,]/).map(s => s.trim()).filter(Boolean)
      : undefined;

    // Budgets
    const totalAllocatedBudget = parseFloat(getVal('totalAllocatedBudget', '150000').replace(/[^0-9.]/g, '')) || 150000;
    const consumedBudget = parseFloat(getVal('consumedBudget', '0').replace(/[^0-9.]/g, '')) || 0;

    // BSP flags
    const activeBSPRaw = getVal('activeBSP', 'true').toLowerCase();
    const activeBSP = activeBSPRaw === 'true' || activeBSPRaw === '1' || activeBSPRaw === 'yes';

    const activeRPCount = parseInt(getVal('activeRestrictivePracticesCount', '0'), 10) || 0;

    // Dates
    const planStartDate = getVal('planStartDate', new Date().toISOString().slice(0, 10));
    const planEndDate = getVal('planEndDate', new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    const bspReviewDueDate = getVal('bspReviewDueDate') || undefined;

    // Goals
    const goals = parseGoals(getVal('goals'), participantId);

    const participant: Participant = {
      id: participantId,
      tenantId: defaultTenantId,
      ndisNumber: rawNdis || getVal('ndisNumber', '430000000'),
      fullName,
      preferredName: getVal('preferredName') || fullName.split(' ')[0],
      dateOfBirth: getVal('dateOfBirth', '2000-01-01'),
      gender: getVal('gender', 'Unspecified'),
      primaryDiagnosis: getVal('primaryDiagnosis', 'NDIS Support Plan Specified Condition'),
      secondaryDiagnoses,
      mmmZone: mmmZone as Participant['mmmZone'],
      suburb: getVal('suburb', 'Melbourne'),
      postcode: getVal('postcode', '3000'),
      state,
      planStartDate,
      planEndDate,
      totalAllocatedBudget,
      consumedBudget,
      activeBSP,
      bspReviewDueDate,
      activeRestrictivePracticesCount: activeRPCount,
      contactEmergencyName: getVal('contactEmergencyName', 'Primary Nominee / Support Coordinator'),
      contactEmergencyPhone: getVal('contactEmergencyPhone', '1800 555 634'),
      behaviourSupportPractitioner: getVal('behaviourSupportPractitioner', 'Dr. Sarah Jenkins (PBS Specialist)'),
      alliedHealthKeyWorker: getVal('alliedHealthKeyWorker', 'Marcus Vance (Senior OT)'),
      goals: goals.length > 0 ? goals : undefined,
    };

    importedParticipants.push(participant);
  });

  return {
    success: importedParticipants.length > 0,
    importedParticipants,
    errors,
    warnings,
    totalRows: dataRows.length,
  };
}
