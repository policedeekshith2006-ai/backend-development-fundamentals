const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const { HttpError, notFound } = require("./lib/errors");
const {
  parseListQuery,
  parseBookId,
  parseBookBody,
  escapeLike,
} = require("./lib/validators");

const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, "books.db");

const app = express();
app.use(express.json());

let db; // set once the database is open (see start() at the bottom)

// ---------------------------------------------------------------
// Routes. Express 5 passes errors thrown inside async handlers to
// the error middleware, so no try/catch is needed in each route.
// ---------------------------------------------------------------

// GET /books/ : list with search, sorting, pagination and price range
app.get("/books/", async (req, res) => {
  const q = parseListQuery(req.query);

  // q.column and q.direction come from fixed lists in validators.js,
  // so they are safe to place in the SQL text. Every other value is
  // passed as a ? placeholder.
  const sql = `
    SELECT id, title, author, price, pages
    FROM book
    WHERE title LIKE ? ESCAPE '\\'
      AND price BETWEEN ? AND ?
    ORDER BY ${q.column} ${q.direction}, id ASC
    LIMIT ? OFFSET ?`;

  const books = await db.all(sql, [
    `%${escapeLike(q.search)}%`,
    q.minPrice,
    q.maxPrice,
    q.limit,
    q.offset,
  ]);
  res.status(200).json(books);
});

// GET /books/:bookId/ : one book
app.get("/books/:bookId/", async (req, res) => {
  const bookId = parseBookId(req.params.bookId);
  const book = await db.get(
    "SELECT id, title, author, price, pages FROM book WHERE id = ?",
    [bookId]
  );
  if (!book) throw notFound("Book not found");
  res.status(200).json(book);
});

// POST /books/ : create a book
app.post("/books/", async (req, res) => {
  const { title, author, price, pages } = parseBookBody(req.body);
  const result = await db.run(
    "INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?)",
    [title, author, price, pages]
  );
  res.status(201).json({ message: "Book added", bookId: result.lastID });
});

// PUT /books/:bookId/ : replace all fields of an existing book
app.put("/books/:bookId/", async (req, res) => {
  const bookId = parseBookId(req.params.bookId);
  const { title, author, price, pages } = parseBookBody(req.body);
  const result = await db.run(
    "UPDATE book SET title = ?, author = ?, price = ?, pages = ? WHERE id = ?",
    [title, author, price, pages, bookId]
  );
  if (result.changes === 0) throw notFound("Book not found");
  res.status(200).json({ message: "Book updated" });
});

// DELETE /books/:bookId/ : remove a book
app.delete("/books/:bookId/", async (req, res) => {
  const bookId = parseBookId(req.params.bookId);
  const result = await db.run("DELETE FROM book WHERE id = ?", [bookId]);
  if (result.changes === 0) throw notFound("Book not found");
  res.status(200).json({ message: "Book deleted" });
});

// ---------------------------------------------------------------
// Fallbacks: unknown route (404) and one error handler for the rest
// ---------------------------------------------------------------

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  // express.json() could not parse the body
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Request body is not valid JSON" });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message });
  }
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

// ---------------------------------------------------------------
// Start-up
// ---------------------------------------------------------------

async function start() {
  try {
    db = await open({ filename: DB_PATH, driver: sqlite3.Database });
  } catch (err) {
    console.error(`Cannot open the database: ${err.message}`);
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

  // For example EADDRINUSE when another program already uses the port
  server.on("error", (err) => {
    console.error(`Cannot start the server: ${err.message}`);
    process.exit(1);
  });
}

start();
