import { describe, it, expect } from 'vitest';
import { formatDate, formatRelativeTime, SUPPORTED_LOCALES } from './format';

describe('formatDate', () => {
  const date = new Date(Date.UTC(2024, 0, 15, 12, 0, 0));

  it('formats dates according to each supported locale', () => {
    const outputs = SUPPORTED_LOCALES.map((locale) => formatDate(date, undefined, locale));
    expect(outputs).toHaveLength(4);
    outputs.forEach((output) => expect(output.length).toBeGreaterThan(0));
  });

  it('uses DD/MM/YYYY ordering for Nigeria', () => {
    const output = formatDate(date, undefined, 'en-NG');
    expect(output).toMatch(/15\/01\/2024/);
  });

  it('uses MM/DD/YYYY ordering for US English', () => {
    const output = formatDate(date, undefined, 'en-US');
    expect(output).toMatch(/01\/15\/2024/);
  });

  it('returns an empty string for invalid dates', () => {
    expect(formatDate('not-a-date', undefined, 'en-US')).toBe('');
  });
});

describe('formatRelativeTime', () => {
  const now = new Date(Date.UTC(2024, 0, 15, 12, 0, 0));

  it('formats hours ago', () => {
    const past = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    expect(formatRelativeTime(past, 'en-US', now)).toBe('3 hours ago');
  });

  it('formats yesterday', () => {
    const past = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(past, 'en-US', now)).toBe('yesterday');
  });

  it('produces output for every supported locale', () => {
    const past = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    SUPPORTED_LOCALES.forEach((locale) => {
      expect(formatRelativeTime(past, locale, now).length).toBeGreaterThan(0);
    });
  });
});
