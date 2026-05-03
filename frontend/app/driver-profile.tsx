import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MvpScreenHeader, MVP_C } from '../src/components/MvpScreenHeader';
import { useAuth } from '../src/context/AuthContext';
import { supabase } from '../src/lib/supabase';

type ProfileRow = {
  full_name: string | null;
  primary_goal: string | null;
  experience_level: string | null;
  truck_type: string | null;
  available_equipment: unknown;
  lifetime_iron_miles: number | null;
};

function formatEquipment(raw: unknown): string {
  if (raw == null) return '—';
  if (Array.isArray(raw)) {
    const parts = raw.filter((x) => typeof x === 'string') as string[];
    return parts.length ? parts.join(', ') : '—';
  }
  if (typeof raw === 'object') return JSON.stringify(raw);
  return String(raw);
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      <Text style={s.fieldValue}>{value}</Text>
    </View>
  );
}

export default function DriverProfileScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [row, setRow] = useState<ProfileRow | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) {
      setRow(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: qErr } = await supabase
        .from('profiles')
        .select('full_name, primary_goal, experience_level, truck_type, available_equipment, lifetime_iron_miles')
        .eq('id', user.id)
        .maybeSingle();
      if (qErr) {
        console.error('[driver-profile] Supabase error:', qErr);
        setError('Could not load profile.');
        setRow(null);
      } else {
        setRow((data as ProfileRow) ?? null);
      }
    } catch (e) {
      console.error('[driver-profile] exception:', e);
      setError('Something went wrong.');
      setRow(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const display = (v: string | null | undefined) => (v && String(v).trim() ? v : '—');

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <MvpScreenHeader title="DRIVER PROFILE" subtitle="Your cab card" testID="driver-profile-back" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {!user?.id ? (
          <Text style={s.muted}>Sign in to view your profile.</Text>
        ) : loading ? (
          <View style={s.center}>
            <ActivityIndicator color={MVP_C.goldMid} />
            <Text style={s.muted}>Loading…</Text>
          </View>
        ) : error ? (
          <Text style={s.error}>{error}</Text>
        ) : !row ? (
          <Text style={s.muted}>Profile unavailable. Try again later.</Text>
        ) : (
          <View style={s.card}>
            <Field label="NAME" value={display(row.full_name)} />
            <Field label="PRIMARY GOAL" value={display(row.primary_goal)} />
            <Field label="EXPERIENCE LEVEL" value={display(row.experience_level)} />
            <Field label="TRUCK TYPE" value={display(row.truck_type)} />
            <Field label="AVAILABLE EQUIPMENT" value={formatEquipment(row.available_equipment)} />
            <Field label="LIFETIME IRON MILES" value={String(Math.max(0, Math.floor(Number(row.lifetime_iron_miles ?? 0))))} />
          </View>
        )}
        <Text style={s.editNote}>Edit profile — coming soon</Text>
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
  error: { color: MVP_C.goldDark, textAlign: 'center', marginTop: 12, fontWeight: '600' },
  card: {
    backgroundColor: MVP_C.surface,
    borderWidth: 1,
    borderColor: MVP_C.borderSubtle,
    borderRadius: 8,
    padding: 14,
    gap: 0,
  },
  field: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: MVP_C.borderSubtle },
  fieldLabel: { fontSize: 10, fontWeight: '800', color: MVP_C.gold, letterSpacing: 1.2, marginBottom: 4 },
  fieldValue: { fontSize: 15, fontWeight: '600', color: MVP_C.offWhite },
  editNote: {
    marginTop: 20,
    textAlign: 'center',
    color: MVP_C.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
    fontWeight: '600',
  },
});
