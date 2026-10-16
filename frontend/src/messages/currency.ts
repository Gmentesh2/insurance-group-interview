export const currencyMessages = {
  en: {
    paymentNote: 'USD prices are estimates. Payment and policy amounts are in EUR.', title: 'Price currency', EUR: 'Euro', USD: 'US dollar',
    loading: 'Loading the reference rate…', unavailable: 'USD is unavailable. Showing prices in EUR.',
    retry: 'Try USD again',
    menuNote: 'EUR is the policy and payment currency. USD is an estimate for reference.',
  },
  de: {
    paymentNote: 'USD-Preise sind Schätzungen. Zahlung und Police bleiben in EUR.', title: 'Preiswährung', EUR: 'Euro', USD: 'US-Dollar',
    loading: 'Referenzkurs wird geladen…', unavailable: 'USD ist nicht verfügbar. Preise werden in EUR angezeigt.',
    retry: 'USD erneut versuchen',
    menuNote: 'EUR ist die Policen- und Zahlungswährung. USD dient nur zur Orientierung.',
  },
  ru: {
    paymentNote: 'Цены в USD приблизительны. Оплата и суммы полиса — в EUR.', title: 'Валюта цен', EUR: 'Евро', USD: 'Доллар США',
    loading: 'Загрузка справочного курса…', unavailable: 'USD недоступен. Цены показаны в EUR.',
    retry: 'Попробовать USD снова',
    menuNote: 'Валюта полиса и оплаты — EUR. USD указан только для ориентира.',
  },
} as const;
