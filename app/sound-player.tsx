import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    Easing,
    Modal,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { colors } from '../constants/colors';

const audioFiles: Record<string, any> = {
  Rain: require('../assets/sounds/rain.mp3'),
  Ocean: require('../assets/sounds/ocean.mp3'),
  Forest: require('../assets/sounds/forest.mp3'),
  Fireplace: require('../assets/sounds/fireplace.mp3'),
  Stream: require('../assets/sounds/stream.mp3'),

  'White Noise': require('../assets/sounds/white-noise.mp3'),
  'Brown Noise': require('../assets/sounds/brown-noise.mp3'),
  'Pink Noise': require('../assets/sounds/pink-noise.mp3'),
  'Soft Wind': require('../assets/sounds/soft-wind.mp3'),

  '5 Minute Calm': require('../assets/sounds/five-minute-calm.mp3'),
  'Morning Meditation': require('../assets/sounds/morning.mp3'),
  'Before Sleep': require('../assets/sounds/before-sleep.mp3'),
  'Ambient Meditation': require('../assets/sounds/Peaceful-Ambience.mp3'),

  'Understanding Anxiety': require('../assets/sounds/Understanding-Anxiety.mp3'),
  'Why Your Brain Overthinks': require('../assets/sounds/Why-Your-Brain-Overthinks.mp3'),
  "Panic Isn't Dangerous": require("../assets/sounds/Panic-Isn't-Dangerous.mp3"),
  'How to Calm Racing Thoughts': require('../assets/sounds/How-to-Calm-Racing-Thoughts.mp3'),

  'Managing Daily Stress': require('../assets/sounds/Managing-Daily-Stress.mp3'),
  'Taking Healthy Breaks': require('../assets/sounds/Taking-Healthy-Breaks.mp3'),

  'Building Self-Esteem': require('../assets/sounds/Building-Self-Esteem.mp3'),
  'Stop Comparing Yourself': require('../assets/sounds/Stop-Comparing-Yourself.mp3'),
  'Trust Yourself Again': require('../assets/sounds/Trust-Yourself-Again.mp3'),

  "Why You Can't Fall Asleep": require("../assets/sounds/Why-You-Can't-Fall-Asleep.mp3"),
  'Quieting Your Mind Before Bed': require('../assets/sounds/Quieting-Your-Mind-Before-Bed.mp3'),

  'Letting Go': require('../assets/sounds/Letting-Go.mp3'),
  'Healthy Boundaries': require('../assets/sounds/Healthy-Boundaries.mp3'),
  'Dealing With Rejection': require('../assets/sounds/Dealing-With-Rejection.mp3'),
};

const timerOptions = ['1 min','5 min', '10 min', '15 min', '30 min', '∞'];

const timerMinutes: Record<string, number | null> = {
  '1 min': 1,
  '5 min': 5,
  '10 min': 10,
  '15 min': 15,
  '30 min': 30,
  '∞': null,
};

