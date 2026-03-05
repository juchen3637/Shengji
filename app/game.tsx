import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function GameScreen() {
  const { roomId, name } = useLocalSearchParams<{ roomId: string; name: string }>();

  // Placeholder hand — will come from server in Phase 4
  const myHand = ['A♠', 'K♠', 'Q♠', 'J♠', '10♠', '9♠', '8♠', '7♠', 'A♥', 'K♥', 'Q♥', 'J♥', '10♥'];

  return (
    <View style={styles.table}>
      {/* Top player (partner) */}
      <View style={styles.topPlayer}>
        <View style={styles.opponentHand}>
          {[0,1,2,3,4,5,6,7].map(i => <View key={i} style={styles.cardBack} />)}
        </View>
        <Text style={styles.playerLabel}>Partner</Text>
      </View>

      {/* Middle row: left + trick area + right */}
      <View style={styles.middleRow}>
        {/* Left player */}
        <View style={styles.sidePlayer}>
          <View style={styles.sideHand}>
            {[0,1,2,3,4,5].map(i => <View key={i} style={styles.cardBackSmall} />)}
          </View>
          <Text style={styles.playerLabel}>Left</Text>
        </View>

        {/* Center trick area */}
        <View style={styles.trickArea}>
          <Text style={styles.trickLabel}>Room: {roomId}</Text>
          <Text style={styles.trickSubLabel}>Waiting for game to start...</Text>
        </View>

        {/* Right player */}
        <View style={styles.sidePlayer}>
          <View style={styles.sideHand}>
            {[0,1,2,3,4,5].map(i => <View key={i} style={styles.cardBackSmall} />)}
          </View>
          <Text style={styles.playerLabel}>Right</Text>
        </View>
      </View>

      {/* Bottom: my hand */}
      <View style={styles.myArea}>
        <Text style={styles.playerLabel}>{name ?? 'You'}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.myHand}>
          {myHand.map((card, i) => (
            <TouchableOpacity key={i} style={styles.card}>
              <Text style={styles.cardText}>{card}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  table: { flex: 1, backgroundColor: '#1a5c38', padding: 12, paddingTop: 50 },
  topPlayer: { alignItems: 'center', marginBottom: 8 },
  opponentHand: { flexDirection: 'row', gap: 2, marginBottom: 4 },
  cardBack: { width: 22, height: 34, backgroundColor: '#1a237e', borderRadius: 3, borderWidth: 1, borderColor: '#3949ab' },
  cardBackSmall: { width: 16, height: 26, backgroundColor: '#1a237e', borderRadius: 2, borderWidth: 1, borderColor: '#3949ab' },
  middleRow: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  sidePlayer: { alignItems: 'center', width: 50 },
  sideHand: { gap: 2 },
  trickArea: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#155230', borderRadius: 16, marginHorizontal: 8, padding: 16, minHeight: 160 },
  trickLabel: { color: '#ffd700', fontWeight: 'bold', fontSize: 14 },
  trickSubLabel: { color: '#a0e0b0', fontSize: 12, marginTop: 4 },
  playerLabel: { color: '#a0e0b0', fontSize: 10, marginTop: 2 },
  myArea: { marginTop: 8 },
  myHand: { marginTop: 4 },
  card: { width: 44, height: 68, backgroundColor: '#fff', borderRadius: 6, marginRight: 4, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ddd', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 },
  cardText: { fontSize: 12, fontWeight: 'bold', color: '#1a237e' },
});
