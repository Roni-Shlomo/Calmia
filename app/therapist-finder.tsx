import { useRouter } from 'expo-router';
import {
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../constants/colors';

export default function TherapistFinderScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.navButton} onPress={() => router.back()}>
          <Text style={styles.navButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={() => router.push('/home')}>
          <Text style={styles.navButtonText}>Home</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Therapist Finder</Text>
        <Text style={styles.subtitle}>Find licensed professionals near you</Text>

        <View style={styles.heroCard}>
          <View style={styles.leftIcons}>
            <Image source={require('../assets/images/map-icon.png')} style={styles.mapIcon} />
            <Image source={require('../assets/images/people-icon.png')} style={styles.peopleIcon} />
          </View>

          <View style={styles.heroRight}>
            <Text style={styles.heroTitle}>Find Support Nearby</Text>
            <Text style={styles.heroText}>
              Search for psychologists and CBT therapists based on your location or by city.
            </Text>

            <View style={styles.mapBox}>
              <Image source={require('../assets/images/map.png')} style={styles.mapImage} />
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.psychologistCard}
          onPress={() => router.push('/psychologists')}
        >
          <Image source={require('../assets/images/psychologists-icon.png')} style={styles.mainIcon} />

          <View style={styles.cardRight}>
            <Text style={styles.cardTitle}>Search Psychologists</Text>
            <Text style={styles.cardText}>Find licensed psychologists near your area.</Text>

            <View style={styles.innerBox}>
              <Text style={styles.innerTitle}>Sorted by location</Text>
              <Text style={styles.actionButton}>View Psychologists</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cbtCard}
          onPress={() => router.push('/cbt-therapists')}
        >
          <Image source={require('../assets/images/Cbt-icon.png')} style={styles.mainIcon} />

          <View style={styles.cardRight}>
            <Text style={styles.cardTitle}>Search CBT Therapists</Text>
            <Text style={styles.cardText}>Discover nearby CBT-focused therapists and clinics.</Text>

            <View style={styles.innerBox}>
              <View>
                <Text style={styles.innerTitle}>CBT support</Text>
                <Text style={styles.innerText}>
                  Anxiety · Stress · Habits
                </Text>
              </View>

              <View style={styles.buttonColumn}>
                <TouchableOpacity
                  onPress={() =>
                    Linking.openURL('https://www.clalit.co.il/he/your_health/family/mental_health/Pages/cbt.aspx')
                  }
                >
                  <Text style={styles.actionButton}>Read about CBT</Text>
                </TouchableOpacity>

                <Text style={[styles.actionButton, { marginTop: 8 }]}>
                  Find Therapists
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  navButton: {
    backgroundColor: '#FFF8F0',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 18,
    shadowColor: '#7A4F3A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  navButtonText: {
    color: '#5A4034',
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    paddingTop: 22,
    paddingBottom: 44,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: '#3A2F2A',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7B7068',
    textAlign: 'center',
    marginBottom: 24,
  },
  heroCard: {
    backgroundColor: '#BFE4DE',
    borderRadius: 30,
    padding: 18,
    marginBottom: 20,
    flexDirection: 'row',
    gap: 14,
    shadowColor: '#5A4034',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 5,
  },
  leftIcons: {
    width: 88,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  mapIcon: {
    width: 90,
    height: 90,
    resizeMode: 'contain',
  },
  peopleIcon: {
    width: 90,
    height: 90,
    resizeMode: 'contain',
  },
  heroRight: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 23,
    fontWeight: '900',
    color: '#5A4034',
    marginBottom: 6,
  },
  heroText: {
    fontSize: 14,
    color: '#3F3833',
    lineHeight: 20,
    marginBottom: 12,
  },
  mapBox: {
    height: 105,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7FAF7',
  },
  mapImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    opacity: 0.9,
  },
  mapButton: {
    position: 'absolute',
    right: 14,
    bottom: 12,
    backgroundColor: '#8B5E49',
    color: '#FFFFFF',
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 16,
    fontSize: 14,
    fontWeight: '700',
    overflow: 'hidden',
  },
  psychologistCard: {
    backgroundColor: '#CBEDE6',
    borderRadius: 30,
    padding: 18,
    marginBottom: 20,
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    shadowColor: '#5A4034',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 5,
  },
  cbtCard: {
    backgroundColor: '#FFE2BD',
    borderRadius: 30,
    padding: 18,
    marginBottom: 20,
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    shadowColor: '#5A4034',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 5,
  },
  mainIcon: {
    width: 90,
    height: 90,
    resizeMode: 'contain',
  },
  cardRight: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#5A4034',
    marginBottom: 5,
  },
  cardText: {
    fontSize: 14,
    color: '#5E514A',
    lineHeight: 19,
    marginBottom: 12,
  },
  innerBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: 18,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  innerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#5A4034',
    marginBottom: 4,
  },
  innerText: {
    fontSize: 12,
    color: '#6E625A',
  },
  actionButton: {
    backgroundColor: '#8B5E49',
    color: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    fontSize: 14,
    fontWeight: '700',
    overflow: 'hidden',
  },
  buttonColumn: {
  alignItems: 'flex-end',
},
});