import { describe, it, expect } from 'vitest';
import { computeBackoffDelay } from '../offlineQueueStore';

describe('computeBackoffDelay', () => {
  it('follows the exponential schedule (1s, 2s, 4s, 8s)', () => {
    const mid = () => 0.5; // no jitter offset
    expect(computeBackoffDelay(0, mid)).toBe(1000);
    expect(computeBackoffDelay(1, mid)).toBe(2000);
    expect(computeBackoffDelay(2, mid)).toBe(4000);
    expect(computeBackoffDelay(3, mid)).toBe(8000);
  });

  it('applies +/- 20% jitter around the base interval', () => {
    expect(computeBackoffDelay(2, () => 0)).toBe(3200);
    expect(computeBackoffDelay(2, () => 1)).toBe(4800);
  });

  it('produces a spread of jittered values', () => {
    const samples = Array.from({ length: 200 }, () => computeBackoffDelay(3));
    const min = Math.min(...samples);
    const max = Math.max(...samples);
    expect(min).toBeGreaterThanOrEqual(6400);
    expect(max).toBeLessThanOrEqual(9600);
    expect(new Set(samples).size).toBeGreaterThan(1);
  });

  it('caps the maximum backoff interval at 30 seconds', () => {
    expect(computeBackoffDelay(10, () => 0.5)).toBe(30000);
    expect(computeBackoffDelay(10, () => 1)).toBe(30000);
    expect(computeBackoffDelay(20, () => 0)).toBeLessThanOrEqual(30000);
  });
});
