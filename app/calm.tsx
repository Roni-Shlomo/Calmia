import { useAudioPlayer } from 'expo-audio';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../constants/colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const BREATH_IN_SECONDS = 4;
const HOLD_SECONDS = 7;
const BREATH_OUT_SECONDS = 8;
const TOTAL_CYCLES = 4;

const CYCLE_SECONDS = BREATH_IN_SECONDS + HOLD_SECONDS + BREATH_OUT_SECONDS;
const TOTAL_SECONDS = CYCLE_SECONDS * TOTAL_CYCLES;

const CIRCLE_SIZE = 350;
const STROKE_WIDTH = 8;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type BreathPhase = 'Ready' | 'Breathe In' | 'Hold' | 'Breathe Out' | 'Done';

export default function CalmScreen() {
  const router = useRouter();

  const [started, setStarted] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [breathPhase, setBreathPhase] = useState<BreathPhase>('Ready');
  const [currentCycle, setCurrentCycle] = useState(1);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const circleScale = useRef(new Animated.Value(1)).current;
  const player = useAudioPlayer(require('../assets/sounds/meditation.mp3'));
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!started) return;

    intervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => {
        if (prev >= TOTAL_SECONDS - 1) {
          setStarted(false);
          setBreathPhase('Done');
          setCurrentCycle(TOTAL_CYCLES);
          player.pause();
          player.seekTo(0);
          return TOTAL_SECONDS;
        }

        return prev + 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [started]);

  useEffect(() => {
    if (!started) return;

    const safeElapsed = Math.min(elapsedSeconds, TOTAL_SECONDS - 1);
    const cycleIndex = Math.floor(safeElapsed / CYCLE_SECONDS);
    const secondsInCycle = safeElapsed % CYCLE_SECONDS;

    setCurrentCycle(cycleIndex + 1);

    if (secondsInCycle < BREATH_IN_SECONDS) {
      setBreathPhase('Breathe In');
    } else if (secondsInCycle < BREATH_IN_SECONDS + HOLD_SECONDS) {
      setBreathPhase('Hold');
    } else {
      setBreathPhase('Breathe Out');
    }
  }, [elapsedSeconds, started]);

  useEffect(() => {
  if (!started) {
    Animated.timing(circleScale, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    return;
  }

  if (breathPhase === 'Breathe In') {
    Animated.timing(circleScale, {
      toValue: 1.12,
      duration: BREATH_IN_SECONDS * 1000,
      useNativeDriver: true,
    }).start();
  }

  if (breathPhase === 'Hold') {
    Animated.timing(circleScale, {
      toValue: 1.12,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }

  if (breathPhase === 'Breathe Out') {
    Animated.timing(circleScale, {
      toValue: 1,
      duration: BREATH_OUT_SECONDS * 1000,
      useNativeDriver: true,
    }).start();
  }
}, [breathPhase, started]);

  const handleStartStop = () => {
    if (started) {
      setStarted(false);
      setElapsedSeconds(0);
      setBreathPhase('Ready');
      setCurrentCycle(1);
      player.pause();
      player.seekTo(0);
    } else {
      setElapsedSeconds(0);
      setBreathPhase('Breathe In');
      setCurrentCycle(1);
      progressAnim.stopAnimation();
      progressAnim.setValue(0);
      setStarted(true);
      player.loop = true;
      player.seekTo(0);
      player.play();
      progressAnim.setValue(0);

      Animated.timing(progressAnim, {
        toValue: 1,
        duration: TOTAL_SECONDS * 1000,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(
      remainingSeconds
    ).padStart(2, '0')}`;
  };

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

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
        <Text style={styles.subtitle}>4-7-8 breathing exercise</Text>
        
        <View style={styles.circleWrapper}>
          <Animated.View
            style={[
              styles.circleAnimatedWrapper,
              { transform: [{ scale: circleScale }] },
            ]}
          >
            <View style={styles.breathCircle}>
              <Text style={styles.breathText}>
                {breathPhase === 'Ready' ? 'Ready' : breathPhase === 'Done' ? 'Done' : breathPhase}
              </Text>

              <Text style={styles.breathEmoji}>
                {breathPhase === 'Breathe In'
                  ? '🌿'
                  : breathPhase === 'Hold'
                  ? '🫁'
                  : breathPhase === 'Breathe Out'
                  ? '🍃'
                  : ''}
              </Text>
            </View>

            <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} style={styles.progressRing}>
              <AnimatedCircle
                cx={CIRCLE_SIZE / 2}
                cy={CIRCLE_SIZE / 2}
                r={RADIUS}
                stroke="#FFFFFF"
                strokeWidth={STROKE_WIDTH}
                fill="transparent"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                rotation="-90"
                originX={CIRCLE_SIZE / 2}
                originY={CIRCLE_SIZE / 2}
              />
            </Svg>
          </Animated.View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Timer</Text>
          <Text style={styles.infoValue}>{formatTime(elapsedSeconds)}</Text>

          <Text style={[styles.infoLabel, { marginTop: 18 }]}>Cycle</Text>
          <Text style={styles.infoValue}>
            {breathPhase === 'Ready' ? 'Not started' : `${currentCycle} / ${TOTAL_CYCLES}`}
          </Text>

          <Text style={[styles.infoLabel, { marginTop: 18 }]}>Technique</Text>
          <Text style={styles.infoValue}>Breathe In 4 · Hold 7 · Breathe Out 8</Text>
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
    marginBottom: 6,
  },
  navButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 18,
  },
  navButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 45,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: colors.subtext,
    marginBottom: 30,
    textAlign: 'center',
  },
  breathCircle: {
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: colors.softGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0,
    paddingTop: 10,
    zIndex: 1,
  },
  breathText: {
    fontSize: 46,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 24,
  },
  breathEmoji: {
    fontSize: 92,
    textAlign: 'center',
  },
  infoCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.subtext,
  },
  infoValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
  },
  startButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 52,
    borderRadius: 20,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  circleWrapper: {
  width: 430,
  height: 430,
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 12,
  },
  progressRing: {
  position: 'absolute',
  zIndex: 2,
  },
  circleAnimatedWrapper: {
  width: 350,
  height: 350,
  justifyContent: 'center',
  alignItems: 'center',
  },
});