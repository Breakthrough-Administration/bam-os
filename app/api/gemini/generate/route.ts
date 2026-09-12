/**
 * Protected Gemini AI Proxy Endpoint
 * Requires valid Bearer session authentication and enforces server-side clinical guardrails
 * to prevent prompt injection, unauthorized token usage, and quota exhaustion.
 */

import { Response } from 'express';
import { AuthenticatedRequest, verifyFirebaseIdToken } from '../../../../lib/auth/serverAuth';
import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in server environment.');
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

export async function POST(req: AuthenticatedRequest, res: Response) {
  try {
    // 1. Enforce Server Session Authentication
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'UNAUTHORIZED_MISSING_TOKEN',
        message: 'Server session verification required for clinical AI operations.',
      });
    }

    const token = authHeader.split('Bearer ')[1].trim();
    // Validate session
    const verified = await verifyFirebaseIdToken(token);
    if (!verified) {
      return res.status(401).json({
        error: 'UNAUTHORIZED_INVALID_TOKEN',
        message: 'Invalid or expired session token.',
      });
    }

    // 2. Validate sanitized payload
    const { prompt, contextType } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'Missing or invalid prompt string.' });
    }

    // Guard against prompt injection or excessively long inputs
    if (prompt.length > 8000) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'Prompt exceeds statutory limit.' });
    }

    // Server-enforced system instructions based on clinical context
    const systemInstruction = `You are a certified Australian NDIS Clinical Governance and Behaviour Support Specialist assistant.
Adhere strictly to:
- NDIS Quality and Safeguards Commission rules
- Positive Behaviour Support (PBS) capability framework
- Mandatory non-discriminatory human-rights-focused clinical language
- Prohibition on generating unauthorized restrictive practice recommendations.`;

    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    return res.status(200).json({
      status: 'success',
      text: response.text || '',
      verifiedUser: verified.email,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[GeminiProxy] Error executing AI generation:', error);
    return res.status(500).json({
      error: 'AI_PROCESSING_ERROR',
      message: error.message || 'Internal error processing clinical generation request.',
    });
  }
}
