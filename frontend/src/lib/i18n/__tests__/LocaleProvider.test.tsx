import React from 'react';
import { render, act } from '@testing-library/react';
import { LocaleProvider, useLocale } from '../LocaleProvider';
import { Locale } from '../index';

function LocaleSwitcher() {
  const { setLocale } = useLocale();
  return (
    <div>
      <button onClick={() => setLocale('ar' as Locale)}>ar</button>
      <button onClick={() => setLocale('ha-Arab' as Locale)}>ha-Arab</button>
      <button onClick={() => setLocale('en' as Locale)}>en</button>
    </div>
  );
}

describe('LocaleProvider RTL direction', () => {
  beforeEach(() => {
    document.documentElement.dir = '';
    window.localStorage.clear();
  });

  it('sets dir=rtl for RTL locales and ltr for others on locale change', () => {
    const { getByText } = render(
      <LocaleProvider>
        <LocaleSwitcher />
      </LocaleProvider>,
    );

    act(() => {
      getByText('ar').click();
    });
    expect(document.documentElement.dir).toBe('rtl');

    act(() => {
      getByText('ha-Arab').click();
    });
    expect(document.documentElement.dir).toBe('rtl');

    act(() => {
      getByText('en').click();
    });
    expect(document.documentElement.dir).toBe('ltr');
  });
});
