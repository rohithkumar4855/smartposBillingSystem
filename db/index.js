// const { Pool } = require("pg");
// require("dotenv").config();

// const pool = new Pool({
//   user: process.env.DB_USER,
//   host: process.env.DB_HOST,
//   database: process.env.DB_NAME,
//   password: process.env.DB_PASSWORD,
//   port: process.env.DB_PORT,
  
// });

// module.exports = pool;

const { Pool } = require("pg");
const dotenv = require("dotenv");
dotenv.config();

// 🧠 Check environment variables
console.log("🔍 DB Config:", {
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD ? "*****" : "(missing)",
  port: process.env.DB_PORT,
});

if (!process.env.DB_PASSWORD || typeof process.env.DB_PASSWORD !== "string") {
  console.error("❌ ERROR: DB_PASSWORD is missing or not a string in .env");
  process.exit(1);
}

const pool = new Pool({
  user: process.env.DB_USER,
  host: "localhost",
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD, // must be a string
  port: Number(process.env.DB_PORT),
});

pool.connect()
  .then(() => console.log("✅ Connected to PostgreSQL"))
  .catch((err) => console.error("❌ Database connection error:", err));

module.exports = pool;
