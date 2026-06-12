import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import { Award, ChevronRight, GraduationCap, Globe, LogOut, Mail, Sparkles, FileBadge, User as UserIcon } from "lucide-react-native";
import { Button } from "../../components/ui/Button";
import { GlassCard } from "../../components/ui/GlassCard";
import { Switch } from "../../components/ui/Switch";
import { brand, fonts, glass } from "../../lib/theme/brand";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";
import { getUserProfile, saveUserProfile } from "../../lib/certificates/api";
import {
  getNotificationPreferences,
  saveNotificationPreferences,
  type NotificationPreferences,
} from "../../lib/user/api";

const DEFAULT_PREFERENCES: NotificationPreferences = {
  emailCourseCompleted: true,
  emailNewCourse: true,
  emailCertificatePdf: true,
};

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { lang, toggleLanguage, t } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [signingOut, setSigningOut] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [initialName, setInitialName] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [refreshing, setRefreshing] = useState(false);

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
    ]);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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

      <GlassCard style={styles.row}>
        <View style={styles.iconBubble}>
          <Mail color={brand.green[400]} size={18} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowLabel}>{t("auth.email")}</Text>
          <Text style={styles.rowValue}>{user?.email ?? ""}</Text>
        </View>
      </GlassCard>

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
