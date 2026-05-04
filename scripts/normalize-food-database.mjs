/**
 * Merges raw Fuel JSON chunks and writes a single normalized food-database.json.
 * Run from repo root: node scripts/normalize-food-database.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const rawDir = path.join(root, 'frontend', 'src', 'data', 'fuel', 'raw');
const outPath = path.join(root, 'frontend', 'src', 'data', 'fuel', 'food-database.json');
const additionsPath = path.join(root, 'frontend', 'src', 'data', 'fuel', 'food-additions.json');

/** Deterministic meal | snack | drink (scores and tags unchanged). */
function inferType(category, item) {
  const name = item.name.toLowerCase();
  const tags = item.health_tags ?? [];
  const cal = item.macros?.calories ?? 0;

  if (tags.includes('hydration')) return 'drink';
  if (name.includes('sparkling water')) return 'drink';
  if (name.includes('electrolyte drink')) return 'drink';
  if (name.includes('protein shake') && name.includes('rtd')) return 'drink';
  if (name.includes('milk carton')) return 'drink';

  if (category === 'meal_prep') {
    if (name === 'tuna & crackers pack') return 'snack';
    if (name === 'egg muffin cups') return 'snack';
    if (name === 'veggie & hummus box') return 'snack';
    return 'meal';
  }

  if (category === 'gas_station_options') return 'snack';

  if (category === 'packaged_foods') {
    if (
      name.includes('microwave brown rice cup') ||
      name.includes('canned soup') ||
      name.includes('shelf-stable chicken salad kit') ||
      name.includes('instant mashed potatoes cup') ||
      name.includes('whole grain cereal cup')
    ) {
      return 'meal';
    }
    return 'snack';
  }

  if (category === 'restaurants') {
    if (name.includes('side salad')) return 'snack';
    if (name.includes('apple bites')) return 'snack';
    if (name.includes('green beans')) return 'snack';
    if (name.includes('soft taco')) return 'snack';
    return 'meal';
  }

  if (category === 'truck_stop_foods') {
    if (name.includes('grilled chicken breast plate')) return 'meal';
    if (name.includes('turkey burger')) return 'meal';
    if (name.includes('chicken caesar wrap')) return 'meal';
    if (name.includes('egg & cheese breakfast sandwich')) return 'meal';
    return 'snack';
  }

  return 'snack';
}

function normalizeItem(category, item, chain, location, id) {
  const truckAccess = item.truck_access != null ? item.truck_access : null;
  const storage = item.storage != null ? item.storage : null;
  const prepTime = item.prep_time != null ? item.prep_time : null;

  return {
    id,
    type: inferType(category, item),
    name: item.name,
    macros: item.macros,
    health_tags: item.health_tags,
    score: item.score,
    chain,
    location,
    truck_access: truckAccess,
    storage,
    prep_time: prepTime,
  };
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(rawDir, file), 'utf8'));
}

/** Overlay rows from food-additions.json; preserves id and type; aligns optional fields to DB conventions. */
function mergeFoodAdditions(out) {
  if (!fs.existsSync(additionsPath)) return;

  const additions = JSON.parse(fs.readFileSync(additionsPath, 'utf8'));
  if (!Array.isArray(additions) || additions.length === 0) return;

  for (const raw of additions) {
    const id = raw.id;
    let category;
    if (typeof id === 'string' && id.startsWith('fuel_restaurants_')) category = 'restaurants';
    else if (typeof id === 'string' && id.startsWith('fuel_truckstop_')) category = 'truck_stop_foods';
    else if (typeof id === 'string' && id.startsWith('fuel_packaged_')) category = 'packaged_foods';
    else if (typeof id === 'string' && id.startsWith('fuel_mealprep_')) category = 'meal_prep';
    else if (typeof id === 'string' && id.startsWith('fuel_gasstation_')) category = 'gas_station_options';
    else continue;

    let storage = raw.storage != null ? raw.storage : null;
    if (storage === 'shelf_stable') storage = 'shelf';

    let prepTime = raw.prep_time != null ? raw.prep_time : null;
    if (category === 'meal_prep' && typeof prepTime === 'number') {
      prepTime = `${prepTime} minutes`;
    }

    let truckAccess = raw.truck_access != null ? raw.truck_access : null;
    if (category !== 'restaurants') {
      truckAccess = null;
    }

    const item = {
      id: raw.id,
      type: raw.type,
      name: raw.name,
      macros: raw.macros,
      health_tags: raw.health_tags,
      score: raw.score,
      chain: raw.chain != null ? raw.chain : null,
      location: raw.location != null ? raw.location : null,
      truck_access: truckAccess,
      storage,
      prep_time: prepTime,
    };

    if (category === 'restaurants') {
      const chain = item.chain;
      if (!chain) continue;
      let group = out.restaurants.find((g) => g.chain === chain);
      if (!group) {
        group = { chain, items: [] };
        out.restaurants.push(group);
      }
      group.items.push(item);
    } else if (category === 'truck_stop_foods') {
      const loc = item.location;
      if (!loc) continue;
      let group = out.truck_stop_foods.find((g) => g.location === loc);
      if (!group) {
        group = { location: loc, items: [] };
        out.truck_stop_foods.push(group);
      }
      group.items.push(item);
    } else if (category === 'packaged_foods') {
      out.packaged_foods.push(item);
    } else if (category === 'meal_prep') {
      out.meal_prep.push(item);
    } else if (category === 'gas_station_options') {
      out.gas_station_options.push(item);
    }
  }
}

let idCounter = 0;
function nextId(category) {
  idCounter += 1;
  const p = category.replace(/_foods|_options/g, '').replace(/_/g, '');
  return `fuel_${p}_${String(idCounter).padStart(3, '0')}`;
}

const restaurantsDoc = readJson('restaurants.json');
const truckDoc = readJson('truck_stop_foods.json');
const packagedDoc = readJson('packaged_foods.json');
const mealDoc = readJson('meal_prep.json');
const gasDoc = readJson('gas_station_options.json');

const out = {
  meta: {
    version: 1,
    normalizedAt: new Date().toISOString().slice(0, 10),
    itemCount: 0,
  },
  restaurants: [],
  truck_stop_foods: [],
  packaged_foods: [],
  meal_prep: [],
  gas_station_options: [],
};

for (const group of restaurantsDoc.restaurants) {
  const chain = group.chain;
  const items = group.items.map((item) =>
    normalizeItem('restaurants', item, chain, null, nextId('restaurants')),
  );
  out.restaurants.push({ chain, items });
}

for (const group of truckDoc.truck_stop_foods) {
  const location = group.location;
  const items = group.items.map((item) =>
    normalizeItem('truck_stop_foods', item, null, location, nextId('truck_stop_foods')),
  );
  out.truck_stop_foods.push({ location, items });
}

out.packaged_foods = packagedDoc.packaged_foods.map((item) =>
  normalizeItem('packaged_foods', item, null, null, nextId('packaged_foods')),
);

out.meal_prep = mealDoc.meal_prep.map((item) =>
  normalizeItem('meal_prep', item, null, null, nextId('meal_prep')),
);

out.gas_station_options = gasDoc.gas_station_options.map((item) =>
  normalizeItem('gas_station_options', item, null, null, nextId('gas_station_options')),
);

mergeFoodAdditions(out);

const count =
  out.restaurants.reduce((n, g) => n + g.items.length, 0) +
  out.truck_stop_foods.reduce((n, g) => n + g.items.length, 0) +
  out.packaged_foods.length +
  out.meal_prep.length +
  out.gas_station_options.length;

out.meta.itemCount = count;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
console.log(`Wrote ${outPath} (${count} items)`);
