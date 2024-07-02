import { ProductInfo } from "~/features/validation/ProductInfo";

export function getProductName(info: ProductInfo) {
  if (info.colorway === "unknown") {
    throw new Error("getProductName: got unknown product colorway");
  }
  if (info.type === "unknown") {
    throw new Error("getProductName: got unknown product type");
  }
  const prefix = info.kind === "die" ? "" : "set";
  return `${prefix}${info.type}-${info.colorway}`.toLowerCase();
}
