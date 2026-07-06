import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../constants/colors';

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmedEmail = email.trim();
  const hasEmailError = hasTriedSubmit && !trimmedEmail;
  const hasPasswordError = hasTriedSubmit && !password;

  const handleLogin = async () => {
    setHasTriedSubmit(true);
    setLoginError('');

    if (!trimmedEmail || !password) {
      setLoginError('Please fill in both email and password.');
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch('http://localhost:6001/auth/login', {
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
        setLoginError(data.message || 'Invalid email or password.');
        return;
      }

      await AsyncStorage.setItem('currentUser', JSON.stringify(data.user));

      router.push('/home');
    } catch {
      setLoginError('Could not connect to the server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topGreenArea}>
        <Image
          source={require('../assets/images/calmia-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Sign In</Text>
        <Text style={styles.subtitle}>Welcome back to Calmia</Text>

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
        {hasEmailError && <Text style={styles.errorText}>Please enter your email.</Text>}

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
        {hasPasswordError && <Text style={styles.errorText}>Please enter your password.</Text>}

        {!!loginError && <Text style={styles.loginErrorText}>{loginError}</Text>}

        <TouchableOpacity
          style={[styles.mainButton, isSubmitting && styles.mainButtonDisabled]}
          disabled={isSubmitting}
          onPress={handleLogin}
        >
          <Text style={styles.mainButtonText}>
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/signup')}>
          <Text style={styles.bottomText}>
            {"Don't have an account? "}
            <Text style={styles.link}>Sign Up</Text>
          </Text>
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
  errorText: {
    color: '#C96F63',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 8,
  },
  loginErrorText: {
    color: '#C96F63',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 16,
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
  bottomText: {
    textAlign: 'center',
    color: colors.subtext,
    fontSize: 14,
    marginBottom: 10,
  },
  link: {
    color: colors.accent,
    fontWeight: '700',
  },
});
