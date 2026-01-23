/**
 * Custom error classes for the application
 */

export class UnsupportedCurrencyError extends Error {
  constructor(
    public currency: string,
    public userMessage: string
  ) {
    super(`Currency not supported: ${currency}`)
    this.name = "UnsupportedCurrencyError"
    Object.setPrototypeOf(this, UnsupportedCurrencyError.prototype)
  }
}
