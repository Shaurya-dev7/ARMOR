/**
 * NASA JPL Horizons Ephemeris Parser
 * 
 * Extracts and parses Cartesian state vectors from Horizons API result string.
 * 
 * STRICT PARSING RULES:
 * - Extract only data between $$SOE and $$EOE markers
 * - Parse numeric values as floating-point numbers
 * - Preserve timestamps exactly as reported
 * - No interpolation, smoothing, or inference
 * - Ignore LT, RG, RR fields (v1 normalization)
 */

import type { 
  ParsedEphemerisEntry, 
  HorizonsError 
} from './types';

/** Start Of Ephemeris marker */
const SOE_MARKER = '$$SOE';
/** End Of Ephemeris marker */
const EOE_MARKER = '$$EOE';

/**
 * Extract the ephemeris data block from the result string.
 * Returns only content between $$SOE and $$EOE markers.
 * 
 * @throws HorizonsError if markers are missing
 */
export function extractEphemerisBlock(result: string): string {
  const soeIndex = result.indexOf(SOE_MARKER);
  const eoeIndex = result.indexOf(EOE_MARKER);

  if (soeIndex === -1 || eoeIndex === -1) {
    const error: HorizonsError = {
      code: 'MISSING_SOE_EOE',
      message: 'Ephemeris markers $$SOE and/or $$EOE not found in result.',
      details: `SOE found: ${soeIndex !== -1}, EOE found: ${eoeIndex !== -1}`,
    };
    throw error;
  }

  if (eoeIndex <= soeIndex) {
    const error: HorizonsError = {
      code: 'PARSE_ERROR',
      message: '$$EOE marker appears before $$SOE marker.',
    };
    throw error;
  }

  // Extract content between markers (excluding the markers themselves)
  const ephemerisBlock = result.substring(
    soeIndex + SOE_MARKER.length,
    eoeIndex
  ).trim();

  if (ephemerisBlock.length === 0) {
    const error: HorizonsError = {
      code: 'NO_EPHEMERIS_DATA',
      message: 'No ephemeris data found between $$SOE and $$EOE markers.',
    };
    throw error;
  }

  return ephemerisBlock;
}

/**
 * Parse a single ephemeris entry block.
 * 
 * Expected format:
 * ```
 * 2461078.500000000 = A.D. 2026-Feb-07 00:00:00.0000 TDB
 *  X = 1.234567890E+08 Y = 2.345678901E+07 Z =-3.456789012E+06
 *  VX= 1.234567890E+01 VY= 2.345678901E+00 VZ=-3.456789012E-01
 *  LT= ... RG= ... RR= ...
 * ```
 */
