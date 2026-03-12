import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import axios from 'axios';
import { ActivityIndicator } from 'react-native-paper';
import { colors } from '../constants/theme';
import { TouchableOpacity as GHTouchableOpacity } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH } = Dimensions.get('screen');
const MEME_SIZE = SCREEN_WIDTH - 32;

const TEXT_COLORS = [
  { id: 'white', value: '#FFFFFF' },
  { id: 'black', value: '#000000' },
  { id: 'yellow', value: '#FFE135' },
  { id: 'red', value: '#FF3B3B' },
  { id: 'blue', value: '#3B82F6' },
];
const OUTLINE_OPTIONS = [
  { id: 'none', label: 'None' },
  { id: 'black', label: 'Black' },
  { id: 'white', label: 'White' },
];
const FONT_SIZES = [
  { id: 'small', label: 'S', size: 18 },
  { id: 'medium', label: 'M', size: 24 },
  { id: 'large', label: 'L', size: 32 },
];
const ALIGN_OPTIONS = [
  { id: 'left', label: '⬅' },
  { id: 'center', label: '⬌' },
  { id: 'right', label: '➡' },
];

function MemeOverlayText({ text, textColor, outlineColor, fontSize, align }) {
  if (!text) return null;
  const sizeObj = FONT_SIZES.find((s) => s.id === fontSize) || FONT_SIZES[1];
  const numSize = sizeObj.size;
  const alignment = align === 'left' ? 'left' : align === 'right' ? 'right' : 'center';
  const baseStyle = {
    fontSize: numSize,
    fontWeight: '900',
    textTransform: 'uppercase',
    color: textColor,
    textAlign: alignment,
    paddingHorizontal: 8,
  };
  const hasOutline = outlineColor && outlineColor.length > 0;
  return (
    <Text
      style={[
        baseStyle,
        hasOutline && {
          textShadowColor: outlineColor,
          textShadowOffset: { width: 1, height: 1 },
          textShadowRadius: 2,
        },
      ]}
      numberOfLines={2}
    >
      {text}
    </Text>
  );
}

