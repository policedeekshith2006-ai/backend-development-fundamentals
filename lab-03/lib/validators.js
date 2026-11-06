const { badRequest } = require("./errors");

// Sort keys the client may use, mapped to the real column name.
// Looking the key up in this object means the client's text is never
// pasted into the SQL: only our own constant string is.
const SORT_COLUMNS = {
  id: "id",
  title: "title",
  author: "author",
  price: "price",
  pages: "pages",
};

const LIMITS = {
  defaultLimit: 10,
  maxLimit: 100,
  maxNumber: 2147483647,
};

// Query values arrive as text. Returns the single string value,
// or undefined when the parameter is absent / empty.
function single(query, name) {
  const value = query[name];
  if (value === undefined || value === "") return undefined;
  if (typeof value !== "string") {
    throw badRequest(`${name} must be given only once`);
  }
  return value.trim();
}

// Accepts only digit strings such as "0", "25", "300".
// Number("") is 0 and Number("1e3") is 1000, so a plain Number() check
// would let odd input through; a regular expression does not.
function wholeNumber(query, name, fallback, min, max) {
  const text = single(query, name);
  if (text === undefined) return fallback;
  if (!/^\d+$/.test(text)) {
    throw badRequest(`${name} must be a whole number from ${min} to ${max}`);
  }
  const value = parseInt(text, 10);
  if (value < min || value > max) {
    throw badRequest(`${name} must be a whole number from ${min} to ${max}`);
  }
  return value;
}

// Reads and checks every query parameter of GET /books/.
function parseListQuery(query) {
  const search = single(query, "search_q") ?? "";

  const sortKey = (single(query, "order_by") ?? "id").toLowerCase();
  if (!Object.hasOwn(SORT_COLUMNS, sortKey)) {
    throw badRequest(
      `order_by must be one of: ${Object.keys(SORT_COLUMNS).join(", ")}`
    );
  }

  const direction = (single(query, "order") ?? "ASC").toUpperCase();
  if (direction !== "ASC" && direction !== "DESC") {
    throw badRequest("order must be ASC or DESC");
  }

  const limit = wholeNumber(query, "limit", LIMITS.defaultLimit, 1, LIMITS.maxLimit);
  const offset = wholeNumber(query, "offset", 0, 0, LIMITS.maxNumber);
  const minPrice = wholeNumber(query, "min_price", 0, 0, LIMITS.maxNumber);
  const maxPrice = wholeNumber(query, "max_price", LIMITS.maxNumber, 0, LIMITS.maxNumber);

  if (minPrice > maxPrice) {
    throw badRequest("min_price cannot be greater than max_price");
  }

  return {
    search,
    column: SORT_COLUMNS[sortKey],
    direction,
    limit,
    offset,
    minPrice,
    maxPrice,
  };
}

// :bookId must be a positive whole number.
function parseBookId(text) {
  if (!/^\d+$/.test(text) || parseInt(text, 10) < 1) {
    throw badRequest("bookId must be a positive whole number");
  }
  return parseInt(text, 10);
}

// Checks the JSON body used by POST and PUT and returns clean values.
function parseBookBody(body) {
  const data = body && typeof body === "object" ? body : {};

  const text = (field) => {
    const value = data[field];
    if (typeof value !== "string" || value.trim() === "") {
      throw badRequest(`${field} is required and must be non-empty text`);
    }
    return value.trim();
  };

  const count = (field) => {
    const value = data[field];
    if (!Number.isInteger(value) || value < 0) {
      throw badRequest(`${field} is required and must be a whole number, 0 or more`);
    }
    return value;
  };

  return {
    title: text("title"),
    author: text("author"),
    price: count("price"),
    pages: count("pages"),
  };
}

// LIKE treats % and _ as wildcards. Put a backslash in front of them
// (and of the backslash itself) so the search text is matched literally.
function escapeLike(text) {
  return text.replace(/[\\%_]/g, "\\$&");
}

module.exports = {
  parseListQuery,
  parseBookId,
  parseBookBody,
  escapeLike,
  SORT_COLUMNS,
};
