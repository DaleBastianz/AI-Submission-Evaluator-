'use client';

import { useState, type InputHTMLAttributes } from 'react';

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label?: string;
  wrapperClassName?: string;
};

export default function PasswordInput({
  label,
  className = '',
  wrapperClassName = '',
  id,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const inputId = id || props.name || 'password';

  const field = (
    <div className={`relative ${label ? 'mt-2' : ''}`}>
      <input
        {...props}
        id={inputId}
        type={visible ? 'text' : 'password'}
        className={`w-full rounded-3xl border border-edu-border bg-edu-surface py-4 pl-4 pr-12 text-edu-text outline-none focus:border-cyan-500/70 ${className}`}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl px-2 py-1 text-xs font-medium text-edu-accent transition hover:bg-cyan-500/10"
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
      >
        {visible ? 'Hide' : 'Show'}
      </button>
    </div>
  );

  if (!label) {
    return <div className={wrapperClassName}>{field}</div>;
  }

  return (
    <label className={`block text-sm text-edu-muted ${wrapperClassName}`} htmlFor={inputId}>
      {label}
      {field}
    </label>
  );
}
