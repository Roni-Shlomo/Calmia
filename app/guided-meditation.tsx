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

const meditations = [
  {
    title: '5 Minute Calm',
    subtitle: 'Guided breathing meditation',
    icon: 'body-outline',
    color: colors.softPurple,
    type: 'meditation',
  },
  {
    title: 'Morning Meditation',
    subtitle: 'Start your day with clarity',
    icon: 'sunny-outline',
    color: colors.softYellow,
    type: 'meditation',
  },
  {
    title: 'Before Sleep',
    subtitle: 'Relax your body before bedtime',
    icon: 'moon-outline',
    color: colors.softOrange,
    type: 'meditation',
  },
  {
    title: 'Ambient Meditation',
    subtitle: 'Soft ambient sounds with flowing water',
    icon: 'musical-notes-outline',
    color: '#DDEDE8',
    type: 'sound',
  },
];

export default function GuidedMeditationScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
          <Text style={styles.backText}>Relax & Listen</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Guided Meditation</Text>
        <Text style={styles.subtitle}>
          Find the meditation that fits your moment
        </Text>

        {meditations.map((item) => (
          <TouchableOpacity
            key={item.title}
            style={[styles.card, { backgroundColor: item.color }]}
            onPress={() =>
                router.push({
                    pathname: '/sound-player',
                    params: {
                        title: item.title,
                        subtitle: item.subtitle,
                        icon: item.icon,
                        type: item.type,
                        backLabel: 'Guided Meditation',
                    },
                })
            }
          >
            <View style={styles.iconCircle}>
              <Ionicons name={item.icon as any} size={42} color={colors.primary} />
            </View>

            <View style={styles.textArea}>
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
    marginBottom: 35,
  },
  backText: {
    marginLeft: 8,
    color: colors.primary,
    fontSize: 18,
    fontWeight: '600',
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 18,
    color: colors.subtext,
    marginBottom: 34,
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
  textArea: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 17,
    color: colors.text,
    lineHeight: 24,
  },
});