import { Ionicons } from '@expo/vector-icons';
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

const categories = [
  {
    title: 'Guided Talks',
    subtitle: 'Short talks to better understand your emotions',
    icon: 'mic-outline',
    color: '#F7DCE4',
    route: '/guided-talks',
  },
  {
    title: 'Guided Meditation',
    subtitle: 'Calm your mind with guided sessions',
    icon: 'body-outline',
    color: colors.softPurple,
    route: '/guided-meditation',
  },
  {
    title: 'Nature Sounds',
    subtitle: 'Rain, ocean, forest and fireplace',
    icon: 'rainy-outline',
    color: colors.secondary,
    route: '/nature-sounds',
  },
  {
    title: 'Relaxing Sounds',
    subtitle: 'White noise and calming ambient sounds',
    icon: 'musical-note-outline',
    color: '#DDEDE8',
    route: '/relaxing-sounds',
  },
  {
    title: 'Expert Podcasts',
    subtitle: 'Expert advice for stress and anxiety',
    icon: 'headset-outline',
    color: colors.softYellow,
    route: '/expert-podcasts',
  },
];

export default function RelaxListenScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
          <Text style={styles.backText}>Home</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Relax & Listen</Text>

        <Text style={styles.welcomeText}>
          How would you like to relax today?
        </Text>

        <Text style={styles.subtitle}>
          Choose the content that fits your moment
        </Text>

        {categories.map((item) => (
            <TouchableOpacity
                key={item.title}
                style={[styles.card, { backgroundColor: item.color }]}
                onPress={() => item.route && router.push(item.route as any)}
            >
            <View style={styles.iconCircle}>
              <Ionicons name={item.icon as any} size={42} color={colors.primary} />
            </View>

            <View style={styles.cardTextArea}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 34,
    paddingTop: 22,
    paddingBottom: 45,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  backText: {
    marginLeft: 8,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 18,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  welcomeText: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: '#6F9A8D',
    marginBottom: 10,
  },
  subtitle: {
    textAlign: 'center',
    color: colors.subtext,
    fontSize: 18,
    marginBottom: 32,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 28,
    paddingVertical: 20,
    paddingHorizontal: 22,
    marginBottom: 18,
    minHeight: 110,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  iconCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: 'rgba(255,255,255,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 24,
  },
  cardTextArea: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 10,
  },
  cardSubtitle: {
    fontSize: 17,
    color: colors.text,
    lineHeight: 25,
  },
});