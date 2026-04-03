import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Searchbar } from 'react-native-paper';
import TherapistCard from '../components/TherapistCard';
import { colors } from '../constants/theme';

const TherapistScreen = (props) => {
  const [query, setQuery] = useState('');
  const { data: initialData = [], category } = props.route.params || {};

  const filteredData = useMemo(() => {
    if (!query.trim()) return initialData;
    const q = query.toLowerCase();
    return initialData.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.specialisation && d.specialisation.toLowerCase().includes(q))
    );
  }, [initialData, query]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => props.navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{category}</Text>
      </View>
      <View style={styles.searchWrap}>
        <Searchbar
          style={styles.search}
          placeholder="Search in this category..."
          onChangeText={setQuery}
          value={query}
          placeholderTextColor={colors.gray}
        />
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {filteredData.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No professionals found.</Text>
          </View>
        ) : (
          filteredData.map((doc) => (
            <View key={doc.id} style={styles.cardWrap}>
              <TherapistCard data={doc} />
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default TherapistScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  backBtn: { marginRight: 12 },
  backText: { fontSize: 16, color: colors.white, fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.white },
  searchWrap: { paddingHorizontal: 16, paddingTop: 12 },
  search: { backgroundColor: colors.white, borderRadius: 12, elevation: 0 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },
  cardWrap: { marginBottom: 14 },
  emptyWrap: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { fontSize: 15, color: colors.gray },
});
