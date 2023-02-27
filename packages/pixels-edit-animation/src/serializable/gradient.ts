import { UniqueData } from "./unique";

export interface GradientData extends UniqueData {
  keyframes: string; // Base64 binary data representing an array of { time: byte, colorIndex: byte } tuples
}
