import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  Image,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import TouchableScale from 'react-native-touchable-scale';
import { colors, sizes } from '../constants/theme';
import { FAB } from 'react-native-paper';
import api from '../utils/apiClient';
import { data as localData } from '../constants/JournalsData';
import { connect } from 'react-redux';
import AddJournal from './AddJournal';
import DisplayJournal from './DisplayJournal';
import { getAvatarForGender } from '../utils/avatar';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const JournalScreen = ({ navigation, auth }) => {
  const [entries, setEntries] = React.useState(localData);
  const [loading, setLoading] = React.useState(false);

  const d = new Date();
  const dateStr = `${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;

  React.useEffect(() => {
    const fetchJournals = async () => {
      setLoading(true);
      try {
        const userId = auth?.user?._id;
        const res = await api.get('/api/journals', userId ? { params: { userId } } : {});
        if (Array.isArray(res.data)) {
          setEntries(res.data);
        } else {
          setEntries(localData);
        }
      } catch (e) {
        console.warn('Journals API error:', e.message);
        setEntries(localData);
      } finally {
        setLoading(false);
      }
    };
    fetchJournals();
  }, [auth?.user?._id]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image style={styles.headerAvatar} source={getAvatarForGender(auth.profile.gender)} />
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerGreeting}>Hi there!</Text>
          <Text style={styles.headerDate}>{dateStr}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>Loading your journal entries...</Text>
        </View>
      ) : !entries || entries.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>📔</Text>
          <Text style={styles.emptyTitle}>No entries yet</Text>
          <Text style={styles.emptyText}>Tap + to write your first journal entry.</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableScale
              activeScale={0.98}
              tension={50}
              friction={7}
              useNativeDriver
              onPress={() => navigation.navigate('Display', { data: item })}>
              <View style={styles.entryCard}>
                <View style={styles.entryMeta}>
                  <Text style={styles.entryDate}>{item.date}</Text>
                  <Text style={styles.entryTime}>{item.time}</Text>
                </View>
                <Text style={styles.entryContent} numberOfLines={3}>
                  {item.content}
                </Text>
              </View>
            </TouchableScale>
          )}
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('Add')}
        color={colors.white}
        backgroundColor={colors.secondary}
      />
    </View>
  );
};

const mapStateToProps = (state) => ({ auth: state.auth });
const JournalScreenConnected = connect(mapStateToProps)(JournalScreen);

const Stack = createStackNavigator();
const JournalScreenStack = () => (
  <Stack.Navigator initialRouteName="JournalScreen">
    <Stack.Screen name="JournalScreen" component={JournalScreenConnected} options={{ headerShown: false }} />
    <Stack.Screen name="Add" component={AddJournal} options={{ headerShown: false }} />
    <Stack.Screen name="Display" component={DisplayJournal} options={{ headerShown: false }} />
  </Stack.Navigator>
);

export default JournalScreenStack;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderBottomRightRadius: 40,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerAvatar: { width: 56, height: 56, borderRadius: 28 },
  headerTextWrap: { marginLeft: 16 },
  headerGreeting: { fontSize: 22, fontWeight: '800', color: colors.white },
  headerDate: { fontSize: 14, color: colors.white, opacity: 0.95, marginTop: 4 },
  listContent: { paddingHorizontal: 16, paddingBottom: 90 },
  entryCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  entryMeta: { marginBottom: 8 },
  entryDate: { fontSize: 15, fontWeight: '700', color: colors.secondary },
  entryTime: { fontSize: 12, color: colors.gray, marginTop: 2 },
  entryContent: { fontSize: 14, lineHeight: 22, color: colors.secondary },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.secondary, marginBottom: 8 },
  emptyText: { fontSize: 15, color: colors.gray, textAlign: 'center' },
  fab: { position: 'absolute', right: 20, bottom: 24, backgroundColor: colors.secondary },
});
