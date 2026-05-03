import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

export type PrimaryCtaPressableProps = Omit<PressableProps, 'style'> & {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Merged into the animated inner wrapper (e.g. flex row for card CTAs). */
  animatedWrapStyle?: StyleProp<ViewStyle>;
};

const SCALE_DOWN = 0.966;
const PRESS_IN_MS = 100;
const PRESS_OUT_MS = 150;
const PRESS_OUT_EASING = Easing.out(Easing.quad);
/** Subtle “into the dash” shift — reads as depth without changing colors. */
const TRANSLATE_Y = 1.5;

export function PrimaryCtaPressable({
  children,
  style,
  animatedWrapStyle,
  disabled,
  onPressIn,
  onPressOut,
  ...rest
}: PrimaryCtaPressableProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (disabled) {
      scaleAnim.stopAnimation();
      translateYAnim.stopAnimation();
      scaleAnim.setValue(1);
      translateYAnim.setValue(0);
    }
  }, [disabled, scaleAnim, translateYAnim]);

  const runPressIn = useCallback(() => {
    if (disabled) return;
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: SCALE_DOWN,
        duration: PRESS_IN_MS,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: TRANSLATE_Y,
        duration: PRESS_IN_MS,
        useNativeDriver: true,
      }),
    ]).start();
  }, [disabled, scaleAnim, translateYAnim]);

  const runPressOut = useCallback(() => {
    if (disabled) return;
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: PRESS_OUT_MS,
        easing: PRESS_OUT_EASING,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: PRESS_OUT_MS,
        easing: PRESS_OUT_EASING,
        useNativeDriver: true,
      }),
    ]).start();
  }, [disabled, scaleAnim, translateYAnim]);

  const handlePressIn = useCallback(
    (e: GestureResponderEvent) => {
      runPressIn();
      onPressIn?.(e);
    },
    [onPressIn, runPressIn]
  );

  const handlePressOut = useCallback(
    (e: GestureResponderEvent) => {
      runPressOut();
      onPressOut?.(e);
    },
    [onPressOut, runPressOut]
  );

  return (
    <Pressable
      {...rest}
      disabled={disabled}
      style={style}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          {
            transform: [{ translateY: translateYAnim }, { scale: scaleAnim }],
          },
          animatedWrapStyle,
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}
