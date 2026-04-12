import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { colors } from '../constants/colors';

export default function ReflectionScreen() {
  const router = useRouter();

  const [stressLevel, setStressLevel] = useState<number | null>(null);
  const [anxious, setAnxious] = useState<string>('');
  const [notes, setNotes] = useState('');

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

        <View style={styles.card}>
          <Text style={styles.question}>How stressed were you today?</Text>
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
          <Text style={styles.question}>Did you feel anxious today?</Text>
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
          <Text style={styles.question}>What helped you calm down?</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Write notes here..."
            placeholderTextColor={colors.subtext}
            multiline
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => router.push('/data-view')}
        >
          <Text style={styles.saveButtonText}>Save Reflection</Text>
        </TouchableOpacity>
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
  },
  subtitle: {
    fontSize: 16,
    color: colors.subtext,
    marginBottom: 24,
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
  notesInput: {
    backgroundColor: '#FAF7F2',
    borderRadius: 18,
    minHeight: 120,
    padding: 14,
    textAlignVertical: 'top',
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});