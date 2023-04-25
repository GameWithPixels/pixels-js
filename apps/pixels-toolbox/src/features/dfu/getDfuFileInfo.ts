export interface DfuFileInfo {
  pathname: string;
  basename: string;
  type: "firmware" | "bootloader";
  date: Date;
  comment?: string;
}

// Returns parsed date and file basename
export default function (
  pathname: string,
  opt?: {
    filename?: string;
    defaultType?: DfuFileInfo["type"];
    defaultDate?: Date;
  }
): DfuFileInfo {
  const filename =
    opt?.filename ?? pathname.replace("\\", "/").split("/").pop();
  const filenameWithoutExt =
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    filename?.substring(0, filename.lastIndexOf(".")) || filename;
  const parts = filenameWithoutExt?.split("_");
  if (parts && parts.length >= 2) {
    try {
      const dt = parts[1].split("T");
      const date = dt[0];
      const time = dt[1];
      const index = time.search(/\D/);
      let timeWithSemicolon = "";
      if (index < 0 || time[index] !== ":") {
        for (let i = 0; i < index - 2; i += 2) {
          timeWithSemicolon += time.substring(i, i + 2) + ":";
        }
        timeWithSemicolon += time.substring(index - 2, index + 1);
        const tz = time.substring(index + 1);
        if (tz) {
          const indexTz = tz.search(/\D/);
          if (indexTz > 0 && indexTz < tz.length) {
            timeWithSemicolon += tz;
          } else if (tz.length <= 2) {
            timeWithSemicolon += tz + ":00";
          } else {
            timeWithSemicolon += tz.substring(0, 2) + ":" + tz.substring(2);
          }
        }
      } else {
        timeWithSemicolon = time;
      }
      const typeStr = parts[0].toLocaleLowerCase();
      const isFwOrBl = typeStr === "firmware" || typeStr === "bootloader";
      return {
        pathname,
        basename: parts[0],
        type: isFwOrBl ? typeStr : opt?.defaultType ?? "firmware",
        date: new Date(date + "T" + timeWithSemicolon),
        comment: parts.length > 2 ? parts.slice(2).join(", ") : undefined,
      };
    } catch {
      // We're only checking for a few possible cases so we might get an exception
    }
  }
  return {
    pathname,
    date: opt?.defaultDate ?? new Date(),
    basename: filename ? filename.split(".")[0] : pathname,
    type: opt?.defaultType ?? "firmware",
  };
}
