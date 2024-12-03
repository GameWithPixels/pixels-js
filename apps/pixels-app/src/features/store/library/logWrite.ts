import { logWrite as logWriteUntyped } from "../logWrite";
import { LibraryData } from "./types";

type RemovePlural<S extends string> = S extends `${infer A}s` ? A : S;

export function logWrite(
  action: "add" | "update" | "remove" | "reset",
  type: RemovePlural<keyof LibraryData>,
  uuid: string,
  message?: unknown
) {
  logWriteUntyped(`${action} ${type}: ${uuid} ${message ?? ""}`);
}
