import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MvpScreenHeader, MVP_C } from '../src/components/MvpScreenHeader';
import { useAuth } from '../src/context/AuthContext';
import { supabase } from '../src/lib/supabase';
import {
  PROFILE_EQUIPMENT_OPTIONS,
  type ProfileEquipmentId,
  normalizeEquipmentIds,
  equipmentIdsForSave,
} from '../src/lib/profileEquipment';

export default function EquipmentSetupScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ProfileEquipmentId[]>([]);

  const load = useCallback(async () => {
    if (!user?.id) {
      setSelected([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: qErr } = await supabase
        .from('profiles')
        .select('available_equipment')
        .eq('id', user.id)
        .maybeSingle();
      if (qErr) {
        console.error('[equipment-setup] Supabase error:', qErr);
        setError('Could not load equipment.');
        setSelected(['bodyweight']);
      } else {
        const norm = normalizeEquipmentIds(data?.available_equipment);
        setSelected(norm.length ? norm : ['bodyweight']);
      }
    } catch (e) {
      console.error('[equipment-setup] exception:', e);
      setError('Something went wrong.');
      setSelected(['bodyweight']);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const persist = async (next: ProfileEquipmentId[]) => {
    if (!user?.id) return;
    const toSave = next.length ? equipmentIdsForSave(next) : ['bodyweight'];
    setSaving(true);
    setError(null);
    try {
      const { error: uErr } = await supabase
        .from('profiles')
        .update({ available_equipment: toSave })
        .eq('id', user.id);
      if (uErr) {
        console.error('[equipment-setup] update error:', uErr);
        setError('Could not save. Try again.');
        await load();
        return;
      }
      setSelected(normalizeEquipmentIds(toSave));
    } catch (e) {
      console.error('[equipment-setup] save exception:', e);
      setError('Could not save.');
      await load();
    } finally {
      setSaving(false);
    }
  };

  const toggle = (id: ProfileEquipmentId, on: boolean) => {
    let next: ProfileEquipmentId[];
    if (on) {
      next = selected.includes(id) ? selected : [...selected, id];
    } else {
      next = selected.filter((x) => x !== id);
      if (next.length === 0) next = ['bodyweight'];
    }
    setSelected(next);
    void persist(next);
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <MvpScreenHeader title="EQUIPMENT SETUP" subtitle="Gear in the cab" testID="equipment-setup-header" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {!user?.id ? (
          <Text style={s.muted}>Sign in to manage equipment.</Text>
        ) : loading ? (
          <View style={s.center}>
            <ActivityIndicator color={MVP_C.goldMid} />
            <Text style={s.muted}>Loading…</Text>
          </View>
        ) : (
          <>
            <Text style={s.intro}>
              Choose what you usually have on the road. This is saved to your profile and lines up with workout generation.
            </Text>
            {PROFILE_EQUIPMENT_OPTIONS.map((opt) => {
              const on = selected.includes(opt.id);
              return (
                <View key={opt.id} style={s.row}>
                  <View style={s.rowText}>
                    <Text style={s.rowLabel}>{opt.label}</Text>
                  </View>
                  <Switch
                    value={on}
                    onValueChange={(v) => toggle(opt.id, v)}
                    disabled={saving}
                    trackColor={{ false: MVP_C.surfaceEl, true: MVP_C.greenLight }}
                    thumbColor={on ? MVP_C.goldMid : MVP_C.textMuted}
                  />
                </View>
              );
            })}
            {error ? <Text style={s.error}>{error}</Text> : null}
            <Text style={s.note}>More gear options may arrive in a future update.</Text>
          </>
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: MVP_C.bg },
  scroll: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 24 },
  center: { alignItems: 'center', paddingVertical: 24, gap: 10 },
  muted: { color: MVP_C.textSec, fontSize: 14, textAlign: 'center', marginTop: 8 },
  intro: { color: MVP_C.textSec, fontSize: 14, lineHeight: 20, marginBottom: 16, fontWeight: '500' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: MVP_C.surface,
    borderWidth: 1,
    borderColor: MVP_C.borderSubtle,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  rowText: { flex: 1, paddingRight: 12 },
  rowLabel: { fontSize: 15, fontWeight: '700', color: MVP_C.offWhite },
  error: { color: MVP_C.goldDark, textAlign: 'center', marginTop: 12, fontWeight: '600' },
  note: { marginTop: 16, textAlign: 'center', color: MVP_C.textMuted, fontSize: 12, fontStyle: 'italic' },
});
