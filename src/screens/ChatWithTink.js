import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../constants/theme';
import api from '../utils/apiClient';

const ChatWithTink = props => {
  const userName = props.route.params?.name || 'there';
  const [messages, setMessages] = useState([
    {
      id: "1",
      text: `Hey, ${userName}! I'm Tink, your MindCare assistant.\n\nI can help you analyze your feelings, tell you about the app, or search the web for mental health resources! How can I support you today?`,
      isUser: false,
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Thinking...');
  const flatListRef = useRef();
  const loadingTimerRef = useRef(null);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
    };

    const currentHistory = [...messages];
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setLoadingText('Thinking...');

    // If server takes >5s (Render cold start), show a hint to the user
    loadingTimerRef.current = setTimeout(() => {
      setLoadingText('Waking up server... (~30s on first message)');
    }, 5000);

    try {
      clearTimeout(loadingTimerRef.current);
      const response = await api.post('/api/chat', {
        message: userMessage.text,
        history: currentHistory.map(msg => ({ text: msg.text, isUser: msg.isUser })),
      });
      const data = response.data;

      const backendReply =
        data && typeof data.reply === 'string' && data.reply.trim().length > 0
          ? data.reply.trim()
          : null;

      const replyText = backendReply || "I'm here with you. How can I help?";

      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: replyText,
        isUser: false,
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      clearTimeout(loadingTimerRef.current);
      const isTimeout =
        error?.code === 'ECONNABORTED' || (error?.message || '').includes('timeout');
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        text: isTimeout
          ? 'The server is waking up (it sleeps when inactive). Please wait a moment and tap Send again \u2014 it should connect within 30 seconds! \uD83D\uDD04'
          : "I couldn't reach the server. Please check your internet and try again.",
        isUser: false,
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      clearTimeout(loadingTimerRef.current);
      setIsLoading(false);
      setLoadingText('Thinking...');
    }
  };

  const renderMessage = ({ item }) => {
    const isUser = item.isUser;
    return (
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.botBubble]}>
        {!isUser && (
          <Image
            source={{ uri: 'https://i.pinimg.com/736x/fd/a1/3b/fda13b9d6d88f25a9d968901d319216a.jpg' }}
            style={styles.avatar}
          />
        )}
        <View style={isUser ? styles.userTextContainer : styles.botTextContainer}>
          <Text style={isUser ? styles.userText : styles.botText}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.chatContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {isLoading && (
        <View style={styles.loadingBanner}>
          <ActivityIndicator color={colors.accent} size="small" style={{ marginRight: 8 }} />
          <Text style={styles.loadingBannerText}>{loadingText}</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Message Tink..."
          placeholderTextColor="#999"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Icon name="send" size={20} color={colors.white} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChatWithTink;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  chatContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  loadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: '#FFE0A0',
  },
  loadingBannerText: {
    fontSize: 13,
    color: '#8B6914',
    flexShrink: 1,
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '85%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  botBubble: {
    alignSelf: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  userTextContainer: {
    backgroundColor: colors.accent,
    padding: 12,
    borderRadius: 20,
    borderBottomRightRadius: 4,
  },
  botTextContainer: {
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userText: {
    color: colors.secondary,
    fontSize: 15,
    lineHeight: 22,
  },
  botText: {
    color: colors.primary,
    fontSize: 15,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderColor: '#EFEFEF',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
    maxHeight: 100,
    color: colors.primary,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    marginBottom: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#D3D3D3',
  },
});
