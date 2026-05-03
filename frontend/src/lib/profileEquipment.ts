/** Profile `available_equipment` jsonb: array of string slugs (aligned with generate-workout + backpack). */

export const PROFILE_EQUIPMENT_OPTIONS = [
  { id: 'bodyweight', label: 'Bodyweight' },
  { id: 'bands', label: 'Resistance Bands' },
  { id: 'dumbbells', label: 'Dumbbells' },
  { id: 'backpack', label: 'Backpack' },
] as const;

export type ProfileEquipmentId = (typeof PROFILE_EQUIPMENT_OPTIONS)[number]['id'];

const KNOWN = new Set<string>(PROFILE_EQUIPMENT_OPTIONS.map((o) => o.id));

export function normalizeEquipmentIds(raw: unknown): ProfileEquipmentId[] {
  if (raw == null) return [];
  if (!Array.isArray(raw)) return [];
  const out: ProfileEquipmentId[] = [];
  for (const x of raw) {
    const id = String(x).toLowerCase().trim();
    if (KNOWN.has(id) && !out.includes(id as ProfileEquipmentId)) {
      out.push(id as ProfileEquipmentId);
    }
  }
  return out;
}

export function equipmentIdsForSave(selected: ProfileEquipmentId[]): string[] {
  return PROFILE_EQUIPMENT_OPTIONS.map((o) => o.id).filter((id) => selected.includes(id as ProfileEquipmentId));
}
