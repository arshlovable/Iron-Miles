import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';

const C = {
  bg: '#0C0B09',
  surface: '#13120F',
  surfaceEl: '#1C1A17',
  borderGold: '#5C4A1A',
  borderSubtle: '#2A2820',
  gold: '#E0C27C',
  goldBright: '#FFD700',
  goldMid: '#D4A843',
  goldDark: '#B89B5F',
  white: '#FFFFFF',
  offWhite: '#F0EADD',
  textSec: '#9A9080',
  textMuted: '#6B6355',
  greenLight: '#27503B',
  green: '#1F4037',
};

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isSignup = mode === 'signup';

  const submit = async () => {
    if (isSignup && !firstName.trim()) {
      Alert.alert('First Name Required', 'Enter your first name to set up your driver profile.');
      return;
    }
    if (!email.trim() || !password) {
      Alert.alert('Missing Details', 'Enter your email and password to continue.');
      return;
    }

    setSubmitting(true);
    try {
      if (isSignup) {
        await signUp(firstName, email, password);
      } else {
        await signIn(email, password);
      }
    } catch (error: any) {
      Alert.alert(isSignup ? 'Sign Up Failed' : 'Sign In Failed', error?.message || 'Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={s.keyboardWrap}
      >
        <View style={s.header}>
          <View style={s.logoWrap}>
            <MaterialCommunityIcons name="truck-fast" size={42} color={C.goldBright} />
          </View>
          <Text style={s.title}>IRON MILES</Text>
          <Text style={s.subtitle}>Sign in and keep your miles locked to your driver profile.</Text>
        </View>

        <View style={s.card}>
          <Text style={s.cardLabel}>{isSignup ? 'CREATE DRIVER PROFILE' : 'WELCOME BACK'}</Text>

          {isSignup ? (
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First name"
              placeholderTextColor={C.textMuted}
              autoCapitalize="words"
              style={s.input}
            />
          ) : null}

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={C.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
            style={s.input}
          />
          <View style={s.passwordRow}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={C.textMuted}
              secureTextEntry={!showPassword}
              textContentType={isSignup ? 'newPassword' : 'password'}
              style={s.passwordInput}
            />
            <TouchableOpacity
              onPress={() => setShowPassword((v) => !v)}
              style={s.eyeBtn}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            >
              <MaterialCommunityIcons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={C.textSec}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity disabled={submitting} onPress={submit} activeOpacity={0.85}>
            <LinearGradient
              colors={[C.greenLight, C.green]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[s.primaryBtn, submitting && s.primaryBtnDisabled]}
            >
              {submitting ? (
                <ActivityIndicator color={C.white} />
              ) : (
                <Text style={s.primaryBtnText}>{isSignup ? 'CREATE ACCOUNT' : 'SIGN IN'}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setMode(isSignup ? 'signin' : 'signup')}
            style={s.switchBtn}
            activeOpacity={0.7}
          >
            <Text style={s.switchText}>
              {isSignup ? 'Already have an account? Sign in' : 'Need an account? Create one'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  keyboardWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoWrap: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2,
    borderColor: C.borderGold,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    color: C.gold,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 4,
  },
  subtitle: {
    color: C.textSec,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 8,
    maxWidth: 310,
  },
  card: {
    backgroundColor: C.surface,
    borderColor: C.borderGold,
    borderWidth: 1.5,
    borderRadius: 8,
    padding: 18,
  },
  cardLabel: {
    color: C.goldDark,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 14,
    textAlign: 'center',
  },
  input: {
    height: 52,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.borderSubtle,
    backgroundColor: C.surfaceEl,
    color: C.offWhite,
    paddingHorizontal: 14,
    marginBottom: 10,
    fontSize: 15,
  },
  passwordRow: {
    height: 52,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.borderSubtle,
    backgroundColor: C.surfaceEl,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    marginBottom: 10,
  },
  passwordInput: {
    flex: 1,
    color: C.offWhite,
    fontSize: 15,
    height: '100%',
  },
  eyeBtn: {
    width: 44,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    height: 56,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: C.goldMid,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  primaryBtnDisabled: {
    opacity: 0.65,
  },
  primaryBtnText: {
    color: C.white,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 2,
  },
  switchBtn: {
    alignItems: 'center',
    paddingTop: 16,
  },
  switchText: {
    color: C.goldMid,
    fontSize: 13,
    fontWeight: '700',
  },
});
