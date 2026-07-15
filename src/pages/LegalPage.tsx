import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { Seo } from '../components/Seo';
import {
  acceptLegalAgreement,
  hasAcceptedLegalAgreement,
  termsVersion,
} from '../lib/legalAgreement';

type LegalPageKind = 'privacy' | 'terms' | 'community';

interface LegalSection {
  body: string;
  items?: string[];
  title: string;
}

const pageDetails: Record<
  LegalPageKind,
  {
    description: string;
    path: string;
    sections: LegalSection[];
    title: string;
  }
> = {
  privacy: {
    description:
      'How InUni handles account data, profile information, posts, comments, uploads, reports, moderation records, and basic site analytics.',
    path: '/privacy',
    sections: [
      {
        title: 'Information we collect',
        body:
          'InUni collects the information needed to run a student forum and keep it safe.',
        items: [
          'Account details such as account email, display name, profile photo, and UCT verification status.',
          'Content you create, including posts, comments, uploaded files, file metadata, reports, and replies to moderation issues.',
          'Basic technical information such as browser, device, approximate usage activity, and error data needed to protect and improve the website.',
        ],
      },
      {
        title: 'How we use information',
        body:
          'We use information to operate InUni, show student content, manage accounts, investigate reports, reduce spam or abuse, improve the experience, and communicate important account or safety updates. InUni does not sell student personal information.',
      },
      {
        title: 'What other students can see',
        body:
          'Posts, comments, approved shared files, display names, and profile photos may be visible to other users depending on where you post. The anonymous display option is for public display only: it can hide your name from other students, but InUni may still keep account-level records for safety, moderation, and abuse prevention.',
      },
      {
        title: 'Storage, access, and security',
        body:
          'InUni uses hosted services such as authentication, database, file storage, and deployment providers to run the website. Administrator access is limited to people who need it for support, moderation, security, and maintenance. We use reasonable safeguards, but no online service can promise perfect security.',
      },
      {
        title: 'Your choices',
        body:
          'You can choose what you post, update your profile details, use available privacy controls, and report content that exposes private information. Avoid posting sensitive personal details, private documents, passwords, student numbers, or information about another person without permission.',
      },
    ],
    title: 'Privacy Policy',
  },
  terms: {
    description:
      'Terms of Service for using InUni, including account responsibilities, user content, disclaimers, and moderation.',
    path: '/terms',
    sections: [
      {
        title: 'Using InUni',
        body:
          'InUni is an independent student forum built for campus conversations, academic questions, useful resources, and student support. By using it, you agree to use the website responsibly, follow these terms, follow the Community Rules, and respect applicable law and university policies.',
      },
      {
        title: 'Accounts and verification',
        body:
          'You are responsible for the activity on your account and for keeping your login method secure. Verification labels, email status, profile badges, and admin badges are meant to help students understand context, but they should not be treated as a guarantee that every post is official, complete, or accurate.',
      },
      {
        title: 'User content',
        body:
          'Posts, comments, files, links, reports, and profile information are user-generated content. You should only share content that you have the right to share and that does not expose private information, infringe copyright, impersonate someone, mislead students, or put other people at risk.',
      },
      {
        title: 'Moderation and safety',
        body:
          'InUni may review, hide, remove, restrict, or report content and accounts when something appears unsafe, abusive, unlawful, spammy, misleading, or harmful to the community. Moderation may happen after user reports, admin review, automated checks, or maintenance work.',
      },
      {
        title: 'No official advice',
        body:
          'InUni is not an official University of Cape Town website. Community posts, files, comments, campus tips, and student advice may be incomplete or wrong. Verify important academic, legal, medical, financial, housing, transport, or safety information with official sources before relying on it.',
      },
      {
        title: 'Changes and availability',
        body:
          'InUni may change features, rules, wording, access, or availability as the project grows. If the legal version changes, you may be asked to agree again before continuing to use the website.',
      },
    ],
    title: 'Terms of Service',
  },
  community: {
    description:
      'Community Rules for InUni posts, comments, uploaded files, reports, and student conversations.',
    path: '/community-rules',
    sections: [
      {
        title: 'Be useful and respectful',
        body:
          'Help make the forum worth reading. Ask clear questions, share useful context, disagree without attacking people, and keep replies focused on helping students. Harassment, threats, hate, bullying, targeted insults, and sexual harassment are not allowed.',
      },
      {
        title: 'No private or harmful information',
        body:
          'Do not post passwords, student numbers, ID numbers, private messages, personal contact details, medical details, addresses, doxxing, revenge content, illegal material, or instructions that could put someone in danger. If you see private information, report it instead of spreading it.',
      },
      {
        title: 'Academic honesty',
        body:
          'Study help, explanations, notes, revision advice, past-paper discussion, and resource sharing are welcome. Requests to cheat, plagiarize, buy assignments, leak exam content, bypass course rules, or submit someone else work are not allowed.',
      },
      {
        title: 'Posting and anonymity',
        body:
          'Optional anonymous posting is for display only. It can make a post feel safer for normal student questions or confessions, but it does not remove accountability. InUni may still use account records to investigate abuse, spam, threats, or serious rule violations.',
      },
      {
        title: 'Files and links',
        body:
          'Only upload or link resources that are safe, relevant, and allowed to be shared. Do not upload malware, copyrighted material you do not have permission to share, private course documents, leaked assessments, or files that expose another person.',
      },
      {
        title: 'Reports',
        body:
          'Use report tools for abuse, private information, copyright concerns, spam, scams, unsafe links, or content that breaks these rules. Do not abuse reports to silence normal disagreement or target another student.',
      },
    ],
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

      <PageHeader
        action={(
          <Link className="secondary-button shrink-0" to="/">
            Back to forum
          </Link>
        )}
        description={`${currentPage.description} This is a practical policy summary and not legal advice.`}
        eyebrow={`Version ${termsVersion}`}
        icon={ShieldCheck}
        title={currentPage.title}
      >

        <div className="rounded-lg border border-brand-100 bg-brand-50 px-4 py-3 text-sm leading-6 text-slate-700">
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
      </PageHeader>

      <section className="panel grid gap-5 p-5 sm:p-7">
        <div className="divide-y divide-line">
          {currentPage.sections.map((section) => (
            <article
              className="grid gap-3 py-5 first:pt-0 last:pb-0 md:grid-cols-[12rem_minmax(0,1fr)] md:gap-6"
              key={section.title}
            >
              <h2 className="text-base font-semibold leading-6 text-ink">
                {section.title}
              </h2>
              <div className="min-w-0">
                <p className="text-sm leading-6 text-slate-600">
                  {section.body}
                </p>
                {section.items ? (
                  <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-600">
                    {section.items.map((item) => (
                      <li className="flex gap-2" key={item}>
                        <span
                          aria-hidden="true"
                          className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </article>
          ))}
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
