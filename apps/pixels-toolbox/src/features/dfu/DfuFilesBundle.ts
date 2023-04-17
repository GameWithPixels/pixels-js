import { assert } from "@systemic-games/pixels-core-utils";

import getDfuFileInfo, { DfuFileInfo } from "./getDfuFileInfo";

// Firmware and/or bootloader DFU files of the same date
export default class DfuFilesBundle {
  private readonly _main: DfuFileInfo;
  private readonly _bootloader?: DfuFileInfo;
  private readonly _firmware?: DfuFileInfo;

  get date(): Date {
    return this._main.date!;
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

  get types(): ("bootloader" | "firmware")[] {
    return [this._bootloader, this._firmware]
      .filter(Boolean)
      .map((fi) => fi?.type!);
  }

  static create(paths?: {
    bootloader?: string;
    firmware?: string;
  }): DfuFilesBundle | undefined {
    const f1 = paths?.bootloader ? getDfuFileInfo(paths.bootloader) : undefined;
    const f2 = paths?.firmware ? getDfuFileInfo(paths.firmware) : undefined;
    if (f1) {
      return new DfuFilesBundle(f1, f2);
    } else if (f2) {
      return new DfuFilesBundle(f2, f1);
    }
  }

  constructor(fileInfo?: DfuFileInfo, otherFileInfo?: DfuFileInfo) {
    const main = fileInfo ?? otherFileInfo;
    const other = fileInfo ? otherFileInfo : undefined;
    assert(main, "DfuFilesBundle: at least one parameter must be defined");
    assert(
      main.type,
      "DfuFilesBundle: fileInfo parameter must have a defined DFU type"
    );
    assert(
      main.type !== other?.type,
      "DfuFilesBundle: fileInfo and otherFileInfo parameters must be of a different type"
    );
    assert(
      main?.date && main.date.getTime() !== 0,
      "DfuFilesBundle: fileInfo parameter must have a valid date"
    );
    assert(
      !other || other.type,
      "DfuFilesBundle: otherFileInfo parameter must have a defined DFU type"
    );
    assert(
      !other?.date || main.date.getTime() === other.date.getTime(),
      "DfuFilesBundle: fileInfo and otherFileInfo parameter must have the same date"
    );
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

  static async makeBundles(files: string[]): Promise<DfuFilesBundle[]> {
    // Sort files by path and get their DFU file info
    const filesInfo = files.sort().map(getDfuFileInfo);

    // Group files with same date and in same directory
    const dfuBundles: DfuFilesBundle[] = [];
    const getDirectory = (path?: string) =>
      path?.substring(0, path.lastIndexOf("/"));

    filesInfo.forEach((fi) => {
      if (fi.date && fi.type) {
        const ms = fi.date.getTime();
        const dir = getDirectory(fi.pathname);
        const index = dfuBundles.findIndex((b) => {
          // We search for a bundle with the same date
          // and that doesn't yet have a DFU file of the same type
          if (
            b.date.getTime() === ms &&
            (fi.type !== "firmware" || !b.firmware) &&
            (fi.type !== "bootloader" || !b.bootloader)
          ) {
            return getDirectory((b.firmware ?? b.bootloader)?.pathname) === dir;
          }
          return false;
        });

        // Create a new bundle if no matching one was found
        if (index < 0) {
          dfuBundles.push(new DfuFilesBundle(fi));
        } else {
          dfuBundles[index] = new DfuFilesBundle(dfuBundles[index].main, fi);
        }
      } else {
        console.warn(
          `Couldn't read firmware date or type on DFU file: ${fi.pathname}`
        );
      }
    });

    return dfuBundles;
  }
}
