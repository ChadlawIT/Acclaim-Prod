const UK_TZ = 'Europe/London';

export function formatUKDateTime(dateValue: string | Date | null | undefined): string {
  if (!dateValue) return '—';
  const date = new Date(dateValue as string);
  if (isNaN(date.getTime())) return 'Invalid date';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: UK_TZ,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export function formatUKDateTimeSecs(dateValue: string | Date | null | undefined): string {
  if (!dateValue) return '—';
  const date = new Date(dateValue as string);
  if (isNaN(date.getTime())) return 'Invalid date';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: UK_TZ,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

export function formatUKShortDateTime(dateValue: string | Date | null | undefined): string {
  if (!dateValue) return '—';
  const date = new Date(dateValue as string);
  if (isNaN(date.getTime())) return 'Invalid date';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: UK_TZ,
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export function formatUKTime(dateValue: string | Date | null | undefined): string {
  if (!dateValue) return '—';
  const date = new Date(dateValue as string);
  if (isNaN(date.getTime())) return 'Invalid date';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: UK_TZ,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

export function formatUKDateLong(dateValue: string | Date | null | undefined): string {
  if (!dateValue) return '—';
  const date = new Date(dateValue as string);
  if (isNaN(date.getTime())) return 'Invalid date';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: UK_TZ,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}
