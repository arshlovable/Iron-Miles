/**
 * Reads frontend/src/data/fuel/food-database.json and writes supabase/seed_foods.sql
 * Run: node scripts/generate-foods-seed-sql.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const jsonPath = path.join(root, 'frontend', 'src', 'data', 'fuel', 'food-database.json');
const outPath = path.join(root, 'supabase', 'seed_foods.sql');

function sqlLiteral(str) {
  if (str == null) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

function sqlInt(val) {
  if (val == null || val === '' || Number.isNaN(Number(val))) return 'NULL';
  return String(Math.round(Number(val)));
}

function sqlTags(tags) {
  if (!tags || !Array.isArray(tags) || tags.length === 0) return `'{}'::text[]`;
  const parts = tags.map((t) => sqlLiteral(String(t).toLowerCase()));
  return `ARRAY[${parts.join(', ')}]::text[]`;
}

function flattenRows(db) {
  const rows = [];
  for (const g of db.restaurants ?? []) {
    for (const item of g.items ?? []) {
      rows.push({ category: 'restaurants', item });
    }
  }
  for (const g of db.truck_stop_foods ?? []) {
    for (const item of g.items ?? []) {
      rows.push({ category: 'truck_stop_foods', item });
    }
  }
  for (const item of db.packaged_foods ?? []) {
    rows.push({ category: 'packaged_foods', item });
  }
  for (const item of db.meal_prep ?? []) {
    rows.push({ category: 'meal_prep', item });
  }
  for (const item of db.gas_station_options ?? []) {
    rows.push({ category: 'gas_station_options', item });
  }
  return rows;
}

const db = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const flat = flattenRows(db);

const header = `-- Iron Miles foods seed (generated from food-database.json)
-- ${flat.length} rows

`;

const createTable = `create table if not exists public.foods (
  id text primary key,
  name text not null,
  type text not null check (type in ('meal', 'snack', 'drink')),
  category text not null,
  calories int,
  protein int,
  carbs int,
  fat int,
  tags text[],
  health_score int,
  convenience_score int,
  truck_access_score int,
  created_at timestamptz not null default now(),
  is_active boolean not null default true
);

`;

const valueLines = flat.map(({ category, item }) => {
  const m = item.macros ?? {};
  const s = item.score ?? {};
  const type = String(item.type ?? 'snack').toLowerCase();
  const cat = String(category).toLowerCase();
  const tags = (item.health_tags ?? []).map((t) => String(t).toLowerCase());
  return `  (${sqlLiteral(item.id)}, ${sqlLiteral(item.name)}, ${sqlLiteral(type)}, ${sqlLiteral(cat)}, ${sqlInt(m.calories)}, ${sqlInt(m.protein)}, ${sqlInt(m.carbs)}, ${sqlInt(m.fat)}, ${sqlTags(tags)}, ${sqlInt(s.health)}, ${sqlInt(s.convenience)}, ${sqlInt(s.truck_access)}, true)`;
});

const insert = `insert into public.foods (
  id,
  name,
  type,
  category,
  calories,
  protein,
  carbs,
  fat,
  tags,
  health_score,
  convenience_score,
  truck_access_score,
  is_active
) values
${valueLines.join(',\n')}
on conflict (id) do update set
  name = excluded.name,
  type = excluded.type,
  category = excluded.category,
  calories = excluded.calories,
  protein = excluded.protein,
  carbs = excluded.carbs,
  fat = excluded.fat,
  tags = excluded.tags,
  health_score = excluded.health_score,
  convenience_score = excluded.convenience_score,
  truck_access_score = excluded.truck_access_score,
  is_active = excluded.is_active;

`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, header + createTable + insert, 'utf8');
console.log(`Wrote ${outPath} (${flat.length} inserts)`);
