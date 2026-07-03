import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../constants/colors';

type ViewMode = 'daily' | 'weekly' | 'monthly';

type Reflection = {
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

type BreathingSummary = {
  totalSessions: number;
  breathingDays: number;
  todaySessions: number;
};

const formatShortDate = (dateValue: string) => {
  const date = new Date(dateValue);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

const formatWeekday = (dateValue: string) => {
  const date = new Date(dateValue);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
};

const getWeekKey = (dateValue: string) => {
  const date = new Date(dateValue);
  const start = new Date(date.getFullYear(), 0, 1);
  const day = Math.floor((date.getTime() - start.getTime()) / 86400000);
  return `Week ${Math.ceil((day + start.getDay() + 1) / 7)}`;
};

const getMonthKey = (dateValue: string) => {
  const date = new Date(dateValue);
  return `${date.getMonth() + 1}/${String(date.getFullYear()).slice(-2)}`;
};

const average = (values: number[]) =>
  Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);

const getStressColor = (value: number) => {
  if (value <= 3) return colors.secondary;
  if (value <= 6) return colors.accent;
  return '#C9786C';
};

const groupReflectionData = (
  reflections: Reflection[],
  getKey: (dateValue: string) => string,
  limit: number
) => {
  const groups = new Map<string, Reflection[]>();

  reflections
    .slice()
    .reverse()
    .forEach((reflection) => {
      const key = getKey(reflection.reflection_date);
      groups.set(key, [...(groups.get(key) || []), reflection]);
    });

  const entries = Array.from(groups.entries()).slice(-limit);

  return {
    labels: entries.map(([label]) => label),
    data: entries.map(([, values]) =>
      average(values.map((reflection) => reflection.stress_level))
    ),
    anxiety: entries.map(([, values]) =>
      values.some((reflection) => reflection.anxious)
    ),
  };
};

const getMostHelpfulTool = (reflections: Reflection[]) => {
  const counts = new Map<string, number>();

  reflections.forEach((reflection) => {
    reflection.calming_tools.forEach((tool) => {
      counts.set(tool, (counts.get(tool) || 0) + 1);
    });
  });

  const sortedTools = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  return sortedTools[0] || null;
};

const getTopStressSource = (reflections: Reflection[]) => {
  const counts = new Map<string, number>();

  reflections.forEach((reflection) => {
    const sources =
      reflection.stress_sources?.length > 0
        ? reflection.stress_sources
        : reflection.stress_source
          ? [reflection.stress_source]
          : [];

    sources.forEach((source) => {
      counts.set(source, (counts.get(source) || 0) + 1);
    });
  });

  const sortedSources = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  return sortedSources[0] || null;
};

export default function DataViewScreen() {
  const router = useRouter();
  const [selectedView, setSelectedView] = useState<ViewMode>('daily');
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [breathingSummary, setBreathingSummary] = useState<BreathingSummary>({
    totalSessions: 0,
    breathingDays: 0,
    todaySessions: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadReflections = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('currentUser');

        if (!storedUser) {
          router.replace('/');
          return;
        }

        const user = JSON.parse(storedUser);
        const [reflectionResponse, breathingResponse] = await Promise.all([
          fetch(`http://localhost:6001/reflections/${user.id}`),
          fetch(`http://localhost:6001/breathing/${user.id}/summary`),
        ]);
        const reflectionData = await reflectionResponse.json();
        const breathingData = await breathingResponse.json();

        if (reflectionResponse.ok) {
          setReflections(reflectionData.reflections || []);
        }

        if (breathingResponse.ok) {
          setBreathingSummary({
            totalSessions: breathingData.totalSessions || 0,
            breathingDays: breathingData.breathingDays || 0,
            todaySessions: breathingData.todaySessions || 0,
          });
        }
      } catch (error) {
        console.log('Failed to load reflections:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadReflections();
  }, [router]);

  const getChartData = () => {
    if (selectedView === 'daily') {
      const recentDaily = reflections.slice(0, 7).reverse();

      return {
        title: 'Stress by Day',
        data: recentDaily.map((reflection) => reflection.stress_level),
        labels: recentDaily.map((reflection) => formatWeekday(reflection.reflection_date)),
        anxiety: recentDaily.map((reflection) => reflection.anxious),
      };
    }

    if (selectedView === 'weekly') {
      const grouped = groupReflectionData(reflections, getWeekKey, 4);

      return {
        title: 'Weekly Average Stress',
        data: grouped.data,
        labels: grouped.labels,
        anxiety: grouped.anxiety,
      };
    }

    const grouped = groupReflectionData(reflections, getMonthKey, 6);

    return {
      title: 'Monthly Average Stress',
      data: grouped.data,
      labels: grouped.labels,
      anxiety: grouped.anxiety,
    };
  };

  const chartData = getChartData();
  const maxValue = 10;
  const averageStress =
    reflections.length === 0
      ? null
      : average(reflections.map((reflection) => reflection.stress_level));
  const anxietyDays = reflections.filter((reflection) => reflection.anxious).length;
  const exerciseDays = reflections.filter((reflection) => reflection.exercised === true).length;
  const postReflectionFeelings = reflections.filter(
    (reflection) => !!reflection.post_reflection_feeling
  );
  const calmerAfterReflection = postReflectionFeelings.filter((reflection) =>
    ['Relieved', 'Calm'].some((feeling) =>
      reflection.post_reflection_feeling?.includes(feeling)
    )
  ).length;
  const mostHelpfulTool = getMostHelpfulTool(reflections);
  const topStressSource = getTopStressSource(reflections);

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
        <Text style={styles.title}>Data View</Text>
        <Text style={styles.subtitle}>
          See your stress data across days, weeks, and months
        </Text>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedView === 'daily' && styles.activeTabButton,
            ]}
            onPress={() => setSelectedView('daily')}
          >
            <Text
              style={[
                styles.tabText,
                selectedView === 'daily' && styles.activeTabText,
              ]}
            >
              Days
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedView === 'weekly' && styles.activeTabButton,
            ]}
            onPress={() => setSelectedView('weekly')}
          >
            <Text
              style={[
                styles.tabText,
                selectedView === 'weekly' && styles.activeTabText,
              ]}
            >
              Weeks
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedView === 'monthly' && styles.activeTabButton,
            ]}
            onPress={() => setSelectedView('monthly')}
          >
            <Text
              style={[
                styles.tabText,
                selectedView === 'monthly' && styles.activeTabText,
              ]}
            >
              Months
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.card}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Average stress</Text>
                <Text style={styles.summaryValue}>
                  {averageStress === null ? '-' : `${averageStress}/10`}
                </Text>
              </View>

              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Anxiety days</Text>
                <Text style={styles.summaryValue}>
                  {anxietyDays}/{reflections.length}
                </Text>
              </View>
            </View>

            <View style={styles.summaryGrid}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Breathing days</Text>
                <Text style={styles.summaryValue}>
                  {breathingSummary.breathingDays}
                </Text>
              </View>

              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Exercise days</Text>
                <Text style={styles.summaryValue}>
                  {exerciseDays}/{reflections.length}
                </Text>
              </View>
            </View>

            <View style={styles.summaryGrid}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Felt calmer after</Text>
                <Text style={styles.summaryValue}>
                  {postReflectionFeelings.length === 0
                    ? '-'
                    : `${calmerAfterReflection}/${postReflectionFeelings.length}`}
                </Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Most Helpful</Text>
              {mostHelpfulTool ? (
                <Text style={styles.helpfulText}>
                  {mostHelpfulTool[0]} helped on {mostHelpfulTool[1]}{' '}
                  {mostHelpfulTool[1] === 1 ? 'day' : 'days'}.
                </Text>
              ) : (
                <Text style={styles.emptyText}>
                  Select calming tools in Daily Reflection to see what helps most.
                </Text>
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Main Stress Source</Text>
              {topStressSource ? (
                <Text style={styles.helpfulText}>
                  {topStressSource[0]} appeared on {topStressSource[1]}{' '}
                  {topStressSource[1] === 1 ? 'day' : 'days'}.
                </Text>
              ) : (
                <Text style={styles.emptyText}>
                  Select a stress source in Daily Reflection to see patterns here.
                </Text>
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{chartData.title}</Text>

              {chartData.data.length === 0 ? (
                <Text style={styles.emptyText}>
                  Save your first daily reflection to see your stress data here.
                </Text>
              ) : (
                <View style={styles.chart}>
                  {chartData.data.map((value, index) => (
                    <View key={`${chartData.labels[index]}-${index}`} style={styles.barWrapper}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: (value / maxValue) * 140 + 20,
                            backgroundColor: getStressColor(value),
                          },
                        ]}
                      />
                      <Text style={styles.barValue}>{value}</Text>
                      <Text style={styles.barLabel}>{chartData.labels[index]}</Text>
                    </View>
                  ))}
                </View>
              )}

              {reflections.length > 0 && reflections.length < 3 && (
                <Text style={styles.patternHint}>
                  Keep checking in to see your pattern over time.
                </Text>
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Reflection History</Text>

              {reflections.length === 0 ? (
                <Text style={styles.emptyText}>No reflections saved yet.</Text>
              ) : (
                reflections.slice(0, 4).map((reflection) => (
                  <View key={reflection.id} style={styles.historyItem}>
                    <View style={styles.historyHeader}>
                      <Text style={styles.historyDate}>
                        {formatShortDate(reflection.reflection_date)}
                      </Text>
                      <View
                        style={[
                          styles.stressPill,
                          { backgroundColor: getStressColor(reflection.stress_level) },
                        ]}
                      >
                        <Text style={styles.stressPillText}>
                          {reflection.stress_level}/10
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.historyText}>
                      Anxiety: {reflection.anxious ? 'Yes' : 'No'}
                    </Text>
                    <View style={styles.historyMetaGrid}>
                      {!!reflection.mood && (
                        <Text style={styles.historyMeta}>Mood: {reflection.mood}</Text>
                      )}
                      {!!reflection.sleep_quality && (
                        <Text style={styles.historyMeta}>
                          Sleep hours: {reflection.sleep_quality}
                        </Text>
                      )}
                      {(reflection.stress_sources?.length > 0 ||
                        !!reflection.stress_source) && (
                        <Text style={styles.historyMeta}>
                          Stress sources:{' '}
                          {(reflection.stress_sources?.length > 0
                            ? reflection.stress_sources
                            : [reflection.stress_source]
                          ).join(', ')}
                        </Text>
                      )}
                      {typeof reflection.exercised === 'boolean' && (
                        <Text style={styles.historyMeta}>
                          Exercise: {reflection.exercised ? 'Yes' : 'No'}
                        </Text>
                      )}
                      {!!reflection.exercise_duration && (
                        <Text style={styles.historyMeta}>
                          Exercise duration: {reflection.exercise_duration}
                        </Text>
                      )}
                      {!!reflection.post_reflection_feeling && (
                        <Text style={styles.historyMeta}>
                          Feeling after reflection: {reflection.post_reflection_feeling}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.historyLabel}>
                      What helped you calm down?
                    </Text>
                    {reflection.calming_tools.length > 0 ? (
                      <View style={styles.historyToolsRow}>
                        {reflection.calming_tools.map((tool) => (
                          <Text key={tool} style={styles.historyToolChip}>
                            {tool}
                          </Text>
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.historyNotes}>
                        No calming tools selected
                      </Text>
                    )}
                    {!!reflection.notes && (
                      <>
                        <Text style={styles.historyLabel}>
                          Remember
                        </Text>
                        <Text style={styles.historyNotes}>{reflection.notes}</Text>
                      </>
                    )}
                  </View>
                ))
              )}
            </View>
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
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 18,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeTabButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  activeTabText: {
    color: '#fff',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 18,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.subtext,
    marginBottom: 8,
    fontWeight: '700',
  },
  summaryValue: {
    fontSize: 24,
    color: colors.primary,
    fontWeight: '800',
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 180,
  },
  barWrapper: {
    alignItems: 'center',
  },
  bar: {
    width: 28,
    borderRadius: 12,
    backgroundColor: colors.secondary,
    marginBottom: 8,
  },
  barLabel: {
    fontSize: 12,
    color: colors.subtext,
  },
  barValue: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 15,
    color: colors.subtext,
    lineHeight: 22,
  },
  patternHint: {
    marginTop: 16,
    color: colors.subtext,
    fontSize: 14,
    lineHeight: 20,
  },
  helpfulText: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 24,
  },
  historyItem: {
    backgroundColor: '#FAF7F2',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  historyDate: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  stressPill: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  stressPillText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  historyText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  historyMetaGrid: {
    gap: 6,
    marginBottom: 12,
  },
  historyMeta: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  historyLabel: {
    color: colors.subtext,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 5,
  },
  historyNotes: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 21,
  },
  historyToolsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  historyToolChip: {
    backgroundColor: colors.card,
    color: colors.text,
    borderRadius: 16,
    paddingVertical: 7,
    paddingHorizontal: 11,
    fontSize: 13,
    fontWeight: '700',
    overflow: 'hidden',
  },
});
