import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { colors } from '../constants/colors';

const calmingToolOptions = [
  'Breathing',
  'Music',
  'Talking',
  'Rest',
  'Walk',
  'Journaling',
  'Meditation',
  'Relaxing sounds',
  'Game',
  'Family',
  'Sport',
  'Food',
  'Friends',
  'Nothing yet',
];

const moodOptions = ['Very low', 'Low', 'Okay', 'Good', 'Great'];
const sleepOptions = [
  'Less than 5',
  '5-6',
  '7-8',
  '9+',
];
const stressSourceOptions = [
  'School',
  'Work',
  'Relationships',
  'Health',
  'Family',
  'Other',
];
const exerciseDurationOptions = ['Under 20 min', '20-40 min', '40-60 min', '60+ min'];
const postReflectionFeelingOptions = [
  '🙂 Relieved',
  '😌 Calm',
  '😐 No change',
  '😟 Worse',
];

const reflectionSavedMessages = [
  'Every small step toward self-awareness matters.',
  'Be kind to yourself today.',
  'One reflection at a time, one step forward.',
  'Small daily habits can lead to meaningful change.',
  'Progress comes from consistency, not perfection.',
  "Take a deep breath - you've done something good for yourself today.",
  'Every reflection helps you understand yourself a little better.',
  'Keep moving forward at your own pace.',
  'You took time for yourself today, and that matters.',
  'Every day is a new opportunity to grow.',
  "You don't have to have everything figured out today.",
  'Take what you learned today with you into tomorrow.',
  'Every check-in is an investment in your well-being.',
  "You've taken an important step by reflecting today.",
  'Remember to celebrate even the smallest victories.',
  'Growth happens one day at a time.',
  'Your well-being deserves your attention.',
  'Keep showing up for yourself.',
  'Even small moments of reflection can make a difference.',
  'Tomorrow is another chance to begin with a fresh perspective.',
];

const getRandomSavedReflectionMessage = () => {
  const index = Math.floor(Math.random() * reflectionSavedMessages.length);
  return reflectionSavedMessages[index];
};

type SavedReflection = {
  id: number;
  stress_level: number;
  anxious: boolean;
  notes: string | null;
  calming_tools: string[];
  mood: string | null;
  sleep_quality: string | null;
  stress_source: string | null;
  stress_sources: string[];
  exercised: boolean | null;
  exercise_duration: string | null;
  post_reflection_feeling: string | null;
  reflection_date: string;
};

