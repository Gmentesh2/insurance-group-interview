import {
  ShieldCheck, HeartPulse, Plane, Luggage, Clock3, Headphones,
  Files, FileText, ClipboardList, ReceiptText, SlidersHorizontal,
  ListChecks, CarFront, House, Smartphone, Shield, ShoppingBag,
  HeartHandshake, KeyRound,
} from 'lucide-react';

const productIcons = {
  cover: ShieldCheck,
  medical: HeartPulse,
  cancellation: Plane,
  baggage: Luggage,
  delay: Clock3,
  assistance: Headphones,
  policies: Files,
  documents: FileText,
  claims: ClipboardList,
  price: ReceiptText,
  compare: SlidersHorizontal,
  conditions: ListChecks,
  travel: Plane,
  health: HeartPulse,
  motor: CarFront,
  home: House,
  device: Smartphone,
  cyber: Shield,
  purchase_protection: ShoppingBag,
  personal_accident: HeartHandshake,
  rental_car: KeyRound,
} as const;
export type ProductIconName = keyof typeof productIcons;

/** One outline family, always decorative beside a visible localized label. */
export function ProductIcon({ name, size = 24, className }: {
  name: ProductIconName;
  size?: number;
  className?: string;
}) {
  const Icon = productIcons[name];
  return <Icon className={`product-icon${className ? ` ${className}` : ''}`} size={size} strokeWidth={1.8} aria-hidden="true" focusable="false" />;
}
