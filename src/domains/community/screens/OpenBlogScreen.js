import * as React from 'react';
import {
  TouchableOpacity,
  Image,
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { colors } from '../../../constants/theme';
import useTranslation from '../../../utils/i18n';

const OpenBlogScreen = props => {
  const { t } = useTranslation();
  const {width, height} = Dimensions.get('window');

  const {data} = props.route.params;

  const bodyParagraphs = (() => {
    if (Array.isArray(data.body)) return data.body;
    if (typeof data.body === 'string' && data.body.trim()) return [data.body];
    if (typeof data.content === 'string' && data.content.trim()) return [data.content];
    return [t('blog.sample_paragraph_1'), t('blog.sample_paragraph_2')];
  })();

  return (
    <View style={styles.container}>
      <View>
        <View>
          <Image
            source={{uri: data.image}}
            style={{
              width: '100%',
              height: height - 450,
              borderBottomLeftRadius: 10,
              borderBottomRightRadius: 10,
            }}
            resizeMode="cover"
          />
        </View>

        <View style={styles.profilepicstyle}>
          <View>
            <Image
              source={{uri: data.profilePic}}
              style={{width: 60, height: 60, borderRadius: 10, marginRight: 14}}
              resizeMode="cover"
            />
          </View>

          <View style={styles.abc}>
            <View>
              <View>
                <Text style={styles.authorstyle}>{data.author}</Text>
              </View>
            </View>

            <TouchableOpacity>
              <Feather name="bookmark" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollview}>
        <View style={{width: width - 30, marginBottom: 14}}>
          <Text
            style={{
              color: 'black',
              fontSize: 22,
              fontWeight: 'bold',
              lineHeight: 32,
            }}>
            {data.title}
          </Text>
        </View>

        {bodyParagraphs.map((paragraph, index) => (
          <Text key={String(index)} style={styles.text}>
            {paragraph}
          </Text>
        ))}

        <View style={styles.like}>
          <TouchableOpacity
            style={{padding: 12, flexDirection: 'row', alignItems: 'center'}}>
            <Feather name="heart" size={16} color="orange" />
            <Text style={styles.liketext}>{t('blog.open_likes', { count: data.likes })}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.backbutton}>
        <TouchableOpacity onPress={() => props.navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default OpenBlogScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  profilepicstyle: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    bottom: 14,
    left: 10,
  },
  abc: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 20,
  },
  authorstyle: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  scrollview: { paddingHorizontal: 16, paddingTop: 14 },
  text: { fontSize: 15, lineHeight: 26, textAlign: 'justify', color: colors.secondary, opacity: 0.85 },
  like: { marginVertical: 20, paddingBottom: 20, flexDirection: 'row', alignItems: 'center' },
  liketext: { marginLeft: 8, fontSize: 14, color: colors.gray },
  backbutton: { position: 'absolute', top: 44, left: 16 },
});
