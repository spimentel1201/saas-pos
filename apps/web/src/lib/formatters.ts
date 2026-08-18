const locale = 'es-PE';

export const currency = new Intl.NumberFormat(locale, {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPEN(value: number): string {
  return currency.format(value);
}

export const number = new Intl.NumberFormat(locale, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export const percent = new Intl.NumberFormat(locale, {
  style: 'percent',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function date(value: string | Date, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options,
  }).format(new Date(value));
}

export function datetime(value: string | Date) {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function time(value: string | Date) {
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
