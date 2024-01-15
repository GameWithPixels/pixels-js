import { Profiles } from "@systemic-games/react-native-pixels-connect";

export function buildActionURL(
  action: Profiles.ActionMakeWebRequest,
  profile: { name: string },
  pixel?: { name: string }
): string {
  function build(url: string, value1: string, value2: string, value3: string) {
    url = url.trim();
    const params = `value1=${value1}&value2=${value2}&value3=${value3}`;
    return `${url}${
      !url.includes("?") ? "?" : !url.endsWith("&") ? "&" : ""
    }${params}`;
  }
  return build(
    encodeURI(action.url),
    encodeURI(pixel?.name ?? ""),
    encodeURI(action.value ?? ""),
    encodeURI(profile.name ?? "")
  );
}
