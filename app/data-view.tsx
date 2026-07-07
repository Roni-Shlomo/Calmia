import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { API_URL } from '../constants/api';
import { colors } from '../constants/colors';

type TimeRange = '7d' | '30d' | 'all';
type TopInsightMode = 'stress' | 'calming';

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

type ChartData = {
  title: string;
  data: (number | null)[];
  labels: string[];
};

type SleepStressItem = {
  label: string;
  averageStress: number | null;
  count: number;
};

type MoodDistributionItem = {
  label: string;
  value: number;
  percent: number;
  color: string;
};

type StressSourceItem = {
  label: string;
  value: number;
  rank: number;
};

type ExerciseStressData = {
  exerciseDays: number;
  exerciseRate: number | null;
  exerciseAverageStress: number | null;
  nonExerciseAverageStress: number | null;
};

type AiAnalysisResult = {
  summary: {
    title: string;
    text: string;
  };
  patterns: {
    title: string;
    insight: string;
    confidence: 'low' | 'medium' | 'high';
  }[];
  helpfulStrategies: {
    name: string;
    insight: string;
    confidence: 'low' | 'medium' | 'high';
  }[];
  gentleSuggestion: {
    title: string;
    text: string;
  };
  encouragingMessage: string;
};

const getDateKey = (dateValue: string | Date) => {
  const date = new Date(dateValue);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDayMonth = (date: Date) => `${date.getDate()}/${date.getMonth() + 1}`;

const moodScores: Record<string, number> = {
  'Very Low': 1,
  'Very low': 1,
  Bad: 2,
  Low: 2,
  Okay: 3,
  Good: 4,
  Great: 5,
};

const moodLabels = [
  { label: 'Very Low', score: 1, color: '#C9786C' },
  { label: 'Bad', score: 2, color: '#E29A52' },
  { label: 'Okay', score: 3, color: '#F1D98E' },
  { label: 'Good', score: 4, color: '#A8BE7B' },
  { label: 'Great', score: 5, color: '#7FA66F' },
];

const sleepGroups = ['Less than 5', '5-6', '7-8', '9+'];

const formatWeekday = (dateValue: string) => {
  const date = new Date(dateValue);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
};

const getMonthKey = (dateValue: string) => {
  const date = new Date(dateValue);
  return `${date.getMonth() + 1}/${String(date.getFullYear()).slice(-2)}`;
};

const average = (values: number[]) =>
  Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);

const averageDecimal = (values: number[]) => {
  if (values.length === 0) return null;
  const value = values.reduce((sum, item) => sum + item, 0) / values.length;
  return Math.round(value * 10) / 10;
};

const getAverageMood = (reflections: Reflection[]) => {
  const scores = reflections
    .map((reflection) => (reflection.mood ? moodScores[reflection.mood] : null))
    .filter((score): score is number => typeof score === 'number');

  if (scores.length === 0) return null;

  const roundedScore = Math.round(
    scores.reduce((sum, score) => sum + score, 0) / scores.length
  );

  return moodLabels.find((mood) => mood.score === roundedScore)?.label || 'Okay';
};

const getRangeStartDate = (timeRange: TimeRange) => {
  if (timeRange === 'all') return null;

  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - (timeRange === '7d' ? 6 : 29));
  return date;
};

const getStressColor = (value: number) => {
  if (value <= 3) return colors.secondary;
  if (value <= 6) return colors.accent;
  return '#C9786C';
};

const getStressSourceQuantityColor = (value: number, maxValue: number) => {
  const ratio = maxValue === 0 ? 0 : value / maxValue;

  if (ratio >= 0.7) return '#C9786C';
  if (ratio >= 0.4) return colors.accent;
  return colors.secondary;
};

const getPositiveQuantityColor = (value: number, maxValue: number) => {
  const ratio = maxValue === 0 ? 0 : value / maxValue;

  if (ratio >= 0.7) return colors.secondary;
  if (ratio >= 0.4) return '#F1D98E';
  return '#D8D1C8';
};

const getPolarPoint = (centerX: number, centerY: number, radius: number, angle: number) => {
  const radians = ((angle - 90) * Math.PI) / 180;

  return {
    x: centerX + radius * Math.cos(radians),
    y: centerY + radius * Math.sin(radians),
  };
};

