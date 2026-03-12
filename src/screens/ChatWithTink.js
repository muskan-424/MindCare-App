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
  const flatListRef = useRef();

  const buildLocalReply = (text) => {
    const lower = text.toLowerCase();

    if (lower.includes('anxious') || lower.includes('anxiety') || lower.includes('panic')) {
      return "It sounds like you're feeling anxious right now. Try taking a few slow breaths in through your nose and out through your mouth. You might also open the Breathing or Grounding tools in the app for a quick reset. If your feelings become overwhelming, please reach out to someone you trust or a professional.";
    }

    if (lower.includes('sad') || lower.includes('depress') || lower.includes('down')) {
      return "I'm really glad you reached out. Feeling low or sad can be really heavy. It can help to write down what you're feeling in your journal tab, or message a close friend. If your thoughts turn toward self-harm or you feel unsafe, please contact a local helpline or emergency services right away.";
    }

    if (lower.includes('sleep') || lower.includes('insomnia') || lower.includes('tired')) {
      return "Sleep struggles are very common. A gentle routine before bed—like a short breathing exercise, avoiding screens for 30 minutes, and dimming the lights—can help. You can also explore the Sleep content or Meditation tools in the app to wind down.";
    }

    if (lower.includes('stress') || lower.includes('overwhelmed') || lower.includes('burnout')) {
      return "When everything feels like too much, breaking your day into small, doable steps can really help. Try to choose one tiny task you can complete next, then take a short break. Our Fitness and Self-help sections also have quick activities for stress release.";
    }

    return "I'm here with you. I might not always understand everything perfectly, but you can tell me what's on your mind and we can take it one step at a time. You can also combine chatting with me with the Self-help tools (breathing, grounding, gratitude, and more) whenever you like.";
  };

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

    try {
      const response = await api.post('/api/chat', {
        message: userMessage.text,
        history: currentHistory.map(msg => ({ text: msg.text, isUser: msg.isUser })),
      });
      const data = response.data;

      const backendReply =
        data && typeof data.reply === 'string' && data.reply.trim().length > 0
          ? data.reply.trim()
          : null;

      const replyText = backendReply || buildLocalReply(userMessage.text);

      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: replyText,
        isUser: false,
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        text:
          "My network connection seems to be down, so I'll answer from my built‑in knowledge instead. " +
          buildLocalReply(userMessage.text),
        isUser: false,
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
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
    backgroundColor: '#FAF9F6', // Off-white, soft background
  },
  chatContainer: {
    padding: 16,
    paddingBottom: 20,
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
