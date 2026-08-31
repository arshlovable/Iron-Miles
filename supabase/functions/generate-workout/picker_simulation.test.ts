/**
 * Simulates the two-phase equipment pick contract for regression checks.
 */
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { allowsBodyweightBackfill } from "./equipment_selection.ts";

type MockExercise = { id: string; name: string; equipment_type: string };

function simulateTwoPhasePick(
  primaryPool: MockExercise[],
  backfillPool: MockExercise[],
  needed: number,
  allowBackfill: boolean,
): { selected: MockExercise[]; primaryCount: number; backfillCount: number } {
  const phase1 = primaryPool.slice(0, needed);
  const primaryCount = phase1.length;

  if (!allowBackfill || phase1.length >= needed) {
    return { selected: phase1, primaryCount, backfillCount: 0 };
  }

  const remaining = needed - phase1.length;
  const usedIds = new Set(phase1.map((e) => e.id));
  const phase2 = backfillPool.filter((e) => !usedIds.has(e.id)).slice(0, remaining);

  return {
    selected: [...phase1, ...phase2],
    primaryCount,
    backfillCount: phase2.length,
  };
}

const DUMBBELLS: MockExercise[] = Array.from({ length: 13 }, (_, i) => ({
  id: `db-${i}`,
  name: `Dumbbell Exercise ${i}`,
  equipment_type: "dumbbells",
}));

const BODYWEIGHT: MockExercise[] = Array.from({ length: 20 }, (_, i) => ({
  id: `bw-${i}`,
  name: `Bodyweight Exercise ${i}`,
  equipment_type: "bodyweight",
}));

Deno.test("10 min dumbbells-only: no backfill, all primary", () => {
  const allowBackfill = allowsBodyweightBackfill({ duration_minutes: 10, equipment_selected: ["dumbbells"] });
  const result = simulateTwoPhasePick(DUMBBELLS, BODYWEIGHT, 4, allowBackfill);

  assertEquals(allowBackfill, false);
  assertEquals(result.primaryCount, 4);
  assertEquals(result.backfillCount, 0);
  assertEquals(result.selected.every((e) => e.equipment_type === "dumbbells"), true);
});

Deno.test("30 min dumbbells-only with small pool: hybrid fill", () => {
  const smallDumbbellPool = DUMBBELLS.slice(0, 5);
  const allowBackfill = allowsBodyweightBackfill({ duration_minutes: 30, equipment_selected: ["dumbbells"] });
  const result = simulateTwoPhasePick(smallDumbbellPool, BODYWEIGHT, 8, allowBackfill);

  assertEquals(result.primaryCount, 5);
  assertEquals(result.backfillCount, 3);
  assertEquals(result.selected.length, 8);
  assertEquals(result.selected.filter((e) => e.equipment_type === "dumbbells").length, 5);
  assertEquals(result.selected.filter((e) => e.equipment_type === "bodyweight").length, 3);
  assertEquals(result.selected.slice(0, 5).every((e) => e.equipment_type === "dumbbells"), true);
});
