import { WebRequestParams } from "./buildWebRequestParams";

export function buildWebRequestURL(
  url: string,
  params: WebRequestParams
): string {
  function build(
    url: string,
    value1: string,
    value2: string,
    value3: string,
    value4: string
  ) {
    url = url.trim();
    const params = `value1=${encodeURIComponent(value1)}&value2=${encodeURIComponent(value2)}&value3=${encodeURIComponent(value3)}&value4=${encodeURIComponent(value4)}`;
    return `${url}${
      !url.includes("?") ? "?" : !url.endsWith("&") ? "&" : ""
    }${params}`;
  }
  return build(
    url,
    params.pixelName,
    params.actionValue,
    params.faceValue.toString(),
    params.profileName
  );
}
