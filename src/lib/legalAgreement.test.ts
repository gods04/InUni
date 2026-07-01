import { beforeEach, describe, expect, it } from 'vitest';
import {
  acceptLegalAgreement,
  hasAcceptedLegalAgreement,
  legalAgreementStorageKey,
  termsVersion,
} from './legalAgreement';

describe('legalAgreement', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('requires agreement when no accepted version is stored', () => {
    expect(hasAcceptedLegalAgreement()).toBe(false);
  });

  it('stores the current terms version when accepted', () => {
    acceptLegalAgreement();

    expect(hasAcceptedLegalAgreement()).toBe(true);
    expect(
      JSON.parse(
        window.localStorage.getItem(legalAgreementStorageKey) ?? '{}',
      ),
    ).toMatchObject({
      version: termsVersion,
    });
  });

  it('requires agreement again when an old version was stored', () => {
    window.localStorage.setItem(
      legalAgreementStorageKey,
      JSON.stringify({
        acceptedAt: '2026-01-01T00:00:00.000Z',
        version: '2026-01-01',
      }),
    );

    expect(hasAcceptedLegalAgreement()).toBe(false);
  });
});
