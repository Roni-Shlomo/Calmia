import { useRouter } from 'expo-router';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../constants/colors';


export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topRow}>
        <View />
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Your calm space</Text>
        <Text style={styles.subtitle}>
          Take a moment to relax and reset
        </Text>

        <TouchableOpacity
          style={[styles.mainCard, { backgroundColor: colors.secondary }]}
          onPress={() => router.push('/calm')}
        >
          <Text style={styles.mainCardTitle}>Calm Me Now</Text>
          <Text style={styles.mainCardText}>
            Breathing, timer and relaxing sound
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mainCard, { backgroundColor: colors.softBrown }]}
          onPress={() => router.push('/games')}
        >
          <Text style={styles.mainCardTitle}>Mini Games</Text>
          <Text style={styles.mainCardText}>Small calming activities</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mainCard, { backgroundColor: colors.softOrange }]}
          onPress={() => router.push('/reflection')}
        >
          <Text style={styles.mainCardTitle}>Daily Reflection</Text>
          <Text style={styles.mainCardText}>
            Answer simple end-of-day questions
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mainCard, { backgroundColor: colors.softYellow }]}
          onPress={() => router.push('/data-view')}
        >
          <Text style={styles.mainCardTitle}>Data View</Text>
          <Text style={styles.mainCardText}>
            See your stress data by days, weeks, and months
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mainCard, { backgroundColor: colors.softPurple }]}
          onPress={() => router.push('/therapist-finder')}
        >
          <Text style={styles.mainCardTitle}>Therapist Finder</Text>
          <Text style={styles.mainCardText}>
            Find nearby psychologists and CBT therapists
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topRow: {
    paddingHorizontal: 24,
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  logoutButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  logoutButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    padding: 24,
    paddingTop: 20,
    paddingBottom: 50,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  subtitle: {
    textAlign: 'center',
    color: colors.subtext,
    fontSize: 18,
    marginBottom: 20,
  },
  mainCard: {
    borderRadius: 28,
    padding: 24,
    marginBottom: 18,
    minHeight: 120,
    justifyContent: 'center',
  },
  mainCardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  mainCardText: {
    fontSize: 15,
    color: colors.text,
  },
});