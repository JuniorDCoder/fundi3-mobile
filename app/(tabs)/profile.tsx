import { useCallback, useEffect, useState } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import { ArrowLeftRight, Award, Bell, ChevronRight, GraduationCap, Globe, LogOut, Mail, Sparkles, FileBadge, User as UserIcon, Wallet } from "lucide-react-native";
import { Button } from "../../components/ui/Button";
import { GlassCard } from "../../components/ui/GlassCard";
import { SkeletonProfile } from "../../components/ui/Skeleton";
import { Switch } from "../../components/ui/Switch";
import { GitHubIcon } from "../../components/ui/icons";
import { brand, fonts, glass } from "../../lib/theme/brand";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";
import { getUserProfile, saveUserProfile } from "../../lib/certificates/api";
import {
  getNotificationPreferences,
  saveNotificationPreferences,
  type NotificationPreferences,
} from "../../lib/user/api";
import { getGithubStatus, disconnectGithub, type GithubStatus } from "../../lib/github/api";
import { getNotifications } from "../../lib/notifications/api";

const DEFAULT_PREFERENCES: NotificationPreferences = {
  emailCourseCompleted: true,
  emailNewCourse: true,
  emailCertificatePdf: true,
  emailWalletActivity: true,
};

export default function ProfileScreen() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { lang, toggleLanguage, t } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [signingOut, setSigningOut] = useState(false);
  const [loading, setLoading] = useState(true);

  const [displayName, setDisplayName] = useState("");
  const [initialName, setInitialName] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [refreshing, setRefreshing] = useState(false);

  const [githubStatus, setGithubStatus] = useState<GithubStatus | null>(null);
  const [githubBusy, setGithubBusy] = useState(false);

  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const load = useCallback(() => {
    return Promise.all([
      getUserProfile()
        .then((profile) => {
          const name = profile?.displayName ?? "";
          setDisplayName(name);
          setInitialName(name);
        })
        .catch((err) => console.error("[profile] failed to load profile:", err)),
      getNotificationPreferences()
        .then((p) => { if (p) setPrefs(p); })
        .catch((err) => console.error("[profile] failed to load notification preferences:", err)),
      getGithubStatus()
        .then(setGithubStatus)
        .catch((err) => console.error("[profile] failed to load github status:", err)),
      getNotifications()
        .then((res) => setUnreadNotifications(res.unreadCount))
        .catch((err) => console.error("[profile] failed to load notifications:", err)),
    ]);
  }, []);

  useEffect(() => {
    // Wait for the session to be restored before fetching — otherwise the
    // requests fire without a token and the screen settles on empty state.
    if (authLoading) return;
    load().finally(() => setLoading(false));
  }, [authLoading, load]);

  // Refresh GitHub status when returning from the connect screen.
  useFocusEffect(
    useCallback(() => {
      getGithubStatus()
        .then(setGithubStatus)
        .catch((err) => console.error("[profile] failed to refresh github status:", err));
    }, []),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const trimmedName = displayName.trim();
  const isNameValid = trimmedName.length >= 2 && trimmedName.length <= 100;
  const isNameDirty = trimmedName !== initialName;

  const handleSaveName = async () => {
    if (!isNameValid) return;
    setSavingName(true);
    try {
      await saveUserProfile(trimmedName);
      setInitialName(trimmedName);
      toast.success(t("profile.saved"));
    } catch (err) {
      console.error("[profile] failed to save profile:", err);
      toast.error(t("profile.saveError"));
    } finally {
      setSavingName(false);
    }
  };

  const handleTogglePref = async (key: keyof NotificationPreferences, value: boolean) => {
    const previous = prefs;
    setPrefs((p) => ({ ...p, [key]: value }));
    try {
      await saveNotificationPreferences({ [key]: value });
    } catch (err) {
      console.error("[profile] failed to save notification preferences:", err);
      setPrefs(previous);
      toast.error(t("settings.saveError"));
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch {
      // local session is cleared by Supabase even if the network revoke call fails
    } finally {
      router.replace("/");
      setSigningOut(false);
    }
  };

  const handleGithubDisconnect = async () => {
    setGithubBusy(true);
    try {
      await disconnectGithub();
      setGithubStatus({ connected: false, username: null });
      toast.success(t("settings.githubDisconnected"));
    } catch (err) {
      console.error("[profile] failed to disconnect github:", err);
      toast.error(t("settings.githubDisconnectError"));
    } finally {
      setGithubBusy(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={brand.green[400]} />
      }
    >
      <Text style={styles.title}>{t("nav.profile")}</Text>

      {loading ? (
        <SkeletonProfile />
      ) : (
        <>
      <GlassCard style={styles.row}>
        <View style={styles.iconBubble}>
          <Mail color={brand.green[400]} size={18} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowLabel}>{t("auth.email")}</Text>
          <Text style={styles.rowValue}>{user?.email ?? ""}</Text>
        </View>
      </GlassCard>

      <Pressable onPress={() => router.push("/notifications")}>
        <GlassCard style={styles.row}>
          <View style={styles.iconBubble}>
            <Bell color={brand.green[400]} size={18} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowValue}>{t("dashboard.notifications")}</Text>
          </View>
          {unreadNotifications > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadNotifications > 9 ? "9+" : unreadNotifications}</Text>
            </View>
          )}
          <ChevronRight color={brand.dark.muted} size={18} />
        </GlassCard>
      </Pressable>

      <Pressable onPress={() => router.push("/certificates")}>
        <GlassCard style={styles.row}>
          <View style={styles.iconBubbleAmber}>
            <Award color={brand.amber[400]} size={18} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowValue}>{t("dashboard.certificates")}</Text>
          </View>
          <ChevronRight color={brand.dark.muted} size={18} />
        </GlassCard>
      </Pressable>

      <Pressable onPress={() => router.push("/wallet")}>
        <GlassCard style={styles.row}>
          <View style={styles.iconBubble}>
            <Wallet color={brand.green[400]} size={18} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowValue}>{t("dashboard.wallet")}</Text>
          </View>
          <ChevronRight color={brand.dark.muted} size={18} />
        </GlassCard>
      </Pressable>

      {/* Display name editor — used on NFT certificates */}
      <GlassCard style={styles.nameCard}>
        <View style={styles.row}>
          <View style={styles.iconBubble}>
            <UserIcon color={brand.green[400]} size={18} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>{t("profile.displayNameLabel")}</Text>
          </View>
        </View>
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          maxLength={100}
          placeholderTextColor={brand.dark.muted}
          style={styles.nameInput}
        />
        <Text style={styles.hintText}>{t("profile.displayNameHint")}</Text>
        <Button
          label={t("profile.save")}
          onPress={handleSaveName}
          loading={savingName}
          disabled={!isNameValid || !isNameDirty}
          variant="primary"
        />
      </GlassCard>

      {/* Notification preferences */}
      <Text style={styles.sectionTitle}>{t("settings.notificationsTitle")}</Text>

      <GlassCard style={styles.row}>
        <View style={styles.iconBubble}>
          <GraduationCap color={brand.green[400]} size={18} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowValue}>{t("settings.notifCourseCompleted")}</Text>
          <Text style={styles.hintText}>{t("settings.notifCourseCompletedHint")}</Text>
        </View>
        <Switch
          value={prefs.emailCourseCompleted}
          onValueChange={(value) => handleTogglePref("emailCourseCompleted", value)}
        />
      </GlassCard>

      <GlassCard style={styles.row}>
        <View style={styles.iconBubble}>
          <Sparkles color={brand.green[400]} size={18} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowValue}>{t("settings.notifNewCourse")}</Text>
          <Text style={styles.hintText}>{t("settings.notifNewCourseHint")}</Text>
        </View>
        <Switch
          value={prefs.emailNewCourse}
          onValueChange={(value) => handleTogglePref("emailNewCourse", value)}
        />
      </GlassCard>

      <GlassCard style={styles.row}>
        <View style={styles.iconBubble}>
          <FileBadge color={brand.green[400]} size={18} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowValue}>{t("settings.notifCertificatePdf")}</Text>
          <Text style={styles.hintText}>{t("settings.notifCertificatePdfHint")}</Text>
        </View>
        <Switch
          value={prefs.emailCertificatePdf}
          onValueChange={(value) => handleTogglePref("emailCertificatePdf", value)}
        />
      </GlassCard>

      <GlassCard style={styles.row}>
        <View style={styles.iconBubble}>
          <ArrowLeftRight color={brand.green[400]} size={18} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowValue}>{t("settings.notifWalletActivity")}</Text>
          <Text style={styles.hintText}>{t("settings.notifWalletActivityHint")}</Text>
        </View>
        <Switch
          value={prefs.emailWalletActivity}
          onValueChange={(value) => handleTogglePref("emailWalletActivity", value)}
        />
      </GlassCard>

      <GlassCard style={styles.row}>
        <View style={styles.iconBubble}>
          <Globe color={brand.green[400]} size={18} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowLabel}>{t("common.language")}</Text>
          <Text style={styles.rowValue}>{lang === "fr" ? "Français" : "English"}</Text>
        </View>
        <Pressable onPress={toggleLanguage} style={styles.langToggle}>
          <Text style={styles.langToggleText}>{lang === "fr" ? "EN" : "FR"}</Text>
        </Pressable>
      </GlassCard>

      {/* Connected accounts */}
      {githubStatus && (
        <>
          <Text style={styles.sectionTitle}>{t("settings.connectedAccountsTitle")}</Text>
          <GlassCard style={styles.row}>
            <View style={styles.iconBubble}>
              <GitHubIcon size={18} color={brand.green[400]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowValue}>{t("settings.githubTitle")}</Text>
              <Text style={styles.hintText}>
                {githubStatus.connected
                  ? t("settings.githubConnectedAs", { username: githubStatus.username ?? "" })
                  : t("settings.githubHint")}
              </Text>
            </View>
            {githubBusy ? (
              <ActivityIndicator color={brand.green[400]} />
            ) : githubStatus.connected ? (
              <Pressable onPress={handleGithubDisconnect} style={styles.githubDisconnectBtn}>
                <Text style={styles.githubDisconnectBtnText}>{t("settings.githubDisconnect")}</Text>
              </Pressable>
            ) : (
              <Pressable onPress={() => router.push("/github-connect")} style={styles.githubConnectBtn}>
                <Text style={styles.githubConnectBtnText}>{t("settings.githubConnect")}</Text>
              </Pressable>
            )}
          </GlassCard>
        </>
      )}

      <Button
        label={t("common.signOut")}
        variant="ghost"
        onPress={handleSignOut}
        loading={signingOut}
        style={styles.signOutButton}
      />
      <View style={styles.signOutIconRow}>
        <LogOut color={brand.dark.muted} size={14} />
        <Text style={styles.signOutHint}>{t("dashboard.signOut")}</Text>
      </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: brand.dark.bg,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 48,
    gap: 16,
  },
  title: {
    fontFamily: fonts.headingSemibold,
    fontSize: 26,
    color: brand.white,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  iconBubble: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,110,86,0.18)",
  },
  iconBubbleAmber: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,159,39,0.12)",
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: brand.amber[400],
  },
  unreadBadgeText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: brand.dark.bg,
  },
  rowLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: brand.dark.muted,
  },
  rowValue: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: brand.white,
    marginTop: 2,
  },
  sectionTitle: {
    fontFamily: fonts.headingSemibold,
    fontSize: 16,
    color: brand.white,
    marginTop: 8,
  },
  nameCard: {
    gap: 12,
  },
  nameInput: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: glass.surface,
    borderWidth: 1,
    borderColor: glass.border,
    color: brand.white,
    fontFamily: fonts.body,
    fontSize: 15,
  },
  hintText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: brand.dark.muted,
    marginTop: 2,
  },
  langToggle: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  langToggleText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: brand.white,
  },
  githubConnectBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: brand.amber[400],
  },
  githubConnectBtnText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: brand.dark.bg,
  },
  githubDisconnectBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  githubDisconnectBtnText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: brand.white,
  },
  signOutButton: {
    marginTop: 8,
  },
  signOutIconRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  signOutHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: brand.dark.muted,
  },
});