const getPiePath = (
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number
) => {
  const start = getPolarPoint(centerX, centerY, radius, endAngle);
  const end = getPolarPoint(centerX, centerY, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    `M ${centerX} ${centerY}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    'Z',
  ].join(' ');
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
  };
};

const getDailyChartData = (reflections: Reflection[], days: number) => {
  const reflectionsByDate = new Map<string, Reflection>();

  reflections.forEach((reflection) => {
    reflectionsByDate.set(getDateKey(reflection.reflection_date), reflection);
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (days - 1 - index));
    const reflection = reflectionsByDate.get(getDateKey(date));

    return {
      label: days === 7 ? formatWeekday(date.toISOString()) : formatDayMonth(date),
      value: reflection?.stress_level ?? null,
    };
  });
};

const getSleepStressData = (reflections: Reflection[]): SleepStressItem[] =>
  sleepGroups.map((sleepGroup) => {
    const entries = reflections.filter(
      (reflection) => reflection.sleep_quality === sleepGroup
    );

    return {
      label: sleepGroup,
      averageStress: averageDecimal(
        entries.map((reflection) => reflection.stress_level)
      ),
      count: entries.length,
    };
  });

const getExerciseStressData = (reflections: Reflection[]): ExerciseStressData => {
  const exerciseEntries = reflections.filter((reflection) => reflection.exercised === true);
  const nonExerciseEntries = reflections.filter(
    (reflection) => reflection.exercised === false
  );

  return {
    exerciseDays: exerciseEntries.length,
    exerciseRate:
      reflections.length === 0
        ? null
        : Math.round((exerciseEntries.length / reflections.length) * 100),
    exerciseAverageStress: averageDecimal(
      exerciseEntries.map((reflection) => reflection.stress_level)
    ),
    nonExerciseAverageStress: averageDecimal(
      nonExerciseEntries.map((reflection) => reflection.stress_level)
    ),
  };
};


const getMoodDistribution = (reflections: Reflection[]): MoodDistributionItem[] => {
  const totalMoodAnswers = reflections.filter((reflection) => !!reflection.mood).length;

  return moodLabels.map((mood) => {
    const value = reflections.filter((reflection) => {
      if (mood.label === 'Very Low') {
        return reflection.mood === 'Very Low' || reflection.mood === 'Very low';
      }

      if (mood.label === 'Bad') {
        return reflection.mood === 'Bad' || reflection.mood === 'Low';
      }

      return reflection.mood === mood.label;
    }).length;

    return {
      label: mood.label,
      value,
      percent: totalMoodAnswers === 0 ? 0 : Math.round((value / totalMoodAnswers) * 100),
      color: mood.color,
    };
  });
};

const getReflectionStressSources = (reflection: Reflection) => {
  const filterStressSources = (sources: string[]) =>
    sources.filter((source) => source !== 'Nothing');

  if (reflection.stress_sources?.length > 0) {
    return filterStressSources(reflection.stress_sources);
  }

  return reflection.stress_source && reflection.stress_source !== 'Nothing'
    ? [reflection.stress_source]
    : [];
};

const getStressSourceBreakdown = (reflections: Reflection[]): StressSourceItem[] => {
  const counts = new Map<string, number>();

  reflections.forEach((reflection) => {
    getReflectionStressSources(reflection).forEach((source) => {
      counts.set(source, (counts.get(source) || 0) + 1);
    });
  });

  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((first, second) => second.value - first.value)
    .map((item, index) => ({ ...item, rank: index + 1 }));
};

const getTopStressSources = (reflections: Reflection[]): StressSourceItem[] =>
  getStressSourceBreakdown(reflections).slice(0, 3);

const getCalmingMethodBreakdown = (reflections: Reflection[]): StressSourceItem[] => {
  const counts = new Map<string, number>();

  reflections.forEach((reflection) => {
    reflection.calming_tools?.forEach((method) => {
      counts.set(method, (counts.get(method) || 0) + 1);
    });
  });

  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((first, second) => second.value - first.value)
    .map((item, index) => ({ ...item, rank: index + 1 }));
};

const getTopCalmingMethods = (reflections: Reflection[]): StressSourceItem[] =>
  getCalmingMethodBreakdown(reflections).slice(0, 3);

export default function DataViewScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [selectedRange, setSelectedRange] = useState<TimeRange>('7d');
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showStressSourceDetails, setShowStressSourceDetails] = useState(false);
  const [showCalmingMethodDetails, setShowCalmingMethodDetails] = useState(false);
  const [selectedTopInsight, setSelectedTopInsight] =
    useState<TopInsightMode>('stress');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysisResult | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    const loadReflections = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('currentUser');

        if (!storedUser) {
          router.replace('/');
          return;
        }

        const user = JSON.parse(storedUser);
        setCurrentUserId(user.id);
        const reflectionResponse = await fetch(
          `${API_URL}/reflections/${user.id}`
        );
        const reflectionData = await reflectionResponse.json();

        if (reflectionResponse.ok) {
          setReflections(reflectionData.reflections || []);
        }
      } catch (error) {
        console.log('Failed to load reflections:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadReflections();
  }, [router]);

  useEffect(() => {
    setAiAnalysis(null);
    setAiError(null);
  }, [selectedRange]);

  const filteredReflections = useMemo(() => {
    const rangeStart = getRangeStartDate(selectedRange);

    if (!rangeStart) return reflections;

    return reflections.filter(
      (reflection) => new Date(reflection.reflection_date) >= rangeStart
    );
  }, [reflections, selectedRange]);

  const getChartData = (): ChartData => {
    if (selectedRange === '7d') {
      const dailyData = getDailyChartData(reflections, 7);

      return {
        title: 'Daily stress - last 7 days',
        data: dailyData.map((item) => item.value),
        labels: dailyData.map((item) => item.label),
      };
    }

    if (selectedRange === '30d') {
      const dailyData = getDailyChartData(reflections, 30);

      return {
        title: 'Daily stress - last 30 days',
        data: dailyData.map((item) => item.value),
        labels: dailyData.map((item) => item.label),
      };
    }

    const grouped = groupReflectionData(filteredReflections, getMonthKey, 6);

    return {
      title: 'Monthly average stress - all time',
      data: grouped.data,
      labels: grouped.labels,
    };
  };

  const chartData = getChartData();
  const averageStress =
    filteredReflections.length === 0
      ? null
      : averageDecimal(filteredReflections.map((reflection) => reflection.stress_level));
  const averageMood = getAverageMood(filteredReflections);
  const anxietyDays = filteredReflections.filter((reflection) => reflection.anxious).length;
  const anxietyPercent =
    filteredReflections.length === 0
      ? null
      : Math.round((anxietyDays / filteredReflections.length) * 100);
  const moodDistribution = getMoodDistribution(filteredReflections);
  const sleepStressData = getSleepStressData(filteredReflections);
  const exerciseStressData = getExerciseStressData(filteredReflections);
  const stressSourceBreakdown = getStressSourceBreakdown(filteredReflections);
  const topStressSources = getTopStressSources(filteredReflections);
  const calmingMethodBreakdown = getCalmingMethodBreakdown(filteredReflections);
  const topCalmingMethods = getTopCalmingMethods(filteredReflections);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/home');
  };

  const handleGenerateAiAnalysis = async () => {
    if (!currentUserId) {
      setAiError('Please log in again to generate AI analysis.');
      return;
    }

    setIsAiLoading(true);
    setAiError(null);

    try {
      const response = await fetch(
        `${API_URL}/ai-analysis/${currentUserId}?range=${selectedRange}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'AI analysis failed');
      }

      setAiAnalysis(data.analysis);
    } catch (error) {
      console.log('Failed to generate AI analysis:', error);
      setAiError(
        error instanceof Error
          ? error.message
          : 'AI analysis failed. Please try again.'
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  const renderStressTrend = () => {
    const maxBarHeight = 138;
    const visibleBarCount = selectedRange === '30d' ? 10 : Math.max(chartData.data.length, 1);
    const chartViewportWidth = Math.max(280, Math.min(width - 104, 640));
    const barSlotWidth = chartViewportWidth / visibleBarCount;
    const chartContentWidth = Math.max(chartViewportWidth, barSlotWidth * chartData.data.length);

    if (!chartData.data.some((value) => value !== null)) {
      return (
        <Text style={styles.emptyText}>
          Save reflections to see your stress trend here.
        </Text>
      );
    }

    return (
      <View>
        <View style={styles.barChartArea}>
          <View style={styles.chartYAxis}>
            <Text style={styles.axisText}>10</Text>
            <Text style={styles.axisText}>5</Text>
            <Text style={styles.axisText}>0</Text>
          </View>

          <View style={[styles.barChartViewport, { width: chartViewportWidth }]}>
            <ScrollView
              horizontal={selectedRange === '30d'}
              showsHorizontalScrollIndicator={selectedRange === '30d'}
            >
              <View style={[styles.barChartContent, { width: chartContentWidth }]}>
                <View style={[styles.gridLine, styles.gridLineTop]} />
                <View style={[styles.gridLine, styles.gridLineMiddle]} />
                <View style={[styles.gridLine, styles.gridLineBottom]} />

                <View style={styles.barChart}>
                  {chartData.data.map((value, index) => (
                    <View
                      key={`${chartData.labels[index]}-${index}`}
                      style={[styles.barWrapper, { width: barSlotWidth }]}
                    >
                      <Text style={styles.barValue}>{value ?? '-'}</Text>
                      {value === null ? (
                        <View style={styles.missingBarMarker} />
                      ) : (
                        <View
                          style={[
                            styles.bar,
                            {
                              height: Math.max(8, (value / 10) * maxBarHeight),
                              backgroundColor: getStressColor(value),
                            },
                          ]}
                        />
                      )}
                      <Text style={styles.barLabel}>{chartData.labels[index]}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>
        </View>

        <Text style={styles.chartCaption}>{chartData.title}</Text>
        {(selectedRange === '7d' || selectedRange === '30d') && (
          <Text style={styles.chartHint}>- means no reflection was saved that day</Text>
        )}
      </View>
    );
  };

  const renderMoodDistribution = () => {
    const total = moodDistribution.reduce((sum, item) => sum + item.value, 0);
    let startAngle = 0;

    if (total === 0) {
      return <Text style={styles.emptyText}>Add mood answers to see your distribution.</Text>;
    }

    return (
      <View style={styles.moodDistributionContent}>
        <View style={styles.moodLegend}>
          {moodDistribution.map((item) => (
            <View key={item.label} style={styles.moodLegendRow}>
              <View style={[styles.moodLegendDot, { backgroundColor: item.color }]} />
              <Text style={styles.moodLegendText}>
                {item.label}: {item.percent}%
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.moodPieWrap}>
          <Svg width={150} height={150}>
            {moodDistribution.map((item) => {
              if (item.value === 0) return null;

              const sliceAngle = (item.value / total) * 360;

              if (sliceAngle >= 360) {
                return (
                  <Circle
                    key={item.label}
                    cx="75"
                    cy="75"
                    r="68"
                    fill={item.color}
                  />
                );
              }

              const path = getPiePath(75, 75, 68, startAngle, startAngle + sliceAngle);
              startAngle += sliceAngle;

              return <Path key={item.label} d={path} fill={item.color} />;
            })}
          </Svg>
        </View>
      </View>
    );
  };

  const renderSleepVsStress = () => (
    <View style={styles.sleepStressList}>
      <View style={styles.sleepStressHeader}>
        <Text style={[styles.sleepHeaderText, styles.sleepHeaderLabel]}>Sleep</Text>
        <Text style={[styles.sleepHeaderText, styles.sleepHeaderValue]}>
          Avg. Stress
        </Text>
      </View>

      {sleepStressData.map((item) => (
        <View key={item.label} style={styles.sleepStressRow}>
          <Text style={styles.sleepLabel}>{item.label}</Text>

          <View style={styles.sleepBarColumn}>
            {item.averageStress === null ? (
              <Text style={styles.noDataText}>No data</Text>
            ) : (
              <>
                <Text style={styles.sleepStressValue}>{item.averageStress}/10</Text>
                <View style={styles.sleepBarTrack}>
                  <View
                    style={[
                      styles.sleepBarFill,
                      {
                        width: `${Math.max(8, item.averageStress * 10)}%`,
                        backgroundColor: getStressColor(item.averageStress),
                      },
                    ]}
                  />
                </View>
              </>
            )}
          </View>
        </View>
      ))}
    </View>
  );

  const renderExerciseStressValue = (value: number | null) =>
    value === null ? '-' : `${value} / 10`;

  const renderExerciseVsStress = () => (
    <View style={styles.exerciseStressGrid}>
      <View style={styles.exerciseStressItem}>
        <Text style={styles.exerciseStressLabel}>Exercise Rate</Text>
        <Text style={styles.exerciseStressValue}>
          {exerciseStressData.exerciseRate === null
            ? '-'
            : `${exerciseStressData.exerciseRate}%`}
        </Text>
      </View>

      <View style={styles.exerciseStressItem}>
        <Text style={styles.exerciseStressLabel}>
          Average Stress on Exercise Days
        </Text>
        <Text style={styles.exerciseStressValue}>
          {renderExerciseStressValue(exerciseStressData.exerciseAverageStress)}
        </Text>
      </View>

      <View style={styles.exerciseStressItem}>
        <Text style={styles.exerciseStressLabel}>
          Average Stress on Non-Exercise Days
        </Text>
        <Text style={styles.exerciseStressValue}>
          {renderExerciseStressValue(exerciseStressData.nonExerciseAverageStress)}
        </Text>
      </View>
    </View>
  );

  const renderTopStressSources = () => {
    if (topStressSources.length === 0) {
      return (
        <Text style={styles.emptyText}>
          Select stress sources in Daily Reflection to see your top sources here.
        </Text>
      );
    }

    const rankedSources = [3, 1, 2]
      .map((rank) => topStressSources.find((source) => source.rank === rank))
      .filter((source): source is StressSourceItem => !!source);

    return (
      <>
        <View style={styles.podiumStage}>
          {rankedSources.map((source) => (
            <View
              key={source.label}
              style={[
                styles.podiumBlock,
                source.rank === 1 && styles.podiumBlockFirst,
                source.rank === 2 && styles.podiumBlockSecond,
                source.rank === 3 && styles.podiumBlockThird,
              ]}
            >
              <Text
                style={[
                  styles.podiumSource,
                  source.rank === 1 && styles.podiumSourceFirst,
                ]}
              >
                {source.label}
              </Text>
              <Text style={styles.podiumCount}>
                {source.value} {source.value === 1 ? 'reflection' : 'reflections'}
              </Text>
              <View
                style={[
                  styles.medalBadge,
                  source.rank === 1 && styles.medalBadge1,
                  source.rank === 2 && styles.medalBadge2,
                  source.rank === 3 && styles.medalBadge3,
                ]}
              >
                <Text style={styles.medalText}>{source.rank}</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.stressSourceToggle}
          onPress={() => setShowStressSourceDetails((value) => !value)}
        >
          <Text style={styles.stressSourceToggleText}>
            {showStressSourceDetails ? 'Hide full breakdown' : 'Show full breakdown'}
          </Text>
        </TouchableOpacity>

        {showStressSourceDetails && renderStressSourceDetails()}
      </>
    );
  };

  const renderStressSourceDetails = () => {
    const maxValue = Math.max(...stressSourceBreakdown.map((item) => item.value), 1);

    return (
      <View style={styles.stressSourceDetails}>
        {stressSourceBreakdown.map((source) => (
          <View key={source.label} style={styles.stressSourceRow}>
            <View style={styles.stressSourceRowHeader}>
              <Text style={styles.stressSourceLabel}>{source.label}</Text>
              <Text style={styles.stressSourceValue}>{source.value}</Text>
            </View>

            <View style={styles.stressSourceTrack}>
              <View
                style={[
                  styles.stressSourceFill,
                  {
                    width: `${Math.max(8, (source.value / maxValue) * 100)}%`,
                    backgroundColor: getStressSourceQuantityColor(
                      source.value,
                      maxValue
                    ),
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderTopCalmingMethods = () => {
    if (topCalmingMethods.length === 0) {
      return (
        <Text style={styles.emptyText}>
          Select calming methods in Daily Reflection to see them here.
        </Text>
      );
    }

    const rankedMethods = [3, 1, 2]
      .map((rank) => topCalmingMethods.find((method) => method.rank === rank))
      .filter((method): method is StressSourceItem => !!method);

    return (
      <>
        <View style={styles.podiumStage}>
          {rankedMethods.map((method) => (
            <View
              key={method.label}
              style={[
                styles.podiumBlock,
                method.rank === 1 && styles.podiumBlockFirst,
                method.rank === 2 && styles.podiumBlockSecond,
                method.rank === 3 && styles.podiumBlockThird,
              ]}
            >
              <Text
                style={[
                  styles.podiumSource,
                  method.rank === 1 && styles.podiumSourceFirst,
                ]}
              >
                {method.label}
              </Text>
              <Text style={styles.podiumCount}>
                {method.value} {method.value === 1 ? 'selection' : 'selections'}
              </Text>
              <View
                style={[
                  styles.medalBadge,
                  method.rank === 1 && styles.medalBadge1,
                  method.rank === 2 && styles.medalBadge2,
                  method.rank === 3 && styles.medalBadge3,
                ]}
              >
                <Text style={styles.medalText}>{method.rank}</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.stressSourceToggle}
          onPress={() => setShowCalmingMethodDetails((value) => !value)}
        >
          <Text style={styles.stressSourceToggleText}>
            {showCalmingMethodDetails ? 'Hide full breakdown' : 'Show full breakdown'}
          </Text>
        </TouchableOpacity>

        {showCalmingMethodDetails && renderCalmingMethodDetails()}
      </>
    );
  };

  const renderCalmingMethodDetails = () => {
    const maxValue = Math.max(...calmingMethodBreakdown.map((item) => item.value), 1);

    return (
      <View style={styles.stressSourceDetails}>
        {calmingMethodBreakdown.map((method) => (
          <View key={method.label} style={styles.stressSourceRow}>
            <View style={styles.stressSourceRowHeader}>
              <Text style={styles.stressSourceLabel}>{method.label}</Text>
              <Text style={styles.stressSourceValue}>{method.value}</Text>
            </View>

            <View style={styles.stressSourceTrack}>
              <View
                style={[
                  styles.stressSourceFill,
                  {
                    width: `${Math.max(8, (method.value / maxValue) * 100)}%`,
                    backgroundColor: getPositiveQuantityColor(
                      method.value,
                      maxValue
                    ),
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderAiRobot = () => (
    <View style={styles.aiRobotWrap}>
      <Svg width={58} height={56} viewBox="0 0 160 118">
        <Line
          x1="80"
          y1="32"
          x2="80"
          y2="18"
          stroke={colors.primary}
          strokeWidth="8"
          strokeLinecap="round"
        />
        <Circle cx="80" cy="13" r="12" fill={colors.primary} />
        <Circle cx="85" cy="9" r="7" fill={colors.accent} />
        <Rect
          x="12"
          y="54"
          width="22"
          height="42"
          rx="8"
          fill="#D8D1C8"
          stroke={colors.primary}
          strokeWidth="8"
        />
        <Rect
          x="126"
          y="54"
          width="22"
          height="42"
          rx="8"
          fill="#D8D1C8"
          stroke={colors.primary}
          strokeWidth="8"
        />
        <Rect
          x="30"
          y="34"
          width="100"
          height="70"
          rx="18"
          fill="#F5F8F8"
          stroke={colors.primary}
          strokeWidth="8"
        />
        <Path d="M40 42 H124 V86 Q124 96 114 96 H50 Q40 96 40 86 Z" fill="#FFFFFF" opacity="0.42" />
        <Circle cx="62" cy="66" r="10" fill={colors.primary} />
        <Circle cx="98" cy="66" r="10" fill={colors.primary} />
        <Circle cx="62" cy="66" r="4" fill={colors.secondary} />
        <Circle cx="98" cy="66" r="4" fill={colors.secondary} />
        <Path
          d="M62 82 Q80 94 98 82"
          fill="none"
          stroke={colors.primary}
          strokeWidth="7"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );

  const renderAiAnalysis = () => (
    <View style={styles.aiAnalysisContent}>
      <Text style={styles.aiSubtitle}>
        Generated using Gemini AI based on your reflections and habits.
      </Text>
      <Text style={styles.aiDisclaimer}>
        These insights are for self-reflection only and are not a substitute for
        professional medical or mental health support.
      </Text>

      <TouchableOpacity
        style={[
          styles.aiGenerateButton,
          isAiLoading && styles.aiGenerateButtonDisabled,
        ]}
        onPress={handleGenerateAiAnalysis}
        disabled={isAiLoading}
      >
        <Text style={styles.aiGenerateButtonText}>
          {isAiLoading ? 'Generating...' : 'Generate AI Analysis'}
        </Text>
      </TouchableOpacity>

      {aiError && <Text style={styles.aiErrorText}>{aiError}</Text>}

      {aiAnalysis && (
        <View style={styles.aiResultList}>
          <View style={styles.aiResultCard}>
            <Text style={styles.aiResultTitle}>{aiAnalysis.summary.title}</Text>
            <Text style={styles.aiResultText}>{aiAnalysis.summary.text}</Text>
          </View>

          {aiAnalysis.patterns.length > 0 && (
            <View style={styles.aiResultCard}>
              <Text style={styles.aiResultTitle}>Behavioral Patterns</Text>
              {aiAnalysis.patterns.map((pattern) => (
                <View key={pattern.title} style={styles.aiInsightItem}>
                  <Text style={styles.aiInsightTitle}>{pattern.title}</Text>
                  <Text style={styles.aiResultText}>{pattern.insight}</Text>
                </View>
              ))}
            </View>
          )}

          {aiAnalysis.helpfulStrategies.length > 0 && (
            <View style={styles.aiResultCard}>
              <Text style={styles.aiResultTitle}>Personalized Recommendations</Text>
              {aiAnalysis.helpfulStrategies.map((strategy) => (
                <View key={strategy.name} style={styles.aiInsightItem}>
                  <Text style={styles.aiInsightTitle}>{strategy.name}</Text>
                  <Text style={styles.aiResultText}>{strategy.insight}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.aiResultCard}>
            <Text style={styles.aiResultTitle}>Lifestyle Insights</Text>
            <Text style={styles.aiResultText}>{aiAnalysis.gentleSuggestion.text}</Text>
          </View>

          <Text style={styles.aiRangeNote}>
            All Time helps identify long-term patterns, while 7 and 30 days show
            recent changes.
          </Text>

          <View style={styles.aiMessageCard}>
            <Text style={styles.aiMessageText}>{aiAnalysis.encouragingMessage}</Text>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.navButton} onPress={handleBack}>
          <Text style={styles.navButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={() => router.push('/home')}>
          <Text style={styles.navButtonText}>Home</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Data View</Text>
        <Text style={styles.subtitle}>
          Get a quick overview of your reflection patterns
        </Text>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedRange === '7d' && styles.activeTabButton,
            ]}
            onPress={() => setSelectedRange('7d')}
          >
            <Text
              style={[
                styles.tabText,
                selectedRange === '7d' && styles.activeTabText,
              ]}
            >
              Last 7 Days
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedRange === '30d' && styles.activeTabButton,
            ]}
            onPress={() => setSelectedRange('30d')}
          >
            <Text
              style={[
                styles.tabText,
                selectedRange === '30d' && styles.activeTabText,
              ]}
            >
              Last 30 Days
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedRange === 'all' && styles.activeTabButton,
            ]}
            onPress={() => setSelectedRange('all')}
          >
            <Text
              style={[
                styles.tabText,
                selectedRange === 'all' && styles.activeTabText,
              ]}
            >
              All Time
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
                <Text style={styles.summaryLabel}>Average Stress</Text>
                <Text style={styles.summaryValue}>
                  {averageStress === null ? '-' : `${averageStress}/10`}
                </Text>
              </View>

              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Average Mood</Text>
                <Text style={styles.summaryValue}>
                  {averageMood || '-'}
                </Text>
              </View>
            </View>

            <View style={styles.summaryGrid}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Total Reflections</Text>
                <Text style={styles.summaryValue}>
                  {filteredReflections.length}
                </Text>
                <Text style={styles.summaryDescription}>
                  Reflections completed
                </Text>
              </View>

              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Anxiety Rate</Text>
                <Text style={styles.summaryValue}>
                  {anxietyPercent === null ? '-' : `${anxietyPercent}%`}
                </Text>
                <Text style={styles.summaryDescription}>
                  Of reflections with anxiety reported
                </Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Stress Trend</Text>
              {renderStressTrend()}
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Mood Distribution</Text>
              {renderMoodDistribution()}
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Sleep vs Stress</Text>
              {renderSleepVsStress()}
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>
                {selectedTopInsight === 'stress'
                  ? 'Top Stress Sources'
                  : 'Top Calming Methods'}
              </Text>

              <View style={styles.topInsightTabs}>
                <TouchableOpacity
                  style={[
                    styles.topInsightTab,
                    selectedTopInsight === 'stress' && styles.activeTopInsightTab,
                  ]}
                  onPress={() => setSelectedTopInsight('stress')}
                >
                  <Text
                    style={[
                      styles.topInsightTabText,
                      selectedTopInsight === 'stress' &&
                        styles.activeTopInsightTabText,
                    ]}
                  >
                    Top Stress Sources
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.topInsightTab,
                    selectedTopInsight === 'calming' && styles.activeTopInsightTab,
                  ]}
                  onPress={() => setSelectedTopInsight('calming')}
                >
                  <Text
                    style={[
                      styles.topInsightTabText,
                      selectedTopInsight === 'calming' &&
                        styles.activeTopInsightTabText,
                    ]}
                  >
                    Top Calming Methods
                  </Text>
                </TouchableOpacity>
              </View>

              {selectedTopInsight === 'stress'
                ? renderTopStressSources()
                : renderTopCalmingMethods()}
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Exercise Impact</Text>
              {renderExerciseVsStress()}
            </View>

            <View style={styles.card}>
              <View style={styles.aiHeader}>
                <Text style={[styles.sectionTitle, styles.aiSectionTitle]}>
                  AI Analysis
                </Text>
                {renderAiRobot()}
              </View>
              {renderAiAnalysis()}
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
  summaryDescription: {
    marginTop: 6,
    fontSize: 12,
    color: colors.subtext,
    lineHeight: 17,
  },
  barChartArea: {
    flexDirection: 'row',
    minHeight: 210,
    marginTop: 8,
  },
  chartYAxis: {
    width: 28,
    height: 166,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 2,
    paddingBottom: 2,
  },
  axisText: {
    color: colors.subtext,
    fontSize: 11,
    fontWeight: '600',
  },
  barChartViewport: {
    overflow: 'hidden',
  },
  barChartContent: {
    flex: 1,
    height: 190,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.border,
  },
  gridLineTop: {
    top: 0,
  },
  gridLineMiddle: {
    top: 83,
  },
  gridLineBottom: {
    top: 166,
  },
  chartCaption: {
    marginTop: 10,
    fontSize: 13,
    color: colors.subtext,
    fontWeight: '700',
    textAlign: 'center',
  },
  chartHint: {
    marginTop: 5,
    fontSize: 12,
    color: colors.subtext,
    textAlign: 'center',
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 190,
  },
  barWrapper: {
    flex: 1,
    height: 190,
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 34,
  },
  bar: {
    width: 26,
    borderRadius: 12,
    backgroundColor: colors.secondary,
    marginBottom: 10,
  },
  missingBarMarker: {
    width: 26,
    height: 8,
    borderRadius: 8,
    backgroundColor: '#D8D1C8',
    marginBottom: 10,
  },
  barLabel: {
    fontSize: 12,
    color: colors.subtext,
  },
  barValue: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '700',
    marginBottom: 6,
  },
  moodDistributionContent: {
    minHeight: 170,
    justifyContent: 'center',
  },
  moodLegend: {
    position: 'absolute',
    left: 0,
    top: 8,
    width: 150,
    gap: 8,
  },
  moodPieWrap: {
    alignItems: 'center',
  },
  moodLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  moodLegendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  moodLegendText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  sleepStressList: {
    gap: 14,
  },
  sleepStressHeader: {
    flexDirection: 'row',
    gap: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sleepHeaderText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  sleepHeaderLabel: {
    width: 86,
  },
  sleepHeaderValue: {
    flex: 1,
  },
  sleepStressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  sleepLabel: {
    width: 86,
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  sleepBarColumn: {
    flex: 1,
  },
  sleepStressValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  sleepBarTrack: {
    height: 14,
    borderRadius: 10,
    backgroundColor: '#F2ECE5',
    overflow: 'hidden',
  },
  sleepBarFill: {
    height: '100%',
    borderRadius: 10,
  },
  noDataText: {
    color: colors.subtext,
    fontSize: 13,
    fontWeight: '700',
  },
  exerciseStressGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  exerciseStressItem: {
    flex: 1,
    backgroundColor: '#FAF7F2',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 118,
  },
  exerciseStressLabel: {
    color: colors.subtext,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 17,
    minHeight: 42,
  },
  exerciseStressValue: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '900',
    marginTop: 12,
    textAlign: 'center',
  },
  topInsightTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  topInsightTab: {
    flex: 1,
    backgroundColor: '#F2ECE5',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  activeTopInsightTab: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  topInsightTabText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 18,
  },
  activeTopInsightTabText: {
    color: '#fff',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 10,
  },
  aiRobotWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 68,
    marginTop: 0,
    transform: [{ scaleX: 0.78 }, { scaleY: 1.1 }],
  },
  aiSectionTitle: {
    marginBottom: 0,
    marginTop: 10,
  },
  aiAnalysisContent: {
    marginTop: 2,
  },
  aiSubtitle: {
    color: colors.subtext,
    fontSize: 17,
    lineHeight: 24,
    marginBottom: 8,
  },
  aiDisclaimer: {
    color: colors.subtext,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 14,
  },
  aiGenerateButton: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
  },
  aiGenerateButtonDisabled: {
    opacity: 0.65,
  },
  aiGenerateButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
  },
  aiErrorText: {
    color: '#C9786C',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 12,
    lineHeight: 18,
  },
  aiResultList: {
    marginTop: 16,
    gap: 12,
  },
  aiResultCard: {
    backgroundColor: '#FAF7F2',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  aiResultTitle: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 8,
  },
  aiResultText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  aiInsightItem: {
    marginTop: 10,
  },
  aiInsightTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 4,
  },
  aiRangeNote: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  aiMessageCard: {
    backgroundColor: '#EEF4E4',
    borderRadius: 18,
    padding: 16,
  },
  aiMessageText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 21,
    textAlign: 'center',
  },
  podiumStage: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
    minHeight: 210,
    paddingTop: 18,
  },
  podiumBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: '#F8F2EA',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingTop: 14,
    paddingBottom: 12,
  },
  podiumBlockFirst: {
    height: 178,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: '#FFF4CF',
  },
  podiumBlockSecond: {
    height: 140,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: '#F2EAFB',
  },
  podiumBlockThird: {
    height: 118,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: '#F4E0D2',
  },
  medalBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  medalBadge1: {
    backgroundColor: '#E7B64C',
  },
  medalBadge2: {
    backgroundColor: '#D7CBEA',
  },
  medalBadge3: {
    backgroundColor: '#C88A5B',
  },
  medalText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '900',
  },
  podiumSource: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  podiumSourceFirst: {
    fontSize: 20,
  },
  podiumCount: {
    color: colors.subtext,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 5,
    textAlign: 'center',
  },
  stressSourceToggle: {
    alignSelf: 'center',
    backgroundColor: '#F2ECE5',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginTop: 18,
  },
  stressSourceToggleText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  stressSourceDetails: {
    marginTop: 18,
    gap: 16,
  },
  stressSourceRow: {
    gap: 8,
  },
  stressSourceRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  stressSourceLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  stressSourceValue: {
    color: colors.subtext,
    fontSize: 13,
    fontWeight: '800',
  },
  stressSourceTrack: {
    height: 14,
    borderRadius: 10,
    backgroundColor: '#F2ECE5',
    overflow: 'hidden',
  },
  stressSourceFill: {
    height: '100%',
    borderRadius: 10,
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
