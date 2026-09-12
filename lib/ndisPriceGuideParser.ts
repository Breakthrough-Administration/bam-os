/**
 * Breakthrough Manager OS - NDIS Price Guide Parser & Importer
 * Automates ingestion of NDIA Pricing Arrangements and Price Limits (PAPL)
 * from official CSV and JSON datasets to keep billing rates current.
 */

import { PAPLLineItem, SupportCategory } from '../types/pricing';
import { OFFICIAL_PAPL_CATALOGUE } from './ndisPricingService';

export function normalizeCategory(rawCat?: string): SupportCategory {
  if (!rawCat) return 'Core';
  if (/capacity|therapy|behaviour|pbs|allied|coordination/i.test(rawCat)) {
    return 'Capacity Building';
  }
  if (/capital|assistivetech|equipment/i.test(rawCat)) {
    return 'Capital';
  }
  return 'Core';
}

export function normalizeUnit(rawUnit?: string): 'Hour' | 'Each' | 'Kilometre' | 'Day' | 'Week' {
  if (!rawUnit) return 'Hour';
  const lower = rawUnit.toLowerCase();
  if (lower.includes('km') || lower.includes('kilometre')) return 'Kilometre';
  if (lower.includes('each') || lower.includes('item') || lower.includes('ea')) return 'Each';
  if (lower.includes('day')) return 'Day';
  if (lower.includes('week')) return 'Week';
  return 'Hour';
}

export interface ParsedItemChange {
  code: string;
  name: string;
  category: string;
  oldRate?: number;
  newRate: number;
  rateDifference?: number;
  isNew: boolean;
  unit: string;
  providerTravelPermitted: boolean;
}

export interface PriceGuideParseResult {
  success: boolean;
  importedItems: PAPLLineItem[];
  totalParsed: number;
  newItemsCount: number;
  updatedRatesCount: number;
  unchangedCount: number;
  changes: ParsedItemChange[];
  errors: string[];
  catalogueVersion?: string;
  effectiveDate?: string;
}

const STORAGE_KEY_CUSTOM_CATALOGUE = 'breakthrough_custom_papl_catalogue_v1';

/**
 * Loads custom imported PAPL catalogue from localStorage or falls back to official catalogue
 */
export function getActivePAPLCatalogue(): PAPLLineItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_CATALOGUE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[ndisPriceGuideParser] Failed to load cached catalogue:', e);
  }
  return [...OFFICIAL_PAPL_CATALOGUE];
}

/**
 * Persists an updated PAPL catalogue to localStorage
 */
export function saveActivePAPLCatalogue(items: PAPLLineItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOM_CATALOGUE, JSON.stringify(items));
  } catch (e) {
    console.error('[ndisPriceGuideParser] Failed to save custom catalogue:', e);
  }
}

/**
 * Resets catalogue back to base factory defaults
 */
export function resetToDefaultCatalogue(): PAPLLineItem[] {
  try {
    localStorage.removeItem(STORAGE_KEY_CUSTOM_CATALOGUE);
  } catch (e) {
    console.warn('[ndisPriceGuideParser] Error clearing cached catalogue:', e);
  }
  return [...OFFICIAL_PAPL_CATALOGUE];
}

/**
 * Parses raw CSV content from official NDIS Price Guide files
 */
