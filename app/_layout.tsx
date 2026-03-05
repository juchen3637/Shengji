import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#1a5c38' } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="lobby" />
      <Stack.Screen name="game" />
    </Stack>
  );
}
