export default function (shortUuid: number): string {
  return (
    (shortUuid & 0xffffffff).toString(16).padStart(8, "0") +
    "-0000-1000-8000-00805f9b34fb"
  );
}
