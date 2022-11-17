// Converts Date to local date/time string
export default function (date: Date): string {
  return date.toLocaleDateString() + " - " + date.toLocaleTimeString();
}
