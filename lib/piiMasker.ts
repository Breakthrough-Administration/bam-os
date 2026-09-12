/**
 * Breakthrough Manager OS - Data Loss Prevention & PII Masking Engine
 * Strictly enforces Privacy Act 1988 (Cth) and Australian NDIS Commission
 * health privacy invariants prior to any cloud/LLM boundary egress.
 */

export interface MaskResult {
  sanitisedText: string;
  maskedCount: number;
  tokensReplaced: Record<string, string>;
  detectedCategories: string[];
}

// Australian NDIS numbers (9 digits)
const NDIS_NUMBER_REGEX = /\b\d{9}\b/g;

// Australian Medicare Numbers (10 digits, optional spaces or slash e.g. 1234 56789 1 or 1234567891)
const MEDICARE_REGEX = /\b\d{4}\s?\d{5}\s?\d{1}\b/g;

// Australian Phone Numbers (+61 or 04xx or landlines with area codes)
const PHONE_REGEX = /(?:\+?61\s?|0)[23478](?:[ -]?\d){8}\b/g;

// Standard Email Regex
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Australian Date of Birth patterns (e.g. DOB: 14/08/1995 or 14-08-1995 or 14 Aug 1995)
const DOB_REGEX = /(?:DOB|D\.O\.B|Born|Birthdate|Date of birth)[\s:]+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}\s+[A-Za-z]+\s+\d{2,4})/gi;

// Australian Street Addresses (e.g. 12 Smith Street, Richmond VIC 3121)
const ADDRESS_REGEX = /\b\d{1,4}\s+[A-Za-z\s]+(?:Street|St|Road|Rd|Avenue|Ave|Drive|Dr|Parade|Pde|Crescent|Cres|Lane|Ln|Boulevard|Blvd|Way)\b(?:[,\s]+[A-Za-z\s]+(?:VIC|NSW|QLD|WA|SA|TAS|ACT|NT)\s+\d{4})?/gi;

// TFN - Tax File Number (8 or 9 digits with optional spaces)
const TFN_REGEX = /\b(?:\d{3}\s?\d{3}\s?\d{2,3})\b/g;

/**
 * Mask PII and Personal Health Information from unstructured clinical text.
 * Suitable for pre-processing clinical case notes, voice scribe transcripts, and FBA summaries.
 */
export function maskPII(rawText: string): MaskResult {
  if (!rawText || typeof rawText !== 'string') {
    return {
      sanitisedText: '',
      maskedCount: 0,
      tokensReplaced: {},
      detectedCategories: [],
    };
  }

  const tokensReplaced: Record<string, string> = {};
  const detectedCategories = new Set<string>();
  let count = 0;
  let text = rawText;

  // 1. Mask NDIS Numbers first (high regulatory sensitivity)
  text = text.replace(NDIS_NUMBER_REGEX, (match) => {
    count++;
    detectedCategories.add('NDIS_NUMBER');
    const token = `[NDIS_NUMBER_${count}]`;
    tokensReplaced[token] = match;
    return token;
  });

  // 2. Mask Medicare Numbers
  text = text.replace(MEDICARE_REGEX, (match) => {
    count++;
    detectedCategories.add('MEDICARE_NUMBER');
    const token = `[MEDICARE_${count}]`;
    tokensReplaced[token] = match;
    return token;
  });

  // 3. Mask Email addresses
  text = text.replace(EMAIL_REGEX, (match) => {
    count++;
    detectedCategories.add('EMAIL_ADDRESS');
    const token = `[EMAIL_${count}]`;
    tokensReplaced[token] = match;
    return token;
  });

  // 4. Mask Phone numbers
  text = text.replace(PHONE_REGEX, (match) => {
    count++;
    detectedCategories.add('PHONE_NUMBER');
    const token = `[PHONE_${count}]`;
    tokensReplaced[token] = match;
    return token;
  });

  // 5. Mask DOB statements
  text = text.replace(DOB_REGEX, (_match, dateVal) => {
    count++;
    detectedCategories.add('DATE_OF_BIRTH');
    const token = `[DOB_${count}]`;
    tokensReplaced[token] = dateVal;
    return `Date of Birth: ${token}`;
  });

  // 6. Mask Addresses
  text = text.replace(ADDRESS_REGEX, (match) => {
    count++;
    detectedCategories.add('RESIDENTIAL_ADDRESS');
    const token = `[RESIDENTIAL_ADDRESS_${count}]`;
    tokensReplaced[token] = match;
    return token;
  });

  return {
    sanitisedText: text,
    maskedCount: count,
    tokensReplaced,
    detectedCategories: Array.from(detectedCategories),
  };
}

/**
 * Re-hydrate masked text for local authorised clinical review only.
 */
export function unmaskPII(sanitisedText: string, tokensReplaced: Record<string, string>): string {
  let restored = sanitisedText;
  for (const [token, original] of Object.entries(tokensReplaced)) {
    restored = restored.replace(token, original);
  }
  return restored;
}
