'use client';

import { Select } from '@base-ui/react/select';
import { Check, ChevronDown } from 'lucide-react';

type Option = { value: string; label: string };

/** Same input tokens and field contract as the searchable country control. */
export function FormSelect({ id, name, label, value, options, placeholder, required, disabled, invalid, describedBy, onValueChange }: {
  id: string;
  name: string;
  label: string;
  value: string;
  options: readonly Option[];
  placeholder: string;
  required?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  onValueChange: (value: string) => void;
}) {
  return <Select.Root<string> name={name} items={options} value={value || null} required={required} disabled={disabled} onValueChange={next => onValueChange(next ?? '')}>
    <Select.Trigger id={id} className="input form-select-trigger" aria-label={label} aria-required={required || undefined} aria-invalid={invalid || undefined} aria-describedby={describedBy}>
      <Select.Value className="form-select-value" placeholder={placeholder} /><Select.Icon><ChevronDown size={16} aria-hidden="true" /></Select.Icon>
    </Select.Trigger>
    <Select.Portal><Select.Positioner className="form-select-positioner" alignItemWithTrigger={false} sideOffset={6} positionMethod="fixed" collisionPadding={12}>
      <Select.Popup className="form-select-popup"><Select.List className="form-select-list">
        {options.map(option => <Select.Item key={option.value} value={option.value} className="form-select-option"><Select.ItemText>{option.label}</Select.ItemText><Select.ItemIndicator><Check size={16} aria-hidden="true" /></Select.ItemIndicator></Select.Item>)}
      </Select.List></Select.Popup>
    </Select.Positioner></Select.Portal>
  </Select.Root>;
}
