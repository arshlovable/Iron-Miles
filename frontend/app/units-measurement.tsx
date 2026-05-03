import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MvpScreenHeader, MVP_C } from '../src/components/MvpScreenHeader';
import {
  getWeightUnit,
  setWeightUnit,
  getDistanceUnit,
  setDistanceUnit,
  type WeightUnit,
  type DistanceUnit,
} from '../src/lib/localPreferences';

function SegRow<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={s.block}>
      <Text style={s.blockLabel}>{label}</Text>
      <View style={s.segRow}>
        {options.map((o) => {
          const active = value === o.id;
          return (
            <TouchableOpacity
              key={o.id}
              style={[s.segBtn, active && s.segBtnOn]}
              onPress={() => onChange(o.id)}
              activeOpacity={0.75}
            >
              <Text style={[s.segBtnText, active && s.segBtnTextOn]}>{o.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function UnitsMeasurementScreen() {
  const [loading, setLoading] = useState(true);
  const [weight, setWeight] = useState<WeightUnit>('lbs');
  const [distance, setDistance] = useState<DistanceUnit>('miles');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [w, d] = await Promise.all([getWeightUnit(), getDistanceUnit()]);
      setWeight(w);
      setDistance(d);
    } catch (e) {
      console.error('[units-measurement] load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onWeight = async (u: WeightUnit) => {
    setWeight(u);
    try {
      await setWeightUnit(u);
    } catch (e) {
      console.error('[units-measurement] save weight:', e);
    }
  };

  const onDistance = async (u: DistanceUnit) => {
    setDistance(u);
    try {
      await setDistanceUnit(u);
    } catch (e) {
      console.error('[units-measurement] save distance:', e);
    }
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <MvpScreenHeader title="UNITS & MEASUREMENT" subtitle="Display preferences" testID="units-header" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <Text style={s.intro}>
          Units are stored on this device only for now. Workout and Fuel screens will respect these as we expand the app.
        </Text>
        {loading ? (
          <View style={s.center}>
            <ActivityIndicator color={MVP_C.goldMid} />
          </View>
        ) : (
          <>
            <SegRow
              label="WEIGHT"
              options={[
                { id: 'lbs', label: 'lb' },
                { id: 'kg', label: 'kg' },
              ]}
              value={weight}
              onChange={onWeight}
            />
            <SegRow
              label="DISTANCE"
              options={[
                { id: 'miles', label: 'Miles' },
                { id: 'km', label: 'Kilometers' },
              ]}
              value={distance}
              onChange={onDistance}
            />
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
  intro: { color: MVP_C.textSec, fontSize: 14, lineHeight: 20, marginBottom: 20, fontWeight: '500' },
  center: { paddingVertical: 24 },
  block: { marginBottom: 22 },
  blockLabel: { fontSize: 10, fontWeight: '800', color: MVP_C.gold, letterSpacing: 1.4, marginBottom: 10 },
  segRow: { flexDirection: 'row', gap: 10 },
  segBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: MVP_C.borderSubtle,
    backgroundColor: MVP_C.surface,
    alignItems: 'center',
  },
  segBtnOn: {
    borderColor: MVP_C.greenLight,
    backgroundColor: MVP_C.ctaGreen,
  },
  segBtnText: { fontSize: 15, fontWeight: '700', color: MVP_C.textMuted },
  segBtnTextOn: { color: MVP_C.offWhite },
});
