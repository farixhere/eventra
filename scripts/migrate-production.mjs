import fs from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required to run production migrations.");

function splitSql(input) {
  const out = [];
  let start = 0, quote = null, dollar = null;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i], next = input[i + 1];
    if (dollar) {
      if (input.startsWith(dollar, i)) { i += dollar.length - 1; dollar = null; }
      continue;
    }
    if (quote) {
      if (ch === quote && input[i - 1] !== "\\") quote = null;
      continue;
    }
    if (ch === "'" || ch === '"') { quote = ch; continue; }
    if (ch === "$") {
      const m = input.slice(i).match(/^\$[A-Za-z_][A-Za-z0-9_]*\$/);
      if (m) { dollar = m[0]; i += m[0].length - 1; continue; }
      if (input.slice(i, i + 2) === "$$") { dollar = "$$"; i++; continue; }
    }
    if (ch === ";") {
      const statement = input.slice(start, i).trim();
      if (statement) out.push(statement);
      start = i + 1;
    }
  }
  const tail = input.slice(start).trim();
  if (tail) out.push(tail);
  return out;
}

const sql = neon(databaseUrl);
const migrations = [
  "006_phase1_core_integrity.sql",
  "007_eventra_domain_completion.sql",
  "008_production_security.sql"
];

for (const file of migrations) {
  const fullPath = path.join(process.cwd(), "db", "migrations", file);
  const contents = fs.readFileSync(fullPath, "utf8");
  const statements = splitSql(contents);
  console.log(`[eventra:migrate] ${file}: ${statements.length} statements`);
  for (const statement of statements) await sql.unsafe(statement);
  console.log(`[eventra:migrate] ${file}: complete`);
}