const formatTime = (seconds: number) => {
  const safeSeconds = Math.floor(seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
};

export default function SoundPlayerScreen() {
  const router = useRouter();
  const { title, subtitle, icon, type, backLabel } = useLocalSearchParams();
  const isMeditation = type === 'meditation';
  const isGuidedTalk = type === 'guidedTalk';
  const isFixedAudio = isMeditation || isGuidedTalk;

  const soundTitle = String(title || 'Rain');
  const audioSource = audioFiles[soundTitle] || audioFiles.Rain;
  const player = useAudioPlayer(audioSource);
  const status = useAudioPlayerStatus(player);

  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedTimer, setSelectedTimer] = useState('10 min');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [hasFinished, setHasFinished] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const finishTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clockIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const selectedMinutes = timerMinutes[selectedTimer];
  const API_URL = 'http://localhost:6001';

  const saveListeningSession = async () => {
    try {
        const storedUser = await AsyncStorage.getItem('currentUser');

        if (!storedUser) {
          console.log('No user found');
          return;
        }

        const user = JSON.parse(storedUser);

        await fetch(`${API_URL}/listening/complete`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            userId: user.id,
            category: backLabel || 'Nature Sounds',
            itemName: soundTitle,
            duration: totalSeconds ? Math.round(totalSeconds) : null,
        }),
        });
    } catch (error) {
        console.log('Failed to save listening session:', error);
    }
  };

  const totalSeconds = useMemo(() => {
  if (isFixedAudio) {
    return status.duration || null;
  }

  if (selectedMinutes === null) return null;

  return selectedMinutes * 60;
  }, [isMeditation, selectedMinutes, status.duration]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  useEffect(() => {
    player.loop = !isFixedAudio;

    return () => {
      clearTimers();
      player.pause();
    };
  }, [player, isFixedAudio]);

  const clearTimers = () => {
    if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
    if (clockIntervalRef.current) clearInterval(clockIntervalRef.current);
    finishTimeoutRef.current = null;
    clockIntervalRef.current = null;
  };

  const completeSession = () => {
    clearTimers();
    player.pause();
    setIsPlaying(false);
    setElapsedSeconds(totalSeconds || 0);
    progressAnim.setValue(1);

    if (isGuidedTalk) {
        setHasFinished(true);
        return;
    }
    saveListeningSession();
    setShowCompleteModal(true);
  };

  const stopSession = () => {
    clearTimers();
    player.pause();
    setIsPlaying(false);
    setElapsedSeconds(0);
    progressAnim.stopAnimation();
    progressAnim.setValue(0);
  };

  const startSession = () => {
    clearTimers();
    setElapsedSeconds(0);
    progressAnim.setValue(0);
    setHasFinished(false);

    (player as any).seekTo?.(0);

    (player as any).seekTo?.(0);
    player.loop = !isFixedAudio;
    player.play();
    setIsPlaying(true);

    if (totalSeconds !== null) {
    Animated.timing(progressAnim, {
        toValue: 1,
        duration: totalSeconds * 1000,
        easing: Easing.linear,
        useNativeDriver: false,
    }).start();

    clockIntervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => Math.min(prev + 0.1, totalSeconds));
    }, 100);

      finishTimeoutRef.current = setTimeout(() => {
        completeSession();
      }, totalSeconds * 1000);
    }
  };

  const handlePlayStop = () => {
    if (isPlaying) {
      stopSession();
    } else {
      startSession();
    }
  };

  const handleTimerSelect = (option: string) => {
    setSelectedTimer(option);
    stopSession();
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={colors.primary} />
        <Text style={styles.backText}>
            {backLabel || 'Nature Sounds'}
        </Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons
            name={(icon as any) || 'musical-note-outline'}
            size={70}
            color={colors.primary}
          />
        </View>

        <Text style={styles.title}>{soundTitle}</Text>
        <Text style={styles.subtitle}>
          {subtitle || 'Take a moment to relax'}
        </Text>

        {selectedTimer === '∞' ? (
          <Text style={styles.infinityText}>∞ Playing until stopped</Text>
        ) : (
          <View style={styles.progressWrapper}>
            <View style={styles.progressLine}>
              <Animated.View
                style={[
                  styles.progressFill,
                  { width: progressWidth },
                ]}
              />
            </View>

            <Text style={styles.progressText}>
                {formatTime(elapsedSeconds)} / {totalSeconds ? formatTime(totalSeconds) : selectedTimer}
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.playButton} onPress={handlePlayStop}>
          <Ionicons
            name={isPlaying ? 'stop' : 'play'}
            size={34}
            color="#FFFFFF"
          />
          <Text style={styles.playButtonText}>
            {isPlaying
                ? 'Stop'
                : hasFinished
                    ? 'Replay'
                    : 'Play'}
          </Text>
        </TouchableOpacity>

        {!isFixedAudio && (
            <>
                <Text style={styles.timerTitle}>Relaxation Time</Text>

                <View style={styles.timerContainer}>
                {timerOptions.map((option) => (
                    <TouchableOpacity
                    key={option}
                    style={[
                        styles.timerChip,
                        selectedTimer === option && styles.timerChipActive,
                    ]}
                    onPress={() => handleTimerSelect(option)}
                    >
                    <Text
                        style={[
                        styles.timerChipText,
                        selectedTimer === option && styles.timerChipTextActive,
                        ]}
                    >
                        {option}
                    </Text>
                    </TouchableOpacity>
                ))}
                </View>
            </>
        )}

        <Text style={styles.note}>
          {isGuidedTalk
            ? 'Listen, reflect, and take what feels helpful.'
            : isMeditation
                ? 'Take a deep breath and follow the guidance.'
                : 'Take a deep breath and let nature calm your mind.'}
        </Text>
      </View>

      <Modal transparent visible={showCompleteModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Session Complete 🌿</Text>
            <Text style={styles.modalText}>
              Great job taking a moment for yourself.{'\n'}
              We hope you're feeling a little calmer.
            </Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowCompleteModal(false);
                router.back();
              }}
            >
              <Text style={styles.modalButtonText}>Back to {backLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 34,
    paddingTop: 22,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 45,
  },
  backText: {
    marginLeft: 8,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 18,
  },
  content: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  title: {
    fontSize: 38,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: colors.subtext,
    textAlign: 'center',
    marginBottom: 34,
  },
  progressWrapper: {
    width: '100%',
    marginBottom: 28,
  },
  progressLine: {
    height: 9,
    borderRadius: 10,
    backgroundColor: '#E3D8CE',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 10,
  },
  progressText: {
    textAlign: 'center',
    marginTop: 10,
    color: colors.subtext,
    fontSize: 14,
    fontWeight: '600',
  },
  infinityText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 28,
  },
  playButton: {
    backgroundColor: colors.primary,
    borderRadius: 28,
    paddingVertical: 18,
    paddingHorizontal: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 28,
  },
  playButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  timerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 14,
  },
  timerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 28,
  },
  timerChip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  timerChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timerChipText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  timerChipTextActive: {
    color: '#FFFFFF',
  },
  note: {
    color: colors.subtext,
    fontSize: 14,
    textAlign: 'center',
  },
  modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.25)',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 28,
},
modalCard: {
  width: '100%',
  backgroundColor: colors.card,
  borderRadius: 28,
  padding: 28,
  alignItems: 'center',
  borderWidth: 1,
  borderColor: colors.border,
},
modalTitle: {
  fontSize: 24,
  fontWeight: '800',
  color: colors.primary,
  marginBottom: 14,
  textAlign: 'center',
},
modalText: {
  fontSize: 16,
  color: colors.text,
  textAlign: 'center',
  lineHeight: 24,
  marginBottom: 24,
},
modalButton: {
  backgroundColor: colors.primary,
  paddingVertical: 14,
  paddingHorizontal: 22,
  borderRadius: 22,
},
modalButtonText: {
  color: '#FFFFFF',
  fontSize: 16,
  fontWeight: '800',
},
});