export function parseNDISPriceGuideCSV(csvContent: string): PriceGuideParseResult {
  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return {
      success: false,
      importedItems: [],
      totalParsed: 0,
      newItemsCount: 0,
      updatedRatesCount: 0,
      unchangedCount: 0,
      changes: [],
      errors: ['File is empty or contains no data rows.'],
    };
  }

  // Parse header
  const headerLine = lines[0];
  const headers = splitCSVRow(headerLine).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

  // Header column index resolvers
  const codeIdx = headers.findIndex((h) =>
    h.includes('supportitemnumber') || h.includes('itemnumber') || h.includes('code') || h.includes('itemcode')
  );
  const nameIdx = headers.findIndex((h) =>
    h.includes('supportitemname') || h.includes('itemname') || h.includes('description') || h.includes('name')
  );
  const rateIdx = headers.findIndex((h) =>
    h.includes('national') || h.includes('nationalpricelimit') || h.includes('pricelimit') || h.includes('rate') || h.includes('baserate')
  );
  const catIdx = headers.findIndex((h) =>
    h.includes('category') || h.includes('supportcategory') || h.includes('group')
  );
  const unitIdx = headers.findIndex((h) =>
    h.includes('unit') || h.includes('unitofmeasure') || h.includes('uom')
  );
  const travelIdx = headers.findIndex((h) =>
    h.includes('travel') || h.includes('providertravel')
  );

  if (codeIdx === -1 || (nameIdx === -1 && rateIdx === -1)) {
    return {
      success: false,
      importedItems: [],
      totalParsed: 0,
      newItemsCount: 0,
      updatedRatesCount: 0,
      unchangedCount: 0,
      changes: [],
      errors: [
        'Invalid NDIS Price Guide CSV format. Could not locate required columns ("Support Item Number", "National Price Limit" or "Rate").',
      ],
    };
  }

  const existingCatalogue = getActivePAPLCatalogue();
  const existingMap = new Map(existingCatalogue.map((i) => [i.code, i]));

  const importedItems: PAPLLineItem[] = [];
  const changes: ParsedItemChange[] = [];
  const errors: string[] = [];

  let newItemsCount = 0;
  let updatedRatesCount = 0;
  let unchangedCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const row = splitCSVRow(lines[i]);
    if (!row || row.length <= codeIdx) continue;

    const rawCode = row[codeIdx]?.trim();
    if (!rawCode || rawCode.toLowerCase().includes('item') || rawCode.length < 3) continue;

    const rawName = nameIdx !== -1 && row[nameIdx] ? row[nameIdx].trim() : `NDIS Support Item ${rawCode}`;
    const rawRateStr = rateIdx !== -1 && row[rateIdx] ? row[rateIdx].replace(/[$,]/g, '').trim() : '0';
    const rate = parseFloat(rawRateStr);

    if (isNaN(rate) || rate < 0) {
      errors.push(`Row ${i + 1}: Invalid price limit "${row[rateIdx]}" for item ${rawCode}.`);
      continue;
    }

    const rawCategory = catIdx !== -1 && row[catIdx] ? row[catIdx].trim() : 'Core';
    const unit = unitIdx !== -1 && row[unitIdx] ? row[unitIdx].trim() : 'Hour';
    const travelPermitted =
      travelIdx !== -1 && row[travelIdx]
        ? row[travelIdx].toLowerCase().includes('y') || row[travelIdx].toLowerCase().includes('true')
        : true;

    // Normalise category
    const category = normalizeCategory(rawCategory);

    const existing = existingMap.get(rawCode);
    const isNew = !existing;
    const oldRate = existing?.nationalBaseRate;
    const rateDiff = oldRate !== undefined ? Math.round((rate - oldRate) * 100) / 100 : undefined;

    if (isNew) {
      newItemsCount++;
    } else if (rateDiff && Math.abs(rateDiff) > 0.001) {
      updatedRatesCount++;
    } else {
      unchangedCount++;
    }

    changes.push({
      code: rawCode,
      name: rawName,
      category,
      oldRate,
      newRate: rate,
      rateDifference: rateDiff,
      isNew,
      unit: normalizeUnit(unit),
      providerTravelPermitted: travelPermitted,
    });

    const newItem: PAPLLineItem = {
      code: rawCode,
      name: rawName,
      category,
      supportItemNumber: rawCode,
      unit: normalizeUnit(unit),
      nationalBaseRate: rate,
      dayType: determineDayTypeFromCodeOrName(rawCode, rawName),
      providerTravelPermitted: travelPermitted,
      registrationGroup: existing?.registrationGroup || 'NDIS Registered Support',
      description: existing?.description || `Imported NDIA Price Guide item ${rawCode}`,
    };

    importedItems.push(newItem);
    existingMap.set(rawCode, newItem);
  }

  return {
    success: importedItems.length > 0,
    importedItems: Array.from(existingMap.values()),
    totalParsed: importedItems.length,
    newItemsCount,
    updatedRatesCount,
    unchangedCount,
    changes,
    errors,
  };
}

