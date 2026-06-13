import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { toast } from "sonner-native";
import { ExternalLink } from "lucide-react-native";
import { brand, fonts, glass } from "../../lib/theme/brand";
import { useLanguage } from "../../hooks/useLanguage";
import { useAuth } from "../../hooks/useAuth";
import { getGithubStatus, pushToGithub } from "../../lib/github/api";
import { GitHubIcon } from "../ui/icons";

interface PushToGitHubButtonProps {
  getFiles: () => Record<string, string>;
  defaultRepoName: string;
  note?: string;
}

export function PushToGitHubButton({ getFiles, defaultRepoName, note }: PushToGitHubButtonProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [connected, setConnected] = useState<boolean | null>(null);
  const [repoName, setRepoName] = useState(defaultRepoName);
  const [pushing, setPushing] = useState(false);
  const [repoUrl, setRepoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setConnected(false);
      return;
    }
    getGithubStatus()
      .then((status) => setConnected(status.connected))
      .catch(() => setConnected(false));
  }, [user]);

  async function handlePush() {
    setPushing(true);
    setRepoUrl(null);
    try {
      const result = await pushToGithub(getFiles(), repoName, `Update ${repoName} via Fundi3`);
      setRepoUrl(result.repoUrl);
      toast.success(t("learn.pushSuccess"));
    } catch {
      toast.error(t("learn.pushError"));
    } finally {
      setPushing(false);
    }
  }

  if (connected === null) return null;

  if (!connected) {
    return (
      <Pressable onPress={() => router.push("/github-connect")} style={styles.notConnected}>
        <Text style={styles.notConnectedText}>{t("learn.pushNotConnected")}</Text>
      </Pressable>
    );
  }

  const disabled = pushing || !repoName.trim();

  return (
    <View style={{ gap: 8 }}>
      {note && <Text style={styles.note}>{note}</Text>}
      <View style={styles.row}>
        <TextInput
          value={repoName}
          onChangeText={setRepoName}
          placeholderTextColor={brand.dark.muted}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />
        <Pressable onPress={handlePush} disabled={disabled} style={[styles.pushBtn, disabled && styles.disabled]}>
          {pushing ? (
            <ActivityIndicator color={brand.dark.bg} size="small" />
          ) : (
            <GitHubIcon size={14} color={brand.dark.bg} />
          )}
          <Text style={styles.pushBtnText}>{t("learn.pushToGithub")}</Text>
        </Pressable>
      </View>
      {repoUrl && (
        <Pressable onPress={() => Linking.openURL(repoUrl)} style={styles.viewRepo}>
          <Text style={styles.viewRepoText}>{t("learn.pushViewRepo")}</Text>
          <ExternalLink color={brand.green[100]} size={14} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  notConnected: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: brand.dark.border,
    backgroundColor: "rgba(239,159,39,0.06)",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  notConnectedText: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
    color: brand.amber[100],
  },
  note: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
    color: brand.dark.muted,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: glass.surface,
    borderWidth: 1,
    borderColor: glass.border,
    color: brand.white,
    fontFamily: fonts.mono,
    fontSize: 12,
  },
  pushBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: brand.amber[400],
  },
  disabled: {
    opacity: 0.5,
  },
  pushBtnText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: brand.dark.bg,
  },
  viewRepo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
  },
  viewRepoText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: brand.green[100],
  },
});
