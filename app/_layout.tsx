import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="home" />
      <Stack.Screen name="calm" />
      <Stack.Screen name="games" />
      <Stack.Screen name="reflection" />
      <Stack.Screen name="data-view" />
      <Stack.Screen name="therapist-finder" />
    </Stack>
  );
}