function parseEphemerisEntry(block: string): ParsedEphemerisEntry {
  const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  if (lines.length < 3) {
    const error: HorizonsError = {
      code: 'PARSE_ERROR',
      message: 'Ephemeris block has insufficient lines.',
      details: `Found ${lines.length} lines, expected at least 3.`,
    };
    throw error;
  }

  // Parse timestamp line (first line)
  // Format: "2461078.500000000 = A.D. 2026-Feb-07 00:00:00.0000 TDB"
  const timestampLine = lines[0];
  const timestampMatch = timestampLine.match(/^([\d.]+)\s*=\s*(.+)$/);
  
  if (!timestampMatch) {
    const error: HorizonsError = {
      code: 'PARSE_ERROR',
      message: 'Could not parse timestamp line.',
      details: `Line: "${timestampLine}"`,
    };
    throw error;
  }

  const julianDate = parseFloat(timestampMatch[1]);
  const utcString = timestampMatch[2].trim();

  if (isNaN(julianDate)) {
    const error: HorizonsError = {
      code: 'INVALID_NUMERIC_VALUE',
      message: 'Invalid Julian Date value.',
      details: `Value: "${timestampMatch[1]}"`,
    };
    throw error;
  }

  // Parse position line (contains X, Y, Z)
  // Format: " X = 1.234567890E+08 Y = 2.345678901E+07 Z =-3.456789012E+06"
  const positionLine = lines[1];
  const posMatch = positionLine.match(/X\s*=\s*([-\d.E+]+)\s*Y\s*=\s*([-\d.E+]+)\s*Z\s*=\s*([-\d.E+]+)/i);
  
  if (!posMatch) {
    const error: HorizonsError = {
      code: 'PARSE_ERROR',
      message: 'Could not parse position vector line.',
      details: `Line: "${positionLine}"`,
    };
    throw error;
  }

  const x = parseFloat(posMatch[1]);
  const y = parseFloat(posMatch[2]);
  const z = parseFloat(posMatch[3]);

  if (isNaN(x) || isNaN(y) || isNaN(z)) {
    const error: HorizonsError = {
      code: 'INVALID_NUMERIC_VALUE',
      message: 'Invalid position vector values.',
      details: `X=${posMatch[1]}, Y=${posMatch[2]}, Z=${posMatch[3]}`,
    };
    throw error;
  }

  // Parse velocity line (contains VX, VY, VZ)
  // Format: " VX= 1.234567890E+01 VY= 2.345678901E+00 VZ=-3.456789012E-01"
  const velocityLine = lines[2];
  const velMatch = velocityLine.match(/VX\s*=\s*([-\d.E+]+)\s*VY\s*=\s*([-\d.E+]+)\s*VZ\s*=\s*([-\d.E+]+)/i);
  
  if (!velMatch) {
    const error: HorizonsError = {
      code: 'PARSE_ERROR',
      message: 'Could not parse velocity vector line.',
      details: `Line: "${velocityLine}"`,
    };
    throw error;
  }

  const vx = parseFloat(velMatch[1]);
  const vy = parseFloat(velMatch[2]);
  const vz = parseFloat(velMatch[3]);

  if (isNaN(vx) || isNaN(vy) || isNaN(vz)) {
    const error: HorizonsError = {
      code: 'INVALID_NUMERIC_VALUE',
      message: 'Invalid velocity vector values.',
      details: `VX=${velMatch[1]}, VY=${velMatch[2]}, VZ=${velMatch[3]}`,
    };
    throw error;
  }

  // Ignore LT, RG, RR fields (v1 normalization rule)

  return {
    julianDate,
    utcString,
    x, y, z,
    vx, vy, vz,
  };
}

/**
 * Split the ephemeris block into individual entry blocks.
 * Each entry starts with a Julian Date timestamp.
 */
function splitIntoEntryBlocks(ephemerisBlock: string): string[] {
  // Split by lines that look like JD timestamps (start with a digit sequence followed by a dot)
  // We need to keep the timestamp line with each block
  const blocks: string[] = [];
  const lines = ephemerisBlock.split('\n');
  
  let currentBlock: string[] = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Check if this line starts a new entry (JD timestamp pattern)
    // Pattern: starts with digits, has a decimal, followed by " = "
    if (/^\d+\.\d+\s*=/.test(trimmedLine)) {
      // Save the previous block if it exists
      if (currentBlock.length > 0) {
        blocks.push(currentBlock.join('\n'));
      }
      // Start a new block
      currentBlock = [line];
    } else if (currentBlock.length > 0 && trimmedLine.length > 0) {
      // Add to current block
      currentBlock.push(line);
    }
  }
  
  // Don't forget the last block
  if (currentBlock.length > 0) {
    blocks.push(currentBlock.join('\n'));
  }
  
  return blocks;
}

/**
 * Parse all ephemeris entries from a Horizons result string.
 * 
 * @param result - The raw `result` string from Horizons API response
 * @returns Array of parsed ephemeris entries in chronological order
 * @throws HorizonsError on any parsing failure
 */
export function parseHorizonsResult(result: string): ParsedEphemerisEntry[] {
  // Step 1: Extract data between $$SOE and $$EOE
  const ephemerisBlock = extractEphemerisBlock(result);
  
  // Step 2: Split into individual entry blocks
  const entryBlocks = splitIntoEntryBlocks(ephemerisBlock);
  
  if (entryBlocks.length === 0) {
    const error: HorizonsError = {
      code: 'NO_EPHEMERIS_DATA',
      message: 'No ephemeris entries found in data block.',
    };
    throw error;
  }
  
  // Step 3: Parse each entry
  const entries: ParsedEphemerisEntry[] = [];
  
  for (const block of entryBlocks) {
    const entry = parseEphemerisEntry(block);
    entries.push(entry);
  }
  
  // Entries are already in chronological order (Horizons guarantees this)
  return entries;
}
