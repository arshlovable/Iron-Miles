import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MvpScreenHeader, MVP_C } from '../src/components/MvpScreenHeader';

type TermsSection = {
  number: number;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

const SECTIONS: TermsSection[] = [
  {
    number: 1,
    title: 'Use of the App',
    paragraphs: [
      'Iron Miles is designed to help truck drivers and other users access fitness routines, workout tracking, fuel tracking, progress tools, and related wellness features.',
      'You agree to use the app only for lawful purposes and in a way that does not harm the app, other users, or our services.',
    ],
  },
  {
    number: 2,
    title: 'Health and Fitness Disclaimer',
    paragraphs: [
      'Iron Miles provides fitness and wellness information for educational and informational purposes only.',
      'Iron Miles does not provide medical advice, diagnosis, or treatment.',
      'You should consult a qualified healthcare professional before beginning any exercise program, especially if you have any medical condition, injury, pain, or health concern.',
      'You are responsible for exercising safely and within your own limits.',
      'Stop exercising immediately if you feel pain, dizziness, shortness of breath, or any unusual discomfort.',
    ],
  },
  {
    number: 3,
    title: 'No Guarantee of Results',
    paragraphs: [
      'Iron Miles may help support fitness, consistency, and healthier habits, but we do not guarantee specific results.',
      'Your results may vary based on your effort, health condition, schedule, nutrition, sleep, consistency, and other factors.',
    ],
  },
  {
    number: 4,
    title: 'User Account',
    paragraphs: [
      'Some features may require an account.',
      'You are responsible for keeping your account information accurate and secure.',
      'You are responsible for all activity that occurs under your account.',
    ],
  },
  {
    number: 5,
    title: 'User Data',
    paragraphs: [
      'Your use of Iron Miles is also governed by our Privacy Policy.',
      'By using the app, you agree that we may collect and use information as described in the Privacy Policy.',
    ],
  },
  {
    number: 6,
    title: 'Subscriptions and Payments',
    paragraphs: [
      'Iron Miles may offer paid features, subscriptions, or premium plans.',
      'If you purchase a subscription through the Apple App Store or Google Play Store, billing, renewal, cancellation, and refunds are handled by the respective app store according to their policies.',
      'You are responsible for managing or canceling your subscription through your app store account settings.',
    ],
  },
  {
    number: 7,
    title: 'Acceptable Use',
    paragraphs: ['You agree not to:'],
    bullets: [
      'Misuse the app',
      "Attempt to access other users' data",
      'Reverse engineer or copy the app',
      'Interfere with app security or functionality',
      'Use the app for unlawful or harmful purposes',
    ],
  },
  {
    number: 8,
    title: 'Intellectual Property',
    paragraphs: [
      'Iron Miles, including its name, branding, design, content, workout structure, graphics, and related materials, is owned by Iron Miles or its creators.',
      'You may not copy, reproduce, distribute, or use Iron Miles content without permission.',
    ],
  },
  {
    number: 9,
    title: 'Third-Party Services',
    paragraphs: [
      'Iron Miles may rely on third-party services for hosting, authentication, analytics, notifications, payments, and other app functionality.',
      'We are not responsible for third-party service interruptions, policies, or actions.',
    ],
  },
  {
    number: 10,
    title: 'App Availability',
    paragraphs: [
      'We aim to keep Iron Miles available and functioning properly, but we do not guarantee uninterrupted or error-free service.',
      'We may update, modify, suspend, or discontinue parts of the app at any time.',
    ],
  },
  {
    number: 11,
    title: 'Limitation of Liability',
    paragraphs: [
      'To the fullest extent permitted by law, Iron Miles and its creators are not liable for injuries, damages, losses, or claims arising from your use of the app, workouts, fitness guidance, or related services.',
      'You use Iron Miles at your own risk.',
    ],
  },
  {
    number: 12,
    title: 'Changes to These Terms',
    paragraphs: [
      'We may update these Terms from time to time.',
      'Any updates will be posted within the app or on our website with a revised effective date.',
      'Your continued use of Iron Miles after changes means you accept the updated Terms.',
    ],
  },
  {
    number: 13,
    title: 'Contact Us',
    paragraphs: ['For questions about these Terms, contact:'],
  },
];

function BulletList({ items }: { items: string[] }) {
  return (
    <View style={s.bulletList}>
      {items.map((item) => (
        <View key={item} style={s.bulletRow}>
          <Text style={s.bulletDot}>•</Text>
          <Text style={s.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export default function TermsOfServiceScreen() {
  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <MvpScreenHeader title="TERMS OF SERVICE" subtitle="Iron Miles" testID="terms-of-service-header" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <Text style={s.docTitle}>Terms of Service</Text>
        <Text style={s.updated}>Last Updated: June 2026</Text>

        <Text style={s.introTitle}>Iron Miles Terms of Service</Text>
        <Text style={s.introBody}>
          Welcome to Iron Miles. These Terms of Service (&quot;Terms&quot;) govern your use of the Iron Miles mobile
          application and related services.
        </Text>
        <Text style={s.introBody}>
          By using Iron Miles, you agree to these Terms. If you do not agree, do not use the app.
        </Text>

        {SECTIONS.map((sec) => (
          <View key={sec.number} style={s.block}>
            <Text style={s.blockTitle}>
              {sec.number}. {sec.title}
            </Text>
            {sec.paragraphs?.map((p) => (
              <Text key={p} style={s.blockBody}>
                {p}
              </Text>
            ))}
            {sec.bullets ? <BulletList items={sec.bullets} /> : null}
            {sec.number === 13 ? (
              <View style={s.contactBlock}>
                <Text style={s.contactLine}>Iron Miles Support</Text>
                <Text style={s.contactLine}>Email: support@ironmiles.app</Text>
                <Text style={s.contactLine}>Website: https://ironmiles.app</Text>
              </View>
            ) : null}
          </View>
        ))}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: MVP_C.bg },
  scroll: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 28 },
  docTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: MVP_C.offWhite,
    marginBottom: 6,
  },
  updated: {
    fontSize: 13,
    color: MVP_C.textMuted,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  introTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: MVP_C.gold,
    marginBottom: 10,
  },
  introBody: {
    fontSize: 15,
    color: MVP_C.textSec,
    lineHeight: 23,
    marginBottom: 12,
  },
  block: { marginBottom: 22 },
  blockTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: MVP_C.gold,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  blockBody: {
    fontSize: 15,
    color: MVP_C.textSec,
    lineHeight: 23,
    marginBottom: 10,
  },
  bulletList: { marginTop: 2, marginBottom: 4 },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    paddingRight: 4,
  },
  bulletDot: {
    color: MVP_C.goldDark,
    fontSize: 16,
    lineHeight: 22,
    marginRight: 8,
    marginTop: 1,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    color: MVP_C.textSec,
    lineHeight: 22,
  },
  contactBlock: {
    marginTop: 8,
    paddingLeft: 4,
    gap: 6,
  },
  contactLine: {
    fontSize: 15,
    color: MVP_C.textSec,
    lineHeight: 22,
  },
});
