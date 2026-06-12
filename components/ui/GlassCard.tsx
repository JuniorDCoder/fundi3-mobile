import { type PropsWithChildren } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { glass } from "../../lib/theme/brand";

// Mirrors the web's GlassCard utility (bg-white/5, backdrop-blur, border-white/10).
// React Native has no backdrop-blur on Android, so we approximate the
// glassmorphism look with a translucent surface + soft border.
interface GlassCardProps extends PropsWithChildren {
  style?: ViewStyle | ViewStyle[];
}

export function GlassCard({ children, style }: GlassCardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: glass.surface,
    borderWidth: 1,
    borderColor: glass.border,
    borderRadius: 16,
    padding: 20,
  },
});
