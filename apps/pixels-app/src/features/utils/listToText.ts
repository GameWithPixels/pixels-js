export function listToText(list: string[], beforeLast = "and"): string {
  if (list.length <= 1) {
    return list[0] ?? "";
  } else {
    const last = list[list.length - 1];
    return `${list.slice(0, list.length - 1).join(", ")} ${beforeLast} ${last}`;
  }
}
