export function getNameAndExtension(path: string): {
  name: string;
  extension: string;
} {
  const lastDot = path.lastIndexOf(".");
  const extension = lastDot >= 0 ? path.slice(lastDot + 1) : "";
  const name = lastDot >= 0 ? path.slice(0, lastDot) : path;
  return { name, extension };
}
