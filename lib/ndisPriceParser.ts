import { collection, doc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { parseNDISPriceGuide, PriceGuideParseResult, ParsedItemChange } from './ndisPriceGuideParser';

export interface PAPLValidationResult {
  isValid: boolean;
  errors: string[];
}

export class NDISPriceParserService {
  /**
   * Validates PAPL items against current standards before ingestion.
   */
  static validatePAPLItem(item: any): PAPLValidationResult {
    const errors: string[] = [];
    if (!item.code || typeof item.code !== 'string') {
      errors.push('Missing or invalid support item code');
    }
    if (!item.name || typeof item.name !== 'string') {
      errors.push('Missing or invalid support item name');
    }
    if (typeof item.nationalBaseRate !== 'number' || item.nationalBaseRate < 0) {
      errors.push(`Invalid rate for item ${item.code}`);
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Ingests JSON/CSV price guide, validates it, and updates the Firestore `pricing` collection.
   */
  static async ingestPriceGuide(content: string, format?: 'csv' | 'json'): Promise<PriceGuideParseResult> {
    const result = parseNDISPriceGuide(content, format);

    if (result.success && result.importedItems.length > 0) {
      const batch = writeBatch(db);
      let validItemsCount = 0;

      for (const item of result.importedItems) {
        const validation = this.validatePAPLItem(item);
        if (validation.isValid) {
          const docRef = doc(collection(db, 'pricing'), item.code);
          batch.set(docRef, {
            ...item,
            updatedAt: new Date().toISOString()
          }, { merge: true });
          validItemsCount++;
        } else {
          result.errors.push(...validation.errors);
        }
      }

      if (validItemsCount > 0) {
        await batch.commit();
        console.log(`Successfully committed ${validItemsCount} items to Firestore pricing collection.`);
      } else {
        result.success = false;
        result.errors.push('No valid items passed PAPL validation.');
      }
    }

    return result;
  }
}
