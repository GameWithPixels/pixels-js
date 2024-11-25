class ParsingError extends Error {
  constructor(
    message: string,
    notation: string,
    token: string,
    position: number
  ) {
    super(
      `${message}: ${token} at position ${position - token.length}\n` +
        `${notation}\n` +
        " ".repeat(position - 1) +
        "^"
    );
  }
}
export default ParsingError;
