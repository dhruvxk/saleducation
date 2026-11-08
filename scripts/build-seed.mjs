import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const collections = ["programs", "notices", "news", "events", "resources"];
const sqlString = (value) => `'${String(value).replaceAll("'", "''")}'`;

const inserts = [];
for (const collection of collections) {
  const entries = JSON.parse(await readFile(resolve(root, "content", `${collection}.json`), "utf8"));
  entries.forEach((entry, index) => {
    const { id, ...data } = entry;
    inserts.push(`INSERT OR IGNORE INTO content_items (collection, id, title, data_json, published, sort_order) VALUES (${sqlString(collection)}, ${sqlString(id)}, ${sqlString(entry.title)}, ${sqlString(JSON.stringify(data))}, 1, ${index});`);
  });
}

const output = `-- Generated from content/*.json by npm run db:seed:generate.\n${inserts.join("\n")}\n`;
await writeFile(resolve(root, "migrations", "0002_seed.sql"), output, "utf8");
process.stdout.write(`Wrote seed migration with ${inserts.length} content records.\n`);
