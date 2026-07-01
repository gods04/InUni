import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Seo } from '../components/Seo';
import {
  acceptLegalAgreement,
  hasAcceptedLegalAgreement,
  termsVersion,
} from '../lib/legalAgreement';

type LegalPageKind = 'privacy' | 'terms' | 'community';

const pageDetails: Record<
  LegalPageKind,
  { description: string; path: string; title: string }
> = {
  privacy: {
    description:
      'How InUni handles account data, profile information, posts, comments, uploads, reports, and basic analytics.',
    path: '/privacy',
    title: 'Privacy Policy',
  },
  terms: {
    description:
      'Terms of Service for using InUni, including account responsibilities, user content, disclaimers, and moderation.',
    path: '/terms',
    title: 'Terms of Service',
  },
  community: {
    description:
      'Community Rules for InUni posts, comments, uploaded files, reports, and student conversations.',
    path: '/community-rules',
    title: 'Community Rules',
  },
};

function getPageKind(pathname: string): LegalPageKind {
  if (pathname === '/privacy') return 'privacy';
  if (pathname === '/community-rules') return 'community';
  return 'terms';
}

function policyLinkClass({ isActive }: { isActive: boolean }) {
  return [
    'rounded-full px-3 py-2 text-sm font-semibold transition',
    isActive
      ? 'bg-brand-50 text-brand-700'
      : 'text-slate-600 hover:bg-slate-100 hover:text-ink',
  ].join(' ');
}

export function LegalPage() {
  const location = useLocation();
  const pageKind = getPageKind(location.pathname);
  const currentPage = pageDetails[pageKind];
  const [accepted, setAccepted] = useState(() => hasAcceptedLegalAgreement());

  function acceptTerms() {
    acceptLegalAgreement();
    setAccepted(true);
  }

  return (
    <div className="grid gap-5">
      <Seo
        canonicalPath={currentPage.path}
        description={currentPage.description}
        title={`${currentPage.title} | InUni`}
      />

      <section className="panel grid gap-4 p-5 sm:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-brand-700">
              Version {termsVersion}
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-normal text-ink">
              {currentPage.title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              {currentPage.description} This is a practical policy summary and
              not legal advice.
            </p>
          </div>
          <Link className="secondary-button shrink-0" to="/">
            Back to forum
          </Link>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
          InUni is an independent student community. It is not an official
          University of Cape Town website, and content posted by users does not
          represent UCT.
        </div>

        <nav
          aria-label="Legal policies"
          className="flex flex-wrap gap-2 border-t border-line pt-4"
        >
          <NavLink className={policyLinkClass} to="/privacy">
            Privacy Policy
          </NavLink>
          <NavLink className={policyLinkClass} to="/terms">
            Terms of Service
          </NavLink>
          <NavLink className={policyLinkClass} to="/community-rules">
            Community Rules
          </NavLink>
        </nav>
      </section>

      <section className="panel grid gap-5 p-5 sm:p-7">
        <div className="grid gap-2">
          <h2 className="text-xl font-semibold text-ink">
            {pageKind === 'community'
              ? 'Rules for posts, comments, and files'
              : 'Community Rules'}
          </h2>
          <p className="text-sm leading-6 text-slate-600">
            You are responsible for what you post, comment, upload, or report.
            Do not post harassment, threats, illegal material, private personal
            information, copyrighted files you do not have permission to share,
            spam, or content that impersonates another person or institution.
          </p>
        </div>

        <div className="grid gap-2">
          <h2 className="text-xl font-semibold text-ink">
            User content and moderation
          </h2>
          <p className="text-sm leading-6 text-slate-600">
            Posts, comments, and files are user-generated content. InUni may
            moderate, hide, remove, or restrict content or accounts when content
            appears unsafe, abusive, unlawful, misleading, or harmful to the
            community. Anonymous posting is only front-end anonymity; the
            platform still needs account-level accountability for moderation.
          </p>
        </div>

        <div className="grid gap-2">
          <h2 className="text-xl font-semibold text-ink">
            Disclaimer and risk
          </h2>
          <p className="text-sm leading-6 text-slate-600">
            InUni does not guarantee that community posts, files, handbook
            links, comments, or advice are accurate, complete, safe, or
            available. You should verify important academic, legal, medical,
            financial, housing, or safety information with official sources
            before relying on it. Downloads and external links are used at your
            own risk.
          </p>
        </div>

        <div className="grid gap-2">
          <h2 className="text-xl font-semibold text-ink">
            What personal information we process
          </h2>
          <p className="text-sm leading-6 text-slate-600">
            InUni processes personal information such as account email, display
            name, profile photo, posts, comments, uploads, reports, moderation
            records, and basic analytics needed to run and protect the service.
            The site aims to handle personal information for clear community,
            security, moderation, and account-management purposes, with privacy
            and security safeguards in mind, including POPIA-style principles
            such as openness, purpose limitation, and reasonable security.
          </p>
        </div>

        <div className="grid gap-2">
          <h2 className="text-xl font-semibold text-ink">
            Reports and removals
          </h2>
          <p className="text-sm leading-6 text-slate-600">
            If content contains private information, copyright issues, abuse,
            or other harm, use the report tools on posts, comments, or files.
            InUni may review reports and take moderation action, but cannot
            promise immediate removal or continuous availability.
          </p>
        </div>

        <div className="grid gap-2">
          <h2 className="text-xl font-semibold text-ink">
            Changes to these terms
          </h2>
          <p className="text-sm leading-6 text-slate-600">
            These terms may change as InUni grows. If the version changes, you
            may be asked to agree again before continuing to use the website.
          </p>
        </div>

        <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-600">
            {accepted
              ? 'You have accepted the current version on this browser.'
              : 'Agree to continue using InUni on this browser.'}
          </p>
          <button className="primary-button" onClick={acceptTerms} type="button">
            {accepted ? 'Accepted' : 'I agree and continue'}
          </button>
        </div>
      </section>
    </div>
  );
}
