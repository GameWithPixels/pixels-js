const Pathname = {
  getIndexOfFilename(pathname: string): number {
    return 1 + Math.max(pathname.lastIndexOf("/"), pathname.lastIndexOf("\\"));
  },

  getIndexOfExtension(pathname: string): number {
    const i = Pathname.getIndexOfFilename(pathname);
    // Skip the first character as a filename may start with a dot
    return pathname.indexOf(".", i + 1);
  },

  getFilename(pathname: string): string {
    return pathname.substring(Pathname.getIndexOfFilename(pathname));
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
};

export default Pathname;
