import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  BookOpen,
  FileText,
  Files,
  Handshake,
  MapPinned,
  MessageSquarePlus,
  Utensils,
  Wrench,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { Seo } from '../components/Seo';

interface ActiveTool {
  detail: string;
  icon: LucideIcon;
  title: string;
  to: string;
}

interface PlannedTool {
  icon: LucideIcon;
  title: string;
}

const activeTools: ActiveTool[] = [
  {
    detail: 'Questions, answers, updates, and study help.',
    icon: BookOpen,
    title: 'Forum',
    to: '/',
  },
  {
    detail: 'Approved notes, templates, and class resources.',
    icon: Files,
    title: 'Shared files',
    to: '/files',
  },
  {
    detail: 'Ask a question or share something useful.',
    icon: MessageSquarePlus,
    title: 'Create post',
    to: '/create',
  },
  {
    detail: 'Pick a quick meal by budget, time, and cooking access.',
    icon: Utensils,
    title: 'Food tools',
    to: '/tools/food',
  },
];

const plannedTools: PlannedTool[] = [
  { icon: MapPinned, title: 'Classroom finder' },
  { icon: FileText, title: 'Document tools' },
];

export function ToolsPage() {
  return (
    <div className="grid gap-5">
      <Seo
        canonicalPath="/tools"
        description="Open UCT student tools on InUni, including the forum, shared files, campus resources, and planned study utilities."
        title="UCT Student Tools | InUni"
      />
      <PageHeader
        description="Forum, food, files, and posting tools shaped for quick campus tasks."
        eyebrow="UCT utilities"
        icon={Wrench}
        title="Student tools"
      />

      <section aria-labelledby="available-tools-heading" className="grid gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink" id="available-tools-heading">
            Available now
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {activeTools.map((tool) => {
            const Icon = tool.icon;

            return (
              <Link
                aria-label={tool.title}
                className="panel group grid min-h-36 gap-4 p-4 transition hover:-translate-y-1 hover:border-brand-100 hover:bg-brand-50 hover:shadow-soft focus:outline-none focus:ring-4 focus:ring-brand-100"
                key={tool.title}
                to={tool.to}
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700 transition group-hover:bg-white">
                  <Icon aria-hidden="true" size={20} strokeWidth={2.25} />
                </span>
                <span className="grid gap-1">
                  <span className="text-lg font-semibold text-ink">
                    {tool.title}
                  </span>
                  <span className="text-sm leading-6 text-slate-600">
                    {tool.detail}
                  </span>
                </span>
                <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
                  Open
                  <ArrowRight aria-hidden="true" size={16} strokeWidth={2.25} />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="planned-tools-heading" className="grid gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink" id="planned-tools-heading">
            Planned next
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {plannedTools.map((tool) => {
            const Icon = tool.icon;

            return (
              <article className="panel grid min-h-28 gap-3 p-4 transition hover:border-brand-100" key={tool.title}>
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    <Icon aria-hidden="true" size={20} strokeWidth={2.25} />
                  </span>
                  <span className="rounded-full border border-line px-2.5 py-1 text-xs font-semibold text-slate-600">
                    Planned
                  </span>
                </div>
                <h3 className="text-base font-semibold text-ink">
                  {tool.title}
                </h3>
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel grid gap-4 border-accent-100 bg-accent-50 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-5">
        <div className="flex min-w-0 gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-panel text-accent-700">
            <Handshake aria-hidden="true" size={20} strokeWidth={2.25} />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-ink">
              Help build InUni
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Ideas, bugs, campus group collaborations, and student help can go
              through one quiet project contact.
            </p>
          </div>
        </div>
        <Link className="secondary-button justify-center" to="/contact">
          Contact InUni
        </Link>
      </section>
    </div>
  );
}
