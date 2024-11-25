class ExhaustiveCaseError extends Error {
  constructor(message: string, value: never) {
    super(`${message}: ${value}`);
  }
}

export default ExhaustiveCaseError;
