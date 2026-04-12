import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { colors } from '../constants/colors';

export default function ForgotPasswordScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={20} color={colors.subtext} />
        </TouchableOpacity>

        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>
          Choose how you’d like to reset your password
        </Text>

        <TouchableOpacity style={[styles.optionCard, styles.activeOptionCard]}>
          <View style={styles.iconCircle}>
            <Ionicons name="mail-outline" size={28} color={colors.primary} />
          </View>
          <Text style={styles.optionText}>Reset via Email</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.optionCard, styles.activeOptionCard]}>
          <View style={styles.iconCircle}>
            <Ionicons name="call-outline" size={28} color={colors.primary} />
          </View>
          <Text style={styles.optionText}>Phone Verification</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.optionCard, styles.activeOptionCard]}>
          <View style={styles.iconCircle}>
            <Ionicons name="help-circle-outline" size={28} color={colors.primary} />
          </View>
          <Text style={styles.optionText}>Security Question</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sendButton}>
          <Text style={styles.sendButtonText}>Send Reset Link</Text>
          <Ionicons name="lock-closed-outline" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 30,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.subtext,
    marginBottom: 28,
    lineHeight: 22,
  },
  optionCard: {
    backgroundColor: colors.card,
    borderRadius: 28,
    paddingVertical: 18,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.card,
  },
  activeOptionCard: {
    borderColor: colors.secondary,
    borderWidth: 2,
  },
  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.softGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  sendButton: {
    marginTop: 18,
    backgroundColor: colors.primary,
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});