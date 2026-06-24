import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { connect } from 'react-redux';
import { colors } from '../constants/theme';
import LANGUAGES, { getLanguageByCode } from '../constants/languages';
import { setLanguage } from '../redux/actions/auth';
import useTranslation from '../utils/i18n';

/**
 * Compact language picker — shows current language and opens a modal list.
 * @param {{ compact?: boolean, style?: object }} props
 */
const LanguagePicker = ({ auth, setLanguage: setLang, compact = false, style }) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const current = getLanguageByCode(auth?.language || 'en');

  return (
    <>
      <TouchableOpacity
        style={[compact ? styles.compactRow : styles.row, style]}
        onPress={() => setVisible(true)}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons
          name="translate"
          size={compact ? 18 : 22}
          color={colors.primary}
        />
        <Text style={compact ? styles.compactFlag : styles.flag}>{current.flag}</Text>
        <Text style={compact ? styles.compactLabel : styles.label} numberOfLines={1}>
          {current.native}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={18} color={colors.gray} />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="translate" size={24} color={colors.primary} />
              <Text style={styles.modalTitle}>{t('language.select')}</Text>
            </View>
            <FlatList
              data={LANGUAGES}
              keyExtractor={item => item.code}
              renderItem={({ item }) => {
                const isActive = (auth?.language || 'en') === item.code;
                return (
                  <TouchableOpacity
                    style={[styles.langRow, isActive && styles.langRowActive]}
                    onPress={() => {
                      setLang(item.code);
                      setVisible(false);
                    }}
                  >
                    <Text style={styles.langFlag}>{item.flag}</Text>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.langLabel, isActive && { color: colors.primary }]}>
                        {item.native}
                      </Text>
                      <Text style={styles.langSub}>{item.label}</Text>
                    </View>
                    {isActive && (
                      <MaterialCommunityIcons name="check-circle" size={22} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
              showsVerticalScrollIndicator={false}
            />
            <TouchableOpacity style={styles.closeBtn} onPress={() => setVisible(false)}>
              <Text style={styles.closeText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const mapStateToProps = state => ({ auth: state.auth });

export default connect(mapStateToProps, { setLanguage })(LanguagePicker);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginVertical: 8,
    backgroundColor: colors.accent,
    borderRadius: 20,
    gap: 6,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 10,
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    gap: 4,
  },
  flag: { fontSize: 18 },
  compactFlag: { fontSize: 16 },
  label: { fontSize: 14, color: colors.secondary, fontWeight: '600', maxWidth: 120 },
  compactLabel: { fontSize: 12, color: colors.secondary, fontWeight: '600', maxWidth: 90 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 8,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  langRowActive: { backgroundColor: colors.accent },
  langFlag: { fontSize: 24 },
  langLabel: { fontSize: 16, fontWeight: '600', color: colors.secondary },
  langSub: { fontSize: 12, color: colors.gray, marginTop: 2 },
  closeBtn: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeText: { fontSize: 16, color: colors.primary, fontWeight: '600' },
});
