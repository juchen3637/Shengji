import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Share } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

interface Player { id: string; name: string; }

export default function LobbyScreen() {
  const { mode, name, roomId } = useLocalSearchParams<{ mode: string; name: string; roomId: string }>();
  const [players, setPlayers] = useState<Player[]>([]);
  const [myRoomId, setMyRoomId] = useState(roomId ?? '');
  const [connected, setConnected] = useState(false);

  // Placeholder: will be wired to Socket.io in Phase 4
  useEffect(() => {
    // Simulate self joining
    setPlayers([{ id: '1', name: name ?? 'You' }]);
    setConnected(true);
    if (mode === 'create') {
      setMyRoomId('X7K2PQ'); // placeholder until server wired
    }
  }, []);

  const seats = [0, 1, 2, 3];
  const teamLabels = ['Team A', 'Team B', 'Team A', 'Team B'];
  const positions = ['Bottom (You)', 'Right', 'Top (Partner)', 'Left'];

  const handleShare = () => {
    Share.share({ message: `Join my Shengji game! Room code: ${myRoomId}` });
  };

  const handleStart = () => {
    router.push({ pathname: '/game', params: { roomId: myRoomId, name } });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Game Lobby</Text>

      <View style={styles.roomCodeBox}>
        <Text style={styles.roomCodeLabel}>Room Code</Text>
        <Text style={styles.roomCode}>{myRoomId || '------'}</Text>
        <TouchableOpacity onPress={handleShare}>
          <Text style={styles.shareBtn}>Share →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.seats}>
        {seats.map(i => (
          <View key={i} style={[styles.seat, players[i] && styles.seatFilled]}>
            <Text style={styles.seatPosition}>{positions[i]}</Text>
            <Text style={styles.seatName}>{players[i]?.name ?? 'Waiting...'}</Text>
            <Text style={styles.seatTeam}>{teamLabels[i]}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.playerCount}>{players.length}/4 players</Text>

      {mode === 'create' && (
        <TouchableOpacity
          style={[styles.startBtn, players.length < 2 && styles.startBtnDisabled]}
          onPress={handleStart}
          disabled={players.length < 2}
        >
          <Text style={styles.startBtnText}>
            {players.length < 2 ? 'Waiting for players...' : 'Start Game'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a5c38', padding: 24, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 20 },
  roomCodeBox: { backgroundColor: '#0e3d23', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#2d7a50' },
  roomCodeLabel: { color: '#a0e0b0', fontSize: 12, marginBottom: 4 },
  roomCode: { fontSize: 36, fontWeight: 'bold', color: '#ffd700', letterSpacing: 8 },
  shareBtn: { color: '#a0e0b0', marginTop: 8, fontSize: 14 },
  seats: { gap: 10 },
  seat: { backgroundColor: '#0e3d23', borderRadius: 10, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#1f5e38' },
  seatFilled: { borderColor: '#ffd700' },
  seatPosition: { color: '#6aaf88', fontSize: 12, width: 100 },
  seatName: { color: '#fff', fontWeight: '600', flex: 1, textAlign: 'center' },
  seatTeam: { color: '#a0e0b0', fontSize: 12, width: 60, textAlign: 'right' },
  playerCount: { color: '#a0e0b0', textAlign: 'center', marginTop: 16, fontSize: 14 },
  startBtn: { backgroundColor: '#ffd700', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 24 },
  startBtnDisabled: { backgroundColor: '#3a6b50', opacity: 0.6 },
  startBtnText: { fontWeight: 'bold', fontSize: 16, color: '#1a3d22' },
});
