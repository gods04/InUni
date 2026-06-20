import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordFieldProps {
  autoComplete: string;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}

function getPasswordActionName(action: 'Hide' | 'Show', label: string): string {
  return `${action} ${label.toLowerCase()}`;
}

export function PasswordField({
  autoComplete,
  label,
  onChange,
  placeholder,
  value,
}: PasswordFieldProps) {
  const inputId = useId();
  const [visible, setVisible] = useState(false);
  const action = visible ? 'Hide' : 'Show';
  const Icon = visible ? EyeOff : Eye;
  const actionName = getPasswordActionName(action, label);

  return (
    <div className="grid gap-2">
      <label className="field-label" htmlFor={inputId}>
        {label}
      </label>
      <div className="relative">
        <input
          autoComplete={autoComplete}
          className="field-input pr-12"
          id={inputId}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type={visible ? 'text' : 'password'}
          value={value}
        />
        <button
          aria-label={actionName}
          aria-pressed={visible}
          className="absolute inset-y-1.5 right-1.5 inline-flex w-9 items-center justify-center rounded-md text-brand-700 transition hover:bg-brand-50 hover:text-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100"
          onClick={() => setVisible((current) => !current)}
          title={actionName}
          type="button"
        >
          <Icon aria-hidden="true" size={18} strokeWidth={2.25} />
        </button>
      </div>
    </div>
  );
}
