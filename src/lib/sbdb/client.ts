/**
 * NASA JPL Small-Body Database (SBDB) Client
 * 
 * Fetches physical parameters for asteroids/comets.
 * https://ssd-api.jpl.nasa.gov/sbdb.api
 */

export interface SBDBResponse {
  object: {
    fullname: string;
    des: string;
    kind: string;
    spkid: string;
  };
  signature: {
    source: string;
    version: string;
  };
  phys_par: {
    name: string;
    desc: string;
    value: string;
    units: string;
    sigma?: string;
    ref?: string;
    notes?: string;
  }[];
}

/**
 * Common spectral classes and their likely composition
 */
export const SPECTRAL_CLASS_MAP: Record<string, string> = {
  // Tholen
  'C': 'Carbonaceous (clay and silicate rocks)',
  'S': 'Silicaceous (stony, nickel-iron mixed with silicates)',
  'M': 'Metallic (nickel-iron)',
  'D': 'Dark red (organic-rich silicates, carbon, anhydrous silicates)',
  'P': 'Pseudo-M (organic-rich silicates, carbon, anhydrous silicates)',
  'X': 'Metallic/E/M/P group (needs albedo to distinguish)',
  'B': 'Blue (anhydrous silicates, organic organics, clay minerals)',
  'F': 'Flat spectrum (anhydrous silicates, organics, clay minerals)',
  'G': 'C-type subclass (clay and silicate rocks)',
  'Q': 'Olivine and pyroxene',
  'R': 'Moderately red (olivine and pyroxene)',
  'V': 'Vestoid (pyroxene)',
  'A': 'Reddish (olivine-rich)',
  'E': 'Enstatite (high albedo)',
  'T': 'Dark red (unknown composition)',
  // SMASS
  'Cb': 'Carbonaceous',
  'Ch': 'Carbonaceous',
  'Cg': 'Carbonaceous',
  'Sqa': 'Silicaceous',
  'Sr': 'Silicaceous',
  'Sw': 'Silicaceous',
  'Sl': 'Silicaceous',
  'Sa': 'Silicaceous',
  'Sk': 'Silicaceous',
};

export async function fetchSBDBData(spkid: string): Promise<any> {
    // orbit=1 adds orbital elements including condition_code
    const url = `https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=${spkid}&phys-par=1&full-prec=1&orbit=1`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            // 400 means object not found or invalid query usually
            if(response.status === 400) return null;
            throw new Error(`SBDB API error: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data; // Raw SBDB data
    } catch (error) {
        console.error("Error fetching SBDB data:", error);
        return null;
    }
}

export function extractComposition(data: any): { type: string, description: string } | null {
    if (!data || !data.phys_par) return null;

    // Look for spec_B (SMASSII) or spec_T (Tholen)
    const specB = data.phys_par.find((p: any) => p.name === 'spec_B');
    const specT = data.phys_par.find((p: any) => p.name === 'spec_T');

    const spectralClass = specB?.value || specT?.value;

    if (!spectralClass) return null;

    // Remove qualifiers like '::' or '?'
    const cleanClass = spectralClass.replace(/[:?]/g, '');
    
    // Try exact match or first character match
    let description = SPECTRAL_CLASS_MAP[cleanClass] || SPECTRAL_CLASS_MAP[cleanClass[0]];

    if (!description && cleanClass.length > 1) {
         // Try matching just the first letter if full class not found
         description = SPECTRAL_CLASS_MAP[cleanClass[0]];
    }

    return {
        type: spectralClass,
        description: description || 'Unknown composition'
    };
}
