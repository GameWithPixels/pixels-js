export function listToText(list: string[], beforeLast = "and"): string {
  if (list.length <= 1) {
    return list[0] ?? "";
  } else {
    const last = list[list.length - 1];
    return `${list.slice(0, list.length - 1).join(", ")} ${beforeLast} ${last}`;
  }
}

export function getCountAsText(count: number): string {
  return count === 1 ? "once" : count === 2 ? "twice" : `${count} times`;
}

export function toPercentText(value: number): string {
  return (100 * value).toFixed() + "%";
}

export function getUrlShortText(url: string): string {
  url = url.trim();
  const httpSep = url.indexOf("://");
  const start = httpSep >= 0 ? httpSep + 3 : 0;
  const end = url.indexOf("/", start);
  return url.slice(start, end > 0 ? end : undefined);
}
