export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const notFound = (what = 'Resource') => new ApiError(404, `${what} not found`);
