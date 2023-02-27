import { UniqueNamedData } from "./unique";

export interface PatternData extends UniqueNamedData {
  gradients: {
    keyframes: string; // Base64 binary data representing an array of { time: byte, colorIndex: byte } tuples
  }[];
}
