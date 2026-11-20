import { plateNumberSchema } from '../schemas';

describe('plateNumberSchema (FRSC plate number validator)', () => {
  describe('valid standard private vehicle plates', () => {
    it.each([
      'ABC-123DE',
      'LSD-456XY',
      'KJA-789AB',
      'ABJ-001CD',
      'GGE-999ZZ',
    ])('accepts %s', (plate) => {
      expect(plateNumberSchema.safeParse(plate).success).toBe(true);
    });
  });

  describe('valid commercial vehicle plates', () => {
    it.each([
      'KJA-123XA',
      'LAG-456XB',
      'ABJ-789XC',
      'PHC-321XD',
    ])('accepts %s', (plate) => {
      expect(plateNumberSchema.safeParse(plate).success).toBe(true);
    });
  });

  describe('valid government vehicle plates', () => {
    it.each([
      'FG-123AB',
      'FG-456CD',
      'FG-789EF',
    ])('accepts %s', (plate) => {
      expect(plateNumberSchema.safeParse(plate).success).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('rejects an empty string', () => {
      expect(plateNumberSchema.safeParse('').success).toBe(false);
    });

    it('rejects whitespace-only input', () => {
      expect(plateNumberSchema.safeParse('   ').success).toBe(false);
    });

    it.each([
      'ABC@123DE',
      'ABC-123D#',
      'ABC 123DE',
      'ABC_123DE',
      'ABC-123D!',
    ])('rejects special characters in %s', (plate) => {
      expect(plateNumberSchema.safeParse(plate).success).toBe(false);
    });

    it.each([
      'ABC-12DE',
      'ABC-1234DE',
      'AB-123DE',
      'ABC-123D',
      'ABC-123DEF',
    ])('rejects wrong digit/letter counts in %s', (plate) => {
      expect(plateNumberSchema.safeParse(plate).success).toBe(false);
    });

    it('rejects lowercase-only input', () => {
      expect(plateNumberSchema.safeParse('abc-123de').success).toBe(false);
    });

    it('rejects non-string input', () => {
      expect(plateNumberSchema.safeParse(12345).success).toBe(false);
      expect(plateNumberSchema.safeParse(null).success).toBe(false);
      expect(plateNumberSchema.safeParse(undefined).success).toBe(false);
    });
  });
});