const CreateMeme = () => {
  const [loading, setLoading] = useState(true);
  const [memeArray, setMemeArray] = useState([]);
  const [randomIndex, setRandomIndex] = useState(0);
  const [topText, setTopText] = useState('');
  const [bottomText, setBottomText] = useState('');
  const [textColor, setTextColor] = useState(TEXT_COLORS[0].value);
  const [outline, setOutline] = useState('black');
  const [fontSize, setFontSize] = useState('medium');
  const [align, setAlign] = useState('center');

  useEffect(() => {
    axios
      .get('https://api.imgflip.com/get_memes')
      .then((res) => {
        const memes = res.data.data.memes;
        setMemeArray(memes);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Meme API Error:', err.message);
        setLoading(false);
        const fallback = [
          { url: 'https://i.imgflip.com/1g8my4.jpg', name: 'Fallback Meme' },
        ];
        setMemeArray(fallback);
      });
  }, []);

  const generateRandomNumber = () => {
    if (memeArray.length === 0) return;
    const rand = Math.floor(Math.random() * memeArray.length);
    setRandomIndex(rand);
  };

  const currentMeme = memeArray[randomIndex] || memeArray[0];
  const memeUri = currentMeme?.url || currentMeme?.image;
  const outlineColor = outline === 'none' ? null : outline === 'black' ? '#000000' : '#FFFFFF';
  const alignFlex = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <Text style={styles.headerText}>Meme Generator</Text>
              <Text style={styles.headerSubtext}>Design your caption</Text>
            </View>

            <View style={styles.previewCard}>
              <View style={styles.previewImageWrap}>
                {memeUri ? (
                  <Image
                    source={{ uri: memeUri }}
                    style={styles.previewImage}
                    resizeMode="cover"
                  />
                ) : null}
                <View style={styles.overlayTextWrap}>
                  <View style={[styles.overlayRow, { alignItems: alignFlex }]}>
                    <MemeOverlayText
                      text={topText}
                      textColor={textColor}
                      outlineColor={outlineColor}
                      fontSize={fontSize}
                      align={align}
                    />
                  </View>
                  <View style={[styles.overlayRow, styles.overlayRowBottom, { alignItems: alignFlex }]}>
                    <MemeOverlayText
                      text={bottomText}
                      textColor={textColor}
                      outlineColor={outlineColor}
                      fontSize={fontSize}
                      align={align}
                    />
                  </View>
                </View>
              </View>
              <GHTouchableOpacity
                style={styles.shuffleBtn}
                onPress={generateRandomNumber}
                activeOpacity={0.8}
              >
                <Text style={styles.shuffleBtnText}>Another image</Text>
              </GHTouchableOpacity>
            </View>

            <View style={styles.designSection}>
              <Text style={styles.sectionTitle}>Text design</Text>

              <Text style={styles.label}>Color</Text>
              <View style={styles.chipRow}>
                {TEXT_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setTextColor(c.value)}
                    style={[
                      styles.colorChip,
                      { backgroundColor: c.value },
                      textColor === c.value && styles.colorChipSelected,
                    ]}
                  >
                    {textColor === c.value ? (
                      <Text style={c.id === 'black' ? styles.checkWhite : styles.checkBlack}>✓</Text>
                    ) : null}
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Outline</Text>
              <View style={styles.chipRow}>
                {OUTLINE_OPTIONS.map((o) => (
                  <TouchableOpacity
                    key={o.id}
                    onPress={() => setOutline(o.id)}
                    style={[styles.optionChip, outline === o.id && styles.optionChipActive]}
                  >
                    <Text style={[styles.optionChipText, outline === o.id && styles.optionChipTextActive]}>
                      {o.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Size</Text>
              <View style={styles.chipRow}>
                {FONT_SIZES.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    onPress={() => setFontSize(s.id)}
                    style={[styles.optionChip, fontSize === s.id && styles.optionChipActive]}
                  >
                    <Text style={[styles.optionChipText, fontSize === s.id && styles.optionChipTextActive]}>
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Align</Text>
              <View style={styles.chipRow}>
                {ALIGN_OPTIONS.map((a) => (
                  <TouchableOpacity
                    key={a.id}
                    onPress={() => setAlign(a.id)}
                    style={[styles.optionChip, align === a.id && styles.optionChipActive]}
                  >
                    <Text style={[styles.optionChipText, align === a.id && styles.optionChipTextActive]}>
                      {a.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.label}>Top text</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Add top caption..."
                placeholderTextColor={colors.gray}
                value={topText}
                onChangeText={setTopText}
              />
              <Text style={[styles.label, { marginTop: 14 }]}>Bottom text</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Add bottom caption..."
                placeholderTextColor={colors.gray}
                value={bottomText}
                onChangeText={setBottomText}
              />
            </View>

            <TouchableOpacity style={styles.postButton} activeOpacity={0.85}>
              <Text style={styles.postButtonText}>Post meme</Text>
            </TouchableOpacity>
            <View style={{ height: 32 }} />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CreateMeme;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  scrollContent: { paddingBottom: 24 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 200 },
  header: { alignItems: 'center', paddingVertical: 16 },
  headerText: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerSubtext: { fontSize: 14, color: colors.gray, marginTop: 4 },
  previewCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  previewImageWrap: {
    width: MEME_SIZE,
    height: MEME_SIZE,
    alignSelf: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.gray3,
  },
  previewImage: { width: '100%', height: '100%' },
  overlayTextWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 12,
  },
  overlayRow: {
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  overlayRowBottom: {
    justifyContent: 'flex-end',
  },
  shuffleBtn: {
    marginTop: 12,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: colors.accent,
    borderRadius: 24,
  },
  shuffleBtnText: { fontSize: 15, fontWeight: '700', color: colors.secondary },
  designSection: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.secondary, marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: colors.gray, marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14 },
  colorChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 4,
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorChipSelected: { borderColor: colors.secondary },
  checkBlack: { color: '#000', fontWeight: 'bold', fontSize: 18 },
  checkWhite: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.gray3,
    marginRight: 8,
    marginBottom: 6,
  },
  optionChipActive: { backgroundColor: colors.primary },
  optionChipText: { fontSize: 14, fontWeight: '600', color: colors.secondary },
  optionChipTextActive: { color: colors.white },
  inputSection: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  textInput: {
    backgroundColor: colors.lightGrey,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.secondary,
    borderWidth: 1,
    borderColor: colors.gray3,
  },
  postButton: {
    marginHorizontal: 16,
    backgroundColor: colors.secondary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  postButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
