"use client";

import { useTranslations } from 'next-intl';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import type { ClaimForm } from '@/lib/claim-flow';
import { DateInput } from './date-input';
import { Input } from './ui';
import { FormField } from './form-field';

export function ClaimDetailsForm({ form, errors, busy, blocked, dirty, onChange, onSave, onContinue }: {
  form: ClaimForm; errors: Partial<Record<'incidentDate' | 'description' | 'amount' | 'consent', string>>;
  busy: boolean; blocked: boolean; dirty: boolean;
  onChange: (form: ClaimForm) => void; onSave: () => void; onContinue: () => void;
}) {
  const t = useTranslations('account'), s = useTranslations('supportDesign'), f = useTranslations('flow');
  return <form className="claim-section claim-form" onSubmit={event => { event.preventDefault(); onContinue(); }} noValidate>
    <div className="claim-section-heading"><h2>{s('claimDetails')}</h2><span className={`claim-save-state${dirty ? ' is-unsaved' : ''}`} role="status">{dirty ? s('unsaved') : s('saved')}</span></div>
    <p className="flow-form-hint">{f('claimRequired')}</p>
    <div className="account-form-grid">
      <FormField id="claim-type" label={t('incidentType')} required>
        {control => <select {...control} className="input" value={form.incidentType} disabled={busy} onChange={event => onChange({ ...form, incidentType: event.target.value as ClaimForm['incidentType'] })}>{(['medical','cancellation','baggage','delay','other'] as const).map(type => <option key={type} value={type}>{t(`type_${type}`)}</option>)}</select>}
      </FormField>
      <FormField id="claim-incidentDate" label={t('incidentDate')} required hint={s('dateFormat')} error={errors.incidentDate}>
        {control => <DateInput {...control} value={form.incidentDate} disabled={busy} onValueChange={incidentDate => onChange({ ...form, incidentDate })} />}
      </FormField>
    </div>
    <FormField id="claim-description" label={t('description')} required hint={t('descriptionHint')} error={errors.description}>
      {control => <textarea {...control} className="input" rows={5} value={form.description} maxLength={5000} disabled={busy} onChange={event => onChange({ ...form, description: event.target.value })} />}
    </FormField>
    <FormField id="claim-amount" label={t('amount')} required hint={t('amountHint')} error={errors.amount} className="claim-amount">
      {control => <Input {...control} type="number" min="0.01" max="1000000" step="0.01" inputMode="decimal" value={form.amount} disabled={busy} onChange={event => onChange({ ...form, amount: event.target.value })} />}
    </FormField>
    <div className="claim-flow-actions"><button className="button" disabled={busy || blocked}>{busy && <LoaderCircle size={18} className="spin" />}{f('saveContinue')}<ArrowRight size={18} /></button><button type="button" className="button button-secondary" disabled={busy || blocked} onClick={onSave}>{t('saveDraft')}</button></div>
  </form>;
}