export default function ReflectionScreen() {
  const router = useRouter();

  const [stressLevel, setStressLevel] = useState<number | null>(null);
  const [anxious, setAnxious] = useState<string>('');
  const [calmingTools, setCalmingTools] = useState<string[]>([]);
  const [mood, setMood] = useState('');
  const [sleepQuality, setSleepQuality] = useState('');
  const [stressSources, setStressSources] = useState<string[]>([]);
  const [exercised, setExercised] = useState<string>('');
  const [exerciseDuration, setExerciseDuration] = useState('');
  const [postReflectionFeeling, setPostReflectionFeeling] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [savedReflection, setSavedReflection] = useState<SavedReflection | null>(null);
  const [savedMessage, setSavedMessage] = useState('');
  const [isEditing, setIsEditing] = useState(true);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);

  useEffect(() => {
    const loadTodayReflection = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('currentUser');

        if (!storedUser) {
          router.replace('/');
          return;
        }

        const user = JSON.parse(storedUser);
        const response = await fetch(
          `http://localhost:6001/reflections/${user.id}/today`
        );
        const data = await response.json();

        if (response.ok && data.reflection) {
          setSavedReflection(data.reflection);
          setSavedMessage(getRandomSavedReflectionMessage());
          setStressLevel(data.reflection.stress_level);
          setAnxious(data.reflection.anxious ? 'Yes' : 'No');
          setCalmingTools(data.reflection.calming_tools || []);
          setMood(data.reflection.mood || '');
          setSleepQuality(data.reflection.sleep_quality || '');
          setStressSources(
            data.reflection.stress_sources ||
              (data.reflection.stress_source ? [data.reflection.stress_source] : [])
          );
          setExercised(
            typeof data.reflection.exercised === 'boolean'
              ? data.reflection.exercised
                ? 'Yes'
                : 'No'
              : ''
          );
          setExerciseDuration(data.reflection.exercise_duration || '');
          setPostReflectionFeeling(data.reflection.post_reflection_feeling || '');
          setNotes(data.reflection.notes || '');
          setIsEditing(false);
        }
      } catch (error) {
        console.log('Failed to load today reflection:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTodayReflection();
  }, [router]);

  const handleSaveReflection = async () => {
    setHasTriedSubmit(true);

    const missingFields = [];

    if (!stressLevel) missingFields.push('stress level');
    if (!anxious) missingFields.push('anxiety');
    if (!mood) missingFields.push('mood');
    if (!sleepQuality) missingFields.push('sleep hours');
    if (stressSources.length === 0) missingFields.push('stress sources');
    if (!exercised) missingFields.push('exercise');
    if (exercised === 'Yes' && !exerciseDuration) {
      missingFields.push('exercise duration');
    }
    if (calmingTools.length === 0) missingFields.push('what helped you calm down');
    if (!postReflectionFeeling) missingFields.push('how you feel right now');

    if (missingFields.length > 0) {
      return;
    }

    try {
      setIsSaving(true);

      const storedUser = await AsyncStorage.getItem('currentUser');

      if (!storedUser) {
        Alert.alert('Not signed in', 'Please sign in again before saving.');
        router.replace('/');
        return;
      }

      const user = JSON.parse(storedUser);

      const response = await fetch('http://localhost:6001/reflections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          stressLevel,
          anxious: anxious === 'Yes',
          calmingTools,
          mood,
          sleepQuality,
          stressSources,
          exercised:
            exercised === 'Yes'
              ? true
              : exercised === 'No'
                ? false
                : null,
          exerciseDuration: exercised === 'Yes' ? exerciseDuration : '',
          postReflectionFeeling,
          notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Save failed', data.message || 'Could not save reflection.');
        return;
      }

      setSavedReflection(data.reflection);
      setSavedMessage(getRandomSavedReflectionMessage());
      setStressLevel(data.reflection.stress_level);
      setAnxious(data.reflection.anxious ? 'Yes' : 'No');
      setCalmingTools(data.reflection.calming_tools || []);
      setMood(data.reflection.mood || '');
      setSleepQuality(data.reflection.sleep_quality || '');
      setStressSources(data.reflection.stress_sources || []);
      setExercised(
        typeof data.reflection.exercised === 'boolean'
          ? data.reflection.exercised
            ? 'Yes'
            : 'No'
          : ''
      );
      setExerciseDuration(data.reflection.exercise_duration || '');
      setPostReflectionFeeling(data.reflection.post_reflection_feeling || '');
      setNotes(data.reflection.notes || '');
      setHasTriedSubmit(false);
      setIsEditing(false);
    } catch {
      Alert.alert('Connection error', 'Could not connect to the server.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStressSource = (source: string) => {
    setStressSources((currentSources) => {
      if (currentSources.includes(source)) {
        return currentSources.filter((item) => item !== source);
      }

      return [...currentSources, source];
    });
  };

  const toggleCalmingTool = (tool: string) => {
    setCalmingTools((currentTools) => {
      if (tool === 'Nothing yet') {
        return currentTools.includes(tool) ? [] : [tool];
      }

      const withoutNothing = currentTools.filter((item) => item !== 'Nothing yet');

      if (withoutNothing.includes(tool)) {
        return withoutNothing.filter((item) => item !== tool);
      }

      return [...withoutNothing, tool];
    });
  };

  const renderRequired = (isMissing: boolean) =>
    hasTriedSubmit && isMissing ? (
      <Text style={styles.requiredInline}> * Required</Text>
    ) : null;

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
        <Text style={styles.title}>Daily Reflection</Text>
        <Text style={styles.subtitle}>Take a minute to reflect on your day</Text>

        {isLoading ? (
          <View style={styles.card}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : savedReflection && !isEditing ? (
          <View style={styles.savedCard}>
            <Text style={styles.savedTitle}>Reflection saved</Text>
            <View style={styles.savedMessageBox}>
              <Text style={styles.savedMessage}>
                {savedMessage || getRandomSavedReflectionMessage()}
              </Text>
            </View>
            <Text style={styles.savedText}>
              Stress level: {savedReflection.stress_level}
            </Text>
            <Text style={styles.savedText}>
              Anxious: {savedReflection.anxious ? 'Yes' : 'No'}
            </Text>
            {!!savedReflection.mood && (
              <Text style={styles.savedText}>Mood: {savedReflection.mood}</Text>
            )}
            {!!savedReflection.sleep_quality && (
              <Text style={styles.savedText}>
                Sleep: {savedReflection.sleep_quality}
              </Text>
            )}
            {savedReflection.stress_sources.length > 0 && (
              <Text style={styles.savedText}>
                Stress sources: {savedReflection.stress_sources.join(', ')}
              </Text>
            )}
            {typeof savedReflection.exercised === 'boolean' && (
              <Text style={styles.savedText}>
                Exercise: {savedReflection.exercised ? 'Yes' : 'No'}
              </Text>
            )}
            {!!savedReflection.exercise_duration && (
              <Text style={styles.savedText}>
                Exercise duration: {savedReflection.exercise_duration}
              </Text>
            )}
            {!!savedReflection.post_reflection_feeling && (
              <Text style={styles.savedText}>
                Feeling after reflection: {savedReflection.post_reflection_feeling}
              </Text>
            )}
            {savedReflection.calming_tools.length > 0 && (
              <View style={styles.savedToolsRow}>
                {savedReflection.calming_tools.map((tool) => (
                  <Text key={tool} style={styles.savedToolChip}>
                    {tool}
                  </Text>
                ))}
              </View>
            )}
            {!!savedReflection.notes && (
              <Text style={styles.savedNotes}>{savedReflection.notes}</Text>
            )}
            <Text style={styles.savedHint}>
              Come back tomorrow for a new reflection.
            </Text>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => {
                setHasTriedSubmit(false);
                setIsEditing(true);
              }}
            >
              <Text style={styles.saveButtonText}>{"Edit Today's Reflection"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push('/data-view')}
            >
              <Text style={styles.secondaryButtonText}>View Data</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.question}>
                How stressed were you today?
                {renderRequired(!stressLevel)}
              </Text>
              <View style={styles.scaleRow}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.scaleButton,
                      stressLevel === num && styles.selectedScaleButton,
                    ]}
                    onPress={() => setStressLevel(num)}
                  >
                    <Text
                      style={[
                        styles.scaleButtonText,
                        stressLevel === num && styles.selectedScaleButtonText,
                      ]}
                    >
                      {num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.question}>
                Did you feel anxious today?
                {renderRequired(!anxious)}
              </Text>
              <View style={styles.answerRow}>
                <TouchableOpacity
                  style={[
                    styles.answerButton,
                    anxious === 'Yes' && styles.selectedAnswerButton,
                  ]}
                  onPress={() => setAnxious('Yes')}
                >
                  <Text style={styles.answerText}>Yes</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.answerButton,
                    anxious === 'No' && styles.selectedAnswerButton,
                  ]}
                  onPress={() => setAnxious('No')}
                >
                  <Text style={styles.answerText}>No</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.question}>
                How was your mood today?
                {renderRequired(!mood)}
              </Text>
              <View style={styles.toolsRow}>
                {moodOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.toolChip,
                      mood === option && styles.selectedToolChip,
                    ]}
                    onPress={() => setMood(option)}
                  >
                    <Text
                      style={[
                        styles.toolChipText,
                        mood === option && styles.selectedToolChipText,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.question}>
                How many hours did you sleep?
                {renderRequired(!sleepQuality)}
              </Text>
              <View style={styles.toolsRow}>
                {sleepOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.toolChip,
                      sleepQuality === option && styles.selectedToolChip,
                    ]}
                    onPress={() => setSleepQuality(option)}
                  >
                    <Text
                      style={[
                        styles.toolChipText,
                        sleepQuality === option && styles.selectedToolChipText,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.question}>
                What were your sources of stress today?
                {renderRequired(stressSources.length === 0)}
              </Text>
              <View style={styles.toolsRow}>
                {stressSourceOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.toolChip,
                      stressSources.includes(option) && styles.selectedToolChip,
                    ]}
                    onPress={() => toggleStressSource(option)}
                  >
                    <Text
                      style={[
                        styles.toolChipText,
                        stressSources.includes(option) && styles.selectedToolChipText,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.question}>
                Did you exercise today?
                {renderRequired(!exercised)}
              </Text>
              <View style={styles.answerRow}>
                <TouchableOpacity
                  style={[
                    styles.answerButton,
                    exercised === 'Yes' && styles.selectedAnswerButton,
                  ]}
                  onPress={() => setExercised('Yes')}
                >
                  <Text style={styles.answerText}>Yes</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.answerButton,
                    exercised === 'No' && styles.selectedAnswerButton,
                  ]}
                  onPress={() => {
                    setExercised('No');
                    setExerciseDuration('');
                  }}
                >
                  <Text style={styles.answerText}>No</Text>
                </TouchableOpacity>
              </View>
            </View>

            {exercised === 'Yes' && (
              <View style={styles.card}>
                <Text style={styles.question}>
                  For how long?
                  {renderRequired(!exerciseDuration)}
                </Text>
                <View style={styles.toolsRow}>
                  {exerciseDurationOptions.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.toolChip,
                        exerciseDuration === option && styles.selectedToolChip,
                      ]}
                      onPress={() => setExerciseDuration(option)}
                    >
                      <Text
                        style={[
                          styles.toolChipText,
                          exerciseDuration === option && styles.selectedToolChipText,
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.card}>
              <Text style={styles.question}>
                What helped you calm down?
                {renderRequired(calmingTools.length === 0)}
              </Text>
              <View style={styles.toolsRow}>
                {calmingToolOptions.map((tool) => (
                  <TouchableOpacity
                    key={tool}
                    style={[
                      styles.toolChip,
                      calmingTools.includes(tool) && styles.selectedToolChip,
                    ]}
                    onPress={() => toggleCalmingTool(tool)}
                  >
                    <Text
                      style={[
                        styles.toolChipText,
                        calmingTools.includes(tool) && styles.selectedToolChipText,
                      ]}
                    >
                      {tool}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.question}>Anything on your mind today?</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Write a short note..."
                placeholderTextColor={colors.subtext}
                multiline
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.question}>
                How are you feeling right now?
                {renderRequired(!postReflectionFeeling)}
              </Text>
              <View style={styles.toolsRow}>
                {postReflectionFeelingOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.toolChip,
                      postReflectionFeeling === option && styles.selectedToolChip,
                    ]}
                    onPress={() => setPostReflectionFeeling(option)}
                  >
                    <Text
                      style={[
                        styles.toolChipText,
                        postReflectionFeeling === option && styles.selectedToolChipText,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Text style={styles.almostDoneText}>{"You're almost done 🌱"}</Text>

            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              disabled={isSaving}
              onPress={handleSaveReflection}
            >
              <Text style={styles.saveButtonText}>
                {isSaving ? 'Saving...' : "Save today's reflection"}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
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
    paddingTop: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    marginLeft: 18,
  },
  subtitle: {
    fontSize: 16,
    color: colors.subtext,
    marginBottom: 24,
    marginLeft: 18,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  question: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  requiredInline: {
    color: '#C94F45',
    fontSize: 14,
    fontWeight: '800',
  },
  scaleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scaleButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F4EFE8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedScaleButton: {
    backgroundColor: colors.accent,
  },
  scaleButtonText: {
    color: colors.text,
    fontWeight: '700',
  },
  selectedScaleButtonText: {
    color: '#fff',
  },
  answerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  answerButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: '#F4EFE8',
    alignItems: 'center',
  },
  selectedAnswerButton: {
    backgroundColor: colors.secondary,
  },
  answerText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  toolsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  toolChip: {
    backgroundColor: '#F4EFE8',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  selectedToolChip: {
    backgroundColor: colors.secondary,
  },
  toolChipText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  selectedToolChipText: {
    color: colors.text,
  },
  notesInput: {
    backgroundColor: '#FAF7F2',
    borderRadius: 18,
    minHeight: 110,
    padding: 14,
    textAlignVertical: 'top',
    color: colors.text,
    fontSize: 15,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  almostDoneText: {
    color: colors.subtext,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.65,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  savedCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
  },
  savedTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 10,
  },
  savedMessageBox: {
    backgroundColor: '#FAF1E7',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAD8C8',
    marginBottom: 18,
  },
  savedMessage: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '700',
    lineHeight: 23,
  },
  savedText: {
    fontSize: 17,
    color: colors.text,
    fontWeight: '700',
    marginBottom: 8,
  },
  savedToolsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    marginBottom: 16,
  },
  savedToolChip: {
    backgroundColor: '#F4EFE8',
    color: colors.text,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '700',
    overflow: 'hidden',
  },
  savedNotes: {
    backgroundColor: '#FAF7F2',
    borderRadius: 18,
    padding: 14,
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  savedHint: {
    color: colors.subtext,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
  },
  secondaryButton: {
    backgroundColor: '#F4EFE8',
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
});
