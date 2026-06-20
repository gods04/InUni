import { useEffect, useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { FileList } from '../components/FileList';
import { FileReportDialog } from '../components/FileReportDialog';
import { LoadingState } from '../components/LoadingState';
import { useAuth } from '../hooks/useAuth';
import {
  createSignedDownloadUrl,
  getSharedFiles,
  reportFile,
} from '../lib/fileApi';
import { canParticipate } from '../lib/permissions';
import type {
  FileKind,
  FileReportInput,
  FileSort,
  LinkedFile,
  SharedFileFilters,
} from '../types/files';

const sortOptions: Array<{ value: FileSort; label: string }> = [
  { value: 'newest', label: 'Newest' },
  { value: 'downloads', label: 'Downloads' },
  { value: 'reports', label: 'Reports' },
  { value: 'name', label: 'Name' },
];

const fileKindOptions: Array<{ value: FileKind | 'all'; label: string }> = [
  { value: 'all', label: 'All types' },
  { value: 'pdf', label: 'PDF' },
  { value: 'image', label: 'Images' },
  { value: 'document', label: 'Documents' },
  { value: 'presentation', label: 'Presentations' },
  { value: 'spreadsheet', label: 'Spreadsheets' },
  { value: 'archive', label: 'Archives' },
  { value: 'text', label: 'Text' },
  { value: 'other', label: 'Other' },
];

const initialFilters: SharedFileFilters = {
  query: '',
  courseCode: '',
  fileKind: 'all',
  campusOrFaculty: '',
  tag: '',
  sort: 'newest',
};

export function FilesPage() {
  const { user } = useAuth();
  const [files, setFiles] = useState<LinkedFile[]>([]);
  const [filters, setFilters] = useState<SharedFileFilters>(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [reportTarget, setReportTarget] = useState<LinkedFile | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    void getSharedFiles(filters)
      .then((nextFiles) => {
        if (active) setFiles(nextFiles);
      })
      .catch(() => {
        if (active) {
          setError(
            'File listings are temporarily unavailable. Please try again later.',
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [filters]);

  function updateFilters(patch: Partial<SharedFileFilters>) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  async function openFile(file: LinkedFile, target: 'download' | 'preview') {
    setStatus(null);

    if (!user) {
      setStatus('Log in to preview or download files.');
      return;
    }

    if (!canParticipate(user.profile)) {
      setStatus('Your restricted account cannot download files.');
      return;
    }

    const signedUrl = await createSignedDownloadUrl(file.id);
    if (target === 'preview') {
      window.open(signedUrl.url, '_blank', 'noopener,noreferrer');
      return;
    }

    window.location.assign(signedUrl.url);
  }

  function openReport(file: LinkedFile) {
    setStatus(null);

    if (!user) {
      setStatus('Log in to report files.');
      return;
    }

    if (!canParticipate(user.profile)) {
      setStatus('Your restricted account cannot report files.');
      return;
    }

    setReportTarget(file);
  }

  async function submitReport(input: FileReportInput) {
    if (!user) return;
    await reportFile(input, user);
    setStatus('Report submitted. Thank you.');
  }

  return (
    <div className="grid gap-5">
      <section className="flex flex-col gap-5 border-b border-line pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="section-title">Files</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
            Approved notes, templates, images, and class resources from the UCT community.
          </p>
        </div>
      </section>

      <section className="panel grid gap-4 p-4 sm:p-5">
        <label className="grid gap-2">
          <span className="field-label">Search shared files</span>
          <input
            aria-label="Search shared files"
            className="field-input"
            onChange={(event) => updateFilters({ query: event.target.value })}
            placeholder="File name, course code, tag, or description"
            type="search"
            value={filters.query}
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-4">
          <label className="grid gap-2">
            <span className="field-label">Course code</span>
            <input
              className="field-input"
              onChange={(event) =>
                updateFilters({ courseCode: event.target.value })
              }
              placeholder="CSC1010H"
              value={filters.courseCode}
            />
          </label>

          <label className="grid gap-2">
            <span className="field-label">File type</span>
            <select
              className="field-input"
              onChange={(event) =>
                updateFilters({
                  fileKind: event.target.value as FileKind | 'all',
                })
              }
              value={filters.fileKind}
            >
              {fileKindOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="field-label">Campus or faculty</span>
            <input
              className="field-input"
              onChange={(event) =>
                updateFilters({ campusOrFaculty: event.target.value })
              }
              placeholder="Science"
              value={filters.campusOrFaculty}
            />
          </label>

          <label className="grid gap-2">
            <span className="field-label">Tag</span>
            <input
              className="field-input"
              onChange={(event) => updateFilters({ tag: event.target.value })}
              placeholder="study"
              value={filters.tag}
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          {sortOptions.map((option) => (
            <button
              className={
                filters.sort === option.value
                  ? 'primary-button'
                  : 'secondary-button'
              }
              key={option.value}
              onClick={() => updateFilters({ sort: option.value })}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      {status ? (
        <p className="text-sm font-semibold text-slate-600">{status}</p>
      ) : null}
      {error ? <ErrorState message={error} /> : null}
      {loading ? <LoadingState label="Loading files..." /> : null}
      {!loading && !error && files.length === 0 ? (
        <EmptyState
          title="No shared files yet"
          message="Approved study resources will appear here."
        />
      ) : null}
      {!loading && !error && files.length > 0 ? (
        <FileList
          files={files}
          onDownload={(file) => openFile(file, 'download')}
          onPreview={(file) => openFile(file, 'preview')}
          onReport={openReport}
        />
      ) : null}

      {reportTarget ? (
        <FileReportDialog
          fileId={reportTarget.id}
          onClose={() => setReportTarget(null)}
          onSubmit={submitReport}
          open
        />
      ) : null}
    </div>
  );
}
