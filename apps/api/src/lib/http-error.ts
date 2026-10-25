export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export const unauthorized = (message = "Authentication required") =>
  new HttpError(401, message);

export const forbidden = (message = "You do not have access to this resource") =>
  new HttpError(403, message);

export const notFound = (message = "Resource not found") =>
  new HttpError(404, message);

export const conflict = (message: string) => new HttpError(409, message);
