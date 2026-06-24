import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { colors, sizes } from '../../../constants/theme';
import useTranslation from '../../../utils/i18n';

const GratitudeScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [entry, setEntry] = useState('');
  const [saved, setSaved] = useState(false);

  const save = () => {
    if (entry.trim()) setSaved(true);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('gratitude.title')}</Text>
        <Text style={styles.subtitle}>{t('gratitude.subtitle')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('gratitude.placeholder')}
          placeholderTextColor={colors.gray}
          value={entry}
          onChangeText={setEntry}
          multiline
          numberOfLines={4}
        />
        <TouchableOpacity style={styles.saveBtn} onPress={save}>
          <Text style={styles.saveBtnText}>{t('gratitude.save')}</Text>
        </TouchableOpacity>
        {saved ? (
          <View style={styles.doneCard}>
            <Text style={styles.doneText}>{t('gratitude.done_text')}</Text>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default GratitudeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  scrollContent: { padding: 20, paddingTop: 50, paddingBottom: 40 },
  backBtn: { marginBottom: 12 },
  backText: { fontSize: sizes.body, color: colors.secondary, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '800', color: colors.secondary },
  subtitle: { fontSize: sizes.body, color: colors.gray, marginTop: 6, marginBottom: 20 },
  input: { backgroundColor: colors.white, borderRadius: 14, padding: 18, fontSize: 16, color: colors.secondary, minHeight: 120, textAlignVertical: 'top', borderWidth: 1, borderColor: colors.gray3, marginBottom: 20 },
  saveBtn: { alignSelf: 'center', paddingVertical: 14, paddingHorizontal: 40, backgroundColor: colors.secondary, borderRadius: 24 },
  saveBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  doneCard: { marginTop: 24, backgroundColor: colors.accent, borderRadius: 12, padding: 18 },
  doneText: { fontSize: 15, color: colors.secondary, textAlign: 'center' },
});
