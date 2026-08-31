import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  allowsBodyweightBackfill,
  equipmentMatchMulti,
} from "./equipment_selection.ts";

Deno.test("allowsBodyweightBackfill: false for 10 min dumbbells-only", () => {
  assertEquals(
    allowsBodyweightBackfill({ duration_minutes: 10, equipment_selected: ["dumbbells"] }),
    false,
  );
});

Deno.test("allowsBodyweightBackfill: false for 15 min dumbbells-only", () => {
  assertEquals(
    allowsBodyweightBackfill({ duration_minutes: 15, equipment_selected: ["dumbbells"] }),
    false,
  );
});

Deno.test("allowsBodyweightBackfill: true for 30 min dumbbells-only", () => {
  assertEquals(
    allowsBodyweightBackfill({ duration_minutes: 30, equipment_selected: ["dumbbells"] }),
    true,
  );
});

Deno.test("allowsBodyweightBackfill: true for 20 min bands-only", () => {
  assertEquals(
    allowsBodyweightBackfill({ duration_minutes: 20, equipment_selected: ["bands"] }),
    true,
  );
});

Deno.test("allowsBodyweightBackfill: false when bodyweight already selected", () => {
  assertEquals(
    allowsBodyweightBackfill({ duration_minutes: 30, equipment_selected: ["dumbbells", "bodyweight"] }),
    false,
  );
});

Deno.test("allowsBodyweightBackfill: false when equipment list empty", () => {
  assertEquals(
    allowsBodyweightBackfill({ duration_minutes: 30, equipment_selected: [] }),
    false,
  );
});

Deno.test("equipmentMatchMulti: matches dumbbells slug", () => {
  assertEquals(equipmentMatchMulti("dumbbells", ["dumbbells"]), true);
  assertEquals(equipmentMatchMulti("Dumbbells", ["dumbbells"]), true);
});

Deno.test("equipmentMatchMulti: does not match when only dumbbells selected", () => {
  assertEquals(equipmentMatchMulti("bodyweight", ["dumbbells"]), false);
  assertEquals(equipmentMatchMulti("bands", ["dumbbells"]), false);
});

Deno.test("equipmentMatchMulti: ANY-match for multi-select", () => {
  assertEquals(equipmentMatchMulti("bodyweight", ["dumbbells", "bodyweight"]), true);
  assertEquals(equipmentMatchMulti("dumbbells", ["dumbbells", "bodyweight"]), true);
});

Deno.test("equipmentMatchMulti: empty selection matches all", () => {
  assertEquals(equipmentMatchMulti("bodyweight", []), true);
});
