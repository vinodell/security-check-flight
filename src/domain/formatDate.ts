export function formatDate(value: string): string {
  return value.split('-').reverse().join('.')
}

export function formatShortDate(value: string): string {
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', timeZone: 'UTC' })
    .format(new Date(`${value}T00:00:00Z`)).replace('.', '').toLocaleUpperCase('ru-RU')
}
