import { describe, it, expect } from 'vitest';
import en from '../en';
import ig from '../ig';

function collectKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return collectKeys(value as Record<string, unknown>, path);
    }
    return [path];
  });
}

describe('ig messages', () => {
  it('has schema parity with the English dictionary', () => {
    const enKeys = collectKeys(en as unknown as Record<string, unknown>).sort();
    const igKeys = collectKeys(ig as unknown as Record<string, unknown>).sort();
    expect(igKeys).toEqual(enKeys);
  });

  it('translates dispute resolution statuses', () => {
    expect(ig.dispute.evidenceUpload).toBe('Ibugo Ihe Akaebe');
    expect(ig.dispute.underReview).toBe('Na-enyocha');
    expect(ig.dispute.resolved).toBe('Edoziri');
  });

  it('translates proof-of-delivery prompts', () => {
    expect(ig.proofOfDelivery.videoInstructions).toBeTruthy();
    expect(ig.proofOfDelivery.driverConfirm).toBeTruthy();
  });
});
