// Returns a string with the current time with a millisecond precision
export function getTimeStringMs(date?: Date): string {
  const to2 = (n: number) => n.toString().padStart(2, "0");
  const to3 = (n: number) => n.toString().padStart(3, "0");
  const d = date ?? new Date();
  return (
    to2(d.getHours()) +
    ":" +
    to2(d.getMinutes()) +
    ":" +
    to2(d.getSeconds()) +
    "." +
    to3(d.getMilliseconds())
  );
}
