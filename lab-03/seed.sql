DROP TABLE IF EXISTS book;

CREATE TABLE book (
  id INTEGER PRIMARY KEY,
  title TEXT,
  author TEXT,
  price INTEGER,
  pages INTEGER
);

INSERT INTO book (title, author, price, pages) VALUES
  ('The Alchemist', 'Paulo Coelho', 299, 208),
  ('Wings of Fire', 'A. P. J. Abdul Kalam', 350, 180),
  ('The White Tiger', 'Aravind Adiga', 399, 321),
  ('Atomic Habits', 'James Clear', 499, 320),
  ('Sapiens', 'Yuval Noah Harari', 599, 443),
  ('The Guide', 'R. K. Narayan', 275, 220),
  ('Ikigai', 'Hector Garcia', 350, 208),
  ('Rich Dad Poor Dad', 'Robert Kiyosaki', 450, 336),
  ('The Psychology of Money', 'Morgan Housel', 399, 252),
  ('Think and Grow Rich', 'Napoleon Hill', 250, 320),
  ('The God of Small Things', 'Arundhati Roy', 450, 340),
  ('Malgudi Days', 'R. K. Narayan', 225, 256);
