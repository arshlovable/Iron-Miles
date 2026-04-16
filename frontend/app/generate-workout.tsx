import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const GOLD = '#D4AF37';
const GOLD_DARK = '#8B7025';
const GREEN = '#8A9A5B';

export default function GenerateWorkoutScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          testID="back-button"
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>GENERATE WORKOUT</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <View style={styles.heroIconContainer}>
            <MaterialCommunityIcons name="dumbbell" size={56} color={GOLD} />
          </View>
          <Text style={styles.heroTitle}>BUILD YOUR WORKOUT</Text>
          <Text style={styles.heroSubtitle}>
            Customized for your current stop, available time, and equipment
          </Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionLabel}>SELECT WORKOUT TYPE</Text>

        <TouchableOpacity testID="workout-type-upper" style={styles.optionCard} activeOpacity={0.7}>
          <View style={styles.optionIconWrap}>
            <MaterialCommunityIcons name="arm-flex" size={28} color={GOLD} />
          </View>
          <View style={styles.optionTextWrap}>
            <Text style={styles.optionTitle}>UPPER BODY</Text>
            <Text style={styles.optionDesc}>Arms, chest, shoulders, back</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#444" />
        </TouchableOpacity>

        <TouchableOpacity testID="workout-type-lower" style={styles.optionCard} activeOpacity={0.7}>
          <View style={styles.optionIconWrap}>
            <MaterialCommunityIcons name="human-handsup" size={28} color={GOLD} />
          </View>
          <View style={styles.optionTextWrap}>
            <Text style={styles.optionTitle}>LOWER BODY</Text>
            <Text style={styles.optionDesc}>Legs, glutes, calves</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#444" />
        </TouchableOpacity>

        <TouchableOpacity testID="workout-type-full" style={styles.optionCard} activeOpacity={0.7}>
          <View style={styles.optionIconWrap}>
            <MaterialCommunityIcons name="human" size={28} color={GOLD} />
          </View>
          <View style={styles.optionTextWrap}>
            <Text style={styles.optionTitle}>FULL BODY</Text>
            <Text style={styles.optionDesc}>Complete workout for any stop</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#444" />
        </TouchableOpacity>

        <TouchableOpacity testID="workout-type-stretch" style={styles.optionCard} activeOpacity={0.7}>
          <View style={styles.optionIconWrap}>
            <Ionicons name="body" size={28} color={GOLD} />
          </View>
          <View style={styles.optionTextWrap}>
            <Text style={styles.optionTitle}>STRETCH & RECOVER</Text>
            <Text style={styles.optionDesc}>Quick relief after long hauls</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#444" />
        </TouchableOpacity>

        <View style={styles.comingSoonBadge}>
          <MaterialCommunityIcons name="wrench" size={16} color={GOLD_DARK} />
          <Text style={styles.comingSoonText}>AI WORKOUT GENERATION COMING SOON</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080808',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: GOLD,
    letterSpacing: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  heroIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#121212',
    borderWidth: 2,
    borderColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    elevation: 8,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#2A2A2A',
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    letterSpacing: 2,
    marginBottom: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 4,
    padding: 16,
    marginBottom: 12,
  },
  optionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  optionTextWrap: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 12,
    color: '#888',
  },
  comingSoonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 12,
    gap: 8,
  },
  comingSoonText: {
    fontSize: 11,
    fontWeight: '700',
    color: GOLD_DARK,
    letterSpacing: 1.5,
  },
});
