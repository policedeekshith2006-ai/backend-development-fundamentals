CREATE TABLE book (
  id INTEGER PRIMARY KEY,
  title TEXT,
  author TEXT,
  price INTEGER,
  pages INTEGER
);

INSERT INTO book (title, author, price, pages) VALUES
  ('To Kill a Mockingbird', 'Harper Lee', 399, 336),
  ('1984', 'George Orwell', 299, 328),
  ('The Great Gatsby', 'F. Scott Fitzgerald', 250, 180),
  ('Pride and Prejudice', 'Jane Austen', 220, 279),
  ('The Catcher in the Rye', 'J. D. Salinger', 350, 234),
  ('The Hobbit', 'J. R. R. Tolkien', 450, 310),
  ('Brave New World', 'Aldous Huxley', 320, 268),
  ('Crime and Punishment', 'Fyodor Dostoevsky', 499, 545),
  ('The Pragmatic Programmer', 'Andrew Hunt, David Thomas', 850, 352),
  ('Introduction to Algorithms', 'Thomas H. Cormen', 1200, 1312);

