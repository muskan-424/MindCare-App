import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Searchbar } from 'react-native-paper';
import TherapistCard from '../components/TherapistCard';
import axios from 'axios';
import localData from '../constants/doctors';
import { colors, sizes, fonts } from '../constants/theme';

const CATEGORIES = [
  { id: '1', name: 'Psychologist', emoji: '🧠' },
  { id: '2', name: 'Psychiatrist', emoji: '💊' },
  { id: '3', name: 'Counsellor', emoji: '💬' },
  { id: '4', name: 'Social Worker', emoji: '🤝' },
];

const TherapistHomeScreen = (props) => {
  const [query, setQuery] = useState('');
  const [therapists, setTherapists] = useState(localData);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    const fetchTherapists = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${api_route}/api/therapists`);
        if (Array.isArray(res.data)) {
          setTherapists(res.data);
        } else {
          setTherapists(localData);
        }
      } catch (e) {
        console.warn('Therapists API error:', e.message);
        setTherapists(localData);
      } finally {
        setLoading(false);
      }
    };
    fetchTherapists();
  }, []);

  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={styles.catCard}
      onPress={() =>
        props.navigation.navigate('Therapist', {
          data: therapists.filter((d) => d.specialisation === item.name),
          category: item.name,
        })
      }
      activeOpacity={0.8}>
      <Text style={styles.catEmoji}>{item.emoji}</Text>
      <Text style={styles.catName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Consultation</Text>
        <Text style={styles.headerSubtitle}>Talk to a professional</Text>
        <View style={styles.searchWrap}>
          <Searchbar
            style={styles.search}
            placeholder="Search by name or specialty..."
            onChangeText={setQuery}
            value={query}
            placeholderTextColor={colors.gray}
          />
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Browse by type</Text>
        <FlatList
          data={CATEGORIES}
          renderItem={renderCategory}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catList}
        />

        <Text style={styles.sectionTitle}>Top professionals</Text>
        <View style={styles.cardList}>
          {therapists.map((doc) => (
            <View key={doc.id} style={styles.cardWrap}>
              <TherapistCard data={doc} />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default TherapistHomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  header: {
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 24,
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: colors.white },
  headerSubtitle: { fontSize: 14, color: colors.white, opacity: 0.95, marginTop: 4 },
  searchWrap: { marginTop: 16 },
  search: { backgroundColor: colors.white, borderRadius: 12, elevation: 0 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  sectionTitle: {
    fontSize: sizes.title,
    fontWeight: '700',
    color: colors.secondary,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
  },
  catList: { paddingHorizontal: 12, paddingBottom: 8 },
  catCard: {
    width: 100,
    marginHorizontal: 8,
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  catEmoji: { fontSize: 32, marginBottom: 8 },
  catName: { fontSize: 12, fontWeight: '600', color: colors.secondary, textAlign: 'center' },
  cardList: { paddingHorizontal: 16 },
  cardWrap: { marginBottom: 14 },
});
