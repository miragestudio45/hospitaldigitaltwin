export function hashSeed(input: string | number): number {
  const text = String(input);
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createSeededRandom(seed: string | number) {
  let state = hashSeed(seed) || 1;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export const pick = <T,>(random: () => number, values: readonly T[]): T =>
  values[Math.floor(random() * values.length) % values.length];

export const between = (random: () => number, min: number, max: number, digits = 0): number => {
  const value = min + random() * (max - min);
  return Number(value.toFixed(digits));
};

export function deterministicSeries(seed: string, points = 48, base = 70, variance = 18) {
  const random = createSeededRandom(seed);
  let value = base;
  return Array.from({ length: Math.min(points, 800) }, (_, index) => {
    value = Math.max(0, value + between(random, -variance / 3, variance / 3, 1));
    const hour = String(index % 24).padStart(2, "0");
    return { time: `${hour}:00`, value: Number(value.toFixed(1)), forecast: Number((value + between(random, -5, 8, 1)).toFixed(1)) };
  });
}

export function seededNumber(seed: string | number, min: number, max: number, digits = 0): number {
  const random = createSeededRandom(seed);
  return between(random, min, max, digits);
}

export function seededText(seed: string | number, length = 12): string {
  const random = createSeededRandom(seed);
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: Math.max(1, length) }, () => alphabet[Math.floor(random() * alphabet.length)]).join("");
}
