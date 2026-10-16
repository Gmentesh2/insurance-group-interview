"use client";

import { useTranslations } from 'next-intl';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import type { ClaimForm } from '@/lib/claim-flow';
import { dateForInput, dateInputToIso } from '@/lib/date-input';
import { FieldRequirement } from './flow-progress';

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
      <div className="field"><label htmlFor="claim-type">{t('incidentType')}<FieldRequirement /></label><select id="claim-type" className="input" value={form.incidentType} required disabled={busy} onChange={event => onChange({ ...form, incidentType: event.target.value as ClaimForm['incidentType'] })}>{(['medical','cancellation','baggage','delay','other'] as const).map(type => <option key={type} value={type}>{t(`type_${type}`)}</option>)}</select></div>
      <div className="field"><label htmlFor="claim-incidentDate">{t('incidentDate')}<FieldRequirement /></label><input id="claim-incidentDate" className="input" type="text" inputMode="numeric" maxLength={10} autoComplete="off" required placeholder={f('datePlaceholder')} value={dateForInput(form.incidentDate)} disabled={busy} aria-invalid={!!errors.incidentDate} aria-describedby={errors.incidentDate ? 'claim-date-hint claim-date-error' : 'claim-date-hint'} onChange={event => onChange({ ...form, incidentDate: dateInputToIso(event.target.value) })} /><small id="claim-date-hint">{s('dateFormat')}</small>{errors.incidentDate && <small id="claim-date-error" className="claim-field-error">{errors.incidentDate}</small>}</div>
    </div>
    <div className="field"><label htmlFor="claim-description">{t('description')}<FieldRequirement /></label><textarea id="claim-description" className="input" rows={5} value={form.description} maxLength={5000} required disabled={busy} aria-invalid={!!errors.description} aria-describedby={errors.description ? 'description-hint claim-description-error' : 'description-hint'} onChange={event => onChange({ ...form, description: event.target.value })} /><small id="description-hint">{t('descriptionHint')}</small>{errors.description && <small id="claim-description-error" className="claim-field-error">{errors.description}</small>}</div>
    <div className="field claim-amount"><label htmlFor="claim-amount">{t('amount')}<FieldRequirement /></label><input id="claim-amount" className="input" type="number" min="0.01" max="1000000" step="0.01" inputMode="decimal" required value={form.amount} disabled={busy} aria-invalid={!!errors.amount} aria-describedby={errors.amount ? 'claim-amount-error' : 'claim-amount-hint'} onChange={event => onChange({ ...form, amount: event.target.value })} /><small id="claim-amount-hint">{t('amountHint')}</small>{errors.amount && <small id="claim-amount-error" className="claim-field-error">{errors.amount}</small>}</div>
    <div className="claim-flow-actions"><button className="button" disabled={busy || blocked}>{busy && <LoaderCircle size={18} className="spin" />}{f('saveContinue')}<ArrowRight size={18} /></button><button type="button" className="button button-secondary" disabled={busy || blocked} onClick={onSave}>{t('saveDraft')}</button></div>
  </form>;
}
