import { Dimensions, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { extractYouTubeId } from "../../lib/utils/video";

const { width: screenWidth } = Dimensions.get("window");
const contentWidth = screenWidth - 40; // 2 × 20px horizontal padding
const contentHeight = contentWidth * (9 / 16);

interface Props {
  url: string;
}

export function VideoEmbed({ url }: Props) {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;

  return (
    <View style={styles.wrapper}>
      <WebView
        source={{ uri: `https://www.youtube-nocookie.com/embed/${videoId}` }}
        style={styles.webview}
        allowsFullscreenVideo
        javaScriptEnabled
        domStorageEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: contentWidth,
    height: contentHeight,
    borderRadius: 8,
    overflow: "hidden",
  },
  webview: {
    width: contentWidth,
    height: contentHeight,
  },
});
