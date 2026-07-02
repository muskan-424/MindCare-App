import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { colors, sizes } from '../../../constants/theme';
import useTranslation from '../../../utils/i18n';

const DEFAULT_HELPLINES = [
  { nameKey: 'crisis.vandrevala', number: '1860-2662-345', noteKey: 'crisis.vandrevala_note' },
  { nameKey: 'crisis.icall', number: '9152987821', noteKey: 'crisis.icall_note' },
  { nameKey: 'crisis.kiran', number: '1800-599-0019', noteKey: 'crisis.kiran_note' },
  { nameKey: 'crisis.crisis_text_line', number: 'Text HOME to 741741', noteKey: 'crisis.crisis_text_line_note' },
];

const SafetyScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const routeHelplines = route.params && route.params.helplines;
  const helplines = routeHelplines && routeHelplines.length > 0
    ? routeHelplines.map((line, i) => ({
        name: line.name,
        nameKey: line.nameKey,
        number: line.number,
        note: line.note,
        noteKey: line.noteKey,
        key: `route-${i}`,
      }))
    : DEFAULT_HELPLINES.map((line, i) => ({ ...line, key: `default-${i}` }));

  const dial = (num) => {
    const clean = (num || '').replace(/\D/g, '');
    if (clean.length) Linking.openURL(`tel:${clean}`).catch(() => {});
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← {t('common.back')}</Text>
      </TouchableOpacity>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{t('safety.title')}</Text>
        <Text style={styles.subtitle}>{t('safety.subtitle')}</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('safety.talk_trusted_title')}</Text>
          <Text style={styles.cardText}>{t('safety.talk_trusted_text')}</Text>
        </View>

        <Text style={styles.sectionTitle}>{t('safety.helplines')}</Text>
        {helplines.map((line) => (
          <TouchableOpacity
            key={line.key}
            style={styles.lineCard}
            onPress={() => line.number && dial(line.number)}
            activeOpacity={0.8}
          >
            <Text style={styles.lineName}>{line.nameKey ? t(line.nameKey) : line.name}</Text>
            {line.number ? <Text style={styles.lineNumber}>{line.number}</Text> : null}
            {line.noteKey || line.note ? (
              <Text style={styles.lineNote}>{line.noteKey ? t(line.noteKey) : line.note}</Text>
            ) : null}
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.consultBtn} onPress={() => navigation.getParent()?.navigate('TherapistTab', { screen: 'TherapistHome' })}>
          <Text style={styles.consultBtnText}>{t('safety.find_counselor')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default SafetyScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, paddingTop: 50 },
  backBtn: { paddingHorizontal: 20, marginBottom: 8 },
  backText: { fontSize: sizes.body, color: colors.secondary, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', color: colors.secondary },
  subtitle: { fontSize: sizes.body, color: colors.gray, marginTop: 6, marginBottom: 20 },
  card: { backgroundColor: colors.accent, borderRadius: 12, padding: 16, marginBottom: 20 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.secondary, marginBottom: 6 },
  cardText: { fontSize: 14, color: colors.secondary, opacity: 0.9 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.secondary, marginBottom: 12 },
  lineCard: { backgroundColor: colors.white, borderRadius: 12, padding: 16, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  lineName: { fontSize: 16, fontWeight: '700', color: colors.secondary },
  lineNumber: { fontSize: 18, color: colors.primary, marginTop: 4, fontWeight: '600' },
  lineNote: { fontSize: 12, color: colors.gray, marginTop: 4 },
  consultBtn: { marginTop: 24, paddingVertical: 14, backgroundColor: colors.secondary, borderRadius: 24, alignItems: 'center' },
  consultBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
