export interface DfuFileInfo {
  pathname: string;
  date: Date;
  basename: string;
  type: "firmware" | "bootloader";
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
  const parts = filename?.split("_");
  if (parts?.length === 3) {
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
      return {
        pathname,
        date: new Date(date + "T" + timeWithSemicolon),
        basename: parts[0],
        type:
          typeStr === "firmware" || typeStr === "bootloader"
            ? typeStr
            : opt?.defaultType ?? "firmware",
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
