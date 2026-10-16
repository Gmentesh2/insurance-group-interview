'use client';

import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { useTranslations } from 'next-intl';
import { dateForInput, dateInputToIso } from '@/lib/date-input';
import { Input } from './ui';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> & {
  value: string;
  onValueChange: (value: string) => void;
};

/** Keep the user's caret and partial edit while publishing the existing ISO contract. */
export const DateInput = forwardRef<HTMLInputElement, Props>(function DateInput({ value, onValueChange, onFocus, onBlur, ...props }, ref) {
  const t = useTranslations('flow');
  const [edit, setEdit] = useState<{ source: string; draft: string } | null>(null);
  return <Input {...props} ref={ref} type="text" inputMode="numeric" maxLength={10} autoComplete={props.autoComplete ?? 'off'} placeholder={props.placeholder ?? t('datePlaceholder')}
    value={edit?.source === value ? edit.draft : dateForInput(value)}
    onFocus={event => { setEdit({ source: value, draft: dateForInput(value) }); onFocus?.(event); }}
    onChange={event => {
      const draft = dateForInput(event.currentTarget.value);
      const source = dateInputToIso(draft);
      setEdit({ source, draft });
      onValueChange(source);
    }}
    onBlur={event => { setEdit(null); onBlur?.(event); }} />;
});
