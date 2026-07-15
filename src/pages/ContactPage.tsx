import type { LucideIcon } from 'lucide-react';
import {
  Bug,
  Handshake,
  Lightbulb,
  Mail,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { Seo } from '../components/Seo';
import { contactEmail, getContactMailto } from '../lib/contact';

interface ContactTopic {
  detail: string;
  icon: LucideIcon;
  title: string;
}

const contactTopics: ContactTopic[] = [
  {
    detail:
      'Useful features, campus gaps, clearer workflows, and small things that would make InUni better for UCT students.',
    icon: Lightbulb,
    title: 'Ideas and feedback',
  },
  {
    detail:
      'Broken pages, confusing flows, harmful content patterns, moderation concerns, or anything that needs fast attention.',
    icon: Bug,
    title: 'Bugs or safety issues',
  },
  {
    detail:
      'Design, moderation, engineering, campus research, content seeding, student outreach, or testing help.',
    icon: Handshake,
    title: 'Help build InUni',
  },
  {
    detail:
      'Ways for clubs, faculty groups, class reps, and student teams to use InUni or improve how students find updates.',
    icon: MessageSquare,
    title: 'Societies and campus groups',
  },
];

export function ContactPage() {
  const primaryMailto = getContactMailto('InUni idea or collaboration');
  const secondaryMailto = getContactMailto('InUni contact');

  return (
    <div className="grid gap-5">
      <Seo
        canonicalPath="/contact"
        description="Contact InUni with ideas, bugs, collaboration requests, and ways to help improve the UCT student forum."
        title="Contact InUni | Ideas, Bugs, and Collaboration"
      />
      <PageHeader
        action={
          primaryMailto ? (
            <a className="primary-button gap-2" href={primaryMailto}>
              <Mail aria-hidden="true" className="h-4 w-4" />
              Email InUni
            </a>
          ) : (
            <Link className="primary-button gap-2" to="/create">
              <MessageSquare aria-hidden="true" className="h-4 w-4" />
              Share an idea
            </Link>
          )
        }
        description="Have an idea, found a bug, want to help, or want to collaborate with InUni? This page keeps those paths organized without exposing personal contact details."
        eyebrow="Project contact"
        icon={Mail}
        title="Contact InUni"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">
              {contactEmail || 'Project inbox coming soon'}
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {contactEmail
                ? 'Best for ideas, bug reports, collaboration, societies, and people who want to help improve the forum.'
                : 'For now, share public ideas through the forum and use report actions on the relevant content when something needs review.'}
            </p>
          </div>
          {secondaryMailto ? (
            <a className="secondary-button shrink-0 gap-2" href={secondaryMailto}>
              <Mail aria-hidden="true" className="h-4 w-4" />
              {contactEmail}
            </a>
          ) : null}
        </div>
      </PageHeader>

      <section
        aria-labelledby="contact-topics-heading"
        className="grid gap-3 sm:grid-cols-2"
      >
        <h2 className="sr-only" id="contact-topics-heading">
          Contact topics
        </h2>
        {contactTopics.map((topic) => {
          const Icon = topic.icon;

          return (
            <article
              className="panel grid gap-3 p-4 transition hover:-translate-y-0.5 hover:border-brand-100 hover:bg-brand-50 hover:shadow-soft"
              key={topic.title}
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={2.25} />
              </span>
              <div>
                <h3 className="text-base font-semibold text-ink">
                  {topic.title}
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {topic.detail}
                </p>
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.45fr)]">
        <article className="panel p-4 sm:p-5">
          <h2 className="text-base font-semibold text-ink">
            What to include
          </h2>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-600">
            <li>What happened or what you want to suggest.</li>
            <li>The page or feature involved, if there is one.</li>
            <li>Why it matters for students or campus groups.</li>
            <li>How urgent it is, especially for safety or moderation issues.</li>
          </ul>
        </article>

        <article className="panel border-accent-100 bg-accent-50 p-4 sm:p-5">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-panel text-accent-700">
            <ShieldAlert
              aria-hidden="true"
              className="h-5 w-5"
              strokeWidth={2.25}
            />
          </span>
          <h2 className="mt-3 text-base font-semibold text-ink">
            Keep private details out
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Please do not send passwords, private account details, or sensitive
            documents through public posts or messages. Use report buttons for
            specific posts, comments, or files when possible.
          </p>
        </article>
      </section>

      <div className="text-center text-sm text-slate-600">
        Need to go back?{' '}
        <Link className="font-semibold text-brand-700 hover:text-brand-600" to="/">
          Return to the forum
        </Link>
      </div>
    </div>
  );
}
