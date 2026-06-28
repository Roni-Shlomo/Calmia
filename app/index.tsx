import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
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

  const handleLogin = async () => {
  try {
    const response = await fetch('http://localhost:6001/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      Alert.alert('Login failed', data.message || 'Invalid email or password');
      return;
    }

    await AsyncStorage.setItem('currentUser', JSON.stringify(data.user));

    router.push('/home');
  } catch (error) {
    Alert.alert('Connection error', 'Could not connect to the server');
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

        <TouchableOpacity
          style={styles.mainButton}
          onPress={handleLogin}
        >
          <Text style={styles.mainButtonText}>Sign In</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/signup')}>
          <Text style={styles.bottomText}>
            Don’t have an account? <Text style={styles.link}>Sign Up</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/forgot-password')}>
          <Text style={styles.forgotText}>Forgot Password</Text>
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
  forgotText: {
    textAlign: 'center',
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
});