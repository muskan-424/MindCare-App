import * as React from 'react';
import {
  Image,
  Text,
  View,
  FlatList,
  Dimensions,
  StyleSheet,
  Button,
  TouchableOpacity,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import TouchableScale from 'react-native-touchable-scale';
import api from '../utils/apiClient';
import {data as localData, popular as localPopular} from '../constants/BlogData';
import {colors, sizes} from '../constants/theme';
import OpenBlogScreen from './OpenBlogScreen';
import {createStackNavigator} from '@react-navigation/stack';
import {FAB} from 'react-native-paper';
import AddBlog from './AddBlog';

const MainScreen = ({navigation}) => {
  const [featured, setFeatured] = React.useState(localData);
  const [popular, setPopular] = React.useState(localPopular);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const fetchBlogs = async () => {
      setLoading(true);
      try {
        const res = await api.get('/api/blogs');
        if (res.data) {
          setFeatured(res.data.featured || localData);
          setPopular(res.data.popular || localPopular);
        }
      } catch (e) {
        console.warn('Blogs API error:', e.message);
        setFeatured(localData);
        setPopular(localPopular);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your daily read</Text>
      </View>

      <FlatList
        showsHorizontalScrollIndicator={false}
        horizontal
        data={featured}
        keyExtractor={item => item.id.toString()}
        style={styles.horizontalList}
        contentContainerStyle={styles.horizontalListContent}
        renderItem={({item}) => (
          <TouchableScale
            activeScale={0.96}
            tension={50}
            friction={7}
            useNativeDriver
            onPress={() => navigation.navigate('OpenBlogScreen', {data: item})}>
            <View style={styles.featuredCard}>
              <Image
                source={{uri: item.image}}
                style={styles.featuredImage}
                resizeMode="cover"
              />
              <View style={styles.featuredOverlay}>
                <Text style={styles.featuredTitle} numberOfLines={2}>{item.title}</Text>
                <View style={styles.featuredAuthorRow}>
                  <Image source={{uri: item.profilePic}} style={styles.avatarSmall} resizeMode="cover" />
                  <Text style={styles.featuredAuthor}>{item.author}</Text>
                </View>
              </View>
            </View>
          </TouchableScale>
        )}
      />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Popular stories</Text>
      </View>

      <FlatList
        data={popular}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.popularList}
        renderItem={({item}) => (
          <TouchableScale
            activeScale={0.98}
            tension={50}
            friction={7}
            useNativeDriver
            onPress={() => navigation.navigate('OpenBlogScreen', {data: item})}>
            <View style={styles.popularCard}>
              <Image source={{uri: item.image}} style={styles.popularImage} resizeMode="cover" />
              <View style={styles.popularContent}>
                <Text style={styles.popularTitle} numberOfLines={2}>{item.title}</Text>
                <View style={styles.popularMeta}>
                  <Text style={styles.popularAuthor}>{item.author}</Text>
                  <View style={styles.likesRow}>
                    <Feather name="thumbs-up" size={14} color={colors.gray} />
                    <Text style={styles.likesText}>{item.likes} likes</Text>
                  </View>
                </View>
              </View>
            </View>
          </TouchableScale>
        )}
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('Add')}
        color={colors.white}
        backgroundColor={colors.secondary}
      />
    </View>
  );
};
const Stack = createStackNavigator();
const StoryScreenStack = () => {
  return (
    <Stack.Navigator initialRouteName="MainScreen">
      <Stack.Screen
        name="MainScreen"
        component={MainScreen}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="OpenBlogScreen"
        component={OpenBlogScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="Add"
        component={AddBlog}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
};
export default StoryScreenStack;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: sizes.title,
    fontWeight: '800',
    color: colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  horizontalList: { flexGrow: 0 },
  horizontalListContent: { paddingHorizontal: 16, paddingBottom: 8 },
  featuredCard: {
    width: Dimensions.get('window').width - 80,
    height: Dimensions.get('window').height - 420,
    marginRight: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.gray3,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  featuredTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
    marginBottom: 8,
  },
  featuredAuthorRow: { flexDirection: 'row', alignItems: 'center' },
  avatarSmall: { width: 28, height: 28, borderRadius: 14, marginRight: 10 },
  featuredAuthor: { color: colors.white, fontSize: 14, fontWeight: '600' },
  popularList: { paddingHorizontal: 20, paddingBottom: 100 },
  popularCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 14,
    marginBottom: 14,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  popularImage: { width: 100, height: 100 },
  popularContent: { flex: 1, padding: 14, justifyContent: 'center' },
  popularTitle: { fontSize: 15, fontWeight: '700', color: colors.secondary, marginBottom: 6 },
  popularMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  popularAuthor: { fontSize: 12, color: colors.gray },
  likesRow: { flexDirection: 'row', alignItems: 'center' },
  likesText: { fontSize: 12, color: colors.gray, marginLeft: 4 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    backgroundColor: colors.secondary,
  },
});
