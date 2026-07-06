import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { colors } from '../constants/colors';

const homeActions = [
  {
    title: 'Calm Me Now',
    description: 'Breathing, timer and relaxing sound',
    href: '/calm',
    color: colors.secondary,
    circleColor: '#EEF3E2',
  },
  {
    title: 'Mini Games',
    description: 'Small calming activities',
    href: '/games',
    color: colors.primary,
    circleColor: '#F2EAE1',
  },
  {
    title: 'Relax & Listen',
    description: 'Calming podcasts, meditation and relaxing audio',
    href: '/relax-listen',
    color: '#C9786C',
    circleColor: '#F9E8E4',
  },
  {
    title: 'Daily Reflection',
    description: 'Answer simple end-of-day questions',
    href: '/reflection',
    color: colors.accent,
    circleColor: '#FFF0E1',
  },
  {
    title: 'Data View',
    description: 'Explore your reflection patterns and insights',
    href: '/data-view',
    color: '#B99034',
    circleColor: '#F9EFC5',
  },
  {
    title: 'Therapist Finder',
    description: 'Find nearby psychologists and CBT therapists',
    href: '/therapist-finder',
    color: '#765BC5',
    circleColor: '#EEE8FB',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const contentWidth = width - styles.content.padding * 2;
  const bottomImageHeight = contentWidth * (258 / 972);

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
        <Image
          source={require('../assets/images/home-title-stones.png')}
          style={styles.titleImage}
          resizeMode="contain"
        />
        <Text style={styles.title}>Your calm space</Text>
        <Text style={styles.subtitle}>
          Take a moment to relax and reset
        </Text>

        <View style={styles.actionsGrid}>
          {homeActions.map((action) => (
            <TouchableOpacity
              key={action.href}
              style={styles.mainCard}
              activeOpacity={0.84}
              onPress={() => router.push(action.href as never)}
            >
              <Text style={[styles.mainCardTitle, { color: action.color }]}>
                {action.title}
              </Text>
              <Text style={styles.mainCardText}>{action.description}</Text>
              <View style={styles.arrowRow}>
                <View
                  style={[
                    styles.arrowCircle,
                    { backgroundColor: action.circleColor },
                  ]}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={28}
                    color={action.color}
                  />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomImageFrame}>
          <Image
            source={require('../assets/images/home-stress-support.png')}
            style={[styles.bottomImage, { height: bottomImageHeight }]}
            resizeMode="cover"
          />
        </View>
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
    alignItems: 'center',
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
  titleImage: {
    width: 92,
    height: 72,
    alignSelf: 'center',
    marginBottom: 2,
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
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  mainCard: {
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: 18,
    marginBottom: 14,
    minHeight: 168,
    width: '48%',
    justifyContent: 'space-between',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  mainCardTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  mainCardText: {
    fontSize: 14,
    color: colors.subtext,
    lineHeight: 20,
  },
  arrowRow: {
    alignItems: 'flex-end',
    marginTop: 10,
  },
  arrowCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomImage: {
    width: '100%',
    borderRadius: 24,
  },
  bottomImageFrame: {
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: 6,
    marginTop: 0,
    overflow: 'hidden',
  },
});
