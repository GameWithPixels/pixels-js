import { useTranslation } from "react-i18next";

/** Base class for errors with a localized message. */
export abstract class LocalizedError extends Error {
  abstract toLocalizedString(t: ReturnType<typeof useTranslation>["t"]): string;
}
