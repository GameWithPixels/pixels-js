import "@expo/browser-polyfill";
import { parseRollEquation, ThreeDDiceAPI } from "dddice-js";

export async function dddice() {
  try {
    const api = new ThreeDDiceAPI("");
    console.log("ThreeDDiceAPI created");
    api.connect("");
    console.log("Connected to 3D Dice API");
    const { dice } = parseRollEquation("1d20", "dddice-bees");
    const rollResult = await api.roll.create(dice);
    console.log("Roll result:", JSON.stringify(rollResult));
  } catch (e) {
    console.log(`Error: ${e}`);
    console.log("Error:" + JSON.stringify(e));
  }
}
