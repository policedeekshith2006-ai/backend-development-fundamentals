// Run with: npm test   (no packages needed, uses Node's built-in assert)
const assert = require("assert");
const {
  parseListQuery,
  parseBookId,
  parseBookBody,
  escapeLike,
} = require("../lib/validators");

let passed = 0;
const check = (name, fn) => {
  fn();
  passed += 1;
  console.log(`ok  ${name}`);
};
const rejects = (fn, message) =>
  assert.throws(fn, (e) => e.status === 400 && (!message || e.message.includes(message)));

check("defaults are applied", () => {
  const q = parseListQuery({});
  assert.deepStrictEqual(
    [q.search, q.column, q.direction, q.limit, q.offset, q.minPrice],
    ["", "id", "ASC", 10, 0, 0]
  );
});
check("all parameters accepted together", () => {
  const q = parseListQuery({
    search_q: "the", order_by: "Price", order: "desc",
    limit: "5", offset: "2", min_price: "100", max_price: "500",
  });
  assert.strictEqual(q.column, "price");
  assert.strictEqual(q.direction, "DESC");
  assert.strictEqual(q.limit, 5);
  assert.strictEqual(q.maxPrice, 500);
});
check("order_by outside the whitelist is rejected", () =>
  rejects(() => parseListQuery({ order_by: "price; DROP TABLE book" }), "order_by"));
check("order_by prototype keys are rejected", () =>
  rejects(() => parseListQuery({ order_by: "constructor" }), "order_by"));
check("order SIDEWAYS is rejected", () =>
  rejects(() => parseListQuery({ order: "SIDEWAYS" }), "order"));
check("limit 0 rejected", () => rejects(() => parseListQuery({ limit: "0" }), "limit"));
check("limit 101 rejected", () => rejects(() => parseListQuery({ limit: "101" }), "limit"));
check("limit abc rejected", () => rejects(() => parseListQuery({ limit: "abc" }), "limit"));
check("limit 1e1 rejected", () => rejects(() => parseListQuery({ limit: "1e1" }), "limit"));
check("limit -3 rejected", () => rejects(() => parseListQuery({ limit: "-3" }), "limit"));
check("offset -1 rejected", () => rejects(() => parseListQuery({ offset: "-1" }), "offset"));
check("min_price > max_price rejected", () =>
  rejects(() => parseListQuery({ min_price: "900", max_price: "100" }), "min_price"));
check("repeated parameter rejected", () =>
  rejects(() => parseListQuery({ limit: ["1", "2"] }), "only once"));
check("empty parameter uses default", () =>
  assert.strictEqual(parseListQuery({ limit: "" }).limit, 10));

check("bookId 7 ok", () => assert.strictEqual(parseBookId("7"), 7));
check("bookId abc rejected", () => rejects(() => parseBookId("abc")));
check("bookId 0 rejected", () => rejects(() => parseBookId("0")));
check("bookId -2 rejected", () => rejects(() => parseBookId("-2")));
check("bookId 1.5 rejected", () => rejects(() => parseBookId("1.5")));

const good = { title: " Dune ", author: "Frank Herbert", price: 499, pages: 612 };
check("valid body is trimmed and accepted", () =>
  assert.deepStrictEqual(parseBookBody(good), { ...good, title: "Dune" }));
check("missing body rejected", () => rejects(() => parseBookBody(undefined), "title"));
check("missing title rejected", () =>
  rejects(() => parseBookBody({ ...good, title: undefined }), "title"));
check("blank title rejected", () =>
  rejects(() => parseBookBody({ ...good, title: "   " }), "title"));
check("missing author rejected", () =>
  rejects(() => parseBookBody({ ...good, author: undefined }), "author"));
check("price as text rejected", () =>
  rejects(() => parseBookBody({ ...good, price: "abc" }), "price"));
check("price as numeric text rejected", () =>
  rejects(() => parseBookBody({ ...good, price: "500" }), "price"));
check("negative price rejected", () =>
  rejects(() => parseBookBody({ ...good, price: -5 }), "price"));
check("decimal price rejected", () =>
  rejects(() => parseBookBody({ ...good, price: 9.5 }), "price"));
check("missing pages rejected", () =>
  rejects(() => parseBookBody({ ...good, pages: undefined }), "pages"));

check("escapeLike escapes % _ and backslash", () =>
  assert.strictEqual(escapeLike("50%_a\\b"), "50\\%\\_a\\\\b"));

console.log(`\n${passed} checks passed`);
