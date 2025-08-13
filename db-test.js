import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

client.connect()
  .then(() => console.log("✅ Connected to database successfully!"))
  .catch(err => console.error("❌ Failed to connect:", err))
  .finally(() => client.end());
