'use client';

import type { ReactNode } from 'react';
import { FieldRequirement } from './flow-progress';
import { cn } from './ui';

type FieldControl = {
  id: string;
  required: boolean;
  'aria-invalid': true | undefined;
  'aria-describedby': string | undefined;
};

/** Shared field anatomy; each feature retains its own value and validation rules. */
export function FormField({ id, label, required = false, hint, error, className, children }: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: (control: FieldControl) => ReactNode;
}) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  return <div className={cn('field form-field', className)}>
    <label htmlFor={id}>{label}{required && <FieldRequirement />}</label>
    <div className="form-field-control">{children({ id, required, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy })}</div>
    <div className="form-field-feedback">
      {hint && <small id={`${id}-hint`}>{hint}</small>}
      {error && <p className="field-error" id={`${id}-error`}>{error}</p>}
    </div>
  </div>;
}
