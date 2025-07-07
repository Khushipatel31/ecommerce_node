class CustomError extends Error {
  httpStatusCode;
  message;

  constructor(httpStatusCode, message) {
    super(message);
    this.httpStatusCode = httpStatusCode;
    this.message = message;
  }
}

export const CustomHttpError = CustomError;
