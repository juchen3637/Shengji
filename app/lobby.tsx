import { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Share, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { connectSocket } from '../lib/socket/client';
import { useGame, RoomPlayer } from '../lib/socket/useGame';

export default function LobbyScreen() {
  const { mode, name, roomId: paramRoomId } = useLocalSearchParams<{ mode: string; name: string; roomId?: string }>();
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [myRoomId, setMyRoomId] = useState('');
  const [connecting, setConnecting] = useState(true);
  const myPlayerIdRef = useRef('');
  const { createRoom, joinRoom, fillWithBots, startGame } = useGame();

  useEffect(() => {
    const socket = connectSocket();

    socket.on('room_update', (data: { roomId: string; players: RoomPlayer[] }) => {
      setPlayers(data.players);
    });

    socket.on('game_started', () => {
      router.replace({ pathname: '/game', params: { roomId: myRoomId, name, playerId: myPlayerIdRef.current } });
    });

    (async () => {
      try {
        const fn = mode === 'create' ? createRoom(name ?? 'Player') : joinRoom(paramRoomId ?? '', name ?? 'Player');
        const { roomId, playerId } = await fn;
        myPlayerIdRef.current = playerId;
        setMyRoomId(roomId);
      } catch (e: any) {
        Alert.alert('Connection Error', e.message);
      } finally {
        setConnecting(false);
      }
    })();

    return () => { socket.off('room_update'); socket.off('game_started'); };
  }, []);

  const positions = ['Bottom (You)', 'Right', 'Top (Partner)', 'Left'];
  const teamLabels = ['Team A', 'Team B', 'Team A', 'Team B'];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Game Lobby</Text>
      <View style={styles.roomCodeBox}>
        <Text style={styles.roomCodeLabel}>Room Code</Text>
        <Text style={styles.roomCode}>{connecting ? '......' : myRoomId}</Text>
        <TouchableOpacity onPress={() => Share.share({ message: `Join my Shengji game! Code: ${myRoomId}` })}>
          <Text style={styles.shareBtn}>Share →</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.seats}>
        {[0,1,2,3].map(i => (
          <View key={i} style={[styles.seat, players[i] && styles.seatFilled, players[i]?.isBot && styles.seatBot]}>
            <Text style={styles.seatPos}>{positions[i]}</Text>
            <Text style={styles.seatName}>{players[i] ? (players[i].isBot ? `🤖 ${players[i].name}` : players[i].name) : 'Waiting...'}</Text>
            <Text style={styles.seatTeam}>{teamLabels[i]}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.count}>{players.length}/4 players</Text>
      {mode === 'create' && (
        <View style={styles.actions}>
          {players.length < 4 && (
            <TouchableOpacity style={styles.botBtn} onPress={() => fillWithBots(myRoomId).catch(e => Alert.alert('Error', e.message))}>
              <Text style={styles.botBtnText}>🤖 Fill with Bots</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.startBtn, players.length < 2 && styles.startBtnOff]} onPress={() => startGame(myRoomId).catch(e => Alert.alert('Error', e.message))} disabled={players.length < 2}>
            <Text style={styles.startBtnText}>{players.length < 2 ? 'Need 2+ players' : 'Start Game'}</Text>
          </TouchableOpacity>
        </View>
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
  seatBot: { borderColor: '#4fc3f7' },
  seatPos: { color: '#6aaf88', fontSize: 12, width: 100 },
  seatName: { color: '#fff', fontWeight: '600', flex: 1, textAlign: 'center' },
  seatTeam: { color: '#a0e0b0', fontSize: 12, width: 60, textAlign: 'right' },
  count: { color: '#a0e0b0', textAlign: 'center', marginTop: 16, fontSize: 14 },
  actions: { gap: 10, marginTop: 24 },
  botBtn: { backgroundColor: '#0e3d23', borderRadius: 10, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#4fc3f7' },
  botBtnText: { color: '#4fc3f7', fontWeight: '600', fontSize: 15 },
  startBtn: { backgroundColor: '#ffd700', borderRadius: 10, padding: 16, alignItems: 'center' },
  startBtnOff: { backgroundColor: '#3a6b50', opacity: 0.6 },
  startBtnText: { fontWeight: 'bold', fontSize: 16, color: '#1a3d22' },
});
