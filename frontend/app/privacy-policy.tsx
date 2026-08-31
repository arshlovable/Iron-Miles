import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MvpScreenHeader, MVP_C } from '../src/components/MvpScreenHeader';

type PolicySubsection = {
  title: string;
  bullets: string[];
};

type PolicySection = {
  number: number;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  subsections?: PolicySubsection[];
};

const SECTIONS: PolicySection[] = [
  {
    number: 1,
    title: 'Information We Collect',
    paragraphs: ['When you use Iron Miles, we may collect:'],
    subsections: [
      {
        title: 'Account Information',
        bullets: ['Name', 'Email address', 'Authentication details provided through our sign-in system'],
      },
      {
        title: 'Fitness and App Usage Information',
        bullets: [
          'Workout selections',
          'Completed workouts',
          'Progress data',
          'Iron Miles earned',
          'Fuel and meal tracking entries',
          'App preferences and settings',
        ],
      },
      {
        title: 'Device Information',
        bullets: ['Device type', 'Operating system', 'App version', 'Diagnostic and crash information'],
      },
    ],
  },
  {
    number: 2,
    title: 'How We Use Information',
    paragraphs: ['We use collected information to:'],
    bullets: [
      'Provide and improve the Iron Miles experience',
      'Generate workouts',
      'Track fitness progress',
      'Save workout history',
      'Maintain account functionality',
      'Improve app performance and reliability',
      'Respond to support requests',
    ],
  },
  {
    number: 3,
    title: 'Data Storage',
    paragraphs: [
      'Your information may be stored securely using third-party infrastructure providers that support Iron Miles, including cloud database and hosting services.',
      'We take reasonable measures to protect your information from unauthorized access, disclosure, alteration, or destruction.',
    ],
  },
  {
    number: 4,
    title: 'Analytics and Performance Monitoring',
    paragraphs: [
      'Iron Miles may use analytics and diagnostic tools to better understand app performance, identify bugs, and improve the user experience.',
      'These tools may collect anonymous or aggregated usage information.',
    ],
  },
  {
    number: 5,
    title: 'Push Notifications',
    paragraphs: [
      'If enabled, Iron Miles may send notifications related to workouts, reminders, progress tracking, and app updates.',
      'You may disable notifications at any time through your device settings.',
    ],
  },
  {
    number: 6,
    title: 'Data Sharing',
    paragraphs: [
      'We do not sell your personal information.',
      'We may share information with trusted service providers solely for operating, maintaining, and improving Iron Miles.',
      'We may also disclose information when required by law.',
    ],
  },
  {
    number: 7,
    title: 'Data Retention',
    paragraphs: [
      'We retain information only as long as necessary to provide the service, comply with legal obligations, resolve disputes, and enforce agreements.',
    ],
  },
  {
    number: 8,
    title: 'Your Rights',
    paragraphs: ['Depending on your location, you may have the right to:'],
    bullets: [
      'Access your personal information',
      'Request correction of inaccurate information',
      'Request deletion of your account and associated data',
      'Withdraw consent where applicable',
    ],
  },
  {
    number: 9,
    title: "Children's Privacy",
    paragraphs: [
      'Iron Miles is not intended for children under the age of 13.',
      'We do not knowingly collect personal information from children under 13.',
    ],
  },
  {
    number: 10,
    title: 'Health Disclaimer',
    paragraphs: [
      'Iron Miles provides fitness and wellness information for educational and informational purposes only.',
      'The app does not provide medical advice, diagnosis, or treatment.',
      'Always consult a qualified healthcare professional before beginning any exercise program.',
    ],
  },
  {
    number: 11,
    title: 'Changes to This Policy',
    paragraphs: [
      'We may update this Privacy Policy from time to time.',
      'Any updates will be posted within the application or on our website with a revised effective date.',
    ],
  },
  {
    number: 12,
    title: 'Contact Us',
    paragraphs: ['For privacy-related questions or requests, contact:'],
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

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <MvpScreenHeader title="PRIVACY POLICY" subtitle="Iron Miles" testID="privacy-policy-header" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <Text style={s.docTitle}>Privacy Policy</Text>
        <Text style={s.updated}>Last Updated: June 2026</Text>

        <Text style={s.introTitle}>Iron Miles Privacy Policy</Text>
        <Text style={s.introBody}>
          Iron Miles (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This
          Privacy Policy explains how we collect, use, and safeguard information when you use the Iron Miles mobile
          application and related services.
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
            {sec.subsections?.map((sub) => (
              <View key={sub.title} style={s.subBlock}>
                <Text style={s.subTitle}>{sub.title}</Text>
                <BulletList items={sub.bullets} />
              </View>
            ))}
            {sec.bullets ? <BulletList items={sec.bullets} /> : null}
            {sec.number === 12 ? (
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
    marginBottom: 24,
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
  subBlock: { marginTop: 4, marginBottom: 8 },
  subTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: MVP_C.offWhite,
    marginBottom: 8,
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
