import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { colors } from '../constants/colors';

export default function SignupScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topGreenArea}>
          <Image
            source={require('../assets/images/calmia-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Sign Up</Text>
          <Text style={styles.subtitle}>Create your calm space</Text>

          <Text style={styles.label}>Email Address</Text>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="mail-outline"
              size={18}
              color={colors.subtext}
              style={styles.inputIcon}
            />
            <TextInput
              placeholder="Enter your email..."
              placeholderTextColor={colors.subtext}
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color={colors.subtext}
              style={styles.inputIcon}
            />
            <TextInput
              placeholder="Enter your password..."
              placeholderTextColor={colors.subtext}
              style={styles.input}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
            />
          </View>

          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color={colors.subtext}
              style={styles.inputIcon}
            />
            <TextInput
              placeholder="Confirm your password..."
              placeholderTextColor={colors.subtext}
              style={styles.input}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={styles.mainButton}
            onPress={() => router.push('/home')}
          >
            <Text style={styles.mainButtonText}>Sign Up</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginRow}
            onPress={() => router.push('/')}
          >
            <Text style={styles.bottomText}>Already have an account?</Text>

            <View style={styles.loginLinkRow}>
              
              <Ionicons name="arrow-forward" size={14} color={colors.accent} />
              <Text style={styles.link}>Sign In</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  topGreenArea: {
    height: 210,
    backgroundColor: colors.secondary,
    borderBottomLeftRadius: 120,
    borderBottomRightRadius: 120,
    position: 'relative',
  },
  logo: {
    width: 100,
    height: 100,
    position: 'absolute',
    bottom: -50,
    left: '50%',
    marginLeft: -44,
  },
  card: {
    marginTop: 52,
    marginHorizontal: 24,
    backgroundColor: colors.card,
    borderRadius: 30,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.subtext,
    textAlign: 'center',
    marginBottom: 28,
  },
  label: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
    marginTop: 12,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF7F2',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 14,
  },
  mainButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 26,
    marginBottom: 18,
  },
  mainButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  loginRow: {
    marginTop: 8,
    alignItems: 'center',
  },
  bottomText: {
    textAlign: 'center',
    color: colors.subtext,
    fontSize: 13,
  },
  loginLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  link: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 14,
  },
});