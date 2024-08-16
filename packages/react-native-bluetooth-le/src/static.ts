import { PeripheralInfo } from "./PeripheralInfo";

// Keep list of peripherals in a separate file so it is not reset by Fast Refresh after a change in Central
export const PeripheralsMap: Map<string, PeripheralInfo> = new Map();
