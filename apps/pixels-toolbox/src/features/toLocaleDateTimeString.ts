// Converts Date to local date/time string
export function toLocaleDateTimeString(date: Date): string {
  return date.toLocaleDateString() + " - " + date.toLocaleTimeString();
}