/**
 * Parses JSON format NDIS Price Guide files
 */
export function parseNDISPriceGuideJSON(jsonContent: string): PriceGuideParseResult {
  try {
    const data = JSON.parse(jsonContent);
    const rows = Array.isArray(data) ? data : data.items || data.priceGuide || data.supportItems;

    if (!Array.isArray(rows) || rows.length === 0) {
      return {
        success: false,
        importedItems: [],
        totalParsed: 0,
        newItemsCount: 0,
        updatedRatesCount: 0,
        unchangedCount: 0,
        changes: [],
        errors: ['JSON does not contain a valid array of support items.'],
      };
    }

    const existingCatalogue = getActivePAPLCatalogue();
    const existingMap = new Map(existingCatalogue.map((i) => [i.code, i]));

    const importedItems: PAPLLineItem[] = [];
    const changes: ParsedItemChange[] = [];
    const errors: string[] = [];

    let newItemsCount = 0;
    let updatedRatesCount = 0;
    let unchangedCount = 0;

    rows.forEach((row, idx) => {
      const code = row.code || row.supportItemNumber || row.itemNumber || row.id;
      const name = row.name || row.supportItemName || row.description;
      const rate = typeof row.nationalBaseRate === 'number'
        ? row.nationalBaseRate
        : parseFloat((row.nationalPriceLimit || row.rate || row.priceLimit || '0').toString().replace(/[$,]/g, ''));

      if (!code || isNaN(rate) || rate < 0) {
        errors.push(`Item ${idx + 1}: Invalid code or price limit.`);
        return;
      }

      const existing = existingMap.get(code);
      const isNew = !existing;
      const oldRate = existing?.nationalBaseRate;
      const rateDiff = oldRate !== undefined ? Math.round((rate - oldRate) * 100) / 100 : undefined;

      if (isNew) {
        newItemsCount++;
      } else if (rateDiff && Math.abs(rateDiff) > 0.001) {
        updatedRatesCount++;
      } else {
        unchangedCount++;
      }

      changes.push({
        code,
        name: name || `NDIS Support Item ${code}`,
        category: normalizeCategory(row.category),
        oldRate,
        newRate: rate,
        rateDifference: rateDiff,
        isNew,
        unit: normalizeUnit(row.unit),
        providerTravelPermitted: row.providerTravelPermitted ?? true,
      });

      const newItem: PAPLLineItem = {
        code,
        name: name || `NDIS Support Item ${code}`,
        category: normalizeCategory(row.category),
        supportItemNumber: code,
        unit: normalizeUnit(row.unit),
        nationalBaseRate: rate,
        dayType: row.dayType || determineDayTypeFromCodeOrName(code, name || ''),
        providerTravelPermitted: row.providerTravelPermitted ?? true,
        registrationGroup: row.registrationGroup || existing?.registrationGroup || 'NDIS Registered Support',
        description: row.description || existing?.description || `Imported NDIS line item ${code}`,
      };

      importedItems.push(newItem);
      existingMap.set(code, newItem);
    });

    return {
      success: importedItems.length > 0,
      importedItems: Array.from(existingMap.values()),
      totalParsed: importedItems.length,
      newItemsCount,
      updatedRatesCount,
      unchangedCount,
      changes,
      errors,
      catalogueVersion: data.version || data.catalogueVersion,
      effectiveDate: data.effectiveDate,
    };
  } catch (e: any) {
    return {
      success: false,
      importedItems: [],
      totalParsed: 0,
      newItemsCount: 0,
      updatedRatesCount: 0,
      unchangedCount: 0,
      changes: [],
      errors: [`JSON parse error: ${e.message}`],
    };
  }
}

