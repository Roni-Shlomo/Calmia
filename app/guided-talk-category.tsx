import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { colors } from '../constants/colors';

const talks: Record<string, string[]> = {
  Anxiety: [
    'Understanding Anxiety',
    'Why Your Brain Overthinks',
    "Panic Isn't Dangerous",
    'How to Calm Racing Thoughts',
  ],
  Stress: [
    'Managing Daily Stress',
    'Taking Healthy Breaks',
  ],
  'Self Confidence': [
    'Building Self-Esteem',
    'Stop Comparing Yourself',
    'Trust Yourself Again',
  ],
  Sleep: [
    "Why You Can't Fall Asleep",
    'Quieting Your Mind Before Bed',
  ],
  Relationships: [
    'Letting Go',
    'Healthy Boundaries',
    'Dealing With Rejection',
  ],
};

export default function GuidedTalkCategoryScreen() {
  const router = useRouter();
  const { title, subtitle } = useLocalSearchParams();

  const items = talks[title as string] || [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
          <Text style={styles.backText}>Guided Talks</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        {items.map((item) => (
          <TouchableOpacity
                key={item}
                style={styles.card}
                onPress={() =>
                    router.push({
                        pathname: '/sound-player',
                        params: {
                            title: item,
                            subtitle: 'Guided Talk • 2–4 min',
                            icon: 'mic-outline',
                            type: 'guidedTalk',
                            backLabel: title as string,
                        },
                    })
                }
            >
            <View style={styles.iconCircle}>
              <Ionicons
                name="mic-outline"
                size={34}
                color={colors.primary}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item}</Text>
              <Text style={styles.cardSubtitle}>2–4 min talk</Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={24}
              color={colors.primary}
            />
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
    padding: 28,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  backText: {
    marginLeft: 8,
    color: colors.primary,
    fontSize: 18,
    fontWeight: '600',
  },
  title: {
    fontSize: 38,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 18,
    color: colors.subtext,
    marginBottom: 30,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ddc2c2',
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 18,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  cardSubtitle: {
    fontSize: 15,
    color: colors.subtext,
    marginTop: 4,
  },
});