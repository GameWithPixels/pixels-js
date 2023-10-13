export type PrintStatus = "preparing" | "sending" | "done";

export class PrintError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PrintError";
  }
}

export class UnknownProductPrintError extends Error {
  constructor(productName: string) {
    super(`Unknown product '${productName}'`);
    this.name = "PrintError";
  }
}
