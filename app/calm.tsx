import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { colors } from '../constants/colors';

export default function CalmScreen() {
  const router = useRouter();

  const [started, setStarted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [breathPhase, setBreathPhase] = useState('Ready');

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!started) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setStarted(false);
          setBreathPhase('Done');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [started]);

  useEffect(() => {
    if (!started) {
      if (secondsLeft === 60) {
        setBreathPhase('Ready');
      }
      return;
    }

    const cycle = (60 - secondsLeft) % 12;

    if (cycle >= 0 && cycle <= 3) {
      setBreathPhase('Breathe In');
    } else if (cycle >= 4 && cycle <= 5) {
      setBreathPhase('Hold');
    } else if (cycle >= 6 && cycle <= 9) {
      setBreathPhase('Breathe Out');
    } else {
      setBreathPhase('Hold');
    }
  }, [secondsLeft, started]);

  const handleStartStop = () => {
    if (started) {
      setStarted(false);
      setSecondsLeft(60);
      setBreathPhase('Ready');
    } else {
      setSecondsLeft(60);
      setBreathPhase('Breathe In');
      setStarted(true);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(
      remainingSeconds
    ).padStart(2, '0')}`;
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

      <View style={styles.content}>
        <Text style={styles.title}>Calm Me Now</Text>
        <Text style={styles.subtitle}>Take a slow breath and relax</Text>

        <View style={styles.breathCircle}>
          <Text style={styles.breathText}>{breathPhase}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Timer</Text>
          <Text style={styles.infoValue}>{formatTime(secondsLeft)}</Text>

          <Text style={[styles.infoLabel, { marginTop: 18 }]}>Sound</Text>
          <Text style={styles.infoValue}>Calming sound</Text>
        </View>

        <TouchableOpacity style={styles.startButton} onPress={handleStartStop}>
          <Text style={styles.startButtonText}>{started ? 'Stop' : 'Start'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  navButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 16,
  },
  navButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: colors.subtext,
    marginBottom: 28,
    textAlign: 'center',
  },
  breathCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.softGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  breathText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
  },
  infoCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.subtext,
  },
  infoValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
  },
  startButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 20,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});