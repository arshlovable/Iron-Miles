import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MvpScreenHeader, MVP_C } from '../src/components/MvpScreenHeader';
import { useAuth } from '../src/context/AuthContext';
import { supabase } from '../src/lib/supabase';

type SessionRow = {
  id: string;
  completed_at: string | null;
  iron_miles_earned: number | null;
  status: string | null;
  generated_workouts: { title?: string | null; duration_minutes?: number | null; target_area?: string | null } | null;
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '—';
  }
}

function titleFromRow(row: SessionRow): string {
  const g = row.generated_workouts;
  if (g?.title) return g.title;
  if (g?.target_area) return g.target_area.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return 'Workout';
}

export default function WorkoutLogScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<SessionRow[]>([]);

  const load = useCallback(async () => {
    if (!user?.id) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: qErr } = await supabase
        .from('workout_sessions')
        .select('id, completed_at, iron_miles_earned, status, generated_workouts(title, duration_minutes, target_area)')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(50);
      if (qErr) {
        console.error('[workout-log] Supabase error:', qErr);
        setError('Could not load workout history.');
        setRows([]);
      } else {
        setRows((data as SessionRow[]) ?? []);
      }
    } catch (e) {
      console.error('[workout-log] exception:', e);
      setError('Something went wrong.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <MvpScreenHeader title="WORKOUT LOG" subtitle="Highway exits" testID="workout-log-back" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {!user?.id ? (
          <Text style={s.muted}>Sign in to see completed runs.</Text>
        ) : loading ? (
          <View style={s.center}>
            <ActivityIndicator color={MVP_C.goldMid} />
            <Text style={s.muted}>Loading…</Text>
          </View>
        ) : error ? (
          <Text style={s.error}>{error}</Text>
        ) : rows.length === 0 ? (
          <Text style={s.empty}>No highway exits logged yet.</Text>
        ) : (
          rows.map((row) => {
            const dur = row.generated_workouts?.duration_minutes;
            const durLabel = typeof dur === 'number' && dur > 0 ? `${dur} min` : '—';
            return (
              <View key={row.id} style={s.card}>
                <Text style={s.cardTitle}>{titleFromRow(row)}</Text>
                <View style={s.metaRow}>
                  <Text style={s.meta}>{formatDate(row.completed_at)}</Text>
                  <Text style={s.metaDot}> · </Text>
                  <Text style={s.meta}>+{Number(row.iron_miles_earned ?? 0)} mi</Text>
                  <Text style={s.metaDot}> · </Text>
                  <Text style={s.meta}>{durLabel}</Text>
                </View>
                <Text style={s.status}>Completed</Text>
              </View>
            );
          })
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
  error: { color: MVP_C.goldDark, textAlign: 'center', marginTop: 12, fontWeight: '600' },
  empty: {
    color: MVP_C.textSec,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 32,
    fontWeight: '600',
    lineHeight: 22,
  },
  card: {
    backgroundColor: MVP_C.surface,
    borderWidth: 1,
    borderColor: MVP_C.borderSubtle,
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: MVP_C.offWhite, marginBottom: 6 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 },
  meta: { fontSize: 12, color: MVP_C.textSec, fontWeight: '600' },
  metaDot: { fontSize: 12, color: MVP_C.textMuted },
  status: { fontSize: 11, fontWeight: '800', color: MVP_C.greenLight, letterSpacing: 1 },
});
