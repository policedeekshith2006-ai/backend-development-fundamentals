// An error that knows which HTTP status code it should produce.
// Routes throw it; the error middleware in app.js turns it into JSON.
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

const badRequest = (message) => new HttpError(400, message);
const notFound = (message) => new HttpError(404, message);

module.exports = { HttpError, badRequest, notFound };
