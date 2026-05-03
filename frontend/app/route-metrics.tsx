import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MvpScreenHeader, MVP_C } from '../src/components/MvpScreenHeader';
import { useAuth } from '../src/context/AuthContext';
import { supabase } from '../src/lib/supabase';

function StatBlock({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <View style={s.block}>
      <Text style={s.blockLabel}>{label}</Text>
      <Text style={s.blockValue}>{value}</Text>
      {hint ? <Text style={s.blockHint}>{hint}</Text> : null}
    </View>
  );
}

export default function RouteMetricsScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lifetime, setLifetime] = useState(0);
  const [completedTotal, setCompletedTotal] = useState(0);
  const [milesWeek, setMilesWeek] = useState(0);
  const [workoutsWeek, setWorkoutsWeek] = useState(0);

  const load = useCallback(async () => {
    if (!user?.id) {
      setLifetime(0);
      setCompletedTotal(0);
      setMilesWeek(0);
      setWorkoutsWeek(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const weekAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    try {
      const [profileRes, countRes, weeklyMilesRes, weeklyWorkoutsRes] = await Promise.all([
        supabase.from('profiles').select('lifetime_iron_miles').eq('id', user.id).maybeSingle(),
        supabase
          .from('workout_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'completed'),
        supabase.from('iron_miles_log').select('miles_amount, created_at').eq('user_id', user.id).gte('created_at', weekAgoIso),
        supabase
          .from('workout_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .gte('completed_at', weekAgoIso),
      ]);

      if (profileRes.error) console.error('[route-metrics] profile error:', profileRes.error);
      if (countRes.error) console.error('[route-metrics] count error:', countRes.error);
      if (weeklyMilesRes.error) console.error('[route-metrics] weekly miles error:', weeklyMilesRes.error);
      if (weeklyWorkoutsRes.error) console.error('[route-metrics] weekly workouts error:', weeklyWorkoutsRes.error);

      if (profileRes.error || countRes.error || weeklyMilesRes.error || weeklyWorkoutsRes.error) {
        setError('Some stats could not be loaded.');
      } else {
        setError(null);
      }

      setLifetime(Math.max(0, Math.floor(Number(profileRes.data?.lifetime_iron_miles ?? 0))));
      setCompletedTotal(countRes.count ?? 0);

      const weeklyRows = weeklyMilesRes.data ?? [];
      const sumMiles = weeklyRows.reduce((acc, r) => acc + Number(r.miles_amount ?? 0), 0);
      setMilesWeek(sumMiles);
      setWorkoutsWeek(weeklyWorkoutsRes.count ?? 0);
    } catch (e) {
      console.error('[route-metrics] exception:', e);
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const avgWeekly =
    workoutsWeek > 0 ? (milesWeek / workoutsWeek).toFixed(1) : workoutsWeek === 0 && milesWeek > 0 ? milesWeek.toFixed(1) : '—';
  const avgHint =
    workoutsWeek > 0
      ? 'Avg Iron Miles per completed workout this week (rolling 7 days).'
      : 'Complete a workout this week to see an average.';

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <MvpScreenHeader title="ROUTE METRICS" subtitle="Stats at a glance" testID="route-metrics-back" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {!user?.id ? (
          <Text style={s.muted}>Sign in to view metrics.</Text>
        ) : loading ? (
          <View style={s.center}>
            <ActivityIndicator color={MVP_C.goldMid} />
            <Text style={s.muted}>Loading…</Text>
          </View>
        ) : (
          <>
            {error ? <Text style={s.warn}>{error}</Text> : null}
            <StatBlock label="LIFETIME IRON MILES" value={lifetime.toLocaleString()} />
            <StatBlock label="COMPLETED WORKOUTS (ALL TIME)" value={String(completedTotal)} />
            <StatBlock label="IRON MILES THIS WEEK" value={milesWeek.toLocaleString()} hint="Rolling 7 days from iron_miles_log." />
            <StatBlock label="WORKOUTS THIS WEEK" value={String(workoutsWeek)} hint="Completed sessions in the last 7 days." />
            <StatBlock label="AVG MI / WORKOUT (THIS WEEK)" value={avgWeekly === '—' ? '—' : `${avgWeekly} mi`} hint={avgHint} />
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
  warn: { color: MVP_C.goldDark, textAlign: 'center', marginBottom: 12, fontSize: 12, fontWeight: '600' },
  block: {
    backgroundColor: MVP_C.surface,
    borderWidth: 1,
    borderColor: MVP_C.borderSubtle,
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
  },
  blockLabel: { fontSize: 10, fontWeight: '800', color: MVP_C.gold, letterSpacing: 1.2, marginBottom: 6 },
  blockValue: { fontSize: 22, fontWeight: '900', color: MVP_C.offWhite },
  blockHint: { fontSize: 11, color: MVP_C.textMuted, marginTop: 6, lineHeight: 15 },
});
