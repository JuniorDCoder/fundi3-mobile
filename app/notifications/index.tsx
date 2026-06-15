import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import { Award, Bell, ChevronLeft, ArrowDownLeft, ArrowUpRight } from "lucide-react-native";
import { GlassCard } from "../../components/ui/GlassCard";
import { SkeletonNotificationList } from "../../components/ui/Skeleton";
import { brand, fonts } from "../../lib/theme/brand";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";
import { getNotifications, markNotificationsRead, type AppNotification } from "../../lib/notifications/api";

function formatRelativeTime(iso: string, lang: "en" | "fr"): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return lang === "fr" ? "À l'instant" : "Just now";
  if (minutes < 60) return lang === "fr" ? `Il y a ${minutes} min` : `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return lang === "fr" ? `Il y a ${hours} h` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return lang === "fr" ? `Il y a ${days} j` : `${days}d ago`;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, lang } = useLanguage();
  const { user, loading: authLoading } = useAuth();

  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    if (!user) return Promise.resolve();
    return getNotifications()
      .then((res) => setItems(res.notifications))
      .catch(() => toast.error(t("notifications.loadError")));
  }, [user, t]);

  useEffect(() => {
    if (authLoading) return;
    load().finally(() => setLoading(false));
  }, [authLoading, load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleMarkAllRead = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    await markNotificationsRead("all");
  };

  const handlePress = async (item: AppNotification) => {
    if (!item.readAt) {
      setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, readAt: new Date().toISOString() } : n)));
      markNotificationsRead([item.id]).catch(() => {});
    }
    if (item.type === "certificate_minted") {
      router.push("/certificates");
    } else {
      router.push("/wallet");
    }
  };

  const unreadCount = items.filter((n) => !n.readAt).length;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <ChevronLeft size={22} color={brand.dark.muted} />
        </Pressable>
        <Text style={styles.headerTitle}>{t("notifications.title")}</Text>
        {unreadCount > 0 && (
          <Pressable onPress={handleMarkAllRead}>
            <Text style={styles.markAllRead}>{t("notifications.markAllRead")}</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, !loading && items.length === 0 && styles.listEmpty]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={brand.green[400]} />
        }
        ListEmptyComponent={
          loading ? (
            <SkeletonNotificationList />
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Bell size={32} color={brand.green[400]} />
              </View>
              <Text style={styles.emptyTitle}>{t("notifications.empty")}</Text>
              <Text style={styles.emptyBody}>{t("notifications.emptyBody")}</Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const title = lang === "fr" ? item.titleFr : item.titleEn;
          const body = lang === "fr" ? item.bodyFr : item.bodyEn;
          const isReceive = item.type === "wallet_receive";
          const isCertificate = item.type === "certificate_minted";
          const Icon = isCertificate ? Award : isReceive ? ArrowDownLeft : ArrowUpRight;
          const iconColor = isCertificate ? brand.amber[400] : brand.green[400];
          const iconBg = isCertificate ? "rgba(239,159,39,0.12)" : "rgba(15,110,86,0.15)";

          return (
            <Pressable onPress={() => handlePress(item)}>
              <GlassCard style={[styles.row, !item.readAt ? styles.rowUnread : {}]}>
                <View style={[styles.iconBubble, { backgroundColor: iconBg }]}>
                  <Icon size={18} color={iconColor} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {title}
                  </Text>
                  <Text style={styles.rowBody} numberOfLines={2}>
                    {body}
                  </Text>
                  <Text style={styles.rowTime}>{formatRelativeTime(item.createdAt, lang)}</Text>
                </View>
                {!item.readAt && <View style={styles.unreadDot} />}
              </GlassCard>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: brand.dark.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: brand.dark.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  headerTitle: {
    flex: 1,
    fontFamily: fonts.headingSemibold,
    fontSize: 18,
    color: brand.white,
  },
  markAllRead: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: brand.green[400],
  },
  list: {
    padding: 16,
    gap: 10,
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  rowUnread: {
    borderColor: "rgba(29,158,117,0.25)",
    backgroundColor: "rgba(15,110,86,0.05)",
  },
  iconBubble: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: brand.white,
    marginBottom: 2,
  },
  rowBody: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: brand.dark.muted,
    lineHeight: 17,
  },
  rowTime: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: brand.dark.muted,
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: brand.green[400],
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: "rgba(15,110,86,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: fonts.headingSemibold,
    fontSize: 18,
    color: brand.white,
    textAlign: "center",
  },
  emptyBody: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: brand.dark.muted,
    textAlign: "center",
  },
});
