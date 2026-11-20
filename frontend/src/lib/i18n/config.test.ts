import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getStoredLocale, setStoredLocale, resolveLocale } from './config';

describe('i18n config persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = 'locale=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    vi.restoreAllMocks();
  });

  it('persists the selected locale to localStorage', () => {
    setStoredLocale('fr');
    expect(localStorage.getItem('locale')).toBe('fr');
  });

  it('synchronizes localStorage with cookie storage', () => {
    setStoredLocale('de');
    expect(document.cookie).toContain('locale=de');
    expect(localStorage.getItem('locale')).toBe('de');
  });

  it('reads the stored locale from localStorage', () => {
    localStorage.setItem('locale', 'es');
    expect(getStoredLocale()).toBe('es');
  });

  it('falls back to the cookie when localStorage is empty', () => {
    document.cookie = 'locale=it; path=/';
    expect(getStoredLocale()).toBe('it');
  });

  it('defaults to the browser locale when no preference is stored', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('pt-BR');
    expect(resolveLocale()).toBe('pt-BR');
  });
});
