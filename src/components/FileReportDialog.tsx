import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { FileReportInput, FileReportType } from '../types/files';

interface FileReportDialogProps {
  open: boolean;
  fileId: string;
  onClose: () => void;
  onSubmit: (input: FileReportInput) => Promise<void> | void;
}

const reportTypes: Array<{ value: FileReportType; label: string }> = [
  { value: 'malicious_file', label: 'Malicious or unsafe file' },
  { value: 'copyright', label: 'Copyright issue' },
  { value: 'privacy', label: 'Personal or private information' },
  { value: 'harassment', label: 'Harassment or abuse' },
  { value: 'other', label: 'Something else' },
];

export function FileReportDialog({
  open,
  fileId,
  onClose,
  onSubmit,
}: FileReportDialogProps) {
  const [reportType, setReportType] = useState<FileReportType | ''>('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setReportType('');
      setNote('');
      setError(null);
    }
  }, [fileId, open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open, submitting]);

  if (!open) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!reportType) {
      setError('Choose a report reason.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({ fileId, reportType, note: note.trim() });
      onClose();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Could not submit this report.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm"
      role="presentation"
    >
      <section
        aria-labelledby="file-report-dialog-title"
        aria-modal="true"
        className="w-full max-w-lg rounded-lg border border-line bg-white p-5 shadow-2xl sm:p-6"
        role="dialog"
      >
        <h2
          className="text-xl font-semibold text-ink"
          id="file-report-dialog-title"
        >
          Report file
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Reports help admins remove unsafe or inappropriate uploads.
        </p>

        <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2">
            <span className="field-label">Reason</span>
            <select
              autoFocus
              className="field-input"
              onChange={(event) =>
                setReportType(event.target.value as FileReportType | '')
              }
              value={reportType}
            >
              <option value="">Choose a reason</option>
              {reportTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="field-label">Optional note</span>
            <textarea
              className="field-input min-h-28 resize-y"
              maxLength={500}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Add details for the admin team"
              value={note}
            />
          </label>

          {error ? (
            <p className="text-sm font-semibold text-red-700" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <button
              className="secondary-button"
              disabled={submitting}
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="danger-button"
              disabled={submitting}
              type="submit"
            >
              {submitting ? 'Submitting...' : 'Submit report'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
