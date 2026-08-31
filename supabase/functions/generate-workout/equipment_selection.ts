export type EquipmentSelectionPayload = {
  duration_minutes: number;
  equipment_selected: string[];
};

/** Bodyweight backfill only for 20+ min sessions when user did not select bodyweight. */
export function allowsBodyweightBackfill(payload: EquipmentSelectionPayload): boolean {
  if (payload.duration_minutes < 20) return false;
  if (payload.equipment_selected.includes("bodyweight")) return false;
  return payload.equipment_selected.length > 0;
}

export function equipmentMatchMulti(
  exerciseEquipment: string | null | undefined,
  selected: string[],
): boolean {
  if (selected.length === 0) return true;
  const rowEq = String(exerciseEquipment ?? "").toLowerCase().trim();
  return selected.includes(rowEq) || selected.includes("full");
}
