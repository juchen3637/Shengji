import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';

export default function HomeScreen() {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [joining, setJoining] = useState(false);

  const handleCreate = () => {
    if (!name.trim()) return;
    router.push({ pathname: '/lobby', params: { mode: 'create', name: name.trim() } });
  };

  const handleJoin = () => {
    if (!joining) { setJoining(true); return; }
    if (!name.trim() || !roomCode.trim()) return;
    router.push({ pathname: '/lobby', params: { mode: 'join', name: name.trim(), roomId: roomCode.trim().toUpperCase() } });
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.title}>升级</Text>
      <Text style={styles.subtitle}>Shengji</Text>
      <Text style={styles.tagline}>Multiplayer Card Game</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Your name"
          placeholderTextColor="#6aaf88"
          value={name}
          onChangeText={setName}
          maxLength={16}
        />
        {joining && (
          <TextInput
            style={styles.input}
            placeholder="Room code (e.g. X7K2PQ)"
            placeholderTextColor="#6aaf88"
            value={roomCode}
            onChangeText={setRoomCode}
            autoCapitalize="characters"
            maxLength={6}
          />
        )}
        <TouchableOpacity style={styles.btnPrimary} onPress={handleCreate}>
          <Text style={styles.btnText}>Create Room</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnSecondary} onPress={handleJoin}>
          <Text style={styles.btnText}>{joining ? 'Join →' : 'Join Room'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a5c38', justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 72, fontWeight: 'bold', color: '#ffd700', letterSpacing: 4 },
  subtitle: { fontSize: 28, color: '#fff', fontWeight: '600', marginTop: -8 },
  tagline: { fontSize: 14, color: '#a0e0b0', marginTop: 4, marginBottom: 40 },
  form: { width: '100%', maxWidth: 320, gap: 12 },
  input: { backgroundColor: '#0e3d23', color: '#fff', borderRadius: 10, padding: 14, fontSize: 16, borderWidth: 1, borderColor: '#2d7a50' },
  btnPrimary: { backgroundColor: '#ffd700', borderRadius: 10, padding: 16, alignItems: 'center' },
  btnSecondary: { backgroundColor: '#0e3d23', borderRadius: 10, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#2d7a50' },
  btnText: { fontWeight: 'bold', fontSize: 16, color: '#1a3d22' },
});
