import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../constants/colors';

import { API_URL } from '../constants/api';

export default function CbtTherapistsScreen() {
  const router = useRouter();

  const [city, setCity] = useState('');
  const [therapists, setTherapists] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchAllTherapists();
  }, []);

  const fetchAllTherapists = async () => {
  try {
    setLoading(true);
    setMessage('');

    const response = await fetch(`${API_URL}/therapists/cbt`);

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();

    console.log('CBT therapists from backend:', data);

    setTherapists(data);

    if (!Array.isArray(data) || data.length === 0) {
      setMessage('No CBT therapists found.');
    }
  } catch (error: any) {
    console.error('Frontend fetch error:', error);
    setMessage(`Could not load CBT therapists: ${error.message}`);
  } finally {
    setLoading(false);
  }
};

  const fetchByLocation = async () => {
    try {
      setLoading(true);
      setMessage('');

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setMessage('Location permission was denied. You can search manually by city.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const response = await fetch(
        `${API_URL}/therapists/cbt?lat=${latitude}&lng=${longitude}`
      );

      const data = await response.json();
      setTherapists(data);
    } catch (error) {
    
      setMessage('Could not load CBT therapists.');
    } finally {
      setLoading(false);
    }
  };

  const fetchByCity = async () => {
    if (!city.trim()) {
      fetchAllTherapists();
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      const response = await fetch(
        `${API_URL}/therapists/cbt?city=${encodeURIComponent(city)}`
      );

      const data = await response.json();
      setTherapists(data);

      if (data.length === 0) {
        setMessage('No CBT therapists found for this city.');
      }
    } catch (error) {
      setMessage('Could not load CBT therapists.');
    } finally {
      setLoading(false);
    }
  };

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
        <Text style={styles.title}>CBT Therapists</Text>
        <Text style={styles.subtitle}>
          Browse CBT therapists or sort them by your location
        </Text>

        <TouchableOpacity style={styles.primaryButton} onPress={fetchByLocation}>
          <Text style={styles.primaryButtonText}>Use My Location</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Search by city, for example Tel Aviv"
          placeholderTextColor="#8B7E76"
          value={city}
          onChangeText={setCity}
        />

        <TouchableOpacity style={styles.secondaryButton} onPress={fetchByCity}>
          <Text style={styles.secondaryButtonText}>
            Search Manually
          </Text>
        </TouchableOpacity>

        {loading && <ActivityIndicator size="large" color="#8B5E49" />}

        {message ? <Text style={styles.message}>{message}</Text> : null}

        {therapists.map((therapist) => (
          <View key={therapist.id} style={styles.card}>
            <Text style={styles.cardTitle}>{therapist.name}</Text>
            <Text style={styles.cardText}>{therapist.specialty}</Text>
            <Text style={styles.info}>📍 {therapist.city}</Text>
            <Text style={styles.info}>📞 {therapist.phone}</Text>
            <Text style={styles.info}>🌐 {therapist.languages}</Text>

            {therapist.distance !== undefined && (
              <Text style={styles.distance}>{therapist.distance} km away</Text>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 18,
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
    fontSize: 32,
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
  primaryButton: {
    backgroundColor: '#8B5E49',
    borderRadius: 18,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#3A2F2A',
    marginBottom: 14,
  },
  secondaryButton: {
  backgroundColor: '#d4c4ef',
  borderRadius: 18,
  paddingVertical: 12,
  alignItems: 'center',
  marginBottom: 20,
  shadowColor: '#a490c1',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 6,
  elevation: 3,
},
secondaryButtonText: {
  color: '#47342b',
  fontSize: 16,
  fontWeight: '900',
},
  message: {
    textAlign: 'center',
    color: '#5A4034',
    marginBottom: 16,
    fontWeight: '700',
  },
 card: {
  backgroundColor: '#FFFDFB',
  borderRadius: 24,
  paddingVertical:16,
  paddingHorizontal:18,
  marginBottom: 18,
  borderWidth: 4,
  borderColor: '#D98BA0',
  borderLeftWidth: 12,
  borderLeftColor: '#C96B8A',
  shadowColor: '#8B5E49',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.16,
  shadowRadius: 9,
  elevation: 5,
},
cardTitle: {
  fontSize: 21,
  fontWeight: '800',
  color: '#6B4A3C',
  marginBottom: 6,
},
 cardText: {
  fontSize: 14,
  color: '#5E514A',
  marginBottom: 4,
},
  distanceContainer:{
    alignSelf:'flex-start',
    marginTop:14,
    backgroundColor:'#D7F1E7',
    paddingHorizontal:14,
    paddingVertical:8,
    borderRadius:18,
},
distance: {
  alignSelf: 'flex-start',
  marginTop: 10,
  backgroundColor: '#F4D7DE',
  color: '#7A4F3A',
  paddingVertical: 6,
  paddingHorizontal: 12,
  borderRadius: 14,
  fontSize: 14,
  fontWeight: '900',
  overflow: 'hidden',
},
  info: {
    fontSize:15,
    color:'#5D5550',
    marginTop:4,
},
searchIcon: {
  color: '#ffffff',
  fontSize: 20,
  fontWeight: '700',
},
});