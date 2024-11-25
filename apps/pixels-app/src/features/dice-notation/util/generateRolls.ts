import { Random } from "./random";

const createGenerateRolls =
  (random: Random) =>
  (numDice: number, diceSize: number): number[] => {
    const rolls = [];
    for (let i = 0; i < numDice; i++) {
      rolls.push(random(1, diceSize));
    }
    return rolls;
  };

export default createGenerateRolls;
