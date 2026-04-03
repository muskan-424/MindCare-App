import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

const Track = props => {
  const videoId = props.route.params.videoId;
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}&autoplay=1&rel=0&modestbranding=1`;

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: youtubeUrl }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
      />
    </View>
  );
};

export default Track;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Black background for video player
  },
  webview: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
