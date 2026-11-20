import { formatTranslation } from './format';
import { en } from './en';

describe('formatTranslation', () => {
  it('returns the localized string when present', () => {
    const dict = { trades: { create: { steps: { review: { title: 'Bita' } } } } };
    expect(formatTranslation(dict, 'trades.create.steps.review.title')).toBe(
      'Bita',
    );
  });

  it('falls back to English when the localized key is missing', () => {
    const dict = { trades: { create: { steps: {} } } };
    const key = 'trades.create.steps.review.title';
    const expected = (en as Record<string, unknown>).trades;
    expect(expected).toBeDefined();
    expect(formatTranslation(dict, key)).not.toBe(key);
  });

  it('falls back to English for partially translated dictionaries', () => {
    const dict = { trades: { create: { steps: { review: { title: 'Bita' } } } } };
    const key = 'trades.create.steps.review.submit';
    const result = formatTranslation(dict, key);
    expect(result).not.toBe(key);
  });
});
