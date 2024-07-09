import * as FileSystem from "expo-file-system";

const Pathname = {
  getIndexOfFilename(pathname: string): number {
    return 1 + Math.max(pathname.lastIndexOf("/"), pathname.lastIndexOf("\\"));
  },

  getIndexOfExtension(pathname: string): number {
    return pathname.lastIndexOf(".");
  },

  getFilename(pathname: string): string {
    return pathname.substring(Pathname.getIndexOfFilename(pathname));
  },

  getPath(pathname: string): string {
    return pathname.substring(0, Pathname.getIndexOfFilename(pathname));
  },

  // Leading dot is returned with extension
  getExtension(pathname: string): string {
    const i = Pathname.getIndexOfExtension(pathname);
    return i > 0 ? pathname.substring(i) : "";
  },

  removeExtension(pathname: string): string {
    const i = Pathname.getIndexOfExtension(pathname);
    return i > 0 ? pathname.substring(0, i) : pathname;
  },

  replaceInvalidCharacters(pathname: string, replacement = "-"): string {
    return pathname.replace(/[/\\?%*:|"<>]/g, replacement);
  },

  // Returns unique pathname in cache folder
  async generateTempPathnameAsync(opt?: {
    prefix?: string;
    postfix?: string;
  }): Promise<string> {
    if (!FileSystem.cacheDirectory) {
      throw new Error(
        `generateTempDirectory: FileSystem.cacheDirectory is null`
      );
    }
    for (let i = 0; i < 100; ++i) {
      const rand = !i ? Date.now() : Math.round(1e9 * Math.random());
      const name =
        FileSystem.cacheDirectory +
        (opt?.prefix ?? "") +
        rand +
        (opt?.postfix ?? "");
      const info = await FileSystem.getInfoAsync(name);
      if (!info.exists) {
        return name;
      }
    }
    throw new Error("generateTempDirectory: failed to generate a unique name");
  },
};

export default Pathname;
