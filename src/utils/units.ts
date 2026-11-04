/**
 * Every length is stored once in millimetres; mm, cm, inches and feet are
 * computed for display, so nobody prices in the wrong unit.
 * 1 in = 25.4 mm · 1 ft = 304.8 mm · 1 sq ft = 92,903.04 mm² · 1 m² = 10.764 sq ft
 */

export type LengthUnit = 'mm' | 'cm' | 'in' | 'ft';

export const LENGTH_UNITS: { unit: LengthUnit; label: string }[] = [
  { unit: 'mm', label: 'mm' },
  { unit: 'cm', label: 'cm' },
  { unit: 'in', label: 'in' },
  { unit: 'ft', label: 'ft' },
];

const MM_PER: Record<LengthUnit, number> = { mm: 1, cm: 10, in: 25.4, ft: 304.8 };
/** Decimals shown per unit: 1 in cm, 2 in inches and feet */
const DP: Record<LengthUnit, number> = { mm: 1, cm: 1, in: 2, ft: 2 };

export const MM2_PER_SQFT = 92903.04;
export const SQFT_PER_SQM = 10.7639;

export const toMm = (value: number, unit: LengthUnit) => value * MM_PER[unit];
export const fromMm = (mm: number, unit: LengthUnit) => mm / MM_PER[unit];

const trim = (n: number, dp: number) => Number(n.toFixed(dp)).toString();
export const fmtLength = (mm: number, unit: LengthUnit) => trim(fromMm(mm, unit), DP[unit]);
export const fmtSize = (w: number, h: number, unit: LengthUnit) => `${fmtLength(w, unit)} × ${fmtLength(h, unit)} ${unit}`;

/** "210 × 297 mm · 21 × 29.7 cm · 8.27 × 11.69 in · 0.69 × 0.97 ft" without the unit in use */
export const equivalents = (w: number, h: number, except?: LengthUnit) =>
  LENGTH_UNITS.filter((u) => u.unit !== except).map((u) => fmtSize(w, h, u.unit)).join(' · ');

export const areaSqft = (w: number, h: number) => (w * h) / MM2_PER_SQFT;
export const areaSqm = (w: number, h: number) => (w * h) / 1_000_000;
export const fmtArea = (w: number, h: number) => `${areaSqft(w, h).toFixed(2)} sq ft · ${areaSqm(w, h).toFixed(3)} m²`;

/** Area prices in both units: GHS 12.00 per sq ft = GHS 129.17 per m² */
export const perSqmFromSqft = (perSqft: number) => perSqft * SQFT_PER_SQM;
export const perSqftFromSqm = (perSqm: number) => perSqm / SQFT_PER_SQM;

export const money = (n: number, currency = 'GHS') =>
  `${currency} ${n.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * A number that looks like it was typed in the wrong unit, as a warning — e.g.
 * "29.7" in mm (an A4 height in cm), or "1189" in feet.
 */
export function wrongUnitHint(value: number, unit: LengthUnit): string | null {
  if (!(value > 0)) return null;
  if (unit === 'mm' && value < 30) return `${value} mm is under 3 cm — did you mean ${value} cm or ${value} in?`;
  if (unit === 'cm' && value > 1000) return `${value} cm is over 10 m — did you mean ${value} mm?`;
  if (unit === 'cm' && value < 1) return `${value} cm is under 1 cm — check the unit`;
  if (unit === 'in' && value > 600) return `${value} in is over 15 m — did you mean ${value} mm?`;
  if (unit === 'ft' && value > 100) return `${value} ft is over 30 m — did you mean ${value} in or ${value} cm?`;
  return null;
}

/** "Front & back" → "front_back" — keys are lowercase letters, numbers and _ */
export const toKey = (name: string) =>
  name.toLowerCase().replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 64) || 'option';
