import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MvpScreenHeader, MVP_C } from '../src/components/MvpScreenHeader';
import { useAuth } from '../src/context/AuthContext';
import { supabase } from '../src/lib/supabase';
import { PROFILE_EQUIPMENT_OPTIONS, normalizeEquipmentIds } from '../src/lib/profileEquipment';

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      <Text style={s.fieldValue}>{value}</Text>
    </View>
  );
}

export default function WorkoutDefaultsScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [equipLabel, setEquipLabel] = useState('—');

  const load = useCallback(async () => {
    if (!user?.id) {
      setEquipLabel('—');
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error: qErr } = await supabase
        .from('profiles')
        .select('available_equipment')
        .eq('id', user.id)
        .maybeSingle();
      if (qErr) {
        console.error('[workout-defaults] Supabase error:', qErr);
        setEquipLabel('Could not load');
      } else {
        const ids = normalizeEquipmentIds(data?.available_equipment);
        const labels = ids
          .map((id) => PROFILE_EQUIPMENT_OPTIONS.find((o) => o.id === id)?.label)
          .filter(Boolean) as string[];
        setEquipLabel(labels.length ? labels.join(', ') : 'Bodyweight (fallback)');
      }
    } catch (e) {
      console.error('[workout-defaults] exception:', e);
      setEquipLabel('—');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <MvpScreenHeader title="WORKOUT DEFAULTS" subtitle="Generator starting point" testID="workout-defaults-header" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <Text style={s.intro}>
          Defaults used when you open Generate Workout will sync with profile-backed preferences over time. For MVP, these
          are reference values plus your saved equipment.
        </Text>
        {!user?.id ? (
          <Text style={s.muted}>Sign in to view defaults.</Text>
        ) : loading ? (
          <View style={s.center}>
            <ActivityIndicator color={MVP_C.goldMid} />
            <Text style={s.muted}>Loading…</Text>
          </View>
        ) : (
          <View style={s.card}>
            <Field label="DEFAULT DURATION" value="20 min (balanced session)" />
            <Field label="DEFAULT DIFFICULTY" value="Medium" />
            <Field label="DEFAULT EQUIPMENT (PROFILE)" value={equipLabel} />
          </View>
        )}
        <Text style={s.note}>Editing defaults in one tap — coming soon.</Text>
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: MVP_C.bg },
  scroll: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 24 },
  intro: { color: MVP_C.textSec, fontSize: 14, lineHeight: 20, marginBottom: 16, fontWeight: '500' },
  center: { alignItems: 'center', paddingVertical: 20, gap: 10 },
  muted: { color: MVP_C.textSec, fontSize: 14, textAlign: 'center' },
  card: {
    backgroundColor: MVP_C.surface,
    borderWidth: 1,
    borderColor: MVP_C.borderSubtle,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  field: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: MVP_C.borderSubtle },
  fieldLabel: { fontSize: 10, fontWeight: '800', color: MVP_C.gold, letterSpacing: 1.2, marginBottom: 4 },
  fieldValue: { fontSize: 15, fontWeight: '600', color: MVP_C.offWhite },
  note: {
    marginTop: 20,
    textAlign: 'center',
    color: MVP_C.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
    fontWeight: '600',
  },
});
