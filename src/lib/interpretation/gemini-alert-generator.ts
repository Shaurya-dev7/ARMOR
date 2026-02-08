/**
 * Gemini API Alert Generator
 * 
 * Uses Google's Gemini API to generate multi-language public alerts
 * for asteroid monitoring data.
 * 
 * @module interpretation/gemini-alert-generator
 */

import {
  PublicAlertData,
  PublicAlertOutput,
  AlertLevel,
  determineAlertLevel,
  generatePublicAlert,
} from './public-alert-generator';

// =============================================================================
// TYPES
// =============================================================================

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

// =============================================================================
// PROMPT TEMPLATE
// =============================================================================

/**
 * The system prompt for Gemini to generate public-facing alerts.
 * Follows strict safety and tone guidelines.
 */
const SYSTEM_PROMPT = `You are a Global Asteroid Safety & Monitoring Assistant used in a public-facing website.

Your role is to transform verified asteroid monitoring data into clear, calm, non-alarming alerts for a global audience.
These alerts support scientific awareness and public understanding, not fear.

========================
ABSOLUTE RULES (MANDATORY)
========================
- Never use alarming, emotional, or sensational language.
- Never exaggerate risk or imply danger unless explicitly stated in the data.
- Never use the following words or similar meanings:
  impact, collision, disaster, dangerous, catastrophic, threat, emergency.
- Do not speculate, predict, or assume outcomes.
- Do not mention internal calculations, formulas, or scoring logic.
- Do not contradict the provided data.
- Always emphasize monitoring, observation, and scientific tracking.
- Maintain public trust at all times.

========================
ALERT LEVEL DESCRIPTIONS
========================
- LEVEL 1 — INFORMATIONAL: Routine close approaches. Tone: Informative, calm, neutral.
- LEVEL 2 — MONITORING WATCH: Elevated size/speed/proximity. Tone: Attentive, scientific, reassuring.
- LEVEL 3 — SCIENTIFIC INTEREST: Large, fast, or well-tracked objects. Tone: Educational, analytical, confident.

========================
WRITING STYLE
========================
- Simple language understandable by non-experts.
- Calm, confident, and factual.
- 2–4 sentences maximum.
- Suitable for direct display on a website or mobile app.
- No emojis unless culturally appropriate.`;

/**
 * Constructs the user prompt for Gemini with asteroid data.
 */
function buildUserPrompt(data: PublicAlertData, language: string, alertLevel: AlertLevel): string {
  return `========================
VERIFIED ASTEROID DATA
========================
Asteroid Name: ${data.asteroid_name}
Close Approach Distance: ${data.distance_au.toFixed(6)} AU
Estimated Diameter: ${data.diameter_meters.toFixed(1)} meters
Relative Velocity: ${data.velocity_km_s.toFixed(2)} km/s
Assigned Alert Level: ${alertLevel}

========================
LANGUAGE REQUIREMENT
========================
Generate the alert message in: ${language}
If the language is not supported, default to English.

========================
TASK
========================
Generate a public-facing alert message matching the ${alertLevel} tone.
Ensure the message is informative, calm, and confidence-building.

========================
OUTPUT FORMAT (STRICT)
========================
Return ONLY this JSON object and nothing else:
{
  "alert_level": "${alertLevel}",
  "language": "${language}",
  "message": "Your generated alert message here"
}`;
}

// =============================================================================
// MAIN FUNCTION
// =============================================================================

/**
 * Generates a multi-language public alert using Gemini API.
 * Falls back to English template if API fails.
 * 
 * @param data - Verified asteroid data
 * @param language - Target language (e.g., "English", "Hindi", "Bengali")
 * @returns Promise<PublicAlertOutput>
 */
export async function generateGeminiAlert(
  data: PublicAlertData,
  language: string = 'English'
): Promise<PublicAlertOutput> {
  const alertLevel = determineAlertLevel(data);
  
  // Check for API key
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn('[GEMINI] No API key found. Using fallback English template.');
    return {
      alert_level: alertLevel,
      language: 'English',
      message: generatePublicAlert(data),
    };
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: SYSTEM_PROMPT },
                { text: buildUserPrompt(data, language, alertLevel) },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3, // Low temperature for consistent, factual output
            maxOutputTokens: 500,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const result: GeminiResponse = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('Empty response from Gemini');
    }

    // Parse JSON from response
    const parsed = parseGeminiResponse(text, alertLevel, language);
    return parsed;

  } catch (error) {
    console.error('[GEMINI] Error generating alert:', error);
    
    // Fallback to English template
    return {
      alert_level: alertLevel,
      language: 'English',
      message: generatePublicAlert(data),
    };
  }
}

/**
 * Parses and validates the Gemini response.
 */
function parseGeminiResponse(
  text: string,
  expectedLevel: AlertLevel,
  expectedLanguage: string
): PublicAlertOutput {
  // Try to extract JSON from the response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  
  if (!jsonMatch) {
    throw new Error('No JSON found in Gemini response');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  // Validate structure
  if (!parsed.message || typeof parsed.message !== 'string') {
    throw new Error('Invalid message in Gemini response');
  }

  return {
    alert_level: parsed.alert_level || expectedLevel,
    language: parsed.language || expectedLanguage,
    message: parsed.message,
  };
}

// =============================================================================
// SUPPORTED LANGUAGES
// =============================================================================

export const SUPPORTED_LANGUAGES = [
  'English',
  'Hindi',
  'Bengali',
  'Tamil',
  'Telugu',
  'Marathi',
  'Gujarati',
  'Kannada',
  'Malayalam',
  'Punjabi',
  'Urdu',
  'Spanish',
  'French',
  'German',
  'Chinese',
  'Japanese',
  'Korean',
  'Arabic',
  'Portuguese',
  'Russian',
] as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];
