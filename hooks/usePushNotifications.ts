import { useEffect } from "react";
import { Platform } from "react-native";
import Constants, { AppOwnership } from "expo-constants";
import { savePushToken } from "../lib/notifications/api";

/**
 * Registers the device for Expo push notifications and saves the token to
 * the backend. No-ops in Expo Go — Android remote notifications were removed
 * from Expo Go in SDK 53, and importing expo-notifications there throws — as
 * well as on simulators/web or if no EAS project is configured. Push is a
 * best-effort enhancement, never a requirement.
 */
export function usePushNotifications(userId: string | null) {
  useEffect(() => {
    if (!userId) return;
    if (Constants.appOwnership === AppOwnership.Expo) return;

    let cancelled = false;

    async function register() {
      try {
        const [Device, Notifications] = await Promise.all([
          import("expo-device"),
          import("expo-notifications"),
        ]);

        if (!Device.isDevice) return;

        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldPlaySound: false,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });

        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: Notifications.AndroidImportance.DEFAULT,
          });
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== "granted") return;

        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        if (!projectId) return;

        const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
        if (cancelled || !token) return;

        await savePushToken(token);
      } catch (err) {
        console.warn("[usePushNotifications] registration failed:", err);
      }
    }

    register();

    return () => {
      cancelled = true;
    };
  }, [userId]);
}
