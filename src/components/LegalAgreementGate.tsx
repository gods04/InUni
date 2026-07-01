import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  acceptLegalAgreement,
  hasAcceptedLegalAgreement,
  termsVersion,
} from '../lib/legalAgreement';

const legalPolicyPaths = new Set(['/privacy', '/terms', '/community-rules']);

export function LegalAgreementGate() {
  const location = useLocation();
  const [accepted, setAccepted] = useState(() => hasAcceptedLegalAgreement());

  useEffect(() => {
    setAccepted(hasAcceptedLegalAgreement());
  }, [location.pathname]);

  if (accepted || legalPolicyPaths.has(location.pathname)) {
    return null;
  }

  function agree() {
    acceptLegalAgreement();
    setAccepted(true);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <section
        aria-labelledby="legal-agreement-title"
        aria-modal="true"
        className="panel w-full max-w-lg p-5 shadow-2xl sm:p-6"
        role="dialog"
      >
        <p className="text-xs font-semibold uppercase text-brand-700">
          Version {termsVersion}
        </p>
        <h2
          className="mt-2 text-2xl font-semibold tracking-normal text-ink"
          id="legal-agreement-title"
        >
          Terms, Privacy & Disclaimer
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          You need to agree to the Terms, Privacy Policy, Disclaimer, and
          Community Rules before continuing to use InUni. These rules help
          protect the community, the website, and the people running it.
        </p>
        <ul className="mt-4 grid gap-2 text-sm leading-6 text-slate-600">
          <li>Do not post private information, harassment, spam, or illegal content.</li>
          <li>Verify important academic, safety, housing, or financial information with official sources.</li>
          <li>Posts and uploads are user-generated and may be moderated or removed.</li>
        </ul>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link className="secondary-button justify-center" to="/terms">
            Read full terms
          </Link>
          <button className="primary-button" onClick={agree} type="button">
            I agree
          </button>
        </div>
      </section>
    </div>
  );
}
