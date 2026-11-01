const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3");

const databasePath = path.join(__dirname, "books.db");
const seedScriptPath = path.join(__dirname, "seed.sql");

// If books.db already exists, remove it to rebuild from a clean state
if (fs.existsSync(databasePath)) {
  fs.unlinkSync(databasePath);
  console.log("Existing books.db removed.");
}

// Read the SQL seed file
const seedSql = fs.readFileSync(seedScriptPath, "utf8");

// Connect to SQLite database file
const database = new sqlite3.Database(databasePath, (error) => {
  if (error) {
    console.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
});

// Execute the seed script containing table creation and initial book rows
database.exec(seedSql, (error) => {
  if (error) {
    console.error(`Error executing seed.sql: ${error.message}`);
    database.close();
    process.exit(1);
  }

  // Verify that the table was created and rows were inserted
  database.all("SELECT id, title, author, price, pages FROM book ORDER BY id ASC;", (queryError, rows) => {
    if (queryError) {
      console.error(`Error verifying table: ${queryError.message}`);
      database.close();
      process.exit(1);
    }

    console.log(`Database successfully built from seed.sql! (${rows.length} rows inserted)`);
    database.close();
  });
});

