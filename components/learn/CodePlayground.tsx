import { Dimensions, Linking, ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { WebView } from "react-native-webview";
import { ExternalLink, CodeXml } from "lucide-react-native";
import { brand, fonts, glass } from "../../lib/theme/brand";
import { useLanguage } from "../../hooks/useLanguage";
import { resolveAssetUrl } from "../../lib/utils/assets";
import { slugify } from "../../lib/utils/slugify";
import type { CodeLanguage } from "../../lib/courses/types";
import { PushToGitHubButton } from "./PushToGitHubButton";
import { Skeleton } from "../ui/Skeleton";

const { width: screenWidth } = Dimensions.get("window");
const contentWidth = screenWidth - 40; // 2 × 20px horizontal padding
const PLAYGROUND_HEIGHT = 500;

const DEFAULT_SOLIDITY_STARTER = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract HelloFundi3 {
    string public message = "Karibu! Welcome to Solidity.";
}
`;

const DEFAULT_RUST_STARTER = `// Karibu! This is a starter for a Solana / Anchor program.
use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111111111111");

#[program]
pub mod hello_fundi3 {
    use super::*;

    pub fn greet(_ctx: Context<Greet>) -> Result<()> {
        msg!("Hello, Fundi3!");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Greet {}
`;

const BASE64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/** UTF-8-safe base64 encoder — no Buffer/btoa needed, works in Hermes. */
function toBase64Utf8(input: string): string {
  const bytes: number[] = [];
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    }
  }

  let result = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i];
    const b2 = bytes[i + 1];
    const b3 = bytes[i + 2];
    const triple = (b1 << 16) | ((b2 ?? 0) << 8) | (b3 ?? 0);
    result += BASE64_CHARS[(triple >> 18) & 0x3f];
    result += BASE64_CHARS[(triple >> 12) & 0x3f];
    result += b2 === undefined ? "=" : BASE64_CHARS[(triple >> 6) & 0x3f];
    result += b3 === undefined ? "=" : BASE64_CHARS[triple & 0x3f];
  }
  return result;
}

/** Shimmer placeholder shown while the embedded code IDE (Remix, playground) loads. */
function PlaygroundLoadingOverlay({ label }: { label: string }) {
  return (
    <View style={styles.loadingOverlay}>
      <Skeleton style={StyleSheet.absoluteFill} />
      <View style={styles.loadingBadge}>
        <CodeXml color={brand.green[400]} size={18} />
      </View>
      <Text style={styles.loadingText}>{label}</Text>
    </View>
  );
}

interface CodePlaygroundProps {
  codeLanguage: CodeLanguage;
  codeStarter: string | null;
  title: string;
}

export function CodePlayground({ codeLanguage, codeStarter, title }: CodePlaygroundProps) {
  const { t } = useLanguage();
  const slug = slugify(title);

  if (codeLanguage === "solidity") {
    const code = codeStarter && codeStarter.trim() ? codeStarter : DEFAULT_SOLIDITY_STARTER;
    const encoded = encodeURIComponent(toBase64Utf8(code));
    const uri = `https://remix.ethereum.org/?#code=${encoded}&embed=true`;

    return (
      <View style={{ gap: 12 }}>
        <View style={styles.wrapper}>
          <WebView
            source={{ uri }}
            style={styles.webview}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            renderLoading={() => <PlaygroundLoadingOverlay label={t("learn.remixLoading")} />}
          />
        </View>
        <PushToGitHubButton
          getFiles={() => ({ [`contracts/${slug}.sol`]: code })}
          defaultRepoName={slug}
          note={t("learn.pushSolidityNote")}
        />
      </View>
    );
  }

  if (codeLanguage === "rust") {
    const code = codeStarter && codeStarter.trim() ? codeStarter : DEFAULT_RUST_STARTER;
    return (
      <View style={{ gap: 12 }}>
        <ScrollView
          horizontal
          style={styles.codeBlock}
          contentContainerStyle={{ padding: 14 }}
        >
          <Text style={styles.codeText}>{code}</Text>
        </ScrollView>
        <Text style={styles.rustNote}>{t("learn.codePlaygroundRustNote")}</Text>
        <Pressable
          onPress={() => Linking.openURL("https://beta.solpg.io")}
          style={styles.linkButton}
        >
          <Text style={styles.linkButtonText}>{t("learn.openSolanaPlayground")}</Text>
          <ExternalLink color={brand.green[100]} size={14} />
        </Pressable>
        <PushToGitHubButton
          getFiles={() => ({ [`programs/${slug}/src/lib.rs`]: code })}
          defaultRepoName={slug}
          note={t("learn.pushRustNote")}
        />
      </View>
    );
  }

  const defaultStarter = codeLanguage === "typescript"
    ? `// Karibu! Write your TypeScript here.\nconst message: string = "Hello, Fundi3!";\nconsole.log(message);\n`
    : `// Karibu! Write your JavaScript here.\nconsole.log("Hello, Fundi3!");\n`;
  const code = codeStarter && codeStarter.trim() ? codeStarter : defaultStarter;
  const entryFile = codeLanguage === "typescript" ? "index.ts" : "index.js";

  const params = new URLSearchParams({
    lang: codeLanguage,
    starter: encodeURIComponent(toBase64Utf8(code)),
    title: encodeURIComponent(title),
  });
  const uri = resolveAssetUrl(`/embed/playground?${params.toString()}`);

  return (
    <View style={{ gap: 12 }}>
      <View style={styles.wrapper}>
        <WebView source={{ uri }} style={styles.webview} javaScriptEnabled domStorageEnabled />
      </View>
      <PushToGitHubButton getFiles={() => ({ [entryFile]: code })} defaultRepoName={slug} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: contentWidth,
    height: PLAYGROUND_HEIGHT,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: brand.dark.border,
  },
  webview: {
    width: contentWidth,
    height: PLAYGROUND_HEIGHT,
    backgroundColor: brand.dark.bg,
  },
  loadingOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: brand.dark.bg,
  },
  loadingBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(29,158,117,0.12)",
  },
  loadingText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: brand.white,
    opacity: 0.75,
  },
  codeBlock: {
    maxHeight: 320,
    borderRadius: 16,
    backgroundColor: glass.surface,
    borderWidth: 1,
    borderColor: glass.border,
  },
  codeText: {
    fontFamily: fonts.mono,
    fontSize: 12,
    lineHeight: 18,
    color: brand.white,
  },
  rustNote: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 20,
    color: brand.dark.muted,
  },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: brand.dark.border,
  },
  linkButtonText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: brand.green[100],
  },
});
