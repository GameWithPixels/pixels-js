/** Base class for errors with a localized message. */
export abstract class LocalizedError extends Error {
  abstract toLocalizedString(t: (key: string, params: any) => string): string;
}
