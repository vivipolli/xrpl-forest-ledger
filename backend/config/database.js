const { Pool } = require("pg");

// Configure PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

// Test the connection
pool.connect((err, client, release) => {
  if (err) {
    console.error("Error connecting to PostgreSQL database:", err);
  } else {
    console.log("Connected to PostgreSQL database");
    release();
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
