export type Operator = "+" | "-" | "/" | "*";

export const getPrecedence = (op: Operator) => {
  if (op === "+" || op === "-") {
    return 2;
  } else {
    return 1;
  }
};
