export const termsVersion = '2026-07-01';
export const legalAgreementStorageKey = 'inuni.legalAgreement';

interface StoredLegalAgreement {
  acceptedAt: string;
  version: string;
}

function readStoredLegalAgreement(): StoredLegalAgreement | null {
  if (typeof window === 'undefined') return null;

  const raw = window.localStorage.getItem(legalAgreementStorageKey);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredLegalAgreement;
  } catch {
    return null;
  }
}

export function hasAcceptedLegalAgreement(): boolean {
  return readStoredLegalAgreement()?.version === termsVersion;
}

export function acceptLegalAgreement(): void {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(
    legalAgreementStorageKey,
    JSON.stringify({
      acceptedAt: new Date().toISOString(),
      version: termsVersion,
    } satisfies StoredLegalAgreement),
  );
}
