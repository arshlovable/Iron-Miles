import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MvpScreenHeader, MVP_C } from '../src/components/MvpScreenHeader';
import { useAuth } from '../src/context/AuthContext';
import { supabase } from '../src/lib/supabase';
import { MILESTONE_THRESHOLDS } from '../src/lib/milestones';

export default function MilestoneAlertsScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lifetime, setLifetime] = useState(0);

  const load = useCallback(async () => {
    if (!user?.id) {
      setLifetime(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: qErr } = await supabase
        .from('profiles')
        .select('lifetime_iron_miles')
        .eq('id', user.id)
        .maybeSingle();
      if (qErr) {
        console.error('[milestone-alerts] Supabase error:', qErr);
        setError('Could not load milestones.');
        setLifetime(0);
      } else {
        setLifetime(Math.max(0, Math.floor(Number(data?.lifetime_iron_miles ?? 0))));
      }
    } catch (e) {
      console.error('[milestone-alerts] exception:', e);
      setError('Something went wrong.');
      setLifetime(0);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const latestAchieved = [...MILESTONE_THRESHOLDS].reverse().find((m) => lifetime >= m.miles) ?? null;
  const nextUp = MILESTONE_THRESHOLDS.find((m) => lifetime < m.miles) ?? null;
  const milesToNext = nextUp ? Math.max(0, nextUp.miles - lifetime) : 0;

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <MvpScreenHeader title="MILESTONE ALERTS" subtitle="Iron Miles markers" testID="milestone-alerts-header" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {!user?.id ? (
          <Text style={s.muted}>Sign in to view milestones.</Text>
        ) : loading ? (
          <View style={s.center}>
            <ActivityIndicator color={MVP_C.goldMid} />
            <Text style={s.muted}>Loading…</Text>
          </View>
        ) : error ? (
          <Text style={s.error}>{error}</Text>
        ) : (
          <>
            <View style={s.card}>
              <Text style={s.cardLabel}>LIFETIME IRON MILES</Text>
              <Text style={s.cardBig}>{lifetime}</Text>
            </View>
            <View style={s.card}>
              <Text style={s.cardLabel}>LATEST MILESTONE REACHED</Text>
              {latestAchieved ? (
                <>
                  <Text style={s.cardTitle}>{latestAchieved.title}</Text>
                  <Text style={s.cardSub}>Unlocked at {latestAchieved.miles.toLocaleString()} mi</Text>
                </>
              ) : (
                <Text style={s.body}>No milestone badges yet. Keep hauling — your first marker is at 100 mi (Rolling Start).</Text>
              )}
            </View>
            <View style={s.card}>
              <Text style={s.cardLabel}>NEXT MILESTONE</Text>
              {nextUp ? (
                <>
                  <Text style={s.cardTitle}>{nextUp.title}</Text>
                  <Text style={s.cardSub}>
                    {nextUp.miles.toLocaleString()} mi · {milesToNext.toLocaleString()} mi to go
                  </Text>
                </>
              ) : (
                <Text style={s.body}>You have reached the top marker in the app. Legend status.</Text>
              )}
            </View>
            <View style={s.callout}>
              <Text style={s.calloutTitle}>ALERTS</Text>
              <Text style={s.calloutBody}>
                Push notifications when you unlock a new milestone are coming soon. You can always see full progress under
                Achievements in the menu.
              </Text>
            </View>
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
  error: { color: MVP_C.goldDark, textAlign: 'center', marginTop: 12, fontWeight: '600' },
  card: {
    backgroundColor: MVP_C.surface,
    borderWidth: 1,
    borderColor: MVP_C.borderSubtle,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  cardLabel: { fontSize: 10, fontWeight: '800', color: MVP_C.gold, letterSpacing: 1.2, marginBottom: 8 },
  cardBig: { fontSize: 28, fontWeight: '800', color: MVP_C.offWhite },
  cardTitle: { fontSize: 17, fontWeight: '800', color: MVP_C.offWhite },
  cardSub: { fontSize: 13, color: MVP_C.textSec, marginTop: 6 },
  body: { fontSize: 14, color: MVP_C.textSec, lineHeight: 20 },
  callout: {
    marginTop: 4,
    padding: 14,
    backgroundColor: MVP_C.surfaceEl,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: MVP_C.borderGold,
  },
  calloutTitle: { fontSize: 10, fontWeight: '800', color: MVP_C.gold, letterSpacing: 2, marginBottom: 8 },
  calloutBody: { fontSize: 13, color: MVP_C.textSec, lineHeight: 19 },
});
