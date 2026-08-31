import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { normalizeOnboardingGoal } from '../lib/onboardingGoals';

const ONBOARDING_STORAGE_KEY = 'iron_miles_onboarding_v1_complete';

// Safe AsyncStorage accessor — mirrors pattern in supabase.ts
let AsyncStorage: { getItem: (k: string) => Promise<string | null>; setItem: (k: string, v: string) => Promise<void> } | null = null;
if (Platform.OS !== 'web') {
  try {
    AsyncStorage = require('@react-native-async-storage/async-storage').default;
  } catch {
    AsyncStorage = null;
  }
}

async function readFlag(): Promise<boolean> {
  try {
    if (AsyncStorage) {
      const val = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
      return val === 'true';
    }
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
    }
  } catch {
    // ignore storage errors
  }
  return false;
}

async function writeFlag(): Promise<void> {
  try {
    if (AsyncStorage) {
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      return;
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    }
  } catch {
    // ignore storage errors
  }
}

export type OnboardingAnswers = {
  goal: string | null;
  equipment: string[];
  preferredWorkoutTime: string | null;
  driverType: string | null;
};

type OnboardingContextValue = {
  answers: OnboardingAnswers;
  setGoal: (goal: string) => void;
  setEquipment: (equipment: string[]) => void;
  setPreferredWorkoutTime: (time: string) => void;
  setDriverType: (type: string) => void;
  markOnboardingComplete: () => Promise<void>;
  flushToProfile: (userId: string) => Promise<void>;
  onboardingComplete: boolean;
  onboardingLoading: boolean;
};

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [onboardingLoading, setOnboardingLoading] = useState(true);
  const [answers, setAnswers] = useState<OnboardingAnswers>({
    goal: null,
    equipment: [],
    preferredWorkoutTime: null,
    driverType: null,
  });

  useEffect(() => {
    readFlag().then((complete) => {
      setOnboardingComplete(complete);
      setOnboardingLoading(false);
    });
  }, []);

  const setGoal = useCallback((goal: string) => {
    setAnswers((prev) => ({ ...prev, goal }));
  }, []);

  const setEquipment = useCallback((equipment: string[]) => {
    setAnswers((prev) => ({ ...prev, equipment }));
  }, []);

  const setPreferredWorkoutTime = useCallback((preferredWorkoutTime: string) => {
    setAnswers((prev) => ({ ...prev, preferredWorkoutTime }));
  }, []);

  const setDriverType = useCallback((driverType: string) => {
    setAnswers((prev) => ({ ...prev, driverType }));
  }, []);

  const markOnboardingComplete = useCallback(async () => {
    await writeFlag();
    setOnboardingComplete(true);
  }, []);

  const flushToProfile = useCallback(async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          primary_goal: normalizeOnboardingGoal(answers.goal),
          available_equipment: answers.equipment.length ? answers.equipment : ['bodyweight'],
          preferred_workout_time: answers.preferredWorkoutTime,
          truck_type: answers.driverType,
        })
        .eq('id', userId);
      if (error) {
        console.warn('[Onboarding] flushToProfile error:', error);
      } else {
        console.log('[Onboarding] flushToProfile success for uid:', userId);
      }
    } catch (e) {
      console.warn('[Onboarding] flushToProfile exception:', e);
    }
  }, [answers]);

  const value = useMemo(
    () => ({
      answers,
      setGoal,
      setEquipment,
      setPreferredWorkoutTime,
      setDriverType,
      markOnboardingComplete,
      flushToProfile,
      onboardingComplete,
      onboardingLoading,
    }),
    [answers, setGoal, setEquipment, setPreferredWorkoutTime, setDriverType, markOnboardingComplete, flushToProfile, onboardingComplete, onboardingLoading]
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return ctx;
}
