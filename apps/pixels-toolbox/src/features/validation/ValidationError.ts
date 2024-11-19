import { LocalizedError } from "~/features/LocalizedError";

export abstract class ValidationError extends LocalizedError {
  abstract errorCode: number;
}
