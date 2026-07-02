import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    Linking,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { colors } from '../constants/colors';

const podcastsByCategory: Record<string, { title: string; source: string; url: string }[]> = {
  'Anxiety & Panic': [
    {
        title: 'Stopping Anxiety & Fear',
        source: 'The Mel Robbins Podcast • Dr. David Rosmarin',
        url: 'https://www.youtube.com/watch?v=FJ5tXuBi4EM',
    },
    {
        title: 'Detach From Overthinking & Anxiety',
        source: 'The Diary of a CEO • Dr. Julie Smith',
        url: 'https://www.youtube.com/watch?v=iLlrIi9-NfQ',
    },
    {
        title: 'Reduce Stress & Anxiety',
        source: 'Feel Better, Live More • Dr. Julie Smith',
        url: 'https://www.youtube.com/watch?v=gryh7KhjtMA',
    },
    {
        title: 'Why Is It So Hard to Heal?',
        source: 'Ministry of Health • Assi Azar',
        url: 'https://www.youtube.com/watch?v=BCLIm1TAUhk',
    },
    {
        title: 'The Root Cause of Anxiety',
        source: 'Nitrao • Living Without Anxiety',
        url: 'https://www.youtube.com/watch?v=UowMYdrZxHA',
    },
  ],
  
  Sleep: [
    {
        title: 'Perfecting Your Sleep',
        source: 'Huberman Lab • Dr. Matthew Walker',
        url: 'https://www.youtube.com/watch?v=gbQFSMayJxk',
    },
    {
        title: "The #1 Health Habit You're Ignoring",
        source: 'The Rich Roll Podcast • Dr. Matthew Walker',
        url: 'https://www.youtube.com/watch?v=S-xgrkv1uTU',
    },
    {
        title: 'Sleep Toolkit',
        source: 'Huberman Lab • Dr. Matthew Walker',
        url: 'https://www.youtube.com/watch?v=-OBCwiPPfEU',
    },
    {
        title: 'How to Sleep Better',
        source: 'Mekusharim Latov • Dr. Yossi Manuchin',
        url: 'https://www.youtube.com/watch?v=b_tXOUOJOf4',
    },
    {
        title: 'How Proper Sleep Can Change Your Life',
        source: 'Michael Haliva Podcast',
        url: 'https://www.youtube.com/watch?v=sBqZk7UsMtc',
    },
  ],

  Mindfulness: [
    {
        title: 'The Heart of Mindfulness',
        source: 'Mind & Life Podcast • Jon Kabat-Zinn',
        url: 'https://www.youtube.com/watch?v=YC8FfQlNJV0',
    },
    {
        title: 'Psychology of Mindfulness Meditation',
        source: 'The Psychology Podcast • Ellen Langer',
        url: 'https://www.youtube.com/watch?v=mOqqx-ZNEJU',
    },
    {
        title: "Why You Can't Hate Yourself into Change",
        source: 'On Purpose • Dan Harris',
        url: 'https://www.youtube.com/watch?v=zHnGLrkCROQ',
    },
    {
        title: 'Mindfulness Without Anxiety',
        source: 'Yonatan Weiss • Living Without Anxiety',
        url: 'https://www.youtube.com/watch?v=U2WC_kugmYs',
    },
    {
        title: 'How a Few Minutes a Day Can Change Your Life',
        source: 'Osim Psychology • Dr. Keren Tene',
        url: 'https://www.youtube.com/watch?v=CYCFAreseaQ',
    },
  ],

  'Emotional Resilience': [
    {
        title: 'Control Your Inner Voice',
        source: 'Huberman Lab • Dr. Ethan Kross',
        url: 'https://www.youtube.com/watch?v=Og56hmAspV8',
    },
    {
        title: 'Science of Mindsets',
        source: 'Huberman Lab • Dr. Alia Crum',
        url: 'https://www.youtube.com/watch?v=dFR_wFN23ZY',
    },
    {
        title: 'Resilience & Emotional Agility',
        source: 'Good Life Project • Dr. Susan David',
        url: 'https://www.youtube.com/watch?v=zgZP7FnCnVw',
    },
    {
        title: 'Staying Calm During Stress',
        source: 'All•in Podcast • Dr. Liat Yakir',
        url: 'https://www.youtube.com/watch?v=pe6MasKQJVM',
    },
    {
        title: 'Positive Psychology After Trauma',
        source: 'Osim Psychology • Dr. Maayan Berman',
        url: 'https://www.youtube.com/watch?v=slt-FRTEgFk',
    },
  ],

  Relationships: [
    {
        title: 'Healthy Romantic Relationships',
        source: 'Huberman Lab • Esther Perel',
        url: 'https://www.youtube.com/watch?v=ajneRM-ET1Q',
    },
    {
        title: 'The 3 Attachment Styles',
        source: 'The Diary of a CEO • Esther Perel',
        url: 'https://www.youtube.com/watch?v=nTWXfo7narw',
    },
    {
        title: 'Finding Love & Why Couples Break Up',
        source: 'On Purpose • Esther Perel',
        url: 'https://www.youtube.com/watch?v=bPVYAq2nsgo',
    },
    {
        title: 'Healthy Relationships',
        source: 'Yehudin & Yael Podcast',
        url: 'https://www.youtube.com/watch?v=psN7aazieDQ',
    },
    {
        title: 'Boundaries, Relationships & Divorce',
        source: 'Dr. Maayan Berman • Gvulot Hahigayon',
        url: 'https://www.youtube.com/watch?v=oIVCy39G-g8',
    },
  ],
};

export default function PodcastCategoryScreen() {
  const router = useRouter();
  const { title, subtitle, color } = useLocalSearchParams();

  const podcasts = podcastsByCategory[title as string] || [];

  const openPodcast = (url: string) => {
    Linking.openURL(url);
};

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
          <Text style={styles.backText}>Expert Podcasts</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Choose an expert podcast</Text>
        <Text style={styles.description}>{subtitle}</Text>

        {podcasts.map((podcast) => (
            <TouchableOpacity
                key={podcast.title}
                style={[styles.card, { backgroundColor: color as string }]}
                onPress={() => openPodcast(podcast.url)}
            >
                <View style={styles.iconCircle}>
                <Ionicons name="headset-outline" size={34} color={colors.primary} />
                </View>

                <View style={styles.textArea}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                    {podcast.title}
                </Text>
                <Text style={styles.cardSubtitle} numberOfLines={2}>
                    {podcast.source} • Opens in YouTube
                </Text>
                </View>

                <Ionicons name="open-outline" size={24} color={colors.primary} />
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
    fontSize: 38,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  description: {
    textAlign: 'center',
    fontSize: 16,
    color: colors.subtext,
    marginBottom: 34,
    lineHeight: 23,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 16,
    minHeight: 112,
    height: 112,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  iconCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: 'rgba(255,255,255,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  flag: {
    fontSize: 36,
  },
  textArea: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
});