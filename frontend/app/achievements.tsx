import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MvpScreenHeader, MVP_C } from '../src/components/MvpScreenHeader';
import { useAuth } from '../src/context/AuthContext';
import { supabase } from '../src/lib/supabase';
import { MILESTONE_THRESHOLDS } from '../src/lib/milestones';

export default function AchievementsScreen() {
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
        console.error('[achievements] Supabase error:', qErr);
        setError('Could not load milestones.');
        setLifetime(0);
      } else {
        setLifetime(Math.max(0, Math.floor(Number(data?.lifetime_iron_miles ?? 0))));
      }
    } catch (e) {
      console.error('[achievements] exception:', e);
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <MvpScreenHeader title="ACHIEVEMENTS" subtitle="Mile markers" testID="achievements-back" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {!user?.id ? (
          <Text style={s.muted}>Sign in to view achievements.</Text>
        ) : loading ? (
          <View style={s.center}>
            <ActivityIndicator color={MVP_C.goldMid} />
            <Text style={s.muted}>Loading…</Text>
          </View>
        ) : error ? (
          <Text style={s.error}>{error}</Text>
        ) : (
          <>
            <Text style={s.kicker}>Lifetime: {lifetime.toLocaleString()} mi</Text>
            {MILESTONE_THRESHOLDS.map((m) => {
              const unlocked = lifetime >= m.miles;
              return (
                <View key={m.miles} style={[s.row, unlocked ? s.rowUnlocked : s.rowLocked]}>
                  <View style={[s.iconWrap, unlocked && s.iconWrapOn]}>
                    <MaterialCommunityIcons name={m.icon as any} size={22} color={unlocked ? MVP_C.goldMid : MVP_C.textMuted} />
                  </View>
                  <View style={s.rowBody}>
                    <Text style={s.rowTitle}>
                      {m.miles.toLocaleString()} — {m.title}
                    </Text>
                    <Text style={s.rowSub}>{unlocked ? 'Unlocked' : `Reach ${m.miles.toLocaleString()} lifetime miles`}</Text>
                  </View>
                  {unlocked ? (
                    <MaterialCommunityIcons name="check-decagram" size={22} color={MVP_C.greenLight} />
                  ) : (
                    <MaterialCommunityIcons name="lock-outline" size={20} color={MVP_C.textMuted} />
                  )}
                </View>
              );
            })}
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
  kicker: {
    fontSize: 12,
    fontWeight: '700',
    color: MVP_C.textSec,
    marginBottom: 14,
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  rowUnlocked: { backgroundColor: MVP_C.surface, borderColor: MVP_C.borderGold },
  rowLocked: { backgroundColor: MVP_C.surfaceEl, borderColor: MVP_C.borderSubtle },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: MVP_C.borderSubtle,
  },
  iconWrapOn: { borderColor: MVP_C.goldDim },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '800', color: MVP_C.offWhite, letterSpacing: 0.2 },
  rowSub: { fontSize: 12, color: MVP_C.textMuted, marginTop: 2 },
});
