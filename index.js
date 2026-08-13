const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/items", async (_req, res) => {
  const { rows } = await pool.query("SELECT id, name, created_at FROM items ORDER BY id DESC");
  res.json(rows);
});

app.post("/api/items", async (req, res) => {
  const { name } = req.body;
  const { rows } = await pool.query(
    "INSERT INTO items (name) VALUES ($1) RETURNING id, name, created_at",
    [name]
  );
  res.status(201).json(rows[0]);
});

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

const port = process.env.PORT || 3000;

ensureSchema()
  .then(() => {
    app.listen(port, () => {
      console.log(`api listening on ${port}`);
    });
  })
  .catch((err) => {
    console.error("failed to initialize schema", err);
    process.exit(1);
  });
