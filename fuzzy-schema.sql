CREATE TABLE insects (
  id SERIAL PRIMARY KEY,
  species VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) CHECK (price >= 0),
  url_image TEXT NOT NULL
);


CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  delivery_address TEXT NOT NULL,
  submit_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total NUMERIC(10, 2),
  items JSONB NOT NULL, -- Assuming items are stored as a JSON array of IDs referencing insects
  user_order_id INTEGER  
);


CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(25) NOT NULL,
  password TEXT NOT NULL,
  email TEXT NOT NULL CHECK (position('@' IN email) > 1),
  orders INTEGER[] NOT NULL -- Array to reference multiple orders per user
);