import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupError, setSignupError] = useState('');

  const isValidEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  };

  const isValidPassword = (value: string) => {
    return value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value);
  };

  const trimmedEmail = email.trim();
  const passwordRequirements = [
    {
      label: 'At least 8 characters',
      isValid: password.length >= 8,
    },
    {
      label: 'At least one letter',
      isValid: /[A-Za-z]/.test(password),
    },
    {
      label: 'At least one number',
      isValid: /\d/.test(password),
    },
  ];
  const hasPasswordError =
    hasTriedSubmit && passwordRequirements.some((requirement) => !requirement.isValid);
  const hasEmailError = hasTriedSubmit && (!trimmedEmail || !isValidEmail(trimmedEmail));
  const hasConfirmPasswordError =
    hasTriedSubmit && (!confirmPassword || password !== confirmPassword);
  const handleSignup = async () => {
    setHasTriedSubmit(true);
    setSignupError('');

    if (!trimmedEmail || !password || !confirmPassword) {
      setSignupError('Please fill in all fields.');
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setSignupError('Please enter a valid email address.');
      return;
    }

    if (!isValidPassword(password)) {
      setSignupError(
        'Password must contain at least 8 characters, at least one letter, and at least one number.'
      );
      return;
    }

    if (password !== confirmPassword) {
      setSignupError('Passwords do not match. Please confirm your password again.');
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch('http://localhost:6001/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: trimmedEmail,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setSignupError('This email is already registered. Please sign in instead.');
        } else {
          setSignupError(data.message || 'Could not create account.');
        }
        return;
      }

      await AsyncStorage.setItem('currentUser', JSON.stringify(data.user));
      router.push('/home');
    } catch {
      setSignupError('Could not connect to the server.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <View style={[styles.inputWrapper, hasEmailError && styles.inputWrapperError]}>
            <Ionicons
              name="mail-outline"
              size={18}
              color={hasEmailError ? '#C96F63' : colors.subtext}
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
          {hasEmailError && (
            <Text style={styles.errorText}>Please enter a valid email address.</Text>
          )}

          <Text style={styles.label}>Password</Text>
          <View style={[styles.inputWrapper, hasPasswordError && styles.inputWrapperError]}>
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color={hasPasswordError ? '#C96F63' : colors.subtext}
              style={styles.inputIcon}
            />
            <TextInput
              placeholder="Enter your password..."
              placeholderTextColor={colors.subtext}
              style={styles.input}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword((current) => !current)}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.subtext}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.passwordRequirements}>
            <Text style={[styles.passwordHint, hasPasswordError && styles.passwordHintError]}>
              Password must contain:
            </Text>
            {passwordRequirements.map((requirement) => {
              const showRequirementError = hasTriedSubmit && !requirement.isValid;

              return (
                <Text
                  key={requirement.label}
                  style={[
                    styles.requirementText,
                    showRequirementError && styles.requirementTextError,
                    requirement.isValid && styles.requirementTextValid,
                  ]}
                >
                  {requirement.isValid ? '✓' : '•'} {requirement.label}
                </Text>
              );
            })}
          </View>

          <Text style={styles.label}>Confirm Password</Text>
          <View style={[styles.inputWrapper, hasConfirmPasswordError && styles.inputWrapperError]}>
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color={hasConfirmPasswordError ? '#C96F63' : colors.subtext}
              style={styles.inputIcon}
            />
            <TextInput
              placeholder="Confirm your password..."
              placeholderTextColor={colors.subtext}
              style={styles.input}
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword((current) => !current)}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.subtext}
              />
            </TouchableOpacity>
          </View>
          {hasConfirmPasswordError && (
            <Text style={styles.errorText}>Passwords must match.</Text>
          )}

          {!!signupError && (
            <View style={styles.formErrorBox}>
              <Ionicons name="alert-circle-outline" size={18} color="#C96F63" />
              <Text style={styles.formErrorText}>{signupError}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.mainButton, isSubmitting && styles.mainButtonDisabled]}
            disabled={isSubmitting}
            onPress={handleSignup}
          >
            <Text style={styles.mainButtonText}>
              {isSubmitting ? 'Signing Up...' : 'Sign Up'}
            </Text>
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
  inputWrapperError: {
    borderColor: '#C96F63',
    backgroundColor: '#FFF8F6',
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
  eyeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passwordHint: {
    color: colors.subtext,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
    marginBottom: 2,
  },
  passwordHintError: {
    color: '#8F4B41',
    fontWeight: '700',
  },
  passwordRequirements: {
    marginTop: 8,
    gap: 3,
  },
  requirementText: {
    color: colors.subtext,
    fontSize: 12,
    lineHeight: 18,
  },
  requirementTextError: {
    color: '#C96F63',
    fontWeight: '700',
  },
  requirementTextValid: {
    color: colors.secondary,
    fontWeight: '700',
  },
  errorText: {
    color: '#C96F63',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 8,
  },
  formErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF8F6',
    borderWidth: 1,
    borderColor: '#E8C7C1',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 16,
  },
  formErrorText: {
    flex: 1,
    color: '#C96F63',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
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
  mainButtonDisabled: {
    opacity: 0.65,
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
