import Pathname from "./Pathname";

import toLocaleDateTimeString from "~/features/toLocaleDateTimeString";

export default function (basenameOrList: string | string[]): string {
  const list =
    typeof basenameOrList === "string" ? [basenameOrList] : basenameOrList;
  list.push(toLocaleDateTimeString(new Date()).replaceAll(" ", ""));
  return Pathname.replaceInvalidCharacters(`${list.join("~")}`, "-");
}
