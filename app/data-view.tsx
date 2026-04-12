import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../constants/colors';

const dailyData = [4, 7, 5, 8, 6, 3, 5];
const weeklyData = [5, 6, 4, 7];
const monthlyData = [6, 5, 7, 4, 6, 5];

type ViewMode = 'daily' | 'weekly' | 'monthly';

export default function DataViewScreen() {
  const router = useRouter();
  const [selectedView, setSelectedView] = useState<ViewMode>('daily');

  const getChartData = () => {
    if (selectedView === 'daily') {
      return {
        title: 'Daily View',
        data: dailyData,
        labels: ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'],
      };
    }

    if (selectedView === 'weekly') {
      return {
        title: 'Weekly View',
        data: weeklyData,
        labels: ['W1', 'W2', 'W3', 'W4'],
      };
    }

    return {
      title: 'Monthly View',
      data: monthlyData,
      labels: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6'],
    };
  };

  const chartData = getChartData();
  const maxValue = Math.max(...chartData.data);

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
              Daily View
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
              Weekly View
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
              Monthly View
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{chartData.title}</Text>

          <View style={styles.chart}>
            {chartData.data.map((value, index) => (
              <View key={index} style={styles.barWrapper}>
                <View
                  style={[
                    styles.bar,
                    { height: (value / maxValue) * 140 + 20 },
                  ]}
                />
                <Text style={styles.barLabel}>{chartData.labels[index]}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Recent Entries</Text>
          <Text style={styles.entry}>Day 1 - Stress level: 4</Text>
          <Text style={styles.entry}>Day 2 - Stress level: 7</Text>
          <Text style={styles.entry}>Day 3 - Stress level: 5</Text>
          <Text style={styles.entry}>Day 4 - Stress level: 8</Text>
        </View>
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
  entry: {
    fontSize: 15,
    color: colors.text,
    marginBottom: 10,
  },
});