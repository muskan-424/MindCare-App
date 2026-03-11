import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { colors } from '../constants/theme';
import { Button } from 'react-native-elements';
import BrickList from 'react-native-masonry-brick-list';
import axios from 'axios';
import base64 from 'react-native-base64';
import { connect } from 'react-redux';
import { updateConcerns } from '../redux/actions/profile';
import { fetchQuoteOfTheDay } from '../redux/actions/quote';
import { Avatar, Card, Title, Paragraph } from 'react-native-paper';
import { api_route } from '../utils/route';

const preferences = [
  {
    id: '1',
    name: 'Anger',
  },
  {
    id: '2',
    name: 'Anxiety and Panic Attacks',
  },
  {
    id: '3',
    name: 'Depression',
  },
  {
    id: '4',
    name: 'Eating disorders',
  },
  {
    id: '5',
    name: 'Self-esteem',
  },
  {
    id: '6',
    name: 'Self-harm',
  },
  {
    id: '7',
    name: 'Stress',
  },
  {
    id: '8',
    name: 'Sleep disorders',
  },
];

const HomeScreen = props => {
  const [modalVisible, setModalVisible] = useState(true);
  const [contentFeed, setContentFeed] = useState([]);
  const [selectedConcerns, setSelectedConcerns] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('meditation');

  const contentCategories = [
    { id: 'meditation', label: 'Meditation' },
    { id: 'motivation', label: 'Motivation' },
    { id: 'sleep', label: 'Sleep Stories' },
    { id: 'relaxing_music', label: 'Relaxing Music' },
    { id: 'therapy', label: 'Therapy Advice' }
  ];

  useEffect(() => {
    fetchQuoteOfTheDay();
  }, []);

  useEffect(() => {
    // console.log(selectedConcerns);
    console.log(props.auth.profile);
  });

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const result = await axios.get(`${api_route}/api/content/search?category=${selectedCategory}`);
        setContentFeed(result.data);
      } catch (err) {
        console.warn('Mindful Content API Error:', err.message);
        setContentFeed([]);
      }
    };
    fetchContent();
  }, [selectedCategory]);

  const handleConcernSelection = id => {
    if (selectedConcerns.includes(id)) {
      setSelectedConcerns([
        ...selectedConcerns.filter(concern => concern !== id),
      ]);
    } else {
      setSelectedConcerns([...selectedConcerns, id]);
    }
  };

  const renderItem = ({ item }) => {
    return (
      <TouchableOpacity
        onPress={() => {
          // Navigating directly to the player since it's a specific video
          props.navigation.navigate('Track', {
            videoId: item.videoId,
            title: item.title,
            thumbnail: item.thumbnail
          });
        }}>
        <View style={styles.contentCard}>
          <Image
            source={{ uri: item.thumbnail }}
            style={{
              width: 180,
              height: 120,
              borderRadius: 10,
            }}
          />
          <Text style={styles.contentTitle} numberOfLines={2}>{item.title}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView>
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>
              Select issues you are concerned about
            </Text>
            <BrickList
              data={preferences}
              renderItem={prop => {
                return (
                  <TouchableOpacity
                    onPress={() => handleConcernSelection(prop.id)}>
                    <View
                      key={prop.id}
                      style={
                        selectedConcerns.includes(prop.id)
                          ? styles.preferenceItemSelected
                          : styles.preferencesItem
                      }>
                      <Text style={styles.preferenceText}>{prop.name}</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
              columns={3}
              rowHeight={45}></BrickList>
            <Button
              buttonStyle={styles.done_button}
              raised={true}
              type="outline"
              title="Done"
              titleStyle={styles.done}
              onPress={() => {
                props.updateConcerns(selectedConcerns, props.auth.user._id);
                setModalVisible(false);
              }}></Button>
          </View>
        </View>
      </Modal>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.helloText}>Hello !</Text>
            <Text style={styles.nameText}>{props.auth.profile.name}</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              props.navigation.navigate('Profile');
            }}>
            <View style={styles.avatar}>
              <Image
                source={require('../assets/avatar.png')}
                style={{ width: 60, height: 60 }}
              />
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.chatbotContainer}>
          <View style={styles.botContainer}>
            <Image
              source={require('../assets/tink.gif')}
              style={{ width: 180, height: 180 }}
            />
          </View>
          <View></View>
          <View style={styles.botContent}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                marginBottom: 10,
                color: colors.secondary,
              }}>
              I'M TINK
            </Text>
            <TouchableOpacity
              onPress={() => {
                props.navigation.navigate('Chat', {
                  name: 'Eva Gupta',
                });
              }}>
              <View style={styles.button}>
                <View style={styles.button}>
                  <Text
                    style={{
                      color: colors.white,
                      fontSize: 16,
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                    }}>
                    Let's talk
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        <View>
          <TouchableOpacity
            onPress={() => {
              props.navigation.navigate('CreateMeme');
            }}>
            <View style={styles.createMemeContainer}>
              <Text style={styles.createMemeText}>Create a Meme</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.quoteContainer}>
          <Text style={styles.quoteText}>Quote of the day</Text>
          <View style={styles.quote}>
            <Text style={{ fontSize: 17 }}>
              Be yourself no matter what they say!
            </Text>
          </View>
        </View>
        <View style={styles.tracksContainer}>
          <Text style={styles.trackTitle}>Mindful Content</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
            {contentCategories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                style={[styles.chip, selectedCategory === cat.id && styles.chipActive]}>
                <Text style={[styles.chipText, selectedCategory === cat.id && styles.chipTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <FlatList
            renderItem={renderItem}
            data={contentFeed}
            horizontal={true}
            keyExtractor={item => item.videoId}
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 15 }}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const mapStateToProps = state => ({
  auth: state.auth,
  quote: state.quote,
});

export default connect(mapStateToProps, { updateConcerns, fetchQuoteOfTheDay })(
  HomeScreen,
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: colors.primary,
    paddingBottom: 20,
    borderBottomLeftRadius: 120,
    elevation: 10,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    flexDirection: 'column',
    width: Dimensions.get('window').width - 20,
  },

  helloText: {
    fontSize: 20,
    fontWeight: 'bold',
    flexDirection: 'column',
    color: colors.white,
    marginTop: 30,
  },
  nameText: {
    fontSize: 30,
    fontWeight: 'bold',
    flexDirection: 'column',
    color: colors.white,
  },
  avatar: {
    alignSelf: 'flex-end',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    elevation: 10,
    width: 70,
    height: 70,
    borderRadius: 90,
    marginRight: 10,
    marginTop: 20,
    marginLeft: 20,
  },
  chatbotContainer: {
    margin: 10,
    marginTop: 0,
    borderStyle: 'solid',
    borderColor: '#EFEFEF',
    borderRadius: 20,
    borderBottomWidth: 3,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  botContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  botContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: 150,
    height: 40,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  quoteContainer: {
    padding: 10,
    paddingTop: 0,
  },
  quoteText: {
    marginRight: 15,
    fontSize: 18,
    alignSelf: 'flex-end',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  quote: {
    padding: 10,
    width: Dimensions.get('screen').width - 50,
    alignItems: 'center',
    margin: 10,
    borderRadius: 20,
    elevation: 3,
    backgroundColor: '#face4b',
    borderTopRightRadius: 0,
  },
  tracksContainer: {
    marginVertical: 10,
    padding: 10,
    paddingTop: 0,
    paddingLeft: 20,
    position: 'relative',
  },
  trackTitle: {
    fontSize: 18,
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  track: {
    width: 150,
    height: 150,
    margin: 10,
    borderRadius: 10,
    position: 'relative',
  },
  trackContent: {
    width: 150,
    height: 150,
    backgroundColor: 'black',
    borderRadius: 10,
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingLeft: 10,
    paddingBottom: 10,
  },
  trackImage: {
    opacity: 1,
  },
  done: {
    alignSelf: 'center',
    justifyContent: 'center',
    fontSize: 15,
    flex: 1,
    color: colors.black,
  },
  done_button: {
    borderRadius: 90,
    backgroundColor: colors.yellow,
    borderColor: colors.tertiary,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 1,
    width: 120,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  preferencesItem: {
    marginHorizontal: 2,
    borderRadius: 12,
    borderColor: colors.gray3,
    borderWidth: 2,
    elevation: 0,
    backgroundColor: colors.white,
  },
  preferenceItemSelected: {
    marginHorizontal: 2,
    borderRadius: 12,
    borderColor: colors.gray3,
    borderWidth: 2,
    elevation: 0,
    backgroundColor: colors.accent,
  },
  preferenceText: {
    color: colors.primary,
    paddingLeft: 10,
    paddingRight: 10,
    paddingVertical: 5,
  },
  createMemeContainer: {
    width: 150,
    height: 40,
    backgroundColor: colors.secondary,
    borderRadius: 10,
    marginLeft: 20,
    marginBottom: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createMemeText: {
    color: colors.white,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  contentCard: {
    width: 180,
    marginRight: 15,
  },
  contentTitle: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.black,
  },
  chipContainer: {
    marginTop: 10,
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#EFEFEF',
    marginRight: 10,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipText: {
    color: colors.gray1,
    fontWeight: 'bold',
  },
  chipTextActive: {
    color: colors.white,
  }
});
