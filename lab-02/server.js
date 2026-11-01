const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
const PORT = process.env.PORT || 3000;
const databasePath = path.join(__dirname, "books.db");

// Middleware to parse JSON bodies
app.use(express.json());

let database = null;

// Initialize SQLite database and start the Express server
const initializeDatabaseAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(`Database initialization error: ${error.message}`);
    process.exit(1);
  }
};

initializeDatabaseAndServer();

// Helper function to validate and parse book ID
const parseBookId = (bookIdParam) => {
  const numericId = Number(bookIdParam);
  if (!Number.isInteger(numericId) || numericId <= 0 || String(numericId) !== String(bookIdParam).trim()) {
    return null;
  }
  return numericId;
};

// Helper function to validate book payload for POST and PUT
const validateBookData = (body) => {
  if (!body || typeof body !== "object") {
    return "Request body must be a valid JSON object";
  }

  const { title, author, price, pages } = body;

  if (typeof title !== "string" || title.trim().length === 0) {
    return "Title is required and must be non-empty text";
  }

  if (typeof author !== "string" || author.trim().length === 0) {
    return "Author is required and must be non-empty text";
  }

  if (typeof price !== "number" || !Number.isInteger(price) || price < 0) {
    return "Price is required and must be a non-negative whole number";
  }

  if (typeof pages !== "number" || !Number.isInteger(pages) || pages <= 0) {
    return "Pages is required and must be a positive whole number";
  }

  return null;
};

// 1. GET /books/ - Returns all books
app.get(["/books", "/books/"], async (request, response) => {
  try {
    const getAllBooksQuery = "SELECT * FROM book ORDER BY id ASC;";
    const books = await database.all(getAllBooksQuery);
    response.status(200).json(books);
  } catch (error) {
    console.error(`Error retrieving books: ${error.message}`);
    response.status(500).json({ error: "Internal server error" });
  }
});

// 2. GET /books/:bookId/ - Returns one book by ID
app.get(["/books/:bookId", "/books/:bookId/"], async (request, response) => {
  try {
    const bookId = parseBookId(request.params.bookId);
    if (bookId === null) {
      return response.status(400).json({ error: "Book ID must be a positive whole number" });
    }

    const getBookQuery = "SELECT * FROM book WHERE id = ?;";
    const book = await database.get(getBookQuery, [bookId]);

    if (!book) {
      return response.status(404).json({ error: "Book not found" });
    }

    response.status(200).json(book);
  } catch (error) {
    console.error(`Error retrieving book ${request.params.bookId}: ${error.message}`);
    response.status(500).json({ error: "Internal server error" });
  }
});

// 3. POST /books/ - Adds a new book
app.post(["/books", "/books/"], async (request, response) => {
  try {
    const validationError = validateBookData(request.body);
    if (validationError) {
      return response.status(400).json({ error: validationError });
    }

    const { title, author, price, pages } = request.body;
    const insertBookQuery = `
      INSERT INTO book (title, author, price, pages)
      VALUES (?, ?, ?, ?);
    `;

    const result = await database.run(insertBookQuery, [
      title.trim(),
      author.trim(),
      price,
      pages,
    ]);

    response.status(201).json({
      message: "Book added successfully",
      bookId: result.lastID,
    });
  } catch (error) {
    console.error(`Error creating book: ${error.message}`);
    response.status(500).json({ error: "Internal server error" });
  }
});

// 4. PUT /books/:bookId/ - Updates all fields of an existing book
app.put(["/books/:bookId", "/books/:bookId/"], async (request, response) => {
  try {
    const bookId = parseBookId(request.params.bookId);
    if (bookId === null) {
      return response.status(400).json({ error: "Book ID must be a positive whole number" });
    }

    const validationError = validateBookData(request.body);
    if (validationError) {
      return response.status(400).json({ error: validationError });
    }

    const { title, author, price, pages } = request.body;
    const updateBookQuery = `
      UPDATE book
      SET title = ?, author = ?, price = ?, pages = ?
      WHERE id = ?;
    `;

    const result = await database.run(updateBookQuery, [
      title.trim(),
      author.trim(),
      price,
      pages,
      bookId,
    ]);

    if (result.changes === 0) {
      return response.status(404).json({ error: "Book not found" });
    }

    response.status(200).json({ message: "Book updated successfully" });
  } catch (error) {
    console.error(`Error updating book ${request.params.bookId}: ${error.message}`);
    response.status(500).json({ error: "Internal server error" });
  }
});

// 5. DELETE /books/:bookId/ - Deletes a book by ID
app.delete(["/books/:bookId", "/books/:bookId/"], async (request, response) => {
  try {
    const bookId = parseBookId(request.params.bookId);
    if (bookId === null) {
      return response.status(400).json({ error: "Book ID must be a positive whole number" });
    }

    const deleteBookQuery = "DELETE FROM book WHERE id = ?;";
    const result = await database.run(deleteBookQuery, [bookId]);

    if (result.changes === 0) {
      return response.status(404).json({ error: "Book not found" });
    }

    response.status(200).json({ message: "Book deleted successfully" });
  } catch (error) {
    console.error(`Error deleting book ${request.params.bookId}: ${error.message}`);
    response.status(500).json({ error: "Internal server error" });
  }
});

// Handle undefined routes
app.use((request, response) => {
  response.status(404).json({ error: "Route not found" });
});

// Global error handler for malformed JSON and unexpected server errors
app.use((error, request, response, next) => {
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return response.status(400).json({ error: "Malformed JSON payload in request body" });
  }

  const statusCode = error.status || 500;
  console.error(`Unhandled error: ${error.message}`);
  response.status(statusCode).json({
    error: statusCode === 500 ? "Internal server error" : error.message,
  });
});

