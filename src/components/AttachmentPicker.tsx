import { useId, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  MAX_ATTACHMENTS_PER_CONTEXT,
  MAX_FILE_DESCRIPTION_LENGTH,
  validateFileSize,
} from '../lib/fileValidation';
import type { FileUploadDraft } from '../types/files';

interface AttachmentPickerProps {
  value: FileUploadDraft[];
  onChange: (value: FileUploadDraft[]) => void;
  disabled?: boolean;
  maxFiles?: number;
}

function getAttachmentLimitMessage(maxFiles: number): string {
  return `You can attach up to ${maxFiles} ${maxFiles === 1 ? 'file' : 'files'}.`;
}

function makeDraft(file: File): FileUploadDraft {
  return {
    file,
    description: '',
    submitToSharedFiles: false,
    courseCode: '',
    campusOrFaculty: '',
    tags: '',
  };
}

export function AttachmentPicker({
  value,
  onChange,
  disabled = false,
  maxFiles = MAX_ATTACHMENTS_PER_CONTEXT,
}: AttachmentPickerProps) {
  const inputId = useId();
  const [error, setError] = useState<string | null>(null);

  function updateDraft(index: number, patch: Partial<FileUploadDraft>) {
    onChange(
      value.map((draft, draftIndex) =>
        draftIndex === index ? { ...draft, ...patch } : draft,
      ),
    );
  }

  function removeDraft(index: number) {
    setError(null);
    onChange(value.filter((_, draftIndex) => draftIndex !== index));
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (selectedFiles.length === 0) return;

    if (value.length + selectedFiles.length > maxFiles) {
      setError(getAttachmentLimitMessage(maxFiles));
      return;
    }

    const invalidFile = selectedFiles.find((file) => validateFileSize(file.size));
    if (invalidFile) {
      setError(validateFileSize(invalidFile.size));
      return;
    }

    setError(null);
    onChange([...value, ...selectedFiles.map(makeDraft)]);
  }

  return (
    <section className="grid gap-3 rounded-lg border border-dashed border-brand-100 bg-brand-50/40 p-4">
      <div>
        <label className="field-label" htmlFor={inputId}>
          Attach files
        </label>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Max 100MB per file, {maxFiles} files per post or comment.
        </p>
      </div>

      <input
        className="field-input cursor-pointer bg-white"
        disabled={disabled}
        id={inputId}
        multiple
        onChange={handleFileChange}
        type="file"
      />

      {error ? (
        <p className="text-sm font-semibold text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {value.length > 0 ? (
        <div className="grid gap-3 border-t border-slate-200 pt-3">
          {value.map((draft, index) => {
            const filename = draft.file.name || `File ${index + 1}`;
            return (
              <article
                className="grid gap-3 rounded-lg border border-line bg-white p-3"
                key={`${filename}-${index}`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-ink">{filename}</h3>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Ready to upload
                    </p>
                  </div>
                  <button
                    className="secondary-button shrink-0"
                    disabled={disabled}
                    onClick={() => removeDraft(index)}
                    type="button"
                  >
                    Remove
                  </button>
                </div>

                <label className="grid gap-2">
                  <span className="field-label">Description</span>
                  <textarea
                    aria-label={`Description for ${filename}`}
                    className="field-input min-h-20 resize-y"
                    disabled={disabled}
                    maxLength={MAX_FILE_DESCRIPTION_LENGTH}
                    onChange={(event) =>
                      updateDraft(index, { description: event.target.value })
                    }
                    placeholder="Optional context for this file"
                    value={draft.description}
                  />
                </label>

                <label className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <input
                    aria-label={`Submit ${filename} to Shared Files`}
                    checked={draft.submitToSharedFiles}
                    className="mt-1 h-4 w-4 accent-brand-700"
                    disabled={disabled}
                    onChange={(event) =>
                      updateDraft(index, {
                        submitToSharedFiles: event.target.checked,
                      })
                    }
                    type="checkbox"
                  />
                  <span>
                    <span className="block text-sm font-bold text-slate-900">
                      Submit to Shared Files
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-slate-600">
                      Admins review it before it appears in Files.
                    </span>
                  </span>
                </label>

                {draft.submitToSharedFiles ? (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="grid gap-2">
                      <span className="field-label">Course code</span>
                      <input
                        aria-label={`Course code for ${filename}`}
                        className="field-input"
                        disabled={disabled}
                        onChange={(event) =>
                          updateDraft(index, { courseCode: event.target.value })
                        }
                        placeholder="PSYC1001"
                        value={draft.courseCode}
                      />
                    </label>
                    <label className="grid gap-2">
                      <span className="field-label">Campus or faculty</span>
                      <input
                        aria-label={`Campus or faculty for ${filename}`}
                        className="field-input"
                        disabled={disabled}
                        onChange={(event) =>
                          updateDraft(index, {
                            campusOrFaculty: event.target.value,
                          })
                        }
                        placeholder="Humanities"
                        value={draft.campusOrFaculty}
                      />
                    </label>
                    <label className="grid gap-2">
                      <span className="field-label">Tags</span>
                      <input
                        aria-label={`Tags for ${filename}`}
                        className="field-input"
                        disabled={disabled}
                        onChange={(event) =>
                          updateDraft(index, { tags: event.target.value })
                        }
                        placeholder="template, week 5"
                        value={draft.tags}
                      />
                    </label>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