/**
 * Universal parser detecting CSV or JSON format
 */
export function parseNDISPriceGuide(rawContent: string, hintFormat?: 'csv' | 'json'): PriceGuideParseResult {
  const trimmed = rawContent.trim();
  if (hintFormat === 'json' || trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return parseNDISPriceGuideJSON(trimmed);
  }
  return parseNDISPriceGuideCSV(trimmed);
}

/**
 * Helper to split CSV rows respecting quoted commas
 */
function splitCSVRow(rowStr: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < rowStr.length; i++) {
    const char = rowStr[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim().replace(/^"(.*)"$/, '$1'));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^"(.*)"$/, '$1'));
  return result;
}

/**
 * Infers day type from support item naming/code conventions
 */
function determineDayTypeFromCodeOrName(code: string, name: string): any {
  const lower = name.toLowerCase();
  if (lower.includes('saturday')) return 'saturday';
  if (lower.includes('sunday')) return 'sunday';
  if (lower.includes('public holiday')) return 'public_holiday';
  if (lower.includes('evening')) return 'weekday_evening';
  if (lower.includes('night') || lower.includes('active overnight')) return 'weekday_night';
  return 'weekday_day';
}

/**
 * Official NDIA 2025-2026 Sample Price Guide Dataset (CSV)
 * Includes indexed rates and newly introduced support codes for instant demo import.
 */
export function getOfficial20252026SampleDataset(): string {
  return `Support Item Number,Support Item Name,Support Category,Unit of Measure,National Price Limit,Provider Travel Permitted
01_011_0107_1_1,"Assistance With Self-Care - Standard - Weekday Daytime",Core,Hour,70.50,Yes
01_015_0107_1_1,"Assistance With Self-Care - Standard - Weekday Evening",Core,Hour,77.80,Yes
01_002_0107_1_1,"Assistance With Self-Care - Standard - Weekday Night",Core,Hour,79.25,Yes
01_013_0107_1_1,"Assistance With Self-Care - Standard - Saturday",Core,Hour,99.60,Yes
01_014_0107_1_1,"Assistance With Self-Care - Standard - Sunday",Core,Hour,128.40,Yes
01_012_0107_1_1,"Assistance With Self-Care - Standard - Public Holiday",Core,Hour,156.80,Yes
01_400_0104_1_1,"Assistance With Self-Care - High Intensity - Weekday Daytime",Core,Hour,78.20,Yes
01_401_0104_1_1,"Assistance With Self-Care - High Intensity - Weekday Evening",Core,Hour,85.60,Yes
15_056_0128_1_3,"Specialist Behavioural Intervention Support (PBS Specialist)",Capacity Building,Hour,222.99,Yes
15_057_0128_1_3,"Behaviour Support Plan - Strategy Training & Implementation",Capacity Building,Hour,201.50,Yes
15_048_0128_1_3,"Assessment, Recommendation, Therapy and/or Training - Psychologist",Capacity Building,Hour,222.99,Yes
15_052_0128_1_3,"Assessment, Recommendation, Therapy and/or Training - Occupational Therapist",Capacity Building,Hour,201.50,Yes
15_053_0128_1_3,"Assessment, Recommendation, Therapy and/or Training - Speech Pathologist",Capacity Building,Hour,201.50,Yes
07_001_0106_8_3,"Level 2: Coordination Of Supports - Standard",Capacity Building,Hour,105.80,Yes
07_002_0132_8_3,"Level 3: Specialist Support Coordination",Capacity Building,Hour,201.50,Yes
15_038_0117_1_3,"Positive Behaviour Support - In-Home Environmental Training (NEW 2026)",Capacity Building,Hour,193.99,Yes
01_799_0104_1_1,"Provider Travel - Direct Non-Labour Travel Escort (NEW 2026)",Core,Hour,70.50,Yes`;
}
