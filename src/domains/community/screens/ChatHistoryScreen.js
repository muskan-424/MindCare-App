import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../../constants/theme';
import useTranslation from '../../../utils/i18n';
import { formatDate, getBcp47Locale } from '../../../utils/locale';
import { getConversations, getConversation, deleteConversation } from '../../../utils/tinkChat';

const ChatHistoryScreen = ({ navigation }) => {
  const { t, language } = useTranslation();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await getConversations();
      setConversations(data);
    } catch (err) {
      setError(t('chat.history_error', 'Could not load your chats. Pull down to retry.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const openConversation = useCallback(async (id) => {
    try {
      const full = await getConversation(id);
      navigation.navigate('Chat', { loadedConversation: full });
    } catch (err) {
      Alert.alert(t('common.error', 'Error'), t('chat.history_open_error', 'Could not open this conversation.'));
    }
  }, [navigation, t]);

  const confirmDelete = useCallback((id) => {
    Alert.alert(
      t('chat.history_delete_title', 'Delete conversation?'),
      t('chat.history_delete_msg', 'This cannot be undone.'),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('common.delete', 'Delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteConversation(id);
              setConversations(prev => prev.filter(c => c.id !== id));
            } catch (_) {
              Alert.alert(t('common.error', 'Error'), t('chat.history_delete_error', 'Could not delete.'));
            }
          },
        },
      ],
    );
  }, [t]);

  const formatDateLocal = (d) => {
    try {
      const date = new Date(d);
      const today = new Date();
      const isToday = date.toDateString() === today.toDateString();
      if (isToday) {
        return date.toLocaleTimeString(getBcp47Locale(language), {
          hour: '2-digit',
          minute: '2-digit',
        });
      }
      return formatDate(date, language, { day: 'numeric', month: 'short' });
    } catch (_) {
      return '';
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => openConversation(item.id)} activeOpacity={0.8}>
      <View style={styles.cardIcon}>
        <Icon name="chatbubble-ellipses" size={20} color={colors.primary} />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title || t('chat.history_untitled', 'Conversation')}</Text>
        {!!item.preview && <Text style={styles.cardPreview} numberOfLines={1}>{item.preview}</Text>}
        <Text style={styles.cardMeta}>{formatDateLocal(item.lastMessageAt)} · {item.messageCount} {t('chat.history_messages', 'messages')}</Text>
      </View>
      <TouchableOpacity onPress={() => confirmDelete(item.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={styles.deleteBtn}>
        <Icon name="trash-outline" size={18} color={colors.gray} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Icon name="chevron-back" size={26} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('chat.history_title', 'Chat history')}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Chat')} style={styles.headerBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Icon name="create-outline" size={22} color={colors.white} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Icon name="chatbubbles-outline" size={48} color={colors.gray2} />
              <Text style={styles.emptyText}>{error || t('chat.history_empty', 'No conversations yet. Start chatting with Tink!')}</Text>
              <TouchableOpacity style={styles.startBtn} onPress={() => navigation.navigate('Chat')}>
                <Text style={styles.startBtnText}>{t('chat.history_start', 'Start a chat')}</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
};

export default ChatHistoryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerBtn: {
    padding: 4,
  },
  headerTitle: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
  center: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 30,
  },
  emptyText: {
    color: colors.gray,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
  startBtn: {
    marginTop: 18,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 22,
  },
  startBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    color: colors.secondary,
    fontSize: 15,
    fontWeight: '700',
  },
  cardPreview: {
    color: colors.gray,
    fontSize: 13,
    marginTop: 2,
  },
  cardMeta: {
    color: colors.gray2,
    fontSize: 11,
    marginTop: 4,
  },
  deleteBtn: {
    padding: 6,
  },
});
