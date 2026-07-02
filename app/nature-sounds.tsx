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

const sounds = [
  {
    title: 'Rain',
    subtitle: 'Gentle rain for relaxation',
    icon: 'rainy-outline',
    color: '#c5eade',
    route: '/sound-player',
  },
  {
    title: 'Ocean',
    subtitle: 'Soft waves to calm your mind',
    icon: 'water-outline',
    color: '#D8ECF7',
    route: '/sound-player',
  },
  {
    title: 'Forest',
    subtitle: 'Peaceful forest ambience',
    icon: 'leaf-outline',
    color: colors.secondary,
    route: '/sound-player',
  },
  {
    title: 'Fireplace',
    subtitle: 'Warm crackling fire sounds',
    icon: 'flame-outline',
    color: colors.softOrange,
    route: '/sound-player',
  },
  {
  title: 'Stream',
  subtitle: 'Peaceful stream sounds',
  icon: 'water-outline',
  color: '#97cceb',
  route: '/sound-player',
},
];

export default function NatureSoundsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
          <Text style={styles.backText}>Relax & Listen</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Nature Sounds</Text>

        <Text style={styles.subtitle}>
          Choose a natural sound to help you relax
        </Text>

        {sounds.map((item) => (
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
                            backLabel: 'Nature Sounds',
                        },
                    })
                }
            >
            <View style={styles.iconCircle}>
              <Ionicons name={item.icon as any} size={38} color={colors.primary} />
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
    marginBottom: 34,
  },
  backText: {
    marginLeft: 8,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 18,
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 14,
  },
  subtitle: {
    textAlign: 'center',
    color: colors.subtext,
    fontSize: 18,
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
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: 'rgba(255,255,255,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 22,
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