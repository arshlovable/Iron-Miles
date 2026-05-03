import AsyncStorage from '@react-native-async-storage/async-storage';

const WEIGHT = 'iron_miles_pref_weight_unit';
const DISTANCE = 'iron_miles_pref_distance_unit';

export type WeightUnit = 'lbs' | 'kg';
export type DistanceUnit = 'miles' | 'km';

export async function getWeightUnit(): Promise<WeightUnit> {
  const v = await AsyncStorage.getItem(WEIGHT);
  return v === 'kg' ? 'kg' : 'lbs';
}

export async function getDistanceUnit(): Promise<DistanceUnit> {
  const v = await AsyncStorage.getItem(DISTANCE);
  return v === 'km' ? 'km' : 'miles';
}

export async function setWeightUnit(u: WeightUnit): Promise<void> {
  await AsyncStorage.setItem(WEIGHT, u);
}

export async function setDistanceUnit(u: DistanceUnit): Promise<void> {
  await AsyncStorage.setItem(DISTANCE, u);
}
