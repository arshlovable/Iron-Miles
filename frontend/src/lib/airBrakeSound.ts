import { Audio } from 'expo-av';

const AIR_SOUND = require('../../sound_assets/air-sound.mp3');

const VOLUME = 0.5;

let audioModeConfigured = false;
let cachedSound: Audio.Sound | null = null;
let loadPromise: Promise<Audio.Sound | null> | null = null;

async function ensureSound(): Promise<Audio.Sound | null> {
  if (cachedSound) return cachedSound;
  if (loadPromise) return loadPromise;

  loadPromise = (async (): Promise<Audio.Sound | null> => {
    try {
      if (!audioModeConfigured) {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: false,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        audioModeConfigured = true;
      }
    } catch {
      /* respect silent / OS — never surface */
    }

    try {
      const { sound } = await Audio.Sound.createAsync(AIR_SOUND, {
        shouldPlay: false,
        volume: VOLUME,
        isLooping: false,
      });
      cachedSound = sound;
      return sound;
    } catch {
      return null;
    } finally {
      loadPromise = null;
    }
  })();

  return loadPromise;
}

/** Fire-and-forget: subtle air-brake on press-in; no throw; skips if already playing. */
export function playAirBrakeRelease(): void {
  void (async () => {
    try {
      const sound = await ensureSound();
      if (!sound) return;

      const status = await sound.getStatusAsync();
      if (!status.isLoaded) return;
      if ('isPlaying' in status && status.isPlaying) return;

      await sound.setPositionAsync(0);
      await sound.playAsync();
    } catch {
      /* missing asset or platform — silent */
    }
  })();
}
