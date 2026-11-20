import { buildContentSecurityPolicy } from './middleware';

describe('buildContentSecurityPolicy', () => {
  it('includes the provided nonce in script-src', () => {
    const csp = buildContentSecurityPolicy('test-nonce');
    expect(csp).toContain("script-src 'self' 'nonce-test-nonce' 'strict-dynamic'");
  });

  it('restricts frame-src to approved Freighter and Stellar domains', () => {
    const csp = buildContentSecurityPolicy('nonce');
    const frameSrc = csp
      .split('; ')
      .find((directive) => directive.startsWith('frame-src'));

    expect(frameSrc).toBeDefined();
    expect(frameSrc).toContain("'self'");
    expect(frameSrc).toContain('https://freighter.app');
    expect(frameSrc).toContain('https://www.freighter.app');
    expect(frameSrc).toContain('https://stellar.org');
    expect(frameSrc).toContain('https://www.stellar.org');
    expect(frameSrc).toContain('https://accountviewer.stellar.org');
  });

  it('does not allow wildcard or broad frame-src origins', () => {
    const csp = buildContentSecurityPolicy('nonce');
    const frameSrc = csp
      .split('; ')
      .find((directive) => directive.startsWith('frame-src')) as string;

    expect(frameSrc).not.toContain('*');
    expect(frameSrc).not.toContain('https:');
    expect(frameSrc).not.toContain('http:');
  });

  it('blocks framing of the app itself via frame-ancestors', () => {
    const csp = buildContentSecurityPolicy('nonce');
    expect(csp).toContain("frame-ancestors 'none'");
  });
});
