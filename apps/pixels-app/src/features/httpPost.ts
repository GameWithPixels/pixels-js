/**
 * Post a request at the given URL and returns the HTTP status.
 * @remarks This function will never throw.
 * @param url The URL to contact.
 * @param value1 Optional argument.
 * @param value2 Optional argument.
 * @param value3 Optional argument.
 * @returns HTTP status.
 */
export default function (
  url: string,
  value1?: string,
  value2?: string,
  value3?: string
): Promise<number> {
  async function post(
    url: string,
    value1: string,
    value2: string,
    value3: string
  ) {
    try {
      const resp = await fetch(
        `${url}?value1=${value1}&value2=${value2}&value3=${value3}`,
        { method: "POST" }
      );
      return resp.status;
    } catch (err) {
      console.error(err);
      return -1;
    }
  }
  return post(
    encodeURI(url),
    encodeURI(value1 ?? ""),
    encodeURI(value2 ?? ""),
    encodeURI(value3 ?? "")
  );
}
