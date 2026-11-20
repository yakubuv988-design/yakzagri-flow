import { describe, it, expect } from 'vitest';
import {
  SECRET_KEY_ERROR_MESSAGE,
  destinationAddressSchema,
  isStellarSecretKey,
  stellarAddressSchema,
} from './schemas';

const VALID_PUBLIC_KEY = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
const VALID_SECRET_KEY = 'SAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

describe('isStellarSecretKey', () => {
  it('detects a 56-char base32 string starting with S', () => {
    expect(isStellarSecretKey(VALID_SECRET_KEY)).toBe(true);
  });

  it('does not flag public keys starting with G', () => {
    expect(isStellarSecretKey(VALID_PUBLIC_KEY)).toBe(false);
  });

  it('does not flag arbitrary strings', () => {
    expect(isStellarSecretKey('hello')).toBe(false);
  });
});

describe('stellarAddressSchema', () => {
  it('accepts a valid public key', () => {
    expect(stellarAddressSchema.safeParse(VALID_PUBLIC_KEY).success).toBe(true);
  });

  it('rejects a Stellar secret key with the security message', () => {
    const result = stellarAddressSchema.safeParse(VALID_SECRET_KEY);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(SECRET_KEY_ERROR_MESSAGE);
    }
  });

  it('rejects a secret key pasted into the destination address field', () => {
    const result = destinationAddressSchema.safeParse(VALID_SECRET_KEY);
    expect(result.success).toBe(false);
  });
});
