import { describe, it, expect } from 'vitest';
import en from './en';
import ha from './ha';

function collectKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object') {
      return collectKeys(value as Record<string, unknown>, path);
    }
    return [path];
  });
}

describe('Hausa dictionary', () => {
  it('contains every key present in the English baseline', () => {
    const enKeys = collectKeys(en as unknown as Record<string, unknown>);
    const haKeys = new Set(collectKeys(ha as unknown as Record<string, unknown>));
    const missing = enKeys.filter((key) => !haKeys.has(key));
    expect(missing).toEqual([]);
  });

  it('translates agricultural commodities', () => {
    expect(ha.commodities.sorghum).toBe('Dawa');
    expect(ha.commodities.maize).toBe('Masara');
    expect(ha.commodities.cassava).toBe('Rogo');
    expect(ha.commodities.yam).toBe('Doya');
    expect(ha.commodities.millet).toBe('Gero');
    expect(ha.commodities.cowpea).toBe('Wake');
  });

  it('translates measurement units', () => {
    expect(ha.units.bags).toBe('Buhu');
    expect(ha.units.mudus).toBe('Mudu');
    expect(ha.units.tons).toBe('Tan');
  });
});
