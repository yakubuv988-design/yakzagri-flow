import { describe, it, expect } from 'vitest';
import { formatCurrency, formatNGN, formatCNGN } from './currency';

describe('currency formatting', () => {
  describe('formatNGN', () => {
    it('formats zero', () => {
      expect(formatNGN(0)).toBe('₦0.00');
    });

    it('formats fractional amounts', () => {
      expect(formatNGN(0.5)).toBe('₦0.50');
    });

    it('formats thousands with comma separation', () => {
      expect(formatNGN(1000)).toBe('₦1,000.00');
    });

    it('formats large amounts with comma separation', () => {
      expect(formatNGN(10000000)).toBe('₦10,000,000.00');
    });
  });

  describe('formatCNGN', () => {
    it('formats zero', () => {
      expect(formatCNGN(0)).toBe('0.00 cNGN');
    });

    it('formats fractional amounts', () => {
      expect(formatCNGN(0.5)).toBe('0.50 cNGN');
    });

    it('formats thousands with comma separation', () => {
      expect(formatCNGN(1000)).toBe('1,000.00 cNGN');
    });

    it('formats large amounts with comma separation', () => {
      expect(formatCNGN(10000000)).toBe('10,000,000.00 cNGN');
    });
  });

  describe('formatCurrency toggle', () => {
    it('defaults to NGN fiat format', () => {
      expect(formatCurrency(5000000)).toBe('₦5,000,000.00');
    });

    it('formats as cNGN token when requested', () => {
      expect(formatCurrency(5000000, 'cngn')).toBe('5,000,000.00 cNGN');
    });

    it('formats as NGN fiat when requested', () => {
      expect(formatCurrency(5000000, 'ngn')).toBe('₦5,000,000.00');
    });
  });
});
