/**
 * Calculates total stay cost.
 */
export function calculateStayCost(
  basePrice: number,
  nights: number,
  seasonalMultiplier: number = 1.0,
  weekendSurcharge: number = 0.0
): number {
  const nightlyRate = basePrice * seasonalMultiplier;
  return (nightlyRate * nights) + (weekendSurcharge * nights);
}
