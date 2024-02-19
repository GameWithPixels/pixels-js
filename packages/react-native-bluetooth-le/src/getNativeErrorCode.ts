export function getNativeErrorCode(error: unknown): string | undefined {
  const code = (error as any).code;
  return typeof code === "string" ? code : code ? String(code) : undefined;
}
