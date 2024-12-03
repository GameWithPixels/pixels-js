import { LibraryData } from "~/features/store/library";

type RemovePlural<S extends string> = S extends `${infer A}s` ? A : S;

export function log(
  action: "create" | "update",
  type: RemovePlural<keyof LibraryData>,
  uuid: string,
  message?: string
) {
  if (__DEV__) {
    console.log(`Store Load ${action} ${type}: ${uuid} ${message ?? ""}`);
  }
}
