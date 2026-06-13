import { Dimensions, Image } from "react-native";
import Markdown, { RenderRules } from "react-native-markdown-display";
import { SvgUri } from "react-native-svg";
import { brand, fonts } from "../../lib/theme/brand";
import { resolveAssetUrl, isSvgUrl } from "../../lib/utils/assets";

const { width: screenWidth } = Dimensions.get("window");
const contentWidth = screenWidth - 40; // 2 × 20px horizontal padding

const markdownStyles = {
  body: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 24,
    color: brand.white,
    backgroundColor: "transparent",
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 12,
  },
  heading1: {
    fontFamily: fonts.headingSemibold,
    fontSize: 22,
    color: brand.white,
    marginTop: 20,
    marginBottom: 8,
  },
  heading2: {
    fontFamily: fonts.headingSemibold,
    fontSize: 19,
    color: brand.white,
    marginTop: 16,
    marginBottom: 6,
  },
  heading3: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    color: brand.green[100],
    marginTop: 12,
    marginBottom: 4,
  },
  strong: {
    fontFamily: fonts.bodyMedium,
    color: brand.white,
  },
  em: {
    fontStyle: "italic" as const,
    color: brand.white,
  },
  // Inline code
  code_inline: {
    fontFamily: fonts.mono,
    fontSize: 13,
    color: brand.green[100],
    backgroundColor: brand.dark.surface,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  // Fenced code blocks
  fence: {
    fontFamily: fonts.mono,
    fontSize: 13,
    lineHeight: 20,
    color: brand.green[100],
    backgroundColor: brand.dark.surface,
    borderRadius: 8,
    padding: 14,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: brand.dark.border,
  },
  code_block: {
    fontFamily: fonts.mono,
    fontSize: 13,
    lineHeight: 20,
    color: brand.green[100],
    backgroundColor: brand.dark.surface,
    borderRadius: 8,
    padding: 14,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: brand.dark.border,
  },
  blockquote: {
    backgroundColor: "rgba(15,110,86,0.12)",
    borderLeftWidth: 3,
    borderLeftColor: brand.green[400],
    paddingLeft: 12,
    paddingVertical: 6,
    marginVertical: 8,
    borderRadius: 4,
  },
  bullet_list: { marginBottom: 8 },
  ordered_list: { marginBottom: 8 },
  list_item: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: brand.white,
    lineHeight: 24,
  },
  bullet_list_icon: {
    color: brand.green[400],
    marginTop: 6,
  },
  ordered_list_icon: {
    fontFamily: fonts.bodyMedium,
    color: brand.amber[400],
  },
  hr: {
    backgroundColor: brand.dark.border,
    height: 1,
    marginVertical: 16,
  },
  link: {
    color: brand.green[400],
    textDecorationLine: "underline" as const,
  },
  // Images — fill content width, 16:9 default aspect ratio
  image: {
    width: contentWidth,
    height: contentWidth * (9 / 16),
    borderRadius: 8,
    marginVertical: 10,
    resizeMode: "contain" as const,
    alignSelf: "center" as const,
  },
  table: {
    borderWidth: 1,
    borderColor: brand.dark.border,
    borderRadius: 8,
    marginVertical: 10,
    overflow: "hidden" as const,
  },
  thead: {
    backgroundColor: brand.dark.surface,
  },
  th: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: brand.white,
    padding: 10,
  },
  td: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: brand.white,
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: brand.dark.border,
  },
};

const imageRules: RenderRules = {
  image: (node) => {
    const resolved = resolveAssetUrl(node.attributes.src);
    const imageHeight = contentWidth * (9 / 16);

    if (isSvgUrl(resolved)) {
      return (
        <SvgUri
          key={node.key}
          uri={resolved}
          width={contentWidth}
          height={imageHeight}
          style={{ marginVertical: 10, alignSelf: "center" }}
        />
      );
    }

    return (
      <Image
        key={node.key}
        source={{ uri: resolved }}
        style={{
          width: contentWidth,
          height: imageHeight,
          borderRadius: 8,
          marginVertical: 10,
        }}
        resizeMode="contain"
      />
    );
  },
};

interface Props {
  content: string | null | undefined;
}

export function LessonMarkdown({ content }: Props) {
  return (
    <Markdown rules={imageRules} style={markdownStyles}>
      {content ?? ""}
    </Markdown>
  );
}
