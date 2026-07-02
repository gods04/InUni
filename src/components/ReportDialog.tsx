import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { validateReportReason } from '../lib/validation';
import type { ReportTarget } from '../types/forum';

interface ReportDialogProps {
  open: boolean;
  target: ReportTarget;
  onClose: () => void;
  onSubmit: (
    target: ReportTarget,
    reason: string,
  ) => Promise<void> | void;
}

export function ReportDialog({
  open,
  target,
  onClose,
  onSubmit,
}: ReportDialogProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setReason('');
      setError(null);
    }
  }, [open, target]);

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

    const validationError = validateReportReason(reason);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(target, reason.trim());
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

  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm"
      role="presentation"
    >
      <section
        aria-labelledby="report-dialog-title"
        aria-modal="true"
        className="w-full max-w-lg rounded-lg border border-line bg-white p-5 shadow-2xl sm:p-6"
        role="dialog"
      >
        <h2
          className="text-xl font-semibold text-ink"
          id="report-dialog-title"
        >
          Report content
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Tell moderators what is wrong. Reports are private.
        </p>

        <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2">
            <span className="field-label">Reason</span>
            <textarea
              autoFocus
              className="field-input min-h-32 resize-y"
              maxLength={1000}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Describe the issue clearly..."
              value={reason}
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
    </div>,
    document.body,
  );
}
