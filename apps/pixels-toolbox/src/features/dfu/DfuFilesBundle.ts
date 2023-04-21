import getDfuFileInfo, { DfuFileInfo } from "./getDfuFileInfo";

export type DfuFilesBundleKind = "app" | "factory" | "imported";

// Firmware and/or bootloader DFU files of the same date
export default class DfuFilesBundle {
  private readonly _main: DfuFileInfo;
  private readonly _bootloader?: DfuFileInfo;
  private readonly _firmware?: DfuFileInfo;
  private readonly _kind: DfuFilesBundleKind;

  get date(): Date {
    return this._main.date;
  }

  get main(): DfuFileInfo {
    return this._main;
  }

  get bootloader(): DfuFileInfo | undefined {
    return this._bootloader;
  }

  get firmware(): DfuFileInfo | undefined {
    return this._firmware;
  }

  get isComplete(): boolean {
    return !!this._bootloader && !!this._firmware;
  }

  get kind(): DfuFilesBundleKind {
    return this._kind;
  }

  get fileTypes(): ("bootloader" | "firmware")[] {
    return [this._bootloader, this._firmware]
      .filter(Boolean)
      .map((fi) => fi?.type!);
  }

  get pathnames(): string[] {
    return this._bootloader && this._firmware
      ? [this._bootloader.pathname, this._firmware.pathname]
      : [this._main.pathname];
  }

  static create(params: {
    pathnames: string[];
    kind?: DfuFilesBundleKind;
  }): DfuFilesBundle {
    if (!params.pathnames.length) {
      throw new Error("DfuFilesBundle.create: Empty pathnames");
    }
    const fileInfo = getDfuFileInfo(params.pathnames[0]);
    const otherFileInfo = params.pathnames[1]
      ? getDfuFileInfo(params.pathnames[1])
      : undefined;
    return new DfuFilesBundle({ fileInfo, otherFileInfo, kind: params.kind });
  }

  constructor(params: {
    fileInfo: DfuFileInfo;
    otherFileInfo?: DfuFileInfo;
    kind?: DfuFilesBundleKind;
  }) {
    this._kind = params.kind ?? "app";
    const main = params.fileInfo;
    const other = params.otherFileInfo;
    if (main.type === other?.type) {
      throw new Error(
        "DfuFilesBundle: The `fileInfo` and `otherFileInfo` parameters `type` property must be different"
      );
    }
    if (other && main.date.getTime() !== other.date.getTime()) {
      throw new Error(
        "DfuFilesBundle: The `fileInfo` and `otherFileInfo` parameters must have the same date"
      );
    }
    this._main = { ...main };
    if (main.type === "bootloader") {
      this._bootloader = this._main;
      if (other) {
        this._firmware = { ...other };
      }
    } else {
      this._firmware = this._main;
      if (other) {
        this._bootloader = { ...other };
      }
    }
  }

  static async createMany(
    filesInfo: DfuFileInfo[],
    kind: DfuFilesBundleKind = "app"
  ): Promise<DfuFilesBundle[]> {
    // Group files with same date and in same directory
    const dfuBundles: DfuFilesBundle[] = [];
    const getDirectory = (path?: string) =>
      path?.substring(0, path.lastIndexOf("/"));

    filesInfo.forEach((fileInfo) => {
      if (fileInfo.date && fileInfo.type) {
        const ms = fileInfo.date.getTime();
        const dir = getDirectory(fileInfo.pathname);
        const index = dfuBundles.findIndex((b) => {
          // We search for a bundle with the same date
          // and that doesn't yet have a DFU file of the same type
          if (
            b.date.getTime() === ms &&
            (fileInfo.type !== "firmware" || !b.firmware) &&
            (fileInfo.type !== "bootloader" || !b.bootloader)
          ) {
            return getDirectory((b.firmware ?? b.bootloader)?.pathname) === dir;
          }
          return false;
        });

        // Create a new bundle if no matching one was found
        if (index < 0) {
          dfuBundles.push(new DfuFilesBundle({ fileInfo, kind }));
        } else {
          dfuBundles[index] = new DfuFilesBundle({
            fileInfo,
            otherFileInfo: dfuBundles[index].main,
            kind,
          });
        }
      } else {
        console.warn(
          `Couldn't read firmware date or type on DFU file: ${fileInfo.pathname}`
        );
      }
    });

    return dfuBundles;
  }
}
