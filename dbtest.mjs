import "dotenv/config";
import pg from "pg";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("NO DATABASE_URL in .env");
    process.exit(2);
  }

  const client = new pg.Client({
    connectionString: url,
    ssl: { require: true, rejectUnauthorized: false }, // ✅ fix here
  });

  try {
    await client.connect();
    const r = await client.query("select current_database(), current_user, version()");
    console.log("CONNECTED OK ->", r.rows[0]);
  } catch (e) {
    console.error("CONNECT FAILED ->", e.message);
  } finally {
    await client.end().catch(() => {});
  }
}

main();
